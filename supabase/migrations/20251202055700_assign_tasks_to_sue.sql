-- ============================================================================
-- ASSIGN TASKS TO SUE MARTINEZ
-- ============================================================================
-- Sue (ID 8) has 0 tasks - redistribute some and add new ones
-- ============================================================================

DO $$
DECLARE
  sue_id INTEGER;
BEGIN
  -- Get Sue's ID
  SELECT id INTO sue_id FROM sales WHERE email = 'sue@mfbroker.com';
  
  IF sue_id IS NULL THEN
    RAISE NOTICE 'Sue Martinez not found!';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found Sue Martinez with ID %', sue_id;
  
  -- Add new tasks specifically for Sue
  INSERT INTO tasks (title, due_date, completed, priority, contact_id, opportunity_id, sales_id, created_at, updated_at)
  VALUES
    ('Tattooed Chef plant-based demo at Red Robin', (NOW() + INTERVAL '2 days')::date, false, 'high', NULL, NULL, sue_id, NOW(), NOW()),
    ('Send SWAP samples to Brookdale Senior Living', NOW()::date, false, 'medium', NULL, NULL, sue_id, NOW(), NOW()),
    ('Call HCA Healthcare nutrition director', (NOW() - INTERVAL '1 day')::date, false, 'high', NULL, NULL, sue_id, NOW(), NOW()),
    ('Follow up on Litehouse dressings at Ascension', NOW()::date, false, 'medium', NULL, NULL, sue_id, NOW(), NOW()),
    ('Prepare McCrum fry presentation for Levy', (NOW() + INTERVAL '4 days')::date, false, 'medium', NULL, NULL, sue_id, NOW(), NOW()),
    ('Completed plant-based menu training', (NOW() - INTERVAL '3 days')::date, true, 'medium', NULL, NULL, sue_id, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'SUCCESS: Added 6 tasks for Sue Martinez';
END $$;

-- Show updated task counts
DO $$
DECLARE
  team_member RECORD;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'UPDATED TASK DISTRIBUTION';
  RAISE NOTICE '============================================';
  
  FOR team_member IN 
    SELECT 
      COALESCE(s.first_name || ' ' || s.last_name, s.email) as name,
      COUNT(t.id) as task_count
    FROM sales s
    LEFT JOIN tasks t ON t.sales_id = s.id
    GROUP BY s.first_name, s.last_name, s.email
    ORDER BY COUNT(t.id) DESC
  LOOP
    RAISE NOTICE '  %: % tasks', team_member.name, team_member.task_count;
  END LOOP;
  
  RAISE NOTICE '============================================';
END $$;
