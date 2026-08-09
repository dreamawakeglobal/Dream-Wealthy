import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { supabase } from '../supabaseClient';
import './Legal.css'; // Re-use the layout styles from the legal pages

const Contact = () => {
    const { theme, expenseBorderColor } = useTheme();
    const { playPop } = useSound();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [ticketRef, setTicketRef] = useState('');

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : 'var(--accent-primary)';

    const handleSubmit = async (e) => {
        e.preventDefault();
        playPop();
        setErrorMsg('');
        
        if (!name || !email || !message) {
            setErrorMsg('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        const refId = `DW-${Math.floor(100000 + Math.random() * 900000)}`;
        setTicketRef(refId);
        
        try {
            // Save to database first
            const { error: dbError } = await supabase
                .from('contact_messages')
                .insert([{ 
                    name, 
                    email, 
                    subject: subject || 'General Support', 
                    message 
                }]);

            if (dbError) throw dbError;

            // Trigger Edge Function for notification dispatch (defensively)
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
            console.error('Contact form error:', err);
            setErrorMsg(err.message || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="legal-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="legal-header" style={{ borderBottom: `2px solid ${activeColor}`, width: '100%', maxWidth: '500px' }}>
                <MessageSquare size={48} color={activeColor} style={{ marginBottom: '16px' }} />
                <h1 style={{ textShadow: theme === 'dark' ? `0 0 12px ${activeColor}80` : 'none' }}>Contact Us</h1>
                <p>Have questions or feedback? Drop us a line below.</p>
            </div>

            <div className="legal-content" style={{ width: '100%', maxWidth: '500px' }}>
                <Card glass className="legal-card" style={{ padding: '32px' }}>
                    {isSuccess ? (
                        <div className="fade-in-up" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
                            <CheckCircle2 size={64} color="var(--success)" style={{ filter: 'drop-shadow(0 0 12px var(--success-glow))' }} />
                            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Message Received!</h2>
                            <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem' }}>
                                Thank you for reaching out, <strong>{name}</strong>. Our support team will respond to <strong>{email}</strong> shortly.
                            </p>
                            <div className="ticket-ref-badge" style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '12px 20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Support Ticket Reference</span>
                                <strong style={{ fontSize: '1.25rem', color: activeColor, fontFamily: 'monospace' }}>#{ticketRef}</strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated response SLA: &lt; 24 hours</span>
                            </div>
                            <Button 
                                onClick={() => { setIsSuccess(false); setMessage(''); setSubject(''); }} 
                                style={{ marginTop: '12px', width: '100%' }}
                                variant="outline"
                            >
                                Send Another Message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {errorMsg && (
                                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                                    {errorMsg}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Your Name *</label>
                                    <Input
                                        type="text"
                                        placeholder="Jane Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address *</label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Subject</label>
                                <Input
                                    type="text"
                                    placeholder="How can we help?"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Message *</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    required
                                    style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--surface-border)',
                                        background: 'rgba(255,255,255,0.8)',
                                        color: '#000000',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        minHeight: '150px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        transition: 'border-color 0.2s, box-shadow 0.2s'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = activeColor;
                                        e.target.style.boxShadow = `0 0 0 2px ${activeColor}33`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--surface-border)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                style={{ padding: '16px', fontSize: '1.1rem', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'} <Send size={18} />
                            </Button>
                        </form>
                    )}
                </Card>
            </div>
            {/* Force text color dark mode fix for textarea placeholder */}
            <style>{`
                [data-theme='dark'] textarea { color: #000000 !important; }
                [data-theme='dark'] textarea::placeholder { color: #64748b !important; }
            `}</style>
        </div>
    );
};

export default Contact;
