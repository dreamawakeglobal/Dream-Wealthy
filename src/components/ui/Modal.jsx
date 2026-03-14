import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSound } from '../../SoundContext';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, glass = true }) => {
    const [scrollY, setScrollY] = useState(0);
    const [docHeight, setDocHeight] = useState(0);
    const { playWhoosh } = useSound();

    useEffect(() => {
        if (isOpen) {
            setScrollY(window.scrollY);
            setDocHeight(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight));
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
                position: 'absolute', 
                top: 0, 
                height: `${docHeight}px`,
                alignItems: 'flex-start'
            }}
        >
            <div 
                className={`modal-content ${glass ? 'glass' : ''}`}
                style={{ marginTop: `${scrollY + Math.max(40, window.innerHeight * 0.1)}px` }}
            >
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
