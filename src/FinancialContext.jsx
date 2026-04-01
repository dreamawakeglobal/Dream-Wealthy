/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useStore } from './store';
import { supabase } from './supabaseClient';

const FinancialContext = createContext();

export const useFinancialContext = () => useContext(FinancialContext);

// --- INTELLIGENT NLP SEMANTIC MAPPER ---
// Mathematically routes generic human concepts ("Gas", "Uber", "Groceries") into rigid Plaid API taxonomies!
export const mapUserExpenseToPlaidCategory = (name) => {
    if (!name) return 'Uncategorized';
    const n = name.toLowerCase();

    // Isolated Pseudo-Categories specifically preventing Sub-Category bleeding!
    if (n === 'gas' || n === 'gas station' || n === 'fuel' || n === 'petrol') {
        return 'PSEUDO_GAS';
    }
    if (n === 'uber' || n === 'lyft' || n === 'ride share' || n === 'rideshare' || n === 'taxi') {
        return 'PSEUDO_RIDE_SHARE';
    }
    if (n === 'groceries' || n === 'grocery' || n === 'supermarket') {
        return 'PSEUDO_GROCERIES';
    }
    if (n.includes('hygiene') || n.includes('household') || n.includes('supplies') || n.includes('toiletr') || n.includes('cleaning')) {
        return 'PSEUDO_HYGIENE_HOUSEHOLD';
    }

    // Food & Dining (Excluding Groceries!)
    if (n.includes('food') || n.includes('din') || n.includes('restaurant') || n.includes('coffee') || n.includes('snack') || n.includes('drink')) {
        return 'FOOD_AND_DRINK';
    }
    // Transit & General Travel (Excluding Gas & Ride Shifts)
    if (n.includes('transit') || n.includes('car') || n.includes('auto') || n.includes('transport') || n.includes('flight') || n.includes('travel') || n.includes('train') || n.includes('bus')) {
        return 'TRANSPORTATION';
    }
    // Shopping & Retail
    if (n.includes('shop') || n.includes('amazon') || n.includes('cloth') || n.includes('retail') || n.includes('merch') || n.includes('supplies')) {
        return 'GENERAL_MERCHANDISE';
    }
    // Entertainment
    if (n.includes('fun') || n.includes('movie') || n.includes('concert') || n.includes('game') || n.includes('entertain') || n.includes('event')) {
        return 'ENTERTAINMENT';
    }
    // Personal Care
    if (n.includes('care') || n.includes('hair') || n.includes('salon') || n.includes('spa') || n.includes('health') || n.includes('gym')) {
        return 'PERSONAL_CARE';
    }
    // Home Improvement
    if (n.includes('home') || n.includes('house') || n.includes('hardware') || n.includes('furniture') || n.includes('repair')) {
        return 'HOME_IMPROVEMENT';
    }
    // Utilities & Bills
    if (n.includes('util') || n.includes('bill') || n.includes('electric') || n.includes('water') || n.includes('rent') || n.includes('internet')) {
        return 'RENT_AND_UTILITIES';
    }
    // Bank Fees
    if (n.includes('fee') || n.includes('bank') || n.includes('charge')) {
        return 'BANK_FEES';
    }

    return name; // If no AI match, fallback specifically to the user's explicit exact string!
};

export const FinancialProvider = ({ children }) => {
    const { user } = useAuth();

    // Bind Zustand Store to Context to prevent breaking 15 existing pages
    const store = useStore();
    const [plaidBalances, setPlaidBalances] = useState({ checking: 0, savings: 0, total: 0 });

    const forcePlaidRefresh = useCallback(async () => {
        if (!user) return false;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return false;
            
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/force-plaid-refresh`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            return res.ok;
        } catch (e) {
            console.error("Force Plaid Refresh Error:", e);
            return false;
        }
    }, [user]);

    const forceSyncPlaid = useCallback(async () => {
        if (!user) return false;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return false;
            
            return new Promise((resolve) => {
                const syncTransactionsPaginated = async () => {
                    const resTx = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-plaid-transactions`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    });

                    const txData = await resTx.json();
                    
                    if (!resTx.ok) {
                        console.error("SUPABASE EDGE NODE ERROR PING:", txData.error || txData);
                        resolve(false);
                        return;
                    }

                    if (resTx.ok && !txData.error && txData.synced) {
                        if (txData.synced.added > 0 || txData.synced.modified > 0 || txData.synced.removed > 0) {
                            console.log(`Manual Plaid Sync Executed: Extracted ${txData.synced.added} unseen transactions natively!`);
                            store.fetchAllData(); 
                        }

                        if (txData.synced.has_more) {
                            setTimeout(syncTransactionsPaginated, 1500);
                        } else {
                            resolve(true);
                        }
                    } else {
                        resolve(false);
                    }
                };
                syncTransactionsPaginated();
            });
        } catch (e) {
            console.error("Manual Plaid Sync Error:", e);
            return false;
        }
    }, [user, store]);

    // Tie Auth State to Zustand and Plaid
    useEffect(() => {
        store.setUser(user);
        if (user) {
            store.fetchAllData();
            
            const fetchPlaid = async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;
                    
                    // 1. Fetch live checking/savings balances
                    const resAccounts = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-plaid-accounts`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    });
                    
                    const accountData = await resAccounts.json();
                    if (resAccounts.ok && !accountData.error) {
                        setPlaidBalances(accountData);
                    }

                    // 2. Automatically sync transactions
                    forceSyncPlaid();

                } catch (e) {
                    console.error("Plaid Boot Sync Error:", e);
                }
            };
            
            fetchPlaid();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, store.setUser, store.fetchAllData]);

    // Derived Calculations preserved for legacy support
    const totalMonthlyIncome = useMemo(() => {
        return store.currentIncome.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    }, [store.currentIncome]);

    const totalFixedExpenses = useMemo(() => {
        return store.fixedExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    }, [store.fixedExpenses]);

    const totalVariableExpenses = useMemo(() => {
        return store.variableExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    }, [store.variableExpenses]);

    // --- RULES ENGINE: Auto-Categorize Plaid Transactions strictly within the Current Month ---
    const transactionsByCategory = useMemo(() => {
        if (!store.transactions || store.transactions.length === 0) return {};

        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();

        return store.transactions.reduce((acc, tx) => {
            // Only sum up expenses (positive Plaid amounts). Negative amounts are income/refunds.
            if (tx.amount > 0 && !tx.pending) {
                const txDate = new Date(tx.date);
                if (txDate.getMonth() === currentM && txDate.getFullYear() === currentY) {
                    const isManual = tx.category && tx.category.endsWith(' ');
                    const category = tx.category ? tx.category.trim() : 'Uncategorized';
                    const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
                    
                    // 1. Standard Macro Category aggregation
                    acc[category] = (acc[category] || 0) + tx.amount;

                    if (!isManual) {
                        // 2. Virtual Pseudo-Category: GASOLINE (Isolates from Transportation!)
                        if (merchant.includes('exxon') || merchant.includes('shell') || merchant.includes('chevron') || merchant.includes('wawa') || merchant.includes('bp ') || merchant.includes('sunoco') || merchant.includes('speedway') || merchant.includes('quik') || merchant.includes('pilot') || merchant.includes('gas') || merchant.includes('fuel')) {
                            acc['PSEUDO_GAS'] = (acc['PSEUDO_GAS'] || 0) + tx.amount;
                        }

                        // 3. Virtual Pseudo-Category: RIDE SHARING (Isolates from Transportation!)
                        if (merchant.includes('uber') || merchant.includes('lyft') || merchant.includes('taxi') || merchant.includes('cab')) {
                            acc['PSEUDO_RIDE_SHARE'] = (acc['PSEUDO_RIDE_SHARE'] || 0) + tx.amount;
                        }

                        // 4. Virtual Pseudo-Category: GROCERIES (Isolates from Food & Drink!)
                        if (merchant.includes('walmart') || merchant.includes('kroger') || merchant.includes('target') || merchant.includes('publix') || merchant.includes('safeway') || merchant.includes('trader joe') || merchant.includes('whole food') || merchant.includes('aldi') || merchant.includes('wegmans') || merchant.includes('h-e-b') || merchant.includes('meijer') || merchant.includes('food lion') || merchant.includes('costco') || merchant.includes('sam\'s club') || merchant.includes('bjs') || merchant.includes('grocery') || merchant.includes('supermarket')) {
                            acc['PSEUDO_GROCERIES'] = (acc['PSEUDO_GROCERIES'] || 0) + tx.amount;
                        }

                        // 5. Virtual Pseudo-Category: HYGIENE & HOUSEHOLD
                        if (merchant.includes('cvs') || merchant.includes('walgreens') || merchant.includes('rite aid') || merchant.includes('sephora') || merchant.includes('ulta') || merchant.includes('bath & body') || merchant.includes('home depot') || merchant.includes('lowe\'s') || merchant.includes('ace hardware') || merchant.includes('ikea') || merchant.includes('bed bath') || merchant.includes('pharmacy') || merchant.includes('drugstore') || merchant.includes('sally beauty') || merchant.includes('mac cosmetics')) {
                            acc['PSEUDO_HYGIENE_HOUSEHOLD'] = (acc['PSEUDO_HYGIENE_HOUSEHOLD'] || 0) + tx.amount;
                        }
                    }
                }
            }
            return acc;
        }, {});
    }, [store.transactions]);

    const incomeTransactionsByCategory = useMemo(() => {
        if (!store.transactions || store.transactions.length === 0) return {};

        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();

        return store.transactions.reduce((acc, tx) => {
            // Only sum up income (negative Plaid amounts).
            if (tx.amount < 0 && !tx.pending) {
                const txDate = new Date(tx.date);
                const fortyDaysAgo = new Date();
                fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
                if (txDate >= fortyDaysAgo) {
                    const category = tx.category ? tx.category.trim() : 'Uncategorized';
                    // Plaid returns income as negative, so we use Math.abs() to make it positive for our tracker UI
                    acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
                }
            }
            return acc;
        }, {});
    }, [store.transactions]);

    const totalSubscriptionCost = (store.subscriptions || []).reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
    const totalTrackedMonthlyPayments = (store.trackedDebts || []).reduce((sum, d) => sum + (Number(d.minimumPayment) || 0), 0);

    const totalMonthlyExpenses = totalFixedExpenses + totalVariableExpenses + totalSubscriptionCost + totalTrackedMonthlyPayments;
    const netMonthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses;

    const savingsRate = totalMonthlyIncome > 0
        ? ((netMonthlyCashFlow / totalMonthlyIncome) * 100).toFixed(1)
        : 0;

    const get12MonthProjection = () => {
        return netMonthlyCashFlow * 12;
    };

    const getProjectionData = (totalMonths = 12, startMonthIndex = new Date().getMonth()) => {
        let income = Number(totalMonthlyIncome);
        let expenses = Number(totalMonthlyExpenses);
        let cumulative = Number(store.profileData.startingSavings) || 0;
        const data = [];
        const monthlyIncomeGrowth = 0; // Fixed at 0%
        const monthlyExpenseInflation = 0; // Fixed at 0%

        let currentMonthIndex = startMonthIndex;

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        for (let month = 1; month <= totalMonths; month++) {
            const displayMonth = `${monthNames[currentMonthIndex]}`;
            const monthOverrides = store.profileData.cellOverrides[month - 1] || {};

            const actualIncome = monthOverrides.Income !== undefined ? Number(monthOverrides.Income) : income;
            const actualExpenses = monthOverrides.Expenses !== undefined ? Number(monthOverrides.Expenses) : expenses;

            let monthExtraExpenses = 0;
            const actualExtraData = {};

            store.profileData.extraColumns.forEach(c => {
                const actualExtra = monthOverrides[c.name] !== undefined ? Number(monthOverrides[c.name]) : Number(c.amount || 0);
                monthExtraExpenses += actualExtra;
                actualExtraData[c.name] = actualExtra;
            });

            let net = actualIncome - actualExpenses - monthExtraExpenses;
            cumulative += net;

            data.push({
                monthIndex: month - 1,
                month: displayMonth,
                Income: Math.round(actualIncome),
                Expenses: Math.round(actualExpenses),
                ...actualExtraData,
                Net: Math.round(net),
                Cumulative: Math.round(cumulative)
            });

            income *= (1 + monthlyIncomeGrowth);
            expenses *= (1 + monthlyExpenseInflation);

            currentMonthIndex++;
            if (currentMonthIndex > 11) {
                currentMonthIndex = 0;
            }
        }

        return data;
    };

    const value = {
        ...store,
        plaidBalances,
        // Legacy flat profile data bindings
        startingSavings: store.profileData.startingSavings,
        incomeGrowthRate: store.profileData.incomeGrowthRate,
        expenseInflationRate: store.profileData.expenseInflationRate,
        cellOverrides: store.profileData.cellOverrides,
        extraColumns: store.profileData.extraColumns,

        // Derived state
        totalMonthlyIncome,
        totalBiMonthlyIncome: (totalMonthlyIncome * 12) / 26,
        totalFixedExpenses,
        totalVariableExpenses,
        totalSubscriptionCost,
        totalTrackedMonthlyPayments,
        totalMonthlyExpenses,
        netMonthlyCashFlow,
        savingsRate,
        get12MonthProjection,
        getProjectionData,

        // Auto-Categorized Data for UI
        transactionsByCategory,
        incomeTransactionsByCategory,
        transactions: store.transactions,
        mapUserExpenseToPlaidCategory,

        // Monthly Debt Tracker
        trackedDebts: store.trackedDebts,
        setTrackedDebts: store.setTrackedDebts,

        // Subscriptions
        subscriptions: store.subscriptions,
        setSubscriptions: store.setSubscriptions,

        // Plaid Sync
        forceSyncPlaid,
        forcePlaidRefresh
    };

    return (
        <FinancialContext.Provider value={value}>
            {children}
        </FinancialContext.Provider>
    );
};
