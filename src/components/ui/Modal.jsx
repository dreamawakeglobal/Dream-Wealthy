import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, glass = true, contentStyle = {}, containerStyle = {}, customClass = '', useNeonGlow = false, invertColors = false, clearBlur = false, dimOverlay = true, transparentOverlay = false, lessTransparent = false, silent = false }) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    // Close on an explicit click of the black background, not the content box
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const glowColor = theme === 'dark' ? '#ffffff' : '#4FA3F7';

    const modalContent = (
        <div 
            className="modal-overlay" 
            onClick={handleOverlayClick}
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0,
                right: 0,
                bottom: 0,
                height: '100vh',
                alignItems: 'center',
                ...(clearBlur ? { background: 'rgba(0, 0, 0, 0.1)' } : {}),
                ...(transparentOverlay ? { background: 'transparent' } : {}),
                ...(!dimOverlay ? { background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none' } : {})
            }}
        >
            <div 
                className={`modal-content ${glass ? 'glass' : ''} ${invertColors ? 'modal-inverted' : ''} ${customClass}`}
                style={{
                    ...(useNeonGlow ? {
                        border: `3px solid ${glowColor}`,
                        boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 40px ${glowColor}33`,
                        transition: 'border 0.3s ease, box-shadow 0.3s ease'
                    } : {}),
                    ...(clearBlur ? {
                        background: 'rgba(255, 255, 255, 0.05)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: useNeonGlow ? `3px solid ${glowColor}` : '1px solid rgba(255, 255, 255, 0.2)'
                    } : {}),
                    ...(lessTransparent ? {
                        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)'
                    } : {}),
                    ...containerStyle
                }}
            >
                {/* Isolated Background Image Layer with User-Defined Content Style */}
                <div 
                    className="modal-bg-image" 
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 0,
                        pointerEvents: 'none',
                        ...contentStyle
                    }} 
                />

                <div className="modal-header" style={{ position: 'relative', zIndex: 1 }}>
                    <h2>{title}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body" style={{ position: 'relative', zIndex: 1 }}>
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
