import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Sparkles, RefreshCcw, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';

export const AICoachModal = () => {
    const { 
        isCoachModalOpen, 
        setIsCoachModalOpen, 
        aiCoachingInsight, 
        aiCoachingLoading, 
        fetchCoachingInsight 
    } = useStore();
    
    const { theme, expenseBorderColor } = useTheme();
    const navigate = useNavigate();
    const [typedText, setTypedText] = useState("");
    const [isDoneTyping, setIsDoneTyping] = useState(false);
    
    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#10B981', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#818CF8' : '#4FA3F7') : (theme === 'dark' ? '#818CF8' : '#4FA3F7');

    useEffect(() => {
        // Eagerly pre-fetch the insight on load so it's ready the instant the modal opens
        if (!aiCoachingInsight && !aiCoachingLoading) {
            fetchCoachingInsight();
        }
    }, [aiCoachingInsight, aiCoachingLoading, fetchCoachingInsight]);

    useEffect(() => {
        if (isCoachModalOpen && aiCoachingInsight && aiCoachingInsight.message && !aiCoachingLoading) {
            let currentIndex = 0;
            setTypedText("");
            setIsDoneTyping(false);

            const typeTimer = setInterval(() => {
                setTypedText(aiCoachingInsight.message.slice(0, currentIndex + 1));
                currentIndex++;

                if (currentIndex >= aiCoachingInsight.message.length) {
                    clearInterval(typeTimer);
                    setIsDoneTyping(true);
                }
            }, 20);

            return () => clearInterval(typeTimer);
        }
    }, [aiCoachingInsight, aiCoachingLoading, isCoachModalOpen]);

    if (!isCoachModalOpen) return null;

    const baseColor = activeColor || '#4FA3F7';

    return (
        <Modal 
            isOpen={isCoachModalOpen}
            onClose={() => setIsCoachModalOpen(false)}
            title="Wealthy Insights"
            useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
            clearBlur={true}
            transparentOverlay={true}
            containerStyle={{ 
                maxWidth: '600px',
                borderRadius: '24px',
                overflow: 'hidden',
                position: 'relative',
                padding: '16px',
                animation: 'coach-float 6s ease-in-out infinite'
            }}
        >
            {/* Subtle core central glow */}
            <div style={{
                position: 'absolute',
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '300px',
                height: '300px',
                background: baseColor,
                opacity: 0.15,
                filter: 'blur(60px)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: `${baseColor}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: baseColor,
                    marginBottom: '20px',
                    border: `1px solid ${baseColor}44`
                }}>
                    <Sparkles size={28} className={aiCoachingLoading ? "spin-pulse" : ""} />
                </div>

                <p style={{ 
                    margin: 0, 
                    fontSize: '1.15rem', 
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                    minHeight: '100px', 
                    fontFamily: "'Inter', sans-serif"
                }}>
                    {aiCoachingLoading ? (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', animation: 'pulse 1.5s infinite' }}>
                            Analyzing your financial trajectory...
                        </span>
                    ) : (
                        <span>{typedText}</span>
                    )}
                </p>

                {isDoneTyping && aiCoachingInsight?.action && aiCoachingInsight.action.text && (
                    <button 
                        className="fade-in-up"
                        onClick={() => {
                            setIsCoachModalOpen(false);
                            navigate(aiCoachingInsight.action.path || '/');
                        }}
                        style={{
                            background: activeColor,
                            border: 'none',
                            color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white',
                            cursor: 'pointer',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginTop: '16px',
                            boxShadow: `0 4px 12px ${activeColor}55`,
                            transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {aiCoachingInsight.action.text}
                    </button>
                )}


            </div>
            
            <style>{`
                @keyframes coach-float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                .spin-pulse {
                    animation: spin-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
                @keyframes spin-pulse {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.1); filter: brightness(1.5); }
                    100% { transform: rotate(360deg) scale(1); }
                }
            `}</style>
        </Modal>
    );
};
