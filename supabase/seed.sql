-- ============================================================================
-- CRISPY-CRM SEED DATA
-- Generated: 2025-11-28
-- Version: 2.1 (Enhanced with Audit Recommendations)
-- ============================================================================
--
-- Contents:
--   - 6 Users (Full MFB team)
--   - 9 Principals (manufacturers)
--   - 10 Distributors + 12 Branches (6 Sysco, 6 GFS with parent_organization_id)
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
TRUNCATE TABLE "public"."organization_notes" CASCADE;
TRUNCATE TABLE "public"."contact_notes" CASCADE;
TRUNCATE TABLE "public"."opportunity_notes" CASCADE;
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

INSERT INTO "public"."sales" (id, user_id, first_name, last_name, email, phone, is_admin, role, avatar_url, created_at, updated_at)
VALUES
  -- Admin Test User (id=1)
  (1, 'a0000000-0000-0000-0000-000000000001', 'Admin', 'User', 'admin@test.com', '555-000-0001', true, 'admin', NULL, NOW(), NOW()),

  -- Brent Gustafson - Owner/Admin (id=2)
  (2, 'b0000000-0000-0000-0000-000000000001', 'Brent', 'Gustafson', 'brent@mfbroker.com', '555-000-0002', true, 'admin', NULL, NOW(), NOW()),

  -- Michelle Gustafson - Manager (id=3)
  (3, 'c0000000-0000-0000-0000-000000000001', 'Michelle', 'Gustafson', 'michelle@mfbroker.com', '555-000-0003', false, 'manager', NULL, NOW(), NOW()),

  -- Gary - Sales Rep (id=4)
  (4, 'd0000000-0000-0000-0000-000000000001', 'Gary', 'Thompson', 'gary@mfbroker.com', '555-000-0004', false, 'rep', NULL, NOW(), NOW()),

  -- Dale - Sales Rep (id=5)
  (5, 'e0000000-0000-0000-0000-000000000001', 'Dale', 'Anderson', 'dale@mfbroker.com', '555-000-0005', false, 'rep', NULL, NOW(), NOW()),

  -- Sue - Sales Rep (id=6)
  (6, 'f0000000-0000-0000-0000-000000000001', 'Sue', 'Martinez', 'sue@mfbroker.com', '555-000-0006', false, NULL, NOW(), NOW());

-- Reset the sequence to continue after our inserts
SELECT setval(pg_get_serial_sequence('sales', 'id'), 6, true);
-- ============================================================================
-- PART 3: PLAYBOOK CATEGORIES (9 categories)
-- ============================================================================
-- Fixed set of distributor/organization classification categories aligned with
-- MFB's sales playbook. These categories should not be modified at runtime.
--
-- UUIDs use the 22222222-... prefix for easy identification
-- ============================================================================

INSERT INTO "public"."segments" (id, name, created_at, created_by)
VALUES
  -- Major national distributors
  ('22222222-2222-4222-8222-000000000001', 'Major Broadline', NOW(), NULL),

  -- Regional or specialty-focused distributors
  ('22222222-2222-4222-8222-000000000002', 'Specialty/Regional', NOW(), NULL),

  -- Foodservice management companies (Aramark, Compass, Sodexo)
  ('22222222-2222-4222-8222-000000000003', 'Management Company', NOW(), NULL),

  -- Group Purchasing Organizations
  ('22222222-2222-4222-8222-000000000004', 'GPO', NOW(), NULL),

  -- Higher education foodservice
  ('22222222-2222-4222-8222-000000000005', 'University', NOW(), NULL),

  -- Multi-unit restaurant operators
  ('22222222-2222-4222-8222-000000000006', 'Restaurant Group', NOW(), NULL),

  -- National/regional chain accounts
  ('22222222-2222-4222-8222-000000000007', 'Chain Restaurant', NOW(), NULL),

  -- Hospitality and travel foodservice
  ('22222222-2222-4222-8222-000000000008', 'Hotel & Aviation', NOW(), NULL),

  -- Default for unclassified organizations
  ('22222222-2222-4222-8222-000000000009', 'Unknown', NOW(), NULL);
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
  priority, linkedin_url, employee_count, founded_year,
  description, notes, created_at, updated_at
)
VALUES
  -- 1. McCRUM (Idaho potatoes/fries) - Brent manages
  (1, 'McCRUM', 'principal', '22222222-2222-4222-8222-000000000002',
   '208-555-1001', 'sales@mccrum.com', 'https://mccrum.com',
   '123 Potato Lane', 'Idaho Falls', 'ID', '83401', 2,
   'A', 'https://linkedin.com/company/mccrum', 350, 1985,
   'McCRUM is a family-owned Idaho potato processor specializing in premium foodservice fries, hash browns, and specialty potato cuts. Known for consistent quality and farm-to-foodservice traceability.',
   'Premium Idaho potato products including fries, hash browns, and specialty cuts. Family-owned since 1985. Key relationship - work directly with owner family.',
   NOW(), NOW()),

  -- 2. SWAP (Specialty ingredients) - Brent manages
  (2, 'SWAP', 'principal', '22222222-2222-4222-8222-000000000002',
   '312-555-1002', 'info@swapfoods.com', 'https://swapfoods.com',
   '456 Innovation Drive', 'Chicago', 'IL', '60601', 2,
   'A', 'https://linkedin.com/company/swapfoods', 120, 2019,
   'SWAP Foods is an innovative food-tech company developing plant-based ingredients and sustainable protein alternatives for the foodservice industry.',
   'Innovative plant-based and specialty food ingredients for foodservice. Fast-growing startup with strong innovation pipeline.',
   NOW(), NOW()),

  -- 3. Rapid Rasoi (Indian cuisine) - Michelle manages
  (3, 'Rapid Rasoi', 'principal', '22222222-2222-4222-8222-000000000002',
   '510-555-1003', 'orders@rapidrasoi.com', 'https://rapidrasoi.com',
   '789 Spice Boulevard', 'Fremont', 'CA', '94536', 3,
   'B', 'https://linkedin.com/company/rapidrasoi', 85, 2008,
   'Rapid Rasoi produces authentic Indian cuisine for foodservice including naan, curries, rice dishes, and appetizers. Family recipes adapted for commercial scale.',
   'Authentic Indian cuisine solutions - naan, curries, rice dishes, and appetizers. Family business with authentic recipes.',
   NOW(), NOW()),

  -- 4. Lakeview Farms (Dairy/desserts) - Michelle manages
  (4, 'Lakeview Farms', 'principal', '22222222-2222-4222-8222-000000000002',
   '614-555-1004', 'foodservice@lakeviewfarms.com', 'https://lakeviewfarms.com',
   '321 Dairy Road', 'Columbus', 'OH', '43215', 3,
   'B', 'https://linkedin.com/company/lakeviewfarms', 450, 1958,
   'Lakeview Farms specializes in premium dairy products and refrigerated desserts for foodservice, including dips, parfaits, and cream-based desserts.',
   'Premium dairy products and desserts including dips, parfaits, and cream-based items. Long-standing relationships with dairy farmers.',
   NOW(), NOW()),

  -- 5. Frico (Italian cheese) - Gary manages
  (5, 'Frico', 'principal', '22222222-2222-4222-8222-000000000002',
   '201-555-1005', 'usa@frico.it', 'https://frico.it',
   '555 Cheese Way', 'Newark', 'NJ', '07102', 4,
   'A', 'https://linkedin.com/company/frico', 1200, 1879,
   'Frico is a heritage Italian cheese producer offering authentic Parmesan, Gorgonzola, Asiago, and specialty varieties to the US foodservice market.',
   'Authentic Italian cheeses - Parmesan, Gorgonzola, Asiago, and specialty varieties. Italian heritage brand with US distribution.',
   NOW(), NOW()),

  -- 6. Anchor (New Zealand dairy) - Gary manages
  (6, 'Anchor Food Professionals', 'principal', '22222222-2222-4222-8222-000000000002',
   '415-555-1006', 'foodservice@anchor.com', 'https://anchorfoodprofessionals.com',
   '888 Pacific Avenue', 'San Francisco', 'CA', '94102', 4,
   'A', 'https://linkedin.com/company/anchorfoodprofessionals', 2100, 1886,
   'Anchor Food Professionals is the foodservice division of Fonterra, offering premium New Zealand grass-fed butter, cream, and UHT products.',
   'New Zealand dairy products - butter, cream, UHT products for professional kitchens. Part of Fonterra global dairy cooperative.',
   NOW(), NOW()),

  -- 7. Tattooed Chef (Plant-based) - Dale manages
  (7, 'Tattooed Chef', 'principal', '22222222-2222-4222-8222-000000000002',
   '310-555-1007', 'foodservice@tattooedchef.com', 'https://tattooedchef.com',
   '777 Vegan Street', 'Los Angeles', 'CA', '90001', 5,
   'B', 'https://linkedin.com/company/tattooedchef', 600, 2017,
   'Tattooed Chef creates premium plant-based frozen meals for health-conscious consumers, including bowls, burritos, and ready-to-eat options.',
   'Premium plant-based frozen meals and ingredients - bowls, burritos, and ready-to-eat options. Publicly traded, strong brand awareness.',
   NOW(), NOW()),

  -- 8. Litehouse (Dressings/dips) - Dale manages
  (8, 'Litehouse', 'principal', '22222222-2222-4222-8222-000000000002',
   '208-555-1008', 'foodservice@litehousefoods.com', 'https://litehousefoods.com',
   '1109 Front Street', 'Sandpoint', 'ID', '83864', 5,
   'A', 'https://linkedin.com/company/litehouse', 520, 1963,
   'Litehouse produces premium refrigerated dressings, dips, and freeze-dried herbs for foodservice. Known for chunky blue cheese and homestyle ranch.',
   'Premium dressings, dips, and cheese products. Known for blue cheese and ranch. Employee-owned company.',
   NOW(), NOW()),

  -- 9. Custom Culinary (Bases/sauces) - Sue manages
  (9, 'Custom Culinary', 'principal', '22222222-2222-4222-8222-000000000002',
   '630-555-1009', 'sales@customculinary.com', 'https://customculinary.com',
   '2555 Busse Road', 'Elk Grove Village', 'IL', '60007', 6,
   'A', 'https://linkedin.com/company/customculinary', 280, 1974,
   'Custom Culinary produces professional-grade soup bases, sauces, gravies, and seasonings designed for commercial kitchen applications.',
   'Professional soup bases, sauces, gravies, and seasonings for foodservice operators. Strong R&D and custom formulation capabilities.',
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
  priority, linkedin_url, employee_count, founded_year,
  description, notes, created_at, updated_at
)
VALUES
  -- 10. Sysco (Broadline - National)
  (10, 'Sysco Corporation', 'distributor', '22222222-2222-4222-8222-000000000001',
   '281-555-2001', 'purchasing@sysco.com', 'https://sysco.com',
   '1390 Enclave Parkway', 'Houston', 'TX', '77077', 2,
   'A', 'https://linkedin.com/company/sysco', 72000, 1969,
   'Sysco Corporation is the largest foodservice distributor in North America, serving restaurants, healthcare, educational facilities, and hospitality.',
   'Largest foodservice distributor in North America. Full broadline capabilities. Publicly traded (NYSE: SYY).',
   NOW(), NOW()),

  -- 11. US Foods (Broadline - National)
  (11, 'US Foods', 'distributor', '22222222-2222-4222-8222-000000000001',
   '847-555-2002', 'vendor@usfoods.com', 'https://usfoods.com',
   '9399 W Higgins Road', 'Rosemont', 'IL', '60018', 2,
   'A', 'https://linkedin.com/company/usfoods', 30000, 1853,
   'US Foods is the second largest foodservice distributor in the US, known for exclusive brands and strong chain restaurant partnerships.',
   'Second largest foodservice distributor. Strong in chain restaurant segment. Publicly traded (NYSE: USFD).',
   NOW(), NOW()),

  -- 12. Performance Food Group (Broadline)
  (12, 'Performance Food Group (PFG)', 'distributor', '22222222-2222-4222-8222-000000000001',
   '804-555-2003', 'purchasing@pfgc.com', 'https://pfgc.com',
   '12500 West Creek Parkway', 'Richmond', 'VA', '23238', 3,
   'B', 'https://linkedin.com/company/pfgc', 37000, 1885,
   'Performance Food Group is the third largest foodservice distributor, with strong regional brands and convenience store distribution.',
   'Third largest foodservice distributor. Strong regional presence. Acquired Reinhart, Core-Mark.',
   NOW(), NOW()),

  -- 13. Gordon Food Service (Broadline)
  (13, 'Gordon Food Service (GFS)', 'distributor', '22222222-2222-4222-8222-000000000001',
   '616-555-2004', 'vendors@gfs.com', 'https://gfs.com',
   '1300 Gezon Parkway SW', 'Grand Rapids', 'MI', '49509', 3,
   'A', 'https://linkedin.com/company/gordon-food-service', 22000, 1897,
   'Gordon Food Service is the largest family-owned foodservice distributor in North America, known for quality and customer service.',
   'Family-owned broadline distributor. Strong in Midwest and Canada. Excellent service reputation.',
   NOW(), NOW()),

  -- 14. Shamrock Foods (Regional - Southwest)
  (14, 'Shamrock Foods', 'distributor', '22222222-2222-4222-8222-000000000001',
   '602-555-2005', 'purchasing@shamrockfoods.com', 'https://shamrockfoods.com',
   '2540 N 29th Avenue', 'Phoenix', 'AZ', '85009', 4,
   'B', 'https://linkedin.com/company/shamrock-foods', 6000, 1922,
   'Shamrock Foods is a family-owned regional broadline distributor serving the Southwest US with strong dairy heritage.',
   'Regional broadline distributor focused on Southwest. Family-owned for 100+ years.',
   NOW(), NOW()),

  -- 15. Ben E. Keith (Regional - South)
  (15, 'Ben E. Keith Foods', 'distributor', '22222222-2222-4222-8222-000000000001',
   '817-555-2006', 'vendors@benekeith.com', 'https://benekeith.com',
   '601 E 7th Street', 'Fort Worth', 'TX', '76102', 4,
   'B', 'https://linkedin.com/company/ben-e-keith', 4500, 1906,
   'Ben E. Keith Foods is a regional foodservice distributor serving Texas and surrounding states with both food and beverage distribution.',
   'Regional distributor covering Texas and surrounding states. Also major beverage distributor.',
   NOW(), NOW()),

  -- 16. Reinhart Foodservice (Regional - Midwest)
  (16, 'Reinhart Foodservice', 'distributor', '22222222-2222-4222-8222-000000000001',
   '715-555-2007', 'purchasing@rfrsinc.com', 'https://rfrsinc.com',
   '2355 Oak Industrial Drive NE', 'Grand Rapids', 'MI', '49505', 5,
   'B', 'https://linkedin.com/company/reinhart-foodservice', 8500, 1972,
   'Reinhart Foodservice is a broadline distributor serving the Upper Midwest, now part of Performance Food Group.',
   'Regional broadline serving Upper Midwest. Part of Performance Food Group since 2019.',
   NOW(), NOW()),

  -- 17. Dot Foods (Redistribution)
  (17, 'Dot Foods', 'distributor', '22222222-2222-4222-8222-000000000002',
   '217-555-2008', 'purchasing@dotfoods.com', 'https://dotfoods.com',
   '1 Dot Way', 'Mt Sterling', 'IL', '62353', 5,
   'A', 'https://linkedin.com/company/dot-foods', 6800, 1960,
   'Dot Foods is the largest food redistributor in North America, enabling manufacturers to reach any distributor efficiently.',
   'Largest food redistributor in North America. Ships to other distributors. Family-owned.',
   NOW(), NOW()),

  -- 18. European Imports (Specialty)
  (18, 'European Imports Ltd', 'distributor', '22222222-2222-4222-8222-000000000002',
   '312-555-2009', 'sales@eiltd.com', 'https://eiltd.com',
   '600 E Brook Drive', 'Arlington Heights', 'IL', '60005', 6,
   'C', 'https://linkedin.com/company/european-imports-ltd', 150, 1978,
   'European Imports Ltd is a specialty distributor of imported European cheeses, meats, and gourmet items for fine dining.',
   'Specialty distributor for European cheeses, meats, and gourmet items. Strong fine dining focus.',
   NOW(), NOW()),

  -- 19. Chefs Warehouse (Specialty)
  (19, 'The Chefs Warehouse', 'distributor', '22222222-2222-4222-8222-000000000002',
   '718-555-2010', 'vendors@chefswarehouse.com', 'https://chefswarehouse.com',
   '100 East Ridge Road', 'Ridgefield', 'CT', '06877', 6,
   'B', 'https://linkedin.com/company/the-chefs-warehouse', 3200, 1985,
   'The Chefs Warehouse is a specialty foodservice distributor serving fine dining restaurants and upscale caterers.',
   'Specialty distributor for fine dining and upscale restaurants. Publicly traded (NASDAQ: CHEF).',
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
  priority, linkedin_url, employee_count, founded_year,
  description, notes, created_at, updated_at
)
VALUES
  -- ============================================================================
  -- POWER USER PERSONA: Brent (sales_id=2) manages 15 customers
  -- This tests UI rendering, pagination, and performance with heavy load
  -- ============================================================================

  -- Fine Dining (3) - ALL to Brent for Power User testing
  (20, 'The Capital Grille', 'customer', '22222222-2222-4222-8222-000000000006',
   '312-555-3001', 'manager@capitalgrille.com', 'https://thecapitalgrille.com',
   '633 N Saint Clair Street', 'Chicago', 'IL', '60611', 2,
   'A', 'https://linkedin.com/company/the-capital-grille', 6500, 1990,
   'The Capital Grille is a national fine dining restaurant specializing in dry-aged steaks, fresh seafood, and award-winning wines. Part of Darden Restaurants.',
   'Upscale steakhouse chain. High-end proteins and premium sides. Excellent wine program. Key decision maker is GM.',
   NOW(), NOW()),

  (21, 'Ruth''s Chris Steak House', 'customer', '22222222-2222-4222-8222-000000000006',
   '504-555-3002', 'purchasing@ruthschris.com', 'https://ruthschris.com',
   '500 Tchoupitoulas Street', 'New Orleans', 'LA', '70130', 2,
   'A', 'https://linkedin.com/company/ruths-chris-steak-house', 7200, 1965,
   'Ruth''s Chris Steak House is a premier fine dining steakhouse known for sizzling butter-finished steaks served on 500-degree plates. Founded in New Orleans.',
   'Premium steakhouse chain. USDA Prime beef and upscale appetizers. Strong brand recognition. New Orleans heritage.',
   NOW(), NOW()),

  (22, 'Morton''s The Steakhouse', 'customer', '22222222-2222-4222-8222-000000000006',
   '312-555-3003', 'gm@mortons.com', 'https://mortons.com',
   '65 E Wacker Place', 'Chicago', 'IL', '60601', 2,
   'A', 'https://linkedin.com/company/mortons-the-steakhouse', 4800, 1978,
   'Morton''s The Steakhouse is an upscale steakhouse chain known for tableside presentations and prime cuts. Owned by Landry''s Inc.',
   'Landry''s owned steakhouse. Premium cuts and classic sides. Tableside menu presentation. Chicago heritage.',
   NOW(), NOW()),

  -- Casual Dining (4) - Most to Brent
  (23, 'Chili''s Grill & Bar', 'customer', '22222222-2222-4222-8222-000000000006',
   '972-555-3004', 'procurement@brinker.com', 'https://chilis.com',
   '6820 LBJ Freeway', 'Dallas', 'TX', '75240', 2,
   'A', 'https://linkedin.com/company/chilis', 72000, 1975,
   'Chili''s Grill & Bar is the flagship casual dining brand of Brinker International, serving Tex-Mex inspired American food at 1,600+ locations worldwide.',
   'Brinker International casual dining. High volume, value-focused. Tex-Mex strength. Major account.',
   NOW(), NOW()),

  (24, 'Applebee''s', 'customer', '22222222-2222-4222-8222-000000000006',
   '913-555-3005', 'vendors@applebees.com', 'https://applebees.com',
   '8140 Ward Parkway', 'Kansas City', 'MO', '64114', 2,
   'A', 'https://linkedin.com/company/applebees', 28000, 1980,
   'Applebee''s is the world''s largest casual dining chain with 1,700+ locations. Part of Dine Brands Global, known for affordable American fare.',
   'Dine Brands casual dining. Neighborhood bar and grill concept. Franchise model. High volume potential.',
   NOW(), NOW()),

  (25, 'Buffalo Wild Wings', 'customer', '22222222-2222-4222-8222-000000000006',
   '612-555-3006', 'purchasing@buffalowildwings.com', 'https://buffalowildwings.com',
   '5500 Wayzata Blvd', 'Minneapolis', 'MN', '55416', 2,
   'A', 'https://linkedin.com/company/buffalo-wild-wings', 35000, 1982,
   'Buffalo Wild Wings is a sports bar franchise specializing in chicken wings with signature sauces. Known for sports viewing experience with 60+ TVs per location.',
   'Sports bar concept. High sauce and wing volume. Strong sports partnership strategy. Arby''s (Inspire Brands) owned.',
   NOW(), NOW()),

  (26, 'Red Robin', 'customer', '22222222-2222-4222-8222-000000000006',
   '303-555-3007', 'foodsupply@redrobin.com', 'https://redrobin.com',
   '6312 S Fiddlers Green Circle', 'Greenwood Village', 'CO', '80111', 3,
   'B', 'https://linkedin.com/company/red-robin-gourmet-burgers', 23000, 1969,
   'Red Robin Gourmet Burgers and Brews is a casual dining chain known for gourmet burgers and the signature Bottomless Steak Fries.',
   'Gourmet burger casual dining. Bottomless fries concept. Family-friendly. Colorado-based.',
   NOW(), NOW()),

  -- Fast Casual (3) - Most to Brent
  (27, 'Panera Bread', 'customer', '22222222-2222-4222-8222-000000000007',
   '314-555-3008', 'suppliers@panerabread.com', 'https://panerabread.com',
   '3630 S Geyer Road', 'St. Louis', 'MO', '63127', 2,
   'A', 'https://linkedin.com/company/panera-bread', 120000, 1987,
   'Panera Bread is a fast-casual bakery-cafe chain with 2,100+ locations known for fresh bread, soups, salads, and clean ingredients. Part of JAB Holdings.',
   'JAB Holdings bakery-cafe chain. Clean ingredients focus. Strong breakfast/lunch dayparts. No artificial preservatives.',
   NOW(), NOW()),

  (28, 'Chipotle Mexican Grill', 'customer', '22222222-2222-4222-8222-000000000007',
   '949-555-3009', 'purchasing@chipotle.com', 'https://chipotle.com',
   '610 Newport Center Drive', 'Newport Beach', 'CA', '92660', 2,
   'A', 'https://linkedin.com/company/chipotle-mexican-grill', 105000, 1993,
   'Chipotle Mexican Grill is a fast-casual restaurant chain serving burritos, tacos, and bowls with a focus on fresh ingredients and responsible sourcing.',
   'Fast casual Mexican. Food with Integrity sourcing program. Industry leader in sustainability. High growth.',
   NOW(), NOW()),

  (29, 'Shake Shack', 'customer', '22222222-2222-4222-8222-000000000007',
   '212-555-3010', 'supply@shakeshack.com', 'https://shakeshack.com',
   '225 Varick Street', 'New York', 'NY', '10014', 3,
   'B', 'https://linkedin.com/company/shake-shack', 9500, 2004,
   'Shake Shack is a modern fast-casual burger concept from Danny Meyer, known for premium burgers, crinkle-cut fries, and frozen custard.',
   'Premium fast casual burgers. 100% Angus beef, no hormones. Danny Meyer concept. Strong urban presence.',
   NOW(), NOW()),

  -- Hotels (3) - Most to Brent
  (30, 'Marriott International', 'customer', '22222222-2222-4222-8222-000000000008',
   '301-555-3011', 'foodprocurement@marriott.com', 'https://marriott.com',
   '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 2,
   'A', 'https://linkedin.com/company/marriott-international', 174000, 1927,
   'Marriott International is the world''s largest hotel company with 8,000+ properties across 30 brands including JW Marriott, Ritz-Carlton, and Sheraton.',
   'Largest hotel company. Multiple brands and banquet operations. Global procurement. Starwood integration complete.',
   NOW(), NOW()),

  (31, 'Hilton Hotels', 'customer', '22222222-2222-4222-8222-000000000008',
   '703-555-3012', 'purchasing@hilton.com', 'https://hilton.com',
   '7930 Jones Branch Drive', 'McLean', 'VA', '22102', 2,
   'A', 'https://linkedin.com/company/hilton', 159000, 1919,
   'Hilton Hotels Corporation is a global hospitality company with 7,000+ properties across 18 brands including Waldorf Astoria, Conrad, and DoubleTree.',
   'Global hotel chain. Convention and banquet focus. Strong loyalty program. McLean HQ.',
   NOW(), NOW()),

  (32, 'Hyatt Hotels', 'customer', '22222222-2222-4222-8222-000000000008',
   '312-555-3013', 'foodsourcing@hyatt.com', 'https://hyatt.com',
   '150 N Riverside Plaza', 'Chicago', 'IL', '60606', 2,
   'A', 'https://linkedin.com/company/hyatt', 52000, 1957,
   'Hyatt Hotels Corporation operates 1,200+ properties across 20+ brands including Park Hyatt, Grand Hyatt, and Thompson Hotels.',
   'Upscale hotel chain. Strong restaurant-in-hotel concepts. Chicago heritage. Pritzker family legacy.',
   NOW(), NOW()),

  -- Healthcare (2) - Split
  (33, 'HCA Healthcare', 'customer', '22222222-2222-4222-8222-000000000003',
   '615-555-3014', 'dietary@hcahealthcare.com', 'https://hcahealthcare.com',
   'One Park Plaza', 'Nashville', 'TN', '37203', 2,
   'A', 'https://linkedin.com/company/hca-healthcare', 250000, 1968,
   'HCA Healthcare is the largest for-profit hospital operator in the US with 180+ hospitals and 2,000+ care sites across 20 states and UK.',
   'Largest for-profit hospital chain. High volume dietary operations. Centralized purchasing. Nashville HQ.',
   NOW(), NOW()),

  (34, 'Ascension Health', 'customer', '22222222-2222-4222-8222-000000000003',
   '314-555-3015', 'nutrition@ascension.org', 'https://ascension.org',
   '4600 Edmundson Road', 'St. Louis', 'MO', '63134', 4,
   'B', 'https://linkedin.com/company/ascension', 150000, 1999,
   'Ascension is the largest non-profit Catholic health system in the US with 140+ hospitals across 19 states. Mission-driven care focus.',
   'Largest non-profit hospital system. Faith-based healthcare. Strong community focus. Socially responsible sourcing.',
   NOW(), NOW()),

  -- Education (2) - Split
  (35, 'Aramark Higher Education', 'customer', '22222222-2222-4222-8222-000000000005',
   '215-555-3016', 'education@aramark.com', 'https://aramark.com',
   '2400 Market Street', 'Philadelphia', 'PA', '19103', 2,
   'A', 'https://linkedin.com/company/aramark', 270000, 1936,
   'Aramark is a global leader in food services, facilities, and uniforms. Higher Education division serves 500+ colleges and universities nationwide.',
   'Contract foodservice for universities. Retail and residential dining. Broad client base. Philadelphia HQ.',
   NOW(), NOW()),

  (36, 'Sodexo Campus Services', 'customer', '22222222-2222-4222-8222-000000000005',
   '301-555-3017', 'campus@sodexo.com', 'https://sodexo.com',
   '9801 Washingtonian Blvd', 'Gaithersburg', 'MD', '20878', 5,
   'B', 'https://linkedin.com/company/sodexo', 422000, 1966,
   'Sodexo is a global foodservice and facilities management company serving 100 million consumers daily. Campus Services division operates at 700+ universities.',
   'Global contract foodservice. University and K-12 operations. Strong sustainability focus. French parent company.',
   NOW(), NOW()),

  -- Senior Living (2) - Sue
  (37, 'Brookdale Senior Living', 'customer', '22222222-2222-4222-8222-000000000003',
   '615-555-3018', 'culinary@brookdale.com', 'https://brookdale.com',
   '111 Westwood Place', 'Brentwood', 'TN', '37027', 6,
   'B', 'https://linkedin.com/company/brookdale-senior-living', 56000, 1978,
   'Brookdale Senior Living is the largest operator of senior living communities in the US with 675+ communities offering independent living, assisted living, and memory care.',
   'Largest senior living operator. Multiple care levels. High dining standards. Nashville area HQ.',
   NOW(), NOW()),

  (38, 'Sunrise Senior Living', 'customer', '22222222-2222-4222-8222-000000000003',
   '703-555-3019', 'dining@sunriseseniorliving.com', 'https://sunriseseniorliving.com',
   '7900 Westpark Drive', 'McLean', 'VA', '22102', 6,
   'B', 'https://linkedin.com/company/sunrise-senior-living', 28000, 1981,
   'Sunrise Senior Living operates 270+ senior living communities in the US, Canada, and UK offering personalized assisted living and memory care.',
   'Premium senior living communities. Chef-prepared dining. Strong brand reputation. Quality focus.',
   NOW(), NOW()),

  -- Sports/Entertainment (1) - Brent
  (39, 'Levy Restaurants', 'customer', '22222222-2222-4222-8222-000000000008',
   '312-555-3020', 'procurement@levyrestaurants.com', 'https://levyrestaurants.com',
   '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 2,
   'A', 'https://linkedin.com/company/levy-restaurants', 18000, 1978,
   'Levy Restaurants is the pioneer of premium sports and entertainment dining, serving 100+ stadiums, arenas, and convention centers. Part of Compass Group.',
   'Premium sports and entertainment foodservice. Stadiums and arenas. Compass Group owned. Chicago heritage.',
   NOW(), NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 39, true);

-- ============================================================================
-- PART 6A: DISTRIBUTOR BRANCHES (12 regional locations)
-- ============================================================================
-- Regional branches of major broadline distributors (Sysco & GFS)
-- These link back to parent organizations via parent_organization_id
-- Organization IDs: 40-51
-- ============================================================================

-- Sysco Corporation Branches (Parent ID: 10)
-- Sysco has 68+ operating companies; we include key regional ones
INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, phone, email, website,
  address, city, state, postal_code, sales_id, parent_organization_id,
  priority, linkedin_url, employee_count, founded_year, description,
  notes, created_at, updated_at
)
VALUES
  -- Sysco Chicago (Major Midwest hub)
  (40, 'Sysco Chicago', 'distributor', '22222222-2222-4222-8222-000000000001',
   '708-555-4001', 'chicago@sysco.com', 'https://sysco.com',
   '250 Wieboldt Drive', 'Des Plaines', 'IL', '60018', 2, 10,
   'B', 'https://linkedin.com/company/sysco', 1200, 1969,
   'Sysco Chicago is a major Midwest distribution center serving the Chicago metro and Northern Illinois.',
   'Major Midwest distribution center. Serves Chicago metro and Northern Illinois.',
   NOW(), NOW()),

  -- Sysco Houston (Headquarters area)
  (41, 'Sysco Houston', 'distributor', '22222222-2222-4222-8222-000000000001',
   '281-555-4002', 'houston@sysco.com', 'https://sysco.com',
   '10710 Greens Crossing Blvd', 'Houston', 'TX', '77038', 2, 10,
   'A', 'https://linkedin.com/company/sysco', 1500, 1969,
   'Sysco Houston is the Texas flagship operation near corporate HQ, handling major Gulf Coast distribution.',
   'Texas flagship operation near corporate HQ. Major Gulf Coast distribution.',
   NOW(), NOW()),

  -- Sysco Los Angeles (West Coast hub)
  (42, 'Sysco Los Angeles', 'distributor', '22222222-2222-4222-8222-000000000001',
   '323-555-4003', 'losangeles@sysco.com', 'https://sysco.com',
   '20701 Currier Road', 'Walnut', 'CA', '91789', 3, 10,
   'A', 'https://linkedin.com/company/sysco', 1400, 1969,
   'Sysco Los Angeles is a major West Coast distribution center serving the Southern California market.',
   'Major West Coast distribution center. Serves Southern California market.',
   NOW(), NOW()),

  -- Sysco Atlanta (Southeast hub)
  (43, 'Sysco Atlanta', 'distributor', '22222222-2222-4222-8222-000000000001',
   '770-555-4004', 'atlanta@sysco.com', 'https://sysco.com',
   '5900 Fulton Industrial Blvd', 'Atlanta', 'GA', '30336', 3, 10,
   'B', 'https://linkedin.com/company/sysco', 1100, 1969,
   'Sysco Atlanta is the Southeast regional hub serving Georgia, Alabama, and surrounding states.',
   'Southeast regional hub. Serves Georgia, Alabama, and surrounding states.',
   NOW(), NOW()),

  -- Sysco Denver (Mountain region)
  (44, 'Sysco Denver', 'distributor', '22222222-2222-4222-8222-000000000001',
   '303-555-4005', 'denver@sysco.com', 'https://sysco.com',
   '5801 E 58th Avenue', 'Commerce City', 'CO', '80022', 4, 10,
   'B', 'https://linkedin.com/company/sysco', 800, 1969,
   'Sysco Denver handles Mountain region distribution serving Colorado, Wyoming, and mountain states.',
   'Mountain region distribution. Serves Colorado, Wyoming, and mountain states.',
   NOW(), NOW()),

  -- Sysco Boston (Northeast)
  (45, 'Sysco Boston', 'distributor', '22222222-2222-4222-8222-000000000001',
   '508-555-4006', 'boston@sysco.com', 'https://sysco.com',
   '99 Spring Street', 'Plympton', 'MA', '02367', 4, 10,
   'B', 'https://linkedin.com/company/sysco', 900, 1969,
   'Sysco Boston is the New England regional distribution center serving Massachusetts and the Northeast.',
   'New England regional distribution center. Serves Massachusetts and Northeast.',
   NOW(), NOW());

-- Gordon Food Service Branches (Parent ID: 13)
-- GFS is family-owned with strong Midwest/Canada presence
INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, phone, email, website,
  address, city, state, postal_code, sales_id, parent_organization_id,
  priority, linkedin_url, employee_count, founded_year, description,
  notes, created_at, updated_at
)
VALUES
  -- GFS Detroit (Major Midwest market)
  (46, 'Gordon Food Service - Detroit', 'distributor', '22222222-2222-4222-8222-000000000001',
   '313-555-4601', 'detroit@gfs.com', 'https://gfs.com',
   '2555 Enterprise Drive', 'Brighton', 'MI', '48114', 3, 13,
   'B', 'https://linkedin.com/company/gordon-food-service', 650, 1897,
   'Gordon Food Service Detroit is a major Michigan distribution hub serving Detroit metro and Southeast Michigan.',
   'Major Michigan distribution hub. Serves Detroit metro and Southeast Michigan.',
   NOW(), NOW()),

  -- GFS Minneapolis (Upper Midwest)
  (47, 'Gordon Food Service - Minneapolis', 'distributor', '22222222-2222-4222-8222-000000000001',
   '612-555-4602', 'minneapolis@gfs.com', 'https://gfs.com',
   '7700 68th Avenue N', 'Brooklyn Park', 'MN', '55428', 3, 13,
   'B', 'https://linkedin.com/company/gordon-food-service', 550, 1897,
   'Gordon Food Service Minneapolis is the Upper Midwest regional center serving Minnesota, Wisconsin, and Dakotas.',
   'Upper Midwest regional center. Serves Minnesota, Wisconsin, and Dakotas.',
   NOW(), NOW()),

  -- GFS Columbus (Ohio Valley)
  (48, 'Gordon Food Service - Columbus', 'distributor', '22222222-2222-4222-8222-000000000001',
   '614-555-4603', 'columbus@gfs.com', 'https://gfs.com',
   '4700 Cemetery Road', 'Hilliard', 'OH', '43026', 4, 13,
   'B', 'https://linkedin.com/company/gordon-food-service', 480, 1897,
   'Gordon Food Service Columbus is the Ohio Valley distribution center serving Ohio, Indiana, and Kentucky.',
   'Ohio Valley distribution center. Serves Ohio, Indiana, and Kentucky.',
   NOW(), NOW()),

  -- GFS Florida (Southeast expansion)
  (49, 'Gordon Food Service - Florida', 'distributor', '22222222-2222-4222-8222-000000000001',
   '407-555-4604', 'florida@gfs.com', 'https://gfs.com',
   '1500 Tradeport Drive', 'Jacksonville', 'FL', '32218', 5, 13,
   'C', 'https://linkedin.com/company/gordon-food-service', 420, 1897,
   'Gordon Food Service Florida is the Southeast regional hub for GFS expansion into Florida market.',
   'Southeast regional hub. GFS expansion into Florida market.',
   NOW(), NOW()),

  -- GFS Texas (Southwest expansion)
  (50, 'Gordon Food Service - Texas', 'distributor', '22222222-2222-4222-8222-000000000001',
   '214-555-4605', 'texas@gfs.com', 'https://gfs.com',
   '4100 Diplomacy Row', 'Fort Worth', 'TX', '76155', 5, 13,
   'C', 'https://linkedin.com/company/gordon-food-service', 380, 1897,
   'Gordon Food Service Texas is the Texas regional distribution center for GFS expansion into Southwest market.',
   'Texas regional distribution. GFS expansion into Southwest market.',
   NOW(), NOW()),

  -- GFS Pennsylvania (Mid-Atlantic)
  (51, 'Gordon Food Service - Pennsylvania', 'distributor', '22222222-2222-4222-8222-000000000001',
   '717-555-4606', 'pennsylvania@gfs.com', 'https://gfs.com',
   '600 Crossroads Drive', 'Lewisberry', 'PA', '17339', 6, 13,
   'C', 'https://linkedin.com/company/gordon-food-service', 340, 1897,
   'Gordon Food Service Pennsylvania is the Mid-Atlantic distribution center serving Pennsylvania, New Jersey, Delaware.',
   'Mid-Atlantic distribution center. Serves Pennsylvania, New Jersey, Delaware.',
   NOW(), NOW());

-- Update sequence to account for new branch organizations
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 51, true);

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
  id, name, first_name, last_name, email, phone, title, department, organization_id, sales_id,
  address, city, state, postal_code, country, birthday, linkedin_url, notes, tags,
  first_seen, last_seen, created_at, updated_at
)
VALUES
  -- ========================================
  -- PRINCIPAL CONTACTS (18 total, 2 per org)
  -- Enhanced with: address, birthday, linkedin, notes, tags, first_seen, last_seen
  -- ========================================

  -- McCRUM (Org 1) - Brent manages
  (1, 'John McCrum', 'John', 'McCrum', '[{"email": "john@mccrum.com", "type": "Work"}]', '[{"phone": "208-555-1101", "type": "Work"}]',
   'VP Sales', 'Sales', 1, 2,
   '123 Potato Lane', 'Idaho Falls', 'ID', '83401', 'USA', '1968-03-15',
   'https://linkedin.com/in/johnmccrum', 'Key decision maker for all foodservice accounts. Prefers phone calls over email. Golf enthusiast.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '3 days', NOW(), NOW()),
  (2, 'Sarah Miller', 'Sarah', 'Miller', '[{"email": "sarah.miller@mccrum.com", "type": "Work"}]', '[{"phone": "208-555-1102", "type": "Work"}]',
   'Account Manager', 'Sales', 1, 2,
   '123 Potato Lane', 'Idaho Falls', 'ID', '83401', 'USA', '1985-07-22',
   'https://linkedin.com/in/sarahmiller-mccrum', 'Very responsive, handles day-to-day account management. Reports to John.',
   ARRAY[]::bigint[], NOW() - INTERVAL '18 months', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- SWAP (Org 2) - Brent manages
  (3, 'Michael Chen', 'Michael', 'Chen', '[{"email": "mchen@swapfoods.com", "type": "Work"}]', '[{"phone": "312-555-1201", "type": "Work"}]',
   'CEO', 'Executive', 2, 2,
   '456 Innovation Drive', 'Chicago', 'IL', '60601', 'USA', '1975-11-08',
   'https://linkedin.com/in/michaelchen-swap', 'Founded SWAP in 2019. Very passionate about sustainability and plant-based alternatives. Decision Maker + Budget Holder + VIP.',
   ARRAY[1, 2, 3]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '5 days', NOW(), NOW()),
  (4, 'Lisa Wong', 'Lisa', 'Wong', '[{"email": "lwong@swapfoods.com", "type": "Work"}]', '[{"phone": "312-555-1202", "type": "Work"}]',
   'National Sales Manager', 'Sales', 2, 2,
   '456 Innovation Drive', 'Chicago', 'IL', '60601', 'USA', '1982-04-30',
   'https://linkedin.com/in/lisawong-swap', 'Manages all national accounts. Very data-driven, always wants ROI analysis.',
   ARRAY[]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),

  -- Rapid Rasoi (Org 3) - Michelle manages
  (5, 'Raj Patel', 'Raj', 'Patel', '[{"email": "raj@rapidrasoi.com", "type": "Work"}]', '[{"phone": "510-555-1301", "type": "Work"}]',
   'Owner', 'Executive', 3, 3,
   '789 Spice Boulevard', 'Fremont', 'CA', '94536', 'USA', '1960-09-12',
   'https://linkedin.com/in/rajpatel-rapidrasoi', 'Owner and has final say on all partnerships. Family business - son also involved in operations.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '1 day', NOW(), NOW()),
  (6, 'Priya Sharma', 'Priya', 'Sharma', '[{"email": "priya@rapidrasoi.com", "type": "Work"}]', '[{"phone": "510-555-1302", "type": "Work"}]',
   'Sales Director', 'Sales', 3, 3,
   '789 Spice Boulevard', 'Fremont', 'CA', '94536', 'USA', '1988-02-18',
   'https://linkedin.com/in/priyasharma-rapidrasoi', 'Very knowledgeable about authentic Indian cuisine. Excellent at product demos.',
   ARRAY[]::bigint[], NOW() - INTERVAL '30 months', NOW() - INTERVAL '4 days', NOW(), NOW()),

  -- Lakeview Farms (Org 4) - Michelle manages
  (7, 'Tom Harrison', 'Tom', 'Harrison', '[{"email": "tharrison@lakeviewfarms.com", "type": "Work"}]', '[{"phone": "614-555-1401", "type": "Work"}]',
   'President', 'Executive', 4, 3,
   '321 Dairy Road', 'Columbus', 'OH', '43215', 'USA', '1958-12-03',
   'https://linkedin.com/in/tomharrison-lakeview', 'President for 15 years. Very loyal to existing suppliers - need to build trust slowly.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),
  (8, 'Jennifer Adams', 'Jennifer', 'Adams', '[{"email": "jadams@lakeviewfarms.com", "type": "Work"}]', '[{"phone": "614-555-1402", "type": "Work"}]',
   'Regional Sales Manager', 'Sales', 4, 3,
   '321 Dairy Road', 'Columbus', 'OH', '43215', 'USA', '1979-06-25',
   'https://linkedin.com/in/jenniferadams-lakeview', 'Covers Midwest territory. Very responsive and detail-oriented.',
   ARRAY[]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Frico (Org 5) - Gary manages
  (9, 'Marco Rossi', 'Marco', 'Rossi', '[{"email": "mrossi@frico.it", "type": "Work"}]', '[{"phone": "201-555-1501", "type": "Work"}]',
   'US Sales Director', 'Sales', 5, 4,
   '555 Cheese Way', 'Newark', 'NJ', '07102', 'USA', '1972-08-14',
   'https://linkedin.com/in/marcorossi-frico', 'Travels frequently between US and Italy. Best to schedule calls on Tuesdays or Wednesdays.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '6 days', NOW(), NOW()),
  (10, 'Anna Bianchi', 'Anna', 'Bianchi', '[{"email": "abianchi@frico.it", "type": "Work"}]', '[{"phone": "201-555-1502", "type": "Work"}]',
   'Account Executive', 'Sales', 5, 4,
   '555 Cheese Way', 'Newark', 'NJ', '07102', 'USA', '1990-01-29',
   'https://linkedin.com/in/annabianchi-frico', 'Handles day-to-day account communication. Fluent in Italian and English.',
   ARRAY[]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

  -- Anchor (Org 6) - Gary manages
  (11, 'David Thompson', 'David', 'Thompson', '[{"email": "dthompson@anchor.com", "type": "Work"}]', '[{"phone": "415-555-1601", "type": "Work"}]',
   'VP Foodservice', 'Sales', 6, 4,
   '888 Pacific Avenue', 'San Francisco', 'CA', '94102', 'USA', '1965-05-20',
   'https://linkedin.com/in/davidthompson-anchor', 'Very data-driven. Always wants to see ROI analysis before making decisions.',
   ARRAY[1, 2]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '1 week', NOW(), NOW()),
  (12, 'Emily Walker', 'Emily', 'Walker', '[{"email": "ewalker@anchor.com", "type": "Work"}]', '[{"phone": "415-555-1602", "type": "Work"}]',
   'Key Account Manager', 'Sales', 6, 4,
   '888 Pacific Avenue', 'San Francisco', 'CA', '94102', 'USA', '1987-10-11',
   'https://linkedin.com/in/emilywalker-anchor', 'Manages major chain accounts. Very organized and follows up consistently.',
   ARRAY[]::bigint[], NOW() - INTERVAL '18 months', NOW() - INTERVAL '5 days', NOW(), NOW()),

  -- Tattooed Chef (Org 7) - Dale manages
  (13, 'Sarah Johnson', 'Sarah', 'Johnson', '[{"email": "sjohnson@tattooedchef.com", "type": "Work"}]', '[{"phone": "323-555-1701", "type": "Work"}]',
   'Founder', 'Executive', 7, 5,
   '777 Vegan Street', 'Los Angeles', 'CA', '90001', 'USA', '1980-04-05',
   'https://linkedin.com/in/sarahjohnson-tattooedchef', 'Media-savvy - company often featured in press. Great for case studies if we win the business.',
   ARRAY[1, 3]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 days', NOW(), NOW()),
  (14, 'Brian Martinez', 'Brian', 'Martinez', '[{"email": "bmartinez@tattooedchef.com", "type": "Work"}]', '[{"phone": "323-555-1702", "type": "Work"}]',
   'Foodservice Director', 'Sales', 7, 5,
   '777 Vegan Street', 'Los Angeles', 'CA', '90001', 'USA', '1983-09-17',
   'https://linkedin.com/in/brianmartinez-tattooedchef', 'Handles all foodservice channel development. Former chef with deep culinary knowledge.',
   ARRAY[]::bigint[], NOW() - INTERVAL '14 months', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Litehouse (Org 8) - Dale manages
  (15, 'Robert Lewis', 'Robert', 'Lewis', '[{"email": "rlewis@litehousefoods.com", "type": "Work"}]', '[{"phone": "208-555-1801", "type": "Work"}]',
   'VP Sales', 'Sales', 8, 5,
   '1109 Front Street', 'Sandpoint', 'ID', '83864', 'USA', '1962-07-30',
   'https://linkedin.com/in/robertlewis-litehouse', 'Long tenure at Litehouse. Very relationship-focused. Prefers face-to-face meetings.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '10 days', NOW(), NOW()),
  (16, 'Karen White', 'Karen', 'White', '[{"email": "kwhite@litehousefoods.com", "type": "Work"}]', '[{"phone": "208-555-1802", "type": "Work"}]',
   'National Accounts', 'Sales', 8, 5,
   '1109 Front Street', 'Sandpoint', 'ID', '83864', 'USA', '1978-03-08',
   'https://linkedin.com/in/karenwhite-litehouse', 'Manages chain restaurant accounts. Very detail-oriented with pricing and contracts.',
   ARRAY[]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '4 days', NOW(), NOW()),

  -- Custom Culinary (Org 9) - Sue manages
  (17, 'James Wilson', 'James', 'Wilson', '[{"email": "jwilson@customculinary.com", "type": "Work"}]', '[{"phone": "708-555-1901", "type": "Work"}]',
   'President', 'Executive', 9, 6,
   '2555 Busse Road', 'Elk Grove Village', 'IL', '60007', 'USA', '1955-11-22',
   'https://linkedin.com/in/jameswilson-customculinary', 'Industry veteran with 30+ years experience. Strong network in culinary community.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),
  (18, 'Nancy Brown', 'Nancy', 'Brown', '[{"email": "nbrown@customculinary.com", "type": "Work"}]', '[{"phone": "708-555-1902", "type": "Work"}]',
   'Sales Team Leader', 'Sales', 9, 6,
   '2555 Busse Road', 'Elk Grove Village', 'IL', '60007', 'USA', '1981-08-14',
   'https://linkedin.com/in/nancybrown-customculinary', 'Leads regional sales team. Very proactive in scheduling demos and samples.',
   ARRAY[]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

  -- ========================================
  -- DISTRIBUTOR CONTACTS (20 total, 2 per org)
  -- Enhanced with: address, birthday, linkedin, notes, tags, first_seen, last_seen
  -- ========================================

  -- Sysco (Org 10) - Brent manages
  (19, 'Michael Roberts', 'Michael', 'Roberts', '[{"email": "mroberts@sysco.com", "type": "Work"}]', '[{"phone": "281-555-2001", "type": "Work"}]',
   'Category Manager', 'Purchasing', 10, 2,
   '1390 Enclave Parkway', 'Houston', 'TX', '77077', 'USA', '1975-06-18',
   'https://linkedin.com/in/michaelroberts-sysco', 'Key category manager for specialty items. Very process-oriented. Quarterly reviews required.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '2 days', NOW(), NOW()),
  (20, 'Susan Clark', 'Susan', 'Clark', '[{"email": "sclark@sysco.com", "type": "Work"}]', '[{"phone": "281-555-2002", "type": "Work"}]',
   'Senior Buyer', 'Purchasing', 10, 2,
   '1390 Enclave Parkway', 'Houston', 'TX', '77077', 'USA', '1982-09-25',
   'https://linkedin.com/in/susanclark-sysco', 'Handles day-to-day purchasing. Very detail-oriented with spec sheets and pricing.',
   ARRAY[]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- US Foods (Org 11) - Brent manages
  (21, 'Richard Davis', 'Richard', 'Davis', '[{"email": "rdavis@usfoods.com", "type": "Work"}]', '[{"phone": "847-555-2101", "type": "Work"}]',
   'VP Merchandising', 'Purchasing', 11, 2,
   '9399 W Higgins Road', 'Rosemont', 'IL', '60018', 'USA', '1968-04-12',
   'https://linkedin.com/in/richarddavis-usfoods', 'Senior decision maker. Focuses on product innovation and differentiation.',
   ARRAY[1, 2]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '3 days', NOW(), NOW()),
  (22, 'Patricia Moore', 'Patricia', 'Moore', '[{"email": "pmoore@usfoods.com", "type": "Work"}]', '[{"phone": "847-555-2102", "type": "Work"}]',
   'Category Specialist', 'Purchasing', 11, 2,
   '9399 W Higgins Road', 'Rosemont', 'IL', '60018', 'USA', '1985-12-08',
   'https://linkedin.com/in/patriciamoore-usfoods', 'Manages frozen and dairy categories. Quarterly category reviews.',
   ARRAY[]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '5 days', NOW(), NOW()),

  -- PFG (Org 12) - Michelle manages
  (23, 'Steven Anderson', 'Steven', 'Anderson', '[{"email": "sanderson@pfgc.com", "type": "Work"}]', '[{"phone": "616-555-2201", "type": "Work"}]',
   'Purchasing Director', 'Purchasing', 12, 3,
   '12500 West Creek Parkway', 'Richmond', 'VA', '23238', 'USA', '1970-03-22',
   'https://linkedin.com/in/stevenanderson-pfg', 'Regional purchasing director. Strong relationships with operators.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '1 week', NOW(), NOW()),
  (24, 'Linda Thomas', 'Linda', 'Thomas', '[{"email": "lthomas@pfgc.com", "type": "Work"}]', '[{"phone": "616-555-2202", "type": "Work"}]',
   'Buyer', 'Purchasing', 12, 3,
   '12500 West Creek Parkway', 'Richmond', 'VA', '23238', 'USA', '1988-07-14',
   'https://linkedin.com/in/lindathomas-pfg', 'Handles specialty and ethnic food categories. Growing this segment.',
   ARRAY[]::bigint[], NOW() - INTERVAL '18 months', NOW() - INTERVAL '4 days', NOW(), NOW()),

  -- GFS (Org 13) - Michelle manages
  (25, 'William Taylor', 'William', 'Taylor', '[{"email": "wtaylor@gfs.com", "type": "Work"}]', '[{"phone": "616-555-2301", "type": "Work"}]',
   'VP Procurement', 'Purchasing', 13, 3,
   '1300 Gezon Parkway SW', 'Grand Rapids', 'MI', '49509', 'USA', '1965-11-30',
   'https://linkedin.com/in/williamtaylor-gfs', 'Long tenure at GFS. Strong advocate for family-owned suppliers.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),
  (26, 'Barbara Jackson', 'Barbara', 'Jackson', '[{"email": "bjackson@gfs.com", "type": "Work"}]', '[{"phone": "616-555-2302", "type": "Work"}]',
   'Merchandising Manager', 'Purchasing', 13, 3,
   '1300 Gezon Parkway SW', 'Grand Rapids', 'MI', '49509', 'USA', '1979-02-08',
   'https://linkedin.com/in/barbarajackson-gfs', 'Manages product assortment. Focus on Midwest regional preferences.',
   ARRAY[]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '6 days', NOW(), NOW()),

  -- Shamrock Foods (Org 14) - Gary manages
  (27, 'Daniel Martin', 'Daniel', 'Martin', '[{"email": "dmartin@shamrockfoods.com", "type": "Work"}]', '[{"phone": "602-555-2401", "type": "Work"}]',
   'President', 'Executive', 14, 4,
   '2540 N 29th Avenue', 'Phoenix', 'AZ', '85009', 'USA', '1958-08-05',
   'https://linkedin.com/in/danielmartin-shamrock', 'Third-generation family leadership. Strong community ties in Southwest.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '7 years', NOW() - INTERVAL '3 weeks', NOW(), NOW()),
  (28, 'Jennifer Garcia', 'Jennifer', 'Garcia', '[{"email": "jgarcia@shamrockfoods.com", "type": "Work"}]', '[{"phone": "602-555-2402", "type": "Work"}]',
   'Buyer', 'Purchasing', 14, 4,
   '2540 N 29th Avenue', 'Phoenix', 'AZ', '85009', 'USA', '1986-05-19',
   'https://linkedin.com/in/jennifergarcia-shamrock', 'Handles dairy and frozen categories. Very responsive.',
   ARRAY[]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '5 days', NOW(), NOW()),

  -- Ben E. Keith (Org 15) - Gary manages
  (29, 'Christopher Lee', 'Christopher', 'Lee', '[{"email": "clee@benekeith.com", "type": "Work"}]', '[{"phone": "817-555-2501", "type": "Work"}]',
   'VP Sales', 'Sales', 15, 4,
   '601 E 7th Street', 'Fort Worth', 'TX', '76102', 'USA', '1972-10-28',
   'https://linkedin.com/in/christopherlee-benekeith', 'Strong Texas market knowledge. Good relationships with chains.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '1 week', NOW(), NOW()),
  (30, 'Amanda Wilson', 'Amanda', 'Wilson', '[{"email": "awilson@benekeith.com", "type": "Work"}]', '[{"phone": "817-555-2502", "type": "Work"}]',
   'Purchasing Manager', 'Purchasing', 15, 4,
   '601 E 7th Street', 'Fort Worth', 'TX', '76102', 'USA', '1984-01-15',
   'https://linkedin.com/in/amandawilson-benekeith', 'Manages vendor relationships. Quarterly business reviews.',
   ARRAY[]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '4 days', NOW(), NOW()),

  -- Reinhart (Org 16) - Dale manages
  (31, 'Matthew Harris', 'Matthew', 'Harris', '[{"email": "mharris@rfrsinc.com", "type": "Work"}]', '[{"phone": "630-555-2601", "type": "Work"}]',
   'Procurement Director', 'Purchasing', 16, 5,
   '2355 Oak Industrial Drive NE', 'Grand Rapids', 'MI', '49505', 'USA', '1976-07-22',
   'https://linkedin.com/in/matthewharris-reinhart', 'Upper Midwest specialist. Focus on independent restaurants.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '6 days', NOW(), NOW()),
  (32, 'Jessica Robinson', 'Jessica', 'Robinson', '[{"email": "jrobinson@rfrsinc.com", "type": "Work"}]', '[{"phone": "630-555-2602", "type": "Work"}]',
   'Buyer', 'Purchasing', 16, 5,
   '2355 Oak Industrial Drive NE', 'Grand Rapids', 'MI', '49505', 'USA', '1990-04-03',
   'https://linkedin.com/in/jessicarobinson-reinhart', 'New to role, building product knowledge. Very eager to learn.',
   ARRAY[]::bigint[], NOW() - INTERVAL '1 year', NOW() - INTERVAL '3 days', NOW(), NOW()),

  -- Dot Foods (Org 17) - Dale manages
  (33, 'Andrew Clark', 'Andrew', 'Clark', '[{"email": "aclark@dotfoods.com", "type": "Work"}]', '[{"phone": "217-555-2701", "type": "Work"}]',
   'VP Vendor Relations', 'Purchasing', 17, 5,
   '1 Dot Way', 'Mt Sterling', 'IL', '62353', 'USA', '1969-12-10',
   'https://linkedin.com/in/andrewclark-dotfoods', 'Key decision maker for redistribution. Focus on efficiency and logistics.',
   ARRAY[1, 2]::bigint[], NOW() - INTERVAL '8 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),
  (34, 'Michelle Lewis', 'Michelle', 'Lewis', '[{"email": "mlewis@dotfoods.com", "type": "Work"}]', '[{"phone": "217-555-2702", "type": "Work"}]',
   'Category Manager', 'Purchasing', 17, 5,
   '1 Dot Way', 'Mt Sterling', 'IL', '62353', 'USA', '1983-06-28',
   'https://linkedin.com/in/michellelewis-dotfoods', 'Manages frozen and refrigerated redistribution categories.',
   ARRAY[]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '5 days', NOW(), NOW()),

  -- European Imports (Org 18) - Sue manages
  (35, 'Paul Scott', 'Paul', 'Scott', '[{"email": "pscott@eiltd.com", "type": "Work"}]', '[{"phone": "312-555-2801", "type": "Work"}]',
   'President', 'Executive', 18, 6,
   '600 E Brook Drive', 'Arlington Heights', 'IL', '60005', 'USA', '1960-09-15',
   'https://linkedin.com/in/paulscott-europeanimports', 'Built business from scratch. Deep European supplier relationships.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '10 years', NOW() - INTERVAL '3 weeks', NOW(), NOW()),
  (36, 'Rachel Young', 'Rachel', 'Young', '[{"email": "ryoung@eiltd.com", "type": "Work"}]', '[{"phone": "312-555-2802", "type": "Work"}]',
   'Specialty Buyer', 'Purchasing', 18, 6,
   '600 E Brook Drive', 'Arlington Heights', 'IL', '60005', 'USA', '1987-03-20',
   'https://linkedin.com/in/rachelyoung-europeanimports', 'Cheese and charcuterie specialist. Culinary school background.',
   ARRAY[]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Chefs Warehouse (Org 19) - Sue manages
  (37, 'Kevin King', 'Kevin', 'King', '[{"email": "kking@chefswarehouse.com", "type": "Work"}]', '[{"phone": "203-555-2901", "type": "Work"}]',
   'CEO', 'Executive', 19, 6,
   '100 East Ridge Road', 'Ridgefield', 'CT', '06877', 'USA', '1962-11-08',
   'https://linkedin.com/in/kevinking-chefswarehouse', 'Public company CEO. Focus on fine dining segment growth.',
   ARRAY[1, 3]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),
  (38, 'Laura Wright', 'Laura', 'Wright', '[{"email": "lwright@chefswarehouse.com", "type": "Work"}]', '[{"phone": "203-555-2902", "type": "Work"}]',
   'Purchasing Director', 'Purchasing', 19, 6,
   '100 East Ridge Road', 'Ridgefield', 'CT', '06877', 'USA', '1978-08-12',
   'https://linkedin.com/in/laurawright-chefswarehouse', 'Manages specialty purchasing. Strong chef relationships.',
   ARRAY[]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '4 days', NOW(), NOW()),

  -- ========================================
  -- CUSTOMER CONTACTS (42 total, 2-3 per org)
  -- Enhanced with: address, birthday, linkedin, notes, tags, first_seen, last_seen
  -- ========================================

  -- Capital Grille (Org 20) - Brent manages
  (39, 'Chef Marcus Sterling', 'Marcus', 'Sterling', '[{"email": "msterling@darden.com", "type": "Work"}]', '[{"phone": "312-555-3001", "type": "Work"}]',
   'Executive Chef', 'Culinary', 20, 2,
   '633 N Saint Clair Street', 'Chicago', 'IL', '60611', 'USA', '1978-05-14',
   'https://linkedin.com/in/chefmarcussterling', 'Award-winning chef, very particular about product quality. Prefers in-person demos.',
   ARRAY[1, 4]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '1 day', NOW(), NOW()),
  (40, 'Victoria Hayes', 'Victoria', 'Hayes', '[{"email": "vhayes@darden.com", "type": "Work"}]', '[{"phone": "312-555-3002", "type": "Work"}]',
   'Purchasing Director', 'Operations', 20, 2,
   '633 N Saint Clair Street', 'Chicago', 'IL', '60611', 'USA', '1980-11-22',
   'https://linkedin.com/in/victoriahayes-darden', 'Champion + Decision Maker. Very data-driven, manages corporate purchasing for all Darden brands.',
   ARRAY[1, 2]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

  -- Ruth''s Chris (Org 21) - Brent manages
  (41, 'Chef Anthony Romano', 'Anthony', 'Romano', '[{"email": "aromano@ruthschris.com", "type": "Work"}]', '[{"phone": "504-555-3101", "type": "Work"}]',
   'Corporate Executive Chef', 'Culinary', 21, 2,
   '500 Tchoupitoulas Street', 'New Orleans', 'LA', '70130', 'USA', '1965-03-18',
   'https://linkedin.com/in/chefanthonyromano', 'Italian heritage, classically trained. Very technical, loves product knowledge.',
   ARRAY[5]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '5 days', NOW(), NOW()),
  (42, 'Diana Mitchell', 'Diana', 'Mitchell', '[{"email": "dmitchell@ruthschris.com", "type": "Work"}]', '[{"phone": "504-555-3102", "type": "Work"}]',
   'VP Supply Chain', 'Operations', 21, 2,
   '500 Tchoupitoulas Street', 'New Orleans', 'LA', '70130', 'USA', '1972-08-30',
   'https://linkedin.com/in/dianamitchell-ruthschris', 'Budget holder for all purchasing. Very process-oriented, requires formal proposals.',
   ARRAY[6]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Morton''s (Org 22) - Michelle manages
  (43, 'Chef Robert Chen', 'Robert', 'Chen', '[{"email": "rchen@mortons.com", "type": "Work"}]', '[{"phone": "312-555-3201", "type": "Work"}]',
   'Executive Chef', 'Culinary', 22, 3,
   '65 E Wacker Place', 'Chicago', 'IL', '60601', 'USA', '1975-12-05',
   'https://linkedin.com/in/chefrobertchen-mortons', 'Technical expert. Focuses on consistency across locations. Detail-oriented.',
   ARRAY[5]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '4 days', NOW(), NOW()),
  (44, 'Sandra Phillips', 'Sandra', 'Phillips', '[{"email": "sphillips@mortons.com", "type": "Work"}]', '[{"phone": "312-555-3202", "type": "Work"}]',
   'Purchasing Manager', 'Operations', 22, 3,
   '65 E Wacker Place', 'Chicago', 'IL', '60601', 'USA', '1983-06-17',
   'https://linkedin.com/in/sandraphillips-mortons', 'Cold lead - difficult to reach. Prefers email communication.',
   ARRAY[10]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),

  -- Chili''s (Org 23) - Michelle manages
  (45, 'Chef Kevin Park', 'Kevin', 'Park', '[{"email": "kpark@brinker.com", "type": "Work"}]', '[{"phone": "972-555-3301", "type": "Work"}]',
   'VP Culinary Innovation', 'Culinary', 23, 3,
   '6820 LBJ Freeway', 'Dallas', 'TX', '75240', 'USA', '1970-09-28',
   'https://linkedin.com/in/chefkevinpark-brinker', 'Influencer. Drives menu innovation. Open to new products.',
   ARRAY[4]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '3 days', NOW(), NOW()),
  (46, 'Mary Johnson', 'Mary', 'Johnson', '[{"email": "mjohnson@brinker.com", "type": "Work"}]', '[{"phone": "972-555-3302", "type": "Work"}]',
   'Procurement Director', 'Operations', 23, 3,
   '6820 LBJ Freeway', 'Dallas', 'TX', '75240', 'USA', '1976-04-11',
   'https://linkedin.com/in/maryjohnson-brinker', 'Gatekeeper. Controls vendor access. Schedule through her for all meetings.',
   ARRAY[3]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '6 days', NOW(), NOW()),

  -- Applebee''s (Org 24) - Gary manages
  (47, 'Chef Jason Torres', 'Jason', 'Torres', '[{"email": "jtorres@dinebrands.com", "type": "Work"}]', '[{"phone": "913-555-3401", "type": "Work"}]',
   'VP Menu Development', 'Culinary', 24, 4,
   '450 N Brand Blvd', 'Glendale', 'CA', '91203', 'USA', '1973-01-25',
   'https://linkedin.com/in/chefjasontorres', 'Focuses on casual dining trends. Very receptive to sampling new products.',
   ARRAY[4]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '5 days', NOW(), NOW()),
  (48, 'Carol Anderson', 'Carol', 'Anderson', '[{"email": "canderson@dinebrands.com", "type": "Work"}]', '[{"phone": "913-555-3402", "type": "Work"}]',
   'Senior Buyer', 'Operations', 24, 4,
   '450 N Brand Blvd', 'Glendale', 'CA', '91203', 'USA', '1982-10-08',
   'https://linkedin.com/in/carolanderson-dinebrands', 'Needs follow-up. Requested pricing 2 weeks ago.',
   ARRAY[9]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),

  -- Buffalo Wild Wings (Org 25) - Gary manages
  (49, 'Chef Tyler Reed', 'Tyler', 'Reed', '[{"email": "treed@inspirebrands.com", "type": "Work"}]', '[{"phone": "612-555-3501", "type": "Work"}]',
   'Food Innovation Director', 'Culinary', 25, 4,
   '3 Glenlake Parkway NE', 'Atlanta', 'GA', '30328', 'USA', '1979-07-03',
   'https://linkedin.com/in/cheftylereed', 'Innovative mindset. Looking for differentiated products.',
   ARRAY[4]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '4 days', NOW(), NOW()),
  (50, 'Rebecca Moore', 'Rebecca', 'Moore', '[{"email": "rmoore@inspirebrands.com", "type": "Work"}]', '[{"phone": "612-555-3502", "type": "Work"}]',
   'Purchasing Manager', 'Operations', 25, 4,
   '3 Glenlake Parkway NE', 'Atlanta', 'GA', '30328', 'USA', '1985-02-19',
   'https://linkedin.com/in/rebeccamoore-inspire', 'Handles day-to-day vendor management. Very organized.',
   ARRAY[]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Red Robin (Org 26) - Dale manages
  (51, 'Chef Amanda Foster', 'Amanda', 'Foster', '[{"email": "afoster@redrobin.com", "type": "Work"}]', '[{"phone": "303-555-3601", "type": "Work"}]',
   'Corporate Chef', 'Culinary', 26, 5,
   '6312 S Fiddlers Green Circle', 'Greenwood Village', 'CO', '80111', 'USA', '1980-12-14',
   'https://linkedin.com/in/chefamandafoster', 'Very collaborative. Open to co-developing menu items.',
   ARRAY[2]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '3 days', NOW(), NOW()),
  (52, 'Brian Taylor', 'Brian', 'Taylor', '[{"email": "btaylor@redrobin.com", "type": "Work"}]', '[{"phone": "303-555-3602", "type": "Work"}]',
   'Supply Chain Manager', 'Operations', 26, 5,
   '6312 S Fiddlers Green Circle', 'Greenwood Village', 'CO', '80111', 'USA', '1977-05-22',
   'https://linkedin.com/in/briantaylor-redrobin', 'Needs follow-up on logistics discussion.',
   ARRAY[9]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '10 days', NOW(), NOW()),

  -- Panera (Org 27) - Dale manages
  (53, 'Chef Sarah Mitchell', 'Sarah', 'Mitchell', '[{"email": "smitchell@panerabread.com", "type": "Work"}]', '[{"phone": "314-555-3701", "type": "Work"}]',
   'Head Baker', 'Culinary', 27, 5,
   '3630 S Geyer Road', 'St. Louis', 'MO', '63127', 'USA', '1976-08-29',
   'https://linkedin.com/in/chefsarahmitchell', 'Artisan bread expert. Focus on clean label ingredients.',
   ARRAY[5]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '2 days', NOW(), NOW()),
  (54, 'David Clark', 'David', 'Clark', '[{"email": "dclark@panerabread.com", "type": "Work"}]', '[{"phone": "314-555-3702", "type": "Work"}]',
   'VP Procurement', 'Operations', 27, 5,
   '3630 S Geyer Road', 'St. Louis', 'MO', '63127', 'USA', '1968-11-15',
   'https://linkedin.com/in/davidclark-panera', 'Gatekeeper. All vendor relationships go through him.',
   ARRAY[3]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Chipotle (Org 28) - Sue manages
  (55, 'Chef Maria Santos', 'Maria', 'Santos', '[{"email": "msantos@chipotle.com", "type": "Work"}]', '[{"phone": "949-555-3801", "type": "Work"}]',
   'VP Culinary', 'Culinary', 28, 6,
   '610 Newport Center Drive', 'Newport Beach', 'CA', '92660', 'USA', '1974-06-07',
   'https://linkedin.com/in/chefmariasantos', 'Influencer. Drives sustainable sourcing initiatives.',
   ARRAY[4]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '4 days', NOW(), NOW()),
  (56, 'Thomas Brown', 'Thomas', 'Brown', '[{"email": "tbrown@chipotle.com", "type": "Work"}]', '[{"phone": "949-555-3802", "type": "Work"}]',
   'Supply Director', 'Operations', 28, 6,
   '610 Newport Center Drive', 'Newport Beach', 'CA', '92660', 'USA', '1981-03-20',
   'https://linkedin.com/in/thomasbrown-chipotle', 'Focus on supply chain sustainability. Requires full traceability.',
   ARRAY[]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '6 days', NOW(), NOW()),

  -- Shake Shack (Org 29) - Sue manages
  (57, 'Chef Daniel Kim', 'Daniel', 'Kim', '[{"email": "dkim@shakeshack.com", "type": "Work"}]', '[{"phone": "212-555-3901", "type": "Work"}]',
   'Culinary Director', 'Culinary', 29, 6,
   '225 Varick Street', 'New York', 'NY', '10014', 'USA', '1982-09-12',
   'https://linkedin.com/in/chefdanielkim', 'Technical. Korean cuisine background. Focus on quality ingredients.',
   ARRAY[5]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '2 days', NOW(), NOW()),
  (58, 'Lisa White', 'Lisa', 'White', '[{"email": "lwhite@shakeshack.com", "type": "Work"}]', '[{"phone": "212-555-3902", "type": "Work"}]',
   'Purchasing Manager', 'Operations', 29, 6,
   '225 Varick Street', 'New York', 'NY', '10014', 'USA', '1987-01-28',
   'https://linkedin.com/in/lisawhite-shakeshack', 'Very responsive. Good relationship builder.',
   ARRAY[]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '5 days', NOW(), NOW()),

  -- Marriott (Org 30) - Brent manages
  (59, 'Chef Pierre Dubois', 'Pierre', 'Dubois', '[{"email": "pdubois@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4001", "type": "Work"}]',
   'VP Global Culinary', 'Culinary', 30, 2,
   '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 'USA', '1960-04-25',
   'https://linkedin.com/in/chefpierredubois', 'Budget holder for global culinary. French trained, Michelin background.',
   ARRAY[1, 6]::bigint[], NOW() - INTERVAL '8 years', NOW() - INTERVAL '3 days', NOW(), NOW()),
  (60, 'Jennifer Adams', 'Jennifer', 'Adams', '[{"email": "jadams2@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4002", "type": "Work"}]',
   'Procurement Director', 'Operations', 30, 2,
   '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 'USA', '1979-07-18',
   'https://linkedin.com/in/jenniferadams-marriott', 'Budget Holder + VIP. Controls North American procurement.',
   ARRAY[6, 8]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '1 week', NOW(), NOW()),
  (61, 'Robert Williams', 'Robert', 'Williams', '[{"email": "rwilliams@marriott.com", "type": "Work"}]', '[{"phone": "301-555-4003", "type": "Work"}]',
   'Regional F&B Director', 'Operations', 30, 2,
   '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 'USA', '1972-10-30',
   'https://linkedin.com/in/robertwilliams-marriott', 'Manages regional hotel F&B operations. Gateway to property-level decisions.',
   ARRAY[4]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),

  -- Hilton (Org 31) - Michelle manages
  (62, 'Chef James Martin', 'James', 'Martin', '[{"email": "jmartin@hilton.com", "type": "Work"}]', '[{"phone": "703-555-4101", "type": "Work"}]',
   'Corporate Executive Chef', 'Culinary', 31, 3,
   '7930 Jones Branch Drive', 'McLean', 'VA', '22102', 'USA', '1967-02-14',
   'https://linkedin.com/in/chefjamesmartin', 'VIP. Long tenure, influential across hotel industry.',
   ARRAY[8]::bigint[], NOW() - INTERVAL '10 years', NOW() - INTERVAL '4 days', NOW(), NOW()),
  (63, 'Susan Davis', 'Susan', 'Davis', '[{"email": "sdavis@hilton.com", "type": "Work"}]', '[{"phone": "703-555-4102", "type": "Work"}]',
   'VP Supply Chain', 'Operations', 31, 3,
   '7930 Jones Branch Drive', 'McLean', 'VA', '22102', 'USA', '1975-06-08',
   'https://linkedin.com/in/susandavis-hilton', 'Manages all supplier relationships. Very process-driven.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '7 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Hyatt (Org 32) - Michelle manages
  (64, 'Chef Michael Chang', 'Michael', 'Chang', '[{"email": "mchang@hyatt.com", "type": "Work"}]', '[{"phone": "312-555-4201", "type": "Work"}]',
   'VP F&B Operations', 'Culinary', 32, 3,
   '150 N Riverside Plaza', 'Chicago', 'IL', '60606', 'USA', '1971-11-22',
   'https://linkedin.com/in/chefmichaelchang', 'Asian cuisine specialist. Focus on authenticity.',
   ARRAY[5]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '5 days', NOW(), NOW()),
  (65, 'Patricia Lewis', 'Patricia', 'Lewis', '[{"email": "plewis@hyatt.com", "type": "Work"}]', '[{"phone": "312-555-4202", "type": "Work"}]',
   'Purchasing Director', 'Operations', 32, 3,
   '150 N Riverside Plaza', 'Chicago', 'IL', '60606', 'USA', '1980-09-03',
   'https://linkedin.com/in/patricialewis-hyatt', 'Manages vendor onboarding process. Very thorough with documentation.',
   ARRAY[]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '3 days', NOW(), NOW()),

  -- HCA Healthcare (Org 33) - Gary manages
  (66, 'Dr. Sarah Thompson', 'Sarah', 'Thompson', '[{"email": "sthompson@hcahealthcare.com", "type": "Work"}]', '[{"phone": "615-555-4301", "type": "Work"}]',
   'Nutrition Services Director', 'Dietary', 33, 4,
   '1 Park Plaza', 'Nashville', 'TN', '37203', 'USA', '1968-12-01',
   'https://linkedin.com/in/drsarahthompson', 'RD, MS. Focus on patient nutrition outcomes. Science-driven.',
   ARRAY[1]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '2 days', NOW(), NOW()),
  (67, 'Mark Johnson', 'Mark', 'Johnson', '[{"email": "mjohnson2@hcahealthcare.com", "type": "Work"}]', '[{"phone": "615-555-4302", "type": "Work"}]',
   'Foodservice Manager', 'Dietary', 33, 4,
   '1 Park Plaza', 'Nashville', 'TN', '37203', 'USA', '1983-05-17',
   'https://linkedin.com/in/markjohnson-hca', 'Needs follow-up on texture-modified product samples.',
   ARRAY[9]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '10 days', NOW(), NOW()),

  -- Ascension (Org 34) - Gary manages
  (68, 'Dr. Emily Roberts', 'Emily', 'Roberts', '[{"email": "eroberts@ascension.org", "type": "Work"}]', '[{"phone": "314-555-4401", "type": "Work"}]',
   'VP Support Services', 'Dietary', 34, 4,
   '4600 Edmundson Road', 'St. Louis', 'MO', '63134', 'USA', '1965-08-21',
   'https://linkedin.com/in/dremilyroberts', 'Decision maker for all nutrition services. Faith-based healthcare focus.',
   ARRAY[1, 6]::bigint[], NOW() - INTERVAL '8 years', NOW() - INTERVAL '1 week', NOW(), NOW()),
  (69, 'William Davis', 'William', 'Davis', '[{"email": "wdavis@ascension.org", "type": "Work"}]', '[{"phone": "314-555-4402", "type": "Work"}]',
   'Regional Nutrition Director', 'Dietary', 34, 4,
   '4600 Edmundson Road', 'St. Louis', 'MO', '63134', 'USA', '1978-03-14',
   'https://linkedin.com/in/williamdavis-ascension', 'Manages multiple hospital food service programs.',
   ARRAY[]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '5 days', NOW(), NOW()),

  -- Aramark (Org 35) - Dale manages
  (70, 'Chef Christopher Lee', 'Christopher', 'Lee', '[{"email": "clee2@aramark.com", "type": "Work"}]', '[{"phone": "215-555-4501", "type": "Work"}]',
   'VP Culinary Higher Ed', 'Culinary', 35, 5,
   '2400 Market Street', 'Philadelphia', 'PA', '19103', 'USA', '1969-10-05',
   'https://linkedin.com/in/chefchristopherlee-aramark', 'Technical + Influencer. Focus on campus sustainability.',
   ARRAY[4, 5]::bigint[], NOW() - INTERVAL '7 years', NOW() - INTERVAL '3 days', NOW(), NOW()),
  (71, 'Nancy Wilson', 'Nancy', 'Wilson', '[{"email": "nwilson@aramark.com", "type": "Work"}]', '[{"phone": "215-555-4502", "type": "Work"}]',
   'Purchasing Director', 'Operations', 35, 5,
   '2400 Market Street', 'Philadelphia', 'PA', '19103', 'USA', '1977-04-28',
   'https://linkedin.com/in/nancywilson-aramark', 'Manages university foodservice contracts.',
   ARRAY[]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Sodexo (Org 36) - Dale manages
  (72, 'Chef Antoine Bernard', 'Antoine', 'Bernard', '[{"email": "abernard@sodexo.com", "type": "Work"}]', '[{"phone": "301-555-4601", "type": "Work"}]',
   'Global Executive Chef', 'Culinary', 36, 5,
   '9801 Washingtonian Blvd', 'Gaithersburg', 'MD', '20878', 'USA', '1962-07-19',
   'https://linkedin.com/in/chefantoinebernard', 'Influencer. French-trained, focus on culinary excellence.',
   ARRAY[4]::bigint[], NOW() - INTERVAL '9 years', NOW() - INTERVAL '2 days', NOW(), NOW()),
  (73, 'Rachel Green', 'Rachel', 'Green', '[{"email": "rgreen@sodexo.com", "type": "Work"}]', '[{"phone": "301-555-4602", "type": "Work"}]',
   'Campus Dining Director', 'Operations', 36, 5,
   '9801 Washingtonian Blvd', 'Gaithersburg', 'MD', '20878', 'USA', '1981-11-08',
   'https://linkedin.com/in/rachelgreen-sodexo', 'Manages university partnerships. Focus on Gen Z preferences.',
   ARRAY[]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '6 days', NOW(), NOW()),

  -- Brookdale (Org 37) - Sue manages
  (74, 'Chef Richard Taylor', 'Richard', 'Taylor', '[{"email": "rtaylor@brookdale.com", "type": "Work"}]', '[{"phone": "615-555-4701", "type": "Work"}]',
   'VP Culinary Services', 'Culinary', 37, 6,
   '6737 W Washington Street', 'Milwaukee', 'WI', '53214', 'USA', '1966-02-28',
   'https://linkedin.com/in/chefrichardtaylor', 'Senior living specialist. Focus on texture-modified diets.',
   ARRAY[5]::bigint[], NOW() - INTERVAL '6 years', NOW() - INTERVAL '4 days', NOW(), NOW()),
  (75, 'Karen Martinez', 'Karen', 'Martinez', '[{"email": "kmartinez@brookdale.com", "type": "Work"}]', '[{"phone": "615-555-4702", "type": "Work"}]',
   'Dining Director', 'Operations', 37, 6,
   '6737 W Washington Street', 'Milwaukee', 'WI', '53214', 'USA', '1979-09-15',
   'https://linkedin.com/in/karenmartinez-brookdale', 'Manages community-level dining programs.',
   ARRAY[]::bigint[], NOW() - INTERVAL '3 years', NOW() - INTERVAL '1 week', NOW(), NOW()),

  -- Sunrise Senior (Org 38) - Sue manages
  (76, 'Chef Andrea Miller', 'Andrea', 'Miller', '[{"email": "amiller@sunriseseniorliving.com", "type": "Work"}]', '[{"phone": "703-555-4801", "type": "Work"}]',
   'Executive Chef', 'Culinary', 38, 6,
   '7902 Westpark Drive', 'McLean', 'VA', '22102', 'USA', '1972-06-10',
   'https://linkedin.com/in/chefandreamiller', 'Focus on resident satisfaction and dietary compliance.',
   ARRAY[5]::bigint[], NOW() - INTERVAL '5 years', NOW() - INTERVAL '3 days', NOW(), NOW()),
  (77, 'Steven Brown', 'Steven', 'Brown', '[{"email": "sbrown@sunriseseniorliving.com", "type": "Work"}]', '[{"phone": "703-555-4802", "type": "Work"}]',
   'Dining Services Manager', 'Operations', 38, 6,
   '7902 Westpark Drive', 'McLean', 'VA', '22102', 'USA', '1984-12-22',
   'https://linkedin.com/in/stevenbrown-sunrise', 'Manages vendor relationships for dining program.',
   ARRAY[]::bigint[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '5 days', NOW(), NOW()),

  -- Levy Restaurants (Org 39) - Brent manages
  (78, 'Chef Larry Levy', 'Larry', 'Levy', '[{"email": "llevy@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4901", "type": "Work"}]',
   'Founder & Chairman', 'Executive', 39, 2,
   '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 'USA', '1950-05-15',
   'https://linkedin.com/in/larrylevylevy', 'Decision Maker + Influencer + Technical. Industry legend. Stadium foodservice pioneer.',
   ARRAY[1, 4, 5]::bigint[], NOW() - INTERVAL '12 years', NOW() - INTERVAL '2 weeks', NOW(), NOW()),
  (79, 'Michelle Adams', 'Michelle', 'Adams', '[{"email": "madams@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4902", "type": "Work"}]',
   'VP Purchasing', 'Operations', 39, 2,
   '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 'USA', '1975-08-03',
   'https://linkedin.com/in/michelleadams-levy', 'Manages all purchasing for stadium accounts. Very data-driven.',
   ARRAY[6]::bigint[], NOW() - INTERVAL '8 years', NOW() - INTERVAL '1 week', NOW(), NOW()),
  (80, 'Chef David Park', 'David', 'Park', '[{"email": "dpark@levyrestaurants.com", "type": "Work"}]', '[{"phone": "312-555-4903", "type": "Work"}]',
   'Corporate Chef', 'Culinary', 39, 2,
   '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 'USA', '1980-01-20',
   'https://linkedin.com/in/chefdavidpark-levy', 'Korean-American chef. Stadium culinary innovation.',
   ARRAY[]::bigint[], NOW() - INTERVAL '4 years', NOW() - INTERVAL '3 days', NOW(), NOW());

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
  distributor_organization_id, opportunity_owner_id, account_manager_id,
  stage, status, priority, contact_ids, estimated_close_date, description,
  next_action, next_action_date, competition, decision_criteria, tags, lead_source,
  created_at, updated_at
)
VALUES
  -- ========================================
  -- NEW_LEAD (7 opportunities)
  -- ========================================
  (1, 'McCRUM Fries - Capital Grille', 1, 20, 10, 2, 2,
   'new_lead', 'active', 'high', ARRAY[39]::bigint[], CURRENT_DATE + INTERVAL '60 days',
   'Potential to replace current fry supplier with premium Idaho product',
   'Schedule intro call with purchasing', CURRENT_DATE + INTERVAL '3 days',
   'Lamb Weston (incumbent), Simplot', 'Price per case, quality consistency, delivery reliability',
   ARRAY['premium', 'fries', 'fine-dining']::text[], 'referral',
   NOW() - INTERVAL '2 days', NOW()),

  (2, 'SWAP Plant-Based - Panera', 2, 27, 11, 3, 3,
   'new_lead', 'active', 'medium', ARRAY[53]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'Interest in plant-based options for menu expansion',
   'Send product catalog and samples list', CURRENT_DATE + INTERVAL '5 days',
   'Beyond Meat, Impossible Foods', 'Taste profile, clean label, price point',
   ARRAY['plant-based', 'fast-casual', 'sustainability']::text[], 'trade_show',
   NOW() - INTERVAL '5 days', NOW()),

  (3, 'Rapid Rasoi - Marriott Banquets', 3, 30, 12, 3, 3,
   'new_lead', 'active', 'high', ARRAY[59]::bigint[], CURRENT_DATE + INTERVAL '90 days',
   'Indian cuisine for convention center catering',
   'Coordinate with culinary team for tasting', CURRENT_DATE + INTERVAL '7 days',
   'Deep Foods, Haldirams', 'Authenticity, scalability, heat levels',
   ARRAY['ethnic', 'hotels', 'catering']::text[], 'cold_call',
   NOW() - INTERVAL '1 day', NOW()),

  (4, 'Lakeview Farms - Sunrise Senior', 4, 38, 13, 4, 4,
   'new_lead', 'active', 'medium', ARRAY[76]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'Dessert and dip products for senior dining',
   'Request dietary requirements documentation', CURRENT_DATE + INTERVAL '4 days',
   'Reser''s, Fresh Gourmet', 'Sodium content, portion sizes, ease of use',
   ARRAY['senior-living', 'desserts', 'healthcare']::text[], 'referral',
   NOW() - INTERVAL '3 days', NOW()),

  (5, 'Frico Cheese - Mortons', 5, 22, 18, 4, 4,
   'new_lead', 'active', 'high', ARRAY[43]::bigint[], CURRENT_DATE + INTERVAL '75 days',
   'Premium Italian cheeses for tableside presentations',
   'Arrange cheese wheel demo at location', CURRENT_DATE + INTERVAL '10 days',
   'BelGioioso, Sartori', 'Origin authenticity, aging process, presentation appeal',
   ARRAY['premium', 'fine-dining', 'italian']::text[], 'existing_customer',
   NOW() - INTERVAL '4 days', NOW()),

  (6, 'Anchor Butter - Ruth''s Chris', 6, 21, 10, 5, 5,
   'new_lead', 'active', 'medium', ARRAY[41]::bigint[], CURRENT_DATE + INTERVAL '55 days',
   'NZ grass-fed butter for signature dishes',
   'Send NZ grass-fed certification docs', CURRENT_DATE + INTERVAL '6 days',
   'Kerrygold, Plugra', 'Grass-fed certification, flavor profile, consistency',
   ARRAY['premium', 'fine-dining', 'dairy']::text[], 'referral',
   NOW() - INTERVAL '6 days', NOW()),

  (7, 'Custom Culinary - HCA Healthcare', 9, 33, 11, 6, 6,
   'new_lead', 'active', 'high', ARRAY[66]::bigint[], CURRENT_DATE + INTERVAL '120 days',
   'Soup bases for hospital nutrition services',
   'Schedule GPO contract review meeting', CURRENT_DATE + INTERVAL '14 days',
   'Minor''s, Knorr Professional', 'Sodium levels, allergen-free options, cost per serving',
   ARRAY['healthcare', 'institutional', 'soup-bases']::text[], 'email_campaign',
   NOW() - INTERVAL '7 days', NOW()),

  -- ========================================
  -- INITIAL_OUTREACH (7 opportunities)
  -- ========================================
  (8, 'McCRUM Hash Browns - Hilton', 1, 31, 11, 2, 2,
   'initial_outreach', 'active', 'high', ARRAY[62]::bigint[], CURRENT_DATE + INTERVAL '50 days',
   'Breakfast program hash brown supply',
   'Follow up on sample shipment tracking', CURRENT_DATE + INTERVAL '2 days',
   'Ore-Ida, Simplot', 'Consistency across properties, hold time, price',
   ARRAY['hotels', 'breakfast', 'frozen']::text[], 'trade_show',
   NOW() - INTERVAL '10 days', NOW()),

  (9, 'SWAP Oat Milk - Shake Shack', 2, 29, 19, 3, 3,
   'initial_outreach', 'active', 'medium', ARRAY[57]::bigint[], CURRENT_DATE + INTERVAL '40 days',
   'Barista oat milk for shake menu expansion',
   'Coordinate barista testing session', CURRENT_DATE + INTERVAL '5 days',
   'Oatly, Minor Figures', 'Froth quality, neutral taste, shelf stability',
   ARRAY['plant-based', 'fast-casual', 'beverages']::text[], 'social_media',
   NOW() - INTERVAL '12 days', NOW()),

  (10, 'Rapid Rasoi Naan - Buffalo Wild Wings', 3, 25, 13, 3, 3,
   'initial_outreach', 'active', 'medium', ARRAY[49]::bigint[], CURRENT_DATE + INTERVAL '35 days',
   'Naan as appetizer/shareables addition',
   'Send LTO proposal with pricing tiers', CURRENT_DATE + INTERVAL '4 days',
   'Stonefire, Mission', 'Portion size, ease of prep, flavor options',
   ARRAY['ethnic', 'casual-dining', 'appetizers']::text[], 'cold_call',
   NOW() - INTERVAL '8 days', NOW()),

  (11, 'Lakeview Parfaits - Sodexo Campus', 4, 36, 12, 4, 4,
   'initial_outreach', 'active', 'medium', ARRAY[72]::bigint[], CURRENT_DATE + INTERVAL '60 days',
   'Grab-and-go parfaits for campus retail',
   'Submit RFP response by deadline', CURRENT_DATE + INTERVAL '10 days',
   'Chobani, Stonyfield', 'Sugar content, protein levels, grab-and-go packaging',
   ARRAY['education', 'retail', 'dairy']::text[], 'website',
   NOW() - INTERVAL '14 days', NOW()),

  (12, 'Frico Parmesan - Levy Restaurants', 5, 39, 18, 4, 4,
   'initial_outreach', 'active', 'high', ARRAY[78]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'Premium Parmesan for stadium premium suites',
   'Schedule VIP suite culinary demo', CURRENT_DATE + INTERVAL '7 days',
   'Kraft, BelGioioso', 'Age certification, portion control, premium positioning',
   ARRAY['premium', 'sports', 'italian']::text[], 'referral',
   NOW() - INTERVAL '9 days', NOW()),

  (13, 'Tattooed Chef - Chipotle', 7, 28, 17, 5, 5,
   'initial_outreach', 'active', 'high', ARRAY[55]::bigint[], CURRENT_DATE + INTERVAL '80 days',
   'Plant-based bowl ingredients',
   'Prepare sustainability scorecard', CURRENT_DATE + INTERVAL '12 days',
   'Impossible Foods, Beyond Meat', 'Clean label requirements, sourcing transparency, scalability',
   ARRAY['plant-based', 'fast-casual', 'sustainability']::text[], 'trade_show',
   NOW() - INTERVAL '11 days', NOW()),

  (14, 'Litehouse Ranch - Red Robin', 8, 26, 13, 5, 5,
   'initial_outreach', 'active', 'medium', ARRAY[51]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'Premium ranch for bottomless fries upgrade',
   'Send comparison samples vs current supplier', CURRENT_DATE + INTERVAL '3 days',
   'Hidden Valley, Ken''s', 'Flavor profile, shelf life, portion cost',
   ARRAY['casual-dining', 'dressings', 'family']::text[], 'existing_customer',
   NOW() - INTERVAL '15 days', NOW()),

  -- ========================================
  -- SAMPLE_VISIT_OFFERED (7 opportunities)
  -- ========================================
  (15, 'McCRUM Wedges - Applebees', 1, 24, 11, 2, 2,
   'sample_visit_offered', 'active', 'high', ARRAY[47]::bigint[], CURRENT_DATE + INTERVAL '25 days',
   'Seasoned wedges for new appetizer menu',
   'Confirm test kitchen visit date', CURRENT_DATE + INTERVAL '2 days',
   'Lamb Weston, McCain', 'Seasoning consistency, hold time, visual appeal',
   ARRAY['casual-dining', 'appetizers', 'frozen']::text[], 'trade_show',
   NOW() - INTERVAL '20 days', NOW()),

  (16, 'SWAP Jackfruit - Aramark', 2, 35, 17, 3, 3,
   'sample_visit_offered', 'active', 'medium', ARRAY[70]::bigint[], CURRENT_DATE + INTERVAL '40 days',
   'BBQ jackfruit for campus sustainability initiatives',
   'Prepare campus sustainability case study', CURRENT_DATE + INTERVAL '5 days',
   'Upton''s Naturals, The Jackfruit Company', 'Texture, flavor absorption, student appeal',
   ARRAY['plant-based', 'education', 'sustainability']::text[], 'referral',
   NOW() - INTERVAL '18 days', NOW()),

  (17, 'Rapid Rasoi Samosas - Hyatt', 3, 32, 12, 3, 3,
   'sample_visit_offered', 'active', 'high', ARRAY[64]::bigint[], CURRENT_DATE + INTERVAL '35 days',
   'Appetizer samosas for hotel bars',
   'Coordinate chef tasting at Hyatt Chicago', CURRENT_DATE + INTERVAL '4 days',
   'Deep Foods, Tandoor Chef', 'Crispiness retention, size consistency, vegetarian options',
   ARRAY['ethnic', 'hotels', 'appetizers']::text[], 'referral',
   NOW() - INTERVAL '22 days', NOW()),

  (18, 'Lakeview Dips - Brookdale', 4, 37, 13, 4, 4,
   'sample_visit_offered', 'active', 'medium', ARRAY[74]::bigint[], CURRENT_DATE + INTERVAL '20 days',
   'French onion dip for resident happy hours',
   'Schedule resident taste test event', CURRENT_DATE + INTERVAL '3 days',
   'Dean''s, Heluva Good', 'Sodium content, smooth texture, familiar taste',
   ARRAY['senior-living', 'dips', 'snacks']::text[], 'cold_call',
   NOW() - INTERVAL '17 days', NOW()),

  (19, 'Anchor Cream - Ascension', 6, 34, 11, 5, 5,
   'sample_visit_offered', 'active', 'medium', ARRAY[68]::bigint[], CURRENT_DATE + INTERVAL '50 days',
   'UHT cream for patient trays',
   'Submit clinical nutrition approval docs', CURRENT_DATE + INTERVAL '7 days',
   'Land O''Lakes, Hood', 'Shelf stability, portion packaging, dietary compliance',
   ARRAY['healthcare', 'dairy', 'institutional']::text[], 'email_campaign',
   NOW() - INTERVAL '25 days', NOW()),

  (20, 'Tattooed Chef Bowls - Panera', 7, 27, 17, 5, 5,
   'sample_visit_offered', 'active', 'high', ARRAY[54]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'Plant-based Buddha bowls for catering',
   'Finalize catering menu integration plan', CURRENT_DATE + INTERVAL '4 days',
   'Amy''s Kitchen, Sweet Earth', 'Ingredient transparency, heat-and-serve simplicity, portion consistency',
   ARRAY['plant-based', 'fast-casual', 'catering']::text[], 'trade_show',
   NOW() - INTERVAL '19 days', NOW()),

  (21, 'Custom Culinary Bases - Marriott', 9, 30, 10, 6, 6,
   'sample_visit_offered', 'active', 'high', ARRAY[60]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'Gold Label bases for banquet soups',
   'Arrange banquet kitchen live demo', CURRENT_DATE + INTERVAL '6 days',
   'Minor''s, Knorr', 'Ease of use, flavor depth, cost per gallon',
   ARRAY['hotels', 'soup-bases', 'banquet']::text[], 'existing_customer',
   NOW() - INTERVAL '21 days', NOW()),

  -- ========================================
  -- FEEDBACK_LOGGED (7 opportunities)
  -- ========================================
  (22, 'McCRUM Diced - Chilis', 1, 23, 11, 2, 2,
   'feedback_logged', 'active', 'high', ARRAY[45]::bigint[], CURRENT_DATE + INTERVAL '15 days',
   'Diced potatoes for loaded dishes - positive sample feedback',
   'Schedule pricing negotiation call', CURRENT_DATE + INTERVAL '2 days',
   'Simplot, Basic American', 'Price per case, dice size consistency, cook time',
   ARRAY['casual-dining', 'potatoes', 'tex-mex']::text[], 'referral',
   NOW() - INTERVAL '30 days', NOW()),

  (23, 'SWAP Cauliflower - Shake Shack', 2, 29, 19, 3, 3,
   'feedback_logged', 'active', 'medium', ARRAY[58]::bigint[], CURRENT_DATE + INTERVAL '20 days',
   'Cauliflower rice for low-carb options - testing complete',
   'Compile customer feedback summary', CURRENT_DATE + INTERVAL '4 days',
   'Green Giant, Birds Eye', 'Texture after cooking, neutral flavor, portion control',
   ARRAY['plant-based', 'fast-casual', 'healthy']::text[], 'social_media',
   NOW() - INTERVAL '28 days', NOW()),

  (24, 'Rapid Rasoi Curry - Levy', 3, 39, 18, 3, 3,
   'feedback_logged', 'active', 'high', ARRAY[79]::bigint[], CURRENT_DATE + INTERVAL '25 days',
   'Butter chicken for stadium Indian station - chef approved',
   'Prepare stadium-specific logistics plan', CURRENT_DATE + INTERVAL '3 days',
   'Sukhi''s, Maya Kaimal', 'Flavor consistency, heat holding, service speed',
   ARRAY['ethnic', 'sports', 'premium']::text[], 'referral',
   NOW() - INTERVAL '32 days', NOW()),

  (25, 'Frico Gorgonzola - Capital Grille', 5, 20, 18, 4, 4,
   'feedback_logged', 'active', 'critical', ARRAY[40]::bigint[], CURRENT_DATE + INTERVAL '10 days',
   'Gorgonzola crumbles for wedge salad - pricing review',
   'Finalize volume pricing proposal', CURRENT_DATE + INTERVAL '1 day',
   'BelGioioso, Stella', 'Crumble size, flavor intensity, shelf life',
   ARRAY['premium', 'fine-dining', 'cheese']::text[], 'existing_customer',
   NOW() - INTERVAL '35 days', NOW()),

  (26, 'Anchor Butter - Morton''s', 6, 22, 10, 4, 4,
   'feedback_logged', 'active', 'high', ARRAY[44]::bigint[], CURRENT_DATE + INTERVAL '18 days',
   'Clarified butter for steaks - quality confirmed',
   'Submit final contract for legal review', CURRENT_DATE + INTERVAL '5 days',
   'Kerrygold, Plugra', 'Smoke point, flavor, grass-fed certification',
   ARRAY['premium', 'fine-dining', 'butter']::text[], 'referral',
   NOW() - INTERVAL '26 days', NOW()),

  (27, 'Litehouse Blue Cheese - BWW', 8, 25, 13, 5, 5,
   'feedback_logged', 'active', 'medium', ARRAY[50]::bigint[], CURRENT_DATE + INTERVAL '12 days',
   'Chunky blue cheese for wing dipping - volume pricing TBD',
   'Calculate volume discount structure', CURRENT_DATE + INTERVAL '3 days',
   'Marzetti, Ken''s', 'Chunk size, tang level, consistency',
   ARRAY['casual-dining', 'dressings', 'wings']::text[], 'cold_call',
   NOW() - INTERVAL '29 days', NOW()),

  (28, 'Custom Culinary Demi - Ruth''s Chris', 9, 21, 10, 6, 6,
   'feedback_logged', 'active', 'high', ARRAY[42]::bigint[], CURRENT_DATE + INTERVAL '22 days',
   'Demi-glace for signature sauces - final approval pending',
   'Prepare executive chef presentation', CURRENT_DATE + INTERVAL '4 days',
   'More Than Gourmet, D''Artagnan', 'Depth of flavor, consistency, ease of use',
   ARRAY['premium', 'fine-dining', 'sauces']::text[], 'existing_customer',
   NOW() - INTERVAL '33 days', NOW()),

  -- ========================================
  -- DEMO_SCHEDULED (8 opportunities)
  -- ========================================
  (29, 'McCRUM Full Line - Sysco', 1, 10, NULL, 2, 2,
   'demo_scheduled', 'active', 'critical', ARRAY[19]::bigint[], CURRENT_DATE + INTERVAL '7 days',
   'Full product line review for Sysco distribution',
   'Confirm demo room setup and samples', CURRENT_DATE + INTERVAL '1 day',
   'Lamb Weston, Simplot', 'Full line breadth, logistics capability, pricing tier',
   ARRAY['distributor', 'potatoes', 'national']::text[], 'trade_show',
   NOW() - INTERVAL '40 days', NOW()),

  (30, 'SWAP Plant Line - US Foods', 2, 11, NULL, 3, 3,
   'demo_scheduled', 'active', 'high', ARRAY[21]::bigint[], CURRENT_DATE + INTERVAL '10 days',
   'Complete plant-based lineup presentation',
   'Prepare sustainability credentials deck', CURRENT_DATE + INTERVAL '3 days',
   'Beyond Meat, Gardein', 'Portfolio breadth, growth projections, marketing support',
   ARRAY['distributor', 'plant-based', 'national']::text[], 'referral',
   NOW() - INTERVAL '38 days', NOW()),

  (31, 'Rapid Rasoi Menu - GFS', 3, 13, NULL, 3, 3,
   'demo_scheduled', 'active', 'high', ARRAY[25]::bigint[], CURRENT_DATE + INTERVAL '5 days',
   'Full Indian menu demo for regional distribution',
   'Finalize cooking demo logistics', CURRENT_DATE + INTERVAL '1 day',
   'Deep Foods, MTR', 'Menu completeness, regional demand data, training support',
   ARRAY['distributor', 'ethnic', 'regional']::text[], 'referral',
   NOW() - INTERVAL '42 days', NOW()),

  (32, 'Lakeview Desserts - Hilton Corp', 4, 31, 12, 4, 4,
   'demo_scheduled', 'active', 'high', ARRAY[63]::bigint[], CURRENT_DATE + INTERVAL '14 days',
   'Dessert line for corporate standardization',
   'Coordinate multi-property tasting schedule', CURRENT_DATE + INTERVAL '5 days',
   'Sara Lee, The Cheesecake Factory', 'Consistency, thaw-and-serve simplicity, brand standards',
   ARRAY['hotels', 'desserts', 'corporate']::text[], 'existing_customer',
   NOW() - INTERVAL '36 days', NOW()),

  (33, 'Frico Italian Line - European Imports', 5, 18, NULL, 4, 4,
   'demo_scheduled', 'active', 'high', ARRAY[35]::bigint[], CURRENT_DATE + INTERVAL '8 days',
   'Full Italian cheese portfolio review',
   'Prepare import documentation package', CURRENT_DATE + INTERVAL '2 days',
   'Galbani, Belgioioso', 'Import quality, aging documentation, price competitiveness',
   ARRAY['distributor', 'italian', 'specialty']::text[], 'trade_show',
   NOW() - INTERVAL '45 days', NOW()),

  (34, 'Anchor Dairy - Chefs Warehouse', 6, 19, NULL, 5, 5,
   'demo_scheduled', 'active', 'high', ARRAY[38]::bigint[], CURRENT_DATE + INTERVAL '12 days',
   'Premium dairy line for fine dining distribution',
   'Finalize chef endorsement materials', CURRENT_DATE + INTERVAL '4 days',
   'Plugra, Vermont Creamery', 'Chef credibility, premium positioning, margin structure',
   ARRAY['distributor', 'dairy', 'premium']::text[], 'referral',
   NOW() - INTERVAL '41 days', NOW()),

  (35, 'Tattooed Chef Retail - PFG', 7, 12, NULL, 5, 5,
   'demo_scheduled', 'active', 'medium', ARRAY[23]::bigint[], CURRENT_DATE + INTERVAL '9 days',
   'Retail-ready plant-based items for C-store',
   'Prepare C-store planogram proposal', CURRENT_DATE + INTERVAL '3 days',
   'Amy''s, Kashi', 'Retail packaging, impulse buy potential, margin',
   ARRAY['distributor', 'plant-based', 'retail']::text[], 'cold_call',
   NOW() - INTERVAL '39 days', NOW()),

  (36, 'Litehouse Dressings - Ben E. Keith', 8, 15, NULL, 6, 6,
   'demo_scheduled', 'active', 'medium', ARRAY[29]::bigint[], CURRENT_DATE + INTERVAL '6 days',
   'Regional dressing distribution agreement',
   'Finalize regional rollout timeline', CURRENT_DATE + INTERVAL '2 days',
   'Ken''s, Marzetti', 'Regional demand, logistics, promotional support',
   ARRAY['distributor', 'dressings', 'regional']::text[], 'email_campaign',
   NOW() - INTERVAL '44 days', NOW()),

  -- ========================================
  -- CLOSED_WON (7 opportunities)
  -- ========================================
  (37, 'McCRUM Fries - Applebees National', 1, 24, 11, 2, 2,
   'closed_won', 'active', 'high', ARRAY[48]::bigint[], CURRENT_DATE - INTERVAL '10 days',
   'National fry contract secured - 3 year agreement',
   NULL, NULL,
   'Lamb Weston (lost)', 'Price, quality, delivery reliability - all met',
   ARRAY['casual-dining', 'potatoes', 'national']::text[], 'trade_show',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '10 days'),

  (38, 'SWAP Oat Milk - Panera Regional', 2, 27, 17, 3, 3,
   'closed_won', 'active', 'medium', ARRAY[53]::bigint[], CURRENT_DATE - INTERVAL '5 days',
   'Midwest region oat milk supply - pilot program',
   NULL, NULL,
   'Oatly (lost)', 'Clean label, price point, supply reliability - all met',
   ARRAY['plant-based', 'fast-casual', 'regional']::text[], 'referral',
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days'),

  (39, 'Rapid Rasoi - Aramark Campuses', 3, 35, 12, 3, 3,
   'closed_won', 'active', 'high', ARRAY[71]::bigint[], CURRENT_DATE - INTERVAL '15 days',
   'Campus Indian station program - 25 universities',
   NULL, NULL,
   'Deep Foods (lost)', 'Authenticity, training support, pricing - all met',
   ARRAY['ethnic', 'education', 'national']::text[], 'referral',
   NOW() - INTERVAL '120 days', NOW() - INTERVAL '15 days'),

  (40, 'Lakeview Dips - Sodexo National', 4, 36, 13, 4, 4,
   'closed_won', 'active', 'medium', ARRAY[73]::bigint[], CURRENT_DATE - INTERVAL '20 days',
   'National dip contract for campus retail',
   NULL, NULL,
   'Dean''s (lost)', 'Clean label, portion control, price - all met',
   ARRAY['education', 'dips', 'national']::text[], 'email_campaign',
   NOW() - INTERVAL '100 days', NOW() - INTERVAL '20 days'),

  (41, 'Frico Parmesan - Sysco National', 5, 10, NULL, 4, 4,
   'closed_won', 'active', 'high', ARRAY[20]::bigint[], CURRENT_DATE - INTERVAL '8 days',
   'National Parmesan distribution agreement',
   NULL, NULL,
   'BelGioioso (incumbent, retained share)', 'Italian origin, pricing, logistics - all met',
   ARRAY['distributor', 'italian', 'national']::text[], 'trade_show',
   NOW() - INTERVAL '75 days', NOW() - INTERVAL '8 days'),

  (42, 'Anchor - GFS Regional', 6, 13, NULL, 5, 5,
   'closed_won', 'active', 'medium', ARRAY[26]::bigint[], CURRENT_DATE - INTERVAL '12 days',
   'Midwest butter and cream distribution',
   NULL, NULL,
   'Kerrygold (lost on price)', 'Quality, grass-fed story, margin - all met',
   ARRAY['distributor', 'dairy', 'regional']::text[], 'existing_customer',
   NOW() - INTERVAL '85 days', NOW() - INTERVAL '12 days'),

  (43, 'Custom Culinary - HCA National', 9, 33, 11, 6, 6,
   'closed_won', 'active', 'critical', ARRAY[67]::bigint[], CURRENT_DATE - INTERVAL '25 days',
   'Healthcare soup base standardization program',
   NULL, NULL,
   'Minor''s (incumbent, partially retained)', 'Sodium levels, cost per serving, support - all met',
   ARRAY['healthcare', 'soup-bases', 'national']::text[], 'referral',
   NOW() - INTERVAL '150 days', NOW() - INTERVAL '25 days'),

  -- ========================================
  -- CLOSED_LOST (7 opportunities)
  -- ========================================
  (44, 'McCRUM - Chipotle National', 1, 28, 17, 2, 2,
   'closed_lost', 'expired', 'high', ARRAY[56]::bigint[], CURRENT_DATE - INTERVAL '30 days',
   'Lost to incumbent - price sensitivity',
   NULL, NULL,
   'Simplot (won - lower price)', 'Price was #1 criteria, we were 8% higher',
   ARRAY['fast-casual', 'potatoes', 'national']::text[], 'cold_call',
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '30 days'),

  (45, 'SWAP - BWW Pilot', 2, 25, 13, 3, 3,
   'closed_lost', 'expired', 'medium', ARRAY[49]::bigint[], CURRENT_DATE - INTERVAL '45 days',
   'Menu direction changed - no plant-based focus',
   NULL, NULL,
   'N/A - category cancelled', 'Customer cancelled plant-based initiative entirely',
   ARRAY['plant-based', 'casual-dining']::text[], 'trade_show',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days'),

  (46, 'Rapid Rasoi - Red Robin', 3, 26, 13, 3, 3,
   'closed_lost', 'expired', 'medium', ARRAY[52]::bigint[], CURRENT_DATE - INTERVAL '20 days',
   'Decided against ethnic menu expansion',
   NULL, NULL,
   'N/A - category cancelled', 'Strategic pivot away from ethnic menu items',
   ARRAY['ethnic', 'casual-dining']::text[], 'referral',
   NOW() - INTERVAL '70 days', NOW() - INTERVAL '20 days'),

  (47, 'Lakeview - Shake Shack', 4, 29, 19, 4, 4,
   'closed_lost', 'expired', 'medium', ARRAY[57]::bigint[], CURRENT_DATE - INTERVAL '35 days',
   'Brand fit concerns - looking for artisan suppliers',
   NULL, NULL,
   'Local artisan supplier (won)', 'Brand authenticity requirements didn''t align',
   ARRAY['fast-casual', 'desserts']::text[], 'website',
   NOW() - INTERVAL '80 days', NOW() - INTERVAL '35 days'),

  (48, 'Tattooed Chef - Marriott', 7, 30, 12, 5, 5,
   'closed_lost', 'expired', 'medium', ARRAY[61]::bigint[], CURRENT_DATE - INTERVAL '40 days',
   'Budget constraints - postponed plant-based initiative',
   NULL, NULL,
   'N/A - project postponed', 'Capital budget redirected to renovations',
   ARRAY['hotels', 'plant-based']::text[], 'referral',
   NOW() - INTERVAL '95 days', NOW() - INTERVAL '40 days'),

  (49, 'Litehouse - Hyatt National', 8, 32, 12, 5, 5,
   'closed_lost', 'expired', 'high', ARRAY[65]::bigint[], CURRENT_DATE - INTERVAL '15 days',
   'Lost to competitor on pricing',
   NULL, NULL,
   'Ken''s (won - 12% lower)', 'Pricing gap too large despite quality preference',
   ARRAY['hotels', 'dressings', 'national']::text[], 'trade_show',
   NOW() - INTERVAL '110 days', NOW() - INTERVAL '15 days'),

  (50, 'Custom Culinary - Brookdale', 9, 37, 13, 6, 6,
   'closed_lost', 'expired', 'medium', ARRAY[75]::bigint[], CURRENT_DATE - INTERVAL '50 days',
   'GPO contract locked with competitor',
   NULL, NULL,
   'Minor''s (GPO incumbent)', 'GPO exclusivity prevented switching',
   ARRAY['senior-living', 'soup-bases']::text[], 'email_campaign',
   NOW() - INTERVAL '130 days', NOW() - INTERVAL '50 days'),

  -- ========================================
  -- EDGE CASE OPPORTUNITIES (5 additional)
  -- ========================================
  -- For testing special scenarios

  -- 51: STALE opportunity - no activity for 45+ days (reports testing)
  (51, 'Litehouse Dressings - Stale Deal', 8, 24, 11, 5, 5,
   'sample_visit_offered', 'stalled', 'low', ARRAY[47]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'STALE: No activity in 45 days - for testing stale opportunity reports',
   'Re-engage contact', CURRENT_DATE - INTERVAL '30 days',
   'Ken''s', 'Unknown - engagement lost',
   ARRAY['casual-dining', 'dressings', 'stalled']::text[], 'cold_call',
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days'),

  -- 52: $0 VALUE - pilot/trial opportunity (no revenue)
  (52, 'SWAP Plant Trial - Zero Value Pilot', 2, 29, NULL, 3, 3,
   'feedback_logged', 'active', 'low', ARRAY[57]::bigint[], CURRENT_DATE + INTERVAL '14 days',
   'PILOT PROGRAM: Free trial with no revenue - tests $0 value handling',
   'Collect pilot feedback survey', CURRENT_DATE + INTERVAL '5 days',
   'N/A - free trial', 'Trial success criteria: 80% customer satisfaction',
   ARRAY['plant-based', 'pilot', 'trial']::text[], 'social_media',
   NOW() - INTERVAL '20 days', NOW()),

  -- 53: DIRECT SALE - no distributor (customer buys direct from principal)
  (53, 'McCRUM Direct - No Distributor', 1, 39, NULL, 2, 2,
   'initial_outreach', 'active', 'medium', ARRAY[78]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'DIRECT SALE: Customer buying directly from manufacturer, no distributor involved',
   'Discuss direct shipping logistics', CURRENT_DATE + INTERVAL '7 days',
   'N/A - direct comparison to distributor pricing', 'Volume requirements, direct delivery capability',
   ARRAY['sports', 'direct-sale', 'potatoes']::text[], 'existing_customer',
   NOW() - INTERVAL '8 days', NOW()),

  -- 54: VERY OLD - created 6 months ago, still in early stage
  (54, 'Frico Cheese - Ancient Deal', 5, 34, 18, 4, 4,
   'new_lead', 'stalled', 'low', ARRAY[68]::bigint[], CURRENT_DATE + INTERVAL '90 days',
   'ANCIENT: Created 6 months ago, still new_lead - tests long-running deals',
   'Attempt re-engagement outreach', CURRENT_DATE + INTERVAL '14 days',
   'Unknown', 'Unknown - requires re-discovery',
   ARRAY['healthcare', 'italian', 'stalled']::text[], 'trade_show',
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '30 days'),

  -- 55: FAST CLOSE - moved through stages in 7 days
  (55, 'Anchor Express - Quick Win', 6, 20, 10, 5, 5,
   'closed_won', 'active', 'critical', ARRAY[40]::bigint[], CURRENT_DATE - INTERVAL '2 days',
   'FAST CLOSE: Entire sales cycle in 7 days - tests velocity metrics',
   NULL, NULL,
   'Kerrygold (lost)', 'Emergency replacement needed - fast decision',
   ARRAY['fine-dining', 'butter', 'urgent']::text[], 'referral',
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
  follow_up_required, outcome, sentiment, location, attendees, tags,
  created_by, created_at, updated_at
)
VALUES
  -- ========================================
  -- CALL Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (1, 'interaction', 'call', 'Initial discovery call', 'Discussed current supplier situation and pain points', NOW() - INTERVAL '5 days', 30, 39, 20, 1, true,
   'Identified key pain points: inconsistent quality and delivery delays', 'positive', 'Phone', ARRAY['John Smith (Buyer)', 'Sarah Jones (Chef)']::text[], ARRAY['discovery', 'pain-points', 'quality']::text[],
   2, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (2, 'interaction', 'call', 'Follow-up pricing discussion', 'Reviewed volume pricing tiers', NOW() - INTERVAL '10 days', 25, 53, 27, 2, false,
   'Agreed on tier 2 pricing structure, awaiting final approval', 'positive', 'Phone', ARRAY['Mike Chen (Procurement)']::text[], ARRAY['pricing', 'negotiation', 'volume']::text[],
   3, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (3, 'interaction', 'call', 'Introduction call with chef', 'Introduced product line capabilities', NOW() - INTERVAL '8 days', 20, 59, 30, 3, true,
   'Chef interested in samosa and curry products for banquet menu', 'positive', 'Phone', ARRAY['Executive Chef', 'F&B Director']::text[], ARRAY['introduction', 'indian-cuisine', 'banquet']::text[],
   3, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (4, 'interaction', 'call', 'Quarterly check-in', 'Reviewed account status and upcoming needs', NOW() - INTERVAL '15 days', 35, 76, 38, 4, false,
   'Account healthy, considering expanding to more communities', 'neutral', 'Phone', ARRAY['Regional Director']::text[], ARRAY['check-in', 'quarterly', 'senior-living']::text[],
   4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (5, 'interaction', 'call', 'Pricing negotiation call', 'Discussed volume discounts and payment terms', NOW() - INTERVAL '12 days', 45, 43, 22, 5, true,
   'Need to come back with better pricing on cheese wheels', 'neutral', 'Phone', ARRAY['GM', 'Purchasing Manager']::text[], ARRAY['pricing', 'negotiation', 'cheese']::text[],
   4, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (6, 'interaction', 'call', 'Product inquiry follow-up', 'Answered questions about product specs', NOW() - INTERVAL '3 days', 15, 41, 21, 6, false,
   'Provided butter fat content and sourcing documentation', 'positive', 'Phone', ARRAY['Executive Chef']::text[], ARRAY['specs', 'butter', 'grass-fed']::text[],
   5, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (7, 'interaction', 'call', 'Budget discussion', 'Reviewed budget cycles and timing', NOW() - INTERVAL '20 days', 40, 66, 33, 7, true,
   'Budget cycle starts in Q3, need to present in June', 'neutral', 'Phone', ARRAY['Dietary Director', 'CFO']::text[], ARRAY['budget', 'timing', 'healthcare']::text[],
   6, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (8, 'interaction', 'call', 'Sample coordination', 'Arranged sample delivery details', NOW() - INTERVAL '18 days', 20, 62, 31, 8, false,
   'Samples shipping Wednesday, demo scheduled for Friday', 'positive', 'Phone', ARRAY['F&B Coordinator']::text[], ARRAY['samples', 'logistics', 'hotel']::text[],
   2, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (9, 'interaction', 'call', 'Menu planning discussion', 'Discussed integration with current menu', NOW() - INTERVAL '22 days', 30, 57, 29, 9, true,
   'Cauliflower rice fits their health-forward positioning', 'positive', 'Phone', ARRAY['Menu Development Manager']::text[], ARRAY['menu', 'healthy', 'fast-casual']::text[],
   3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (10, 'interaction', 'call', 'Contract renewal discussion', 'Reviewed terms for upcoming renewal', NOW() - INTERVAL '25 days', 35, 49, 25, 10, false,
   'Current contract expires in 90 days, renewal discussions starting', 'neutral', 'Phone', ARRAY['VP Supply Chain']::text[], ARRAY['renewal', 'contract', 'casual-dining']::text[],
   3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (11, 'interaction', 'call', 'New product introduction', 'Presented new product additions', NOW() - INTERVAL '28 days', 25, 72, 36, 11, true,
   'Very interested in new parfait cups for grab-and-go', 'positive', 'Phone', ARRAY['Campus Dining Director']::text[], ARRAY['new-product', 'education', 'grab-and-go']::text[],
   4, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (12, 'interaction', 'call', 'Competitive situation review', 'Discussed competitor offerings', NOW() - INTERVAL '30 days', 30, 78, 39, 12, false,
   'Current vendor having quality issues, opportunity to displace', 'positive', 'Phone', ARRAY['VP Operations', 'Culinary Director']::text[], ARRAY['competitive', 'sports', 'premium']::text[],
   4, NOW() - INTERVAL '30 days', NOW()),

  -- ========================================
  -- EMAIL Activities (12)
  -- ========================================
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (13, 'interaction', 'email', 'Product catalog sent', 'Sent comprehensive product catalog PDF', NOW() - INTERVAL '4 days', 5, 55, 28, 13, false,
   'Catalog delivered, awaiting feedback', 'neutral', 'email', ARRAY[]::text[], ARRAY['catalog', 'plant-based', 'fast-casual']::text[],
   5, NOW() - INTERVAL '4 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (14, 'interaction', 'email', 'Pricing proposal attached', 'Sent formal pricing proposal document', NOW() - INTERVAL '6 days', 10, 51, 26, 14, true,
   'Proposal received, pending review by purchasing committee', 'neutral', 'email', ARRAY[]::text[], ARRAY['pricing', 'proposal', 'dressings']::text[],
   5, NOW() - INTERVAL '6 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (15, 'interaction', 'email', 'Sample request confirmation', 'Confirmed sample shipment details', NOW() - INTERVAL '14 days', 5, 47, 24, 15, false,
   'Samples confirmed for delivery Thursday', 'positive', 'email', ARRAY[]::text[], ARRAY['samples', 'logistics', 'casual-dining']::text[],
   2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (16, 'interaction', 'email', 'Meeting recap sent', 'Sent summary of discussion points', NOW() - INTERVAL '16 days', 15, 70, 35, 16, true,
   'Recap acknowledged, follow-up meeting requested', 'positive', 'email', ARRAY[]::text[], ARRAY['recap', 'education', 'sustainability']::text[],
   3, NOW() - INTERVAL '16 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (17, 'interaction', 'email', 'Spec sheets requested', 'Chef requested detailed specifications', NOW() - INTERVAL '19 days', 5, 64, 32, 17, false,
   'Spec sheets sent, chef reviewing', 'neutral', 'email', ARRAY[]::text[], ARRAY['specs', 'hotel', 'samosas']::text[],
   3, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (18, 'interaction', 'email', 'Introduction email', 'Initial outreach to new contact', NOW() - INTERVAL '7 days', 10, 74, 37, 18, true,
   'Contact responded, interested in call next week', 'positive', 'email', ARRAY[]::text[], ARRAY['introduction', 'senior-living', 'dips']::text[],
   4, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (19, 'interaction', 'email', 'Follow-up after call', 'Summarized call discussion points', NOW() - INTERVAL '9 days', 10, 68, 34, 19, false,
   'Call summary acknowledged', 'neutral', 'email', ARRAY[]::text[], ARRAY['follow-up', 'healthcare', 'cream']::text[],
   5, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (20, 'interaction', 'email', 'Case study shared', 'Sent relevant customer success story', NOW() - INTERVAL '11 days', 5, 54, 27, 20, true,
   'Case study well-received, shared with leadership', 'positive', 'email', ARRAY[]::text[], ARRAY['case-study', 'plant-based', 'catering']::text[],
   5, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (21, 'interaction', 'email', 'Thank you note', 'Thanked for demo attendance', NOW() - INTERVAL '13 days', 5, 60, 30, 21, false,
   'Thank you note appreciated', 'positive', 'email', ARRAY[]::text[], ARRAY['thank-you', 'hotel', 'soup-bases']::text[],
   6, NOW() - INTERVAL '13 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (22, 'interaction', 'email', 'Contract draft sent', 'Sent initial contract for review', NOW() - INTERVAL '17 days', 15, 45, 23, 22, true,
   'Contract with legal for review, expect feedback in 5 business days', 'neutral', 'email', ARRAY[]::text[], ARRAY['contract', 'casual-dining', 'potatoes']::text[],
   2, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (23, 'interaction', 'email', 'Questions answered', 'Responded to technical questions', NOW() - INTERVAL '21 days', 10, 58, 29, 23, false,
   'All questions addressed, no further concerns', 'positive', 'email', ARRAY[]::text[], ARRAY['technical', 'fast-casual', 'cauliflower']::text[],
   3, NOW() - INTERVAL '21 days', NOW()),
  -- Opp 24: customer_org 39 -> contacts 78, 79, 80
  (24, 'interaction', 'email', 'Update on order status', 'Provided shipping information', NOW() - INTERVAL '23 days', 5, 79, 39, 24, false,
   'Tracking info sent, delivery on schedule', 'positive', 'email', ARRAY[]::text[], ARRAY['shipping', 'sports', 'curry']::text[],
   3, NOW() - INTERVAL '23 days', NOW()),

  -- ========================================
  -- MEETING Activities (12) - includes sample visits
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (25, 'interaction', 'meeting', 'Kitchen sample presentation', 'Chef tasted products in their kitchen', NOW() - INTERVAL '2 days', 90, 40, 20, 25, true,
   'Chef impressed with product quality, wants to test with lunch service', 'positive', 'Capital Grille Kitchen - Chicago', ARRAY['Maria Rodriguez (Chef)', 'John Smith (Buyer)', 'Sarah Wilson (Rep)']::text[], ARRAY['sample', 'kitchen-visit', 'fine-dining']::text[],
   4, NOW() - INTERVAL '2 days', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (26, 'interaction', 'meeting', 'Menu review meeting', 'Reviewed potential menu applications', NOW() - INTERVAL '5 days', 60, 44, 22, 26, false,
   'Identified 3 menu items for product integration, awaiting pricing', 'positive', 'Maggianos Conference Room', ARRAY['Jennifer Lee (Culinary Director)', 'Mike Chen (Rep)']::text[], ARRAY['menu-planning', 'italian', 'casual-dining']::text[],
   4, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (27, 'interaction', 'meeting', 'Product tasting session', 'Sampled new product line', NOW() - INTERVAL '8 days', 120, 50, 25, 27, true,
   'Management team loved samples, scheduling follow-up with corporate', 'positive', 'Portillos HQ Test Kitchen', ARRAY['Tom Barrett (VP Ops)', 'Lisa Park (Chef)', 'David Kim (Rep)']::text[], ARRAY['tasting', 'qsr', 'new-products']::text[],
   5, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (28, 'interaction', 'meeting', 'Quarterly business review', 'Reviewed partnership performance', NOW() - INTERVAL '12 days', 90, 42, 21, 28, false,
   'Strong partnership performance, discussing expansion to new markets', 'positive', 'Lettuce Entertain You Corporate', ARRAY['Robert Chen (VP Procurement)', 'Amanda Smith (Account Manager)', 'Jim Taylor (Regional Director)']::text[], ARRAY['qbr', 'performance', 'expansion']::text[],
   6, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (29, 'interaction', 'meeting', 'New product introduction', 'Presented seasonal additions', NOW() - INTERVAL '15 days', 60, 19, 10, 29, true,
   'Distributor interested in seasonal lineup, needs pricing for catalog', 'positive', 'Sysco Chicago Office', ARRAY['Kevin Brown (Category Manager)', 'Sarah Jones (Rep)']::text[], ARRAY['new-products', 'seasonal', 'distributor']::text[],
   2, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (30, 'interaction', 'meeting', 'Chef training session', 'Trained kitchen staff on products', NOW() - INTERVAL '18 days', 180, 21, 11, 30, false,
   'Trained 12 kitchen staff, created recipe cards for reference', 'positive', 'US Foods Culinary Center', ARRAY['Chef Marcus (Training Chef)', 'Full Kitchen Staff (12)', 'Mike Chen (Rep)']::text[], ARRAY['training', 'culinary', 'staff-development']::text[],
   3, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (31, 'interaction', 'meeting', 'Distribution review', 'Discussed distribution strategy', NOW() - INTERVAL '22 days', 60, 25, 13, 31, true,
   'Identified gaps in regional coverage, planning expansion strategy', 'neutral', 'GFS Regional Office', ARRAY['Linda Martinez (VP Distribution)', 'Tom Wilson (Rep)']::text[], ARRAY['distribution', 'regional', 'strategy']::text[],
   3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (32, 'interaction', 'meeting', 'Sample delivery follow-up', 'Gathered feedback on samples', NOW() - INTERVAL '25 days', 45, 63, 31, 32, false,
   'Positive feedback on taste, concern about price point', 'neutral', 'Northwestern Memorial Hospital', ARRAY['Dr. Emily Wong (Food Services Director)', 'Sarah Davis (Rep)']::text[], ARRAY['follow-up', 'healthcare', 'samples']::text[],
   4, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (33, 'interaction', 'meeting', 'Partnership discussion', 'Explored expanded relationship', NOW() - INTERVAL '28 days', 75, 35, 18, 33, true,
   'Strong interest in exclusive partnership, need to prepare proposal', 'positive', 'Shamrock Foods HQ', ARRAY['James Wilson (CEO)', 'Robert Miller (VP Sales)', 'Amanda Clark (Rep)']::text[], ARRAY['partnership', 'executive', 'expansion']::text[],
   4, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (34, 'interaction', 'meeting', 'Menu planning workshop', 'Collaborated on menu development', NOW() - INTERVAL '30 days', 120, 38, 19, 34, false,
   'Co-created 5 new menu items featuring our products', 'positive', 'Reinhart Test Kitchen', ARRAY['Chef Brian (R&D Chef)', 'Marketing Team (3)', 'David Kim (Rep)']::text[], ARRAY['menu-development', 'collaboration', 'r&d']::text[],
   5, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (35, 'interaction', 'meeting', 'Sales team alignment', 'Synced on account strategy', NOW() - INTERVAL '32 days', 45, 23, 12, 35, true,
   'Aligned on Q1 goals, identified 15 target accounts', 'positive', 'Performance Food Group Office', ARRAY['Regional Sales Team (4)', 'Account Coordinator', 'Tom Wilson (Rep)']::text[], ARRAY['alignment', 'strategy', 'planning']::text[],
   5, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (36, 'interaction', 'meeting', 'Executive meeting', 'Met with VP for approval', NOW() - INTERVAL '35 days', 60, 29, 15, 36, false,
   'VP approved pilot program, contract review starting next week', 'positive', 'Ben E Keith Corporate', ARRAY['VP Procurement', 'Legal Counsel', 'Jim Taylor (Rep)']::text[], ARRAY['executive', 'approval', 'contract']::text[],
   6, NOW() - INTERVAL '35 days', NOW()),

  -- ========================================
  -- DEMO Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (37, 'interaction', 'demo', 'Full product line demo', 'Demonstrated complete portfolio', NOW() - INTERVAL '6 days', 120, 39, 20, 1, true,
   'Comprehensive demo of all fry products, chef requested samples of 3 SKUs', 'positive', 'Capital Grille Test Kitchen', ARRAY['Executive Chef', 'Sous Chef', 'Purchasing Manager', 'Sarah Wilson (Rep)']::text[], ARRAY['demo', 'full-line', 'fries']::text[],
   2, NOW() - INTERVAL '6 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (38, 'interaction', 'demo', 'Kitchen demo with chef', 'Hands-on cooking demonstration', NOW() - INTERVAL '10 days', 90, 43, 22, 5, false,
   'Chef prepared 4 dishes using products, very impressed with quality', 'positive', 'Maggianos Kitchen', ARRAY['Executive Chef Marco', 'Line Cooks (3)', 'Mike Chen (Rep)']::text[], ARRAY['hands-on', 'cooking', 'italian']::text[],
   4, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (39, 'interaction', 'demo', 'New product showcase', 'Presented latest innovations', NOW() - INTERVAL '14 days', 60, 47, 24, 15, true,
   'Showcased new curry and paneer items, strong interest in plant-based', 'positive', 'Chilis Innovation Center', ARRAY['R&D Director', 'Category Manager', 'David Kim (Rep)']::text[], ARRAY['innovation', 'plant-based', 'new-products']::text[],
   2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (40, 'interaction', 'demo', 'Taste testing event', 'Organized tasting for culinary team', NOW() - INTERVAL '18 days', 150, 57, 29, 9, false,
   'Blind taste test showed our products preferred 8 out of 10 categories', 'positive', 'Chipotle Test Kitchen', ARRAY['Culinary Team (6)', 'Quality Assurance', 'Tom Wilson (Rep)']::text[], ARRAY['taste-test', 'blind', 'comparison']::text[],
   3, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (41, 'interaction', 'demo', 'Virtual product demo', 'Online demo for remote team', NOW() - INTERVAL '22 days', 45, 72, 36, 11, true,
   'Virtual demo well-received, sending samples to 3 campus locations', 'positive', 'Zoom Meeting', ARRAY['Campus Dining Directors (4)', 'Regional Manager', 'Sarah Davis (Rep)']::text[], ARRAY['virtual', 'campus', 'multi-site']::text[],
   4, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (42, 'interaction', 'demo', 'Competitive comparison', 'Side-by-side product testing', NOW() - INTERVAL '26 days', 90, 49, 25, 10, false,
   'Won head-to-head against Lamb Weston on taste and texture', 'positive', 'Portillos QA Lab', ARRAY['Quality Manager', 'Operations Director', 'Executive Chef', 'Mike Chen (Rep)']::text[], ARRAY['competitive', 'side-by-side', 'quality']::text[],
   3, NOW() - INTERVAL '26 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (43, 'interaction', 'demo', 'Executive demo', 'Presented to leadership team', NOW() - INTERVAL '30 days', 60, 19, 10, 29, true,
   'C-suite impressed with margin improvement potential', 'positive', 'Sysco Executive Boardroom', ARRAY['CFO', 'VP Operations', 'VP Procurement', 'Regional Director', 'Jim Taylor (Rep)']::text[], ARRAY['executive', 'c-suite', 'strategic']::text[],
   2, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (44, 'interaction', 'demo', 'Distribution partner demo', 'Demo for distributor category team', NOW() - INTERVAL '34 days', 75, 21, 11, 30, false,
   'Category team agreed to add 5 SKUs to approved supplier list', 'positive', 'US Foods Demo Kitchen', ARRAY['Category Management Team (4)', 'Regional Sales Director', 'Tom Wilson (Rep)']::text[], ARRAY['category', 'distribution', 'listing']::text[],
   3, NOW() - INTERVAL '34 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (45, 'interaction', 'demo', 'Chef collaboration demo', 'Co-created recipes with chef', NOW() - INTERVAL '38 days', 180, 55, 28, 13, true,
   'Created 6 signature dishes, photographed for marketing materials', 'positive', 'Aramark Innovation Kitchen', ARRAY['Corporate Executive Chef', 'R&D Team (3)', 'Marketing Director', 'Amanda Clark (Rep)']::text[], ARRAY['collaboration', 'recipe-development', 'marketing']::text[],
   6, NOW() - INTERVAL '38 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (46, 'interaction', 'demo', 'Menu integration demo', 'Showed menu applications', NOW() - INTERVAL '42 days', 90, 70, 35, 16, false,
   'Demonstrated versatility across breakfast, lunch, dinner dayparts', 'positive', 'Compass Group Demo Center', ARRAY['Menu Development Team (3)', 'Nutrition Specialist', 'David Kim (Rep)']::text[], ARRAY['menu', 'dayparts', 'versatility']::text[],
   3, NOW() - INTERVAL '42 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (47, 'interaction', 'demo', 'Quality comparison demo', 'Compared to current supplier', NOW() - INTERVAL '46 days', 60, 64, 32, 17, true,
   'Quality superior to current supplier, pricing competitive', 'positive', 'Darden Test Kitchen', ARRAY['Quality Director', 'Procurement Lead', 'Executive Chef', 'Sarah Wilson (Rep)']::text[], ARRAY['quality', 'comparison', 'competitive']::text[],
   3, NOW() - INTERVAL '46 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (48, 'interaction', 'demo', 'ROI demonstration', 'Showed cost savings potential', NOW() - INTERVAL '50 days', 45, 74, 37, 18, false,
   'Projected 12% cost reduction through portion control and waste reduction', 'positive', 'Elior Corporate Office', ARRAY['CFO', 'Operations VP', 'Procurement Director', 'Mike Chen (Rep)']::text[], ARRAY['roi', 'cost-savings', 'financial']::text[],
   4, NOW() - INTERVAL '50 days', NOW()),

  -- ========================================
  -- PROPOSAL Activities (12)
  -- ========================================
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (49, 'interaction', 'proposal', 'Initial pricing proposal', 'Submitted first pricing quote', NOW() - INTERVAL '7 days', 30, 53, 27, 2, true,
   'Proposal for 8 SKUs totaling $125K annual, awaiting budget approval', 'neutral', 'email', ARRAY['Procurement Manager', 'CFO (CC)', 'Tom Wilson (Rep)']::text[], ARRAY['pricing', 'initial', 'budget']::text[],
   3, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (50, 'interaction', 'proposal', 'Volume discount proposal', 'Offered tiered pricing', NOW() - INTERVAL '11 days', 25, 59, 30, 3, false,
   'Tiered pricing accepted, moving to contract review', 'positive', 'email', ARRAY['VP Procurement', 'Category Manager', 'Mike Chen (Rep)']::text[], ARRAY['volume', 'discount', 'pricing']::text[],
   3, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (51, 'interaction', 'proposal', 'Custom product proposal', 'Proposed customized solution', NOW() - INTERVAL '15 days', 45, 76, 38, 4, true,
   'Custom samosa development proposal sent, R&D review in progress', 'neutral', 'Email with attachment', ARRAY['R&D Director', 'Procurement Lead', 'Sarah Davis (Rep)']::text[], ARRAY['custom', 'r&d', 'product-development']::text[],
   4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (52, 'interaction', 'proposal', 'Partnership proposal', 'Submitted partnership terms', NOW() - INTERVAL '19 days', 60, 66, 33, 7, false,
   'Strategic partnership with preferred supplier status proposed', 'positive', 'email', ARRAY['CEO', 'VP Operations', 'General Counsel', 'Jim Taylor (Rep)']::text[], ARRAY['partnership', 'strategic', 'preferred-supplier']::text[],
   6, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (53, 'interaction', 'proposal', 'Revised pricing proposal', 'Updated pricing based on feedback', NOW() - INTERVAL '23 days', 30, 62, 31, 8, true,
   'Reduced pricing 8% to match budget, pending final approval', 'neutral', 'email', ARRAY['Budget Director', 'Food Services Manager', 'Amanda Clark (Rep)']::text[], ARRAY['revised', 'pricing', 'negotiation']::text[],
   2, NOW() - INTERVAL '23 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (54, 'interaction', 'proposal', 'Annual contract proposal', 'Proposed yearly agreement', NOW() - INTERVAL '27 days', 40, 78, 39, 12, false,
   '3-year contract with annual price locks proposed', 'positive', 'email', ARRAY['GM', 'Corporate Procurement', 'Legal', 'David Kim (Rep)']::text[], ARRAY['annual', 'contract', 'long-term']::text[],
   4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (55, 'interaction', 'proposal', 'Regional distribution proposal', 'Proposed regional rollout', NOW() - INTERVAL '31 days', 35, 51, 26, 14, true,
   'Phase 1: Texas region, Phase 2: Southwest, pending regional approval', 'neutral', 'email', ARRAY['Regional VP', 'Distribution Director', 'Tom Wilson (Rep)']::text[], ARRAY['regional', 'rollout', 'phased']::text[],
   5, NOW() - INTERVAL '31 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (56, 'interaction', 'proposal', 'Pilot program proposal', 'Proposed limited trial', NOW() - INTERVAL '35 days', 45, 68, 34, 19, false,
   '90-day pilot at 5 locations with success metrics defined', 'positive', 'email', ARRAY['Operations Director', 'Marketing Manager', 'Sarah Wilson (Rep)']::text[], ARRAY['pilot', 'trial', 'metrics']::text[],
   5, NOW() - INTERVAL '35 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (57, 'interaction', 'proposal', 'Renewal proposal', 'Proposed contract renewal terms', NOW() - INTERVAL '39 days', 30, 54, 27, 20, true,
   'Renewal with 5% volume increase and 2% price reduction offered', 'positive', 'email', ARRAY['Procurement Manager', 'Finance Director', 'Mike Chen (Rep)']::text[], ARRAY['renewal', 'retention', 'volume']::text[],
   5, NOW() - INTERVAL '39 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (58, 'interaction', 'proposal', 'Expansion proposal', 'Proposed additional products', NOW() - INTERVAL '43 days', 50, 60, 30, 21, false,
   'Added 12 new SKUs to existing contract, $85K incremental value', 'positive', 'email', ARRAY['Category Manager', 'VP Procurement', 'Chef Consultant', 'Jim Taylor (Rep)']::text[], ARRAY['expansion', 'upsell', 'new-skus']::text[],
   6, NOW() - INTERVAL '43 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (59, 'interaction', 'proposal', 'National rollout proposal', 'Proposed nationwide distribution', NOW() - INTERVAL '47 days', 60, 45, 23, 22, true,
   'National rollout across 2,000+ locations, $2.5M annual opportunity', 'positive', 'Formal presentation', ARRAY['CEO', 'COO', 'VP Supply Chain', 'Legal Counsel', 'Sarah Davis (Rep)']::text[], ARRAY['national', 'rollout', 'enterprise']::text[],
   2, NOW() - INTERVAL '47 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (60, 'interaction', 'proposal', 'Exclusive partnership proposal', 'Proposed exclusive arrangement', NOW() - INTERVAL '51 days', 45, 58, 29, 23, false,
   'Exclusive cauliflower supplier agreement for 18 months proposed', 'neutral', 'email', ARRAY['VP Culinary', 'Procurement Director', 'General Counsel', 'Amanda Clark (Rep)']::text[], ARRAY['exclusive', 'partnership', 'strategic']::text[],
   3, NOW() - INTERVAL '51 days', NOW()),

  -- ========================================
  -- FOLLOW_UP Activities (12)
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (61, 'interaction', 'follow_up', 'Post-demo follow-up', 'Checked in after demo', NOW() - INTERVAL '3 days', 15, 40, 20, 25, true,
   'Chef confirmed positive feedback, scheduling trial order', 'positive', 'Phone', ARRAY['Maria Rodriguez (Chef)', 'Sarah Wilson (Rep)']::text[], ARRAY['post-demo', 'trial-order', 'commitment']::text[],
   4, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (62, 'interaction', 'follow_up', 'Proposal follow-up', 'Followed up on submitted proposal', NOW() - INTERVAL '8 days', 20, 44, 22, 26, false,
   'Proposal under review by finance, decision expected next week', 'neutral', 'email', ARRAY['Jennifer Lee (Culinary Director)', 'Mike Chen (Rep)']::text[], ARRAY['proposal', 'finance-review', 'pending']::text[],
   4, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (63, 'interaction', 'follow_up', 'Sample feedback follow-up', 'Gathered feedback on samples', NOW() - INTERVAL '12 days', 25, 50, 25, 27, true,
   'Operations team gave thumbs up, need corporate approval', 'positive', 'Phone', ARRAY['Tom Barrett (VP Ops)', 'David Kim (Rep)']::text[], ARRAY['samples', 'feedback', 'approval-pending']::text[],
   5, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (64, 'interaction', 'follow_up', 'Meeting recap follow-up', 'Confirmed next steps', NOW() - INTERVAL '16 days', 15, 42, 21, 28, false,
   'Action items completed, ready for next phase', 'positive', 'email', ARRAY['Robert Chen (VP Procurement)', 'Jim Taylor (Rep)']::text[], ARRAY['recap', 'action-items', 'progress']::text[],
   6, NOW() - INTERVAL '16 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (65, 'interaction', 'follow_up', 'Decision timeline follow-up', 'Checked on decision progress', NOW() - INTERVAL '20 days', 20, 19, 10, 29, true,
   'Decision delayed 2 weeks due to budget cycle, still positive outlook', 'neutral', 'Phone', ARRAY['Kevin Brown (Category Manager)', 'Sarah Jones (Rep)']::text[], ARRAY['timeline', 'budget', 'delayed']::text[],
   2, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (66, 'interaction', 'follow_up', 'Contract review follow-up', 'Checked on legal review status', NOW() - INTERVAL '24 days', 15, 21, 11, 30, false,
   'Legal has minor redlines, expect final version tomorrow', 'positive', 'email', ARRAY['Legal Counsel', 'Tom Wilson (Rep)']::text[], ARRAY['contract', 'legal', 'redlines']::text[],
   3, NOW() - INTERVAL '24 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (67, 'interaction', 'follow_up', 'Budget approval follow-up', 'Inquired about budget status', NOW() - INTERVAL '28 days', 20, 25, 13, 31, true,
   'Budget approved for Q1, ready to proceed with order', 'positive', 'Phone', ARRAY['Linda Martinez (VP Distribution)', 'Mike Chen (Rep)']::text[], ARRAY['budget', 'approved', 'q1']::text[],
   3, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (68, 'interaction', 'follow_up', 'Trial results follow-up', 'Discussed pilot outcomes', NOW() - INTERVAL '32 days', 30, 63, 31, 32, false,
   'Pilot results positive, 15% waste reduction, expanding to full menu', 'positive', 'Video call', ARRAY['Dr. Emily Wong (Food Services Director)', 'Nutrition Team', 'Sarah Davis (Rep)']::text[], ARRAY['pilot', 'results', 'success']::text[],
   4, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (69, 'interaction', 'follow_up', 'Competitive update follow-up', 'Checked on competitive situation', NOW() - INTERVAL '36 days', 25, 35, 18, 33, true,
   'Competitor proposal received but lacks our quality certifications', 'neutral', 'Phone', ARRAY['James Wilson (CEO)', 'Amanda Clark (Rep)']::text[], ARRAY['competitive', 'differentiation', 'certifications']::text[],
   4, NOW() - INTERVAL '36 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (70, 'interaction', 'follow_up', 'Menu launch follow-up', 'Checked on menu roll-out', NOW() - INTERVAL '40 days', 20, 38, 19, 34, false,
   'Menu items launched successfully, reorder coming next week', 'positive', 'email', ARRAY['Chef Brian (R&D Chef)', 'David Kim (Rep)']::text[], ARRAY['menu-launch', 'success', 'reorder']::text[],
   5, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (71, 'interaction', 'follow_up', 'Stakeholder alignment follow-up', 'Confirmed internal alignment', NOW() - INTERVAL '44 days', 25, 23, 12, 35, true,
   'All stakeholders aligned, final sign-off meeting scheduled', 'positive', 'Phone', ARRAY['Regional Sales Team', 'Tom Wilson (Rep)']::text[], ARRAY['alignment', 'stakeholders', 'sign-off']::text[],
   5, NOW() - INTERVAL '44 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (72, 'interaction', 'follow_up', 'Executive decision follow-up', 'Followed up with decision maker', NOW() - INTERVAL '48 days', 30, 29, 15, 36, false,
   'Executive approved, contract execution in progress', 'positive', 'Video call', ARRAY['VP Procurement', 'CEO (brief)', 'Jim Taylor (Rep)']::text[], ARRAY['executive', 'approved', 'contract']::text[],
   6, NOW() - INTERVAL '48 days', NOW()),

  -- ========================================
  -- TRADE_SHOW Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (73, 'interaction', 'trade_show', 'NRA Show booth visit', 'Met at National Restaurant Association show', NOW() - INTERVAL '60 days', 30, 39, 20, 1, true,
   'Excellent booth traffic, 45 qualified leads collected including Capital Grille', 'positive', 'McCormick Place, Chicago', ARRAY['John Smith (Buyer)', 'Trade Show Team (4)', 'Sarah Wilson (Rep)']::text[], ARRAY['nra', 'trade-show', 'lead-gen']::text[],
   2, NOW() - INTERVAL '60 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (74, 'interaction', 'trade_show', 'Regional food show', 'Connected at regional industry event', NOW() - INTERVAL '65 days', 45, 53, 27, 2, false,
   'Strong regional presence, connected with 12 Texas operators', 'positive', 'Dallas Convention Center', ARRAY['Regional Prospects (12)', 'Marketing Team', 'Mike Chen (Rep)']::text[], ARRAY['regional', 'texas', 'networking']::text[],
   3, NOW() - INTERVAL '65 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (75, 'interaction', 'trade_show', 'Healthcare foodservice expo', 'Met at ANFP conference', NOW() - INTERVAL '70 days', 30, 66, 33, 7, true,
   'Healthcare segment shows strong growth potential, 8 hospital systems interested', 'positive', 'Orlando Convention Center', ARRAY['Healthcare Prospects (8)', 'Nutrition Experts', 'Jim Taylor (Rep)']::text[], ARRAY['healthcare', 'anfp', 'hospital']::text[],
   6, NOW() - INTERVAL '70 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (76, 'interaction', 'trade_show', 'Distributor show', 'Presented at distributor event', NOW() - INTERVAL '75 days', 60, 19, 10, 29, false,
   'Sysco category managers impressed with innovation pipeline', 'positive', 'Sysco National Conference, Houston', ARRAY['Sysco Category Team (6)', 'VP Merchandising', 'Sarah Jones (Rep)']::text[], ARRAY['distributor', 'sysco', 'innovation']::text[],
   2, NOW() - INTERVAL '75 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (77, 'interaction', 'trade_show', 'Plant-based summit', 'Exhibited at specialty show', NOW() - INTERVAL '80 days', 45, 55, 28, 13, true,
   'Plant-based products received excellent reception, won Best New Product award', 'positive', 'Natural Products Expo, Anaheim', ARRAY['Industry Buyers (20+)', 'Media (5)', 'Amanda Clark (Rep)']::text[], ARRAY['plant-based', 'expo', 'award']::text[],
   6, NOW() - INTERVAL '80 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (78, 'interaction', 'trade_show', 'Hotel F&B conference', 'Connected at hospitality event', NOW() - INTERVAL '85 days', 30, 59, 30, 3, false,
   'Strong interest from hotel chains for premium potato products', 'positive', 'Hotel & Lodging Expo, Las Vegas', ARRAY['Hotel Chains (6)', 'Resort Groups (3)', 'Tom Wilson (Rep)']::text[], ARRAY['hotel', 'hospitality', 'premium']::text[],
   3, NOW() - INTERVAL '85 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (79, 'interaction', 'trade_show', 'Campus dining expo', 'Met at higher ed foodservice show', NOW() - INTERVAL '90 days', 45, 70, 35, 16, true,
   'University segment expanding, nutrition labeling resonates with students', 'positive', 'NACUFS Conference, Minneapolis', ARRAY['University Directors (15)', 'Student Reps (4)', 'David Kim (Rep)']::text[], ARRAY['campus', 'university', 'nacufs']::text[],
   3, NOW() - INTERVAL '90 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (80, 'interaction', 'trade_show', 'Senior living conference', 'Exhibited at AHCA conference', NOW() - INTERVAL '95 days', 30, 74, 37, 18, false,
   'Senior living segment needs texture-modified options, planning product development', 'neutral', 'AHCA Convention, San Diego', ARRAY['Senior Care Operators (10)', 'Dietitians (5)', 'Sarah Davis (Rep)']::text[], ARRAY['senior-living', 'ahca', 'texture']::text[],
   4, NOW() - INTERVAL '95 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (81, 'interaction', 'trade_show', 'Casual dining summit', 'Met at chain restaurant event', NOW() - INTERVAL '100 days', 45, 47, 24, 15, true,
   'Chain restaurant executives looking for consistent quality suppliers', 'positive', 'MUFSO Conference, Dallas', ARRAY['Chain Executives (8)', 'R&D Leaders (4)', 'Mike Chen (Rep)']::text[], ARRAY['casual-dining', 'mufso', 'chains']::text[],
   2, NOW() - INTERVAL '100 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (82, 'interaction', 'trade_show', 'Sports venue expo', 'Connected at venue management show', NOW() - INTERVAL '105 days', 30, 78, 39, 12, false,
   'Sports venues interested in quick-serve options for concessions', 'positive', 'IAVM Conference, Phoenix', ARRAY['Venue Managers (12)', 'Concession Operators (6)', 'Jim Taylor (Rep)']::text[], ARRAY['sports', 'venues', 'concessions']::text[],
   4, NOW() - INTERVAL '105 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (83, 'interaction', 'trade_show', 'Distributor partner day', 'Attended partner event', NOW() - INTERVAL '110 days', 60, 25, 13, 31, true,
   'Strengthened GFS relationship, planned joint marketing initiatives', 'positive', 'GFS Partner Summit, Grand Rapids', ARRAY['GFS Leadership (5)', 'Regional Directors (8)', 'Tom Wilson (Rep)']::text[], ARRAY['distributor', 'gfs', 'partnership']::text[],
   3, NOW() - INTERVAL '110 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (84, 'interaction', 'trade_show', 'Specialty foods show', 'Exhibited at Fancy Food Show', NOW() - INTERVAL '115 days', 45, 35, 18, 33, false,
   'Premium positioning well-received, media coverage generated 5 articles', 'positive', 'Summer Fancy Food Show, NYC', ARRAY['Specialty Buyers (25)', 'Food Media (8)', 'Amanda Clark (Rep)']::text[], ARRAY['fancy-food', 'premium', 'media']::text[],
   4, NOW() - INTERVAL '115 days', NOW()),

  -- ========================================
  -- SITE_VISIT Activities (12)
  -- ========================================
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (85, 'interaction', 'site_visit', 'Kitchen tour and assessment', 'Visited kitchen to assess needs', NOW() - INTERVAL '4 days', 120, 41, 21, 6, true,
   'Kitchen has adequate fryer capacity, recommend premium fry line', 'positive', 'Lettuce Entertain You - River North', ARRAY['Executive Chef', 'Kitchen Manager', 'Facilities', 'David Kim (Rep)']::text[], ARRAY['site-visit', 'kitchen', 'assessment']::text[],
   5, NOW() - INTERVAL '4 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (86, 'interaction', 'site_visit', 'Distribution center visit', 'Toured warehouse facility', NOW() - INTERVAL '9 days', 180, 21, 11, 30, false,
   'Impressive cold chain infrastructure, can handle our full product range', 'positive', 'US Foods Distribution Center - Bedford Park', ARRAY['Warehouse Manager', 'Logistics Director', 'QA Lead', 'Tom Wilson (Rep)']::text[], ARRAY['distribution', 'warehouse', 'logistics']::text[],
   3, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (87, 'interaction', 'site_visit', 'Plant tour for buyer', 'Showed manufacturing facility', NOW() - INTERVAL '14 days', 240, 19, 10, 29, true,
   'Buyer impressed with quality controls and automation, moving to proposal', 'positive', 'McCRUM Manufacturing - Idaho', ARRAY['Sysco Buyer', 'QA Manager', 'Plant Director', 'Sarah Jones (Rep)']::text[], ARRAY['plant-tour', 'manufacturing', 'quality']::text[],
   2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (88, 'interaction', 'site_visit', 'Kitchen installation review', 'Reviewed equipment setup', NOW() - INTERVAL '19 days', 90, 64, 32, 17, false,
   'New equipment properly installed, ready for product trials', 'positive', 'Darden Test Kitchen - Orlando', ARRAY['Installation Tech', 'Kitchen Manager', 'Sarah Wilson (Rep)']::text[], ARRAY['equipment', 'installation', 'setup']::text[],
   3, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (89, 'interaction', 'site_visit', 'Multi-unit assessment', 'Visited several locations', NOW() - INTERVAL '24 days', 300, 72, 36, 11, true,
   'Visited 5 campus locations, identified standardization opportunities', 'positive', 'Various Campus Dining Locations', ARRAY['Campus Directors (5)', 'Regional Manager', 'Mike Chen (Rep)']::text[], ARRAY['multi-site', 'campus', 'standardization']::text[],
   4, NOW() - INTERVAL '24 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (90, 'interaction', 'site_visit', 'Quality audit visit', 'Conducted quality review', NOW() - INTERVAL '29 days', 150, 62, 31, 8, false,
   'Passed quality audit with flying colors, HACCP compliant', 'positive', 'Northwestern Memorial Hospital Kitchen', ARRAY['QA Inspector', 'Food Services Director', 'Infection Control', 'Sarah Davis (Rep)']::text[], ARRAY['quality-audit', 'healthcare', 'compliance']::text[],
   2, NOW() - INTERVAL '29 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (91, 'interaction', 'site_visit', 'New location opening', 'Supported new store opening', NOW() - INTERVAL '34 days', 180, 49, 25, 10, true,
   'Successfully supported opening, staff trained on all products', 'positive', 'Portillos New Location - Schaumburg', ARRAY['GM', 'Kitchen Staff (8)', 'Trainer', 'Tom Wilson (Rep)']::text[], ARRAY['opening', 'training', 'support']::text[],
   3, NOW() - INTERVAL '34 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (92, 'interaction', 'site_visit', 'Commissary visit', 'Toured central kitchen', NOW() - INTERVAL '39 days', 120, 57, 29, 9, false,
   'Commissary handles 800 locations, significant volume opportunity', 'positive', 'Chipotle Commissary - Chicago', ARRAY['Operations Director', 'Quality Manager', 'Logistics Lead', 'Jim Taylor (Rep)']::text[], ARRAY['commissary', 'central-kitchen', 'volume']::text[],
   3, NOW() - INTERVAL '39 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (93, 'interaction', 'site_visit', 'Executive site tour', 'Hosted leadership visit', NOW() - INTERVAL '44 days', 180, 38, 19, 34, true,
   'Executive team toured our R&D facility, impressed with innovation capabilities', 'positive', 'MFB R&D Center - Chicago', ARRAY['Reinhart CEO', 'VP Supply Chain', 'R&D Director', 'David Kim (Rep)']::text[], ARRAY['executive', 'r&d', 'innovation']::text[],
   5, NOW() - INTERVAL '44 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (94, 'interaction', 'site_visit', 'Training facility visit', 'Conducted on-site training', NOW() - INTERVAL '49 days', 240, 68, 34, 19, false,
   'Trained 25 staff members, created location-specific recipe guides', 'positive', 'Cracker Barrel Training Center', ARRAY['Training Director', 'Regional Chefs (6)', 'HR Manager', 'Amanda Clark (Rep)']::text[], ARRAY['training', 'culinary', 'recipes']::text[],
   5, NOW() - INTERVAL '49 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (95, 'interaction', 'site_visit', 'Banquet kitchen visit', 'Assessed banquet operations', NOW() - INTERVAL '54 days', 120, 60, 30, 21, true,
   'Banquet operations need high-volume consistent products, perfect fit', 'positive', 'Hilton Chicago Banquet Kitchen', ARRAY['Banquet Chef', 'F&B Director', 'Catering Manager', 'Sarah Wilson (Rep)']::text[], ARRAY['banquet', 'hotel', 'catering']::text[],
   6, NOW() - INTERVAL '54 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (96, 'interaction', 'site_visit', 'Regional office visit', 'Met at regional headquarters', NOW() - INTERVAL '59 days', 90, 23, 12, 35, false,
   'Met entire regional leadership, aligned on growth strategy', 'positive', 'PFG Regional Office - Indianapolis', ARRAY['Regional President', 'Sales Directors (3)', 'Marketing VP', 'Mike Chen (Rep)']::text[], ARRAY['regional', 'leadership', 'strategy']::text[],
   5, NOW() - INTERVAL '59 days', NOW()),

  -- ========================================
  -- CONTRACT_REVIEW Activities (12)
  -- ========================================
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (97, 'interaction', 'contract_review', 'Initial contract review', 'Reviewed initial terms', NOW() - INTERVAL '5 days', 60, 42, 21, 28, true,
   'Standard terms acceptable, negotiating volume commitments', 'neutral', 'Video call', ARRAY['Legal Counsel', 'Procurement Director', 'Jim Taylor (Rep)']::text[], ARRAY['contract', 'initial-review', 'terms']::text[],
   6, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (98, 'interaction', 'contract_review', 'Pricing terms discussion', 'Negotiated pricing section', NOW() - INTERVAL '10 days', 45, 45, 23, 22, false,
   'Agreed on tiered pricing structure with volume discounts', 'positive', 'Phone', ARRAY['CFO', 'Procurement Lead', 'Sarah Davis (Rep)']::text[], ARRAY['pricing', 'negotiation', 'volume-discount']::text[],
   2, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (99, 'interaction', 'contract_review', 'Legal review meeting', 'Discussed legal concerns', NOW() - INTERVAL '15 days', 90, 54, 27, 20, true,
   'Minor liability clause revisions requested, reviewing internally', 'neutral', 'In-person meeting', ARRAY['General Counsel', 'Risk Manager', 'Legal Team', 'David Kim (Rep)']::text[], ARRAY['legal', 'liability', 'review']::text[],
   5, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (100, 'interaction', 'contract_review', 'Renewal terms review', 'Reviewed renewal conditions', NOW() - INTERVAL '20 days', 60, 58, 29, 23, false,
   'Renewal terms agreed, adding auto-renewal clause', 'positive', 'Video call', ARRAY['VP Procurement', 'Contract Manager', 'Amanda Clark (Rep)']::text[], ARRAY['renewal', 'auto-renewal', 'terms']::text[],
   3, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 24: customer_org 39 -> contacts 78, 79, 80
  (101, 'interaction', 'contract_review', 'Volume commitment review', 'Discussed volume requirements', NOW() - INTERVAL '25 days', 45, 79, 39, 24, true,
   'Committed to 500 cases/month minimum, locked pricing for 12 months', 'positive', 'Phone', ARRAY['Purchasing Manager', 'Operations Director', 'Tom Wilson (Rep)']::text[], ARRAY['volume', 'commitment', 'pricing-lock']::text[],
   3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (102, 'interaction', 'contract_review', 'Payment terms negotiation', 'Negotiated payment schedule', NOW() - INTERVAL '30 days', 60, 46, 23, 22, false,
   'Extended payment terms to Net 45, 2% early payment discount', 'positive', 'Video call', ARRAY['CFO', 'AP Director', 'Mike Chen (Rep)']::text[], ARRAY['payment-terms', 'net-45', 'discount']::text[],
   2, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (103, 'interaction', 'contract_review', 'Distribution agreement review', 'Reviewed distributor terms', NOW() - INTERVAL '35 days', 75, 26, 13, 31, true,
   'Exclusive distribution rights for Midwest region agreed', 'positive', 'In-person meeting', ARRAY['Distribution VP', 'Legal', 'Regional Director', 'Sarah Wilson (Rep)']::text[], ARRAY['distribution', 'exclusive', 'midwest']::text[],
   3, NOW() - INTERVAL '35 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (104, 'interaction', 'contract_review', 'Service level review', 'Discussed SLA terms', NOW() - INTERVAL '40 days', 45, 30, 15, 36, false,
   '99% fill rate SLA with penalties/credits structure agreed', 'positive', 'Phone', ARRAY['Operations VP', 'Logistics Manager', 'Jim Taylor (Rep)']::text[], ARRAY['sla', 'fill-rate', 'service']::text[],
   6, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (105, 'interaction', 'contract_review', 'Exclusivity terms review', 'Discussed exclusive arrangement', NOW() - INTERVAL '45 days', 60, 23, 12, 35, true,
   'Category exclusivity for premium fries, 2-year term', 'positive', 'Video call', ARRAY['VP Procurement', 'Category Director', 'Legal', 'David Kim (Rep)']::text[], ARRAY['exclusivity', 'category', 'premium']::text[],
   5, NOW() - INTERVAL '45 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (106, 'interaction', 'contract_review', 'Final contract review', 'Final review before signing', NOW() - INTERVAL '50 days', 90, 20, 10, 29, false,
   'All terms finalized, scheduling signing ceremony for next week', 'positive', 'In-person meeting', ARRAY['CEO', 'General Counsel', 'CFO', 'VP Sales', 'Sarah Jones (Rep)']::text[], ARRAY['final', 'signing', 'executive']::text[],
   2, NOW() - INTERVAL '50 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (107, 'interaction', 'contract_review', 'Amendment review', 'Reviewed contract changes', NOW() - INTERVAL '55 days', 45, 22, 11, 30, true,
   'Amendment to add 5 new SKUs approved, effective immediately', 'positive', 'Email exchange', ARRAY['Contract Administrator', 'Category Manager', 'Tom Wilson (Rep)']::text[], ARRAY['amendment', 'sku-addition', 'approved']::text[],
   3, NOW() - INTERVAL '55 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (108, 'interaction', 'contract_review', 'Term extension review', 'Discussed term extension', NOW() - INTERVAL '60 days', 60, 24, 12, 35, false,
   'Extended contract 1 year with same terms, pricing adjustment next renewal', 'positive', 'Phone', ARRAY['Procurement Director', 'Legal', 'Mike Chen (Rep)']::text[], ARRAY['extension', 'renewal', 'pricing']::text[],
   5, NOW() - INTERVAL '60 days', NOW()),

  -- ========================================
  -- CHECK_IN Activities (12)
  -- ========================================
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (109, 'interaction', 'check_in', 'Monthly account check-in', 'Regular monthly touchpoint', NOW() - INTERVAL '2 days', 20, 48, 24, 15, false,
   'Account healthy, no issues, planning Q2 promotions', 'positive', 'Phone', ARRAY['Account Manager', 'Sarah Davis (Rep)']::text[], ARRAY['monthly', 'check-in', 'healthy']::text[],
   4, NOW() - INTERVAL '2 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (110, 'interaction', 'check_in', 'Relationship maintenance call', 'Nurturing key relationship', NOW() - INTERVAL '7 days', 25, 52, 26, 14, true,
   'Strong relationship, potential for expansion to new regions', 'positive', 'Phone', ARRAY['Regional Director', 'David Kim (Rep)']::text[], ARRAY['relationship', 'expansion', 'nurturing']::text[],
   5, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (111, 'interaction', 'check_in', 'Quarterly business check-in', 'Quarterly account review', NOW() - INTERVAL '12 days', 30, 67, 33, 7, false,
   'Q4 exceeded targets, planning 15% growth next year', 'positive', 'Video call', ARRAY['VP Operations', 'Regional Manager', 'Amanda Clark (Rep)']::text[], ARRAY['quarterly', 'review', 'growth']::text[],
   6, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (112, 'interaction', 'check_in', 'New contact introduction', 'Introduction to new team member', NOW() - INTERVAL '17 days', 20, 69, 34, 19, true,
   'New purchasing manager introduced, scheduling demo next week', 'positive', 'Phone', ARRAY['New Purchasing Manager', 'Outgoing Manager', 'Tom Wilson (Rep)']::text[], ARRAY['introduction', 'new-contact', 'transition']::text[],
   4, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (113, 'interaction', 'check_in', 'Holiday greeting call', 'Season greetings touchpoint', NOW() - INTERVAL '22 days', 15, 71, 35, 16, false,
   'Warm holiday wishes exchanged, mentioned January budget availability', 'positive', 'Phone', ARRAY['Director Campus Dining', 'Mike Chen (Rep)']::text[], ARRAY['holiday', 'greeting', 'relationship']::text[],
   3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (114, 'interaction', 'check_in', 'Account health check', 'Verified account satisfaction', NOW() - INTERVAL '27 days', 25, 73, 36, 11, true,
   'High satisfaction scores, minor delivery timing feedback', 'positive', 'Phone', ARRAY['Operations Director', 'Sarah Wilson (Rep)']::text[], ARRAY['health-check', 'satisfaction', 'feedback']::text[],
   4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (115, 'interaction', 'check_in', 'Post-order check-in', 'Followed up after delivery', NOW() - INTERVAL '32 days', 15, 75, 37, 18, false,
   'First order delivered successfully, residents enjoying products', 'positive', 'Phone', ARRAY['Food Services Director', 'Jim Taylor (Rep)']::text[], ARRAY['post-order', 'delivery', 'satisfaction']::text[],
   6, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (116, 'interaction', 'check_in', 'Year-end review call', 'Annual relationship review', NOW() - INTERVAL '37 days', 30, 77, 38, 4, true,
   'Strong year, $125K in revenue, planning 25% growth next year', 'positive', 'Video call', ARRAY['VP Procurement', 'CFO', 'David Kim (Rep)']::text[], ARRAY['year-end', 'review', 'growth']::text[],
   4, NOW() - INTERVAL '37 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (117, 'interaction', 'check_in', 'New year planning call', 'Discussed upcoming year plans', NOW() - INTERVAL '42 days', 25, 80, 39, 12, false,
   'Aligned on 2024 goals, new product trials scheduled for Q1', 'positive', 'Phone', ARRAY['Purchasing Director', 'Amanda Clark (Rep)']::text[], ARRAY['planning', 'new-year', 'goals']::text[],
   2, NOW() - INTERVAL '42 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (118, 'interaction', 'check_in', 'Summer season check-in', 'Seasonal planning discussion', NOW() - INTERVAL '47 days', 20, 56, 28, 13, true,
   'Summer menu planning underway, need plant-based options', 'positive', 'Phone', ARRAY['Chef', 'Category Manager', 'Tom Wilson (Rep)']::text[], ARRAY['seasonal', 'summer', 'menu-planning']::text[],
   6, NOW() - INTERVAL '47 days', NOW()),
  -- Opp 43: customer_org 33 -> contacts 66, 67
  (119, 'interaction', 'check_in', 'Executive relationship check', 'Executive level touchpoint', NOW() - INTERVAL '52 days', 30, 66, 33, 43, false,
   'CEO appreciates partnership, wants quarterly executive touchpoints', 'positive', 'Video call', ARRAY['CEO', 'VP Sales (MFB)', 'Mike Chen (Rep)']::text[], ARRAY['executive', 'relationship', 'strategic']::text[],
   6, NOW() - INTERVAL '52 days', NOW()),
  -- Opp 43: customer_org 33 -> contacts 66, 67
  (120, 'interaction', 'check_in', 'Operations alignment check', 'Verified operational alignment', NOW() - INTERVAL '57 days', 25, 67, 33, 43, true,
   'Operations aligned, supply chain performing at 99.2% fill rate', 'positive', 'Phone', ARRAY['Operations Director', 'Logistics Manager', 'Sarah Davis (Rep)']::text[], ARRAY['operations', 'alignment', 'supply-chain']::text[],
   6, NOW() - INTERVAL '57 days', NOW()),

  -- ========================================
  -- SOCIAL Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (121, 'interaction', 'note', 'Industry dinner event', 'Networking dinner with contacts', NOW() - INTERVAL '10 days', 180, 39, 20, 1, false,
   'Great dinner conversation, learned about upcoming menu changes', 'positive', 'RPM Italian - Chicago', ARRAY['Chef', 'Purchasing Manager', 'Marketing Director', 'Sarah Wilson (Rep)']::text[], ARRAY['dinner', 'networking', 'relationship']::text[],
   2, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (122, 'interaction', 'note', 'Golf outing', 'Client appreciation golf', NOW() - INTERVAL '20 days', 300, 19, 10, 29, true,
   'Great round of golf, discussed partnership expansion informally', 'positive', 'Medinah Country Club', ARRAY['VP Procurement', 'Regional Director', 'CFO', 'Sarah Jones (Rep)', 'VP Sales (MFB)']::text[], ARRAY['golf', 'appreciation', 'executive']::text[],
   2, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (123, 'interaction', 'note', 'Wine dinner event', 'Hosted wine pairing dinner', NOW() - INTERVAL '30 days', 180, 43, 22, 5, false,
   'Elegant evening, chef interested in premium Italian product line', 'positive', 'Girl and the Goat', ARRAY['Executive Chef', 'Sommelier', 'GM', 'Mike Chen (Rep)']::text[], ARRAY['wine', 'dinner', 'premium']::text[],
   4, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (124, 'interaction', 'note', 'Sporting event tickets', 'Hosted at baseball game', NOW() - INTERVAL '40 days', 240, 78, 39, 12, true,
   'Cubs game in premium suite, great bonding experience', 'positive', 'Wrigley Field - Luxury Suite', ARRAY['GM', 'Operations Director', 'Family Members', 'Jim Taylor (Rep)']::text[], ARRAY['sports', 'cubs', 'hospitality']::text[],
   4, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (125, 'interaction', 'note', 'Charity event', 'Connected at charity fundraiser', NOW() - INTERVAL '50 days', 180, 59, 30, 3, false,
   'Met at No Kid Hungry event, discovered shared values', 'positive', 'Chicago Hilton Ballroom', ARRAY['VP Operations', 'Foundation Director', 'Industry Peers', 'Tom Wilson (Rep)']::text[], ARRAY['charity', 'values', 'community']::text[],
   3, NOW() - INTERVAL '50 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (126, 'interaction', 'note', 'Industry awards dinner', 'Attended awards ceremony together', NOW() - INTERVAL '60 days', 240, 55, 28, 13, true,
   'Aramark won foodservice excellence award, great photo ops', 'positive', 'Navy Pier Grand Ballroom', ARRAY['CEO Aramark', 'Industry Leaders', 'Media', 'Amanda Clark (Rep)']::text[], ARRAY['awards', 'recognition', 'networking']::text[],
   6, NOW() - INTERVAL '60 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (127, 'interaction', 'note', 'Coffee meeting', 'Informal catch-up coffee', NOW() - INTERVAL '70 days', 60, 66, 33, 7, false,
   'Relaxed conversation about industry trends and family', 'positive', 'Intelligentsia Coffee - Loop', ARRAY['Procurement Director', 'Mike Chen (Rep)']::text[], ARRAY['coffee', 'informal', 'relationship']::text[],
   6, NOW() - INTERVAL '70 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (128, 'interaction', 'note', 'Happy hour networking', 'After-work networking event', NOW() - INTERVAL '80 days', 120, 72, 36, 11, true,
   'Met several new contacts, warm introductions made', 'positive', 'The Signature Room - 95th Floor', ARRAY['Campus Dining Team (5)', 'Industry Peers', 'Sarah Wilson (Rep)']::text[], ARRAY['happy-hour', 'networking', 'introductions']::text[],
   4, NOW() - INTERVAL '80 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (129, 'interaction', 'note', 'Holiday party', 'Annual holiday celebration', NOW() - INTERVAL '90 days', 180, 47, 24, 15, false,
   'Festive atmosphere, strengthened personal relationships', 'positive', 'MFB Holiday Party - Drake Hotel', ARRAY['Key Clients (15)', 'MFB Team (10)', 'David Kim (Rep)']::text[], ARRAY['holiday', 'celebration', 'appreciation']::text[],
   2, NOW() - INTERVAL '90 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (130, 'interaction', 'note', 'Client appreciation lunch', 'Thank you lunch for key buyer', NOW() - INTERVAL '100 days', 90, 21, 11, 30, true,
   'Expressed gratitude for partnership, discussed mutual growth', 'positive', 'Alinea', ARRAY['Category Manager', 'VP Sales (MFB)', 'Tom Wilson (Rep)']::text[], ARRAY['appreciation', 'lunch', 'fine-dining']::text[],
   3, NOW() - INTERVAL '100 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (131, 'interaction', 'note', 'Industry mixer', 'Networking at industry event', NOW() - INTERVAL '110 days', 120, 25, 13, 31, false,
   'IFDA mixer, connected with 5 new potential contacts', 'positive', 'Palmer House Hilton', ARRAY['Distribution Executives (20+)', 'Industry Leaders', 'Sarah Davis (Rep)']::text[], ARRAY['mixer', 'ifda', 'networking']::text[],
   3, NOW() - INTERVAL '110 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (132, 'interaction', 'note', 'New Year celebration', 'Rang in New Year with client', NOW() - INTERVAL '120 days', 180, 35, 18, 33, true,
   'Memorable New Year celebration, toasted to partnership success', 'positive', 'Shamrock Foods Executive Suite', ARRAY['CEO Shamrock', 'Executive Team', 'MFB Leadership', 'Amanda Clark (Rep)']::text[], ARRAY['new-year', 'celebration', 'partnership']::text[],
   4, NOW() - INTERVAL '120 days', NOW()),

  -- ========================================
  -- NOTE Activities (18 - general notes)
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (133, 'interaction', 'note', 'Competitive intelligence', 'Learned competitor is offering lower prices', NOW() - INTERVAL '1 day', 5, 40, 20, 25, false,
   'Lamb Weston offering 15% below our price, need competitive response strategy', 'neutral', 'Internal note', ARRAY[]::text[], ARRAY['competitive', 'intel', 'pricing']::text[],
   4, NOW() - INTERVAL '1 day', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (134, 'interaction', 'note', 'Menu change planned', 'Chef mentioned upcoming menu revamp', NOW() - INTERVAL '3 days', 5, 44, 22, 26, true,
   'Spring menu launching in March, opportunity for 3 new SKUs', 'positive', 'Internal note', ARRAY[]::text[], ARRAY['menu', 'opportunity', 'spring']::text[],
   4, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (135, 'interaction', 'note', 'Budget cycle timing', 'Budget decisions made in Q3', NOW() - INTERVAL '5 days', 5, 50, 25, 27, false,
   'New vendor decisions made in August, need to be in RFP by July 15', 'neutral', 'Internal note', ARRAY[]::text[], ARRAY['budget', 'timing', 'rfp']::text[],
   5, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (136, 'interaction', 'note', 'Key stakeholder identified', 'CFO has final approval authority', NOW() - INTERVAL '7 days', 5, 42, 21, 28, true,
   'CFO Michael Chen has final say on all purchases >$50K, need executive meeting', 'neutral', 'Internal note', ARRAY[]::text[], ARRAY['stakeholder', 'cfo', 'executive']::text[],
   6, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (137, 'interaction', 'note', 'Expansion plans shared', 'Opening 5 new locations next year', NOW() - INTERVAL '9 days', 5, 19, 10, 29, false,
   'Sysco expanding Chicago coverage with 5 new DCs, potential $500K incremental', 'positive', 'Internal note', ARRAY[]::text[], ARRAY['expansion', 'growth', 'distribution']::text[],
   2, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (138, 'interaction', 'note', 'Pain point identified', 'Current supplier has quality issues', NOW() - INTERVAL '11 days', 5, 21, 11, 30, true,
   'US Foods frustrated with McCain quality inconsistency, opening for our products', 'positive', 'Internal note', ARRAY[]::text[], ARRAY['pain-point', 'quality', 'opportunity']::text[],
   3, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (139, 'interaction', 'note', 'Timeline update', 'Decision pushed to next quarter', NOW() - INTERVAL '13 days', 5, 25, 13, 31, false,
   'GFS decision delayed due to internal reorganization, new timeline Q2', 'negative', 'Internal note', ARRAY[]::text[], ARRAY['timeline', 'delay', 'reorg']::text[],
   3, NOW() - INTERVAL '13 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (140, 'interaction', 'note', 'Contact leaving', 'Key contact taking new job', NOW() - INTERVAL '15 days', 5, 63, 31, 32, true,
   'Dr. Wong leaving for Cleveland Clinic, need to build relationship with replacement', 'negative', 'Internal note', ARRAY[]::text[], ARRAY['contact', 'transition', 'risk']::text[],
   4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (141, 'interaction', 'note', 'Vendor consolidation', 'Looking to reduce vendor count', NOW() - INTERVAL '17 days', 5, 35, 18, 33, false,
   'Shamrock consolidating from 25 to 15 suppliers, need to demonstrate full portfolio value', 'neutral', 'Internal note', ARRAY[]::text[], ARRAY['consolidation', 'vendor', 'strategic']::text[],
   4, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (142, 'interaction', 'note', 'Sustainability focus', 'Increasing focus on sustainability', NOW() - INTERVAL '19 days', 5, 38, 19, 34, true,
   'Reinhart prioritizing suppliers with ESG credentials, highlight our sustainability program', 'positive', 'Internal note', ARRAY[]::text[], ARRAY['sustainability', 'esg', 'priority']::text[],
   5, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (143, 'interaction', 'note', 'Regional preference', 'Prefers local/regional suppliers', NOW() - INTERVAL '21 days', 5, 23, 12, 35, false,
   'PFG has strong preference for suppliers with local manufacturing, emphasize our Idaho facilities', 'neutral', 'Internal note', ARRAY[]::text[], ARRAY['regional', 'local', 'manufacturing']::text[],
   5, NOW() - INTERVAL '21 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (144, 'interaction', 'note', 'Pricing sensitivity', 'Very price sensitive account', NOW() - INTERVAL '23 days', 5, 29, 15, 36, true,
   'Ben E Keith extremely price-driven, may need to offer promotional pricing to win', 'negative', 'Internal note', ARRAY[]::text[], ARRAY['pricing', 'sensitive', 'promotional']::text[],
   6, NOW() - INTERVAL '23 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (145, 'interaction', 'note', 'Quality over price', 'Willing to pay premium for quality', NOW() - INTERVAL '25 days', 5, 53, 27, 2, false,
   'Texas Roadhouse values quality highly, price secondary to consistency', 'positive', 'Internal note', ARRAY[]::text[], ARRAY['quality', 'premium', 'value']::text[],
   3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (146, 'interaction', 'note', 'Contract renewal timing', 'Contract up for renewal in June', NOW() - INTERVAL '27 days', 5, 76, 38, 4, true,
   'Sodexo contract renews June 30, need proposal submitted by May 15 for consideration', 'neutral', 'Internal note', ARRAY[]::text[], ARRAY['renewal', 'deadline', 'contract']::text[],
   4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (147, 'interaction', 'note', 'Decision maker identified', 'VP Operations makes final call', NOW() - INTERVAL '29 days', 5, 41, 21, 6, false,
   'VP Operations Susan Martinez is actual decision maker, not procurement lead', 'neutral', 'Internal note', ARRAY[]::text[], ARRAY['decision-maker', 'vp', 'authority']::text[],
   5, NOW() - INTERVAL '29 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (148, 'interaction', 'note', 'Competitor weakness', 'Competitor having supply issues', NOW() - INTERVAL '31 days', 5, 66, 33, 7, true,
   'Simplot experiencing production issues at their plant, opportunity to gain share', 'positive', 'Internal note', ARRAY[]::text[], ARRAY['competitive', 'supply', 'opportunity']::text[],
   6, NOW() - INTERVAL '31 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (149, 'interaction', 'note', 'Budget approved', 'Got budget approval for new vendor', NOW() - INTERVAL '33 days', 5, 62, 31, 8, false,
   'Northwestern Memorial approved $200K budget for new premium food vendor', 'positive', 'Internal note', ARRAY[]::text[], ARRAY['budget', 'approved', 'healthcare']::text[],
   2, NOW() - INTERVAL '33 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (150, 'interaction', 'note', 'Trial feedback positive', 'Pilot program getting great reviews', NOW() - INTERVAL '35 days', 5, 57, 29, 9, true,
   'Chipotle pilot scoring 4.8/5 in customer surveys, expansion likely', 'positive', 'Internal note', ARRAY[]::text[], ARRAY['pilot', 'feedback', 'success']::text[],
   3, NOW() - INTERVAL '35 days', NOW());

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
  id, title, description, due_date, reminder_date, contact_id, opportunity_id,
  sales_id, completed, priority, type, created_at, updated_at
)
VALUES
  -- ========================================
  -- OVERDUE TASKS (10)
  -- ========================================
  (1, 'Follow up on sample delivery confirmation',
   'Confirm that the McCRUM fry samples were delivered to Capital Grille kitchen. Check with receiving department and get feedback from chef.',
   CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '6 days', 39, 1, 2, false, 'high', 'Follow-up',
   NOW() - INTERVAL '10 days', NOW()),
  (2, 'Send revised pricing proposal',
   'Update pricing proposal based on feedback from Texas Roadhouse. Include volume discount tiers for 500+ case orders.',
   CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '4 days', 53, 2, 3, false, 'high', 'Email',
   NOW() - INTERVAL '8 days', NOW()),
  (3, 'Schedule chef demo at kitchen',
   'Coordinate with Hilton banquet chef for product demo. Need to arrange sample delivery and confirm kitchen availability.',
   CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '8 days', 59, 3, 3, false, 'medium', 'Meeting',
   NOW() - INTERVAL '14 days', NOW()),
  (4, 'Review contract redlines from legal',
   'Review Sodexo legal team redlines on master services agreement. Focus on liability clauses and payment terms sections.',
   CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '3 days', 76, 4, 4, false, 'critical', 'Other',
   NOW() - INTERVAL '5 days', NOW()),
  (5, 'Call back about volume commitments',
   'Return call to Maggianos culinary director about minimum volume commitments for exclusive Italian line.',
   CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '5 days', 43, 5, 4, false, 'high', 'Call',
   NOW() - INTERVAL '9 days', NOW()),
  (6, 'Submit sample request form',
   'Complete internal sample request form for Lettuce Entertain You. Need 5 cases of premium crinkle cut and 3 cases sweet potato fries.',
   CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '7 days', 41, 6, 5, false, 'medium', 'Other',
   NOW() - INTERVAL '12 days', NOW()),
  (7, 'Prepare presentation for committee',
   'Finalize PowerPoint presentation for Morrison Healthcare purchasing committee. Include ROI analysis and competitor comparison.',
   CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '2 days', 66, 7, 6, false, 'critical', 'Other',
   NOW() - INTERVAL '7 days', NOW()),
  (8, 'Send product spec sheets',
   'Email complete product specification sheets to Northwestern Memorial food services. Include nutritional info and allergen statements.',
   CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '9 days', 62, 8, 2, false, 'medium', 'Email',
   NOW() - INTERVAL '15 days', NOW()),
  (9, 'Coordinate shipping logistics',
   'Work with logistics team to coordinate sample shipment to Chipotle commissary. Ensure cold chain compliance documentation.',
   CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '4 days', 57, 9, 3, false, 'high', 'Other',
   NOW() - INTERVAL '6 days', NOW()),
  (10, 'Follow up on budget approval',
   'Check with Portillos VP Operations on status of budget approval for premium fry line conversion.',
   CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '6 days', 49, 10, 3, false, 'medium', 'Follow-up',
   NOW() - INTERVAL '10 days', NOW()),

  -- ========================================
  -- DUE TODAY (8)
  -- ========================================
  (11, 'Call to confirm demo attendance',
   'Confirm attendance for tomorrow campus dining demo. Need count for setup and catering.',
   CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day', 72, 11, 4, false, 'high', 'Call',
   NOW() - INTERVAL '3 days', NOW()),
  (12, 'Email meeting recap',
   'Send meeting recap and action items from yesterday sports venue discussion. Include pricing summary and next steps.',
   CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day', 78, 12, 4, false, 'medium', 'Email',
   NOW() - INTERVAL '1 day', NOW()),
  (13, 'Submit distributor application',
   'Complete Aramark preferred supplier application. Include food safety certifications and insurance documentation.',
   CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day', 55, 13, 5, false, 'high', 'Other',
   NOW() - INTERVAL '5 days', NOW()),
  (14, 'Review feedback survey results',
   'Analyze WhataGrill pilot program feedback survey results. Prepare summary for stakeholder meeting.',
   CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day', 51, 14, 5, false, 'medium', 'Other',
   NOW() - INTERVAL '2 days', NOW()),
  (15, 'Prepare QBR presentation',
   'Complete Q4 QBR presentation for Chilis category team. Include sales metrics, product performance, and growth opportunities.',
   CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day', 47, 15, 2, false, 'critical', 'Meeting',
   NOW() - INTERVAL '7 days', NOW()),
  (16, 'Send contract for signature',
   'Send final approved contract to Compass Group for DocuSign signature. Include counter-signed copy.',
   CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day', 70, 16, 3, false, 'critical', 'Email',
   NOW() - INTERVAL '4 days', NOW()),
  (17, 'Confirm sample arrival',
   'Call Darden test kitchen to confirm sample delivery and schedule feedback call for Friday.',
   CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day', 64, 17, 3, false, 'medium', 'Call',
   NOW() - INTERVAL '2 days', NOW()),
  (18, 'Update CRM with call notes',
   'Enter call notes from Elior discussion into CRM. Update opportunity stage and next action date.',
   CURRENT_DATE, CURRENT_DATE, 74, 18, 4, false, 'low', 'Other',
   NOW() - INTERVAL '1 day', NOW()),

  -- ========================================
  -- DUE TOMORROW (7)
  -- ========================================
  (19, 'Schedule site visit',
   'Coordinate with Cracker Barrel regional manager to schedule kitchen site visit. Need 2-hour window for full assessment.',
   CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE, 68, 19, 5, false, 'medium', 'Meeting',
   NOW() - INTERVAL '3 days', NOW()),
  (20, 'Send case study materials',
   'Email success case studies to renewal contact. Include ROI metrics and customer testimonials.',
   CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE, 54, 20, 5, false, 'medium', 'Email',
   NOW() - INTERVAL '2 days', NOW()),
  (21, 'Prepare pricing comparison',
   'Create side-by-side pricing comparison vs. current supplier for hotel expansion proposal.',
   CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE, 60, 21, 6, false, 'high', 'Other',
   NOW() - INTERVAL '4 days', NOW()),
  (22, 'Call about menu launch date',
   'Discuss Applebees national menu launch timeline and order volume projections.',
   CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE, 45, 22, 2, false, 'high', 'Call',
   NOW() - INTERVAL '2 days', NOW()),
  (23, 'Email reference contacts',
   'Send list of 3 reference contacts for Chipotle due diligence process.',
   CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE, 58, 23, 3, false, 'medium', 'Email',
   NOW() - INTERVAL '1 day', NOW()),
  (24, 'Review pilot results data',
   'Analyze sports venue pilot performance data. Prepare executive summary for GM meeting.',
   CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE, 79, 24, 3, false, 'high', 'Other',
   NOW() - INTERVAL '3 days', NOW()),
  (25, 'Finalize demo logistics',
   'Confirm demo setup requirements with Capital Grille kitchen manager. Verify equipment and ingredient availability.',
   CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE, 40, 25, 4, false, 'high', 'Meeting',
   NOW() - INTERVAL '2 days', NOW()),

  -- ========================================
  -- UPCOMING THIS WEEK (8)
  -- ========================================
  (26, 'Prepare for trade show',
   'Finalize booth setup checklist for Maggianos regional show. Coordinate sample inventory and marketing materials.',
   CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 days', 44, 26, 4, false, 'high', 'Other',
   NOW() - INTERVAL '5 days', NOW()),
  (27, 'Send thank you notes',
   'Send personalized thank you notes to Portillos team after successful demo. Include next steps summary.',
   CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day', 50, 27, 5, false, 'low', 'Email',
   NOW() - INTERVAL '1 day', NOW()),
  (28, 'Update opportunity stage',
   'Move Lettuce Entertain You opportunity to demo_scheduled stage. Update CRM with latest details.',
   CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '3 days', 42, 28, 6, false, 'low', 'Other',
   NOW() - INTERVAL '2 days', NOW()),
  (29, 'Schedule follow-up meeting',
   'Set up follow-up meeting with Sysco category team to discuss seasonal product additions.',
   CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 days', 19, 29, 2, false, 'medium', 'Meeting',
   NOW() - INTERVAL '1 day', NOW()),
  (30, 'Prepare product samples',
   'Coordinate sample pack preparation for US Foods culinary team visit. Include full product range.',
   CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '4 days', 21, 30, 2, false, 'medium', 'Other',
   NOW() - INTERVAL '3 days', NOW()),
  (31, 'Review distributor agreement',
   'Review draft distribution agreement from GFS legal. Note any concerns for discussion.',
   CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day', 25, 31, 3, false, 'high', 'Other',
   NOW() - INTERVAL '1 day', NOW()),
  (32, 'Call about seasonal needs',
   'Discuss upcoming summer season menu needs with hospital food services director.',
   CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '3 days', 63, 32, 3, false, 'medium', 'Call',
   NOW() - INTERVAL '2 days', NOW()),
  (33, 'Email introduction to new buyer',
   'Send introduction email to new Shamrock Foods buyer. Include company overview and product catalog.',
   CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 days', 35, 33, 4, false, 'medium', 'Email',
   NOW() - INTERVAL '1 day', NOW()),

  -- ========================================
  -- UPCOMING NEXT WEEK (7)
  -- ========================================
  (34, 'Quarterly business review',
   'Prepare and conduct Q4 quarterly business review with Reinhart Foodservice. Include performance metrics and growth plan.',
   CURRENT_DATE + INTERVAL '8 days', CURRENT_DATE + INTERVAL '7 days', 38, 34, 5, false, 'high', 'Meeting',
   NOW() - INTERVAL '5 days', NOW()),
  (35, 'Product training session',
   'Conduct product training session for PFG sales team. Prepare materials covering full product portfolio.',
   CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '9 days', 23, 35, 5, false, 'medium', 'Meeting',
   NOW() - INTERVAL '7 days', NOW()),
  (36, 'Contract renewal discussion',
   'Lead contract renewal discussion with Ben E Keith. Prepare comparison of current vs. proposed terms.',
   CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '6 days', 29, 36, 6, false, 'critical', 'Meeting',
   NOW() - INTERVAL '3 days', NOW()),
  (37, 'Menu planning meeting',
   'Attend spring menu planning meeting with Chilis culinary innovation team.',
   CURRENT_DATE + INTERVAL '9 days', CURRENT_DATE + INTERVAL '8 days', 48, 37, 2, false, 'medium', 'Meeting',
   NOW() - INTERVAL '4 days', NOW()),
  (38, 'Site visit preparation',
   'Prepare site visit documentation and safety certifications for Texas Roadhouse facility tour.',
   CURRENT_DATE + INTERVAL '12 days', CURRENT_DATE + INTERVAL '11 days', 53, 38, 3, false, 'medium', 'Other',
   NOW() - INTERVAL '6 days', NOW()),
  (39, 'Distributor show prep',
   'Complete preparation for Compass Group annual distributor show. Finalize booth, samples, and presentations.',
   CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '13 days', 71, 39, 4, false, 'high', 'Other',
   NOW() - INTERVAL '10 days', NOW()),
  (40, 'Annual review preparation',
   'Prepare materials for annual account review with campus dining director. Include year-over-year analysis.',
   CURRENT_DATE + INTERVAL '11 days', CURRENT_DATE + INTERVAL '10 days', 73, 40, 4, false, 'medium', 'Meeting',
   NOW() - INTERVAL '8 days', NOW());

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
INSERT INTO "public"."contact_notes" (
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
SELECT setval(pg_get_serial_sequence('"contact_notes"', 'id'), 30, true);

-- ========================================
-- OPPORTUNITY NOTES (30)
-- ========================================
INSERT INTO "public"."opportunity_notes" (
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
SELECT setval(pg_get_serial_sequence('"opportunity_notes"', 'id'), 30, true);

-- ========================================
-- ORGANIZATION NOTES (15)
-- ========================================
INSERT INTO "public"."organization_notes" (
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
SELECT setval(pg_get_serial_sequence('organization_notes', 'id'), 15, true);

-- ========================================
-- VAULT SECRETS (for pg_cron + pg_net)
-- ========================================
-- These secrets enable scheduled Edge Function invocation via pg_cron
-- For local development only - cloud secrets are managed via Dashboard

-- Project URL for local Supabase
SELECT vault.create_secret(
  'http://api.supabase.internal:8000',
  'project_url',
  'Supabase project URL for Edge Function invocation'
);

-- Service role key for authenticated API calls
-- Note: This is the local dev service role key - safe to commit
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  'service_role_key',
  'Service role key for authenticated Edge Function calls'
);

-- ========================================
-- END OF SEED DATA
-- ========================================
