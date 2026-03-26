import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { useFinancialContext } from '../../FinancialContext';
import { Wallet, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../../SoundContext';
import { useTheme } from '../../contexts/ThemeContext';

export const BudgetWidget = () => {
    const { totalMonthlyExpenses, transactions } = useFinancialContext();
    const navigate = useNavigate();
    const { playPop } = useSound();
    const { expenseBorderColor } = useTheme();

    const borderGlowClass = expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';
    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || 'var(--accent-primary)' : 'var(--accent-primary)';

    // Mathematically isolate ONLY expenses from the current calendar month!
    const spentThisMonth = useMemo(() => {
        if (!transactions || transactions.length === 0) return 0;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return transactions.reduce((sum, tx) => {
            const txDate = new Date(tx.date);
            // Plaid Expenses are positive amounts
            if (tx.amount > 0 && !tx.pending && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                // Ignore "Transfer" category if we want true expenses, but for now sum all real outflows
                return sum + tx.amount;
            }
            return sum;
        }, 0);
    }, [transactions]);

    const progressPercentage = Math.min((spentThisMonth / (totalMonthlyExpenses || 1)) * 100, 100);
    const isOverBudget = spentThisMonth > totalMonthlyExpenses;

    return (
        <Card glass className={`budget-widget-card ${borderGlowClass}`} style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="icon-wrapper" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                        <Wallet size={20} color={activeColor} />
                    </div>
                    <h3 className="panel-title" style={{ margin: 0 }}>Monthly Budget vs. Current Spend</h3>
                </div>
                <button 
                    onClick={() => { playPop(); navigate('/expenses'); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    View Details <ChevronRight size={14} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: isOverBudget ? 'var(--danger)' : 'var(--text-primary)' }}>
                        ${spentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        of ${totalMonthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })} budgeted
                    </span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: 0, left: 0, height: '100%', 
                            width: `${progressPercentage}%`, 
                            background: isOverBudget ? 'var(--danger)' : activeColor,
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: '6px'
                        }} 
                    />
                </div>
            </div>
        </Card>
    );
};
