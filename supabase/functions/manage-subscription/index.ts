import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@14.18.0?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const authHeader = req.headers.get('Authorization') || '';

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized user session' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { action, priceId } = await req.json();

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, subscription_tier, subscription_status')
            .eq('id', user.id)
            .single();

        const customerId = profile?.stripe_customer_id;

        if (action === 'get_details') {
            if (!customerId) {
                return new Response(JSON.stringify({
                    tier: profile?.subscription_tier || 'basic',
                    status: profile?.subscription_status || 'active',
                    subscription: null
                }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                limit: 1
            });

            const sub = subscriptions.data[0] || null;

            return new Response(JSON.stringify({
                tier: profile?.subscription_tier || 'basic',
                status: profile?.subscription_status || 'active',
                subscription: sub ? {
                    id: sub.id,
                    status: sub.status,
                    cancel_at_period_end: sub.cancel_at_period_end,
                    current_period_end: sub.current_period_end,
                    plan: sub.items.data[0]?.price
                } : null
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'cancel' || action === 'reactivate') {
            if (!customerId) throw new Error('No active Stripe customer record found.');
            const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
            const sub = subscriptions.data[0];
            if (!sub) throw new Error('No active subscription found to modify.');

            const updated = await stripe.subscriptions.update(sub.id, {
                cancel_at_period_end: action === 'cancel'
            });

            await supabase
                .from('profiles')
                .update({
                    subscription_status: updated.cancel_at_period_end ? 'canceling' : updated.status
                })
                .eq('id', user.id);

            return new Response(JSON.stringify({ success: true, subscription: updated }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'change_plan') {
            if (!customerId) throw new Error('No active Stripe customer record found.');
            const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
            const sub = subscriptions.data[0];

            if (sub) {
                const updated = await stripe.subscriptions.update(sub.id, {
                    cancel_at_period_end: false,
                    items: [{
                        id: sub.items.data[0].id,
                        price: priceId,
                    }],
                    proration_behavior: 'always_invoice',
                });

                await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: 'premium',
                        subscription_status: 'active'
                    })
                    .eq('id', user.id);

                return new Response(JSON.stringify({ success: true, subscription: updated }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({ error: 'Invalid action requested' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
