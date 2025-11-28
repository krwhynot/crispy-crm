-- ============================================================================
-- CRISPY-CRM SEED DATA
-- Generated: 2025-11-28
-- Version: 2.0 (Minimal - ~500 records)
-- ============================================================================
--
-- Contents:
--   - 6 Users (Full MFB team)
--   - 9 Principals (manufacturers)
--   - 10 Distributors
--   - 20 Customers (operators/restaurants)
--   - ~80 Contacts (2-3 per org)
--   - 36 Products (4 per principal)
--   - 50 Opportunities (even stage distribution)
--   - 150 Activities (all 13 types)
--   - 40 Tasks (including overdue)
--   - 75 Notes
--   - 10 Tags
--   - 28 Segments
--
-- Test credentials:
--   Admin: admin@test.com / password123
--   Rep:   brent@mfb.com / password123
--         michelle@mfb.com / password123
--         gary@mfb.com / password123
--         dale@mfb.com / password123
--         sue@mfb.com / password123
-- ============================================================================

-- Clean up existing data (in correct order for FK constraints)
TRUNCATE TABLE "public"."organizationNotes" CASCADE;
TRUNCATE TABLE "public"."contactNotes" CASCADE;
TRUNCATE TABLE "public"."opportunityNotes" CASCADE;
TRUNCATE TABLE "public"."tasks" CASCADE;
TRUNCATE TABLE "public"."activities" CASCADE;
TRUNCATE TABLE "public"."opportunity_products" CASCADE;
TRUNCATE TABLE "public"."opportunities" CASCADE;
TRUNCATE TABLE "public"."contact_tags" CASCADE;
TRUNCATE TABLE "public"."tags" CASCADE;
TRUNCATE TABLE "public"."contact_preferred_principals" CASCADE;
TRUNCATE TABLE "public"."contact_organizations" CASCADE;
TRUNCATE TABLE "public"."contacts" CASCADE;
TRUNCATE TABLE "public"."products" CASCADE;
TRUNCATE TABLE "public"."organizations" CASCADE;
TRUNCATE TABLE "public"."segments" CASCADE;
TRUNCATE TABLE "public"."sales" CASCADE;

-- Clean auth.users (local dev only - will fail gracefully in cloud)
DELETE FROM auth.users WHERE email IN (
  'admin@test.com',
  'brent@mfb.com',
  'michelle@mfb.com',
  'gary@mfb.com',
  'dale@mfb.com',
  'sue@mfb.com'
);

-- ============================================================================
-- PART 1: AUTH USERS (6 users)
-- ============================================================================
-- MFB Team Structure:
--   - Brent Gustafson (Admin/Owner)
--   - Michelle Gustafson (Manager)
--   - Gary (Sales Rep)
--   - Dale (Sales Rep)
--   - Sue (Sales Rep)
--   - Admin Test User (for testing)
-- ============================================================================

-- User UUIDs (fixed for referential integrity)
-- These will be referenced by the sales table
DO $$
DECLARE
  v_admin_uid UUID := 'a0000000-0000-0000-0000-000000000001';
  v_brent_uid UUID := 'b0000000-0000-0000-0000-000000000001';
  v_michelle_uid UUID := 'c0000000-0000-0000-0000-000000000001';
  v_gary_uid UUID := 'd0000000-0000-0000-0000-000000000001';
  v_dale_uid UUID := 'e0000000-0000-0000-0000-000000000001';
  v_sue_uid UUID := 'f0000000-0000-0000-0000-000000000001';
BEGIN
  -- Admin Test User
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_admin_uid,
    '00000000-0000-0000-0000-000000000000',
    'admin@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Brent Gustafson (Owner/Admin)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_brent_uid,
    '00000000-0000-0000-0000-000000000000',
    'brent@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Brent Gustafson"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Michelle Gustafson (Manager)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_michelle_uid,
    '00000000-0000-0000-0000-000000000000',
    'michelle@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Michelle Gustafson"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Gary (Sales Rep)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_gary_uid,
    '00000000-0000-0000-0000-000000000000',
    'gary@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Gary"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Dale (Sales Rep)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_dale_uid,
    '00000000-0000-0000-0000-000000000000',
    'dale@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Dale"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Sue (Sales Rep)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_sue_uid,
    '00000000-0000-0000-0000-000000000000',
    'sue@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Sue"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );
END $$;
-- ============================================================================
-- PART 2: SALES TABLE (6 reps)
-- ============================================================================
-- Links auth.users to the CRM sales rep profiles
-- is_admin determines admin access (no role column in schema)
-- ============================================================================

INSERT INTO "public"."sales" (id, user_id, first_name, last_name, email, phone, is_admin, avatar_url, created_at, updated_at)
VALUES
  -- Admin Test User (id=1)
  (1, 'a0000000-0000-0000-0000-000000000001', 'Admin', 'User', 'admin@test.com', '555-000-0001', true, NULL, NOW(), NOW()),

  -- Brent Gustafson - Owner/Admin (id=2)
  (2, 'b0000000-0000-0000-0000-000000000001', 'Brent', 'Gustafson', 'brent@mfbroker.com', '555-000-0002', true, NULL, NOW(), NOW()),

  -- Michelle Gustafson - Manager (id=3)
  (3, 'c0000000-0000-0000-0000-000000000001', 'Michelle', 'Gustafson', 'michelle@mfbroker.com', '555-000-0003', false, NULL, NOW(), NOW()),

  -- Gary - Sales Rep (id=4)
  (4, 'd0000000-0000-0000-0000-000000000001', 'Gary', 'Thompson', 'gary@mfbroker.com', '555-000-0004', false, NULL, NOW(), NOW()),

  -- Dale - Sales Rep (id=5)
  (5, 'e0000000-0000-0000-0000-000000000001', 'Dale', 'Anderson', 'dale@mfbroker.com', '555-000-0005', false, NULL, NOW(), NOW()),

  -- Sue - Sales Rep (id=6)
  (6, 'f0000000-0000-0000-0000-000000000001', 'Sue', 'Martinez', 'sue@mfbroker.com', '555-000-0006', false, NULL, NOW(), NOW());

-- Reset the sequence to continue after our inserts
SELECT setval(pg_get_serial_sequence('sales', 'id'), 6, true);
-- ============================================================================
-- PART 3: SEGMENTS (28 segments)
-- ============================================================================
-- Organization classification segments from original data
-- Uses UUID primary keys
-- ============================================================================

INSERT INTO "public"."segments" (id, name, created_at, created_by)
VALUES
  -- Restaurant Types
  ('11111111-0000-0000-0000-000000000001', 'Fine Dining', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000002', 'Casual Dining', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000003', 'Fast Casual', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000004', 'QSR (Quick Service)', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000005', 'Food Truck', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000006', 'Ghost Kitchen', NOW(), NULL),

  -- Hospitality
  ('11111111-0000-0000-0000-000000000007', 'Hotel', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000008', 'Resort', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000009', 'Casino', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000010', 'Convention Center', NOW(), NULL),

  -- Institutional
  ('11111111-0000-0000-0000-000000000011', 'Healthcare', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000012', 'Education K-12', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000013', 'Higher Education', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000014', 'Corporate Dining', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000015', 'Senior Living', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000016', 'Corrections', NOW(), NULL),

  -- Retail/Specialty
  ('11111111-0000-0000-0000-000000000017', 'Grocery', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000018', 'C-Store', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000019', 'Catering', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000020', 'Bakery', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000021', 'Coffee Shop', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000022', 'Bar/Nightclub', NOW(), NULL),

  -- Distribution/Manufacturing
  ('11111111-0000-0000-0000-000000000023', 'Broadline Distributor', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000024', 'Specialty Distributor', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000025', 'Redistribution', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000026', 'Manufacturer', NOW(), NULL),

  -- Other
  ('11111111-0000-0000-0000-000000000027', 'Sports/Entertainment', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000028', 'Travel/Transportation', NOW(), NULL);
-- ============================================================================
-- PART 4: PRINCIPALS (9 organizations)
-- ============================================================================
-- Food manufacturers that MFB represents
-- From PRD: McCRUM, SWAP, Rapid Rasoi, Lakeview Farms, Frico, Anchor,
--           Tattooed Chef, Litehouse, Custom Culinary
-- Organization IDs: 1-9
-- ============================================================================

INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, phone, email, website,
  address, city, state, postal_code, sales_id,
  notes, created_at, updated_at
)
VALUES
  -- 1. McCRUM (Idaho potatoes/fries) - Brent manages
  (1, 'McCRUM', 'principal', '11111111-0000-0000-0000-000000000026',
   '208-555-1001', 'sales@mccrum.com', 'https://mccrum.com',
   '123 Potato Lane', 'Idaho Falls', 'ID', '83401', 2,
   'Premium Idaho potato products including fries, hash browns, and specialty cuts. Family-owned since 1985.',
   NOW(), NOW()),

  -- 2. SWAP (Specialty ingredients) - Brent manages
  (2, 'SWAP', 'principal', '11111111-0000-0000-0000-000000000026',
   '312-555-1002', 'info@swapfoods.com', 'https://swapfoods.com',
   '456 Innovation Drive', 'Chicago', 'IL', '60601', 2,
   'Innovative plant-based and specialty food ingredients for foodservice.',
   NOW(), NOW()),

  -- 3. Rapid Rasoi (Indian cuisine) - Michelle manages
  (3, 'Rapid Rasoi', 'principal', '11111111-0000-0000-0000-000000000026',
   '510-555-1003', 'orders@rapidrasoi.com', 'https://rapidrasoi.com',
   '789 Spice Boulevard', 'Fremont', 'CA', '94536', 3,
   'Authentic Indian cuisine solutions - naan, curries, rice dishes, and appetizers.',
   NOW(), NOW()),

  -- 4. Lakeview Farms (Dairy/desserts) - Michelle manages
  (4, 'Lakeview Farms', 'principal', '11111111-0000-0000-0000-000000000026',
   '614-555-1004', 'foodservice@lakeviewfarms.com', 'https://lakeviewfarms.com',
   '321 Dairy Road', 'Columbus', 'OH', '43215', 3,
   'Premium dairy products and desserts including dips, parfaits, and cream-based items.',
   NOW(), NOW()),

  -- 5. Frico (Italian cheese) - Gary manages
  (5, 'Frico', 'principal', '11111111-0000-0000-0000-000000000026',
   '201-555-1005', 'usa@frico.it', 'https://frico.it',
   '555 Cheese Way', 'Newark', 'NJ', '07102', 4,
   'Authentic Italian cheeses - Parmesan, Gorgonzola, Asiago, and specialty varieties.',
   NOW(), NOW()),

  -- 6. Anchor (New Zealand dairy) - Gary manages
  (6, 'Anchor Food Professionals', 'principal', '11111111-0000-0000-0000-000000000026',
   '415-555-1006', 'foodservice@anchor.com', 'https://anchorfoodprofessionals.com',
   '888 Pacific Avenue', 'San Francisco', 'CA', '94102', 4,
   'New Zealand dairy products - butter, cream, UHT products for professional kitchens.',
   NOW(), NOW()),

  -- 7. Tattooed Chef (Plant-based) - Dale manages
  (7, 'Tattooed Chef', 'principal', '11111111-0000-0000-0000-000000000026',
   '310-555-1007', 'foodservice@tattooedchef.com', 'https://tattooedchef.com',
   '777 Vegan Street', 'Los Angeles', 'CA', '90001', 5,
   'Premium plant-based frozen meals and ingredients - bowls, burritos, and ready-to-eat options.',
   NOW(), NOW()),

  -- 8. Litehouse (Dressings/dips) - Dale manages
  (8, 'Litehouse', 'principal', '11111111-0000-0000-0000-000000000026',
   '208-555-1008', 'foodservice@litehousefoods.com', 'https://litehousefoods.com',
   '1109 Front Street', 'Sandpoint', 'ID', '83864', 5,
   'Premium dressings, dips, and cheese products. Known for blue cheese and ranch.',
   NOW(), NOW()),

  -- 9. Custom Culinary (Bases/sauces) - Sue manages
  (9, 'Custom Culinary', 'principal', '11111111-0000-0000-0000-000000000026',
   '630-555-1009', 'sales@customculinary.com', 'https://customculinary.com',
   '2555 Busse Road', 'Elk Grove Village', 'IL', '60007', 6,
   'Professional soup bases, sauces, gravies, and seasonings for foodservice operators.',
   NOW(), NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 9, true);
-- ============================================================================
-- PART 5: DISTRIBUTORS (10 organizations)
-- ============================================================================
-- Food distributors that carry principals' products
-- Mix of broadline and specialty distributors
-- Organization IDs: 10-19
-- ============================================================================

INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, phone, email, website,
  address, city, state, postal_code, sales_id,
  notes, created_at, updated_at
)
VALUES
  -- 10. Sysco (Broadline - National)
  (10, 'Sysco Corporation', 'distributor', '11111111-0000-0000-0000-000000000023',
   '281-555-2001', 'purchasing@sysco.com', 'https://sysco.com',
   '1390 Enclave Parkway', 'Houston', 'TX', '77077', 2,
   'Largest foodservice distributor in North America. Full broadline capabilities.',
   NOW(), NOW()),

  -- 11. US Foods (Broadline - National)
  (11, 'US Foods', 'distributor', '11111111-0000-0000-0000-000000000023',
   '847-555-2002', 'vendor@usfoods.com', 'https://usfoods.com',
   '9399 W Higgins Road', 'Rosemont', 'IL', '60018', 2,
   'Second largest foodservice distributor. Strong in chain restaurant segment.',
   NOW(), NOW()),

  -- 12. Performance Food Group (Broadline)
  (12, 'Performance Food Group (PFG)', 'distributor', '11111111-0000-0000-0000-000000000023',
   '804-555-2003', 'purchasing@pfgc.com', 'https://pfgc.com',
   '12500 West Creek Parkway', 'Richmond', 'VA', '23238', 3,
   'Third largest foodservice distributor. Strong regional presence.',
   NOW(), NOW()),

  -- 13. Gordon Food Service (Broadline)
  (13, 'Gordon Food Service (GFS)', 'distributor', '11111111-0000-0000-0000-000000000023',
   '616-555-2004', 'vendors@gfs.com', 'https://gfs.com',
   '1300 Gezon Parkway SW', 'Grand Rapids', 'MI', '49509', 3,
   'Family-owned broadline distributor. Strong in Midwest and Canada.',
   NOW(), NOW()),

  -- 14. Shamrock Foods (Regional - Southwest)
  (14, 'Shamrock Foods', 'distributor', '11111111-0000-0000-0000-000000000023',
   '602-555-2005', 'purchasing@shamrockfoods.com', 'https://shamrockfoods.com',
   '2540 N 29th Avenue', 'Phoenix', 'AZ', '85009', 4,
   'Regional broadline distributor focused on Southwest. Family-owned.',
   NOW(), NOW()),

  -- 15. Ben E. Keith (Regional - South)
  (15, 'Ben E. Keith Foods', 'distributor', '11111111-0000-0000-0000-000000000023',
   '817-555-2006', 'vendors@benekeith.com', 'https://benekeith.com',
   '601 E 7th Street', 'Fort Worth', 'TX', '76102', 4,
   'Regional distributor covering Texas and surrounding states.',
   NOW(), NOW()),

  -- 16. Reinhart Foodservice (Regional - Midwest)
  (16, 'Reinhart Foodservice', 'distributor', '11111111-0000-0000-0000-000000000023',
   '715-555-2007', 'purchasing@rfrsinc.com', 'https://rfrsinc.com',
   '2355 Oak Industrial Drive NE', 'Grand Rapids', 'MI', '49505', 5,
   'Regional broadline serving Upper Midwest. Part of Performance Food Group.',
   NOW(), NOW()),

  -- 17. Dot Foods (Redistribution)
  (17, 'Dot Foods', 'distributor', '11111111-0000-0000-0000-000000000025',
   '217-555-2008', 'purchasing@dotfoods.com', 'https://dotfoods.com',
   '1 Dot Way', 'Mt Sterling', 'IL', '62353', 5,
   'Largest food redistributor in North America. Ships to other distributors.',
   NOW(), NOW()),

  -- 18. European Imports (Specialty)
  (18, 'European Imports Ltd', 'distributor', '11111111-0000-0000-0000-000000000024',
   '312-555-2009', 'sales@eiltd.com', 'https://eiltd.com',
   '600 E Brook Drive', 'Arlington Heights', 'IL', '60005', 6,
   'Specialty distributor for European cheeses, meats, and gourmet items.',
   NOW(), NOW()),

  -- 19. Chefs Warehouse (Specialty)
  (19, 'The Chefs Warehouse', 'distributor', '11111111-0000-0000-0000-000000000024',
   '718-555-2010', 'vendors@chefswarehouse.com', 'https://chefswarehouse.com',
   '100 East Ridge Road', 'Ridgefield', 'CT', '06877', 6,
   'Specialty distributor for fine dining and upscale restaurants.',
   NOW(), NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 19, true);
-- ============================================================================
-- PART 6: CUSTOMERS (20 organizations)
-- ============================================================================
-- End customers - restaurants, hotels, institutions
-- Mix of segment types for comprehensive testing
-- Organization IDs: 20-39
-- ============================================================================

INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, phone, email, website,
  address, city, state, postal_code, sales_id,
  notes, created_at, updated_at
)
VALUES
  -- Fine Dining (3)
  (20, 'The Capital Grille', 'customer', '11111111-0000-0000-0000-000000000001',
   '312-555-3001', 'manager@capitalgrille.com', 'https://thecapitalgrille.com',
   '633 N Saint Clair Street', 'Chicago', 'IL', '60611', 2,
   'Upscale steakhouse chain. High-end proteins and premium sides.',
   NOW(), NOW()),

  (21, 'Ruth''s Chris Steak House', 'customer', '11111111-0000-0000-0000-000000000001',
   '504-555-3002', 'purchasing@ruthschris.com', 'https://ruthschris.com',
   '500 Tchoupitoulas Street', 'New Orleans', 'LA', '70130', 2,
   'Premium steakhouse chain. USDA Prime beef and upscale appetizers.',
   NOW(), NOW()),

  (22, 'Morton''s The Steakhouse', 'customer', '11111111-0000-0000-0000-000000000001',
   '312-555-3003', 'gm@mortons.com', 'https://mortons.com',
   '65 E Wacker Place', 'Chicago', 'IL', '60601', 3,
   'Landry''s owned steakhouse. Premium cuts and classic sides.',
   NOW(), NOW()),

  -- Casual Dining (4)
  (23, 'Chili''s Grill & Bar', 'customer', '11111111-0000-0000-0000-000000000002',
   '972-555-3004', 'procurement@brinker.com', 'https://chilis.com',
   '6820 LBJ Freeway', 'Dallas', 'TX', '75240', 3,
   'Brinker International casual dining. High volume, value-focused.',
   NOW(), NOW()),

  (24, 'Applebee''s', 'customer', '11111111-0000-0000-0000-000000000002',
   '913-555-3005', 'vendors@applebees.com', 'https://applebees.com',
   '8140 Ward Parkway', 'Kansas City', 'MO', '64114', 4,
   'Dine Brands casual dining. Neighborhood bar and grill concept.',
   NOW(), NOW()),

  (25, 'Buffalo Wild Wings', 'customer', '11111111-0000-0000-0000-000000000002',
   '612-555-3006', 'purchasing@buffalowildwings.com', 'https://buffalowildwings.com',
   '5500 Wayzata Blvd', 'Minneapolis', 'MN', '55416', 4,
   'Sports bar concept. High sauce and wing volume.',
   NOW(), NOW()),

  (26, 'Red Robin', 'customer', '11111111-0000-0000-0000-000000000002',
   '303-555-3007', 'foodsupply@redrobin.com', 'https://redrobin.com',
   '6312 S Fiddlers Green Circle', 'Greenwood Village', 'CO', '80111', 5,
   'Gourmet burger casual dining. Bottomless fries concept.',
   NOW(), NOW()),

  -- Fast Casual (3)
  (27, 'Panera Bread', 'customer', '11111111-0000-0000-0000-000000000003',
   '314-555-3008', 'suppliers@panerabread.com', 'https://panerabread.com',
   '3630 S Geyer Road', 'St. Louis', 'MO', '63127', 5,
   'JAB Holdings bakery-cafe chain. Clean ingredients focus.',
   NOW(), NOW()),

  (28, 'Chipotle Mexican Grill', 'customer', '11111111-0000-0000-0000-000000000003',
   '949-555-3009', 'purchasing@chipotle.com', 'https://chipotle.com',
   '610 Newport Center Drive', 'Newport Beach', 'CA', '92660', 6,
   'Fast casual Mexican. Food with Integrity sourcing program.',
   NOW(), NOW()),

  (29, 'Shake Shack', 'customer', '11111111-0000-0000-0000-000000000003',
   '212-555-3010', 'supply@shakeshack.com', 'https://shakeshack.com',
   '225 Varick Street', 'New York', 'NY', '10014', 6,
   'Premium fast casual burgers. 100% Angus beef, no hormones.',
   NOW(), NOW()),

  -- Hotels (3)
  (30, 'Marriott International', 'customer', '11111111-0000-0000-0000-000000000007',
   '301-555-3011', 'foodprocurement@marriott.com', 'https://marriott.com',
   '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 2,
   'Largest hotel company. Multiple brands and banquet operations.',
   NOW(), NOW()),

  (31, 'Hilton Hotels', 'customer', '11111111-0000-0000-0000-000000000007',
   '703-555-3012', 'purchasing@hilton.com', 'https://hilton.com',
   '7930 Jones Branch Drive', 'McLean', 'VA', '22102', 3,
   'Global hotel chain. Convention and banquet focus.',
   NOW(), NOW()),

  (32, 'Hyatt Hotels', 'customer', '11111111-0000-0000-0000-000000000007',
   '312-555-3013', 'foodsourcing@hyatt.com', 'https://hyatt.com',
   '150 N Riverside Plaza', 'Chicago', 'IL', '60606', 3,
   'Upscale hotel chain. Strong restaurant-in-hotel concepts.',
   NOW(), NOW()),

  -- Healthcare (2)
  (33, 'HCA Healthcare', 'customer', '11111111-0000-0000-0000-000000000011',
   '615-555-3014', 'dietary@hcahealthcare.com', 'https://hcahealthcare.com',
   'One Park Plaza', 'Nashville', 'TN', '37203', 4,
   'Largest for-profit hospital chain. High volume dietary operations.',
   NOW(), NOW()),

  (34, 'Ascension Health', 'customer', '11111111-0000-0000-0000-000000000011',
   '314-555-3015', 'nutrition@ascension.org', 'https://ascension.org',
   '4600 Edmundson Road', 'St. Louis', 'MO', '63134', 4,
   'Largest non-profit hospital system. Faith-based healthcare.',
   NOW(), NOW()),

  -- Education (2)
  (35, 'Aramark Higher Education', 'customer', '11111111-0000-0000-0000-000000000013',
   '215-555-3016', 'education@aramark.com', 'https://aramark.com',
   '2400 Market Street', 'Philadelphia', 'PA', '19103', 5,
   'Contract foodservice for universities. Retail and residential dining.',
   NOW(), NOW()),

  (36, 'Sodexo Campus Services', 'customer', '11111111-0000-0000-0000-000000000013',
   '301-555-3017', 'campus@sodexo.com', 'https://sodexo.com',
   '9801 Washingtonian Blvd', 'Gaithersburg', 'MD', '20878', 5,
   'Global contract foodservice. University and K-12 operations.',
   NOW(), NOW()),

  -- Senior Living (2)
  (37, 'Brookdale Senior Living', 'customer', '11111111-0000-0000-0000-000000000015',
   '615-555-3018', 'culinary@brookdale.com', 'https://brookdale.com',
   '111 Westwood Place', 'Brentwood', 'TN', '37027', 6,
   'Largest senior living operator. Multiple care levels.',
   NOW(), NOW()),

  (38, 'Sunrise Senior Living', 'customer', '11111111-0000-0000-0000-000000000015',
   '703-555-3019', 'dining@sunriseseniorliving.com', 'https://sunriseseniorliving.com',
   '7900 Westpark Drive', 'McLean', 'VA', '22102', 6,
   'Premium senior living communities. Chef-prepared dining.',
   NOW(), NOW()),

  -- Sports/Entertainment (1)
  (39, 'Levy Restaurants', 'customer', '11111111-0000-0000-0000-000000000027',
   '312-555-3020', 'procurement@levyrestaurants.com', 'https://levyrestaurants.com',
   '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 2,
   'Premium sports and entertainment foodservice. Stadiums and arenas.',
   NOW(), NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 39, true);
-- ============================================================================
-- PART 7: PRODUCTS (36 products - 4 per principal)
-- ============================================================================
-- Products from each principal manufacturer
-- Product IDs: 1-36
-- ============================================================================

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

-- Reset sequence
SELECT setval(pg_get_serial_sequence('products', 'id'), 36, true);
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
-- ============================================================================
-- PART 9: CONTACT-ORGANIZATION LINKS (80 links)
-- ============================================================================
-- Links contacts to their organizations
-- Each contact gets one primary organization link
-- ============================================================================

INSERT INTO "public"."contact_organizations" (
  id, contact_id, organization_id, is_primary, is_primary_decision_maker,
  relationship_start_date, notes, created_at, updated_at
)
VALUES
  -- Principal contacts (1-18) → Principals (1-9)
  (1, 1, 1, true, true, '2020-01-15', 'VP Sales - key decision maker', NOW(), NOW()),
  (2, 2, 1, true, false, '2021-06-01', 'Account manager for Midwest region', NOW(), NOW()),
  (3, 3, 2, true, true, '2019-03-10', 'CEO and founder', NOW(), NOW()),
  (4, 4, 2, true, false, '2022-02-20', 'Handles national accounts', NOW(), NOW()),
  (5, 5, 3, true, true, '2018-05-01', 'Owner - all decisions go through him', NOW(), NOW()),
  (6, 6, 3, true, false, '2020-09-15', 'Primary sales contact', NOW(), NOW()),
  (7, 7, 4, true, true, '2015-01-01', 'Company president', NOW(), NOW()),
  (8, 8, 4, true, false, '2022-04-10', 'Regional sales coverage', NOW(), NOW()),
  (9, 9, 5, true, true, '2017-08-20', 'US market lead', NOW(), NOW()),
  (10, 10, 5, true, false, '2023-01-15', 'Account executive', NOW(), NOW()),
  (11, 11, 6, true, true, '2016-11-01', 'Foodservice division head', NOW(), NOW()),
  (12, 12, 6, true, false, '2021-07-20', 'Key accounts focus', NOW(), NOW()),
  (13, 13, 7, true, true, '2017-01-01', 'Founder - brand visionary', NOW(), NOW()),
  (14, 14, 7, true, false, '2022-03-15', 'Foodservice channel lead', NOW(), NOW()),
  (15, 15, 8, true, true, '2014-06-01', 'VP Sales - pricing authority', NOW(), NOW()),
  (16, 16, 8, true, false, '2020-11-10', 'National account focus', NOW(), NOW()),
  (17, 17, 9, true, true, '2010-01-01', 'Company president', NOW(), NOW()),
  (18, 18, 9, true, false, '2019-08-25', 'Sales team leader', NOW(), NOW()),

  -- Distributor contacts (19-38) → Distributors (10-19)
  (19, 19, 10, true, true, '2018-04-01', 'Category manager - key buyer', NOW(), NOW()),
  (20, 20, 10, true, false, '2021-02-15', 'Senior buyer - supports category', NOW(), NOW()),
  (21, 21, 11, true, true, '2017-09-10', 'VP level - strategic decisions', NOW(), NOW()),
  (22, 22, 11, true, false, '2022-06-01', 'Category specialist', NOW(), NOW()),
  (23, 23, 12, true, true, '2019-01-20', 'Purchasing director', NOW(), NOW()),
  (24, 24, 12, true, false, '2021-11-05', 'Buyer for center of plate', NOW(), NOW()),
  (25, 25, 13, true, true, '2016-03-15', 'VP level procurement', NOW(), NOW()),
  (26, 26, 13, true, false, '2020-07-20', 'Merchandising role', NOW(), NOW()),
  (27, 27, 14, true, true, '2015-01-01', 'Family ownership - president', NOW(), NOW()),
  (28, 28, 14, true, false, '2022-08-10', 'Day-to-day buyer contact', NOW(), NOW()),
  (29, 29, 15, true, true, '2018-05-01', 'VP Sales', NOW(), NOW()),
  (30, 30, 15, true, false, '2021-03-25', 'Purchasing manager', NOW(), NOW()),
  (31, 31, 16, true, true, '2019-07-15', 'Procurement director', NOW(), NOW()),
  (32, 32, 16, true, false, '2023-02-01', 'Buyer', NOW(), NOW()),
  (33, 33, 17, true, true, '2017-11-10', 'Vendor relations VP', NOW(), NOW()),
  (34, 34, 17, true, false, '2020-06-20', 'Category manager', NOW(), NOW()),
  (35, 35, 18, true, true, '2016-08-01', 'President of company', NOW(), NOW()),
  (36, 36, 18, true, false, '2022-01-10', 'Specialty cheese buyer', NOW(), NOW()),
  (37, 37, 19, true, true, '2018-02-15', 'CEO', NOW(), NOW()),
  (38, 38, 19, true, false, '2021-09-05', 'Purchasing director', NOW(), NOW()),

  -- Customer contacts (39-80) → Customers (20-39)
  (39, 39, 20, true, true, '2019-05-01', 'Executive chef - menu decisions', NOW(), NOW()),
  (40, 40, 20, true, false, '2021-08-15', 'Purchasing director', NOW(), NOW()),
  (41, 41, 21, true, true, '2018-03-10', 'Corporate executive chef', NOW(), NOW()),
  (42, 42, 21, true, false, '2020-12-01', 'Supply chain VP', NOW(), NOW()),
  (43, 43, 22, true, true, '2019-11-20', 'Executive chef', NOW(), NOW()),
  (44, 44, 22, true, false, '2022-04-15', 'Purchasing manager', NOW(), NOW()),
  (45, 45, 23, true, true, '2017-07-01', 'VP culinary innovation', NOW(), NOW()),
  (46, 46, 23, true, false, '2021-01-25', 'Procurement director', NOW(), NOW()),
  (47, 47, 24, true, true, '2018-09-10', 'VP menu development', NOW(), NOW()),
  (48, 48, 24, true, false, '2022-07-20', 'Senior buyer', NOW(), NOW()),
  (49, 49, 25, true, true, '2019-04-15', 'Food innovation director', NOW(), NOW()),
  (50, 50, 25, true, false, '2021-06-05', 'Purchasing manager', NOW(), NOW()),
  (51, 51, 26, true, true, '2020-02-01', 'Corporate chef', NOW(), NOW()),
  (52, 52, 26, true, false, '2022-10-10', 'Supply chain manager', NOW(), NOW()),
  (53, 53, 27, true, true, '2017-12-15', 'Head baker', NOW(), NOW()),
  (54, 54, 27, true, false, '2020-04-20', 'VP procurement', NOW(), NOW()),
  (55, 55, 28, true, true, '2018-06-01', 'VP culinary', NOW(), NOW()),
  (56, 56, 28, true, false, '2021-11-15', 'Supply director', NOW(), NOW()),
  (57, 57, 29, true, true, '2019-08-10', 'Culinary director', NOW(), NOW()),
  (58, 58, 29, true, false, '2022-03-25', 'Purchasing manager', NOW(), NOW()),
  (59, 59, 30, true, true, '2016-01-15', 'VP global culinary', NOW(), NOW()),
  (60, 60, 30, true, false, '2019-09-01', 'Procurement director', NOW(), NOW()),
  (61, 61, 30, true, false, '2021-05-10', 'Regional F&B director', NOW(), NOW()),
  (62, 62, 31, true, true, '2017-04-20', 'Corporate executive chef', NOW(), NOW()),
  (63, 63, 31, true, false, '2020-10-05', 'VP supply chain', NOW(), NOW()),
  (64, 64, 32, true, true, '2018-07-15', 'VP F&B operations', NOW(), NOW()),
  (65, 65, 32, true, false, '2022-02-28', 'Purchasing director', NOW(), NOW()),
  (66, 66, 33, true, true, '2019-03-01', 'Nutrition services director', NOW(), NOW()),
  (67, 67, 33, true, false, '2021-07-10', 'Foodservice manager', NOW(), NOW()),
  (68, 68, 34, true, true, '2017-10-15', 'VP support services', NOW(), NOW()),
  (69, 69, 34, true, false, '2020-05-20', 'Regional nutrition director', NOW(), NOW()),
  (70, 70, 35, true, true, '2018-01-10', 'VP culinary higher ed', NOW(), NOW()),
  (71, 71, 35, true, false, '2021-08-05', 'Purchasing director', NOW(), NOW()),
  (72, 72, 36, true, true, '2016-12-01', 'Global executive chef', NOW(), NOW()),
  (73, 73, 36, true, false, '2020-03-15', 'Campus dining director', NOW(), NOW()),
  (74, 74, 37, true, true, '2019-06-20', 'VP culinary services', NOW(), NOW()),
  (75, 75, 37, true, false, '2022-01-25', 'Dining director', NOW(), NOW()),
  (76, 76, 38, true, true, '2018-11-10', 'Executive chef', NOW(), NOW()),
  (77, 77, 38, true, false, '2021-04-15', 'Dining services manager', NOW(), NOW()),
  (78, 78, 39, true, true, '2015-06-01', 'Founder and chairman', NOW(), NOW()),
  (79, 79, 39, true, false, '2020-09-10', 'VP purchasing', NOW(), NOW()),
  (80, 80, 39, true, false, '2022-06-20', 'Corporate chef', NOW(), NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('contact_organizations', 'id'), 80, true);
-- ============================================================================
-- PART 10: TAGS (10 tags) + CONTACT-TAG LINKS
-- ============================================================================
-- Contact classification tags
-- Plus links to assign tags to various contacts
-- ============================================================================

INSERT INTO "public"."tags" (id, name, color, created_at, updated_at)
VALUES
  (1, 'Decision Maker', '#10B981', NOW(), NOW()),      -- Green
  (2, 'Champion', '#3B82F6', NOW(), NOW()),            -- Blue
  (3, 'Gatekeeper', '#F59E0B', NOW(), NOW()),          -- Amber
  (4, 'Influencer', '#8B5CF6', NOW(), NOW()),          -- Purple
  (5, 'Technical', '#EC4899', NOW(), NOW()),           -- Pink
  (6, 'Budget Holder', '#EF4444', NOW(), NOW()),       -- Red
  (7, 'New Contact', '#06B6D4', NOW(), NOW()),         -- Cyan
  (8, 'VIP', '#F97316', NOW(), NOW()),                 -- Orange
  (9, 'Needs Follow-up', '#84CC16', NOW(), NOW()),     -- Lime
  (10, 'Cold Lead', '#6B7280', NOW(), NOW());          -- Gray

-- Reset sequence
SELECT setval(pg_get_serial_sequence('tags', 'id'), 10, true);

-- ============================================================================
-- CONTACT-TAG LINKS
-- ============================================================================
-- Assign tags to contacts based on their roles

INSERT INTO "public"."contact_tags" (id, contact_id, tag_id, created_at)
VALUES
  -- Decision Makers (executives and VPs)
  (1, 3, 1, NOW()),   -- Michael Chen (CEO)
  (2, 5, 1, NOW()),   -- Raj Patel (Owner)
  (3, 7, 1, NOW()),   -- Tom Harrison (President)
  (4, 13, 1, NOW()),  -- Sam Galletti (Founder)
  (5, 17, 1, NOW()),  -- Robert James (President)
  (6, 27, 1, NOW()),  -- Dan Shamrock (President)
  (7, 37, 1, NOW()),  -- Christopher Pappas (CEO)
  (8, 78, 1, NOW()),  -- Larry Levy (Chairman)

  -- Champions (our advocates inside accounts)
  (9, 1, 2, NOW()),   -- John McCrum
  (10, 11, 2, NOW()), -- David Thompson
  (11, 19, 2, NOW()), -- Mike Reynolds
  (12, 39, 2, NOW()), -- Andrew Sterling

  -- Gatekeepers (control access)
  (13, 20, 3, NOW()), -- Susan Clark
  (14, 46, 3, NOW()), -- Nancy Wright
  (15, 54, 3, NOW()), -- Rebecca Stone

  -- Influencers
  (16, 45, 4, NOW()), -- Kevin Brinker
  (17, 55, 4, NOW()), -- Chef Nate Appleman
  (18, 72, 4, NOW()), -- Chef Philippe

  -- Technical contacts
  (19, 41, 5, NOW()), -- Chef William Hayes
  (20, 43, 5, NOW()), -- Chef Antonio Russo
  (21, 57, 5, NOW()), -- Chef Mark Rosati

  -- Budget Holders
  (22, 21, 6, NOW()), -- James Patterson (VP)
  (23, 42, 6, NOW()), -- Sharon Wood (VP Supply Chain)
  (24, 59, 6, NOW()), -- Chef Antoine (VP Global)

  -- New Contacts (recently added)
  (25, 10, 7, NOW()), -- Anna Bianchi
  (26, 14, 7, NOW()), -- Nicole Green
  (27, 32, 7, NOW()), -- Diane Foster

  -- VIP (high-value relationships)
  (28, 25, 8, NOW()), -- Paul Gordon (GFS VP)
  (29, 33, 8, NOW()), -- Tracy Dot (Dot Foods VP)
  (30, 62, 8, NOW()), -- Chef Thomas Keller

  -- Needs Follow-up
  (31, 48, 9, NOW()), -- Christine Hall
  (32, 52, 9, NOW()), -- Kimberly Scott
  (33, 67, 9, NOW()), -- Betty Cook

  -- Cold Leads
  (34, 24, 10, NOW()), -- Mary Davis
  (35, 30, 10, NOW()), -- Amanda Torres
  (36, 44, 10, NOW()); -- Barbara Chen

-- Reset sequence
SELECT setval(pg_get_serial_sequence('contact_tags', 'id'), 36, true);
-- ============================================================================
-- PART 11: OPPORTUNITIES (50 opportunities)
-- ============================================================================
-- Even distribution across 7 stages (~7 per stage):
--   new_lead, initial_outreach, sample_visit_offered, feedback_logged,
--   demo_scheduled, closed_won, closed_lost
-- Links Principal + Distributor (optional) + Customer
-- Schema: principal_organization_id, customer_organization_id,
--         distributor_organization_id, opportunity_owner_id, contact_ids[]
-- ============================================================================

INSERT INTO "public"."opportunities" (
  id, name, principal_organization_id, customer_organization_id,
  distributor_organization_id, opportunity_owner_id,
  stage, contact_ids, estimated_close_date, description,
  created_at, updated_at
)
VALUES
  -- ========================================
  -- NEW_LEAD (7 opportunities)
  -- ========================================
  (1, 'McCRUM Fries - Capital Grille', 1, 20, 10, 2,
   'new_lead', ARRAY[39]::bigint[], CURRENT_DATE + INTERVAL '60 days',
   'Potential to replace current fry supplier with premium Idaho product',
   NOW() - INTERVAL '2 days', NOW()),

  (2, 'SWAP Plant-Based - Panera', 2, 27, 11, 3,
   'new_lead', ARRAY[53]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'Interest in plant-based options for menu expansion',
   NOW() - INTERVAL '5 days', NOW()),

  (3, 'Rapid Rasoi - Marriott Banquets', 3, 30, 12, 3,
   'new_lead', ARRAY[59]::bigint[], CURRENT_DATE + INTERVAL '90 days',
   'Indian cuisine for convention center catering',
   NOW() - INTERVAL '1 day', NOW()),

  (4, 'Lakeview Farms - Sunrise Senior', 4, 38, 13, 4,
   'new_lead', ARRAY[76]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'Dessert and dip products for senior dining',
   NOW() - INTERVAL '3 days', NOW()),

  (5, 'Frico Cheese - Mortons', 5, 22, 18, 4,
   'new_lead', ARRAY[43]::bigint[], CURRENT_DATE + INTERVAL '75 days',
   'Premium Italian cheeses for tableside presentations',
   NOW() - INTERVAL '4 days', NOW()),

  (6, 'Anchor Butter - Ruth''s Chris', 6, 21, 10, 5,
   'new_lead', ARRAY[41]::bigint[], CURRENT_DATE + INTERVAL '55 days',
   'NZ grass-fed butter for signature dishes',
   NOW() - INTERVAL '6 days', NOW()),

  (7, 'Custom Culinary - HCA Healthcare', 9, 33, 11, 6,
   'new_lead', ARRAY[66]::bigint[], CURRENT_DATE + INTERVAL '120 days',
   'Soup bases for hospital nutrition services',
   NOW() - INTERVAL '7 days', NOW()),

  -- ========================================
  -- INITIAL_OUTREACH (7 opportunities)
  -- ========================================
  (8, 'McCRUM Hash Browns - Hilton', 1, 31, 11, 2,
   'initial_outreach', ARRAY[62]::bigint[], CURRENT_DATE + INTERVAL '50 days',
   'Breakfast program hash brown supply',
   NOW() - INTERVAL '10 days', NOW()),

  (9, 'SWAP Oat Milk - Shake Shack', 2, 29, 19, 3,
   'initial_outreach', ARRAY[57]::bigint[], CURRENT_DATE + INTERVAL '40 days',
   'Barista oat milk for shake menu expansion',
   NOW() - INTERVAL '12 days', NOW()),

  (10, 'Rapid Rasoi Naan - Buffalo Wild Wings', 3, 25, 13, 3,
   'initial_outreach', ARRAY[49]::bigint[], CURRENT_DATE + INTERVAL '35 days',
   'Naan as appetizer/shareables addition',
   NOW() - INTERVAL '8 days', NOW()),

  (11, 'Lakeview Parfaits - Sodexo Campus', 4, 36, 12, 4,
   'initial_outreach', ARRAY[72]::bigint[], CURRENT_DATE + INTERVAL '60 days',
   'Grab-and-go parfaits for campus retail',
   NOW() - INTERVAL '14 days', NOW()),

  (12, 'Frico Parmesan - Levy Restaurants', 5, 39, 18, 4,
   'initial_outreach', ARRAY[78]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'Premium Parmesan for stadium premium suites',
   NOW() - INTERVAL '9 days', NOW()),

  (13, 'Tattooed Chef - Chipotle', 7, 28, 17, 5,
   'initial_outreach', ARRAY[55]::bigint[], CURRENT_DATE + INTERVAL '80 days',
   'Plant-based bowl ingredients',
   NOW() - INTERVAL '11 days', NOW()),

  (14, 'Litehouse Ranch - Red Robin', 8, 26, 13, 5,
   'initial_outreach', ARRAY[51]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'Premium ranch for bottomless fries upgrade',
   NOW() - INTERVAL '15 days', NOW()),

  -- ========================================
  -- SAMPLE_VISIT_OFFERED (7 opportunities)
  -- ========================================
  (15, 'McCRUM Wedges - Applebees', 1, 24, 11, 2,
   'sample_visit_offered', ARRAY[47]::bigint[], CURRENT_DATE + INTERVAL '25 days',
   'Seasoned wedges for new appetizer menu',
   NOW() - INTERVAL '20 days', NOW()),

  (16, 'SWAP Jackfruit - Aramark', 2, 35, 17, 3,
   'sample_visit_offered', ARRAY[70]::bigint[], CURRENT_DATE + INTERVAL '40 days',
   'BBQ jackfruit for campus sustainability initiatives',
   NOW() - INTERVAL '18 days', NOW()),

  (17, 'Rapid Rasoi Samosas - Hyatt', 3, 32, 12, 3,
   'sample_visit_offered', ARRAY[64]::bigint[], CURRENT_DATE + INTERVAL '35 days',
   'Appetizer samosas for hotel bars',
   NOW() - INTERVAL '22 days', NOW()),

  (18, 'Lakeview Dips - Brookdale', 4, 37, 13, 4,
   'sample_visit_offered', ARRAY[74]::bigint[], CURRENT_DATE + INTERVAL '20 days',
   'French onion dip for resident happy hours',
   NOW() - INTERVAL '17 days', NOW()),

  (19, 'Anchor Cream - Ascension', 6, 34, 11, 5,
   'sample_visit_offered', ARRAY[68]::bigint[], CURRENT_DATE + INTERVAL '50 days',
   'UHT cream for patient trays',
   NOW() - INTERVAL '25 days', NOW()),

  (20, 'Tattooed Chef Bowls - Panera', 7, 27, 17, 5,
   'sample_visit_offered', ARRAY[54]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'Plant-based Buddha bowls for catering',
   NOW() - INTERVAL '19 days', NOW()),

  (21, 'Custom Culinary Bases - Marriott', 9, 30, 10, 6,
   'sample_visit_offered', ARRAY[60]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'Gold Label bases for banquet soups',
   NOW() - INTERVAL '21 days', NOW()),

  -- ========================================
  -- FEEDBACK_LOGGED (7 opportunities)
  -- ========================================
  (22, 'McCRUM Diced - Chilis', 1, 23, 11, 2,
   'feedback_logged', ARRAY[45]::bigint[], CURRENT_DATE + INTERVAL '15 days',
   'Diced potatoes for loaded dishes - positive sample feedback',
   NOW() - INTERVAL '30 days', NOW()),

  (23, 'SWAP Cauliflower - Shake Shack', 2, 29, 19, 3,
   'feedback_logged', ARRAY[58]::bigint[], CURRENT_DATE + INTERVAL '20 days',
   'Cauliflower rice for low-carb options - testing complete',
   NOW() - INTERVAL '28 days', NOW()),

  (24, 'Rapid Rasoi Curry - Levy', 3, 39, 18, 3,
   'feedback_logged', ARRAY[79]::bigint[], CURRENT_DATE + INTERVAL '25 days',
   'Butter chicken for stadium Indian station - chef approved',
   NOW() - INTERVAL '32 days', NOW()),

  (25, 'Frico Gorgonzola - Capital Grille', 5, 20, 18, 4,
   'feedback_logged', ARRAY[40]::bigint[], CURRENT_DATE + INTERVAL '10 days',
   'Gorgonzola crumbles for wedge salad - pricing review',
   NOW() - INTERVAL '35 days', NOW()),

  (26, 'Anchor Butter - Morton''s', 6, 22, 10, 4,
   'feedback_logged', ARRAY[44]::bigint[], CURRENT_DATE + INTERVAL '18 days',
   'Clarified butter for steaks - quality confirmed',
   NOW() - INTERVAL '26 days', NOW()),

  (27, 'Litehouse Blue Cheese - BWW', 8, 25, 13, 5,
   'feedback_logged', ARRAY[50]::bigint[], CURRENT_DATE + INTERVAL '12 days',
   'Chunky blue cheese for wing dipping - volume pricing TBD',
   NOW() - INTERVAL '29 days', NOW()),

  (28, 'Custom Culinary Demi - Ruth''s Chris', 9, 21, 10, 6,
   'feedback_logged', ARRAY[42]::bigint[], CURRENT_DATE + INTERVAL '22 days',
   'Demi-glace for signature sauces - final approval pending',
   NOW() - INTERVAL '33 days', NOW()),

  -- ========================================
  -- DEMO_SCHEDULED (8 opportunities)
  -- ========================================
  (29, 'McCRUM Full Line - Sysco', 1, 10, NULL, 2,
   'demo_scheduled', ARRAY[19]::bigint[], CURRENT_DATE + INTERVAL '7 days',
   'Full product line review for Sysco distribution',
   NOW() - INTERVAL '40 days', NOW()),

  (30, 'SWAP Plant Line - US Foods', 2, 11, NULL, 3,
   'demo_scheduled', ARRAY[21]::bigint[], CURRENT_DATE + INTERVAL '10 days',
   'Complete plant-based lineup presentation',
   NOW() - INTERVAL '38 days', NOW()),

  (31, 'Rapid Rasoi Menu - GFS', 3, 13, NULL, 3,
   'demo_scheduled', ARRAY[25]::bigint[], CURRENT_DATE + INTERVAL '5 days',
   'Full Indian menu demo for regional distribution',
   NOW() - INTERVAL '42 days', NOW()),

  (32, 'Lakeview Desserts - Hilton Corp', 4, 31, 12, 4,
   'demo_scheduled', ARRAY[63]::bigint[], CURRENT_DATE + INTERVAL '14 days',
   'Dessert line for corporate standardization',
   NOW() - INTERVAL '36 days', NOW()),

  (33, 'Frico Italian Line - European Imports', 5, 18, NULL, 4,
   'demo_scheduled', ARRAY[35]::bigint[], CURRENT_DATE + INTERVAL '8 days',
   'Full Italian cheese portfolio review',
   NOW() - INTERVAL '45 days', NOW()),

  (34, 'Anchor Dairy - Chefs Warehouse', 6, 19, NULL, 5,
   'demo_scheduled', ARRAY[38]::bigint[], CURRENT_DATE + INTERVAL '12 days',
   'Premium dairy line for fine dining distribution',
   NOW() - INTERVAL '41 days', NOW()),

  (35, 'Tattooed Chef Retail - PFG', 7, 12, NULL, 5,
   'demo_scheduled', ARRAY[23]::bigint[], CURRENT_DATE + INTERVAL '9 days',
   'Retail-ready plant-based items for C-store',
   NOW() - INTERVAL '39 days', NOW()),

  (36, 'Litehouse Dressings - Ben E. Keith', 8, 15, NULL, 6,
   'demo_scheduled', ARRAY[29]::bigint[], CURRENT_DATE + INTERVAL '6 days',
   'Regional dressing distribution agreement',
   NOW() - INTERVAL '44 days', NOW()),

  -- ========================================
  -- CLOSED_WON (7 opportunities)
  -- ========================================
  (37, 'McCRUM Fries - Applebees National', 1, 24, 11, 2,
   'closed_won', ARRAY[48]::bigint[], CURRENT_DATE - INTERVAL '10 days',
   'National fry contract secured - 3 year agreement',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '10 days'),

  (38, 'SWAP Oat Milk - Panera Regional', 2, 27, 17, 3,
   'closed_won', ARRAY[53]::bigint[], CURRENT_DATE - INTERVAL '5 days',
   'Midwest region oat milk supply - pilot program',
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days'),

  (39, 'Rapid Rasoi - Aramark Campuses', 3, 35, 12, 3,
   'closed_won', ARRAY[71]::bigint[], CURRENT_DATE - INTERVAL '15 days',
   'Campus Indian station program - 25 universities',
   NOW() - INTERVAL '120 days', NOW() - INTERVAL '15 days'),

  (40, 'Lakeview Dips - Sodexo National', 4, 36, 13, 4,
   'closed_won', ARRAY[73]::bigint[], CURRENT_DATE - INTERVAL '20 days',
   'National dip contract for campus retail',
   NOW() - INTERVAL '100 days', NOW() - INTERVAL '20 days'),

  (41, 'Frico Parmesan - Sysco National', 5, 10, NULL, 4,
   'closed_won', ARRAY[20]::bigint[], CURRENT_DATE - INTERVAL '8 days',
   'National Parmesan distribution agreement',
   NOW() - INTERVAL '75 days', NOW() - INTERVAL '8 days'),

  (42, 'Anchor - GFS Regional', 6, 13, NULL, 5,
   'closed_won', ARRAY[26]::bigint[], CURRENT_DATE - INTERVAL '12 days',
   'Midwest butter and cream distribution',
   NOW() - INTERVAL '85 days', NOW() - INTERVAL '12 days'),

  (43, 'Custom Culinary - HCA National', 9, 33, 11, 6,
   'closed_won', ARRAY[67]::bigint[], CURRENT_DATE - INTERVAL '25 days',
   'Healthcare soup base standardization program',
   NOW() - INTERVAL '150 days', NOW() - INTERVAL '25 days'),

  -- ========================================
  -- CLOSED_LOST (7 opportunities)
  -- ========================================
  (44, 'McCRUM - Chipotle National', 1, 28, 17, 2,
   'closed_lost', ARRAY[56]::bigint[], CURRENT_DATE - INTERVAL '30 days',
   'Lost to incumbent - price sensitivity',
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '30 days'),

  (45, 'SWAP - BWW Pilot', 2, 25, 13, 3,
   'closed_lost', ARRAY[49]::bigint[], CURRENT_DATE - INTERVAL '45 days',
   'Menu direction changed - no plant-based focus',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days'),

  (46, 'Rapid Rasoi - Red Robin', 3, 26, 13, 3,
   'closed_lost', ARRAY[52]::bigint[], CURRENT_DATE - INTERVAL '20 days',
   'Decided against ethnic menu expansion',
   NOW() - INTERVAL '70 days', NOW() - INTERVAL '20 days'),

  (47, 'Lakeview - Shake Shack', 4, 29, 19, 4,
   'closed_lost', ARRAY[57]::bigint[], CURRENT_DATE - INTERVAL '35 days',
   'Brand fit concerns - looking for artisan suppliers',
   NOW() - INTERVAL '80 days', NOW() - INTERVAL '35 days'),

  (48, 'Tattooed Chef - Marriott', 7, 30, 12, 5,
   'closed_lost', ARRAY[61]::bigint[], CURRENT_DATE - INTERVAL '40 days',
   'Budget constraints - postponed plant-based initiative',
   NOW() - INTERVAL '95 days', NOW() - INTERVAL '40 days'),

  (49, 'Litehouse - Hyatt National', 8, 32, 12, 5,
   'closed_lost', ARRAY[65]::bigint[], CURRENT_DATE - INTERVAL '15 days',
   'Lost to competitor on pricing',
   NOW() - INTERVAL '110 days', NOW() - INTERVAL '15 days'),

  (50, 'Custom Culinary - Brookdale', 9, 37, 13, 6,
   'closed_lost', ARRAY[75]::bigint[], CURRENT_DATE - INTERVAL '50 days',
   'GPO contract locked with competitor',
   NOW() - INTERVAL '130 days', NOW() - INTERVAL '50 days');

-- Reset sequence
SELECT setval(pg_get_serial_sequence('opportunities', 'id'), 50, true);
-- ============================================================================
-- PART 12: ACTIVITIES (150 activities)
-- ============================================================================
-- All 13 activity types distributed across opportunities
-- Types: call, email, sample, meeting, demo, proposal, follow_up,
--        trade_show, site_visit, contract_review, check_in, social, note
-- ~12 activities per type
-- ============================================================================

INSERT INTO "public"."activities" (
  id, activity_type, type, subject, description, activity_date,
  duration_minutes, contact_id, organization_id, opportunity_id,
  follow_up_required, created_by, created_at, updated_at
)
VALUES
  -- ========================================
  -- CALL Activities (12)
  -- ========================================
  (1, 'call', 'call', 'Initial discovery call', 'Discussed current supplier situation and pain points', NOW() - INTERVAL '5 days', 30, 39, 20, 1, true, 2, NOW() - INTERVAL '5 days', NOW()),
  (2, 'call', 'call', 'Follow-up pricing discussion', 'Reviewed volume pricing tiers', NOW() - INTERVAL '10 days', 25, 53, 27, 2, false, 3, NOW() - INTERVAL '10 days', NOW()),
  (3, 'call', 'call', 'Introduction call with chef', 'Introduced product line capabilities', NOW() - INTERVAL '8 days', 20, 59, 30, 3, true, 3, NOW() - INTERVAL '8 days', NOW()),
  (4, 'call', 'call', 'Quarterly check-in', 'Reviewed account status and upcoming needs', NOW() - INTERVAL '15 days', 35, 76, 38, 4, false, 4, NOW() - INTERVAL '15 days', NOW()),
  (5, 'call', 'call', 'Pricing negotiation call', 'Discussed volume discounts and payment terms', NOW() - INTERVAL '12 days', 45, 43, 22, 5, true, 4, NOW() - INTERVAL '12 days', NOW()),
  (6, 'call', 'call', 'Product inquiry follow-up', 'Answered questions about product specs', NOW() - INTERVAL '3 days', 15, 41, 21, 6, false, 5, NOW() - INTERVAL '3 days', NOW()),
  (7, 'call', 'call', 'Budget discussion', 'Reviewed budget cycles and timing', NOW() - INTERVAL '20 days', 40, 66, 33, 7, true, 6, NOW() - INTERVAL '20 days', NOW()),
  (8, 'call', 'call', 'Sample coordination', 'Arranged sample delivery details', NOW() - INTERVAL '18 days', 20, 62, 31, 8, false, 2, NOW() - INTERVAL '18 days', NOW()),
  (9, 'call', 'call', 'Menu planning discussion', 'Discussed integration with current menu', NOW() - INTERVAL '22 days', 30, 57, 29, 9, true, 3, NOW() - INTERVAL '22 days', NOW()),
  (10, 'call', 'call', 'Contract renewal discussion', 'Reviewed terms for upcoming renewal', NOW() - INTERVAL '25 days', 35, 49, 25, 10, false, 3, NOW() - INTERVAL '25 days', NOW()),
  (11, 'call', 'call', 'New product introduction', 'Presented new product additions', NOW() - INTERVAL '28 days', 25, 72, 36, 11, true, 4, NOW() - INTERVAL '28 days', NOW()),
  (12, 'call', 'call', 'Competitive situation review', 'Discussed competitor offerings', NOW() - INTERVAL '30 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '30 days', NOW()),

  -- ========================================
  -- EMAIL Activities (12)
  -- ========================================
  (13, 'email', 'email', 'Product catalog sent', 'Sent comprehensive product catalog PDF', NOW() - INTERVAL '4 days', 5, 55, 28, 13, false, 5, NOW() - INTERVAL '4 days', NOW()),
  (14, 'email', 'email', 'Pricing proposal attached', 'Sent formal pricing proposal document', NOW() - INTERVAL '6 days', 10, 51, 26, 14, true, 5, NOW() - INTERVAL '6 days', NOW()),
  (15, 'email', 'email', 'Sample request confirmation', 'Confirmed sample shipment details', NOW() - INTERVAL '14 days', 5, 47, 24, 15, false, 2, NOW() - INTERVAL '14 days', NOW()),
  (16, 'email', 'email', 'Meeting recap sent', 'Sent summary of discussion points', NOW() - INTERVAL '16 days', 15, 70, 35, 16, true, 3, NOW() - INTERVAL '16 days', NOW()),
  (17, 'email', 'email', 'Spec sheets requested', 'Chef requested detailed specifications', NOW() - INTERVAL '19 days', 5, 64, 32, 17, false, 3, NOW() - INTERVAL '19 days', NOW()),
  (18, 'email', 'email', 'Introduction email', 'Initial outreach to new contact', NOW() - INTERVAL '7 days', 10, 74, 37, 18, true, 4, NOW() - INTERVAL '7 days', NOW()),
  (19, 'email', 'email', 'Quote follow-up', 'Following up on sent quotation', NOW() - INTERVAL '21 days', 5, 68, 34, 19, false, 5, NOW() - INTERVAL '21 days', NOW()),
  (20, 'email', 'email', 'Contract draft sent', 'Sent initial contract for review', NOW() - INTERVAL '23 days', 15, 54, 27, 20, true, 5, NOW() - INTERVAL '23 days', NOW()),
  (21, 'email', 'email', 'Thank you note', 'Post-meeting thank you', NOW() - INTERVAL '26 days', 5, 60, 30, 21, false, 6, NOW() - INTERVAL '26 days', NOW()),
  (22, 'email', 'email', 'Reference request', 'Sent customer reference contacts', NOW() - INTERVAL '29 days', 10, 45, 23, 22, false, 2, NOW() - INTERVAL '29 days', NOW()),
  (23, 'email', 'email', 'Product update notification', 'Informed about new product launch', NOW() - INTERVAL '32 days', 5, 58, 29, 23, true, 3, NOW() - INTERVAL '32 days', NOW()),
  (24, 'email', 'email', 'Scheduling confirmation', 'Confirmed upcoming demo date', NOW() - INTERVAL '35 days', 5, 79, 39, 24, false, 3, NOW() - INTERVAL '35 days', NOW()),

  -- ========================================
  -- SAMPLE Activities (12)
  -- ========================================
  (25, 'sample', 'sample', 'Initial product samples delivered', 'Sent 5 SKU variety pack for evaluation', NOW() - INTERVAL '17 days', 60, 40, 20, 25, true, 4, NOW() - INTERVAL '17 days', NOW()),
  (26, 'sample', 'sample', 'Chef evaluation samples', 'Sent samples for kitchen testing', NOW() - INTERVAL '24 days', 45, 44, 22, 26, true, 4, NOW() - INTERVAL '24 days', NOW()),
  (27, 'sample', 'sample', 'Menu development samples', 'Provided samples for R&D testing', NOW() - INTERVAL '27 days', 90, 50, 25, 27, false, 5, NOW() - INTERVAL '27 days', NOW()),
  (28, 'sample', 'sample', 'Re-sample after feedback', 'Sent adjusted formulation samples', NOW() - INTERVAL '31 days', 60, 42, 21, 28, true, 6, NOW() - INTERVAL '31 days', NOW()),
  (29, 'sample', 'sample', 'Full line samples for buyer', 'Complete product line for category review', NOW() - INTERVAL '34 days', 120, 19, 10, 29, false, 2, NOW() - INTERVAL '34 days', NOW()),
  (30, 'sample', 'sample', 'Competitor comparison samples', 'Side-by-side comparison pack', NOW() - INTERVAL '37 days', 75, 21, 11, 30, true, 3, NOW() - INTERVAL '37 days', NOW()),
  (31, 'sample', 'sample', 'Banquet menu samples', 'Samples for catering menu development', NOW() - INTERVAL '40 days', 90, 25, 13, 31, false, 3, NOW() - INTERVAL '40 days', NOW()),
  (32, 'sample', 'sample', 'Dessert line samples', 'Full dessert product sampling', NOW() - INTERVAL '33 days', 60, 63, 31, 32, true, 4, NOW() - INTERVAL '33 days', NOW()),
  (33, 'sample', 'sample', 'Cheese variety pack', 'Italian cheese collection samples', NOW() - INTERVAL '36 days', 45, 35, 18, 33, false, 4, NOW() - INTERVAL '36 days', NOW()),
  (34, 'sample', 'sample', 'Dairy products sample', 'Butter and cream sample kit', NOW() - INTERVAL '39 days', 60, 38, 19, 34, true, 5, NOW() - INTERVAL '39 days', NOW()),
  (35, 'sample', 'sample', 'Plant-based samples', 'Vegan product line samples', NOW() - INTERVAL '42 days', 75, 23, 12, 35, false, 5, NOW() - INTERVAL '42 days', NOW()),
  (36, 'sample', 'sample', 'Dressing sampler kit', 'Ranch and blue cheese variety', NOW() - INTERVAL '45 days', 45, 29, 15, 36, true, 6, NOW() - INTERVAL '45 days', NOW()),

  -- ========================================
  -- MEETING Activities (12)
  -- ========================================
  (37, 'meeting', 'meeting', 'Initial discovery meeting', 'In-person meeting to understand needs', NOW() - INTERVAL '48 days', 90, 48, 24, 37, true, 2, NOW() - INTERVAL '48 days', NOW()),
  (38, 'meeting', 'meeting', 'Product presentation meeting', 'Formal product line presentation', NOW() - INTERVAL '50 days', 120, 53, 27, 38, false, 3, NOW() - INTERVAL '50 days', NOW()),
  (39, 'meeting', 'meeting', 'Chef collaboration session', 'Joint menu development workshop', NOW() - INTERVAL '52 days', 180, 71, 35, 39, true, 3, NOW() - INTERVAL '52 days', NOW()),
  (40, 'meeting', 'meeting', 'Quarterly business review', 'QBR with key stakeholders', NOW() - INTERVAL '55 days', 90, 73, 36, 40, false, 4, NOW() - INTERVAL '55 days', NOW()),
  (41, 'meeting', 'meeting', 'Contract negotiation meeting', 'Terms and pricing discussion', NOW() - INTERVAL '58 days', 120, 20, 10, 41, true, 4, NOW() - INTERVAL '58 days', NOW()),
  (42, 'meeting', 'meeting', 'Distribution partnership meeting', 'Regional expansion discussion', NOW() - INTERVAL '60 days', 90, 26, 13, 42, false, 5, NOW() - INTERVAL '60 days', NOW()),
  (43, 'meeting', 'meeting', 'Healthcare compliance review', 'Dietary requirements discussion', NOW() - INTERVAL '62 days', 75, 67, 33, 43, true, 6, NOW() - INTERVAL '62 days', NOW()),
  (44, 'meeting', 'meeting', 'Executive introduction', 'C-level relationship building', NOW() - INTERVAL '65 days', 60, 56, 28, 44, false, 2, NOW() - INTERVAL '65 days', NOW()),
  (45, 'meeting', 'meeting', 'Menu innovation workshop', 'Collaborative menu development', NOW() - INTERVAL '68 days', 150, 49, 25, 45, true, 3, NOW() - INTERVAL '68 days', NOW()),
  (46, 'meeting', 'meeting', 'Regional sales meeting', 'Territory planning session', NOW() - INTERVAL '70 days', 90, 52, 26, 46, false, 3, NOW() - INTERVAL '70 days', NOW()),
  (47, 'meeting', 'meeting', 'Budget planning meeting', 'FY planning discussion', NOW() - INTERVAL '72 days', 120, 57, 29, 47, true, 4, NOW() - INTERVAL '72 days', NOW()),
  (48, 'meeting', 'meeting', 'Senior living food committee', 'Resident dining committee presentation', NOW() - INTERVAL '75 days', 90, 65, 32, 48, false, 4, NOW() - INTERVAL '75 days', NOW()),

  -- ========================================
  -- DEMO Activities (12)
  -- ========================================
  (49, 'demo', 'demo', 'Kitchen demo - fry station', 'Demonstrated fry preparation methods', NOW() - INTERVAL '38 days', 120, 39, 20, 1, true, 5, NOW() - INTERVAL '38 days', NOW()),
  (50, 'demo', 'demo', 'Plant-based cooking demo', 'Chef demonstration of versatility', NOW() - INTERVAL '41 days', 90, 53, 27, 2, false, 5, NOW() - INTERVAL '41 days', NOW()),
  (51, 'demo', 'demo', 'Indian cuisine demo', 'Full menu preparation demonstration', NOW() - INTERVAL '44 days', 180, 59, 30, 3, true, 6, NOW() - INTERVAL '44 days', NOW()),
  (52, 'demo', 'demo', 'Dessert service demo', 'Plating and presentation techniques', NOW() - INTERVAL '47 days', 75, 76, 38, 4, false, 2, NOW() - INTERVAL '47 days', NOW()),
  (53, 'demo', 'demo', 'Cheese cutting demo', 'Proper handling and portioning', NOW() - INTERVAL '49 days', 60, 43, 22, 5, true, 3, NOW() - INTERVAL '49 days', NOW()),
  (54, 'demo', 'demo', 'Butter applications demo', 'High-heat cooking techniques', NOW() - INTERVAL '51 days', 90, 41, 21, 6, false, 3, NOW() - INTERVAL '51 days', NOW()),
  (55, 'demo', 'demo', 'Soup base preparation', 'From-scratch soup demonstration', NOW() - INTERVAL '53 days', 120, 66, 33, 7, true, 4, NOW() - INTERVAL '53 days', NOW()),
  (56, 'demo', 'demo', 'Breakfast station demo', 'Hash brown preparation methods', NOW() - INTERVAL '56 days', 90, 62, 31, 8, false, 4, NOW() - INTERVAL '56 days', NOW()),
  (57, 'demo', 'demo', 'Oat milk barista demo', 'Latte art and steaming techniques', NOW() - INTERVAL '59 days', 60, 57, 29, 9, true, 5, NOW() - INTERVAL '59 days', NOW()),
  (58, 'demo', 'demo', 'Naan bread service demo', 'Proper reheating and presentation', NOW() - INTERVAL '61 days', 45, 49, 25, 10, false, 5, NOW() - INTERVAL '61 days', NOW()),
  (59, 'demo', 'demo', 'Campus dining demo', 'High-volume service techniques', NOW() - INTERVAL '64 days', 150, 72, 36, 11, true, 6, NOW() - INTERVAL '64 days', NOW()),
  (60, 'demo', 'demo', 'Stadium concessions demo', 'Quick-serve application demo', NOW() - INTERVAL '67 days', 120, 78, 39, 12, false, 2, NOW() - INTERVAL '67 days', NOW()),

  -- ========================================
  -- PROPOSAL Activities (11)
  -- ========================================
  (61, 'proposal', 'proposal', 'Initial pricing proposal', 'Presented volume-based pricing tiers', NOW() - INTERVAL '43 days', 30, 55, 28, 13, true, 3, NOW() - INTERVAL '43 days', NOW()),
  (62, 'proposal', 'proposal', 'Annual contract proposal', 'Full year commitment proposal', NOW() - INTERVAL '46 days', 45, 51, 26, 14, true, 3, NOW() - INTERVAL '46 days', NOW()),
  (63, 'proposal', 'proposal', 'Menu program proposal', 'Custom menu integration proposal', NOW() - INTERVAL '54 days', 60, 47, 24, 15, false, 4, NOW() - INTERVAL '54 days', NOW()),
  (64, 'proposal', 'proposal', 'Distribution agreement proposal', 'Territory exclusive proposal', NOW() - INTERVAL '57 days', 45, 70, 35, 16, true, 4, NOW() - INTERVAL '57 days', NOW()),
  (65, 'proposal', 'proposal', 'Revised pricing proposal', 'Adjusted terms after negotiation', NOW() - INTERVAL '63 days', 30, 64, 32, 17, false, 5, NOW() - INTERVAL '63 days', NOW()),
  (66, 'proposal', 'proposal', 'Multi-year proposal', '3-year partnership proposal', NOW() - INTERVAL '66 days', 60, 74, 37, 18, true, 5, NOW() - INTERVAL '66 days', NOW()),
  (67, 'proposal', 'proposal', 'Healthcare program proposal', 'Nutrition-compliant product proposal', NOW() - INTERVAL '69 days', 45, 68, 34, 19, false, 6, NOW() - INTERVAL '69 days', NOW()),
  (68, 'proposal', 'proposal', 'Pilot program proposal', 'Limited market test proposal', NOW() - INTERVAL '71 days', 30, 54, 27, 20, true, 2, NOW() - INTERVAL '71 days', NOW()),
  (69, 'proposal', 'proposal', 'Rebate program proposal', 'Volume incentive program', NOW() - INTERVAL '73 days', 45, 60, 30, 21, false, 2, NOW() - INTERVAL '73 days', NOW()),
  (70, 'proposal', 'proposal', 'Custom product proposal', 'Private label development', NOW() - INTERVAL '76 days', 60, 45, 23, 22, true, 3, NOW() - INTERVAL '76 days', NOW()),
  (71, 'proposal', 'proposal', 'Sustainability program proposal', 'Eco-friendly packaging option', NOW() - INTERVAL '78 days', 45, 58, 29, 23, false, 3, NOW() - INTERVAL '78 days', NOW()),

  -- ========================================
  -- FOLLOW_UP Activities (12)
  -- ========================================
  (72, 'follow_up', 'follow_up', 'Post-sample follow-up', 'Checked on sample evaluation status', NOW() - INTERVAL '11 days', 15, 79, 39, 24, false, 4, NOW() - INTERVAL '11 days', NOW()),
  (73, 'follow_up', 'follow_up', 'Quote status check', 'Following up on pending quotation', NOW() - INTERVAL '13 days', 10, 40, 20, 25, true, 4, NOW() - INTERVAL '13 days', NOW()),
  (74, 'follow_up', 'follow_up', 'Decision timeline follow-up', 'Checking on approval process', NOW() - INTERVAL '16 days', 20, 44, 22, 26, false, 5, NOW() - INTERVAL '16 days', NOW()),
  (75, 'follow_up', 'follow_up', 'Contract review follow-up', 'Status of legal review', NOW() - INTERVAL '20 days', 15, 50, 25, 27, true, 5, NOW() - INTERVAL '20 days', NOW()),
  (76, 'follow_up', 'follow_up', 'Budget approval follow-up', 'Checking budget cycle timing', NOW() - INTERVAL '23 days', 20, 42, 21, 28, false, 6, NOW() - INTERVAL '23 days', NOW()),
  (77, 'follow_up', 'follow_up', 'Demo scheduling follow-up', 'Confirming demo logistics', NOW() - INTERVAL '27 days', 10, 19, 10, 29, true, 2, NOW() - INTERVAL '27 days', NOW()),
  (78, 'follow_up', 'follow_up', 'Reference check follow-up', 'Did they contact references?', NOW() - INTERVAL '30 days', 15, 21, 11, 30, false, 2, NOW() - INTERVAL '30 days', NOW()),
  (79, 'follow_up', 'follow_up', 'Pilot results follow-up', 'Checking on test results', NOW() - INTERVAL '33 days', 25, 25, 13, 31, true, 3, NOW() - INTERVAL '33 days', NOW()),
  (80, 'follow_up', 'follow_up', 'Meeting action items', 'Following up on commitments', NOW() - INTERVAL '36 days', 15, 63, 31, 32, false, 3, NOW() - INTERVAL '36 days', NOW()),
  (81, 'follow_up', 'follow_up', 'Proposal review status', 'Has committee reviewed?', NOW() - INTERVAL '39 days', 20, 35, 18, 33, true, 4, NOW() - INTERVAL '39 days', NOW()),
  (82, 'follow_up', 'follow_up', 'Training scheduling', 'Following up on staff training', NOW() - INTERVAL '42 days', 15, 38, 19, 34, false, 4, NOW() - INTERVAL '42 days', NOW()),
  (83, 'follow_up', 'follow_up', 'Launch date confirmation', 'Confirming go-live timing', NOW() - INTERVAL '45 days', 20, 23, 12, 35, true, 5, NOW() - INTERVAL '45 days', NOW()),

  -- ========================================
  -- TRADE_SHOW Activities (11)
  -- ========================================
  (84, 'trade_show', 'trade_show', 'NRA Show - Booth visit', 'Met at National Restaurant Association Show', NOW() - INTERVAL '90 days', 30, 29, 15, 36, false, 5, NOW() - INTERVAL '90 days', NOW()),
  (85, 'trade_show', 'trade_show', 'IFDA Conference meeting', 'Distributor conference connection', NOW() - INTERVAL '95 days', 45, 48, 24, 37, true, 6, NOW() - INTERVAL '95 days', NOW()),
  (86, 'trade_show', 'trade_show', 'NACUFS Annual Conference', 'College foodservice show', NOW() - INTERVAL '100 days', 60, 53, 27, 38, false, 2, NOW() - INTERVAL '100 days', NOW()),
  (87, 'trade_show', 'trade_show', 'Healthcare Foodservice Show', 'AHF annual meeting', NOW() - INTERVAL '105 days', 45, 71, 35, 39, true, 2, NOW() - INTERVAL '105 days', NOW()),
  (88, 'trade_show', 'trade_show', 'MUFSO Conference', 'Multi-unit foodservice event', NOW() - INTERVAL '110 days', 30, 73, 36, 40, false, 3, NOW() - INTERVAL '110 days', NOW()),
  (89, 'trade_show', 'trade_show', 'Sysco Food Show', 'Regional distributor show', NOW() - INTERVAL '115 days', 90, 20, 10, 41, true, 3, NOW() - INTERVAL '115 days', NOW()),
  (90, 'trade_show', 'trade_show', 'US Foods Innovation Show', 'New product showcase', NOW() - INTERVAL '120 days', 75, 26, 13, 42, false, 4, NOW() - INTERVAL '120 days', NOW()),
  (91, 'trade_show', 'trade_show', 'Plant-Based World Expo', 'Specialty show connection', NOW() - INTERVAL '125 days', 45, 67, 33, 43, true, 4, NOW() - INTERVAL '125 days', NOW()),
  (92, 'trade_show', 'trade_show', 'Senior Living Executive Conference', 'Industry networking', NOW() - INTERVAL '130 days', 60, 56, 28, 44, false, 5, NOW() - INTERVAL '130 days', NOW()),
  (93, 'trade_show', 'trade_show', 'Western Foodservice Show', 'Regional expo meeting', NOW() - INTERVAL '135 days', 30, 49, 25, 45, true, 5, NOW() - INTERVAL '135 days', NOW()),
  (94, 'trade_show', 'trade_show', 'PMA Fresh Summit', 'Produce industry connection', NOW() - INTERVAL '140 days', 45, 52, 26, 46, false, 6, NOW() - INTERVAL '140 days', NOW()),

  -- ========================================
  -- SITE_VISIT Activities (11)
  -- ========================================
  (95, 'site_visit', 'site_visit', 'Plant tour - Idaho facility', 'Manufacturing facility visit', NOW() - INTERVAL '80 days', 240, 57, 29, 47, true, 2, NOW() - INTERVAL '80 days', NOW()),
  (96, 'site_visit', 'site_visit', 'Customer kitchen visit', 'On-site needs assessment', NOW() - INTERVAL '82 days', 120, 65, 32, 48, false, 2, NOW() - INTERVAL '82 days', NOW()),
  (97, 'site_visit', 'site_visit', 'Distribution center tour', 'Logistics capabilities review', NOW() - INTERVAL '84 days', 180, 39, 20, 1, true, 3, NOW() - INTERVAL '84 days', NOW()),
  (98, 'site_visit', 'site_visit', 'Corporate headquarters visit', 'Executive relationship building', NOW() - INTERVAL '86 days', 150, 53, 27, 2, false, 3, NOW() - INTERVAL '86 days', NOW()),
  (99, 'site_visit', 'site_visit', 'Test kitchen visit', 'R&D collaboration session', NOW() - INTERVAL '88 days', 180, 59, 30, 3, true, 4, NOW() - INTERVAL '88 days', NOW()),
  (100, 'site_visit', 'site_visit', 'Regional office visit', 'Team introduction meeting', NOW() - INTERVAL '91 days', 120, 76, 38, 4, false, 4, NOW() - INTERVAL '91 days', NOW()),
  (101, 'site_visit', 'site_visit', 'QA facility inspection', 'Quality assurance review', NOW() - INTERVAL '93 days', 240, 43, 22, 5, true, 5, NOW() - INTERVAL '93 days', NOW()),
  (102, 'site_visit', 'site_visit', 'New store opening support', 'Launch assistance visit', NOW() - INTERVAL '96 days', 300, 41, 21, 6, false, 5, NOW() - INTERVAL '96 days', NOW()),
  (103, 'site_visit', 'site_visit', 'Commissary kitchen tour', 'Central production review', NOW() - INTERVAL '98 days', 180, 66, 33, 7, true, 6, NOW() - INTERVAL '98 days', NOW()),
  (104, 'site_visit', 'site_visit', 'Stadium walkthrough', 'Concession operations review', NOW() - INTERVAL '101 days', 150, 62, 31, 8, false, 2, NOW() - INTERVAL '101 days', NOW()),
  (105, 'site_visit', 'site_visit', 'Hotel F&B operation visit', 'Full service assessment', NOW() - INTERVAL '103 days', 210, 57, 29, 9, true, 3, NOW() - INTERVAL '103 days', NOW()),

  -- ========================================
  -- CONTRACT_REVIEW Activities (11)
  -- ========================================
  (106, 'contract_review', 'contract_review', 'Initial contract review', 'First pass of terms', NOW() - INTERVAL '55 days', 60, 49, 25, 10, false, 3, NOW() - INTERVAL '55 days', NOW()),
  (107, 'contract_review', 'contract_review', 'Legal redlines review', 'Discussed legal changes', NOW() - INTERVAL '57 days', 45, 72, 36, 11, true, 4, NOW() - INTERVAL '57 days', NOW()),
  (108, 'contract_review', 'contract_review', 'Pricing schedule review', 'Volume tier confirmation', NOW() - INTERVAL '60 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '60 days', NOW()),
  (109, 'contract_review', 'contract_review', 'Terms negotiation', 'Payment terms discussion', NOW() - INTERVAL '62 days', 60, 55, 28, 13, true, 5, NOW() - INTERVAL '62 days', NOW()),
  (110, 'contract_review', 'contract_review', 'Service level review', 'SLA terms finalization', NOW() - INTERVAL '65 days', 45, 51, 26, 14, false, 5, NOW() - INTERVAL '65 days', NOW()),
  (111, 'contract_review', 'contract_review', 'Renewal terms review', 'Auto-renewal clause review', NOW() - INTERVAL '68 days', 30, 47, 24, 15, true, 6, NOW() - INTERVAL '68 days', NOW()),
  (112, 'contract_review', 'contract_review', 'Exclusivity discussion', 'Territory exclusivity terms', NOW() - INTERVAL '70 days', 45, 70, 35, 16, false, 2, NOW() - INTERVAL '70 days', NOW()),
  (113, 'contract_review', 'contract_review', 'Insurance requirements', 'Liability coverage review', NOW() - INTERVAL '73 days', 30, 64, 32, 17, true, 2, NOW() - INTERVAL '73 days', NOW()),
  (114, 'contract_review', 'contract_review', 'Quality standards review', 'Spec compliance terms', NOW() - INTERVAL '76 days', 45, 74, 37, 18, false, 3, NOW() - INTERVAL '76 days', NOW()),
  (115, 'contract_review', 'contract_review', 'Termination clause review', 'Exit terms discussion', NOW() - INTERVAL '79 days', 30, 68, 34, 19, true, 3, NOW() - INTERVAL '79 days', NOW()),
  (116, 'contract_review', 'contract_review', 'Final contract approval', 'Executive sign-off meeting', NOW() - INTERVAL '81 days', 60, 54, 27, 20, false, 4, NOW() - INTERVAL '81 days', NOW()),

  -- ========================================
  -- CHECK_IN Activities (12)
  -- ========================================
  (117, 'check_in', 'check_in', 'Monthly relationship check-in', 'Regular cadence call', NOW() - INTERVAL '2 days', 20, 60, 30, 21, false, 4, NOW() - INTERVAL '2 days', NOW()),
  (118, 'check_in', 'check_in', 'Post-implementation check-in', 'How is rollout going?', NOW() - INTERVAL '9 days', 25, 45, 23, 22, true, 5, NOW() - INTERVAL '9 days', NOW()),
  (119, 'check_in', 'check_in', 'Quarterly review prep', 'Pre-QBR check-in', NOW() - INTERVAL '15 days', 30, 58, 29, 23, false, 5, NOW() - INTERVAL '15 days', NOW()),
  (120, 'check_in', 'check_in', 'Holiday planning check-in', 'Seasonal inventory discussion', NOW() - INTERVAL '21 days', 20, 79, 39, 24, true, 6, NOW() - INTERVAL '21 days', NOW()),
  (121, 'check_in', 'check_in', 'New hire introduction', 'Meet new purchasing contact', NOW() - INTERVAL '26 days', 30, 40, 20, 25, false, 2, NOW() - INTERVAL '26 days', NOW()),
  (122, 'check_in', 'check_in', 'Service satisfaction check', 'Delivery performance review', NOW() - INTERVAL '32 days', 25, 44, 22, 26, true, 2, NOW() - INTERVAL '32 days', NOW()),
  (123, 'check_in', 'check_in', 'Menu change check-in', 'New menu planning status', NOW() - INTERVAL '38 days', 30, 50, 25, 27, false, 3, NOW() - INTERVAL '38 days', NOW()),
  (124, 'check_in', 'check_in', 'Budget cycle check-in', 'Next FY planning status', NOW() - INTERVAL '44 days', 35, 42, 21, 28, true, 3, NOW() - INTERVAL '44 days', NOW()),
  (125, 'check_in', 'check_in', 'Year-end review', 'Annual performance discussion', NOW() - INTERVAL '48 days', 45, 19, 10, 29, false, 4, NOW() - INTERVAL '48 days', NOW()),
  (126, 'check_in', 'check_in', 'Market update check-in', 'Competitive landscape review', NOW() - INTERVAL '52 days', 25, 21, 11, 30, true, 4, NOW() - INTERVAL '52 days', NOW()),
  (127, 'check_in', 'check_in', 'Executive sponsor check-in', 'Relationship maintenance', NOW() - INTERVAL '58 days', 30, 25, 13, 31, false, 5, NOW() - INTERVAL '58 days', NOW()),
  (128, 'check_in', 'check_in', 'Product feedback check-in', 'User satisfaction pulse', NOW() - INTERVAL '63 days', 20, 63, 31, 32, true, 5, NOW() - INTERVAL '63 days', NOW()),

  -- ========================================
  -- SOCIAL Activities (11)
  -- ========================================
  (129, 'social', 'social', 'Industry dinner networking', 'Dinner at NRA Show', NOW() - INTERVAL '92 days', 150, 35, 18, 33, false, 6, NOW() - INTERVAL '92 days', NOW()),
  (130, 'social', 'social', 'Golf outing', 'Customer appreciation golf', NOW() - INTERVAL '97 days', 300, 38, 19, 34, true, 2, NOW() - INTERVAL '97 days', NOW()),
  (131, 'social', 'social', 'Sporting event', 'Hosted at local MLB game', NOW() - INTERVAL '102 days', 240, 23, 12, 35, false, 2, NOW() - INTERVAL '102 days', NOW()),
  (132, 'social', 'social', 'Holiday party attendance', 'Customer holiday celebration', NOW() - INTERVAL '107 days', 180, 29, 15, 36, true, 3, NOW() - INTERVAL '107 days', NOW()),
  (133, 'social', 'social', 'Coffee catch-up', 'Informal relationship building', NOW() - INTERVAL '8 days', 45, 48, 24, 37, false, 3, NOW() - INTERVAL '8 days', NOW()),
  (134, 'social', 'social', 'Lunch meeting', 'Business lunch discussion', NOW() - INTERVAL '19 days', 90, 53, 27, 38, true, 4, NOW() - INTERVAL '19 days', NOW()),
  (135, 'social', 'social', 'Customer appreciation event', 'Annual thank you event', NOW() - INTERVAL '112 days', 180, 71, 35, 39, false, 4, NOW() - INTERVAL '112 days', NOW()),
  (136, 'social', 'social', 'Industry award dinner', 'Award ceremony networking', NOW() - INTERVAL '117 days', 210, 73, 36, 40, true, 5, NOW() - INTERVAL '117 days', NOW()),
  (137, 'social', 'social', 'Charity event', 'Industry charity fundraiser', NOW() - INTERVAL '122 days', 180, 20, 10, 41, false, 5, NOW() - INTERVAL '122 days', NOW()),
  (138, 'social', 'social', 'Supplier dinner', 'Executive dinner meeting', NOW() - INTERVAL '127 days', 150, 26, 13, 42, true, 6, NOW() - INTERVAL '127 days', NOW()),
  (139, 'social', 'social', 'Wine tasting event', 'Client entertainment event', NOW() - INTERVAL '132 days', 180, 67, 33, 43, false, 2, NOW() - INTERVAL '132 days', NOW()),

  -- ========================================
  -- NOTE Activities (11)
  -- ========================================
  (140, 'note', 'note', 'Competitor intelligence noted', 'Learned about competitor pricing', NOW() - INTERVAL '7 days', 5, 56, 28, 44, false, 2, NOW() - INTERVAL '7 days', NOW()),
  (141, 'note', 'note', 'Menu change notification', 'Customer updating menu Q2', NOW() - INTERVAL '14 days', 5, 49, 25, 45, true, 3, NOW() - INTERVAL '14 days', NOW()),
  (142, 'note', 'note', 'Budget timing noted', 'FY starts in July', NOW() - INTERVAL '22 days', 5, 52, 26, 46, false, 3, NOW() - INTERVAL '22 days', NOW()),
  (143, 'note', 'note', 'Key contact leaving', 'Primary contact retiring June', NOW() - INTERVAL '29 days', 10, 57, 29, 47, true, 4, NOW() - INTERVAL '29 days', NOW()),
  (144, 'note', 'note', 'Expansion plans noted', 'Opening 5 new locations', NOW() - INTERVAL '35 days', 5, 65, 32, 48, false, 4, NOW() - INTERVAL '35 days', NOW()),
  (145, 'note', 'note', 'Quality concern logged', 'Reported texture issue batch 2234', NOW() - INTERVAL '41 days', 10, 39, 20, 1, true, 5, NOW() - INTERVAL '41 days', NOW()),
  (146, 'note', 'note', 'Preferred communication noted', 'Prefers email over calls', NOW() - INTERVAL '47 days', 5, 53, 27, 2, false, 5, NOW() - INTERVAL '47 days', NOW()),
  (147, 'note', 'note', 'Decision process noted', 'Committee meets monthly', NOW() - INTERVAL '53 days', 5, 59, 30, 3, true, 6, NOW() - INTERVAL '53 days', NOW()),
  (148, 'note', 'note', 'Dietary requirements noted', 'Need allergen-free options', NOW() - INTERVAL '59 days', 10, 76, 38, 4, false, 2, NOW() - INTERVAL '59 days', NOW()),
  (149, 'note', 'note', 'Sustainability focus noted', 'Pursuing B-Corp certification', NOW() - INTERVAL '64 days', 5, 43, 22, 5, true, 3, NOW() - INTERVAL '64 days', NOW()),
  (150, 'note', 'note', 'Price sensitivity noted', 'Very cost-conscious buyer', NOW() - INTERVAL '69 days', 5, 41, 21, 6, false, 3, NOW() - INTERVAL '69 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('activities', 'id'), 150, true);
-- ============================================================================
-- PART 13: TASKS (40 tasks)
-- ============================================================================
-- Assigned to sales reps, linked to opportunities/contacts
-- Mix of: overdue, due today, due tomorrow, upcoming
-- Schema: id, title, description, due_date, reminder_date, completed,
--         completed_at, priority, contact_id, opportunity_id, sales_id
-- ============================================================================

INSERT INTO "public"."tasks" (
  id, title, due_date, contact_id, opportunity_id, sales_id, completed,
  created_at, updated_at
)
VALUES
  -- ========================================
  -- OVERDUE TASKS (10)
  -- ========================================
  (1, 'Follow up on sample delivery confirmation', CURRENT_DATE - INTERVAL '5 days', 39, 1, 2, false, NOW() - INTERVAL '10 days', NOW()),
  (2, 'Send revised pricing proposal', CURRENT_DATE - INTERVAL '3 days', 53, 2, 3, false, NOW() - INTERVAL '8 days', NOW()),
  (3, 'Schedule chef demo at kitchen', CURRENT_DATE - INTERVAL '7 days', 59, 3, 3, false, NOW() - INTERVAL '14 days', NOW()),
  (4, 'Review contract redlines from legal', CURRENT_DATE - INTERVAL '2 days', 76, 4, 4, false, NOW() - INTERVAL '5 days', NOW()),
  (5, 'Call back about volume commitments', CURRENT_DATE - INTERVAL '4 days', 43, 5, 4, false, NOW() - INTERVAL '9 days', NOW()),
  (6, 'Submit sample request form', CURRENT_DATE - INTERVAL '6 days', 41, 6, 5, false, NOW() - INTERVAL '12 days', NOW()),
  (7, 'Prepare presentation for committee', CURRENT_DATE - INTERVAL '1 day', 66, 7, 6, false, NOW() - INTERVAL '7 days', NOW()),
  (8, 'Send product spec sheets', CURRENT_DATE - INTERVAL '8 days', 62, 8, 2, false, NOW() - INTERVAL '15 days', NOW()),
  (9, 'Coordinate shipping logistics', CURRENT_DATE - INTERVAL '3 days', 57, 9, 3, false, NOW() - INTERVAL '6 days', NOW()),
  (10, 'Follow up on budget approval', CURRENT_DATE - INTERVAL '5 days', 49, 10, 3, false, NOW() - INTERVAL '10 days', NOW()),

  -- ========================================
  -- DUE TODAY (8)
  -- ========================================
  (11, 'Call to confirm demo attendance', CURRENT_DATE, 72, 11, 4, false, NOW() - INTERVAL '3 days', NOW()),
  (12, 'Email meeting recap', CURRENT_DATE, 78, 12, 4, false, NOW() - INTERVAL '1 day', NOW()),
  (13, 'Submit distributor application', CURRENT_DATE, 55, 13, 5, false, NOW() - INTERVAL '5 days', NOW()),
  (14, 'Review feedback survey results', CURRENT_DATE, 51, 14, 5, false, NOW() - INTERVAL '2 days', NOW()),
  (15, 'Prepare QBR presentation', CURRENT_DATE, 47, 15, 2, false, NOW() - INTERVAL '7 days', NOW()),
  (16, 'Send contract for signature', CURRENT_DATE, 70, 16, 3, false, NOW() - INTERVAL '4 days', NOW()),
  (17, 'Confirm sample arrival', CURRENT_DATE, 64, 17, 3, false, NOW() - INTERVAL '2 days', NOW()),
  (18, 'Update CRM with call notes', CURRENT_DATE, 74, 18, 4, false, NOW() - INTERVAL '1 day', NOW()),

  -- ========================================
  -- DUE TOMORROW (7)
  -- ========================================
  (19, 'Schedule site visit', CURRENT_DATE + INTERVAL '1 day', 68, 19, 5, false, NOW() - INTERVAL '3 days', NOW()),
  (20, 'Send case study materials', CURRENT_DATE + INTERVAL '1 day', 54, 20, 5, false, NOW() - INTERVAL '2 days', NOW()),
  (21, 'Prepare pricing comparison', CURRENT_DATE + INTERVAL '1 day', 60, 21, 6, false, NOW() - INTERVAL '4 days', NOW()),
  (22, 'Call about menu launch date', CURRENT_DATE + INTERVAL '1 day', 45, 22, 2, false, NOW() - INTERVAL '2 days', NOW()),
  (23, 'Email reference contacts', CURRENT_DATE + INTERVAL '1 day', 58, 23, 3, false, NOW() - INTERVAL '1 day', NOW()),
  (24, 'Review pilot results data', CURRENT_DATE + INTERVAL '1 day', 79, 24, 3, false, NOW() - INTERVAL '3 days', NOW()),
  (25, 'Finalize demo logistics', CURRENT_DATE + INTERVAL '1 day', 40, 25, 4, false, NOW() - INTERVAL '2 days', NOW()),

  -- ========================================
  -- UPCOMING THIS WEEK (8)
  -- ========================================
  (26, 'Prepare for trade show', CURRENT_DATE + INTERVAL '3 days', 44, 26, 4, false, NOW() - INTERVAL '5 days', NOW()),
  (27, 'Send thank you notes', CURRENT_DATE + INTERVAL '2 days', 50, 27, 5, false, NOW() - INTERVAL '1 day', NOW()),
  (28, 'Update opportunity stage', CURRENT_DATE + INTERVAL '4 days', 42, 28, 6, false, NOW() - INTERVAL '2 days', NOW()),
  (29, 'Schedule follow-up meeting', CURRENT_DATE + INTERVAL '3 days', 19, 29, 2, false, NOW() - INTERVAL '1 day', NOW()),
  (30, 'Prepare product samples', CURRENT_DATE + INTERVAL '5 days', 21, 30, 2, false, NOW() - INTERVAL '3 days', NOW()),
  (31, 'Review distributor agreement', CURRENT_DATE + INTERVAL '2 days', 25, 31, 3, false, NOW() - INTERVAL '1 day', NOW()),
  (32, 'Call about seasonal needs', CURRENT_DATE + INTERVAL '4 days', 63, 32, 3, false, NOW() - INTERVAL '2 days', NOW()),
  (33, 'Email introduction to new buyer', CURRENT_DATE + INTERVAL '3 days', 35, 33, 4, false, NOW() - INTERVAL '1 day', NOW()),

  -- ========================================
  -- UPCOMING NEXT WEEK (7)
  -- ========================================
  (34, 'Quarterly business review', CURRENT_DATE + INTERVAL '8 days', 38, 34, 5, false, NOW() - INTERVAL '5 days', NOW()),
  (35, 'Product training session', CURRENT_DATE + INTERVAL '10 days', 23, 35, 5, false, NOW() - INTERVAL '7 days', NOW()),
  (36, 'Contract renewal discussion', CURRENT_DATE + INTERVAL '7 days', 29, 36, 6, false, NOW() - INTERVAL '3 days', NOW()),
  (37, 'Menu planning meeting', CURRENT_DATE + INTERVAL '9 days', 48, 37, 2, false, NOW() - INTERVAL '4 days', NOW()),
  (38, 'Site visit preparation', CURRENT_DATE + INTERVAL '12 days', 53, 38, 3, false, NOW() - INTERVAL '6 days', NOW()),
  (39, 'Distributor show prep', CURRENT_DATE + INTERVAL '14 days', 71, 39, 4, false, NOW() - INTERVAL '10 days', NOW()),
  (40, 'Annual review preparation', CURRENT_DATE + INTERVAL '11 days', 73, 40, 4, false, NOW() - INTERVAL '8 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('tasks', 'id'), 40, true);
-- ============================================================================
-- PART 14: NOTES (75 notes)
-- ============================================================================
-- Distributed across:
--   - Contact Notes (30)
--   - Opportunity Notes (30)
--   - Organization Notes (15)
-- ============================================================================

-- ========================================
-- CONTACT NOTES (30)
-- ========================================
INSERT INTO "public"."contactNotes" (
  id, contact_id, text, sales_id, date, created_at, updated_at
)
VALUES
  (1, 1, 'John is the key decision maker for all foodservice accounts. Prefers phone calls over email.', 2, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
  (2, 3, 'Michael founded SWAP in 2019. Very passionate about sustainability and plant-based alternatives.', 3, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW()),
  (3, 5, 'Raj is the owner and has final say on all partnerships. Family business - son also involved.', 3, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW()),
  (4, 7, 'Tom has been president for 15 years. Very loyal to existing suppliers - need to build trust slowly.', 4, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW()),
  (5, 9, 'Marco travels frequently between US and Italy. Best to schedule calls on Tuesdays or Wednesdays.', 4, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW()),
  (6, 11, 'David is very data-driven. Always wants to see ROI analysis before making decisions.', 5, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW()),
  (7, 13, 'Sam is media-savvy - company often featured in press. Great for case studies if we win the business.', 5, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW()),
  (8, 15, 'Chris appreciates transparency. Had bad experience with previous supplier hiding issues.', 6, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW()),
  (9, 17, 'Robert is industry veteran - 35+ years in foodservice. Values relationships over price.', 6, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW()),
  (10, 19, 'Mike manages frozen category. Decision cycles at Sysco can take 6-9 months.', 2, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW()),
  (11, 21, 'James is VP level - needs executive engagement for strategic partnerships.', 2, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW()),
  (12, 25, 'Paul comes from GFS family ownership. Very community-oriented, supports local suppliers.', 3, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW()),
  (13, 27, 'Dan represents 3rd generation ownership. Company expanding into new territories.', 3, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW()),
  (14, 33, 'Tracy runs vendor relations - key gatekeeper for all new suppliers at Dot Foods.', 4, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW()),
  (15, 37, 'Christopher is CEO and very hands-on with product selection. Premium quality focus.', 4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW()),
  (16, 39, 'Andrew is executive chef - very particular about sourcing. Wants to visit our facilities.', 5, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW()),
  (17, 41, 'William has Michelin background. Quality standards are extremely high.', 5, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days', NOW()),
  (18, 45, 'Kevin leads culinary innovation - always looking for trending ingredients.', 6, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', NOW()),
  (19, 49, 'Derek is innovation focused. BWW testing new flavor profiles constantly.', 6, NOW() - INTERVAL '38 days', NOW() - INTERVAL '38 days', NOW()),
  (20, 55, 'Nate former James Beard chef. Food with Integrity sourcing is non-negotiable.', 2, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', NOW()),
  (21, 57, 'Mark built Shake Shack culinary program. Quality perception is everything.', 2, NOW() - INTERVAL '33 days', NOW() - INTERVAL '33 days', NOW()),
  (22, 59, 'Antoine oversees 7000+ properties globally. Decisions made at regional level first.', 3, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
  (23, 62, 'Thomas has James Beard awards. Reputation for innovation - good PR partner.', 3, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW()),
  (24, 66, 'Richard heads nutrition across 185 hospitals. Compliance requirements are strict.', 4, NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days', NOW()),
  (25, 70, 'Eric runs higher ed dining for 500+ campuses. Sustainability a key decision factor.', 4, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days', NOW()),
  (26, 72, 'Philippe trained in France - Bocuse lineage. Very exacting standards.', 5, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW()),
  (27, 74, 'William specializes in senior nutrition - therapeutic diet experience valuable.', 5, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW()),
  (28, 78, 'Larry founded Levy in 1978. Still very involved in strategic vendor decisions.', 6, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW()),
  (29, 40, 'Patricia handles purchasing decisions - reports to CFO on major contracts.', 6, NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW()),
  (30, 46, 'Nancy is procurement director - budget authority up to $500K.', 2, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('"contactNotes"', 'id'), 30, true);

-- ========================================
-- OPPORTUNITY NOTES (30)
-- ========================================
INSERT INTO "public"."opportunityNotes" (
  id, opportunity_id, text, sales_id, date, created_at, updated_at
)
VALUES
  (1, 1, 'Capital Grille currently using Lamb Weston. Price is competitive but quality concern reported.', 2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW()),
  (2, 2, 'Panera looking to expand plant-based options. Clean ingredient story resonates well.', 3, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW()),
  (3, 3, 'Marriott banquet team interested in Indian station concept. Need kosher/halal options.', 3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW()),
  (4, 4, 'Sunrise focused on texture for senior residents. Our softer products a good fit.', 4, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW()),
  (5, 5, 'Morton''s premium positioning aligns with our Italian import story.', 4, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW()),
  (6, 8, 'Hilton breakfast program is standardized nationally. Big volume opportunity.', 2, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW()),
  (7, 9, 'Shake Shack barista quality requirements are extremely high. Need perfect foam.', 3, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW()),
  (8, 10, 'BWW testing international flavors. Naan fits new shareables direction.', 3, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW()),
  (9, 15, 'Applebee''s testing premium sides. Seasoned wedges could replace current option.', 2, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW()),
  (10, 16, 'Aramark sustainability pledge - jackfruit BBQ fits perfectly.', 3, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW()),
  (11, 17, 'Hyatt bar snacks upgrade initiative. Samosas could work as premium option.', 3, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days', NOW()),
  (12, 18, 'Brookdale happy hour program looking for easy prep dips.', 4, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NOW()),
  (13, 22, 'Chili''s loaded potato skins program could use our diced potatoes.', 2, NOW() - INTERVAL '32 days', NOW() - INTERVAL '32 days', NOW()),
  (14, 23, 'Shake Shack health-conscious menu additions planned for Q2.', 3, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
  (15, 24, 'Levy wants Indian station at 3 stadiums initially. Pilot program.', 3, NOW() - INTERVAL '34 days', NOW() - INTERVAL '34 days', NOW()),
  (16, 25, 'Capital Grille wedge salad is signature dish. Gorgonzola quality critical.', 4, NOW() - INTERVAL '37 days', NOW() - INTERVAL '37 days', NOW()),
  (17, 26, 'Morton''s wants consistent butter quality. NZ grass-fed appeals.', 4, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW()),
  (18, 27, 'BWW blue cheese dipping sauce is iconic. Need to match their spec exactly.', 5, NOW() - INTERVAL '31 days', NOW() - INTERVAL '31 days', NOW()),
  (19, 28, 'Ruth''s Chris signature sauces use demi-glace base. Quality positioning.', 6, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', NOW()),
  (20, 29, 'Sysco wants exclusive distribution on new items. Negotiating territory.', 2, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days', NOW()),
  (21, 30, 'US Foods launching plant-forward initiative. Good timing for partnership.', 3, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', NOW()),
  (22, 31, 'GFS family ownership appreciates our family business story.', 3, NOW() - INTERVAL '44 days', NOW() - INTERVAL '44 days', NOW()),
  (23, 37, 'Applebee''s national fry contract won! 3-year term, annual pricing review.', 2, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW()),
  (24, 38, 'Panera pilot starting in 50 Midwest locations. Measuring pull-through.', 3, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW()),
  (25, 39, 'Aramark campuses rolling out Indian stations. Training curriculum created.', 3, NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days', NOW()),
  (26, 40, 'Sodexo national contract finalized. Implementation starts March.', 4, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW()),
  (27, 41, 'Sysco Parmesan distribution agreement signed. All OpCos activated.', 4, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW()),
  (28, 44, 'Chipotle lost - incumbent matched price, had existing supply chain integration.', 2, NOW() - INTERVAL '32 days', NOW() - INTERVAL '32 days', NOW()),
  (29, 45, 'BWW plant-based pilot cancelled - brand direction changed to meat focus.', 3, NOW() - INTERVAL '47 days', NOW() - INTERVAL '47 days', NOW()),
  (30, 49, 'Hyatt lost on price. Competitor came in 15% below our floor.', 5, NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('"opportunityNotes"', 'id'), 30, true);

-- ========================================
-- ORGANIZATION NOTES (15)
-- ========================================
INSERT INTO "public"."organizationNotes" (
  id, organization_id, text, sales_id, created_at, updated_at
)
VALUES
  (1, 1, 'McCRUM family-owned since 1985. Strong Idaho potato heritage. Quality-focused.', 2, NOW() - INTERVAL '60 days', NOW()),
  (2, 2, 'SWAP founded by food scientists. Innovation-first culture. VC-backed.', 3, NOW() - INTERVAL '55 days', NOW()),
  (3, 3, 'Rapid Rasoi started as catering company. Now national foodservice supplier.', 3, NOW() - INTERVAL '50 days', NOW()),
  (4, 10, 'Sysco is largest distributor - 68 operating companies. Long decision cycles.', 2, NOW() - INTERVAL '45 days', NOW()),
  (5, 11, 'US Foods strong in chain restaurant segment. CHEF''STORE retail locations.', 2, NOW() - INTERVAL '40 days', NOW()),
  (6, 13, 'GFS family-owned since 1897. Very values-driven organization.', 3, NOW() - INTERVAL '35 days', NOW()),
  (7, 17, 'Dot Foods is redistribution only - ships to other distributors not end users.', 4, NOW() - INTERVAL '30 days', NOW()),
  (8, 20, 'Capital Grille is Darden brand. Corporate purchasing decisions.', 5, NOW() - INTERVAL '25 days', NOW()),
  (9, 24, 'Applebee''s operated by Dine Brands. 1600+ locations in US.', 2, NOW() - INTERVAL '20 days', NOW()),
  (10, 28, 'Chipotle "Food with Integrity" - strict sourcing standards.', 3, NOW() - INTERVAL '15 days', NOW()),
  (11, 30, 'Marriott largest hotel company - 8000+ properties globally.', 4, NOW() - INTERVAL '10 days', NOW()),
  (12, 33, 'HCA Healthcare 185 hospitals - centralized purchasing decisions.', 5, NOW() - INTERVAL '8 days', NOW()),
  (13, 35, 'Aramark serves 500+ higher ed institutions. Big sustainability focus.', 6, NOW() - INTERVAL '6 days', NOW()),
  (14, 37, 'Brookdale largest senior living operator - 700+ communities.', 4, NOW() - INTERVAL '4 days', NOW()),
  (15, 39, 'Levy operates premium concessions at 200+ venues worldwide.', 5, NOW() - INTERVAL '2 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('"organizationNotes"', 'id'), 15, true);
