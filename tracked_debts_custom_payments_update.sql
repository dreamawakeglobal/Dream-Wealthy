-- Run this securely in the Supabase SQL Editor to support the new Tracked Debt custom override feature!
ALTER TABLE public.tracked_debts ADD COLUMN IF NOT EXISTS custom_payments JSONB DEFAULT '{}'::jsonb;
