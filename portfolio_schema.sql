-- Portfolio Schema for Dream Wealthy
-- Phase 3: The Wealth Builder — Live Assets
-- Run this in your Supabase SQL Editor

-- Drop old tables if they exist (Phase 1 had a different schema with 'ticket' instead of 'symbol')
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.cached_prices CASCADE;

-- 1. Create the Portfolios Table (User Investment Holdings)
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    asset_class TEXT NOT NULL DEFAULT 'Stocks',  -- 'Stocks', 'Crypto', 'Commodities'
    quantity NUMERIC NOT NULL DEFAULT 0,
    avg_price NUMERIC NOT NULL DEFAULT 0,
    api_id TEXT,  -- CoinGecko API ID for crypto lookups (null for stocks/commodities)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent duplicate holdings per user+symbol
CREATE UNIQUE INDEX IF NOT EXISTS portfolios_user_symbol_unique ON public.portfolios (user_id, symbol);

-- Enable RLS for Portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own portfolio" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own portfolio" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolio" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolio" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);


-- 2. (Optional) Create the Cached Prices Table for future API caching
-- This table will be populated by the cache-prices Edge Function once the Finnhub paid tier is active.
CREATE TABLE IF NOT EXISTS public.cached_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    asset_class TEXT NOT NULL DEFAULT 'Stocks',
    price NUMERIC NOT NULL DEFAULT 0,
    change_percent NUMERIC DEFAULT 0,
    api_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cached prices are globally readable (no user_id restriction needed)
ALTER TABLE public.cached_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cached prices" ON public.cached_prices FOR SELECT USING (true);
-- Only service role (Edge Functions) can write to cached_prices
-- No INSERT/UPDATE/DELETE policies for regular users
