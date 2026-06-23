-- ============================================
-- Support Messages Upgrade Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns to support_messages
ALTER TABLE public.support_messages
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.support_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_seen BOOLEAN NOT NULL DEFAULT false;

-- Allow updates (specifically for editing messages and updating is_seen)
CREATE POLICY "allow_all_update_support_messages"
ON public.support_messages
FOR UPDATE
USING (true)
WITH CHECK (true);
