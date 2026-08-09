import React from 'react';
import { Card } from '../components/ui/Card';
import { FileText, AlertTriangle, UserCheck, DollarSign, Ban, ShieldCheck, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './Legal.css';

const Terms = () => {
    const { theme, expenseBorderColor } = useTheme();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : 'var(--accent-primary)';

    return (
        <div className="legal-container animate-fade-in">
            <div className="legal-header" style={{ borderBottom: `2px solid ${activeColor}` }}>
                <FileText size={48} color={activeColor} style={{ marginBottom: '16px' }} />
                <h1 style={{ textShadow: theme === 'dark' ? `0 0 12px ${activeColor}80` : 'none' }}>Terms of Service</h1>
                <p>Effective Date: October 1, 2026 | Last Updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="legal-content">
                <Card glass className="legal-card">
                    <div className="legal-section">
                        <h2><UserCheck size={24} color={activeColor}/> 1. Acceptance of Terms</h2>
                        <p>By registering for an account, linking financial institutions, or using the services provided by Dream Wealthy Co. ("Dream Wealthy", "we", "us"), you ("User", "you") explicitly agree to be bound by these Terms of Service ("Terms") and our <a href="/privacy" style={{ color: activeColor }}>Privacy Policy</a>. If you do not agree to these Terms, you must immediately cease using the platform.</p>
                    </div>

                    <div className="legal-section">
                        <h2><AlertTriangle size={24} color={activeColor}/> 2. Educational & Informational Disclaimer (Not Financial Advice)</h2>
                        <p>Dream Wealthy provides automated cash flow forecasting, debt payoff strategy visualization, budget tracking tools, and AI-assisted financial insights. <strong>Dream Wealthy Co. is not a registered investment advisor, certified financial planner, broker-dealer, or tax advisor.</strong></p>
                        <p>All calculations, AI Advisor responses, projections, and debt payoff scenarios are provided for educational and informational purposes only. They do not constitute individualized financial, legal, investment, or tax advice. Always consult a licensed financial professional prior to making significant financial decisions.</p>
                    </div>

                    <div className="legal-section">
                        <h2><ShieldCheck size={24} color={activeColor}/> 3. Plaid Integration & Third-Party Financial Services</h2>
                        <p>Dream Wealthy uses Plaid Technologies, Inc. ("Plaid") to connect with your financial institutions. By linking bank accounts, you grant Dream Wealthy and Plaid the right, power, and authority to act on your behalf to access and transmit your personal and financial information from the relevant financial institution.</p>
                        <p>You agree to your personal and financial information being transferred, stored, and processed by Plaid in accordance with <a href="https://plaid.com/legal/#consumers" target="_blank" rel="noopener noreferrer" style={{ color: activeColor }}>Plaid's End User Privacy Policy</a>. Dream Wealthy is not responsible for bank service outages, Plaid API disruptions, or inaccuracies provided directly by financial institutions.</p>
                    </div>

                    <div className="legal-section">
                        <h2><DollarSign size={24} color={activeColor}/> 4. Subscriptions, Payments & Cancellations</h2>
                        <p>Access to advanced financial features (such as automated bank syncing, live stock market data, and AI Advisor memory) requires a paid subscription tier (Basic or Premium):</p>
                        <ul>
                            <li><strong>Billing:</strong> Subscriptions are processed via Stripe, Inc. and auto-renew on a monthly or annual basis until canceled.</li>
                            <li><strong>Cancellation Policy:</strong> You may cancel your subscription at any time via your <strong>Settings</strong> page (or the Stripe Billing Portal). Cancellations take effect at the conclusion of your current paid billing period.</li>
                            <li><strong>Refund Policy:</strong> Payments are non-refundable except where required by applicable consumer protection laws.</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><Ban size={24} color={activeColor}/> 5. Prohibited Uses & Account Termination</h2>
                        <p>You agree not to modify, reverse-engineer, attempt unauthorized database access, or exploit the platform. Dream Wealthy Co. reserves the right to suspend or terminate accounts engaging in fraudulent activity, security tampering, or violation of these Terms.</p>
                    </div>

                    <div className="legal-section">
                        <h2><Mail size={24} color={activeColor}/> 6. Contact Information</h2>
                        <p>For support, billing inquiries, or legal notifications, contact our support team:</p>
                        <p><strong>Dream Wealthy Co.</strong><br />
                        Email: <a href="mailto:support@dreamwealthyco.com" style={{ color: activeColor }}>support@dreamwealthyco.com</a><br />
                        Website: <a href="https://dreamwealthyco.com" target="_blank" rel="noopener noreferrer" style={{ color: activeColor }}>https://dreamwealthyco.com</a></p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Terms;
