create or replace function public.get_admin_role(p_chat_id bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.admin_roles
  where chat_id = p_chat_id and is_active = true
  limit 1
$$;
revoke execute on function public.get_admin_role(bigint) from public, anon, authenticated;
grant execute on function public.get_admin_role(bigint) to service_role;