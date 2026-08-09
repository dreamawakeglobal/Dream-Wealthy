import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Sparkles, Shield, ShieldCheck, ArrowLeft, Check, Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import './Checkout.css';

const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51T8OjfQqQGuocs3F5Z0v5j4S...fallback'
);

const Checkout = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const priceId = searchParams.get('priceId') || import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '';
    const planName = searchParams.get('plan') || 'Dream Wealthy Premium';
    const tier = searchParams.get('tier') || (planName.toLowerCase().includes('basic') ? 'basic' : 'premium');

    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const initCheckout = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqfxrbyjsbdfgmtxgvhu.supabase.co';

                const res = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ priceId, tier })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to initialize checkout session.');
                }

                const data = await res.json();
                if (isMounted) {
                    if (data.clientSecret) {
                        setClientSecret(data.clientSecret);
                    } else if (data.url) {
                        window.location.href = data.url;
                    } else {
                        throw new Error('No checkout session returned.');
                    }
                }
            } catch (err) {
                if (isMounted) setError(err.message || 'Error loading checkout page');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (user) {
            initCheckout();
        }
        return () => { isMounted = false; };
    }, [user, priceId, tier]);

    const isPremiumTier = tier === 'premium' || planName.toLowerCase().includes('premium');

    return (
        <div className="page-container checkout-page animate-fade-in">
            {/* Top Navigation */}
            <div className="checkout-top-bar">
                <button onClick={() => navigate('/settings')} className="back-link-btn">
                    <ArrowLeft size={18} /> Back to Settings
                </button>
                <div className="checkout-brand">
                    <Sparkles size={20} color="#0ea5e9" />
                    <span>Dream Wealthy Checkout</span>
                </div>
            </div>

            <div className="checkout-container-grid">
                {/* Left Pane: Order & Plan Summary */}
                <div className="checkout-summary-pane glass">
                    <div className="summary-header">
                        <div className="plan-badge-icon" style={{ background: isPremiumTier ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.08)' }}>
                            {isPremiumTier ? <Sparkles size={26} color="#0ea5e9" /> : <Shield size={26} color="#ffffff" />}
                        </div>
                        <div>
                            <span className="summary-tag">Selected Plan</span>
                            <h2>{planName}</h2>
                        </div>
                    </div>

                    <div className="summary-price-box">
                        <div className="price-title">Total Due Today</div>
                        <div className="price-display">
                            {isPremiumTier ? (
                                priceId?.includes('yearly') || searchParams.get('cycle') === 'yearly' ? '$10.00' : '$12.99'
                            ) : (
                                priceId?.includes('yearly') || searchParams.get('cycle') === 'yearly' ? '$4.00' : '$6.99'
                            )}
                            <span> / month</span>
                        </div>
                        <p className="price-subtext">
                            Includes 3-Day Free Access for New Accounts. Cancel anytime from Settings.
                        </p>
                    </div>

                    <div className="summary-features-list">
                        <h4>Included Features:</h4>
                        <ul>
                            {isPremiumTier ? (
                                <>
                                    <li><Check size={16} color="#10b981" /> <strong>Unlimited Plaid Bank Auto-Sync</strong></li>
                                    <li><Check size={16} color="#10b981" /> <strong>24/7 AI Financial Advisor Coaching</strong></li>
                                    <li><Check size={16} color="#10b981" /> <strong>Active Investments & Live Feeds</strong></li>
                                    <li><Check size={16} color="#10b981" /> Auto Tracking for Income & Expenses</li>
                                    <li><Check size={16} color="#10b981" /> Rules Engine Auto-Categorization</li>
                                </>
                            ) : (
                                <>
                                    <li><Check size={16} color="#10b981" /> Manual Income & Expense Tracking</li>
                                    <li><Check size={16} color="#10b981" /> 12-Month Financial Projections</li>
                                    <li><Check size={16} color="#10b981" /> Debt Destroyer Strategies</li>
                                    <li><Check size={16} color="#10b981" /> Savings Goals Tracker</li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className="trust-seal-box">
                        <ShieldCheck size={18} color="#10b981" />
                        <span>Encrypted & Secured by Stripe</span>
                    </div>
                </div>

                {/* Right Pane: Dedicated Embedded Stripe Form */}
                <div className="checkout-form-pane glass">
                    {loading && (
                        <div className="checkout-loading-box">
                            <RefreshCw size={32} className="spin-icon" color="#0ea5e9" />
                            <p>Loading secure payment form...</p>
                        </div>
                    )}

                    {error && (
                        <div className="checkout-error-box">
                            <Lock size={36} color="#ef4444" />
                            <h3>Unable to Load Checkout</h3>
                            <p>{error}</p>
                            <Button onClick={() => window.location.reload()} variant="primary" style={{ marginTop: '16px' }}>
                                Retry Payment Form
                            </Button>
                        </div>
                    )}

                    {!loading && !error && clientSecret && (
                        <div className="embedded-form-wrapper">
                            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Checkout;
