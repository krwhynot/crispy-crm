-- Migration: Cleanup Duplicate Contacts (Keep Most Complete)
--
-- Problem: 288 duplicate contact records exist across 256 organizations
-- due to overlapping seed data and Grand Rapids campaign migration.
--
-- Strategy: Score each contact by completeness (filled fields),
-- keep the most complete record, soft-delete the rest.

-- Report before state
DO $$
DECLARE
    dupe_count INTEGER;
    org_count INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(DISTINCT organization_id)
    INTO dupe_count, org_count
    FROM (
        SELECT organization_id, name
        FROM contacts
        WHERE deleted_at IS NULL
        GROUP BY organization_id, name
        HAVING COUNT(*) > 1
    ) d;

    RAISE NOTICE '=== DUPLICATE CLEANUP STARTING ===';
    RAISE NOTICE 'Duplicate contact sets found: %', dupe_count;
    RAISE NOTICE 'Organizations affected: %', org_count;
END $$;

-- Score each contact by completeness, keep highest-scored record
WITH contact_scores AS (
    SELECT
        c.id,
        c.organization_id,
        LOWER(TRIM(c.name)) as norm_name,
        -- Score: count of non-empty fields (higher = more complete)
        (CASE WHEN c.email IS NOT NULL AND c.email::text != '[]' AND c.email::text != '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.phone IS NOT NULL AND c.phone::text != '[]' AND c.phone::text != '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.title IS NOT NULL AND c.title != '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.first_name IS NOT NULL AND c.first_name != '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.last_name IS NOT NULL AND c.last_name != '' THEN 1 ELSE 0 END) as completeness_score
    FROM contacts c
    WHERE c.deleted_at IS NULL
),
ranked AS (
    SELECT
        id,
        organization_id,
        norm_name,
        completeness_score,
        ROW_NUMBER() OVER (
            PARTITION BY organization_id, norm_name
            ORDER BY completeness_score DESC, id ASC  -- Higher score wins, lowest ID breaks ties
        ) as rn
    FROM contact_scores
),
duplicates_to_remove AS (
    SELECT id FROM ranked WHERE rn > 1
)
UPDATE contacts
SET deleted_at = NOW()
WHERE id IN (SELECT id FROM duplicates_to_remove);

-- Report results
DO $$
DECLARE
    removed_count INTEGER;
    remaining_dupes INTEGER;
BEGIN
    SELECT COUNT(*) INTO removed_count
    FROM contacts
    WHERE deleted_at IS NOT NULL
    AND deleted_at > NOW() - INTERVAL '1 minute';

    SELECT COUNT(*) INTO remaining_dupes
    FROM (
        SELECT organization_id, name
        FROM contacts
        WHERE deleted_at IS NULL
        GROUP BY organization_id, name
        HAVING COUNT(*) > 1
    ) d;

    RAISE NOTICE '=== DUPLICATE CLEANUP COMPLETE ===';
    RAISE NOTICE 'Contacts soft-deleted: %', removed_count;
    RAISE NOTICE 'Remaining duplicate sets: %', remaining_dupes;

    IF remaining_dupes > 0 THEN
        RAISE WARNING 'WARNING: % duplicate sets still exist!', remaining_dupes;
    ELSE
        RAISE NOTICE 'SUCCESS: All duplicates cleaned up';
    END IF;
END $$;
