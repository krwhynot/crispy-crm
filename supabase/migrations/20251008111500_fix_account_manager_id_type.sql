-- Fix account_manager_id type from UUID to bigint to match sales.id
-- This fixes the error: invalid input syntax for type uuid: "69"

-- Drop existing foreign key constraint if it exists
ALTER TABLE opportunities
DROP CONSTRAINT IF EXISTS opportunities_account_manager_id_fkey;

-- Change column type from UUID to bigint
ALTER TABLE opportunities
ALTER COLUMN account_manager_id TYPE bigint USING NULL;

-- Add foreign key constraint to sales.id
ALTER TABLE opportunities
ADD CONSTRAINT opportunities_account_manager_id_fkey
FOREIGN KEY (account_manager_id)
REFERENCES sales(id)
ON DELETE SET NULL;

-- Add comment explaining the relationship
COMMENT ON COLUMN opportunities.account_manager_id IS 'Foreign key to sales.id (bigint), references the account manager for this opportunity';
