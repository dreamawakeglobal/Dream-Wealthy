export const generateInsights = (contextData) => {
    const {
        totalMonthlyIncome,
        totalMonthlyExpenses,
        savingsRate,
        allocations,
        debts
    } = contextData;

    const insights = [];

    // 1. High Savings Rate Praise
    if (savingsRate >= 20) {
        insights.push({
            id: 'high-savings',
            type: 'success', // success | warning | info
            title: 'Exceptional Saver',
            message: `You are saving ${savingsRate}% of your income! You are well above the recommended 20% baseline. Keep this up and your Net Wealth will skyrocket.`,
            actionText: 'View Projections',
            actionLink: '/projections'
        });
    }

    // 2. Budget Deficit Warning (Expenses > Income)
    if (totalMonthlyIncome > 0 && totalMonthlyExpenses > totalMonthlyIncome) {
        insights.push({
            id: 'deficit-warning',
            type: 'warning',
            title: 'Critical Cashflow Deficit',
            message: `You are spending $${(totalMonthlyExpenses - totalMonthlyIncome).toLocaleString()} more than you earn this month. You need to reduce your variable expenses immediately to stop burning cash.`,
            actionText: 'Cut Expenses',
            actionLink: '/expenses'
        });
    }

    // 3. Debt Optimization Suggestion
    // If they have debt, but also have unallocated cashflow
    const totalAllocatedPercentage = allocations.reduce((acc, a) => acc + a.percentage, 0);
    const unallocatedPercentage = 100 - totalAllocatedPercentage;
    const unallocatedCashflow = (unallocatedPercentage / 100) * totalMonthlyIncome;

    if (debts && debts.length > 0) {
        if (unallocatedCashflow > 50) {
            insights.push({
                id: 'debt-optimization',
                type: 'info',
                title: 'Accelerate Debt Payoff',
                message: `You have $${Math.round(unallocatedCashflow).toLocaleString()} in unallocated monthly cashflow. Try applying this as an "Extra Payment" to your debts to save on interest and reach debt-freedom faster.`,
                actionText: 'Simulate Payoff',
                actionLink: '/expenses'
            });
        }

        // Warning if they have high interest debt
        const highInterestDebts = debts.filter(d => d.interestRate >= 15);
        if (highInterestDebts.length > 0) {
            insights.push({
                id: 'high-interest-warning',
                type: 'warning',
                title: 'High Interest Alert',
                message: `You have ${highInterestDebts.length} debt(s) with an interest rate of 15% or higher. Attack this balance aggressively using the Avalanche method to stop bleeding money to interest.`,
                actionText: 'Crush Debt',
                actionLink: '/expenses'
            });
        }
    }

    // 4. Zero-Based Budgeting Check
    if (totalMonthlyIncome > 0 && unallocatedPercentage > 0 && (!debts || debts.length === 0)) {
        insights.push({
            id: 'unallocated-funds',
            type: 'info',
            title: 'Give Every Dollar a Job',
            message: `You have $${Math.round(unallocatedCashflow).toLocaleString()} unallocated this month. Assign this money to an investment or savings goal in your Allocations dashboard so it goes to work for you.`,
            actionText: 'Allocate Funds',
            actionLink: '/income'
        });
    }

    // Limit to top 3 most important insights
    // Sort logic: warnings first, then info, then success
    insights.sort((a, b) => {
        const priority = { warning: 0, info: 1, success: 2 };
        return priority[a.type] - priority[b.type];
    });

    return insights.slice(0, 3);
};
