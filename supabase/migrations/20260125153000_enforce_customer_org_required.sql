-- Enforce business rule: Every opportunity requires a customer
-- Step 1: Verify no NULL values exist (safety check)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM opportunities
    WHERE customer_organization_id IS NULL
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: % opportunities have NULL customer_organization_id',
      (SELECT COUNT(*) FROM opportunities WHERE customer_organization_id IS NULL AND deleted_at IS NULL);
  END IF;
END $$;

-- Step 2: Add NOT NULL constraint
ALTER TABLE opportunities
ALTER COLUMN customer_organization_id SET NOT NULL;

-- Step 3: Add comment documenting business rule
COMMENT ON COLUMN opportunities.customer_organization_id IS
  'REQUIRED: Every opportunity must have a customer organization (business rule Q12). Enforced at DB level to prevent API bypass.';
