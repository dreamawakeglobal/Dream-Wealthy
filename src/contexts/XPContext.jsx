import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useSound } from '../SoundContext';
import { AnimatePresence, motion } from 'framer-motion';

import { calculateRankDetails } from '../utils/xpEngine';

const XPContext = createContext({});

export const useXP = () => useContext(XPContext);

export const XPProvider = ({ children }) => {
    const { user } = useAuth();
    const { playChime } = useSound();
    
    // Fallback to local storage if no user
    const [localXp, setLocalXp] = useState(() => {
        const stored = localStorage.getItem('dream_wealthy_temp_xp');
        return stored ? parseInt(stored, 10) : 0;
    });

    const [optimisticXp, setOptimisticXp] = useState(0);

    // Sync from source of truth when user object changes or initiates
    useEffect(() => {
        if (user && user.user_metadata && user.user_metadata.total_xp !== undefined) {
            setOptimisticXp(user.user_metadata.total_xp);
        } else if (!user) {
            setOptimisticXp(localXp);
        }
    }, [user, localXp]);

    const [xpPopups, setXpPopups] = useState([]);

    const totalXP = user ? Math.max(optimisticXp, user?.user_metadata?.total_xp || 0) : optimisticXp;
    
    const rankDetails = calculateRankDetails(totalXP);
    const level = rankDetails.currentLevel;
    const title = rankDetails.currentRank.title;
    const xpPercentage = rankDetails.progressPercent;
    const xpProgress = rankDetails.earnedInRank !== undefined ? rankDetails.earnedInRank : Math.max(0, totalXP - rankDetails.currentRank.minXP);
    const xpToNext = rankDetails.xpToNext !== undefined ? rankDetails.xpToNext : 1000;

    const addXP = useCallback(async (amount, actionName = "") => {
        // Optimistic evaluation
        setOptimisticXp(prev => prev + amount);

        // UI Popup Generation
        const newPopup = { id: Date.now() + Math.random(), amount, actionName };
        setXpPopups(prev => [...prev, newPopup]);
        
        if (playChime) playChime();

        setTimeout(() => {
            setXpPopups(prev => prev.filter(p => p.id !== newPopup.id));
        }, 3500);

        // Data persistence
        if (user) {
            const currentTotal = user.user_metadata?.total_xp || 0;
            const newTotal = currentTotal + amount;
            try {
                await supabase.auth.updateUser({
                    data: { total_xp: newTotal }
                });
            } catch (err) {
                console.error("Failed to commit XP to cloud:", err);
            }
        } else {
            setLocalXp(prev => {
                const next = prev + amount;
                localStorage.setItem('dream_wealthy_temp_xp', next.toString());
                return next;
            });
        }
    }, [user, playChime]);

    return (
        <XPContext.Provider value={{ totalXP, level, xpProgress, xpToNext, xpPercentage, title, rankDetails, addXP }}>
            {children}
            
            {/* HUD Overlay for XP Popups */}
            <div style={{ position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <AnimatePresence>
                    {xpPopups.map((popup) => (
                        <motion.div
                            key={popup.id}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                            transition={{ duration: 0.4, type: "spring" }}
                            style={{
                                background: 'rgba(15, 23, 42, 0.85)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(79, 163, 247, 0.4)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(79, 163, 247, 0.3)',
                                borderRadius: '100px',
                                padding: '10px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                color: 'white'
                            }}
                        >
                            <span style={{ color: '#4FA3F7', fontWeight: 'bold', fontSize: '1.25rem', textShadow: '0 0 8px rgba(79,163,247,0.5)' }}>+{popup.amount} XP</span>
                            {popup.actionName && <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{popup.actionName}</span>}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </XPContext.Provider>
    );
};
