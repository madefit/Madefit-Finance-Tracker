"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { BusinessExpense, DailyReport } from "@/lib/types";
import { businessExpenseCategories, inr, todayISO } from "@/lib/utils";
import { deleteBusinessExpense } from "@/app/actions/expenses";

export function BusinessExpenseForm({ expenses, reports, allTimeStats }: { expenses: BusinessExpense[]; reports: DailyReport[]; allTimeStats: { totalSales: number; totalBusinessExpenses: number; } }) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const today = todayISO();
  const todayReports = reports.filter(r => r.report_date === today);
  const todayExpenses = expenses.filter(e => e.expense_date === today);

  const todaySales = todayReports.reduce((sum, report) => sum + report.total_sales, 0);
  const todayBusinessExpenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todayProfit = todaySales - todayBusinessExpenses;

  const monthlySales = reports.reduce((sum, report) => sum + report.total_sales, 0);
  const monthlyBusinessExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyProfit = monthlySales - monthlyBusinessExpenses;

  const allTimeProfit = allTimeStats.totalSales - allTimeStats.totalBusinessExpenses;

  function submit(formData: FormData) {
    startTransition(async () => {
      const response = await fetch("/api/business-expenses", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { "Content-Type": "application/json" },
      });
      const payload = (await response.json()) as { message: string };
      setMessage(payload.message);
    });
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this business expense? This action cannot be undone.")) {
      startTransition(async () => {
        const res = await deleteBusinessExpense(id);
        if (res.error) {
          alert("Failed to delete expense: " + res.error);
        }
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-800">Today&apos;s Insights</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 pt-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Sales</p>
              <p className="mt-1.5 text-xl font-bold text-slate-900">{inr(todaySales)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Biz Expenses</p>
              <p className="mt-1.5 text-xl font-bold text-rose-600">{inr(todayBusinessExpenses)}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
              <p className="text-sm font-semibold text-emerald-800">Net Profit</p>
              <p className="mt-1.5 text-2xl font-black text-emerald-700">{inr(todayProfit)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-800">Monthly Insights</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 pt-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Total Sales</p>
              <p className="mt-1.5 text-xl font-bold text-slate-900">{inr(monthlySales)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Total Biz Expenses</p>
              <p className="mt-1.5 text-xl font-bold text-rose-600">{inr(monthlyBusinessExpenses)}</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm">
              <p className="text-sm font-semibold text-blue-800">Monthly Profit</p>
              <p className="mt-1.5 text-2xl font-black text-blue-700">{inr(monthlyProfit)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-800">All-Time Insights</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 pt-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">All-Time Sales</p>
              <p className="mt-1.5 text-xl font-bold text-slate-900">{inr(allTimeStats.totalSales)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">All-Time Biz Expenses</p>
              <p className="mt-1.5 text-xl font-bold text-rose-600">{inr(allTimeStats.totalBusinessExpenses)}</p>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
              <p className="text-sm font-semibold text-indigo-800">All-Time Profit</p>
              <p className="mt-1.5 text-2xl font-black text-indigo-700">{inr(allTimeProfit)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <Card className="shadow-sm border-slate-200 self-start">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-800">Add Business Expense</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={submit} className="space-y-4">
              <div>
                <Label className="text-slate-600 font-semibold">Date</Label>
                <Input name="expense_date" type="date" defaultValue={todayISO()} required className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500" />
              </div>
              <div>
                <Label className="text-slate-600 font-semibold">Category</Label>
                <Select name="category" required className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500">
                  {businessExpenseCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-slate-600 font-semibold">Description</Label>
                <Textarea name="description" required className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 min-h-[100px]" />
              </div>
              <div>
                <Label className="text-slate-600 font-semibold">Amount</Label>
                <Input name="amount" type="number" min="0" step="0.01" required className="mt-1.5 border-slate-200 focus-visible:ring-emerald-500 font-medium" />
              </div>
              {message && <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 font-medium">{message}</div>}
              <Button disabled={isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                Save Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 self-start">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-800">Recent Business Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 bg-slate-50">
                <div>
                  <p className="font-bold text-slate-900">{expense.category}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-500">{expense.expense_date} · {expense.description}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  <p className="font-black text-slate-900 text-lg">{inr(expense.amount)}</p>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(expense.id)} disabled={isPending} aria-label="Delete expense">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="text-center py-8 text-slate-500 font-medium border border-dashed border-slate-200 rounded-lg">
                No business expenses found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
