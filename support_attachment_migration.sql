-- Migration: Add attachment_url to support_messages table
-- Date: 2026-06-27
-- Description: Adds an optional attachment_url column to support_messages table for chat attachments.

ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;
