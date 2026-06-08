import type { DailyReport } from "@/lib/types";
import { inr } from "@/lib/utils";

export function buildDailyReportMessage(report: DailyReport) {
  const expenseLines = report.daily_expenses?.length
    ? report.daily_expenses.map((expense) => `- ${expense.category}: ${inr(expense.amount)} (${expense.description})`).join("\n")
    : "- No daily expenses";

  const bankLines = report.bank_deposits?.length
    ? report.bank_deposits.map((deposit) => `- ${deposit.bank_name}: ${inr(deposit.amount)}`).join("\n")
    : "- No bank deposits";

  return `MADEFIT DAILY REPORT
Date: ${report.report_date}

Opening Balance: ${inr(report.opening_balance)}
Sales: ${inr(report.total_sales)}

Expense Breakdown:
${expenseLines}
Total Daily Expenses: ${inr(report.total_daily_expenses)}

Available Cash: ${inr(report.available_cash)}

Bank Deposits:
${bankLines}
Cash Given To Owner: ${inr(report.cash_given_to_owner)}
Cash Given To Staff: ${inr(report.cash_given_to_staff)}
Cash Remaining In Shop: ${inr(report.cash_in_shop)}

Status: ${report.status.toUpperCase()}
Submitted By: ${report.submitted_by_name ?? report.employee_id}`;
}
