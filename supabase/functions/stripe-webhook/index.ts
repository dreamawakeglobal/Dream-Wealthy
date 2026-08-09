import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@14.18.0?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
    const signature = req.headers.get('stripe-signature');
    if (!signature && webhookSecret) {
        return new Response('Missing Stripe signature header', { status: 400 });
    }

    try {
        const body = await req.text();
        let event: Stripe.Event;

        if (webhookSecret && signature) {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } else {
            event = JSON.parse(body);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const customerId = session.customer as string;
                const userId = session.client_reference_id || session.metadata?.supabase_user_id;

                if (customerId) {
                    await supabase
                        .from('profiles')
                        .update({
                            stripe_customer_id: customerId,
                            subscription_tier: 'premium',
                            subscription_status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .or(`id.eq.${userId},stripe_customer_id.eq.${customerId}`);
                }
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = sub.customer as string;
                const status = sub.status; // 'active', 'trialing', 'past_due', 'canceled'
                const isPremium = status === 'active' || status === 'trialing';

                await supabase
                    .from('profiles')
                    .update({
                        stripe_customer_id: customerId,
                        subscription_tier: isPremium ? 'premium' : 'basic',
                        subscription_status: status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = sub.customer as string;

                await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: 'basic',
                        subscription_status: 'canceled',
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
});
