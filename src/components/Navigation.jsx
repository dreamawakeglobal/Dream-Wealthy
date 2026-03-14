import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DollarSign, CreditCard, TrendingUp, PieChart, Flame, Menu, X } from 'lucide-react';
import { useSound } from '../SoundContext';
import './Navigation.css';

const Navigation = () => {
    const location = useLocation();
    const { playNavClick } = useSound();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);


    const navItems = [
        { path: '/', label: 'Home', customIcon: '/home-icon.png' },
        { path: '/income', label: 'Streams', customIcon: '/income-icon.png' },
        { path: '/expenses', label: 'Expenses', customIcon: '/expenses-icon.png', customSize: '85px' },
        { path: '/projections', label: 'Projections', customIcon: '/projections-icon.png', customSize: '130px' },
        { path: '/investments', label: 'Investments', customIcon: '/investments-icon.png', customSize: '110px', customStyle: { marginLeft: '-20px' } },
    ];

    return (
        <nav className={`navigation-bar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Hamburger Toggle - Only visible on mobile */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            <div className={`nav-links ${isMobileMenuOpen ? 'show' : ''}`}>
                {navItems.map(({ path, label, icon: Icon, customIcon, customSize, customStyle }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `nav-link ${customIcon ? 'is-custom' : ''} ${isActive ? 'active' : ''}`
                        }
                        style={customStyle || {}}
                        onClick={(e) => {
                            playNavClick();
                            if (location.pathname === '/') {
                                e.preventDefault();
                            }
                        }}
                    >
                        {customIcon ? (
                            <>
                                <img
                                    src={customIcon}
                                    alt={label}
                                    className="nav-custom-icon"
                                    style={customSize ? { width: customSize, height: customSize } : {}}
                                />
                                <span className="nav-tooltip">{label}</span>
                            </>
                        ) : (
                            <>
                                <Icon size={18} className="nav-icon" />
                                <span className="nav-label">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default Navigation;
