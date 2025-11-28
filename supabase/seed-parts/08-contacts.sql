-- ============================================================================
-- PART 8: CONTACTS (~80 contacts)
-- ============================================================================
-- 2-3 contacts per organization
-- Distribution: 18 for principals, 20 for distributors, 42 for customers
-- Contact IDs: 1-80
-- Schema: id, name, first_name, last_name, email (JSONB), phone (JSONB),
--         title, department, sales_id, created_at, updated_at
-- ============================================================================

INSERT INTO "public"."contacts" (
  id, name, first_name, last_name, email, phone, title, department, sales_id, created_at, updated_at
)
VALUES
  -- ========================================
  -- PRINCIPAL CONTACTS (18 total, 2 per org)
  -- ========================================

  -- McCRUM (Org 1) - Brent manages
  (1, 'John McCrum', 'John', 'McCrum', '[{"email": "john@mccrum.com", "type": "Work"}]', '[{"phone": "208-555-1101", "type": "Work"}]',
   'VP Sales', 'Sales', 2, NOW(), NOW()),
  (2, 'Sarah Miller', 'Sarah', 'Miller', '[{"email": "sarah.miller@mccrum.com", "type": "Work"}]', '[{"phone": "208-555-1102", "type": "Work"}]',
   'Account Manager', 'Sales', 2, NOW(), NOW()),

  -- SWAP (Org 2) - Brent manages
  (3, 'Michael Chen', 'Michael', 'Chen', '[{"email": "mchen@swapfoods.com", "type": "Work"}]', '[{"phone": "312-555-1201", "type": "Work"}]',
   'CEO', 'Executive', 2, NOW(), NOW()),
  (4, 'Lisa Wong', 'Lisa', 'Wong', '[{"email": "lwong@swapfoods.com", "type": "Work"}]', '[{"phone": "312-555-1202", "type": "Work"}]',
   'National Sales Manager', 'Sales', 2, NOW(), NOW()),

  -- Rapid Rasoi (Org 3) - Michelle manages
  (5, 'Raj Patel', 'Raj', 'Patel', '[{"email": "raj@rapidrasoi.com", "type": "Work"}]', '[{"phone": "510-555-1301", "type": "Work"}]',
   'Owner', 'Executive', 3, NOW(), NOW()),
  (6, 'Priya Sharma', 'Priya', 'Sharma', '[{"email": "priya@rapidrasoi.com", "type": "Work"}]', '[{"phone": "510-555-1302", "type": "Work"}]',
   'Sales Director', 'Sales', 3, NOW(), NOW()),

  -- Lakeview Farms (Org 4) - Michelle manages
  (7, 'Tom Harrison', 'Tom', 'Harrison', '[{"email": "tharrison@lakeviewfarms.com", "type": "Work"}]', '[{"phone": "614-555-1401", "type": "Work"}]',
   'President', 'Executive', 3, NOW(), NOW()),
  (8, 'Jennifer Adams', 'Jennifer', 'Adams', '[{"email": "jadams@lakeviewfarms.com", "type": "Work"}]', '[{"phone": "614-555-1402", "type": "Work"}]',
   'Regional Sales Manager', 'Sales', 3, NOW(), NOW()),

  -- Frico (Org 5) - Gary manages
  (9, 'Marco Rossi', 'Marco', 'Rossi', '[{"email": "mrossi@frico.it", "type": "Work"}]', '[{"phone": "201-555-1501", "type": "Work"}]',
   'US Sales Director', 'Sales', 4, NOW(), NOW()),
  (10, 'Anna Bianchi', 'Anna', 'Bianchi', '[{"email": "abianchi@frico.it", "type": "Work"}]', '[{"phone": "201-555-1502", "type": "Work"}]',
   'Account Executive', 'Sales', 4, NOW(), NOW()),

  -- Anchor (Org 6) - Gary manages
  (11, 'David Thompson', 'David', 'Thompson', '[{"email": "dthompson@anchor.com", "type": "Work"}]', '[{"phone": "415-555-1601", "type": "Work"}]',
   'VP Foodservice', 'Sales', 4, NOW(), NOW()),
  (12, 'Emma Wilson', 'Emma', 'Wilson', '[{"email": "ewilson@anchor.com", "type": "Work"}]', '[{"phone": "415-555-1602", "type": "Work"}]',
   'Key Account Manager', 'Sales', 4, NOW(), NOW()),

  -- Tattooed Chef (Org 7) - Dale manages
  (13, 'Sam Galletti', 'Sam', 'Galletti', '[{"email": "sam@tattooedchef.com", "type": "Work"}]', '[{"phone": "310-555-1701", "type": "Work"}]',
   'Founder & CEO', 'Executive', 5, NOW(), NOW()),
  (14, 'Nicole Green', 'Nicole', 'Green', '[{"email": "ngreen@tattooedchef.com", "type": "Work"}]', '[{"phone": "310-555-1702", "type": "Work"}]',
   'Foodservice Sales Manager', 'Sales', 5, NOW(), NOW()),

  -- Litehouse (Org 8) - Dale manages
  (15, 'Chris Anderson', 'Chris', 'Anderson', '[{"email": "canderson@litehousefoods.com", "type": "Work"}]', '[{"phone": "208-555-1801", "type": "Work"}]',
   'VP Sales', 'Sales', 5, NOW(), NOW()),
  (16, 'Amy Roberts', 'Amy', 'Roberts', '[{"email": "aroberts@litehousefoods.com", "type": "Work"}]', '[{"phone": "208-555-1802", "type": "Work"}]',
   'National Account Manager', 'Sales', 5, NOW(), NOW()),

  -- Custom Culinary (Org 9) - Sue manages
  (17, 'Robert James', 'Robert', 'James', '[{"email": "rjames@customculinary.com", "type": "Work"}]', '[{"phone": "630-555-1901", "type": "Work"}]',
   'President', 'Executive', 6, NOW(), NOW()),
  (18, 'Karen White', 'Karen', 'White', '[{"email": "kwhite@customculinary.com", "type": "Work"}]', '[{"phone": "630-555-1902", "type": "Work"}]',
   'Director of Sales', 'Sales', 6, NOW(), NOW()),

  -- ========================================
  -- DISTRIBUTOR CONTACTS (20 total, 2 per org)
  -- ========================================

  -- Sysco (Org 10) - Brent manages
  (19, 'Mike Reynolds', 'Mike', 'Reynolds', '[{"email": "mike.reynolds@sysco.com", "type": "Work"}]', '[{"phone": "281-555-2101", "type": "Work"}]',
   'Category Manager - Frozen', 'Purchasing', 2, NOW(), NOW()),
  (20, 'Susan Clark', 'Susan', 'Clark', '[{"email": "susan.clark@sysco.com", "type": "Work"}]', '[{"phone": "281-555-2102", "type": "Work"}]',
   'Senior Buyer', 'Purchasing', 2, NOW(), NOW()),

  -- US Foods (Org 11) - Brent manages
  (21, 'James Patterson', 'James', 'Patterson', '[{"email": "jpatterson@usfoods.com", "type": "Work"}]', '[{"phone": "847-555-2201", "type": "Work"}]',
   'VP Merchandising', 'Purchasing', 2, NOW(), NOW()),
  (22, 'Linda Martinez', 'Linda', 'Martinez', '[{"email": "lmartinez@usfoods.com", "type": "Work"}]', '[{"phone": "847-555-2202", "type": "Work"}]',
   'Category Manager - Dairy', 'Purchasing', 2, NOW(), NOW()),

  -- PFG (Org 12) - Michelle manages
  (23, 'Steve Johnson', 'Steve', 'Johnson', '[{"email": "sjohnson@pfgc.com", "type": "Work"}]', '[{"phone": "804-555-2301", "type": "Work"}]',
   'Director of Purchasing', 'Purchasing', 3, NOW(), NOW()),
  (24, 'Mary Davis', 'Mary', 'Davis', '[{"email": "mdavis@pfgc.com", "type": "Work"}]', '[{"phone": "804-555-2302", "type": "Work"}]',
   'Buyer - Center of Plate', 'Purchasing', 3, NOW(), NOW()),

  -- GFS (Org 13) - Michelle manages
  (25, 'Paul Gordon', 'Paul', 'Gordon', '[{"email": "pgordon@gfs.com", "type": "Work"}]', '[{"phone": "616-555-2401", "type": "Work"}]',
   'VP Procurement', 'Purchasing', 3, NOW(), NOW()),
  (26, 'Rachel Brown', 'Rachel', 'Brown', '[{"email": "rbrown@gfs.com", "type": "Work"}]', '[{"phone": "616-555-2402", "type": "Work"}]',
   'Senior Merchandiser', 'Purchasing', 3, NOW(), NOW()),

  -- Shamrock (Org 14) - Gary manages
  (27, 'Dan Shamrock', 'Dan', 'Shamrock', '[{"email": "dshamrock@shamrockfoods.com", "type": "Work"}]', '[{"phone": "602-555-2501", "type": "Work"}]',
   'President', 'Executive', 4, NOW(), NOW()),
  (28, 'Teresa Lopez', 'Teresa', 'Lopez', '[{"email": "tlopez@shamrockfoods.com", "type": "Work"}]', '[{"phone": "602-555-2502", "type": "Work"}]',
   'Category Manager', 'Purchasing', 4, NOW(), NOW()),

  -- Ben E. Keith (Org 15) - Gary manages
  (29, 'Robert Keith', 'Robert', 'Keith', '[{"email": "rkeith@benekeith.com", "type": "Work"}]', '[{"phone": "817-555-2601", "type": "Work"}]',
   'VP Sales', 'Sales', 4, NOW(), NOW()),
  (30, 'Amanda Torres', 'Amanda', 'Torres', '[{"email": "atorres@benekeith.com", "type": "Work"}]', '[{"phone": "817-555-2602", "type": "Work"}]',
   'Purchasing Manager', 'Purchasing', 4, NOW(), NOW()),

  -- Reinhart (Org 16) - Dale manages
  (31, 'Greg Reinhart', 'Greg', 'Reinhart', '[{"email": "greinhart@rfrsinc.com", "type": "Work"}]', '[{"phone": "715-555-2701", "type": "Work"}]',
   'Director of Procurement', 'Purchasing', 5, NOW(), NOW()),
  (32, 'Diane Foster', 'Diane', 'Foster', '[{"email": "dfoster@rfrsinc.com", "type": "Work"}]', '[{"phone": "715-555-2702", "type": "Work"}]',
   'Buyer', 'Purchasing', 5, NOW(), NOW()),

  -- Dot Foods (Org 17) - Dale manages
  (33, 'Tracy Dot', 'Tracy', 'Dot', '[{"email": "tdot@dotfoods.com", "type": "Work"}]', '[{"phone": "217-555-2801", "type": "Work"}]',
   'VP Vendor Relations', 'Purchasing', 5, NOW(), NOW()),
  (34, 'Mark Stevens', 'Mark', 'Stevens', '[{"email": "mstevens@dotfoods.com", "type": "Work"}]', '[{"phone": "217-555-2802", "type": "Work"}]',
   'Category Manager', 'Purchasing', 5, NOW(), NOW()),

  -- European Imports (Org 18) - Sue manages
  (35, 'Hans Mueller', 'Hans', 'Mueller', '[{"email": "hmueller@eiltd.com", "type": "Work"}]', '[{"phone": "312-555-2901", "type": "Work"}]',
   'President', 'Executive', 6, NOW(), NOW()),
  (36, 'Sofia Greco', 'Sofia', 'Greco', '[{"email": "sgreco@eiltd.com", "type": "Work"}]', '[{"phone": "312-555-2902", "type": "Work"}]',
   'Buyer - Specialty Cheese', 'Purchasing', 6, NOW(), NOW()),

  -- Chefs Warehouse (Org 19) - Sue manages
  (37, 'Christopher Pappas', 'Christopher', 'Pappas', '[{"email": "cpappas@chefswarehouse.com", "type": "Work"}]', '[{"phone": "718-555-3001", "type": "Work"}]',
   'CEO', 'Executive', 6, NOW(), NOW()),
  (38, 'Michelle Lane', 'Michelle', 'Lane', '[{"email": "mlane@chefswarehouse.com", "type": "Work"}]', '[{"phone": "718-555-3002", "type": "Work"}]',
   'Director of Purchasing', 'Purchasing', 6, NOW(), NOW()),

  -- ========================================
  -- CUSTOMER CONTACTS (42 total, 2-3 per org)
  -- ========================================

  -- Capital Grille (Org 20) - Brent manages
  (39, 'Andrew Sterling', 'Andrew', 'Sterling', '[{"email": "asterling@capitalgrille.com", "type": "Work"}]', '[{"phone": "312-555-3101", "type": "Work"}]',
   'Executive Chef', 'Culinary', 2, NOW(), NOW()),
  (40, 'Patricia Mills', 'Patricia', 'Mills', '[{"email": "pmills@capitalgrille.com", "type": "Work"}]', '[{"phone": "312-555-3102", "type": "Work"}]',
   'Purchasing Director', 'Purchasing', 2, NOW(), NOW()),

  -- Ruth''s Chris (Org 21) - Brent manages
  (41, 'Chef William Hayes', 'William', 'Hayes', '[{"email": "whayes@ruthschris.com", "type": "Work"}]', '[{"phone": "504-555-3201", "type": "Work"}]',
   'Corporate Executive Chef', 'Culinary', 2, NOW(), NOW()),
  (42, 'Sharon Wood', 'Sharon', 'Wood', '[{"email": "swood@ruthschris.com", "type": "Work"}]', '[{"phone": "504-555-3202", "type": "Work"}]',
   'VP Supply Chain', 'Operations', 2, NOW(), NOW()),

  -- Morton''s (Org 22) - Michelle manages
  (43, 'Chef Antonio Russo', 'Antonio', 'Russo', '[{"email": "arusso@mortons.com", "type": "Work"}]', '[{"phone": "312-555-3301", "type": "Work"}]',
   'Executive Chef', 'Culinary', 3, NOW(), NOW()),
  (44, 'Barbara Chen', 'Barbara', 'Chen', '[{"email": "bchen@mortons.com", "type": "Work"}]', '[{"phone": "312-555-3302", "type": "Work"}]',
   'Purchasing Manager', 'Purchasing', 3, NOW(), NOW()),

  -- Chili''s (Org 23) - Michelle manages
  (45, 'Kevin Brinker', 'Kevin', 'Brinker', '[{"email": "kbrinker@brinker.com", "type": "Work"}]', '[{"phone": "972-555-3401", "type": "Work"}]',
   'VP Culinary Innovation', 'Culinary', 3, NOW(), NOW()),
  (46, 'Nancy Wright', 'Nancy', 'Wright', '[{"email": "nwright@brinker.com", "type": "Work"}]', '[{"phone": "972-555-3402", "type": "Work"}]',
   'Director of Procurement', 'Purchasing', 3, NOW(), NOW()),

  -- Applebee''s (Org 24) - Gary manages
  (47, 'Chef Brian Palmer', 'Brian', 'Palmer', '[{"email": "bpalmer@applebees.com", "type": "Work"}]', '[{"phone": "913-555-3501", "type": "Work"}]',
   'VP Menu Development', 'Culinary', 4, NOW(), NOW()),
  (48, 'Christine Hall', 'Christine', 'Hall', '[{"email": "chall@applebees.com", "type": "Work"}]', '[{"phone": "913-555-3502", "type": "Work"}]',
   'Senior Buyer', 'Purchasing', 4, NOW(), NOW()),

  -- Buffalo Wild Wings (Org 25) - Gary manages
  (49, 'Derek Wings', 'Derek', 'Wings', '[{"email": "dwings@buffalowildwings.com", "type": "Work"}]', '[{"phone": "612-555-3601", "type": "Work"}]',
   'Director of Food Innovation', 'Culinary', 4, NOW(), NOW()),
  (50, 'Laura Burke', 'Laura', 'Burke', '[{"email": "lburke@buffalowildwings.com", "type": "Work"}]', '[{"phone": "612-555-3602", "type": "Work"}]',
   'Purchasing Manager', 'Purchasing', 4, NOW(), NOW()),

  -- Red Robin (Org 26) - Dale manages
  (51, 'Chef Scott Peters', 'Scott', 'Peters', '[{"email": "speters@redrobin.com", "type": "Work"}]', '[{"phone": "303-555-3701", "type": "Work"}]',
   'Corporate Chef', 'Culinary', 5, NOW(), NOW()),
  (52, 'Kimberly Scott', 'Kimberly', 'Scott', '[{"email": "kscott@redrobin.com", "type": "Work"}]', '[{"phone": "303-555-3702", "type": "Work"}]',
   'Supply Chain Manager', 'Operations', 5, NOW(), NOW()),

  -- Panera (Org 27) - Dale manages
  (53, 'Chef Dan Kish', 'Dan', 'Kish', '[{"email": "dkish@panerabread.com", "type": "Work"}]', '[{"phone": "314-555-3801", "type": "Work"}]',
   'Head Baker', 'Culinary', 5, NOW(), NOW()),
  (54, 'Rebecca Stone', 'Rebecca', 'Stone', '[{"email": "rstone@panerabread.com", "type": "Work"}]', '[{"phone": "314-555-3802", "type": "Work"}]',
   'VP Procurement', 'Purchasing', 5, NOW(), NOW()),

  -- Chipotle (Org 28) - Sue manages
  (55, 'Chef Nate Appleman', 'Nate', 'Appleman', '[{"email": "nappleman@chipotle.com", "type": "Work"}]', '[{"phone": "949-555-3901", "type": "Work"}]',
   'VP Culinary', 'Culinary', 6, NOW(), NOW()),
  (56, 'Jessica Rivera', 'Jessica', 'Rivera', '[{"email": "jrivera@chipotle.com", "type": "Work"}]', '[{"phone": "949-555-3902", "type": "Work"}]',
   'Director of Supply', 'Operations', 6, NOW(), NOW()),

  -- Shake Shack (Org 29) - Sue manages
  (57, 'Chef Mark Rosati', 'Mark', 'Rosati', '[{"email": "mrosati@shakeshack.com", "type": "Work"}]', '[{"phone": "212-555-4001", "type": "Work"}]',
   'Culinary Director', 'Culinary', 6, NOW(), NOW()),
  (58, 'Angela Morrison', 'Angela', 'Morrison', '[{"email": "amorrison@shakeshack.com", "type": "Work"}]', '[{"phone": "212-555-4002", "type": "Work"}]',
   'Purchasing Manager', 'Purchasing', 6, NOW(), NOW()),

  -- Marriott (Org 30) - Brent manages
  (59, 'Chef Antoine Westermann', 'Antoine', 'Westermann', '[{"email": "awestermann@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4101", "type": "Work"}]',
   'VP Global Culinary', 'Culinary', 2, NOW(), NOW()),
  (60, 'Dorothy Lane', 'Dorothy', 'Lane', '[{"email": "dlane@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4102", "type": "Work"}]',
   'Director of Procurement', 'Purchasing', 2, NOW(), NOW()),
  (61, 'George Mason', 'George', 'Mason', '[{"email": "gmason@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4103", "type": "Work"}]',
   'Regional F&B Director', 'Operations', 2, NOW(), NOW()),

  -- Hilton (Org 31) - Michelle manages
  (62, 'Chef Thomas Keller', 'Thomas', 'Keller', '[{"email": "tkeller@hilton.com", "type": "Work"}]', '[{"phone": "703-555-4201", "type": "Work"}]',
   'Corporate Executive Chef', 'Culinary', 3, NOW(), NOW()),
  (63, 'Margaret Hill', 'Margaret', 'Hill', '[{"email": "mhill@hilton.com", "type": "Work"}]', '[{"phone": "703-555-4202", "type": "Work"}]',
   'VP Supply Chain', 'Operations', 3, NOW(), NOW()),

  -- Hyatt (Org 32) - Michelle manages
  (64, 'Chef Peter Gordon', 'Peter', 'Gordon', '[{"email": "pgordon@hyatt.com", "type": "Work"}]', '[{"phone": "312-555-4301", "type": "Work"}]',
   'VP F&B Operations', 'Culinary', 3, NOW(), NOW()),
  (65, 'Sandra Newman', 'Sandra', 'Newman', '[{"email": "snewman@hyatt.com", "type": "Work"}]', '[{"phone": "312-555-4302", "type": "Work"}]',
   'Purchasing Director', 'Purchasing', 3, NOW(), NOW()),

  -- HCA Healthcare (Org 33) - Gary manages
  (66, 'Dr. Richard Nutrition', 'Richard', 'Nutrition', '[{"email": "rnutrition@hcahealthcare.com", "type": "Work"}]', '[{"phone": "615-555-4401", "type": "Work"}]',
   'Director of Nutrition Services', 'Clinical', 4, NOW(), NOW()),
  (67, 'Betty Cook', 'Betty', 'Cook', '[{"email": "bcook@hcahealthcare.com", "type": "Work"}]', '[{"phone": "615-555-4402", "type": "Work"}]',
   'Foodservice Manager', 'Operations', 4, NOW(), NOW()),

  -- Ascension (Org 34) - Gary manages
  (68, 'Sister Mary Frances', 'Mary', 'Frances', '[{"email": "mfrances@ascension.org", "type": "Work"}]', '[{"phone": "314-555-4501", "type": "Work"}]',
   'VP Support Services', 'Operations', 4, NOW(), NOW()),
  (69, 'Paul Dietary', 'Paul', 'Dietary', '[{"email": "pdietary@ascension.org", "type": "Work"}]', '[{"phone": "314-555-4502", "type": "Work"}]',
   'Regional Nutrition Director', 'Clinical', 4, NOW(), NOW()),

  -- Aramark (Org 35) - Dale manages
  (70, 'Chef Eric Martino', 'Eric', 'Martino', '[{"email": "emartino@aramark.com", "type": "Work"}]', '[{"phone": "215-555-4601", "type": "Work"}]',
   'VP Culinary - Higher Ed', 'Culinary', 5, NOW(), NOW()),
  (71, 'Janet Campus', 'Janet', 'Campus', '[{"email": "jcampus@aramark.com", "type": "Work"}]', '[{"phone": "215-555-4602", "type": "Work"}]',
   'Director of Purchasing', 'Purchasing', 5, NOW(), NOW()),

  -- Sodexo (Org 36) - Dale manages
  (72, 'Chef Philippe Bourguignon', 'Philippe', 'Bourguignon', '[{"email": "pbourguignon@sodexo.com", "type": "Work"}]', '[{"phone": "301-555-4701", "type": "Work"}]',
   'Global Executive Chef', 'Culinary', 5, NOW(), NOW()),
  (73, 'Catherine University', 'Catherine', 'University', '[{"email": "cuniversity@sodexo.com", "type": "Work"}]', '[{"phone": "301-555-4702", "type": "Work"}]',
   'Campus Dining Director', 'Operations', 5, NOW(), NOW()),

  -- Brookdale (Org 37) - Sue manages
  (74, 'Chef William Senior', 'William', 'Senior', '[{"email": "wsenior@brookdale.com", "type": "Work"}]', '[{"phone": "615-555-4801", "type": "Work"}]',
   'VP Culinary Services', 'Culinary', 6, NOW(), NOW()),
  (75, 'Helen Care', 'Helen', 'Care', '[{"email": "hcare@brookdale.com", "type": "Work"}]', '[{"phone": "615-555-4802", "type": "Work"}]',
   'Director of Dining', 'Operations', 6, NOW(), NOW()),

  -- Sunrise (Org 38) - Sue manages
  (76, 'Chef David Wellness', 'David', 'Wellness', '[{"email": "dwellness@sunriseseniorliving.com", "type": "Work"}]', '[{"phone": "703-555-4901", "type": "Work"}]',
   'Executive Chef', 'Culinary', 6, NOW(), NOW()),
  (77, 'Gloria Living', 'Gloria', 'Living', '[{"email": "gliving@sunriseseniorliving.com", "type": "Work"}]', '[{"phone": "703-555-4902", "type": "Work"}]',
   'Dining Services Manager', 'Operations', 6, NOW(), NOW()),

  -- Levy (Org 39) - Brent manages
  (78, 'Chef Larry Levy', 'Larry', 'Levy', '[{"email": "llevy@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-5001", "type": "Work"}]',
   'Founder & Chairman', 'Executive', 2, NOW(), NOW()),
  (79, 'Stadium Sam', 'Sam', 'Stadium', '[{"email": "sstadium@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-5002", "type": "Work"}]',
   'VP Purchasing', 'Purchasing', 2, NOW(), NOW()),
  (80, 'Arena Alice', 'Alice', 'Arena', '[{"email": "aarena@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-5003", "type": "Work"}]',
   'Corporate Chef', 'Culinary', 2, NOW(), NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('contacts', 'id'), 80, true);
