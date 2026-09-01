import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSound } from '../SoundContext';
import { useTheme } from '../contexts/ThemeContext';
import './Navigation.css';

const Navigation = () => {
    const location = useLocation();
    const { playNavClick } = useSound();
    const { expenseBorderColor, theme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <nav 
            className={`navigation-bar ${isMobileMenuOpen ? 'mobile-open' : ''} ${location.pathname === '/' ? 'waitlist-nav' : ''}`}
            style={{
                '--nav-active-glow': activeGlowColor,
                '--nav-active-glow-shadow': `${activeGlowColor}55`
            }}
        >
            {/* Hamburger Toggle - Only visible on mobile */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

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
    );
};

export default Navigation;
