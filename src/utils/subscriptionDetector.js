/**
 * Utility to automatically detect recurring subscriptions from Plaid transaction history.
 */
export const detectSubscriptions = (transactions = []) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
        return { subscriptions: [], totalMonthlyRecurring: 0 };
    }

    const vendorMap = {};

    transactions.forEach(tx => {
        if (!tx || !tx.amount || tx.amount <= 0) return; // Only process outgoing expenses

        // Normalize merchant / vendor name
        const rawName = tx.merchant_name || tx.name || tx.description || 'Unknown Merchant';
        const normalizedName = rawName
            .toLowerCase()
            .replace(/[\d#*]/g, '') // remove transaction reference numbers
            .replace(/\s+(inc|llc|co|corp|com)\b/g, '')
            .trim();

        if (!normalizedName || normalizedName.length < 3) return;

        if (!vendorMap[normalizedName]) {
            vendorMap[normalizedName] = {
                displayName: rawName.split(' ')[0] ? (rawName.charAt(0).toUpperCase() + rawName.slice(1)) : rawName,
                dates: [],
                amounts: [],
                category: tx.category || 'Subscription'
            };
        }

        const txDate = new Date(tx.date || tx.created_at);
        if (!isNaN(txDate.getTime())) {
            vendorMap[normalizedName].dates.push(txDate);
            vendorMap[normalizedName].amounts.push(Math.abs(tx.amount));
        }
    });

    const subscriptions = [];

    Object.keys(vendorMap).forEach(key => {
        const item = vendorMap[key];
        if (item.dates.length < 2) return; // Need at least 2 occurrences to detect cadence

        // Sort dates chronologically
        item.dates.sort((a, b) => a - b);

        // Calculate intervals between consecutive transactions in days
        const intervals = [];
        for (let i = 1; i < item.dates.length; i++) {
            const diffDays = Math.round((item.dates[i] - item.dates[i - 1]) / (1000 * 60 * 60 * 24));
            intervals.push(diffDays);
        }

        // Check if average interval matches a monthly (25-35 days) or annual (350-380 days) cycle
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const isMonthly = avgInterval >= 25 && avgInterval <= 36;
        const isAnnual = avgInterval >= 350 && avgInterval <= 380;

        // Check amount variance (subscriptions usually have fixed amounts within $2 tolerance)
        const avgAmount = item.amounts.reduce((sum, val) => sum + val, 0) / item.amounts.length;
        const amountVariance = item.amounts.every(amt => Math.abs(amt - avgAmount) <= 3.0);

        if ((isMonthly || isAnnual) && amountVariance) {
            const lastBillingDate = item.dates[item.dates.length - 1];
            const nextDueDate = new Date(lastBillingDate);
            nextDueDate.setDate(nextDueDate.getDate() + Math.round(avgInterval));

            subscriptions.push({
                id: `sub-${key}`,
                name: item.displayName,
                amount: Math.round(avgAmount * 100) / 100,
                cadence: isAnnual ? 'Annual' : 'Monthly',
                monthlyCost: isAnnual ? Math.round((avgAmount / 12) * 100) / 100 : Math.round(avgAmount * 100) / 100,
                lastBilling: lastBillingDate.toISOString().split('T')[0],
                nextBilling: nextDueDate.toISOString().split('T')[0],
                category: item.category
            });
        }
    });

    const totalMonthlyRecurring = subscriptions.reduce((sum, sub) => sum + sub.monthlyCost, 0);

    return {
        subscriptions,
        totalMonthlyRecurring: Math.round(totalMonthlyRecurring * 100) / 100
    };
};
