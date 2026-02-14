-- Enforce business rule Q12: Every opportunity must have exactly one customer organization
-- This migration adds NOT NULL constraint to opportunities.customer_organization_id

-- Verification: Ensure no opportunities exist without customers (should be 0)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM opportunities
  WHERE customer_organization_id IS NULL
    AND deleted_at IS NULL;

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: % opportunities exist without customer_organization_id. Clean up data first.', orphan_count;
  END IF;
END $$;

-- Add NOT NULL constraint to enforce customer requirement
ALTER TABLE opportunities
  ALTER COLUMN customer_organization_id SET NOT NULL;

-- Add helpful comment explaining the business rule
COMMENT ON COLUMN opportunities.customer_organization_id IS
  'Required: The customer organization for this opportunity. Every opportunity must have exactly one customer (Q12).';

-- Verification query (run after migration to confirm)
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'opportunities'
--   AND column_name = 'customer_organization_id';
-- Expected: is_nullable = 'NO'
