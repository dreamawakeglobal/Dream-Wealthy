import React from 'react';
import { Card } from '../components/ui/Card';
import { Shield, Lock, Eye, Server, RefreshCw, Mail, CheckCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './Legal.css';

const Privacy = () => {
    const { theme, expenseBorderColor } = useTheme();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : 'var(--accent-primary)';

    return (
        <div className="legal-container animate-fade-in">
            <div className="legal-header" style={{ borderBottom: `2px solid ${activeColor}` }}>
                <Shield size={48} color={activeColor} style={{ marginBottom: '16px' }} />
                <h1 style={{ textShadow: theme === 'dark' ? `0 0 12px ${activeColor}80` : 'none' }}>Privacy Policy</h1>
                <p>Effective Date: October 1, 2026 | Last Updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="legal-content">
                <Card glass className="legal-card">
                    <div className="legal-section">
                        <h2><Eye size={24} color={activeColor}/> 1. Information We Collect</h2>
                        <p>At Dream Wealthy Co., we respect your privacy and process personal data in accordance with applicable privacy laws. We collect information you provide directly and financial data synchronized through our authorized integration partners:</p>
                        <ul>
                            <li><strong>Account & Profile Information:</strong> Name, email address, avatar preferences, and authentication identifiers.</li>
                            <li><strong>Financial Account & Transaction Data:</strong> When you connect a financial institution via Plaid Technologies, Inc. ("Plaid"), we retrieve read-only account balances, institution names, mask numbers, and transaction history. <strong>We never see, handle, or store your bank account usernames or passwords.</strong></li>
                            <li><strong>Subscription & Billing Information:</strong> Payment details are processed directly by Stripe. Dream Wealthy does not store raw credit card numbers or CVVs.</li>
                            <li><strong>AI Interactions:</strong> Conversations with the Dream Wealthy AI Advisor are stored securely to maintain conversational memory across your sessions.</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><Server size={24} color={activeColor}/> 2. How We Use Your Data</h2>
                        <p>We use your information strictly to operate, deliver, and personalize your financial dashboard:</p>
                        <ul>
                            <li>To generate automated cash flow forecasts, debt payoff schedules, and budget allocations.</li>
                            <li>To power AI financial coaching recommendations tailored to your goals.</li>
                            <li>To send critical security alerts, account updates, and transactional receipts.</li>
                        </ul>
                        <p><strong>Strict Anti-Monetization Guarantee:</strong> We do NOT sell, rent, or trade your personal or financial data to third-party advertisers or data brokers.</p>
                    </div>

                    <div className="legal-section">
                        <h2><Lock size={24} color={activeColor}/> 3. Enterprise-Grade Security Architecture</h2>
                        <p>We employ multi-layered bank-level safeguards to protect your information:</p>
                        <ul>
                            <li><strong>Isolated Plaid Access Token Storage:</strong> Plaid API access tokens are isolated in a private database table (`plaid_credentials`) enforced by Row-Level Security (RLS) with zero public API access. Client applications never receive raw API tokens.</li>
                            <li><strong>Encryption Standards:</strong> Data in transit is protected using TLS 1.3 encryption. Data at rest is encrypted using 256-bit AES encryption protocols.</li>
                            <li><strong>Strict Row Level Security (RLS):</strong> PostgreSQL database policies ensure your financial records are strictly isolated to your verified authenticated user ID (`auth.uid() = user_id`).</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><RefreshCw size={24} color={activeColor}/> 4. Third-Party Service Providers</h2>
                        <p>We partner with industry-leading compliance infrastructure providers to deliver our services:</p>
                        <ul>
                            <li>
                                <strong>Plaid Technologies, Inc.:</strong> By using our financial syncing service, you grant Dream Wealthy and Plaid the right to access and transmit your financial data from your financial institution. You acknowledge and agree that your data will be handled in accordance with <a href="https://plaid.com/legal/#consumers" target="_blank" rel="noopener noreferrer" style={{ color: activeColor }}>Plaid's End User Privacy Policy</a>.
                            </li>
                            <li>
                                <strong>Stripe, Inc.:</strong> Payment processing is governed by Stripe's Privacy Policy and PCI-DSS Level 1 compliance standards.
                            </li>
                            <li>
                                <strong>Supabase, Inc.:</strong> Cloud database hosting and user authentication infrastructure governed by SOC2 compliance controls.
                            </li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><Trash2 size={24} color={activeColor}/> 5. Your Data Rights & Account Deletion</h2>
                        <p>You own your data. At any time, you can:</p>
                        <ul>
                            <li>Disconnect connected bank accounts directly from your <strong>Settings</strong> page.</li>
                            <li>Export your transactions and projected financial reports.</li>
                            <li>Request full account and data deletion by contacting support or initiating an account wipe. Upon deletion, all associated accounts, transactions, and AI message history are permanently purged from our primary databases.</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><Mail size={24} color={activeColor}/> 6. Contact & Support</h2>
                        <p>If you have any questions, data access requests, or privacy concerns, please contact our privacy compliance team:</p>
                        <p><strong>Dream Wealthy Co.</strong><br />
                        Email: <a href="mailto:support@dreamwealthyco.com" style={{ color: activeColor }}>support@dreamwealthyco.com</a><br />
                        Website: <a href="https://dreamwealthyco.com" target="_blank" rel="noopener noreferrer" style={{ color: activeColor }}>https://dreamwealthyco.com</a></p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Privacy;
