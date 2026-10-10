create table if not exists public.loan_emi_schedule (
 id uuid primary key default gen_random_uuid(),
 loan_id uuid not null references public.loan_applications(id) on delete cascade,
 installment_no integer not null,
 due_date date not null,
 principal_due numeric(14,2) not null check (principal_due >= 0),
 interest_due numeric(14,2) not null check (interest_due >= 0),
 total_due numeric(14,2) not null check (total_due > 0),
 paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
 status text not null default 'pending' check (status in ('pending','partial','paid','overdue','waived')),
 paid_at timestamptz,
 created_at timestamptz not null default now(),
 unique(loan_id,installment_no)
);
create index if not exists loan_emi_schedule_due_idx on public.loan_emi_schedule(due_date,status);
create index if not exists loan_emi_schedule_loan_idx on public.loan_emi_schedule(loan_id,installment_no);
alter table public.loan_emi_schedule enable row level security;
revoke all on public.loan_emi_schedule from public,anon,authenticated;
grant all on public.loan_emi_schedule to service_role;