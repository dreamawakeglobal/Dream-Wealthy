import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSubscriptionEntitlements = () => {
    const { user, profile } = useAuth();

    return useMemo(() => {
        const rawTier = (profile?.subscription_tier || user?.user_metadata?.subscription_tier || 'none').toLowerCase();
        const rawStatus = (profile?.subscription_status || user?.user_metadata?.subscription_status || 'inactive').toLowerCase();

        // 3-Day Free Trial evaluation for new users
        const createdAtStr = user?.created_at || profile?.created_at;
        const createdDate = createdAtStr ? new Date(createdAtStr) : new Date();
        const diffDays = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
        
        const hasPaidSubscription = rawStatus === 'active' || (rawTier !== 'none' && rawTier !== 'free' && rawStatus !== 'inactive' && rawStatus !== 'canceled');
        const isTrialing = !hasPaidSubscription && diffDays <= 3;
        const isTrialExpired = !hasPaidSubscription && diffDays > 3;
        const trialDaysRemaining = Math.max(0, 3 - diffDays);

        const isPremium = rawTier === 'premium' && hasPaidSubscription;
        const hasActiveAccess = hasPaidSubscription || isTrialing;

        return {
            tier: rawTier,
            status: rawStatus,
            isPremium,
            hasPaidSubscription,
            isTrialing,
            isTrialExpired,
            trialDaysRemaining,
            hasActiveAccess,
            canUseAIAdvisor: isPremium || isTrialing,
            canUsePlaidAutoSync: isPremium || isTrialing,
            canUseMarketLiveFeed: isPremium || isTrialing
        };
    }, [user, profile]);
};
