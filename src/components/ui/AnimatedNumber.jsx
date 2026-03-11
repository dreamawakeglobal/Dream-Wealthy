import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export const AnimatedNumber = ({
    value,
    format = (val) => val.toLocaleString(),
    className = '',
    duration = 1000
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime;
        let startValue = displayValue;
        let endValue = value;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function (easeOutExpo)
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const currentVal = startValue + (endValue - startValue) * easeProgress;
            setDisplayValue(currentVal);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setDisplayValue(endValue);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, duration]);

    return (
        <span className={className}>
            {format(displayValue)}
        </span>
    );
};
