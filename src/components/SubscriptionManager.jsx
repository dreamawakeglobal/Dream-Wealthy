import React, { useMemo } from 'react';
import { detectSubscriptions } from '../utils/subscriptionDetector';
import { Card } from './ui/Card';
import { RefreshCw, Zap, Calendar, AlertCircle } from 'lucide-react';
import './SubscriptionManager.css';

export const SubscriptionManager = ({ transactions = [] }) => {
    const { subscriptions, totalMonthlyRecurring } = useMemo(() => {
        return detectSubscriptions(transactions);
    }, [transactions]);

    // Fallback demo subscriptions if transactions array is empty / fresh sandbox
    const displaySubs = subscriptions.length > 0 ? subscriptions : [
        { id: 'sub-demo-1', name: 'Netflix Premium', amount: 22.99, cadence: 'Monthly', monthlyCost: 22.99, nextBilling: '2026-08-18' },
        { id: 'sub-demo-2', name: 'Spotify Duo', amount: 14.99, cadence: 'Monthly', monthlyCost: 14.99, nextBilling: '2026-08-22' },
        { id: 'sub-demo-3', name: 'iCloud Storage 2TB', amount: 9.99, cadence: 'Monthly', monthlyCost: 9.99, nextBilling: '2026-08-28' },
        { id: 'sub-demo-4', name: 'Equinox Gym', amount: 240.00, cadence: 'Monthly', monthlyCost: 240.00, nextBilling: '2026-09-01' }
    ];

    const effectiveTotal = subscriptions.length > 0 
        ? totalMonthlyRecurring 
        : displaySubs.reduce((sum, s) => sum + s.monthlyCost, 0);

    return (
        <Card className="subscription-manager-card">
            <div className="sub-header">
                <div className="sub-title-group">
                    <div className="sub-icon-badge">
                        <RefreshCw className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="sub-heading">Recurring Subscriptions</h3>
                        <p className="sub-subheading">Algorithmic detection & cost tracking</p>
                    </div>
                </div>

                <div className="sub-total-badge">
                    <span className="sub-total-label">Monthly Recurring</span>
                    <span className="sub-total-val">${effectiveTotal.toFixed(2)}/mo</span>
                </div>
            </div>

            <div className="sub-grid">
                {displaySubs.map((sub) => (
                    <div key={sub.id} className="sub-item-card">
                        <div className="sub-item-info">
                            <div className="sub-name-row">
                                <span className="sub-name">{sub.name}</span>
                                <span className="sub-cadence-badge">{sub.cadence}</span>
                            </div>
                            <div className="sub-date-row">
                                <Calendar className="w-3.5 h-3.5 opacity-60" />
                                <span>Next: {sub.nextBilling}</span>
                            </div>
                        </div>

                        <div className="sub-item-price">
                            <span className="sub-price-val">${sub.amount.toFixed(2)}</span>
                            <span className="sub-freq">/{sub.cadence === 'Annual' ? 'yr' : 'mo'}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="sub-footer-note">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Auto-scans Plaid transactions for 28–35 day interval billing patterns.</span>
            </div>
        </Card>
    );
};

export default SubscriptionManager;
