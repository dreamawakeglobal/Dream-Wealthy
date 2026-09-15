-- Migration: Add due_date and cadence to subscriptions table if not exists
ALTER TABLE IF EXISTS public.subscriptions ADD COLUMN IF NOT EXISTS due_date INTEGER;
ALTER TABLE IF EXISTS public.subscriptions ADD COLUMN IF NOT EXISTS cadence TEXT DEFAULT 'Monthly';
ALTER TABLE IF EXISTS public.subscriptions ADD COLUMN IF NOT EXISTS domain TEXT;
