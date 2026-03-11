// stripe-webhook Edge Function
// Receives Stripe webhook events and updates the user's subscription_tier in the profiles table.
// Events handled:
//   - checkout.session.completed → sets tier to basic/premium
//   - customer.subscription.updated → updates tier if plan changed
//   - customer.subscription.deleted → reverts tier to 'none'

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const PRICE_TO_TIER: Record<string, string> = {
    [Deno.env.get("STRIPE_BASIC_PRICE_ID") || ""]: "basic",
    [Deno.env.get("STRIPE_PREMIUM_PRICE_ID") || ""]: "premium",
};

serve(async (req: Request) => {
    try {
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // 1. Verify webhook signature
        const body = await req.text();
        const sig = req.headers.get("stripe-signature");
        if (!sig) throw new Error("Missing Stripe signature");

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
        }

        console.log(`Stripe event received: ${event.type}`);

        // 2. Handle relevant events
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.subscription
                    ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata?.supabase_user_id
                    : null;
                const customerId = session.customer as string;

                if (!userId && customerId) {
                    // Fallback: look up user by stripe_customer_id
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("user_id")
                        .eq("stripe_customer_id", customerId)
                        .single();

                    if (profile) {
                        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                        const priceId = sub.items.data[0]?.price?.id || "";
                        const tier = PRICE_TO_TIER[priceId] || "basic";

                        await supabase
                            .from("profiles")
                            .update({
                                subscription_tier: tier,
                                stripe_subscription_id: session.subscription,
                            })
                            .eq("user_id", profile.user_id);
                    }
                } else if (userId) {
                    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                    const priceId = sub.items.data[0]?.price?.id || "";
                    const tier = PRICE_TO_TIER[priceId] || "basic";

                    await supabase
                        .from("profiles")
                        .update({
                            subscription_tier: tier,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: session.subscription,
                        })
                        .eq("user_id", userId);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                const priceId = subscription.items.data[0]?.price?.id || "";
                const tier = PRICE_TO_TIER[priceId] || "basic";
                const isActive = ["active", "trialing"].includes(subscription.status);

                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: isActive ? tier : "none",
                        stripe_subscription_id: subscription.id,
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: "none",
                        stripe_subscription_id: null,
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500 }
        );
    }
});
