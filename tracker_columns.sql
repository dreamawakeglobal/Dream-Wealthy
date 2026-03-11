-- Add manual_received and manual_spent columns for auto-tracker
ALTER TABLE public.income_streams ADD COLUMN IF NOT EXISTS manual_received NUMERIC;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS manual_spent NUMERIC;
