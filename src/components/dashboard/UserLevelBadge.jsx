import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, ArrowUpRight, ArrowDownRight, Activity, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFinancialContext } from '../../FinancialContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useXP } from '../../contexts/XPContext';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { SyncButton } from '../ui/SyncButton';
import './UserLevelBadge.css';

const WEALTH_QUOTES = [
    { text: "Compound interest is the eighth wonder of the world. He who understands it, earns it.", author: "Albert Einstein" },
    { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
    { text: "Wealth is not about having a lot of money; it's about having a lot of options.", author: "Chris Rock" },
    { text: "Every time you borrow money, you're robbing your future self.", author: "Nathan W. Morris" },
    { text: "The intelligent investor is a realist who sells to optimists and buys from pessimists.", author: "Benjamin Graham" },
    { text: "You don't have to be a mathematical genius to build wealth. You just need discipline.", author: "Engine Principle" },
    { text: "A budget is telling your money where to go instead of wondering where it went.", author: "John C. Maxwell" }
];

export const UserLevelBadge = () => {
    const { user } = useAuth();
    const { expenseBorderColor } = useTheme();
    const { level, title, xpPercentage, xpProgress } = useXP();
    const financialContext = useFinancialContext();
    const {
        portfolio,
        trackedDebts,
        totalMonthlyIncome,
        totalMonthlyExpenses,
        netMonthlyCashFlow,
        getProjectionData,
        startingSavings,
        plaidBalances
    } = financialContext;

    const dailyQuote = useMemo(() => {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        return WEALTH_QUOTES[dayOfYear % WEALTH_QUOTES.length];
    }, []);

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
        <div className={`ultra-badge-container glass ${borderGlowClass}`}>
            <div className="ultra-badge-grid">
                
                {/* LEFT PANE: Identity Profile */}
                <div className="identity-pane">
                    <div className="shield-glow-ring" style={{ position: 'absolute', width: '130px', height: '130px', zIndex: 0 }}>
                        <svg width="130" height="130" viewBox="0 0 130 130">
                            <circle cx="65" cy="65" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <circle 
                                cx="65" cy="65" r="60" 
                                fill="none" 
                                stroke={isPositive ? "var(--accent-primary)" : "var(--danger)"} 
                                strokeWidth="6" 
                                strokeDasharray="377" 
                                strokeDashoffset={377 - (377 * xpPercentage) / 100}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                            />
                        </svg>
                    </div>
                    <div className="shield-wrapper" style={{ filter: isPositive ? 'drop-shadow(0 0 24px var(--accent-primary))' : 'drop-shadow(0 0 24px var(--danger))', zIndex: 1 }}>
                        {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                            <img 
                                src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                                alt="Profile Avatar" 
                                style={{ 
                                    width: 96, 
                                    height: 96, 
                                    borderRadius: '50%', 
                                    objectFit: 'cover',
                                    border: '2px solid var(--text-primary)',
                                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' 
                                }} 
                            />
                        ) : isPositive ? (
                            <ShieldCheck size={110} color="var(--text-primary)" strokeWidth={1} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
                        ) : (
                            <ShieldAlert size={110} color="var(--text-primary)" strokeWidth={1} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
                        )}
                    </div>
                    <div className="identity-text-stack" style={{ zIndex: 1 }}>
                        <h2 className="identity-name">{fullName}</h2>
                        <div className="level-badge-pill" style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            <span className="level-text" style={{ fontWeight: 'bold' }}>LEVEL {level}</span>
                            <span className="level-title">{title}</span>
                        </div>
                        <div className="xp-progress-container">
                            <div className="xp-progress-text-row">
                                <span className="xp-progress-current" style={{ color: isPositive ? 'var(--accent-primary)' : 'var(--danger)' }}>
                                    {xpProgress.toLocaleString()} XP
                                </span>
                                <span>{(5000 - xpProgress).toLocaleString()} to Next Lvl</span>
                            </div>
                            <div className="xp-progress-track">
                                <div 
                                    className="xp-progress-fill" 
                                    style={{ 
                                        width: `${Math.max(xpPercentage, 2)}%`, 
                                        background: isPositive ? 'var(--accent-primary)' : 'var(--danger)',
                                        boxShadow: isPositive ? '0 0 15px var(--accent-primary)' : '0 0 15px var(--danger)'
                                    }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Financial Engine */}
                <div className="metrics-pane">
                    
                    {/* Top Section: Net Worth Hero */}
                    <div className="networth-hero-card glass">
                        <div className="networth-header">
                            <h3 className="networth-title">Total Net Worth</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <SyncButton />
                                <div className={`status-indicator ${isPositive ? 'positive' : 'negative'}`}>
                                    <div className="status-dot" />
                                    {isPositive ? 'Accumulating' : 'Deficit'}
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '48px' }}>
                            <h1 className="networth-massive-value">
                                ${networth.toLocaleString(undefined, {maximumFractionDigits:0})}
                            </h1>
                            
                            {dailyQuote && (() => {
                                const isSuccess = true;
                                const colorHex = '#4FA3F7'; // Use the classic engine blue or dynamic theme color
                                const glowHex = 'rgba(79, 163, 247, 0.2)';
                                
                                return (
                                    <div className="insight-hud-box fade-in-up" style={{ 
                                        '--insight-color': colorHex,
                                        '--insight-glow': glowHex
                                    }}>
                                        <div style={{ color: colorHex, filter: `drop-shadow(0 0 12px ${glowHex})`, zIndex: 1 }}>
                                            <Brain size={28} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 1, alignItems: 'center' }}>
                                            <div>
                                                <span className="insight-hud-tag">
                                                    Daily Mantra
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '1rem', fontWeight: 700, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.4, marginTop: '4px' }}>"{dailyQuote.text}"</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="networth-breakdown-bar glass">
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
                        <div className="flow-micro-card glass">
                            <div className="flow-icon-wrapper success-bg">
                                <ArrowUpRight size={18} color="var(--success)" />
                            </div>
                            <div className="flow-data">
                                <span className="flow-label">Monthly Income</span>
                                <h3 className="flow-value success-text">$<AnimatedNumber value={totalMonthlyIncome} /></h3>
                            </div>
                        </div>

                        <div className="flow-micro-card glass">
                            <div className="flow-icon-wrapper danger-bg">
                                <ArrowDownRight size={18} color="var(--danger)" />
                            </div>
                            <div className="flow-data">
                                <span className="flow-label">Monthly Expenses</span>
                                <h3 className="flow-value danger-text">$<AnimatedNumber value={totalMonthlyExpenses} /></h3>
                            </div>
                        </div>

                        <div className={`flow-micro-card highlight-card glass ${borderGlowClass}`}>
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
