create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(),
 chat_id bigint not null,
 type text not null default 'system' check (type in ('system','loan','payment','emi','security','support')),
 title text not null,
 message text not null,
 entity_type text,
 entity_id text,
 is_read boolean not null default false,
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index if not exists notifications_chat_idx on public.notifications(chat_id,created_at desc);
create index if not exists notifications_unread_idx on public.notifications(chat_id,is_read,created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from public,anon,authenticated;
grant all on public.notifications to service_role;

create table if not exists public.kyc_reviews (
 id uuid primary key default gen_random_uuid(),
 chat_id bigint not null,
 loan_id uuid references public.loan_applications(id) on delete set null,
 status text not null default 'pending' check (status in ('pending','under_review','verified','rejected','needs_revision')),
 reviewer_chat_id bigint,
 reviewer_note text,
 documents jsonb not null default '{}'::jsonb,
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index if not exists kyc_reviews_chat_idx on public.kyc_reviews(chat_id,submitted_at desc);
create index if not exists kyc_reviews_status_idx on public.kyc_reviews(status,submitted_at desc);
alter table public.kyc_reviews enable row level security;
revoke all on public.kyc_reviews from public,anon,authenticated;
grant all on public.kyc_reviews to service_role;