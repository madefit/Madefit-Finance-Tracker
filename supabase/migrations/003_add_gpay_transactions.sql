-- Add total_gpay column
ALTER TABLE public.daily_reports ADD COLUMN total_gpay numeric(12,2) not null default 0 check (total_gpay >= 0);

-- Update the check constraint for cash formula
ALTER TABLE public.daily_reports DROP CONSTRAINT daily_reports_cash_formula;

ALTER TABLE public.daily_reports ADD CONSTRAINT daily_reports_cash_formula check (
  available_cash = opening_balance + total_sales - total_daily_expenses
  and available_cash = total_bank_deposits + cash_given_to_owner + cash_given_to_staff + cash_in_shop + total_gpay
  and closing_balance = cash_in_shop
);

-- Create gpay_transactions table
create table public.gpay_transactions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  customer_name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

-- Index for performance
create index idx_gpay_transactions_report on public.gpay_transactions(report_id);

-- Enable RLS
alter table public.gpay_transactions enable row level security;

-- Add RLS policies (same logic as daily_expenses and bank_deposits)
create policy "gpay transactions visible through report" on public.gpay_transactions
for select using (exists (select 1 from public.daily_reports r where r.id = report_id and (r.employee_id = public.current_employee_id() or public.current_employee_role() = 'admin')));

create policy "gpay transactions write through report" on public.gpay_transactions
for insert with check (exists (select 1 from public.daily_reports r where r.id = report_id and (r.employee_id = public.current_employee_id() or public.current_employee_role() = 'admin')));
