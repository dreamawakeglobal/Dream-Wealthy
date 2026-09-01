import { describe, it, expect } from 'vitest';
import { mapUserExpenseToPlaidCategory, detectPseudoCategory } from '../src/utils/categoryDetector';
import { detectSubscriptions } from '../src/utils/subscriptionDetector';

describe('Financial Engine & Calculation Integrity', () => {

    describe('1. Net Worth Calculation Suite', () => {
        it('calculates standard net worth accurately (Assets - Liabilities)', () => {
            const liquidCash = 12500;
            const investments = 45000;
            const debts = 15000;
            const creditCards = 2500;

            const totalAssets = liquidCash + investments;
            const totalLiabilities = debts + creditCards;
            const netWorth = totalAssets - totalLiabilities;

            expect(totalAssets).toBe(57500);
            expect(totalLiabilities).toBe(17500);
            expect(netWorth).toBe(40000);
        });

        it('handles negative net worth correctly without breaking', () => {
            const liquidCash = 1000;
            const investments = 0;
            const debts = 45000; // e.g. student loans
            const creditCards = 5000;

            const totalAssets = liquidCash + investments;
            const totalLiabilities = debts + creditCards;
            const netWorth = totalAssets - totalLiabilities;

            expect(netWorth).toBe(-49000);
        });

        it('handles zero baseline for new accounts cleanly', () => {
            const totalAssets = 0;
            const totalLiabilities = 0;
            const netWorth = totalAssets - totalLiabilities;
            expect(netWorth).toBe(0);
        });
    });

    describe('2. Cash Flow & Savings Rate Engine', () => {
        it('calculates monthly net cash flow correctly', () => {
            const monthlyIncome = 8500;
            const fixedExpenses = 3200;
            const variableExpenses = 1400;
            const subscriptions = 125.50;
            const debtMinPayments = 450;

            const totalExpenses = fixedExpenses + variableExpenses + subscriptions + debtMinPayments;
            const netCashFlow = monthlyIncome - totalExpenses;

            expect(totalExpenses).toBe(5175.50);
            expect(netCashFlow).toBe(3324.50);
        });

        it('calculates savings rate percentage accurately', () => {
            const monthlyIncome = 10000;
            const netCashFlow = 3500;
            const savingsRate = Number(((netCashFlow / monthlyIncome) * 100).toFixed(1));

            expect(savingsRate).toBe(35.0);
        });

        it('handles negative cash flow savings rate', () => {
            const monthlyIncome = 4000;
            const monthlyExpenses = 5000;
            const netCashFlow = monthlyIncome - monthlyExpenses;
            const savingsRate = Number(((netCashFlow / monthlyIncome) * 100).toFixed(1));

            expect(netCashFlow).toBe(-1000);
            expect(savingsRate).toBe(-25.0);
        });

        it('guards against division by zero when income is 0', () => {
            const monthlyIncome = 0;
            const netCashFlow = -1500;
            const savingsRate = monthlyIncome > 0 ? Number(((netCashFlow / monthlyIncome) * 100).toFixed(1)) : 0;

            expect(savingsRate).toBe(0);
        });

        it('correctly calculates semi-monthly income (24 pay periods)', () => {
            const monthlyIncome = 6000;
            const semiMonthly = (monthlyIncome * 12) / 24;
            expect(semiMonthly).toBe(3000);
        });
    });

    describe('3. Compound Projections Engine', () => {
        const simulateProjections = ({
            startingSavings = 0,
            monthlyIncome = 5000,
            monthlyExpenses = 3000,
            extraColumns = [],
            cellOverrides = {},
            totalMonths = 12,
            startMonthIndex = 0 // January
        }) => {
            let cumulative = Number(startingSavings);
            const data = [];
            let currentMonthIndex = startMonthIndex;
            let currentYear = 2026;
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            for (let month = 1; month <= totalMonths; month++) {
                const displayMonth = `${monthNames[currentMonthIndex]} '${currentYear.toString().slice(-2)}`;
                const overrides = cellOverrides[month - 1] || {};

                const actualIncome = overrides.Income !== undefined ? Number(overrides.Income) : monthlyIncome;
                const actualExpenses = overrides.Expenses !== undefined ? Number(overrides.Expenses) : monthlyExpenses;

                let extraExpensesTotal = 0;
                const extraData = {};
                extraColumns.forEach(c => {
                    const extraVal = overrides[c.name] !== undefined ? Number(overrides[c.name]) : Number(c.amount || 0);
                    extraExpensesTotal += extraVal;
                    extraData[c.name] = extraVal;
                });

                const net = actualIncome - actualExpenses - extraExpensesTotal;
                cumulative += net;

                data.push({
                    monthIndex: month - 1,
                    month: displayMonth,
                    Income: Math.round(actualIncome),
                    Expenses: Math.round(actualExpenses),
                    ...extraData,
                    Net: Math.round(net),
                    Cumulative: Math.round(cumulative)
                });

                currentMonthIndex++;
                if (currentMonthIndex > 11) {
                    currentMonthIndex = 0;
                    currentYear++;
                }
            }
            return data;
        };

        it('accurately accumulates net cash flow over 12 months with starting balance', () => {
            const results = simulateProjections({
                startingSavings: 10000,
                monthlyIncome: 6000,
                monthlyExpenses: 4000,
                totalMonths: 12
            });

            expect(results.length).toBe(12);
            expect(results[0].Net).toBe(2000);
            expect(results[0].Cumulative).toBe(12000); // 10k + 2k
            expect(results[11].Cumulative).toBe(34000); // 10k + (2k * 12)
        });

        it('correctly applies manual cell overrides and extra dynamic columns', () => {
            const results = simulateProjections({
                startingSavings: 5000,
                monthlyIncome: 5000,
                monthlyExpenses: 3000,
                extraColumns: [{ name: 'Annual Bonus Tax', amount: 0 }],
                cellOverrides: {
                    2: { Income: 10000 }, // March bonus: Income is 10k instead of 5k
                    5: { Expenses: 4500, 'Annual Bonus Tax': 500 } // June vacation + tax
                },
                totalMonths: 6
            });

            // Month 1 (Jan): Net = 2000, Cumulative = 7000
            expect(results[0].Net).toBe(2000);
            expect(results[0].Cumulative).toBe(7000);

            // Month 3 (Mar): Income is 10000, Net = 7000, Cumulative = 5000 + 2000 + 2000 + 7000 = 16000
            expect(results[2].Income).toBe(10000);
            expect(results[2].Net).toBe(7000);
            expect(results[2].Cumulative).toBe(16000);

            // Month 6 (Jun): Expenses = 4500 + 500 = 5000, Net = 5000 - 5000 = 0
            expect(results[5].Expenses).toBe(4500);
            expect(results[5]['Annual Bonus Tax']).toBe(500);
            expect(results[5].Net).toBe(0);
        });

        it('seamlessly rolls over calendar year boundaries', () => {
            const results = simulateProjections({
                startingSavings: 0,
                monthlyIncome: 5000,
                monthlyExpenses: 3000,
                totalMonths: 14,
                startMonthIndex: 10 // November '26
            });

            expect(results[0].month).toBe("November '26");
            expect(results[1].month).toBe("December '26");
            expect(results[2].month).toBe("January '27");
            expect(results[13].month).toBe("December '27");
        });
    });

    describe('4. Debt Destroyer Payoff Engine (Avalanche vs Snowball)', () => {
        const simulateDebtPayoff = (debts, strategy = 'avalanche', extraPayment = 0) => {
            let simDebts = debts.map(d => ({ ...d }));
            let currentMonth = 0;
            let totalInterestPaid = 0;
            const data = [];

            let totalBalance = simDebts.reduce((acc, d) => acc + d.balance, 0);

            while (totalBalance > 0 && currentMonth < 360) {
                if (strategy === 'avalanche') {
                    simDebts.sort((a, b) => b.interestRate - a.interestRate); // Highest rate first
                } else if (strategy === 'snowball') {
                    simDebts.sort((a, b) => a.balance - b.balance); // Lowest balance first
                }

                let availableExtra = Number(extraPayment) || 0;
                let monthInterest = 0;

                // Step 1: Accrue interest and apply minimum payments
                simDebts.forEach(d => {
                    if (d.balance > 0) {
                        const monthlyInterest = d.balance * (d.interestRate / 100 / 12);
                        monthInterest += monthlyInterest;
                        d.balance += monthlyInterest;

                        const payment = Math.min(d.balance, d.minimumPayment);
                        d.balance -= payment;
                    }
                });

                // Step 2: Apply extra payment to priority target debt
                for (let i = 0; i < simDebts.length; i++) {
                    if (availableExtra <= 0) break;
                    if (simDebts[i].balance > 0) {
                        const extraToApply = Math.min(simDebts[i].balance, availableExtra);
                        simDebts[i].balance -= extraToApply;
                        availableExtra -= extraToApply;
                    }
                }

                totalInterestPaid += monthInterest;
                totalBalance = simDebts.reduce((acc, d) => acc + d.balance, 0);

                currentMonth++;
                data.push({ month: currentMonth, remainingBalance: Math.round(totalBalance) });

                if (totalBalance <= 0) break;
            }

            return { monthsToZero: currentMonth, totalInterest: Math.round(totalInterestPaid), data };
        };

        const sampleDebts = [
            { id: '1', name: 'Credit Card A', balance: 5000, interestRate: 24.0, minimumPayment: 150 },
            { id: '2', name: 'Student Loan', balance: 12000, interestRate: 6.0, minimumPayment: 200 },
            { id: '3', name: 'Personal Loan', balance: 3000, interestRate: 14.0, minimumPayment: 100 }
        ];

        it('Avalanche strategy minimizes total interest paid compared to Snowball', () => {
            const avalanche = simulateDebtPayoff(sampleDebts, 'avalanche', 300);
            const snowball = simulateDebtPayoff(sampleDebts, 'snowball', 300);

            expect(avalanche.monthsToZero).toBeLessThanOrEqual(snowball.monthsToZero);
            expect(avalanche.totalInterest).toBeLessThanOrEqual(snowball.totalInterest);
        });

        it('accelerates payoff significantly when extra monthly payments are applied', () => {
            const baseline = simulateDebtPayoff(sampleDebts, 'avalanche', 0);
            const accelerated = simulateDebtPayoff(sampleDebts, 'avalanche', 500);

            expect(accelerated.monthsToZero).toBeLessThan(baseline.monthsToZero);
            expect(accelerated.totalInterest).toBeLessThan(baseline.totalInterest);
        });
    });

    describe('5. Wealth Allocation & Surplus Distribution Math', () => {
        it('validates allocation weights sum to exactly 100%', () => {
            const allocations = [
                { category: 'Emergency Fund', percentage: 30 },
                { category: 'Index Funds / Roth IRA', percentage: 40 },
                { category: 'Real Estate / Down Payment', percentage: 20 },
                { category: 'Dream Travel', percentage: 10 }
            ];

            const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
            expect(totalPercentage).toBe(100);
        });

        it('distributes net monthly surplus across goals accurately based on weights', () => {
            const monthlySurplus = 2500;
            const allocations = [
                { category: 'Emergency Fund', percentage: 30 },
                { category: 'Index Funds', percentage: 40 },
                { category: 'Real Estate', percentage: 20 },
                { category: 'Dream Travel', percentage: 10 }
            ];

            const distribution = allocations.map(a => ({
                category: a.category,
                amount: Math.round((monthlySurplus * (a.percentage / 100)) * 100) / 100
            }));

            expect(distribution[0].amount).toBe(750);   // 30% of 2500
            expect(distribution[1].amount).toBe(1000);  // 40% of 2500
            expect(distribution[2].amount).toBe(500);   // 20% of 2500
            expect(distribution[3].amount).toBe(250);   // 10% of 2500

            const totalDistributed = distribution.reduce((sum, d) => sum + d.amount, 0);
            expect(totalDistributed).toBe(monthlySurplus);
        });
    });

    describe('6. NLP & Subscription Detection Engine', () => {
        it('maps gas station expenses to PSEUDO_GAS', () => {
            expect(mapUserExpenseToPlaidCategory('gas')).toBe('PSEUDO_GAS');
            expect(mapUserExpenseToPlaidCategory('Gas Station')).toBe('PSEUDO_GAS');
            expect(mapUserExpenseToPlaidCategory('fuel')).toBe('PSEUDO_GAS');
        });

        it('maps ride share to PSEUDO_RIDE_SHARE', () => {
            expect(mapUserExpenseToPlaidCategory('uber')).toBe('PSEUDO_RIDE_SHARE');
            expect(mapUserExpenseToPlaidCategory('Lyft')).toBe('PSEUDO_RIDE_SHARE');
        });

        it('maps groceries to PSEUDO_GROCERIES', () => {
            expect(mapUserExpenseToPlaidCategory('groceries')).toBe('PSEUDO_GROCERIES');
            expect(mapUserExpenseToPlaidCategory('Supermarket')).toBe('PSEUDO_GROCERIES');
        });

        it('maps dining to FOOD_AND_DRINK', () => {
            expect(mapUserExpenseToPlaidCategory('Chipotle Dining')).toBe('FOOD_AND_DRINK');
            expect(mapUserExpenseToPlaidCategory('Starbucks Coffee')).toBe('FOOD_AND_DRINK');
        });

        it('accurately identifies recurring monthly subscriptions from transaction history', () => {
            const sampleTransactions = [
                { id: '1', date: '2026-06-01', amount: 15.99, merchant_name: 'Netflix', name: 'Netflix.com', category: 'Entertainment' },
                { id: '2', date: '2026-07-01', amount: 15.99, merchant_name: 'Netflix', name: 'Netflix.com', category: 'Entertainment' },
                { id: '3', date: '2026-08-01', amount: 15.99, merchant_name: 'Netflix', name: 'Netflix.com', category: 'Entertainment' },
                { id: '4', date: '2026-08-15', amount: 45.20, merchant_name: 'Chevron', name: 'Chevron Gas', category: 'Gas' }
            ];

            const result = detectSubscriptions(sampleTransactions);
            expect(result.subscriptions.length).toBeGreaterThanOrEqual(1);
            const netflixSub = result.subscriptions.find(s => s.name.toLowerCase().includes('netflix'));
            expect(netflixSub).toBeDefined();
            expect(Number(netflixSub.amount)).toBe(15.99);
        });
    });
});
