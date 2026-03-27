import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    'https://xqfxrbyjsbdfgmtxgvhu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZnhyYnlqc2JkZmdtdHhndmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM0NDMxNCwiZXhwIjoyMDg3OTIwMzE0fQ.qlpxdAIjzmDCbZjJqhnKEtvI34WYIyvuQqfEKXHG79I'
);

async function extractCategories() {
    try {
        const { data, error } = await supabaseAdmin
            .from('transactions')
            .select('category');

        if (error) throw error;

        const uniqueCategories = [...new Set(data.map(d => d.category))];
        console.log("Your Native Plaid Categories:", uniqueCategories.sort());
    } catch (err) {
        console.error("DEV ERROR:", err.message);
    }
}

extractCategories();
