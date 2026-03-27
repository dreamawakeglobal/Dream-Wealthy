-- Run this snippet inside of your Supabase SQL Editor
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS api_id TEXT;
