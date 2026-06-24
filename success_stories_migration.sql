-- Migration: Update success_stories table
-- Date: 2026-06-24
-- Description: Adds new fields for location, profession, loan_tenure, and deposit_payment.

ALTER TABLE success_stories 
ADD COLUMN IF NOT EXISTS location text DEFAULT '',
ADD COLUMN IF NOT EXISTS profession text DEFAULT '',
ADD COLUMN IF NOT EXISTS loan_tenure text DEFAULT '',
ADD COLUMN IF NOT EXISTS deposit_payment text DEFAULT '',
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Note: Go to Supabase Dashboard -> SQL Editor -> New Query, paste this and run it.
