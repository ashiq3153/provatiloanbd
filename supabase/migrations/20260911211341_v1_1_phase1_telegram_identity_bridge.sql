CREATE TABLE IF NOT EXISTS public.telegram_identities (
  telegram_chat_id BIGINT PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_identities_auth_user_id
  ON public.telegram_identities(auth_user_id);

ALTER TABLE public.telegram_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.telegram_identities FROM anon, authenticated;