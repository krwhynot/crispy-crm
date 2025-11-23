-- Migration: Automated cleanup of duplicate organizations
-- Purpose: Merge duplicate organizations before adding unique constraint
-- Strategy: Keep the org with most linked records (or oldest if tied), move all links to keeper

-- This migration runs BEFORE the unique constraint migration

DO $$
DECLARE
    duplicate_group RECORD;
    keeper_id BIGINT;
    duplicate_id BIGINT;
    dup_record RECORD;
    moved_contacts INTEGER;
    moved_customer_opps INTEGER;
    moved_principal_opps INTEGER;
    total_duplicates_found INTEGER := 0;
    total_duplicates_merged INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STARTING DUPLICATE ORGANIZATION CLEANUP';
    RAISE NOTICE '========================================';

    -- Process each group of duplicates
    FOR duplicate_group IN
        SELECT LOWER(name) as lower_name, array_agg(id ORDER BY id) as org_ids
        FROM organizations
        WHERE deleted_at IS NULL
        GROUP BY LOWER(name)
        HAVING COUNT(*) > 1
    LOOP
        total_duplicates_found := total_duplicates_found + 1;

        RAISE NOTICE '';
        RAISE NOTICE 'Processing duplicate group: "%"', duplicate_group.lower_name;

        -- Find the "keeper" - org with most linked records, oldest as tiebreaker
        SELECT o.id INTO keeper_id
        FROM organizations o
        WHERE o.id = ANY(duplicate_group.org_ids)
        ORDER BY (
            -- Count contacts
            (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id)
            -- Count opportunities (both as customer and principal)
            + (SELECT COUNT(*) FROM opportunities op
               WHERE op.customer_organization_id = o.id
                  OR op.principal_organization_id = o.id)
        ) DESC,
        o.created_at ASC  -- Oldest as tiebreaker
        LIMIT 1;

        RAISE NOTICE '  Keeper: ID %', keeper_id;

        -- Process each duplicate (non-keeper) in this group
        FOR dup_record IN
            SELECT o.id, o.name, o.created_at,
                   (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) as contact_count,
                   (SELECT COUNT(*) FROM opportunities op
                    WHERE op.customer_organization_id = o.id
                       OR op.principal_organization_id = o.id) as opp_count
            FROM organizations o
            WHERE o.id = ANY(duplicate_group.org_ids)
            AND o.id != keeper_id
        LOOP
            duplicate_id := dup_record.id;

            RAISE NOTICE '  Merging duplicate: ID % (Name: %, Contacts: %, Opportunities: %)',
                dup_record.id, dup_record.name, dup_record.contact_count, dup_record.opp_count;

            -- Move contacts to keeper
            UPDATE contacts
            SET organization_id = keeper_id,
                updated_at = NOW()
            WHERE organization_id = duplicate_id;
            GET DIAGNOSTICS moved_contacts = ROW_COUNT;

            IF moved_contacts > 0 THEN
                RAISE NOTICE '    Moved % contact(s) to keeper', moved_contacts;
            END IF;

            -- Move opportunities (customer_organization_id)
            UPDATE opportunities
            SET customer_organization_id = keeper_id,
                updated_at = NOW()
            WHERE customer_organization_id = duplicate_id;
            GET DIAGNOSTICS moved_customer_opps = ROW_COUNT;

            IF moved_customer_opps > 0 THEN
                RAISE NOTICE '    Moved % opportunity(ies) (as customer) to keeper', moved_customer_opps;
            END IF;

            -- Move opportunities (principal_organization_id)
            UPDATE opportunities
            SET principal_organization_id = keeper_id,
                updated_at = NOW()
            WHERE principal_organization_id = duplicate_id;
            GET DIAGNOSTICS moved_principal_opps = ROW_COUNT;

            IF moved_principal_opps > 0 THEN
                RAISE NOTICE '    Moved % opportunity(ies) (as principal) to keeper', moved_principal_opps;
            END IF;

            -- Move any tasks linked to contacts at the duplicate org
            -- (Tasks link to contacts, which we already moved, so this is usually not needed)

            -- Move activities linked to the duplicate org
            UPDATE activities
            SET organization_id = keeper_id,
                updated_at = NOW()
            WHERE organization_id = duplicate_id;

            -- Soft-delete the duplicate
            UPDATE organizations
            SET deleted_at = NOW(),
                updated_at = NOW(),
                -- Add note about merge for audit trail
                notes = COALESCE(notes, '') || E'\n\n[MERGED] This duplicate was merged into organization ID ' || keeper_id || ' on ' || NOW()::TEXT
            WHERE id = duplicate_id;

            RAISE NOTICE '    Soft-deleted duplicate ID %', duplicate_id;
            total_duplicates_merged := total_duplicates_merged + 1;
        END LOOP;

        -- Optionally append info to keeper's notes
        UPDATE organizations
        SET notes = COALESCE(notes, '') || E'\n\n[MERGE TARGET] Duplicates were merged into this record on ' || NOW()::TEXT,
            updated_at = NOW()
        WHERE id = keeper_id;

    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DUPLICATE CLEANUP COMPLETE';
    RAISE NOTICE 'Duplicate groups processed: %', total_duplicates_found;
    RAISE NOTICE 'Duplicate records merged: %', total_duplicates_merged;
    RAISE NOTICE '========================================';

    IF total_duplicates_found = 0 THEN
        RAISE NOTICE 'No duplicates found - database is clean!';
    END IF;

END $$;

-- Verify no duplicates remain
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM (
        SELECT LOWER(name)
        FROM organizations
        WHERE deleted_at IS NULL
        GROUP BY LOWER(name)
        HAVING COUNT(*) > 1
    ) dups;

    IF remaining_count > 0 THEN
        RAISE EXCEPTION 'Cleanup failed: % duplicate group(s) still remain', remaining_count;
    ELSE
        RAISE NOTICE 'Verification passed: No duplicates remain';
    END IF;
END $$;
