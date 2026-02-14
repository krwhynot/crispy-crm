-- Add comprehensive backend validation to sync_opportunity_with_products
-- Enforces business rules: must have customer organization, contacts, and products

CREATE OR REPLACE FUNCTION public.sync_opportunity_with_products(
  opportunity_data jsonb,
  products_to_create jsonb,
  products_to_update jsonb,
  product_ids_to_delete integer[]
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  opportunity_id BIGINT;
  updated_opportunity RECORD;
  contact_ids_array BIGINT[];
  is_new_opportunity BOOLEAN;
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
  -- Check if contact_ids exists and is not null
  IF opportunity_data ? 'contact_ids' AND opportunity_data->'contact_ids' IS NOT NULL THEN
    -- Convert JSONB array to PostgreSQL BIGINT array
    SELECT ARRAY_AGG((value#>>'{}')::BIGINT)
    INTO contact_ids_array
    FROM jsonb_array_elements(opportunity_data->'contact_ids');
  ELSE
    -- Default to empty array if not provided (only for updates)
    contact_ids_array := '{}'::BIGINT[];
  END IF;

  -- Upsert opportunity record (using only columns that exist in the table)
  INSERT INTO opportunities (
    id, name, description, stage, priority,
    estimated_close_date, customer_organization_id, principal_organization_id,
    distributor_organization_id, contact_ids, opportunity_owner_id,
    account_manager_id, lead_source, index
  )
  VALUES (
    (opportunity_data->>'id')::BIGINT,
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
    (opportunity_data->>'index')::INTEGER
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    stage = EXCLUDED.stage,
    priority = EXCLUDED.priority,
    estimated_close_date = EXCLUDED.estimated_close_date,
    customer_organization_id = EXCLUDED.customer_organization_id,
    principal_organization_id = EXCLUDED.principal_organization_id,
    distributor_organization_id = EXCLUDED.distributor_organization_id,
    contact_ids = EXCLUDED.contact_ids,
    opportunity_owner_id = EXCLUDED.opportunity_owner_id,
    account_manager_id = EXCLUDED.account_manager_id,
    lead_source = EXCLUDED.lead_source,
    index = EXCLUDED.index,
    updated_at = NOW()
  RETURNING id INTO opportunity_id;

  -- Create new product associations (simplified: no pricing)
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

  -- Update existing product associations (simplified: no pricing)
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

  -- Delete removed product associations
  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    DELETE FROM opportunity_products WHERE id = ANY(product_ids_to_delete);
  END IF;

  -- Return the updated opportunity with products
  SELECT json_build_object(
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
    'created_at', o.created_at,
    'updated_at', o.updated_at
  ) INTO updated_opportunity
  FROM opportunities o
  WHERE o.id = opportunity_id;

  RETURN jsonb_build_object('data', to_jsonb(updated_opportunity));
END;
$function$;

-- Update comment
COMMENT ON FUNCTION public.sync_opportunity_with_products IS 'Atomically synchronize opportunity and its product associations (with comprehensive backend validation enforcing business rules)';
