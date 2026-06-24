-- Migration: Add bot_status to profiles table
-- Date: 2026-06-24
-- Description: Tracks whether a user has blocked the Telegram bot or is active.

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bot_status text DEFAULT 'active';

-- Backfill existing rows with 'active' just in case
UPDATE profiles SET bot_status = 'active' WHERE bot_status IS NULL;

-- Note: In Supabase Dashboard, go to SQL Editor and run this query.
