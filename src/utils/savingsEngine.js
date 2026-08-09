/**
 * Calculates High-Yield Savings Optimization strategy based on liquid cash balances vs 3-month expense reserve.
 */
export const calculateSavingsOptimization = (plaidAccounts = [], totalMonthlyExpenses = 3000, targetHysaApy = 5.0) => {
    if (!Array.isArray(plaidAccounts) || plaidAccounts.length === 0) {
        // Default fallback calculations
        const sampleCash = 18500;
        const emergencyFundNeeded = Math.round(totalMonthlyExpenses * 3);
        const surplusCash = Math.max(0, sampleCash - emergencyFundNeeded);
        const potentialAnnualYield = Math.round(surplusCash * (targetHysaApy / 100));

        return {
            totalLiquidCash: sampleCash,
            emergencyFundNeeded,
            surplusCash,
            potentialAnnualYield,
            hysaApy: targetHysaApy,
            hasOptimizationOpportunity: surplusCash > 1000
        };
    }

    // Filter checking / depository / liquid cash accounts
    const liquidCashAccounts = plaidAccounts.filter(acc => {
        const type = (acc.type || acc.subtype || acc.account_type || '').toLowerCase();
        return type.includes('checking') || type.includes('depository') || type.includes('cash') || type.includes('savings');
    });

    const totalLiquidCash = liquidCashAccounts.reduce((sum, acc) => {
        const val = acc.balances?.current ?? acc.balance_current ?? acc.current_balance ?? acc.balance ?? acc.available ?? 0;
        return sum + Math.max(0, Number(val));
    }, 0);

    // If totalLiquidCash is 0 or accounts don't have balances populated, fallback to emergency calculations
    if (totalLiquidCash <= 0 && plaidAccounts.length > 0) {
        // Fallback: sum all account balances
        const fallbackCash = plaidAccounts.reduce((sum, acc) => {
            const val = acc.balances?.current ?? acc.balance_current ?? acc.current_balance ?? acc.balance ?? 0;
            return sum + Math.max(0, Number(val));
        }, 0);

        const emergencyFundNeeded = Math.round(totalMonthlyExpenses * 3);
        const surplusCash = Math.max(0, fallbackCash - emergencyFundNeeded);
        const potentialAnnualYield = Math.round(surplusCash * (targetHysaApy / 100));

        return {
            totalLiquidCash: Math.round(fallbackCash * 100) / 100,
            emergencyFundNeeded,
            surplusCash: Math.round(surplusCash * 100) / 100,
            potentialAnnualYield,
            hysaApy: targetHysaApy,
            hasOptimizationOpportunity: surplusCash > 0
        };
    }

    const emergencyFundNeeded = Math.round(totalMonthlyExpenses * 3);
    const surplusCash = Math.max(0, totalLiquidCash - emergencyFundNeeded);
    const potentialAnnualYield = Math.round(surplusCash * (targetHysaApy / 100));

    return {
        totalLiquidCash: Math.round(totalLiquidCash * 100) / 100,
        emergencyFundNeeded,
        surplusCash: Math.round(surplusCash * 100) / 100,
        potentialAnnualYield,
        hysaApy: targetHysaApy,
        hasOptimizationOpportunity: surplusCash > 0
    };
};
