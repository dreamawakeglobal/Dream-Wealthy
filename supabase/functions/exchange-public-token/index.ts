import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Configuration, PlaidApi, PlaidEnvironments } from "npm:plaid";

// Initialize CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Plaid Client
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
    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase Client with the user's Auth Header (respects RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Initialize Admin Supabase Client (bypasses RLS for secure backend inserts)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the actual authenticated user ID from Supabase explicitly providing the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error(`Invalid Auth Token. Cannot identify user: ${userError?.message || 'Unknown error'}`);
    }

    // 3. Extract the Public Token and Bank Metadata sent by the React frontend
    const { publicToken, institutionName } = await req.json();

    if (!publicToken) {
      throw new Error("Missing publicToken in request body.");
    }

    // 4. Request the Permanent Access Token from Plaid
    const plaidClient = getPlaidClient();
    console.log(`Exchanging public token for user ${user.id}...`);

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // 5. Store the sensitive Access Token in our Supabase `accounts` table securely.
    // We use the supabaseAdmin to bypass potentially strict RLS insert policies
    console.log(`Saving Item ${itemId} to database...`);
    const { error: dbError } = await supabaseAdmin
      .from('accounts')
      .upsert({
        user_id: user.id, // Explicitly linked to the verified user
        plaid_item_id: itemId,
        plaid_access_token: accessToken,
        name: institutionName || 'My Connected Bank',
        type: 'depository', // Default representation 
        current_balance: 0, // Will be updated by Webhook syncs
      })
      .select();

    if (dbError) {
      throw new Error(`Failed to save account to database: ${dbError.message}`);
    }

    // 6. Return success to the frontend
    return new Response(
      JSON.stringify({ success: true, message: "Bank connected successfully!", itemId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Exchange Token Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred during exchange' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
