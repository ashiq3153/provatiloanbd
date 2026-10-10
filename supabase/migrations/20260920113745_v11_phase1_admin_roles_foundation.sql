create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null unique,
  role text not null default 'viewer' check (role in ('owner','admin','finance','support','viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_roles enable row level security;
revoke all on public.admin_roles from public, anon, authenticated;
grant all on public.admin_roles to service_role;

insert into public.admin_roles (chat_id, role, is_active)
select cast(v as bigint), 'owner', true
from unnest(string_to_array(coalesce(current_setting('app.admin_chat_ids', true), ''), ',')) v
where trim(v) <> ''
on conflict (chat_id) do update set role='owner', is_active=true, updated_at=now();

create index if not exists admin_roles_active_idx on public.admin_roles(is_active, role);