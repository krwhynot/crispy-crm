-- Migration: Remove deprecated is_principal and is_distributor fields
-- Date: 2025-10-18
-- Reason: organization_type enum now handles these roles (principal, distributor)
--
-- Deprecated fields:
--   - organizations.is_principal (boolean) - replaced by organization_type = 'principal'
--   - organizations.is_distributor (boolean) - replaced by organization_type = 'distributor'
--
-- This migration:
--   1. Updates database functions to use organization_type instead
--   2. Drops old indexes on boolean fields
--   3. Creates new indexes on organization_type
--   4. Drops organizations_summary view (depends on deprecated fields)
--   5. Removes deprecated columns
--   6. Recreates organizations_summary view without deprecated fields

BEGIN;

-- ============================================================================
-- Step 1: Update database functions that reference deprecated fields
-- ============================================================================

-- Rewrite validate_opportunity_participant_roles to use organization_type
CREATE OR REPLACE FUNCTION "public"."validate_opportunity_participant_roles"()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    v_org_type organization_type;
BEGIN
    -- Get organization type
    SELECT organization_type
    INTO v_org_type
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Validate role matches organization type
    IF NEW.role = 'principal' AND v_org_type != 'principal' THEN
        RAISE EXCEPTION 'Organization must be a principal to have principal role';
    END IF;

    IF NEW.role = 'distributor' AND v_org_type != 'distributor' THEN
        RAISE EXCEPTION 'Organization must be a distributor to have distributor role';
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "public"."validate_opportunity_participant_roles"() IS
    'Validates that organization role matches organization_type. Updated 2025-10-18 to use organization_type instead of deprecated is_principal/is_distributor fields.';

-- ============================================================================
-- Step 2: Drop indexes on deprecated fields
-- ============================================================================

DROP INDEX IF EXISTS "idx_companies_is_principal";
DROP INDEX IF EXISTS "idx_companies_is_distributor";

-- ============================================================================
-- Step 3: Create optimized indexes on organization_type
-- ============================================================================

-- Partial index for principals (only indexes rows where organization_type = 'principal')
CREATE INDEX IF NOT EXISTS "idx_organizations_type_principal"
    ON "public"."organizations" ("organization_type")
    WHERE organization_type = 'principal';

-- Partial index for distributors (only indexes rows where organization_type = 'distributor')
CREATE INDEX IF NOT EXISTS "idx_organizations_type_distributor"
    ON "public"."organizations" ("organization_type")
    WHERE organization_type = 'distributor';

-- Comment on indexes
COMMENT ON INDEX "idx_organizations_type_principal" IS 'Fast lookup for principal organizations';
COMMENT ON INDEX "idx_organizations_type_distributor" IS 'Fast lookup for distributor organizations';

-- ============================================================================
-- Step 4: Drop dependent views
-- ============================================================================

-- Drop organizations_summary view (depends on is_principal and is_distributor)
DROP VIEW IF EXISTS "public"."organizations_summary";

-- ============================================================================
-- Step 5: Remove deprecated columns
-- ============================================================================

ALTER TABLE "public"."organizations"
    DROP COLUMN IF EXISTS "is_principal",
    DROP COLUMN IF EXISTS "is_distributor";

-- ============================================================================
-- Step 6: Recreate organizations_summary view without deprecated fields
-- ============================================================================

CREATE OR REPLACE VIEW "public"."organizations_summary" AS
 SELECT
    "o"."id",
    "o"."name",
    "o"."organization_type",
    "o"."priority",
    "o"."segment_id",
    "o"."annual_revenue",
    "o"."employee_count",
    "o"."phone",
    "o"."website",
    "o"."postal_code",
    "o"."city",
    "o"."state",
    "o"."description",
    "o"."created_at",
    "count"(DISTINCT "opp"."id") AS "nb_opportunities",
    "count"(DISTINCT "c"."id") AS "nb_contacts",
    "max"("opp"."updated_at") AS "last_opportunity_activity"
   FROM (("public"."organizations" "o"
     LEFT JOIN "public"."opportunities" "opp" ON (((("opp"."customer_organization_id" = "o"."id") OR ("opp"."principal_organization_id" = "o"."id") OR ("opp"."distributor_organization_id" = "o"."id")) AND ("opp"."deleted_at" IS NULL))))
     LEFT JOIN "public"."contacts" "c" ON ((("c"."organization_id" = "o"."id") AND ("c"."deleted_at" IS NULL))))
  WHERE ("o"."deleted_at" IS NULL)
  GROUP BY "o"."id";

COMMENT ON VIEW "public"."organizations_summary" IS 'Aggregated view of organizations with counts. Updated 2025-10-18: Removed is_principal and is_distributor fields.';

-- Add comment to table documenting the change
COMMENT ON TABLE "public"."organizations" IS
    'Organizations table. Updated 2025-10-18: Removed deprecated is_principal and is_distributor boolean fields. Use organization_type enum instead.';

COMMIT;
