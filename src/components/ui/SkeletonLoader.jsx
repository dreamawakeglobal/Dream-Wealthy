import React from 'react';
import './SkeletonLoader.css';
import { useTheme } from '../../contexts/ThemeContext';

export const SkeletonLoader = ({ type = 'card', count = 1, style = {}, className = '' }) => {
    const { expenseBorderColor } = useTheme();
    const borderGlowClass = expenseBorderColor && expenseBorderColor !== 'none' ? `glow-skeleton-${expenseBorderColor}` : '';

    const renderSkeleton = () => {
        switch (type) {
            case 'list':
                return (
                    <div className={`skeleton-list-item glass ${borderGlowClass} ${className}`} style={style}>
                        <div className="skeleton-avatar" />
                        <div className="skeleton-list-content">
                            <div className="skeleton-line title" />
                            <div className="skeleton-line subtitle" />
                        </div>
                        <div className="skeleton-list-action">
                            <div className="skeleton-line amount" />
                        </div>
                    </div>
                );
            case 'text':
                return <div className={`skeleton-line text-block ${borderGlowClass} ${className}`} style={style} />;
            case 'card':
            default:
                return (
                    <div className={`skeleton-card glass ${borderGlowClass} ${className}`} style={style}>
                        <div className="skeleton-line title" style={{ width: '40%', marginBottom: '24px' }} />
                        <div className="skeleton-line" style={{ width: '100%', height: '40px', marginBottom: '16px' }} />
                        <div className="skeleton-line" style={{ width: '80%', height: '40px' }} />
                    </div>
                );
        }
    };

    return (
        <div className="skeleton-wrapper">
            {Array.from({ length: count }).map((_, i) => (
                <React.Fragment key={i}>
                    {renderSkeleton()}
                </React.Fragment>
            ))}
        </div>
    );
};
