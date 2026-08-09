import React, { useEffect, useState } from 'react';
import { Award, Zap, Trophy, Shield, CheckCircle2, Lock } from 'lucide-react';
import { Card } from './ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getUserXPData, calculateRankDetails, RANKS } from '../utils/xpEngine';
import './GamificationCard.css';

export const GamificationCard = () => {
    const { user } = useAuth();
    const { theme, expenseBorderColor } = useTheme();
    const [xpData, setXpData] = useState({ totalXP: 0, history: [], badges: [] });

    useEffect(() => {
        let isMounted = true;
        getUserXPData(user?.id).then(data => {
            if (isMounted) setXpData(data);
        });
        return () => { isMounted = false; };
    }, [user?.id]);

    const rankDetails = calculateRankDetails(xpData.totalXP);
    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : 'var(--accent-primary)';

    return (
        <Card glass className="gamification-card" style={{ marginTop: '24px', padding: '24px' }}>
            <div className="gamification-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="rank-icon-badge" style={{ borderColor: activeColor, boxShadow: `0 0 20px ${activeColor}40` }}>
                        <span>{rankDetails.currentRank.icon}</span>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{rankDetails.currentRank.title}</h3>
                            <span className="badge danger-badge" style={{ background: activeColor, color: '#fff' }}>
                                Lvl {rankDetails.currentLevel}
                            </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {xpData.totalXP.toLocaleString()} Total XP Earned
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(251, 191, 36, 0.1)', padding: '8px 14px', borderRadius: '16px', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                    <Zap size={18} color="#FBBF24" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FBBF24' }}>Active Streak: 7 Days</span>
                </div>
            </div>

            {/* Level XP Progress Bar */}
            <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>Progress to {rankDetails.nextRank ? rankDetails.nextRank.title : 'Max Rank'}</span>
                    <span>{rankDetails.nextRank ? `${rankDetails.xpToNext.toLocaleString()} XP needed` : 'MAX RANK'}</span>
                </div>
                <div className="xp-progress-track">
                    <div 
                        className="xp-progress-fill" 
                        style={{ 
                            width: `${rankDetails.progressPercent}%`,
                            background: activeColor,
                            boxShadow: `0 0 12px ${activeColor}`
                        }} 
                    />
                </div>
            </div>

            {/* 6 Rank Badges Grid */}
            <div style={{ marginTop: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Dream Wealthy Ranks & Badges
                </h4>
                <div className="ranks-grid">
                    {RANKS.map((rk) => {
                        const isUnlocked = xpData.totalXP >= rk.minXP;
                        return (
                            <div 
                                key={rk.key} 
                                className={`rank-badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                                style={isUnlocked ? { borderColor: `${activeColor}60` } : {}}
                            >
                                <div className="rank-badge-icon">
                                    {rk.icon}
                                    {!isUnlocked && <Lock size={14} className="lock-overlay" />}
                                </div>
                                <div className="rank-badge-info">
                                    <div className="rank-badge-title">
                                        {rk.title}
                                        {isUnlocked && <CheckCircle2 size={13} color="#10B981" style={{ marginLeft: '4px' }} />}
                                    </div>
                                    <div className="rank-badge-xp">Lvl {rk.level} • {rk.minXP.toLocaleString()} XP</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};
