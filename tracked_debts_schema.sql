-- Dream Wealthy: Monthly Debt Tracker Schema
-- Run this in your Supabase SQL Editor

-- 1. Create the tracked_debts table
CREATE TABLE IF NOT EXISTS public.tracked_debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Credit Card',
    balance NUMERIC NOT NULL DEFAULT 0,
    interest_rate NUMERIC NOT NULL DEFAULT 0,
    minimum_payment NUMERIC NOT NULL DEFAULT 0,
    due_date TEXT,
    is_paid BOOLEAN DEFAULT false,
    paid_circles JSONB DEFAULT '[]'::jsonb,
    extra_payment NUMERIC DEFAULT 0,
    down_payment NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.tracked_debts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies so users can only see and edit their own debts
CREATE POLICY "Users can view their own tracked debts" 
ON public.tracked_debts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracked debts" 
ON public.tracked_debts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked debts" 
ON public.tracked_debts FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked debts" 
ON public.tracked_debts FOR DELETE 
USING (auth.uid() = user_id);

-- 4. If you already ran this previously, run this ALTER to add the down payment column
-- ALTER TABLE public.tracked_debts ADD COLUMN IF NOT EXISTS down_payment NUMERIC DEFAULT 0;
