-- ==============================================================================
-- DREAM WEALTHY - PRODUCTION HIGH-CONCURRENCY DATABASE INDICES & POOLING AUDIT
-- Date: 2026-09-01 (Milestone: Pre-Launch Production Readiness)
-- Purpose: Optimize database performance for 100–300 concurrent users, eliminate
--          full-table sequential scans, and index high-frequency multi-tenant queries.
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. USER PROFILES & AUTH LOOKUPS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- -----------------------------------------------------------------------------
-- 2. INCOME STREAMS & ALLOCATIONS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_income_streams_user_id ON public.income_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_income_streams_user_created ON public.income_streams(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_allocations_user_id ON public.allocations(user_id);

-- -----------------------------------------------------------------------------
-- 3. EXPENSES, BILLS & RECURRING SUBSCRIPTIONS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON public.expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, due_day);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, is_active);

-- -----------------------------------------------------------------------------
-- 4. DEBT DESTROYER (AVALANCHE / SNOWBALL AMORTIZATION)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_debts_user_id ON public.tracked_debts(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_debts_user_interest ON public.tracked_debts(user_id, interest_rate DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_debts_user_balance ON public.tracked_debts(user_id, balance ASC);
CREATE INDEX IF NOT EXISTS idx_debt_snowflakes_user_id ON public.debt_snowflakes(user_id);

-- -----------------------------------------------------------------------------
-- 5. PLAID ACCOUNTS & HIGH-VOLUME TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_item_id ON public.accounts(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_tx_id ON public.transaction_splits(transaction_id);

-- -----------------------------------------------------------------------------
-- 6. INVESTMENT PORTFOLIOS & ASSET HOLDINGS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_user_id ON public.investment_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_symbol ON public.investment_holdings(user_id, symbol);

-- -----------------------------------------------------------------------------
-- 7. FINANCIAL GOALS & MONTHLY PROJECTIONS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_projections_user_id ON public.projections(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_user_month ON public.monthly_snapshots(user_id, year, month);

-- -----------------------------------------------------------------------------
-- 8. AUDIT TRAILS & NOTIFICATION ALERTS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON public.audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON public.user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email, created_at DESC);

-- -----------------------------------------------------------------------------
-- 9. CONNECTION POOLING CONFIGURATION ADVISORY (PgBouncer / Transaction Mode)
-- -----------------------------------------------------------------------------
-- For high concurrency (>100 active connections):
-- 1. Use Supabase Port 6543 (Transaction Mode PgBouncer pooler).
-- 2. Ensure statement_timeout is configured defensively to prevent hanging transactions:
--    ALTER ROLE authenticated SET statement_timeout = '15s';
-- 3. Set idle_in_transaction_session_timeout to reclaim leaked connections:
--    ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '30s';
