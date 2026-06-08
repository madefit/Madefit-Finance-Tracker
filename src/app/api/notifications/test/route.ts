import { NextResponse } from "next/server";
import { sampleNotifications, sampleReports } from "@/lib/sample-data";
import { sendDailyReportNotifications } from "@/lib/notifications/send";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DailyReport, NotificationRecipient } from "@/lib/types";

export async function POST() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const results = await sendDailyReportNotifications(sampleReports[0], sampleNotifications);
    return NextResponse.json({ ok: true, results });
  }

  const [{ data: report }, { data: recipients }] = await Promise.all([
    supabase.from("daily_reports").select("*, daily_expenses(*), bank_deposits(*)").order("report_date", { ascending: false }).limit(1).single(),
    supabase.from("notifications").select("*").eq("is_active", true),
  ]);

  const reportToUse = report || sampleReports[0];
  const results = await sendDailyReportNotifications(reportToUse as DailyReport, (recipients ?? []) as NotificationRecipient[]);
  return NextResponse.json({ ok: true, results });
}
