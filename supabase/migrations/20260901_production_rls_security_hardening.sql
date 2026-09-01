-- ==============================================================================
-- DREAM WEALTHY - PRODUCTION ROW LEVEL SECURITY (RLS) AUDIT & HARDENING
-- Date: 2026-09-01 (Milestone: Pre-Launch Production Readiness)
-- Purpose: Enforce strict multi-tenant isolation, prevent cross-tenant data leakage,
--          and secure public endpoints across all 19 application tables.
-- ==============================================================================

-- -------------------------------------------------------------
-- 1. USER PROFILES TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only select their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only delete their own profile" ON public.profiles;

CREATE POLICY "Users can only select their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 2. INCOME STREAMS TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.income_streams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only select their own income_streams" ON public.income_streams;
DROP POLICY IF EXISTS "Users can only insert their own income_streams" ON public.income_streams;
DROP POLICY IF EXISTS "Users can only update their own income_streams" ON public.income_streams;
DROP POLICY IF EXISTS "Users can only delete their own income_streams" ON public.income_streams;

CREATE POLICY "Users can only select their own income_streams" ON public.income_streams
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own income_streams" ON public.income_streams
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own income_streams" ON public.income_streams
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own income_streams" ON public.income_streams
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 3. EXPENSES TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only select their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can only insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can only update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can only delete their own expenses" ON public.expenses;

CREATE POLICY "Users can only select their own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 4. ALLOCATIONS TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only select their own allocations" ON public.allocations;
DROP POLICY IF EXISTS "Users can only insert their own allocations" ON public.allocations;
DROP POLICY IF EXISTS "Users can only update their own allocations" ON public.allocations;
DROP POLICY IF EXISTS "Users can only delete their own allocations" ON public.allocations;

CREATE POLICY "Users can only select their own allocations" ON public.allocations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own allocations" ON public.allocations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own allocations" ON public.allocations
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own allocations" ON public.allocations
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 5. DEBTS TABLE (Legacy)
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only select their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can only insert their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can only update their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can only delete their own debts" ON public.debts;

CREATE POLICY "Users can only select their own debts" ON public.debts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own debts" ON public.debts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own debts" ON public.debts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own debts" ON public.debts
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 6. TRACKED DEBTS TABLE (Debt Destroyer Engine)
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.tracked_debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own tracked debts" ON public.tracked_debts;
DROP POLICY IF EXISTS "Users can insert their own tracked debts" ON public.tracked_debts;
DROP POLICY IF EXISTS "Users can update their own tracked debts" ON public.tracked_debts;
DROP POLICY IF EXISTS "Users can delete their own tracked debts" ON public.tracked_debts;

CREATE POLICY "Users can view their own tracked debts" ON public.tracked_debts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tracked debts" ON public.tracked_debts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tracked debts" ON public.tracked_debts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tracked debts" ON public.tracked_debts
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 7. SAVINGS GOALS TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only select their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can only insert their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can only update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can only delete their own goals" ON public.goals;

CREATE POLICY "Users can only select their own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 8. CUSTOM PROJECTIONS TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.custom_projections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only select their own custom_projections" ON public.custom_projections;
DROP POLICY IF EXISTS "Users can only insert their own custom_projections" ON public.custom_projections;
DROP POLICY IF EXISTS "Users can only update their own custom_projections" ON public.custom_projections;
DROP POLICY IF EXISTS "Users can only delete their own custom_projections" ON public.custom_projections;

CREATE POLICY "Users can only select their own custom_projections" ON public.custom_projections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own custom_projections" ON public.custom_projections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own custom_projections" ON public.custom_projections
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own custom_projections" ON public.custom_projections
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 9. SUBSCRIPTIONS TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 10. PORTFOLIOS (Live Investment Assets)
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only view their own portfolio" ON public.portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolio" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolio" ON public.portfolios;

CREATE POLICY "Users can only view their own portfolio" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own portfolio" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolio" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolio" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 11. PLAID ACCOUNTS TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;

CREATE POLICY "Users can only view their own accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own accounts" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accounts" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own accounts" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 12. TRANSACTIONS TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can only view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can only delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 13. BANK BALANCES TABLE (Real-Time Cached Accounts)
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.bank_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own bank balances." ON public.bank_balances;
DROP POLICY IF EXISTS "Users can insert their own bank balances." ON public.bank_balances;
DROP POLICY IF EXISTS "Users can update their own bank balances." ON public.bank_balances;
DROP POLICY IF EXISTS "Users can delete their own bank balances." ON public.bank_balances;

CREATE POLICY "Users can view their own bank balances." ON public.bank_balances
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bank balances." ON public.bank_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank balances." ON public.bank_balances
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank balances." ON public.bank_balances
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 14. MONTHLY REPORTS TABLE
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.monthly_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own monthly reports" ON public.monthly_reports;
DROP POLICY IF EXISTS "Users can create their own monthly reports" ON public.monthly_reports;
DROP POLICY IF EXISTS "Users can update their own monthly reports" ON public.monthly_reports;
DROP POLICY IF EXISTS "Users can delete their own monthly reports" ON public.monthly_reports;

CREATE POLICY "Users can view their own monthly reports" ON public.monthly_reports
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own monthly reports" ON public.monthly_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monthly reports" ON public.monthly_reports
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own monthly reports" ON public.monthly_reports
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 15. AI CONVERSATION MESSAGES (AI Memory)
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own AI messages." ON public.ai_messages;
DROP POLICY IF EXISTS "Users can insert their own AI messages." ON public.ai_messages;
DROP POLICY IF EXISTS "Users can update their own AI messages." ON public.ai_messages;
DROP POLICY IF EXISTS "Users can delete their own AI messages." ON public.ai_messages;

CREATE POLICY "Users can view their own AI messages." ON public.ai_messages
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI messages." ON public.ai_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI messages." ON public.ai_messages
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 16. CACHED ASSET PRICES (Global Market Feed Cache)
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.cached_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read cached prices" ON public.cached_prices;

-- Public read, write restricted to service_role (Edge Functions)
CREATE POLICY "Anyone can read cached prices" ON public.cached_prices
    FOR SELECT USING (true);

-- -------------------------------------------------------------
-- 17. WAITLIST TABLE (Landing Page)
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous inserts into waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow service role to select waitlist" ON public.waitlist;

CREATE POLICY "Allow anonymous inserts into waitlist" ON public.waitlist
    FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow service role to select waitlist" ON public.waitlist
    FOR SELECT TO service_role USING (true);

-- -------------------------------------------------------------
-- 18. CONTACT MESSAGES TABLE (Support Form)
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public inserts on contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow service role to select contact_messages" ON public.contact_messages;

CREATE POLICY "Allow public inserts on contact_messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to select contact_messages" ON public.contact_messages
    FOR SELECT TO service_role USING (true);

-- -------------------------------------------------------------
-- 19. STORAGE BUCKET (Avatars)
-- -------------------------------------------------------------
CREATE POLICY "Avatars public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatars authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Avatars user update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);
CREATE POLICY "Avatars user delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);
