alter table public.system_settings
  alter column value set default '{}'::jsonb;

update public.system_settings
set value = jsonb_set(
  jsonb_set(
    jsonb_set(value, '{imoSupport}', to_jsonb(coalesce(value->>'imoSupport',''))),
    '{messengerSupport}', to_jsonb(coalesce(value->>'messengerSupport',''))
  ),
  '{emailSupport}', to_jsonb(coalesce(value->>'emailSupport',''))
)
where key = 'global_loan_config';

drop table if exists public.support_messages cascade;