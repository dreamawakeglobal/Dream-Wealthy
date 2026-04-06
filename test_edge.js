import { createClient } from '@supabase/supabase-js';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log("Starting test...");
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user
    const { data: accounts } = await supabaseAdmin.from('accounts').select('*').not('plaid_access_token', 'is', null);
    if (!accounts || accounts.length === 0) return console.log("No accounts");
    
    for (const account of accounts) {
        const accessToken = account.plaid_access_token;
        let activeEnv = 'sandbox';
        if (accessToken.startsWith('access-development')) activeEnv = 'development';
        if (accessToken.startsWith('access-production')) activeEnv = 'production';
        
        console.log(`Using Env: ${activeEnv} for Account: ${account.id}`);
        
        const configuration = new Configuration({
            basePath: PlaidEnvironments[activeEnv],
            baseOptions: {
                headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID, 'PLAID-SECRET': process.env.PLAID_SECRET, 'Plaid-Version': '2020-09-14' },
            },
        });
        const plaidClient = new PlaidApi(configuration);
        
        try {
            const added = [], modified = [], removed = [];
            let cursor = account.transactions_cursor || '';
            let hasMore = true;
            
            while (hasMore) {
                const req = { access_token: accessToken, count: 200 };
                if (cursor) req.cursor = cursor;
                
                const response = await plaidClient.transactionsSync(req);
                const data = response.data;
                added.push(...data.added);
                modified.push(...data.modified);
                removed.push(...data.removed);
                
                cursor = data.next_cursor;
                hasMore = data.has_more;
                console.log(`Fetched page. Added: ${data.added.length}`);
            }
            
            console.log(`Total Added: ${added.length}`);
            
            // Upsert
            if (added.length > 0) {
                const transactionsToUpsert = added.map(txn => ({
                    user_id: account.user_id,
                    account_id: account.id,
                    plaid_transaction_id: txn.transaction_id,
                    merchant_name: txn.merchant_name || txn.name || 'Unknown',
                    amount: txn.amount,
                    date: txn.date,
                    category: txn.personal_finance_category?.primary || txn.category?.[0] || 'Uncategorized',
                    pending: txn.pending
                }));
                
                const { error: upsertErr } = await supabaseAdmin.from('transactions').upsert(transactionsToUpsert, { onConflict: 'plaid_transaction_id' });
                if (upsertErr) console.error("Upsert Err:", upsertErr);
                else {
                    console.log("Upsert Success!");
                    const {error: cErr} = await supabaseAdmin.from('accounts').update({transactions_cursor: cursor}).eq('id', account.id);
                    console.log("Cursor saved:", cErr || "success");
                }
            }
        } catch(e) {
            console.error("Plaid Err:", e.response?.data || e.message);
        }
    }
}

run();
