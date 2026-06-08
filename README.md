# MadeFit Business Finance & Daily Closing System

Production-ready mobile-first retail finance app for MadeFit. It covers opening cash verification, daily sales, expenses, cash allocation, auto carry-forward, admin business expenses, realtime insights, reports, notifications, and PWA install support.

## Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS and shadcn-style UI primitives
- Supabase Auth, Postgres, Row Level Security, Realtime
- PDF and Excel exports
- WhatsApp Business API and Telegram Bot notification hooks

## Features

- Employee workflow: verify opening cash, record sales, add multiple daily expenses, allocate cash, submit daily report.
- Admin workflow: view realtime dashboard, reports, employees, notification recipients, and business expenses.
- Cash formulas enforced in UI and database constraints.
- Net profit: `sales - daily expenses - business expenses`.
- Auto carry-forward: latest submitted closing balance is used as the next opening balance.
- Audit logging for report submission.
- PWA manifest and service worker.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars the app runs in demo mode with realistic sample data. Add Supabase credentials to persist data and enforce authentication.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_madefit_finance.sql` in the SQL editor or Supabase CLI.
3. Create Auth users for employees/admins.
4. Insert matching rows in `employees` with each user's `auth_user_id`.
5. Enable Realtime for the listed publication if your Supabase project requires manual confirmation.

Example admin employee:

```sql
insert into public.employees (auth_user_id, full_name, email, phone, role)
values ('AUTH_USER_UUID', 'MadeFit Admin', 'admin@madefit.in', '+919000000000', 'admin');
```

## Notifications

Telegram requires `TELEGRAM_BOT_TOKEN`; each notification row uses the chat ID as `destination`.

WhatsApp requires:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

Each WhatsApp notification row uses the phone number as `destination`.

## Deployment

Deploy to Vercel or any Next.js host:

```bash
npm run build
npm run start
```

Set the same environment variables in the hosting dashboard. Use Supabase service role only on the server; never expose it to the browser.

## Important Files

- `src/app/page.tsx` - main app entry.
- `src/components/forms/employee-closing-form.tsx` - employee daily closing workflow.
- `src/components/dashboard/admin-insights.tsx` - realtime admin dashboard charts and cards.
- `src/app/api/reports/submit/route.ts` - submission validation, persistence, audit logging, notification trigger.
- `supabase/migrations/001_madefit_finance.sql` - schema, indexes, constraints, RLS, Realtime.
