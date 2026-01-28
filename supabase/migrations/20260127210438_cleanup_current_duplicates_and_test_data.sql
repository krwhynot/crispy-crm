-- Migration: Cleanup current duplicates and test data
-- Purpose: Remove test organization and merge La Caretta duplicates before restoring unique constraint
-- Date: 2026-01-27
-- Context: This cleans up duplicates created after the unique constraint was temporarily dropped on 2025-12-23

DO $$
DECLARE
    keeper_id BIGINT;
    duplicate_id BIGINT;
    moved_contacts INTEGER;
    moved_customer_opps INTEGER;
    moved_principal_opps INTEGER;
    moved_activities INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STARTING DUPLICATE CLEANUP - 2026-01-27';
    RAISE NOTICE '========================================';

    -- ========================================
    -- STEP 1: Soft-delete test organization
    -- ========================================
    RAISE NOTICE '';
    RAISE NOTICE 'Step 1: Soft-deleting test organization (ID 90073)';

    UPDATE organizations
    SET deleted_at = NOW(),
        updated_at = NOW(),
        notes = COALESCE(notes, '') || E'\n\n[TEST DATA CLEANUP] Test organization soft-deleted on ' || NOW()::TEXT
    WHERE id = 90073
      AND deleted_at IS NULL;

    IF FOUND THEN
        RAISE NOTICE '  ✓ Test organization ID 90073 (test1-27 ORg) soft-deleted';
    ELSE
        RAISE NOTICE '  ℹ Test organization ID 90073 already deleted or not found';
    END IF;

    -- ========================================
    -- STEP 2: Merge La Caretta duplicates
    -- ========================================
    RAISE NOTICE '';
    RAISE NOTICE 'Step 2: Merging La Caretta duplicates (IDs 90041, 90042)';

    -- Determine keeper: ID 90042 has more linked records (2 contacts + 1 opp vs 1 contact + 0 opps)
    keeper_id := 90042;
    duplicate_id := 90041;

    RAISE NOTICE '  Keeper: ID % (2 contacts, 1 opportunity, 7 activities)', keeper_id;
    RAISE NOTICE '  Duplicate: ID % (1 contact, 0 opportunities, 0 activities)', duplicate_id;

    -- Move contacts from duplicate to keeper
    UPDATE contacts
    SET organization_id = keeper_id,
        updated_at = NOW()
    WHERE organization_id = duplicate_id
      AND deleted_at IS NULL;
    GET DIAGNOSTICS moved_contacts = ROW_COUNT;

    IF moved_contacts > 0 THEN
        RAISE NOTICE '    ✓ Moved % contact(s) to keeper', moved_contacts;
    END IF;

    -- Move opportunities (customer_organization_id)
    UPDATE opportunities
    SET customer_organization_id = keeper_id,
        updated_at = NOW()
    WHERE customer_organization_id = duplicate_id
      AND deleted_at IS NULL;
    GET DIAGNOSTICS moved_customer_opps = ROW_COUNT;

    IF moved_customer_opps > 0 THEN
        RAISE NOTICE '    ✓ Moved % opportunity(ies) (as customer) to keeper', moved_customer_opps;
    END IF;

    -- Move opportunities (principal_organization_id)
    UPDATE opportunities
    SET principal_organization_id = keeper_id,
        updated_at = NOW()
    WHERE principal_organization_id = duplicate_id
      AND deleted_at IS NULL;
    GET DIAGNOSTICS moved_principal_opps = ROW_COUNT;

    IF moved_principal_opps > 0 THEN
        RAISE NOTICE '    ✓ Moved % opportunity(ies) (as principal) to keeper', moved_principal_opps;
    END IF;

    -- Move activities linked to duplicate org
    UPDATE activities
    SET organization_id = keeper_id,
        updated_at = NOW()
    WHERE organization_id = duplicate_id
      AND deleted_at IS NULL;
    GET DIAGNOSTICS moved_activities = ROW_COUNT;

    IF moved_activities > 0 THEN
        RAISE NOTICE '    ✓ Moved % activity(ies) to keeper', moved_activities;
    END IF;

    -- Soft-delete the duplicate with audit trail
    UPDATE organizations
    SET deleted_at = NOW(),
        updated_at = NOW(),
        notes = COALESCE(notes, '') || E'\n\n[MERGED] This duplicate was merged into organization ID ' || keeper_id || ' on ' || NOW()::TEXT
    WHERE id = duplicate_id
      AND deleted_at IS NULL;

    IF FOUND THEN
        RAISE NOTICE '    ✓ Soft-deleted duplicate ID %', duplicate_id;
    END IF;

    -- Add merge note to keeper
    UPDATE organizations
    SET notes = COALESCE(notes, '') || E'\n\n[MERGE TARGET] Duplicate ID ' || duplicate_id || ' was merged into this record on ' || NOW()::TEXT,
        updated_at = NOW()
    WHERE id = keeper_id
      AND deleted_at IS NULL;

    RAISE NOTICE '    ✓ Added merge note to keeper ID %', keeper_id;

    -- ========================================
    -- STEP 3: Scan for additional duplicates
    -- ========================================
    RAISE NOTICE '';
    RAISE NOTICE 'Step 3: Scanning for any other duplicates created since 2025-12-23';

    DECLARE
        additional_dups_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO additional_dups_count
        FROM (
            SELECT LOWER(name)
            FROM organizations
            WHERE deleted_at IS NULL
              AND created_at >= '2025-12-23'
            GROUP BY LOWER(name)
            HAVING COUNT(*) > 1
        ) dups;

        IF additional_dups_count > 0 THEN
            RAISE WARNING '  ⚠ Found % additional duplicate group(s) - these require manual review', additional_dups_count;

            -- Log the duplicate names for manual review
            FOR keeper_id IN
                SELECT LOWER(name) as dup_name, array_agg(id ORDER BY id) as ids
                FROM organizations
                WHERE deleted_at IS NULL
                  AND created_at >= '2025-12-23'
                GROUP BY LOWER(name)
                HAVING COUNT(*) > 1
            LOOP
                RAISE WARNING '    Duplicate: % (IDs: %)', keeper_id, ids;
            END LOOP;
        ELSE
            RAISE NOTICE '  ✓ No additional duplicates found since 2025-12-23';
        END IF;
    END;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CLEANUP COMPLETE';
    RAISE NOTICE '========================================';

END $$;

-- ========================================
-- VERIFICATION: Ensure zero duplicates remain
-- ========================================
DO $$
DECLARE
    remaining_count INTEGER;
    duplicate_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Running verification checks...';

    -- Count remaining duplicates
    SELECT COUNT(*) INTO remaining_count
    FROM (
        SELECT LOWER(name)
        FROM organizations
        WHERE deleted_at IS NULL
        GROUP BY LOWER(name)
        HAVING COUNT(*) > 1
    ) dups;

    IF remaining_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'VERIFICATION FAILED: % duplicate group(s) still exist', remaining_count;
        RAISE NOTICE '========================================';

        -- List remaining duplicates
        FOR duplicate_record IN
            SELECT LOWER(name) as lower_name, array_agg(id ORDER BY id) as org_ids, COUNT(*) as cnt
            FROM organizations
            WHERE deleted_at IS NULL
            GROUP BY LOWER(name)
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE 'Duplicate: "%" (IDs: %, Count: %)',
                duplicate_record.lower_name,
                duplicate_record.org_ids,
                duplicate_record.cnt;
        END LOOP;

        RAISE EXCEPTION 'Cleanup verification failed: % duplicate group(s) still remain. Cannot proceed with unique constraint restoration.', remaining_count;
    ELSE
        RAISE NOTICE '✓ Verification passed: No duplicates remain';
        RAISE NOTICE '✓ Database is clean and ready for unique constraint restoration';
    END IF;
END $$;
