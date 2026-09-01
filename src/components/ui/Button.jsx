import React from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled = false,
    ...props
}) => {
    return (
        <button
            className={`dream-btn btn-${variant} btn-${size} ${loading ? 'is-loading' : ''} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="btn-spinner" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
            {children}
        </button>
    );
};
