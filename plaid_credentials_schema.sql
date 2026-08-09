-- Plaid Token Isolation Schema & Data Migration
-- This script creates a isolated, private credentials table for Plaid access tokens.
-- Strict Row Level Security (RLS) ensures tokens are completely inaccessible to frontend clients.

CREATE TABLE IF NOT EXISTS public.plaid_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    plaid_item_id TEXT UNIQUE NOT NULL,
    plaid_access_token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.plaid_credentials ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally DO NOT create any SELECT, INSERT, UPDATE, or DELETE policies for public/authenticated roles!
-- This guarantees that browser clients querying `supabase.from('plaid_credentials')` will receive 0 rows / permission denied.
-- Only the Supabase Service Role (used by Edge Functions) bypasses RLS to read/write tokens.

-- Migrate existing tokens from `accounts` table into `plaid_credentials`
INSERT INTO public.plaid_credentials (user_id, account_id, plaid_item_id, plaid_access_token)
SELECT user_id, id, plaid_item_id, plaid_access_token
FROM public.accounts
WHERE plaid_access_token IS NOT NULL AND plaid_item_id IS NOT NULL
ON CONFLICT (plaid_item_id) DO UPDATE
SET plaid_access_token = EXCLUDED.plaid_access_token,
    account_id = EXCLUDED.account_id,
    updated_at = NOW();
