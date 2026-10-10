-- Keep the singleton admin status row available for the verified server gateway.
insert into public.admin_status(id, is_online, last_seen, updated_at)
values (1, false, now(), now())
on conflict (id) do nothing;

-- Cover foreign-key lookups used by KYC and rate-version history.
create index if not exists kyc_reviews_loan_idx on public.kyc_reviews(loan_id);
create index if not exists loan_applications_rate_version_idx on public.loan_applications(rate_version_id);

-- Avoid re-evaluating auth.uid() for every candidate identity row.
drop policy if exists telegram_identity_owner_select on public.telegram_identities;
create policy telegram_identity_owner_select
  on public.telegram_identities for select to authenticated
  using (auth_user_id = (select auth.uid()));
