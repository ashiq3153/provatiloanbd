-- Seed only an empty configuration document for a fresh v1.1 install.
-- Intentionally do not import global_loan_config or any other settings from the legacy project.
insert into public.system_settings(key, value)
values ('global_loan_config', '{}'::jsonb)
on conflict (key) do nothing;
