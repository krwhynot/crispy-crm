-- ============================================================================
-- CRISPY-CRM SEED DATA
-- Generated: 2025-11-28
-- Version: 2.1 (Enhanced with Audit Recommendations)
-- ============================================================================
--
-- Contents:
--   - 6 Users (Full MFB team)
--   - 9 Principals (manufacturers)
--   - 10 Distributors
--   - 20 Customers (operators/restaurants)
--   - ~80 Contacts (2-4 per org, 6 with MULTI-TAGS)
--   - 36 Products (4 per principal)
--   - 55 Opportunities (7 per stage + 5 EDGE CASES)
--   - 150 Activities (all 12 types)
--   - 40 Tasks (including overdue)
--   - 75 Notes
--   - 10 Tags
--   - 28 Segments
--
-- PERSONAS (for testing):
--   - Brent (id=2): POWER USER - 25+ organizations
--   - Admin (id=1): NEW REP - 0 organizations (empty state testing)
--   - Others: Standard 5-8 orgs each
--
-- EDGE CASES (opportunities 51-55):
--   - #51: STALE (45+ days no activity)
--   - #52: $0 VALUE (pilot/trial)
--   - #53: NULL DISTRIBUTOR (direct sale)
--   - #54: ANCIENT (6 months old, still new_lead)
--   - #55: FAST CLOSE (7-day cycle)
--
-- MULTI-TAG CONTACTS (for filtering/UI tests):
--   - Contact 3: Decision Maker + Budget Holder + VIP
--   - Contact 39: Champion + Decision Maker
--   - Contact 78: Decision Maker + Influencer + Technical
--   - Contact 40: Champion + Needs Follow-up
--   - Contact 60: Budget Holder + VIP
--   - Contact 70: Technical + Influencer
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
-- Note: contact_organizations, contact_tags, contact_preferred_principals were deprecated/removed
TRUNCATE TABLE "public"."organizationNotes" CASCADE;
TRUNCATE TABLE "public"."contactNotes" CASCADE;
TRUNCATE TABLE "public"."opportunityNotes" CASCADE;
TRUNCATE TABLE "public"."tasks" CASCADE;
TRUNCATE TABLE "public"."activities" CASCADE;
TRUNCATE TABLE "public"."opportunity_products" CASCADE;
TRUNCATE TABLE "public"."opportunities" CASCADE;
TRUNCATE TABLE "public"."tags" CASCADE;
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
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token
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
    '', '', '', '', '', '', '', ''
  );

  -- Brent Gustafson (Owner/Admin)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    role, aud, confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token
  ) VALUES (
    v_brent_uid, '00000000-0000-0000-0000-000000000000', 'brent@mfb.com',
    crypt('password123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"name": "Brent Gustafson"}',
    NOW(), NOW(), 'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );

  -- Michelle Gustafson (Manager)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    role, aud, confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token
  ) VALUES (
    v_michelle_uid, '00000000-0000-0000-0000-000000000000', 'michelle@mfb.com',
    crypt('password123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"name": "Michelle Gustafson"}',
    NOW(), NOW(), 'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );

  -- Gary (Sales Rep)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    role, aud, confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token
  ) VALUES (
    v_gary_uid, '00000000-0000-0000-0000-000000000000', 'gary@mfb.com',
    crypt('password123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"name": "Gary"}',
    NOW(), NOW(), 'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );

  -- Dale (Sales Rep)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    role, aud, confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token
  ) VALUES (
    v_dale_uid, '00000000-0000-0000-0000-000000000000', 'dale@mfb.com',
    crypt('password123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"name": "Dale"}',
    NOW(), NOW(), 'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );

  -- Sue (Sales Rep)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    role, aud, confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token
  ) VALUES (
    v_sue_uid, '00000000-0000-0000-0000-000000000000', 'sue@mfb.com',
    crypt('password123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"name": "Sue"}',
    NOW(), NOW(), 'authenticated', 'authenticated',
    '', '', '', '', '', '', '', ''
  );
END $$;
-- ============================================================================
-- PART 2: SALES TABLE (6 reps)
-- ============================================================================
-- Links auth.users to the CRM sales rep profiles
-- is_admin determines admin access (no role column in schema)
-- Note: auth.users trigger auto-creates basic sales records,
--       so we DELETE and re-INSERT with full details
-- ============================================================================

-- Delete auto-created records from trigger (will be recreated below)
DELETE FROM "public"."sales" WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001'
);

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
  -- ============================================================================
  -- POWER USER PERSONA: Brent (sales_id=2) manages 15 customers
  -- This tests UI rendering, pagination, and performance with heavy load
  -- ============================================================================

  -- Fine Dining (3) - ALL to Brent for Power User testing
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
   '65 E Wacker Place', 'Chicago', 'IL', '60601', 2,
   'Landry''s owned steakhouse. Premium cuts and classic sides.',
   NOW(), NOW()),

  -- Casual Dining (4) - Most to Brent
  (23, 'Chili''s Grill & Bar', 'customer', '11111111-0000-0000-0000-000000000002',
   '972-555-3004', 'procurement@brinker.com', 'https://chilis.com',
   '6820 LBJ Freeway', 'Dallas', 'TX', '75240', 2,
   'Brinker International casual dining. High volume, value-focused.',
   NOW(), NOW()),

  (24, 'Applebee''s', 'customer', '11111111-0000-0000-0000-000000000002',
   '913-555-3005', 'vendors@applebees.com', 'https://applebees.com',
   '8140 Ward Parkway', 'Kansas City', 'MO', '64114', 2,
   'Dine Brands casual dining. Neighborhood bar and grill concept.',
   NOW(), NOW()),

  (25, 'Buffalo Wild Wings', 'customer', '11111111-0000-0000-0000-000000000002',
   '612-555-3006', 'purchasing@buffalowildwings.com', 'https://buffalowildwings.com',
   '5500 Wayzata Blvd', 'Minneapolis', 'MN', '55416', 2,
   'Sports bar concept. High sauce and wing volume.',
   NOW(), NOW()),

  (26, 'Red Robin', 'customer', '11111111-0000-0000-0000-000000000002',
   '303-555-3007', 'foodsupply@redrobin.com', 'https://redrobin.com',
   '6312 S Fiddlers Green Circle', 'Greenwood Village', 'CO', '80111', 3,
   'Gourmet burger casual dining. Bottomless fries concept.',
   NOW(), NOW()),

  -- Fast Casual (3) - Most to Brent
  (27, 'Panera Bread', 'customer', '11111111-0000-0000-0000-000000000003',
   '314-555-3008', 'suppliers@panerabread.com', 'https://panerabread.com',
   '3630 S Geyer Road', 'St. Louis', 'MO', '63127', 2,
   'JAB Holdings bakery-cafe chain. Clean ingredients focus.',
   NOW(), NOW()),

  (28, 'Chipotle Mexican Grill', 'customer', '11111111-0000-0000-0000-000000000003',
   '949-555-3009', 'purchasing@chipotle.com', 'https://chipotle.com',
   '610 Newport Center Drive', 'Newport Beach', 'CA', '92660', 2,
   'Fast casual Mexican. Food with Integrity sourcing program.',
   NOW(), NOW()),

  (29, 'Shake Shack', 'customer', '11111111-0000-0000-0000-000000000003',
   '212-555-3010', 'supply@shakeshack.com', 'https://shakeshack.com',
   '225 Varick Street', 'New York', 'NY', '10014', 3,
   'Premium fast casual burgers. 100% Angus beef, no hormones.',
   NOW(), NOW()),

  -- Hotels (3) - Most to Brent
  (30, 'Marriott International', 'customer', '11111111-0000-0000-0000-000000000007',
   '301-555-3011', 'foodprocurement@marriott.com', 'https://marriott.com',
   '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 2,
   'Largest hotel company. Multiple brands and banquet operations.',
   NOW(), NOW()),

  (31, 'Hilton Hotels', 'customer', '11111111-0000-0000-0000-000000000007',
   '703-555-3012', 'purchasing@hilton.com', 'https://hilton.com',
   '7930 Jones Branch Drive', 'McLean', 'VA', '22102', 2,
   'Global hotel chain. Convention and banquet focus.',
   NOW(), NOW()),

  (32, 'Hyatt Hotels', 'customer', '11111111-0000-0000-0000-000000000007',
   '312-555-3013', 'foodsourcing@hyatt.com', 'https://hyatt.com',
   '150 N Riverside Plaza', 'Chicago', 'IL', '60606', 2,
   'Upscale hotel chain. Strong restaurant-in-hotel concepts.',
   NOW(), NOW()),

  -- Healthcare (2) - Split
  (33, 'HCA Healthcare', 'customer', '11111111-0000-0000-0000-000000000011',
   '615-555-3014', 'dietary@hcahealthcare.com', 'https://hcahealthcare.com',
   'One Park Plaza', 'Nashville', 'TN', '37203', 2,
   'Largest for-profit hospital chain. High volume dietary operations.',
   NOW(), NOW()),

  (34, 'Ascension Health', 'customer', '11111111-0000-0000-0000-000000000011',
   '314-555-3015', 'nutrition@ascension.org', 'https://ascension.org',
   '4600 Edmundson Road', 'St. Louis', 'MO', '63134', 4,
   'Largest non-profit hospital system. Faith-based healthcare.',
   NOW(), NOW()),

  -- Education (2) - Split
  (35, 'Aramark Higher Education', 'customer', '11111111-0000-0000-0000-000000000013',
   '215-555-3016', 'education@aramark.com', 'https://aramark.com',
   '2400 Market Street', 'Philadelphia', 'PA', '19103', 2,
   'Contract foodservice for universities. Retail and residential dining.',
   NOW(), NOW()),

  (36, 'Sodexo Campus Services', 'customer', '11111111-0000-0000-0000-000000000013',
   '301-555-3017', 'campus@sodexo.com', 'https://sodexo.com',
   '9801 Washingtonian Blvd', 'Gaithersburg', 'MD', '20878', 5,
   'Global contract foodservice. University and K-12 operations.',
   NOW(), NOW()),

  -- Senior Living (2) - Sue
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

  -- Sports/Entertainment (1) - Brent
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
-- ============================================================================
-- PART 10: TAGS (10 tags)
-- ============================================================================
-- Contact classification tags
-- Tags are assigned to contacts via contacts.tags bigint[] array
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
-- ASSIGN TAGS TO CONTACTS VIA UPDATE
-- ============================================================================
-- Tags are stored as bigint[] arrays in contacts.tags
-- Some contacts have MULTIPLE tags to test multi-role scenarios

-- Decision Makers (executives and VPs) - tag_id = 1
-- Note: Some get MULTIPLE tags below
UPDATE "public"."contacts" SET tags = ARRAY[1]::bigint[] WHERE id IN (5, 7, 13, 17, 27, 37);

-- Champions (our advocates inside accounts) - tag_id = 2
UPDATE "public"."contacts" SET tags = ARRAY[2]::bigint[] WHERE id IN (1, 11, 19);

-- Gatekeepers (control access) - tag_id = 3
UPDATE "public"."contacts" SET tags = ARRAY[3]::bigint[] WHERE id IN (20, 46, 54);

-- Influencers - tag_id = 4
UPDATE "public"."contacts" SET tags = ARRAY[4]::bigint[] WHERE id IN (45, 55, 72);

-- Technical contacts - tag_id = 5
UPDATE "public"."contacts" SET tags = ARRAY[5]::bigint[] WHERE id IN (41, 43, 57);

-- Budget Holders - tag_id = 6
UPDATE "public"."contacts" SET tags = ARRAY[6]::bigint[] WHERE id IN (21, 42, 59);

-- New Contacts (recently added) - tag_id = 7
UPDATE "public"."contacts" SET tags = ARRAY[7]::bigint[] WHERE id IN (10, 14, 32);

-- VIP (high-value relationships) - tag_id = 8
UPDATE "public"."contacts" SET tags = ARRAY[8]::bigint[] WHERE id IN (25, 33, 62);

-- Needs Follow-up - tag_id = 9
UPDATE "public"."contacts" SET tags = ARRAY[9]::bigint[] WHERE id IN (48, 52, 67);

-- Cold Leads - tag_id = 10
UPDATE "public"."contacts" SET tags = ARRAY[10]::bigint[] WHERE id IN (24, 30, 44);

-- ============================================================================
-- MULTI-TAG CONTACTS (testing multiple roles per contact)
-- ============================================================================
-- These contacts have 2-3 tags to test UI rendering and filtering

-- Contact 3: Decision Maker + Budget Holder + VIP (C-suite executive)
UPDATE "public"."contacts" SET tags = ARRAY[1, 6, 8]::bigint[] WHERE id = 3;

-- Contact 39: Champion + Decision Maker (internal advocate who is also exec)
UPDATE "public"."contacts" SET tags = ARRAY[1, 2]::bigint[] WHERE id = 39;

-- Contact 78: Decision Maker + Influencer + Technical (tech-savvy VP)
UPDATE "public"."contacts" SET tags = ARRAY[1, 4, 5]::bigint[] WHERE id = 78;

-- Contact 40: Champion + Needs Follow-up (advocate we need to reconnect with)
UPDATE "public"."contacts" SET tags = ARRAY[2, 9]::bigint[] WHERE id = 40;

-- Contact 60: Budget Holder + VIP (key financial decision maker)
UPDATE "public"."contacts" SET tags = ARRAY[6, 8]::bigint[] WHERE id = 60;

-- Contact 70: Technical + Influencer (technical buyer with influence)
UPDATE "public"."contacts" SET tags = ARRAY[4, 5]::bigint[] WHERE id = 70;
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
   NOW() - INTERVAL '130 days', NOW() - INTERVAL '50 days'),

  -- ========================================
  -- EDGE CASE OPPORTUNITIES (5 additional)
  -- ========================================
  -- For testing special scenarios

  -- 51: STALE opportunity - no activity for 45+ days (reports testing)
  (51, 'Litehouse Dressings - Stale Deal', 8, 24, 11, 5,
   'sample_visit_offered', ARRAY[47]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'STALE: No activity in 45 days - for testing stale opportunity reports',
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days'),

  -- 52: $0 VALUE - pilot/trial opportunity (no revenue)
  (52, 'SWAP Plant Trial - Zero Value Pilot', 2, 29, NULL, 3,
   'feedback_logged', ARRAY[57]::bigint[], CURRENT_DATE + INTERVAL '14 days',
   'PILOT PROGRAM: Free trial with no revenue - tests $0 value handling',
   NOW() - INTERVAL '20 days', NOW()),

  -- 53: DIRECT SALE - no distributor (customer buys direct from principal)
  (53, 'McCRUM Direct - No Distributor', 1, 39, NULL, 2,
   'initial_outreach', ARRAY[78]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'DIRECT SALE: Customer buying directly from manufacturer, no distributor involved',
   NOW() - INTERVAL '8 days', NOW()),

  -- 54: VERY OLD - created 6 months ago, still in early stage
  (54, 'Frico Cheese - Ancient Deal', 5, 34, 18, 4,
   'new_lead', ARRAY[68]::bigint[], CURRENT_DATE + INTERVAL '90 days',
   'ANCIENT: Created 6 months ago, still new_lead - tests long-running deals',
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '30 days'),

  -- 55: FAST CLOSE - moved through stages in 7 days
  (55, 'Anchor Express - Quick Win', 6, 20, 10, 5,
   'closed_won', ARRAY[40]::bigint[], CURRENT_DATE - INTERVAL '2 days',
   'FAST CLOSE: Entire sales cycle in 7 days - tests velocity metrics',
   NOW() - INTERVAL '9 days', NOW() - INTERVAL '2 days');

-- Reset sequence
SELECT setval(pg_get_serial_sequence('opportunities', 'id'), 55, true);

-- ============================================================================
-- CAMPAIGN ASSIGNMENTS
-- ============================================================================
-- Realistic campaign groupings for MFB food broker business
-- Campaigns enable filtering and grouping in the Opportunity Campaign view
-- ============================================================================

-- Q1 2025 Premium Proteins Push (steakhouse focus - 6 opps)
UPDATE opportunities SET campaign = 'Q1 2025 Premium Proteins Push'
WHERE id IN (1, 5, 6, 25, 26, 28);

-- Plant-Based Initiative 2025 (plant-based products - 5 opps)
UPDATE opportunities SET campaign = 'Plant-Based Initiative 2025'
WHERE id IN (2, 13, 20, 45, 52);

-- Healthcare Foodservice Expansion (3 opps)
UPDATE opportunities SET campaign = 'Healthcare Foodservice Expansion'
WHERE id IN (7, 19, 43);

-- Hotel & Hospitality Program (7 opps)
UPDATE opportunities SET campaign = 'Hotel & Hospitality Program'
WHERE id IN (3, 8, 17, 21, 32, 48, 49);

-- Grand Rapids Trade Show 2024 (4 opps)
UPDATE opportunities SET campaign = 'Grand Rapids Trade Show 2024'
WHERE id IN (10, 14, 27, 46);

-- National Accounts Q4 (big distributor deals - 9 opps)
UPDATE opportunities SET campaign = 'National Accounts Q4'
WHERE id IN (29, 30, 31, 33, 34, 35, 36, 41, 42);
-- ============================================================================
-- PART 12: ACTIVITIES (150 activities)
-- ============================================================================
-- Two activity_type values: 'interaction' (opportunity-linked) or 'engagement'
-- Type column: call, email, meeting, demo, proposal, follow_up,
--              trade_show, site_visit, contract_review, check_in, social, note
-- All opportunity-linked activities MUST use activity_type='interaction'
-- CRITICAL: Contact must belong to the opportunity's customer organization
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
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (1, 'interaction', 'call', 'Initial discovery call', 'Discussed current supplier situation and pain points', NOW() - INTERVAL '5 days', 30, 39, 20, 1, true, 2, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (2, 'interaction', 'call', 'Follow-up pricing discussion', 'Reviewed volume pricing tiers', NOW() - INTERVAL '10 days', 25, 53, 27, 2, false, 3, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (3, 'interaction', 'call', 'Introduction call with chef', 'Introduced product line capabilities', NOW() - INTERVAL '8 days', 20, 59, 30, 3, true, 3, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (4, 'interaction', 'call', 'Quarterly check-in', 'Reviewed account status and upcoming needs', NOW() - INTERVAL '15 days', 35, 76, 38, 4, false, 4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (5, 'interaction', 'call', 'Pricing negotiation call', 'Discussed volume discounts and payment terms', NOW() - INTERVAL '12 days', 45, 43, 22, 5, true, 4, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (6, 'interaction', 'call', 'Product inquiry follow-up', 'Answered questions about product specs', NOW() - INTERVAL '3 days', 15, 41, 21, 6, false, 5, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (7, 'interaction', 'call', 'Budget discussion', 'Reviewed budget cycles and timing', NOW() - INTERVAL '20 days', 40, 66, 33, 7, true, 6, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (8, 'interaction', 'call', 'Sample coordination', 'Arranged sample delivery details', NOW() - INTERVAL '18 days', 20, 62, 31, 8, false, 2, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (9, 'interaction', 'call', 'Menu planning discussion', 'Discussed integration with current menu', NOW() - INTERVAL '22 days', 30, 57, 29, 9, true, 3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (10, 'interaction', 'call', 'Contract renewal discussion', 'Reviewed terms for upcoming renewal', NOW() - INTERVAL '25 days', 35, 49, 25, 10, false, 3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (11, 'interaction', 'call', 'New product introduction', 'Presented new product additions', NOW() - INTERVAL '28 days', 25, 72, 36, 11, true, 4, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (12, 'interaction', 'call', 'Competitive situation review', 'Discussed competitor offerings', NOW() - INTERVAL '30 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '30 days', NOW()),

  -- ========================================
  -- EMAIL Activities (12)
  -- ========================================
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (13, 'interaction', 'email', 'Product catalog sent', 'Sent comprehensive product catalog PDF', NOW() - INTERVAL '4 days', 5, 55, 28, 13, false, 5, NOW() - INTERVAL '4 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (14, 'interaction', 'email', 'Pricing proposal attached', 'Sent formal pricing proposal document', NOW() - INTERVAL '6 days', 10, 51, 26, 14, true, 5, NOW() - INTERVAL '6 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (15, 'interaction', 'email', 'Sample request confirmation', 'Confirmed sample shipment details', NOW() - INTERVAL '14 days', 5, 47, 24, 15, false, 2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (16, 'interaction', 'email', 'Meeting recap sent', 'Sent summary of discussion points', NOW() - INTERVAL '16 days', 15, 70, 35, 16, true, 3, NOW() - INTERVAL '16 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (17, 'interaction', 'email', 'Spec sheets requested', 'Chef requested detailed specifications', NOW() - INTERVAL '19 days', 5, 64, 32, 17, false, 3, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (18, 'interaction', 'email', 'Introduction email', 'Initial outreach to new contact', NOW() - INTERVAL '7 days', 10, 74, 37, 18, true, 4, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (19, 'interaction', 'email', 'Follow-up after call', 'Summarized call discussion points', NOW() - INTERVAL '9 days', 10, 68, 34, 19, false, 5, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (20, 'interaction', 'email', 'Case study shared', 'Sent relevant customer success story', NOW() - INTERVAL '11 days', 5, 54, 27, 20, true, 5, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (21, 'interaction', 'email', 'Thank you note', 'Thanked for demo attendance', NOW() - INTERVAL '13 days', 5, 60, 30, 21, false, 6, NOW() - INTERVAL '13 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (22, 'interaction', 'email', 'Contract draft sent', 'Sent initial contract for review', NOW() - INTERVAL '17 days', 15, 45, 23, 22, true, 2, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (23, 'interaction', 'email', 'Questions answered', 'Responded to technical questions', NOW() - INTERVAL '21 days', 10, 58, 29, 23, false, 3, NOW() - INTERVAL '21 days', NOW()),
  -- Opp 24: customer_org 39 -> contacts 78, 79, 80
  (24, 'interaction', 'email', 'Update on order status', 'Provided shipping information', NOW() - INTERVAL '23 days', 5, 79, 39, 24, false, 3, NOW() - INTERVAL '23 days', NOW()),

  -- ========================================
  -- MEETING Activities (12) - includes sample visits
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (25, 'interaction', 'meeting', 'Kitchen sample presentation', 'Chef tasted products in their kitchen', NOW() - INTERVAL '2 days', 90, 40, 20, 25, true, 4, NOW() - INTERVAL '2 days', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (26, 'interaction', 'meeting', 'Menu review meeting', 'Reviewed potential menu applications', NOW() - INTERVAL '5 days', 60, 44, 22, 26, false, 4, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (27, 'interaction', 'meeting', 'Product tasting session', 'Sampled new product line', NOW() - INTERVAL '8 days', 120, 50, 25, 27, true, 5, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (28, 'interaction', 'meeting', 'Quarterly business review', 'Reviewed partnership performance', NOW() - INTERVAL '12 days', 90, 42, 21, 28, false, 6, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (29, 'interaction', 'meeting', 'New product introduction', 'Presented seasonal additions', NOW() - INTERVAL '15 days', 60, 19, 10, 29, true, 2, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (30, 'interaction', 'meeting', 'Chef training session', 'Trained kitchen staff on products', NOW() - INTERVAL '18 days', 180, 21, 11, 30, false, 3, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (31, 'interaction', 'meeting', 'Distribution review', 'Discussed distribution strategy', NOW() - INTERVAL '22 days', 60, 25, 13, 31, true, 3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (32, 'interaction', 'meeting', 'Sample delivery follow-up', 'Gathered feedback on samples', NOW() - INTERVAL '25 days', 45, 63, 31, 32, false, 4, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (33, 'interaction', 'meeting', 'Partnership discussion', 'Explored expanded relationship', NOW() - INTERVAL '28 days', 75, 35, 18, 33, true, 4, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (34, 'interaction', 'meeting', 'Menu planning workshop', 'Collaborated on menu development', NOW() - INTERVAL '30 days', 120, 38, 19, 34, false, 5, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (35, 'interaction', 'meeting', 'Sales team alignment', 'Synced on account strategy', NOW() - INTERVAL '32 days', 45, 23, 12, 35, true, 5, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (36, 'interaction', 'meeting', 'Executive meeting', 'Met with VP for approval', NOW() - INTERVAL '35 days', 60, 29, 15, 36, false, 6, NOW() - INTERVAL '35 days', NOW()),

  -- ========================================
  -- DEMO Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (37, 'interaction', 'demo', 'Full product line demo', 'Demonstrated complete portfolio', NOW() - INTERVAL '6 days', 120, 39, 20, 1, true, 2, NOW() - INTERVAL '6 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (38, 'interaction', 'demo', 'Kitchen demo with chef', 'Hands-on cooking demonstration', NOW() - INTERVAL '10 days', 90, 43, 22, 5, false, 4, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (39, 'interaction', 'demo', 'New product showcase', 'Presented latest innovations', NOW() - INTERVAL '14 days', 60, 47, 24, 15, true, 2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (40, 'interaction', 'demo', 'Taste testing event', 'Organized tasting for culinary team', NOW() - INTERVAL '18 days', 150, 57, 29, 9, false, 3, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (41, 'interaction', 'demo', 'Virtual product demo', 'Online demo for remote team', NOW() - INTERVAL '22 days', 45, 72, 36, 11, true, 4, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (42, 'interaction', 'demo', 'Competitive comparison', 'Side-by-side product testing', NOW() - INTERVAL '26 days', 90, 49, 25, 10, false, 3, NOW() - INTERVAL '26 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (43, 'interaction', 'demo', 'Executive demo', 'Presented to leadership team', NOW() - INTERVAL '30 days', 60, 19, 10, 29, true, 2, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (44, 'interaction', 'demo', 'Distribution partner demo', 'Demo for distributor category team', NOW() - INTERVAL '34 days', 75, 21, 11, 30, false, 3, NOW() - INTERVAL '34 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (45, 'interaction', 'demo', 'Chef collaboration demo', 'Co-created recipes with chef', NOW() - INTERVAL '38 days', 180, 55, 28, 13, true, 6, NOW() - INTERVAL '38 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (46, 'interaction', 'demo', 'Menu integration demo', 'Showed menu applications', NOW() - INTERVAL '42 days', 90, 70, 35, 16, false, 3, NOW() - INTERVAL '42 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (47, 'interaction', 'demo', 'Quality comparison demo', 'Compared to current supplier', NOW() - INTERVAL '46 days', 60, 64, 32, 17, true, 3, NOW() - INTERVAL '46 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (48, 'interaction', 'demo', 'ROI demonstration', 'Showed cost savings potential', NOW() - INTERVAL '50 days', 45, 74, 37, 18, false, 4, NOW() - INTERVAL '50 days', NOW()),

  -- ========================================
  -- PROPOSAL Activities (12)
  -- ========================================
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (49, 'interaction', 'proposal', 'Initial pricing proposal', 'Submitted first pricing quote', NOW() - INTERVAL '7 days', 30, 53, 27, 2, true, 3, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (50, 'interaction', 'proposal', 'Volume discount proposal', 'Offered tiered pricing', NOW() - INTERVAL '11 days', 25, 59, 30, 3, false, 3, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (51, 'interaction', 'proposal', 'Custom product proposal', 'Proposed customized solution', NOW() - INTERVAL '15 days', 45, 76, 38, 4, true, 4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (52, 'interaction', 'proposal', 'Partnership proposal', 'Submitted partnership terms', NOW() - INTERVAL '19 days', 60, 66, 33, 7, false, 6, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (53, 'interaction', 'proposal', 'Revised pricing proposal', 'Updated pricing based on feedback', NOW() - INTERVAL '23 days', 30, 62, 31, 8, true, 2, NOW() - INTERVAL '23 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (54, 'interaction', 'proposal', 'Annual contract proposal', 'Proposed yearly agreement', NOW() - INTERVAL '27 days', 40, 78, 39, 12, false, 4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (55, 'interaction', 'proposal', 'Regional distribution proposal', 'Proposed regional rollout', NOW() - INTERVAL '31 days', 35, 51, 26, 14, true, 5, NOW() - INTERVAL '31 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (56, 'interaction', 'proposal', 'Pilot program proposal', 'Proposed limited trial', NOW() - INTERVAL '35 days', 45, 68, 34, 19, false, 5, NOW() - INTERVAL '35 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (57, 'interaction', 'proposal', 'Renewal proposal', 'Proposed contract renewal terms', NOW() - INTERVAL '39 days', 30, 54, 27, 20, true, 5, NOW() - INTERVAL '39 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (58, 'interaction', 'proposal', 'Expansion proposal', 'Proposed additional products', NOW() - INTERVAL '43 days', 50, 60, 30, 21, false, 6, NOW() - INTERVAL '43 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (59, 'interaction', 'proposal', 'National rollout proposal', 'Proposed nationwide distribution', NOW() - INTERVAL '47 days', 60, 45, 23, 22, true, 2, NOW() - INTERVAL '47 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (60, 'interaction', 'proposal', 'Exclusive partnership proposal', 'Proposed exclusive arrangement', NOW() - INTERVAL '51 days', 45, 58, 29, 23, false, 3, NOW() - INTERVAL '51 days', NOW()),

  -- ========================================
  -- FOLLOW_UP Activities (12)
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (61, 'interaction', 'follow_up', 'Post-demo follow-up', 'Checked in after demo', NOW() - INTERVAL '3 days', 15, 40, 20, 25, true, 4, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (62, 'interaction', 'follow_up', 'Proposal follow-up', 'Followed up on submitted proposal', NOW() - INTERVAL '8 days', 20, 44, 22, 26, false, 4, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (63, 'interaction', 'follow_up', 'Sample feedback follow-up', 'Gathered feedback on samples', NOW() - INTERVAL '12 days', 25, 50, 25, 27, true, 5, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (64, 'interaction', 'follow_up', 'Meeting recap follow-up', 'Confirmed next steps', NOW() - INTERVAL '16 days', 15, 42, 21, 28, false, 6, NOW() - INTERVAL '16 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (65, 'interaction', 'follow_up', 'Decision timeline follow-up', 'Checked on decision progress', NOW() - INTERVAL '20 days', 20, 19, 10, 29, true, 2, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (66, 'interaction', 'follow_up', 'Contract review follow-up', 'Checked on legal review status', NOW() - INTERVAL '24 days', 15, 21, 11, 30, false, 3, NOW() - INTERVAL '24 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (67, 'interaction', 'follow_up', 'Budget approval follow-up', 'Inquired about budget status', NOW() - INTERVAL '28 days', 20, 25, 13, 31, true, 3, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (68, 'interaction', 'follow_up', 'Trial results follow-up', 'Discussed pilot outcomes', NOW() - INTERVAL '32 days', 30, 63, 31, 32, false, 4, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (69, 'interaction', 'follow_up', 'Competitive update follow-up', 'Checked on competitive situation', NOW() - INTERVAL '36 days', 25, 35, 18, 33, true, 4, NOW() - INTERVAL '36 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (70, 'interaction', 'follow_up', 'Menu launch follow-up', 'Checked on menu roll-out', NOW() - INTERVAL '40 days', 20, 38, 19, 34, false, 5, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (71, 'interaction', 'follow_up', 'Stakeholder alignment follow-up', 'Confirmed internal alignment', NOW() - INTERVAL '44 days', 25, 23, 12, 35, true, 5, NOW() - INTERVAL '44 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (72, 'interaction', 'follow_up', 'Executive decision follow-up', 'Followed up with decision maker', NOW() - INTERVAL '48 days', 30, 29, 15, 36, false, 6, NOW() - INTERVAL '48 days', NOW()),

  -- ========================================
  -- TRADE_SHOW Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (73, 'interaction', 'trade_show', 'NRA Show booth visit', 'Met at National Restaurant Association show', NOW() - INTERVAL '60 days', 30, 39, 20, 1, true, 2, NOW() - INTERVAL '60 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (74, 'interaction', 'trade_show', 'Regional food show', 'Connected at regional industry event', NOW() - INTERVAL '65 days', 45, 53, 27, 2, false, 3, NOW() - INTERVAL '65 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (75, 'interaction', 'trade_show', 'Healthcare foodservice expo', 'Met at ANFP conference', NOW() - INTERVAL '70 days', 30, 66, 33, 7, true, 6, NOW() - INTERVAL '70 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (76, 'interaction', 'trade_show', 'Distributor show', 'Presented at distributor event', NOW() - INTERVAL '75 days', 60, 19, 10, 29, false, 2, NOW() - INTERVAL '75 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (77, 'interaction', 'trade_show', 'Plant-based summit', 'Exhibited at specialty show', NOW() - INTERVAL '80 days', 45, 55, 28, 13, true, 6, NOW() - INTERVAL '80 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (78, 'interaction', 'trade_show', 'Hotel F&B conference', 'Connected at hospitality event', NOW() - INTERVAL '85 days', 30, 59, 30, 3, false, 3, NOW() - INTERVAL '85 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (79, 'interaction', 'trade_show', 'Campus dining expo', 'Met at higher ed foodservice show', NOW() - INTERVAL '90 days', 45, 70, 35, 16, true, 3, NOW() - INTERVAL '90 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (80, 'interaction', 'trade_show', 'Senior living conference', 'Exhibited at AHCA conference', NOW() - INTERVAL '95 days', 30, 74, 37, 18, false, 4, NOW() - INTERVAL '95 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (81, 'interaction', 'trade_show', 'Casual dining summit', 'Met at chain restaurant event', NOW() - INTERVAL '100 days', 45, 47, 24, 15, true, 2, NOW() - INTERVAL '100 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (82, 'interaction', 'trade_show', 'Sports venue expo', 'Connected at venue management show', NOW() - INTERVAL '105 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '105 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (83, 'interaction', 'trade_show', 'Distributor partner day', 'Attended partner event', NOW() - INTERVAL '110 days', 60, 25, 13, 31, true, 3, NOW() - INTERVAL '110 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (84, 'interaction', 'trade_show', 'Specialty foods show', 'Exhibited at Fancy Food Show', NOW() - INTERVAL '115 days', 45, 35, 18, 33, false, 4, NOW() - INTERVAL '115 days', NOW()),

  -- ========================================
  -- SITE_VISIT Activities (12)
  -- ========================================
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (85, 'interaction', 'site_visit', 'Kitchen tour and assessment', 'Visited kitchen to assess needs', NOW() - INTERVAL '4 days', 120, 41, 21, 6, true, 5, NOW() - INTERVAL '4 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (86, 'interaction', 'site_visit', 'Distribution center visit', 'Toured warehouse facility', NOW() - INTERVAL '9 days', 180, 21, 11, 30, false, 3, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (87, 'interaction', 'site_visit', 'Plant tour for buyer', 'Showed manufacturing facility', NOW() - INTERVAL '14 days', 240, 19, 10, 29, true, 2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (88, 'interaction', 'site_visit', 'Kitchen installation review', 'Reviewed equipment setup', NOW() - INTERVAL '19 days', 90, 64, 32, 17, false, 3, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (89, 'interaction', 'site_visit', 'Multi-unit assessment', 'Visited several locations', NOW() - INTERVAL '24 days', 300, 72, 36, 11, true, 4, NOW() - INTERVAL '24 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (90, 'interaction', 'site_visit', 'Quality audit visit', 'Conducted quality review', NOW() - INTERVAL '29 days', 150, 62, 31, 8, false, 2, NOW() - INTERVAL '29 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (91, 'interaction', 'site_visit', 'New location opening', 'Supported new store opening', NOW() - INTERVAL '34 days', 180, 49, 25, 10, true, 3, NOW() - INTERVAL '34 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (92, 'interaction', 'site_visit', 'Commissary visit', 'Toured central kitchen', NOW() - INTERVAL '39 days', 120, 57, 29, 9, false, 3, NOW() - INTERVAL '39 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (93, 'interaction', 'site_visit', 'Executive site tour', 'Hosted leadership visit', NOW() - INTERVAL '44 days', 180, 38, 19, 34, true, 5, NOW() - INTERVAL '44 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (94, 'interaction', 'site_visit', 'Training facility visit', 'Conducted on-site training', NOW() - INTERVAL '49 days', 240, 68, 34, 19, false, 5, NOW() - INTERVAL '49 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (95, 'interaction', 'site_visit', 'Banquet kitchen visit', 'Assessed banquet operations', NOW() - INTERVAL '54 days', 120, 60, 30, 21, true, 6, NOW() - INTERVAL '54 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (96, 'interaction', 'site_visit', 'Regional office visit', 'Met at regional headquarters', NOW() - INTERVAL '59 days', 90, 23, 12, 35, false, 5, NOW() - INTERVAL '59 days', NOW()),

  -- ========================================
  -- CONTRACT_REVIEW Activities (12)
  -- ========================================
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (97, 'interaction', 'contract_review', 'Initial contract review', 'Reviewed initial terms', NOW() - INTERVAL '5 days', 60, 42, 21, 28, true, 6, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (98, 'interaction', 'contract_review', 'Pricing terms discussion', 'Negotiated pricing section', NOW() - INTERVAL '10 days', 45, 45, 23, 22, false, 2, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (99, 'interaction', 'contract_review', 'Legal review meeting', 'Discussed legal concerns', NOW() - INTERVAL '15 days', 90, 54, 27, 20, true, 5, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (100, 'interaction', 'contract_review', 'Renewal terms review', 'Reviewed renewal conditions', NOW() - INTERVAL '20 days', 60, 58, 29, 23, false, 3, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 24: customer_org 39 -> contacts 78, 79, 80
  (101, 'interaction', 'contract_review', 'Volume commitment review', 'Discussed volume requirements', NOW() - INTERVAL '25 days', 45, 79, 39, 24, true, 3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (102, 'interaction', 'contract_review', 'Payment terms negotiation', 'Negotiated payment schedule', NOW() - INTERVAL '30 days', 60, 46, 23, 22, false, 2, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (103, 'interaction', 'contract_review', 'Distribution agreement review', 'Reviewed distributor terms', NOW() - INTERVAL '35 days', 75, 26, 13, 31, true, 3, NOW() - INTERVAL '35 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (104, 'interaction', 'contract_review', 'Service level review', 'Discussed SLA terms', NOW() - INTERVAL '40 days', 45, 30, 15, 36, false, 6, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (105, 'interaction', 'contract_review', 'Exclusivity terms review', 'Discussed exclusive arrangement', NOW() - INTERVAL '45 days', 60, 23, 12, 35, true, 5, NOW() - INTERVAL '45 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (106, 'interaction', 'contract_review', 'Final contract review', 'Final review before signing', NOW() - INTERVAL '50 days', 90, 20, 10, 29, false, 2, NOW() - INTERVAL '50 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (107, 'interaction', 'contract_review', 'Amendment review', 'Reviewed contract changes', NOW() - INTERVAL '55 days', 45, 22, 11, 30, true, 3, NOW() - INTERVAL '55 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (108, 'interaction', 'contract_review', 'Term extension review', 'Discussed term extension', NOW() - INTERVAL '60 days', 60, 24, 12, 35, false, 5, NOW() - INTERVAL '60 days', NOW()),

  -- ========================================
  -- CHECK_IN Activities (12)
  -- ========================================
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (109, 'interaction', 'check_in', 'Monthly account check-in', 'Regular monthly touchpoint', NOW() - INTERVAL '2 days', 20, 48, 24, 15, false, 4, NOW() - INTERVAL '2 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (110, 'interaction', 'check_in', 'Relationship maintenance call', 'Nurturing key relationship', NOW() - INTERVAL '7 days', 25, 52, 26, 14, true, 5, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (111, 'interaction', 'check_in', 'Quarterly business check-in', 'Quarterly account review', NOW() - INTERVAL '12 days', 30, 67, 33, 7, false, 6, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (112, 'interaction', 'check_in', 'New contact introduction', 'Introduction to new team member', NOW() - INTERVAL '17 days', 20, 69, 34, 19, true, 4, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (113, 'interaction', 'check_in', 'Holiday greeting call', 'Season greetings touchpoint', NOW() - INTERVAL '22 days', 15, 71, 35, 16, false, 3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (114, 'interaction', 'check_in', 'Account health check', 'Verified account satisfaction', NOW() - INTERVAL '27 days', 25, 73, 36, 11, true, 4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (115, 'interaction', 'check_in', 'Post-order check-in', 'Followed up after delivery', NOW() - INTERVAL '32 days', 15, 75, 37, 18, false, 6, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (116, 'interaction', 'check_in', 'Year-end review call', 'Annual relationship review', NOW() - INTERVAL '37 days', 30, 77, 38, 4, true, 4, NOW() - INTERVAL '37 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (117, 'interaction', 'check_in', 'New year planning call', 'Discussed upcoming year plans', NOW() - INTERVAL '42 days', 25, 80, 39, 12, false, 2, NOW() - INTERVAL '42 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (118, 'interaction', 'check_in', 'Summer season check-in', 'Seasonal planning discussion', NOW() - INTERVAL '47 days', 20, 56, 28, 13, true, 6, NOW() - INTERVAL '47 days', NOW()),
  -- Opp 43: customer_org 33 -> contacts 66, 67
  (119, 'interaction', 'check_in', 'Executive relationship check', 'Executive level touchpoint', NOW() - INTERVAL '52 days', 30, 66, 33, 43, false, 6, NOW() - INTERVAL '52 days', NOW()),
  -- Opp 43: customer_org 33 -> contacts 66, 67
  (120, 'interaction', 'check_in', 'Operations alignment check', 'Verified operational alignment', NOW() - INTERVAL '57 days', 25, 67, 33, 43, true, 6, NOW() - INTERVAL '57 days', NOW()),

  -- ========================================
  -- SOCIAL Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (121, 'interaction', 'social', 'Industry dinner event', 'Networking dinner with contacts', NOW() - INTERVAL '10 days', 180, 39, 20, 1, false, 2, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (122, 'interaction', 'social', 'Golf outing', 'Client appreciation golf', NOW() - INTERVAL '20 days', 300, 19, 10, 29, true, 2, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (123, 'interaction', 'social', 'Wine dinner event', 'Hosted wine pairing dinner', NOW() - INTERVAL '30 days', 180, 43, 22, 5, false, 4, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (124, 'interaction', 'social', 'Sporting event tickets', 'Hosted at baseball game', NOW() - INTERVAL '40 days', 240, 78, 39, 12, true, 4, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (125, 'interaction', 'social', 'Charity event', 'Connected at charity fundraiser', NOW() - INTERVAL '50 days', 180, 59, 30, 3, false, 3, NOW() - INTERVAL '50 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (126, 'interaction', 'social', 'Industry awards dinner', 'Attended awards ceremony together', NOW() - INTERVAL '60 days', 240, 55, 28, 13, true, 6, NOW() - INTERVAL '60 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (127, 'interaction', 'social', 'Coffee meeting', 'Informal catch-up coffee', NOW() - INTERVAL '70 days', 60, 66, 33, 7, false, 6, NOW() - INTERVAL '70 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (128, 'interaction', 'social', 'Happy hour networking', 'After-work networking event', NOW() - INTERVAL '80 days', 120, 72, 36, 11, true, 4, NOW() - INTERVAL '80 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (129, 'interaction', 'social', 'Holiday party', 'Annual holiday celebration', NOW() - INTERVAL '90 days', 180, 47, 24, 15, false, 2, NOW() - INTERVAL '90 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (130, 'interaction', 'social', 'Client appreciation lunch', 'Thank you lunch for key buyer', NOW() - INTERVAL '100 days', 90, 21, 11, 30, true, 3, NOW() - INTERVAL '100 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (131, 'interaction', 'social', 'Industry mixer', 'Networking at industry event', NOW() - INTERVAL '110 days', 120, 25, 13, 31, false, 3, NOW() - INTERVAL '110 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (132, 'interaction', 'social', 'New Year celebration', 'Rang in New Year with client', NOW() - INTERVAL '120 days', 180, 35, 18, 33, true, 4, NOW() - INTERVAL '120 days', NOW()),

  -- ========================================
  -- NOTE Activities (18 - general notes)
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (133, 'interaction', 'note', 'Competitive intelligence', 'Learned competitor is offering lower prices', NOW() - INTERVAL '1 day', 5, 40, 20, 25, false, 4, NOW() - INTERVAL '1 day', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (134, 'interaction', 'note', 'Menu change planned', 'Chef mentioned upcoming menu revamp', NOW() - INTERVAL '3 days', 5, 44, 22, 26, true, 4, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (135, 'interaction', 'note', 'Budget cycle timing', 'Budget decisions made in Q3', NOW() - INTERVAL '5 days', 5, 50, 25, 27, false, 5, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (136, 'interaction', 'note', 'Key stakeholder identified', 'CFO has final approval authority', NOW() - INTERVAL '7 days', 5, 42, 21, 28, true, 6, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (137, 'interaction', 'note', 'Expansion plans shared', 'Opening 5 new locations next year', NOW() - INTERVAL '9 days', 5, 19, 10, 29, false, 2, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (138, 'interaction', 'note', 'Pain point identified', 'Current supplier has quality issues', NOW() - INTERVAL '11 days', 5, 21, 11, 30, true, 3, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (139, 'interaction', 'note', 'Timeline update', 'Decision pushed to next quarter', NOW() - INTERVAL '13 days', 5, 25, 13, 31, false, 3, NOW() - INTERVAL '13 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (140, 'interaction', 'note', 'Contact leaving', 'Key contact taking new job', NOW() - INTERVAL '15 days', 5, 63, 31, 32, true, 4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (141, 'interaction', 'note', 'Vendor consolidation', 'Looking to reduce vendor count', NOW() - INTERVAL '17 days', 5, 35, 18, 33, false, 4, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (142, 'interaction', 'note', 'Sustainability focus', 'Increasing focus on sustainability', NOW() - INTERVAL '19 days', 5, 38, 19, 34, true, 5, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (143, 'interaction', 'note', 'Regional preference', 'Prefers local/regional suppliers', NOW() - INTERVAL '21 days', 5, 23, 12, 35, false, 5, NOW() - INTERVAL '21 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (144, 'interaction', 'note', 'Pricing sensitivity', 'Very price sensitive account', NOW() - INTERVAL '23 days', 5, 29, 15, 36, true, 6, NOW() - INTERVAL '23 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (145, 'interaction', 'note', 'Quality over price', 'Willing to pay premium for quality', NOW() - INTERVAL '25 days', 5, 53, 27, 2, false, 3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (146, 'interaction', 'note', 'Contract renewal timing', 'Contract up for renewal in June', NOW() - INTERVAL '27 days', 5, 76, 38, 4, true, 4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (147, 'interaction', 'note', 'Decision maker identified', 'VP Operations makes final call', NOW() - INTERVAL '29 days', 5, 41, 21, 6, false, 5, NOW() - INTERVAL '29 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (148, 'interaction', 'note', 'Competitor weakness', 'Competitor having supply issues', NOW() - INTERVAL '31 days', 5, 66, 33, 7, true, 6, NOW() - INTERVAL '31 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (149, 'interaction', 'note', 'Budget approved', 'Got budget approval for new vendor', NOW() - INTERVAL '33 days', 5, 62, 31, 8, false, 2, NOW() - INTERVAL '33 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (150, 'interaction', 'note', 'Trial feedback positive', 'Pilot program getting great reviews', NOW() - INTERVAL '35 days', 5, 57, 29, 9, true, 3, NOW() - INTERVAL '35 days', NOW());

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
