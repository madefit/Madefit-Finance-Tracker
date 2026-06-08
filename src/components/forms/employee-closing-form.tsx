"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Banknote, CheckCircle2, CircleAlert, Plus, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Employee } from "@/lib/types";
import { calculateCash, dailyExpenseCategories, inr, todayISO } from "@/lib/utils";

type Line = { id: string; category: string; description: string; amount: number };

export function EmployeeClosingForm({
  employee,
  expectedOpeningBalance,
}: {
  employee: Employee | null;
  expectedOpeningBalance: number;
}) {
  const [actualCash, setActualCash] = useState(expectedOpeningBalance);
  const [reason, setReason] = useState("");
  const [sales, setSales] = useState(0);
  const [expenses, setExpenses] = useState<Line[]>([
    { id: crypto.randomUUID(), category: "Tea & Refreshments", description: "", amount: 0 },
  ]);
  const [gpayTransactions, setGpayTransactions] = useState([{ id: crypto.randomUUID(), customer_name: "", amount: 0 }]);
  const [ownerCash, setOwnerCash] = useState(0);
  const [staffCash, setStaffCash] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load drafted state from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`draft_closing_${todayISO()}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.gpayTransactions) setGpayTransactions(parsed.gpayTransactions);
        if (parsed.ownerCash) setOwnerCash(parsed.ownerCash);
        if (parsed.staffCash) setStaffCash(parsed.staffCash);
        if (parsed.actualCash) setActualCash(parsed.actualCash);
      }
    } catch (e) {
      console.error("Failed to load draft closing data", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`draft_closing_${todayISO()}`, JSON.stringify({
      expenses, sales, gpayTransactions, ownerCash, staffCash, actualCash
    }));
  }, [expenses, sales, gpayTransactions, ownerCash, staffCash, actualCash]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const totalGpay = gpayTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const calculated = useMemo(
    () =>
      calculateCash({
        openingBalance: expectedOpeningBalance,
        totalSales: sales,
        dailyExpenses: totalExpenses,
        bankDeposits: 0,
        gpayCollections: totalGpay,
        ownerCash,
        staffCash,
      }),
    [expectedOpeningBalance, ownerCash, sales, staffCash, totalExpenses, totalGpay],
  );

  const difference = actualCash - expectedOpeningBalance;
  const verificationStatus = difference === 0 ? "balanced" : difference < 0 ? "shortage" : "excess";
  const canSubmit = employee && calculated.cashInShop >= 0 && (difference === 0 || reason.trim().length >= 3);

  function updateExpense(id: string, patch: Partial<Line>) {
    setExpenses((current) => current.map((expense) => (expense.id === id ? { ...expense, ...patch } : expense)));
  }

  function updateGpay(id: string, patch: Partial<{ customer_name: string; amount: number }>) {
    setGpayTransactions((current) => current.map((transaction) => (transaction.id === id ? { ...transaction, ...patch } : transaction)));
  }

  function submitReport() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_date: todayISO(),
          employee_id: employee?.id,
          opening_balance: expectedOpeningBalance,
          actual_cash_count: actualCash,
          verification_reason: reason,
          total_sales: sales,
          daily_expenses: expenses.filter((expense) => expense.amount > 0),
          bank_deposits: [],
          gpay_transactions: gpayTransactions.filter((transaction) => transaction.amount > 0),
          cash_given_to_owner: ownerCash,
          cash_given_to_staff: staffCash,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; message: string };
      setMessage(payload.message);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-800">Daily Sales & Collections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-slate-600 font-semibold">Total Cash Sales (Shop)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={sales || ""}
                onChange={(e) => setSales(Number(e.target.value))}
                className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500"
              />
            </div>

          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg text-slate-800">Daily Expenses</CardTitle>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-semibold">{inr(totalExpenses)}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {expenses.map((line, index) => (
              <div key={line.id} className="grid gap-2 sm:grid-cols-[1.5fr_1.5fr_1fr_auto] items-start p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Category</Label>
                  <Select
                    value={line.category}
                    onChange={(e) => {
                      const newLines = [...expenses];
                      newLines[index].category = e.target.value;
                      setExpenses(newLines);
                    }}
                    className="border-slate-200 focus-visible:ring-emerald-500"
                  >
                    {dailyExpenseCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Description</Label>
                  <Input
                    placeholder="Details..."
                    value={line.description}
                    onChange={(e) => {
                      const newLines = [...expenses];
                      newLines[index].description = e.target.value;
                      setExpenses(newLines);
                    }}
                    className="border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="₹"
                    value={line.amount || ""}
                    onChange={(e) => {
                      const newLines = [...expenses];
                      newLines[index].amount = Number(e.target.value);
                      setExpenses(newLines);
                    }}
                    className="border-slate-200 focus-visible:ring-emerald-500 font-medium"
                  />
                </div>
                <div className="pt-[22px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setExpenses(expenses.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setExpenses([...expenses, { id: crypto.randomUUID(), category: "Tea & Refreshments", description: "", amount: 0 }])} className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 mt-2">
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg text-slate-800">GPay Collections</CardTitle>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-semibold">{inr(totalGpay)}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-3">
              {gpayTransactions.map((transaction) => (
                <div key={transaction.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_140px_auto] items-center">
                  <Input className="bg-white border-slate-200 focus-visible:ring-emerald-500" value={transaction.customer_name} onChange={(event) => updateGpay(transaction.id, { customer_name: event.target.value })} placeholder="Customer name or ref" />
                  <Input className="bg-white border-slate-200 focus-visible:ring-emerald-500 font-medium" type="number" min="0" step="0.01" value={transaction.amount || ""} onChange={(event) => updateGpay(transaction.id, { amount: Number(event.target.value) })} placeholder="Amount" />
                  <Button variant="ghost" size="icon" aria-label="Remove GPay transaction" className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => setGpayTransactions((items) => items.filter((item) => item.id !== transaction.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setGpayTransactions((items) => [...items, { id: crypto.randomUUID(), customer_name: "", amount: 0 }])}>
                <Plus className="mr-2 h-4 w-4" />
                Add GPay Transaction
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
              <Banknote className="h-5 w-5 text-emerald-600" />
              Morning Cash Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 pt-6">
            <div>
              <Label className="text-slate-600 font-semibold">Expected Opening</Label>
              <div className="mt-1.5 rounded-md bg-slate-100 px-3 py-3 font-bold text-slate-900 border border-slate-200">
                {inr(expectedOpeningBalance)}
              </div>
            </div>
            <div>
              <Label className="text-slate-600 font-semibold">Actual Counted Cash</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 font-medium"
                value={actualCash || ""}
                onChange={(e) => setActualCash(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-slate-600 font-semibold">Status</Label>
              <div className="mt-1.5">
                {difference === 0 ? (
                  <Badge variant="secondary" className="flex w-full items-center justify-center gap-1 bg-emerald-100 text-emerald-800 py-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Balanced
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex w-full items-center justify-center gap-1 py-1.5 bg-red-100 text-red-800 border-red-200">
                    <CircleAlert className="h-4 w-4" /> {difference > 0 ? "Excess " : "Short "} {inr(Math.abs(difference))}
                  </Badge>
                )}
              </div>
            </div>
            {difference !== 0 && (
              <div className="sm:col-span-3 mt-2">
                <Label className="text-red-700 font-semibold">Reason for Discrepancy</Label>
                <Input
                  className="mt-1.5 border-red-200 focus-visible:ring-red-500"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the shortage/excess..."
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg text-slate-800">Cash Allocation</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">{inr(calculated.availableCash)} Available</Badge>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <Label className="text-slate-600 font-semibold">Cash Given To Owner</Label>
                <Input type="number" className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500" value={ownerCash || ""} onChange={(event) => setOwnerCash(Number(event.target.value))} />
              </div>
              <div>
                <Label className="text-slate-600 font-semibold">Cash Given To Staff</Label>
                <Input type="number" className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500" value={staffCash || ""} onChange={(event) => setStaffCash(Number(event.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-md border-emerald-200">
          <div className="bg-emerald-600 p-6 text-white text-center sm:text-left">
            <h3 className="font-semibold text-emerald-100 text-lg">Final Closing Balance</h3>
            <p className="mt-2 text-4xl font-black tracking-tight">{inr(calculated.cashInShop)}</p>
            <p className="mt-1 text-sm text-emerald-100 opacity-90">Expected Cash in Shop tonight</p>
          </div>
          <div className="bg-white p-6 border-t border-slate-100">
            <div className="space-y-4 mb-6 text-sm">
              <SummaryRow label="Opening Balance" value={inr(expectedOpeningBalance)} />
              <SummaryRow label="Total Sales" value={inr(sales)} />
              <SummaryRow label="Daily Expenses" value={inr(totalExpenses)} negative />
              <div className="border-t border-slate-100 pt-3">
                <SummaryRow label="Available Cash" value={inr(calculated.availableCash)} strong />
              </div>
              <SummaryRow label="GPay Collections" value={inr(totalGpay)} negative />
              <SummaryRow label="Owner Cash" value={inr(ownerCash)} negative />
              <SummaryRow label="Staff Cash" value={inr(staffCash)} negative />
            </div>

            {calculated.cashInShop < 0 && (
              <div className="mb-4 flex gap-2 rounded-md bg-rose-50 p-3 text-rose-700 border border-rose-200">
                <CircleAlert className="h-5 w-5 shrink-0" />
                <span className="font-medium text-sm">Allocation exceeds available cash.</span>
              </div>
            )}
            {message && <div className="mb-4 rounded-md bg-slate-50 border border-slate-200 p-3 text-slate-700 text-sm font-medium">{message}</div>}
            
            <Button className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all" disabled={!canSubmit || isPending} onClick={submitReport}>
              {isPending ? <CheckCircle2 className="mr-2 h-5 w-5 animate-pulse" /> : <Send className="mr-2 h-5 w-5" />}
              {isPending ? "Submitting..." : "Submit Daily Report"}
            </Button>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function SummaryRow({ label, value, strong, negative }: { label: string; value: string; strong?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={strong ? "font-bold text-slate-900" : negative ? "font-semibold text-rose-600" : "font-semibold text-slate-700"}>
        {value}
      </span>
    </div>
  );
}
