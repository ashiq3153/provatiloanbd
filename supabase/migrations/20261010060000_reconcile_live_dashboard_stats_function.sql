-- Forward reconciliation for a live object that exists in the connected Supabase
-- project but is absent from all 28 previously applied migration-history rows.
-- This function is already present in production; this migration records its
-- reviewed definition in version control and explicitly reapplies the verified ACL.
-- It does not read or modify customer rows beyond what the function does at runtime.

begin;

create or replace function public.get_dashboard_stats(p_chat_id bigint)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, auth
as $function$
declare
  v_chat_id bigint;
  v_result jsonb;
begin
  v_chat_id := public.current_telegram_chat_id();

  if v_chat_id is null or v_chat_id <> p_chat_id then
    raise exception 'Unauthorized dashboard stats request';
  end if;

  with loan_totals as (
    select
      coalesce(sum(case when status in ('active','approved') then amount else 0 end), 0) as approved_loan_amount,
      count(*) filter (where status in ('active','approved')) as active_loans_count,
      count(*) filter (where status = 'pending') as pending_applications
    from public.loan_applications
    where chat_id = v_chat_id
  ),
  tx_totals as (
    select
      coalesce(sum(amount) filter (where type = 'deposit' and status = 'completed'), 0) as deposit_balance,
      coalesce(sum(amount) filter (where type = 'withdraw' and status = 'completed'), 0) as withdraw_balance,
      coalesce(sum(amount) filter (where type = 'deposit' and deposit_type like '%security_deposit%' and status = 'completed'), 0) as savings_balance,
      coalesce(sum(amount) filter (where type = 'withdraw' and status in ('completed','pending')), 0) as withdrawn_amount
    from public.transactions
    where chat_id = v_chat_id
  )
  select jsonb_build_object(
    'totalBalance', greatest(0, lt.approved_loan_amount - tt.withdrawn_amount),
    'depositBalance', tt.deposit_balance,
    'withdrawBalance', tt.withdraw_balance,
    'savingsBalance', tt.savings_balance,
    'activeLoansCount', lt.active_loans_count,
    'pendingApplications', lt.pending_applications,
    'totalOutstanding', lt.approved_loan_amount
  )
  into v_result
  from loan_totals lt cross join tx_totals tt;

  return v_result;
end;
$function$;

revoke execute on function public.get_dashboard_stats(bigint) from public, anon;
grant execute on function public.get_dashboard_stats(bigint) to authenticated, service_role;

comment on function public.get_dashboard_stats(bigint) is
  'Returns dashboard totals for the current Telegram-verified applicant only. Source reconciliation migration.';

commit;
