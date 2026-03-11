import React, { useEffect, useState } from 'react';
import './GoalOrb.css';

export const GoalOrb = ({ goal, onEdit }) => {
    const { name, targetAmount, currentAmount, color } = goal;
    const [progress, setProgress] = useState(0);

    // Calculate percentages
    const percentage = Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100));

    // SVG values
    const radius = 50;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;

    // Animate the progress ring on mount
    useEffect(() => {
        // slight delay for visual pop
        const timer = setTimeout(() => {
            setProgress(percentage);
        }, 300);
        return () => clearTimeout(timer);
    }, [percentage]);

    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="goal-orb-container" onDoubleClick={() => onEdit && onEdit(goal.id)}>
            <div className="goal-orb-wrapper" style={{ '--glow-color': color }}>
                <svg className="goal-orb-svg" height={radius * 2} width={radius * 2}>
                    <defs>
                        <filter id={`glow-${goal.id}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Background Track */}
                    <circle
                        stroke="var(--surface-border)"
                        fill="var(--surface)"
                        strokeWidth={strokeWidth}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />

                    {/* Progress Ring */}
                    <circle
                        stroke={color}
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="goal-orb-progress"
                        filter={`url(#glow-${goal.id})`}
                    />
                </svg>

                {/* Center Percentage */}
                <div className="goal-orb-center">
                    <span className="goal-orb-number">{Math.round(progress)}</span>
                    <span className="goal-orb-percent">%</span>
                </div>
            </div>

            <div className="goal-orb-info">
                <h4>{name}</h4>
                <div className="goal-orb-amount-pill">
                    <span style={{ color: color }}>${currentAmount.toLocaleString()}</span>
                    <span className="text-muted"> / ${targetAmount.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};
