import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, X, Zap, Shield, TrendingUp, Sparkles, CreditCard } from 'lucide-react';
import { useFinancialContext } from '../FinancialContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useSound } from '../SoundContext';
import './Pricing.css';

const getPlans = (isYearly) => [
    {
        id: isYearly ? 'basic-yearly' : 'basic-monthly',
        name: 'Basic',
        price: isYearly ? '$4.00' : '$6.99',
        period: '/month',
        billedAs: isYearly ? 'Billed $48 annually' : 'Billed monthly',
        description: 'Take control of your money manually without automated syncing.',
        icon: Shield,
        color: '#0ea5e9',
        features: [
            { text: 'Manual Income & Expense Tracking', included: true },
            { text: '12-Month Financial Projections', included: true },
            { text: 'Debt Destroyer Strategies', included: true },
            { text: 'Savings Goals Tracker', included: true },
            { text: 'AI Advisor & Automation', included: false },
            { text: 'Active Investments Tracking', included: false },
            { text: 'Auto Tracking for Income & Expenses', included: false },
        ],
    },
    {
        id: isYearly ? 'premium-yearly' : 'premium-monthly',
        name: 'Premium',
        price: isYearly ? '$10.00' : '$12.99',
        period: '/month',
        billedAs: isYearly ? 'Billed $120 annually' : 'Billed monthly',
        description: 'Full automation. Everything seamlessly syncs in the background.',
        icon: Sparkles,
        color: 'var(--primary)',
        popular: true,
        features: [
            { text: 'Everything in Basic', included: true },
            { text: 'Plaid Bank Auto-Sync', included: true },
            { text: 'AI Advisor & Automation', included: true },
            { text: 'Active Investments Tracking', included: true },
            { text: 'Auto Tracking for Income & Expenses', included: true },
            { text: 'Live Market Data (Stocks & Crypto)', included: true },
            { text: 'Rules Engine Auto-Categorization', included: true },
            { text: 'Priority Chat Support', included: true },
        ],
    },
];

const Pricing = () => {
    const { profileData } = useFinancialContext();
    const { user } = useAuth();
    const { playPop } = useSound();
    const [isLoading, setIsLoading] = useState(null);
    const [isYearly, setIsYearly] = useState(true);
    const currentTier = profileData?.subscriptionTier || 'none';
    const currentPlans = getPlans(isYearly);

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

                <div className="pricing-toggle-container">
                    <div className="pricing-toggle">
                        <button 
                            className={`toggle-option ${!isYearly ? 'active' : ''}`}
                            onClick={() => { if(playPop) playPop(); setIsYearly(false); }}
                        >
                            Monthly
                        </button>
                        <button 
                            className={`toggle-option ${isYearly ? 'active' : ''}`}
                            onClick={() => { if(playPop) playPop(); setIsYearly(true); }}
                        >
                            Yearly <span className="save-badge">Save up to 40%</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="plans-grid">
                {currentPlans.map(plan => {
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
                            {plan.billedAs && <div className="price-billed">{plan.billedAs}</div>}
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
                                onClick={() => { if(playPop) playPop(); handleCheckout(plan.id); }}
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
