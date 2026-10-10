insert into public.financial_ledger
(transaction_id,loan_id,chat_id,entry_type,account_code,amount,reference,note)
select t.id,t.loan_id,t.chat_id,
 case when t.type in ('deposit','emi_payment') then 'credit' else 'debit' end,
 case when t.type='deposit' then 'customer_deposit'
      when t.type='emi_payment' then 'loan_repayment'
      when t.type='withdraw' then 'customer_withdrawal'
      when t.type='disbursement' then 'loan_disbursement' else 'other' end,
 t.amount,coalesce(t.trx_id,t.id::text),'Backfilled from existing completed transaction'
from public.transactions t
where t.status='completed' and not exists (
 select 1 from public.financial_ledger l where l.transaction_id=t.id
);
update public.transactions t
set ledger_posted_at=coalesce(t.ledger_posted_at,now()),
    ledger_reference=coalesce(t.ledger_reference,t.id::text)
where t.status='completed' and exists (select 1 from public.financial_ledger l where l.transaction_id=t.id);