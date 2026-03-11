import React from 'react';
import { NavLink } from 'react-router-dom';
import './Footer.css';

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
                        <NavLink to="/projections">Projections</NavLink>
                        <NavLink to="/allocations">Allocations</NavLink>
                        <NavLink to="/debt">Debt Freer</NavLink>
                    </div>
                    <div className="footer-column">
                        <h4>Legal</h4>
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                        <a href="#contact">Contact Us</a>
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
