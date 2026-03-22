import React, { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../SoundContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { supabase } from '../supabaseClient';
import './Home.css'; // Re-use the existing Home styles for the hero section
import './Waitlist.css';

const Waitlist = () => {
    const { user } = useAuth();
    const { playPop } = useSound();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const videoRef = useRef(null);



    // Waitlist Form State
    const [showForm, setShowForm] = useState(false);
    const [email, setEmail] = useState('');
    const [referral, setReferral] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.65;
            // Force play for some mobile browsers that ignore autoPlay attribute
            videoRef.current.play().catch(e => console.log("Video auto-play prevented:", e));
        }
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Prevent scrolling on Waitlist page on desktop only via CSS
    useEffect(() => {
        document.body.classList.add('waitlist-body-lock');
        return () => {
            document.body.classList.remove('waitlist-body-lock');
        };
    }, []);

    // If a logged-in user hits the waitlist page, redirect them to the dashboard automatically
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleJoinClick = () => {
        playPop();
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        playPop();
        setErrorMsg('');

        if (!email) {
            setErrorMsg('Please enter your email.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('waitlist')
                .insert([{ email, referral_source: referral }]);

            if (error) throw error;
            setIsSuccess(true);
        } catch (err) {
            console.error('Waitlist error:', err);
            // Ignore unique constraint errors silently for better UX, or show custom message
            if (err.code === '23505') {
                setIsSuccess(true); // They are already on the list!
            } else {
                setErrorMsg(err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="home-container animate-fade-in">
            {/* Dynamic Background Glow */}
            <div
                className="pointer-glow"
                style={{
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`
                }}
            />

            {/* Hero Section */}
            <section className="hero-section">
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="hero-video-bg waitlist-video-bg"
                >
                    <source src="/hero-bg.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay"></div>
                <div className="hero-content" style={{ position: 'relative' }}>

                    <Card glass className="hero-box fade-in-up waitlist-hero-box" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '480px', width: '100%', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '2rem', textAlign: 'center', margin: 0 }}>Gain Early Access</h2>
                        <p className="text-muted" style={{ textAlign: 'center', fontSize: '1rem', marginTop: '-12px' }}>
                            Join the exclusive waitlist to secure your spot for the Dream Wealthy platform.
                        </p>

                        {!showForm && !isSuccess ? (
                            <div className="hero-actions" style={{ display: 'flex', width: '100%', marginTop: '16px' }}>
                                <Button
                                    style={{ flex: 1, padding: '16px 32px', fontSize: '1.1rem', height: 'auto', borderRadius: '12px' }}
                                    onClick={handleJoinClick}
                                >
                                    Join Waitlist <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                </Button>
                            </div>
                        ) : isSuccess ? (
                            <div className="success-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '16px', color: 'var(--success)' }}>
                                <CheckCircle2 size={48} />
                                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>You're on the list!</h3>
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Keep an eye on your inbox for early access invitations.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginTop: '16px' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address *</label>
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{ color: 'black' }}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>How did you hear about us?</label>
                                    <select
                                        value={referral}
                                        onChange={(e) => setReferral(e.target.value)}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--surface-border)',
                                            background: 'rgba(255,255,255,0.8)',
                                            color: 'black',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            backdropFilter: 'blur(8px)',
                                            WebkitBackdropFilter: 'blur(8px)',
                                            transition: 'border-color 0.2s'
                                        }}
                                    >
                                        <option value="" disabled>Select an option...</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="friend">Friend / Family</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {errorMsg && (
                                    <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>{errorMsg}</p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{ padding: '16px 32px', fontSize: '1.1rem', height: 'auto', borderRadius: '12px', marginTop: '8px' }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                            </form>
                        )}
                    </Card>
                </div>
            </section>
        </div>
    );
};

export default Waitlist;
