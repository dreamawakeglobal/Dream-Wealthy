import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "npm:plaid";

// Initialize CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dreamwealthyco.com',
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization Header. You must be logged in to connect a bank.");
    }

    const { userId, accessToken: rawAccessToken, accountId } = await req.json();

    if (!userId) {
      throw new Error("Missing user ID in request body.");
    }

    let resolvedAccessToken = rawAccessToken;

    // If accountId is provided, look up the access_token securely from isolated `plaid_credentials`
    if (accountId && !resolvedAccessToken) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: cred, error: credErr } = await supabaseAdmin
        .from('plaid_credentials')
        .select('plaid_access_token')
        .eq('account_id', accountId)
        .single();

      if (!credErr && cred?.plaid_access_token) {
        resolvedAccessToken = cred.plaid_access_token;
      }
    }

    // 3. Request Link Token from Plaid
    const plaidClient = getPlaidClient();

    const requestParams: any = {
      user: { client_user_id: userId },
      client_name: 'Dream Wealthy',
      language: 'en',
      country_codes: [CountryCode.Us],
      webhook: Deno.env.get('PLAID_WEBHOOK_URL') || undefined,
      redirect_uri: Deno.env.get('PLAID_REDIRECT_URI') || undefined,
    };

    if (resolvedAccessToken) {
        // [UPDATE MODE] Plaid strictly forbids passing `products` or `transactions` objects when issuing an Update Token.
        requestParams.access_token = resolvedAccessToken;
        console.log(`Generating Update Mode Token for user ${userId}...`);
    } else {
        // [STANDARD MODE]
        requestParams.products = [Products.Transactions];
        requestParams.transactions = { days_requested: 30 }; // Natively cap history so dashboards don't mathematically bloat!
        console.log(`Generating Standard Mode Token for user ${userId}...`);
    }

    const tokenResponse = await plaidClient.linkTokenCreate(requestParams);

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
