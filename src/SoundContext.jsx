import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const SoundContext = createContext();

export const useSound = () => useContext(SoundContext);

export const SoundProvider = ({ children }) => {
    const [isMuted, setIsMuted] = useState(() => {
        const stored = localStorage.getItem('dream_wealthy_muted');
        return stored ? JSON.parse(stored) : false;
    });
    
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
        };
        
        window.addEventListener('click', initAudio, { once: true });
        window.addEventListener('keydown', initAudio, { once: true });
        
        return () => {
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('dream_wealthy_muted', JSON.stringify(isMuted));
    }, [isMuted]);

    const playTone = useCallback(async (type, frequency, duration, volume = 0.1, slideFreq = null) => {
        if (isMuted || !audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        
        // Resume if suspended
        if (ctx.state === 'suspended') {
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
        
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }, [isMuted]);

    const playPop = useCallback(() => {
        playTone('sine', 400, 0.1, 0.12, 200);
    }, [playTone]);

    const playWhoosh = useCallback(() => {
        if (isMuted) return;
        try {
            const audio = new Audio('/sounds/swoosh.mp3');
            audio.volume = 0.15; // Normalized volume
            audio.play().catch(e => console.error("Failed to play swoosh audio:", e));
        } catch (err) {
            console.error("Audio playback error:", err);
        }
    }, [isMuted]);

    const playChime = useCallback(() => {
        if (isMuted || !audioCtxRef.current) return;
        // Play a major chord arpeggio for positive reinforcement
        playTone('sine', 523.25, 0.4, 0.06); // C5
        setTimeout(() => playTone('sine', 659.25, 0.4, 0.06), 50); // E5
        setTimeout(() => playTone('sine', 783.99, 0.6, 0.048), 100); // G5
    }, [playTone, isMuted]);
    
    const playCrunch = useCallback(() => {
        playTone('square', 100, 0.2, 0.03, 50);
    }, [playTone]);

    const playKaChing = useCallback(() => {
        if (isMuted) return;
        try {
            const audio = new Audio('/sounds/chaching.m4a');
            audio.volume = 0.15; // Normalized volume
            audio.play().catch(e => console.error("Failed to play cha-ching audio:", e));
        } catch (err) {
            console.error("Audio playback error:", err);
        }
    }, [isMuted]);

    const playNavClick = useCallback(() => {
        if (isMuted) return;
        try {
            const audio = new Audio('/sounds/nav_click_custom.mp3');
            audio.volume = 0.15; // Normalized volume
            audio.play().catch(e => console.error("Failed to play nav click audio:", e));
        } catch (err) {
            console.error("Audio playback error:", err);
        }
    }, [isMuted]);

    const playReceiptTear = useCallback(() => {
        if (isMuted) return;
        try {
            const audio = new Audio('/sounds/expense_add.mp3');
            audio.volume = 0.15; // Normalized volume
            audio.play().catch(e => console.error("Failed to play receipt tear audio:", e));
        } catch (err) {
            console.error("Audio playback error:", err);
        }
    }, [isMuted]);

    const playCheck = useCallback(() => {
        if (isMuted) return;
        try {
            const audio = new Audio('/sounds/expense_check.mp3');
            audio.volume = 0.15; // Normalized volume
            audio.play().catch(e => console.error("Failed to play check audio:", e));
        } catch (err) {
            console.error("Audio playback error:", err);
        }
    }, [isMuted]);

    const toggleMute = () => setIsMuted(prev => !prev);

    return (
        <SoundContext.Provider value={{ playPop, playWhoosh, playChime, playCrunch, playKaChing, playNavClick, playReceiptTear, playCheck, isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
};
