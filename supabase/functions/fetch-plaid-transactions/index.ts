import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Configuration, PlaidApi, PlaidEnvironments } from 'npm:plaid';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
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

        // 1. Authenticate User request
        const supabaseClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: req.headers.get('Authorization')! } }
        });

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error('Unauthorized');

        // 2. Instantiate Admin Client for securely reading accounts & writing transactions
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

        // 4. Fetch the user's connected Plaid accounts from Supabase
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

        let totalAdded = 0;
        let totalModified = 0;
        let totalRemoved = 0;

        // 5. Loop through each item/account and securely execute Transactions Sync!
        for (const account of accounts) {
            const accessToken = account.plaid_access_token;
            let cursor = account.transactions_cursor || '';
            let hasMore = true;

            const added = [];
            const modified = [];
            const removed = [];

            // Supabase Free Tier Hard Timeout limit is 10.0 seconds!
            // We strictly process exactly 1 page (200 records) per Edge execution.
            // The React UI `FinancialContext.jsx` mathematically loops the ping until `has_more` equates false!
            let pagesFetched = 0;
            const MAX_PAGES = 1;

            // Pull Paginated Transactions from Plaid cleanly
            try {
                while (hasMore && pagesFetched < MAX_PAGES) {
                    pagesFetched++;
                    const request: any = {
                        access_token: accessToken,
                        count: 200 // Max limit to prevent timeouts
                    };
                    
                    if (cursor) {
                        request.cursor = cursor;
                    }

                    const response = await plaidClient.transactionsSync(request);
                    const data = response.data;

                    added.push(...data.added);
                    modified.push(...data.modified);
                    removed.push(...data.removed);

                    cursor = data.next_cursor;
                    hasMore = data.has_more;
                }
                account.hasMoreFlag = hasMore;
            } catch (err: any) {
                // If the cursor string is rotated or fundamentally corrupted by Plaid, it throws `SYNC_CURSOR_INVALID`
                // We explicitly trap this payload and natively wipe the Supabase token, ensuring the Edge API self-heals!
                const errorCode = err?.response?.data?.error_code;
                
                if (errorCode === 'ITEM_LOGIN_REQUIRED') {
                    console.error(`Plaid MFA Expired for Account ${account.id}! Flagging for Re-Link Mode...`);
                    await supabaseAdmin
                        .from('accounts')
                        .update({ needs_relink: true })
                        .eq('id', account.id);
                    continue; // Fast-fail this account's iteration without bringing down the other accounts
                }

                if (errorCode === 'SYNC_CURSOR_INVALID' || errorCode === 'INVALID_REQUEST') {
                    console.error("Critical Cursor Invalidated! Autonomously wiping PostgreSQL cursor constraint...");
                    await supabaseAdmin
                        .from('accounts')
                        .update({ transactions_cursor: null })
                        .eq('id', account.id);
                    continue; // Eject from this account's iteration block; it will cleanly rebuild the arrays perfectly on the next invocation!
                }
                throw err;
            }

            // 6. Bulk Insert/Update/Delete mapped precisely to our `transactions` PostgreSQL schema!
            if (added.length > 0 || modified.length > 0) {
                const transactionsToUpsert = [...added, ...modified]
                    .filter(txn => {
                        const preciseCat = txn.personal_finance_category?.detailed;
                        // Natively exclude Internal Bank transfers (Checking <-> Savings) to inherently prevent Dashboard duplicate expense distortion!
                        return preciseCat !== 'TRANSFER_IN_ACCOUNT_TRANSFER' && preciseCat !== 'TRANSFER_OUT_ACCOUNT_TRANSFER';
                    })
                    .map(txn => ({
                        user_id: user.id,
                        account_id: account.id,
                        plaid_transaction_id: txn.transaction_id,
                        merchant_name: txn.merchant_name || txn.name || 'Unknown',
                        amount: txn.amount, // Plaid: positive is Expense, negative is Income.
                        date: txn.date,
                        category: txn.personal_finance_category?.primary || txn.category?.[0] || 'Uncategorized',
                        pending: txn.pending
                    }));

                const { error: upsertError } = await supabaseAdmin
                    .from('transactions')
                    .upsert(transactionsToUpsert, { onConflict: 'plaid_transaction_id' });

                if (upsertError) {
                    console.error("Upsert Error:", upsertError);
                    throw upsertError;
                }
            }

            if (removed.length > 0) {
                const transactionIdsToRemove = removed.map(r => r.transaction_id);
                const { error: deleteError } = await supabaseAdmin
                    .from('transactions')
                    .delete()
                    .in('plaid_transaction_id', transactionIdsToRemove);

                if (deleteError) {
                    console.error("Delete Error:", deleteError);
                    throw deleteError;
                }
            }

            // 7. Overwrite the Master Cursor onto the account so we don't fetch duplicates next time!
            const { error: cursorError } = await supabaseAdmin
                .from('accounts')
                .update({ transactions_cursor: cursor })
                .eq('id', account.id);

            if (cursorError) throw cursorError;

            totalAdded += added.length;
            totalModified += modified.length;
            totalRemoved += removed.length;
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Transactions perfectly synchronized!',
            synced: {
                added: totalAdded,
                modified: totalModified,
                removed: totalRemoved,
                has_more: accounts.some(acc => acc.hasMoreFlag) // We pass a boolean letting React know if it should loop!
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Plaid Sync Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
