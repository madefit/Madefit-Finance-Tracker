import { endOfMonth, format, startOfMonth, subDays } from "date-fns";

import type { BusinessExpense, DailyReport, DashboardData, Employee, NotificationRecipient } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

type DailyReportRow = DailyReport & {
  employees?: Pick<Employee, "full_name"> | null;
  daily_expenses?: DailyReport["daily_expenses"];
  bank_deposits?: DailyReport["bank_deposits"];
};

export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", auth.user.id)
    .eq("is_active", true)
    .single();

  return data as Employee | null;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const employee = await getCurrentEmployee();

  if (!supabase || !employee) {
    return {
      employee: null,
      employees: [],
      todayReport: null,
      previousClosingBalance: 0,
      reports: [],
      businessExpenses: [],
      notifications: [],
      allTimeStats: { totalSales: 0, totalBusinessExpenses: 0 },
    };
  }

  const date = todayISO();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const previousDay = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const [employeesResult, todayReportResult, reportsResult, businessExpenseResult, notificationResult, previousResult, allSalesResult, allBizExpensesResult] =
    await Promise.all([
      employee.role === "admin"
        ? supabase.from("employees").select("*").order("full_name")
        : Promise.resolve({ data: [employee], error: null }),
      supabase
        .from("daily_reports")
        .select("*, employees(full_name), daily_expenses(*), bank_deposits(*)")
        .eq("report_date", date)
        .maybeSingle(),
      supabase
        .from("daily_reports")
        .select("*, employees(full_name), daily_expenses(*), bank_deposits(*)")
        .gte("report_date", monthStart)
        .lte("report_date", monthEnd)
        .order("report_date", { ascending: false }),
      supabase
        .from("business_expenses")
        .select("*")
        .gte("expense_date", monthStart)
        .lte("expense_date", monthEnd)
        .order("expense_date", { ascending: false }),
      employee.role === "admin"
        ? supabase.from("notifications").select("*").order("recipient_name")
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("daily_reports")
        .select("closing_balance")
        .lte("report_date", previousDay)
        .eq("status", "submitted")
        .order("report_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      employee.role === "admin"
        ? supabase.from("daily_reports").select("total_sales")
        : Promise.resolve({ data: [], error: null }),
      employee.role === "admin"
        ? supabase.from("business_expenses").select("amount")
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (employeesResult.error || todayReportResult.error || reportsResult.error) {
    console.error("Dashboard query failed", employeesResult.error ?? todayReportResult.error ?? reportsResult.error);
  }

  const mapReport = (report: DailyReportRow): DailyReport => ({
    ...report,
    submitted_by_name: report.employees?.full_name ?? "Unknown",
  });

  return {
    employee,
    employees: (employeesResult.data ?? []) as Employee[],
    todayReport: todayReportResult.data ? mapReport(todayReportResult.data as DailyReportRow) : null,
    previousClosingBalance: Number(previousResult.data?.closing_balance ?? 0),
    reports: ((reportsResult.data ?? []) as DailyReportRow[]).map(mapReport),
    businessExpenses: (businessExpenseResult.data ?? []) as BusinessExpense[],
    notifications: (notificationResult.data ?? []) as NotificationRecipient[],
    allTimeStats: {
      totalSales: (allSalesResult.data ?? []).reduce((sum: number, r: any) => sum + Number(r.total_sales || 0), 0),
      totalBusinessExpenses: (allBizExpensesResult.data ?? []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0),
    },
  };
}
