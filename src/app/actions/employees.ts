"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createEmployeeSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["admin", "employee"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function createEmployee(formData: FormData) {
  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return { error: "Admin mode not configured. Add SUPABASE_SERVICE_ROLE_KEY to environment." };
  }

  const parsed = createEmployeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (authError) {
    return { error: `Auth Error: ${authError.message}` };
  }

  const authUserId = authData.user.id;

  // 2. Insert into public.employees
  const { error: dbError } = await adminClient.from("employees").insert({
    auth_user_id: authUserId,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone || null,
    role: data.role,
    is_active: true,
  });

  if (dbError) {
    // Attempt rollback of auth user if DB insert fails
    await adminClient.auth.admin.deleteUser(authUserId);
    return { error: `Database Error: ${dbError.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  
  return { success: "Employee created successfully!" };
}

const updateEmployeeSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["admin", "employee"]),
  is_active: z.enum(["true", "false"]).transform((val) => val === "true"),
  password: z.string().optional(),
});

export async function updateEmployee(formData: FormData) {
  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return { error: "Admin mode not configured." };
  }

  const parsed = updateEmployeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  const { data: employee, error: fetchError } = await adminClient
    .from("employees")
    .select("auth_user_id")
    .eq("id", data.id)
    .single();

  if (fetchError || !employee?.auth_user_id) {
    return { error: "Employee not found." };
  }

  const authUpdates: Record<string, unknown> = { email: data.email };
  if (data.password && data.password.length >= 6) {
    authUpdates.password = data.password;
  }

  const { error: authError } = await adminClient.auth.admin.updateUserById(employee.auth_user_id, authUpdates);

  if (authError) {
    return { error: `Auth Error: ${authError.message}` };
  }

  const { error: dbError } = await adminClient
    .from("employees")
    .update({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (dbError) {
    return { error: `Database Error: ${dbError.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  
  return { success: "Employee updated successfully!" };
}
