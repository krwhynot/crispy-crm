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
  (1, 'McCRUM', 'principal', '22222222-2222-4222-8222-000000000002',
   '208-555-1001', 'sales@mccrum.com', 'https://mccrum.com',
   '123 Potato Lane', 'Idaho Falls', 'ID', '83401', 2,
   'Premium Idaho potato products including fries, hash browns, and specialty cuts. Family-owned since 1985.',
   NOW(), NOW()),

  -- 2. SWAP (Specialty ingredients) - Brent manages
  (2, 'SWAP', 'principal', '22222222-2222-4222-8222-000000000002',
   '312-555-1002', 'info@swapfoods.com', 'https://swapfoods.com',
   '456 Innovation Drive', 'Chicago', 'IL', '60601', 2,
   'Innovative plant-based and specialty food ingredients for foodservice.',
   NOW(), NOW()),

  -- 3. Rapid Rasoi (Indian cuisine) - Michelle manages
  (3, 'Rapid Rasoi', 'principal', '22222222-2222-4222-8222-000000000002',
   '510-555-1003', 'orders@rapidrasoi.com', 'https://rapidrasoi.com',
   '789 Spice Boulevard', 'Fremont', 'CA', '94536', 3,
   'Authentic Indian cuisine solutions - naan, curries, rice dishes, and appetizers.',
   NOW(), NOW()),

  -- 4. Lakeview Farms (Dairy/desserts) - Michelle manages
  (4, 'Lakeview Farms', 'principal', '22222222-2222-4222-8222-000000000002',
   '614-555-1004', 'foodservice@lakeviewfarms.com', 'https://lakeviewfarms.com',
   '321 Dairy Road', 'Columbus', 'OH', '43215', 3,
   'Premium dairy products and desserts including dips, parfaits, and cream-based items.',
   NOW(), NOW()),

  -- 5. Frico (Italian cheese) - Gary manages
  (5, 'Frico', 'principal', '22222222-2222-4222-8222-000000000002',
   '201-555-1005', 'usa@frico.it', 'https://frico.it',
   '555 Cheese Way', 'Newark', 'NJ', '07102', 4,
   'Authentic Italian cheeses - Parmesan, Gorgonzola, Asiago, and specialty varieties.',
   NOW(), NOW()),

  -- 6. Anchor (New Zealand dairy) - Gary manages
  (6, 'Anchor Food Professionals', 'principal', '22222222-2222-4222-8222-000000000002',
   '415-555-1006', 'foodservice@anchor.com', 'https://anchorfoodprofessionals.com',
   '888 Pacific Avenue', 'San Francisco', 'CA', '94102', 4,
   'New Zealand dairy products - butter, cream, UHT products for professional kitchens.',
   NOW(), NOW()),

  -- 7. Tattooed Chef (Plant-based) - Dale manages
  (7, 'Tattooed Chef', 'principal', '22222222-2222-4222-8222-000000000002',
   '310-555-1007', 'foodservice@tattooedchef.com', 'https://tattooedchef.com',
   '777 Vegan Street', 'Los Angeles', 'CA', '90001', 5,
   'Premium plant-based frozen meals and ingredients - bowls, burritos, and ready-to-eat options.',
   NOW(), NOW()),

  -- 8. Litehouse (Dressings/dips) - Dale manages
  (8, 'Litehouse', 'principal', '22222222-2222-4222-8222-000000000002',
   '208-555-1008', 'foodservice@litehousefoods.com', 'https://litehousefoods.com',
   '1109 Front Street', 'Sandpoint', 'ID', '83864', 5,
   'Premium dressings, dips, and cheese products. Known for blue cheese and ranch.',
   NOW(), NOW()),

  -- 9. Custom Culinary (Bases/sauces) - Sue manages
  (9, 'Custom Culinary', 'principal', '22222222-2222-4222-8222-000000000002',
   '630-555-1009', 'sales@customculinary.com', 'https://customculinary.com',
   '2555 Busse Road', 'Elk Grove Village', 'IL', '60007', 6,
   'Professional soup bases, sauces, gravies, and seasonings for foodservice operators.',
   NOW(), NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 9, true);
