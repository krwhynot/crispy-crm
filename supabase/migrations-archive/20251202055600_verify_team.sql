-- ============================================================================
-- VERIFY SALES TEAM (read-only)
-- ============================================================================

DO $$
DECLARE
  team_member RECORD;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM sales;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SALES TEAM ROSTER (%s members)', total_count;
  RAISE NOTICE '============================================';
  
  FOR team_member IN 
    SELECT s.id, s.first_name, s.last_name, s.email, s.role,
           COUNT(t.id) as task_count
    FROM sales s
    LEFT JOIN tasks t ON t.sales_id = s.id
    GROUP BY s.id, s.first_name, s.last_name, s.email, s.role
    ORDER BY s.id
  LOOP
    RAISE NOTICE '  [%] % % (%) - % - % tasks', 
      team_member.id,
      COALESCE(team_member.first_name, ''),
      COALESCE(team_member.last_name, ''),
      team_member.role,
      team_member.email,
      team_member.task_count;
  END LOOP;
  
  RAISE NOTICE '============================================';
END $$;
