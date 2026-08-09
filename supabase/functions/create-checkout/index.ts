// create-checkout Edge Function
// Creates a Stripe Checkout Session for Basic ($4.99) or Premium ($14.99) subscriptions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:5173";

// Stripe Price IDs — set these in Supabase Dashboard > Edge Functions > Secrets
const PRICE_IDS: Record<string, string> = {
    basic: Deno.env.get("STRIPE_BASIC_PRICE_ID") || "",
    premium: Deno.env.get("STRIPE_PREMIUM_PRICE_ID") || "",
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Authenticate the user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error("Missing authorization header");

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error("Invalid or expired token");

        // 2. Parse requested tier or priceId
        const { tier, priceId: inputPriceId } = await req.json();
        const priceId = inputPriceId || (tier ? PRICE_IDS[tier] : '');
        if (!priceId) throw new Error(`Invalid request. Valid priceId or tier is required.`);

        // 3. Initialize Stripe
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

        // 4. Get or create Stripe Customer
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;

            // Save customer ID to profile
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('user_id', user.id);
        }

        // 5. Create Checkout Session (Embedded or Hosted)
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            ui_mode: 'embedded',
            return_url: `${SITE_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
            line_items: [{ price: priceId, quantity: 1 }],
            subscription_data: {
                metadata: { supabase_user_id: user.id, tier: tier || 'premium' },
            },
        });

        return new Response(
            JSON.stringify({ 
                clientSecret: session.client_secret,
                url: session.url 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error("Checkout Error:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
