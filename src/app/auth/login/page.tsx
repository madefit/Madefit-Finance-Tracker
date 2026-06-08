import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  async function login(formData: FormData) {
    "use server";

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase is not configured.");

    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>MadeFit Finance Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <Label>Password</Label>
              <Input name="password" type="password" required autoComplete="current-password" />
            </div>
            <LoginError searchParams={searchParams} />
            <Button className="w-full">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

async function LoginError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!params.error) return null;
  return <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{params.error}</div>;
}
