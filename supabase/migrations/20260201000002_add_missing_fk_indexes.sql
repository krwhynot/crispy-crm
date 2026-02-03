-- Migration: Add missing FK indexes on notes tables
-- Purpose: Postgres does NOT auto-index foreign key columns. Prior migrations added
--   partial indexes for junction tables and core FKs, but gaps remain on notes tables.
-- Reference: DATABASE_LAYER.md - "Junction table foreign keys have indexes for EXISTS query performance"
--
-- Already indexed (prior migrations):
--   - contact_notes.contact_id (20251212_align_notes_schemas)
--   - contact_notes.sales_id (20251212_align_notes_schemas)
--   - opportunity_notes.opportunity_id (20251212_align_notes_schemas)
--   - opportunity_notes.sales_id (20251212_align_notes_schemas)
--   - organization_notes.organization_id (20251130_add_nb_notes_to_organizations_summary)
--
-- Gaps filled by this migration:
--   1. contact_notes.created_by - ownership RLS policies
--   2. opportunity_notes.created_by - ownership RLS policies
--   3. organization_notes.sales_id - role-based RLS policies (dropped in P2, never recreated)

-- ============================================================================
-- CONTACT_NOTES (created_by FK missing index)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contact_notes_created_by
  ON contact_notes (created_by)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- OPPORTUNITY_NOTES (created_by FK missing index)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_opportunity_notes_created_by
  ON opportunity_notes (created_by)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- ORGANIZATION_NOTES (sales_id FK index dropped in P2, never recreated)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_organization_notes_sales_id
  ON organization_notes (sales_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_contact_notes_created_by',
      'idx_opportunity_notes_created_by',
      'idx_organization_notes_sales_id'
    );

  IF idx_count < 3 THEN
    RAISE WARNING 'Expected 3 FK indexes, found %', idx_count;
  ELSE
    RAISE NOTICE 'All 3 missing FK indexes created successfully';
  END IF;
END $$;
