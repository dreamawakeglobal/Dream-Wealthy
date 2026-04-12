import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Configuration, PlaidApi, PlaidEnvironments } from "npm:plaid";

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
      throw new Error("Missing Authorization Header. You must be logged in to sync bank accounts.");
    }
    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase Client with the user's Auth Header (respects RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Initialize Admin Supabase Client (bypasses RLS to fetch the sensitive access_tokens)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract verified user ID
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error(`Invalid Auth Token. Cannot identify user: ${userError?.message || 'Unknown error'}`);
    }

    // 3. Fetch the linked Plaid items from the database
    const { data: accounts, error: dbError } = await supabaseAdmin
      .from('accounts')
      .select('plaid_access_token')
      .eq('user_id', user.id);

    if (dbError) {
      throw new Error(`Database error fetching tracked accounts: ${dbError.message}`);
    }

    if (!accounts || accounts.length === 0) {
       // Return zeros safely if the user hasn't successfully connected their bank yet.
       return new Response(JSON.stringify({ checking: 0, savings: 0, total: 0 }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       });
    }

    // 4. Ping Plaid to fetch Live Balances across all linked institutions
    const plaidClient = getPlaidClient();
    let totalChecking = 0;
    let totalSavings = 0;
    const balancesToUpsert: any[] = [];

    for (const acc of accounts) {
       if (!acc.plaid_access_token) continue;
       try {
           const response = await plaidClient.accountsGet({
             access_token: acc.plaid_access_token
           });
           
           const data = response.data.accounts;
           
           data.forEach((bankObj: any) => {
               // Safely parse balance properties
               const balance = bankObj.balances?.available !== null 
                                ? bankObj.balances.available 
                                : bankObj.balances?.current || 0;
                                
               if (bankObj.subtype === 'checking') {
                   totalChecking += balance;
               } else if (bankObj.subtype === 'savings') {
                   totalSavings += balance;
               }

               // Push to UPSERT Pipeline
               balancesToUpsert.push({
                   user_id: user.id,
                   item_id: acc.id, // Using our internal accounts (Item) table UUID
                   plaid_account_id: bankObj.account_id,
                   name: bankObj.name,
                   mask: bankObj.mask,
                   type: bankObj.type,
                   subtype: bankObj.subtype,
                   current_balance: bankObj.balances.current,
                   available_balance: bankObj.balances.available,
                   last_synced_at: new Date().toISOString()
               });
           });
       } catch(plaidErr) {
           console.error("Failed to sync bank item:", plaidErr);
           // We intentionally swallow isolated institution errors so the rest of the accounts load!
       }
    }

    // 4.5. CACHE WARMER: Instantly push the data into the Database-First architecture
    if (balancesToUpsert.length > 0) {
        const { error: upsertErr } = await supabaseAdmin
            .from('bank_balances')
            .upsert(balancesToUpsert, { onConflict: 'user_id, plaid_account_id' });
        
        if (upsertErr) console.error("Cache Warmer Error:", upsertErr);
        else console.log(`Successfully warmed cache with ${balancesToUpsert.length} balances.`);
    }

    // 5. Send the mathematical output natively back to the React Front-End
    return new Response(
      JSON.stringify({
        checking: totalChecking,
        savings: totalSavings,
        total: totalChecking + totalSavings
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Fetch Plaid Accounts Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred extracting balances' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
