"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardCheck, LogOut, ReceiptText, Settings, Wallet } from "lucide-react";
import { AdminInsights } from "@/components/dashboard/admin-insights";
import { ReportsModule } from "@/components/dashboard/reports-module";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { EmployeeClosingForm } from "@/components/forms/employee-closing-form";
import { BusinessExpenseForm } from "@/components/forms/business-expense-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, inr } from "@/lib/utils";

type Tab = "closing" | "insights" | "reports" | "expenses" | "settings";

export function DashboardShell({ initialData }: { initialData: DashboardData }) {
  const [active, setActive] = useState<Tab>("closing");
  const [data] = useState(initialData);
  const isAdmin = data.employee?.role === "admin";

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("madefit-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_reports" }, () => window.location.reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "business_expenses" }, () => window.location.reload())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const visibleTabs = useMemo(
    () =>
      [
        { id: "closing" as const, label: "Close", icon: ClipboardCheck, adminOnly: false },
        { id: "insights" as const, label: "Insights", icon: BarChart3, adminOnly: true },
        { id: "reports" as const, label: "Reports", icon: ReceiptText, adminOnly: true },
        { id: "expenses" as const, label: "Business Dashboard", icon: Wallet, adminOnly: true },
        { id: "settings" as const, label: "Settings", icon: Settings, adminOnly: true },
      ].filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin],
  );

  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-950 flex flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-black text-white shadow-sm">MF</div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">MadeFit Finance</h1>
                <p className="truncate text-sm font-medium text-slate-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {data.employee?.full_name ?? "Not signed in"} · <span className="text-emerald-700">Opening {inr(data.previousClosingBalance)}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={isAdmin ? "blue" : "green"} className="hidden sm:inline-flex">{data.employee?.role ?? "demo"}</Badge>
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-full bg-white shadow-sm hover:bg-slate-50"
              aria-label="Log out"
              onClick={() => {
                const supabase = createSupabaseBrowserClient();
                if (supabase) {
                  supabase.auth.signOut().then(() => window.location.reload());
                }
              }}
            >
              <LogOut className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6 hide-scrollbar">
          {visibleTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={active === tab.id ? "primary" : "secondary"}
              size="sm"
              className={cn("shrink-0 rounded-full px-4 font-medium transition-all", active === tab.id ? "shadow-md" : "bg-slate-100 hover:bg-slate-200 text-slate-700")}
              onClick={() => setActive(tab.id)}
            >
              <tab.icon className={cn("mr-2 h-4 w-4", active === tab.id ? "text-emerald-100" : "text-slate-500")} />
              {tab.label}
            </Button>
          ))}
        </nav>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8 space-y-6 flex-1 pb-32 lg:pb-12">
        {active === "closing" && <EmployeeClosingForm employee={data.employee} expectedOpeningBalance={data.previousClosingBalance} />}
        {active === "insights" && isAdmin && <AdminInsights reports={data.reports} businessExpenses={data.businessExpenses} />}
        {active === "reports" && isAdmin && <ReportsModule reports={data.reports} />}
        {active === "expenses" && isAdmin && <BusinessExpenseForm expenses={data.businessExpenses} reports={data.reports} allTimeStats={data.allTimeStats} />}
        {active === "settings" && isAdmin && <SettingsPanel employees={data.employees} notifications={data.notifications} />}
      </div>
    </main>
  );
}
