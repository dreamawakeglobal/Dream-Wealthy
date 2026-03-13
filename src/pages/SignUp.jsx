import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Sparkles, ArrowRight, Mail } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import './SignUp.css';

const SignUp = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setErrorMsg(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            setErrorMsg("Please enter your email above for a Magic Link");
            return;
        }
        setErrorMsg(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            setErrorMsg("Magic link sent! Check your inbox.");
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/dashboard');
            } else {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName
                        }
                    }
                });

                if (error) throw error;

                // Supabase defaults to requiring email confirmation
                if (data?.user && !data?.session) {
                    throw new Error("Account created! Please check your email to verify your account before logging in. (Or disable Email Confirmations in Supabase dashboard).");
                }

                navigate('/dashboard');
            }
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-page-container fade-in-up">
            <Card glass className="signup-card">
                <div className="signup-header">
                    <h2>{isLogin ? 'Welcome Back' : 'Start Your Journey'}</h2>
                    <p className="text-secondary">
                        {isLogin ? 'Log in to continue building wealth.' : 'Sign up to access your personalized financial dashboard.'}
                    </p>
                </div>

                {errorMsg && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="signup-form">
                    {!isLogin && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <Input
                                    type="text"
                                    placeholder="Jane"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <Input
                                    type="text"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <Input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <Button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '16px' }}>
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')} <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                    </Button>
                </form>

                <div className="social-auth-container" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ flex: 1, borderBottom: '1px solid var(--surface-border)' }}></div>
                        <span style={{ padding: '0 10px', fontSize: '0.85rem', letterSpacing: '1px' }}>OR CONTINUE WITH</span>
                        <div style={{ flex: 1, borderBottom: '1px solid var(--surface-border)' }}></div>
                    </div>

                    <Button variant="outline" onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', padding: '12px', background: 'transparent' }}>
                        Google
                    </Button>
                    {isLogin && (
                        <Button variant="outline" onClick={handleMagicLink} disabled={loading} style={{ width: '100%', padding: '12px', background: 'transparent' }}>
                            <Mail size={18} style={{ marginRight: '8px' }} /> Send Magic Link
                        </Button>
                    )}
                </div>

                <div className="signup-footer" style={{ marginTop: '24px' }}>
                    <button
                        className="toggle-auth-mode"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default SignUp;
