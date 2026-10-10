create or replace function public.finalize_completed_transaction(p_transaction_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare t record;
begin
 select * into t from public.transactions where id=p_transaction_id;
 if not found or t.status <> 'completed' then return false; end if;
 if t.type='emi_payment' then
   perform public.apply_completed_emi_to_schedule(t.id);
 end if;
 return true;
end $$;
revoke execute on function public.finalize_completed_transaction(uuid) from public,anon,authenticated;
grant execute on function public.finalize_completed_transaction(uuid) to service_role;