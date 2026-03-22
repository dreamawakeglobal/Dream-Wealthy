// src/utils/mockDataGenerator.js

/**
 * Generates and injects a heavily robust, highly realistic 
 * mock financial profile directly into the application's Zustand store.
 * The Zustand store's setCollection will natively push these payloads into Supabase.
 */
export const injectDemoData = async (store) => {
    // 1. Set Profile Baseline Overrides
    await store.setStartingSavings(12400);   // Modest savings baseline
    await store.setIncomeGrowthRate(3.5);    // Realistic 3.5% yearly income growth
    await store.setExpenseInflationRate(2.8); // Realistic 2.8% inflation

    // 2. Set Current Fixed Income
    await store.setCurrentIncome([
        {
            id: crypto.randomUUID(),
            name: "Senior Role Salary (Tech)",
            amount: 5400,
            frequency: "Monthly"
        },
        {
            id: crypto.randomUUID(),
            name: "Freelance Side Hustle",
            amount: 850,
            frequency: "Monthly"
        }
    ]);

    // 3. Set Fixed Baseline Expenses
    await store.setFixedExpenses([
        {
            id: crypto.randomUUID(),
            name: "🏢 Downtown Apartment Rent",
            amount: 2100,
            frequency: "Monthly"
        },
        {
            id: crypto.randomUUID(),
            name: "🚗 Car Payment (Tesla Model 3)",
            amount: 565,
            frequency: "Monthly"
        },
        {
            id: crypto.randomUUID(),
            name: "🩺 Health Insurance",
            amount: 320,
            frequency: "Monthly"
        }
    ]);

    // 4. Set Variable Everyday Expenses
    await store.setVariableExpenses([
        {
            id: crypto.randomUUID(),
            name: "🛒 Groceries & Dining Out",
            amount: 800,
            frequency: "Monthly"
        },
        {
            id: crypto.randomUUID(),
            name: "⛽ Fuel & Transportation",
            amount: 150,
            frequency: "Monthly"
        },
        {
            id: crypto.randomUUID(),
            name: "🍿 Entertainment & Leisure",
            amount: 400,
            frequency: "Monthly"
        }
    ]);

    // 5. Build Tracked Debt Engine
    await store.setTrackedDebts([
        {
            id: crypto.randomUUID(),
            name: "Chase Sapphire Reserve",
            type: "Credit Card",
            balance: 4250,
            interestRate: 22.9,
            minimumPayment: 150,
            extraPayment: 300,
            dueDate: "15",
            isPaid: false
        }
    ]);

    // 6. Set Future Savings Goals
    await store.setGoals([
        {
            id: crypto.randomUUID(),
            name: "House Down Payment",
            targetAmount: 80000,
            currentAmount: 14500,
            contributionAmount: 1200,
            contributionFrequency: "Monthly",
            trackAuto: false,
            color: "#4FA3F7"
        },
        {
            id: crypto.randomUUID(),
            name: "Summer Vacation (Japan)",
            targetAmount: 4500,
            currentAmount: 2100,
            contributionAmount: 400,
            contributionFrequency: "Monthly",
            trackAuto: false,
            color: "#10B981"
        }
    ]);

    // 7. Inject a highly robust Investment Portfolio
    await store.setPortfolio([
        {
            id: crypto.randomUUID(),
            symbol: "AAPL",
            name: "Apple Inc.",
            shares: 45,
            avgPrice: 155.20,
            assetClass: "Stock"
        },
        {
            id: crypto.randomUUID(),
            symbol: "VOO",
            name: "Vanguard S&P 500 ETF",
            shares: 110,
            avgPrice: 410.50,
            assetClass: "ETF"
        },
        {
            id: crypto.randomUUID(),
            symbol: "BTC",
            name: "Bitcoin",
            shares: 0.85,
            avgPrice: 38500,
            assetClass: "Crypto"
        }
    ]);

    // 8. Generate Plaid-style Checking Transactions for visual density
    const today = new Date();
    const formatDate = (daysAgo) => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };

    // Note: Plaid sends expenses as positive, incoming deposits as negative.
    await store.setCollection('transactions', 'transactions', {}, [
        {
            id: crypto.randomUUID(),
            name: "NETFLIX *STAND",
            date: formatDate(1),
            amount: 15.49,
            category: "Subscription",
            pending: false
        },
        {
            id: crypto.randomUUID(),
            name: "UBER *EATS",
            date: formatDate(2),
            amount: 32.85,
            category: "Dining",
            pending: false
        },
        {
            id: crypto.randomUUID(),
            name: "WHOLEFDS SQA",
            date: formatDate(3),
            amount: 142.10,
            category: "Groceries",
            pending: false
        },
        {
            id: crypto.randomUUID(),
            name: "DIRECT DEP *PAYROLL",
            date: formatDate(5),
            amount: -2700.00,
            category: "Income",
            pending: false
        },
        {
            id: crypto.randomUUID(),
            name: "SHELL OIL",
            date: formatDate(8),
            amount: 45.00,
            category: "Transportation",
            pending: false
        },
        {
            id: crypto.randomUUID(),
            name: "AMAZON RETAIL",
            date: formatDate(10),
            amount: 98.43,
            category: "Shopping",
            pending: false
        },
        {
            id: crypto.randomUUID(),
            name: "CHASE CREDIT CARD AUTOPAY",
            date: formatDate(14),
            amount: 450.00,
            category: "Transfer",
            pending: false
        }
    ]);

    // 9. Sync Custom Subscriptions
    await store.setSubscriptions([
        {
            id: crypto.randomUUID(),
            name: "Netflix Premium",
            cost: 22.99,
            dueDate: "01"
        },
        {
            id: crypto.randomUUID(),
            name: "Spotify Duo",
            cost: 14.99,
            dueDate: "15"
        }
    ]);

    // 10. Instantiate 3 explicit custom Categories 
    await store.setAllocations([
        {
            id: crypto.randomUUID(),
            name: "Needs",
            percentage: 50,
            color: "#4FA3F7"
        },
        {
            id: crypto.randomUUID(),
            name: "Wants",
            percentage: 30,
            color: "#10B981"
        },
        {
            id: crypto.randomUUID(),
            name: "Savings",
            percentage: 20,
            color: "#9d4edd"
        }
    ]);

    console.log("✅ Synthetic Demo Data Payload Successfully Injected.");
};
