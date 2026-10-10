-- v1.1 core write-path lockdown.
--
-- IMPORTANT: Before deploying, reconcile remote migration history with the
-- checked-in supabase/migrations files. The live project has applied migration
-- versions not present in the inspected branch; see GitHub issue #5. Do not run
-- this against production until the migration history and staging verification
-- are complete.
--
-- Browser reads continue through their existing SELECT grants and owner/public
-- SELECT RLS policies. Mutations must pass through the Telegram-verified server
-- gateway (service role), where ownership, status, and financial fields are
-- validated.

begin;

-- Remove client-side write paths that allow callers to bypass server checks.
drop policy if exists loans_owner_insert on public.loan_applications;
drop policy if exists loans_owner_update on public.loan_applications;
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;
drop policy if exists transactions_owner_insert on public.transactions;

-- RLS does not protect against TRUNCATE. Remove all browser write and DDL-like
-- table privileges on the application-facing tables while retaining SELECT.
revoke insert, update, delete, truncate, references, trigger
  on table
    public.loan_applications,
    public.profiles,
    public.transactions,
    public.system_settings,
    public.success_stories,
    public.admin_status
  from anon, authenticated;

-- Secure future public tables by default. Migrations/features that intentionally
-- expose data must add narrowly scoped SELECT grants and RLS policies explicitly.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role supabase_admin in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role supabase_admin in schema public
  revoke all on sequences from anon, authenticated;

commit;
