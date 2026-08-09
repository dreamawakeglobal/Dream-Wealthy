import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        billedAs: isYearly ? '3-Day Free Trial, then $48 billed annually' : '3-Day Free Trial, then $6.99 billed monthly',
        description: 'Includes a 3-Day Free Trial. Core budgeting & projections.',
        icon: Shield,
        color: '#0ea5e9',
        features: [
            { text: '3-Day Free Access for New Accounts', included: true },
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
        billedAs: isYearly ? '3-Day Free Trial, then $120 billed annually' : '3-Day Free Trial, then $12.99 billed monthly',
        description: 'Includes a 3-Day Free Trial. Full automation & AI Advisor.',
        icon: Sparkles,
        color: 'var(--primary)',
        popular: true,
        features: [
            { text: 'Everything in Basic', included: true },
            { text: '3-Day Free Access for New Accounts', included: true },
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
    const navigate = useNavigate();
    const { profileData } = useFinancialContext();
    const { user } = useAuth();
    const { playPop } = useSound();
    const [isLoading, setIsLoading] = useState(null);
    const [isYearly, setIsYearly] = useState(true);
    const currentTier = profileData?.subscriptionTier || 'none';
    const currentPlans = getPlans(isYearly);

    const handleCheckout = (tierName) => {
        if (!user) {
            navigate('/signup');
            return;
        }
        if (playPop) playPop();
        const priceId = tierName === 'premium' 
            ? (isYearly ? (import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID || '') : (import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID || ''))
            : (isYearly ? (import.meta.env.VITE_STRIPE_BASIC_YEARLY_PRICE_ID || '') : (import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID || ''));

        const planName = tierName === 'premium' ? `Dream Wealthy Premium` : `Dream Wealthy Basic`;

        navigate(`/checkout?priceId=${encodeURIComponent(priceId)}&plan=${encodeURIComponent(planName)}&tier=${tierName}&cycle=${isYearly ? 'yearly' : 'monthly'}`);
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
