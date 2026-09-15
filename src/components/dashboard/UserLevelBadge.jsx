import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, ArrowUpRight, ArrowDownRight, Activity, Brain, Sparkles } from 'lucide-react';
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
    const { level, title, xpPercentage = 0, xpProgress = 0, xpToNext = 1000 } = useXP() || {};
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

    const activeColor = expenseBorderColor && expenseBorderColor !== 'none' ? ({
        blue: '#4FA3F7',
        white: '#ffffff',
        black: '#334155',
        red: '#FF4D4D',
        green: '#10B981',
        purple: '#8b5cf6',
        pink: '#ec4899',
        yellow: '#eab308',
        orange: '#f97316'
    }[expenseBorderColor] || 'var(--accent-primary)') : 'var(--accent-primary)';

    const circumference = 389.56; // 2 * Math.PI * 62
    const safeXpPct = Math.min(100, Math.max(0, xpPercentage || 0));
    const strokeDashoffset = circumference - (circumference * safeXpPct) / 100;

    return (
        <div className={`ultra-badge-container glass ${borderGlowClass}`}>
            <div className="ultra-badge-grid">
                
                {/* LEFT PANE: Identity Profile */}
                <div className="identity-pane">
                    {/* AVATAR & ORBITAL XP RING HUB */}
                    <div className="identity-avatar-hub">
                        <svg className="avatar-xp-svg" viewBox="0 0 136 136">
                            {/* Track background */}
                            <circle 
                                cx="68" cy="68" r="62" 
                                className="avatar-xp-track" 
                            />
                            {/* Animated XP Progress Ring */}
                            <circle 
                                cx="68" cy="68" r="62" 
                                className="avatar-xp-indicator" 
                                stroke={activeColor}
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 68 68)"
                                style={{
                                    filter: `drop-shadow(0 0 8px ${activeColor})`
                                }}
                            />
                        </svg>

                        {/* Avatar Image Frame */}
                        <div className="avatar-disc-frame">
                            {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                                <img 
                                    src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                                    alt="Profile Avatar" 
                                    className="avatar-photo"
                                />
                            ) : isPositive ? (
                                <ShieldCheck size={52} color="var(--text-primary)" strokeWidth={1.5} />
                            ) : (
                                <ShieldAlert size={52} color="var(--text-primary)" strokeWidth={1.5} />
                            )}
                        </div>

                        {/* Mini Level Floating Tag on Bottom of Avatar */}
                        <div className="avatar-mini-level-tag" style={{ borderColor: `${activeColor}88` }}>
                            <Sparkles size={11} style={{ color: activeColor }} />
                            <span>LVL {level || 1}</span>
                        </div>
                    </div>

                    {/* IDENTITY DETAILS */}
                    <div className="identity-content-stack">
                        <h2 className="identity-user-name">{fullName}</h2>

                        {/* Refined Rank Badge Pill */}
                        <div className="identity-rank-capsule glass">
                            <span className="rank-dot" style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}` }} />
                            <span className="rank-title-text">{title || 'Dreamer'}</span>
                        </div>

                        {/* XP Progress Card HUD */}
                        <div className="identity-xp-card glass">
                            <div className="identity-xp-header">
                                <span className="identity-xp-current" style={{ color: activeColor }}>
                                    {(xpProgress || 0).toLocaleString()} <span className="identity-xp-unit">XP</span>
                                </span>
                                <span className="identity-xp-target">
                                    {(xpToNext || 1000).toLocaleString()} to Next Rank
                                </span>
                            </div>

                            <div className="identity-xp-bar-track">
                                <div 
                                    className="identity-xp-bar-fill" 
                                    style={{ 
                                        width: `${Math.min(100, Math.max(safeXpPct, 4))}%`,
                                        background: `linear-gradient(90deg, ${activeColor}, ${activeColor}dd)`,
                                        boxShadow: `0 0 12px ${activeColor}88`
                                    }} 
                                />
                            </div>

                            <div className="identity-xp-footer">
                                <span className="identity-xp-percent">{Math.round(safeXpPct)}% Progress</span>
                                <span className="identity-xp-rank-label">Rank {level || 1}</span>
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
                                {networth < 0 ? '-' : ''}$<AnimatedNumber value={Math.abs(networth)} duration={1200} startFromZero />
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
                                <span className="breakdown-value asset-text">$<AnimatedNumber value={totalAssets} duration={1200} startFromZero /></span>
                            </div>
                            <div className="breakdown-divider" />
                            <div className="breakdown-item">
                                <span className="breakdown-label">Total Liabilities</span>
                                <span className="breakdown-value liability-text">$<AnimatedNumber value={totalLiabilities} duration={1200} startFromZero /></span>
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
