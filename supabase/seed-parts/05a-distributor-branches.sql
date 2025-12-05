-- ============================================================================
-- PART 5A: DISTRIBUTOR BRANCHES (Regional locations)
-- ============================================================================
-- Regional branches of major broadline distributors
-- These link back to their parent organizations via parent_organization_id
-- Organization IDs: 40-51 (starting after existing 39 orgs)
-- ============================================================================

-- Sysco Corporation Branches (Parent ID: 10)
-- Sysco has 68+ operating companies; we include key regional ones
INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, phone, email, website,
  address, city, state, postal_code, sales_id, parent_organization_id,
  notes, created_at, updated_at
)
VALUES
  -- Sysco Chicago (Major Midwest hub)
  (40, 'Sysco Chicago', 'distributor', '22222222-2222-4222-8222-000000000001',
   '708-555-4001', 'chicago@sysco.com', 'https://sysco.com',
   '250 Wieboldt Drive', 'Des Plaines', 'IL', '60018', 2, 10,
   'Major Midwest distribution center. Serves Chicago metro and Northern Illinois.',
   NOW(), NOW()),

  -- Sysco Houston (Headquarters area)
  (41, 'Sysco Houston', 'distributor', '22222222-2222-4222-8222-000000000001',
   '281-555-4002', 'houston@sysco.com', 'https://sysco.com',
   '10710 Greens Crossing Blvd', 'Houston', 'TX', '77038', 2, 10,
   'Texas flagship operation near corporate HQ. Major Gulf Coast distribution.',
   NOW(), NOW()),

  -- Sysco Los Angeles (West Coast hub)
  (42, 'Sysco Los Angeles', 'distributor', '22222222-2222-4222-8222-000000000001',
   '323-555-4003', 'losangeles@sysco.com', 'https://sysco.com',
   '20701 Currier Road', 'Walnut', 'CA', '91789', 3, 10,
   'Major West Coast distribution center. Serves Southern California market.',
   NOW(), NOW()),

  -- Sysco Atlanta (Southeast hub)
  (43, 'Sysco Atlanta', 'distributor', '22222222-2222-4222-8222-000000000001',
   '770-555-4004', 'atlanta@sysco.com', 'https://sysco.com',
   '5900 Fulton Industrial Blvd', 'Atlanta', 'GA', '30336', 3, 10,
   'Southeast regional hub. Serves Georgia, Alabama, and surrounding states.',
   NOW(), NOW()),

  -- Sysco Denver (Mountain region)
  (44, 'Sysco Denver', 'distributor', '22222222-2222-4222-8222-000000000001',
   '303-555-4005', 'denver@sysco.com', 'https://sysco.com',
   '5801 E 58th Avenue', 'Commerce City', 'CO', '80022', 4, 10,
   'Mountain region distribution. Serves Colorado, Wyoming, and mountain states.',
   NOW(), NOW()),

  -- Sysco Boston (Northeast)
  (45, 'Sysco Boston', 'distributor', '22222222-2222-4222-8222-000000000001',
   '508-555-4006', 'boston@sysco.com', 'https://sysco.com',
   '99 Spring Street', 'Plympton', 'MA', '02367', 4, 10,
   'New England regional distribution center. Serves Massachusetts and Northeast.',
   NOW(), NOW());

-- Gordon Food Service Branches (Parent ID: 13)
-- GFS is family-owned with strong Midwest/Canada presence
INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, phone, email, website,
  address, city, state, postal_code, sales_id, parent_organization_id,
  notes, created_at, updated_at
)
VALUES
  -- GFS Detroit (Major Midwest market)
  (46, 'Gordon Food Service - Detroit', 'distributor', '22222222-2222-4222-8222-000000000001',
   '313-555-4601', 'detroit@gfs.com', 'https://gfs.com',
   '2555 Enterprise Drive', 'Brighton', 'MI', '48114', 3, 13,
   'Major Michigan distribution hub. Serves Detroit metro and Southeast Michigan.',
   NOW(), NOW()),

  -- GFS Minneapolis (Upper Midwest)
  (47, 'Gordon Food Service - Minneapolis', 'distributor', '22222222-2222-4222-8222-000000000001',
   '612-555-4602', 'minneapolis@gfs.com', 'https://gfs.com',
   '7700 68th Avenue N', 'Brooklyn Park', 'MN', '55428', 3, 13,
   'Upper Midwest regional center. Serves Minnesota, Wisconsin, and Dakotas.',
   NOW(), NOW()),

  -- GFS Columbus (Ohio Valley)
  (48, 'Gordon Food Service - Columbus', 'distributor', '22222222-2222-4222-8222-000000000001',
   '614-555-4603', 'columbus@gfs.com', 'https://gfs.com',
   '4700 Cemetery Road', 'Hilliard', 'OH', '43026', 4, 13,
   'Ohio Valley distribution center. Serves Ohio, Indiana, and Kentucky.',
   NOW(), NOW()),

  -- GFS Florida (Southeast expansion)
  (49, 'Gordon Food Service - Florida', 'distributor', '22222222-2222-4222-8222-000000000001',
   '407-555-4604', 'florida@gfs.com', 'https://gfs.com',
   '1500 Tradeport Drive', 'Jacksonville', 'FL', '32218', 5, 13,
   'Southeast regional hub. GFS expansion into Florida market.',
   NOW(), NOW()),

  -- GFS Texas (Southwest expansion)
  (50, 'Gordon Food Service - Texas', 'distributor', '22222222-2222-4222-8222-000000000001',
   '214-555-4605', 'texas@gfs.com', 'https://gfs.com',
   '4100 Diplomacy Row', 'Fort Worth', 'TX', '76155', 5, 13,
   'Texas regional distribution. GFS expansion into Southwest market.',
   NOW(), NOW()),

  -- GFS Pennsylvania (Mid-Atlantic)
  (51, 'Gordon Food Service - Pennsylvania', 'distributor', '22222222-2222-4222-8222-000000000001',
   '717-555-4606', 'pennsylvania@gfs.com', 'https://gfs.com',
   '600 Crossroads Drive', 'Lewisberry', 'PA', '17339', 6, 13,
   'Mid-Atlantic distribution center. Serves Pennsylvania, New Jersey, Delaware.',
   NOW(), NOW());

-- Update sequence to account for new organizations
SELECT setval(pg_get_serial_sequence('organizations', 'id'), 51, true);
