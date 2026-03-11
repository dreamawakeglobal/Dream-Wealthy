-- Enables Row Level Security (RLS) on all the tables that contain user data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_projections ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- Policies for 'profiles' table
-- -------------------------------------------------------------
CREATE POLICY "Users can only select their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own profile" ON profiles
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Policies for 'income_streams' table
-- -------------------------------------------------------------
CREATE POLICY "Users can only select their own income_streams" ON income_streams
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own income_streams" ON income_streams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own income_streams" ON income_streams
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own income_streams" ON income_streams
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Policies for 'expenses' table
-- -------------------------------------------------------------
CREATE POLICY "Users can only select their own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Policies for 'allocations' table
-- -------------------------------------------------------------
CREATE POLICY "Users can only select their own allocations" ON allocations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own allocations" ON allocations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own allocations" ON allocations
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own allocations" ON allocations
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Policies for 'debts' table
-- -------------------------------------------------------------
CREATE POLICY "Users can only select their own debts" ON debts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own debts" ON debts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own debts" ON debts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own debts" ON debts
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Policies for 'goals' table
-- -------------------------------------------------------------
CREATE POLICY "Users can only select their own goals" ON goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own goals" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own goals" ON goals
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own goals" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Policies for 'custom_projections' table
-- -------------------------------------------------------------
CREATE POLICY "Users can only select their own custom_projections" ON custom_projections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own custom_projections" ON custom_projections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own custom_projections" ON custom_projections
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own custom_projections" ON custom_projections
    FOR DELETE USING (auth.uid() = user_id);
