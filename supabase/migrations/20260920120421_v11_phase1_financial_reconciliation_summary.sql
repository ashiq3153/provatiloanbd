create or replace view public.financial_reconciliation_summary as
select
 coalesce(sum(case when type='deposit' and status='completed' then amount else 0 end),0) as completed_deposits,
 coalesce(sum(case when type='emi_payment' and status='completed' then amount else 0 end),0) as completed_emi,
 coalesce(sum(case when type='withdraw' and status='completed' then amount else 0 end),0) as completed_withdrawals,
 coalesce(sum(case when type='disbursement' and status='completed' then amount else 0 end),0) as completed_disbursements,
 coalesce(sum(case when status='pending' then amount else 0 end),0) as pending_amount,
 count(*) filter (where status='pending') as pending_count,
 (select coalesce(sum(case when entry_type='credit' then amount else -amount end),0) from public.financial_ledger) as ledger_net
from public.transactions;

revoke all on public.financial_reconciliation_summary from public,anon,authenticated;
grant select on public.financial_reconciliation_summary to service_role;