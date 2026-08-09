import React, { useMemo } from 'react';
import { calculateSavingsOptimization } from '../utils/savingsEngine';
import { Card } from './ui/Card';
import { TrendingUp, ShieldCheck, DollarSign, ArrowUpRight } from 'lucide-react';
import './SavingsOptimizationCard.css';

export const SavingsOptimizationCard = ({ plaidAccounts = [], monthlyExpenses = 3200 }) => {
    const metrics = useMemo(() => {
        return calculateSavingsOptimization(plaidAccounts, monthlyExpenses, 5.0);
    }, [plaidAccounts, monthlyExpenses]);

    return (
        <Card className="savings-optimization-card">
            <div className="savings-opt-header">
                <div className="savings-title-group">
                    <div className="savings-icon-badge">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="savings-heading">High-Yield Yield Strategy</h3>
                        <p className="savings-subheading">Idle cash optimization engine</p>
                    </div>
                </div>

                <div className="savings-yield-badge">
                    <span className="savings-yield-label">Target HYSA APY</span>
                    <span className="savings-yield-val">{metrics.hysaApy}% APY</span>
                </div>
            </div>

            <div className="savings-metrics-grid">
                <div className="savings-metric-box">
                    <span className="savings-metric-label">Liquid Checking Cash</span>
                    <span className="savings-metric-val">${metrics.totalLiquidCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="savings-metric-box">
                    <span className="savings-metric-label">3-Mo Emergency Reserve</span>
                    <span className="savings-metric-val font-semibold">${metrics.emergencyFundNeeded.toLocaleString()}</span>
                </div>

                <div className="savings-metric-box highlight-box">
                    <span className="savings-metric-label">Optimizable Surplus Cash</span>
                    <span className="savings-metric-val text-sky-400">${metrics.surplusCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>

            <div className="savings-yield-callout">
                <div className="yield-callout-text">
                    <span className="yield-callout-title">Est. Annual Interest Earned:</span>
                    <span className="yield-callout-amount">+${metrics.potentialAnnualYield.toLocaleString()}/yr</span>
                </div>
                <button className="savings-action-btn" onClick={() => window.open('https://www.bankrate.com/banking/savings/best-high-yield-interests-savings-accounts/', '_blank')}>
                    Explore Top HYSAs <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>
        </Card>
    );
};

export default SavingsOptimizationCard;
