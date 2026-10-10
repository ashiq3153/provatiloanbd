-- DESIGN PROPOSAL ONLY — NOT A MIGRATION.
-- Do not execute against production. Reconcile the migration history first
-- (issue #20 / PR #25), then generate and validate a proper migration locally.
--
-- Safety objective:
--   1. Approval is a review decision, not proof that money was transferred.
--   2. Do not create a completed disbursement transaction during approval.
--   3. Only reviewable applications may be approved; repeat approval is idempotent.
--   4. Keep this privileged RPC callable only by the trusted server gateway.

create or replace function public.approve_loan_atomic(
  p_loan_id uuid,
  p_feedback text default null
)
returns public.loan_applications
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_loan public.loan_applications;
begin
  if p_loan_id is null then
    raise exception 'Loan application ID is required';
  end if;

  select *
    into v_loan
    from public.loan_applications
   where id = p_loan_id
   for update;

  if not found then
    raise exception 'Loan application not found';
  end if;

  -- Safe retry: never create a second side effect for an already approved loan.
  if v_loan.status = 'approved' then
    return v_loan;
  end if;

  if v_loan.status not in ('pending', 'under_review', 'action_required') then
    raise exception 'Loan application cannot be approved from status %', v_loan.status;
  end if;

  update public.loan_applications
     set status = 'approved',
         admin_feedback = nullif(pg_catalog.btrim(coalesce(p_feedback, '')), ''),
         approved_at = coalesce(approved_at, pg_catalog.now())
   where id = p_loan_id
   returning * into v_loan;

  -- Intentionally do not insert a transaction here.
  -- A disbursement must be recorded only by a separate, verified disbursement
  -- workflow after the actual transfer is confirmed. Marking a transaction
  -- 'completed' here would incorrectly represent money movement that may not
  -- have occurred.

  return v_loan;
end;
$function$;

revoke all on function public.approve_loan_atomic(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_loan_atomic(uuid, text) to service_role;
