-- ============================================================================
-- PART 5: DISTRIBUTORS (10 organizations)
-- ============================================================================
-- Food distributors that carry principals' products
-- Mix of broadline and specialty distributors
-- Organization IDs: 10-19
-- ============================================================================

INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, status, phone, email, website,
  address, city, state, postal_code, country, account_manager_id,
  description, created_at, updated_at
)
VALUES
  -- 10. Sysco (Broadline - National)
  (10, 'Sysco Corporation', 'distributor', '11111111-0000-0000-0000-000000000023',
   'active', '["281-555-2001"]', '["purchasing@sysco.com"]', 'https://sysco.com',
   '1390 Enclave Parkway', 'Houston', 'TX', '77077', 'USA', 2,
   'Largest foodservice distributor in North America. Full broadline capabilities.',
   NOW(), NOW()),

  -- 11. US Foods (Broadline - National)
  (11, 'US Foods', 'distributor', '11111111-0000-0000-0000-000000000023',
   'active', '["847-555-2002"]', '["vendor@usfoods.com"]', 'https://usfoods.com',
   '9399 W Higgins Road', 'Rosemont', 'IL', '60018', 'USA', 2,
   'Second largest foodservice distributor. Strong in chain restaurant segment.',
   NOW(), NOW()),

  -- 12. Performance Food Group (Broadline)
  (12, 'Performance Food Group (PFG)', 'distributor', '11111111-0000-0000-0000-000000000023',
   'active', '["804-555-2003"]', '["purchasing@pfgc.com"]', 'https://pfgc.com',
   '12500 West Creek Parkway', 'Richmond', 'VA', '23238', 'USA', 3,
   'Third largest foodservice distributor. Strong regional presence.',
   NOW(), NOW()),

  -- 13. Gordon Food Service (Broadline)
  (13, 'Gordon Food Service (GFS)', 'distributor', '11111111-0000-0000-0000-000000000023',
   'active', '["616-555-2004"]', '["vendors@gfs.com"]', 'https://gfs.com',
   '1300 Gezon Parkway SW', 'Grand Rapids', 'MI', '49509', 'USA', 3,
   'Family-owned broadline distributor. Strong in Midwest and Canada.',
   NOW(), NOW()),

  -- 14. Shamrock Foods (Regional - Southwest)
  (14, 'Shamrock Foods', 'distributor', '11111111-0000-0000-0000-000000000023',
   'active', '["602-555-2005"]', '["purchasing@shamrockfoods.com"]', 'https://shamrockfoods.com',
   '2540 N 29th Avenue', 'Phoenix', 'AZ', '85009', 'USA', 4,
   'Regional broadline distributor focused on Southwest. Family-owned.',
   NOW(), NOW()),

  -- 15. Ben E. Keith (Regional - South)
  (15, 'Ben E. Keith Foods', 'distributor', '11111111-0000-0000-0000-000000000023',
   'active', '["817-555-2006"]', '["vendors@benekeith.com"]', 'https://benekeith.com',
   '601 E 7th Street', 'Fort Worth', 'TX', '76102', 'USA', 4,
   'Regional distributor covering Texas and surrounding states.',
   NOW(), NOW()),

  -- 16. Reinhart Foodservice (Regional - Midwest)
  (16, 'Reinhart Foodservice', 'distributor', '11111111-0000-0000-0000-000000000023',
   'active', '["715-555-2007"]', '["purchasing@rfrsinc.com"]', 'https://rfrsinc.com',
   '2355 Oak Industrial Drive NE', 'Grand Rapids', 'MI', '49505', 'USA', 5,
   'Regional broadline serving Upper Midwest. Part of Performance Food Group.',
   NOW(), NOW()),

  -- 17. Dot Foods (Redistribution)
  (17, 'Dot Foods', 'distributor', '11111111-0000-0000-0000-000000000025',
   'active', '["217-555-2008"]', '["purchasing@dotfoods.com"]', 'https://dotfoods.com',
   '1 Dot Way', 'Mt Sterling', 'IL', '62353', 'USA', 5,
   'Largest food redistributor in North America. Ships to other distributors.',
   NOW(), NOW()),

  -- 18. European Imports (Specialty)
  (18, 'European Imports Ltd', 'distributor', '11111111-0000-0000-0000-000000000024',
   'active', '["312-555-2009"]', '["sales@eiltd.com"]', 'https://eiltd.com',
   '600 E Brook Drive', 'Arlington Heights', 'IL', '60005', 'USA', 6,
   'Specialty distributor for European cheeses, meats, and gourmet items.',
   NOW(), NOW()),

  -- 19. Chefs Warehouse (Specialty)
  (19, 'The Chefs Warehouse', 'distributor', '11111111-0000-0000-0000-000000000024',
   'active', '["718-555-2010"]', '["vendors@chefswarehouse.com"]', 'https://chefswarehouse.com',
   '100 East Ridge Road', 'Ridgefield', 'CT', '06877', 'USA', 6,
   'Specialty distributor for fine dining and upscale restaurants.',
   NOW(), NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 19, true);
