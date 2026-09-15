-- Migration: 20260907_savings_verification_pipeline.sql
-- Description: Decoupled Evidence Layer, Virtual Envelopes, and Financial Events

ALTER TABLE IF EXISTS public.transactions 
ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS public.goals 
ADD COLUMN IF NOT EXISTS verification_tier TEXT DEFAULT 'SELF_REPORTED';

CREATE TABLE IF NOT EXISTS public.financial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'INCOME', 
        'EXPENSE', 
        'INTERNAL_TRANSFER', 
        'SAVINGS_CONTRIBUTION', 
        'SAVINGS_WITHDRAWAL', 
        'CONFIRMED_EXTERNAL_OUTFLOW', 
        'CONFIRMED_EXTERNAL_INFLOW', 
        'MANUAL_SAVINGS_UPDATE'
    )),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    source_bank_balance_id UUID REFERENCES public.bank_balances(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    destination_bank_balance_id UUID REFERENCES public.bank_balances(id) ON DELETE SET NULL,
    destination_name TEXT,
    verification_level TEXT NOT NULL CHECK (verification_level IN (
        'BANK_VERIFIED_BALANCE',
        'VERIFIED_CONTRIBUTION',
        'CONFIRMED_EXTERNAL_TRANSFER',
        'SELF_REPORTED'
    )),
    confidence_score NUMERIC DEFAULT 1.0,
    plaid_transaction_id TEXT UNIQUE,
    counterpart_transaction_id TEXT,
    plaid_category TEXT,
    status TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('PENDING', 'POSTED', 'MODIFIED', 'REVERSED')),
    event_date DATE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_events_user_date ON public.financial_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_events_verification ON public.financial_events(user_id, verification_level);
CREATE INDEX IF NOT EXISTS idx_financial_events_plaid_id ON public.financial_events(plaid_transaction_id);

CREATE TABLE IF NOT EXISTS public.goal_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    bank_balance_id UUID REFERENCES public.bank_balances(id) ON DELETE CASCADE,
    allocated_amount NUMERIC NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    is_manual BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(goal_id, bank_balance_id)
);

CREATE INDEX IF NOT EXISTS idx_goal_allocations_user ON public.goal_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_goal ON public.goal_allocations(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_bank ON public.goal_allocations(bank_balance_id);

ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own financial events"
    ON public.financial_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial events"
    ON public.financial_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial events"
    ON public.financial_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial events"
    ON public.financial_events FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own goal allocations"
    ON public.goal_allocations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal allocations"
    ON public.goal_allocations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal allocations"
    ON public.goal_allocations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal allocations"
    ON public.goal_allocations FOR DELETE
    USING (auth.uid() = user_id);
