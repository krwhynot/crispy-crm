-- ============================================================================
-- ADD SAMPLE ACTIVITIES FOR CLOUD DEMO
-- ============================================================================
-- The cloud DB has different sales IDs than local seed data
-- Cloud sales IDs: 1, 2, 4, 5, 6, 8 (no ID 3 or 7!)
-- This creates activities with proper created_by values
-- Activities require either contact_id OR organization_id (check_has_contact_or_org)
-- ============================================================================

-- First, soft-delete any existing activities that might have invalid references
-- Using UPDATE with deleted_at per PROVIDER_RULES.md §5 (Soft Deletes Only)
UPDATE activities SET deleted_at = NOW() WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM sales) AND deleted_at IS NULL;

-- Get actual sales IDs and some org IDs dynamically
DO $$
DECLARE
  kyle_id INTEGER;
  gary_id INTEGER;
  sue_id INTEGER;
  admin_id INTEGER;
  test_id INTEGER;
  org1_id INTEGER;
  org2_id INTEGER;
  org3_id INTEGER;
  org4_id INTEGER;
  org5_id INTEGER;
BEGIN
  SELECT id INTO kyle_id FROM sales WHERE email = 'kjramsy@gmail.com';
  SELECT id INTO gary_id FROM sales WHERE email = 'gramsy@masterfoodbrokers.com';
  SELECT id INTO sue_id FROM sales WHERE email = 'sue@mfbroker.com';
  SELECT id INTO admin_id FROM sales WHERE email = 'admin@test.com';
  SELECT id INTO test_id FROM sales WHERE email = 'test@gmail.com';

  -- Get some organization IDs for activities (activities require contact_id OR organization_id)
  SELECT id INTO org1_id FROM organizations ORDER BY id LIMIT 1;
  SELECT id INTO org2_id FROM organizations ORDER BY id OFFSET 1 LIMIT 1;
  SELECT id INTO org3_id FROM organizations ORDER BY id OFFSET 2 LIMIT 1;
  SELECT id INTO org4_id FROM organizations ORDER BY id OFFSET 3 LIMIT 1;
  SELECT id INTO org5_id FROM organizations ORDER BY id OFFSET 4 LIMIT 1;

  RAISE NOTICE 'Sales IDs - Kyle: %, Gary: %, Sue: %, Admin: %, Test: %',
    kyle_id, gary_id, sue_id, admin_id, test_id;
  RAISE NOTICE 'Org IDs - %,  %, %, %, %', org1_id, org2_id, org3_id, org4_id, org5_id;

  -- Insert sample activities if we have valid sales users and orgs
  -- Using 'engagement' type (not 'interaction') because we don't have opportunity_id
  -- 'interaction' requires opportunity_id per check_interaction_has_opportunity constraint
  IF kyle_id IS NOT NULL AND org1_id IS NOT NULL THEN
    INSERT INTO activities (activity_type, type, subject, description, activity_date, organization_id, created_by, created_at, updated_at)
    VALUES
      ('engagement', 'call', 'Discovery call with Sysco buyer', 'Discussed Q1 volume projections and new product introductions', NOW() - INTERVAL '1 day', org1_id, kyle_id, NOW(), NOW()),
      ('engagement', 'email', 'Sent McCrum pricing update', 'Updated pricing sheet for new fry line products', NOW() - INTERVAL '2 days', COALESCE(org2_id, org1_id), kyle_id, NOW(), NOW()),
      ('engagement', 'meeting', 'Quarterly review with US Foods', 'Reviewed partnership performance and expansion opportunities', NOW() - INTERVAL '3 days', COALESCE(org3_id, org1_id), kyle_id, NOW(), NOW()),
      ('engagement', 'demo', 'Tattooed Chef demo at Marriott', 'Plant-based product showcase for culinary team', NOW() - INTERVAL '5 days', COALESCE(org4_id, org1_id), kyle_id, NOW(), NOW()),
      ('engagement', 'site_visit', 'Kitchen tour at Hilton corporate', 'Assessed central kitchen for product fit', NOW() - INTERVAL '7 days', COALESCE(org5_id, org1_id), kyle_id, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  IF gary_id IS NOT NULL AND org1_id IS NOT NULL THEN
    INSERT INTO activities (activity_type, type, subject, description, activity_date, organization_id, created_by, created_at, updated_at)
    VALUES
      ('engagement', 'call', 'Follow-up with GFS category manager', 'Discussed plant-based category growth', NOW() - INTERVAL '1 day', COALESCE(org2_id, org1_id), gary_id, NOW(), NOW()),
      ('engagement', 'proposal', 'Submitted Frico cheese proposal', 'Annual contract renewal with volume discount', NOW() - INTERVAL '2 days', COALESCE(org3_id, org1_id), gary_id, NOW(), NOW()),
      ('engagement', 'email', 'Sent Rapid Rasoi samples confirmation', 'Confirmed sample shipment to Aramark test kitchen', NOW() - INTERVAL '4 days', COALESCE(org4_id, org1_id), gary_id, NOW(), NOW()),
      ('engagement', 'check_in', 'Monthly account review with Sodexo', 'Regular touchpoint with key account', NOW() - INTERVAL '6 days', COALESCE(org5_id, org1_id), gary_id, NOW(), NOW()),
      ('engagement', 'trade_show', 'Met prospects at NRA Show', 'Collected 15 new leads at booth', NOW() - INTERVAL '10 days', org1_id, gary_id, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  IF sue_id IS NOT NULL AND org1_id IS NOT NULL THEN
    INSERT INTO activities (activity_type, type, subject, description, activity_date, organization_id, created_by, created_at, updated_at)
    VALUES
      ('engagement', 'call', 'Introduction call with HCA Healthcare', 'Discussed plant-based options for healthcare menus', NOW(), COALESCE(org3_id, org1_id), sue_id, NOW(), NOW()),
      ('engagement', 'meeting', 'Sample presentation at Red Robin', 'Tattooed Chef plant-based burger demo', NOW() - INTERVAL '1 day', COALESCE(org4_id, org1_id), sue_id, NOW(), NOW()),
      ('engagement', 'follow_up', 'Checked on Litehouse decision', 'Following up on dressing trial at Ascension', NOW() - INTERVAL '2 days', COALESCE(org5_id, org1_id), sue_id, NOW(), NOW()),
      ('engagement', 'email', 'Sent SWAP product catalog', 'Provided full catalog to Brookdale nutrition director', NOW() - INTERVAL '3 days', org1_id, sue_id, NOW(), NOW()),
      ('engagement', 'note', 'Competitor intel from Levy', 'Current supplier having supply chain issues', NOW() - INTERVAL '4 days', COALESCE(org2_id, org1_id), sue_id, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  IF admin_id IS NOT NULL AND org1_id IS NOT NULL THEN
    INSERT INTO activities (activity_type, type, subject, description, activity_date, organization_id, created_by, created_at, updated_at)
    VALUES
      ('engagement', 'call', 'Strategic planning call', 'Q2 territory planning and goal setting', NOW() - INTERVAL '2 days', org1_id, admin_id, NOW(), NOW()),
      ('engagement', 'meeting', 'Team pipeline review', 'Weekly pipeline review with sales team', NOW() - INTERVAL '5 days', COALESCE(org2_id, org1_id), admin_id, NOW(), NOW()),
      ('engagement', 'contract_review', 'Sysco master agreement review', 'Reviewed terms with legal team', NOW() - INTERVAL '8 days', COALESCE(org3_id, org1_id), admin_id, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'SUCCESS: Added sample activities for demo';
END $$;

-- Verification
DO $$
DECLARE
  activity_record RECORD;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RECENT ACTIVITIES (with sales user names)';
  RAISE NOTICE '============================================';

  FOR activity_record IN
    SELECT
      a.subject,
      a.type,
      COALESCE(s.first_name || ' ' || s.last_name, s.email, 'Unknown') as created_by_name
    FROM activities a
    LEFT JOIN sales s ON a.created_by = s.id
    WHERE a.deleted_at IS NULL
    ORDER BY a.activity_date DESC
    LIMIT 15
  LOOP
    RAISE NOTICE '  [%] % - %',
      activity_record.type,
      activity_record.subject,
      activity_record.created_by_name;
  END LOOP;

  RAISE NOTICE '============================================';
END $$;
