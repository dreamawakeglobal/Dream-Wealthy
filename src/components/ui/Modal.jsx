import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, glass = true }) => {
    // Make sure we don't scroll the body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto'; // or '' empty string
        }

        // Cleanup function in case component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Close on an explicit click of the black background, not the content box
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal-content ${glass ? 'glass' : ''}`}>
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
};
