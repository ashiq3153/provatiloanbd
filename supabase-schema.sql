-- ══════════════════════════════════════════════════════════════
-- Loan Service App — Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Profiles (identified by Telegram chat_id)
CREATE TABLE IF NOT EXISTS profiles (
  chat_id BIGINT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  photo_url TEXT,
  phone TEXT,
  address TEXT,
  nid_number TEXT,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON profiles FOR UPDATE USING (true);

-- 2. Loan Applications (full multi-step form data)
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT REFERENCES profiles(chat_id) ON DELETE CASCADE,
  -- Loan config
  loan_category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tenure_months INT NOT NULL,
  interest_rate NUMERIC DEFAULT 0,
  emi_amount NUMERIC DEFAULT 0,
  processing_fee NUMERIC DEFAULT 0,
  security_deposit NUMERIC DEFAULT 0,
  -- Personal info
  full_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  mobile TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  current_address TEXT NOT NULL,
  permanent_address TEXT NOT NULL,
  nid_number TEXT,
  -- Professional info (JSON - varies by category)
  professional_info JSONB,
  -- Bank info
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  routing_number TEXT,
  mobile_banking TEXT,
  -- Nominee info
  nominee_name TEXT NOT NULL,
  nominee_relation TEXT NOT NULL,
  nominee_mobile TEXT NOT NULL,
  nominee_nid TEXT NOT NULL,
  documents JSONB,
  -- Status
  status TEXT DEFAULT 'pending',
  admin_feedback TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read loan_applications" ON loan_applications FOR SELECT USING (true);
CREATE POLICY "Public insert loan_applications" ON loan_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update loan_applications" ON loan_applications FOR UPDATE USING (true);

-- 3. Transactions (deposits, withdrawals, EMI, disbursements)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT REFERENCES profiles(chat_id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loan_applications(id),
  type TEXT NOT NULL, -- deposit, withdraw, emi_payment, disbursement
  deposit_type TEXT, -- processing_fee, security_deposit (for deposits)
  amount NUMERIC NOT NULL,
  payment_method TEXT, -- bkash, nagad, rocket, bank, visa
  sender_number TEXT,
  trx_id TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update transactions" ON transactions FOR UPDATE USING (true);

-- 4. Success Stories (public)
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  loan_type TEXT,
  amount NUMERIC,
  approval_time TEXT,
  rating INT DEFAULT 5,
  is_verified BOOLEAN DEFAULT false
);

ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read success_stories" ON success_stories FOR SELECT USING (true);
CREATE POLICY "Public insert success_stories" ON success_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update success_stories" ON success_stories FOR UPDATE USING (true);
CREATE POLICY "Public delete success_stories" ON success_stories FOR DELETE USING (true);


-- 5. Sample success stories
INSERT INTO success_stories (name, loan_type, amount, approval_time, rating, is_verified) VALUES
  ('Nusrat Jahan', 'Business Loan', 300000, 'Approved in 24 Hours', 5, true),
  ('Rashed Alam', 'Personal Loan', 150000, 'Approved in 12 Hours', 5, true),
  ('Fatema Begum', 'Home Loan', 850000, 'Approved in 48 Hours', 4, true);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_loan_apps_chat_id ON loan_applications(chat_id);
CREATE INDEX IF NOT EXISTS idx_loan_apps_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_transactions_chat_id ON transactions(chat_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_deposit_type ON transactions(deposit_type);

-- 7. Support Messages (in-app live chat)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT REFERENCES profiles(chat_id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'user' or 'admin'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read support_messages" ON support_messages FOR SELECT USING (true);
CREATE POLICY "Public insert support_messages" ON support_messages FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_support_messages_chat_id ON support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at ASC);

-- 8. Migration: Add Reaction Columns to Success Stories
ALTER TABLE success_stories
ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislike_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS love_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS loveit_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS congratulation_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS wow_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sad_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS hundred_count INT DEFAULT 0;
