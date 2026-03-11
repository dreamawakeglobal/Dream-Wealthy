-- Plaid Integration Schema Patch for Dream Wealthy
-- Run this in your Supabase SQL Editor to permanently add the missing columns

-- 1. Patch the existing Accounts Table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS plaid_access_token TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS transactions_cursor TEXT,
ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Patch the existing Transactions Table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT FALSE;

-- Ensure RLS is active and enforced on new columns
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
