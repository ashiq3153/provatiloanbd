create table if not exists public.loan_rate_versions (
  id uuid primary key default gen_random_uuid(),
  loan_category text not null,
  monthly_rate numeric(12,8) not null check (monthly_rate >= 0),
  calculation_method text not null default 'flat' check (calculation_method in ('flat','reducing_balance')),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  is_active boolean not null default true,
  created_by_chat_id bigint,
  created_at timestamptz not null default now()
);
create index if not exists loan_rate_versions_category_active_idx
  on public.loan_rate_versions(loan_category, is_active, effective_from desc);
alter table public.loan_rate_versions enable row level security;
revoke all on public.loan_rate_versions from public, anon, authenticated;
grant all on public.loan_rate_versions to service_role;

alter table public.loan_applications add column if not exists rate_version_id uuid references public.loan_rate_versions(id);
alter table public.loan_applications add column if not exists calculation_method text not null default 'flat';
alter table public.loan_applications add column if not exists total_interest numeric(14,2);
alter table public.loan_applications add column if not exists total_payable numeric(14,2);

insert into public.loan_rate_versions (loan_category, monthly_rate, calculation_method, created_by_chat_id)
select v.category, (s.value->>v.key)::numeric, 'flat', null
from public.system_settings s
cross join (values
 ('personal','minRatePersonal'),('business','minRateBusiness'),('expat','minRateExpat'),
 ('student','minRateStudent'),('emergency','minRateEmergency'),('women','minRateWomen')
) v(category,key)
where s.key='global_loan_config'
and not exists (select 1 from public.loan_rate_versions r where r.loan_category=v.category);