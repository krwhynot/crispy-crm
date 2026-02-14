-- Enforce MFB business rule: Every opportunity requires a principal
-- Step 1: Verify no NULL values exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM opportunities
    WHERE principal_organization_id IS NULL
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: % opportunities have NULL principal_organization_id',
      (SELECT COUNT(*) FROM opportunities WHERE principal_organization_id IS NULL AND deleted_at IS NULL);
  END IF;
END $$;

-- Step 2: Add NOT NULL constraint
ALTER TABLE opportunities
ALTER COLUMN principal_organization_id SET NOT NULL;

-- Step 3: Add comment
COMMENT ON COLUMN opportunities.principal_organization_id IS
  'REQUIRED: Every opportunity must be associated with a principal (manufacturer). Core MFB business rule enforced at DB level.';
