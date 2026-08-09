import React from 'react';
import { Card } from '../components/ui/Card';
import { HelpCircle, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import FAQAccordion from '../components/FAQAccordion';
import './Legal.css';

const FAQPage = () => {
    const { theme, expenseBorderColor } = useTheme();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : 'var(--accent-primary)';

    return (
        <div className="legal-container animate-fade-in">
            <div className="legal-header" style={{ borderBottom: `2px solid ${activeColor}` }}>
                <HelpCircle size={48} color={activeColor} style={{ marginBottom: '16px' }} />
                <h1 style={{ textShadow: theme === 'dark' ? `0 0 12px ${activeColor}80` : 'none' }}>Help Center & FAQ</h1>
                <p>Find answers to common questions about Dream Wealthy tools, security, and subscriptions.</p>
            </div>

            <div className="legal-content">
                <FAQAccordion 
                    title="Frequently Asked Questions" 
                    subtitle="Filter by category or use the search bar to quickly locate what you need."
                />

                <Card glass className="legal-card" style={{ marginTop: '2.5rem', textAlign: 'center', padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Still have questions?</h3>
                    <p className="text-muted" style={{ marginBottom: '1.25rem' }}>Our dedicated support team is available to assist you with any account or feature inquiries.</p>
                    <a 
                        href="/contact" 
                        style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            padding: '0.75rem 1.5rem', 
                            borderRadius: '12px', 
                            background: activeColor, 
                            color: '#ffffff', 
                            fontWeight: '600', 
                            textDecoration: 'none' 
                        }}
                    >
                        <Mail size={18} /> Contact Support Team
                    </a>
                </Card>
            </div>
        </div>
    );
};

export default FAQPage;
