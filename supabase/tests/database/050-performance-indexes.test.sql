-- ============================================================================
-- 050-performance-indexes.test.sql
-- ============================================================================
-- PURPOSE: Verify all foreign key columns have supporting indexes
--
-- PERFORMANCE IMPACT:
--   - Unindexed FKs cause sequential scans on JOINs (O(n) instead of O(log n))
--   - DELETE cascades become exponentially slower as data grows
--   - This is a common oversight in rapid development
--
-- TDD APPROACH:
--   RED: This test fails when unindexed FKs exist
--   GREEN: Create migration to add missing indexes
--
-- ============================================================================

BEGIN;

SELECT plan(1);

-- ============================================================================
-- SECTION 1: Find unindexed foreign keys
-- ============================================================================

-- Custom query to find FK constraints without supporting indexes
-- Joins pg_constraint (foreign keys) with pg_index to verify coverage
WITH unindexed_fks AS (
    SELECT
        conrelid::regclass AS table_name,
        conname AS fk_name,
        pg_get_constraintdef(c.oid) AS constraint_def
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f' -- Foreign Key
    AND n.nspname = 'public' -- Only check public schema
    AND NOT EXISTS (
        -- Check for an index that starts with the same columns as the FK
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
        -- Simple array intersection check for column ordinal positions
        AND i.indkey[0:(array_length(c.conkey, 1) - 1)] = c.conkey
    )
)
SELECT is(
    (SELECT count(*)::int FROM unindexed_fks),
    0,
    'All foreign keys should have supporting indexes'
);

-- ============================================================================
-- SECTION 2: Diagnostic output (shows missing indexes when test fails)
-- ============================================================================

-- Helper: If the test fails, this diagnostic query outputs the missing indexes
-- Run this manually to see exactly which indexes need to be created
SELECT
    conrelid::regclass AS table_missing_index,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE c.contype = 'f'
AND n.nspname = 'public'
AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
    AND i.indkey[0:(array_length(c.conkey, 1) - 1)] = c.conkey
);

-- ============================================================================
-- FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
