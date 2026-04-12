import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function alterTable() {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
       // Since Supabase might not have exec_sql we might need to rely on postgres direct connection, or just run query via edge function, 
       // but typically we can try to do an insert to check. Let's see if the column exists by selecting it.
    });

    // Instead, just select it to see if it errors.
    const { error: selError } = await supabaseAdmin.from('goals').select('order_index').limit(1);
    if (selError) {
        console.log("Column likely does not exist:", selError.message);
        // We will just tell the user to run SQL in their Supabase console if we can't alter it here.
    } else {
        console.log("Column order_index exists!");
    }
}
alterTable();
