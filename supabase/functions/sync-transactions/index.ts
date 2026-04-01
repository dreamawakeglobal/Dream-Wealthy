import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Configuration, PlaidApi, PlaidEnvironments } from "npm:plaid";

// Initialize CORS headers for browser requests (though this is mostly hit server-to-server)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Admin Supabase Client
// We use the SERVICE_ROLE_KEY here because Plaid is hitting this webhook without a user's JWT.
// We must bypass RLS to insert transactions, relying on our own logic to map the item_id to the correct user.
const getAdminSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Plaid sends a Webhook payload when new transactions are ready
    const payload = await req.json();

    // We only care about transaction sync updates right now
    if (payload.webhook_type !== 'TRANSACTIONS' || payload.webhook_code !== 'SYNC_UPDATES_AVAILABLE') {
      console.log("Ignoring non-sync webhook:", payload.webhook_code);
      return new Response("OK", { status: 200 });
    }

    const itemId = payload.item_id;
    const supabaseAdmin = getAdminSupabase();

    // 2. Look up the User ID and Access Token associated with this incoming Item ID
    const { data: account, error: accountErr } = await supabaseAdmin
      .from('accounts')
      .select('id, user_id, plaid_access_token, transactions_cursor')
      .eq('plaid_item_id', itemId)
      .single();

    if (accountErr || !account) {
      throw new Error(`Could not find account for item_id: ${itemId}`);
    }

    // 3. Fetch the new transactions from Plaid using the cursor
    const plaidClient = getPlaidClient();
    let cursor = account.transactions_cursor || null;
    let added = [];
    let modified = [];
    let removed = [];
    let hasMore = true;

    while (hasMore) {
      const syncResponse = await plaidClient.transactionsSync({
        access_token: account.plaid_access_token,
        cursor: cursor,
      });

      const data = syncResponse.data;
      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    console.log(`Plaid Sync logic found ${added.length} new transactions for User ${account.user_id}`);

    // 4. Process Added & Modified Transactions (Map to Database Schema)
    const transactionsToUpsert = [...added, ...modified]
      .filter(tx => {
        const preciseCat = tx.personal_finance_category?.detailed;
        // Natively exclude Internal Bank transfers to prevent duplicate expense distortion!
        return preciseCat !== 'TRANSFER_IN_ACCOUNT_TRANSFER' && preciseCat !== 'TRANSFER_OUT_ACCOUNT_TRANSFER';
      })
      .map((tx) => ({
        plaid_transaction_id: tx.transaction_id,
        user_id: account.user_id,
        account_id: account.id, // Use our internal Postgres UUID representation, not Plaid's string.
        amount: tx.amount, // Plaid amounts are positive for outflows (expenses) and negative for inflows (income)
        date: tx.date,
        merchant_name: tx.merchant_name || tx.name || 'Unknown',
        category: tx.personal_finance_category?.primary || tx.category?.[0] || 'Uncategorized',
        pending: tx.pending
      }));

    // 5. Upsert transactions into Postgres
    if (transactionsToUpsert.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('transactions')
        .upsert(transactionsToUpsert, { onConflict: 'plaid_transaction_id' }); // Prevent duplicates and strictly update modified statuses

      if (insertErr) {
        throw new Error(`Error upserting transactions: ${insertErr.message}`);
      }
    }

    // 5.5. Auto-Purge Removed Transactions continuously
    if (removed.length > 0) {
      const transactionIdsToRemove = removed.map(r => r.transaction_id);
      const { error: deleteErr } = await supabaseAdmin
        .from('transactions')
        .delete()
        .in('plaid_transaction_id', transactionIdsToRemove);

      if (deleteErr) {
        throw new Error(`Error deleting removed transactions: ${deleteErr.message}`);
      }
    }

    // 6. Save the new cursor so we don't fetch these same transactions again next time
    if (cursor !== account.transactions_cursor) {
      await supabaseAdmin
        .from('accounts')
        .update({ transactions_cursor: cursor })
        .eq('plaid_item_id', itemId);
    }

    return new Response(JSON.stringify({ success: true, added: added.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook Sync Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
