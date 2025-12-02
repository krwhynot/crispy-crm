-- ============================================================================
-- ADD TASKS DISTRIBUTED ACROSS SALES TEAM
-- ============================================================================
-- Purpose: Add tasks assigned to different team members for demo
-- Uses dynamic ID lookup to work with whatever sales users exist
-- Note: Omitting 'type' column - let it use database default
-- ============================================================================

DO $$
DECLARE
  sales_ids INTEGER[];
  sales_count INTEGER;
BEGIN
  -- Get all sales user IDs into an array
  SELECT array_agg(id ORDER BY id) INTO sales_ids FROM sales;
  sales_count := array_length(sales_ids, 1);

  IF sales_count IS NULL OR sales_count = 0 THEN
    RAISE NOTICE 'WARNING: No sales users found, cannot insert tasks';
    RETURN;
  END IF;

  RAISE NOTICE 'Found % sales team members', sales_count;

  -- Insert tasks distributed across all available team members
  -- Omitting 'type' column to use default value
  INSERT INTO "public"."tasks" (title, due_date, completed, priority, contact_id, opportunity_id, sales_id, created_at, updated_at)
  VALUES
    -- Strategic/Leadership tasks (assign to first user)
    ('Review Q1 pipeline forecast with team', NOW()::date, false, 'high', NULL, NULL, sales_ids[1], NOW(), NOW()),
    ('Finalize Sysco master distribution agreement', (NOW() + INTERVAL '2 days')::date, false, 'critical', NULL, NULL, sales_ids[1], NOW(), NOW()),
    ('Prepare board presentation on market expansion', (NOW() + INTERVAL '5 days')::date, false, 'medium', NULL, NULL, sales_ids[1], NOW(), NOW()),
    ('Quarterly performance reviews prep', (NOW() + INTERVAL '7 days')::date, false, 'low', NULL, NULL, sales_ids[1], NOW(), NOW()),

    -- Manager/Coordination tasks (assign to second user if available)
    ('Weekly team pipeline review meeting', NOW()::date, false, 'high', NULL, NULL, sales_ids[LEAST(2, sales_count)], NOW(), NOW()),
    ('Coach team on Marriott presentation', (NOW() + INTERVAL '1 day')::date, false, 'medium', NULL, NULL, sales_ids[LEAST(2, sales_count)], NOW(), NOW()),
    ('Review US Foods proposal draft', NOW()::date, false, 'medium', NULL, NULL, sales_ids[LEAST(2, sales_count)], NOW(), NOW()),
    ('Follow up with Hilton corporate buyer', (NOW() - INTERVAL '1 day')::date, false, 'high', NULL, NULL, sales_ids[LEAST(2, sales_count)], NOW(), NOW()),

    -- Sales Rep 1 tasks (third user if available)
    ('Marriott culinary demo preparation', NOW()::date, false, 'high', NULL, NULL, sales_ids[LEAST(3, sales_count)], NOW(), NOW()),
    ('Send Lakeview Farms samples to Panera', (NOW() + INTERVAL '1 day')::date, false, 'medium', NULL, NULL, sales_ids[LEAST(3, sales_count)], NOW(), NOW()),
    ('Call Chipotle purchasing manager', (NOW() - INTERVAL '2 days')::date, false, 'high', NULL, NULL, sales_ids[LEAST(3, sales_count)], NOW(), NOW()),
    ('Email Frico pricing update to GFS', NOW()::date, false, 'medium', NULL, NULL, sales_ids[LEAST(3, sales_count)], NOW(), NOW()),
    ('Site visit at Shake Shack test kitchen', (NOW() + INTERVAL '3 days')::date, false, 'medium', NULL, NULL, sales_ids[LEAST(3, sales_count)], NOW(), NOW()),

    -- Sales Rep 2 tasks (fourth user if available)
    ('US Foods category review presentation', (NOW() + INTERVAL '1 day')::date, false, 'high', NULL, NULL, sales_ids[LEAST(4, sales_count)], NOW(), NOW()),
    ('Follow up on Rapid Rasoi samples to Aramark', NOW()::date, false, 'medium', NULL, NULL, sales_ids[LEAST(4, sales_count)], NOW(), NOW()),
    ('Call Sodexo about plant-based menu options', (NOW() - INTERVAL '1 day')::date, false, 'high', NULL, NULL, sales_ids[LEAST(4, sales_count)], NOW(), NOW()),
    ('Prepare Anchor butter demo for Hyatt', (NOW() + INTERVAL '2 days')::date, false, 'medium', NULL, NULL, sales_ids[LEAST(4, sales_count)], NOW(), NOW()),
    ('Email Custom Culinary base samples request', NOW()::date, false, 'low', NULL, NULL, sales_ids[LEAST(4, sales_count)], NOW(), NOW()),

    -- Sales Rep 3 tasks (fifth user if available)
    ('Tattooed Chef plant-based demo at Red Robin', (NOW() + INTERVAL '2 days')::date, false, 'high', NULL, NULL, sales_ids[LEAST(5, sales_count)], NOW(), NOW()),
    ('Send SWAP samples to Brookdale Senior Living', NOW()::date, false, 'medium', NULL, NULL, sales_ids[LEAST(5, sales_count)], NOW(), NOW()),
    ('Call HCA Healthcare nutrition director', (NOW() - INTERVAL '1 day')::date, false, 'high', NULL, NULL, sales_ids[LEAST(5, sales_count)], NOW(), NOW()),
    ('Follow up on Litehouse dressings at Ascension', NOW()::date, false, 'medium', NULL, NULL, sales_ids[LEAST(5, sales_count)], NOW(), NOW()),
    ('Prepare McCrum fry presentation for Levy', (NOW() + INTERVAL '4 days')::date, false, 'medium', NULL, NULL, sales_ids[LEAST(5, sales_count)], NOW(), NOW()),

    -- Completed tasks distributed across team
    ('Sent Sysco Q4 rebate calculation', (NOW() - INTERVAL '3 days')::date, true, 'high', NULL, NULL, sales_ids[1], NOW(), NOW()),
    ('Completed McCrum facility tour', (NOW() - INTERVAL '5 days')::date, true, 'medium', NULL, NULL, sales_ids[LEAST(2, sales_count)], NOW(), NOW()),
    ('Delivered Frico samples to Capital Grille', (NOW() - INTERVAL '4 days')::date, true, 'medium', NULL, NULL, sales_ids[LEAST(3, sales_count)], NOW(), NOW()),
    ('US Foods contract signed', (NOW() - INTERVAL '7 days')::date, true, 'critical', NULL, NULL, sales_ids[LEAST(4, sales_count)], NOW(), NOW()),
    ('Tattooed Chef demo at Sunrise Senior', (NOW() - INTERVAL '6 days')::date, true, 'medium', NULL, NULL, sales_ids[LEAST(5, sales_count)], NOW(), NOW())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'SUCCESS: Inserted 28 team-distributed tasks across % team members', sales_count;
END $$;

-- ============================================================================
-- Verification Summary
-- ============================================================================
DO $$
DECLARE
  task_count INTEGER;
  tasks_by_rep RECORD;
BEGIN
  SELECT COUNT(*) INTO task_count FROM tasks;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEAM TASKS SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Tasks: %', task_count;
  RAISE NOTICE '--------------------------------------------';

  -- Show tasks per team member
  FOR tasks_by_rep IN
    SELECT
      COALESCE(s.first_name || ' ' || s.last_name, 'Unknown') as name,
      COUNT(t.id) as task_count
    FROM sales s
    LEFT JOIN tasks t ON t.sales_id = s.id
    GROUP BY s.id, s.first_name, s.last_name
    ORDER BY COUNT(t.id) DESC
  LOOP
    RAISE NOTICE '  %: % tasks', tasks_by_rep.name, tasks_by_rep.task_count;
  END LOOP;

  RAISE NOTICE '============================================';
END $$;
