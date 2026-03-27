-- Run this snippet inside of your Supabase SQL Editor
ALTER TABLE income_streams 
ADD COLUMN IF NOT EXISTS api_id TEXT;
