-- Store the reusable personal information a member has chosen to keep in their profile.
-- Reads and writes are served only through the Telegram-verified API gateway.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS personal_details jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.personal_details IS
  'Member-editable reusable personal details for loan-form prefill. Updated only through the Telegram-verified server gateway.';
