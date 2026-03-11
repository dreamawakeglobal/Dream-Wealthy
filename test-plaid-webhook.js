import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load our local keys
dotenv.config();

// We need an Item ID that was just connected in the DB to test on.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET);

const plaidClient = new PlaidApi(new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
}));

async function fireTestWebhook() {
    console.log("Fetching a connected user's Plaid Access Token from Supabase...");

    // Grab the most recently connected account
    const { data: accounts, error } = await supabase
        .from('accounts')
        .select('plaid_access_token, name, user_id')
        .order('id', { ascending: false })
        .limit(1);

    if (error || !accounts || accounts.length === 0) {
        console.error("No accounts found in DB! Please connect a bank through the UI first.");
        return;
    }

    const testAccount = accounts[0];
    console.log(`Testing webhook for connected Bank: ${testAccount.name} (User: ${testAccount.user_id})`);

    try {
        const webhookUrl = `${SUPABASE_URL}/functions/v1/sync-transactions`;
        console.log(`Setting webhook URL for item to: ${webhookUrl}`);

        await plaidClient.itemWebhookUpdate({
            access_token: testAccount.plaid_access_token,
            webhook: webhookUrl
        });

        console.log("\nTelling Plaid to fire the SYNC_UPDATES_AVAILABLE webhook to our Live Edge Function...");

        // This Plaid Sandbox endpoint artificially generates new mock transactions and triggers a webhook
        const response = await plaidClient.sandboxItemFireWebhook({
            access_token: testAccount.plaid_access_token,
            webhook_code: 'SYNC_UPDATES_AVAILABLE'
        });

        if (response.data.webhook_fired) {
            console.log("✅ Success! Plaid Sandbox has officially fired the webhook.");
            console.log("\nIf our backend ‘sync-transactions’ Edge Function worked, new transactions should appear in your Supabase 'transactions' table in the next 5-10 seconds!");
        } else {
            console.log("❌ Webhook failed to fire. Check Plaid API status.");
        }

    } catch (err) {
        console.error("Error firing webhook:", err.response?.data || err.message);
    }
}

fireTestWebhook();
