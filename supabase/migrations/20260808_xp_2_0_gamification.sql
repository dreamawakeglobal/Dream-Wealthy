-- Migration: XP 2.0 Gamification Engine Tables
-- Description: Creates user_xp_history and user_badges for secure server-side XP tracking.

CREATE TABLE IF NOT EXISTS public.user_xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
    action_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_key TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_key)
);

-- Enable RLS
ALTER TABLE public.user_xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for user_xp_history
CREATE POLICY "Users can view their own XP history" ON public.user_xp_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP history" ON public.user_xp_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON public.user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);
