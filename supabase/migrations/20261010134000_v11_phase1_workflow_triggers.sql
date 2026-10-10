-- Restore workflow protections and financial audit hooks on a fresh Phase 1 database.
-- Idempotent because these triggers may already exist when this migration is applied
-- to the currently bootstrapped preview database.
do $block$
begin
  if not exists (select 1 from pg_trigger where tgname='trg_protect_profile_admin_fields' and not tgisinternal) then
    create trigger trg_protect_profile_admin_fields before update on public.profiles
      for each row execute function public.protect_profile_admin_fields();
  end if;
  if not exists (select 1 from pg_trigger where tgname='trg_protect_loan_admin_fields' and not tgisinternal) then
    create trigger trg_protect_loan_admin_fields before update on public.loan_applications
      for each row execute function public.protect_loan_admin_fields();
  end if;
  if not exists (select 1 from pg_trigger where tgname='trg_audit_loan_status_change' and not tgisinternal) then
    create trigger trg_audit_loan_status_change after update of status on public.loan_applications
      for each row execute function public.audit_loan_status_change();
  end if;
  if not exists (select 1 from pg_trigger where tgname='trg_audit_transaction_status_change' and not tgisinternal) then
    create trigger trg_audit_transaction_status_change after update of status on public.transactions
      for each row execute function public.audit_transaction_status_change();
  end if;
  if not exists (select 1 from pg_trigger where tgname='trg_post_transaction_to_ledger' and not tgisinternal) then
    create trigger trg_post_transaction_to_ledger before update of status on public.transactions
      for each row execute function public.post_transaction_to_ledger();
  end if;
end
$block$;
