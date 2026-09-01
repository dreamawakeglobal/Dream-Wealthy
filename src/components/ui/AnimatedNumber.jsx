import React, { useEffect, useState, useRef } from 'react';

export const AnimatedNumber = ({
    value,
    format = (val) => Math.round(val).toLocaleString(),
    className = '',
    duration = 1200,
    startFromZero = true,
    delay = 0,
    onComplete
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const hasMountedRef = useRef(false);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        let animationFrameId;
        let timeoutId;
        let startTime = null;
        const targetValue = typeof value === 'number' ? value : Number(value) || 0;
        const startValue = !hasMountedRef.current && startFromZero ? 0 : displayValue;
        hasMountedRef.current = true;

        if (startValue === targetValue && targetValue !== 0) {
            setDisplayValue(targetValue);
            return;
        }

        const runAnimation = () => {
            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);

                // Easing function (easeOutExpo)
                const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const currentVal = startValue + (targetValue - startValue) * easeProgress;

                setDisplayValue(currentVal);

                if (progress < 1) {
                    animationFrameId = window.requestAnimationFrame(step);
                } else {
                    setDisplayValue(targetValue);
                    if (onCompleteRef.current && targetValue > 0) {
                        onCompleteRef.current();
                    }
                }
            };
            animationFrameId = window.requestAnimationFrame(step);
        };

        if (delay > 0) {
            timeoutId = setTimeout(runAnimation, delay);
        } else {
            runAnimation();
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }
        };
    }, [value, duration, delay]);

    return (
        <span className={className}>
            {format(displayValue)}
        </span>
    );
};

