import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, X, Zap, Shield, TrendingUp, Sparkles, CreditCard } from 'lucide-react';
import { useFinancialContext } from '../FinancialContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import './Pricing.css';

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        price: '$4.99',
        period: '/month',
        description: 'Everything you need to take control of your money.',
        icon: Shield,
        color: '#0ea5e9',
        features: [
            { text: 'Manual Income & Expense Tracking', included: true },
            { text: '12-Month Financial Projections', included: true },
            { text: 'Debt Destroyer Strategies', included: true },
            { text: 'Savings Goals Tracker', included: true },
            { text: 'Manual Investment Portfolio', included: true },
            { text: 'Plaid Bank Auto-Sync', included: false },
            { text: 'Live Market Data', included: false },
            { text: 'Rules Engine Auto-Categorization', included: false },
        ],
    },
    {
        id: 'premium',
        name: 'Premium',
        price: '$14.99',
        period: '/month',
        description: 'Full automation. Your finances run themselves.',
        icon: Sparkles,
        color: 'var(--primary)',
        popular: true,
        features: [
            { text: 'Everything in Basic', included: true },
            { text: 'Plaid Bank Auto-Sync', included: true },
            { text: 'Live Market Data (Stocks & Crypto)', included: true },
            { text: 'Rules Engine Auto-Categorization', included: true },
            { text: 'Income Stream Auto-Tracker', included: true },
            { text: 'Real-Time Transaction Feed', included: true },
            { text: 'Priority Support', included: true },
            { text: 'Early Access to New Features', included: true },
        ],
    },
];

const Pricing = () => {
    const { profileData } = useFinancialContext();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(null);
    const currentTier = profileData?.subscriptionTier || 'none';

    const handleCheckout = async (tier) => {
        if (!user) return;
        setIsLoading(tier);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ tier }),
                }
            );

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Checkout error:', data.error);
            }
        } catch (err) {
            console.error('Failed to create checkout:', err);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="page-container animate-fade-in pricing-page">
            <div className="pricing-header">
                <h1 className="pricing-title">
                    Invest in Your <span className="text-gradient">Financial Future</span>
                </h1>
                <p className="pricing-subtitle">
                    Choose the plan that fits your goals. Cancel anytime.
                </p>
            </div>

            <div className="plans-grid">
                {PLANS.map(plan => {
                    const Icon = plan.icon;
                    const isActive = currentTier === plan.id;

                    return (
                        <div key={plan.id} className={`plan-card glass ${plan.popular ? 'popular' : ''} ${isActive ? 'active' : ''}`}>
                            {plan.popular && (
                                <div className="popular-badge">
                                    <Zap size={12} />
                                    Most Popular
                                </div>
                            )}
                            {isActive && (
                                <div className="active-badge">
                                    <Check size={12} />
                                    Current Plan
                                </div>
                            )}

                            <div className="plan-icon" style={{ background: `${plan.color}20`, color: plan.color }}>
                                <Icon size={28} />
                            </div>

                            <h2 className="plan-name">{plan.name}</h2>
                            <div className="plan-price">
                                <span className="price-amount">{plan.price}</span>
                                <span className="price-period">{plan.period}</span>
                            </div>
                            <p className="plan-desc">{plan.description}</p>

                            <div className="plan-features">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className={`feature-row ${feature.included ? '' : 'disabled'}`}>
                                        {feature.included ? (
                                            <Check size={16} className="feature-check" />
                                        ) : (
                                            <X size={16} className="feature-x" />
                                        )}
                                        <span>{feature.text}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`plan-cta ${plan.popular ? 'primary' : 'secondary'}`}
                                onClick={() => handleCheckout(plan.id)}
                                disabled={isActive || isLoading !== null}
                            >
                                {isLoading === plan.id ? (
                                    <span className="loading-dots">Processing...</span>
                                ) : isActive ? (
                                    'Current Plan'
                                ) : currentTier !== 'none' ? (
                                    `Switch to ${plan.name}`
                                ) : (
                                    `Get ${plan.name}`
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="pricing-footer">
                <p className="text-muted">
                    All plans include a 7-day money-back guarantee. Secured by Stripe.
                </p>
            </div>
        </div>
    );
};

export default Pricing;
