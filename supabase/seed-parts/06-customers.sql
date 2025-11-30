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
  (20, 'The Capital Grille', 'customer', '22222222-2222-4222-8222-000000000006',
   '312-555-3001', 'manager@capitalgrille.com', 'https://thecapitalgrille.com',
   '633 N Saint Clair Street', 'Chicago', 'IL', '60611', 2,
   'Upscale steakhouse chain. High-end proteins and premium sides.',
   NOW(), NOW()),

  (21, 'Ruth''s Chris Steak House', 'customer', '22222222-2222-4222-8222-000000000006',
   '504-555-3002', 'purchasing@ruthschris.com', 'https://ruthschris.com',
   '500 Tchoupitoulas Street', 'New Orleans', 'LA', '70130', 2,
   'Premium steakhouse chain. USDA Prime beef and upscale appetizers.',
   NOW(), NOW()),

  (22, 'Morton''s The Steakhouse', 'customer', '22222222-2222-4222-8222-000000000006',
   '312-555-3003', 'gm@mortons.com', 'https://mortons.com',
   '65 E Wacker Place', 'Chicago', 'IL', '60601', 2,
   'Landry''s owned steakhouse. Premium cuts and classic sides.',
   NOW(), NOW()),

  -- Casual Dining (4) - Most to Brent
  (23, 'Chili''s Grill & Bar', 'customer', '22222222-2222-4222-8222-000000000006',
   '972-555-3004', 'procurement@brinker.com', 'https://chilis.com',
   '6820 LBJ Freeway', 'Dallas', 'TX', '75240', 2,
   'Brinker International casual dining. High volume, value-focused.',
   NOW(), NOW()),

  (24, 'Applebee''s', 'customer', '22222222-2222-4222-8222-000000000006',
   '913-555-3005', 'vendors@applebees.com', 'https://applebees.com',
   '8140 Ward Parkway', 'Kansas City', 'MO', '64114', 2,
   'Dine Brands casual dining. Neighborhood bar and grill concept.',
   NOW(), NOW()),

  (25, 'Buffalo Wild Wings', 'customer', '22222222-2222-4222-8222-000000000006',
   '612-555-3006', 'purchasing@buffalowildwings.com', 'https://buffalowildwings.com',
   '5500 Wayzata Blvd', 'Minneapolis', 'MN', '55416', 2,
   'Sports bar concept. High sauce and wing volume.',
   NOW(), NOW()),

  (26, 'Red Robin', 'customer', '22222222-2222-4222-8222-000000000006',
   '303-555-3007', 'foodsupply@redrobin.com', 'https://redrobin.com',
   '6312 S Fiddlers Green Circle', 'Greenwood Village', 'CO', '80111', 3,
   'Gourmet burger casual dining. Bottomless fries concept.',
   NOW(), NOW()),

  -- Fast Casual (3) - Most to Brent
  (27, 'Panera Bread', 'customer', '22222222-2222-4222-8222-000000000007',
   '314-555-3008', 'suppliers@panerabread.com', 'https://panerabread.com',
   '3630 S Geyer Road', 'St. Louis', 'MO', '63127', 2,
   'JAB Holdings bakery-cafe chain. Clean ingredients focus.',
   NOW(), NOW()),

  (28, 'Chipotle Mexican Grill', 'customer', '22222222-2222-4222-8222-000000000007',
   '949-555-3009', 'purchasing@chipotle.com', 'https://chipotle.com',
   '610 Newport Center Drive', 'Newport Beach', 'CA', '92660', 2,
   'Fast casual Mexican. Food with Integrity sourcing program.',
   NOW(), NOW()),

  (29, 'Shake Shack', 'customer', '22222222-2222-4222-8222-000000000007',
   '212-555-3010', 'supply@shakeshack.com', 'https://shakeshack.com',
   '225 Varick Street', 'New York', 'NY', '10014', 3,
   'Premium fast casual burgers. 100% Angus beef, no hormones.',
   NOW(), NOW()),

  -- Hotels (3) - Most to Brent
  (30, 'Marriott International', 'customer', '22222222-2222-4222-8222-000000000008',
   '301-555-3011', 'foodprocurement@marriott.com', 'https://marriott.com',
   '10400 Fernwood Road', 'Bethesda', 'MD', '20817', 2,
   'Largest hotel company. Multiple brands and banquet operations.',
   NOW(), NOW()),

  (31, 'Hilton Hotels', 'customer', '22222222-2222-4222-8222-000000000008',
   '703-555-3012', 'purchasing@hilton.com', 'https://hilton.com',
   '7930 Jones Branch Drive', 'McLean', 'VA', '22102', 2,
   'Global hotel chain. Convention and banquet focus.',
   NOW(), NOW()),

  (32, 'Hyatt Hotels', 'customer', '22222222-2222-4222-8222-000000000008',
   '312-555-3013', 'foodsourcing@hyatt.com', 'https://hyatt.com',
   '150 N Riverside Plaza', 'Chicago', 'IL', '60606', 2,
   'Upscale hotel chain. Strong restaurant-in-hotel concepts.',
   NOW(), NOW()),

  -- Healthcare (2) - Split
  (33, 'HCA Healthcare', 'customer', '22222222-2222-4222-8222-000000000003',
   '615-555-3014', 'dietary@hcahealthcare.com', 'https://hcahealthcare.com',
   'One Park Plaza', 'Nashville', 'TN', '37203', 2,
   'Largest for-profit hospital chain. High volume dietary operations.',
   NOW(), NOW()),

  (34, 'Ascension Health', 'customer', '22222222-2222-4222-8222-000000000003',
   '314-555-3015', 'nutrition@ascension.org', 'https://ascension.org',
   '4600 Edmundson Road', 'St. Louis', 'MO', '63134', 4,
   'Largest non-profit hospital system. Faith-based healthcare.',
   NOW(), NOW()),

  -- Education (2) - Split
  (35, 'Aramark Higher Education', 'customer', '22222222-2222-4222-8222-000000000005',
   '215-555-3016', 'education@aramark.com', 'https://aramark.com',
   '2400 Market Street', 'Philadelphia', 'PA', '19103', 2,
   'Contract foodservice for universities. Retail and residential dining.',
   NOW(), NOW()),

  (36, 'Sodexo Campus Services', 'customer', '22222222-2222-4222-8222-000000000005',
   '301-555-3017', 'campus@sodexo.com', 'https://sodexo.com',
   '9801 Washingtonian Blvd', 'Gaithersburg', 'MD', '20878', 5,
   'Global contract foodservice. University and K-12 operations.',
   NOW(), NOW()),

  -- Senior Living (2) - Sue
  (37, 'Brookdale Senior Living', 'customer', '22222222-2222-4222-8222-000000000003',
   '615-555-3018', 'culinary@brookdale.com', 'https://brookdale.com',
   '111 Westwood Place', 'Brentwood', 'TN', '37027', 6,
   'Largest senior living operator. Multiple care levels.',
   NOW(), NOW()),

  (38, 'Sunrise Senior Living', 'customer', '22222222-2222-4222-8222-000000000003',
   '703-555-3019', 'dining@sunriseseniorliving.com', 'https://sunriseseniorliving.com',
   '7900 Westpark Drive', 'McLean', 'VA', '22102', 6,
   'Premium senior living communities. Chef-prepared dining.',
   NOW(), NOW()),

  -- Sports/Entertainment (1) - Brent
  (39, 'Levy Restaurants', 'customer', '22222222-2222-4222-8222-000000000008',
   '312-555-3020', 'procurement@levyrestaurants.com', 'https://levyrestaurants.com',
   '980 N Michigan Avenue', 'Chicago', 'IL', '60611', 2,
   'Premium sports and entertainment foodservice. Stadiums and arenas.',
   NOW(), NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 39, true);
