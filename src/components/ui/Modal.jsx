import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSound } from '../../SoundContext';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, glass = true, contentStyle = {} }) => {
    const { playWhoosh } = useSound();

    useEffect(() => {
        if (isOpen) {
            playWhoosh();
        }
    }, [isOpen, playWhoosh]);

    if (!isOpen) return null;

    // Close on an explicit click of the black background, not the content box
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

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
                alignItems: 'center'
            }}
        >
            <div 
                className={`modal-content ${glass ? 'glass' : ''}`}
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
