-- ============================================================================
-- PART 8: CONTACTS (~80 contacts)
-- ============================================================================
-- 2-3 contacts per organization
-- Distribution: 18 for principals, 20 for distributors, 42 for customers
-- Contact IDs: 1-80
-- Schema: id, name, first_name, last_name, email (JSONB), phone (JSONB),
--         title, department, organization_id, sales_id, created_at, updated_at
-- ============================================================================

INSERT INTO "public"."contacts" (
  id, name, first_name, last_name, email, phone, title, department, organization_id, sales_id, created_at, updated_at
)
VALUES
  -- ========================================
  -- PRINCIPAL CONTACTS (18 total, 2 per org)
  -- ========================================

  -- McCRUM (Org 1) - Brent manages
  (1, 'John McCrum', 'John', 'McCrum', '[{"email": "john@mccrum.com", "type": "Work"}]', '[{"phone": "208-555-1101", "type": "Work"}]',
   'VP Sales', 'Sales', 1, 2, NOW(), NOW()),
  (2, 'Sarah Miller', 'Sarah', 'Miller', '[{"email": "sarah.miller@mccrum.com", "type": "Work"}]', '[{"phone": "208-555-1102", "type": "Work"}]',
   'Account Manager', 'Sales', 1, 2, NOW(), NOW()),

  -- SWAP (Org 2) - Brent manages
  (3, 'Michael Chen', 'Michael', 'Chen', '[{"email": "mchen@swapfoods.com", "type": "Work"}]', '[{"phone": "312-555-1201", "type": "Work"}]',
   'CEO', 'Executive', 2, 2, NOW(), NOW()),
  (4, 'Lisa Wong', 'Lisa', 'Wong', '[{"email": "lwong@swapfoods.com", "type": "Work"}]', '[{"phone": "312-555-1202", "type": "Work"}]',
   'National Sales Manager', 'Sales', 2, 2, NOW(), NOW()),

  -- Rapid Rasoi (Org 3) - Michelle manages
  (5, 'Raj Patel', 'Raj', 'Patel', '[{"email": "raj@rapidrasoi.com", "type": "Work"}]', '[{"phone": "510-555-1301", "type": "Work"}]',
   'Owner', 'Executive', 3, 3, NOW(), NOW()),
  (6, 'Priya Sharma', 'Priya', 'Sharma', '[{"email": "priya@rapidrasoi.com", "type": "Work"}]', '[{"phone": "510-555-1302", "type": "Work"}]',
   'Sales Director', 'Sales', 3, 3, NOW(), NOW()),

  -- Lakeview Farms (Org 4) - Michelle manages
  (7, 'Tom Harrison', 'Tom', 'Harrison', '[{"email": "tharrison@lakeviewfarms.com", "type": "Work"}]', '[{"phone": "614-555-1401", "type": "Work"}]',
   'President', 'Executive', 4, 3, NOW(), NOW()),
  (8, 'Jennifer Adams', 'Jennifer', 'Adams', '[{"email": "jadams@lakeviewfarms.com", "type": "Work"}]', '[{"phone": "614-555-1402", "type": "Work"}]',
   'Regional Sales Manager', 'Sales', 4, 3, NOW(), NOW()),

  -- Frico (Org 5) - Gary manages
  (9, 'Marco Rossi', 'Marco', 'Rossi', '[{"email": "mrossi@frico.it", "type": "Work"}]', '[{"phone": "201-555-1501", "type": "Work"}]',
   'US Sales Director', 'Sales', 5, 4, NOW(), NOW()),
  (10, 'Anna Bianchi', 'Anna', 'Bianchi', '[{"email": "abianchi@frico.it", "type": "Work"}]', '[{"phone": "201-555-1502", "type": "Work"}]',
   'Account Executive', 'Sales', 5, 4, NOW(), NOW()),

  -- Anchor (Org 6) - Gary manages
  (11, 'David Thompson', 'David', 'Thompson', '[{"email": "dthompson@anchor.com", "type": "Work"}]', '[{"phone": "415-555-1601", "type": "Work"}]',
   'VP Foodservice', 'Sales', 6, 4, NOW(), NOW()),
  (12, 'Emily Walker', 'Emily', 'Walker', '[{"email": "ewalker@anchor.com", "type": "Work"}]', '[{"phone": "415-555-1602", "type": "Work"}]',
   'Key Account Manager', 'Sales', 6, 4, NOW(), NOW()),

  -- Tattooed Chef (Org 7) - Dale manages
  (13, 'Sarah Johnson', 'Sarah', 'Johnson', '[{"email": "sjohnson@tattooedchef.com", "type": "Work"}]', '[{"phone": "323-555-1701", "type": "Work"}]',
   'Founder', 'Executive', 7, 5, NOW(), NOW()),
  (14, 'Brian Martinez', 'Brian', 'Martinez', '[{"email": "bmartinez@tattooedchef.com", "type": "Work"}]', '[{"phone": "323-555-1702", "type": "Work"}]',
   'Foodservice Director', 'Sales', 7, 5, NOW(), NOW()),

  -- Litehouse (Org 8) - Dale manages
  (15, 'Robert Lewis', 'Robert', 'Lewis', '[{"email": "rlewis@litehousefoods.com", "type": "Work"}]', '[{"phone": "208-555-1801", "type": "Work"}]',
   'VP Sales', 'Sales', 8, 5, NOW(), NOW()),
  (16, 'Karen White', 'Karen', 'White', '[{"email": "kwhite@litehousefoods.com", "type": "Work"}]', '[{"phone": "208-555-1802", "type": "Work"}]',
   'National Accounts', 'Sales', 8, 5, NOW(), NOW()),

  -- Custom Culinary (Org 9) - Sue manages
  (17, 'James Wilson', 'James', 'Wilson', '[{"email": "jwilson@customculinary.com", "type": "Work"}]', '[{"phone": "708-555-1901", "type": "Work"}]',
   'President', 'Executive', 9, 6, NOW(), NOW()),
  (18, 'Nancy Brown', 'Nancy', 'Brown', '[{"email": "nbrown@customculinary.com", "type": "Work"}]', '[{"phone": "708-555-1902", "type": "Work"}]',
   'Sales Team Leader', 'Sales', 9, 6, NOW(), NOW()),

  -- ========================================
  -- DISTRIBUTOR CONTACTS (20 total, 2 per org)
  -- ========================================

  -- Sysco (Org 10) - Brent manages
  (19, 'Michael Roberts', 'Michael', 'Roberts', '[{"email": "mroberts@sysco.com", "type": "Work"}]', '[{"phone": "281-555-2001", "type": "Work"}]',
   'Category Manager', 'Purchasing', 10, 2, NOW(), NOW()),
  (20, 'Susan Clark', 'Susan', 'Clark', '[{"email": "sclark@sysco.com", "type": "Work"}]', '[{"phone": "281-555-2002", "type": "Work"}]',
   'Senior Buyer', 'Purchasing', 10, 2, NOW(), NOW()),

  -- US Foods (Org 11) - Brent manages
  (21, 'Richard Davis', 'Richard', 'Davis', '[{"email": "rdavis@usfoods.com", "type": "Work"}]', '[{"phone": "847-555-2101", "type": "Work"}]',
   'VP Merchandising', 'Purchasing', 11, 2, NOW(), NOW()),
  (22, 'Patricia Moore', 'Patricia', 'Moore', '[{"email": "pmoore@usfoods.com", "type": "Work"}]', '[{"phone": "847-555-2102", "type": "Work"}]',
   'Category Specialist', 'Purchasing', 11, 2, NOW(), NOW()),

  -- GFS (Org 12) - Michelle manages
  (23, 'Steven Anderson', 'Steven', 'Anderson', '[{"email": "sanderson@gfs.com", "type": "Work"}]', '[{"phone": "616-555-2201", "type": "Work"}]',
   'Purchasing Director', 'Purchasing', 12, 3, NOW(), NOW()),
  (24, 'Linda Thomas', 'Linda', 'Thomas', '[{"email": "lthomas@gfs.com", "type": "Work"}]', '[{"phone": "616-555-2202", "type": "Work"}]',
   'Buyer', 'Purchasing', 12, 3, NOW(), NOW()),

  -- GFS (Org 13) - Michelle manages
  (25, 'William Taylor', 'William', 'Taylor', '[{"email": "wtaylor@gfs.com", "type": "Work"}]', '[{"phone": "616-555-2301", "type": "Work"}]',
   'VP Procurement', 'Purchasing', 13, 3, NOW(), NOW()),
  (26, 'Barbara Jackson', 'Barbara', 'Jackson', '[{"email": "bjackson@gfs.com", "type": "Work"}]', '[{"phone": "616-555-2302", "type": "Work"}]',
   'Merchandising Manager', 'Purchasing', 13, 3, NOW(), NOW()),

  -- Shamrock Foods (Org 14) - Gary manages
  (27, 'Daniel Martin', 'Daniel', 'Martin', '[{"email": "dmartin@shamrockfoods.com", "type": "Work"}]', '[{"phone": "602-555-2401", "type": "Work"}]',
   'President', 'Executive', 14, 4, NOW(), NOW()),
  (28, 'Jennifer Garcia', 'Jennifer', 'Garcia', '[{"email": "jgarcia@shamrockfoods.com", "type": "Work"}]', '[{"phone": "602-555-2402", "type": "Work"}]',
   'Buyer', 'Purchasing', 14, 4, NOW(), NOW()),

  -- Ben E. Keith (Org 15) - Gary manages
  (29, 'Christopher Lee', 'Christopher', 'Lee', '[{"email": "clee@benekeith.com", "type": "Work"}]', '[{"phone": "817-555-2501", "type": "Work"}]',
   'VP Sales', 'Sales', 15, 4, NOW(), NOW()),
  (30, 'Amanda Wilson', 'Amanda', 'Wilson', '[{"email": "awilson@benekeith.com", "type": "Work"}]', '[{"phone": "817-555-2502", "type": "Work"}]',
   'Purchasing Manager', 'Purchasing', 15, 4, NOW(), NOW()),

  -- Reinhart (Org 16) - Dale manages
  (31, 'Matthew Harris', 'Matthew', 'Harris', '[{"email": "mharris@rfrsinc.com", "type": "Work"}]', '[{"phone": "630-555-2601", "type": "Work"}]',
   'Procurement Director', 'Purchasing', 16, 5, NOW(), NOW()),
  (32, 'Jessica Robinson', 'Jessica', 'Robinson', '[{"email": "jrobinson@rfrsinc.com", "type": "Work"}]', '[{"phone": "630-555-2602", "type": "Work"}]',
   'Buyer', 'Purchasing', 16, 5, NOW(), NOW()),

  -- PFG (Org 17) - Dale manages
  (33, 'Andrew Clark', 'Andrew', 'Clark', '[{"email": "aclark@pfgc.com", "type": "Work"}]', '[{"phone": "804-555-2701", "type": "Work"}]',
   'VP Vendor Relations', 'Purchasing', 17, 5, NOW(), NOW()),
  (34, 'Michelle Lewis', 'Michelle', 'Lewis', '[{"email": "mlewis@pfgc.com", "type": "Work"}]', '[{"phone": "804-555-2702", "type": "Work"}]',
   'Category Manager', 'Purchasing', 17, 5, NOW(), NOW()),

  -- European Imports (Org 18) - Sue manages
  (35, 'Paul Scott', 'Paul', 'Scott', '[{"email": "pscott@europeanimports.com", "type": "Work"}]', '[{"phone": "312-555-2801", "type": "Work"}]',
   'President', 'Executive', 18, 6, NOW(), NOW()),
  (36, 'Rachel Young', 'Rachel', 'Young', '[{"email": "ryoung@europeanimports.com", "type": "Work"}]', '[{"phone": "312-555-2802", "type": "Work"}]',
   'Specialty Buyer', 'Purchasing', 18, 6, NOW(), NOW()),

  -- Chefs Warehouse (Org 19) - Sue manages
  (37, 'Kevin King', 'Kevin', 'King', '[{"email": "kking@chefswarehouse.com", "type": "Work"}]', '[{"phone": "203-555-2901", "type": "Work"}]',
   'CEO', 'Executive', 19, 6, NOW(), NOW()),
  (38, 'Laura Wright', 'Laura', 'Wright', '[{"email": "lwright@chefswarehouse.com", "type": "Work"}]', '[{"phone": "203-555-2902", "type": "Work"}]',
   'Purchasing Director', 'Purchasing', 19, 6, NOW(), NOW()),

  -- ========================================
  -- CUSTOMER CONTACTS (42 total, 2-3 per org)
  -- ========================================

  -- Capital Grille (Org 20) - Brent manages
  (39, 'Chef Marcus Sterling', 'Marcus', 'Sterling', '[{"email": "msterling@darden.com", "type": "Work"}]', '[{"phone": "312-555-3001", "type": "Work"}]',
   'Executive Chef', 'Culinary', 20, 2, NOW(), NOW()),
  (40, 'Victoria Hayes', 'Victoria', 'Hayes', '[{"email": "vhayes@darden.com", "type": "Work"}]', '[{"phone": "312-555-3002", "type": "Work"}]',
   'Purchasing Director', 'Operations', 20, 2, NOW(), NOW()),

  -- Ruth''s Chris (Org 21) - Brent manages
  (41, 'Chef Anthony Romano', 'Anthony', 'Romano', '[{"email": "aromano@ruthschris.com", "type": "Work"}]', '[{"phone": "504-555-3101", "type": "Work"}]',
   'Corporate Executive Chef', 'Culinary', 21, 2, NOW(), NOW()),
  (42, 'Diana Mitchell', 'Diana', 'Mitchell', '[{"email": "dmitchell@ruthschris.com", "type": "Work"}]', '[{"phone": "504-555-3102", "type": "Work"}]',
   'VP Supply Chain', 'Operations', 21, 2, NOW(), NOW()),

  -- Morton''s (Org 22) - Michelle manages
  (43, 'Chef Robert Chen', 'Robert', 'Chen', '[{"email": "rchen@mortons.com", "type": "Work"}]', '[{"phone": "312-555-3201", "type": "Work"}]',
   'Executive Chef', 'Culinary', 22, 3, NOW(), NOW()),
  (44, 'Sandra Phillips', 'Sandra', 'Phillips', '[{"email": "sphillips@mortons.com", "type": "Work"}]', '[{"phone": "312-555-3202", "type": "Work"}]',
   'Purchasing Manager', 'Operations', 22, 3, NOW(), NOW()),

  -- Chili''s (Org 23) - Michelle manages
  (45, 'Chef Kevin Park', 'Kevin', 'Park', '[{"email": "kpark@brinker.com", "type": "Work"}]', '[{"phone": "972-555-3301", "type": "Work"}]',
   'VP Culinary Innovation', 'Culinary', 23, 3, NOW(), NOW()),
  (46, 'Mary Johnson', 'Mary', 'Johnson', '[{"email": "mjohnson@brinker.com", "type": "Work"}]', '[{"phone": "972-555-3302", "type": "Work"}]',
   'Procurement Director', 'Operations', 23, 3, NOW(), NOW()),

  -- Applebee''s (Org 24) - Gary manages
  (47, 'Chef Jason Torres', 'Jason', 'Torres', '[{"email": "jtorres@dinebrands.com", "type": "Work"}]', '[{"phone": "913-555-3401", "type": "Work"}]',
   'VP Menu Development', 'Culinary', 24, 4, NOW(), NOW()),
  (48, 'Carol Anderson', 'Carol', 'Anderson', '[{"email": "canderson@dinebrands.com", "type": "Work"}]', '[{"phone": "913-555-3402", "type": "Work"}]',
   'Senior Buyer', 'Operations', 24, 4, NOW(), NOW()),

  -- Buffalo Wild Wings (Org 25) - Gary manages
  (49, 'Chef Tyler Reed', 'Tyler', 'Reed', '[{"email": "treed@inspirebrands.com", "type": "Work"}]', '[{"phone": "612-555-3501", "type": "Work"}]',
   'Food Innovation Director', 'Culinary', 25, 4, NOW(), NOW()),
  (50, 'Rebecca Moore', 'Rebecca', 'Moore', '[{"email": "rmoore@inspirebrands.com", "type": "Work"}]', '[{"phone": "612-555-3502", "type": "Work"}]',
   'Purchasing Manager', 'Operations', 25, 4, NOW(), NOW()),

  -- Red Robin (Org 26) - Dale manages
  (51, 'Chef Amanda Foster', 'Amanda', 'Foster', '[{"email": "afoster@redrobin.com", "type": "Work"}]', '[{"phone": "303-555-3601", "type": "Work"}]',
   'Corporate Chef', 'Culinary', 26, 5, NOW(), NOW()),
  (52, 'Brian Taylor', 'Brian', 'Taylor', '[{"email": "btaylor@redrobin.com", "type": "Work"}]', '[{"phone": "303-555-3602", "type": "Work"}]',
   'Supply Chain Manager', 'Operations', 26, 5, NOW(), NOW()),

  -- Panera (Org 27) - Dale manages
  (53, 'Chef Sarah Mitchell', 'Sarah', 'Mitchell', '[{"email": "smitchell@panerabread.com", "type": "Work"}]', '[{"phone": "314-555-3701", "type": "Work"}]',
   'Head Baker', 'Culinary', 27, 5, NOW(), NOW()),
  (54, 'David Clark', 'David', 'Clark', '[{"email": "dclark@panerabread.com", "type": "Work"}]', '[{"phone": "314-555-3702", "type": "Work"}]',
   'VP Procurement', 'Operations', 27, 5, NOW(), NOW()),

  -- Chipotle (Org 28) - Sue manages
  (55, 'Chef Maria Santos', 'Maria', 'Santos', '[{"email": "msantos@chipotle.com", "type": "Work"}]', '[{"phone": "949-555-3801", "type": "Work"}]',
   'VP Culinary', 'Culinary', 28, 6, NOW(), NOW()),
  (56, 'Thomas Brown', 'Thomas', 'Brown', '[{"email": "tbrown@chipotle.com", "type": "Work"}]', '[{"phone": "949-555-3802", "type": "Work"}]',
   'Supply Director', 'Operations', 28, 6, NOW(), NOW()),

  -- Shake Shack (Org 29) - Sue manages
  (57, 'Chef Daniel Kim', 'Daniel', 'Kim', '[{"email": "dkim@shakeshack.com", "type": "Work"}]', '[{"phone": "212-555-3901", "type": "Work"}]',
   'Culinary Director', 'Culinary', 29, 6, NOW(), NOW()),
  (58, 'Lisa White', 'Lisa', 'White', '[{"email": "lwhite@shakeshack.com", "type": "Work"}]', '[{"phone": "212-555-3902", "type": "Work"}]',
   'Purchasing Manager', 'Operations', 29, 6, NOW(), NOW()),

  -- Marriott (Org 30) - Brent manages
  (59, 'Chef Pierre Dubois', 'Pierre', 'Dubois', '[{"email": "pdubois@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4001", "type": "Work"}]',
   'VP Global Culinary', 'Culinary', 30, 2, NOW(), NOW()),
  (60, 'Jennifer Adams', 'Jennifer', 'Adams', '[{"email": "jadams2@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4002", "type": "Work"}]',
   'Procurement Director', 'Operations', 30, 2, NOW(), NOW()),
  (61, 'Robert Williams', 'Robert', 'Williams', '[{"email": "rwilliams@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4003", "type": "Work"}]',
   'Regional F&B Director', 'Operations', 30, 2, NOW(), NOW()),

  -- Hilton (Org 31) - Michelle manages
  (62, 'Chef James Martin', 'James', 'Martin', '[{"email": "jmartin@hilton.com", "type": "Work"}]', '[{"phone": "703-555-4101", "type": "Work"}]',
   'Corporate Executive Chef', 'Culinary', 31, 3, NOW(), NOW()),
  (63, 'Susan Davis', 'Susan', 'Davis', '[{"email": "sdavis@hilton.com", "type": "Work"}]', '[{"phone": "703-555-4102", "type": "Work"}]',
   'VP Supply Chain', 'Operations', 31, 3, NOW(), NOW()),

  -- Hyatt (Org 32) - Michelle manages
  (64, 'Chef Michael Chang', 'Michael', 'Chang', '[{"email": "mchang@hyatt.com", "type": "Work"}]', '[{"phone": "312-555-4201", "type": "Work"}]',
   'VP F&B Operations', 'Culinary', 32, 3, NOW(), NOW()),
  (65, 'Patricia Lewis', 'Patricia', 'Lewis', '[{"email": "plewis@hyatt.com", "type": "Work"}]', '[{"phone": "312-555-4202", "type": "Work"}]',
   'Purchasing Director', 'Operations', 32, 3, NOW(), NOW()),

  -- HCA Healthcare (Org 33) - Gary manages
  (66, 'Dr. Sarah Thompson', 'Sarah', 'Thompson', '[{"email": "sthompson@hcahealthcare.com", "type": "Work"}]', '[{"phone": "615-555-4301", "type": "Work"}]',
   'Nutrition Services Director', 'Dietary', 33, 4, NOW(), NOW()),
  (67, 'Mark Johnson', 'Mark', 'Johnson', '[{"email": "mjohnson2@hcahealthcare.com", "type": "Work"}]', '[{"phone": "615-555-4302", "type": "Work"}]',
   'Foodservice Manager', 'Dietary', 33, 4, NOW(), NOW()),

  -- Ascension (Org 34) - Gary manages
  (68, 'Dr. Emily Roberts', 'Emily', 'Roberts', '[{"email": "eroberts@ascension.org", "type": "Work"}]', '[{"phone": "314-555-4401", "type": "Work"}]',
   'VP Support Services', 'Dietary', 34, 4, NOW(), NOW()),
  (69, 'William Davis', 'William', 'Davis', '[{"email": "wdavis@ascension.org", "type": "Work"}]', '[{"phone": "314-555-4402", "type": "Work"}]',
   'Regional Nutrition Director', 'Dietary', 34, 4, NOW(), NOW()),

  -- Aramark (Org 35) - Dale manages
  (70, 'Chef Christopher Lee', 'Christopher', 'Lee', '[{"email": "clee2@aramark.com", "type": "Work"}]', '[{"phone": "215-555-4501", "type": "Work"}]',
   'VP Culinary Higher Ed', 'Culinary', 35, 5, NOW(), NOW()),
  (71, 'Nancy Wilson', 'Nancy', 'Wilson', '[{"email": "nwilson@aramark.com", "type": "Work"}]', '[{"phone": "215-555-4502", "type": "Work"}]',
   'Purchasing Director', 'Operations', 35, 5, NOW(), NOW()),

  -- Sodexo (Org 36) - Dale manages
  (72, 'Chef Antoine Bernard', 'Antoine', 'Bernard', '[{"email": "abernard@sodexo.com", "type": "Work"}]', '[{"phone": "301-555-4601", "type": "Work"}]',
   'Global Executive Chef', 'Culinary', 36, 5, NOW(), NOW()),
  (73, 'Rachel Green', 'Rachel', 'Green', '[{"email": "rgreen@sodexo.com", "type": "Work"}]', '[{"phone": "301-555-4602", "type": "Work"}]',
   'Campus Dining Director', 'Operations', 36, 5, NOW(), NOW()),

  -- Brookdale (Org 37) - Sue manages
  (74, 'Chef Richard Taylor', 'Richard', 'Taylor', '[{"email": "rtaylor@brookdale.com", "type": "Work"}]', '[{"phone": "615-555-4701", "type": "Work"}]',
   'VP Culinary Services', 'Culinary', 37, 6, NOW(), NOW()),
  (75, 'Karen Martinez', 'Karen', 'Martinez', '[{"email": "kmartinez@brookdale.com", "type": "Work"}]', '[{"phone": "615-555-4702", "type": "Work"}]',
   'Dining Director', 'Operations', 37, 6, NOW(), NOW()),

  -- Sunrise Senior (Org 38) - Sue manages
  (76, 'Chef Andrea Miller', 'Andrea', 'Miller', '[{"email": "amiller@sunriseseniorliving.com", "type": "Work"}]', '[{"phone": "703-555-4801", "type": "Work"}]',
   'Executive Chef', 'Culinary', 38, 6, NOW(), NOW()),
  (77, 'Steven Brown', 'Steven', 'Brown', '[{"email": "sbrown@sunriseseniorliving.com", "type": "Work"}]', '[{"phone": "703-555-4802", "type": "Work"}]',
   'Dining Services Manager', 'Operations', 38, 6, NOW(), NOW()),

  -- Levy Restaurants (Org 39) - Brent manages
  (78, 'Chef Larry Levy', 'Larry', 'Levy', '[{"email": "llevy@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4901", "type": "Work"}]',
   'Founder & Chairman', 'Executive', 39, 2, NOW(), NOW()),
  (79, 'Michelle Adams', 'Michelle', 'Adams', '[{"email": "madams@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4902", "type": "Work"}]',
   'VP Purchasing', 'Operations', 39, 2, NOW(), NOW()),
  (80, 'Chef David Park', 'David', 'Park', '[{"email": "dpark@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4903", "type": "Work"}]',
   'Corporate Chef', 'Culinary', 39, 2, NOW(), NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('contacts', 'id'), 80, true);
