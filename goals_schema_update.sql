-- Run this inside your Supabase SQL Editor to support the new features built into the UI!
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS contribution_amount NUMERIC,
ADD COLUMN IF NOT EXISTS contribution_frequency TEXT,
ADD COLUMN IF NOT EXISTS track_auto BOOLEAN DEFAULT false;

-- CRITICAL: Force the REST API to instantly recognize the new columns!
NOTIFY pgrst, 'reload schema';
