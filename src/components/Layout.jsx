import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Settings, CreditCard } from 'lucide-react';
import './Layout.css';

const Layout = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        setIsProfileOpen(false);
        await signOut();
        navigate('/signup');
    };

    return (
        <div className="app-container">
            <Link to="/" className="logo-stamp-link">
                <img src="/logo-stamp.png" alt="Dream Wealthy Logo Stamp" className="logo-stamp" />
            </Link>
            <div className="sign-up-button-container">
                {user ? (
                    <div className="profile-menu-container" ref={dropdownRef}>
                        <button
                            className="profile-button glass"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            aria-label="Profile Menu"
                            style={user?.user_metadata?.avatar_url ? { backgroundImage: `url(${user.user_metadata.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                        >
                            {!user?.user_metadata?.avatar_url && <User size={20} />}
                        </button>

                        {isProfileOpen && (
                            <div className="profile-dropdown glass">
                                <div className="profile-dropdown-body">
                                    <button className="dropdown-item" onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}>
                                        <Settings size={16} /> Profile Settings
                                    </button>
                                    <button className="dropdown-item" onClick={() => { navigate('/pricing'); setIsProfileOpen(false); }}>
                                        <CreditCard size={16} /> Pricing
                                    </button>
                                    <button className="dropdown-item danger" onClick={handleSignOut}>
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Button onClick={() => navigate('/signup')} style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '1rem' }}>Build Wealth</Button>
                )}
            </div>
            <Navigation />
            <main className="main-content">
                <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-primary)' }}>Loading application...</div>}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
