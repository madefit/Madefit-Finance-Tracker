export type Role = "employee" | "admin";
export type VerificationStatus = "balanced" | "shortage" | "excess";
export type ReportStatus = "draft" | "submitted" | "unlocked";

export type Employee = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
};

export type DailyExpense = {
  id: string;
  report_id: string;
  category: string;
  description: string;
  amount: number;
};

export type BankDeposit = {
  id: string;
  report_id: string;
  bank_name: string;
  amount: number;
};

export type BusinessExpense = {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  created_by: string | null;
};

export type CashVerification = {
  id: string;
  employee_id: string;
  verification_date: string;
  expected_opening_balance: number;
  actual_cash_count: number;
  difference_amount: number;
  status: VerificationStatus;
  reason: string | null;
};

export type GpayTransaction = {
  id: string;
  report_id: string;
  customer_name: string;
  amount: number;
};

export type DailyReport = {
  id: string;
  report_date: string;
  employee_id: string;
  opening_balance: number;
  total_sales: number;
  total_daily_expenses: number;
  available_cash: number;
  total_bank_deposits: number;
  total_gpay: number;
  cash_given_to_owner: number;
  cash_given_to_staff: number;
  cash_in_shop: number;
  closing_balance: number;
  status: ReportStatus;
  submitted_at: string | null;
  submitted_by_name?: string;
  daily_expenses?: DailyExpense[];
  bank_deposits?: BankDeposit[];
  gpay_transactions?: GpayTransaction[];
};

export type NotificationRecipient = {
  id: string;
  channel: "whatsapp" | "telegram" | "email";
  recipient_name: string;
  destination: string;
  is_active: boolean;
};

export type DashboardData = {
  employee: Employee | null;
  employees: Employee[];
  todayReport: DailyReport | null;
  previousClosingBalance: number;
  reports: DailyReport[];
  businessExpenses: BusinessExpense[];
  notifications: NotificationRecipient[];
  allTimeStats: {
    totalSales: number;
    totalBusinessExpenses: number;
  };
};
