import React from 'react';
import { NavLink } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import './Footer.css';

const XIcon = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const TikTokIcon = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.37-1.13 4.75-2.92 6.36-1.74 1.56-4.14 2.38-6.49 1.94-2.48-.48-4.66-2.12-5.73-4.42-1.07-2.31-1.01-5.11.27-7.34 1.34-2.33 3.79-3.96 6.46-4.27v4.03c-1.69.15-3.23 1.25-3.99 2.76-.73 1.45-.63 3.29.35 4.58 1.01 1.28 2.75 1.78 4.3 1.39 1.54-.38 2.68-1.72 2.89-3.32.22-1.78.14-3.59.14-5.38V.02h.65z"/>
    </svg>
);

const Footer = () => {
    return (
        <footer className="global-footer glass">
            <div className="footer-content">
                <div className="footer-brand">
                    <img src="/logo-stamp.png" alt="Dream Wealthy Logo" className="footer-logo" loading="lazy" />
                    <p className="footer-tagline">Map your journey to wealth.</p>
                </div>

                <div className="footer-links">
                    <div className="footer-column">
                        <h4>Tools</h4>
                        <NavLink to="/dashboard">Dashboard</NavLink>
                        <NavLink to="/income">Streams</NavLink>
                        <NavLink to="/expenses">Expenses</NavLink>
                        <NavLink to="/projections">Projections</NavLink>
                        <NavLink to="/investments">Investments</NavLink>
                    </div>
                    <div className="footer-column">
                        <h4>Legal & Support</h4>
                        <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>
                        <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a>
                        <a href="/faq" target="_blank" rel="noreferrer">FAQ</a>
                        <a href="/contact" target="_blank" rel="noreferrer">Contact Us</a>
                    </div>
                    <div className="footer-column">
                        <h4>Socials</h4>
                        <a href="https://www.instagram.com/dreamwealthyco?igsh=MW1yOXlsdzFhOTJrNQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" className="social-link">
                            <Instagram size={18} /> Instagram
                        </a>
                        <a href="https://x.com" target="_blank" rel="noreferrer" className="social-link">
                            <XIcon size={18} /> X.com
                        </a>
                        <a href="https://www.tiktok.com/@dreamwealthyco?_r=1&_t=ZT-95TzBqekKGE" target="_blank" rel="noreferrer" className="social-link">
                            <TikTokIcon size={18} /> TikTok
                        </a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Dream Wealthy. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
