import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: items, error: itemsErr } = await supabase.from('plaid_items').select('*');
  console.log('--- Plaid Items ---');
  console.log(items);

  const { data: accs, error: accsErr } = await supabase.from('plaid_accounts').select('id, name, balances, updated_at');
  console.log('--- Plaid Accounts ---');
  console.log(accs);
}

run();
