-- Migration: Add Unique Constraint on Contacts
--
-- Prevents duplicate contacts (same name) within an organization.
-- Uses partial unique index to only enforce on non-deleted records.

-- Safety check: Ensure no duplicates exist before adding constraint
DO $$
DECLARE
    dupe_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dupe_count
    FROM (
        SELECT organization_id, LOWER(TRIM(name))
        FROM contacts
        WHERE deleted_at IS NULL
        GROUP BY organization_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    ) d;

    IF dupe_count > 0 THEN
        RAISE EXCEPTION 'Cannot add unique constraint: % duplicate contact sets still exist. Run cleanup migration first.', dupe_count;
    END IF;

    RAISE NOTICE 'Safety check passed: No duplicate contacts found';
END $$;

-- Create partial unique index (only applies to non-deleted records)
-- Note: Using plain columns (not expressions) to enable ON CONFLICT in seed files
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_org_name
ON contacts (organization_id, name)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_contacts_unique_org_name IS
'Prevents duplicate contacts (same name) within an organization. Only applies to non-deleted records.';

-- Verify constraint was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_contacts_unique_org_name'
    ) THEN
        RAISE NOTICE 'SUCCESS: Unique constraint idx_contacts_unique_org_name created';
    ELSE
        RAISE EXCEPTION 'FAILED: Constraint was not created';
    END IF;
END $$;
