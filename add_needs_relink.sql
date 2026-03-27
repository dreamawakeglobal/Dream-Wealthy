-- Execute this script natively inside the Supabase SQL Editor
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS needs_relink BOOLEAN DEFAULT false;

-- Natively reload the API cache instantly!
NOTIFY pgrst, 'reload schema';
