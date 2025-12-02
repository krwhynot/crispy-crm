-- ============================================================================
-- DEMO DATA: Products and Additional Contacts
-- ============================================================================
-- Purpose: Add sample data for production demo
--
-- Contents:
--   - 36 Products (4 per principal)
--   - ~22 Additional Contacts (using dynamic sales_id lookup)
--   - Additional activities and tasks for demo
--
-- Note: Uses MIN(id) from sales table to ensure valid FK references
-- ============================================================================

-- ============================================================================
-- PRODUCTS (36 products - 4 per principal)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    INSERT INTO "public"."products" (
      id, name, category, principal_id, description, sku, status, created_at, updated_at
    )
    VALUES
      -- McCRUM Products (Principal ID: 1)
      (1, 'Premium Crinkle Cut Fries', 'Frozen Potato', 1, 'Classic crinkle cut fries, Idaho potatoes, 5/16" cut', 'MCR-FRY-001', 'active', NOW(), NOW()),
      (2, 'Seasoned Wedge Fries', 'Frozen Potato', 1, 'Skin-on potato wedges with seasoning blend', 'MCR-FRY-002', 'active', NOW(), NOW()),
      (3, 'Hash Brown Patties', 'Frozen Potato', 1, 'Formed hash brown patties, 2.25oz each', 'MCR-HB-001', 'active', NOW(), NOW()),
      (4, 'Diced Potatoes IQF', 'Frozen Potato', 1, '1/2" diced Idaho potatoes, individually quick frozen', 'MCR-DIC-001', 'active', NOW(), NOW()),

      -- SWAP Products (Principal ID: 2)
      (5, 'Plant-Based Crumbles', 'Plant-Based Protein', 2, 'Soy-free plant protein crumbles for tacos/bowls', 'SWP-PB-001', 'active', NOW(), NOW()),
      (6, 'Oat Milk Creamer', 'Dairy Alternative', 2, 'Barista-style oat milk, froths perfectly', 'SWP-OAT-001', 'active', NOW(), NOW()),
      (7, 'Cauliflower Rice', 'Vegetable', 2, 'Riced cauliflower, ready to heat', 'SWP-VEG-001', 'active', NOW(), NOW()),
      (8, 'Jackfruit Pulled Pork Style', 'Plant-Based Protein', 2, 'Seasoned young jackfruit, BBQ ready', 'SWP-PB-002', 'active', NOW(), NOW()),

      -- Rapid Rasoi Products (Principal ID: 3)
      (9, 'Garlic Naan', 'Bread', 3, 'Traditional Indian garlic naan, par-baked', 'RR-NAAN-001', 'active', NOW(), NOW()),
      (10, 'Butter Chicken Sauce', 'Sauce', 3, 'Authentic makhani sauce, heat and serve', 'RR-SAU-001', 'active', NOW(), NOW()),
      (11, 'Samosa (Vegetable)', 'Appetizer', 3, 'Crispy vegetable samosas, frozen', 'RR-APP-001', 'active', NOW(), NOW()),
      (12, 'Basmati Rice Pilaf', 'Rice', 3, 'Seasoned basmati rice with whole spices', 'RR-RICE-001', 'active', NOW(), NOW()),

      -- Lakeview Farms Products (Principal ID: 4)
      (13, 'French Onion Dip', 'Dip', 4, 'Creamy French onion dip, 5lb tub', 'LVF-DIP-001', 'active', NOW(), NOW()),
      (14, 'Fruit Parfait Cup', 'Dessert', 4, 'Layered yogurt parfait with granola', 'LVF-DES-001', 'active', NOW(), NOW()),
      (15, 'Spinach Artichoke Dip', 'Dip', 4, 'Premium spinach artichoke dip', 'LVF-DIP-002', 'active', NOW(), NOW()),
      (16, 'Cheesecake Slice', 'Dessert', 4, 'New York style cheesecake, pre-sliced', 'LVF-DES-002', 'active', NOW(), NOW()),

      -- Frico Products (Principal ID: 5)
      (17, 'Aged Parmesan Wheel', 'Cheese', 5, '24-month aged Parmigiano-Reggiano', 'FRC-CHE-001', 'active', NOW(), NOW()),
      (18, 'Gorgonzola Crumbles', 'Cheese', 5, 'Italian Gorgonzola, crumbled for salads', 'FRC-CHE-002', 'active', NOW(), NOW()),
      (19, 'Asiago Fresco', 'Cheese', 5, 'Young Asiago cheese, mild and creamy', 'FRC-CHE-003', 'active', NOW(), NOW()),
      (20, 'Shaved Parmesan', 'Cheese', 5, 'Pre-shaved Parmesan for finishing', 'FRC-CHE-004', 'active', NOW(), NOW()),

      -- Anchor Products (Principal ID: 6)
      (21, 'Professional Butter', 'Dairy', 6, 'New Zealand grass-fed butter, 82% fat', 'ANC-DAI-001', 'active', NOW(), NOW()),
      (22, 'Extra Thick Cream', 'Dairy', 6, 'Heavy cream for whipping, 40% fat', 'ANC-DAI-002', 'active', NOW(), NOW()),
      (23, 'UHT Cream Portions', 'Dairy', 6, 'Shelf-stable cream portions for coffee', 'ANC-DAI-003', 'active', NOW(), NOW()),
      (24, 'Clarified Butter', 'Dairy', 6, 'Ghee-style clarified butter for high-heat cooking', 'ANC-DAI-004', 'active', NOW(), NOW()),

      -- Tattooed Chef Products (Principal ID: 7)
      (25, 'Plant-Based Buddha Bowl', 'Frozen Entree', 7, 'Complete vegan meal bowl, quinoa base', 'TC-ENT-001', 'active', NOW(), NOW()),
      (26, 'Cauliflower Mac', 'Frozen Entree', 7, 'Plant-based mac and cheese alternative', 'TC-ENT-002', 'active', NOW(), NOW()),
      (27, 'Veggie Burrito', 'Frozen Entree', 7, 'Bean and vegetable burrito, vegan', 'TC-ENT-003', 'active', NOW(), NOW()),
      (28, 'Acai Bowl', 'Frozen Dessert', 7, 'Ready-to-serve acai bowl with toppings', 'TC-DES-001', 'active', NOW(), NOW()),

      -- Litehouse Products (Principal ID: 8)
      (29, 'Chunky Blue Cheese', 'Dressing', 8, 'Premium blue cheese dressing with chunks', 'LH-DRS-001', 'active', NOW(), NOW()),
      (30, 'Homestyle Ranch', 'Dressing', 8, 'Classic buttermilk ranch dressing', 'LH-DRS-002', 'active', NOW(), NOW()),
      (31, 'Caesar Dressing', 'Dressing', 8, 'Traditional Caesar with anchovy', 'LH-DRS-003', 'active', NOW(), NOW()),
      (32, 'Freeze-Dried Herbs', 'Seasoning', 8, 'Assorted freeze-dried herbs for finishing', 'LH-HRB-001', 'active', NOW(), NOW()),

      -- Custom Culinary Products (Principal ID: 9)
      (33, 'Gold Label Chicken Base', 'Base', 9, 'Premium chicken base, no MSG', 'CC-BAS-001', 'active', NOW(), NOW()),
      (34, 'Demi-Glace Concentrate', 'Sauce', 9, 'Classic French demi-glace, concentrated', 'CC-SAU-001', 'active', NOW(), NOW()),
      (35, 'Roasted Garlic Base', 'Base', 9, 'Roasted garlic flavor base for soups/sauces', 'CC-BAS-002', 'active', NOW(), NOW()),
      (36, 'Hollandaise Sauce Mix', 'Sauce', 9, 'Just-add-butter hollandaise mix', 'CC-SAU-002', 'active', NOW(), NOW());

    PERFORM setval(pg_get_serial_sequence('products', 'id'), 36, true);
    RAISE NOTICE 'SUCCESS: Inserted 36 products';
  ELSE
    RAISE NOTICE 'Products already exist, skipping';
  END IF;
END $$;

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
  product_count INTEGER;
  contact_count INTEGER;
  activity_count INTEGER;
  task_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  SELECT COUNT(*) INTO contact_count FROM contacts;
  SELECT COUNT(*) INTO activity_count FROM activities;
  SELECT COUNT(*) INTO task_count FROM tasks;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'DEMO DATA SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Products: % (36 added)', product_count;
  RAISE NOTICE 'Contacts: % (additional added)', contact_count;
  RAISE NOTICE 'Activities: % (existing)', activity_count;
  RAISE NOTICE 'Tasks: % (existing)', task_count;
  RAISE NOTICE '============================================';
END $$;
