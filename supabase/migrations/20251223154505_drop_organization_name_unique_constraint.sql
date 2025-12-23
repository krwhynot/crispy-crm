-- Migration: Drop unique constraint on organization name
-- Purpose: Allow duplicate organization names with soft warning (industry standard)
--
-- Business Rationale:
-- CRMs like Salesforce and Dynamics 365 use "warn but allow" for name fields because:
-- 1. Names can legitimately duplicate (franchises, branches, common names)
--    Example: "Sysco - Chicago" and "Sysco - Denver" (same parent, different branches)
--    Example: Multiple "McDonald's" operator locations
-- 2. Hard uniqueness blocks are reserved for true unique identifiers (email, tax ID)
-- 3. The duplicate detection dialog provides adequate user guidance
--
-- Change:
-- - Removes: organizations_name_unique_idx (case-insensitive unique partial index)
-- - Preserves: Duplicate detection UI warning (soft guidance)
-- - Result: "Create Anyway" button in duplicate dialog will now work
--
-- Reversible: Re-run 20251122232134_add_unique_organization_name_constraint.sql
--             (after cleaning up any duplicates created since this migration)

-- Drop the unique index
DROP INDEX IF EXISTS organizations_name_unique_idx;

-- Update column comment to reflect the new behavior
COMMENT ON COLUMN organizations.name IS
'Organization name. Duplicates allowed with warning dialog on create. Case-insensitive matching for duplicate detection.';

-- Log the change
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'UNIQUE CONSTRAINT REMOVED';
    RAISE NOTICE 'organizations_name_unique_idx has been dropped';
    RAISE NOTICE 'Duplicate organization names are now allowed';
    RAISE NOTICE 'Duplicate detection dialog still provides soft warning';
    RAISE NOTICE '========================================';
END $$;
