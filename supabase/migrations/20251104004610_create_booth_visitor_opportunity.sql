-- Create atomic function for booth visitor quick-add
-- Creates Organization -> Contact -> Opportunity in one transaction
-- Returns JSONB with created IDs or rolls back entirely on error

CREATE OR REPLACE FUNCTION create_booth_visitor_opportunity(_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _org_id BIGINT;
  _contact_id BIGINT;
  _opp_id BIGINT;
  _sales_id BIGINT;
BEGIN
  _sales_id := (SELECT id FROM sales WHERE user_id = auth.uid());

  -- Create Organization
  INSERT INTO organizations (
    name, city, state, organization_type, sales_id, segment_id
  ) VALUES (
    _data->>'org_name',
    _data->>'city',
    _data->>'state',
    'customer',
    _sales_id,
    '562062be-c15b-417f-b2a1-d4a643d69d52'::uuid
  ) RETURNING id INTO _org_id;

  -- Create Contact
  INSERT INTO contacts (
    first_name, last_name, organization_id, sales_id,
    email, phone, first_seen, last_seen, tags
  ) VALUES (
    _data->>'first_name',
    _data->>'last_name',
    _org_id,
    _sales_id,
    CASE WHEN _data->>'email' IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object('email', _data->>'email', 'type', 'Work'))
      ELSE '[]'::jsonb END,
    CASE WHEN _data->>'phone' IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object('number', _data->>'phone', 'type', 'Work'))
      ELSE '[]'::jsonb END,
    NOW(), NOW(), '[]'::jsonb
  ) RETURNING id INTO _contact_id;

  -- Create Opportunity
  INSERT INTO opportunities (
    name, customer_organization_id, principal_organization_id,
    contact_ids, campaign, stage, priority, estimated_close_date,
    lead_source, description, sales_id
  ) VALUES (
    _data->>'campaign' || ' - ' || _data->>'org_name' || ' - ' ||
      (SELECT name FROM organizations WHERE id = (_data->>'principal_id')::BIGINT),
    _org_id,
    (_data->>'principal_id')::BIGINT,
    jsonb_build_array(_contact_id),
    _data->>'campaign',
    'new_lead',
    'medium',
    (CURRENT_DATE + INTERVAL '30 days')::date,
    'trade_show',
    _data->>'quick_note',
    _sales_id
  ) RETURNING id INTO _opp_id;

  -- Link products if provided
  IF _data->'product_ids' IS NOT NULL THEN
    INSERT INTO opportunity_products (opportunity_id, product_id)
    SELECT _opp_id, (jsonb_array_elements_text(_data->'product_ids'))::BIGINT;
  END IF;

  RETURN jsonb_build_object(
    'organization_id', _org_id,
    'contact_id', _contact_id,
    'opportunity_id', _opp_id,
    'success', true
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create booth visitor: %', SQLERRM;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION create_booth_visitor_opportunity(JSONB) TO authenticated;
