-- Migration: Fix segment_id in create_booth_visitor_opportunity function
-- Issue: Function uses outdated segment UUID (562062be-c15b-417f-b2a1-d4a643d69d52) that no longer exists
-- Fix: Use "Unknown" playbook category UUID (22222222-2222-4222-8222-000000000009)
-- Reference: src/atomic-crm/validation/segments.ts PLAYBOOK_CATEGORY_IDS.Unknown

CREATE OR REPLACE FUNCTION public.create_booth_visitor_opportunity(_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id BIGINT;
  _contact_id BIGINT;
  _opp_id BIGINT;
  _sales_id BIGINT;
  _principal_id BIGINT;
  _email_val TEXT;
  _phone_val TEXT;
  _email_jsonb JSONB;
  _phone_jsonb JSONB;
  _principal_name TEXT;
  _principal_type organization_type;
  _opp_name TEXT;
  _first_name TEXT;
  _last_name TEXT;
  _org_name TEXT;
  _city TEXT;
  _state TEXT;
  _campaign TEXT;
  _quick_note TEXT;
BEGIN
  -- Get current user's sales ID
  _sales_id := (SELECT id FROM sales WHERE user_id = auth.uid());

  IF _sales_id IS NULL THEN
    RAISE EXCEPTION 'Current user does not have a sales record. User ID: %', auth.uid();
  END IF;

  -- Extract all text values from JSONB
  _first_name := _data->>'first_name';
  _last_name := _data->>'last_name';
  _org_name := _data->>'org_name';
  _city := _data->>'city';
  _state := _data->>'state';
  _campaign := _data->>'campaign';
  _quick_note := _data->>'quick_note';
  _email_val := _data->>'email';
  _phone_val := _data->>'phone';
  _principal_id := (_data->>'principal_id')::BIGINT;

  -- Validate required fields
  IF _first_name IS NULL OR _last_name IS NULL THEN
    RAISE EXCEPTION 'first_name and last_name are required';
  END IF;

  IF _org_name IS NULL THEN
    RAISE EXCEPTION 'org_name is required';
  END IF;

  IF _city IS NULL OR _state IS NULL THEN
    RAISE EXCEPTION 'city and state are required';
  END IF;

  IF _principal_id IS NULL THEN
    RAISE EXCEPTION 'principal_id is required';
  END IF;

  IF _campaign IS NULL THEN
    RAISE EXCEPTION 'campaign is required';
  END IF;

  -- Validate at least one contact method exists
  IF (_email_val IS NULL OR _email_val = '') AND (_phone_val IS NULL OR _phone_val = '') THEN
    RAISE EXCEPTION 'At least one of email or phone is required';
  END IF;

  -- Build JSONB arrays for email and phone
  IF _email_val IS NOT NULL AND _email_val != '' THEN
    _email_jsonb := jsonb_build_array(jsonb_build_object('email', _email_val, 'type', 'Work'));
  ELSE
    _email_jsonb := '[]'::jsonb;
  END IF;

  IF _phone_val IS NOT NULL AND _phone_val != '' THEN
    _phone_jsonb := jsonb_build_array(jsonb_build_object('number', _phone_val, 'type', 'Work'));
  ELSE
    _phone_jsonb := '[]'::jsonb;
  END IF;

  -- Create Organization with CORRECT segment_id (Unknown playbook category)
  INSERT INTO organizations (
    name, city, state, organization_type, sales_id, segment_id
  ) VALUES (
    _org_name,
    _city,
    _state,
    'customer',
    _sales_id,
    '22222222-2222-4222-8222-000000000009'::uuid  -- FIX: Use "Unknown" category
  ) RETURNING id INTO _org_id;

  -- Create Contact
  INSERT INTO contacts (
    name, first_name, last_name, organization_id, sales_id,
    email, phone, first_seen, last_seen, tags
  ) VALUES (
    _first_name || ' ' || _last_name,
    _first_name,
    _last_name,
    _org_id,
    _sales_id,
    _email_jsonb,
    _phone_jsonb,
    NOW(), NOW(), '{}'::bigint[]
  ) RETURNING id INTO _contact_id;

  -- Validate principal organization and get name
  SELECT name, organization_type
  INTO _principal_name, _principal_type
  FROM organizations
  WHERE id = _principal_id;

  IF _principal_name IS NULL THEN
    RAISE EXCEPTION 'Principal organization with id % does not exist', _principal_id;
  END IF;

  IF _principal_type != 'principal' THEN
    RAISE EXCEPTION 'Organization % is not a principal', _principal_id;
  END IF;

  -- Build opportunity name
  _opp_name := _campaign || ' - ' || _org_name || ' - ' || _principal_name;

  -- Create Opportunity
  INSERT INTO opportunities (
    name, customer_organization_id, principal_organization_id,
    contact_ids, campaign, stage, priority, estimated_close_date,
    lead_source, description, opportunity_owner_id
  ) VALUES (
    _opp_name,
    _org_id,
    _principal_id,
    ARRAY[_contact_id],
    _campaign,
    'new_lead',
    'medium',
    (CURRENT_DATE + INTERVAL '30 days')::date,
    'trade_show',
    NULLIF(_quick_note, ''),
    _sales_id
  ) RETURNING id INTO _opp_id;

  -- Link products if provided
  IF _data->'product_ids' IS NOT NULL THEN
    INSERT INTO opportunity_products (opportunity_id, product_id_reference)
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

-- Verify the segment exists (will fail migration if not)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM segments WHERE id = '22222222-2222-4222-8222-000000000009') THEN
    RAISE EXCEPTION 'Unknown segment category does not exist. Run seed migration first.';
  END IF;
END $$;
