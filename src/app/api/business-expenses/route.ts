import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  expense_date: z.string(),
  category: z.string(),
  description: z.string(),
  amount: z.coerce.number().nonnegative(),
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: true, message: "Demo mode: business expense validated." });

  const { error } = await supabase.from("business_expenses").insert(payload);
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, message: "Business expense saved." });
}
