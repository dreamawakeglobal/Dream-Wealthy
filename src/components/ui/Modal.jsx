import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './Modal.css';

// Global modal lock ref counter to safely handle nested modals in mobile vertical view only
let openModalCount = 0;
let savedScrollY = 0;
let originalBodyStyles = null;
let originalHtmlOverflow = '';

export const Modal = ({ isOpen, onClose, title, children, glass = true, contentStyle = {}, containerStyle = {}, customClass = '', useNeonGlow = false, invertColors = false, clearBlur = false, dimOverlay = true, transparentOverlay = false, lessTransparent = false, silent = false }) => {
    const { theme } = useTheme();
    const modalRef = useRef(null);

    // Lock background screen ONLY in mobile vertical view (desktop PC view is 100% untouched)
    useEffect(() => {
        if (!isOpen) return;

        const isMobileVertical = typeof window !== 'undefined' && 
            window.matchMedia('(max-width: 768px) and (orientation: portrait), (max-width: 480px)').matches;

        if (!isMobileVertical) return; // Do NOT change anything in desktop PC view

        openModalCount++;
        if (openModalCount === 1) {
            savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            originalBodyStyles = {
                position: document.body.style.position,
                top: document.body.style.top,
                left: document.body.style.left,
                right: document.body.style.right,
                width: document.body.style.width,
                overflow: document.body.style.overflow
            };
            originalHtmlOverflow = document.documentElement.style.overflow;

            document.documentElement.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${savedScrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        }

        return () => {
            if (!isMobileVertical) return;
            openModalCount = Math.max(0, openModalCount - 1);
            if (openModalCount === 0 && originalBodyStyles) {
                document.documentElement.style.overflow = originalHtmlOverflow;
                document.body.style.position = originalBodyStyles.position;
                document.body.style.top = originalBodyStyles.top;
                document.body.style.left = originalBodyStyles.left;
                document.body.style.right = originalBodyStyles.right;
                document.body.style.width = originalBodyStyles.width;
                document.body.style.overflow = originalBodyStyles.overflow;
                window.scrollTo(0, savedScrollY);
                originalBodyStyles = null;
            }
        };
    }, [isOpen]);

    // Escape Key Listener to dismiss modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
                e.stopPropagation();
                if (onClose) onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Keyboard Focus Trap (Tab & Shift+Tab cycle inside modal)
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first focusable control on open
        if (firstElement && typeof firstElement.focus === 'function') {
            firstElement.focus();
        }

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        window.addEventListener('keydown', handleTabKey);
        return () => window.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    // NO HOOKS BELOW THIS LINE
    if (!isOpen) return null;

    // Close on an explicit click of the backdrop overlay, not the modal content
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            if (onClose) onClose();
        }
    };

    const glowColor = theme === 'dark' ? '#ffffff' : '#4FA3F7';

    const modalContent = (
        <div 
            className={`modal-overlay ${transparentOverlay ? 'mobile-glass-overlay' : ''}`}
            onClick={handleOverlayClick}
            onTouchMove={(e) => {
                if (e.target === e.currentTarget) {
                    e.preventDefault();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Modal Dialog'}
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
                ref={modalRef}
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
