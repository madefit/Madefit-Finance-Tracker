create extension if not exists "pgcrypto";

create type public.employee_role as enum ('employee', 'admin');
create type public.report_status as enum ('draft', 'submitted', 'unlocked');
create type public.verification_status as enum ('balanced', 'shortage', 'excess');
create type public.notification_channel as enum ('whatsapp', 'telegram');

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  role public.employee_role not null default 'employee',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null unique,
  employee_id uuid not null references public.employees(id),
  opening_balance numeric(12,2) not null check (opening_balance >= 0),
  total_sales numeric(12,2) not null check (total_sales >= 0),
  total_daily_expenses numeric(12,2) not null default 0 check (total_daily_expenses >= 0),
  available_cash numeric(12,2) not null,
  total_bank_deposits numeric(12,2) not null default 0 check (total_bank_deposits >= 0),
  cash_given_to_owner numeric(12,2) not null default 0 check (cash_given_to_owner >= 0),
  cash_given_to_staff numeric(12,2) not null default 0 check (cash_given_to_staff >= 0),
  cash_in_shop numeric(12,2) not null check (cash_in_shop >= 0),
  closing_balance numeric(12,2) not null check (closing_balance >= 0),
  status public.report_status not null default 'submitted',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_reports_cash_formula check (
    available_cash = opening_balance + total_sales - total_daily_expenses
    and available_cash = total_bank_deposits + cash_given_to_owner + cash_given_to_staff + cash_in_shop
    and closing_balance = cash_in_shop
  )
);

create table public.daily_expenses (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  category text not null,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table public.bank_deposits (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  bank_name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table public.cash_verifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  verification_date date not null,
  expected_opening_balance numeric(12,2) not null,
  actual_cash_count numeric(12,2) not null,
  difference_amount numeric(12,2) not null,
  status public.verification_status not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint cash_verification_reason_required check (status = 'balanced' or nullif(trim(reason), '') is not null)
);

create table public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  category text not null,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  channel public.notification_channel not null,
  recipient_name text not null,
  destination text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.employees(id),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_employee_id uuid references public.employees(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_daily_reports_date on public.daily_reports(report_date desc);
create index idx_daily_reports_employee on public.daily_reports(employee_id);
create index idx_daily_expenses_report on public.daily_expenses(report_id);
create index idx_bank_deposits_report on public.bank_deposits(report_id);
create index idx_business_expenses_date_category on public.business_expenses(expense_date desc, category);
create index idx_cash_verifications_date on public.cash_verifications(verification_date desc);
create index idx_audit_logs_actor_date on public.audit_logs(actor_employee_id, created_at desc);

alter table public.employees enable row level security;
alter table public.daily_reports enable row level security;
alter table public.daily_expenses enable row level security;
alter table public.bank_deposits enable row level security;
alter table public.cash_verifications enable row level security;
alter table public.business_expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_employee_role()
returns public.employee_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.employees where auth_user_id = auth.uid() and is_active = true limit 1
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.employees where auth_user_id = auth.uid() and is_active = true limit 1
$$;

create policy "employees read self or admin" on public.employees
for select using (auth_user_id = auth.uid() or public.current_employee_role() = 'admin');

create policy "admins manage employees" on public.employees
for all using (public.current_employee_role() = 'admin') with check (public.current_employee_role() = 'admin');

create policy "employees create own reports" on public.daily_reports
for insert with check (employee_id = public.current_employee_id() or public.current_employee_role() = 'admin');

create policy "reports readable by owner or admin" on public.daily_reports
for select using (employee_id = public.current_employee_id() or public.current_employee_role() = 'admin');

create policy "admins update reports" on public.daily_reports
for update using (public.current_employee_role() = 'admin') with check (public.current_employee_role() = 'admin');

create policy "admins delete reports" on public.daily_reports
for delete using (public.current_employee_role() = 'admin');

create policy "daily expenses visible through report" on public.daily_expenses
for select using (exists (select 1 from public.daily_reports r where r.id = report_id and (r.employee_id = public.current_employee_id() or public.current_employee_role() = 'admin')));

create policy "daily expenses write through report" on public.daily_expenses
for insert with check (exists (select 1 from public.daily_reports r where r.id = report_id and (r.employee_id = public.current_employee_id() or public.current_employee_role() = 'admin')));

create policy "bank deposits visible through report" on public.bank_deposits
for select using (exists (select 1 from public.daily_reports r where r.id = report_id and (r.employee_id = public.current_employee_id() or public.current_employee_role() = 'admin')));

create policy "bank deposits write through report" on public.bank_deposits
for insert with check (exists (select 1 from public.daily_reports r where r.id = report_id and (r.employee_id = public.current_employee_id() or public.current_employee_role() = 'admin')));

create policy "cash verifications owner or admin read" on public.cash_verifications
for select using (employee_id = public.current_employee_id() or public.current_employee_role() = 'admin');

create policy "cash verifications create own" on public.cash_verifications
for insert with check (employee_id = public.current_employee_id() or public.current_employee_role() = 'admin');

create policy "admin business expenses" on public.business_expenses
for all using (public.current_employee_role() = 'admin') with check (public.current_employee_role() = 'admin');

create policy "admin notifications" on public.notifications
for all using (public.current_employee_role() = 'admin') with check (public.current_employee_role() = 'admin');

create policy "admin settings" on public.settings
for all using (public.current_employee_role() = 'admin') with check (public.current_employee_role() = 'admin');

create policy "admin audit logs" on public.audit_logs
for select using (public.current_employee_role() = 'admin');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_reports, public.business_expenses, public.cash_verifications, public.notifications;
