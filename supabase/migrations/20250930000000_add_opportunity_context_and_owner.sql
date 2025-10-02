-- Migration: Add opportunity_context and opportunity_owner_id
-- Renames: category → opportunity_context, sales_id → opportunity_owner_id
-- Includes: Updates to dependent views and functions

BEGIN;

-- ============================================================================
-- STEP 1: Drop dependent view (will be recreated with new column names)
-- ============================================================================
DROP VIEW IF EXISTS opportunities_summary CASCADE;

-- ============================================================================
-- STEP 2: Update create_opportunity_with_participants function
-- Replace sales_id → opportunity_owner_id
-- ============================================================================
CREATE OR REPLACE FUNCTION create_opportunity_with_participants(
    p_opportunity_data JSONB,
    p_participants JSONB[]
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_opportunity_id BIGINT;
    v_participant JSONB;
    v_customer_count INTEGER := 0;
    v_principal_count INTEGER := 0;
BEGIN
    -- Validate participant roles
    FOREACH v_participant IN ARRAY p_participants
    LOOP
        IF v_participant->>'role' = 'customer' THEN
            v_customer_count := v_customer_count + 1;
        ELSIF v_participant->>'role' = 'principal' THEN
            v_principal_count := v_principal_count + 1;
        END IF;
    END LOOP;

    IF v_customer_count = 0 THEN
        RAISE EXCEPTION 'Opportunity must have at least one customer participant';
    END IF;

    -- Insert opportunity with NEW column name
    INSERT INTO opportunities (
        name,
        description,
        stage,
        status,
        priority,
        amount,
        estimated_close_date,
        opportunity_owner_id,  -- UPDATED from sales_id
        created_at,
        updated_at
    )
    VALUES (
        p_opportunity_data->>'name',
        p_opportunity_data->>'description',
        COALESCE((p_opportunity_data->>'stage')::opportunity_stage, 'lead'),
        COALESCE((p_opportunity_data->>'status')::opportunity_status, 'active'),
        COALESCE((p_opportunity_data->>'priority')::priority_level, 'medium'),
        (p_opportunity_data->>'amount')::NUMERIC,
        (p_opportunity_data->>'estimated_close_date')::DATE,
        (p_opportunity_data->>'opportunity_owner_id')::BIGINT,  -- UPDATED from sales_id
        NOW(),
        NOW()
    )
    RETURNING id INTO v_opportunity_id;

    -- Insert participants
    FOREACH v_participant IN ARRAY p_participants
    LOOP
        INSERT INTO opportunity_participants (
            opportunity_id,
            organization_id,
            role,
            is_primary,
            commission_rate,
            territory,
            notes,
            created_by
        )
        VALUES (
            v_opportunity_id,
            (v_participant->>'organization_id')::BIGINT,
            v_participant->>'role',
            COALESCE((v_participant->>'is_primary')::BOOLEAN, false),
            (v_participant->>'commission_rate')::NUMERIC,
            v_participant->>'territory',
            v_participant->>'notes',
            (v_participant->>'created_by')::BIGINT
        );
    END LOOP;

    RETURN v_opportunity_id;
END;
$$;

-- ============================================================================
-- STEP 3: Update update_search_tsv trigger function
-- Replace category → opportunity_context
-- ============================================================================
CREATE OR REPLACE FUNCTION update_search_tsv()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_TABLE_NAME = 'companies' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.industry, '') || ' ' ||
            COALESCE(NEW.website, '') || ' ' ||
            COALESCE(NEW.address, '') || ' ' ||
            COALESCE(NEW.city, '') || ' ' ||
            COALESCE(NEW.state, '')
        );
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.first_name, '') || ' ' ||
            COALESCE(NEW.last_name, '') || ' ' ||
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.department, '') || ' ' ||
            COALESCE(NEW.email::text, '') || ' ' ||
            COALESCE(NEW.phone::text, '')
        );
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.next_action, '') || ' ' ||
            COALESCE(NEW.opportunity_context, '')  -- UPDATED from category
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.sku, '') || ' ' ||
            COALESCE(NEW.brand, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '') || ' ' ||
            COALESCE(NEW.subcategory, '') || ' ' ||
            COALESCE(array_to_string(NEW.certifications, ' '), '')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: Rename category → opportunity_context
-- Data is preserved automatically by PostgreSQL
-- ============================================================================
ALTER TABLE opportunities
  RENAME COLUMN category TO opportunity_context;

-- ============================================================================
-- STEP 5: Add column comment (NO CHECK constraint - validation at API boundary)
-- Note: Existing data may have legacy values (new_business, upsell, etc.)
-- Zod validation will enforce new values for new/updated records
-- ============================================================================
COMMENT ON COLUMN opportunities.opportunity_context IS 'Type of engagement that led to this opportunity. Validation enforced at API boundary via Zod. Valid values: Site Visit, Food Show, New Product Interest, Follow-up, Demo Request, Sampling, Custom';

-- ============================================================================
-- STEP 6: Rename sales_id → opportunity_owner_id
-- Data is preserved automatically by PostgreSQL
-- ============================================================================
ALTER TABLE opportunities
  RENAME COLUMN sales_id TO opportunity_owner_id;

COMMENT ON COLUMN opportunities.opportunity_owner_id IS 'Sales representative who owns this opportunity';

-- ============================================================================
-- STEP 7: Update indexes referencing renamed columns
-- ============================================================================
DROP INDEX IF EXISTS idx_opportunities_sales_id;

CREATE INDEX idx_opportunities_owner_id
  ON opportunities(opportunity_owner_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 8: Set default for estimated_close_date (90 days from now)
-- ============================================================================
ALTER TABLE opportunities
  ALTER COLUMN estimated_close_date
  SET DEFAULT (CURRENT_DATE + INTERVAL '90 days');

-- ============================================================================
-- STEP 9: Recreate opportunities_summary view with NEW column names
-- ============================================================================
CREATE VIEW opportunities_summary AS
SELECT
    o.id,
    o.name,
    o.description,
    o.stage,
    o.status,
    o.priority,
    o.probability,
    o.amount,
    o.opportunity_context,  -- UPDATED from category
    o.index,
    o.estimated_close_date,
    o.actual_close_date,
    o.customer_organization_id,
    o.principal_organization_id,
    o.distributor_organization_id,
    o.founding_interaction_id,
    o.stage_manual,
    o.status_manual,
    o.next_action,
    o.next_action_date,
    o.competition,
    o.decision_criteria,
    o.contact_ids,
    o.opportunity_owner_id,  -- UPDATED from sales_id
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
    o.search_tsv,
    o.tags,
    c1.name AS customer_name,
    c2.name AS principal_name,
    c3.name AS distributor_name,
    ((s.first_name || ' '::text) || s.last_name) AS sales_rep_name,
    count(DISTINCT op.id) AS item_count,
    sum((((op.quantity)::numeric * op.unit_price) * ((1)::numeric - (COALESCE(op.discount_percent, (0)::numeric) / (100)::numeric)))) AS total_amount
FROM opportunities o
    LEFT JOIN organizations c1 ON (c1.id = o.customer_organization_id)
    LEFT JOIN organizations c2 ON (c2.id = o.principal_organization_id)
    LEFT JOIN organizations c3 ON (c3.id = o.distributor_organization_id)
    LEFT JOIN sales s ON (s.id = o.opportunity_owner_id)  -- UPDATED from sales_id
    LEFT JOIN opportunity_products op ON (op.opportunity_id = o.id)
WHERE o.deleted_at IS NULL
GROUP BY
    o.id, o.name, o.stage, o.status, o.priority, o.probability, o.amount,
    o.opportunity_context, o.index, o.estimated_close_date, o.actual_close_date,  -- UPDATED from category
    o.customer_organization_id, o.principal_organization_id, o.distributor_organization_id,
    o.founding_interaction_id, o.stage_manual, o.status_manual, o.next_action, o.next_action_date,
    o.competition, o.decision_criteria, o.contact_ids, o.opportunity_owner_id,  -- UPDATED from sales_id
    o.created_at, o.updated_at, o.created_by, o.deleted_at, o.search_tsv, o.tags,
    c1.name, c2.name, c3.name, s.first_name, s.last_name;

-- ============================================================================
-- STEP 10: Create sync_opportunity_with_products RPC function
-- Atomic transaction for opportunity + products save/update
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_opportunity_with_products(
  opportunity_data JSONB,
  products_to_create JSONB,
  products_to_update JSONB,
  product_ids_to_delete INT[]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  opportunity_id BIGINT;
  updated_opportunity RECORD;
BEGIN
  -- 1. Upsert the opportunity
  INSERT INTO opportunities (
    id,
    name,
    description,
    opportunity_context,
    stage,
    priority,
    amount,
    probability,
    estimated_close_date,
    customer_organization_id,
    principal_organization_id,
    distributor_organization_id,
    contact_ids,
    opportunity_owner_id,
    index
  )
  VALUES (
    (opportunity_data->>'id')::BIGINT,
    opportunity_data->>'name',
    opportunity_data->>'description',
    opportunity_data->>'opportunity_context',
    (opportunity_data->>'stage')::opportunity_stage,
    (opportunity_data->>'priority')::priority_level,
    (opportunity_data->>'amount')::NUMERIC,
    (opportunity_data->>'probability')::INTEGER,
    (opportunity_data->>'estimated_close_date')::DATE,
    (opportunity_data->>'customer_organization_id')::BIGINT,
    (opportunity_data->>'principal_organization_id')::BIGINT,
    (opportunity_data->>'distributor_organization_id')::BIGINT,
    (opportunity_data->>'contact_ids')::BIGINT[],
    (opportunity_data->>'opportunity_owner_id')::BIGINT,
    (opportunity_data->>'index')::INTEGER
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    opportunity_context = EXCLUDED.opportunity_context,
    stage = EXCLUDED.stage,
    priority = EXCLUDED.priority,
    amount = EXCLUDED.amount,
    probability = EXCLUDED.probability,
    estimated_close_date = EXCLUDED.estimated_close_date,
    customer_organization_id = EXCLUDED.customer_organization_id,
    principal_organization_id = EXCLUDED.principal_organization_id,
    distributor_organization_id = EXCLUDED.distributor_organization_id,
    contact_ids = EXCLUDED.contact_ids,
    opportunity_owner_id = EXCLUDED.opportunity_owner_id,
    index = EXCLUDED.index,
    updated_at = NOW()
  RETURNING id INTO opportunity_id;

  -- 2. Create new products
  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (
      opportunity_id,
      product_id_reference,
      product_name,
      product_category,
      quantity,
      unit_price,
      extended_price,
      notes
    )
    SELECT
      opportunity_id,
      (p->>'product_id_reference')::BIGINT,
      p->>'product_name',
      p->>'product_category',
      (p->>'quantity')::NUMERIC,
      (p->>'unit_price')::NUMERIC,
      (p->>'extended_price')::NUMERIC,
      p->>'notes'
    FROM JSONB_ARRAY_ELEMENTS(products_to_create) AS p;
  END IF;

  -- 3. Update existing products
  IF JSONB_ARRAY_LENGTH(products_to_update) > 0 THEN
    UPDATE opportunity_products op
    SET
      product_id_reference = (p->>'product_id_reference')::BIGINT,
      product_name = p->>'product_name',
      quantity = (p->>'quantity')::NUMERIC,
      unit_price = (p->>'unit_price')::NUMERIC,
      extended_price = (p->>'extended_price')::NUMERIC,
      notes = p->>'notes',
      updated_at = NOW()
    FROM JSONB_ARRAY_ELEMENTS(products_to_update) p
    WHERE op.id = (p->>'id')::BIGINT;
  END IF;

  -- 4. Delete products
  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    DELETE FROM opportunity_products
    WHERE id = ANY(product_ids_to_delete);
  END IF;

  -- 5. Return the complete opportunity with products
  SELECT * FROM opportunities WHERE id = opportunity_id INTO updated_opportunity;
  RETURN TO_JSONB(updated_opportunity);
END;
$$;

COMMENT ON FUNCTION sync_opportunity_with_products IS 'Atomically synchronize opportunity and its product line items';

COMMIT;
