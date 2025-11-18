-- Create Demo Data for Dashboard V3
-- Auth user already linked, just create test orgs/opps/tasks

DO $$
DECLARE
  v_sales_id BIGINT := 6;  -- Your linked sales record
  v_principal_id BIGINT;
  v_customer_id BIGINT;
  v_opp_id BIGINT;
BEGIN
  -- Create principal organization
  INSERT INTO organizations (
    name,
    organization_type,
    priority,
    city,
    state,
    created_by
  )
  VALUES (
    'Demo Principal Org',
    'principal',
    'A',
    'San Francisco',
    'CA',
    v_sales_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_principal_id;

  IF v_principal_id IS NULL THEN
    SELECT id INTO v_principal_id
    FROM organizations
    WHERE name = 'Demo Principal Org' AND organization_type = 'principal';
  END IF;

  -- Create customer organization
  INSERT INTO organizations (
    name,
    organization_type,
    principal_organization_id,
    priority,
    city,
    state,
    created_by
  )
  VALUES (
    'Demo Customer',
    'customer',
    v_principal_id,
    'C',
    'Oakland',
    'CA',
    v_sales_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer_id;

  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id
    FROM organizations
    WHERE name = 'Demo Customer';
  END IF;

  -- Create opportunity
  INSERT INTO opportunities (
    name,
    stage,
    priority,
    estimated_close_date,
    principal_organization_id,
    customer_organization_id,
    created_by
  )
  VALUES (
    'Demo Active Deal',
    'discovery',
    'high',
    CURRENT_DATE + INTERVAL '30 days',
    v_principal_id,
    v_customer_id,
    v_sales_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_opp_id;

  IF v_opp_id IS NULL THEN
    SELECT id INTO v_opp_id
    FROM opportunities
    WHERE name = 'Demo Active Deal';
  END IF;

  -- Create activities for momentum
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
    created_by
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
      v_sales_id
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
      v_sales_id
    )
  ON CONFLICT DO NOTHING;

  -- Create tasks
  INSERT INTO tasks (
    title,
    description,
    type,
    priority,
    due_date,
    completed,
    opportunity_id,
    sales_id,
    created_by
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
      v_sales_id
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
      v_sales_id
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
      v_sales_id
    )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✓ Demo data created successfully!';
END $$;
