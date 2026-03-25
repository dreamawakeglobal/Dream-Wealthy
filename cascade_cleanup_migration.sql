-- Dream Wealthy: Production Prep (ON DELETE CASCADE)
-- Run this script in your Supabase SQL Editor BEFORE launching the Beta to prevent orphaned database rows.

-- 1. Income Streams
ALTER TABLE IF EXISTS public.income_streams
  DROP CONSTRAINT IF EXISTS income_streams_user_id_fkey,
  ADD CONSTRAINT income_streams_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Expenses
ALTER TABLE IF EXISTS public.expenses
  DROP CONSTRAINT IF EXISTS expenses_user_id_fkey,
  ADD CONSTRAINT expenses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Goals
ALTER TABLE IF EXISTS public.goals
  DROP CONSTRAINT IF EXISTS goals_user_id_fkey,
  ADD CONSTRAINT goals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Debts
ALTER TABLE IF EXISTS public.debts
  DROP CONSTRAINT IF EXISTS debts_user_id_fkey,
  ADD CONSTRAINT debts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Portfolios
ALTER TABLE IF EXISTS public.portfolios
  DROP CONSTRAINT IF EXISTS portfolios_user_id_fkey,
  ADD CONSTRAINT portfolios_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. AI Messages
ALTER TABLE IF EXISTS public.ai_messages
  DROP CONSTRAINT IF EXISTS ai_messages_user_id_fkey,
  ADD CONSTRAINT ai_messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
