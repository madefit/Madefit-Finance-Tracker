import { NextResponse } from "next/server";
import { sendDailyReportNotifications } from "@/lib/notifications/send";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DailyReport, NotificationRecipient } from "@/lib/types";

const mockReport: DailyReport = {
  id: "mock-id",
  report_date: new Date().toISOString().split("T")[0],
  employee_id: "mock-emp",
  opening_balance: 0,
  total_sales: 0,
  total_daily_expenses: 0,
  available_cash: 0,
  total_bank_deposits: 0,
  total_gpay: 0,
  cash_given_to_owner: 0,
  cash_given_to_staff: 0,
  cash_in_shop: 0,
  closing_balance: 0,
  status: "submitted",
  submitted_at: new Date().toISOString(),
  submitted_by_name: "Mock User",
  daily_expenses: [],
  bank_deposits: [],
  gpay_transactions: [],
};

const mockNotifications: NotificationRecipient[] = [];

export async function POST() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const results = await sendDailyReportNotifications(mockReport, mockNotifications);
    return NextResponse.json({ ok: true, results });
  }

  const [{ data: report }, { data: recipients }] = await Promise.all([
    supabase.from("daily_reports").select("*, daily_expenses(*), bank_deposits(*)").order("report_date", { ascending: false }).limit(1).single(),
    supabase.from("notifications").select("*").eq("is_active", true),
  ]);

  const reportToUse = report || mockReport;
  const results = await sendDailyReportNotifications(reportToUse as DailyReport, (recipients ?? []) as NotificationRecipient[]);
  return NextResponse.json({ ok: true, results });
}
