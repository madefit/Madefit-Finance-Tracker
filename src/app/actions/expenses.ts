"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function deleteBusinessExpense(expenseId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase not configured." };

  const { error } = await supabase.from("business_expenses").delete().eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
