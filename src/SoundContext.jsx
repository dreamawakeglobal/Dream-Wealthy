/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const SoundContext = createContext();

export const useSound = () => useContext(SoundContext);

// Pre-load all MP3/M4A assets. cloneNode() keeps it lightweight and allows overlapping overlapping.
const SOUND_FILES = {
    whoosh: '/sounds/swoosh.mp3',
    kaching: '/sounds/chaching.m4a',
    navClick: '/sounds/nav_click_custom.mp3',
    receiptTear: '/sounds/expense_add.mp3',
    check: '/sounds/expense_check.mp3'
};

const preloadedAudios = {};
if (typeof window !== 'undefined') {
    Object.entries(SOUND_FILES).forEach(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = 'auto'; // Force browser to cache it immediately
        preloadedAudios[key] = audio;
    });
}

export const SoundProvider = ({ children }) => {
    const [isMuted, setIsMuted] = useState(() => {
        const stored = localStorage.getItem('dream_wealthy_muted');
        return stored ? JSON.parse(stored) : false;
    });
    
    // Use a ref so callbacks never have stale closure states for isMuted
    const isMutedRef = useRef(isMuted);

    // Web Audio Context reference
    const audioCtxRef = useRef(null);

    useEffect(() => {
        // Init AudioContext securely on first user interaction to comply with browser autoplay policies
        const initAudio = () => {
            if (!audioCtxRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    audioCtxRef.current = new AudioContext();
                }
            }
            // Ensure context state matches mute settings
            if (audioCtxRef.current) {
                if (isMutedRef.current && audioCtxRef.current.state === 'running') {
                    audioCtxRef.current.suspend();
                } else if (!isMutedRef.current && audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
            }
        };
        
        window.addEventListener('click', initAudio, { once: true });
        window.addEventListener('keydown', initAudio, { once: true });
        window.addEventListener('touchstart', initAudio, { once: true });
        
        return () => {
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
            window.removeEventListener('touchstart', initAudio);
        };
    }, []);

    useEffect(() => {
        isMutedRef.current = isMuted;
        localStorage.setItem('dream_wealthy_muted', JSON.stringify(isMuted));
        
        // Immediately enforce AudioContext stop/start when toggling mute
        if (audioCtxRef.current) {
            if (isMuted && audioCtxRef.current.state === 'running') {
                audioCtxRef.current.suspend();
            } else if (!isMuted && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
        }
    }, [isMuted]);

    const playTone = useCallback(async (type, frequency, duration, volume = 0.1, slideFreq = null) => {
        if (isMutedRef.current) return;
        
        // Ensure initialized on demand
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtxRef.current = new AudioContext();
            }
        }
        
        if (!audioCtxRef.current) return;
        
        const ctx = audioCtxRef.current;
        
        // Resume if suspended and NOT muted
        if (ctx.state === 'suspended' && !isMutedRef.current) {
            await ctx.resume();
        }
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = type;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        const now = ctx.currentTime;
        oscillator.frequency.setValueAtTime(frequency, now);
        if (slideFreq) {
            oscillator.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
        }
        
        // Anti-click volume fade-in to prevent "popping" and drops
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration + 0.01); // Add a tiny bit of tail for ramp
    }, []);

    const playFile = useCallback((key, volume = 0.15) => {
        if (isMutedRef.current) return;
        try {
            if (preloadedAudios[key]) {
                const audio = preloadedAudios[key].cloneNode(); // Clone ensures overlapping plays instantly
                audio.volume = volume;
                audio.play().catch(e => console.warn(`Failed to play ${key} audio:`, e));
            }
        } catch (err) {
            console.error("Audio playback error:", err);
        }
    }, []);

    const playPop = useCallback(() => {
        playTone('sine', 400, 0.1, 0.12, 200);
    }, [playTone]);

    const playWhoosh = useCallback(() => playFile('whoosh', 0.15), [playFile]);
    const playKaChing = useCallback(() => playFile('kaching', 0.15), [playFile]);
    const playNavClick = useCallback(() => playFile('navClick', 0.15), [playFile]);
    const playReceiptTear = useCallback(() => playFile('receiptTear', 0.15), [playFile]);
    const playCheck = useCallback(() => playFile('check', 0.15), [playFile]);

    const playChime = useCallback(() => {
        if (isMutedRef.current || !audioCtxRef.current) return;
        // Play a major chord arpeggio for positive reinforcement
        playTone('sine', 523.25, 0.4, 0.06); // C5
        setTimeout(() => playTone('sine', 659.25, 0.4, 0.06), 50); // E5
        setTimeout(() => playTone('sine', 783.99, 0.6, 0.048), 100); // G5
    }, [playTone]);
    
    const playCrunch = useCallback(() => {
        playTone('square', 100, 0.2, 0.03, 50);
    }, [playTone]);

    const toggleMute = () => setIsMuted(prev => !prev);

    return (
        <SoundContext.Provider value={{ playPop, playWhoosh, playChime, playCrunch, playKaChing, playNavClick, playReceiptTear, playCheck, isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
};
