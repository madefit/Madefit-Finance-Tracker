import { clsx, type ClassValue } from "clsx";
import { format, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function periodStart(period: "week" | "month" | "year") {
  const now = new Date();
  if (period === "week") return format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  if (period === "month") return format(startOfMonth(now), "yyyy-MM-dd");
  return format(startOfYear(now), "yyyy-MM-dd");
}

export function money(value: FormDataEntryValue | number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export const dailyExpenseCategories = [
  "Tea & Refreshments",
  "Transport",
  "Local Purchase",
  "Maintenance",
  "Miscellaneous",
] as const;

export const businessExpenseCategories = [
  "Inventory Purchase",
  "Rent",
  "Salary",
  "Electricity",
  "Internet",
  "Marketing",
  "Shop Maintenance",
  "Website Expense",
  "Equipment Purchase",
  "Miscellaneous",
] as const;

export function calculateCash(input: {
  openingBalance: number;
  totalSales: number;
  dailyExpenses: number;
  bankDeposits: number;
  gpayCollections: number;
  ownerCash: number;
  staffCash: number;
}) {
  const availableCash = input.openingBalance + input.totalSales - input.dailyExpenses;
  const cashInShop = availableCash - input.bankDeposits - input.gpayCollections - input.ownerCash - input.staffCash;
  return {
    availableCash,
    cashInShop,
    isBalanced: Math.abs(availableCash - (input.bankDeposits + input.gpayCollections + input.ownerCash + input.staffCash + cashInShop)) < 0.01,
  };
}

export function netProfit(totalSales: number, dailyExpenses: number, businessExpenses: number) {
  return totalSales - dailyExpenses - businessExpenses;
}
