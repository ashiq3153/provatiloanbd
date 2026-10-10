alter table public.loan_applications drop constraint if exists loan_status_valid;
alter table public.transactions drop constraint if exists transaction_status_valid;
alter table public.transactions drop constraint if exists transaction_type_valid;