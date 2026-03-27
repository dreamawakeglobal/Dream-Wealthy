-- Run this inside your Supabase SQL Editor
-- This creates the missing columns that the Variable Expenses and manual trackers rely on to save!

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS target_category TEXT,
ADD COLUMN IF NOT EXISTS manual_spent NUMERIC;

ALTER TABLE income_streams 
ADD COLUMN IF NOT EXISTS manual_received NUMERIC;

-- CRITICAL: Force the Supabase REST API to instantly recognize the new columns 
-- Without this, it will silently ignore saves for up to 15 minutes!
NOTIFY pgrst, 'reload schema';
