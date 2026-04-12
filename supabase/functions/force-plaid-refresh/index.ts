import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Configuration, PlaidApi, PlaidEnvironments } from 'npm:plaid';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://dreamwealthyco.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
        const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey || !supabaseAdminKey) {
            throw new Error('Supabase environment variables are missing.');
        }

        // 1. Authenticate User request statelessly
        const supabaseClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: req.headers.get('Authorization')! } },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error("Missing Authorization header!");
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError || !user) throw new Error(`Unauthorized API JWT verification failed: ${userError?.message || 'No user found'}`);

        // 2. Instantiate Admin Client
        const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

        // 3. Setup Plaid Client
        const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
        const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
        const plaidSecret = Deno.env.get('PLAID_SECRET');

        if (!plaidClientId || !plaidSecret) {
            throw new Error('Plaid environment variables are missing.');
        }

        const configuration = new Configuration({
            basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments],
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': plaidClientId,
                    'PLAID-SECRET': plaidSecret,
                    'Plaid-Version': '2020-09-14',
                },
            },
        });
        const plaidClient = new PlaidApi(configuration);

        // 4. Fetch the user's connected Plaid accounts
        const { data: accounts, error: accountError } = await supabaseAdmin
            .from('accounts')
            .select('*')
            .eq('user_id', user.id)
            .not('plaid_access_token', 'is', null);

        if (accountError) throw accountError;
        if (!accounts || accounts.length === 0) {
            return new Response(JSON.stringify({ success: true, message: 'No connected accounts found.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // 5. Forcefully Interrogate the Bank by executing /transactions/refresh on all accounts!
        for (const account of accounts) {
            try {
                await plaidClient.transactionsRefresh({
                    client_id: plaidClientId,
                    secret: plaidSecret,
                    access_token: account.plaid_access_token
                });
                console.log(`Bank Interrogation Initiated for Account ${account.id}`);
            } catch (refreshErr: any) {
                // Plaid returns an error if a refresh is already secretly running in the background. We safely ignore it.
                console.error(`Refresh collision on account ${account.id}. The system is already extracting data.`, refreshErr.response?.data?.error_message || refreshErr.message);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Forceful Bank Extraction Initiated!'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Force Plaid Refresh Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
