import { create } from 'zustand';
import { supabase } from './supabaseClient';

// Helper to format DB snake_case to frontend camelCase
const mapToCamel = (item) => {
    const mapped = { ...item };
    if (mapped.target_amount !== undefined) { mapped.targetAmount = mapped.target_amount; delete mapped.target_amount; }
    if (mapped.current_amount !== undefined) { mapped.currentAmount = mapped.current_amount; delete mapped.current_amount; }
    if (mapped.monthly_contribution !== undefined) { mapped.monthlyContribution = mapped.monthly_contribution; delete mapped.monthly_contribution; }
    if (mapped.annual_return_rate !== undefined) { mapped.annualReturnRate = mapped.annual_return_rate; delete mapped.annual_return_rate; }
    if (mapped.interest_rate !== undefined) { mapped.interestRate = mapped.interest_rate; delete mapped.interest_rate; }
    if (mapped.minimum_payment !== undefined) { mapped.minimumPayment = mapped.minimum_payment; delete mapped.minimum_payment; }
    if (mapped.avg_price !== undefined) { mapped.avgPrice = mapped.avg_price; delete mapped.avg_price; }
    if (mapped.api_id !== undefined) { mapped.apiId = mapped.api_id; delete mapped.api_id; }
    if (mapped.asset_class !== undefined) { mapped.assetClass = mapped.asset_class; delete mapped.asset_class; }

    // Auto-Tracker Fields
    if (mapped.target_category !== undefined) { mapped.targetCategory = mapped.target_category; delete mapped.target_category; }
    if (mapped.manual_received !== undefined) { mapped.manualReceived = mapped.manual_received; delete mapped.manual_received; }
    if (mapped.manual_spent !== undefined) { mapped.manualSpent = mapped.manual_spent; delete mapped.manual_spent; }

    // Tracked Debt Fields
    if (mapped.is_paid !== undefined) { mapped.isPaid = mapped.is_paid; delete mapped.is_paid; }
    if (mapped.paid_circles !== undefined) { mapped.paidCircles = mapped.paid_circles; delete mapped.paid_circles; }
    if (mapped.extra_payment !== undefined) { mapped.extraPayment = mapped.extra_payment; delete mapped.extra_payment; }
    if (mapped.down_payment !== undefined) { mapped.downPayment = mapped.down_payment; delete mapped.down_payment; }
    if (mapped.due_date !== undefined) { mapped.dueDate = mapped.due_date; delete mapped.due_date; }

    return mapped;
};

// Helper to format frontend camelCase to DB snake_case
const mapToSnake = (item) => {
    const snakeItem = { ...item };

    // Discard volatile/locally fetched API attributes so they aren't incorrectly pushed to the Postgres schema
    if (snakeItem.price !== undefined) delete snakeItem.price;
    if (snakeItem.change !== undefined) delete snakeItem.change;

    if (snakeItem.targetAmount !== undefined) { snakeItem.target_amount = snakeItem.targetAmount; delete snakeItem.targetAmount; }
    if (snakeItem.currentAmount !== undefined) { snakeItem.current_amount = snakeItem.currentAmount; delete snakeItem.currentAmount; }
    if (snakeItem.monthlyContribution !== undefined) { snakeItem.monthly_contribution = snakeItem.monthlyContribution; delete snakeItem.monthlyContribution; }
    if (snakeItem.annualReturnRate !== undefined) { snakeItem.annual_return_rate = snakeItem.annualReturnRate; delete snakeItem.annualReturnRate; }
    if (snakeItem.interestRate !== undefined) { snakeItem.interest_rate = snakeItem.interestRate; delete snakeItem.interestRate; }
    if (snakeItem.minimumPayment !== undefined) { snakeItem.minimum_payment = snakeItem.minimumPayment; delete snakeItem.minimumPayment; }
    if (snakeItem.avgPrice !== undefined) { snakeItem.avg_price = snakeItem.avgPrice; delete snakeItem.avgPrice; }
    if (snakeItem.apiId !== undefined) { snakeItem.api_id = snakeItem.apiId; delete snakeItem.apiId; }
    if (snakeItem.assetClass !== undefined) { snakeItem.asset_class = snakeItem.assetClass; delete snakeItem.assetClass; }

    // Auto-Tracker Fields
    if (snakeItem.targetCategory !== undefined) { snakeItem.target_category = snakeItem.targetCategory; delete snakeItem.targetCategory; }
    if (snakeItem.manualReceived !== undefined) { snakeItem.manual_received = snakeItem.manualReceived; delete snakeItem.manualReceived; }
    if (snakeItem.manualSpent !== undefined) { snakeItem.manual_spent = snakeItem.manualSpent; delete snakeItem.manualSpent; }

    // Tracked Debt Fields
    if (snakeItem.isPaid !== undefined) { snakeItem.is_paid = snakeItem.isPaid; delete snakeItem.isPaid; }
    if (snakeItem.paidCircles !== undefined) { snakeItem.paid_circles = snakeItem.paidCircles; delete snakeItem.paidCircles; }
    if (snakeItem.extraPayment !== undefined) { snakeItem.extra_payment = snakeItem.extraPayment; delete snakeItem.extraPayment; }
    if (snakeItem.downPayment !== undefined) { snakeItem.down_payment = snakeItem.downPayment; delete snakeItem.downPayment; }
    if (snakeItem.dueDate !== undefined) { snakeItem.due_date = snakeItem.dueDate; delete snakeItem.dueDate; }

    return snakeItem;
}

export const useStore = create((set, get) => ({
    // Auth State
    user: null,
    setUser: (user) => set({ user }),

    // Financial Collections
    currentIncome: [],
    futureIncome: [],
    fixedExpenses: [],
    variableExpenses: [],
    allocations: [],
    debts: [],
    trackedDebts: [],
    goals: [],
    customProjections: [],
    transactions: [], // Plaid Database Cache
    portfolio: [],     // User Investment Holdings
    subscriptions: [],

    // Profile Settings
    profileData: {
        startingSavings: 0,
        incomeGrowthRate: 0,
        expenseInflationRate: 0,
        cellOverrides: {},
        extraColumns: [],
        subscriptionTier: 'none'
    },

    // 1. Initial Load Action
    fetchAllData: async () => {
        const { user } = get();
        if (!user) return;

        try {
            // Run all heavy initial Supabase queries in parallel
            const [
                profileRes,
                incomeRes,
                expensesRes,
                allocationsRes,
                debtsRes,
                trackedDebtsRes,
                goalsRes,
                projectionsRes,
                transactionsRes,
                portfolioRes,
                subscriptionsRes
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('user_id', user.id).single(),
                supabase.from('income_streams').select('*').eq('user_id', user.id),
                supabase.from('expenses').select('*').eq('user_id', user.id),
                supabase.from('allocations').select('*').eq('user_id', user.id),
                supabase.from('debts').select('*').eq('user_id', user.id),
                supabase.from('tracked_debts').select('*').eq('user_id', user.id),
                supabase.from('goals').select('*').eq('user_id', user.id),
                supabase.from('custom_projections').select('*').eq('user_id', user.id),
                supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
                supabase.from('portfolios').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
                supabase.from('subscriptions').select('*').eq('user_id', user.id)
            ]);

            const newProfileData = profileRes.data ? {
                startingSavings: profileRes.data.starting_savings ?? 0,
                incomeGrowthRate: profileRes.data.income_growth_rate ?? 0,
                expenseInflationRate: profileRes.data.expense_inflation_rate ?? 0,
                cellOverrides: profileRes.data.cell_overrides?.overrides || {},
                extraColumns: profileRes.data.cell_overrides?.extraColumns || [],
                dismissedNotifications: profileRes.data.cell_overrides?.dismissedNotifications || [],
                subscriptionTier: profileRes.data.subscription_tier || 'none'
            } : get().profileData;

            set({
                profileData: newProfileData,
                currentIncome: (incomeRes.data || []).filter(i => !i.is_future).map(mapToCamel),
                futureIncome: (incomeRes.data || []).filter(i => i.is_future).map(mapToCamel),
                fixedExpenses: (expensesRes.data || []).filter(e => !e.is_variable).map(mapToCamel),
                variableExpenses: (expensesRes.data || []).filter(e => e.is_variable).map(mapToCamel),
                allocations: (allocationsRes.data || []).map(mapToCamel),
                debts: (debtsRes.data || []).map(mapToCamel),
                trackedDebts: (trackedDebtsRes.data || []).map(mapToCamel),
                goals: (goalsRes.data || []).map(mapToCamel),
                customProjections: (projectionsRes.data || []).map(mapToCamel),
                transactions: (transactionsRes.data || []),
                portfolio: (portfolioRes.data || []).map(mapToCamel),
                subscriptions: (subscriptionsRes.data || []).map(mapToCamel)
            });

            if (transactionsRes.error) {
                alert("SUPABASE RLS SYSTEM ERROR: " + JSON.stringify(transactionsRes.error));
            }
        } catch (err) {
            console.error("Zustand fetchAllData failed:", err);
        }
    },

    // 2. Generic Collection Setter with Async Supabase Syncing built-in
    setCollection: async (collectionKey, tableName, matchConditions, newDataOrFn) => {
        const { user } = get();
        const prevData = get()[collectionKey] || [];
        const newData = typeof newDataOrFn === 'function' ? newDataOrFn(prevData) : newDataOrFn;

        // Instant UI update
        set({ [collectionKey]: newData });

        if (!user) return; // Fallback

        // Async Sync to Supabase in the background
        const oldIds = new Set(prevData.map(i => String(i.id)));
        const newIds = new Set(newData.map(i => String(i.id)));

        const deletedIds = prevData.map(i => String(i.id)).filter(id => !newIds.has(id));
        const addedItems = newData.filter(i => !oldIds.has(String(i.id)));
        const updatedItems = newData.filter(newItem => {
            const oldItem = prevData.find(i => String(i.id) === String(newItem.id));
            return oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem);
        });

        if (deletedIds.length > 0) {
            const validIds = deletedIds.filter(id => id.length > 20);
            if (validIds.length > 0) supabase.from(tableName).delete().in('id', validIds).then();
        }

        if (addedItems.length > 0) {
            let needsRefetch = false;
            const inserts = addedItems.map(item => {
                const { id, ...rest } = mapToSnake(item);
                const payload = { ...rest, ...matchConditions, user_id: user.id };
                if (String(id).length < 20) { needsRefetch = true; return payload; }
                return { ...payload, id };
            });

            const { data: fresh } = await supabase.from(tableName).insert(inserts).select();
            if (needsRefetch && fresh) {
                // Background refetch to tie UUIDs back to UI state cleanly
                let refetchQ = supabase.from(tableName).select('*').eq('user_id', user.id);
                for (const [k, v] of Object.entries(matchConditions)) refetchQ = refetchQ.eq(k, v);
                const { data: fullFresh } = await refetchQ.order('created_at', { ascending: true });
                if (fullFresh) set({ [collectionKey]: fullFresh.map(mapToCamel) });
            }
        }

        if (updatedItems.length > 0) {
            updatedItems.forEach(item => {
                if (String(item.id).length > 20) {
                    const { id, created_at: _c, user_id: _u, ...rest } = mapToSnake(item);
                    supabase.from(tableName).update(rest).eq('id', id).then();
                }
            });
        }
    },

    // 3. Specific Bound Setters for the entire App to consume effortlessly
    setCurrentIncome: (data) => get().setCollection('currentIncome', 'income_streams', { is_future: false }, data),
    setFutureIncome: (data) => get().setCollection('futureIncome', 'income_streams', { is_future: true }, data),
    setFixedExpenses: (data) => get().setCollection('fixedExpenses', 'expenses', { is_variable: false }, data),
    setVariableExpenses: (data) => get().setCollection('variableExpenses', 'expenses', { is_variable: true }, data),
    setAllocations: (data) => get().setCollection('allocations', 'allocations', {}, data),
    setDebts: (data) => get().setCollection('debts', 'debts', {}, data),
    setTrackedDebts: (data) => get().setCollection('trackedDebts', 'tracked_debts', {}, data),
    setGoals: (data) => get().setCollection('goals', 'goals', {}, data),
    setCustomProjections: (data) => get().setCollection('customProjections', 'custom_projections', {}, data),
    setPortfolio: (data) => get().setCollection('portfolio', 'portfolios', {}, data),
    setSubscriptions: (data) => get().setCollection('subscriptions', 'subscriptions', {}, data),

    // Profile Modifiers
    updateProfileField: async (key, newValueOrFn) => {
        const { user, profileData } = get();
        const newValue = typeof newValueOrFn === 'function' ? newValueOrFn(profileData[key]) : newValueOrFn;

        // Instant UI Update
        const newProfile = { ...profileData, [key]: newValue };
        set({ profileData: newProfile });

        if (user) {
            let column = '';
            let valToSave = newValue;
            if (key === 'startingSavings') column = 'starting_savings';
            if (key === 'incomeGrowthRate') column = 'income_growth_rate';
            if (key === 'expenseInflationRate') column = 'expense_inflation_rate';
            if (key === 'cellOverrides' || key === 'extraColumns' || key === 'dismissedNotifications') {
                column = 'cell_overrides';
                valToSave = {
                    overrides: key === 'cellOverrides' ? newValue : profileData.cellOverrides,
                    extraColumns: key === 'extraColumns' ? newValue : profileData.extraColumns,
                    dismissedNotifications: key === 'dismissedNotifications' ? newValue : profileData.dismissedNotifications
                };
            }
            if (column) {
                supabase.from('profiles').upsert({ user_id: user.id, [column]: valToSave }, { onConflict: 'user_id' }).then();
            }
        }
    },

    setStartingSavings: (val) => get().updateProfileField('startingSavings', val),
    setIncomeGrowthRate: (val) => get().updateProfileField('incomeGrowthRate', val),
    setExpenseInflationRate: (val) => get().updateProfileField('expenseInflationRate', val),
    setCellOverrides: (val) => get().updateProfileField('cellOverrides', val),
    setExtraColumns: (val) => get().updateProfileField('extraColumns', val),
}));
