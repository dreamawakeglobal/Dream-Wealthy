import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useStore } from './store';

const FinancialContext = createContext();

export const useFinancialContext = () => useContext(FinancialContext);

export const FinancialProvider = ({ children }) => {
    const { user } = useAuth();

    // Bind Zustand Store to Context to prevent breaking 15 existing pages
    const store = useStore();

    // Tie Auth State to Zustand
    useEffect(() => {
        store.setUser(user);
        if (user) {
            store.fetchAllData();
        }
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

    // --- RULES ENGINE: Auto-Categorize Plaid Transactions ---
    const transactionsByCategory = useMemo(() => {
        if (!store.transactions || store.transactions.length === 0) return {};

        return store.transactions.reduce((acc, tx) => {
            // Only sum up expenses (positive Plaid amounts). Negative amounts are income/refunds.
            if (tx.amount > 0 && !tx.pending) {
                const category = tx.category || 'Uncategorized';
                acc[category] = (acc[category] || 0) + tx.amount;
            }
            return acc;
        }, {});
    }, [store.transactions]);

    const incomeTransactionsByCategory = useMemo(() => {
        if (!store.transactions || store.transactions.length === 0) return {};

        return store.transactions.reduce((acc, tx) => {
            // Only sum up income (negative Plaid amounts).
            if (tx.amount < 0 && !tx.pending) {
                const category = tx.category || 'Uncategorized';
                // Plaid returns income as negative, so we use Math.abs() to make it positive for our tracker UI
                acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
            }
            return acc;
        }, {});
    }, [store.transactions]);

    const totalMonthlyExpenses = totalFixedExpenses + totalVariableExpenses;
    const netMonthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses;

    const savingsRate = totalMonthlyIncome > 0
        ? ((netMonthlyCashFlow / totalMonthlyIncome) * 100).toFixed(1)
        : 0;

    const get12MonthProjection = () => {
        return netMonthlyCashFlow * 12;
    };

    const getProjectionData = (totalMonths = 12, startMonthIndex = new Date().getMonth(), startYear = new Date().getFullYear()) => {
        let income = Number(totalMonthlyIncome);
        let expenses = Number(totalMonthlyExpenses);
        let cumulative = Number(store.profileData.startingSavings) || 0;
        const data = [];

        const monthlyIncomeGrowth = Number(store.profileData.incomeGrowthRate) / 100 / 12;
        const monthlyExpenseInflation = Number(store.profileData.expenseInflationRate) / 100 / 12;

        let currentMonthIndex = startMonthIndex;
        let currentYear = startYear;
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
                currentYear++;
            }
        }

        return data;
    };

    const value = {
        ...store,
        // Legacy flat profile data bindings
        startingSavings: store.profileData.startingSavings,
        incomeGrowthRate: store.profileData.incomeGrowthRate,
        expenseInflationRate: store.profileData.expenseInflationRate,
        cellOverrides: store.profileData.cellOverrides,
        extraColumns: store.profileData.extraColumns,

        // Derived state
        totalMonthlyIncome,
        totalFixedExpenses,
        totalVariableExpenses,
        totalMonthlyExpenses,
        netMonthlyCashFlow,
        savingsRate,
        get12MonthProjection,
        getProjectionData,

        // Auto-Categorized Data for UI
        transactionsByCategory,
        incomeTransactionsByCategory,
        transactions: store.transactions,

        // Monthly Debt Tracker
        trackedDebts: store.trackedDebts,
        setTrackedDebts: store.setTrackedDebts,

        // Subscriptions
        subscriptions: store.subscriptions,
        setSubscriptions: store.setSubscriptions
    };

    return (
        <FinancialContext.Provider value={value}>
            {children}
        </FinancialContext.Provider>
    );
};
