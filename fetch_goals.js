import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function scan() {
    const { data: rows, error } = await supabaseAdmin.from('goals').select('*').order('order_index');
    if (error) { console.error(error); return; }
    
    console.log("Found goals:", rows.length);
    console.dir(rows, { depth: null });
}
scan();
