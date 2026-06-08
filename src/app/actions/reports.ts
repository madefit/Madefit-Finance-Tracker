"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function deleteReport(reportId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase not configured." };

  const { error } = await supabase.from("daily_reports").delete().eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
