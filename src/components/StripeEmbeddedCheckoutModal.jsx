import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { X, ShieldCheck, Sparkles } from 'lucide-react';
import './StripeEmbeddedCheckoutModal.css';

const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51T8OjfQqQGuocs3F5Z0v5j4S...fallback'
);

export const StripeEmbeddedCheckoutModal = ({ clientSecret, onClose, planName = 'Dream Wealthy Premium' }) => {
    if (!clientSecret) return null;

    return (
        <div className="embedded-checkout-backdrop animate-fade-in">
            <div className="embedded-checkout-modal glass">
                <div className="embedded-checkout-header">
                    <div className="header-title-box">
                        <div className="modal-icon-badge">
                            <Sparkles size={20} color="#0ea5e9" />
                        </div>
                        <div>
                            <h3>Complete Your Subscription</h3>
                            <p className="subtitle">Instant access to {planName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-checkout-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="embedded-checkout-body">
                    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                        <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                </div>

                <div className="embedded-checkout-footer">
                    <ShieldCheck size={16} color="#10b981" />
                    <span>256-bit SSL Encrypted & Secured by Stripe</span>
                </div>
            </div>
        </div>
    );
};
