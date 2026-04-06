import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabaseAdmin.from('transactions').select('amount').limit(5);
  console.log("Tx:", data?.length || 0, "Error:", error);
}
test();
