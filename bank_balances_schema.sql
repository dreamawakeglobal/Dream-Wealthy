-- Phase 1: Bank Balances Database Foundation
-- This script safely constructs the `bank_balances` cache table with strict RLS security protocols.

CREATE TABLE IF NOT EXISTS public.bank_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    plaid_account_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    mask VARCHAR(20),
    type VARCHAR(50),
    subtype VARCHAR(50),
    current_balance NUMERIC,
    available_balance NUMERIC,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, plaid_account_id)
);

-- Secure the table so users can only ever access their own financial records
ALTER TABLE public.bank_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bank balances."
    ON public.bank_balances FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank balances."
    ON public.bank_balances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank balances."
    ON public.bank_balances FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank balances."
    ON public.bank_balances FOR DELETE
    USING (auth.uid() = user_id);
