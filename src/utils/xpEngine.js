import { supabase } from '../supabaseClient';

export const XP_RULES = {
    DAILY_CHECKIN: { xp: 50, label: 'Daily Check-in' },
    EXPENSE_LOG: { xp: 50, label: 'Expense Logged' },
    STREAK_7DAY: { xp: 200, label: '7-Day Active Streak' },
    BUDGET_ADHERENCE: { xp: 250, label: 'Monthly Budget Adherence' },
    SAVINGS_GOAL: { xp: 300, label: 'Savings Goal Reached' },
    DEBT_PAYOFF: { xp: 500, label: 'Debt Payoff Milestone' }
};

export const RANKS = [
    { key: 'DREAMER', level: 1, minXP: 0, title: 'Dreamer', icon: '🌱', description: 'Began the Dream Wealthy ascension' },
    { key: 'WEALTH_BUILDER', level: 5, minXP: 1000, title: 'Wealth Builder', icon: '⚔️', description: 'Architecting budget boundaries and spending control' },
    { key: 'DREAM_LIBERATOR', level: 10, minXP: 3000, title: 'Dream Liberator', icon: '🔨', description: 'Breaking debt chains and freeing monthly cash flow' },
    { key: 'WEALTH_STRATEGIST', level: 20, minXP: 8000, title: 'Wealth Strategist', icon: '🏛️', description: 'Multiplying income streams and emergency reserves' },
    { key: 'DREAM_TYCOON', level: 35, minXP: 20000, title: 'Dream Tycoon', icon: '⚡', description: 'Exponential compounding across liquid portfolios' },
    { key: 'DREAM_WEALTHY_SOVEREIGN', level: 50, minXP: 50000, title: 'Dream Wealthy Sovereign', icon: '👑', description: 'Attained complete financial freedom & Dream Wealthy mastery' }
];

export const calculateRankDetails = (totalXP = 0) => {
    let currentRank = RANKS[0];
    let nextRank = RANKS[1];

    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (totalXP >= RANKS[i].minXP) {
            currentRank = RANKS[i];
            nextRank = RANKS[i + 1] || null;
            break;
        }
    }

    const currentLevel = currentRank.level;

    let progressPercent = 100;
    let xpToNext = 0;

    if (nextRank) {
        const range = nextRank.minXP - currentRank.minXP;
        const earned = totalXP - currentRank.minXP;
        progressPercent = Math.min(100, Math.max(0, Math.round((earned / Math.max(1, range)) * 100)));
        xpToNext = Math.max(0, nextRank.minXP - totalXP);
    }

    return {
        totalXP,
        currentLevel,
        currentRank,
        nextRank,
        progressPercent,
        xpToNext
    };
};

export const getUserXPData = async (userId) => {
    if (!userId) {
        const localXP = Number(localStorage.getItem('dw_local_xp') || 0);
        return { totalXP: localXP, history: [], badges: [] };
    }

    try {
        const [historyRes, badgesRes] = await Promise.all([
            supabase.from('user_xp_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('user_badges').select('*').eq('user_id', userId)
        ]);

        const history = historyRes.data || [];
        const badges = badgesRes.data || [];
        const totalXP = history.reduce((sum, item) => sum + (Number(item.xp_amount) || 0), 0);

        return { totalXP, history, badges };
    } catch (err) {
        console.debug('Failed to fetch XP data from Supabase:', err);
        const localXP = Number(localStorage.getItem('dw_local_xp') || 0);
        return { totalXP: localXP, history: [], badges: [] };
    }
};

export const awardXP = async (userId, actionKey, customDescription = '') => {
    const rule = XP_RULES[actionKey];
    if (!rule) return null;

    const xpAmount = rule.xp;
    const description = customDescription || rule.label;

    let updatedXP = 0;

    if (userId) {
        try {
            await supabase.from('user_xp_history').insert({
                user_id: userId,
                xp_amount: xpAmount,
                action_type: actionKey,
                description
            });

            const { data } = await supabase.from('user_xp_history').select('xp_amount').eq('user_id', userId);
            updatedXP = (data || []).reduce((sum, i) => sum + (Number(i.xp_amount) || 0), 0);

            // Auto-check and unlock newly achieved badges
            const currentDetails = calculateRankDetails(updatedXP);
            if (currentDetails.currentRank) {
                await supabase.from('user_badges').upsert(
                    { user_id: userId, badge_key: currentDetails.currentRank.key, unlocked_at: new Date().toISOString() },
                    { onConflict: 'user_id,badge_key' }
                );
            }
        } catch (err) {
            console.debug('XP award falling back to local cache:', err);
        }
    }

    const prevLocal = Number(localStorage.getItem('dw_local_xp') || 0);
    updatedXP = updatedXP || (prevLocal + xpAmount);
    localStorage.setItem('dw_local_xp', String(updatedXP));

    return {
        awardedXP: xpAmount,
        totalXP: updatedXP,
        rule
    };
};
