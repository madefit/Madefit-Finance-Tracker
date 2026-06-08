-- Relax constraint for draft reports
ALTER TABLE public.daily_reports DROP CONSTRAINT daily_reports_cash_formula;

ALTER TABLE public.daily_reports ADD CONSTRAINT daily_reports_cash_formula check (
  status = 'draft' OR (
    available_cash = opening_balance + total_sales - total_daily_expenses
    and available_cash = total_bank_deposits + cash_given_to_owner + cash_given_to_staff + cash_in_shop + total_gpay
    and closing_balance = cash_in_shop
  )
);
