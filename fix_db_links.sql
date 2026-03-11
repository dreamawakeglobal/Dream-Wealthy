-- Fix Foreign Key Constraints for the Plaid Database
-- Run this in your Supabase SQL Editor to correctly link your Bank Accounts to your current login session

-- 1. Fix Accounts Table User Reference
ALTER TABLE public.accounts 
  DROP CONSTRAINT IF EXISTS accounts_user_id_fkey,
  ADD CONSTRAINT accounts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- 2. Fix Transactions Table User Reference
ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
  ADD CONSTRAINT transactions_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- 3. Just to be safe, link Portfolios as well if it exists
ALTER TABLE IF EXISTS public.portfolios 
  DROP CONSTRAINT IF EXISTS portfolios_user_id_fkey,
  ADD CONSTRAINT portfolios_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
