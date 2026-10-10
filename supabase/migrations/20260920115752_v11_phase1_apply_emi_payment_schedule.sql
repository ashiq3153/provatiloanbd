create or replace function public.apply_completed_emi_to_schedule(p_transaction_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
 t record; s record; remaining numeric; take_amt numeric;
begin
 select * into t from public.transactions where id=p_transaction_id and type='emi_payment' and status='completed';
 if not found then return false; end if;
 remaining := t.amount;
 for s in select * from public.loan_emi_schedule where loan_id=t.loan_id and status in ('pending','partial','overdue') and paid_amount < total_due order by installment_no for update loop
   exit when remaining <= 0;
   take_amt := least(remaining, s.total_due-s.paid_amount);
   update public.loan_emi_schedule
   set paid_amount=paid_amount+take_amt,
       status=case when paid_amount+take_amt >= total_due then 'paid' else 'partial' end,
       paid_at=case when paid_amount+take_amt >= total_due then now() else paid_at end
   where id=s.id;
   remaining := remaining-take_amt;
 end loop;
 return true;
end $$;
revoke execute on function public.apply_completed_emi_to_schedule(uuid) from public,anon,authenticated;
grant execute on function public.apply_completed_emi_to_schedule(uuid) to service_role;