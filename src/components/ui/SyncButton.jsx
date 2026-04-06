import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useFinancialContext } from '../../FinancialContext';
import { useSound } from '../../SoundContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';

// Production: 24-hour cooldown lock to prevent Plaid API Rate Limiting.
const COOLDOWN_HOURS = 24;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

export const SyncButton = () => {
    const { forceSyncPlaid, forcePlaidRefresh } = useFinancialContext();
    const { playPop } = useSound();
    const { theme, expenseBorderColor } = useTheme();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        const storedSync = localStorage.getItem('plaid_last_sync');
        if (storedSync) {
            setLastSyncTime(parseInt(storedSync, 10));
        }
    }, []);

    useEffect(() => {
        if (!lastSyncTime) return;

        const calculateTimeRemaining = () => {
            const now = Date.now();
            const timePassed = now - lastSyncTime;
            const timeLeft = COOLDOWN_MS - timePassed;

            if (timeLeft <= 0) {
                setTimeRemaining('');
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                setTimeRemaining(`Up to date (${hours}h ${minutes}m)`);
            } else {
                setTimeRemaining(`Up to date (${minutes}m)`);
            }
        };

        calculateTimeRemaining();
        const intervalId = setInterval(calculateTimeRemaining, 60000); // update every minute

        return () => clearInterval(intervalId);
    }, [lastSyncTime]);

    const handleSync = async () => {
        if (isSyncing || timeRemaining) return;
        
        if (playPop) playPop();
        setIsSyncing(true);
        
        // 1. Instantly force Plaid to interrogate the bank bypassing 24hr cache entirely!
        if (forcePlaidRefresh) {
            await forcePlaidRefresh();
        }
        
        // 2. Plaid's async extraction from banking servers takes 30-60 seconds.
        // We will natively poll Supabase every 15 seconds for 45 seconds total!
        let success = false;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 15000));
            success = await forceSyncPlaid();
            
            // If the Edge function returns true, it extracted data. Plaid finished!
            if (success) {
                break;
            }
        }
        
        if (success) {
            const now = Date.now();
            localStorage.setItem('plaid_last_sync', now.toString());
            setLastSyncTime(now);
        }
        
        setIsSyncing(false);
    };

    const isDisabled = isSyncing || timeRemaining !== '';

    return (
        <Button 
            variant="secondary"
            size="sm"
            onClick={handleSync}
            disabled={isDisabled}
            style={{ 
                opacity: isDisabled ? 0.7 : 1, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                height: '32px',
                padding: '0 12px',
                backdropFilter: 'blur(8px)',
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
                cursor: isDisabled ? 'default' : 'pointer'
            }}
            className={expenseBorderColor !== 'none' && !isDisabled ? `glow-color-${expenseBorderColor}` : ''}
            title={timeRemaining ? `You can manually update again in ${timeRemaining.replace('Up to date (', '').replace(')', '')}` : 'Fetch latest transactions from your bank'}
        >
            <RefreshCw 
                size={14} 
                className={isSyncing ? "spin-animation" : ""} 
                style={{
                    animation: isSyncing ? 'spin 1.5s linear infinite' : 'none'
                }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {isSyncing ? 'Interrogating Bank...' : (timeRemaining || 'Instant Force Sync')}
            </span>
            <style>{`
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </Button>
    );
};
