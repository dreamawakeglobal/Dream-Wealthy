-- Create the waitlist table
CREATE TABLE public.waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    referral_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts to the waitlist (public access for the landing page)
CREATE POLICY "Allow anonymous inserts into waitlist"
ON public.waitlist
FOR INSERT
TO anon
WITH CHECK (true);

-- Only authenticated admins or service roles can view the waitlist data
CREATE POLICY "Allow service role to select waitlist"
ON public.waitlist
FOR SELECT
TO service_role
USING (true);
