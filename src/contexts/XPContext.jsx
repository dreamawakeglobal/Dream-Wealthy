import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useSound } from '../SoundContext';
import { AnimatePresence, motion } from 'framer-motion';

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
    
    // Simple 5000 XP linear progression per level
    const level = Math.floor(totalXP / 5000) + 1;
    const currentLevelThreshold = (level - 1) * 5000;
    const xpProgress = totalXP - currentLevelThreshold;
    const xpPercentage = (xpProgress / 5000) * 100;

    const rankTitles = [
        "Initiate Tracker", "Budget Brawler", "Debt Destroyer",
        "Wealth Architect", "Compound Capitalist", "Financial Sovereign"
    ];
    // Scale title
    let title = rankTitles[0];
    if (level >= 50) title = rankTitles[5];
    else if (level >= 35) title = rankTitles[4];
    else if (level >= 20) title = rankTitles[3];
    else if (level >= 10) title = rankTitles[2];
    else if (level >= 5) title = rankTitles[1];

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
        <XPContext.Provider value={{ totalXP, level, xpProgress, xpPercentage, title, addXP }}>
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
