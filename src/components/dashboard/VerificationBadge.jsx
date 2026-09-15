import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowUpRight, UserCheck } from 'lucide-react';
import './VerificationBadge.css';

export const VERIFICATION_TIERS = {
    BANK_VERIFIED_BALANCE: 'BANK_VERIFIED_BALANCE',
    BANK_VERIFIED: 'BANK_VERIFIED', // Alias
    VERIFIED_CONTRIBUTION: 'VERIFIED_CONTRIBUTION',
    CONFIRMED_EXTERNAL_TRANSFER: 'CONFIRMED_EXTERNAL_TRANSFER',
    SELF_REPORTED: 'SELF_REPORTED',
    MIXED: 'MIXED'
};

export const VerificationBadge = ({ tier = 'SELF_REPORTED', size = 'sm', showTooltip = true }) => {
    let normalized = (tier || 'SELF_REPORTED').toUpperCase();
    if (normalized === 'BANK_VERIFIED') normalized = 'BANK_VERIFIED_BALANCE';

    let config = {
        label: 'Self-Reported',
        shortLabel: 'Manual',
        icon: UserCheck,
        className: 'badge-self-reported',
        description: 'Self-reported progress manually tracked by you.'
    };

    if (normalized === 'BANK_VERIFIED_BALANCE') {
        config = {
            label: 'Bank Verified',
            shortLabel: 'Verified',
            icon: ShieldCheck,
            className: 'badge-bank-verified',
            description: '100% verified against real-time connected bank balances.'
        };
    } else if (normalized === 'VERIFIED_CONTRIBUTION') {
        config = {
            label: 'Verified Transfer',
            shortLabel: 'Transferred',
            icon: CheckCircle2,
            className: 'badge-verified-contribution',
            description: 'Savings contribution confirmed via connected bank transfer.'
        };
    } else if (normalized === 'CONFIRMED_EXTERNAL_TRANSFER') {
        config = {
            label: 'External Outflow',
            shortLabel: 'External',
            icon: ArrowUpRight,
            className: 'badge-confirmed-external',
            description: 'Funds confirmed leaving checking to an external savings provider.'
        };
    } else if (normalized === 'MIXED') {
        config = {
            label: 'Partially Verified',
            shortLabel: 'Mixed',
            icon: ShieldCheck,
            className: 'badge-mixed',
            description: 'Funded by a mix of connected bank balances and manual savings.'
        };
    }

    const Icon = config.icon;

    return (
        <span 
            className={`verification-badge ${config.className} size-${size}`}
            title={showTooltip ? config.description : undefined}
        >
            <Icon size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} className="badge-icon" />
            <span className="badge-text">{size === 'xs' ? config.shortLabel : config.label}</span>
        </span>
    );
};
