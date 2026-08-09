import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabaseAdmin.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Messages:", data);
  }
}
run();
