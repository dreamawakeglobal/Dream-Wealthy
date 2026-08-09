import { supabase } from '../supabaseClient';

/**
 * Triggers the branded Welcome Onboarding Email via Supabase Edge Function
 */
export const triggerWelcomeEmail = async (email, name) => {
    if (!email) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, name })
        });
    } catch (err) {
        console.error('Failed to trigger welcome email:', err);
    }
};

/**
 * Triggers a security/relink alert email when Plaid connection expires
 */
export const triggerRelinkAlert = async (email, name, institutionName, errorCode = 'ITEM_LOGIN_REQUIRED') => {
    if (!email) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-relink-alert`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, name, institutionName, errorCode })
        });
    } catch (err) {
        console.error('Failed to trigger relink alert email:', err);
    }
};

/**
 * Triggers monthly digest summary email
 */
export const triggerMonthlyDigest = async (email, name, digestData = {}) => {
    if (!email) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-monthly-digest`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, name, ...digestData })
        });
    } catch (err) {
        console.error('Failed to trigger monthly digest email:', err);
    }
};
