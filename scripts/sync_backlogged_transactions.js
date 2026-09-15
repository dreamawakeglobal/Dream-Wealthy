import { createClient } from '@supabase/supabase-js';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function syncAll() {
    console.log("=== Starting Immediate Sync for Plaid Transactions & Balances ===");

    // 1. Fetch connected accounts
    const { data: accounts, error: accErr } = await supabaseAdmin
        .from('accounts')
        .select('id, user_id, name, transactions_cursor, plaid_item_id');

    if (accErr) {
        console.error("Error fetching accounts:", accErr);
        process.exit(1);
    }

    // 2. Fetch credentials from isolated plaid_credentials table
    const { data: creds, error: credErr } = await supabaseAdmin
        .from('plaid_credentials')
        .select('account_id, plaid_item_id, plaid_access_token');

    if (credErr) {
        console.error("Error fetching plaid_credentials:", credErr);
        process.exit(1);
    }

    const credMap = new Map();
    creds?.forEach(c => {
        if (c.account_id && c.plaid_access_token) credMap.set(c.account_id, c.plaid_access_token);
        if (c.plaid_item_id && c.plaid_access_token) credMap.set(c.plaid_item_id, c.plaid_access_token);
    });

    for (const account of accounts) {
        const accessToken = credMap.get(account.id) || credMap.get(account.plaid_item_id);
        if (!accessToken) {
            console.warn(`No access token found for account: ${account.name} (${account.id})`);
            continue;
        }

        let activeEnv = 'production';
        if (accessToken.startsWith('access-sandbox')) activeEnv = 'sandbox';
        else if (accessToken.startsWith('access-development')) activeEnv = 'development';

        console.log(`Syncing account: ${account.name} (${account.id}) using Plaid [${activeEnv}]...`);

        const plaidClient = new PlaidApi(new Configuration({
            basePath: PlaidEnvironments[activeEnv],
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
                    'PLAID-SECRET': process.env.PLAID_SECRET,
                    'Plaid-Version': '2020-09-14'
                }
            }
        }));

        let cursor = account.transactions_cursor || '';
        let hasMore = true;
        const added = [];
        const modified = [];
        const removed = [];

        console.log(`Initial cursor: ${cursor ? cursor.substring(0, 30) + '...' : '(none)'}`);

        while (hasMore) {
            const req = { access_token: accessToken, count: 200 };
            if (cursor) req.cursor = cursor;

            const res = await plaidClient.transactionsSync(req);
            const data = res.data;

            added.push(...data.added);
            modified.push(...data.modified);
            removed.push(...data.removed);

            cursor = data.next_cursor;
            hasMore = data.has_more;
            console.log(`Fetched batch: +${data.added.length} added, ${data.modified.length} modified, ${data.removed.length} removed. Has more: ${hasMore}`);
        }

        console.log(`Total new transactions to ingest: ${added.length}`);

        if (added.length > 0 || modified.length > 0) {
            const rawTxns = [...added, ...modified];
            const transactionsToUpsert = rawTxns.map(txn => {
                const preciseCat = txn.personal_finance_category?.detailed || '';
                const primaryCat = txn.personal_finance_category?.primary || txn.category?.[0] || 'Uncategorized';
                const isTransfer = preciseCat === 'TRANSFER_IN_ACCOUNT_TRANSFER' ||
                                   preciseCat === 'TRANSFER_OUT_ACCOUNT_TRANSFER' ||
                                   primaryCat === 'TRANSFER_IN' ||
                                   primaryCat === 'TRANSFER_OUT';

                return {
                    user_id: account.user_id,
                    account_id: account.id,
                    plaid_transaction_id: txn.transaction_id,
                    merchant_name: txn.merchant_name || txn.name || 'Unknown',
                    amount: txn.amount,
                    date: txn.date,
                    category: primaryCat,
                    pending: txn.pending,
                    is_transfer: isTransfer
                };
            });

            const { error: upsertErr } = await supabaseAdmin
                .from('transactions')
                .upsert(transactionsToUpsert, { onConflict: 'plaid_transaction_id' });

            if (upsertErr) {
                console.error("Error upserting transactions:", upsertErr);
            } else {
                console.log(`Successfully upserted ${transactionsToUpsert.length} transactions into 'transactions' table!`);
            }
        }

        if (removed.length > 0) {
            const removeIds = removed.map(r => r.transaction_id);
            const { error: delErr } = await supabaseAdmin
                .from('transactions')
                .delete()
                .in('plaid_transaction_id', removeIds);
            if (delErr) console.error("Error deleting removed transactions:", delErr);
            else console.log(`Deleted ${removeIds.length} removed transactions.`);
        }

        // Save new cursor
        const { error: cursorErr } = await supabaseAdmin
            .from('accounts')
            .update({ transactions_cursor: cursor })
            .eq('id', account.id);

        if (cursorErr) {
            console.error("Error saving cursor to accounts:", cursorErr);
        } else {
            console.log("Updated transactions_cursor on account successfully!");
        }

        // Fetch and update live balances
        try {
            console.log("Fetching live balances from Plaid...");
            const balRes = await plaidClient.accountsGet({ access_token: accessToken });
            const balancesToUpsert = balRes.data.accounts.map(bankObj => ({
                user_id: account.user_id,
                item_id: account.id,
                plaid_account_id: bankObj.account_id,
                name: bankObj.name,
                mask: bankObj.mask,
                type: bankObj.type,
                subtype: bankObj.subtype,
                current_balance: bankObj.balances.current,
                available_balance: bankObj.balances.available,
                last_synced_at: new Date().toISOString()
            }));

            if (balancesToUpsert.length > 0) {
                const { error: balErr } = await supabaseAdmin
                    .from('bank_balances')
                    .upsert(balancesToUpsert, { onConflict: 'user_id, plaid_account_id' });

                if (balErr) console.error("Error updating bank_balances:", balErr.message);
                else {
                    console.log(`Updated ${balancesToUpsert.length} live bank balances in 'bank_balances'!`);
                    balancesToUpsert.forEach(b => {
                        console.log(`  - ${b.name} (${b.subtype || b.type}): Current $${b.current_balance}, Available $${b.available_balance}`);
                    });
                }
            }
        } catch (balErr) {
            console.error("Live balance fetch error:", balErr.message);
        }
    }

    console.log("=== Sync Run Complete! ===");
}

syncAll().then(() => process.exit(0)).catch(err => {
    console.error("Fatal sync error:", err);
    process.exit(1);
});
