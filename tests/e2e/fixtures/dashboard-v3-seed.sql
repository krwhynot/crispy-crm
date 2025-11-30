-- Dashboard V3 E2E Test Data Seed
--
-- This script creates the minimum test data required for Dashboard V3 E2E tests to run.
-- It assumes auth.users already has a test user (created via signup flow or Supabase dashboard).
--
-- Prerequisites:
-- 1. Auth user exists: test@example.com (created via Supabase dashboard)
-- 2. Migration 20251118050755 applied (principal_pipeline_summary view)
--
-- Usage:
-- psql $DATABASE_URL -f tests/e2e/fixtures/dashboard-v3-seed.sql

-- =====================================================
-- 1. Link Sales Record to Auth User
-- =====================================================

DO $$
DECLARE
  v_auth_user_id UUID;
  v_sales_id BIGINT;
BEGIN
  -- Get auth user ID
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'test@example.com';

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user test@example.com not found. Create user first via Supabase dashboard.';
  END IF;

  -- Get or create sales record
  SELECT id INTO v_sales_id
  FROM sales
  WHERE email = 'test@example.com';

  IF v_sales_id IS NULL THEN
    -- Create sales record
    INSERT INTO sales (email, first_name, last_name, role, user_id)
    VALUES ('test@example.com', 'Test', 'User', 'rep', v_auth_user_id)
    RETURNING id INTO v_sales_id;

    RAISE NOTICE 'Created sales record: %', v_sales_id;
  ELSE
    -- Update existing sales record with user_id
    UPDATE sales
    SET user_id = v_auth_user_id
    WHERE id = v_sales_id;

    RAISE NOTICE 'Updated sales record: %', v_sales_id;
  END IF;

  -- Store in temp table for later use
  CREATE TEMP TABLE IF NOT EXISTS test_context (
    auth_user_id UUID,
    sales_id BIGINT
  );

  DELETE FROM test_context;
  INSERT INTO test_context VALUES (v_auth_user_id, v_sales_id);
END $$;

-- =====================================================
-- 2. Create Principal Organization
-- =====================================================

-- Base principal used by legacy tests
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
  'E2E Test Principal Org',
  'principal',
  'high',
  'San Francisco',
  'CA',
  NOW(),
  (SELECT sales_id FROM test_context)
)
ON CONFLICT DO NOTHING;

-- Additional principals to cover all momentum states
INSERT INTO organizations (
  name,
  organization_type,
  priority,
  city,
  state,
  created_at,
  created_by
)
VALUES
  ('E2E Momentum Increasing', 'principal', 'high', 'Oakland', 'CA', NOW(), (SELECT sales_id FROM test_context)),
  ('E2E Momentum Decreasing', 'principal', 'medium', 'Berkeley', 'CA', NOW(), (SELECT sales_id FROM test_context)),
  ('E2E Momentum Steady', 'principal', 'medium', 'San Jose', 'CA', NOW(), (SELECT sales_id FROM test_context)),
  ('E2E Momentum Stale', 'principal', 'low', 'Sacramento', 'CA', NOW(), (SELECT sales_id FROM test_context))
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. Create Customer Organization
-- =====================================================

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
  'E2E Test Customer',
  'customer',
  (SELECT id FROM organizations WHERE name = 'E2E Test Principal Org' AND organization_type = 'principal'),
  'medium',
  'Oakland',
  'CA',
  NOW(),
  (SELECT sales_id FROM test_context)
)
ON CONFLICT DO NOTHING;

-- Customers for each momentum principal
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
VALUES
  (
    'E2E Customer for Increasing',
    'customer',
    (SELECT id FROM organizations WHERE name = 'E2E Momentum Increasing' AND organization_type = 'principal'),
    'medium',
    'Oakland',
    'CA',
    NOW(),
    (SELECT sales_id FROM test_context)
  ),
  (
    'E2E Customer for Decreasing',
    'customer',
    (SELECT id FROM organizations WHERE name = 'E2E Momentum Decreasing' AND organization_type = 'principal'),
    'medium',
    'Berkeley',
    'CA',
    NOW(),
    (SELECT sales_id FROM test_context)
  ),
  (
    'E2E Customer for Steady',
    'customer',
    (SELECT id FROM organizations WHERE name = 'E2E Momentum Steady' AND organization_type = 'principal'),
    'medium',
    'San Jose',
    'CA',
    NOW(),
    (SELECT sales_id FROM test_context)
  ),
  (
    'E2E Customer for Stale',
    'customer',
    (SELECT id FROM organizations WHERE name = 'E2E Momentum Stale' AND organization_type = 'principal'),
    'low',
    'Sacramento',
    'CA',
    NOW(),
    (SELECT sales_id FROM test_context)
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. Create Opportunities (for momentum calculations)
-- =====================================================

-- Active opportunity (this week activity)
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
  'E2E Test Active Deal',
  'discovery',
  'high',
  CURRENT_DATE + INTERVAL '30 days',
  (SELECT id FROM organizations WHERE name = 'E2E Test Principal Org' AND organization_type = 'principal'),
  (SELECT id FROM organizations WHERE name = 'E2E Test Customer'),
  (SELECT sales_id FROM test_context),
  NOW() - INTERVAL '5 days'
)
ON CONFLICT DO NOTHING;

-- Cooling opportunity (last week activity only)
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
  'E2E Test Cooling Deal',
  'proposal',
  'medium',
  CURRENT_DATE + INTERVAL '45 days',
  (SELECT id FROM organizations WHERE name = 'E2E Test Principal Org' AND organization_type = 'principal'),
  (SELECT id FROM organizations WHERE name = 'E2E Test Customer'),
  (SELECT sales_id FROM test_context),
  NOW() - INTERVAL '15 days'
)
ON CONFLICT DO NOTHING;

-- Momentum coverage opportunities (one per principal)
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
VALUES
  -- Increasing: activity this week > last week
  (
    'E2E Momentum Increasing Deal',
    'qualification',
    'high',
    CURRENT_DATE + INTERVAL '60 days',
    (SELECT id FROM organizations WHERE name = 'E2E Momentum Increasing' AND organization_type = 'principal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Increasing'),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '10 days'
  ),
  -- Decreasing: activity last week only
  (
    'E2E Momentum Decreasing Deal',
    'proposal',
    'medium',
    CURRENT_DATE + INTERVAL '45 days',
    (SELECT id FROM organizations WHERE name = 'E2E Momentum Decreasing' AND organization_type = 'principal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Decreasing'),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '20 days'
  ),
  -- Steady: activity both this week and last week
  (
    'E2E Momentum Steady Deal',
    'discovery',
    'medium',
    CURRENT_DATE + INTERVAL '35 days',
    (SELECT id FROM organizations WHERE name = 'E2E Momentum Steady' AND organization_type = 'principal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Steady'),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '12 days'
  ),
  -- Stale: no activity in last 14 days
  (
    'E2E Momentum Stale Deal',
    'qualification',
    'low',
    CURRENT_DATE + INTERVAL '90 days',
    (SELECT id FROM organizations WHERE name = 'E2E Momentum Stale' AND organization_type = 'principal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Stale'),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '40 days'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. Create Activities (for momentum indicators)
-- =====================================================

-- This week activities (increasing momentum)
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
  -- Day 2 ago - Active deal
  (
    'interaction',
    'call',
    'Discovery call',
    'Discussed requirements and timeline',
    NOW() - INTERVAL '2 days',
    'Connected',
    45,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Active Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Test Customer'),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '2 days'
  ),
  -- Yesterday - Active deal
  (
    'interaction',
    'email',
    'Follow-up email',
    'Sent proposal documents',
    NOW() - INTERVAL '1 day',
    'Completed',
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Active Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Test Customer'),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '1 day'
  ),
  -- Today - Active deal
  (
    'interaction',
    'meeting',
    'Demo meeting scheduled',
    'Scheduled product demo for next week',
    NOW(),
    'Completed',
    30,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Active Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Test Customer'),
    (SELECT sales_id FROM test_context),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Last week activities (for comparison)
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
  -- 10 days ago - Cooling deal
  (
    'interaction',
    'call',
    'Initial outreach',
    'Left voicemail',
    NOW() - INTERVAL '10 days',
    'Left Voicemail',
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Cooling Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Test Customer'),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '10 days'
  ),
  -- 8 days ago - Cooling deal
  (
    'interaction',
    'email',
    'Introduction email',
    'Sent company overview',
    NOW() - INTERVAL '8 days',
    'Completed',
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Cooling Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Test Customer'),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '8 days'
  )
ON CONFLICT DO NOTHING;

-- Momentum coverage activities per principal
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
  -- Increasing: two activities this week, none last week
  (
    'interaction',
    'call',
    'Check-in call (inc)',
    'Followed up with buyer',
    CURRENT_DATE - INTERVAL '2 days',
    'Connected',
    15,
    (SELECT id FROM opportunities WHERE name = 'E2E Momentum Increasing Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Increasing'),
    (SELECT sales_id FROM test_context),
    CURRENT_DATE - INTERVAL '2 days'
  ),
  (
    'interaction',
    'email',
    'Send pricing (inc)',
    'Shared updated pricing sheet',
    CURRENT_DATE - INTERVAL '1 day',
    'Completed',
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Momentum Increasing Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Increasing'),
    (SELECT sales_id FROM test_context),
    CURRENT_DATE - INTERVAL '1 day'
  ),
  -- Decreasing: two activities last week only
  (
    'interaction',
    'call',
    'Initial outreach (dec)',
    'Introduced offering',
    CURRENT_DATE - INTERVAL '10 days',
    'Connected',
    20,
    (SELECT id FROM opportunities WHERE name = 'E2E Momentum Decreasing Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Decreasing'),
    (SELECT sales_id FROM test_context),
    CURRENT_DATE - INTERVAL '10 days'
  ),
  (
    'interaction',
    'email',
    'Follow-up (dec)',
    'Sent follow-up email',
    CURRENT_DATE - INTERVAL '9 days',
    'Completed',
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Momentum Decreasing Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Decreasing'),
    (SELECT sales_id FROM test_context),
    CURRENT_DATE - INTERVAL '9 days'
  ),
  -- Steady: one this week, one last week
  (
    'interaction',
    'call',
    'Touch base (steady)',
    'Checked status',
    CURRENT_DATE - INTERVAL '2 days',
    'Connected',
    10,
    (SELECT id FROM opportunities WHERE name = 'E2E Momentum Steady Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Steady'),
    (SELECT sales_id FROM test_context),
    CURRENT_DATE - INTERVAL '2 days'
  ),
  (
    'interaction',
    'email',
    'Recap (steady)',
    'Sent recap from last call',
    CURRENT_DATE - INTERVAL '10 days',
    'Completed',
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Momentum Steady Deal'),
    (SELECT id FROM organizations WHERE name = 'E2E Customer for Steady'),
    (SELECT sales_id FROM test_context),
    CURRENT_DATE - INTERVAL '10 days'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. Create Tasks (time-bucketed)
-- =====================================================

INSERT INTO tasks (
  title,
  description,
  type,
  priority,
  due_date,
  reminder_date,
  completed,
  contact_id,
  opportunity_id,
  sales_id,
  created_by,
  created_at
)
VALUES
  -- OVERDUE tasks
  (
    'E2E Test: Call back prospect',
    'Follow up on last week''s voicemail',
    'call',
    'high',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE - INTERVAL '3 days',
    FALSE,
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Cooling Deal'),
    (SELECT sales_id FROM test_context),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '5 days'
  ),
  (
    'E2E Test: Send proposal revision',
    'Client requested changes to pricing',
    'email',
    'critical',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '2 days',
    FALSE,
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Active Deal'),
    (SELECT sales_id FROM test_context),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '3 days'
  ),

  -- TODAY tasks
  (
    'E2E Test: Prepare demo materials',
    'Gather slides and product samples for next week',
    'meeting',
    'high',
    CURRENT_DATE,
    CURRENT_DATE,
    FALSE,
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Active Deal'),
    (SELECT sales_id FROM test_context),
    (SELECT sales_id FROM test_context),
    NOW() - INTERVAL '1 day'
  ),
  (
    'E2E Test: Review contract terms',
    'Legal review before sending to client',
    'follow_up',
    'medium',
    CURRENT_DATE,
    NULL,
    FALSE,
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Active Deal'),
    (SELECT sales_id FROM test_context),
    (SELECT sales_id FROM test_context),
    NOW()
  ),

  -- TOMORROW tasks
  (
    'E2E Test: Schedule follow-up call',
    'Book time with decision maker',
    'call',
    'medium',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '1 day',
    FALSE,
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Active Deal'),
    (SELECT sales_id FROM test_context),
    (SELECT sales_id FROM test_context),
    NOW()
  ),

  -- UPCOMING tasks (later this week)
  (
    'E2E Test: Send thank you note',
    'Follow up after demo',
    'email',
    'low',
    CURRENT_DATE + INTERVAL '3 days',
    NULL,
    FALSE,
    NULL,
    (SELECT id FROM opportunities WHERE name = 'E2E Test Active Deal'),
    (SELECT sales_id FROM test_context),
    (SELECT sales_id FROM test_context),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. Verify Data Created
-- =====================================================

DO $$
DECLARE
  v_org_count INT;
  v_opp_count INT;
  v_task_count INT;
  v_activity_count INT;
  v_sales_id BIGINT;
BEGIN
  SELECT sales_id INTO v_sales_id FROM test_context;

  -- Count created records
  SELECT COUNT(*) INTO v_org_count
  FROM organizations
  WHERE name LIKE 'E2E Test%';

  SELECT COUNT(*) INTO v_opp_count
  FROM opportunities
  WHERE name LIKE 'E2E Test%';

  SELECT COUNT(*) INTO v_task_count
  FROM tasks
  WHERE title LIKE 'E2E Test:%'
    AND sales_id = v_sales_id;

  SELECT COUNT(*) INTO v_activity_count
  FROM activities
  WHERE subject LIKE '%E2E%'
    AND created_by = v_sales_id;

  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'E2E Test Data Seed Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sales ID: %', v_sales_id;
  RAISE NOTICE 'Organizations: %', v_org_count;
  RAISE NOTICE 'Opportunities: %', v_opp_count;
  RAISE NOTICE 'Tasks: %', v_task_count;
  RAISE NOTICE 'Activities: %', v_activity_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Verify principal_pipeline_summary view
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'principal_pipeline_summary'
  ) THEN
    RAISE NOTICE '✓ View principal_pipeline_summary exists';
  ELSE
    RAISE WARNING '✗ View principal_pipeline_summary MISSING - run migration 20251118050755';
  END IF;

  -- Verify momentum data
  RAISE NOTICE '';
  RAISE NOTICE 'Pipeline Summary:';

  FOR v_record IN
    SELECT
      principal_name,
      total_pipeline,
      active_this_week,
      active_last_week,
      momentum
    FROM principal_pipeline_summary
    WHERE principal_name LIKE 'E2E Test%'
  LOOP
    RAISE NOTICE '  % - Pipeline: %, This Week: %, Last Week: %, Momentum: %',
      v_record.principal_name,
      v_record.total_pipeline,
      v_record.active_this_week,
      v_record.active_last_week,
      v_record.momentum;
  END LOOP;

  RAISE NOTICE '';
END $$;

-- Cleanup temp table
DROP TABLE IF EXISTS test_context;
