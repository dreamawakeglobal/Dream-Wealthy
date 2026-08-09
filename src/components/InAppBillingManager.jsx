import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Check, Zap, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../SoundContext';
import { Button } from './ui/Button';
import './InAppBillingManager.css';

import { useSubscriptionEntitlements } from '../hooks/useSubscriptionEntitlements';

export const InAppBillingManager = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { playPop, playCheck } = useSound() || {};
    const { isTrialing, trialDaysRemaining, isTrialExpired, hasPaidSubscription } = useSubscriptionEntitlements();

    const [loading, setLoading] = useState(true);
    const [subDetails, setSubDetails] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [actionLoading, setActionLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    const fetchSubscriptionDetails = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://xqfxrbyjsbdfgmtxgvhu.supabase.co'}/functions/v1/manage-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'get_details' })
            });

            if (res.ok) {
                const data = await res.json();
                setSubDetails(data);
            }
        } catch (err) {
            console.error('Failed to fetch subscription details:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscriptionDetails();
    }, [fetchSubscriptionDetails]);

    const handlePlanChange = async (targetPriceId, planName) => {
        if (playPop) playPop();
        const tier = planName.toLowerCase().includes('premium') ? 'premium' : 'basic';

        if (!hasPaidSubscription) {
            // Navigate to dedicated Checkout Page
            navigate(`/checkout?priceId=${encodeURIComponent(targetPriceId)}&plan=${encodeURIComponent(planName)}&tier=${tier}&cycle=${billingCycle}`);
            return;
        }

        // Active Subscriber In-App Plan Change
        setActionLoading(true);
        setStatusMessage(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqfxrbyjsbdfgmtxgvhu.supabase.co';

            const res = await fetch(`${baseUrl}/functions/v1/manage-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'change_plan', priceId: targetPriceId })
            });

            if (res.status === 404) {
                throw new Error('Supabase Edge Functions are not deployed to Supabase Cloud yet.');
            }

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (playCheck) playCheck();
            setStatusMessage({ type: 'success', text: `Successfully updated subscription to ${planName}!` });
            fetchSubscriptionDetails();
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.message || 'Failed to update plan' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelOrReactivate = async (actionType) => {
        if (playPop) playPop();
        if (actionType === 'cancel' && !window.confirm('Are you sure you want to cancel auto-renewal? You will keep your access until the end of the billing period.')) {
            return;
        }

        setActionLoading(true);
        setStatusMessage(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://xqfxrbyjsbdfgmtxgvhu.supabase.co'}/functions/v1/manage-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: actionType })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (playCheck) playCheck();
            setStatusMessage({
                type: 'success',
                text: actionType === 'cancel' ? 'Subscription cancellation scheduled at end of billing cycle.' : 'Subscription reactivated successfully!'
            });
            fetchSubscriptionDetails();
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.message || 'Action failed' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenStripePortal = async () => {
        if (playPop) playPop();
        setActionLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://xqfxrbyjsbdfgmtxgvhu.supabase.co'}/functions/v1/create-portal-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data?.url) window.location.href = data.url;
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const tier = profile?.subscription_tier || subDetails?.tier || 'basic';
    const isPremium = tier === 'premium';
    const isCanceling = subDetails?.subscription?.cancel_at_period_end;
    const currentPeriodEnd = subDetails?.subscription?.current_period_end 
        ? new Date(subDetails.subscription.current_period_end * 1000).toLocaleDateString()
        : null;

    return (
        <div className="in-app-billing-container glass">
            {/* Header & Status Banner */}
            <div className="billing-header-row">
                <div className="current-plan-card">
                    <div className="plan-badge-label">Current Plan</div>
                    <div className="plan-title-box">
                        <h3>{isPremium ? 'Dream Wealthy Premium' : hasPaidSubscription ? 'Dream Wealthy Basic' : '3-Day Free Trial'}</h3>
                        <span className={`status-pill ${isCanceling ? 'warning' : isTrialing ? 'warning' : isTrialExpired ? 'danger' : isPremium ? 'active' : 'active'}`}>
                            {isCanceling 
                                ? 'Cancels at Period End' 
                                : isTrialing 
                                ? `3-Day Free Trial (${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} left)` 
                                : isTrialExpired 
                                ? 'Free Trial Expired — Select Plan' 
                                : 'Active Subscription'}
                        </span>
                    </div>
                    {currentPeriodEnd && (
                        <p className="period-end-text">
                            {isCanceling ? `Access expires on ${currentPeriodEnd}` : `Renews on ${currentPeriodEnd}`}
                        </p>
                    )}
                </div>

                <div className="billing-actions-right">
                    {isPremium && isCanceling && (
                        <Button 
                            onClick={() => handleCancelOrReactivate('reactivate')} 
                            disabled={actionLoading}
                            className="reactivate-btn"
                        >
                            <RefreshCw size={16} /> Reactivate Auto-Renewal
                        </Button>
                    )}
                    {isPremium && !isCanceling && (
                        <Button 
                            onClick={() => handleCancelOrReactivate('cancel')} 
                            disabled={actionLoading}
                            className="cancel-btn"
                        >
                            Cancel Subscription
                        </Button>
                    )}
                    <button onClick={handleOpenStripePortal} className="portal-link-subtle">
                        Payment Cards & VAT Invoices <ExternalLink size={14} />
                    </button>
                </div>
            </div>

            {statusMessage && (
                <div className={`status-message-banner ${statusMessage.type}`}>
                    {statusMessage.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Billing Cycle Toggle */}
            <div className="cycle-toggle-wrapper">
                <span className="toggle-label">Billing Cycle:</span>
                <div className="cycle-pills">
                    <button 
                        className={`cycle-pill ${billingCycle === 'monthly' ? 'active' : ''}`}
                        onClick={() => { if(playPop) playPop(); setBillingCycle('monthly'); }}
                    >
                        Monthly Billing
                    </button>
                    <button 
                        className={`cycle-pill ${billingCycle === 'yearly' ? 'active' : ''}`}
                        onClick={() => { if(playPop) playPop(); setBillingCycle('yearly'); }}
                    >
                        Annual Billing <span className="discount-tag">Save up to 42%</span>
                    </button>
                </div>
            </div>

            {/* In-App Interactive Subscription Cards Grid */}
            <div className="in-app-plans-grid">
                {/* Basic Card */}
                <div className={`plan-card-option ${tier === 'basic' && !isPremium ? 'current' : ''}`}>
                    <div className="card-top">
                        <div className="plan-icon"><Shield size={22} /></div>
                        <h4>Basic</h4>
                        <div className="plan-price">
                            {billingCycle === 'monthly' ? '$6.99' : '$4.00'} 
                            <span> / month {billingCycle === 'yearly' ? '(billed $48/yr)' : '(billed monthly)'}</span>
                        </div>
                    </div>
                    <ul className="plan-features-list">
                        <li><Check size={16} /> Manual Income & Expense Tracking</li>
                        <li><Check size={16} /> 12-Month Financial Projections</li>
                        <li><Check size={16} /> Debt Destroyer Strategies</li>
                        <li><Check size={16} /> Savings Goals Tracker</li>
                    </ul>
                    <div className="card-footer">
                        {tier === 'basic' ? (
                            <div className="current-plan-indicator">Current Active Plan</div>
                        ) : (
                            <Button 
                                onClick={() => handlePlanChange(
                                    billingCycle === 'monthly'
                                        ? (import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly')
                                        : (import.meta.env.VITE_STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly'),
                                    `Basic ${billingCycle}`
                                )}
                                disabled={actionLoading}
                                className="downgrade-btn"
                            >
                                Switch to Basic
                            </Button>
                        )}
                    </div>
                </div>

                {/* Premium Card */}
                <div className={`plan-card-option premium-glow ${isPremium ? 'current' : ''}`}>
                    <div className="popular-badge">MOST POPULAR</div>
                    <div className="card-top">
                        <div className="plan-icon premium-icon"><Sparkles size={22} /></div>
                        <h4>Dream Wealthy Premium</h4>
                        <div className="plan-price">
                            {billingCycle === 'monthly' ? '$12.99' : '$10.00'} 
                            <span> / month {billingCycle === 'yearly' ? '(billed $120/yr)' : '(billed monthly)'}</span>
                        </div>
                    </div>
                    <ul className="plan-features-list">
                        <li><Check size={16} /> <strong>Everything in Basic</strong></li>
                        <li><Check size={16} /> <strong>Plaid Bank Auto-Sync</strong></li>
                        <li><Check size={16} /> <strong>24/7 AI Advisor & Automation</strong></li>
                        <li><Check size={16} /> <strong>Active Investments Tracking</strong></li>
                        <li><Check size={16} /> Live Stock Market & Crypto Feeds</li>
                        <li><Check size={16} /> Rules Engine Auto-Categorization</li>
                    </ul>
                    <div className="card-footer">
                        {isPremium ? (
                            <div className="current-plan-indicator active-indicator">
                                <Zap size={16} /> Active Premium Membership
                            </div>
                        ) : (
                            <Button 
                                onClick={() => handlePlanChange(
                                    billingCycle === 'monthly' 
                                        ? (import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_monthly')
                                        : (import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_yearly'),
                                    `Premium ${billingCycle}`
                                )}
                                disabled={actionLoading}
                                className="upgrade-now-btn"
                            >
                                {actionLoading ? 'Updating Plan...' : 'Switch to Premium'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
