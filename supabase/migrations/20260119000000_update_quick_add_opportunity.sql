-- Update create_booth_visitor_opportunity function
-- Changes:
--   1. Accept optional organization_id - use existing org instead of creating new
--   2. Accept account_manager_id - override auto-detection from auth.uid()
--   3. Make contact fields (first_name, last_name) optional
--   4. Make city/state optional
--   5. Make campaign optional (default to empty string)
--   6. Remove phone/email requirement validation
--   7. Generate opportunity name as {org_name} - {principal_name} (no campaign)
--   8. Only create contact if at least one contact field provided
--   9. Add search_path for security

CREATE OR REPLACE FUNCTION create_booth_visitor_opportunity(_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  _org_id BIGINT;
  _contact_id BIGINT;
  _opp_id BIGINT;
  _account_manager_id BIGINT;
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
  _create_contact BOOLEAN;
BEGIN
  -- Extract all text values from JSONB
  _first_name := _data->>'first_name';
  _last_name := _data->>'last_name';
  _org_name := _data->>'org_name';
  _city := _data->>'city';
  _state := _data->>'state';
  _campaign := COALESCE(_data->>'campaign', '');
  _quick_note := _data->>'quick_note';
  _email_val := _data->>'email';
  _phone_val := _data->>'phone';
  _principal_id := (_data->>'principal_id')::BIGINT;
  _org_id := (_data->>'organization_id')::BIGINT;

  -- Validate principal_id is required
  IF _principal_id IS NULL THEN
    RAISE EXCEPTION 'principal_id is required';
  END IF;

  -- Get account_manager_id from input, fallback to current user's sales_id
  _account_manager_id := COALESCE(
    (_data->>'account_manager_id')::BIGINT,
    (SELECT id FROM sales WHERE user_id = auth.uid())
  );

  IF _account_manager_id IS NULL THEN
    RAISE EXCEPTION 'account_manager_id is required or current user must have a sales record. User ID: %', auth.uid();
  END IF;

  -- Handle organization: use existing or create new
  IF _org_id IS NOT NULL THEN
    -- Validate existing organization exists and is not deleted
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = _org_id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Organization with id % does not exist or is deleted', _org_id;
    END IF;

    -- Get org name for opportunity name generation
    SELECT name INTO _org_name FROM organizations WHERE id = _org_id;
  ELSE
    -- Require org_name for new org creation
    IF _org_name IS NULL OR _org_name = '' THEN
      RAISE EXCEPTION 'Either organization_id or org_name is required';
    END IF;

    -- Create Organization
    INSERT INTO organizations (
      name, city, state, organization_type, sales_id, segment_id
    ) VALUES (
      _org_name,
      _city,
      _state,
      'customer',
      _account_manager_id,
      '562062be-c15b-417f-b2a1-d4a643d69d52'::uuid
    ) RETURNING id INTO _org_id;
  END IF;

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

  -- Determine if we should create a contact (at least one contact field provided)
  _create_contact := (
    _first_name IS NOT NULL OR
    _last_name IS NOT NULL OR
    _email_val IS NOT NULL OR
    _phone_val IS NOT NULL
  );

  -- Only create contact if contact info provided
  IF _create_contact THEN
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

    -- Create Contact
    INSERT INTO contacts (
      name, first_name, last_name, organization_id, sales_id,
      email, phone, first_seen, last_seen, tags
    ) VALUES (
      COALESCE(_first_name, '') || CASE WHEN _first_name IS NOT NULL AND _last_name IS NOT NULL THEN ' ' ELSE '' END || COALESCE(_last_name, ''),
      _first_name,
      _last_name,
      _org_id,
      _account_manager_id,
      _email_jsonb,
      _phone_jsonb,
      NOW(), NOW(), '{}'::bigint[]
    ) RETURNING id INTO _contact_id;
  END IF;

  -- Generate opportunity name: {org_name} - {principal_name}
  _opp_name := _org_name || ' - ' || _principal_name;

  -- Create Opportunity
  INSERT INTO opportunities (
    name, customer_organization_id, principal_organization_id,
    contact_ids, campaign, stage, priority, estimated_close_date,
    lead_source, description, opportunity_owner_id
  ) VALUES (
    _opp_name,
    _org_id,
    _principal_id,
    CASE WHEN _contact_id IS NOT NULL THEN ARRAY[_contact_id] ELSE '{}'::bigint[] END,
    _campaign,
    'new_lead',
    'medium',
    (CURRENT_DATE + INTERVAL '30 days')::date,
    'trade_show',
    NULLIF(_quick_note, ''),
    _account_manager_id
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
