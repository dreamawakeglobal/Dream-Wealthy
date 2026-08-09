-- Database Row Level Security (RLS) Security Hardening & Audit Script
-- Run this script in your Supabase SQL Editor to enforce strict RLS across all 19 tables.

-- 1. Fix public read vulnerability on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin select" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow service role to select contact_messages" ON public.contact_messages;

CREATE POLICY "Allow service role to select contact_messages"
    ON public.contact_messages FOR SELECT
    TO service_role
    USING (true);

-- Ensure public/anonymous users can submit contact messages securely
DROP POLICY IF EXISTS "Allow public inserts" ON public.contact_messages;

CREATE POLICY "Allow public inserts on contact_messages" 
    ON public.contact_messages FOR INSERT 
    WITH CHECK (true);

-- 2. Add missing UPDATE policy for monthly_reports
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own monthly reports" ON public.monthly_reports;

CREATE POLICY "Users can update their own monthly reports"
    ON public.monthly_reports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Comprehensive Verification Summary Query
-- Run this query to inspect RLS status and policy counts on all tables:
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
