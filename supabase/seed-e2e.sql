-- ============================================================================
-- E2E TEST DATA - Dashboard Widgets
-- ============================================================================
-- This file adds test data specifically for E2E dashboard widget testing
-- Uses dynamic dates relative to NOW() to ensure data is always "current"
--
-- Run with: npm run db:local:seed:e2e
-- Or: psql <connection> -f supabase/seed-e2e.sql
-- ============================================================================

BEGIN;

-- Get the admin test user's sales_id
DO $$
DECLARE
  v_user_id UUID := 'd3129876-b1fe-40eb-9980-64f5f73c64d6';
  v_sales_id BIGINT;
  v_org_id BIGINT;
  v_contact_id BIGINT;
  v_opp_id BIGINT;
BEGIN
  -- Get sales_id for admin user
  SELECT id INTO v_sales_id FROM sales WHERE user_id = v_user_id LIMIT 1;

  IF v_sales_id IS NULL THEN
    RAISE EXCEPTION 'Admin user sales record not found. Run seed.sql first.';
  END IF;

  RAISE NOTICE 'Using sales_id: %', v_sales_id;

  -- ============================================================================
  -- OPPORTUNITIES (for Pipeline Summary widget)
  -- ============================================================================
  -- Create active opportunities in various stages to trigger Pipeline Summary display

  -- Opportunity 1: Lead stage (organization 1)
  INSERT INTO opportunities (
    name, description, stage, status, estimated_close_date,
    customer_organization_id, principal_organization_id, account_manager_id, priority, created_at, updated_at, created_by
  ) VALUES (
    'RJC - Artisan Cheese Program',
    'Premium cheese selection for upscale menu',
    'new_lead', 'active', CURRENT_DATE + INTERVAL '45 days',
    1, 1, v_sales_id, 'high', NOW() - INTERVAL '5 days', NOW(), v_sales_id
  ) RETURNING id INTO v_opp_id;

  -- Opportunity 2: Qualification stage (organization 7 - Rapid Rasoi)
  INSERT INTO opportunities (
    name, description, stage, status, expected_close_date,
    organization_id, account_manager_id, priority, created_at, updated_at, created_by
  ) VALUES (
    'Rapid Rasoi - Paneer Supply Contract',
    'Monthly paneer delivery program',
    'qualification', 'active', NOW() + INTERVAL '30 days',
    7, v_sales_id, 'high', NOW() - INTERVAL '45 days', NOW(), v_sales_id
  ) RETURNING id INTO v_opp_id;

  -- Opportunity 3: Demo stage (organization 13 - Kaufholds)
  INSERT INTO opportunities (
    name, description, stage, status, expected_close_date,
    organization_id, account_manager_id, priority, created_at, updated_at, created_by
  ) VALUES (
    'Kaufholds - Spring Menu Launch',
    'Seasonal cheese curds and specialty items',
    'demo', 'active', NOW() + INTERVAL '60 days',
    13, v_sales_id, 'medium', NOW() - INTERVAL '60 days', NOW(), v_sales_id
  ) RETURNING id INTO v_opp_id;

  -- Opportunity 4: Proposal stage (organization 26 - Better Balance)
  INSERT INTO opportunities (
    name, description, stage, status, expected_close_date,
    organization_id, account_manager_id, priority, created_at, updated_at, created_by
  ) VALUES (
    'Better Balance - Plant-Based Program',
    'Vegan cheese alternatives for health-conscious menu',
    'proposal', 'active', NOW() + INTERVAL '20 days',
    26, v_sales_id, 'medium', NOW() - INTERVAL '90 days', NOW(), v_sales_id
  ) RETURNING id INTO v_opp_id;

  -- Opportunity 5: Negotiation stage - STUCK (organization 44 - Frites Street)
  INSERT INTO opportunities (
    name, description, stage, status, expected_close_date,
    organization_id, account_manager_id, priority, created_at, updated_at, created_by, days_in_stage
  ) VALUES (
    'Frites Street - Belgian Cheese Import Deal',
    'Exclusive import partnership for authentic Belgian cheeses',
    'negotiation', 'active', NOW() + INTERVAL '15 days',
    44, v_sales_id, 'critical', NOW() - INTERVAL '40 days', NOW() - INTERVAL '35 days', v_sales_id, 35
  ) RETURNING id INTO v_opp_id;

  -- Opportunity 6: Closed-won (organization 97 - Wicks)
  INSERT INTO opportunities (
    name, description, stage, status, expected_close_date,
    organization_id, account_manager_id, priority, created_at, updated_at, created_by, close_date
  ) VALUES (
    'Wicks - Monthly Subscription Program',
    'Recurring cheese delivery for brunch menu',
    'closed-won', 'won', NOW() - INTERVAL '3 days',
    97, v_sales_id, 'low', NOW() - INTERVAL '45 days', NOW(), v_sales_id, NOW()
  ) RETURNING id INTO v_opp_id;

  -- Opportunity 7: Ryan Wabeke (for E2E linking tests)
  INSERT INTO opportunities (
    name, description, stage, status, expected_close_date,
    organization_id, account_manager_id, priority, created_at, updated_at, created_by
  ) VALUES (
    'Ryan Wabeke',
    'E2E test opportunity for relationship linking tests',
    'qualification', 'active', NOW() + INTERVAL '25 days',
    1, v_sales_id, 'medium', NOW() - INTERVAL '20 days', NOW(), v_sales_id
  ) RETURNING id INTO v_opp_id;

  -- ============================================================================
  -- TASKS (for My Tasks This Week widget)
  -- ============================================================================
  -- Tasks with dynamic dates to ensure they appear in "this week" views

  -- Get opportunity IDs for task associations
  SELECT id INTO v_opp_id FROM opportunities WHERE name = 'RJC - Artisan Cheese Program' LIMIT 1;

  -- OVERDUE tasks
  INSERT INTO tasks (
    title, description, due_date, reminder_date, completed, priority, type,
    opportunity_id, sales_id, created_at, updated_at, created_by
  ) VALUES (
    'Follow up on RJC pricing proposal',
    'Chef requested price breakdown for artisan cheeses',
    CURRENT_DATE - INTERVAL '2 days', -- 2 days overdue
    CURRENT_DATE - INTERVAL '3 days',
    false, 'high', 'Follow-up',
    v_opp_id, v_sales_id, NOW() - INTERVAL '5 days', NOW(), v_sales_id
  );

  INSERT INTO tasks (
    title, description, due_date, reminder_date, completed, priority, type,
    opportunity_id, sales_id, created_at, updated_at, created_by
  ) VALUES (
    'Send contract to Rapid Rasoi purchasing',
    'Email final contract draft for review',
    CURRENT_DATE - INTERVAL '1 day', -- 1 day overdue
    CURRENT_DATE - INTERVAL '2 days',
    false, 'critical', 'Email',
    (SELECT id FROM opportunities WHERE name = 'Rapid Rasoi - Paneer Supply Contract' LIMIT 1),
    v_sales_id, NOW() - INTERVAL '4 days', NOW(), v_sales_id
  );

  -- DUE TODAY tasks
  INSERT INTO tasks (
    title, description, due_date, reminder_date, completed, priority, type,
    opportunity_id, sales_id, created_at, updated_at, created_by
  ) VALUES (
    'Call Kaufholds about spring menu timeline',
    'Confirm launch dates and seasonal availability',
    CURRENT_DATE, -- Due today
    CURRENT_DATE,
    false, 'high', 'Call',
    (SELECT id FROM opportunities WHERE name = 'Kaufholds - Spring Menu Launch' LIMIT 1),
    v_sales_id, NOW() - INTERVAL '3 days', NOW(), v_sales_id
  );

  INSERT INTO tasks (
    title, description, due_date, reminder_date, completed, priority, type,
    opportunity_id, sales_id, created_at, updated_at, created_by
  ) VALUES (
    'Prepare sample kit for Better Balance demo',
    'Assemble vegan cheese samples for tasting',
    CURRENT_DATE, -- Due today
    CURRENT_DATE - INTERVAL '1 day',
    false, 'medium', 'Discovery',
    (SELECT id FROM opportunities WHERE name = 'Better Balance - Plant-Based Program' LIMIT 1),
    v_sales_id, NOW() - INTERVAL '2 days', NOW(), v_sales_id
  );

  -- THIS WEEK tasks
  INSERT INTO tasks (
    title, description, due_date, reminder_date, completed, priority, type,
    opportunity_id, sales_id, created_at, updated_at, created_by
  ) VALUES (
    'Schedule meeting with Frites Street owner',
    'Discuss Belgian cheese import logistics',
    CURRENT_DATE + INTERVAL '2 days', -- In 2 days
    CURRENT_DATE + INTERVAL '1 day',
    false, 'critical', 'Meeting',
    (SELECT id FROM opportunities WHERE name = 'Frites Street - Belgian Cheese Import Deal' LIMIT 1),
    v_sales_id, NOW() - INTERVAL '1 day', NOW(), v_sales_id
  );

  INSERT INTO tasks (
    title, description, due_date, reminder_date, completed, priority, type,
    opportunity_id, sales_id, created_at, updated_at, created_by
  ) VALUES (
    'Send thank you note to Wicks',
    'Acknowledge subscription program signup',
    CURRENT_DATE + INTERVAL '3 days', -- In 3 days
    NULL,
    false, 'low', 'Administrative',
    (SELECT id FROM opportunities WHERE name = 'Wicks - Monthly Subscription Program' LIMIT 1),
    v_sales_id, NOW() - INTERVAL '1 day', NOW(), v_sales_id
  );

  INSERT INTO tasks (
    title, description, due_date, reminder_date, completed, priority, type,
    opportunity_id, sales_id, created_at, updated_at, created_by
  ) VALUES (
    'Update CRM notes for all active opportunities',
    'Document recent conversations and next steps',
    CURRENT_DATE + INTERVAL '4 days', -- In 4 days
    CURRENT_DATE + INTERVAL '3 days',
    false, 'low', 'Administrative',
    NULL, v_sales_id, NOW() - INTERVAL '1 day', NOW(), v_sales_id
  );

  -- ============================================================================
  -- ACTIVITIES (for Recent Activity Feed widget)
  -- ============================================================================
  -- Activities within last 7 days to populate Recent Activity Feed

  -- Activity 1: Call (1 day ago)
  INSERT INTO activities (
    activity_type, type, subject, description, activity_date, duration_minutes,
    organization_id, opportunity_id, sentiment, created_by, created_at
  ) VALUES (
    'activity', 'call', 'Pricing discussion with RJC chef',
    'Reviewed artisan cheese pricing and seasonal availability. Chef interested in monthly featured selections.',
    NOW() - INTERVAL '1 day', 35,
    1, (SELECT id FROM opportunities WHERE name = 'RJC - Artisan Cheese Program' LIMIT 1),
    'positive', v_sales_id, NOW() - INTERVAL '1 day'
  );

  -- Activity 2: Email (2 days ago)
  INSERT INTO activities (
    activity_type, type, subject, description, activity_date, duration_minutes,
    organization_id, opportunity_id, sentiment, created_by, created_at
  ) VALUES (
    'activity', 'email', 'Contract sent to Rapid Rasoi',
    'Sent final contract draft for paneer supply program. Awaiting procurement team review.',
    NOW() - INTERVAL '2 days', NULL,
    7, (SELECT id FROM opportunities WHERE name = 'Rapid Rasoi - Paneer Supply Contract' LIMIT 1),
    'neutral', v_sales_id, NOW() - INTERVAL '2 days'
  );

  -- Activity 3: Meeting (3 days ago)
  INSERT INTO activities (
    activity_type, type, subject, description, activity_date, duration_minutes,
    organization_id, opportunity_id, sentiment, created_by, created_at
  ) VALUES (
    'activity', 'meeting', 'Spring menu planning with Kaufholds',
    'Met with culinary team to discuss seasonal cheese offerings. Strong interest in cheese curds for appetizer menu.',
    NOW() - INTERVAL '3 days', 60,
    13, (SELECT id FROM opportunities WHERE name = 'Kaufholds - Spring Menu Launch' LIMIT 1),
    'positive', v_sales_id, NOW() - INTERVAL '3 days'
  );

  -- Activity 4: Call (4 days ago)
  INSERT INTO activities (
    activity_type, type, subject, description, activity_date, duration_minutes,
    organization_id, opportunity_id, sentiment, created_by, created_at
  ) VALUES (
    'activity', 'call', 'Sample tasting scheduled with Better Balance',
    'Confirmed vegan cheese tasting session for next week. Chef is excited about plant-based options.',
    NOW() - INTERVAL '4 days', 20,
    26, (SELECT id FROM opportunities WHERE name = 'Better Balance - Plant-Based Program' LIMIT 1),
    'positive', v_sales_id, NOW() - INTERVAL '4 days'
  );

  -- Activity 5: Meeting (5 days ago)
  INSERT INTO activities (
    activity_type, type, subject, description, activity_date, duration_minutes,
    organization_id, opportunity_id, sentiment, created_by, created_at
  ) VALUES (
    'activity', 'meeting', 'Contract negotiation with Frites Street',
    'Discussed import logistics and exclusivity terms. Owner has concerns about pricing structure.',
    NOW() - INTERVAL '5 days', 90,
    44, (SELECT id FROM opportunities WHERE name = 'Frites Street - Belgian Cheese Import Deal' LIMIT 1),
    'neutral', v_sales_id, NOW() - INTERVAL '5 days'
  );

  -- Activity 6: Email (6 days ago)
  INSERT INTO activities (
    activity_type, type, subject, description, activity_date, duration_minutes,
    organization_id, opportunity_id, sentiment, created_by, created_at
  ) VALUES (
    'activity', 'email', 'Welcome email to Wicks',
    'Sent welcome package for subscription program. Included delivery schedule and product catalog.',
    NOW() - INTERVAL '6 days', NULL,
    97, (SELECT id FROM opportunities WHERE name = 'Wicks - Monthly Subscription Program' LIMIT 1),
    'positive', v_sales_id, NOW() - INTERVAL '6 days'
  );

  -- Activity 7: Call (today)
  INSERT INTO activities (
    activity_type, type, subject, description, activity_date, duration_minutes,
    organization_id, opportunity_id, sentiment, created_by, created_at
  ) VALUES (
    'activity', 'call', 'Quick check-in with RJC',
    'Brief call to confirm meeting time for next week. Chef is available Tuesday afternoon.',
    NOW() - INTERVAL '2 hours', 10,
    1, (SELECT id FROM opportunities WHERE name = 'RJC - Artisan Cheese Program' LIMIT 1),
    'positive', v_sales_id, NOW() - INTERVAL '2 hours'
  );

  RAISE NOTICE 'E2E test data added successfully!';
  RAISE NOTICE '- Added 6 opportunities in various stages';
  RAISE NOTICE '- Added 7 tasks (2 overdue, 2 due today, 3 this week)';
  RAISE NOTICE '- Added 7 activities (last 6 days + today)';

END $$;

-- ============================================================================
-- RESET SEQUENCES
-- ============================================================================
SELECT setval('opportunities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM opportunities));
SELECT setval('tasks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tasks));
SELECT setval('activities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM activities));

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the data was added correctly:
--
-- SELECT COUNT(*) as opp_count FROM opportunities WHERE account_manager_id = 1;
-- SELECT COUNT(*) as task_count FROM tasks WHERE sales_id = 1 AND completed = false AND due_date <= CURRENT_DATE + INTERVAL '7 days';
-- SELECT COUNT(*) as activity_count FROM activities WHERE created_by = 1 AND created_at >= NOW() - INTERVAL '7 days';
-- SELECT stage, COUNT(*) FROM opportunities WHERE account_manager_id = 1 GROUP BY stage ORDER BY stage;
