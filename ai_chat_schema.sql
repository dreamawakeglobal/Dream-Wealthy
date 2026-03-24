-- ==========================================
-- AI FINANCIAL ADVISOR MEMORY SCHEMA
-- ==========================================
-- This table stores all bidirectional chat history between the user and the AI.
-- This gives the AI permanent conversational memory across sessions.

-- 1. Create the base table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'data')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add an index to rapidly query chronological chat history per user
CREATE INDEX IF NOT EXISTS ai_messages_user_id_created_at_idx ON public.ai_messages(user_id, created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can completely read their own chat history
CREATE POLICY "Users can view their own AI messages."
    ON public.ai_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can organically insert new messages into the chat memory
CREATE POLICY "Users can insert their own AI messages."
    ON public.ai_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- The backend Edge Function (using Service Role) inherently bypasses RLS,
-- but we lock down user access strictly to their own rows.

-- 5. Set up Realtime Tracking (Optional, useful if we want multi-client sync later)
alter publication supabase_realtime add table public.ai_messages;
