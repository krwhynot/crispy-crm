-- ============================================================================
-- ADD SALES TEAM MEMBER AND DISTRIBUTED TASKS
-- ============================================================================
-- Purpose: Add missing sales team member and tasks assigned to different reps
--
-- Sales Team:
--   1. Admin User (admin@test.com) - System admin
--   2. Brent Gustafson (brent@mfbroker.com) - Owner/Admin
--   3. Michelle Gustafson (michelle@mfbroker.com) - Manager
--   4. Gary Thompson (gary@mfbroker.com) - Sales Rep
--   5. Dale Anderson (dale@mfbroker.com) - Sales Rep
--   6. Sue Martinez (sue@mfbroker.com) - Sales Rep [ADDING]
-- ============================================================================

-- ============================================================================
-- ADD MISSING SALES TEAM MEMBER: Sue Martinez
-- ============================================================================
DO $$
DECLARE
  sue_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM sales WHERE email = 'sue@mfbroker.com') INTO sue_exists;

  IF NOT sue_exists THEN
    INSERT INTO "public"."sales" (user_id, first_name, last_name, email, phone, is_admin, avatar_url, created_at, updated_at)
    VALUES (
      'f0000000-0000-0000-0000-000000000001',
      'Sue',
      'Martinez',
      'sue@mfbroker.com',
      '555-000-0006',
      false,
      NULL,
      NOW(),
      NOW()
    );
    RAISE NOTICE 'SUCCESS: Added Sue Martinez to sales team';
  ELSE
    RAISE NOTICE 'Sue Martinez already exists, skipping';
  END IF;
END $$;

-- ============================================================================
-- ADD TASKS DISTRIBUTED ACROSS TEAM MEMBERS
-- ============================================================================
-- Task schema:
--   title, due_date, completed, priority (low/medium/high/critical)
--   type (Call/Email/Meeting/Follow-up/Proposal/Discovery/Administrative/None)
--   contact_id, opportunity_id, sales_id
-- ============================================================================
DO $$
DECLARE
  brent_id INTEGER;
  michelle_id INTEGER;
  gary_id INTEGER;
  dale_id INTEGER;
  sue_id INTEGER;
BEGIN
  -- Get sales IDs by email (more reliable than hardcoded IDs)
  SELECT id INTO brent_id FROM sales WHERE email = 'brent@mfbroker.com';
  SELECT id INTO michelle_id FROM sales WHERE email = 'michelle@mfbroker.com';
  SELECT id INTO gary_id FROM sales WHERE email = 'gary@mfbroker.com';
  SELECT id INTO dale_id FROM sales WHERE email = 'dale@mfbroker.com';
  SELECT id INTO sue_id FROM sales WHERE email = 'sue@mfbroker.com';

  -- Verify we have team members
  IF brent_id IS NULL OR michelle_id IS NULL THEN
    RAISE NOTICE 'WARNING: Missing core team members, cannot insert distributed tasks';
    RETURN;
  END IF;

  -- Insert tasks distributed across team
  INSERT INTO "public"."tasks" (title, due_date, completed, priority, type, contact_id, opportunity_id, sales_id, created_at, updated_at)
  VALUES
    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    -- BRENT GUSTAFSON - Owner tasks (strategic/high-level)
    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    ('Review Q1 pipeline forecast with team', NOW()::date, false, 'high', 'Meeting', NULL, NULL, brent_id, NOW(), NOW()),
    ('Finalize Sysco master distribution agreement', (NOW() + INTERVAL '2 days')::date, false, 'critical', 'Proposal', NULL, NULL, brent_id, NOW(), NOW()),
    ('Call McCrum CEO about exclusive territory', (NOW() + INTERVAL '1 day')::date, false, 'high', 'Call', 1, 1, brent_id, NOW(), NOW()),
    ('Prepare board presentation on market expansion', (NOW() + INTERVAL '5 days')::date, false, 'medium', 'Administrative', NULL, NULL, brent_id, NOW(), NOW()),

    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    -- MICHELLE GUSTAFSON - Manager tasks (team coordination/key accounts)
    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    ('Weekly team pipeline review meeting', NOW()::date, false, 'high', 'Meeting', NULL, NULL, michelle_id, NOW(), NOW()),
    ('Coach Gary on Marriott presentation', (NOW() + INTERVAL '1 day')::date, false, 'medium', 'Meeting', NULL, NULL, michelle_id, NOW(), NOW()),
    ('Review Dale''s US Foods proposal draft', NOW()::date, false, 'medium', 'Proposal', NULL, NULL, michelle_id, NOW(), NOW()),
    ('Quarterly performance reviews prep', (NOW() + INTERVAL '7 days')::date, false, 'low', 'Administrative', NULL, NULL, michelle_id, NOW(), NOW()),
    ('Follow up with Hilton corporate buyer', (NOW() - INTERVAL '1 day')::date, false, 'high', 'Follow-up', NULL, NULL, michelle_id, NOW(), NOW()),

    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    -- GARY THOMPSON - Sales Rep tasks (customer-facing)
    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    ('Marriott culinary demo preparation', NOW()::date, false, 'high', 'Discovery', NULL, NULL, gary_id, NOW(), NOW()),
    ('Send Lakeview Farms samples to Panera', (NOW() + INTERVAL '1 day')::date, false, 'medium', 'Administrative', NULL, NULL, gary_id, NOW(), NOW()),
    ('Call Chipotle purchasing manager', (NOW() - INTERVAL '2 days')::date, false, 'high', 'Call', NULL, NULL, gary_id, NOW(), NOW()),
    ('Email Frico pricing update to GFS', NOW()::date, false, 'medium', 'Email', NULL, NULL, gary_id, NOW(), NOW()),
    ('Site visit at Shake Shack test kitchen', (NOW() + INTERVAL '3 days')::date, false, 'medium', 'Meeting', NULL, NULL, gary_id, NOW(), NOW()),

    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    -- DALE ANDERSON - Sales Rep tasks (customer-facing)
    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    ('US Foods category review presentation', (NOW() + INTERVAL '1 day')::date, false, 'high', 'Proposal', NULL, NULL, dale_id, NOW(), NOW()),
    ('Follow up on Rapid Rasoi samples to Aramark', NOW()::date, false, 'medium', 'Follow-up', NULL, NULL, dale_id, NOW(), NOW()),
    ('Call Sodexo about plant-based menu options', (NOW() - INTERVAL '1 day')::date, false, 'high', 'Call', NULL, NULL, dale_id, NOW(), NOW()),
    ('Prepare Anchor butter demo for Hyatt', (NOW() + INTERVAL '2 days')::date, false, 'medium', 'Discovery', NULL, NULL, dale_id, NOW(), NOW()),
    ('Email Custom Culinary base samples request', NOW()::date, false, 'low', 'Email', NULL, NULL, dale_id, NOW(), NOW()),

    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    -- SUE MARTINEZ - Sales Rep tasks (customer-facing)
    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    ('Tattooed Chef plant-based demo at Red Robin', (NOW() + INTERVAL '2 days')::date, false, 'high', 'Meeting', NULL, NULL, sue_id, NOW(), NOW()),
    ('Send SWAP samples to Brookdale Senior Living', NOW()::date, false, 'medium', 'Administrative', NULL, NULL, sue_id, NOW(), NOW()),
    ('Call HCA Healthcare nutrition director', (NOW() - INTERVAL '1 day')::date, false, 'high', 'Call', NULL, NULL, sue_id, NOW(), NOW()),
    ('Follow up on Litehouse dressings at Ascension', NOW()::date, false, 'medium', 'Follow-up', NULL, NULL, sue_id, NOW(), NOW()),
    ('Prepare McCrum fry presentation for Levy', (NOW() + INTERVAL '4 days')::date, false, 'medium', 'Discovery', NULL, NULL, sue_id, NOW(), NOW()),

    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    -- COMPLETED TASKS (distributed across team for history)
    -- PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    ('Sent Sysco Q4 rebate calculation', (NOW() - INTERVAL '3 days')::date, true, 'high', 'Email', NULL, NULL, brent_id, NOW(), NOW()),
    ('Completed McCrum facility tour', (NOW() - INTERVAL '5 days')::date, true, 'medium', 'Meeting', 1, 1, michelle_id, NOW(), NOW()),
    ('Delivered Frico samples to Capital Grille', (NOW() - INTERVAL '4 days')::date, true, 'medium', 'Administrative', NULL, NULL, gary_id, NOW(), NOW()),
    ('US Foods contract signed', (NOW() - INTERVAL '7 days')::date, true, 'critical', 'Proposal', NULL, NULL, dale_id, NOW(), NOW()),
    ('Tattooed Chef demo at Sunrise Senior', (NOW() - INTERVAL '6 days')::date, true, 'medium', 'Meeting', NULL, NULL, sue_id, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'SUCCESS: Inserted team-distributed tasks';
  RAISE NOTICE 'Tasks assigned to: Brent, Michelle, Gary, Dale, Sue';
END $$;

-- ============================================================================
-- Verification Summary
-- ============================================================================
DO $$
DECLARE
  sales_count INTEGER;
  task_count INTEGER;
  tasks_by_rep RECORD;
BEGIN
  SELECT COUNT(*) INTO sales_count FROM sales;
  SELECT COUNT(*) INTO task_count FROM tasks;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEAM TASKS SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Sales Team Members: %', sales_count;
  RAISE NOTICE 'Total Tasks: %', task_count;
  RAISE NOTICE '--------------------------------------------';

  -- Show tasks per team member
  FOR tasks_by_rep IN
    SELECT s.first_name, s.last_name, COUNT(t.id) as task_count
    FROM sales s
    LEFT JOIN tasks t ON t.sales_id = s.id
    GROUP BY s.id, s.first_name, s.last_name
    ORDER BY s.first_name
  LOOP
    RAISE NOTICE '  % %: % tasks', tasks_by_rep.first_name, tasks_by_rep.last_name, tasks_by_rep.task_count;
  END LOOP;

  RAISE NOTICE '============================================';
END $$;
