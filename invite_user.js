import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Support both .env and .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Service Role credentials.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inviteUser() {
  console.log("Inviting boniernick01@gmail.com...");
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail('boniernick01@gmail.com');
  
  if (error) {
    console.error("Error inviting user:", error.message);
  } else {
    console.log("Success! Invitation sent:", data);
  }
}

inviteUser();
