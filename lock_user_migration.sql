-- Add lock features to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN lock_reason TEXT;
