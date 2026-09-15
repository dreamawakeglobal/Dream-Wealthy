import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSound } from '../SoundContext';
import { useTheme } from '../contexts/ThemeContext';
import './Navigation.css';

const Navigation = () => {
    const location = useLocation();
    const { playNavClick, playPop } = useSound();
    const { expenseBorderColor, theme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const activeGlowColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7',
        white: '#ffffff',
        black: '#000000',
        red: '#FF0000',
        green: '#10B981',
        purple: '#8b5cf6',
        pink: '#ec4899',
        yellow: '#eab308',
        orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#818CF8' : '#4FA3F7') : (theme === 'dark' ? '#818CF8' : '#4FA3F7');

    const borderGlowClass = expenseBorderColor && expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';

    const handleNavClick = () => {
        if (playNavClick) playNavClick();
        setIsMobileMenuOpen(false);
    };

    if (location.pathname === '/') {
        return null;
    }


    const navItems = [
        { path: '/', label: 'Home', customIcon: '/home-icon.png' },
        { path: '/income', label: 'Streams', customIcon: '/income-icon.png' },
        { path: '/expenses', label: 'Expenses', customIcon: '/expenses-icon.png', customSize: '85px' },
        { path: '/projections', label: 'Projections', customIcon: '/projections-icon.png', customSize: '130px' },
        { path: '/investments', label: 'Investments', customIcon: '/investments-icon.png', customSize: '110px', customStyle: { marginLeft: '-20px' } },
    ];

    return (
        <>
            {/* Mobile Vertical Nav Backdrop */}
            <div 
                className={`mobile-nav-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMenuOpen(false);
                }}
            />

            {/* Mobile Vertical Floating Circle Trigger Button with 3 horizontal lines */}
            <button
                type="button"
                className={`mobile-nav-circle-btn ${borderGlowClass} ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMobileMenuOpen(prev => !prev);
                    try {
                        if (playPop) playPop();
                    } catch (err) {
                        console.debug("Audio error:", err);
                    }
                }}
                aria-label="Toggle navigation menu"
                style={{
                    '--nav-active-glow': activeGlowColor,
                    '--nav-active-glow-shadow': `${activeGlowColor}55`
                }}
            >
                <span className="hamburger-box">
                    <span className="hamburger-line line-1" />
                    <span className="hamburger-line line-2" />
                    <span className="hamburger-line line-3" />
                </span>
            </button>

            {/* Main Navigation Bar */}
            <nav 
                className={`navigation-bar ${borderGlowClass} ${isMobileMenuOpen ? 'mobile-popup-open' : ''} ${location.pathname === '/' ? 'waitlist-nav' : ''}`}
                style={{
                    '--nav-active-glow': activeGlowColor,
                    '--nav-active-glow-shadow': `${activeGlowColor}55`
                }}
            >

            <div className={`nav-links ${isMobileMenuOpen ? 'show' : ''}`}>
                {navItems.map(({ path, label, customIcon, customSize, customStyle }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `nav-link ${customIcon ? 'is-custom' : ''} ${isActive ? 'active' : ''}`
                        }
                        style={customStyle || {}}
                        onClick={(e) => {
                            handleNavClick();
                            if (location.pathname === '/') {
                                e.preventDefault();
                            }
                        }}
                    >
                        {customIcon && (
                            <>
                                <img
                                    src={customIcon}
                                    alt={label}
                                    className="nav-custom-icon"
                                    style={customSize ? { width: customSize, height: customSize } : {}}
                                />
                                <span className="nav-tooltip">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    </>
);
};

export default Navigation;
