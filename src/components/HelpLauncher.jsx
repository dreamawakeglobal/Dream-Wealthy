import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { HelpCircle, X, Search, Send, CheckCircle2, MessageSquare, ExternalLink, LifeBuoy } from 'lucide-react';
import { useSound } from '../SoundContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import './HelpLauncher.css';

const QUICK_FAQS = [
    { q: 'Is my bank data secure on Dream Wealthy?', a: 'Yes, we use bank-grade 256-bit AES encryption and read-only Plaid tokens.' },
    { q: 'How do I cancel or change my subscription?', a: 'You can manage or cancel your plan anytime under Settings -> Subscription.' },
    { q: 'What is the Debt Destroyer tool?', a: 'It calculates exact payoff dates using Snowball or Avalanche strategies.' },
    { q: 'Are AI Financial Advisor insights certified?', a: 'No, AI insights provide educational analysis and are not certified financial advice.' }
];

export const HelpLauncher = () => {
    const location = useLocation();
    const { playPop } = useSound();
    const { theme, expenseBorderColor } = useTheme();
    const { user } = useAuth();

    // Hide support launcher button on waitlist page
    if (location.pathname === '/' || location.pathname === '/waitlist' || location.pathname.endsWith('/index.html')) {
        return null;
    }
    
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('search'); // 'search' | 'ticket'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Ticket Form state
    const [name, setName] = useState(user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : '');
    const [email, setEmail] = useState(user?.email || '');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [ticketRef, setTicketRef] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#38bdf8' : '#0284c7') : '#0ea5e9';

    const toggleLauncher = () => {
        if (playPop) playPop();
        setIsOpen(!isOpen);
    };

    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        if (playPop) playPop();
        setErrorMsg('');

        if (!name || !email || !message) {
            setErrorMsg('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        const refId = `DW-${Math.floor(100000 + Math.random() * 900000)}`;
        setTicketRef(refId);

        try {
            // Save to contact_messages table
            const { error: dbError } = await supabase
                .from('contact_messages')
                .insert([{
                    name,
                    email,
                    subject: subject || 'Help Launcher Inquiry',
                    message
                }]);

            if (dbError) throw dbError;

            // Trigger Edge Function dispatch (defensively)
            try {
                await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message, ticketRef: refId })
                });
            } catch (emailErr) {
                console.log("Email dispatch notification queued in database:", emailErr);
            }

            setIsSuccess(true);
        } catch (err) {
            console.error("Help launcher ticket error:", err);
            setErrorMsg(err.message || 'Failed to send support message.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredFaqs = QUICK_FAQS.filter(f => 
        searchQuery === '' || 
        f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="help-launcher-wrapper">
            {/* Slide-over Glass Panel */}
            {isOpen && (
                <div className="help-panel-overlay animate-fade-in">
                    <Card glass className="help-panel-card">
                        <div className="help-panel-header" style={{ borderBottomColor: `${activeColor}40` }}>
                            <div className="help-header-title">
                                <LifeBuoy size={22} color={activeColor} />
                                <h3>Dream Wealthy Help Center</h3>
                            </div>
                            <button className="help-close-btn" onClick={toggleLauncher} aria-label="Close Help">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="help-tabs">
                            <button 
                                className={`help-tab ${activeTab === 'search' ? 'active' : ''}`}
                                onClick={() => { if (playPop) playPop(); setActiveTab('search'); }}
                                style={activeTab === 'search' ? { color: activeColor, borderColor: activeColor } : {}}
                            >
                                <Search size={15} /> Quick Answers
                            </button>
                            <button 
                                className={`help-tab ${activeTab === 'ticket' ? 'active' : ''}`}
                                onClick={() => { if (playPop) playPop(); setActiveTab('ticket'); }}
                                style={activeTab === 'ticket' ? { color: activeColor, borderColor: activeColor } : {}}
                            >
                                <MessageSquare size={15} /> Submit Ticket
                            </button>
                        </div>

                        {/* Tab Content 1: Quick Search */}
                        {activeTab === 'search' && (
                            <div className="help-tab-content animate-fade-in">
                                <div className="help-search-box">
                                    <Search size={16} className="search-icon" />
                                    <input 
                                        type="text" 
                                        placeholder="Search answers..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="help-search-input"
                                    />
                                </div>

                                <div className="help-faq-list">
                                    {filteredFaqs.map((faq, idx) => (
                                        <div key={idx} className="help-faq-item">
                                            <h4>{faq.q}</h4>
                                            <p>{faq.a}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="help-footer-link">
                                    <a href="/faq" target="_blank" rel="noreferrer">
                                        View Full FAQ Center <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Tab Content 2: Submit Support Ticket */}
                        {activeTab === 'ticket' && (
                            <div className="help-tab-content animate-fade-in">
                                {isSuccess ? (
                                    <div className="help-success-view">
                                        <CheckCircle2 size={52} color="var(--success)" />
                                        <h4>Support Ticket Created!</h4>
                                        <p>Our support team will respond to <strong>{email}</strong> shortly.</p>
                                        <div className="help-ticket-badge" style={{ borderColor: `${activeColor}60` }}>
                                            <span>Ticket Ref</span>
                                            <strong style={{ color: activeColor }}>#{ticketRef}</strong>
                                            <small>SLA response: &lt; 24 hours</small>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => { setIsSuccess(false); setMessage(''); setSubject(''); }}
                                            style={{ marginTop: '8px' }}
                                        >
                                            Submit Another Inquiry
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleTicketSubmit} className="help-form">
                                        {errorMsg && <div className="help-error">{errorMsg}</div>}
                                        
                                        <div className="help-field">
                                            <label>Name *</label>
                                            <Input 
                                                type="text" 
                                                value={name} 
                                                onChange={(e) => setName(e.target.value)} 
                                                placeholder="Your Name" 
                                                required 
                                            />
                                        </div>

                                        <div className="help-field">
                                            <label>Email *</label>
                                            <Input 
                                                type="email" 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)} 
                                                placeholder="you@example.com" 
                                                required 
                                            />
                                        </div>

                                        <div className="help-field">
                                            <label>Subject</label>
                                            <Input 
                                                type="text" 
                                                value={subject} 
                                                onChange={(e) => setSubject(e.target.value)} 
                                                placeholder="How can we help?" 
                                            />
                                        </div>

                                        <div className="help-field">
                                            <label>Message *</label>
                                            <textarea 
                                                value={message} 
                                                onChange={(e) => setMessage(e.target.value)} 
                                                placeholder="Describe your issue or feedback..." 
                                                required 
                                                rows={4}
                                            />
                                        </div>

                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            style={{ marginTop: '4px', background: activeColor, borderColor: activeColor }}
                                        >
                                            {isSubmitting ? 'Sending...' : 'Send Message'} <Send size={16} style={{ marginLeft: '6px' }} />
                                        </Button>
                                    </form>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Floating Trigger Launcher Button */}
            <button 
                className={`help-launcher-btn ${isOpen ? 'open' : ''}`} 
                onClick={toggleLauncher}
                aria-label="Open Help Center"
                style={{ '--glow-color': activeColor }}
            >
                {isOpen ? <X size={24} /> : <HelpCircle size={26} />}
                <span className="help-launcher-badge">Support</span>
            </button>
        </div>
    );
};

export default HelpLauncher;
