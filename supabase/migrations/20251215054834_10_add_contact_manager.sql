-- Manager relationship (self-referential FK)
-- Enables: DSM → Area Manager reporting chain
-- Schema note: contacts.id is BIGINT

-- Check if column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'manager_id'
  ) THEN
    -- Add column (BIGINT to match contacts.id)
    ALTER TABLE contacts
      ADD COLUMN manager_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_contacts_manager
  ON contacts(manager_id)
  WHERE manager_id IS NOT NULL;

COMMENT ON COLUMN contacts.manager_id IS 'Self-referential FK for reporting hierarchy';
