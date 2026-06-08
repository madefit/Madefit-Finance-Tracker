import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { getDashboardData } from "@/lib/data";

export default async function Home() {
  const data = await getDashboardData();
  if (!data.employee) {
    redirect("/auth/login");
  }
  return <DashboardShell initialData={data} />;
}
