-- ============================================================================
-- DEMO DATA: Additional Contacts
-- ============================================================================
-- Purpose: Add sample contact data for production demo
--
-- Contents:
--   - ~22 Additional Contacts (using dynamic sales_id lookup)
--
-- Note: Uses MIN(id) from sales table to ensure valid FK references
-- Note: Products section removed - clean slate for production
-- ============================================================================

-- ============================================================================
-- ADDITIONAL CONTACTS (40-80)
-- Uses first valid sales_id from database (safe for any environment)
-- ============================================================================
DO $$
DECLARE
  v_sales_id INTEGER;
  existing_max_id INTEGER;
BEGIN
  -- Get first available sales_id dynamically
  SELECT MIN(id) INTO v_sales_id FROM sales;

  IF v_sales_id IS NULL THEN
    RAISE NOTICE 'WARNING: No sales users found, cannot insert contacts';
    RETURN;
  END IF;

  SELECT COALESCE(MAX(id), 0) INTO existing_max_id FROM contacts;

  IF existing_max_id < 40 THEN
    RAISE NOTICE 'Using sales_id = % for new contacts', v_sales_id;

    INSERT INTO "public"."contacts" (
      id, name, first_name, last_name, email, phone, title, department, organization_id, sales_id,
      address, city, state, postal_code, country, linkedin_url, notes, tags,
      first_seen, last_seen, created_at, updated_at
    )
    VALUES
      -- Victoria Hayes at Capital Grille (Org 20)
      (40, 'Victoria Hayes', 'Victoria', 'Hayes', '[{"email": "vhayes@darden.com", "type": "Work"}]', '[{"phone": "312-555-3002", "type": "Work"}]',
       'Purchasing Director', 'Operations', 20, v_sales_id,
       '633 N Saint Clair Street', 'Chicago', 'IL', '60611', 'USA',
       'https://linkedin.com/in/victoriahayes-darden', 'Champion + Decision Maker. Very data-driven.',
       ARRAY[1, 2]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

      -- Ruth''s Chris (Org 21)
      (41, 'Chef Anthony Romano', 'Anthony', 'Romano', '[{"email": "aromano@ruthschris.com", "type": "Work"}]', '[{"phone": "504-555-3101", "type": "Work"}]',
       'Corporate Executive Chef', 'Culinary', 21, v_sales_id,
       '500 Tchoupitoulas Street', 'New Orleans', 'LA', '70130', 'USA',
       'https://linkedin.com/in/chefanthonyromano', 'Italian heritage, classically trained.',
       ARRAY[5]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '5 days', NOW(), NOW()),
      (42, 'Diana Mitchell', 'Diana', 'Mitchell', '[{"email": "dmitchell@ruthschris.com", "type": "Work"}]', '[{"phone": "504-555-3102", "type": "Work"}]',
       'VP Supply Chain', 'Operations', 21, v_sales_id,
       '500 Tchoupitoulas Street', 'New Orleans', 'LA', '70130', 'USA',
       'https://linkedin.com/in/dianamitchell-ruthschris', 'Budget holder for all purchasing.',
       ARRAY[6]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

      -- Morton''s (Org 22)
      (43, 'Chef Robert Chen', 'Robert', 'Chen', '[{"email": "rchen@mortons.com", "type": "Work"}]', '[{"phone": "312-555-3201", "type": "Work"}]',
       'Executive Chef', 'Culinary', 22, v_sales_id,
       '65 E Wacker Place', 'Chicago', 'IL', '60601', 'USA',
       'https://linkedin.com/in/chefrobertchen-mortons', 'Technical expert. Focuses on consistency.',
       ARRAY[5]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '4 days', NOW(), NOW()),

      -- Chili''s (Org 23)
      (45, 'Chef Kevin Park', 'Kevin', 'Park', '[{"email": "kpark@brinker.com", "type": "Work"}]', '[{"phone": "972-555-3301", "type": "Work"}]',
       'VP Culinary Innovation', 'Culinary', 23, v_sales_id,
       '6820 LBJ Freeway', 'Dallas', 'TX', '75240', 'USA',
       'https://linkedin.com/in/chefkevinpark-brinker', 'Influencer. Drives menu innovation.',
       ARRAY[4]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

      -- Applebee''s (Org 24)
      (47, 'Chef Jason Torres', 'Jason', 'Torres', '[{"email": "jtorres@dinebrands.com", "type": "Work"}]', '[{"phone": "913-555-3401", "type": "Work"}]',
       'VP Menu Development', 'Culinary', 24, v_sales_id,
       '450 N Brand Blvd', 'Glendale', 'CA', '91203', 'USA',
       'https://linkedin.com/in/chefjasontorres', 'Very receptive to sampling new products.',
       ARRAY[4]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '5 days', NOW(), NOW()),

      -- Buffalo Wild Wings (Org 25)
      (49, 'Chef Tyler Reed', 'Tyler', 'Reed', '[{"email": "treed@inspirebrands.com", "type": "Work"}]', '[{"phone": "612-555-3501", "type": "Work"}]',
       'Food Innovation Director', 'Culinary', 25, v_sales_id,
       '3 Glenlake Parkway NE', 'Atlanta', 'GA', '30328', 'USA',
       'https://linkedin.com/in/cheftylereed', 'Innovative mindset. Looking for differentiated products.',
       ARRAY[4]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '4 days', NOW(), NOW()),

      -- Red Robin (Org 26)
      (51, 'Chef Amanda Foster', 'Amanda', 'Foster', '[{"email": "afoster@redrobin.com", "type": "Work"}]', '[{"phone": "303-555-3601", "type": "Work"}]',
       'Corporate Chef', 'Culinary', 26, v_sales_id,
       '6312 S Fiddlers Green Circle', 'Greenwood Village', 'CO', '80111', 'USA',
       'https://linkedin.com/in/chefamandafoster', 'Very collaborative. Open to co-developing menu items.',
       ARRAY[2]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

      -- Panera (Org 27)
      (53, 'Chef Sarah Mitchell', 'Sarah', 'Mitchell', '[{"email": "smitchell@panerabread.com", "type": "Work"}]', '[{"phone": "314-555-3701", "type": "Work"}]',
       'Head Baker', 'Culinary', 27, v_sales_id,
       '3630 S Geyer Road', 'St. Louis', 'MO', '63127', 'USA',
       'https://linkedin.com/in/chefsarahmitchell', 'Artisan bread expert. Focus on clean label ingredients.',
       ARRAY[5]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '2 days', NOW(), NOW()),

      -- Chipotle (Org 28)
      (55, 'Chef Maria Santos', 'Maria', 'Santos', '[{"email": "msantos@chipotle.com", "type": "Work"}]', '[{"phone": "949-555-3801", "type": "Work"}]',
       'VP Culinary', 'Culinary', 28, v_sales_id,
       '610 Newport Center Drive', 'Newport Beach', 'CA', '92660', 'USA',
       'https://linkedin.com/in/chefmariasantos', 'Influencer. Drives sustainable sourcing initiatives.',
       ARRAY[4]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '4 days', NOW(), NOW()),

      -- Shake Shack (Org 29)
      (57, 'Chef Daniel Kim', 'Daniel', 'Kim', '[{"email": "dkim@shakeshack.com", "type": "Work"}]', '[{"phone": "212-555-3901", "type": "Work"}]',
       'Culinary Director', 'Culinary', 29, v_sales_id,
       '225 Varick Street', 'New York', 'NY', '10014', 'USA',
       'https://linkedin.com/in/chefdanielkim', 'Technical. Korean cuisine background. Focus on quality.',
       ARRAY[5]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '2 days', NOW(), NOW()),

      -- Marriott (Org 30)
      (59, 'Chef Pierre Dubois', 'Pierre', 'Dubois', '[{"email": "pdubois@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4001", "type": "Work"}]',
       'VP Global Culinary', 'Culinary', 30, v_sales_id,
       '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 'USA',
       'https://linkedin.com/in/chefpierredubois', 'Budget holder for global culinary. French trained.',
       ARRAY[1, 6]::bigint[], NOW() - INTERVAL '8 years', NOW() - INTERVAL '3 days', NOW(), NOW()),
      (60, 'Jennifer Adams', 'Jennifer', 'Adams', '[{"email": "jadams2@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4002", "type": "Work"}]',
       'Procurement Director', 'Operations', 30, v_sales_id,
       '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 'USA',
       'https://linkedin.com/in/jenniferadams-marriott', 'Budget Holder + VIP. Controls North American procurement.',
       ARRAY[6, 8]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

      -- Hilton (Org 31)
      (62, 'Chef James Martin', 'James', 'Martin', '[{"email": "jmartin@hilton.com", "type": "Work"}]', '[{"phone": "703-555-4101", "type": "Work"}]',
       'Corporate Executive Chef', 'Culinary', 31, v_sales_id,
       '7930 Jones Branch Drive', 'McLean', 'VA', '22102', 'USA',
       'https://linkedin.com/in/chefjamesmartin', 'VIP. Long tenure, influential across hotel industry.',
       ARRAY[8]::bigint[], NOW() - INTERVAL '10 years', NOW() - INTERVAL '4 days', NOW(), NOW()),

      -- Hyatt (Org 32)
      (64, 'Chef Michael Chang', 'Michael', 'Chang', '[{"email": "mchang@hyatt.com", "type": "Work"}]', '[{"phone": "312-555-4201", "type": "Work"}]',
       'VP F&B Operations', 'Culinary', 32, v_sales_id,
       '150 N Riverside Plaza', 'Chicago', 'IL', '60606', 'USA',
       'https://linkedin.com/in/chefmichaelchang', 'Asian cuisine specialist. Focus on authenticity.',
       ARRAY[5]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '5 days', NOW(), NOW()),

      -- HCA Healthcare (Org 33)
      (66, 'Dr. Sarah Thompson', 'Sarah', 'Thompson', '[{"email": "sthompson@hcahealthcare.com", "type": "Work"}]', '[{"phone": "615-555-4301", "type": "Work"}]',
       'Nutrition Services Director', 'Dietary', 33, v_sales_id,
       '1 Park Plaza', 'Nashville', 'TN', '37203', 'USA',
       'https://linkedin.com/in/drsarahthompson', 'RD, MS. Focus on patient nutrition outcomes.',
       ARRAY[1]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '2 days', NOW(), NOW()),

      -- Ascension (Org 34)
      (68, 'Dr. Emily Roberts', 'Emily', 'Roberts', '[{"email": "eroberts@ascension.org", "type": "Work"}]', '[{"phone": "314-555-4401", "type": "Work"}]',
       'VP Support Services', 'Dietary', 34, v_sales_id,
       '4600 Edmundson Road', 'St. Louis', 'MO', '63134', 'USA',
       'https://linkedin.com/in/dremilyroberts', 'Decision maker for all nutrition services.',
       ARRAY[1, 6]::bigint[], NOW() - INTERVAL '8 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

      -- Aramark (Org 35)
      (70, 'Chef Christopher Lee', 'Christopher', 'Lee', '[{"email": "clee2@aramark.com", "type": "Work"}]', '[{"phone": "215-555-4501", "type": "Work"}]',
       'VP Culinary Higher Ed', 'Culinary', 35, v_sales_id,
       '2400 Market Street', 'Philadelphia', 'PA', '19103', 'USA',
       'https://linkedin.com/in/chefchristopherlee-aramark', 'Technical + Influencer. Focus on campus sustainability.',
       ARRAY[4, 5]::bigint[], NOW() - INTERVAL '7 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

      -- Sodexo (Org 36)
      (72, 'Chef Antoine Bernard', 'Antoine', 'Bernard', '[{"email": "abernard@sodexo.com", "type": "Work"}]', '[{"phone": "301-555-4601", "type": "Work"}]',
       'Global Executive Chef', 'Culinary', 36, v_sales_id,
       '9801 Washingtonian Blvd', 'Gaithersburg', 'MD', '20878', 'USA',
       'https://linkedin.com/in/chefantoinebernard', 'Influencer. French-trained, focus on culinary excellence.',
       ARRAY[4]::bigint[], NOW() - INTERVAL '9 years', NOW() - INTERVAL '2 days', NOW(), NOW()),

      -- Brookdale (Org 37)
      (74, 'Chef Richard Taylor', 'Richard', 'Taylor', '[{"email": "rtaylor@brookdale.com", "type": "Work"}]', '[{"phone": "615-555-4701", "type": "Work"}]',
       'VP Culinary Services', 'Culinary', 37, v_sales_id,
       '6737 W Washington Street', 'Milwaukee', 'WI', '53214', 'USA',
       'https://linkedin.com/in/chefrichardtaylor', 'Senior living specialist. Focus on texture-modified diets.',
       ARRAY[5]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '4 days', NOW(), NOW()),

      -- Sunrise Senior (Org 38)
      (76, 'Chef Andrea Miller', 'Andrea', 'Miller', '[{"email": "amiller@sunriseseniorliving.com", "type": "Work"}]', '[{"phone": "703-555-4801", "type": "Work"}]',
       'Executive Chef', 'Culinary', 38, v_sales_id,
       '7902 Westpark Drive', 'McLean', 'VA', '22102', 'USA',
       'https://linkedin.com/in/chefandreamiller', 'Focus on resident satisfaction and dietary compliance.',
       ARRAY[5]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

      -- Levy Restaurants (Org 39)
      (78, 'Chef Larry Levy', 'Larry', 'Levy', '[{"email": "llevy@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4901", "type": "Work"}]',
       'Founder & Chairman', 'Executive', 39, v_sales_id,
       '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 'USA',
       'https://linkedin.com/in/larrylevylevy', 'Decision Maker + Influencer + Technical. Industry legend.',
       ARRAY[1, 4, 5]::bigint[], NOW() - INTERVAL '12 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),
      (79, 'Michelle Adams', 'Michelle', 'Adams', '[{"email": "madams@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4902", "type": "Work"}]',
       'VP Purchasing', 'Operations', 39, v_sales_id,
       '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 'USA',
       'https://linkedin.com/in/michelleadams-levy', 'Manages all purchasing for stadium accounts.',
       ARRAY[6]::bigint[], NOW() - INTERVAL '8 years', NOW() - INTERVAL '1 week', NOW(), NOW()),
      (80, 'Chef David Park', 'David', 'Park', '[{"email": "dpark@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4903", "type": "Work"}]',
       'Corporate Chef', 'Culinary', 39, v_sales_id,
       '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 'USA',
       'https://linkedin.com/in/chefdavidpark-levy', 'Korean-American chef. Stadium culinary innovation.',
       ARRAY[]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '3 days', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    PERFORM setval(pg_get_serial_sequence('contacts', 'id'), 80, true);
    RAISE NOTICE 'SUCCESS: Inserted additional contacts (40-80)';
  ELSE
    RAISE NOTICE 'Contacts 40+ already exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- NOTE: Activities and Tasks sections removed
-- ============================================================================
-- The existing 19 activities and 20 tasks are sufficient for demo.
-- Adding new activities would require complex FK validation:
--   - Activities with opportunity_id require contact to belong to opportunity customer
--   - This trigger `validate_activity_consistency` enforces data integrity
-- ============================================================================

-- ============================================================================
-- Verification Summary
-- ============================================================================
DO $$
DECLARE
  contact_count INTEGER;
  activity_count INTEGER;
  task_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO contact_count FROM contacts;
  SELECT COUNT(*) INTO activity_count FROM activities;
  SELECT COUNT(*) INTO task_count FROM tasks;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'DEMO DATA SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Contacts: % (additional added)', contact_count;
  RAISE NOTICE 'Activities: % (existing)', activity_count;
  RAISE NOTICE 'Tasks: % (existing)', task_count;
  RAISE NOTICE '============================================';
END $$;
