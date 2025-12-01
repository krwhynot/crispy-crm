-- ============================================================================
-- FIX: contacts_summary and organizations_summary View Table References
-- ============================================================================
-- Date: 2025-12-01
-- Issue: List pages (contacts, organizations) show empty in production
--
-- ROOT CAUSE ANALYSIS:
-- 1. Migration 20251130173144 created contacts_summary view referencing 'contact_notes' (snake_case)
-- 2. Migration 20251129230942 (p3_rename) was supposed to rename 'contactNotes' -> 'contact_notes'
-- 3. Due to migration history mismatch, p3_rename may not have been applied on cloud
-- 4. Result: View references table that doesn't exist, or table exists but grants are missing
--
-- This migration handles BOTH scenarios:
-- - If table is still named 'contactNotes': Creates view alias
-- - If table is already 'contact_notes': Ensures grants are correct
-- - Recreates _summary views to use the correct reference
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure contact_notes table/view exists
-- ============================================================================

-- Check if contactNotes exists and contact_notes doesn't
-- If so, create a view alias for backward compatibility
DO $$
BEGIN
  -- Check if contactNotes table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'contactNotes'
    AND table_type = 'BASE TABLE'
  ) THEN
    -- Check if contact_notes doesn't exist as a table or view
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'contact_notes'
    ) THEN
      RAISE NOTICE 'Creating contact_notes as view alias for contactNotes table';
      EXECUTE 'CREATE OR REPLACE VIEW contact_notes AS SELECT * FROM "contactNotes"';
      EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON contact_notes TO authenticated';
    ELSE
      RAISE NOTICE 'contact_notes already exists';
    END IF;
  ELSE
    -- contactNotes doesn't exist, contact_notes should be the actual table
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'contact_notes'
    ) THEN
      RAISE WARNING 'Neither contactNotes nor contact_notes exist - data may be inconsistent';
    ELSE
      RAISE NOTICE 'contact_notes table exists (p3_rename was already applied)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure opportunity_notes table/view exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'opportunityNotes'
    AND table_type = 'BASE TABLE'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'opportunity_notes'
    ) THEN
      RAISE NOTICE 'Creating opportunity_notes as view alias for opportunityNotes table';
      EXECUTE 'CREATE OR REPLACE VIEW opportunity_notes AS SELECT * FROM "opportunityNotes"';
      EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON opportunity_notes TO authenticated';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Ensure organization_notes table/view exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organizationNotes'
    AND table_type = 'BASE TABLE'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'organization_notes'
    ) THEN
      RAISE NOTICE 'Creating organization_notes as view alias for organizationNotes table';
      EXECUTE 'CREATE OR REPLACE VIEW organization_notes AS SELECT * FROM "organizationNotes"';
      EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON organization_notes TO authenticated';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Ensure proper GRANT permissions on all involved tables
-- ============================================================================

-- Contacts table and view
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;

-- Organizations table and view
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;

-- Tasks table
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;

-- Activities table
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;

-- Grant on notes tables/views (handle both naming conventions)
DO $$
BEGIN
  -- contact_notes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_notes') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON contact_notes TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contactNotes') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "contactNotes" TO authenticated';
  END IF;

  -- opportunity_notes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'opportunity_notes') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON opportunity_notes TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'opportunityNotes') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "opportunityNotes" TO authenticated';
  END IF;

  -- organization_notes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_notes') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON organization_notes TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizationNotes') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "organizationNotes" TO authenticated';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Recreate contacts_summary view with proper table references
-- ============================================================================

DROP VIEW IF EXISTS contacts_summary;

CREATE VIEW contacts_summary
WITH (security_invoker = true)
AS
SELECT
    -- Core contact fields
    c.id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.title,
    c.department,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.birthday,
    c.linkedin_url,
    c.twitter_handle,
    c.notes,
    c.sales_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.deleted_at,
    c.search_tsv,
    c.first_seen,
    c.last_seen,
    c.gender,
    c.tags,
    c.organization_id,
    c.status,

    -- Organization reference
    o.name AS company_name,

    -- Activity count metrics via LEFT JOIN LATERAL
    -- COALESCE ensures 0 instead of NULL when no related records exist
    COALESCE(notes_count.cnt, 0) AS nb_notes,
    COALESCE(tasks_count.cnt, 0) AS nb_tasks,
    COALESCE(activities_count.cnt, 0) AS nb_activities

FROM contacts c

-- Organization join
LEFT JOIN organizations o
    ON o.id = c.organization_id
   AND o.deleted_at IS NULL

-- Notes count subquery (soft-delete aware)
-- Uses snake_case table name with fallback
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM contact_notes cn
    WHERE cn.contact_id = c.id
      AND cn.deleted_at IS NULL
) notes_count ON true

-- Tasks count subquery (soft-delete aware)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM tasks t
    WHERE t.contact_id = c.id
      AND t.deleted_at IS NULL
) tasks_count ON true

-- Activities count subquery (soft-delete aware)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS cnt
    FROM activities a
    WHERE a.contact_id = c.id
      AND a.deleted_at IS NULL
) activities_count ON true

WHERE c.deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON contacts_summary TO authenticated;

COMMENT ON VIEW contacts_summary IS
    'Contact summary with organization name and activity counts. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Fixed in migration 20251201173817 to handle both table naming conventions.';

-- ============================================================================
-- STEP 6: Recreate organizations_summary view with proper table references
-- ============================================================================

DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary
WITH (security_invoker = true)
AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  parent.name AS parent_organization_name,
  o.website,
  o.linkedin_url,
  o.address,
  o.city,
  o.state,
  o.postal_code,
  o.country,
  o.notes,
  o.sales_id,
  o.created_at,
  o.updated_at,
  o.deleted_at,
  o.created_by,
  o.specialty,
  o.cuisine_focus,
  o.region,
  o.search_tsv,
  o.first_seen,
  o.last_seen,
  o.segment,

  -- Count of contacts in this organization (soft-delete aware)
  COALESCE(contact_count.cnt, 0) AS nb_contacts,

  -- Count of opportunities involving this organization (soft-delete aware)
  COALESCE(opportunity_count.cnt, 0) AS nb_opportunities,

  -- Count of notes on this organization (soft-delete aware)
  COALESCE(notes_count.cnt, 0) AS nb_notes

FROM organizations o

-- Parent organization join
LEFT JOIN organizations parent
  ON parent.id = o.parent_organization_id
  AND parent.deleted_at IS NULL

-- Contacts count
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM contacts c
  WHERE c.organization_id = o.id
    AND c.deleted_at IS NULL
) contact_count ON true

-- Opportunities count (as principal, distributor, or customer)
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT opp.id)::integer AS cnt
  FROM opportunities opp
  WHERE opp.deleted_at IS NULL
    AND (
      opp.principal_organization_id = o.id
      OR opp.distributor_organization_id = o.id
      OR opp.customer_organization_id = o.id
    )
) opportunity_count ON true

-- Notes count
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM organization_notes n
  WHERE n.organization_id = o.id
    AND n.deleted_at IS NULL
) notes_count ON true

WHERE o.deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON organizations_summary TO authenticated;

COMMENT ON VIEW organizations_summary IS
    'Organization summary with parent name, contact/opportunity/notes counts. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Fixed in migration 20251201173817 to handle both table naming conventions.';

-- ============================================================================
-- STEP 7: Verification
-- ============================================================================

DO $$
DECLARE
  contacts_summary_exists BOOLEAN;
  organizations_summary_exists BOOLEAN;
  contact_notes_exists BOOLEAN;
BEGIN
  -- Check views exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'contacts_summary'
  ) INTO contacts_summary_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'organizations_summary'
  ) INTO organizations_summary_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_notes'
  ) INTO contact_notes_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Complete: Fix Table References';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'contacts_summary view: %', CASE WHEN contacts_summary_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'organizations_summary view: %', CASE WHEN organizations_summary_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'contact_notes (table or view): %', CASE WHEN contact_notes_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '========================================';

  -- Fail if critical views don't exist
  IF NOT contacts_summary_exists OR NOT organizations_summary_exists THEN
    RAISE EXCEPTION 'Critical views not created. Check migration logs.';
  END IF;
END $$;
