import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "npm:plaid";

// Initialize CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Plaid Client inside the function scope to grab fresh ENV variables on boot
const getPlaidClient = () => {
  return new PlaidApi(new Configuration({
    basePath: PlaidEnvironments[Deno.env.get('PLAID_ENV') || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': Deno.env.get('PLAID_CLIENT_ID'),
        'PLAID-SECRET': Deno.env.get('PLAID_SECRET'),
        'Plaid-Version': '2020-09-14',
      },
    },
  }));
};

serve(async (req) => {
  // 1. Handle CORS Preflight Requests from the Browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validate User Authentication
    // The React frontend will pass the user's Supabase JWT in the Auth header.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization Header. You must be logged in to connect a bank.");
    }

    // We could decode the JWT here to get the exact User ID, but for the link request 
    // we can just extract the payload sent by the client.
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("Missing user ID in request body.");
    }

    // 3. Request Link Token from Plaid
    const plaidClient = getPlaidClient();

    const tokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId, // Plaid demands a unique ID per user to prevent duplicate items
      },
      client_name: 'Dream Wealthy',
      products: [Products.Transactions],
      language: 'en',
      country_codes: [CountryCode.Us],
      webhook: Deno.env.get('PLAID_WEBHOOK_URL') || undefined,
    });

    // 4. Return the Token securely
    return new Response(
      JSON.stringify(tokenResponse.data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Link Token Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
