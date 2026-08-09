-- Create the contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending'
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert messages (so anyone can submit the form)
CREATE POLICY "Allow public inserts" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- Only allow service role (admin) to view messages
CREATE POLICY "Allow service role to select contact_messages" ON public.contact_messages
    FOR SELECT TO service_role USING (true);
