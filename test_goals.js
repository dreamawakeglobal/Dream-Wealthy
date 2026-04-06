import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
    const { data: rows, error: selError } = await supabaseAdmin.from('goals').select('*').limit(1);
    console.log("Existing columns:", rows && rows.length > 0 ? Object.keys(rows[0]) : "No rows");

    const payload = {
        user_id: '1692df86-c3cc-4995-b9f3-8f64da2146e2',
        name: 'test',
        target_amount: 100,
        monthly_contribution: 10
    };
    
    // Test inserting with monthly_contribution
    const { data, error } = await supabaseAdmin.from('goals').insert([payload]);
    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Success with monthly_contribution!");
        await supabaseAdmin.from('goals').delete().eq('name', 'test');
    }
}
checkColumns();
