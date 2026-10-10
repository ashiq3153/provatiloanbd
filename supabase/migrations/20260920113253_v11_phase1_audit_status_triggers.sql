create or replace function public.audit_actor_role()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  role_name text;
begin
  claims := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  role_name := claims ->> 'role';
  return coalesce(role_name, current_user);
exception when others then
  return current_user;
end;
$$;

create or replace function public.audit_loan_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_chat_id bigint;
  actor_role text;
begin
  if tg_op <> 'UPDATE' or old.status is not distinct from new.status then
    return new;
  end if;

  actor_role := public.audit_actor_role();

  begin
    actor_chat_id := nullif(
      coalesce(
        current_setting('request.jwt.claims', true)::jsonb ->> 'telegram_chat_id',
        current_setting('request.jwt.claims', true)::jsonb ->> 'chat_id'
      ), ''
    )::bigint;
  exception when others then
    actor_chat_id := null;
  end;

  insert into public.loan_status_history
    (loan_id, from_status, to_status, changed_by_chat_id, changed_by_role, note)
  values
    (new.id, old.status, new.status, coalesce(actor_chat_id, new.chat_id), actor_role, new.admin_feedback);

  insert into public.admin_activity_log
    (admin_chat_id, action, entity_type, entity_id, details)
  values
    (actor_chat_id, 'loan.status_changed', 'loan_application', new.id::text,
     jsonb_build_object(
       'from_status', old.status,
       'to_status', new.status,
       'chat_id', new.chat_id,
       'note', new.admin_feedback
     ));

  return new;
end;
$$;

drop trigger if exists trg_audit_loan_status_change on public.loan_applications;
create trigger trg_audit_loan_status_change
after update of status on public.loan_applications
for each row
execute function public.audit_loan_status_change();

create or replace function public.audit_transaction_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_chat_id bigint;
  actor_role text;
begin
  if tg_op <> 'UPDATE' or old.status is not distinct from new.status then
    return new;
  end if;

  actor_role := public.audit_actor_role();

  begin
    actor_chat_id := nullif(
      coalesce(
        current_setting('request.jwt.claims', true)::jsonb ->> 'telegram_chat_id',
        current_setting('request.jwt.claims', true)::jsonb ->> 'chat_id'
      ), ''
    )::bigint;
  exception when others then
    actor_chat_id := null;
  end;

  insert into public.transaction_status_history
    (transaction_id, from_status, to_status, changed_by_chat_id, changed_by_role, note)
  values
    (new.id, old.status, new.status, coalesce(actor_chat_id, new.chat_id), actor_role,
     coalesce(new.admin_note, null));

  insert into public.admin_activity_log
    (admin_chat_id, action, entity_type, entity_id, details)
  values
    (actor_chat_id, 'transaction.status_changed', 'transaction', new.id::text,
     jsonb_build_object(
       'from_status', old.status,
       'to_status', new.status,
       'chat_id', new.chat_id,
       'type', new.type,
       'amount', new.amount
     ));

  return new;
end;
$$;

drop trigger if exists trg_audit_transaction_status_change on public.transactions;
create trigger trg_audit_transaction_status_change
after update of status on public.transactions
for each row
execute function public.audit_transaction_status_change();

revoke execute on function public.audit_actor_role() from public, anon, authenticated;
revoke execute on function public.audit_loan_status_change() from public, anon, authenticated;
revoke execute on function public.audit_transaction_status_change() from public, anon, authenticated;