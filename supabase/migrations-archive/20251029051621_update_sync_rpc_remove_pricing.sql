-- Update sync_opportunity_with_products RPC to remove pricing logic
-- Simplified: only product associations with notes, no pricing/quantity

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
BEGIN
  -- Upsert opportunity record
  INSERT INTO opportunities (
    id, name, description, opportunity_context, stage, priority, amount, probability,
    estimated_close_date, customer_organization_id, principal_organization_id,
    distributor_organization_id, contact_ids, opportunity_owner_id, index
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
    'created_at', o.created_at,
    'updated_at', o.updated_at
  ) INTO updated_opportunity
  FROM opportunities o
  WHERE o.id = opportunity_id;

  RETURN jsonb_build_object('data', to_jsonb(updated_opportunity));
END;
$function$;

-- Update comment
COMMENT ON FUNCTION public.sync_opportunity_with_products IS 'Atomically synchronize opportunity and its product associations (simplified: no pricing/quantity)';
