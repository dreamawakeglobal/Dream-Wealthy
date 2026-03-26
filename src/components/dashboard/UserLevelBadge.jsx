import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFinancialContext } from '../../FinancialContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import './UserLevelBadge.css';

export const UserLevelBadge = () => {
    const { user } = useAuth();
    const { expenseBorderColor } = useTheme();
    const {
        portfolio,
        trackedDebts,
        totalMonthlyIncome,
        totalMonthlyExpenses,
        netMonthlyCashFlow,
        getProjectionData,
        startingSavings,
        plaidBalances
    } = useFinancialContext();

    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.first_name || 'Visionary Saver';

    // Hook dynamically directly into the user's Projections Engine for 'Current Month Cumulative Savings'
    const currentMonthSavings = useMemo(() => {
        if (typeof getProjectionData !== 'function') return Number(startingSavings || 0);
        // The Projections page always initiates compounding from Month 0 (January) of the current year.
        // We must generate the matrix from Jan and extract the row corresponding to exactly right now.
        const currentMonthIndex = new Date().getMonth();
        const projection = getProjectionData(12, 0, new Date().getFullYear());
        return projection[currentMonthIndex]?.Cumulative || Number(startingSavings || 0);
    }, [getProjectionData, startingSavings]);

    const totalAssets = useMemo(() => {
        const investments = (portfolio || []).reduce((acc, p) => acc + ((p.price || p.avgPrice || 0) * (p.quantity || 0)), 0);
        
        // Dynamic Plaid Integrity Check: If the Live Bank connection is pulsing integers, we explicitly override 
        // the simulated projections engine to mathematically lock Net Worth to the authentic Vault state!
        const liveCash = Number(plaidBalances?.checking || 0) + Number(plaidBalances?.savings || 0);
        const activeCashValue = liveCash !== 0 ? liveCash : currentMonthSavings;

        return investments + activeCashValue;
    }, [portfolio, currentMonthSavings, plaidBalances]);

    const totalLiabilities = useMemo(() => {
        return (trackedDebts || []).reduce((acc, d) => acc + Number(d.balance || 0), 0);
    }, [trackedDebts]);

    const networth = totalAssets - totalLiabilities;
    const isPositive = networth >= 0;
    const borderGlowClass = expenseBorderColor && expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';

    return (
        <div className={`ultra-badge-container ${borderGlowClass}`}>
            <div className="ultra-badge-grid">
                
                {/* LEFT PANE: Identity Profile */}
                <div className="identity-pane">
                    <div className="shield-glow-ring" />
                    <div className="shield-wrapper" style={{ filter: isPositive ? 'drop-shadow(0 0 24px var(--accent-primary))' : 'drop-shadow(0 0 24px var(--danger))' }}>
                        {isPositive ? (
                            <ShieldCheck size={110} color="var(--text-primary)" strokeWidth={1} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
                        ) : (
                            <ShieldAlert size={110} color="var(--text-primary)" strokeWidth={1} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
                        )}
                    </div>
                    <div className="identity-text-stack">
                        <h2 className="identity-name">{fullName}</h2>
                        <div className="level-badge-pill">
                            <span className="level-text">LEVEL 1</span>
                            <span className="level-title">Initiate</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Financial Engine */}
                <div className="metrics-pane">
                    
                    {/* Top Section: Net Worth Hero */}
                    <div className="networth-hero-card">
                        <div className="networth-header">
                            <h3 className="networth-title">Total Net Worth</h3>
                            <div className={`status-indicator ${isPositive ? 'positive' : 'negative'}`}>
                                <div className="status-dot" />
                                {isPositive ? 'Accumulating' : 'Deficit'}
                            </div>
                        </div>
                        
                        <h1 className="networth-massive-value">
                            ${networth.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </h1>

                        <div className="networth-breakdown-bar">
                            <div className="breakdown-item">
                                <span className="breakdown-label">Gross Assets</span>
                                <span className="breakdown-value asset-text">${totalAssets.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                            </div>
                            <div className="breakdown-divider" />
                            <div className="breakdown-item">
                                <span className="breakdown-label">Total Liabilities</span>
                                <span className="breakdown-value liability-text">${totalLiabilities.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                            </div>

                            {/* Live Sync Array */}
                            <div className="breakdown-divider" />
                            <div className="breakdown-item">
                                <span className="breakdown-label">Checking Bank Account</span>
                                <span className="breakdown-value" style={{ color: 'var(--text-primary)', textShadow: '0 0 12px rgba(255,255,255,0.2)' }}>
                                    ${Number(plaidBalances?.checking || 0).toLocaleString(undefined, {maximumFractionDigits:0})}
                                </span>
                            </div>
                            <div className="breakdown-divider" />
                            <div className="breakdown-item">
                                <span className="breakdown-label">Savings Bank Account</span>
                                <span className="breakdown-value" style={{ color: 'var(--text-primary)', textShadow: '0 0 12px rgba(255,255,255,0.2)' }}>
                                    ${Number(plaidBalances?.savings || 0).toLocaleString(undefined, {maximumFractionDigits:0})}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Monthly Flow Grid */}
                    <div className="monthly-flow-grid">
                        <div className="flow-micro-card">
                            <div className="flow-icon-wrapper success-bg">
                                <ArrowUpRight size={18} color="var(--success)" />
                            </div>
                            <div className="flow-data">
                                <span className="flow-label">Monthly Income</span>
                                <h3 className="flow-value success-text">$<AnimatedNumber value={totalMonthlyIncome} /></h3>
                            </div>
                        </div>

                        <div className="flow-micro-card">
                            <div className="flow-icon-wrapper danger-bg">
                                <ArrowDownRight size={18} color="var(--danger)" />
                            </div>
                            <div className="flow-data">
                                <span className="flow-label">Monthly Expenses</span>
                                <h3 className="flow-value danger-text">$<AnimatedNumber value={totalMonthlyExpenses} /></h3>
                            </div>
                        </div>

                        <div className="flow-micro-card highlight-card">
                            <div className={`flow-icon-wrapper ${netMonthlyCashFlow >= 0 ? 'accent-bg' : 'danger-bg'}`}>
                                <Activity size={18} color={netMonthlyCashFlow >= 0 ? "var(--accent-primary)" : "var(--danger)"} />
                            </div>
                            <div className="flow-data">
                                <span className="flow-label">Net Cash Flow</span>
                                <h3 className={`flow-value ${netMonthlyCashFlow >= 0 ? 'accent-text' : 'danger-text'}`}>
                                    {netMonthlyCashFlow < 0 && '-'}$<AnimatedNumber value={Math.abs(netMonthlyCashFlow)} />
                               </h3>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};
