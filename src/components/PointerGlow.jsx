import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function PointerGlow() {
    const { theme } = useTheme();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Only track and render in dark mode for performance, or if the user wants it everywhere we render it.
        // Wait, the user specifically mentioned "in night mode". The CSS handles whether it's visible, but we can also completely disable tracking in light mode. Let's track globally.
        if (theme !== 'dark') return;

        const handleMouseMove = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [theme]);

    if (theme !== 'dark') return null;

    return (
        <div
            className="pointer-glow"
            style={{
                left: `${mousePosition.x}px`,
                top: `${mousePosition.y}px`
            }}
        />
    );
}
