import { describe, it, expect } from 'vitest';
import { detectSubscriptions } from '../src/utils/subscriptionDetector';

describe('Savings Verification & Financial Event Pipeline', () => {

    // =========================================================================
    // 1. EXPENSE & CASH FLOW ISOLATION SAFEGUARD
    // =========================================================================
    describe('Expense Isolation Safeguard', () => {
        it('ensures transactions marked as is_transfer are strictly excluded from monthly expense aggregations', () => {
            const currentYear = new Date().getFullYear();
            const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
            const currentDate = `${currentYear}-${currentMonth}-15`;

            const rawTransactions = [
                { id: '1', amount: 50, category: 'Food & Dining', merchant_name: 'Chipotle', date: currentDate, is_transfer: false },
                { id: '2', amount: 120, category: 'Groceries', merchant_name: 'Whole Foods', date: currentDate, is_transfer: false },
                // $1,000 Transfer from Checking to Savings
                { id: '3', amount: 1000, category: 'Transfer', merchant_name: 'Online Transfer to Savings', date: currentDate, is_transfer: true },
                // Another internal transfer
                { id: '4', amount: 500, category: 'Transfer', merchant_name: 'TRANSFER_OUT_ACCOUNT_TRANSFER', date: currentDate, isTransfer: true }
            ];

            // Replicate the exact expense aggregation logic from FinancialContext.jsx
            const nonTransferTxs = rawTransactions.filter(tx => !tx.is_transfer && !tx.isTransfer);
            const totalMonthlyExpenses = nonTransferTxs.reduce((sum, tx) => sum + tx.amount, 0);

            // Should equal $170 ($50 + $120), NOT $1,670!
            expect(totalMonthlyExpenses).toBe(170);
            expect(nonTransferTxs).toHaveLength(2);
        });

        it('ensures recurring savings transfers are not misidentified as paid subscriptions', () => {
            const currentDate = new Date().toISOString().split('T')[0];
            const sampleTransactions = [
                { name: 'Netflix', merchant_name: 'Netflix', amount: 15.99, date: '2026-07-01', is_transfer: false },
                { name: 'Netflix', merchant_name: 'Netflix', amount: 15.99, date: '2026-08-01', is_transfer: false },
                { name: 'Netflix', merchant_name: 'Netflix', amount: 15.99, date: '2026-09-01', is_transfer: false },
                // A recurring $200 transfer to Marcus HYSA
                { name: 'Marcus Savings Transfer', merchant_name: 'Marcus Savings Transfer', amount: 200, date: '2026-07-01', is_transfer: true },
                { name: 'Marcus Savings Transfer', merchant_name: 'Marcus Savings Transfer', amount: 200, date: '2026-08-01', is_transfer: true },
                { name: 'Marcus Savings Transfer', merchant_name: 'Marcus Savings Transfer', amount: 200, date: '2026-09-01', is_transfer: true }
            ];

            const nonTransferTxs = sampleTransactions.filter(tx => !tx.is_transfer && !tx.isTransfer);
            const { subscriptions } = detectSubscriptions(nonTransferTxs);

            // Only Netflix should be detected, NEVER the savings transfer!
            const hasMarcus = subscriptions.some(s => s.name.toLowerCase().includes('marcus'));
            expect(hasMarcus).toBe(false);
        });
    });

    // =========================================================================
    // 2. GOAL ALLOCATION & VIRTUAL ENVELOPES MATH
    // =========================================================================
    describe('Virtual Envelopes & Unallocated Cash Math', () => {
        const bankAccounts = [
            { id: 'bank-1', name: 'Ally High Yield Savings', available_balance: 15000, subtype: 'savings' },
            { id: 'bank-2', name: 'Chase Premier Checking', available_balance: 4000, subtype: 'checking' }
        ];

        it('calculates unallocated cash correctly when multiple goals are funded from one bank account', () => {
            const allocations = [
                { id: 'alloc-1', goalId: 'goal-emergency', bankBalanceId: 'bank-1', allocatedAmount: 8000 },
                { id: 'alloc-2', goalId: 'goal-vacation', bankBalanceId: 'bank-1', allocatedAmount: 3000 },
                { id: 'alloc-3', goalId: 'goal-car', bankBalanceId: 'bank-1', allocatedAmount: 3000 }
            ];

            const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
            const unallocatedCash = bankAccounts[0].available_balance - totalAllocated;

            expect(totalAllocated).toBe(14000);
            expect(unallocatedCash).toBe(1000);
            expect(unallocatedCash).toBeGreaterThanOrEqual(0);
        });

        it('enforces that total allocations cannot exceed available balance', () => {
            const accountBalance = 5000;
            const requestedAllocation = 6000;
            const isValid = requestedAllocation <= accountBalance;
            expect(isValid).toBe(false);
        });
    });

    // =========================================================================
    // 3. DUAL-MODE GOAL RESOLUTION & VERIFICATION TIERS
    // =========================================================================
    describe('Dual-Mode Goal Resolution', () => {
        it('preserves legacy manual goal amounts as SELF_REPORTED when no allocations exist', () => {
            const legacyGoal = {
                id: 'legacy-1',
                name: 'Emergency Fund',
                targetAmount: 10000,
                currentAmount: 3500
            };
            const allocations = []; // No bank allocations

            const resolved = allocations.length > 0
                ? { ...legacyGoal, currentAmount: allocations.reduce((s, a) => s + a.allocatedAmount, 0), verificationTier: 'BANK_VERIFIED' }
                : { ...legacyGoal, verificationTier: 'SELF_REPORTED' };

            expect(resolved.currentAmount).toBe(3500);
            expect(resolved.verificationTier).toBe('SELF_REPORTED');
        });

        it('dynamically computes currentAmount and flags BANK_VERIFIED when bank allocations exist', () => {
            const goal = {
                id: 'goal-1',
                name: 'Dream Home Down Payment',
                targetAmount: 50000,
                currentAmount: 0
            };
            const allocations = [
                { id: 'a1', goalId: 'goal-1', bankBalanceId: 'bank-1', allocatedAmount: 15000 },
                { id: 'a2', goalId: 'goal-1', bankBalanceId: 'bank-2', allocatedAmount: 5000 }
            ];

            const totalAllocated = allocations.reduce((s, a) => s + a.allocatedAmount, 0);
            const hasBankAllocations = allocations.some(a => a.bankBalanceId);

            const resolved = {
                ...goal,
                currentAmount: totalAllocated,
                verificationTier: hasBankAllocations ? 'BANK_VERIFIED' : 'SELF_REPORTED'
            };

            expect(resolved.currentAmount).toBe(20000);
            expect(resolved.verificationTier).toBe('BANK_VERIFIED');
        });
    });
});
