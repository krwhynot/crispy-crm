-- Fix Dashboard V3 Empty Panels
-- Links current auth user to sales record and creates minimal test data

DO $$
DECLARE
  v_auth_user_id UUID;
  v_auth_email TEXT;
  v_sales_id BIGINT;
  v_principal_id BIGINT;
  v_customer_id BIGINT;
  v_opp_id BIGINT;
BEGIN
  -- Get the first auth user (your logged-in user)
  SELECT id, email INTO v_auth_user_id, v_auth_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth users found. Please log in first.';
  END IF;

  RAISE NOTICE 'Found auth user: % (%)', v_auth_email, v_auth_user_id;

  -- Check if sales record exists for this user
  SELECT id INTO v_sales_id
  FROM sales
  WHERE user_id = v_auth_user_id OR email = v_auth_email;

  IF v_sales_id IS NULL THEN
    -- Create new sales record
    INSERT INTO sales (email, first_name, last_name, role, user_id)
    VALUES (
      v_auth_email,
      'Demo',
      'User',
      'rep',
      v_auth_user_id
    )
    RETURNING id INTO v_sales_id;

    RAISE NOTICE 'Created sales record: %', v_sales_id;
  ELSE
    -- Update existing sales record with user_id
    UPDATE sales
    SET user_id = v_auth_user_id,
        email = v_auth_email
    WHERE id = v_sales_id;

    RAISE NOTICE 'Updated sales record: %', v_sales_id;
  END IF;

  -- Create test principal organization if it doesn't exist
  INSERT INTO organizations (
    name,
    organization_type,
    priority,
    city,
    state,
    created_at,
    created_by
  )
  VALUES (
    'Demo Principal Org',
    'principal',
    'A',  -- A = High Priority
    'San Francisco',
    'CA',
    NOW(),
    v_sales_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_principal_id;

  IF v_principal_id IS NULL THEN
    SELECT id INTO v_principal_id
    FROM organizations
    WHERE name = 'Demo Principal Org' AND organization_type = 'principal';
  END IF;

  RAISE NOTICE 'Principal org: %', v_principal_id;

  -- Create test customer organization
  INSERT INTO organizations (
    name,
    organization_type,
    principal_organization_id,
    priority,
    city,
    state,
    created_at,
    created_by
  )
  VALUES (
    'Demo Customer',
    'customer',
    v_principal_id,
    'C',  -- C = Medium Priority
    'Oakland',
    'CA',
    NOW(),
    v_sales_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer_id;

  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id
    FROM organizations
    WHERE name = 'Demo Customer';
  END IF;

  RAISE NOTICE 'Customer org: %', v_customer_id;

  -- Create test opportunity
  INSERT INTO opportunities (
    name,
    stage,
    priority,
    estimated_close_date,
    principal_organization_id,
    customer_organization_id,
    created_by,
    created_at
  )
  VALUES (
    'Demo Active Deal',
    'discovery',
    'high',
    CURRENT_DATE + INTERVAL '30 days',
    v_principal_id,
    v_customer_id,
    v_sales_id,
    NOW() - INTERVAL '5 days'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_opp_id;

  IF v_opp_id IS NULL THEN
    SELECT id INTO v_opp_id
    FROM opportunities
    WHERE name = 'Demo Active Deal';
  END IF;

  -- Create recent activity for momentum
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    outcome,
    duration_minutes,
    opportunity_id,
    organization_id,
    created_by,
    created_at
  )
  VALUES
    (
      'interaction',
      'call',
      'Discovery call',
      'Discussed requirements',
      NOW() - INTERVAL '2 days',
      'Connected',
      45,
      v_opp_id,
      v_customer_id,
      v_sales_id,
      NOW() - INTERVAL '2 days'
    ),
    (
      'interaction',
      'email',
      'Follow-up email',
      'Sent proposal',
      NOW() - INTERVAL '1 day',
      'Completed',
      NULL,
      v_opp_id,
      v_customer_id,
      v_sales_id,
      NOW() - INTERVAL '1 day'
    )
  ON CONFLICT DO NOTHING;

  -- Create tasks (using correct capitalized enum values)
  INSERT INTO tasks (
    title,
    description,
    type,
    priority,
    due_date,
    completed,
    opportunity_id,
    sales_id,
    created_by,
    created_at
  )
  VALUES
    (
      'Call back prospect',
      'Follow up on proposal',
      'Call',
      'high',
      CURRENT_DATE - INTERVAL '1 day',
      FALSE,
      v_opp_id,
      v_sales_id,
      v_sales_id,
      NOW() - INTERVAL '3 days'
    ),
    (
      'Prepare demo materials',
      'Gather slides for next week',
      'Meeting',
      'high',
      CURRENT_DATE,
      FALSE,
      v_opp_id,
      v_sales_id,
      v_sales_id,
      NOW() - INTERVAL '1 day'
    ),
    (
      'Schedule follow-up',
      'Book time with decision maker',
      'Call',
      'medium',
      CURRENT_DATE + INTERVAL '2 days',
      FALSE,
      v_opp_id,
      v_sales_id,
      v_sales_id,
      NOW()
    )
  ON CONFLICT DO NOTHING;

  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Dashboard V3 Fix Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Auth User: % (%)', v_auth_email, v_auth_user_id;
  RAISE NOTICE 'Sales ID: %', v_sales_id;
  RAISE NOTICE 'Principal Org: %', v_principal_id;
  RAISE NOTICE 'Customer Org: %', v_customer_id;
  RAISE NOTICE 'Opportunity: %', v_opp_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Reload /dashboard-v3 to see data';
  RAISE NOTICE '========================================';
END $$;
