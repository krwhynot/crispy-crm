-- ============================================================================
-- OPPORTUNITIES & ACTIVITIES SEED DATA
-- ============================================================================
-- Sample opportunities demonstrating principal-customer relationships
-- with various stages and activities to test interaction tracking
-- ============================================================================

-- First, let's get the sales ID for our test user (created by trigger)
DO $$
DECLARE
  v_sales_id BIGINT;
BEGIN
  -- Get the sales ID for our test user
  SELECT id INTO v_sales_id
  FROM sales
  WHERE user_id = 'd3129876-b1fe-40eb-9980-64f5f73c64d6'
  LIMIT 1;

  -- If no sales record exists, create one
  IF v_sales_id IS NULL THEN
    INSERT INTO sales (first_name, last_name, email, user_id)
    VALUES ('Admin', 'User', 'admin@test.com', 'd3129876-b1fe-40eb-9980-64f5f73c64d6')
    RETURNING id INTO v_sales_id;
  END IF;

  -- ============================================================================
  -- OPPORTUNITIES
  -- ============================================================================

  -- Kaufholds (Cheese) Opportunities
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    principal_organization_id,
    stage,
    status,
    priority,
    description,
    estimated_close_date,
    opportunity_owner_id,
    lead_source,
    created_at
  ) VALUES
    -- Active deals
    ('Cheese Curd Program - Q1 2025',
     13,  -- A.Fusion
     1796, -- Kaufholds
     'demo_scheduled',
     'active',
     'high',
     'Large volume cheese curd program for all locations. Demo scheduled for next week.',
     CURRENT_DATE + INTERVAL '30 days',
     v_sales_id,
     'referral',
     NOW() - INTERVAL '15 days'),

    ('Wisconsin Cheese Variety Pack',
     26,  -- ALINEA (high-end restaurant)
     1796, -- Kaufholds
     'closed_won',
     'active',
     'medium',
     'Artisanal cheese selection for seasonal menu. Successfully closed.',
     CURRENT_DATE - INTERVAL '5 days',
     v_sales_id,
     'cold_call',
     NOW() - INTERVAL '45 days'),

    ('Cheese Sticks LTO',
     44,  -- Arlington Tap House
     1796, -- Kaufholds
     'feedback_logged',
     'active',
     'high',
     'Limited time offer on breaded cheese sticks. Customer loved the samples.',
     CURRENT_DATE + INTERVAL '14 days',
     v_sales_id,
     'trade_show',
     NOW() - INTERVAL '7 days');

  -- Frites Street (French Fries) Opportunities
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    principal_organization_id,
    stage,
    status,
    priority,
    description,
    estimated_close_date,
    opportunity_owner_id,
    lead_source,
    created_at
  ) VALUES
    ('3/8" Straight Cut Fries Program',
     6,   -- 8 hospitality group (multiple locations)
     1797, -- Frites Street
     'sample_visit_offered',
     'active',
     'critical',
     'High-volume fry program for entire hospitality group. Awaiting decision from corporate.',
     CURRENT_DATE + INTERVAL '21 days',
     v_sales_id,
     'existing_customer',
     NOW() - INTERVAL '20 days'),

    ('Cowboy Chips Launch',
     52,  -- Astor Club
     1797, -- Frites Street
     'sample_visit_offered',
     'active',
     'medium',
     'New product launch - cowboy style thick cut chips. Sample visit scheduled.',
     CURRENT_DATE + INTERVAL '45 days',
     v_sales_id,
     'email_campaign',
     NOW() - INTERVAL '3 days');

  -- Better Balance (Plant-Based) Opportunities
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    principal_organization_id,
    stage,
    status,
    priority,
    description,
    estimated_close_date,
    opportunity_owner_id,
    lead_source,
    created_at
  ) VALUES
    ('Plant-Based Menu Conversion',
     51,  -- Ashland University
     1798, -- Better Balance
     'initial_outreach',
     'active',
     'high',
     'University interested in expanding plant-based options across campus dining.',
     CURRENT_DATE + INTERVAL '60 days',
     v_sales_id,
     'referral',
     NOW() - INTERVAL '2 days'),

    ('Better Balance Burger Trial',
     12,  -- A&W
     1798, -- Better Balance
     'closed_lost',
     'active',
     'low',
     'Trial program for plant-based burgers. Lost to competitor on price.',
     CURRENT_DATE - INTERVAL '10 days',
     v_sales_id,
     'cold_call',
     NOW() - INTERVAL '30 days');

  -- VAF (Vertical Farms) Opportunities
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    principal_organization_id,
    stage,
    status,
    priority,
    description,
    estimated_close_date,
    opportunity_owner_id,
    lead_source,
    created_at
  ) VALUES
    ('Hydroponic Lettuce Program',
     26,  -- ALINEA
     1799, -- VAF
     'closed_won',
     'active',
     'critical',
     'Year-round hydroponic lettuce supply contract. Premium pricing accepted.',
     CURRENT_DATE - INTERVAL '1 day',
     v_sales_id,
     'partner',
     NOW() - INTERVAL '60 days'),

    ('Spring Greens Initiative',
     40,  -- Apolonia
     1799, -- VAF
     'demo_scheduled',
     'active',
     'medium',
     'Locally grown greens program. Chef tasting scheduled.',
     CURRENT_DATE + INTERVAL '10 days',
     v_sales_id,
     'website',
     NOW() - INTERVAL '8 days');

  -- Annasea (Poke/Seafood) Opportunities
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    principal_organization_id,
    stage,
    status,
    priority,
    description,
    estimated_close_date,
    opportunity_owner_id,
    lead_source,
    created_at
  ) VALUES
    ('Poke Bowl Base Program',
     54,  -- Atelier
     1801, -- Annasea
     'new_lead',
     'active',
     'low',
     'New lead from food show. Interested in pre-marinated poke bases.',
     CURRENT_DATE + INTERVAL '90 days',
     v_sales_id,
     'trade_show',
     NOW() - INTERVAL '1 day'),

    ('Sushi-Grade Fish Supply',
     50,  -- Asador Bastian
     1801, -- Annasea
     'feedback_logged',
     'active',
     'high',
     'Regular sushi-grade fish supply. Chef approved quality.',
     CURRENT_DATE + INTERVAL '14 days',
     v_sales_id,
     'referral',
     NOW() - INTERVAL '21 days');

  -- Rapid Rasoi (Indian Bases) Opportunities
  INSERT INTO opportunities (
    name,
    customer_organization_id,
    principal_organization_id,
    stage,
    status,
    priority,
    description,
    estimated_close_date,
    opportunity_owner_id,
    lead_source,
    created_at
  ) VALUES
    ('Indian Gravy Base Rollout',
     22,  -- Albanos Pasta
     1802, -- Rapid Rasoi
     'sample_visit_offered',
     'active',
     'medium',
     'Adding Indian fusion items. Testing gravy bases.',
     CURRENT_DATE + INTERVAL '35 days',
     v_sales_id,
     'cold_call',
     NOW() - INTERVAL '10 days'),

    ('Butter Chicken LTO',
     53,  -- At the Office Bar & Grill
     1802, -- Rapid Rasoi
     'feedback_logged',
     'active',
     'high',
     'Limited time butter chicken special using our base. Awaiting owner approval.',
     CURRENT_DATE + INTERVAL '7 days',
     v_sales_id,
     'email_campaign',
     NOW() - INTERVAL '5 days');

  -- ============================================================================
  -- ACTIVITIES & INTERACTIONS
  -- ============================================================================
  -- Adding realistic activities to demonstrate the interaction tracking system
  -- Activities that change stages are automatically "interactions"

  -- Get opportunity IDs for activity creation
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    contact_id,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    follow_up_date,
    created_by,
    created_at
  )
  SELECT
    'interaction',
    'email',
    'Initial inquiry about cheese curd program',
    'Customer reached out after referral from another location. Very interested in our Wisconsin cheese curds.',
    NOW() - INTERVAL '15 days',
    5,
    NULL,
    13,  -- A.Fusion
    o.id,
    'positive',
    true,
    CURRENT_DATE - INTERVAL '10 days',
    v_sales_id,
    NOW() - INTERVAL '15 days'
  FROM opportunities o
  WHERE o.name = 'Cheese Curd Program - Q1 2025'
  LIMIT 1;

  -- Follow-up call
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    created_by,
    created_at
  )
  SELECT
    'interaction',
    'call',
    'Discussed volume pricing and delivery schedule',
    'Confirmed they need 50lbs per week across 3 locations. Moved to demo stage.',
    NOW() - INTERVAL '10 days',
    25,
    13,
    o.id,
    'positive',
    true,
    CURRENT_DATE + INTERVAL '7 days',
    v_sales_id,
    NOW() - INTERVAL '10 days'
  FROM opportunities o
  WHERE o.name = 'Cheese Curd Program - Q1 2025'
  LIMIT 1;

  -- Demo scheduled activity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    follow_up_date,
    created_by,
    created_at
  )
  SELECT
    'interaction',
    'meeting',
    'Demo scheduled for next Tuesday',
    'Will bring 3 varieties of cheese curds for kitchen staff to test. Chef very excited.',
    NOW() - INTERVAL '3 days',
    15,
    13,
    o.id,
    'positive',
    true,
    CURRENT_DATE + INTERVAL '4 days',
    v_sales_id,
    NOW() - INTERVAL '3 days'
  FROM opportunities o
  WHERE o.name = 'Cheese Curd Program - Q1 2025'
  LIMIT 1;

  -- Add activities for Frites Street opportunity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    created_by,
    created_at
  )
  SELECT
    'interaction',
    'meeting',
    'Met with hospitality group purchasing team',
    'Presented full frites line. They want to standardize across all 8 locations.',
    NOW() - INTERVAL '20 days',
    60,
    6,
    o.id,
    'positive',
    true,
    CURRENT_DATE - INTERVAL '15 days',
    v_sales_id,
    NOW() - INTERVAL '20 days'
  FROM opportunities o
  WHERE o.name = '3/8" Straight Cut Fries Program'
  LIMIT 1;

  -- Awaiting response activity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    follow_up_date,
    created_by,
    created_at
  )
  SELECT
    'engagement',  -- Regular activity, not interaction
    'email',
    'Sent pricing proposal',
    'Submitted formal pricing for review. Waiting for corporate approval.',
    NOW() - INTERVAL '8 days',
    10,
    6,
    o.id,
    'neutral',
    true,
    CURRENT_DATE + INTERVAL '2 days',
    v_sales_id,
    NOW() - INTERVAL '8 days'
  FROM opportunities o
  WHERE o.name = '3/8" Straight Cut Fries Program'
  LIMIT 1;

  -- Add closed won activities for VAF opportunity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    created_by,
    created_at
  )
  SELECT
    'interaction',
    'meeting',
    'Final negotiation and contract signing',
    'Agreed to premium pricing for guaranteed quality and year-round supply.',
    NOW() - INTERVAL '1 day',
    90,
    26,
    o.id,
    'positive',
    false,
    NULL,
    v_sales_id,
    NOW() - INTERVAL '1 day'
  FROM opportunities o
  WHERE o.name = 'Hydroponic Lettuce Program'
  LIMIT 1;

  -- Add trade show activity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    follow_up_date,
    created_by,
    created_at
  )
  SELECT
    'interaction',
    'meeting',
    'Met at National Restaurant Show',
    'Great booth visit. Chef was impressed with the breaded cheese stick samples.',
    NOW() - INTERVAL '7 days',
    20,
    44,
    o.id,
    'positive',
    true,
    CURRENT_DATE + INTERVAL '3 days',
    v_sales_id,
    NOW() - INTERVAL '7 days'
  FROM opportunities o
  WHERE o.name = 'Cheese Sticks LTO'
  LIMIT 1;

  -- Lost opportunity activity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    created_by,
    created_at
  )
  SELECT
    'interaction',
    'call',
    'Lost to competitor on price',
    'Corporate decided to go with cheaper alternative. Will revisit in 6 months.',
    NOW() - INTERVAL '10 days',
    15,
    12,
    o.id,
    'negative',
    true,
    CURRENT_DATE + INTERVAL '180 days',
    v_sales_id,
    NOW() - INTERVAL '10 days'
  FROM opportunities o
  WHERE o.name = 'Better Balance Burger Trial'
  LIMIT 1;

  -- Recent new lead activity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    organization_id,
    opportunity_id,
    sentiment,
    follow_up_required,
    follow_up_date,
    created_by,
    created_at
  )
  SELECT
    'engagement',
    'meeting',
    'Food show booth visit - initial interest',
    'Stopped by our booth, tried poke samples. Wants to explore adding poke bowls to menu.',
    NOW() - INTERVAL '1 day',
    10,
    54,
    o.id,
    'positive',
    true,
    CURRENT_DATE + INTERVAL '7 days',
    v_sales_id,
    NOW() - INTERVAL '1 day'
  FROM opportunities o
  WHERE o.name = 'Poke Bowl Base Program'
  LIMIT 1;

  -- Update nb_interactions if the view exists
  -- This would normally be done by a database view or trigger
  UPDATE opportunities o
  SET nb_interactions = (
    SELECT COUNT(*)
    FROM activities a
    WHERE a.opportunity_id = o.id
      AND a.activity_type = 'interaction'
      AND a.deleted_at IS NULL
  ),
  last_interaction_date = (
    SELECT MAX(activity_date)
    FROM activities a
    WHERE a.opportunity_id = o.id
      AND a.activity_type = 'interaction'
      AND a.deleted_at IS NULL
  );

END $$;