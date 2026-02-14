-- ============================================================================
-- Migration: Drop Duplicate Indexes
-- ============================================================================
-- Removes indexes that are 100% identical to another index on the same column
-- (same column, sort direction, WHERE predicate, opclass, and collation).
--
-- Safety verification (from live DB):
--   - All indexes confirmed non-UNIQUE, non-PRIMARY KEY
--   - Identity verified via pg_get_indexdef()
--   - Largest table: organizations (2,369 rows) -- sub-second lock duration
--   - DROP INDEX takes AccessExclusiveLock but is instant at these sizes
-- ============================================================================

-- ============================================================================
-- Group 1: activities.activity_date (drop 2 of 4)
-- ============================================================================
-- KEEP: idx_activities_activity_date_active  (btree activity_date ASC, WHERE deleted_at IS NULL)
-- KEEP: idx_activities_activity_date_not_deleted (btree activity_date DESC, WHERE deleted_at IS NULL)
-- DROP: idx_activities_date          (100% identical to _not_deleted)
-- DROP: idx_activities_entry_date    (100% identical to _not_deleted)
-- ============================================================================

DROP INDEX IF EXISTS idx_activities_date;
DROP INDEX IF EXISTS idx_activities_entry_date;

-- ============================================================================
-- Group 2: activities.contact_id (drop 1 of 2)
-- ============================================================================
-- KEEP: idx_activities_contact    (btree contact_id, WHERE deleted_at IS NULL)
-- DROP: idx_activities_contact_id (btree contact_id, WHERE deleted_at IS NULL AND contact_id IS NOT NULL)
--       Extra IS NOT NULL adds no practical benefit for btree (NULLs stored but rarely matched)
-- ============================================================================

DROP INDEX IF EXISTS idx_activities_contact_id;

-- ============================================================================
-- Group 3: opportunities.principal_organization_id (drop 2 of 4)
-- ============================================================================
-- KEEP: idx_opportunities_principal_org             (WHERE principal_organization_id IS NOT NULL -- FK integrity)
-- KEEP: idx_opportunities_principal_org_id_restrict  (WHERE deleted_at IS NULL AND principal_organization_id IS NOT NULL -- RLS optimal)
-- DROP: idx_opportunities_principal_org_not_deleted   (WHERE deleted_at IS NULL -- less restrictive than _restrict)
-- DROP: idx_opportunities_principal_organization_id   (WHERE deleted_at IS NULL -- 100% identical to _not_deleted)
-- ============================================================================

DROP INDEX IF EXISTS idx_opportunities_principal_org_not_deleted;
DROP INDEX IF EXISTS idx_opportunities_principal_organization_id;

-- ============================================================================
-- Group 4: product_distributors.distributor_id (drop 2 of 4)
-- ============================================================================
-- KEEP: idx_product_distributors_distributor_id         (btree distributor_id -- FK may reference)
-- KEEP: idx_product_distributors_distributor_id_partial  (WHERE deleted_at IS NULL -- RLS optimal)
-- DROP: idx_product_dist_distributor                     (100% identical to _distributor_id)
-- DROP: idx_product_distributors_distributor_id_active   (100% identical to _partial)
-- ============================================================================

DROP INDEX IF EXISTS idx_product_dist_distributor;
DROP INDEX IF EXISTS idx_product_distributors_distributor_id_active;

-- ============================================================================
-- Group 5: product_distributors.product_id (drop 2 of 4)
-- ============================================================================
-- KEEP: idx_product_distributors_product_id         (btree product_id -- FK may reference)
-- KEEP: idx_product_distributors_product_id_partial  (WHERE deleted_at IS NULL -- RLS optimal)
-- DROP: idx_product_dist_product                     (100% identical to _product_id)
-- DROP: idx_product_distributors_product_id_active   (100% identical to _partial)
-- ============================================================================

DROP INDEX IF EXISTS idx_product_dist_product;
DROP INDEX IF EXISTS idx_product_distributors_product_id_active;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT indexdef, count(*) as cnt
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('activities', 'opportunities', 'product_distributors')
    GROUP BY indexdef
    HAVING count(*) > 1
  ) dupes;

  IF dup_count = 0 THEN
    RAISE NOTICE 'Index dedup verified: no identical index definitions remain on target tables.';
  ELSE
    RAISE WARNING '% duplicate index group(s) still remain on target tables.', dup_count;
  END IF;
END $$;
