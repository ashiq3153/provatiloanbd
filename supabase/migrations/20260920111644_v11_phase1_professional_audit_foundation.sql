begin;

create table if not exists public.loan_status_history (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_chat_id bigint,
  changed_by_role text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_loan_status_history_loan_created
  on public.loan_status_history(loan_id, created_at desc);

create table if not exists public.transaction_status_history (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_chat_id bigint,
  changed_by_role text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transaction_status_history_tx_created
  on public.transaction_status_history(transaction_id, created_at desc);

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_chat_id bigint,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_log_created
  on public.admin_activity_log(created_at desc);

alter table public.loan_status_history enable row level security;
alter table public.transaction_status_history enable row level security;
alter table public.admin_activity_log enable row level security;

revoke all on table public.loan_status_history from anon, authenticated;
revoke all on table public.transaction_status_history from anon, authenticated;
revoke all on table public.admin_activity_log from anon, authenticated;
grant all on table public.loan_status_history to service_role;
grant all on table public.transaction_status_history to service_role;
grant all on table public.admin_activity_log to service_role;

commit;