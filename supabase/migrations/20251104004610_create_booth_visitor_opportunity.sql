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
  _email_val TEXT;
  _phone_val TEXT;
  _email_jsonb JSONB;
  _phone_jsonb JSONB;
BEGIN
  RAISE NOTICE 'Starting function with data type: %', pg_typeof(_data);
  _sales_id := (SELECT id FROM sales WHERE user_id = auth.uid());
  RAISE NOTICE 'Got sales_id: %', _sales_id;

  -- Extract email and phone values
  RAISE NOTICE 'Extracting email value';
  _email_val := _data->>'email';
  RAISE NOTICE 'Email value: %', _email_val;

  RAISE NOTICE 'Extracting phone value';
  _phone_val := _data->>'phone';
  RAISE NOTICE 'Phone value: %', _phone_val;

  -- Build JSONB arrays for email and phone
  RAISE NOTICE 'Building email JSONB';
  IF _email_val IS NOT NULL AND _email_val != '' THEN
    _email_jsonb := jsonb_build_array(jsonb_build_object('email', _email_val, 'type', 'Work'));
  ELSE
    _email_jsonb := '[]'::jsonb;
  END IF;
  RAISE NOTICE 'Email JSONB: %', _email_jsonb;

  RAISE NOTICE 'Building phone JSONB';
  IF _phone_val IS NOT NULL AND _phone_val != '' THEN
    _phone_jsonb := jsonb_build_array(jsonb_build_object('number', _phone_val, 'type', 'Work'));
  ELSE
    _phone_jsonb := '[]'::jsonb;
  END IF;
  RAISE NOTICE 'Phone JSONB: %', _phone_jsonb;

  -- Create Organization
  RAISE NOTICE 'About to create organization';
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
  RAISE NOTICE 'Created organization with id: %', _org_id;

  -- Create Contact
  RAISE NOTICE 'About to create contact';
  RAISE NOTICE 'First name: %, Last name: %', _data->>'first_name', _data->>'last_name';
  RAISE NOTICE 'Org ID: %, Sales ID: %', _org_id, _sales_id;

  INSERT INTO contacts (
    name, first_name, last_name, organization_id, sales_id,
    email, phone, first_seen, last_seen, tags
  ) VALUES (
    (_data->>'first_name') || ' ' || (_data->>'last_name'),
    _data->>'first_name',
    _data->>'last_name',
    _org_id,
    _sales_id,
    _email_jsonb,
    _phone_jsonb,
    NOW(), NOW(), '{}'::bigint[]
  ) RETURNING id INTO _contact_id;
  RAISE NOTICE 'Created contact with id: %', _contact_id;

  -- Create Opportunity
  RAISE NOTICE 'About to create opportunity';
  INSERT INTO opportunities (
    name, customer_organization_id, principal_organization_id,
    contact_ids, campaign, stage, priority, estimated_close_date,
    lead_source, description, opportunity_owner_id
  ) VALUES (
    _data->>'campaign' || ' - ' || _data->>'org_name' || ' - ' ||
      (SELECT name FROM organizations WHERE id = (_data->>'principal_id')::BIGINT),
    _org_id,
    (_data->>'principal_id')::BIGINT,
    ARRAY[_contact_id],
    _data->>'campaign',
    'new_lead',
    'medium',
    (CURRENT_DATE + INTERVAL '30 days')::date,
    'trade_show',
    NULLIF(_data->>'quick_note', ''),
    _sales_id
  ) RETURNING id INTO _opp_id;
  RAISE NOTICE 'Created opportunity with id: %', _opp_id;

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
