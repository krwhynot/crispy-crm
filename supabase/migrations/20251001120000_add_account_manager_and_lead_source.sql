-- Add account_manager_id and lead_source fields to opportunities table
-- This enables tracking who manages each opportunity and how it was sourced

-- Check if account_manager_id column exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'opportunities'
    AND column_name = 'account_manager_id'
  ) THEN
    ALTER TABLE opportunities
    ADD COLUMN account_manager_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Check if lead_source column exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'opportunities'
    AND column_name = 'lead_source'
  ) THEN
    ALTER TABLE opportunities
    ADD COLUMN lead_source TEXT CHECK (lead_source IN (
      'referral',
      'trade_show',
      'website',
      'cold_call',
      'email_campaign',
      'social_media',
      'partner',
      'existing_customer'
    ));
  END IF;
END $$;

-- Add index for account_manager_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'opportunities'
    AND indexname = 'idx_opportunities_account_manager'
  ) THEN
    CREATE INDEX idx_opportunities_account_manager ON opportunities(account_manager_id);
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN opportunities.account_manager_id IS 'User responsible for managing this opportunity';
COMMENT ON COLUMN opportunities.lead_source IS 'How this opportunity was generated';

-- ========================================
-- ROLLBACK SECTION (commented out)
-- ========================================
-- To rollback this migration, uncomment and run the following:
--
-- -- Drop the index
-- DROP INDEX IF EXISTS idx_opportunities_account_manager;
--
-- -- Drop the columns
-- ALTER TABLE opportunities DROP COLUMN IF EXISTS account_manager_id;
-- ALTER TABLE opportunities DROP COLUMN IF EXISTS lead_source;