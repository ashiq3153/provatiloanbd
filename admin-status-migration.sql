-- ============================================
-- Admin Online Status Table
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create the admin_status table
CREATE TABLE IF NOT EXISTS public.admin_status (
  id          INTEGER PRIMARY KEY DEFAULT 1,  -- single-row table
  is_online   BOOLEAN NOT NULL DEFAULT false,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Insert the single row (admin status singleton)
INSERT INTO public.admin_status (id, is_online, last_seen, updated_at)
VALUES (1, false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security
ALTER TABLE public.admin_status ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone (anon/authenticated) to READ the status
CREATE POLICY "allow_public_read_admin_status"
  ON public.admin_status
  FOR SELECT
  USING (true);

-- 5. Allow authenticated users (admin) to UPDATE the status
CREATE POLICY "allow_admin_update_admin_status"
  ON public.admin_status
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Enable Realtime on the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_status;
