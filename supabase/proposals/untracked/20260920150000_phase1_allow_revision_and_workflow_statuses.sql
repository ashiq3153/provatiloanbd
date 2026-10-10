-- RECOVERY NOTE: this file is not a migration recorded in the live Supabase migration history. Preserved for audit only; do not run with db push.
alter table public.loan_applications
  drop constraint if exists loan_applications_status_valid;

alter table public.loan_applications
  add constraint loan_applications_status_valid
  check (status = any (array[
    'pending'::text,
    'under_review'::text,
    'approved'::text,
    'rejected'::text,
    'active'::text,
    'action_required'::text,
    'completed'::text,
    'cancelled'::text
  ]));
