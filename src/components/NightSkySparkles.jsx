import React, { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './NightSkySparkles.css';

// Pre-calculated celestial star coordinates for balanced, natural sky distribution
const FOUR_POINT_STARS = [
    // Top-left constellation
    { id: 1, top: '8%', left: '12%', size: 34, duration: 3.2, delay: 0.2, hue: '#ffffff' },
    { id: 2, top: '18%', left: '6%', size: 22, duration: 2.7, delay: 1.4, hue: '#e0f2fe' },
    { id: 3, top: '24%', left: '22%', size: 28, duration: 3.8, delay: 0.8, hue: '#bae6fd' },
    { id: 4, top: '12%', left: '32%', size: 18, duration: 2.4, delay: 2.1, hue: '#ffffff' },

    // Top-center constellation
    { id: 5, top: '6%', left: '48%', size: 38, duration: 4.0, delay: 0.5, hue: '#ffffff' },
    { id: 6, top: '15%', left: '55%', size: 20, duration: 2.9, delay: 1.7, hue: '#e0f2fe' },
    { id: 7, top: '22%', left: '42%', size: 26, duration: 3.5, delay: 2.8, hue: '#bae6fd' },

    // Top-right constellation
    { id: 8, top: '9%', left: '76%', size: 36, duration: 3.4, delay: 0.4, hue: '#ffffff' },
    { id: 9, top: '16%', left: '88%', size: 24, duration: 2.6, delay: 1.9, hue: '#e0f2fe' },
    { id: 10, top: '28%', left: '82%', size: 30, duration: 3.7, delay: 1.1, hue: '#bae6fd' },
    { id: 11, top: '5%', left: '92%', size: 20, duration: 2.8, delay: 2.5, hue: '#ffffff' },

    // Mid-sky floating stars
    { id: 12, top: '38%', left: '14%', size: 22, duration: 3.1, delay: 1.3, hue: '#bae6fd' },
    { id: 13, top: '45%', left: '28%', size: 32, duration: 4.2, delay: 0.6, hue: '#ffffff' },
    { id: 14, top: '42%', left: '72%', size: 26, duration: 3.0, delay: 2.2, hue: '#e0f2fe' },
    { id: 15, top: '48%', left: '89%', size: 34, duration: 3.6, delay: 1.0, hue: '#ffffff' },
    { id: 16, top: '35%', left: '94%', size: 18, duration: 2.5, delay: 0.3, hue: '#ffffff' },

    // Lower atmosphere stars
    { id: 17, top: '62%', left: '8%', size: 26, duration: 3.3, delay: 1.6, hue: '#e0f2fe' },
    { id: 18, top: '68%', left: '24%', size: 20, duration: 2.8, delay: 0.9, hue: '#bae6fd' },
    { id: 19, top: '58%', left: '80%', size: 28, duration: 3.9, delay: 2.7, hue: '#ffffff' },
    { id: 20, top: '72%', left: '91%', size: 24, duration: 3.1, delay: 1.8, hue: '#bae6fd' },
    { id: 21, top: '80%', left: '16%', size: 22, duration: 2.9, delay: 2.4, hue: '#ffffff' },
    { id: 22, top: '84%', left: '85%', size: 26, duration: 3.5, delay: 0.7, hue: '#e0f2fe' }
];

// Shimmering micro-dust star particles
const STAR_DUST = [
    { id: 'd1', top: '5%', left: '18%', size: 2.5, duration: 2.1, delay: 0.3 },
    { id: 'd2', top: '11%', left: '26%', size: 2, duration: 3.0, delay: 1.1 },
    { id: 'd3', top: '14%', left: '10%', size: 3, duration: 2.5, delay: 0.8 },
    { id: 'd4', top: '20%', left: '38%', size: 2, duration: 3.4, delay: 1.9 },
    { id: 'd5', top: '8%', left: '60%', size: 2.5, duration: 2.8, delay: 0.5 },
    { id: 'd6', top: '17%', left: '68%', size: 3, duration: 3.2, delay: 2.3 },
    { id: 'd7', top: '25%', left: '62%', size: 2, duration: 2.6, delay: 1.4 },
    { id: 'd8', top: '13%', left: '80%', size: 2.5, duration: 3.1, delay: 0.7 },
    { id: 'd9', top: '22%', left: '95%', size: 2, duration: 2.9, delay: 2.0 },
    { id: 'd10', top: '32%', left: '8%', size: 3, duration: 3.5, delay: 1.2 },
    { id: 'd11', top: '39%', left: '22%', size: 2, duration: 2.4, delay: 0.9 },
    { id: 'd12', top: '48%', left: '16%', size: 2.5, duration: 3.3, delay: 1.7 },
    { id: 'd13', top: '36%', left: '66%', size: 2, duration: 2.7, delay: 0.4 },
    { id: 'd14', top: '44%', left: '83%', size: 3, duration: 3.6, delay: 2.6 },
    { id: 'd15', top: '52%', left: '96%', size: 2, duration: 2.5, delay: 1.5 },
    { id: 'd16', top: '59%', left: '19%', size: 2.5, duration: 3.0, delay: 0.8 },
    { id: 'd17', top: '65%', left: '32%', size: 2, duration: 2.8, delay: 2.1 },
    { id: 'd18', top: '75%', left: '12%', size: 3, duration: 3.4, delay: 1.0 },
    { id: 'd19', top: '63%', left: '74%', size: 2, duration: 2.9, delay: 0.6 },
    { id: 'd20', top: '71%', left: '86%', size: 2.5, duration: 3.2, delay: 1.8 },
    { id: 'd21', top: '78%', left: '68%', size: 2, duration: 2.6, delay: 2.5 },
    { id: 'd22', top: '86%', left: '78%', size: 3, duration: 3.5, delay: 0.3 },
    { id: 'd23', top: '88%', left: '28%', size: 2, duration: 2.7, delay: 1.4 },
    { id: 'd24', top: '92%', left: '93%', size: 2.5, duration: 3.1, delay: 2.2 }
];

export const NightSkySparkles = () => {
    const { theme } = useTheme();

    if (theme !== 'dark') {
        return null;
    }

    return (
        <div className="night-sky-sparkles-container visible" aria-hidden="true">
            {/* Layer 1: Glittering Star Dust */}
            {STAR_DUST.map((dust) => (
                <div
                    key={dust.id}
                    className="star-dust-particle"
                    style={{
                        top: dust.top,
                        left: dust.left,
                        width: `${dust.size}px`,
                        height: `${dust.size}px`,
                        animationDuration: `${dust.duration}s`,
                        animationDelay: `${dust.delay}s`
                    }}
                />
            ))}

            {/* Layer 2: Four-Pointed Diamond Lens-Flare Stars */}
            {FOUR_POINT_STARS.map((star) => (
                <div
                    key={star.id}
                    className="four-point-star"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animationDuration: `${star.duration}s`,
                        animationDelay: `${star.delay}s`
                    }}
                >
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            {/* Radial Core Glow */}
                            <radialGradient id={`coreGlow-${star.id}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                                <stop offset="35%" stopColor="#bae6fd" stopOpacity="0.85" />
                                <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                            </radialGradient>

                            {/* Soft Radial Ambient Aura */}
                            <radialGradient id={`ambientAura-${star.id}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                                <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                            </radialGradient>
                        </defs>

                        {/* Ambient Aura Disc */}
                        <circle cx="50" cy="50" r="38" fill={`url(#ambientAura-${star.id})`} />

                        {/* Main 4-Pointed Starburst Diamond Path */}
                        <path
                            d="M 50 0 Q 50 50 0 50 Q 50 50 50 100 Q 50 50 100 50 Q 50 50 50 0 Z"
                            fill="url(#coreGlow)"
                            style={{ fill: star.hue }}
                        />

                        {/* Slender Vertical Needle Ray */}
                        <path
                            d="M 50 2 Q 50 50 48 50 L 50 98 L 52 50 Q 50 50 50 2 Z"
                            fill="#ffffff"
                            opacity="0.95"
                        />

                        {/* Slender Horizontal Needle Ray */}
                        <path
                            d="M 2 50 Q 50 50 50 48 L 98 50 L 50 52 Q 50 50 2 50 Z"
                            fill="#ffffff"
                            opacity="0.95"
                        />

                        {/* Secondary Diagonal Micro Rays (45-degree cross sparkle) */}
                        <path
                            d="M 50 50 L 32 32 M 50 50 L 68 32 M 50 50 L 68 68 M 50 50 L 32 68"
                            stroke="#ffffff"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            opacity="0.6"
                        />

                        {/* Intense Center Diamond Core */}
                        <circle cx="50" cy="50" r="6" fill="#ffffff" />
                        <circle cx="50" cy="50" r="2.5" fill="#ffffff" />
                    </svg>
                </div>
            ))}
        </div>
    );
};

export default NightSkySparkles;
