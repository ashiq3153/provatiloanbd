create or replace function public.mark_overdue_emi_schedule()
returns integer language plpgsql security definer set search_path=''
as $$
declare n integer;
begin
 update public.loan_emi_schedule
 set status='overdue'
 where due_date < current_date and status in ('pending','partial');
 get diagnostics n = row_count;
 return n;
end $$;
revoke execute on function public.mark_overdue_emi_schedule() from public,anon,authenticated;
grant execute on function public.mark_overdue_emi_schedule() to service_role;