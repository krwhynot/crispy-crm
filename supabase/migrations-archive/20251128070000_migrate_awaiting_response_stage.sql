-- =====================================================
-- Migration: Remove 'awaiting_response' Pipeline Stage
-- =====================================================
-- PRD Reference: Section 5.1, MVP #46
-- TODO Reference: TODO-001a
--
-- Purpose: Migrate opportunities from deprecated 'awaiting_response' stage
-- to 'sample_visit_offered' (most similar semantic meaning)
--
-- Reversibility: Original stage stored in notes field with marker
-- To reverse: UPDATE opportunities
--             SET stage = 'awaiting_response'
--             WHERE notes LIKE '%[MIGRATION-20251128]%';
--
-- Engineering Constitution Compliance:
-- - §9: Migration filename follows YYYYMMDDHHMMSS format
-- - §2: Data transformation at database level (not application)
-- =====================================================

-- Step 1: Count affected records (for logging/verification)
DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_count
    FROM opportunities
    WHERE stage = 'awaiting_response';

    RAISE NOTICE 'Migration: Found % opportunities with awaiting_response stage', affected_count;
END $$;

-- Step 2: Store original stage in notes for reversibility
-- Append migration marker to existing notes (preserve existing content)
UPDATE opportunities
SET notes = COALESCE(notes || E'\n\n', '') ||
            '[MIGRATION-20251128] Original stage: awaiting_response. ' ||
            'Migrated to sample_visit_offered per PRD v1.20 pipeline simplification.'
WHERE stage = 'awaiting_response'
  AND (notes IS NULL OR notes NOT LIKE '%[MIGRATION-20251128]%');

-- Step 3: Update stage to new value
UPDATE opportunities
SET stage = 'sample_visit_offered',
    updated_at = NOW()
WHERE stage = 'awaiting_response';

-- Step 4: Verify migration completed
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM opportunities
    WHERE stage = 'awaiting_response';

    IF remaining_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % records still have awaiting_response stage', remaining_count;
    END IF;

    RAISE NOTICE 'Migration complete: No opportunities with awaiting_response stage remain';
END $$;

-- =====================================================
-- NOTE: Enum Type Preservation
-- =====================================================
-- The 'awaiting_response' value remains in the opportunity_stage enum type
-- (defined in cloud_schema_fresh.sql) for backwards compatibility.
--
-- PostgreSQL requires recreating enum types to remove values, which is
-- risky for production data. The enum value is now unused but harmless.
--
-- Future cleanup (post-MVP, if desired):
-- 1. Create new enum without 'awaiting_response'
-- 2. Alter column to use new enum
-- 3. Drop old enum
-- =====================================================

-- =====================================================
-- DOWN MIGRATION (Manual - run if rollback needed)
-- =====================================================
-- To reverse this migration:
--
-- UPDATE opportunities
-- SET stage = 'awaiting_response',
--     updated_at = NOW()
-- WHERE notes LIKE '%[MIGRATION-20251128] Original stage: awaiting_response%';
--
-- Then remove the migration markers:
-- UPDATE opportunities
-- SET notes = REGEXP_REPLACE(
--     notes,
--     E'\n?\n?\\[MIGRATION-20251128\\][^\\n]*',
--     '',
--     'g'
-- )
-- WHERE notes LIKE '%[MIGRATION-20251128]%';
-- =====================================================
