create table if not exists public.financial_ledger (
 id uuid primary key default gen_random_uuid(),
 transaction_id uuid references public.transactions(id) on delete set null,
 loan_id uuid references public.loan_applications(id) on delete set null,
 chat_id bigint,
 entry_type text not null check (entry_type in ('debit','credit')),
 account_code text not null,
 amount numeric(14,2) not null check (amount > 0),
 reference text,
 note text,
 created_by_chat_id bigint,
 created_at timestamptz not null default now()
);
create index if not exists financial_ledger_tx_idx on public.financial_ledger(transaction_id,created_at desc);
create index if not exists financial_ledger_loan_idx on public.financial_ledger(loan_id,created_at desc);
create index if not exists financial_ledger_account_idx on public.financial_ledger(account_code,created_at desc);
alter table public.financial_ledger enable row level security;
revoke all on public.financial_ledger from public,anon,authenticated;
grant all on public.financial_ledger to service_role;

alter table public.transactions add column if not exists verified_by_chat_id bigint;
alter table public.transactions add column if not exists verified_at timestamptz;
alter table public.transactions add column if not exists verification_note text;
alter table public.transactions add column if not exists ledger_posted_at timestamptz;
alter table public.transactions add column if not exists ledger_reference text;

create or replace function public.post_transaction_to_ledger()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 if new.status='completed' and (old.status is distinct from new.status) and new.ledger_posted_at is null then
   if new.amount <= 0 then raise exception 'Transaction amount must be positive'; end if;
   insert into public.financial_ledger(transaction_id,loan_id,chat_id,entry_type,account_code,amount,reference,note)
   values (
     new.id,new.loan_id,new.chat_id,
     case when new.type in ('deposit','emi_payment') then 'credit' else 'debit' end,
     case when new.type='deposit' then 'customer_deposit'
          when new.type='emi_payment' then 'loan_repayment'
          when new.type='withdraw' then 'customer_withdrawal'
          when new.type='disbursement' then 'loan_disbursement'
          else 'other' end,
     new.amount,
     coalesce(new.trx_id,new.id::text),
     'Automatically posted from completed transaction'
   );
   new.ledger_posted_at=now();
   new.ledger_reference=new.id::text;
 end if;
 return new;
end $$;
drop trigger if exists trg_post_transaction_to_ledger on public.transactions;
create trigger trg_post_transaction_to_ledger before update of status on public.transactions
for each row execute function public.post_transaction_to_ledger();
revoke execute on function public.post_transaction_to_ledger() from public,anon,authenticated;