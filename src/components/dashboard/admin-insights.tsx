"use client";

import { Banknote, BriefcaseBusiness, CircleDollarSign, HandCoins, Landmark, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import type { BusinessExpense, DailyReport } from "@/lib/types";
import { inr } from "@/lib/utils";

export function AdminInsights({ reports, businessExpenses }: { reports: DailyReport[]; businessExpenses: BusinessExpense[] }) {
  const today = reports[0] ?? null;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Opening Balance" value={inr(today?.opening_balance ?? 0)} icon={WalletCards} tone="slate" />
        <StatCard label="Sales" value={inr(today?.total_sales ?? 0)} icon={TrendingUp} tone="emerald" />
        <StatCard label="Daily Expenses" value={inr(today?.total_daily_expenses ?? 0)} icon={ReceiptText} tone="rose" />
        <StatCard label="Net Cash Generated" value={inr((today?.total_sales ?? 0) - (today?.total_daily_expenses ?? 0))} icon={CircleDollarSign} tone="sky" />

        <StatCard label="Cash To Owner" value={inr(today?.cash_given_to_owner ?? 0)} icon={HandCoins} tone="amber" />
        <StatCard label="Cash To Staff" value={inr(today?.cash_given_to_staff ?? 0)} icon={BriefcaseBusiness} tone="slate" />
        <StatCard label="Closing Balance" value={inr(today?.closing_balance ?? 0)} icon={Banknote} tone="emerald" />
      </section>
    </div>
  );
}
