import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import './InlineError.css';

export const InlineError = ({ message, type = 'error', className = '' }) => {
    if (!message) return null;

    if (type === 'success') {
        return (
            <div className={`inline-success-banner ${className}`} role="status">
                <CheckCircle2 size={16} />
                <span>{message}</span>
            </div>
        );
    }

    return (
        <div className={`inline-error-banner ${className}`} role="alert">
            <AlertCircle size={16} />
            <span>{message}</span>
        </div>
    );
};

export default InlineError;
