import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, ArrowRight, Mail } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import './SignUp.css';

const SignUp = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLogin, setIsLogin] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);

    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

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
                
                {successMsg && (
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', marginBottom: '16px' }}>
                        {successMsg}
                    </div>
                )}

                {!showEmailForm ? (
                    <div className="social-auth-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        <button onClick={handleGoogleLogin} disabled={loading} className="auth-pill-btn white">
                            <svg viewBox="0 0 48 48" className="oauth-provider-icon">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            {isLogin ? 'Log in with Google' : 'Sign up with Google'}
                        </button>
                        
                        <button disabled={loading} className="auth-pill-btn white" onClick={() => {
                            setErrorMsg(null);
                            setLoading(true);
                            supabase.auth.signInWithOAuth({ provider: 'apple' }).catch(err => setErrorMsg(err.message)).finally(() => setLoading(false));
                        }}>
                            <svg viewBox="0 0 24 24" className="oauth-provider-icon" fill="currentColor">
                                <path d="M16.365 21.444c-1.343.916-2.585.916-4.004.03-1.472-.897-2.618-.897-4.04 0-1.745 1.053-3.23.633-4.634-1.405-3.328-4.88-4.32-9.722-1.79-13.565 1.4-2.137 3.518-3.35 5.568-3.35 1.343 0 2.585.674 3.784.674 1.258 0 2.753-.787 4.397-.787 2.05 0 3.864 1.025 5.015 2.65-4.156 2.45-3.483 8.35 1.077 10.158-1.025 3.012-2.923 5.4-4.846 6.17-.184.07-.369.14-.555.21v-.702c-.015-.027 0-.056 0-.083h.028v.703zM15.534 3.14c-1.12.015-2.452.744-3.279 1.705-.724.84-1.252 2.018-1.048 3.12 1.238.076 2.493-.604 3.256-1.554.739-.893 1.243-2.11 1.028-3.21-.015-.015-.015-.03-.015-.045v-.016h.058z"/>
                            </svg>
                            {isLogin ? 'Log in with Apple' : 'Sign up with Apple'}
                        </button>

                        <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)', margin: '8px 0' }}>
                            <div className="auth-divider-line"></div>
                            <span style={{ padding: '0 16px', fontSize: '0.9rem', fontWeight: 500 }}>OR</span>
                            <div className="auth-divider-line"></div>
                        </div>

                        <button onClick={() => setShowEmailForm(true)} className="auth-pill-btn gray">
                            {isLogin ? 'Log in with email' : 'Create account'}
                        </button>
                    </div>
                ) : (
                    <div className="email-auth-container fade-in-up">
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

                        {isLogin && (
                            <div style={{ marginTop: '16px' }}>
                                <Button variant="outline" onClick={handleMagicLink} disabled={loading} style={{ width: '100%', padding: '12px', background: 'transparent' }}>
                                    <Mail size={18} style={{ marginRight: '8px' }} /> Send Magic Link
                                </Button>
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <button
                                className="toggle-auth-mode"
                                onClick={() => setShowEmailForm(false)}
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                ← Back to options
                            </button>
                        </div>
                    </div>
                )}

                {!showEmailForm && (
                    <div className="signup-footer" style={{ marginTop: '24px' }}>
                        <button
                            className="toggle-auth-mode"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SignUp;
