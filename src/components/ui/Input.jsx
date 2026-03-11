import React from 'react';
import './Input.css';

export const Input = ({
    label,
    id,
    error,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    ...props
}) => {
    return (
        <div className={`input-wrapper ${className}`}>
            {label && (
                <label htmlFor={id} className="input-label">
                    {label}
                </label>
            )}
            <div className="input-container">
                {LeftIcon && (
                    <span className="input-icon left">
                        <LeftIcon size={18} />
                    </span>
                )}
                <input
                    id={id}
                    className={`dream-input ${LeftIcon ? 'has-left-icon' : ''} ${RightIcon ? 'has-right-icon' : ''} ${error ? 'has-error' : ''}`}
                    {...props}
                />
                {RightIcon && (
                    <span className="input-icon right">
                        <RightIcon size={18} />
                    </span>
                )}
            </div>
            {error && <span className="input-error-text">{error}</span>}
        </div>
    );
};
