import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateCash } from "@/lib/utils";
import { sendDailyReportNotifications } from "@/lib/notifications/send";
import type { DailyReport, NotificationRecipient } from "@/lib/types";

const schema = z.object({
  report_date: z.string(),
  employee_id: z.string(),
  opening_balance: z.number(),
  actual_cash_count: z.number(),
  verification_reason: z.string().optional(),
  total_sales: z.number(),
  daily_expenses: z.array(z.object({ category: z.string(), description: z.string(), amount: z.number() })),
  bank_deposits: z.array(z.object({ bank_name: z.string(), amount: z.number() })),
  gpay_transactions: z.array(z.object({ customer_name: z.string(), amount: z.number() })),
  cash_given_to_owner: z.number(),
  cash_given_to_staff: z.number(),
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const totalDailyExpenses = payload.daily_expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBankDeposits = payload.bank_deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
  const totalGpay = payload.gpay_transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  
  const calculated = calculateCash({
    openingBalance: payload.opening_balance,
    totalSales: payload.total_sales,
    dailyExpenses: totalDailyExpenses,
    bankDeposits: totalBankDeposits,
    gpayCollections: totalGpay,
    ownerCash: payload.cash_given_to_owner,
    staffCash: payload.cash_given_to_staff,
  });

  if (calculated.cashInShop < 0) {
    return NextResponse.json({ ok: false, message: "Allocation exceeds available cash." }, { status: 422 });
  }

  const difference = payload.actual_cash_count - payload.opening_balance;
  if (difference !== 0 && !payload.verification_reason?.trim()) {
    return NextResponse.json({ ok: false, message: "Reason is required for shortage or excess." }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, message: "Demo mode: report validated. Add Supabase env vars to persist and notify." });
  }

  const { data: report, error } = await supabase
    .from("daily_reports")
    .insert({
      report_date: payload.report_date,
      employee_id: payload.employee_id,
      opening_balance: payload.opening_balance,
      total_sales: payload.total_sales,
      total_daily_expenses: totalDailyExpenses,
      available_cash: calculated.availableCash,
      total_bank_deposits: totalBankDeposits,
      total_gpay: totalGpay,
      cash_given_to_owner: payload.cash_given_to_owner,
      cash_given_to_staff: payload.cash_given_to_staff,
      cash_in_shop: calculated.cashInShop,
      closing_balance: calculated.cashInShop,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 400 });

  await supabase.from("cash_verifications").insert({
    employee_id: payload.employee_id,
    verification_date: payload.report_date,
    expected_opening_balance: payload.opening_balance,
    actual_cash_count: payload.actual_cash_count,
    difference_amount: difference,
    status: difference === 0 ? "balanced" : difference < 0 ? "shortage" : "excess",
    reason: payload.verification_reason || null,
  });

  if (payload.daily_expenses.length) {
    await supabase.from("daily_expenses").insert(payload.daily_expenses.map((expense) => ({ ...expense, report_id: report.id })));
  }

  if (payload.bank_deposits.length) {
    await supabase.from("bank_deposits").insert(payload.bank_deposits.map((deposit) => ({ ...deposit, report_id: report.id })));
  }

  if (payload.gpay_transactions.length) {
    await supabase.from("gpay_transactions").insert(payload.gpay_transactions.map((transaction) => ({ ...transaction, report_id: report.id })));
  }

  await supabase.from("audit_logs").insert({
    actor_employee_id: payload.employee_id,
    action: "daily_report_submitted",
    entity_table: "daily_reports",
    entity_id: report.id,
    metadata: { report_date: payload.report_date, available_cash: calculated.availableCash },
  });

  const { data: recipients } = await supabase.from("notifications").select("*").eq("is_active", true);
  await sendDailyReportNotifications(report as DailyReport, (recipients ?? []) as NotificationRecipient[]);

  return NextResponse.json({ ok: true, message: "Daily report submitted and notifications processed." });
}
