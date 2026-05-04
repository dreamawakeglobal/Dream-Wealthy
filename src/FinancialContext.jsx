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
    if (n.includes('subscription') || n.includes('streaming') || n.includes('membership')) {
        return 'PSEUDO_SUBSCRIPTIONS';
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
    const bankBalances = useStore(state => state.bankBalances) || [];
    
    // Database-First: Natively calculate checking and savings directly from the Supabase Cache!
    const plaidBalances = useMemo(() => {
        let checking = 0;
        let savings = 0;
        bankBalances.forEach(acc => {
            const bal = acc.available_balance !== null ? acc.available_balance : acc.current_balance || 0;
            if (acc.subtype === 'checking') checking += Number(bal);
            else if (acc.subtype === 'savings') savings += Number(bal);
        });
        return { checking, savings, total: checking + savings };
    }, [bankBalances]);

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
                        const errorMsg = typeof txData === 'object' ? (txData.error || JSON.stringify(txData)) : txData;
                        console.error("SUPABASE EDGE NODE ERROR PING:", errorMsg);
                        alert(`CRITICAL EDGE CRASH: ${errorMsg}`);
                        resolve(false);
                        return;
                    }

                    if (resTx.ok && !txData.error && txData.synced) {
                        if (txData.synced.added > 0 || txData.synced.modified > 0 || txData.synced.removed > 0) {
                            // Sync Executed silently
                        }
                        // GUBUR: A critical fix. We MUST refresh all DOM data completely decoupled from transactions!
                        // Even if 0 transactions occurred, Bank Balances mathematically drift on their own. We must capture the state.
                        store.fetchAllData(); 

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
            // Database-First Architecture: Plaid data is now instantly pulled through store.fetchAllData()
            
            // --- 4-Hour Automated Background Synchronizer ---
            // Natively executes the exact same process as the 'Instant Force Sync' button every 4 hours!
            const lastSyncKey = `last_auto_sync_${user.id}`;
            const lastSync = localStorage.getItem(lastSyncKey);
            const now = new Date().getTime();
            const fourHours = 4 * 60 * 60 * 1000;
            
            if (!lastSync || (now - Number(lastSync) > fourHours)) {
                // Defensively delay by 2 seconds to prioritize instantaneous UI mounting and Dashboard animations
                setTimeout(async () => {
                    const success = await forceSyncPlaid();
                    if (success) {
                        localStorage.setItem(lastSyncKey, now.toString());
                    }
                }, 2000);
            }
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

    const processedTransactions = useMemo(() => {
        if (!store.transactions) return [];
        let txs = [...store.transactions];
        const splits = store.profileData?.transactionSplits || [];
        
        for (let splitConfig of splits) {
            const idx = txs.findIndex(t => String(t.id) === String(splitConfig.originalTxId));
            if (idx !== -1) {
                const originalTx = txs[idx];
                txs.splice(idx, 1); // Remove original
                splitConfig.splits.forEach(s => {
                    txs.push({
                        ...originalTx,
                        id: s.id, 
                        amount: Number(s.amount), 
                        category: (s.category || originalTx.category).trim() + ' ', // Trailing space forces isManual true!
                        merchant_name: s.merchant || originalTx.merchant_name,
                        name: s.merchant || originalTx.name,
                        isSplitChild: true,
                        originalTxId: originalTx.id,
                        originalAmount: originalTx.amount
                    });
                });
            }
        }
        return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [store.transactions, store.profileData.transactionSplits]);

    // --- RULES ENGINE: Auto-Categorize Plaid Transactions strictly within the Current Month ---
    const transactionsByCategory = useMemo(() => {
        if (!processedTransactions || processedTransactions.length === 0) return {};

        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();

        return processedTransactions.reduce((acc, tx) => {
            // Only sum up expenses (positive Plaid amounts). Negative amounts are income/refunds.
            if (tx.amount > 0 && tx.date) {
                const [y, m, d] = tx.date.split('-');
                if (parseInt(y) === currentY && parseInt(m) - 1 === currentM) {
                    const catLower = (tx.category || '').toLowerCase();
                    const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
                    if (catLower.includes('transfer') || merchant.includes('transfer') || merchant.includes('sofi money')) return acc;

                    const isManual = tx.category && tx.category.endsWith(' ');
                    const category = tx.category ? tx.category.trim() : 'Uncategorized';
                    
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

                        // 6. Virtual Pseudo-Category: SUBSCRIPTIONS
                        if (merchant.includes('netflix') || merchant.includes('spotify') || merchant.includes('hulu') || merchant.includes('disney+') || merchant.includes('apple') || merchant.includes('amazon prime') || merchant.includes('hbomax') || merchant.includes('peacock') || merchant.includes('paramount') || merchant.includes('gym')) {
                            acc['PSEUDO_SUBSCRIPTIONS'] = (acc['PSEUDO_SUBSCRIPTIONS'] || 0) + tx.amount;
                        }
                    }
                }
            }
            return acc;
        }, {});
    }, [processedTransactions]);

    const incomeTransactionsByCategory = useMemo(() => {
        if (!processedTransactions || processedTransactions.length === 0) return {};

        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();

        return processedTransactions.reduce((acc, tx) => {
            // Only sum up income (negative Plaid amounts). We want to include pending checks too!
            if (tx.amount < 0 && tx.date) {
                const [year, month, day] = tx.date.split('-');
                const txDate = new Date(year, parseInt(month) - 1, day);
                const prevM = currentM === 0 ? 11 : currentM - 1;
                const prevY = currentM === 0 ? currentY - 1 : currentY;
                const cutOffDate = new Date(prevY, prevM, 25);
                
                if (txDate >= cutOffDate) {
                    const catLower = (tx.category || '').toLowerCase();
                    const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
                    
                    // Exclude internal transfers, savings, and checking from counting as legitimate Income
                    if (catLower.includes('transfer') || merchant.includes('transfer') || merchant.includes('savings') || merchant.includes('checking') || merchant.includes('sofi money')) return acc;

                    const category = tx.category ? tx.category.trim() : 'Uncategorized';
                    // Plaid returns income as negative, so we use Math.abs() to make it positive for our tracker UI
                    acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
                }
            }
            return acc;
        }, {});
    }, [processedTransactions]);

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
        let currentYear = new Date().getFullYear();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        for (let month = 1; month <= totalMonths; month++) {
            const displayMonth = `${monthNames[currentMonthIndex]} '${currentYear.toString().slice(-2)}`;
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

            // Calculate Actuals from Plaid for this specific month/year
            let actualPlaidIncome = 0;
            let actualPlaidExpenses = 0;
            if (processedTransactions) {
                processedTransactions.forEach(tx => {
                    if (tx.date) {
                        const [txY, txM] = tx.date.split('-');
                        if (parseInt(txY) === currentYear && parseInt(txM) - 1 === currentMonthIndex) {
                            const catLower = (tx.category || '').toLowerCase();
                            const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
                            if (catLower.includes('transfer') || merchant.includes('transfer') || merchant.includes('sofi money')) return;
                            
                            if (tx.amount > 0) { // Expense
                                actualPlaidExpenses += tx.amount;
                            } else if (tx.amount < 0) { // Income (Negative in Plaid)
                                if (!merchant.includes('savings') && !merchant.includes('checking')) {
                                    actualPlaidIncome += Math.abs(tx.amount);
                                }
                            }
                        }
                    }
                });
            }

            data.push({
                monthIndex: month - 1,
                month: displayMonth,
                Income: Math.round(actualIncome),
                ActualIncome: Math.round(actualPlaidIncome),
                Expenses: Math.round(actualExpenses),
                ActualExpenses: Math.round(actualPlaidExpenses),
                ...actualExtraData,
                Net: Math.round(net),
                Cumulative: Math.round(cumulative)
            });

            income *= (1 + monthlyIncomeGrowth);
            expenses *= (1 + monthlyExpenseInflation);

            currentMonthIndex++;
            if (currentMonthIndex > 11) {
                currentMonthIndex = 0;
                currentYear++;
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
        transactions: processedTransactions,
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
