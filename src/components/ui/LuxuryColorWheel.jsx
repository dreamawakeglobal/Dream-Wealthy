import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Check, Copy } from 'lucide-react';
import { useSound } from '../../SoundContext';

// Color conversion helpers
function hsvToHex(h, s, v) {
    s /= 100;
    v /= 100;
    const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    const r = Math.round(f(5) * 255);
    const g = Math.round(f(3) * 255);
    const b = Math.round(f(1) * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function hexToHsv(hex) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
        return { h: 195, s: 100, v: 100 };
    }
    let c = hex.slice(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return { h: 195, s: 100, v: 100 };
    
    const num = parseInt(c, 16);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        else if (max === g) h = ((b - r) / d + 2) * 60;
        else h = ((r - g) / d + 4) * 60;
    }
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

const LUXURY_PRESETS = [
    { name: 'Imperial Gold', hex: '#FFD700' },
    { name: 'Cyber Cyan', hex: '#00F0FF' },
    { name: 'Emerald Luxe', hex: '#10B981' },
    { name: 'Royal Amethyst', hex: '#8B5CF6' },
    { name: 'Diamond Rose', hex: '#EC4899' },
    { name: 'Sunset Blaze', hex: '#FF5E3A' },
    { name: 'Royal Sapphire', hex: '#3B82F6' },
    { name: 'Champagne Glow', hex: '#F5D061' },
    { name: 'Cyber Lime', hex: '#22C55E' },
    { name: 'Obsidian Crimson', hex: '#EF4444' },
];

export const LuxuryColorWheel = ({
    value = '#00F0FF',
    onChange,
    size = 190
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    const { playPop } = useSound();

    const hsv = hexToHsv(value);
    const [hue, setHue] = useState(hsv.h);
    const [saturation, setSaturation] = useState(hsv.s);
    const [brightness, setBrightness] = useState(Math.max(20, hsv.v));

    // Synchronize internal state when value prop changes externally
    useEffect(() => {
        const parsed = hexToHsv(value);
        setHue(parsed.h);
        setSaturation(parsed.s);
        setBrightness(Math.max(20, parsed.v));
    }, [value]);

    // Draw the luxury color disc
    const drawDisc = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const center = size / 2;
        const radius = center - 6;

        ctx.clearRect(0, 0, size, size);

        // 1. Draw smooth chromatic cone
        const brightnessFactor = brightness / 100;
        for (let angle = 0; angle < 360; angle += 1) {
            const startAngle = (angle - 1.5) * Math.PI / 180;
            const endAngle = (angle + 1.5) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = `hsl(${angle}, 100%, ${brightnessFactor * 50}%)`;
            ctx.fill();
        }

        // 2. Radial Saturation Overlay (White in center)
        const radGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
        radGrad.addColorStop(0, `rgba(255, 255, 255, ${brightnessFactor})`);
        radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fillStyle = radGrad;
        ctx.fill();

        // 3. Luxury Metallic Outer Ring
        ctx.beginPath();
        ctx.arc(center, center, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center, center, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }, [size, brightness]);

    useEffect(() => {
        drawDisc();
    }, [drawDisc]);

    // Handle interactive wheel clicks and drags
    const handlePointerMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const center = size / 2;
        const radius = center - 6;
        const dx = clientX - (rect.left + center);
        const dy = clientY - (rect.top + center);

        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const sat = Math.min(100, Math.max(0, Math.round((dist / radius) * 100)));
        const newHue = Math.round(angle);

        setHue(newHue);
        setSaturation(sat);

        const newHex = hsvToHex(newHue, sat, brightness);
        if (onChange) {
            onChange(newHex);
        }
    }, [size, brightness, onChange]);

    const handlePointerDown = (e) => {
        setIsDragging(true);
        handlePointerMove(e);
    };

    useEffect(() => {
        const handleGlobalMove = (e) => {
            if (isDragging) {
                handlePointerMove(e);
            }
        };
        const handleGlobalUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('mouseup', handleGlobalUp);
            window.addEventListener('touchmove', handleGlobalMove);
            window.addEventListener('touchend', handleGlobalUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchmove', handleGlobalMove);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, [isDragging, handlePointerMove]);

    // Calculate handle position on wheel
    const center = size / 2;
    const radius = center - 6;
    const rad = (hue * Math.PI) / 180;
    const dist = (saturation / 100) * radius;
    const handleX = center + dist * Math.cos(rad);
    const handleY = center + dist * Math.sin(rad);

    const handleBrightnessChange = (e) => {
        const newB = Number(e.target.value);
        setBrightness(newB);
        const newHex = hsvToHex(hue, saturation, newB);
        if (onChange) {
            onChange(newHex);
        }
    };

    const handleCopyHex = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.35) 100%)',
            padding: '18px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            userSelect: 'none',
            maxWidth: '100%'
        }}>
            {/* Upper Interactive Area: Wheel & Hologram Orb */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                gap: '16px',
                flexWrap: 'wrap'
            }}>
                {/* Chromatic Color Wheel */}
                <div
                    ref={containerRef}
                    onMouseDown={handlePointerDown}
                    onTouchStart={handlePointerDown}
                    style={{
                        position: 'relative',
                        width: `${size}px`,
                        height: `${size}px`,
                        cursor: 'crosshair',
                        borderRadius: '50%',
                        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${value}40`,
                        transition: 'box-shadow 0.3s ease'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: '50%',
                            display: 'block'
                        }}
                    />
                    
                    {/* Glowing Pointer Thumb */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${handleX}px`,
                            top: `${handleY}px`,
                            transform: 'translate(-50%, -50%)',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '2.5px solid #ffffff',
                            backgroundColor: value,
                            boxShadow: '0 0 0 1.5px rgba(0,0,0,0.6), 0 0 12px #ffffff, 0 4px 8px rgba(0,0,0,0.5)',
                            pointerEvents: 'none',
                            transition: isDragging ? 'none' : 'all 0.1s ease-out'
                        }}
                    />
                </div>

                {/* Hologram Preview Orb & Hex Badge */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '120px'
                }}>
                    {/* 3D Hologram Glow Orb */}
                    <div style={{
                        position: 'relative',
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${value} 45%, rgba(0,0,0,0.8) 100%)`,
                        boxShadow: `0 0 28px ${value}, inset 0 0 16px rgba(255,255,255,0.6)`,
                        border: '1.5px solid rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Sparkles size={20} color="#ffffff" style={{ filter: 'drop-shadow(0 0 4px #fff)', opacity: 0.9 }} />
                    </div>

                    {/* HEX Pill with Copy Button */}
                    <div
                        onClick={handleCopyHex}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '6px 12px',
                            borderRadius: '50px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        title="Click to copy HEX code"
                    >
                        <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            letterSpacing: '1px',
                            color: '#ffffff'
                        }}>
                            {value}
                        </span>
                        {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} color="var(--text-muted)" />}
                    </div>
                </div>
            </div>

            {/* Luminosity / Brightness Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    <span>Luminosity</span>
                    <span>{brightness}%</span>
                </div>
                <input
                    type="range"
                    min="15"
                    max="100"
                    value={brightness}
                    onChange={handleBrightnessChange}
                    style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '4px',
                        background: `linear-gradient(to right, #000000, ${hsvToHex(hue, saturation, 100)})`,
                        appearance: 'none',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                />
            </div>

            {/* Luxury Gem Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Curated Luxury Palettes
                </span>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '8px'
                }}>
                    {LUXURY_PRESETS.map(preset => {
                        const isSelected = value.toUpperCase() === preset.hex.toUpperCase();
                        return (
                            <button
                                key={preset.hex}
                                type="button"
                                onClick={() => {
                                    if (playPop) playPop();
                                    if (onChange) onChange(preset.hex);
                                }}
                                style={{
                                    height: '32px',
                                    borderRadius: '10px',
                                    backgroundColor: preset.hex,
                                    border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                                    boxShadow: isSelected ? `0 0 12px ${preset.hex}, 0 2px 6px rgba(0,0,0,0.4)` : '0 2px 4px rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0
                                }}
                                title={preset.name}
                            >
                                {isSelected && <Check size={14} color="#ffffff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
