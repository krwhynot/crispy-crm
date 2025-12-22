-- =====================================================================
-- Add Optimistic Locking Version Column for Opportunities
-- =====================================================================
-- Problem: Concurrent updates cause silent data loss (last-write-wins)
--
-- Current state: Existing migration (20251029022924) only LOGS concurrent
-- updates via RAISE NOTICE - it does NOT prevent data loss.
--
-- Solution: Add integer version column for reliable conflict detection:
-- 1. Add version column (default 1)
-- 2. Update RPC function to check version before UPDATE
-- 3. Auto-increment version on successful update
-- 4. RAISE EXCEPTION if version mismatch (conflict detected)
--
-- Scenario this prevents:
--   10:00 - User A opens Opportunity X (version 1)
--   10:01 - User B opens Opportunity X (version 1)
--   10:05 - User B saves changes (version becomes 2)
--   10:10 - User A saves changes → ERROR: Conflict detected, refresh required
-- =====================================================================

-- =====================================================================
-- STEP 1: Add version column with default value
-- =====================================================================

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN opportunities.version IS
  'Optimistic locking version - increments on each update. '
  'Used to detect concurrent edit conflicts and prevent silent data loss.';

-- =====================================================================
-- STEP 2: Create trigger to auto-increment version on direct updates
-- =====================================================================
-- This handles updates that bypass the RPC function (direct SQL, admin tools)

CREATE OR REPLACE FUNCTION public.increment_opportunity_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Always increment version on update (RPC function also increments)
  -- Using GREATEST ensures we don't go backwards if RPC already set it
  NEW.version := GREATEST(OLD.version + 1, NEW.version);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.increment_opportunity_version() IS
  'Auto-increments version column on opportunity updates for optimistic locking. '
  'Ensures version always increases even for direct SQL updates.';

-- Drop old trigger if exists (we're replacing the logging-only version)
DROP TRIGGER IF EXISTS check_concurrent_opportunity_update ON opportunities;
DROP TRIGGER IF EXISTS opportunities_version_increment ON opportunities;

-- Create new trigger
CREATE TRIGGER opportunities_version_increment
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_opportunity_version();

-- =====================================================================
-- STEP 3: Update RPC function to check version before UPDATE
-- =====================================================================
-- The sync_opportunity_with_products function now:
-- - Accepts optional expected_version parameter
-- - Checks version in WHERE clause for updates
-- - Returns new version in response
-- - Raises exception if version mismatch detected

CREATE OR REPLACE FUNCTION public.sync_opportunity_with_products(
  opportunity_data jsonb,
  products_to_create jsonb,
  products_to_update jsonb,
  product_ids_to_delete integer[],
  expected_version integer DEFAULT NULL  -- New parameter for optimistic locking
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  opportunity_id BIGINT;
  is_new_opportunity BOOLEAN;
  contact_ids_array BIGINT[];
  rows_updated INTEGER;
BEGIN
  -- Determine if this is a new opportunity (no ID provided)
  is_new_opportunity := (opportunity_data->>'id') IS NULL;

  -- ============================================
  -- BACKEND VALIDATION FOR NEW OPPORTUNITIES
  -- ============================================
  IF is_new_opportunity THEN
    -- Business Rule: Must have exactly one customer organization
    IF (opportunity_data->>'customer_organization_id') IS NULL THEN
      RAISE EXCEPTION 'customer_organization_id is required to create an opportunity';
    END IF;

    -- Business Rule: Must have at least one contact
    IF NOT (opportunity_data ? 'contact_ids') OR
       jsonb_array_length(opportunity_data->'contact_ids') = 0 THEN
      RAISE EXCEPTION 'At least one contact is required to create an opportunity';
    END IF;

    -- Business Rule: Must have at least one product
    IF jsonb_array_length(products_to_create) = 0 THEN
      RAISE EXCEPTION 'At least one product is required to create an opportunity';
    END IF;
  END IF;

  -- Convert JSONB array to PostgreSQL array properly
  IF opportunity_data ? 'contact_ids' AND opportunity_data->'contact_ids' IS NOT NULL THEN
    SELECT ARRAY_AGG((value#>>'{}')::BIGINT)
    INTO contact_ids_array
    FROM jsonb_array_elements(opportunity_data->'contact_ids');
  ELSE
    contact_ids_array := '{}'::BIGINT[];
  END IF;

  -- ============================================
  -- INSERT OR UPDATE OPPORTUNITY
  -- ============================================
  IF is_new_opportunity THEN
    -- New opportunity: INSERT without id (let database generate it)
    -- Version defaults to 1
    INSERT INTO opportunities (
      name, description, stage, priority,
      estimated_close_date, customer_organization_id, principal_organization_id,
      distributor_organization_id, contact_ids, opportunity_owner_id,
      account_manager_id, lead_source, index, version
    )
    VALUES (
      opportunity_data->>'name',
      opportunity_data->>'description',
      (opportunity_data->>'stage')::opportunity_stage,
      (opportunity_data->>'priority')::priority_level,
      (opportunity_data->>'estimated_close_date')::DATE,
      (opportunity_data->>'customer_organization_id')::BIGINT,
      (opportunity_data->>'principal_organization_id')::BIGINT,
      (opportunity_data->>'distributor_organization_id')::BIGINT,
      contact_ids_array,
      (opportunity_data->>'opportunity_owner_id')::BIGINT,
      (opportunity_data->>'account_manager_id')::BIGINT,
      opportunity_data->>'lead_source',
      (opportunity_data->>'index')::INTEGER,
      1  -- Initial version
    )
    RETURNING id INTO opportunity_id;
  ELSE
    -- Existing opportunity: UPDATE with optional version check
    -- If expected_version is provided, include it in WHERE clause
    IF expected_version IS NOT NULL THEN
      UPDATE opportunities SET
        name = opportunity_data->>'name',
        description = opportunity_data->>'description',
        stage = (opportunity_data->>'stage')::opportunity_stage,
        priority = (opportunity_data->>'priority')::priority_level,
        estimated_close_date = (opportunity_data->>'estimated_close_date')::DATE,
        customer_organization_id = (opportunity_data->>'customer_organization_id')::BIGINT,
        principal_organization_id = (opportunity_data->>'principal_organization_id')::BIGINT,
        distributor_organization_id = (opportunity_data->>'distributor_organization_id')::BIGINT,
        contact_ids = contact_ids_array,
        opportunity_owner_id = (opportunity_data->>'opportunity_owner_id')::BIGINT,
        account_manager_id = (opportunity_data->>'account_manager_id')::BIGINT,
        lead_source = opportunity_data->>'lead_source',
        index = (opportunity_data->>'index')::INTEGER,
        updated_at = NOW()
        -- Note: version is auto-incremented by trigger
      WHERE id = (opportunity_data->>'id')::BIGINT
        AND version = expected_version  -- Optimistic lock check
      RETURNING id INTO opportunity_id;

      -- Check if update succeeded (version matched)
      GET DIAGNOSTICS rows_updated = ROW_COUNT;
      IF rows_updated = 0 THEN
        -- Version mismatch - another user modified the record
        RAISE EXCEPTION 'CONFLICT: This opportunity was modified by another user. Please refresh the page and try again. [expected_version=%, id=%]',
          expected_version,
          (opportunity_data->>'id')::BIGINT
          USING ERRCODE = 'serialization_failure';  -- PostgreSQL 40001 for serialization conflicts
      END IF;
    ELSE
      -- No version check requested (backwards compatibility)
      UPDATE opportunities SET
        name = opportunity_data->>'name',
        description = opportunity_data->>'description',
        stage = (opportunity_data->>'stage')::opportunity_stage,
        priority = (opportunity_data->>'priority')::priority_level,
        estimated_close_date = (opportunity_data->>'estimated_close_date')::DATE,
        customer_organization_id = (opportunity_data->>'customer_organization_id')::BIGINT,
        principal_organization_id = (opportunity_data->>'principal_organization_id')::BIGINT,
        distributor_organization_id = (opportunity_data->>'distributor_organization_id')::BIGINT,
        contact_ids = contact_ids_array,
        opportunity_owner_id = (opportunity_data->>'opportunity_owner_id')::BIGINT,
        account_manager_id = (opportunity_data->>'account_manager_id')::BIGINT,
        lead_source = opportunity_data->>'lead_source',
        index = (opportunity_data->>'index')::INTEGER,
        updated_at = NOW()
      WHERE id = (opportunity_data->>'id')::BIGINT
      RETURNING id INTO opportunity_id;
    END IF;
  END IF;

  -- Create new product associations
  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (
      opportunity_id, product_id_reference, product_name, product_category, notes
    )
    SELECT
      opportunity_id,
      (p->>'product_id_reference')::BIGINT,
      p->>'product_name',
      p->>'product_category',
      p->>'notes'
    FROM JSONB_ARRAY_ELEMENTS(products_to_create) AS p;
  END IF;

  -- Update existing product associations
  IF JSONB_ARRAY_LENGTH(products_to_update) > 0 THEN
    UPDATE opportunity_products op
    SET
      product_id_reference = (p->>'product_id_reference')::BIGINT,
      product_name = p->>'product_name',
      product_category = p->>'product_category',
      notes = p->>'notes',
      updated_at = NOW()
    FROM JSONB_ARRAY_ELEMENTS(products_to_update) p
    WHERE op.id = (p->>'id')::BIGINT;
  END IF;

  -- SOFT DELETE removed product associations (Constitution fix)
  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    UPDATE opportunity_products
    SET deleted_at = NOW()
    WHERE id = ANY(product_ids_to_delete)
      AND deleted_at IS NULL;
  END IF;

  -- Return the updated opportunity with products (including version!)
  RETURN jsonb_build_object(
    'data', (
      SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'description', o.description,
        'stage', o.stage,
        'priority', o.priority,
        'estimated_close_date', o.estimated_close_date,
        'customer_organization_id', o.customer_organization_id,
        'principal_organization_id', o.principal_organization_id,
        'distributor_organization_id', o.distributor_organization_id,
        'contact_ids', o.contact_ids,
        'account_manager_id', o.account_manager_id,
        'lead_source', o.lead_source,
        'index', o.index,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'version', o.version,  -- Include version in response!
        'products', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', op.id,
              'product_id_reference', op.product_id_reference,
              'product_name', op.product_name,
              'product_category', op.product_category,
              'notes', op.notes
            )
          ), '[]'::jsonb)
          FROM opportunity_products op
          WHERE op.opportunity_id = o.id
            AND op.deleted_at IS NULL
        )
      )
      FROM opportunities o
      WHERE o.id = opportunity_id
    )
  );
END;
$function$;

COMMENT ON FUNCTION public.sync_opportunity_with_products(jsonb, jsonb, jsonb, integer[], integer) IS
  'Atomically syncs opportunity with its products. Supports optimistic locking via expected_version parameter. '
  'If expected_version is provided and does not match current version, raises CONFLICT exception (40001).';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.sync_opportunity_with_products(jsonb, jsonb, jsonb, integer[], integer) TO authenticated, service_role;

-- =====================================================================
-- STEP 4: Add index for version lookups (performance)
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_opportunities_id_version
  ON opportunities(id, version);

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================
--
-- 1. Check version column exists:
--    SELECT column_name, data_type, column_default
--    FROM information_schema.columns
--    WHERE table_name = 'opportunities' AND column_name = 'version';
--
-- 2. Test version increment:
--    BEGIN;
--    INSERT INTO opportunities (name, customer_organization_id, contact_ids, stage)
--      VALUES ('Test', 1, '{1}', 'new_lead') RETURNING id, version;
--    -- version should be 1
--    UPDATE opportunities SET name = 'Updated' WHERE id = <returned_id> RETURNING version;
--    -- version should be 2
--    ROLLBACK;
--
-- 3. Test conflict detection (two separate connections):
--    -- Connection A:
--    BEGIN;
--    SELECT id, version FROM opportunities WHERE id = X;  -- Note version
--
--    -- Connection B (before A commits):
--    UPDATE opportunities SET name = 'B update' WHERE id = X;
--
--    -- Connection A (after B commits):
--    SELECT sync_opportunity_with_products(
--      '{"id": X, "name": "A update", ...}',
--      '[]', '[]', '{}',
--      <original_version>  -- This should fail with CONFLICT
--    );
--    COMMIT;
--
-- =====================================================================
