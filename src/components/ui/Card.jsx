import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', glass = false, ...props }) => {
    return (
        <div className={`dream-card ${glass ? 'glass-panel' : ''} ${className}`} {...props}>
            {children}
        </div>
    );
};
