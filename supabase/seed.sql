-- ============================================================================
-- PRODUCTION SEED DATA - Generated from CSV files
-- ============================================================================
-- Generated: 2025-10-27T23:16:43.362Z
-- Organizations: 1809 (deduplicated)
-- Contacts: 2013
--
-- Source Files:
--   - data/csv-files/organizations_standardized.csv
--   - data/csv-files/cleaned/contacts_db_ready.csv
--
-- Generation Method:
--   - Name-based deduplication (case-insensitive)
--   - Sequential database IDs (line numbers used only during generation)
--   - Industry-standard JSONB format for email/phone arrays
--
-- Run with: npx supabase db reset (runs automatically)
-- Or manually: psql <connection> -f supabase/seed.sql
-- ============================================================================

-- ============================================================================
-- TEST USER (for local development)
-- ============================================================================
-- Login: admin@test.com / password123

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd3129876-b1fe-40eb-9980-64f5f73c64d6',
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at;

-- Note: Sales record is auto-created by database trigger when auth.users is inserted

-- ============================================================================
-- SEGMENTS (Industry/Market Segments)
-- ============================================================================
-- Required for organizations.segment_id foreign key constraint
-- These UUIDs are referenced in OrganizationCreate.tsx and test mocks

INSERT INTO segments (id, name, created_at, created_by) VALUES
  ('562062be-c15b-417f-b2a1-d4a643d69d52', 'Unknown', NOW(), NULL),
  ('7ff800ed-22b9-46b1-acd3-f4180fe9fe55', 'Health Care', NOW(), NULL),
  ('c596adaa-94b1-4145-b1fc-c54dffdcca1f', 'Restaurant', NOW(), NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  created_at = EXCLUDED.created_at;

-- ============================================================================
-- ORGANIZATIONS (1809 unique)
-- ============================================================================

INSERT INTO organizations (id, name, organization_type, priority, phone, linkedin_url, address, city, state, postal_code, notes) VALUES
  (1, '040 KITCHEN INC', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (2, '2d Restaurant', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (3, '7 K FARMS, INC.', 'distributor', 'D', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (4, 'U. S. FOODSERVICE--CINCINNATI', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (5, '7 Monks Taproom Grand Rapids', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (6, '8 hospitality group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Hubbard Inn, MASQ joy, district parlay joy, parlay, LINKIN PARK, HVAC, pub, LIQR taco pub Cardoza''s pub Caf Banda never have I ever'),
  (7, '86 FOOD SERVICE', 'unknown', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (8, '90 miles Cuban cafe', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (9, 'A & G FOODSERVICE', 'distributor', 'D', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (10, 'A Little Taste of Texas', 'customer', 'C', NULL, NULL, NULL, 'Glasgow', 'KY', NULL, 'email about samples cheese curds'),
  (11, 'A Plus Inc DBA: Noodles Etc', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (12, 'A&W', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (13, 'A.Fusion', 'customer', 'D', NULL, NULL, '4601 lincoln Highway', 'Matteson', 'IL', NULL, 'Garlic & Sriracha interest. End up purchasing original &jalapeo from PFG'),
  (14, 'Abbvie', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (15, 'Acaibowl.LLC', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (16, 'ACME STEAK & SEAFOOD', 'distributor', 'C', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (17, 'AJ''s Pizza', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (18, 'AKRON', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (19, 'AL BAWADI GRILL', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'FS call.samples dropped.advance to buyer Brian. Send email.'),
  (20, 'AL PEAKE & SONS INC.', 'distributor', 'C', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (21, 'Al Peake amd Sons', 'distributor', 'A', NULL, NULL, NULL, 'toledo', 'OH', NULL, 'Jack Gilbertson buyer- hispanic focus broadliner[wonderjuice and curds'),
  (22, 'Albanos Pasta', 'customer', 'B', NULL, NULL, NULL, 'Valparaiso', 'IN', NULL, ''),
  (23, 'Ale Emporium', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (24, 'Alice & Friends2', 'unknown', 'D', NULL, NULL, '2201 S. Michigan Ave., Chicago, IL 60616', 'Chicago', NULL, NULL, ''),
  (25, 'Alice & Friends-Ashland', 'unknown', 'D', NULL, NULL, '1723 N Halsted St, Chicago,', 'Chicago', NULL, NULL, ''),
  (26, 'ALINEA', 'customer', 'A', '+1 (312) 867-0110', NULL, '1723 N Halsted St, Chicago,', 'Chicago', 'IL', '60614', ''),
  (27, 'All Ways Catering', 'customer', 'D', '+1 (312) 363-2431', NULL, '110 Turner ave', 'Elk Grove Village', 'IL', NULL, ''),
  (28, 'Allen County Schools Food Service', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (29, 'AMARU', 'unknown', 'C', '(312) 955-0306', NULL, NULL, NULL, NULL, NULL, ''),
  (30, 'Amg', 'unknown', 'B', '(312) 337-6070', NULL, NULL, NULL, NULL, NULL, ''),
  (31, 'Anchored Consulting', 'unknown', 'D', '+1 (773) 327-4900', NULL, NULL, NULL, NULL, NULL, ''),
  (32, 'Andre''s Avery''s', 'unknown', 'C', '+1 (708) 205-5341', NULL, NULL, NULL, NULL, NULL, ''),
  (33, 'Anelya', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (34, 'Angie''s', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (35, 'Angie''s Sports Bar & Pizzeria', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (36, 'ANMAR FOODS', 'distributor', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (37, 'ANTHONY MARANO COMPANY', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (38, 'Apis Hotel', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (39, 'APOLLO FOODS', 'distributor', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (40, 'Apolonia', 'customer', 'B', '+1 (312) 363-2431', NULL, '2201 S. Michigan Ave., Chicago, IL 60616', 'Chicago', 'IL', '60616', ''),
  (41, 'aramark', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (42, 'Arami', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (43, 'Arch City Tavern', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (44, 'Arlington Tap House', 'customer', 'A', '+1 (224) 735-2450', NULL, '1204 W Rand Rd', 'Arlington Heights', 'IL', '60004', ''),
  (45, 'Aromatix Catering', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (46, 'Around The Clock', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (47, 'Arthur Treachers', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (48, 'ARTISAN SPECIALTY FOODS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (49, 'ARUNS THAI', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (50, 'Asador Bastian', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (51, 'Ashland University', 'customer', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, 'Nathan Schegerikmis NH Rep Nick Forester is GFS rep'),
  (52, 'Astor Club', 'customer', 'A', NULL, NULL, '24 E. Goethe St', 'Chicago', 'IL', '60610', 'Testa Kristen lead for VAF; Chef Trevor/Adam Butler'),
  (53, 'At the Office Bar& Grill', 'customer', 'C', NULL, NULL, '4901 cal sag rd', 'Crestwood', 'IL', '60445', 'Sue or Tim are the owner'),
  (54, 'Atelier', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (55, 'ATLANTIC FOOD DIST.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (56, 'Atlantic Food Distributors', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (57, 'ATLANTIC FOODS CORP.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (58, 'ATLAS WHOLESALE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (59, 'Au Cheval', 'customer', 'A', NULL, NULL, '800 W Randolph St', 'Chicago', 'IL', NULL, ''),
  (60, 'Austin''s Wood Fire Grille', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (61, 'AVANTI FOODS', 'distributor', 'A', NULL, NULL, NULL, 'WALNUT', 'IL', NULL, ''),
  (62, 'AVEC', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (63, 'Avgo (Theo''s RG)', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (64, 'Avli', 'customer', 'C', NULL, NULL, NULL, 'Chicago''', NULL, NULL, 'Follow up on VAH and Frties'),
  (65, 'Avli Restaurants', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (66, 'Azul Marisol''s 7 Muelle', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (67, 'B & B PRODUCE', 'distributor', 'A', NULL, NULL, NULL, 'LOCKPORT', 'IL', NULL, ''),
  (68, 'B AND B FOODS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (69, 'B N B CREATIONS', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (70, 'B.E.S INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (71, 'Back Yard Burgers', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (72, 'BADGER MURPHY F.S.', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (73, 'Bailey''s bar and Grill', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (74, 'Baker Street', 'customer', 'A', NULL, NULL, NULL, 'Fort wayne', 'IN', NULL, ''),
  (75, 'Baldwin Wallace', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (76, 'Baldwin Wallace University', 'customer', 'A', NULL, NULL, NULL, 'cleveland', NULL, NULL, ''),
  (77, 'Ball State U', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (78, 'Ballyhoo Hospitality', 'customer', 'A', '312-577-4004', NULL, '908 North Halsted St.', 'Chicago', 'IL', '60642', 'Gemini, coda Del Velte, old Pueblo, Sophia, Pomeroy, pizza by Sal, Buck Russells, Danucci''s, Gemini, petite Pomeroy'),
  (79, 'Bally''s Casino and Hotel', 'unknown', 'C', '888 822-2559', NULL, '600 N. Wabash Ave.', 'Chicago', 'IL', '60611', 'They want to support diverse vendors. Sue to set up a meeting.'),
  (80, 'Bally''s Casino and Hotel TAP HOUSE RESTAURANT AND BAR', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'DOES NOT LIKT THE OVERBREADING OGF THE SYSCO IMPERIAL BRAND CHEESE CURD LOOKING TO SWITCH'),
  (81, 'Ballys Casino Cavanugh''s', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (82, 'Ballys Casino Evansville', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (83, 'Bangers and Lace', 'customer', 'A', NULL, NULL, '1670 W Division St', 'Chicago', 'IL', '60622', ''),
  (84, 'Banyan Ko', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (85, 'BAR MAR', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (86, 'Bare bones', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (87, 'Barefoot Republic Camp', 'customer', 'C', NULL, NULL, NULL, 'Fountain Run', 'KY', NULL, 'intro'),
  (88, 'Barleys Brewing Company Ale House #1', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (89, 'Barrio', 'customer', 'A', NULL, NULL, '65 W Kinzie St', 'Chicago', 'IL', '60654', 'Vegetarian/ Vegan options'),
  (90, 'Bastion', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (91, 'Bastista''s Pizza', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (92, 'BATTAGLIA DIST. CORP. INC', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (93, 'Batter & Berries', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (94, 'Bavarian Inn/cheese trap', 'customer', 'A', NULL, NULL, NULL, 'frankenmuth', 'MI', NULL, 'monica claimed cudtown customer. I cisited in Feb -left sample kit,/monica sent dill sample.'),
  (95, 'Bavette''s Bar and Steakhouse', 'customer', 'A', '+1 (312) 624-8154', NULL, '218 W Kinzie St', 'Chicago', 'IL', '60654', 'Actually advertises steak frites! A vegas spot too!'),
  (96, 'Baxter''s North America', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (97, 'BAZAAR', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (98, 'Bear and the Butcher', 'customer', 'A', '(312) 955-0306', NULL, '2721 N Halsted St', 'Chicago', 'IL', NULL, ''),
  (99, 'Beard and Belly', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (100, 'Beatnik on the River', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (101, 'BEAVER WHOLESALE MEATS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (102, 'beer exchange', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (103, 'Beggars Pizza', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (104, 'Bella''s Pizza', 'customer', 'C', NULL, NULL, NULL, 'Saugatuck', 'MI', NULL, 'erun rogers plant based leads gfs'),
  (105, 'Bellen Container Corp. dba Packaging By Design', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (106, 'benny dicartas', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (107, 'Best Intentions', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (108, 'Lucrezia', 'customer', 'A', NULL, NULL, NULL, 'chesterton', 'IN', NULL, 'VAF ANNASEA'),
  (109, 'INDUSTRIAL REVOLUTION', 'customer', 'A', NULL, NULL, NULL, 'VALPRAISO', 'IN', NULL, 'VAF ANNASEA'),
  (110, 'Beverly CC', 'prospect', 'A', NULL, NULL, NULL, 'Chicago', 'IL', '60652', 'GFS ROSEMONT F/U 87th street'),
  (111, 'Bian', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (112, 'BIBIBOP Asian grill', 'customer', 'A', NULL, NULL, NULL, 'Columbus', 'OH', NULL, 'Lead from bb. Brent and I will research'),
  (113, 'Big Boy', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (114, 'Big City Tap', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (115, 'Big Eds BBQ', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (116, 'Big Ed''s BBQ', 'customer', 'C', '8474735333', NULL, '651 Lakehurst Rd', 'Waukegan', 'IL', '60085', ''),
  (117, 'Big jones', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (118, 'Big Red Oven', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (119, 'Big Woods', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (120, 'BINK''S WINES & BEVERAGES', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (121, 'Bistro Coco', 'customer', 'C', NULL, NULL, '250n Warren St', 'Dayton', 'OH', '45402', 'Shipped Chef Zac a sample box of Annasea Tuna and salmon'),
  (122, 'windy cuty grill', 'customer', 'A', NULL, NULL, NULL, 'crown point', 'IN', NULL, 'steve Coppolillos -Rosebud-Windy City'),
  (123, 'Bizarre meat by Jose Andres', 'customer', 'A', NULL, NULL, '120 N. Wacker Drive, Chicago, Illinois', 'Chicago', 'IL', '60606', ''),
  (124, 'Bl Development Group', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (125, 'Blackwing Organic Meats', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (126, 'blondies', 'prospect', 'A', NULL, NULL, NULL, 'Flint', 'MI', NULL, 'meeting-awaiting assigned sales rep names'),
  (127, 'Bloom & Associates', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (128, 'Bloom plant based', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (129, 'Blue Chip Casino', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (130, 'Blue Oyster', 'customer', 'B', NULL, NULL, NULL, 'Valparaiso', 'IN', NULL, 'Chef Edddie'),
  (131, 'Blue Ridge Hotel partners', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (132, 'Bluebeard', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (133, 'Bluegrass Hospitality Group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (134, 'Bob Chinn''s  Crabhouse', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (135, 'Bob Chinn''s Crabhouse', 'customer', 'C', '(847) 520-3633', NULL, '393 S Milwaukee Ave', 'Wheeling', 'IL', '60090', ''),
  (136, 'Bobcat Bonnie', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (137, 'Bobcat Bonnie''s', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (138, 'Boelter', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (139, 'Boeufhaus', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (140, 'Boka', 'customer', 'A', '(312) 337-6070', NULL, '1729 N. Halsted Street', 'Chicago', 'IL', NULL, 'Please call on me ..several locations and catering. Tentori doesn''t work there. New lead: Tentori works at GT Prime Steakhouse.'),
  (141, 'Boka Restaurant Group/Momotaro', 'customer', 'A', NULL, NULL, '820 West Lake St.', 'Chicago', 'IL', NULL, 'Please call on me ..several locations and catering. Tentori doesn''t work there. New lead: Tentori works at GT Prime Steakhouse.'),
  (142, 'Bolingbrook golf club & banquet', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (143, 'Bon Appetit', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (144, 'BON Manger Catering and Events', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (145, 'Boodell & Domanskis, LLC', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (146, 'Boonies', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (147, 'BOSCO FOOD SERVICE, INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (148, 'BOWLING GREEN STATE', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (149, 'Brass elk', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (150, 'Brassica', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (151, 'BRGBELLY', 'customer', 'B', NULL, NULL, '5739 w. Irving park road', NULL, NULL, NULL, ''),
  (152, 'Briar Ridge', 'prospect', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (153, 'brick and brine', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (154, 'BRINDILLE', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (155, 'Brio Tuscan', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (156, 'Broken Barrel bar', 'customer', 'C', NULL, NULL, '2548 n southport ave', 'Chicago', 'IL', '60614', 'Took Frites Street Fries to the chef and loves the fries. Fries too espensive for them.'),
  (157, 'Bronzeville WINERY', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (158, 'Brooklyn and The Butcher', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Sister account to The Exchange.'),
  (159, 'BROWN FOOD SERVICE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (160, 'BuB Cafe', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (161, 'Bub City', 'customer', 'A', NULL, NULL, '43rd N. Clark Street', 'Chicago', 'IL', '60654', ''),
  (162, 'Bubba''s 33 (Texas roadhouse little sister)', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (163, 'Buckee', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (164, 'Bugsy''s', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (165, 'Bullpen', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Sampled curds; purchased Original.'),
  (166, 'Buragtory', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, '7 units; original'),
  (167, 'BurgerUp', 'customer', 'C', NULL, NULL, NULL, 'Cool Springs', 'TN', NULL, ''),
  (168, 'Butcher & The burger', 'customer', 'B', NULL, NULL, '1021 w. Armitage Ave', 'Chicago', 'IL', NULL, ''),
  (169, 'Butcher and the bear', 'customer', 'B', '+1 (708) 205-5341', NULL, NULL, NULL, NULL, NULL, ''),
  (170, 'Cafe 53', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (171, 'Cafe Olympic', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (172, 'Calling a Chef LLC', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (173, 'Calo Restaurant', 'prospect', 'A', NULL, NULL, NULL, 'Chicago', NULL, NULL, 'Presented CCF; Frank ( Chef) like Cafe Classic Pumpkin, Carmel Apple Crunch and Salted Chocolate CC.'),
  (174, 'Cameron Mitchell', 'customer', 'A', NULL, NULL, NULL, 'Columbus', 'OH', NULL, 'Drop off samples from Annasea, Kaufhold and Frites Street'),
  (175, 'Cameron Mitchell restaurant group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (176, 'Cant believe its not meat', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (177, 'Can''t Belive It;s Not Meat', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (178, 'CANTON HOTEL & RESTSUPCO.', 'customer', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (179, 'Caplinger', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (180, 'CARAMAGNO FOODS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (181, 'Caring', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (182, 'Carlisle', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (183, 'Carlos & Lupitas Restaurants', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (184, 'Carlos Pancake House', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (185, 'Carl''s jr', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (186, 'CARMELA FOODS DISTRIBUTIN', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (187, 'CARSONS RIBS', 'customer', 'A', NULL, NULL, '465 E Illinois St', 'Chicago', 'IL', '60611', ''),
  (188, 'Castle Hospitality', 'customer', 'A', NULL, NULL, '11 East Hubbard St.', 'Chicago', 'IL', NULL, ''),
  (189, 'CATANESE CLASSIC SEAFOODS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (190, 'CATCH 35', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (191, 'Catering Out The Box', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (192, 'CBK', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (193, 'Cellar Bar', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (194, 'Cellar door', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (195, 'Center Plate Development Co.', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (196, 'Central Kitchen + Bar', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (197, 'CENTRAL MARKET', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (198, 'Century', 'prospect', 'A', NULL, NULL, NULL, 'columbus', NULL, NULL, ''),
  (199, 'Chaney''s Dairy Farm', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (200, 'Chapel Street Cafe', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (201, 'Charlie Baggs Culinary Innovations', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (202, 'Charlies', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'REP will bring the kit to the chef on their next meeting.'),
  (203, 'Char? ''d Brourbon Kitchen +Bar', 'customer', 'C', NULL, NULL, NULL, 'louisville', 'KY', NULL, 'pass along a Kaufholds Sample kit Chef'),
  (204, 'Chasers', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'left wamples with bartender Lee; gave brief presentation'),
  (205, 'Cheer''s Food & Drink', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (206, 'cheers in chestertown', 'customer', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, 'GFS ROSEMONT F/U'),
  (207, 'Chef Dave Madison', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (208, 'Chef Jose Solis', 'customer', 'C', '(773) 289-4274', NULL, '2714 N Milwaukee Ave', 'Chicago', 'IL', '60647', 'Have visited wtice. They have bought TCFB.'),
  (209, 'CHEF SOURCE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (210, 'Chefs special cocktail', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (211, 'Chefs Warehouse', 'distributor', 'A', '331-213-3364', NULL, NULL, NULL, NULL, NULL, 'meeting set for 3/26'),
  (212, 'Chef''s Warehouse - Chicago', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (213, 'CHEFS'' WAREHOUSE MIDWEST,', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (214, 'chelsea retirement', 'prospect', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (215, 'Cherry Creek Golf Course', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (216, 'Chicago chophouse', 'customer', 'A', NULL, NULL, '60 W. Ontario Street, Chicago, Illinois', 'Chicago', 'IL', NULL, ''),
  (217, 'Sand Creek CC', 'prospect', 'A', NULL, NULL, NULL, 'Chesterton', 'IN', NULL, 'now Concert management Co. in FL'),
  (218, '219 Taproom', 'customer', 'B', NULL, NULL, NULL, 'Chesterton', 'IN', NULL, 'JOE OWNER-INSUFFICIENT DEMND FOR VAF'),
  (219, 'Chicago Club', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Emailed Steve Testa'),
  (220, 'Chicago Club Makers LLC', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (221, 'Chicago Cut', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (222, 'Chicago cut steakhouse', 'customer', 'B', NULL, NULL, '300 N. La Salle Dr', 'Chicago', 'IL', NULL, 'Dessert of the day, must ask server. skin on fries.'),
  (223, 'Chicago Diner', 'prospect', 'A', NULL, NULL, '2333 N Milwaukee Ave', 'Chicago', 'IL', '60647', 'Will visit with a vegan kit.'),
  (224, 'Chicago Q', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (225, 'Chicago Vegan Foods', 'prospect', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (226, 'Chicago winery', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (227, 'Chicken Salad Chick', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (228, 'Chilean balsam', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (229, 'Chocolate Shoppe Ice Cream Co', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (230, 'CHRIST PANOS EGV', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (231, 'CHRIST PANOS FOODS', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (232, 'Cira/Boca Group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (233, 'Citizen M', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (234, 'Clairebook CC', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (235, 'CLARK RESTAURANT SERVICE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (236, 'ClarkLindsey', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (237, 'Classic Cafe', 'customer', 'A', NULL, NULL, NULL, 'fort wayne', 'IN', NULL, 'presented RR sauces Tandoori amd Butter chicken on drums and in cubess; left Kurd kit;presented BB hot dogs and land lovers filet'),
  (238, 'Clean Eatz', 'prospect', 'C', NULL, NULL, '7776 B S Randall Rd', 'Algonquin', 'IL', NULL, ''),
  (239, 'CLEMS REFRIGERATED FOODS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (240, 'Club 18 at Mister B''s(Evansville and Owensboro', 'customer', 'A', '812-492-0075', NULL, NULL, NULL, NULL, NULL, 'Drop samples to GMs of all locations except BG and Owensboro.  Need to follow up with jared@misterbspizza.com'),
  (241, 'Club Hawthrone Crestwood', 'customer', 'B', '605-595-1636', NULL, '13148 rivercrest dr', 'Crestwood', 'IL', NULL, 'Met with Rebecca. Loves the Garlic & Jalapeo. Has cheese curds but might replace them bc of flavor(s). 11-12-24'),
  (242, 'Cocina Costera Tulum', 'unknown', 'D', NULL, NULL, '850 w Fulton Market', 'Chicago', 'IL', NULL, ''),
  (243, 'COCO PAZZO', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (244, 'Cod di Volpe', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (245, 'Colasanti''s / Milford Markets', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (246, 'Coles public house', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (247, 'Community Hospitality', 'customer', 'C', NULL, NULL, NULL, 'Nashville', NULL, NULL, ''),
  (248, 'Concept Development Group', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (249, 'Concordia College Dining Services', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (250, 'Continental Canteen - Sterling Heights, MI', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (251, 'Coopershawk', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (252, 'Copper Fox', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (253, 'Coppolillo''s', 'customer', 'A', NULL, NULL, NULL, 'crown point', 'IN', NULL, ''),
  (254, 'CORFU FOODS, INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (255, 'corleones', 'customer', 'A', NULL, NULL, NULL, 'Independence', 'OH', NULL, 'Lead from Delmonicos'),
  (256, 'CORNELL NYC', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (257, 'Cornerstone Restaurant Group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Urban Belly, The Table at Crate, Sol Toro, MJ23 Sports Bar Michael Jordan''s Steakhouse, Hi-Fi Chicken and Beer, Brassierie 1783'),
  (258, 'COSGROVE DISTRIBUTORS,INC', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (259, 'Cousin''s Pizza Pub', 'customer', 'C', '630-980-8181', NULL, '966 w lake st', 'Roselle', 'IL', NULL, ''),
  (260, 'Cracker Barrel', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (261, 'Craft & Crew Hospitality', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (262, 'Craft Burger', 'customer', 'C', NULL, NULL, NULL, 'Chicago', NULL, NULL, ''),
  (263, 'Craft''d', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (264, 'CREATION GARDENS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (265, 'Creekside Restaurant & Bar', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (266, 'Crescent Hill Craft House', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (267, 'CRG DINING', 'customer', 'A', NULL, NULL, NULL, 'Indianapolis', 'IN', NULL, ''),
  (268, 'CRISTINA FOODS', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (269, 'CRITCHFIELD MEATS WHSL.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (270, 'Crown Republic Gastropub', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (271, 'Crown restaurant group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (272, 'CRS One Source', 'distributor', 'A', NULL, NULL, NULL, 'Paducah', 'KY', NULL, 'Edgar is Director of Sales'),
  (273, 'Crumb Crusher', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (274, 'Crushed pizzeria', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (275, 'Crust Brewing', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (276, 'Culinary Misfits', 'customer', 'D', NULL, NULL, NULL, 'crown point', 'IN', NULL, 'Chef Erin'),
  (277, 'Cumin bowl', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (278, 'Curts Cafe', 'customer', 'C', '(847) 748-8086', NULL, '766 2nd St', 'Higland Park', 'IL', '60035', 'Two locations, Highland Park and Evanston'),
  (279, 'Cynergy Bakes', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (280, 'dabney and company', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (281, 'Daisies', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (282, 'Daisies poorboy and Tavern', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (283, 'DALMARES PRODUCE', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (284, 'Danny''s', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (285, 'Dar Baklava, LLC', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (286, 'D''Asti Deli', 'unknown', 'D', NULL, NULL, '1410 irving park rd', 'bensenville', 'IL', NULL, 'Left samples with Manager Meme; garlic prefered'),
  (287, 'Dave & Buster''s Rosemont', 'customer', 'A', '7739871128', NULL, '9870 Berwyn Ave. Des Plaines, Il', NULL, 'IL', NULL, ''),
  (288, 'Dave & Buster''s Schaumburg', 'customer', 'A', '8503450276', NULL, '601 N Martingales Rd Schaumburg, IL', NULL, 'IL', NULL, ''),
  (289, 'Dawg House', 'prospect', 'B', NULL, NULL, NULL, 'elyria', 'OH', NULL, 'W/w Atalntic Distributor Rep JOSH CHAMBERS'),
  (290, 'Dear Margaret', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (291, 'DEARLY BELOVED', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (292, 'DELCO FOODS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (293, 'Delmonico', 'customer', 'A', NULL, NULL, NULL, 'Independence', 'OH', NULL, ''),
  (294, 'Delwood', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (295, 'Demera', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (296, 'DENIRO CHEESE CO.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (297, 'DePaul University', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (298, 'DeRosa Corporation', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (299, 'Diageo Beer Company', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (300, 'DILGARD FOODS COMPANY', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (301, 'DINEAMIC HOSPITALITY', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Bar La Rue, La Sierra Prime and Provisions, Lyra, Violi, Sienna Tavern, Bandit, Barrio, Blanks Bar, Builders Building, Dineamic Catering'),
  (302, 'Direct Food Service', 'distributor', 'A', '630-350-2171', NULL, '204 North Edgewood Dr.', 'Woodale', 'IL', '60191', 'Positive response of Annasea. Use as ingredient or as finished pupu'),
  (303, 'Direct Food Services', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (304, 'dirty franks', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (305, 'DISCOUNT PIZZA SUPPLY', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (306, 'District 6 Restaurant', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (307, 'DIXON FISHERIES, INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (308, 'DMK Burger Bar', 'customer', 'B', NULL, NULL, '1410 S. special Olympics Drive', NULL, NULL, NULL, ''),
  (309, 'Dog House', 'prospect', 'B', NULL, NULL, NULL, 'Brunswick', 'OH', NULL, 'W/w Atalntic Distributor Rep JOSH CHAMBERS'),
  (310, 'Dog n Suds Drive In', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (311, 'Donato''s', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (312, 'Dorthy Lane Market', 'prospect', 'C', NULL, NULL, NULL, 'Dayton', 'OH', NULL, 'talkd about poke they get bulk seafood and poke mix from NOH'),
  (313, 'DosBros', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (314, 'DOT', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (315, 'Dots Platform', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (316, 'DOUBLE B DISTRIBUTORS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (317, 'Dovetail', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (318, 'DP Dough', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (319, 'Drake', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Samples left. Champion is Brian. HQ call. Gfs supplied. Brent to pursue.'),
  (320, 'Drake Oakbrook', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (321, 'Drury Lane', 'customer', 'A', NULL, NULL, '100 Drury Lane Oakbrook Terrace, IL', NULL, NULL, NULL, 'Emailed on Proper Stock CATMAN identification-on 8/19 identified Catman who is Lauren Vanryn. Our timing is excellent as this category is up for review in a month or so and they will likely request samples and a presentation.'),
  (322, 'Drury Lane Theatre, banquet hall', 'customer', 'C', NULL, NULL, 'Countryside', NULL, NULL, NULL, ''),
  (323, 'DTM Distributors', 'distributor', 'A', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, 'email Virginia to see if we can show samples'),
  (324, 'DUANE S. RAHE INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (325, 'Dublin Hall Irish', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (326, 'Ducky''s', 'customer', 'C', NULL, NULL, NULL, 'Fort Wayne', 'IN', NULL, ''),
  (327, 'Dukes Alehouse', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'They use our SWAP chicken.'),
  (328, 'Dusty', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (329, 'DUTCH VALLEY SCHLABACH', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (330, 'E & S SALES, LLC', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (331, 'E.T.C.', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (332, 'Earl G. Dumplins', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (333, 'East Bank Club', 'customer', 'A', NULL, NULL, '500 N Kingsbury St', 'Chicago', 'IL', '60654', '1/31/25 Tessa is no longer the rep here, she has been promoted to a corporate role. Will try to find the new rep.'),
  (334, 'East End tap', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (335, 'Eating To Live LLC', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (336, 'El Ideas', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (337, 'El Salto', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (338, 'ELEGANTE CUISINE', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (339, 'Eleven City', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (340, 'Elohi Strategic Advisors', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (341, 'Elsie', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (342, 'Empire Burger', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (343, 'Entourage', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (344, 'ENzo''s Bar', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (345, 'Epic', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (346, 'ERB MEAT COMPANY', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (347, 'ERNST HOTEL SUPPLY CO', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (348, 'Esme', 'customer', 'B', NULL, NULL, '2200 N Clark St Suite B', 'Chicago', 'IL', NULL, ''),
  (349, 'Especially', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (350, 'Essential Kitchen & Essential Kitchen Cafe', 'prospect', 'C', NULL, NULL, '1405 Hunt Club Rd', 'Gurnee', 'IL', NULL, ''),
  (351, 'e-tailer, inc', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (352, 'ETC', 'customer', 'B', NULL, NULL, '404 S Wells St', 'Chicago', 'IL', NULL, 'Opens Dec. 5th'),
  (353, 'Euclid', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (354, 'Eurest', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (355, 'Eurest Dining', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (356, 'EURO USA', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (357, 'European Imports', 'prospect', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (358, 'EuroUSA', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (359, 'Even Odds', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (360, 'EVER', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (361, 'Evil Chech (brewery& Public house?)', 'customer', 'B', NULL, NULL, '3703 N  Main St', 'Mishawaka', 'IN', NULL, ''),
  (362, 'Factor75', 'prospect', 'A', NULL, NULL, NULL, 'Burr Ridge', 'IL', NULL, 'Chris is Manager at Burr Ridge location. Chris referred me to Director of Procurment, Kate HealyMeal prep chef Pete balodimas buyer Matt Horgan. Chef Kyle VerVynck'),
  (363, 'Fairmont Chicago', 'customer', 'A', NULL, NULL, '200 North Columbus Dr', 'Chicago', 'IL', '60601', 'Testa Kristen lead for VAF; Chef Elton'),
  (364, 'Falco''s Pizza', 'customer', 'C', '630-654-4644', NULL, '561 s fontage rd', 'Burr Ridge', 'IL', '60527', 'Gave a kaufhold''s sample kit to the manager and tried one of the flavors. Need to follow up'),
  (365, 'Family Express', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (366, 'FAMILY PRODUCE FOOD SERVI', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (367, 'Farmhouse Academy', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (368, 'Fat Angelo''s of Bridgeport', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (369, 'FatKats Pizzaeria and Restaurant', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (370, 'Fatmans', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (371, 'Fazoli''s', 'customer', 'A', NULL, NULL, 'So many in Indiana', NULL, 'IN', NULL, ''),
  (372, 'Ferrara Candy Company', 'prospect', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (373, 'FERRIS COFFEE AND NUT CO', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (374, 'Fine Arts Bistro', 'customer', 'C', NULL, NULL, NULL, 'Glasgow', 'KY', NULL, 'emailed about samples interest'),
  (375, 'Fira', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (376, 'Fire Bar+Grill', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (377, 'FireKeepers Casino Hotel', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'Emailed on 8/19.Executive Chef Brandon Lester; sous chef Everett morris and buye Megan mead'),
  (378, 'Fireside Grille', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'GFS'),
  (379, 'Flik Hospitality', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (380, 'FOOD & PAPER SUPPLY CO', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (381, 'FOOD DISTRIBUTORS INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (382, 'Food Export - Midwest', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (383, 'Food Technology Magazine, Institute of Food Technologists', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (384, 'FoodMix', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (385, 'Foodservice Database Co', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (386, 'FOP Restaurant', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (387, 'Forage Public house', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (388, 'Forbidden root', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (389, 'Ford Center Arena Evsnsville', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (390, 'Ford Center Executive Chef', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (391, 'FORTUNE FISH', 'distributor', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (392, 'Fortune Fish & Gourmet', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (393, 'Foundry kitchen and bar', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (394, 'Four Pegs', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (395, 'Four Seasons Hotel Chicago', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (396, 'FOUR STAR FOODS', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (397, 'FOX SUPPLY', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (398, 'FOX VALLEY FARMS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (399, 'Franciscan Hospital', 'prospect', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (400, 'Frank and Mary''s Tavern', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (401, 'Franklin Room', 'customer', 'B', '+1 (312) 445-4686', NULL, '675 NFranklinst.', 'Chicago', 'IL', NULL, 'Delivered FS samples per Flip''a request'),
  (402, 'Freedom Brothers Pizzeria & Alehouse', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (403, 'Freelance', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (404, 'FreezPak', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (405, 'FRESH CREATIONS LLC', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (406, 'Frisch Big Boy', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (407, 'Froelichs', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'FS-bought Cottage'),
  (408, 'Front Street social', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (409, 'Frontera', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (410, 'Fuego Tacos', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (411, 'Fuel Nutrition', 'prospect', 'C', '270-799-7784', NULL, '3278 Nashville Rd', 'Bowling Green', 'KY', '42104', ''),
  (412, 'Fujiyama Steakhouse of Japan', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (413, 'FULTON TROIKA', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (414, 'Gabby Goat American Pub and Grill', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (415, 'Gaelic Park', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (416, 'Gage Hospitality Group', 'customer', 'A', '312-372-4001', NULL, '18 S. Michigan Avenue Ste 1100', 'Chicago', 'IL', NULL, 'ACANTO, Coda di volpe, dawson, The Gage'),
  (417, 'Gag''s Chicken', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (418, 'GALANT FOOD COMPANY', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (419, 'Galena Associates Inc.', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (420, 'Galit', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (421, 'Garda''s', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (422, 'Gather', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (423, 'GELARDI PRODUCE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (424, 'Gelsosomo''s Pizzeria', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (425, 'Gemato''s Wood Pit BBQ', 'customer', 'C', '708-361-4200', NULL, '6701 w 11th st', 'Worth', 'IL', NULL, 'Met Jose (owner) and dropped off samples. Wants table tents. 11-12-24'),
  (426, 'GEORGIA STATE', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (427, 'Gerolissimo', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (428, 'GET FRESH PRODUCE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (429, 'GFS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (430, 'GFS-D', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (431, 'GFS-m', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (432, 'GFS-q', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (433, 'Ghost Writer', 'customer', 'C', NULL, NULL, '49 1/2 S Main St', 'Johnstown', 'OH', '43031', 'Shipped Chef Bradley Baluch a Annasea sample pack'),
  (434, 'Gianni''s Cafe', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (435, 'Giant', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (436, 'Gibson''s Rosemont', 'customer', 'A', NULL, NULL, '5464 n river road, Rosemont, IL', NULL, NULL, NULL, '14 locations in four states Gibson''s bar and steakhouse Hugos, frog bar and Fish House, Lux bar, Cortino restaurant and wine bar Gibson''s Italia. The boathouse also manages RL restaurant the polo bar in New York on behalf of Ralph Lauren, RL restaurant, Chi socks, bar, and grill and Hugos, frog bar and chophouse in rivers Casino and sugarhouse casino.'),
  (437, 'gilt bar', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (438, 'Gino''s East', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (439, 'Gino''s Prime - Dyer', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (440, 'Giordano''s', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (441, 'Girl in the goat', 'customer', 'A', NULL, NULL, '809 W Randolph St, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (442, 'Girl in the goat1', 'customer', 'A', '(773) 360-8755', NULL, '1340 W Fulton St, Chicago, IL 60607', 'Chicago', 'IL', NULL, ''),
  (443, 'Girl in the goat2', 'customer', 'A', '(312) 492-6262', NULL, '2429 N Lincoln Ave, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (444, 'GLASS CITY FOOD SERVICE', 'distributor', 'A', NULL, NULL, NULL, 'Toledo', 'OH', NULL, ''),
  (445, 'Gnome Town', 'customer', 'A', NULL, NULL, NULL, 'Fort wayne', 'IN', NULL, ''),
  (446, 'Go Grocers', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (447, 'goblin and grocer', 'customer', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'GFS ROSEMONT F/U'),
  (448, 'Godess and Grocer', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (449, 'Gold Star', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (450, 'Golden Boy BBQ', 'customer', 'A', NULL, NULL, '551 S York St', 'Elmhurst', 'IL', '60126', ''),
  (451, 'Golf VX', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (452, 'Good To Go Food', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (453, 'Goosefoot', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (454, 'Gordon Food Service', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Includes culinary and sales key contacts as well as HQ team'),
  (455, 'GORDON FS/50TH STREET', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (456, 'GORDON FS/50TH STREET(FRO', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (457, 'GORDON FS/BRIGHTON', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (458, 'GORDON FS/CLAY AVE.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (459, 'GORDON FS/DOCK #7', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (460, 'GORDON FS/EPO', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (461, 'GORDON FS/EPO REFRIG/FROZ', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (462, 'GORDON FS/FED EX ONLY', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (463, 'GORDON FS/GREEN OAK DC', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (464, 'GORDON FS/SHEPHERDSVILLE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (465, 'GORDON FS/SPRINGFIELD', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, ''),
  (466, 'Goshen brewing', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (467, 'gottleib memorial', 'prospect', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'GFS ROSEMONT F/U'),
  (468, 'Gourmet Gorilla', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (469, 'Grand Valley State University', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (470, 'Great Harvest', 'customer', 'A', NULL, NULL, NULL, 'crown point', 'IN', NULL, 'gluten free opportunity. sent lead to Carol.Await their reply'),
  (471, 'Greco', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (472, 'Greco PA', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (473, 'Green Street Smoked Meats (Hogsalt)', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (474, 'Greenbush', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'FS sampled thru PFG-awaiting'),
  (475, 'Greenleaf Foods', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (476, 'greenntop tavern', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (477, 'Greenwood Associates', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (478, 'Greystone Tavern', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Chef wants gluten free cheese curds. Ours aren''t.'),
  (479, 'Grindstone taphouse', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (480, 'Guckenheimer', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (481, 'GUEST SUPPLY/CHICAGO SYSC', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (482, 'GVSU', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (483, 'Gyros and More', 'prospect', 'B', NULL, NULL, NULL, 'Lorain', 'OH', NULL, 'W/w Atalntic Distributor Rep JOSH CHAMBERS'),
  (484, 'Hacienda Calavera', 'customer', 'A', NULL, NULL, '5503 W Cermak Rd', 'Cicero', 'IL', '60804', ''),
  (485, 'Half acre', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (486, 'Halls Chophouse', 'customer', 'C', NULL, NULL, '1600 West End Ave #101', 'Nashville', 'TN', '37203', 'Shipped Chef Josh a box of Annasea tuna and salmon'),
  (487, 'Hammerheads', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (488, 'Harbor Shores', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'FS sampled. Like 3/8-GFS'),
  (489, 'Harold''s', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (490, 'Harrison Lake Country Club', 'customer', 'B', '3128280966', NULL, NULL, NULL, NULL, NULL, ''),
  (491, 'Harry Carey (8) Lombard Rosemont River north navy pier mag mile', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (492, 'Harvest Bar and Kitchen', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (493, 'harveys', 'prospect', 'A', NULL, NULL, NULL, 'saginaw', 'MI', NULL, 'meeting-awaiting assigned sales rep names'),
  (494, 'harveys on the mall', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (495, 'Hayah Treats', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'FS reviewed and sampled. GFS'),
  (496, 'Haymarket Brewery', 'customer', 'A', '312-374-3013', 'https://www.heislerhospitality.com', '2001 w. Grand Ave', 'Chicago', 'IL', '60612', ''),
  (497, 'Heisler Hospitality', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (498, 'Hello Fresh', 'prospect', 'A', NULL, NULL, NULL, 'Aurora', 'IL', NULL, 'Initial email to Kate Healy on 1/27'),
  (499, 'Heritage', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (500, 'Hermosa', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (501, 'high dive', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (502, 'High Horizon(KY Horse Park)', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (503, 'Hillcrest CC', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (504, 'HILLCREST FOODSERVICE', 'distributor', 'A', NULL, NULL, NULL, 'CLEVELAND', 'OH', NULL, ''),
  (505, 'Hilton Oakbrook', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (506, 'Hiraya Hospitality Collective', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (507, 'HIS hospitality', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (508, 'HK Banjum Glenview Inc', 'customer', 'A', NULL, 'https://www.hogsalt.com', NULL, NULL, NULL, NULL, 'Owns 20 restaurants in four cities with over 1000 employees Chicago location and headquartered, Armitage ale House Astor Hall are Chevelle the steakhouse Sachiko meal doughnut vault guilt bar green Street smoked meats high five Ramen, la Ren lobster bar monkey bar, Sada coffee small Cheval tivolimyavern SYSCO CONTRACT'),
  (509, 'Hog Wild', 'prospect', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (510, 'Hogsalt Hospitality Group', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (511, 'Holy Grale', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (512, 'Honey 1 BBQ', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (513, 'Honey Berry', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (514, 'Honey Jam Cafe', 'prospect', 'A', '(708)-354-4880', NULL, '181 Countryside Plaza,', 'Countryside', 'IL', '60525', 'As of 1/31/25 we are 7 locations with the Kaufhold''s cheese curds.'),
  (515, 'hook fish and chicken', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (516, 'Hookup LLC', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (517, 'hopcat', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (518, 'Hopleaf', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (519, 'Horseshoe Casino', 'customer', 'A', '773-687-8667', NULL, '10 West Hubbard St./3651 w. Fullerton', 'Chicago', 'IL', NULL, ''),
  (520, 'HOSPITALITY SERVICE GROUP', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (521, 'HR Clark General Store', 'prospect', 'C', NULL, NULL, '1001 A Dutch Creek Rd', 'Westmoreland', 'TN', NULL, 'Have bought 9 Cases of Dill Pickle Cheese Curds already thru Abdale looking to get the Thru DOT next'),
  (522, 'HT Hackney Indy', 'distributor', 'A', NULL, NULL, NULL, 'Indianapolis', 'IN', NULL, 'email to introduce MFB and lines we carry'),
  (523, 'HT Hackney GR', 'distributor', 'A', NULL, NULL, NULL, 'Grnd Rapids', 'MI', NULL, 'email to introduce MFB and lines we carry'),
  (524, 'HT Hackney(Paducah)', 'distributor', 'A', NULL, NULL, NULL, 'Paducah', 'KY', NULL, 'email to introduce MFB and lines we carry'),
  (525, 'Wild Egg', 'customer', 'A', NULL, NULL, NULL, 'louisville', 'KY', NULL, '20 stores'),
  (526, 'Hugo Fog bar', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (527, 'Hungry Howies', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Email chef and will drop off sample box of fries'),
  (528, 'Hurtbourne Country Club (Louisville)', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (529, 'Hyatt Lodge in Oakbrook', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (530, 'Hyatt Regency McCormick Place', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (531, 'Hyles-Anderson College', 'customer', 'A', NULL, NULL, '8400 Burr Street', 'Crown point', 'IN', '46307', ''),
  (532, 'I took', 'unknown', 'B', NULL, NULL, '180 N. Field Boulevard, Chicago, Illinois', 'Chicago', 'IL', NULL, ''),
  (533, 'ILLINI INST. FOODS, INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (534, 'Illinois State University', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (535, 'In the Game Hollywood Park', 'customer', 'A', NULL, NULL, '501 Cal Sag Road', 'Crestwood', 'IL', NULL, 'Desserts & Curds'),
  (536, 'Ina Mae', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'Chef David directs us thru Piazza and Harry Greene.'),
  (537, 'INDIANA CONCESSIONS SUPPL', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (538, 'Indianhead Food Distributor', 'customer', 'C', NULL, NULL, NULL, 'Eau Claire', 'WI', NULL, ''),
  (539, 'Indienne', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (540, 'Informa Markets/SupplySide/Food & Beverage Insider', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (541, 'Inner City Entertainment', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Sampling chips-Sysco Chgo'),
  (542, 'Innsbrook', 'prospect', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (543, 'Innsbrook CC', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (544, 'Inspiration Kitchens', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (545, 'Instantwhip Foods Inc.', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (546, 'INTERNATIONAL MEAT CO', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (547, 'IRBN', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (548, 'Italia Gardens', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (549, 'J. Alexander', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (550, 'J. Mark Enterprises, LLC', 'customer', 'B', NULL, NULL, '41 E. superior', 'Chicago', 'IL', NULL, ''),
  (551, 'Jake Melnicks Corner Tap', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (552, 'Jay Mark Group', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (553, 'JB Bailey Investments', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (554, 'Jesse Oaks', 'prospect', 'C', NULL, NULL, NULL, 'Gages Lake', 'IL', NULL, 'Lead came in from USF Rep Lori Taylor.'),
  (555, 'Jodi''s Italian Ice Factory', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (556, 'Joe Daniel', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (557, 'Joe Daniels', 'customer', 'C', '708-765-2155', NULL, '12218 s harlem ave', 'Palos Heights', 'IL', NULL, 'Met chef Angel and tried the samples. Likes the Garlic then jalapeno 11-12-24'),
  (558, 'JOE FRONTERA & SONS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (559, 'Joe seafood', 'customer', 'B', NULL, NULL, '60 E. grand Avenue Chicago, Illinois', 'Chicago', 'IL', NULL, ''),
  (560, 'Joe''s Seafood Prime Steak and Stone Crab', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (561, 'JOHNNIES BEEF', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (562, 'johnnys', 'customer', 'A', NULL, NULL, NULL, 'Independence', 'OH', NULL, 'Lead from Delmonicos'),
  (563, 'John''s food and wine', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (564, 'Josephine', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (565, 'Joy Yee', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (566, 'Joy Yee Noodle', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (567, 'Joys Pizza', 'prospect', 'B', NULL, NULL, NULL, 'Brunswick', 'OH', NULL, 'W/w Atalntic Distributor Rep JOSH CHAMBERS'),
  (568, 'Joyworldmburger', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (569, 'JP Graziano', 'prospect', 'A', NULL, NULL, '901 w randolph st', 'Chicago', 'IL', '60607', ''),
  (570, 'JQM WHOLESALE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (571, 'JTM Food Group', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (572, 'Juno', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (573, 'Just a dash catering', 'customer', 'A', NULL, NULL, '9722 parkway Drive', 'highland', 'IN', '46322', 'angel perry, tiana johnson, nicole ward'),
  (574, 'K. LEFKOFSKY', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (575, 'Kansas State University', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (576, 'Kasama', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (577, 'Kasia', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (578, 'Kathryns place', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (579, 'Kelber Caterin', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (580, 'Kelber Catering', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (581, 'Kelley''s Pub', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (582, 'Kelly''s pub', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (583, 'Kettering Health', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (584, 'Key Food Services Co.', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (585, 'KIMS UNCLE PIZZA', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (586, 'KING KOLD, INC.', 'distributor', 'A', NULL, NULL, NULL, 'ENGLEWOOD', 'OH', NULL, ''),
  (587, 'Kings Dining & Entertainment', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (588, 'Kings Fish & Chicken - Mattesson', 'customer', 'B', NULL, NULL, '400 N. Wells Street, Chicago, Illinois', 'Chicago', 'IL', NULL, ''),
  (589, 'Kings Pizza of Rosebud', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (590, 'Kinzie Chophouse', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (591, 'Kit Kat Lounge', 'prospect', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (592, 'KL Trading', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (593, 'Kraft Heinz Company', 'customer', 'A', '773-604-8769/312-666-9090', NULL, '2423 N. Milwaukee', 'Chicago', 'IL', NULL, 'Sent email to Nick asking for path to present'),
  (594, 'Kuma''s Korner', 'customer', 'A', NULL, NULL, '2900 w belmont ave', 'Chicago', 'IL', NULL, ''),
  (595, 'KUNA MEAT/E. PEORIA', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (596, 'Kwiktrip', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (597, 'La cafe', 'prospect', 'A', NULL, NULL, NULL, 'Flint', 'MI', NULL, 'meeting-awaiting assigned sales rep names'),
  (598, 'La Carreta', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (599, 'La Casa de Isaac & Moishe', 'customer', 'C', NULL, NULL, NULL, 'Highland Park', 'IL', NULL, 'Lead from Lauren Scatena.'),
  (600, 'La Catedral', 'prospect', 'C', NULL, NULL, '2500 S Christiana Ave', 'Chicago', 'IL', '60623', ''),
  (601, 'La Otra Radio Chicago', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (602, 'La Rabida Childerns Hospital', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (603, 'LaCoCo''s', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (604, 'Lady Gregory''s', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (605, 'Laine Too', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (606, 'LANNINGS FOODS', 'distributor', 'A', NULL, NULL, NULL, 'MOUNT VERNON', 'OH', NULL, ''),
  (607, 'Lardon', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (608, 'Lark Restaurant & Bar', 'customer', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (609, 'LaRosa', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (610, 'Lassen''s Tap', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (611, 'LCacao', 'customer', 'B', '+1 314-477-9085', NULL, NULL, NULL, NULL, NULL, ''),
  (612, 'LE BOUCHON', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (613, 'Le Colonial', 'customer', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (614, 'Leeds public', 'customer', 'A', '(773) 825-2400', NULL, NULL, NULL, NULL, NULL, 'SYSCO CONTRACT'),
  (615, 'Legacy Hospitality', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (616, 'Leonas Pizzeria', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (617, 'Lesaffre', 'prospect', 'A', '7738787340', 'jMatuszewski@lettuce.com', '5419 n Sheridan', 'Chicago', 'IL', '60647', ''),
  (618, 'Lesa''s Dairy Dip', 'prospect', 'C', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, 'emailed about samples interest'),
  (619, 'LeTOUR', 'customer', 'A', NULL, NULL, NULL, 'Evanston', NULL, NULL, ''),
  (620, 'Lettuce Entertain you', 'unknown', 'A', NULL, NULL, '417 N. Ashland Avenue', 'Chicago', 'IL', NULL, ''),
  (621, 'lfg', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (622, 'Lillie''s Q', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (623, 'Lipari', 'distributor', 'A', NULL, NULL, NULL, 'detroit', NULL, NULL, ''),
  (624, 'LLCC', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (625, 'Local West', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (626, 'Lockeepers', 'customer', 'A', NULL, NULL, NULL, 'Independence', 'OH', NULL, 'Lead from Delmonicos'),
  (627, 'Logan''s Roadhouse', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (628, 'Lola''s Tacos & Tequila', 'customer', 'C', '8478558741', NULL, '170 W Grand Ave #337', 'Gurnee', 'IL', '60031', ''),
  (629, 'Long John Silvers', 'customer', 'B', '773-276-7110', NULL, '2657 n kedzie ave, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (630, 'Longman &Eagle', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (631, 'LOST LARSON', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Has cheese curds on the menu already. Hoping to switch them to Kaufhold''s. .'),
  (632, 'Lost Never Found', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (633, 'Lot', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (634, 'Lou Malnati', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (635, 'Lowe''s O''Hare', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (636, 'Lowlands Group', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (637, 'Loyola Hospital', 'prospect', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (638, 'Lucchese Italian Restaurant', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (639, 'Lucellas', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (640, 'Lucky/s', 'customer', 'A', NULL, NULL, NULL, 'east Lamsing', 'MI', NULL, 'chain of 8 restaurantsts-fine steakhouse'),
  (641, 'LUDWIG FISH AND PRODUCE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (642, 'LULA CAFE', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (643, 'Macroman Meals', 'prospect', 'C', '502-289-6464', NULL, '1812 W Muhammad Ali Blvd', 'Louisville', 'KY', '40203', ''),
  (644, 'Madame Zusus', 'prospect', 'D', '(847) 926-7359', NULL, '1876 1st St', 'Highland Park', 'IL', '60035', ''),
  (645, 'Madison Pub', 'customer', 'B', '+1 (630) 455-5520', NULL, '7611 S. Madison St., Burr Ridge, IL', NULL, NULL, NULL, ''),
  (646, 'Madison Pub & Grill', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (647, 'Madison''s pub and grill', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (648, 'Madison''s Restaurant', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (649, 'Main Street Cafe', 'unknown', 'B', '(312) 988-0687', NULL, '731 W Lake St, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (650, 'Maki Sushi and Teriyaki', 'prospect', 'C', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (651, 'Mako', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (652, 'mali', 'customer', 'A', NULL, NULL, NULL, 'Saugatuck', 'MI', NULL, 'erun rogers plant based leads gfs'),
  (653, 'MALONEY CUNNINGHAM', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (654, 'Mama Delia', 'customer', 'B', '+1 (312) 944-8888', NULL, '8 w maple st, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (655, 'MANCUSO CHEESE COMPANY', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (656, 'Pavlou Restaurant Group', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (657, 'Pappas Restaurant Group', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (658, 'Maple and Ash', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (659, 'Maple lake assisted living', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (660, 'Maple Tree Inn', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (661, 'Maplewood', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (662, 'Marcus Hotels and Resorts', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (663, 'Mark Burkhalter', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (664, 'MARK VEND COMPANY', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (665, 'Mark''s Tavern', 'customer', 'B', NULL, NULL, '2121 s prairie ave, Chicago, IL', 'Chicago', 'IL', NULL, 'Sampled FS frites. Paneling 3/8'),
  (666, 'Marriott Marquis Chicago', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (667, 'Marshall''s Landing', 'customer', 'C', '(312) 610-8050', NULL, '222 W Merchandise Mart Plaza', 'Chicago', 'IL', '60654', 'Left samples of Frites Street with the GM Mario for Chef Lupe Gonzalez.'),
  (668, 'MARTIN PRODUCE, INC', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (669, 'Marz', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (670, 'MATAJER AL ARABIAH TRADING CO.', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (671, 'Matc College', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (672, 'Mather', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (673, 'Matrix Club Naperville', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (674, 'Matt and Tonys Columbus', 'customer', 'C', '614-914-8484', NULL, '340 E Gay St', 'Columbus', 'OH', '43215', 'Message  Chef Javier Alvarez on how to get him and his team samples'),
  (675, 'Max and Erma''s', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (676, 'Maxwell is trading', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (677, 'MAXWELLS TRADING', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (678, 'MB Restaurant Group LLC', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (679, 'MCCORMICK FOOD & BEVERAGE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (680, 'McNulty''s Bier Markt', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (681, 'MEATS BY LINZ, INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (682, 'Medinah CC', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (683, 'Meijer', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Will visit this week. Will bring fries.'),
  (684, 'MELCO DISTRIBUTING', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (685, 'MERCADITO', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (686, 'Mercado', 'customer', 'C', NULL, NULL, NULL, 'Fort Wayne', 'IN', NULL, ''),
  (687, 'mercy medical', 'prospect', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'GFS ROSEMONT F/U'),
  (688, 'MERKLEY & SONS PACKING CO', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (689, 'MERRY MILK MAID', 'distributor', 'A', NULL, NULL, NULL, 'URBANCREST', 'OH', NULL, ''),
  (690, 'Mesh Systems', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (691, 'Mesker Park Zoo', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Chef Amy; sysco, usf, gfs, greco; 2 other locations - City & Uptown...same owner; samplesd and Dill was a favorite'),
  (692, 'MESSIAH', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (693, 'Metro Grill & Bar', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (694, 'Mexo GR', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (695, 'Meyer''s Castle', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (696, 'MFB', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (697, 'MI TOCAYA', 'customer', 'A', NULL, NULL, '505 N. Michigan Avenue', 'Chicago', 'IL', '60601', ''),
  (698, 'Michael Jordans', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Dropped off a kaufholds kit with the chef, will try with owner.'),
  (699, 'MICHAEL''S FINER MEAT''S', 'distributor', 'A', NULL, NULL, NULL, 'COLUMBUS', 'OH', NULL, ''),
  (700, 'Michael''s Pizza', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (701, 'Michigan State University', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (702, 'MID TOWN DISTRIBUTORS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (703, 'Schulers', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (704, 'Midtown Athletic Club', 'prospect', 'A', '(773) 796-6523', NULL, '2444 N Elston Ave', 'Chicago', 'IL', '60647', 'Lizet Lopez was the rep here, we are unaware of who the rep is now. I would like to show them Frites Street, Verticle Acres and possibly some of our vegan brands.'),
  (705, 'Midway Restaurant Dev', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Met Joe Fitzgerald @ Franklin Room. Expressed alot of interest in kennebec high-end fry. Will follow up by email'),
  (706, 'Midwest Foods', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (707, 'Midwest Training & Ice Center', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (708, 'Milano''s Pizza,Subs and Taps', 'customer', 'C', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (709, 'millenium', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (710, 'Millenium Restaurant Group', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'Sent emil on TCFB Holiday Blitz'),
  (711, 'Milwaukee Area Technical College', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (712, 'Minneapolis Public Schools', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (713, 'Mino''s Italian', 'customer', 'A', NULL, NULL, NULL, 'Winnetka', NULL, NULL, ''),
  (714, 'Miss mamies seafood and steaks', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (715, 'Mister B''s Pizza and Wings Bowling Green KY', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (716, 'Mister B''s Pizza and Wings Murray KY', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (717, 'MiTocaya', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (718, 'MMD', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (719, 'Modern Interiors', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (720, 'MOFFETT FOOD SERVICE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (721, 'Monicals Pizza', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (722, 'MONTEVERDE', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (723, 'Moody Bible Institute', 'customer', 'A', '800) 356-6639', NULL, '820 N La Salle Dr', 'Chicago', 'IL', '60610', 'They are GFS supplied and HPS contracted. Executive chef is Fabian.garcia@moody.edu.'),
  (724, 'Moody tongue', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (725, 'Motor City Soul Food Express', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (726, 'Mott st', 'unknown', 'B', NULL, NULL, '1401 N. Ashland Avenue', 'Chicago', 'IL', NULL, ''),
  (727, 'Mott Street', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (728, 'MSI FOODS, INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (729, 'Mugsy''s Hideout Murray', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (730, 'Munchies', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (731, 'Munro Pizzaria', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (732, 'Mush Foods', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (733, 'Muze', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (734, 'My Big Fat Shawarma', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (735, 'Naf Naf Grill', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (736, 'Nanobrew', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (737, 'National Restaurant Association', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (738, 'Nationwide Arena', 'customer', 'A', NULL, NULL, '200 W Nationwide Blvd', 'Columbus', 'OH', '43215', 'Shipped Chef Sean Barger a box of Annasea Ahi Tuna and Salmon'),
  (739, 'Native Foods', 'prospect', 'B', NULL, NULL, NULL, 'Chicago', 'IL', NULL, 'Dame - Owner; On Ja Lee, wife. Interest in PB cheesecake for VDay'),
  (740, 'NATURAL DIRECT', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (741, 'Naty''s Pizza', 'customer', 'C', NULL, NULL, '3849 w 26th st', 'Chicago', 'IL', NULL, ''),
  (742, 'Nehemiah''s', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (743, 'Nellies', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (744, 'New Beginnings Restaurant', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (745, 'Newport Cafe & Go Grocer', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (746, 'Next', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (747, 'Nick''s Pizza', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (748, 'Nicky''s Gyro''s', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Received free samples of curds for 30th anniversy. Follow up on samples of frites week of 2-17'),
  (749, 'NO Vacancy', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (750, 'Noble DQ', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (751, 'Noble Romans', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (752, 'Noco Provisions', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (753, 'North Point', 'prospect', 'C', NULL, NULL, NULL, 'Lake Zurich', 'IL', NULL, 'Lead came in from USF Rep Lori Taylor.'),
  (754, 'North pond', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (755, 'North Star (Brassica parent?)', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (756, 'NorthAmerican Concessions', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (757, 'Northern Hasserot', 'distributor', 'A', NULL, NULL, NULL, 'cleveland', NULL, NULL, ''),
  (758, 'Northern IL U', 'customer', 'A', '+1 (312) 500-6666', NULL, '509 N. wells Street Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (759, 'The Patio', 'customer', 'A', NULL, NULL, NULL, 'Chicago', NULL, NULL, '800k annual 3/8 Simplot 251019 buyer thru Greco'),
  (760, 'Northside Yacht Club', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (761, 'NORTHWESTERN', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (762, 'Noshville Delicatessen', 'unknown', 'C', NULL, NULL, NULL, 'Nashville', 'TN', NULL, ''),
  (763, 'Not Just Cookies', 'unknown', 'A', NULL, NULL, NULL, 'Chicago', 'IL', '60651', 'Wholesale Bakery at 1340 N Homan in Chicago. ordered Wicks'),
  (764, 'Notre Dame', 'customer', 'A', NULL, NULL, NULL, 'south bend', NULL, NULL, ''),
  (765, 'Nu Bistro', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (766, 'NU WAVE', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (767, 'OBC kitchens', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (768, 'Obi Cai Restaurant Group', 'customer', 'A', NULL, NULL, NULL, 'Fort wayne', 'IN', NULL, ''),
  (769, 'OCharley', 'customer', 'B', '+1 (773) 916-6421', NULL, '4419 W. Montrose Ave., Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (770, 'Ohio University', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (771, 'Old Irving brewing Company', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (772, 'Old National  Executive Chef', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (773, 'Old National Catering Operations Manager', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (774, 'Old National Concession and Bar Manager', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (775, 'Old National Director of F&B', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (776, 'Old National Events Plaza Evansville', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (777, 'old River tap and social', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (778, 'Olde Stone Country Club', 'prospect', 'C', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, 'intro'),
  (779, 'Olga''s Kitchens', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (780, 'Olivers Bar & Grill', 'prospect', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Sampling chips-Sysco Chgo'),
  (781, 'Oliver''s Bar& Grill', 'customer', 'C', NULL, NULL, '6150 w 159th st', 'Oak Forest', 'IL', '60452', 'George or Tim is the manager'),
  (782, 'Olympia Fields', 'prospect', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (783, 'Omakase Yume', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (784, 'O''MARA FOODS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (785, 'One Hope United', 'customer', 'B', '312-496-0012', NULL, '622 W. Randolph street UnitC-101', 'Chicago', 'IL', NULL, 'Avac  big star-dubs not Sysco luncheonette  Publican  quality meats  the publican  the violet hour'),
  (786, 'One of a Kind Hospitality', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (787, 'ONE OFF HOSPITALITY', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Cooking and topping with cheese to show product and leaving him Samples'),
  (788, 'ONLY FRIES FOOD TRUCK BG', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (789, 'Open Kitchens', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (790, 'Original Bagel & Bialy', 'customer', 'B', '3128775339', NULL, '661 W. Walnut Street, Chicago', 'Chicago', 'IL', NULL, ''),
  (791, 'ORIOLE', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (792, 'ORLANDO GRECO & SON IMPOR', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (793, 'Osteria lang he', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (794, 'P & L FOODSERVICE CO', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (795, 'Pancho Food Distibutors', 'distributor', 'A', NULL, NULL, NULL, 'Tinley Park', 'IL', NULL, 'Met with Ken Stieger 1/24'),
  (796, 'PANCHO FOOD PRODUCTS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (797, 'Panchos Taqueria & Catering', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (798, 'Papi''s Pizza', 'customer', 'C', NULL, NULL, NULL, 'Fort Wayne', 'IN', NULL, ''),
  (799, 'Pappas', 'customer', 'A', NULL, NULL, '2501 w. 16th street', 'Chicago', 'IL', NULL, 'The Hampton social Nisos prime bass mint Costa the Hampton social'),
  (800, 'Parker restaurant Group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, '+1 (312) 846-6158 1017 N Halsted St
Chicago, IL  60642
United States'),
  (801, 'Parker''s', 'customer', 'C', NULL, NULL, NULL, 'Downers Grove', NULL, NULL, ''),
  (802, 'Parkhurst Dining', 'prospect', 'A', NULL, NULL, NULL, 'Pittsburgh', 'PA', NULL, 'W/w sustainability and sourcing director for over 400 MW accounts served'),
  (803, 'Parlay Bar and Kitchen', 'customer', 'B', NULL, NULL, '1100 Dennison Ave', 'Columbus', 'OH', '43201', 'Shipped Director of Operations Joe Flynn(Peerless Managment Group) a Annasea sample Pack'),
  (804, 'Parts Town', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (805, 'Pat''s Pizza and Ristorante', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (806, 'Paulie Gees', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (807, 'Pavlou Group', 'customer', 'A', NULL, NULL, NULL, 'Valparaiso', 'IN', NULL, 'Chris Pavlou owns Radius, Maple and Bacon, TommyB''s, Sandwich City and two more CP locations. Ched Edward at Maple and Chef Louis at Radius'),
  (808, 'Ohio State', 'customer', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, 'Sent TCFB Holiday promo'),
  (809, 'Peaches'' Cafe/UofC', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (810, 'Pear Chef', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (811, 'PECK DISTRIBUTING', 'distributor', 'A', NULL, NULL, NULL, 'MAPLE HEIGHTS', 'OH', NULL, ''),
  (812, 'PENN STATE', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (813, 'Penn Station', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Buying USF Dill, low usage caused special order status'),
  (814, 'Pepino''s', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (815, 'PepsiCo', 'customer', 'C', '773-327-1512', NULL, '2207 n clybourn ave', 'Chicago', 'IL', NULL, ''),
  (816, 'Pequod''s Pizza', 'customer', 'A', '847-470-9161', NULL, '8520 fernald ave', 'Morton Grove', 'IL', NULL, ''),
  (817, 'PERF FS/BOWLING GREEN', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (818, 'PERF FS/CINCINNATI', 'distributor', 'A', NULL, NULL, NULL, 'CINCINNATI', 'OH', NULL, ''),
  (819, 'Pescadon', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (820, 'PFG', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (821, 'PFG Louisville', 'distributor', 'A', NULL, NULL, NULL, 'brea', 'OH', NULL, 'will buy Bb dogs from gfs and katie swindrl'),
  (822, 'PFG Reinhart BG House', 'distributor', 'A', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, ''),
  (823, 'PFG Somerset KY', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (824, 'PFG=Jordan Gottlieb', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (825, 'PFS/CHICAGO', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (826, 'PFS/CHICAGO E&S', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (827, 'PFS/ELLENBEE', 'distributor', 'A', NULL, NULL, NULL, 'FAIRFIELD', 'OH', NULL, ''),
  (828, 'PFS/OHIO, OH PIZZA PROD.', 'distributor', 'A', NULL, NULL, NULL, 'MONROE', 'OH', NULL, ''),
  (829, 'PFS/SOMERSET', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (830, 'Piazza', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Sent emil on TCFB Holiday Blitz'),
  (831, 'Picnic Digital Food Court', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (832, 'PICS PRODUCE INC.', 'distributor', 'A', NULL, NULL, NULL, 'CINCINNATI', 'OH', NULL, ''),
  (833, 'Pier 48 Indy, LLC', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (834, 'Pilot project', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (835, 'Pine Rest', 'prospect', 'A', NULL, NULL, NULL, 'Grand Rapids', 'MI', NULL, 'Sam Butler dropped BB and LL samples off 1/28'),
  (836, 'Pinewood Social', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (837, 'Gibsons', 'customer', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'RL, Hugo,Quartino, Lux Bar, Bazaar MLL, Bar Mar, Boathouse'),
  (838, 'Pinstripes', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (839, 'Pita Inn', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (840, 'Pizza Express', 'customer', 'C', NULL, NULL, '1224 Old Gallatin Rd', 'Scottsville', 'KY', '42164', 'Reba and Jim owners tried the Bakeable curds looking to get them thru DOT Foods'),
  (841, 'Pizza Friendly Pizza -- 16 On Center', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Sampled thrunPFG rep-twice the cost-15k #!annually/2) flip sends Brady connect with investor Mike Schatzman'),
  (842, 'Planeterians', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (843, 'Planks Tavern on the Water', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (844, 'Plantastic Indy', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (845, 'Planteneers', 'customer', 'B', '17735237437', NULL, '2119 s halsted st, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (846, 'Pleasant House Pub', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (847, 'Plymouth Place', 'unknown', 'C', NULL, NULL, '820 N La Salle Dr', NULL, NULL, NULL, ''),
  (848, 'POINTE DAIRY SERVICE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (849, 'POLLAK DIST CO INC', 'distributor', 'A', NULL, NULL, NULL, 'EUCLID', 'OH', NULL, ''),
  (850, 'Pompette', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (851, 'POOLE FOODS, INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (852, 'Porkys BBQ & Grill', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (853, 'Porky''s BBQ & Grill', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (854, 'Port Drive In', 'customer', 'B', NULL, NULL, '2501 w. 16th street', 'Chicago', 'IL', NULL, 'Likes product. Cutting. Craig will follow up. 8/19'),
  (855, 'Portillo''s', 'customer', 'B', NULL, NULL, '1000 W. Fulton market, Chicago, Illinois', 'Chicago', 'IL', NULL, ''),
  (856, 'Portillo''s Hot Dogs', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (857, 'Porto', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (858, 'Postboy', 'customer', 'A', NULL, NULL, '1509 Chapel Drive', 'Chicago', 'IL', NULL, ''),
  (859, 'Potbelly', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Spoke on FS. Will connect us will potential customers'),
  (860, 'PREMIER PRODUCE', 'distributor', 'A', NULL, NULL, NULL, 'CLEVELAND', 'OH', NULL, ''),
  (861, 'PREMIER PRODUCE/COLUMBUS', 'distributor', 'A', NULL, NULL, NULL, 'COLUMBUS', 'OH', NULL, ''),
  (862, 'US FOODS-Wixom', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'emailed Rick-phoned left vm.'),
  (863, 'US FOODS-Detroit', 'distributor', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (864, 'US FOODS-Cincinnatti', 'distributor', 'A', NULL, NULL, NULL, NULL, 'OH', NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (865, 'US FOODS-Nashville', 'distributor', 'A', NULL, NULL, NULL, NULL, 'TN', NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (866, 'US FOODS-Chicago Corp', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (867, 'US FOODS-Chicago Chicago', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (868, 'US FOODS-Chicago Bensenville', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (869, 'US FOODS-Chicago Aurora', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (870, 'US FOODS-Milwaukee', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (871, 'US FOODS-Baraboo', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (872, 'Prepared Foods Magazine', 'customer', 'B', '+1 (312) 726-7777', NULL, '222 n lasalle blvd, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (873, 'Prima', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (874, 'Prime and provisions', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (875, 'Prime Steak', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Dropped off sample kit with bartender of behalf of rep. Very busy when I visited.'),
  (876, 'Principal', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (877, 'Progress Bar', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (878, 'Prosperity Social Club', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (879, 'Provecho', 'customer', 'A', '312-404-0440', NULL, '332 East Illinois St.', 'Chicago', 'IL', '60611', ''),
  (880, 'Proximo', 'customer', 'A', NULL, NULL, NULL, 'Fort wayne', 'IN', NULL, ''),
  (881, 'Psquare Hospitality', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Ashley passes on VA'),
  (882, 'Public Bar', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (883, 'Pui Tak Center', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (884, 'Purdue', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (885, 'PURDUE UNIVERSITY NORTHWEST', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (886, 'Purple Carrot', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (887, 'Quartino Ristorante', 'prospect', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (888, 'Quest', 'prospect', 'A', '806) 773-8087', NULL, '2500 South Highland Avenue', 'Lombard', 'IL', '60148', 'Chef Juan Zuniga is no longer at Quest, he had been our previous MFB champion at Quest. I will now pursue Shelly Robinson, VP of procurement.'),
  (889, 'Quest (Wright State University)', 'customer', 'A', NULL, NULL, NULL, 'Dayton', 'OH', NULL, 'email Jason Roller to see what the next steps were to sampling some products'),
  (890, 'Quest Food Management Services', 'customer', 'A', '410) 764-0539', NULL, '400 Red Brook Blvd #120', 'Elk `grove', 'IL', '21117', 'As of 1/31/25 Sue and I found that Chef Juan Zuniga is no longer at Quest. This would mean our communication now has to go thru sheryll.'),
  (891, 'R.D.P. FOODSERVICE', 'distributor', 'A', NULL, NULL, NULL, 'HILLARD', 'OH', NULL, ''),
  (892, 'R.D.P. FOODSERVICE FROZEN', 'distributor', 'A', NULL, NULL, NULL, 'COLUMBUS', 'OH', NULL, ''),
  (893, 'Rail House Bar', 'prospect', 'C', NULL, NULL, NULL, 'Round Lake', 'IL', NULL, 'Lead came in from USF Rep Lori Taylor.'),
  (894, 'RAISU', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (895, 'Ralston''s', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (896, 'RATIONAL USA', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (897, 'Ravisloe', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (898, 'rawley inn', 'customer', 'A', NULL, NULL, NULL, 'Independence', 'OH', NULL, 'Lead from Delmonicos'),
  (899, 'Raydia', 'distributor', 'A', NULL, NULL, NULL, 'south bend', NULL, NULL, ''),
  (900, 'RDV Corp', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (901, 'Recess', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'Greg Youra USF rep positioning Waffle fry'),
  (902, 'Redamak', 'customer', 'A', '2698573501/6165507847', 'Kobrien@redwaterrestaurants.com', NULL, NULL, NULL, NULL, 'Wrote to KIM OBRIEN GM ; MET CHEF ANDREW,'),
  (903, 'redwater', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (904, 'Redwater restaurant GROUP', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (905, 'Renaissance Schaumburg', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (906, 'Republica', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (907, 'Rewards Network', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (908, 'RHF', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (909, 'RHODE ISLAND SCHOOL', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (910, 'RICHWAY', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (911, 'ridge cc', 'prospect', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'GFS ROSEMONT F/U'),
  (912, 'Ridge Country Club', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (913, 'Ridgemoore Country Club', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (914, 'RIGHTWAY FOOD SERVICE', 'distributor', 'A', NULL, NULL, NULL, 'LIMA', 'OH', NULL, ''),
  (915, 'RITCHIE''S FOOD DIST., INC', 'distributor', 'A', NULL, NULL, NULL, 'PIKETON', 'OH', NULL, ''),
  (916, 'River City Drafthouse', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Left Sample kit, I imformed Greco Jim, follow up next week'),
  (917, 'RIVER FINN LLC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (918, 'RJC', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (919, 'Robinson `ribs', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (920, 'Rob''s Meat', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (921, 'Roc City Bar and Grill', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (922, 'Rockmill Tavern', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (923, 'Rockmill Tavern/bandits', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (924, 'Rogers Park Restaurant', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (925, 'ROINS PRODUCE INC', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (926, 'Rolf and Daughters', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (927, 'Roman Village', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (928, 'Romeo pizza', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (929, 'Roots & Vine Produce And Cafe', 'unknown', 'B', NULL, NULL, '954 California Ave', 'Chicago', 'IL', NULL, ''),
  (930, 'Roots Pizza', 'customer', 'A', '(773) 645-4949', NULL, '1924 W Chicago Ave', 'Chicago', 'IL', '60622', 'Paul Spinale requested we bring his brands here. This will be a cold lead.'),
  (931, 'Rootstock Wine and `beer Bar', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (932, 'Rosati''s', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (933, 'Rose Mary', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'Left FS and VAF with Chef Brian; follow-up needed'),
  (934, 'Rosebud steakhouse (Munster, IN)', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (935, 'ROSELLI WHSL FOODS INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (936, 'Route 66', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (937, 'Rowley Inn', 'unknown', 'B', 'Chef John-585.356.8752', NULL, '71 E Wacker Dr', 'Chicago', 'IL', NULL, ''),
  (938, 'Royal Sonesta Downtown/River North', 'customer', 'A', NULL, NULL, '66 W. Kinsey Street, Chicago, Illinois', 'Chicago', 'IL', NULL, ''),
  (939, 'RPM STEAK', 'customer', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (940, 'Ruby Tuesday', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (941, 'Rumi Grill Inc', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (942, 'Rush Medical Center', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (943, 'Russ', 'customer', 'A', NULL, NULL, NULL, 'holland', 'MI', NULL, 'Connected with Gm amd GFs rep'),
  (944, 'Rusty Bucket', 'customer', 'A', '6146211105', NULL, '390 W Nationwide Blvd', 'Columbus', 'OH', '43215', 'Shipped Chef Anthony MacAdam of Cameron Mitchell (Rusty Bucket)'),
  (945, 'Rusty''s Lakeside Pub', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (946, 'Ruth Lake Country Club', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (947, 'Ryan''s Creekhouse', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (948, 'S2 City Grill & Daiquiri Bar', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (949, 'S2 Express Grill', 'customer', 'C', '630-530-4649', NULL, '701 w north ave', 'Villa Park', 'IL', NULL, ''),
  (950, 'Safari Land', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (951, 'Salt and Vinegar Lexington KY', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (952, 'salt of the earth', 'customer', 'A', NULL, NULL, NULL, 'Saugatuck', 'MI', NULL, 'erun rogers plant based leads gfs'),
  (953, 'SALT.', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (954, 'Salvatores', 'customer', 'A', NULL, NULL, NULL, 'Fort wayne', 'IN', NULL, '8nstore chain'),
  (955, 'SANTISI WHOLESALE FOOD CO', 'distributor', 'A', NULL, NULL, NULL, 'YOUNGSTOWN', 'OH', NULL, ''),
  (956, 'saugataco', 'customer', 'A', NULL, NULL, NULL, 'Saugatuck', 'MI', NULL, 'erun rogers plant based leads gfs'),
  (957, 'Saz''s Hospitality Group', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Follow-up w/Don 8/19'),
  (958, 'Schoops', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (959, 'Schwa', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Met with owner Patrick . Loved the garlic and dill. Wants a garlic curd burger.'),
  (960, 'Scratch Kitchen', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (961, 'SEAFOOD MERCHANTS LTD', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (962, 'SEASONS FOOD SERVICE', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (963, 'Senate', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (964, 'Seoul Bites', 'customer', 'B', '(312) 441-1920', NULL, '123 N Jefferson St, Chicago, IL 60661', 'Chicago', 'IL', NULL, ''),
  (965, 'Sepia', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (966, 'SFG', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (967, 'SFS DIST - SKOUFIS FOOD', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (968, 'shakespears', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (969, 'Shakou', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (970, 'Shallot''s Bistro', 'customer', 'C', NULL, NULL, NULL, 'Skokie', 'IL', NULL, 'Lead from Lauren Scatena.'),
  (971, 'Shamrocks (Patchen)', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (972, 'Shamrocks(Brannon Crodding)', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (973, 'SHANGHAI TERRACE', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (974, 'Shaw''s crabhouse', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (975, 'Shedd Aquarium', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (976, 'Sheraton Grand', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (977, 'SHERWOOD FOODS-CLEVELAND', 'distributor', 'A', NULL, NULL, NULL, 'MAPLE HEIGHTS', 'OH', NULL, ''),
  (978, 'SHERWOOD FOODS-DETROIT', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (979, 'Shoreline Brewery', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (980, 'shulers', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (981, 'SIDARI''S ITALIAN FOODS', 'distributor', 'A', NULL, NULL, NULL, 'CLEVELAND', 'OH', NULL, ''),
  (982, 'Side Door', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Will visit with cheese curds.'),
  (983, 'Side Lot Brewing', 'customer', 'B', '+1 (312) 595-1322', NULL, '51 w kinzie st, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (984, 'Siena Tavern', 'customer', 'B', '773-572-1622', NULL, '1312 S. Wabash Ave., Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (985, 'Signature bar and restaurant', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (986, 'Silver Harbor Brewery', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (987, 'Silver Spring House', 'customer', 'C', NULL, NULL, NULL, 'Cincinnati', 'OH', NULL, ''),
  (988, 'SIRNA & SONS', 'distributor', 'A', NULL, NULL, NULL, 'RAVENNA', 'OH', NULL, ''),
  (989, 'Ski Daddy''s', 'customer', 'C', '270-904-2995', NULL, '160 Rivern Pl Ave', 'Bowling Green', 'KY', '42101', ''),
  (990, 'Skoogs', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (991, 'SKY', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (992, 'SKY CLUB', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (993, 'Slyce', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (994, 'Slymans Deli', 'customer', 'A', NULL, NULL, NULL, 'Independence', 'OH', NULL, ''),
  (995, 'Smack Dab Chicago', 'customer', 'B', NULL, NULL, '192 E. Walton Street, Chicago, Illinois', 'Chicago', 'IL', NULL, ''),
  (996, 'Small Cheval', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (997, 'SMITH FAMILY FOODS', 'distributor', 'A', NULL, NULL, NULL, 'TIFFIN', 'OH', NULL, ''),
  (998, 'SMITHHISLER MEATS', 'distributor', 'A', NULL, NULL, NULL, 'MOUNT VERNON', 'OH', NULL, ''),
  (999, 'Smoke Daddy', 'customer', 'B', NULL, NULL, '3800 N. Pulaski Road', 'Chicago', 'IL', NULL, ''),
  (1000, 'Smoque', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, '3800 N. Pulaski
Chicago, IL 60641
773-545-7427'),
  (1001, 'Smyth', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1002, 'Sochi', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Presented garlic curds. They ordered on the spot'),
  (1003, 'Social 219', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'Cut and won vs Lamb Stealth fry; initially price and avialbility an Issue, now just price. Still working woth Martin and Carlota on this account.'),
  (1004, 'Sociale', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'Cut and won vs Lamb Stealth fry; initially price and avialbility an Issue, now just price. Still working woth Martin and Carlota on this account.'),
  (1005, 'Sociale1', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1006, 'SOFO FOODS OF OHIO', 'distributor', 'A', NULL, NULL, NULL, 'TOLEDO', 'OH', NULL, ''),
  (1007, 'Sofo Foods OH', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1008, 'SoJu BBQ', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1009, 'Sol de Mexico', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1010, 'Soul and smoke', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1011, 'Soul Veg City', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1012, 'Soul Vibez', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1013, 'Sould VIbez', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1014, 'Soupicurean', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1015, 'SOUTH CHICAGO FISH COMPAN', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (1016, 'SOUTH HOLLAND PAPER', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (1017, 'Spencers Coffee', 'customer', 'C', NULL, NULL, NULL, NULL, 'KY', NULL, 'WonderJuice'),
  (1018, 'SPICELAND INC', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1019, 'Spillway Bar and Grill', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1020, 'Spillway BG', 'prospect', 'C', '270-842-9397', NULL, '2195 River St', 'Bowling Green', 'KY', '42101', ''),
  (1021, 'Spirit Elephant', 'prospect', 'A', NULL, NULL, 'n Bay Rd', 'Wilmette', 'IL', NULL, 'Apart of a restaurant group with three other concepts.'),
  (1022, 'Spoke +Ivy', 'customer', 'C', NULL, NULL, NULL, 'Fort Wayne', 'IN', NULL, ''),
  (1023, 'Springhill Suites by Marriott Springfield Southwest', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1024, 'Square', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1025, 'Square Roots', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1026, 'Squire Ale House', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1027, 'Squire On The Square', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1028, 'St John''s Universtiy', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1029, 'ST LAWRENCE', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (1030, 'St. Joseph Brewery', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1031, 'St. Mary''s Hospital', 'prospect', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1032, 'Stables Steakhouse', 'customer', 'D', NULL, NULL, NULL, NULL, NULL, NULL, 'Emailed on Proper Stock CATMAN identification-on 8/19 identified Catman who is Lauren Vanryn. Our timing is excellent as this category is up for review in a month or so and they will likely request samples and a presentation.'),
  (1033, 'STACKED Pancake House', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, '3/8" & Cubed'),
  (1034, 'STAPLETON''S, INC.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1035, 'State Line Pizza', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1036, 'Station 21', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1037, 'steady eddie', 'prospect', 'A', NULL, NULL, NULL, 'Flint', 'MI', NULL, 'meeting-awaiting assigned sales rep names'),
  (1038, 'Steak and Shake', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1039, 'STEAK AND VINE', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1040, 'Steel Plow Burger Co', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1041, 'STOKER''S TENDEREX FARMS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (1042, 'studio grille', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1043, 'SUN VALLEY FOODS CO.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1044, 'Sunda New Asian', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Sous Chef recieved; need to follow up'),
  (1045, 'SUNY BUFFALO', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (1046, 'Superdawg Drive-In', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1047, 'SuperDawg.', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1048, 'Superior', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1049, 'SUPERIOR FOODS CO.', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1050, 'Superkhana', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1051, 'SUPREME LOBSTER AND SEAFO', 'distributor', 'A', NULL, NULL, NULL, 'Villa Park', 'IL', '60181', 'Mike Sakshaug is the Retail Store Manager 05/22/2025'),
  (1052, 'Surfs Up Franchising Corporation', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1053, 'Sweeney Girl Sweets', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1054, 'Sweet Berry Cafe', 'prospect', 'C', NULL, NULL, '720 N McLean Blvd', 'South Elgin', 'IL', NULL, ''),
  (1055, 'Syds Fine Foods', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1056, 'SYRACUSE', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (1057, 'Sysco', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1058, 'Sysco Chicago', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1059, 'Sysco GR', 'distributor', 'A', NULL, NULL, NULL, 'grand rapids', NULL, NULL, 'Sent emil on TCFB Holiday Blitz'),
  (1060, 'Sysco(BG/Nashville)', 'distributor', 'A', NULL, NULL, NULL, 'Nashville', 'TN', NULL, 'planning ride alongs with BG Sales rep Bo Ghee'),
  (1061, 'SYSCO/CENTRAL IL -VIRTUAL', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1062, 'SYSCO/CENTRAL ILLINOIS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1063, 'SYSCO/CHICAGO', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1064, 'SYSCO/CHICAGO - VIRTUAL', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1065, 'SYSCO/CINCINNATI', 'distributor', 'A', NULL, NULL, NULL, 'CINCINNATI', 'OH', NULL, ''),
  (1066, 'SYSCO/CLEVELAND', 'distributor', 'A', NULL, NULL, NULL, 'CLEVELAND', 'OH', NULL, ''),
  (1067, 'SYSCO/DETROIT', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1068, 'SYSCO/GRAND RAPIDS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1069, 'SYSCO/INDIANAPOLIS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (1070, 'SYSCO/LOUISVILLE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'KY', NULL, ''),
  (1071, 'Tabor Hills Healthcare Facility', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1072, 'Tavern on Main', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1073, 'Tavvas LLC', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1074, 'Teibel''s', 'customer', 'A', NULL, NULL, '2234 N. Western Avenue', 'Chicago', 'IL', NULL, ''),
  (1075, 'Test 12/2', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1076, 'Testa Produce', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1077, 'texas corner meats', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1078, 'Texas corner Specialty Meats', 'customer', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1079, 'Texas Corral Restaurants', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1080, 'The 30 Bird', 'prospect', 'C', NULL, NULL, NULL, NULL, 'KY', NULL, 'Plant based'),
  (1081, 'The Barge', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1082, 'The Blackwell Inn', 'customer', 'C', NULL, NULL, NULL, 'Columbus', 'OH', NULL, 'intro'),
  (1083, 'The BUTLER', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1084, 'The Caterist', 'customer', 'A', NULL, NULL, '3517 N. Spaulding Ave', 'Chicago', 'IL', '60618', 'Testa Kristen Lead for VAF; Contact - Rachel & Josh Owens'),
  (1085, 'The Cliff Dwellers', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1086, 'The Country of the North', 'prospect', 'C', NULL, NULL, '1 Club N Dr', 'Xenia', 'OH', '45385', 'Shipped Chef Chelsea Fisher box of Annasea tuna and salmon'),
  (1087, 'The Dearborn', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1088, 'The Draft House', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1089, 'The Duplex', 'customer', 'A', NULL, NULL, '3137 W Logan Blvd', 'Chicago', 'IL', '60647', 'Offers vegan/vegetarian options.'),
  (1090, 'The Emily Hotel Chicago', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1091, 'The Entrance Restaurant', 'prospect', 'C', NULL, NULL, '15101 Dixie Hwy', 'Harvey', 'IL', '60426', 'Javier is the Chef and Joe is the owner'),
  (1092, 'The Farmacy', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1093, 'The Food Institute', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1094, 'The Harvest Room', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1095, 'The Hoppy Gnome', 'customer', 'A', NULL, NULL, NULL, 'Fort wayne', 'IN', NULL, ''),
  (1096, 'the hub', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1097, 'The Lighthouse', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1098, 'The Ohio State University', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (1099, 'The Paperwork Chef', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1100, 'The paramount group', 'customer', 'A', '773-880-8044', 'https://theparamountgroupchicago.com', NULL, NULL, NULL, NULL, 'Eden, fuel good, cultivate, SYCSCO CONTRACT'),
  (1101, 'The Pizzeria', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1102, 'The Point Sports Bar', 'customer', 'C', NULL, NULL, '12713 cal sag rd', 'Crestwood', 'IL', '60445', 'Emily is the owner'),
  (1103, 'The Rackhouse Tavern', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1104, 'The Ramen District', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1105, 'The Rose Hotel', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1106, 'The Royal Group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1107, 'The Scrambled', 'unknown', 'B', NULL, NULL, '1448 N. wells', 'Chicago', 'IL', NULL, ''),
  (1108, 'The Second City', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1109, 'The Table at Crate', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1110, 'The Vault Downtown', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1111, 'The Vig', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Part of Vegacy Hoapitality Group'),
  (1112, 'The Wealshire', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1113, 'Third coasting', 'customer', 'A', '773-349-8899', 'https://www.thirdcoasthg.com', NULL, NULL, NULL, NULL, 'Treehouse, Chicago, Moses, Cantina, old Crow, smokehouse, tunnel, Chicago, La Luna'),
  (1114, 'Three Tarts Bakery and Cafe', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1115, 'Tiger Lily Cafe', 'customer', 'B', NULL, NULL, '1016 Church Street, Evanston Illinois', NULL, NULL, NULL, ''),
  (1116, 'Tiger Lily Caf (buys from GFS)', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1117, 'Tillys Tea Room', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1118, 'Timothy''s', 'customer', 'A', NULL, NULL, NULL, 'union', 'MI', NULL, 'Would like to try FS as LTO and Poke'),
  (1119, 'Tin Caps Milb Team Fort Wayne', 'prospect', 'C', NULL, NULL, NULL, 'Ft Wayne', 'IN', NULL, 'Drop off samples from Annasea, Kaufhold and Frites Street'),
  (1120, 'Toast & Jam', 'prospect', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1121, 'Toeless Joel''s', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1122, 'Tonys Tacos', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1123, 'Top Dog Pizza Pub', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1124, 'Top Shooters', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1125, 'Town Club', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1126, 'Towne & Oak', 'customer', 'A', NULL, NULL, NULL, 'Winnetka', NULL, NULL, ''),
  (1127, 'Townee Square Restaurant', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1128, 'Transitions', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1129, 'Trinis Tasty Pastries', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1130, 'trinity health', 'prospect', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1131, 'TROYER FOODS-NORTH', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (1132, 'Tujax tavern', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1133, 'Tulane University', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1134, 'Turano Baking Co.', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1135, 'U OF RICHMOND', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (1136, 'U. LYNCHBURG', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (1137, 'UChicago Dining', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1138, 'UHC', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1139, 'Umeteagroup Inc', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1140, 'Uncle Charlie''s Meats', 'distributor', 'A', '800-688-1967', NULL, '406 N Estill Ave', 'Richmond', 'KY', '40476', ''),
  (1141, 'Union Ale House', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1142, 'Union Club', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1143, 'Union sushi and bbq bar', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1144, 'University Club of Chicago', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1145, 'University of Alabama', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1146, 'University of Cincinnati', 'customer', 'C', NULL, NULL, NULL, 'Cinccinnati', 'OH', NULL, 'Met the GFS rep who has account'),
  (1147, 'University of Dayton', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (1148, 'University of Georgia', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1149, 'University of Illinois', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1150, 'UM', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1151, 'University of Michigan', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1152, 'University of Minnesota', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1153, 'University of Notre Dame', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1154, 'University of Wisconsin Madison', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1155, 'Upper crust', 'customer', 'A', '573-874-3033', NULL, '2011 corona road suite 203', 'Columbia', 'MO', '65203', 'Director of procurement -services fraternities and sororities and camps'),
  (1156, 'Upstairs Pub', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1157, 'urban transformation', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1158, 'US Foods-Fishers', 'distributor', 'A', NULL, NULL, NULL, 'Fishers', 'IN', NULL, '2 emails unanswered. Will phone week pf 6-16'),
  (1159, 'US Foods-Indy', 'distributor', 'A', NULL, NULL, NULL, 'Fishers', 'IN', NULL, '2 emails unanswered. Will phone week pf 6-16'),
  (1160, 'US Foods-Bensenville', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (1161, 'US Foods', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (1162, 'US Foods Direct', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (1163, 'USF', 'distributor', 'A', NULL, NULL, NULL, '45691', NULL, NULL, 'Emailed announcing TCFB Holiday and McCrum representation'),
  (1164, 'UW-Madison', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1165, 'UW-Stout Dinning Service', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1166, 'Valhalla', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1167, 'VALLEY WHOLESALE FOODS', 'distributor', 'A', NULL, NULL, NULL, 'PORTSMOUTH', 'OH', NULL, ''),
  (1168, 'Valparaiso University', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1169, 'VAN EERDEN', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1170, 'VAN EERDEN DROP SHIP/E&S', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1171, 'VAN TREESE & ASSOCIATES', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (1172, 'Vanderbilt University', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1173, 'Vaughan hospitality', 'customer', 'A', '(312) 867-7717', 'https://vaughanhospitality.com', '2744 West Roscoe St.', 'Chicago', 'IL', NULL, 'No longer Sysco'),
  (1174, 'Vegan Bar', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1175, 'Vegan Street', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1176, 'VegNews and VeganStreet.com', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1177, 'Versailles Food Mart', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1178, 'Vette City Catering(BG Hot Rods Milb)', 'customer', 'C', NULL, NULL, NULL, 'Bowlingn Green', 'KY', NULL, 'emailed about samples interest'),
  (1179, 'Villa Ballanca', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1180, 'Village of Wheeling', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1181, 'Village Squire', 'unknown', 'B', NULL, NULL, '323 E. Wacker Drive, Chicago, Illinois', 'Chicago', 'IL', NULL, ''),
  (1182, 'Vinegar Solutions', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1183, 'VIRGINIA TECH', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NACUFS SHOWCASE EAST AND SOUTH USA'),
  (1184, 'VIRTUE', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1185, 'Vistro Vegan Fare', 'customer', 'C', NULL, NULL, NULL, NULL, 'KY', NULL, 'Drop of all plant based samples with owner Melinda (Landlovers, Swap,better balnce,never better) also wonder juice'),
  (1186, 'Vito''s Pizza', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1187, 'W.R. HACKET INC', 'distributor', 'A', NULL, NULL, NULL, 'SPRINGFIELD', 'OH', NULL, ''),
  (1188, 'WABASH FOODSERVICE', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (1189, 'WABASH FOODSERVICE/E&S', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (1190, 'WABASH SEAFOOD', 'distributor', 'A', NULL, NULL, NULL, 'CHICAGO', 'IL', NULL, ''),
  (1191, 'Gino''s Steakhouse', 'customer', 'A', NULL, NULL, NULL, 'merrillville', 'IA', NULL, 'Chef Mario and Jimmy Owner'),
  (1192, 'Walker Bros', 'prospect', 'A', NULL, NULL, '153 Green Bay Rd', 'winnetka', 'IL', NULL, ''),
  (1193, 'WALLACE FOODS', 'distributor', 'A', NULL, NULL, NULL, 'CANTON', 'OH', NULL, ''),
  (1194, 'WALTER & SONS INC.', 'distributor', 'A', NULL, NULL, NULL, 'WAPAKONETA', 'OH', NULL, ''),
  (1195, 'Warlord', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1196, 'Washington State University', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1197, 'Weather Mark Tavern', 'customer', 'C', NULL, NULL, '1503 s michigan ave', 'Chicago', 'IL', NULL, 'Gave a PFG kurd kit'),
  (1198, 'Weather Tech', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1199, 'West Suburban Community Pantry', 'unknown', 'B', NULL, NULL, NULL, 'South Bend', 'IN', NULL, 'cheryl Bauer emails to intro BB after LL acceptance'),
  (1200, 'western michigan', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1201, 'Western Michigan University', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gordon'),
  (1202, 'Westin Lombard', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1203, 'WGN', 'customer', 'B', '+1 (312) 733-9555', NULL, '837 w Fulton market, Chicago, IL', 'Chicago', 'IL', NULL, ''),
  (1204, 'What Chefs Want', 'distributor', 'A', NULL, NULL, '2055 Nelson Miller Parkway', 'Louisville', 'KY', '40223', ''),
  (1205, 'WHITE FEATHER FARMS OF OH', 'distributor', 'A', NULL, NULL, NULL, 'PATASKALA', 'OH', NULL, ''),
  (1206, 'White Rhino', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1207, 'Whole Foods', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1208, 'Wicks', 'principal', 'A', NULL, NULL, NULL, 'Saugatuck', 'MI', NULL, 'erun rogers plant based leads gfs'),
  (1209, 'Wild Goose', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1210, 'Wild Thing Restaurants', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1211, 'Willow Oaks Golf Club', 'prospect', 'C', NULL, NULL, NULL, 'Glasgow', 'KY', NULL, 'contacted about samples'),
  (1212, 'Wind Creek Casino', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1213, 'Windy City Media Group', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1214, 'Wings Etc.', 'customer', 'A', NULL, NULL, NULL, 'fort wayne', 'IN', NULL, 'presented RR sauces Tandoori amd Butter chicken on drums and in cubess; left Kurd kit;presented BB hot dogs and land lovers filet'),
  (1215, 'wl social house', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1216, 'WMU', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1217, 'WOW Pizzeria', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1218, 'Yancey''s Gastropub and Brewery', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1219, 'YARDBIRD GROUP', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1220, 'Yogi''s Bar', 'customer', 'A', NULL, NULL, NULL, 'Dublin', 'OH', NULL, 'Mike dropping off Curdtown samples Monday'),
  (1221, 'YOUNGSTOWN WLSE GROCERY', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1222, 'yourstruly', 'customer', 'A', NULL, NULL, NULL, 'Independence', 'OH', NULL, 'Lead from Delmonicos'),
  (1223, 'ZALACK''S FLINT PROVISIONS', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1224, 'Zels Great Roast Beef', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1225, 'Zels Great Roast Beef', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1226, 'Ziggys', 'customer', 'A', NULL, NULL, NULL, 'Amherst', 'OH', NULL, 'W/w Atalntic Distributor Rep JOSH CHAMBERS'),
  (1227, 'ZOGALO FOODS', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1228, 'Finish Line Sports Bar', 'prospect', 'C', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, 'samples Kaufholds'),
  (1229, 'Dougs Motor City', 'prospect', 'A', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, 'samples Kaufholds'),
  (1230, 'Novo Dolce', 'customer', 'A', NULL, NULL, NULL, 'Bowling Green', NULL, NULL, ''),
  (1231, 'Uncommon Ground', 'customer', 'B', NULL, NULL, NULL, 'Chicago', NULL, NULL, 'FS; all plant-based, local lines'),
  (1232, 'Perilla Steakhouse', 'customer', 'C', NULL, NULL, NULL, 'Chicago', 'IL', '60601', ''),
  (1233, 'Tamburrino''s Pizza', 'customer', 'C', NULL, NULL, NULL, 'Bowling green', 'KY', '42164', 'Tried the Kaufhold sample pack plus Ranch and Beer Battered'),
  (1234, 'Clover''s Bar & Grill', 'customer', 'C', NULL, NULL, NULL, 'Oak Forrest', NULL, NULL, 'TCFB lead. Contact is Dottie. Rep is Chris P.'),
  (1235, 'Olympic Star', 'customer', 'C', NULL, NULL, NULL, 'Tinley Park', NULL, NULL, 'TCFB lead. Contact is Eva Garvis. Chris P is rep'),
  (1236, 'Diamond Pancake House', 'customer', 'C', NULL, NULL, NULL, 'Oak Brook', NULL, NULL, 'TCFB lead. Contact is Jose Carillo. Rep is Chris P'),
  (1237, 'Ball Park', 'customer', 'C', NULL, NULL, NULL, 'Chicago', NULL, NULL, 'TCFB lead. Contact is Rich. Rep is Jim'),
  (1238, 'Brooklyn Pizza', 'customer', 'C', NULL, NULL, NULL, 'Chicago', NULL, NULL, 'TCFB lead. Contact is Tony. Rep is Jim'),
  (1239, 'Krave', 'customer', 'A', NULL, NULL, NULL, 'oak Lawn', NULL, NULL, 'TCFB lead. Contact is Moe. Rep is Jim.'),
  (1240, 'Triano''s', 'customer', 'C', NULL, NULL, NULL, 'Chicago', NULL, NULL, 'TCFB lead. Contact is Moe. Rep is Jim.'),
  (1241, 'Donatos Pizza', 'customer', 'A', NULL, NULL, NULL, 'Columbus', 'OH', NULL, 'Message Cynthia Ottavio Director of R&D'),
  (1242, 'Market Fresh Restaurant Group', 'customer', 'A', NULL, NULL, NULL, 'Mishawaka', 'IN', NULL, 'Chef Oscar at Evil Czech dropped Mcrim for Stanz'),
  (1243, 'Evil Czech', 'customer', 'A', NULL, NULL, NULL, 'Mishawaka', 'IN', NULL, 'Sierra Valdez Director of Ops for Group and Dustin Barret is GM of Evil'),
  (1244, 'Corndance', 'customer', 'A', NULL, NULL, NULL, 'Mishawaka', 'IN', NULL, 'Sierra Valdez Director of Ops for Group and Dustin Barret is GM of Evil'),
  (1245, 'Jesus Latin Grill', 'customer', 'A', NULL, NULL, NULL, 'Mishawaka', 'IN', NULL, 'Sierra Valdez Director of Ops for Group and Dustin Barret is GM of Evil'),
  (1246, 'Landon''s', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1247, 'Carnegie', 'customer', 'A', NULL, NULL, NULL, 'Mishawaka', 'IN', NULL, 'Sierra Valdez Director of Ops for Group and Dustin Barret is GM of Evil'),
  (1248, 'Bourbon and Butcher', 'customer', 'A', NULL, NULL, NULL, 'Mishawaka', 'IN', NULL, 'Sierra Valdez Director of Ops for Group and Dustin Barret is GM of Evil'),
  (1249, '3 Monkey''s', 'prospect', 'A', NULL, NULL, NULL, 'Crown Point', 'IN', NULL, 'Mike Hemiger'),
  (1250, 'CASCADE HILLS COUNTRY CLUB 18682E', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1251, 'GARLAND LODGE FOOD AND BEVERAGE', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1252, 'Treetops - Top Of Hill', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1253, 'Mise En Place Culinary Consulting', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1254, 'BROWN JUG', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1255, 'Mad Anthony - Taylor - 371788E', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1256, 'MONROE ST DINER', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1257, 'Double Down Desserts', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1258, 'Crowes Nest Caf', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1259, 'NEW HUDSON INN 371779E', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1260, 'Plant Based Coney''s', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1261, 'Troy Escape', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1262, 'THE PITA POST', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1263, 'CHURCHILL''S FOOD & SPIRITS', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1264, 'RED BARON (THE)', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1265, 'THE SAWMILL GOLF CLUB', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1266, 'SAGINAW CLUB', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1267, 'RIVERWALK GRILL', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1268, 'The Laundry', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1269, 'LOUHELEN BAHA''I SCHOOL', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1270, 'MATADOR''S PIZZA & TAKE OUT', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1271, 'BAY CLIFF HEALTH CAMP', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1272, 'MARIA HEALTH CARE CENTER', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1273, 'FLAT ROCK CARE CENTER', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1274, 'LINCOLN LAKE BAPTIST YOUTH CAMP', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1275, 'Bronson Behavioral Hospital', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1276, 'The Heartlands', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1277, 'HENRY FORD COLLEGE', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1278, 'Telluride Association', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1279, 'COMMUNITY PROGRAMS', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1280, 'Memorial Healthcare - Cafe', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1281, 'MICHIGAN STATE POLICE TRAINING DIVI', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1282, 'MICH MED- UNIV HOSPITAL-DOCK 5- 202', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1283, 'MDINING- TEST KITCHEN 689175', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1284, 'ST PETER LUTHERAN SCHOOL ACCOUNT', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1285, 'MASON COUNTY CENTRAL SCHOOLS', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1286, 'MICHINDOH CONFERENCE CENTER', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1287, 'WASHINGTON TWP SCHOOLS WAREHOUSE', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1288, 'Northville Public Schools', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1289, 'SPECTRUM JUVENILE JUSTICE SERVICES', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'GFS NOVI show leads'),
  (1290, 'Tara Mcmurty', 'prospect', 'C', NULL, NULL, NULL, 'Scottsville', 'KY', '42164', 'Going to Cater 400 people at a Barbra O''Neil Seminar'),
  (1291, 'Pizza Wholesale of Lexington', 'distributor', 'A', NULL, NULL, NULL, 'Paris', 'KY', '40361', 'going to contact about bakeable cheese curds'),
  (1292, 'The Swing Club', 'prospect', 'C', NULL, NULL, NULL, 'Scottsville', 'KY', NULL, 'Runs a Top Golf style driving range just opened'),
  (1293, 'Azzip Pizza', 'customer', 'C', NULL, NULL, NULL, 'Evansville', 'IN', NULL, '10 unit pizza place in IN and KY'),
  (1294, 'Powers Health', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, '4 unit hospital'),
  (1295, 'Rafeal''s Sports Bar', 'customer', 'C', NULL, NULL, NULL, 'Glasgow', 'KY', NULL, ''),
  (1296, 'Ralphie''s Fun Center', 'customer', 'C', NULL, NULL, NULL, 'Glasgow', 'KY', NULL, ''),
  (1297, 'Independence Village of Ames', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1298, 'ABBVIE AP30', 'prospect', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1299, 'ACARATH MONTESSORI', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1300, 'Ami-Gos Tacos', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1301, 'Angry Octopus', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1302, 'APOSTOLIC CHURCH OF GOD', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1303, 'ASSEMBLY AMERICAN BAR & CAFE (THE)', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1304, 'Beverly Country Club', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1305, 'Countrytime Kettle Korn McHenry', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1306, 'CREME OF THE CROP', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1307, 'DR JOHN WARNER HOSPITAL', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1308, 'EPIC BURGER-PEARSON ST', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1309, 'ESPERANZA SCHOOL', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1310, 'GAME ON BAR & GRILL', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1311, 'Hampshire Township Park District', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1312, 'KIRBY MEDICAL CENTER', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1313, 'KIRK''S BBQ', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1314, 'KNIGHTS OF COLUMBUS #1282', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1315, 'LA RABIDA CHILDRENS HOSPITAL', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1316, 'Louies Waffle House', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1317, 'MARY''S PLACE', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1318, 'NIVRAM BALMORAL NURSING', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1319, 'North Island Catering', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1320, 'PARAMOUNT THEATRE', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1321, 'PEACE MEAL CENTRAL OFFICE', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1322, 'POST 18 AMERICAN LEGION', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1323, 'Queen of Peace Retirement', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1324, 'RUSH U MED-GEN KITCHEN PO589563', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1325, 'Sassy Mac Boys', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1326, 'Storypoint Of Bolingbrook', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1327, 'The Ice Cream Shop', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1328, 'The Matrix Room', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1329, 'The Pointe at Morris', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1330, 'The Shores of Fairmont', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1331, 'THS-GOTTLIEB MEMORIAL DIETARY-H0182', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1332, 'U OF I- HOUSING FOOD STORES', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1333, 'Washington Grade School District 52', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1334, '10Forty Banquets & Catering', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1335, 'Area Career Center', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1336, 'GOBLIN AND THE GROCER', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1337, 'MERRILLVILLE REGIONAL MENTAL HEALTH', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1338, 'Notre Dame-110 South Dining Hall', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1339, 'State Park Little League', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1340, 'Taco Depot Crown Point', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1341, 'CLEMENTINE''S SALOON', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1342, 'Daydreamer Domes', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1343, 'Ludington Pub', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1344, 'WUSKOWHAN PLAYERS CLUB', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1345, 'AGING AND DISABILITY RESOURCE CENTE', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1346, 'BJ''S RESTAURANT', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1347, 'Faklandia Brewing', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1348, 'FORT ATKINSON FAMILY RESTAURANT', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1349, 'HSL West Allis Assisted', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1350, 'L G YOUTH CAMP-GATE 2', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1351, 'MACS', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1352, 'Moxie Coffee Caf Catering', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1353, 'Timber-Lee Ministries', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1354, 'Independence Village of Avon', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1355, 'Independence Village of Waukee', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1356, 'Jelka Leedle', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1357, 'JULIE WENDORF', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1358, 'Kelly', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1359, 'Kimberly Woods', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1360, 'King-Bruwaert House', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1361, 'Maija''s Families Foods', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1362, 'Paulies', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1363, 'the woods of Caledonia', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs rosemont 2025 lead'),
  (1364, 'West Carroll Middle School', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1365, 'The Big Dipper', 'prospect', 'C', NULL, NULL, NULL, 'Owensboro', 'KY', NULL, 'SherryAshby is the GM'),
  (1366, 'It''s J''s Good Grub', 'prospect', 'C', NULL, NULL, NULL, 'Owensboro', 'KY', NULL, 'Jay and Antoinette Johnson'),
  (1367, 'Michigan State Police Acadamy', 'prospect', 'A', NULL, NULL, NULL, 'Lansing', 'MI', NULL, 'Angella Jirovec'),
  (1368, 'Great Lakes CHR Homes', 'prospect', 'B', NULL, NULL, NULL, 'lansing', 'MI', NULL, 'Angella Jirovec'),
  (1369, 'Culver''s', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Chef Woody Bates key ally'),
  (1370, 'ANDERSON FOODS', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1371, 'Battle Alley Brewing Company', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1372, 'Belva', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1373, 'BENS SUPERCENTER', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1374, 'Bluebird', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1375, 'BOARDWALK (THE)', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1376, 'Boyne River Inn', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1377, 'BSA-COLE CANOE', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1378, 'C K O S - Catered Events', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1379, 'Cardinal Pizza', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1380, 'CDS - Miracle Camp and Retreat Cent', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1381, 'Chart Room', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1382, 'Chico''s Bar and Grill', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1383, 'COMM ACTION - HEAD START', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1384, 'COUNTRY VIEW BULK FOODS', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1385, 'Cut River Grille', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1386, 'Daybreak Cafe', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1387, 'DELTON MEMORIAL VFW #422', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1388, 'DETROIT PIZZA FACTORY', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1389, 'Dockside Torch Lake', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1390, 'DUCK LAKE COUNTRY CLUB 40461E', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1391, 'Eighteen87', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1392, 'EMBASSY BAR & GRILL', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1393, 'FEED BAG CAFE (THE)', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1394, 'GAYLORD BOWLING CENTER', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1395, 'GILLIES CONEY ISLAND/MT MORRIS', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1396, 'HACIENDA MEXICAN REST H-1', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1397, 'HAMLIN PUB - ROCHESTER HILLS', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1398, 'HENRY''S RESTAURANT- OTTAWA', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1399, 'HOG''S BACK FOOD CO-OP\ CAROLYN PERU', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1400, 'Jayell Smoke House', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1401, 'KEYS (THE)', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1402, 'MORRISON LAKE GOLF CLUB', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1403, 'Mrs. Cs Grilled Cheese', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1404, 'POTTERVILLE INN', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1405, 'PRINCIPLE BUSINESS ENTERPRISES', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1406, 'Put In Bay Resort', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1407, 'RIVER ROCK BAR & GRILL', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1408, 'RIVERFRONT GRILLE', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1409, 'ROYAL OAK AMERICAN LEGION', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1410, 'Shafer''s Smoked Meats', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1411, 'shawnee country club', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1412, 'SMALL BATCH AT THE CUPOLA ROOM', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1413, 'Smokin'' Pigs by Bigs', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1414, 'SUNRISE WAREHOUSE', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1415, 'The Cortland Northview', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1416, 'The Little Store', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1417, 'The Mayfield Tavern', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1418, 'The Pepper Mill', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1419, 'Towneplace Suites Ann Arbor', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1420, 'Trackside Eatery & Pub', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1421, 'TRAILS END PUB', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1422, 'Turnaround Bar And Grille', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1423, 'Village Place- Greek', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1424, 'Zachariah''s Chocolates', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1425, 'Zefs Lighthouse Tavern', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1426, 'SLOW''S TO GO 002', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1427, 'All Nite Mobile Cafe', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1428, 'BRIGHTMOOR CHRISTIAN CHURCH', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1429, 'CAMP BLODGETT', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1430, 'CAMP CO-BE-AC', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1431, 'Carmella''s Italian Ice', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1432, 'Sparrow Eaton', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1433, 'The New Tubbs Lake Resort', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Gfs novi show lead 4/25'),
  (1434, 'Merry Go Around', 'unknown', 'C', NULL, NULL, NULL, 'evansville', 'IN', NULL, 'left Kaufhold Sample pack'),
  (1435, 'Burger and Bowl', 'unknown', 'A', NULL, NULL, NULL, 'bowling green', 'KY', NULL, 'Talked with chef Alfredo with Sasha group'),
  (1436, 'Giovanni''s Pizza', 'customer', 'A', NULL, NULL, NULL, 'ashland', 'KY', NULL, '40 locations!'),
  (1437, 'The Drake - Oakbrook', 'customer', 'A', NULL, NULL, NULL, 'Oakbrook', 'IL', NULL, ''),
  (1438, 'Hyatt Lodge', 'customer', 'A', NULL, NULL, NULL, 'Oakbrook', 'IL', NULL, 'Chef loved the samples; follow-up when SPIFF begins'),
  (1439, 'Mariott Naperville', 'customer', 'A', NULL, NULL, NULL, 'Naperville', 'IL', NULL, 'Chef loved the samples; follow-up when SPIFF begins'),
  (1440, 'Allegory', 'customer', 'B', NULL, NULL, NULL, 'Naperville', 'IL', NULL, 'Chef likely to buy are 4 skus'),
  (1441, 'SixtyFour', 'customer', 'B', NULL, NULL, NULL, 'Naperville', 'IL', NULL, 'Loved the product'),
  (1442, 'TAR &Feather Concessions', 'prospect', 'C', NULL, NULL, NULL, 'Westmoreland', 'TN', NULL, 'sells bagels was looking for interest on plant base cream cheese'),
  (1443, 'White Hawk CC', 'prospect', 'A', NULL, NULL, NULL, 'Crown Point', 'IN', NULL, 'May be worth looking into. 100+ units. Sysco account. Churros on menu. Tenn based'),
  (1444, 'Hot Chicken Takeover', 'customer', 'A', 'OH', 'Columbus', NULL, 'Columbus', 'OH', NULL, '11 locations'),
  (1445, 'Charleys Steakery', 'customer', 'A', NULL, NULL, NULL, 'Columbus', 'OH', NULL, '600 locatios!'),
  (1446, 'The Peach Cobbler', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1447, 'I', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1448, 'Indian Hills Country Club', 'prospect', 'C', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, ''),
  (1449, 'Finish Line', 'prospect', 'C', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, ''),
  (1450, 'Bowling Green Country Club', 'prospect', 'C', NULL, NULL, NULL, 'Bowling Green', 'KY', NULL, ''),
  (1451, 'Southern Lanes Bowling and arcade', 'customer', 'C', NULL, NULL, NULL, 'Bowling in Bowling Greenb', 'KY', NULL, 'Kaufholds sample pack'),
  (1452, 'Wings Station BG', 'prospect', 'C', NULL, NULL, NULL, 'bowling Green', 'KY', NULL, 'talked to owner if it had calm down for grand opening enough to revisist curds'),
  (1453, 'Jacobs Pub', 'customer', 'C', NULL, NULL, NULL, 'Evansville', 'KY', NULL, 'has cheese curds on menu but are they the best Kaufholds'),
  (1454, 'Four Winds Casino', 'customer', 'A', NULL, NULL, NULL, 'South Bend', 'IN', NULL, ''),
  (1455, 'Stevens Point', 'customer', 'A', NULL, NULL, NULL, 'Stevens Point', 'WI', NULL, 'Sampled at NACUFS'),
  (1456, 'Wisconsin Union', 'customer', 'A', NULL, NULL, NULL, 'Madisom', 'WI', NULL, 'Sampled at NACUFS'),
  (1457, 'University of Minnestota - Duluth', 'customer', 'A', NULL, NULL, NULL, 'Duluth', 'MN', NULL, 'Sampled at NACUFS'),
  (1458, 'University of Missouri', 'customer', 'A', NULL, NULL, NULL, 'Columbia', 'MO', NULL, 'Sampled at NACUFS'),
  (1459, 'ACF Sound Bend', 'prospect', 'A', NULL, NULL, NULL, 'South Bend', 'IN', NULL, ''),
  (1460, 'Three Embers Restaurant @ Marriott Lincolnshire Resort', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1461, 'Hyatt Centric Rosemont', 'prospect', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1462, 'Foodstuff''s Evanston', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1463, 'Zelda''s Catering', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1464, 'Abigail''s', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1465, 'Summer House (Halsted Street Kitchen)', 'unknown', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, 'Testa VAF BLITZ Limcoln Park'),
  (1466, 'Kingling Cookout & Cocktails', 'unknown', 'A', NULL, NULL, NULL, 'Chicago', 'IL', NULL, 'Testa VAF BLITZ 202 Franklin St-Chicago'),
  (1467, 'Lago Lake Zurich', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1468, 'Ema Chicago', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1469, 'Prasino', 'unknown', 'A', NULL, NULL, NULL, 'la Grange', 'IL', NULL, 'Testa VAF BLITZ Lagrange rd La Grange'),
  (1470, 'Talbot Hotel', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1471, 'Bungalow', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1472, 'Hyatt Mag Mile', 'prospect', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1473, 'Atta Girl', 'unknown', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, 'Testa VAF BLITZ'),
  (1474, 'ACF Northwest Indiana', 'prospect', 'A', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (1475, 'ACF Chicago', 'prospect', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1476, 'Wing Snob', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, '80+ units. Focus is Tandoori Marination Base'),
  (1477, 'Barren Rivewr Lake Resort', 'customer', 'A', NULL, NULL, NULL, 'Lucas', 'KY', NULL, ''),
  (1478, 'Asparagus', 'customer', 'A', NULL, NULL, NULL, 'Merrillville', 'IN', NULL, 'Poke'),
  (1479, 'St Elmos', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1480, 'Aurelios', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1481, 'caplingers', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1482, 'Hilton Double Tree Aslip', 'customer', 'A', NULL, NULL, NULL, 'Alsip', NULL, NULL, 'Loves Poke. Uses Sysco & Wabash Seafood. Would buy from Abdale if stocked. Asked Carol to send a New Vendor Form'),
  (1483, 'Hartsfield', 'prospect', 'B', NULL, NULL, NULL, 'Munster', NULL, NULL, ''),
  (1484, 'Tomato Bar', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1485, 'O''Bryan''s Bar and Grill', 'prospect', 'C', NULL, NULL, NULL, 'Owensboro', 'KY', NULL, ''),
  (1486, 'PFG Fairfeild', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1487, 'US Foods Cleveland', 'distributor', 'A', NULL, NULL, NULL, 'Cleveland', 'OH', NULL, 'emailed Rick-phoned left vm.'),
  (1488, 'Dj''s Casual Cafe', 'customer', 'C', NULL, NULL, NULL, 'Wellman', 'IA', NULL, ''),
  (1489, 'Hotel Blackwood', 'prospect', 'C', NULL, NULL, NULL, 'Davenport', 'IA', NULL, ''),
  (1490, 'Main Street Meat Co.', 'customer', 'C', NULL, NULL, NULL, 'Davenport', 'IA', NULL, ''),
  (1491, 'Peanut Butter and Deli', 'customer', 'C', NULL, NULL, NULL, 'Morrison', 'IL', NULL, ''),
  (1492, 'Lubben Vineyards & Wines', 'customer', 'C', NULL, NULL, NULL, 'Anamosa', 'IA', NULL, ''),
  (1493, 'Petro Travel Center', 'prospect', 'C', NULL, NULL, NULL, 'Rochelle', 'IL', NULL, ''),
  (1494, 'Hotel Julien Debuque', 'prospect', 'C', NULL, NULL, NULL, 'Dubuque', 'IA', NULL, ''),
  (1495, 'Thristy Camel Supper Club', 'customer', 'C', NULL, NULL, NULL, 'Conesville', 'IA', NULL, ''),
  (1496, 'Hailstorm Brewing', 'customer', 'A', NULL, NULL, NULL, 'Tinley Park', 'IL', NULL, ''),
  (1497, 'Sip Self Serve Wine Bar', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1498, 'El Jefe', 'customer', 'C', NULL, NULL, NULL, 'Aurora', 'IL', '60014', ''),
  (1499, 'Bust Outs', 'customer', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (1500, 'Rabbits Bar', 'customer', 'C', NULL, NULL, NULL, 'Chicago', NULL, NULL, ''),
  (1501, 'Harry Caray''s Navy Pier', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1502, 'Pizzeria Portofino', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1503, 'Harry Caray''s', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1504, 'Fortune', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1505, 'Grecian Delight', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1506, 'Food and Paper', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1507, 'Badger', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1508, 'Kohls', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1509, 'Kuna', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1510, 'Battaglia', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1511, 'Badger Murphy', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1512, 'Chefs Kitchen', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1513, 'Fare Foods', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1514, 'S&L Produce', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1515, 'Supreme Lobster', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1516, 'Total Foods', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1517, 'RDP', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1518, 'PFG-all', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1519, 'Pancho', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1520, 'Wilkens', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1521, 'Testa', 'distributor', 'A', NULL, NULL, NULL, NULL, 'IL', NULL, ''),
  (1522, 'Get Fresh', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1523, 'All in IN/OH/KY/MI', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1524, 'GFS-all', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1525, 'Delco', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1526, 'Northern Haserot', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1527, 'Atlantic', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1528, 'PFG KY/TN', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1529, 'RAYDIA (B&B, Stanz, Troyers)', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1530, 'SUPERIOR Foods', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1531, 'Stapleton Foods', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1532, 'P+L food', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1533, 'Al Peake & Sons', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1534, 'Lannings Newark', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1535, 'PFG Cincinnati (formerly Reinhart)', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1536, 'Premier Produce 1', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1537, 'RDP Columbus', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1538, 'Ritchies Food Service', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1539, 'Sofo', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1540, 'TPC Food Service Tiffin', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1541, 'White Feather Farms', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1542, 'Dutch Creek Foods', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1543, 'Euclid Fish Company', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1544, 'Rightway', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1545, 'Thompson and Sons', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1546, 'USF Cincy', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1547, 'GFS Sprongfield', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1548, 'SYSCO Cincy', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1549, 'Butts Foods', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1550, 'Chefs Kitchen', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1551, 'Fare Foods Corp.', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1552, 'Kern Food Distributing, Inc.', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1553, 'Loffredo Fresh Produce', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1554, 'P&L Food Wholesalers, Inc.', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1555, 'Premier ProduceOne', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1556, 'S & L Produce, Inc.', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1557, 'Stapletons, Inc.', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1558, 'Thompson and Sons Bakery Supply', 'distributor', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1559, 'Total Foods Inc.', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'New Clearwater Belgian frites approved from Frotes Street'),
  (1560, 'HT Hackney', 'distributor', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1561, 'PFG-BG', 'customer', 'A', NULL, NULL, NULL, '800 E Ogden Ave, Westmont, IL 60559', 'IL', NULL, ''),
  (1562, 'Coppolillos', 'customer', 'A', NULL, NULL, NULL, 'Crown Point', 'IN', NULL, 'dale will pirsue for VAF, Frites ANNASEA'),
  (1563, 'PFG-Nashville', 'customer', 'C', NULL, NULL, NULL, '607 N Main St', 'IN', NULL, 'dropped off kaufholds sample box he was looking to upgrade from Anchor ones'),
  (1564, 'Timothy O''Tool', 'customer', 'C', NULL, NULL, NULL, 'Gurnee', 'IL', NULL, ''),
  (1565, 'Cajun Grill', 'prospect', 'C', NULL, NULL, NULL, 'Gurnee', 'IL', NULL, ''),
  (1566, 'Riverside Cafe', 'customer', 'C', NULL, NULL, NULL, 'Gurnee', 'IL', NULL, ''),
  (1567, 'Puff Shack BBQ', 'customer', 'C', NULL, NULL, NULL, 'St. Charles', 'IL', NULL, ''),
  (1568, 'El Puente', 'customer', 'C', NULL, NULL, NULL, 'st. Charles', NULL, NULL, ''),
  (1569, 'Marz Brewery', 'unknown', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (1570, 'Logan 11 Bar', 'customer', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (1571, 'Federales', 'customer', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (1572, 'Mano a Mano', 'customer', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (1573, 'University Center MSU', 'customer', 'A', NULL, NULL, NULL, 'Lansing', 'MI', NULL, ''),
  (1574, 'joes on jolly', 'customer', 'A', NULL, NULL, NULL, 'Lansing', 'MI', NULL, ''),
  (1575, 'S. Abraham and sons', 'distributor', 'A', NULL, NULL, NULL, 'Grand Rapids', 'MI', NULL, ''),
  (1576, 'Gun Lake Casino', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1577, 'HORROCKS', 'prospect', 'A', NULL, NULL, NULL, 'lansing', 'MI', NULL, ''),
  (1578, 'Bavarian Inn', 'customer', 'A', NULL, NULL, NULL, 'Frankenmuth', 'MI', NULL, ''),
  (1579, 'Bagger Daves', 'customer', 'A', NULL, NULL, NULL, 'grand Rapids', 'MI', NULL, ''),
  (1580, 'One North', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1581, 'Main Street Romeo', 'customer', 'B', NULL, NULL, NULL, 'romeo', 'MI', NULL, ''),
  (1582, 'Jayell BBq', 'prospect', 'B', NULL, NULL, NULL, 'romeo', 'MI', NULL, ''),
  (1583, 'GFS Saginaw', 'customer', 'A', NULL, NULL, NULL, 'saginaw', 'MI', NULL, ''),
  (1584, 'Crown Plaza Lansing', 'customer', 'A', NULL, NULL, NULL, 'Lansing', 'MI', NULL, ''),
  (1585, 'Shelby''s Trio', 'customer', 'A', NULL, NULL, NULL, 'Clarksville', 'TN', NULL, ''),
  (1586, 'Pbody''s', 'customer', 'A', NULL, NULL, NULL, 'Clarksville', 'TN', NULL, ''),
  (1587, 'Mr. Billy''s', 'customer', 'A', NULL, NULL, NULL, 'Clarksville', 'TN', NULL, ''),
  (1588, 'Clarksville''s 3rd Base', 'customer', 'A', NULL, NULL, NULL, 'Clarksville', 'TN', NULL, ''),
  (1589, 'Olga''s kitchen', 'unknown', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1590, 'Buddys Pizza', 'unknown', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1591, 'Baggers Dave', 'unknown', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1592, 'Fishbones Detroit', 'unknown', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1593, 'Zo''s Good Burger', 'unknown', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1594, 'Halo Burger', 'unknown', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1595, 'sweetwater tavern', 'unknown', 'C', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1596, 'leos coney island', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1597, 'big john steak and onion', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1598, 'jolly pumpkin', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1599, 'national coney island', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1600, 'bobcat bonnies', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1601, 'ram''s horn', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1602, 'the dirty shake', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1603, 'bobs big boy', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1604, 'nepantia cafe', 'unknown', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1605, 'atlas foods', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1606, 'g&l wholesale', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1607, 'arena food service', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1608, 'sysco detroit', 'distributor', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, ''),
  (1609, 'Shogun Bistro BG', 'customer', 'C', NULL, NULL, NULL, NULL, 'KY', NULL, 'Will meet owner Ronny with Sales Rep to show Cheesecake Holiday wheel for 6 locations'),
  (1610, 'The Army and Navy Club', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1611, 'The Park at Fourteenth', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1612, 'American Culinary Federation', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1613, 'American Frozen Food Institute', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1614, 'Biscottis', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1615, 'blackpearl hospitality', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1616, 'Driftwood Hospitality Management', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1617, 'Elior NA', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1618, 'Mena Catering', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1619, 'The Melting Pot', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1620, 'Troon - Esplanade Golf & Country Club', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1621, 'tryst lounge', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1622, 'Aramark Services, Inc', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1623, 'ARCO Design/Build', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1624, 'gekko kitchen commissary inc', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1625, 'Landings Club', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1626, 'RaceTrac', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1627, 'Tandoori Pizza & Wing Co.', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1628, 'Army MWR', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1629, 'Bagel Miller', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1630, 'Eddie Merlots', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1631, 'Exmoor Country Club', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1632, 'Fireplace Inns, Inc', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1633, 'Flavorista', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1634, 'R Whittingham Meat Corp', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1635, 'Ready Set Gourmet', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1636, 'Sakamoto Restaurant Inc', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1637, 'School District U-46', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1638, 'Scooby Drew''s (Soon to Be) World Famous Pickles', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1639, 'SNAIL CAVIAR', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1640, 'The Metropolitan Club', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1641, 'Compass Community Living', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1642, 'Purdue Northwest', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1643, 'Tea Plus Poke', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1644, 'Texas Roadhouse', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1645, 'North Coast Seafoods', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1646, 'Sysco Foods', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1647, 'La Chow', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1648, 'Saval Foodservice', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1649, 'Beyond Juicery & Eatery', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1650, 'Coldbreak', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1651, 'Crowne Plaza Lansing', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1652, 'K&K Catering', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1653, 'Morrison Living', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1654, 'Stark Provisions', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1655, 'The Corner Social', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1656, 'Ts Food LLC', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1657, 'Mocha Point Coffee Co.', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1658, 'Compass Group: Morrison Health', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1659, 'Levy Restaurants', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1660, 'los Tres Magueyes', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1661, 'UNC Rex Healthcare', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1662, 'NEARNG', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1663, 'Marriott Hanover', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1664, 'Fineline Settings', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1665, 'Lifeworks', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1666, 'Rochester Institute of Technology', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1667, 'Volcora', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1668, 'ARTISAN PIZZA CAFe', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1669, 'Audrey''s Avenue Kitchen & Bar', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1670, 'Boscoes', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1671, 'CuriosiTea Emporium LLC', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1672, 'Station Square', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1673, 'Taste the World in Cincy LLC', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1674, 'Hal Smith Restaurants', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1675, 'Coughlin''s Law', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1676, 'Fleet Landing', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1677, 'Real Food Restaurants Inc', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1678, 'Springdale Hall Club', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1679, 'Chowbus', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1680, 'Elior North America - Dining and Events', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1681, 'Embassy Suites San Antonio Riverwalk', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1682, 'Ka sushi', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1683, 'Legends / Dallas Cowboys', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1684, 'Agile Hospitality', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1685, 'JOINT EXPEDITIONARY BASE LITTLE CREEK', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1686, 'Macados', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1687, 'MACADO''S INC', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1688, 'Pig & Sam Restaurant Group', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1689, 'AJ''s Riverside', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1690, 'Fox Hollow Golf Course', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1691, 'Magpies / Fat Cat''s / Creekside Jack''s', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1692, 'Moran''s Pub', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1693, 'UPPER CRUST PIZZERIA & PUB', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'NRA ANNASEA LEADS'),
  (1694, 'I Dream of Falafel', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1695, 'Country House Restaurant', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1696, 'FROSTY DOGS', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1697, 'Village of Hoffman Estates', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1698, 'Silver Lake Restaurant', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1699, 'Matajini mvp llc', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1700, 'N.Kotake,Inc', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1701, 'KT', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1702, 'sip Wine Bar', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1703, 'Imperial Surveillance', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1704, 'OCallaghan''s', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1705, 'Hailstorm Brewing Company', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1706, 'Trails Edge Brewing Co', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1707, 'Porky''s BBQ', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1708, 'Pine Valley Country Club', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1709, 'JOE''S GROUP', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1710, 'Carol''s Catering', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1711, 'Chef Jamie''s', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1712, 'Big Daddy''s BBQ', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1713, 'The River Merchant', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1714, 'Georgios Restaurants', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1715, 'HVYC', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1716, 'Captian D''s', 'prospect', 'C', NULL, NULL, NULL, NULL, 'IL', NULL, 'NRA KAUFHOLDS'),
  (1717, 'Hyatt Regency Salt Lake City', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1718, 'Panos', 'distributor', 'C', NULL, NULL, NULL, NULL, 'IN', NULL, 'NRA KAUFHOLDS'),
  (1719, 'Baraga County Memorial Hospital', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IN', NULL, 'NRA KAUFHOLDS'),
  (1720, 'Gogebic Community College', 'unknown', 'C', NULL, NULL, NULL, NULL, 'IN', NULL, 'NRA KAUFHOLDS'),
  (1721, 'Michigan Technological University', 'unknown', 'C', NULL, NULL, NULL, NULL, 'KY', NULL, 'NRA KAUFHOLDS'),
  (1722, 'Helen Newberry Joy Hospital', 'unknown', 'C', NULL, NULL, NULL, NULL, 'OH', NULL, 'NRA KAUFHOLDS'),
  (1723, 'USF-CHICAGO', 'unknown', 'C', NULL, NULL, NULL, NULL, 'OH', NULL, 'NRA KAUFHOLDS'),
  (1724, 'USF-STREATOR', 'unknown', 'C', NULL, NULL, NULL, NULL, 'OH', NULL, 'NRA KAUFHOLDS'),
  (1725, 'USF-C&U', 'unknown', 'C', NULL, NULL, NULL, NULL, 'OH', NULL, 'NRA KAUFHOLDS'),
  (1726, 'Adams Memorial Hospital', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1727, 'Premier Arts Academy', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1728, 'PFG-Western Suburbs', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1729, 'Gordon Foodservice', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1730, 'ABBOTT AP6D DEPT GE03', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1731, 'ABBVIE M1', 'unknown', 'A', NULL, NULL, NULL, 'North Chicago', NULL, NULL, ''),
  (1732, 'AMERICAN ACCORD FOOD CORPORATION', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1733, 'Barnstormer''s Pizza', 'unknown', 'C', NULL, NULL, NULL, 'Hoffman estates', NULL, NULL, ''),
  (1734, 'Burlington Tap and Smokehouse', 'unknown', 'C', NULL, NULL, NULL, 'SPRINGFIELD', NULL, NULL, ''),
  (1735, 'Cheers In Chesterton', 'unknown', 'C', NULL, NULL, NULL, 'Burlington', NULL, NULL, ''),
  (1736, 'Chicago Health Foods', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1737, 'Community Hospital Food Service', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1738, 'CORNER PUB & GRILL', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1739, 'CRYSTAL VALLEY CATERING', 'unknown', 'C', NULL, NULL, NULL, 'Kankakee', NULL, NULL, ''),
  (1740, 'Dabney & Co', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1741, 'DREAM PALACE BANQUET HALL', 'unknown', 'C', NULL, NULL, NULL, 'CLINTON', NULL, NULL, ''),
  (1742, 'Driftless Social', 'unknown', 'C', NULL, NULL, NULL, 'CHICAGO', NULL, NULL, ''),
  (1743, 'E I U- FOOD COURT', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1744, 'Elkhorn Area High School Culinary A', 'unknown', 'C', NULL, NULL, NULL, 'Charleston', NULL, NULL, ''),
  (1745, 'Elston Ave Food Co. 392959E', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1746, 'FM - Village at Mercy Creek', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1747, 'GEJA''S CAFE', 'unknown', 'C', NULL, NULL, NULL, 'Peptone', NULL, NULL, ''),
  (1748, 'HAIRY COW BREWING COMPANY', 'unknown', 'C', NULL, NULL, NULL, 'Arlington Heights', NULL, NULL, ''),
  (1749, 'HEARTLAND HUMAN CARE-SRV GILES CCR', 'unknown', 'C', NULL, NULL, NULL, 'Hampshire', NULL, NULL, ''),
  (1750, 'HSL Eau Claire', 'unknown', 'C', NULL, NULL, NULL, 'CHICAGO', NULL, NULL, ''),
  (1751, 'HSL Muskego', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1752, 'IVY TECH-E CHICAGO', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1753, 'Kiddie Academy Of Oak Park', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1754, 'Lemuel Marcial', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1755, 'Lutherdale', 'unknown', 'C', NULL, NULL, NULL, 'Ludington', NULL, NULL, ''),
  (1756, 'MARK III RESTAURANT (THE)', 'unknown', 'C', NULL, NULL, NULL, 'Homewood', NULL, NULL, ''),
  (1757, 'Marrufo''s Tacos', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1758, 'MILWAUKEE BRAT HOUSE', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1759, 'NIIPC- PRAIRIE KNOLLS MIDDLE SCHOOL', 'unknown', 'C', NULL, NULL, NULL, 'Plymouth', NULL, NULL, ''),
  (1760, 'NIIPC-JOSEPH E HILL ADMIN CENTER', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1761, 'OAKCREST DEKALB AREA RET CTR', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1762, 'Organic Life - Peoria High School', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1763, 'Palace Ent - Adventureland', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1764, 'Port of Peri Peri Villa Park IL', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1765, 'Quality Inn Bradley 367910E', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1766, 'Quindts Towne Lounge', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1767, 'RADER FAMILY FARM', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1768, 'Rockford Rivets', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1769, 'Rupley Elementary School', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1770, 'SAUSAGE KITCHEN', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1771, 'Science Of Spirituality', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1772, 'Something Special by Sherri', 'unknown', 'C', NULL, NULL, NULL, 'Lisle', NULL, NULL, ''),
  (1773, 'SPRING BROOK RESORT 69445E', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1774, 'Stussy''s Diner', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1775, 'Sure Stay Plus Hotel', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1776, 'Tandoor Char House', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1777, 'Taquero Mucho', 'unknown', 'C', NULL, NULL, NULL, 'Chicago', NULL, NULL, ''),
  (1778, 'The Cellar Door', 'unknown', 'C', NULL, NULL, NULL, 'Chicago', NULL, NULL, ''),
  (1779, 'The Village Of South Holland', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1780, 'THS-Gottlieb Memorial Dietary', 'unknown', 'C', NULL, NULL, NULL, 'Racine', NULL, NULL, ''),
  (1781, 'THS-MERCY MEDICAL CTR-DUBUQUE-H0050', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1782, 'Tinys Coffee Bar', 'unknown', 'C', NULL, NULL, NULL, 'East Troy', NULL, NULL, ''),
  (1783, 'UIC Catering & Conferences 49852003', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1784, 'VILLAGE GRNS OF WOODRIDGE GOLFCRSE', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1785, 'Wanaki Golf Course', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1786, 'West Carroll Middle School', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1787, 'WEST HARVEY SCHOOL DIST 147', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1788, 'White Deer Golf Course', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1789, 'WurstBar Brady St', 'unknown', 'C', NULL, NULL, NULL, 'Vernon Hills', NULL, NULL, ''),
  (1790, 'Brett Anthony Foods', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1791, 'pavlou', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1792, 'Frank''s Pizza & Pub', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1793, 'Mr. Scribs', 'customer', 'A', NULL, NULL, NULL, NULL, 'MI', NULL, 'lead from Kaufholds John Schneider ler Anthony oversite. Leftnkits'),
  (1794, 'Avi Foodsystems', 'customer', 'C', NULL, NULL, NULL, 'Warren', 'OH', NULL, 'Mccrum and Sysco connect with Mike''s help.'),
  (1795, 'TAR & Feather Concessions', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (1796, 'Kaufholds', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1797, 'Frites Street', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1798, 'Better Balance', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1799, 'VAF', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1800, 'Ofk', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1801, 'Annasea', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1802, 'Rapid Rasoi', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1803, 'SWAP', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1804, 'Never Better', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1805, 'TCFB', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1806, 'Mrs Ressler''s', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1807, 'Abdale', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1808, 'Mccrum', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (1809, 'Kayco', 'principal', 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ============================================================================
-- CONTACTS (2013 total)
-- ============================================================================

INSERT INTO contacts (id, name, first_name, last_name, organization_id, email, phone, title, department, address, city, state, postal_code, country, linkedin_url, notes) VALUES
  (1, 'Tellez', NULL, 'Tellez', NULL, '[{"email":"tellez@aactax.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2, 'Figueroa', NULL, 'Figueroa', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (3, 'Thor', NULL, 'Thor', 25, '[{"email":"aliceandfriendsvegankitchen@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (4, 'Darryl', NULL, 'Darryl', 27, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (5, 'Rodriguez', NULL, 'Rodriguez', 30, '[{"email":"elierrod@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (6, 'Cornell', NULL, 'Cornell', 31, '[{"email":"kyeandkris@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (7, 'Unknown', NULL, NULL, 34, '[{"email":"osroc44@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'President', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (8, 'Corso', NULL, 'Corso', 35, '[{"email":"osroc44@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (9, 'Chef Tinaglia', 'Chef', 'Tinaglia', 42, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (10, 'Jay-', NULL, 'Jay-', 44, '[]'::jsonb, '[{"number":"12247352450","type":"work"}]'::jsonb, 'Manager', NULL, '111 W Campbell St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (11, 'Michael Campenil - Greco', 'Michael Campenil -', 'Greco', 44, '[]'::jsonb, '[{"number":"12247352450","type":"work"}]'::jsonb, 'Distributor Rep', NULL, '111 W Campbell St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (12, 'Don Smith', 'Don', 'Smith', 63, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'In charge of all purchases for store'),
  (13, 'Mike', NULL, 'Mike', 63, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (14, 'Max', NULL, 'Max', 63, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (15, 'Spencer Beverly', 'Spencer', 'Beverly', 69, '[{"email":"spencer_beverly@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (16, 'Balis', NULL, 'Balis', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', '908 N Halsted St
Chicago, IL  60642
United States', NULL),
  (17, 'Cardelli', NULL, 'Cardelli', 78, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (18, 'Kyle Ramsy', 'Kyle', 'Ramsy', 79, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (19, 'Paul Ramsy', 'Paul', 'Ramsy', 79, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (20, 'Community Engagement', 'Community', 'Engagement', 79, '[]'::jsonb, '[]'::jsonb, 'Vp', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (21, 'David Tsirekas Craig Richardson', 'David Tsirekas Craig', 'Richardson', 93, '[{"email":"craigbnb@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (22, 'Joe Plewa', 'Joe', 'Plewa', 114, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (23, 'Rosenbush', NULL, 'Rosenbush', 118, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (24, 'Antia Zubin', 'Antia', 'Zubin', 124, '[{"email":"zubinantia@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (25, 'Christophersen Keegan', 'Christophersen', 'Keegan', 125, '[{"email":"keegan@blackwing.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (26, 'Olichwier Jeff', 'Olichwier', 'Jeff', 127, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (27, 'Cullars Patrick', 'Cullars', 'Patrick', 129, '[{"email":"patrickcullars@boydgaming.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (28, 'Ghoman', NULL, 'Ghoman', 131, '[{"email":"aghoman@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (29, 'Seth Minton', 'Seth', 'Minton', 134, '[]'::jsonb, '[]'::jsonb, 'Chef De Cuisine', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (30, 'Brewer Mark', 'Brewer', 'Mark', 138, '[{"email":"mbrewer@boelter.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (31, 'Krueger', NULL, 'Krueger', 138, '[{"email":"ekrueger@boelter.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (32, 'Giuseppe Tentori', 'Giuseppe', 'Tentori', 141, '[]'::jsonb, '[{"number":"13123376070","type":"work"}]'::jsonb, 'Exec Chef', NULL, '820 West Lake St.', 'Chicago', NULL, '60607.0', 'USA', NULL, 'Urban Belly, The Table at Crate, Sol Toro, MJ23 Sports Bar Michael Jordan''s Steakhouse, Hi-Fi Chicken and Beer, Brassierie 1783'),
  (33, 'Pastry Schawecker', 'Pastry', 'Schawecker', 143, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (34, 'Dillon', NULL, 'Dillon', 144, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (35, 'Nicky P', 'Nicky', 'P', 152, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (36, '. Bryant Anderson', '. Bryant', 'Anderson', 156, '[]'::jsonb, '[{"number":"17733274900","type":"work"}]'::jsonb, 'Exec Chef', NULL, '2548 N Southport Ave', NULL, NULL, NULL, 'USA', NULL, NULL),
  (37, 'Eric Williams Cecilia Cuff Lamar Moore', 'Eric Williams Cecilia Cuff Lamar', 'Moore', 157, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (38, 'Howlett Sarah', 'Howlett', 'Sarah', 160, '[{"email":"sarahlanenga@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (39, 'Daisy', NULL, 'Daisy', 165, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (40, 'Saul Ramos', 'Saul', 'Ramos', 169, '[]'::jsonb, '[{"number":"17082055341","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (41, 'Chris And Susie Maloyan -Owners', 'Chris And Susie Maloyan', '-Owners', 169, '[]'::jsonb, '[{"number":"17082055341","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (42, 'Shabani Marwan', 'Shabani', 'Marwan', 170, '[{"email":"cafe53popup@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (43, 'Ribel Eddie', 'Ribel', 'Eddie', 172, '[{"email":"callingachef@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (44, 'Chandler Latricia', 'Chandler', 'Latricia', 177, '[{"email":"cantbelieveitsnotmeat@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (45, 'Carlos Mendez', 'Carlos', 'Mendez', 183, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (46, 'Waller Anthony', 'Waller', 'Anthony', 191, '[{"email":"cotb@me.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (47, 'Christian Lucas', 'Christian', 'Lucas', 199, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (48, 'Uldrich', NULL, 'Uldrich', 200, '[]'::jsonb, '[]'::jsonb, 'Gm', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (49, 'Baggs Charlie', 'Baggs', 'Charlie', 201, '[{"email":"chase@charliebaggsinc.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (50, 'Jesse Ayello', 'Jesse', 'Ayello', 204, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (51, 'Nicky P Stavo', 'Nicky P', 'Stavo', 205, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (52, 'Schmidt', NULL, 'Schmidt', 215, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (53, 'Mastroianni Salvatore', 'Mastroianni', 'Salvatore', 220, '[{"email":"contact@chicagogsc.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (54, 'Deblasio Doninic', 'Deblasio', 'Doninic', 225, '[{"email":"deblasio@chicagoveganfoods.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (55, 'Romano', NULL, 'Romano', 226, '[{"email":"jcromano81@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (56, 'Tuler Michelle', 'Tuler', 'Michelle', 229, '[{"email":"shellyf83@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (57, 'Newson Delangelo', 'Newson', 'Delangelo', 236, '[{"email":"dnewson@clarklindsey.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (58, 'Wyman Beth', 'Wyman', 'Beth', 236, '[{"email":"bwyman@clarklindsey.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (59, 'Jay Wright General', 'Jay Wright', 'General', 240, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (60, 'Cromwell', NULL, 'Cromwell', 245, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (61, 'Geiser Albert', 'Geiser', 'Albert', 248, '[{"email":"winedali@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (62, 'Vanderbilt William', 'Vanderbilt', 'William', 249, '[{"email":"wvanderb@cord.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (63, 'Boyer Zachary', 'Boyer', 'Zachary', 250, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (64, 'Stafford', NULL, 'Stafford', 252, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (65, 'Bill Kim', 'Bill', 'Kim', 257, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (66, 'Derheim', NULL, 'Derheim', 261, '[{"email":"luke@craftncrew.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (67, 'Juarez', NULL, 'Juarez', 265, '[{"email":"jjuarez71289@outlook.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (68, 'Chef Anthony Sitek', 'Chef Anthony', 'Sitek', 270, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (69, 'Chef Anthony Sitek', 'Chef Anthony', 'Sitek', 270, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (70, 'Namdari', NULL, 'Namdari', 274, '[{"email":"darabm1963@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (71, 'Bryant', NULL, 'Bryant', 279, '[{"email":"cynthialbryant@outlook.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (72, 'Joe Frillman', 'Joe', 'Frillman', 281, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (73, 'Nicky P Shannon Tom Or George', 'Nicky P Shannon Tom Or', 'George', 284, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (74, 'Badawy', NULL, 'Badawy', 285, '[{"email":"darbaklava@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (75, 'Jesse Ayello', 'Jesse', 'Ayello', 286, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (76, 'Dina Kijuno', 'Dina', 'Kijuno', 287, '[]'::jsonb, '[{"number":"17739871128","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (77, 'Edwards Claveneque', 'Edwards', 'Claveneque', 297, '[{"email":"cedwar45@depaul.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (78, 'Fifarek Michael', 'Fifarek', 'Michael', 298, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (79, 'Clavin Edghsin', 'Clavin', 'Edghsin', 299, '[{"email":"eoghain.clavin@diageo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (80, 'Nick De Astis', 'Nick De', 'Astis', 303, '[{"email":"ndeastis@direct-foods.com","type":"work"}]'::jsonb, '[{"number":"16303502171","type":"work"}]'::jsonb, 'Owner', NULL, '204 North Edgewood Dr.', 'Woodale', NULL, '60191.0', 'USA', NULL, 'Positive response of Annasea. Use as ingredient or as finished pupu'),
  (81, 'Gaetano Nardulli', 'Gaetano', 'Nardulli', 303, '[{"email":"gnardulli@direct-foods.com","type":"work"}]'::jsonb, '[{"number":"16303502171","type":"work"}]'::jsonb, 'Exec Chef', NULL, '204 North Edgewood Dr.', 'Woodale', NULL, '60191.0', 'USA', NULL, 'Positive response of Annasea. Use as ingredient or as finished pupu'),
  (82, 'Nathan Rager', 'Nathan', 'Rager', 303, '[{"email":"nrager@direct-foods.com","type":"work"}]'::jsonb, '[{"number":"16303502171","type":"work"}]'::jsonb, 'Sous Chef', NULL, '204 North Edgewood Dr.', 'Woodale', NULL, '60191.0', 'USA', NULL, 'Positive response of Annasea. Use as ingredient or as finished pupu'),
  (83, 'Thai Tram', 'Thai', 'Tram', 306, '[{"email":"tram.thai@att.net","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (84, 'Zuber Lynn', 'Zuber', 'Lynn', NULL, '[{"email":"lynn.zuber@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (85, 'Bradley Miller', 'Bradley', 'Miller', 310, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (86, 'General Jensen', 'General', 'Jensen', 313, '[{"email":"keith@icashout.io","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (87, 'Tsyhanenko', NULL, 'Tsyhanenko', 315, '[{"email":"yaroslav.tsyhanenko@dotsplatform.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (88, 'Brent', NULL, 'Brent', 332, '[{"email":"bramsy@masterfoodbrokers.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (89, 'Mike', NULL, 'Mike', 332, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (90, 'Executive Perez', 'Executive', 'Perez', 333, '[{"email":"dperez@eastbankclub.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (91, 'Fuller David', 'Fuller', 'David', 335, '[{"email":"david@etlfoods.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (92, 'Dave', NULL, 'Dave', 337, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (93, 'Reasoner Andre', 'Reasoner', 'Andre', 345, '[{"email":"areasone@epic.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (94, 'Szombatfalvy Nicholas', 'Szombatfalvy', 'Nicholas', 345, '[{"email":"nszombat@epic.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (95, 'Jenner Tomaska And Wife Katrina Bravo', 'Jenner Tomaska And Wife Katrina', 'Bravo', 348, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (96, 'Macneil', NULL, 'Macneil', 351, '[{"email":"cog@etailerinc.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (97, 'Jamroch Christopher', 'Jamroch', 'Christopher', 354, '[{"email":"christopher.jamroch@compass-usa.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (98, 'King Ryan', 'King', 'Ryan', 354, '[{"email":"ryan.king@compass-usa.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (99, 'Kolasinski', NULL, 'Kolasinski', 357, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (100, 'Wengel Tomme', 'Wengel', 'Tomme', 359, '[{"email":"tomme@eopizza.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (101, 'Diguido', NULL, 'Diguido', 367, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (102, 'Diguido', NULL, 'Diguido', 367, '[{"email":"ajandriacchi@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (103, 'Gfs Kathy Lyons', 'Gfs Kathy', 'Lyons', 369, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (104, 'Eretail And Omni Key Account', 'Eretail And Omni', 'Key Account', 372, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (105, 'Moe Procopos', 'Moe', 'Procopos', 378, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (106, 'Hirmez', NULL, 'Hirmez', 379, '[{"email":"rumuna.hirmez@compass-usa.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (107, 'Griffith', NULL, 'Griffith', 382, '[{"email":"dgriffith@foodexport.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (108, 'Vasilevski', NULL, 'Vasilevski', 382, '[{"email":"svasilevski@foodexport.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (109, 'Kuhn', NULL, 'Kuhn', 383, '[{"email":"mkuhn@ift.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (110, 'Miller', NULL, 'Miller', 384, '[{"email":"cmiller@foodmix.net","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (111, 'Craig Spillman', 'Craig', 'Spillman', 389, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (112, 'Mike Schatzman-', 'Mike', 'Schatzman-', 401, '[]'::jsonb, '[{"number":"13124454686","type":"work"}]'::jsonb, 'Owner', NULL, '675 N Franklin st.', 'Chicago', NULL, NULL, 'USA', NULL, NULL),
  (113, 'Svoboda Corey', 'Svoboda', 'Corey', 402, '[{"email":"corey@freedombrotherspizza.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (114, 'Futterman Lisa', 'Futterman', 'Lisa', 403, '[{"email":"alphafutt@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (115, 'Maynard Chris', 'Maynard', 'Chris', 404, '[{"email":"chris.m@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (116, 'Farhana Rahim', 'Farhana', 'Rahim', 405, '[{"email":"farhanagcd@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (117, 'Froehlich', NULL, 'Froehlich', 407, '[{"email":"colleen@shopfroehlichs.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (118, 'Rick Bayless', 'Rick', 'Bayless', 409, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (119, 'Hibachi Senmounnarath', 'Hibachi', 'Senmounnarath', 412, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (120, 'Gines Jason', 'Gines', 'Jason', 414, '[{"email":"jason@gabbygoat.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (121, 'Kurland Robert', 'Kurland', 'Robert', 418, '[{"email":"rkurland30@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (122, 'Andrew Mcgovern', 'Andrew', 'Mcgovern', 419, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (123, 'Nicky P', 'Nicky', 'P', 424, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (124, 'Jose', NULL, 'Jose', 425, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, '6701 w 111 st', 'Worth', NULL, NULL, 'USA', NULL, NULL),
  (125, 'Drew Keane Gibsons Group', 'Drew Keane Gibsons', 'Group', 436, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (126, 'Ashley Redding', 'Ashley', 'Redding', 439, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (127, 'Kagan Irv', 'Kagan', 'Irv', 452, '[{"email":"irvk@goodtogofood.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (128, 'Boonjathai Amy', 'Boonjathai', 'Amy', 475, '[{"email":"amy.boonjathai@greenleaffoods.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (129, 'Mcdonald Tommy', 'Mcdonald', 'Tommy', 475, '[{"email":"tommy.mcdonald@greenleaffoods.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (130, 'Pesce Crystal', 'Pesce', 'Crystal', 477, '[{"email":"cpesce@greenwoodassociates.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (131, 'Andrew Kapordelis', 'Andrew', 'Kapordelis', 478, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (132, 'Finn Camille', 'Finn', 'Camille', 480, '[{"email":"camille.finn@guckenheimer.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (133, 'Holtevert Brent', 'Holtevert', 'Brent', 480, '[{"email":"brentholt1798@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (134, 'Bulfer Kyle', 'Bulfer', 'Kyle', 490, '[{"email":"kylebulfer79@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (135, 'Al-Qadi Halimah', 'Al-Qadi', 'Halimah', 495, '[{"email":"tghazal@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (136, 'Ethan Lim', 'Ethan', 'Lim', 500, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (137, 'Vocal Chelsea', 'Vocal', 'Chelsea', 506, '[{"email":"chelsea@hirayahospitality.co","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (138, 'Shin Burnsik', 'Shin', 'Burnsik', 508, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (139, 'Ryan Nilson, Senior Executive Culinary Dustin Trip Culinary Joe Doran Culinary', 'Ryan Nilson, Senior Executive Culinary Dustin Trip Culinary', 'Joe Doran Culinary', 510, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (140, 'Salhab Mohdkairi', 'Salhab', 'Mohdkairi', 515, '[{"email":"mosalhab@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (141, 'Patel Imtiyaz', 'Patel', 'Imtiyaz', 516, '[{"email":"imtiyaz.p@hookupllc.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (142, 'Torres Valerie', 'Torres', 'Valerie', 519, '[{"email":"vtorres2@caesars.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (143, 'Abby Smith', 'Abby', 'Smith', 534, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (144, 'Tomlinson', NULL, 'Tomlinson', 534, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (145, 'David Talent', 'David', 'Talent', NULL, '[{"email":"jotallen@iu.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (146, 'Joe Hearth', 'Joe', 'Hearth', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (147, 'Kirchofer Jason', 'Kirchofer', 'Jason', NULL, '[{"email":"jakirchh@iu.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (148, 'Townsend Audarshia', 'Townsend', 'Audarshia', 540, '[{"email":"audarshia.townsend@informa.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (149, 'Chairman/ Starks', 'Chairman/', 'Starks', 541, '[]'::jsonb, '[]'::jsonb, 'Ceo', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (150, 'Head', NULL, 'Head', 544, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (151, 'Henderson Samara', 'Henderson', 'Samara', 544, '[{"email":"shenderson@inspirationcorp.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (152, 'Klimek Edward', 'Klimek', 'Edward', 548, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (153, '/ Owner Crawford', '/ Owner', 'Crawford', 550, '[]'::jsonb, '[]'::jsonb, 'Ceo', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (154, 'Corporate Roirdan', 'Corporate', 'Roirdan', 550, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (155, 'Executive', NULL, 'Executive', 550, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (156, 'Ripley', NULL, 'Ripley', 550, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (157, 'Tai James', 'Tai', 'James', 566, '[{"email":"joyyee2000@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (158, 'Zenk John', 'Zenk', 'John', 571, '[{"email":"john.zenk@frischs.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (159, 'Contreras Alexis', 'Contreras', 'Alexis', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (160, 'Thompson Quint', 'Thompson', 'Quint', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (161, 'Thompson Quint', 'Thompson', 'Quint', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (162, 'Bruder Dan', 'Bruder', 'Dan', 579, '[{"email":"danb@kelber.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (163, 'Streitz', NULL, 'Streitz', 580, '[{"email":"shanes@kelber.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (164, 'Quinn', NULL, 'Quinn', 583, '[{"email":"paul.quinn@ketteringhealth.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (165, 'Gee Henry', 'Gee', 'Henry', 584, '[{"email":"hgee@keyfoodservices.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (166, 'Koubise Mohammad', 'Koubise', 'Mohammad', 592, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (167, 'Devoe Natalie', 'Devoe', 'Natalie', 593, '[{"email":"natalie.devoe@meshsystems.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (168, 'Nick Miller', 'Nick', 'Miller', 594, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, 'sampled', NULL, NULL, NULL, 'USA', NULL, NULL),
  (169, 'Valladolid Adrian', 'Valladolid', 'Adrian', 601, '[{"email":"info@otraradio.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (170, 'Foodservice Sampson', 'Foodservice', 'Sampson', 602, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (171, 'Anthony', NULL, 'Anthony', 603, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (172, 'Balzer David', 'Balzer', 'David', 604, '[{"email":"david@ladygregorys.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, '5260 N Clark St', 'Chicago', NULL, '60640.0', 'USA', NULL, NULL),
  (173, 'Hernandez Ernie', 'Hernandez', 'Ernie', 604, '[{"email":"ernie@ladygregorys.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, '5260 N Clark St', 'Chicago', NULL, '60640.0', 'USA', NULL, NULL),
  (174, 'Rubin', NULL, 'Rubin', 605, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (175, 'Chris Reickermanm', 'Chris', 'Reickermanm', 610, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (176, 'Guzman Liliano', 'Guzman', 'Liliano', 611, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (177, 'Marino Willim', 'Marino', 'Willim', NULL, '[{"email":"billy@leonas.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (178, 'Volk Lisa', 'Volk', 'Lisa', 617, '[{"email":"l.volk@gnosis.lesaffre.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (179, 'Jeff Matuszewski', 'Jeff', 'Matuszewski', 620, '[{"email":"jmatuszewski@lettuce.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '417 N. Ashland Avenue', 'Chicago', NULL, NULL, 'USA', NULL, NULL),
  (180, 'Dineen Joshua', 'Dineen', 'Joshua', 624, '[{"email":"jfdineen@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (181, 'Dineen Melania', 'Dineen', 'Melania', 624, '[{"email":"dineenmelanie@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (182, 'Exec Brian Motyka', 'Exec Brian', 'Motyka', 630, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (183, 'Kreis Emma', 'Kreis', 'Emma', 633, '[{"email":"erkreis24@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (184, 'Milton Cayden', 'Milton', 'Cayden', 636, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (185, 'Nick', NULL, 'Nick', 108, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (186, 'Unknown', NULL, NULL, 644, '[{"email":"emilio@madamezuzus.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (187, 'Jeff', NULL, 'Jeff', 703, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (188, 'Guerrero Brenda', 'Guerrero', 'Brenda', 648, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (189, 'Pardo Christina', 'Pardo', 'Christina', 648, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (190, 'Mike Heminger', 'Mike', 'Heminger', 649, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (191, 'Bayer Keith', 'Bayer', 'Keith', 659, '[{"email":"keithbayer1957@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (192, '/ Chef De Cuisine Wennberg', '/ Chef De Cuisine', 'Wennberg', 660, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (193, 'Running Chris', 'Running', 'Chris', 662, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (194, 'Prajapati Apexa', 'Prajapati', 'Apexa', 671, '[{"email":"ap1881995@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (195, 'Parton Thad', 'Parton', 'Thad', 672, '[{"email":"tparton@mather.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (196, 'Jackson Josephine', 'Jackson', 'Josephine', 678, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (197, 'Edsall Jean', 'Edsall', 'Jean', 683, '[{"email":"jedsall87@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (198, 'Rudner Alyssa', 'Rudner', 'Alyssa', 690, '[{"email":"acrudner@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (199, 'Executive Moreno', 'Executive', 'Moreno', 694, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (200, 'Venue Management Urquiza', 'Venue Management', 'Urquiza', 695, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (201, 'Jesse Rogers Sara Brad', 'Jesse Rogers Sara', 'Brad', 700, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (202, 'Patrick Gibson 231.410.8730 Jordan', 'Patrick Gibson 231.410.8730', 'Jordan', 701, '[{"email":"durkinj3@msu.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (203, 'Lizet Lopez', 'Lizet', 'Lopez', 704, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (204, 'Rahim', NULL, 'Rahim', 705, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (205, 'Joe Fitzgerald', 'Joe', 'Fitzgerald', 706, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (206, 'Jim Drewenski', 'Jim', 'Drewenski', 707, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (207, 'Bennett-Harris', NULL, 'Bennett-Harris', 711, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (208, 'Brown', NULL, 'Brown', 711, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (209, 'Weber', NULL, 'Weber', 712, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (210, 'Jennifer', NULL, 'Jennifer', 714, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (211, 'Alexis Francis General', 'Alexis Francis', 'General', 715, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (212, 'Cassie Hagans General', 'Cassie Hagans', 'General', 715, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (213, 'Shannon Coughlin', 'Shannon', 'Coughlin', 715, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (214, 'Chris Mcgraw General Sales.Mrbsmurray@Gmail.Com', 'Chris Mcgraw General', 'Sales.Mrbsmurray@Gmail.Com', 716, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (215, 'Moschouris', NULL, 'Moschouris', 718, '[{"email":"niko@mmdco.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (216, 'Rogers', NULL, 'Rogers', 719, '[{"email":"bobbyrogers@berryglobal.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (217, 'Jared Wentworth', 'Jared', 'Wentworth', 724, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (218, 'Co-', NULL, 'Co-', 725, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (219, 'Co-Ownter', NULL, 'Co-Ownter', 725, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (220, 'Jay Baron Cell 270-227-8423 Muggyshideoutr20052Gmail.Com', 'Jay Baron Cell 270-227-8423', 'Muggyshideoutr20052Gmail.Com', 729, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (221, 'Duquette Julie', 'Duquette', 'Julie', 732, '[{"email":"julied520@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (222, 'Binno Joe', 'Binno', 'Joe', 734, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (223, 'Davis Jordan', 'Davis', 'Jordan', 735, '[{"email":"jordandaviswork@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (224, 'Bryant Kelly', 'Bryant', 'Kelly', 737, '[{"email":"kbryant@restaurant.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (225, 'Dia Dame', 'Dia', 'Dame', 739, '[{"email":"loop@nativefoods.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (226, 'Lashay', NULL, 'Lashay', 739, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (227, 'Dia', NULL, 'Dia', 739, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (228, 'Lija Workman', 'Lija', 'Workman', 742, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (229, 'Bechle Shelley', 'Bechle', 'Shelley', 744, '[{"email":"shelly.bechle@wisconsin.gov","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (230, 'Chambers Brown', 'Chambers', 'Brown', 745, '[]'::jsonb, '[]'::jsonb, 'Ceo', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (231, 'Sanders Desiree', 'Sanders', 'Desiree', 745, '[{"email":"desireesanders7@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (232, 'Rintelman Joe', 'Rintelman', 'Joe', 750, '[{"email":"jrintelman@noblestores.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (233, 'Hooper Amanda', 'Hooper', 'Amanda', 756, '[{"email":"archerdistribution@nac.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (234, 'Leal Angel', 'Leal', 'Angel', 756, '[{"email":"aleal@naconcessions.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (235, 'Ken Whitney', 'Ken', 'Whitney', 758, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (236, 'Scot Ostrander', 'Scot', 'Ostrander', 758, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (237, 'Brian Schneider', 'Brian', 'Schneider', 758, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (238, 'Dan Koenen', 'Dan', 'Koenen', 758, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (239, 'John Boswell', 'John', 'Boswell', 758, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (240, 'Trujillo Lucero', 'Trujillo', 'Lucero', 756, '[{"email":"ltrujillo@naconcessions.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (241, 'Matthusen Dale', 'Matthusen', 'Dale', 765, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (242, 'Salman Sam', 'Salman', 'Sam', 766, '[{"email":"bsalman1@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (243, 'Joshua Blevins-', 'Joshua', 'Blevins-', 771, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (244, 'Mazarakos Alex', 'Mazarakos', 'Alex', 780, '[{"email":"amazarakos@qualityinnbradley.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (245, 'Cook Meyer', 'Cook', 'Meyer', 785, '[{"email":"cmeyer@onehopeunited.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (246, 'Lead Cook Snow', 'Lead Cook', 'Snow', 785, '[{"email":"msnow@onehopeunited.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (247, 'Paul Kahan', 'Paul', 'Kahan', 787, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (248, 'Tony D', 'Tony', 'D', 787, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (249, 'Gfs', NULL, 'Gfs', 788, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (250, 'Gitler Karen', 'Gitler', 'Karen', 790, '[{"email":"karyntg@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (251, 'Chef Noah Sandoval-', 'Chef Noah', 'Sandoval-', 791, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (252, 'Lesa Holford', 'Lesa', 'Holford', NULL, '[{"email":"holford.8@osu.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (253, 'Usf Brian Mish', 'Usf Brian', 'Mish', 799, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (254, 'Rick Tramonto', 'Rick', 'Tramonto', 800, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (255, 'Charlie', NULL, 'Charlie', 802, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (256, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (257, 'Altstadt Jennifer', 'Altstadt', 'Jennifer', 804, '[{"email":"jaltstadt@partstown.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (258, 'Townsend Taylor', 'Townsend', 'Taylor', NULL, '[{"email":"pgchicagocatering@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (259, 'Drabkin Danielle', 'Drabkin', 'Danielle', 810, '[{"email":"danielle@pearchef.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (260, 'Nicky P', 'Nicky', 'P', 814, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (261, 'Govt Affairs Hurtado', 'Govt Affairs', 'Hurtado', 815, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (262, 'Valladolid Leo', 'Valladolid', 'Leo', 819, '[{"email":"losamantesrestaurant@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (263, 'Jordan Gottlieb', 'Jordan', 'Gottlieb', 824, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (264, 'Keith Stucker', 'Keith', 'Stucker', 833, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (265, 'Ryan.D, Pedro.C, Nicole Chefs Cesar', 'Ryan.D, Pedro.C, Nicole', 'Chefs Cesar', 838, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (266, 'Hady', NULL, 'Hady', 839, '[{"email":"hamdyhady@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (267, 'Exec Elton Mann And Brady Cohen Gm', 'Exec Elton Mann And Brady Cohen', 'Gm', 843, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (268, 'Brady Cohen', 'Brady', 'Cohen', 843, '[{"email":"bcohen@theinn.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (269, 'Bartlett Taiana', 'Bartlett', 'Taiana', 844, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (270, 'Borkovec Kyle', 'Borkovec', 'Kyle', 845, '[{"email":"kborkovec@planteneers.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (271, 'Henry Samuel', 'Henry', 'Samuel', 845, '[{"email":"shenry@planteneers.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (272, 'Montanez Tatiana', 'Montanez', 'Tatiana', 845, '[{"email":"tmontanez@planteneers.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (273, 'Chefs Art And Chelsea Jackson', 'Chefs Art And Chelsea', 'Jackson', 846, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (274, 'William Mylan', 'William', 'Mylan', 852, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (275, 'Kurt Miller', 'Kurt', 'Miller', 853, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (276, 'Skrzypczak Zygmut', 'Skrzypczak', 'Zygmut', 854, '[{"email":"tmontanez@planteneers.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (277, 'Kern Garrett', 'Kern', 'Garrett', 855, '[{"email":"gkern@portillos.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (278, 'Sysco', NULL, 'Sysco', 858, '[{"email":"james@postboynb.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (279, 'Lou Minaglia', 'Lou', 'Minaglia', 860, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (280, 'Jones Wilbert', 'Jones', 'Wilbert', 872, '[{"email":"joneswilbert@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (281, 'Chris Pappas', 'Chris', 'Pappas', 875, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (282, 'Usf Brian Mish', 'Usf Brian', 'Mish', 879, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (283, 'Lex Andreas Gabby', 'Lex', 'Andreas Gabby', 882, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (284, 'Meter Jonathan', 'Meter', 'Jonathan', 883, '[{"email":"jonathanmeter@puitak.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (285, 'Ashley Sargent', 'Ashley', 'Sargent', 884, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (286, 'Rivera', NULL, 'Rivera', 885, '[{"email":"river123@pnw.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (287, 'Parks-Fried Aubrey', 'Parks-Fried', 'Aubrey', 886, '[{"email":"spepper@purplecarrot.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (288, 'Pepper Sophie', 'Pepper', 'Sophie', 886, '[{"email":"aparks-fried@purplecarrot.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (289, 'Suski Ivan', 'Suski', 'Ivan', 896, '[{"email":"i.suski@rational-online.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (290, 'Kastelz Jckie', 'Kastelz', 'Jckie', 900, '[{"email":"jacquelinek@edgefeld.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (291, 'Ames Elliott', 'Ames', 'Elliott', 907, '[{"email":"eames@rewardnetwork.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (292, 'Sutton Silas', 'Sutton', 'Silas', 910, '[{"email":"richway@honestmtg.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (293, 'Rob And Abby', 'Rob And', 'Abby', 920, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (294, 'Batus Kevin', 'Batus', 'Kevin', 921, '[{"email":"roccitybarandgrill@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (295, 'Monroe Mell', 'Monroe', 'Mell', 924, '[{"email":"angmell@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (296, 'Rugiero Patrick', 'Rugiero', 'Patrick', 927, '[{"email":"parugiero@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (297, 'Jones', NULL, 'Jones', 929, '[]'::jsonb, '[]'::jsonb, 'Ceo', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (298, 'Joe Flamm', 'Joe', 'Flamm', 933, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (299, 'Jim Drewenski Alberto', 'Jim Drewenski', 'Alberto', 936, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (300, 'Exec John Rudolph', 'Exec John', 'Rudolph', 938, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, '66 W. Kinsey Street, Chicago, Illinois', 'Chicago', NULL, NULL, 'USA', NULL, NULL),
  (301, 'Rashid', NULL, 'Rashid', 941, '[{"email":"rumifalafel@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (302, 'Johnson', NULL, 'Johnson', 948, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (303, 'Latman', NULL, 'Latman', 948, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (304, 'Barakat Suheir', 'Barakat', 'Suheir', 949, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (305, 'Groce Alex', 'Groce', 'Alex', 953, '[{"email":"alexgrocefa@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (306, 'Cec, Cca, Pcii Brian Taborski', 'Cec, Cca, Pcii Brian', 'Taborski', 957, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Please call on me ..several locations and catering. Tentori doesn''t work there. New lead: Tentori works at GT Prime Steakhouse.'),
  (307, 'Jesse Ayello Patrick Obrien', 'Jesse Ayello Patrick', 'Obrien', 960, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (308, 'Hassan', NULL, 'Hassan', 964, '[]'::jsonb, '[]'::jsonb, 'President', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (309, 'Creative Eats Officer Policarpio', 'Creative Eats Officer', 'Policarpio', 966, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (310, 'Carvajal Ismael', 'Carvajal', 'Ismael', 976, '[{"email":"ismael.carvajal@marriott.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (311, 'Joe Spretnjak Exec', 'Joe Spretnjak', 'Exec', 985, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (312, 'Gleim Eric', 'Gleim', 'Eric', 990, '[{"email":"eric.gleim@usfoods.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (313, 'Firkus Drew', 'Firkus', 'Drew', 992, '[{"email":"skyclubsupperclub@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (314, 'Co- Erkenswick', 'Co-', 'Erkenswick', 995, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (315, 'John And A Karen Shields', 'John And A Karen', 'Shields', 1001, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (316, 'Sasha Chris', 'Sasha', 'Chris', 1003, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (317, 'Chefs John Mclean Martin Murch', 'Chefs John Mclean Martin', 'Murch', 1004, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (318, 'Mac', NULL, 'Mac', 1004, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (319, 'Lee Jake', 'Lee', 'Jake', 1008, '[{"email":"sojubbqhouse@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (320, 'D''Andre Carter And Heather Bublick', 'D''Andre Carter And Heather', 'Bublick', 1010, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (321, 'Seay', NULL, 'Seay', 1011, '[{"email":"sojubbqhouse@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (322, 'Vlahos Themis', 'Vlahos', 'Themis', 1012, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (323, 'General Dame', 'General', 'Dame', 1014, '[{"email":"giannigrvl21@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (324, 'Lakhani Farhan', 'Lakhani', 'Farhan', 1023, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (325, 'Greco', NULL, 'Greco', 1026, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (326, 'Greco', NULL, 'Greco', 1027, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (327, 'Tom Domenico', 'Tom', 'Domenico', 1027, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (328, 'Ryan Smith', 'Ryan', 'Smith', 1031, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (329, 'Christine Demacapoulos', 'Christine', 'Demacapoulos', 1033, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (330, 'Jim Drewenski Suzanne Tim', 'Jim Drewenski Suzanne', 'Tim', 1035, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (331, 'Brian Mish Dave', 'Brian Mish', 'Dave', 1036, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (332, 'Brooks', NULL, 'Brooks', 1040, '[{"email":"tbrooks33@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (333, 'Todd', NULL, 'Todd', 1040, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (334, 'L Ustick', 'L', 'Ustick', 1046, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (335, 'Brad', NULL, 'Brad', 1048, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (336, 'Roy Wric', 'Roy', 'Wric', NULL, '[{"email":"ericroyjr@surfsupfranchising.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (337, 'Sthay Molly', 'Sthay', 'Molly', 1053, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (338, 'Mellender Chris', 'Mellender', 'Chris', 1055, '[{"email":"chris.mellender@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (339, 'Tamewitz Ashley', 'Tamewitz', 'Ashley', 1057, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (340, 'John, It,, Nick Mike Hemingermiranda', 'John, It,, Nick', 'Mike Hemingermiranda', 1072, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (341, 'Juju', NULL, 'Juju', 1073, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (342, 'Mike Heminger Rick', 'Mike Heminger', 'Rick', 1074, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (343, 'Mata', NULL, 'Mata', 1079, '[{"email":"emata@texascorralmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (344, 'Switzer Paul', 'Switzer', 'Paul', 1079, '[{"email":"pswitzer@texascorralmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (345, 'Jim Mitchell', 'Jim', 'Mitchell', 1081, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (346, 'Anthony', NULL, 'Anthony', 1083, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (347, 'Salnave Erick', 'Salnave', 'Erick', 1085, '[{"email":"erick@cliff-chicago.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (348, 'Irish Jennifer', 'Irish', 'Jennifer', 1088, '[{"email":"jenirish@comcast.net","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (349, 'General Payerli', 'General', 'Payerli', 1090, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (350, 'Posan Lauren', 'Posan', 'Lauren', 1092, '[{"email":"lposa@thefarmacygb.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (351, 'Lee Virginia', 'Lee', 'Virginia', 1093, '[{"email":"virginiaalee7@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (352, 'Howell Rochelle', 'Howell', 'Rochelle', 1099, '[{"email":"mycheftoo@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (353, 'Randy Waidner', 'Randy', 'Waidner', 759, '[{"email":"rwaidnwer@patiofoodgroup.com","type":"work"}]'::jsonb, '[{"number":"16302902433","type":"work"}]'::jsonb, 'Owner', NULL, '7216 W. 91st Street', 'Bridgeview', 'IL', '60455.0', 'USA', NULL, 'Both owners sons and Chef and Maria decision makers-20 TL 3/8"'),
  (354, 'Mariantagler', NULL, 'Mariantagler', 759, '[{"email":"mtagler@patiofoodgroup.com","type":"work"}]'::jsonb, '[{"number":"17082172400","type":"work"}]'::jsonb, 'Owner', NULL, '7216 W. 91st Street', 'Bridgeview', 'IL', '60455.0', 'USA', NULL, 'Both owners sons and Chef and Maria decision makers-20 TL 3/8"'),
  (355, 'Gfs/Abdale Eric', 'Gfs/Abdale', 'Eric', 1103, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (356, 'Usf Brian Mish Chris Pappas', 'Usf Brian Mish Chris', 'Pappas', 1104, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (357, 'Wallet Scott', 'Wallet', 'Scott', 1105, '[{"email":"scott.wallett@hilton.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (358, 'Account Cope', 'Account', 'Cope', 1106, '[{"email":"jcope@teamtrg.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (359, 'Tim', NULL, 'Tim', 1107, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (360, 'West Karrie', 'West', 'Karrie', 1110, '[{"email":"kostaaa@vaultfenton.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (361, 'Vanderpal Samantha', 'Vanderpal', 'Samantha', 1114, '[{"email":"svanderpal14@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (362, 'Joel Wolter', 'Joel', 'Wolter', 1115, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (363, 'Susanne Novak', 'Susanne', 'Novak', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (364, 'Moore Sharon', 'Moore', 'Sharon', NULL, '[{"email":"sharon@tillystearoom.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (365, 'Erin Schultz', 'Erin', 'Schultz', 1121, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (366, 'Joel Downs', 'Joel', 'Downs', 1121, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (367, 'Depaz Gerardo', 'Depaz', 'Gerardo', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (368, 'Ortiz Jesus', 'Ortiz', 'Jesus', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (369, 'Dalip', NULL, 'Dalip', 1123, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (370, 'Arzola Tory', 'Arzola', 'Tory', 1124, '[{"email":"ryan_arzola@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (371, 'Pfg Dave And Sister Cindy', 'Pfg Dave And Sister', 'Cindy', 1125, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (372, 'Karahalios Christine', 'Karahalios', 'Christine', 1127, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (373, 'Karahalios', NULL, 'Karahalios', 1127, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (374, 'West W.L.', 'West', 'W.L.', 1128, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (375, 'Chef And Williams', 'Chef And', 'Williams', NULL, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (376, 'Hunter French', 'Hunter', 'French', 1132, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (377, 'Turano G', 'Turano', 'G', 1134, '[{"email":"mturano@turano.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (378, 'Kline French', 'Kline', 'French', 1137, '[{"email":"mkline@uchicago.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (379, 'Brooks', NULL, 'Brooks', 1138, '[]'::jsonb, '[]'::jsonb, 'Director', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (380, 'Michael', NULL, 'Michael', 1138, '[]'::jsonb, '[]'::jsonb, 'Director', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (381, 'Uldrych', NULL, 'Uldrych', 1138, '[]'::jsonb, '[]'::jsonb, 'Director', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (382, 'Wang Zuoda', 'Wang', 'Zuoda', 1139, '[{"email":"zuodawang2017@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (383, 'Exec Chef Mike Hamm', 'Exec Chef Mike', 'Hamm', 1143, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (384, 'Telesky Gail', 'Telesky', 'Gail', 785, '[{"email":"mtelesky@uhc.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (385, 'Justin', NULL, 'Justin', 1147, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (386, 'Jones Ruth', 'Jones', 'Ruth', 1149, '[{"email":"simmonsk@illinois.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (387, 'Campus Executive Frank Turchan', 'Campus Executive Frank', 'Turchan', 1151, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (388, 'Culinary Assistant Of Catering Miller', 'Culinary Assistant Of Catering', 'Miller', 1151, '[]'::jsonb, '[]'::jsonb, 'Director', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (389, 'Dubis Michelle', 'Dubis', 'Michelle', 1154, '[{"email":"mmdubis@wisc.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (390, 'Potrawski Nicole', 'Potrawski', 'Nicole', 1156, '[{"email":"npotrawski@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (391, 'Johnson Tran''S', 'Johnson', 'Tran''S', 1157, '[{"email":"ptexasrus@sbcglobal.net","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (392, 'Bullinger Jane', 'Bullinger', 'Jane', 1161, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (393, 'Tong', NULL, 'Tong', 1161, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (394, 'Eckles Kris', 'Eckles', 'Kris', 1164, '[{"email":"kjeckles@wisc.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (395, 'Ecklor Jenny', 'Ecklor', 'Jenny', 1165, '[{"email":"ecklorj@uwstout.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (396, 'Petrouske Melissa', 'Petrouske', 'Melissa', 1165, '[{"email":"petrouskem@uwstout.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (397, 'Stephen Gillanders-Chef/', 'Stephen', 'Gillanders-Chef/', 1166, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (398, 'Jim Charlie', 'Jim', 'Charlie', 1168, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (399, 'Testa, Gfs Usf', 'Testa, Gfs', 'Usf', 1168, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (400, 'Beske John', 'Beske', 'John', 1175, '[{"email":"johnbeske@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (401, 'Rose Maria', 'Rose', 'Maria', 1176, '[{"email":"marla@veganstreet.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (402, 'Gfs/Abdale Beckley', 'Gfs/Abdale', 'Beckley', 1177, '[]'::jsonb, '[]'::jsonb, 'Gm', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (403, 'Thanopoulos Marianthi', 'Thanopoulos', 'Marianthi', 1180, '[{"email":"mthanopoulos@wheelingil.gov","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (404, 'Greco Bob Kara''S', 'Greco Bob', 'Kara''S', 1181, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (405, 'Brady Robert', 'Brady', 'Robert', 1182, '[{"email":"robertkdbrady@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (406, 'Erick Williams', 'Erick', 'Williams', 1184, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (407, 'Mike Janots', 'Mike', 'Janots', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (408, 'John Lipton, Trevor Fleming Chefs Emily Kraszk', 'John Lipton, Trevor Fleming', 'Chefs Emily Kraszk', 1195, '[]'::jsonb, '[{"number":"17735721622","type":"work"}]'::jsonb, 'Exec Chef', NULL, '3198 N. Milwaukee Ave., Chicago, IL', 'Chicago', NULL, NULL, 'USA', NULL, NULL),
  (409, 'Matsushima Paul', 'Matsushima', 'Paul', 1199, '[{"email":"pmatsushima@wscpantry.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (410, 'Paul Choker', 'Paul', 'Choker', 1201, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (411, 'Wynn Maisha', 'Wynn', 'Maisha', 1203, '[{"email":"mwynn@livetowynn.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (412, 'Brian Mish Diane Katie Jose', 'Brian Mish Diane Katie', 'Jose', 1206, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (413, 'Ankenbrandt Courtney', 'Ankenbrandt', 'Courtney', 1207, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (414, 'Van Ermen Layna', 'Van Ermen', 'Layna', 1209, '[{"email":"layna@wildgoosebar.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (415, 'Pierson James', 'Pierson', 'James', 1210, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (416, 'Davis Andrew', 'Davis', 'Andrew', 1213, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (417, 'Jesse Ayello Marco', 'Jesse Ayello', 'Marco', 1217, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (418, 'Maria Lazaro', 'Maria', 'Lazaro', 1219, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (419, 'Bryak', NULL, 'Bryak', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (420, 'Soria Frank', 'Soria', 'Frank', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (421, 'Abilgail', NULL, 'Abilgail', 1225, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (422, 'James', NULL, 'James', 1227, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (423, 'Arjay Liarakos', 'Arjay', 'Liarakos', 48, '[{"email":"aliarakos@artisanspecialtyfoods.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (424, 'Cory', NULL, 'Cory', 275, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (425, 'Brad', NULL, 'Brad', 275, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (426, 'Anna', NULL, 'Anna', 275, '[]'::jsonb, '[]'::jsonb, 'Poc (Point Of Contact)', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (427, 'Michelle Martinez', 'Michelle', 'Martinez', 1120, '[{"email":"michelle.martinez@usfoods.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (428, 'Dale', NULL, 'Dale', 1075, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (429, 'Greg Youra', 'Greg', 'Youra', 901, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Greg Youra positioning Waffle Fries'),
  (430, 'Matt Combs', 'Matt', 'Combs', 133, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (431, 'Terry Comer', 'Terry', 'Comer', 358, '[{"email":"terry@eurousa.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Intro Teams call set 12/9'),
  (432, 'Jennifer Baldwin', 'Jennifer', 'Baldwin', 56, '[{"email":"jennifer.baldwin@atlanticfoods.biz","type":"work"}]'::jsonb, '[{"number":"15136002267","type":"work"}]'::jsonb, 'Distributor Slot Decisionmaker', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (433, 'Lonnie', NULL, 'Lonnie', 56, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (434, 'Christine Manolakis', 'Christine', 'Manolakis', 56, '[{"email":"chistina@atlanticfoods.biz","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (435, 'Kristina Clark', 'Kristina', 'Clark', 56, '[{"email":"kristina.clark@atlanticfoods.biz","type":"work"}]'::jsonb, '[]'::jsonb, 'Executive', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (436, 'Ron Peterson', 'Ron', 'Peterson', 56, '[{"email":"ron.peterson@atlanticfoods.biz","type":"work"}]'::jsonb, '[{"number":"13308315946","type":"work"}]'::jsonb, 'Distributor Rep', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (437, 'Carl Chambers', 'Carl', 'Chambers', 267, '[{"email":"cchambers@crgdining.com","type":"work"}]'::jsonb, '[{"number":"18123275257","type":"work"}]'::jsonb, 'Exec Chef', NULL, '320 North Meridian St. Suite 101', 'Indianapolis', NULL, '46204.0', 'USA', NULL, NULL),
  (438, 'Corey Fuller', 'Corey', 'Fuller', 267, '[{"email":"cfuller@crgdining.com","type":"work"}]'::jsonb, '[{"number":"13173313179","type":"work"}]'::jsonb, 'Exec Chef', NULL, '320 North Meridian St. Suite 101', 'Indianapolis', NULL, '46204.0', 'USA', NULL, NULL),
  (439, 'Colin Hilton', 'Colin', 'Hilton', 267, '[{"email":"chilton@crgdining.com","type":"work"}]'::jsonb, '[{"number":"14159339231","type":"work"}]'::jsonb, 'Exec Chef', NULL, '530 Fulton Street, Suite 100', 'Indianapolis', NULL, '46202.0', 'USA', NULL, NULL),
  (440, 'Chetna', NULL, 'Chetna', 647, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (441, 'Jeff & Mike', 'Jeff &', 'Mike', 152, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (442, 'Nick Dostal', 'Nick', 'Dostal', 219, '[{"email":"ndostal@thechicagoclub.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (443, 'Bill Caldwell', 'Bill', 'Caldwell', 1144, '[{"email":"caldwell@ucco.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (444, 'Angie Conner', 'Angie', 'Conner', 1144, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (445, 'Norman Hargrove@Ulcc.Org', 'Norman', 'Hargrove@Ulcc.Org', 1142, '[{"email":"nhargrove@ulcc.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Poc (Point Of Contact)', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (446, 'Marco Bahena', 'Marco', 'Bahena', 1137, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (447, 'Angie Conner', 'Angie', 'Conner', 1094, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (448, 'Max Molinaro', 'Max', 'Molinaro', 934, '[{"email":"mmolinaro@chefswarehouse.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (449, 'Chris Eliopulis', 'Chris', 'Eliopulis', 1058, '[{"email":"chris.eliopulis@sysco.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Slot Decisionmaker', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (450, 'Megan', NULL, 'Megan', 1076, '[{"email":"meganc@testaproduce.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Slot Decisionmaker', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (451, 'Joe Fitzgerald', 'Joe', 'Fitzgerald', 706, '[{"email":"joef@midwestfoods.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Poc (Point Of Contact)', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (452, 'David Tallent', 'David', 'Tallent', NULL, '[{"email":"jotallen@iu.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (453, 'Harry Greene', 'Harry', 'Greene', NULL, '[{"email":"hgreene@piazzaproduce.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Slot Decisionmaker', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (454, 'Paul Bova', 'Paul', 'Bova', NULL, '[{"email":"pbova@piazzaproduce.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Poc (Point Of Contact)', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (455, 'Jose Solis', 'Jose', 'Solis', 786, '[]'::jsonb, '[{"number":"17732894273","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (456, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (457, 'Billy Mix', 'Billy', 'Mix', 543, '[]'::jsonb, '[{"number":"12198082853","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (458, 'Zachary Dlezal', 'Zachary', 'Dlezal', 327, '[]'::jsonb, '[{"number":"18153569980","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (459, 'Michael Nelson', 'Michael', 'Nelson', 1097, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (460, 'Kyle Wasserott', 'Kyle', 'Wasserott', 1161, '[{"email":"kyle.wasserott@usfoods.com","type":"work"}]'::jsonb, '[{"number":"12197989362","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (461, 'Chris Pavlou', 'Chris', 'Pavlou', 807, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Presented Poke and Frites to Chris. In front of GS DM and DSR Mike and Rob'),
  (462, 'Louis-Radius', NULL, 'Louis-Radius', 807, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Presented Poke and Frites to Chris. In front of GS DM and DSR Mike and Rob'),
  (463, 'Edward-Maple', NULL, 'Edward-Maple', 807, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Presented Poke and Frites to Chris. In front of GS DM and DSR Mike and Rob'),
  (464, 'Eddie', NULL, 'Eddie', 130, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (465, 'Nick Albanos', 'Nick', 'Albanos', 22, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (466, 'Manny', NULL, 'Manny', 1197, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, '1503 s michigan ave', NULL, NULL, NULL, 'USA', NULL, NULL),
  (467, 'Daniel Gutierrez', 'Daniel', 'Gutierrez', 1197, '[]'::jsonb, '[{"number":"16307460895","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (468, 'Daniel Gutierrez', 'Daniel', 'Gutierrez', 741, '[]'::jsonb, '[{"number":"16307460895","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (469, 'Primo', NULL, 'Primo', 741, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, '3849 w 26th st', NULL, NULL, NULL, 'USA', NULL, NULL),
  (470, 'Lupe Gonzalez', 'Lupe', 'Gonzalez', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (471, 'Rebecca', NULL, 'Rebecca', 241, '[]'::jsonb, '[{"number":"16055951636","type":"work"}]'::jsonb, 'Manager', NULL, '13148 rivercrerst Dr', NULL, NULL, NULL, 'USA', NULL, NULL),
  (472, 'Steve Testa', 'Steve', 'Testa', 1076, '[{"email":"stevet@testaproduce.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Slot Decisionmaker', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (473, 'Jamie Moore', 'Jamie', 'Moore', 802, '[{"email":"jmoore@parkhurstdining.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, 'Pittsburgh', NULL, NULL, 'USA', NULL, 'Submitted USF coded and all Abdale/MFB items for review'),
  (474, 'Unknown', NULL, NULL, 223, '[]'::jsonb, '[]'::jsonb, NULL, NULL, '2333 N Milwaukee Ave', 'Chicago', 'IL', '60647.0', 'USA', NULL, NULL),
  (475, 'Pasha Volokh', 'Pasha', 'Volokh', 643, '[]'::jsonb, '[{"number":"15022896464","type":"work"}]'::jsonb, 'Owner', NULL, '1812 W Muhammad Ali Blvd', 'Louisville', 'KY', '40203.0', 'USA', NULL, 'will give sample a Annasea to owner who has 5 locations'),
  (476, 'Kyle/Colby', NULL, 'Kyle/Colby', 509, '[{"email":"hogwildoaklawn@gmail.com","type":"work"}]'::jsonb, '[{"number":"17085814950","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (477, 'Unknown', NULL, NULL, 161, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (478, 'Josh And Katie', 'Josh And', 'Katie', 411, '[]'::jsonb, '[{"number":"12707997784","type":"work"}]'::jsonb, 'Owner', NULL, '3278 Nashville Rd', 'Bowling Green', 'KY', NULL, 'USA', NULL, 'Drop off samples.of Annasea'),
  (479, 'Thomas And Mario', 'Thomas And', 'Mario', 425, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, '1566 w ogden ave', 'naperville', 'IL', NULL, 'USA', NULL, 'Visited the Worth location & the owner told me the 2nd location is in naperville owned by Thomas & Mario. Has a U.S food Rep'),
  (480, 'Xavier', NULL, 'Xavier', NULL, '[]'::jsonb, '[{"number":"17089407232","type":"work"}]'::jsonb, 'Sous Chef', NULL, '15101 Dixie Hwy', 'Harvey', 'IL', NULL, 'USA', NULL, 'Warm lead that wants to see Kaufhold''s Kurds'),
  (481, 'Nick Byanski', 'Nick', 'Byanski', 454, '[{"email":"nick.byanski@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (482, 'Bill Barker', 'Bill', 'Barker', 454, '[{"email":"bill.barker@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (483, 'Pat Lyons', 'Pat', 'Lyons', 454, '[{"email":"pat.lyons@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (484, 'Lauren Frazier', 'Lauren', 'Frazier', 454, '[{"email":"lauren.frazier@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (485, 'Stephen Hess', 'Stephen', 'Hess', 454, '[{"email":"stephen.hess@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (486, 'Freddy Sheir', 'Freddy', 'Sheir', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (487, 'Megan Punches', 'Megan', 'Punches', 454, '[{"email":"megan.punches@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (488, 'Mike Hiskes', 'Mike', 'Hiskes', 454, '[{"email":"mike.hiskes@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (489, 'Rob Renninger', 'Rob', 'Renninger', 454, '[{"email":"rob.renninger@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (490, 'Rachel Sohovich', 'Rachel', 'Sohovich', 454, '[{"email":"rachel.sohovich@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (491, 'Matt Stielow', 'Matt', 'Stielow', 454, '[{"email":"matt.stielow@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (492, 'Mike Hiskes', 'Mike', 'Hiskes', 454, '[{"email":"stephen.hess@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (493, 'Dennis Mitchell', 'Dennis', 'Mitchell', 820, '[{"email":"dennis.mitchell@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Recieved a response from Deniss Mitchell that a "sales" or "district" meeting on Feb 7th.'),
  (494, 'Alissa Jeffery', 'Alissa', 'Jeffery', 212, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (495, 'Jennifer Fried', 'Jennifer', 'Fried', 1076, '[{"email":"jenniferf@testaproduce.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (496, 'Cheryl Bauer', 'Cheryl', 'Bauer', 1153, '[{"email":"cbauer@nd.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (497, 'Mason Upton', 'Mason', 'Upton', 1155, '[{"email":"mason@uppercrust.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (498, 'Matt Regula', 'Matt', 'Regula', 75, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (499, 'Mike Roper', 'Mike', 'Roper', 198, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (500, 'Delaney Mccarrey', 'Delaney', 'Mccarrey', 623, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (501, 'Frank Turchan', 'Frank', 'Turchan', 1151, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (502, 'Brad Dempsey', 'Brad', 'Dempsey', 1048, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (503, 'Chad Neer', 'Chad', 'Neer', 304, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (504, 'Jeff Hall', 'Jeff', 'Hall', 1059, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (505, 'Sheena Hawkins', 'Sheena', 'Hawkins', 573, '[]'::jsonb, '[]'::jsonb, NULL, NULL, '9722 Parkway Drive', 'highland', 'IN', '46322.0', 'USA', NULL, 'HPS'),
  (506, 'Syreeta Hawkins', 'Syreeta', 'Hawkins', 573, '[]'::jsonb, '[]'::jsonb, 'Sous Chef', NULL, '9722 Parkway Drive', 'highland', 'IN', '46322.0', 'USA', NULL, 'hps'),
  (507, 'Angel Perry', 'Angel', 'Perry', 573, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, '9722 Parkway Drive', 'highland', 'IN', '46322.0', 'USA', NULL, 'hos'),
  (508, 'Tianna Johnson', 'Tianna', 'Johnson', 573, '[]'::jsonb, '[]'::jsonb, 'Executive', NULL, '9722 Parkway Drive', 'highland', 'IN', '46322.0', 'USA', NULL, 'hos'),
  (509, 'Nicole Ward', 'Nicole', 'Ward', 573, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, '9722 Parkway Drive', 'highland', 'IN', '46322.0', 'USA', NULL, 'hos'),
  (510, 'Jorge Esparza', 'Jorge', 'Esparza', 1021, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, '924 Green Bay Rd', 'Wilmette', 'IL', NULL, 'USA', NULL, NULL),
  (511, 'Stephan Grey', 'Stephan', 'Grey', 1089, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, '3137 W Logan Blvd', 'Chicago', 'IL', '60647.0', 'USA', NULL, NULL),
  (512, 'Antonio Herrera', 'Antonio', 'Herrera', 484, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, '5503 W Cermak Rd', 'Cicero', 'IL', '60804.0', 'USA', NULL, NULL),
  (513, 'Chris Gonsowski', 'Chris', 'Gonsowski', 535, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (514, 'Antonio Demacopoulos', 'Antonio', 'Demacopoulos', 1033, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (515, 'Roger Kuehn', 'Roger', 'Kuehn', 1212, '[]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (516, 'Shane Farzad', 'Shane', 'Farzad', 1212, '[]'::jsonb, '[]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (517, 'Eric Gillish', 'Eric', 'Gillish', 710, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (518, 'Dino', NULL, 'Dino', 1077, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (519, 'Unknown', NULL, NULL, 214, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (520, 'Jared', NULL, 'Jared', 501, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (521, 'Drew', NULL, 'Drew', 876, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (522, 'Sam Butler', 'Sam', 'Butler', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (523, 'Chad Bruinslott', 'Chad', 'Bruinslott', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (524, 'Tim Gernatt', 'Tim', 'Gernatt', 1048, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (525, 'Eric Prall', 'Eric', 'Prall', 1048, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (526, 'Tom Fredrick', 'Tom', 'Fredrick', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (527, 'Patrick Shaw', 'Patrick', 'Shaw', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (528, 'Ryan Bennick', 'Ryan', 'Bennick', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (529, 'Unknown', NULL, NULL, 153, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (530, 'Unknown', NULL, NULL, 1215, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (531, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (532, 'Unknown', NULL, NULL, 102, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (533, 'Unknown', NULL, NULL, 517, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (534, 'Unknown', NULL, NULL, 621, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (535, 'Unknown', NULL, NULL, 106, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (536, 'Unknown', NULL, NULL, 968, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (537, 'Unknown', NULL, NULL, 476, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (538, 'Unknown', NULL, NULL, 280, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (539, 'Unknown', NULL, NULL, 1042, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (540, 'Unknown', NULL, NULL, 494, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (541, 'Sue And Tim', 'Sue And', 'Tim', 53, '[{"email":"newt3013@yahoo.com","type":"work"}]'::jsonb, '[{"number":"17083885520","type":"work"}]'::jsonb, 'Owner', NULL, '4901 cal sag rd', 'Crestwood', 'IL', '60445.0', 'USA', NULL, NULL),
  (542, 'Emily', NULL, 'Emily', 1102, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, '12713 cal sag rd', 'Crestwood', 'IL', '60445.0', 'USA', NULL, NULL),
  (543, 'George And Tim', 'George And', 'Tim', 780, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, '6159 w 159th st', 'Oak Forest', 'IL', '60452.0', 'USA', NULL, NULL),
  (544, 'Javier', NULL, 'Javier', 1091, '[]'::jsonb, '[{"number":"17089407232","type":"work"}]'::jsonb, 'Sous Chef', NULL, '15101 Dixie Hwy', 'Harvey', 'IL', '60426.0', 'USA', NULL, NULL),
  (545, 'Emma Swift', 'Emma', 'Swift', 820, '[{"email":"emma.swift@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (546, 'Demetrio Kyprianos', 'Demetrio', 'Kyprianos', 761, '[{"email":"demetrios.kyprianos@compass-usa.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (547, 'Jene Braden', 'Jene', 'Braden', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (548, 'Sherri Brown', 'Sherri', 'Brown', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (549, 'Dana Kinsman', 'Dana', 'Kinsman', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (550, 'Brandon Girard', 'Brandon', 'Girard', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (551, 'Michael Schultz', 'Michael', 'Schultz', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (552, 'Darryl White', 'Darryl', 'White', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (553, 'Miranda Heinrich', 'Miranda', 'Heinrich', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (554, 'Derek Winter', 'Derek', 'Winter', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (555, 'Philip Bakousidis', 'Philip', 'Bakousidis', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (556, 'Michael Gunderson', 'Michael', 'Gunderson', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (557, 'Jasen Anthony', 'Jasen', 'Anthony', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (558, 'Jodi Ward', 'Jodi', 'Ward', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (559, 'Paula Ball', 'Paula', 'Ball', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (560, 'Kevin Green', 'Kevin', 'Green', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (561, 'Patrick Kaufman', 'Patrick', 'Kaufman', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (562, 'Christine Michel', 'Christine', 'Michel', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'Flint', 'MI', NULL, 'USA', NULL, 'Flint District sales meeting 1/16 for BB amd LL'),
  (563, 'Eric Gillish', 'Eric', 'Gillish', 709, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'presented annasea, Frites St., Kaufholds, Kenja, and land lovers and better balance'),
  (564, 'Dino', NULL, 'Dino', 1078, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'presented annasea, Frites St., Kaufholds, Kenja, and land lovers and better balance'),
  (565, 'Matt', NULL, 'Matt', 1096, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'presented annasea, Frites St., Kaufholds, Kenja, and land lovers and better balance'),
  (566, 'Jeff Shaver', 'Jeff', 'Shaver', 980, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'presented annasea, Frites St., Kaufholds, Kenja, and land lovers and better balance'),
  (567, 'Andrew Francisco', 'Andrew', 'Francisco', 1201, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'presented annasea, Frites St., Kaufholds, Kenja, and land lovers and better balance'),
  (568, 'Emily Hazel Mitchell', 'Emily Hazel', 'Mitchell', 1201, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'presented annasea, Frites St., Kaufholds, Kenja, and land lovers and better balance'),
  (569, 'Larry Flynn', 'Larry', 'Flynn', 1201, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'presented annasea, Frites St., Kaufholds, Kenja, and land lovers and better balance'),
  (570, 'Paul Choker', 'Paul', 'Choker', 1201, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'presented annasea, Frites St., Kaufholds, Kenja, and land lovers and better balance'),
  (571, 'Kevin Green', 'Kevin', 'Green', 454, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (572, 'Sam Butler', 'Sam', 'Butler', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (573, 'Dave Hampel', 'Dave', 'Hampel', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (574, 'Ryan Treharne', 'Ryan', 'Treharne', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (575, 'Chad Bruinsslot', 'Chad', 'Bruinsslot', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (576, 'Eric Prall', 'Eric', 'Prall', 1048, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (577, 'Tim Gernaat', 'Tim', 'Gernaat', 1048, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (578, 'Dave Pestrak', 'Dave', 'Pestrak', 899, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (579, 'Tim', NULL, 'Tim', 1118, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (580, 'Dan Kurczak', 'Dan', 'Kurczak', 392, '[{"email":"dan@fortunefishco.net","type":"work"}]'::jsonb, '[{"number":"16302631130","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (581, 'Nikki Goodman', 'Nikki', 'Goodman', 822, '[{"email":"nikki.goodman@pfgc.com","type":"work"}]'::jsonb, '[{"number":"12707999274","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (582, 'Shawn Duggan', 'Shawn', 'Duggan', 822, '[{"email":"shawn.duggan@pfgc.com","type":"work"}]'::jsonb, '[{"number":"14234923504","type":"work"}]'::jsonb, 'Distributor Slot Decisionmaker', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (583, 'Kevin Junior', 'Kevin', 'Junior', 823, '[{"email":"kevin.junior@pfgc.com","type":"work"}]'::jsonb, '[{"number":"15024450574","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (584, 'Michael Warren', 'Michael', 'Warren', 823, '[{"email":"michael.warren@pfgc.com","type":"work"}]'::jsonb, '[{"number":"16062602754","type":"work"}]'::jsonb, 'Distributor Slot Decisionmaker', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (585, 'Brad Tracy', 'Brad', 'Tracy', 1007, '[{"email":"brad.tracy@sofofoods.com","type":"work"}]'::jsonb, '[{"number":"15026401512","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (586, 'Mike Saltzstein', 'Mike', 'Saltzstein', 1007, '[{"email":"mike.saltzstein@sofofoods.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (587, 'Ken Siegers', 'Ken', 'Siegers', 795, '[{"email":"ken@panchofoods.com","type":"work"}]'::jsonb, '[{"number":"17084293260","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (588, 'Matt Regula', 'Matt', 'Regula', 75, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, 'Brea', 'OH', NULL, 'USA', NULL, NULL),
  (589, 'Mark Burkhalter', 'Mark', 'Burkhalter', 454, '[{"email":"mark.burkhalter@gfs.com","type":"work"}]'::jsonb, '[{"number":"12709965195","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (590, 'Tiffany Baxter', 'Tiffany', 'Baxter', 1019, '[{"email":"spillwaybg@yahoo.com","type":"work"}]'::jsonb, '[{"number":"12708429397","type":"work"}]'::jsonb, 'Owner', NULL, '2195 River St', 'Bowling Green', 'KY', NULL, 'USA', NULL, NULL),
  (591, 'Clint Logan', 'Clint', 'Logan', 1204, '[]'::jsonb, '[{"number":"15024710439","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (592, 'Keith Schlosser', 'Keith', 'Schlosser', 1140, '[]'::jsonb, '[{"number":"18006881967","type":"work"}]'::jsonb, 'Owner', NULL, '406 N Estill Ave', 'Richmond', 'KY', '40476.0', 'USA', NULL, NULL),
  (593, 'Ched Brent', 'Ched', 'Brent', 51, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (594, 'Pauley', NULL, 'Pauley', 954, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (595, 'Jeremymmclain@Gmail.Som', NULL, 'Jeremymmclain@Gmail.Som', 954, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (596, 'Alexvaldez@Gmail.Com', NULL, 'Alexvaldez@Gmail.Com', 954, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (597, 'Joe Stauffer', 'Joe', 'Stauffer', 293, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, 'Independence', 'OH', NULL, 'USA', NULL, NULL),
  (598, 'Unknown', NULL, NULL, 994, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (599, 'Peter Shuey', 'Peter', 'Shuey', 768, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (600, 'Peter Shuey', 'Peter', 'Shuey', 880, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (601, 'Peter Shuey', 'Peter', 'Shuey', 74, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (602, 'Peter Shuey', 'Peter', 'Shuey', 445, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (603, 'Peter Shuey', 'Peter', 'Shuey', 1095, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (604, 'On Ja Lee Lashat', 'On Ja Lee', 'Lashat', NULL, '[]'::jsonb, '[{"number":"17739726543","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (605, 'Chris Swidergal', 'Chris', 'Swidergal', NULL, '[{"email":"chris.swidergal@factor75.com","type":"work"}]'::jsonb, '[{"number":"17087434125","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, 'Burr Ridge', 'IL', '60527.0', 'USA', NULL, 'He directed us to Kate Healy /Kate.healy@hellofresh.com / Director of Procurement'),
  (606, 'Kate Healy', 'Kate', 'Healy', 498, '[{"email":"kate.healy@hellofresh.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (607, 'Heather Yanta', 'Heather', 'Yanta', 454, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, 'grand rapids', 'MI', NULL, 'USA', NULL, 'catman for vegan per Kim of BB'),
  (608, 'Sam Butler Gfs', 'Sam Butler', 'Gfs', 835, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'grand rapids', 'MI', NULL, 'USA', NULL, 'Sam dropped off BB nd LL samples 1/27'),
  (609, 'Tyler Bruesewitz', 'Tyler', 'Bruesewitz', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (610, 'Stacey Stangarone', 'Stacey', 'Stangarone', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (611, 'Gretchen Ernst', 'Gretchen', 'Ernst', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (612, 'Frank Davis', 'Frank', 'Davis', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (613, 'Stephen Krueger', 'Stephen', 'Krueger', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (614, 'Ben Oleari', 'Ben', 'Oleari', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (615, 'Unknown', NULL, NULL, 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (616, 'Jessica Hood', 'Jessica', 'Hood', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (617, 'Sabrina Ball', 'Sabrina', 'Ball', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (618, 'Curt Kittel', 'Curt', 'Kittel', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (619, 'Colleen Barrett', 'Colleen', 'Barrett', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (620, 'Ryan Bennink', 'Ryan', 'Bennink', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (621, 'Michael Gunderson', 'Michael', 'Gunderson', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (622, 'Jene Braden', 'Jene', 'Braden', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (623, 'Sam Butler', 'Sam', 'Butler', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (624, 'Dean Rapp', 'Dean', 'Rapp', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (625, 'Jennifer Fried', 'Jennifer', 'Fried', 1076, '[{"email":"jenniferf@testaproduce.com","type":"work"}]'::jsonb, '[{"number":"13123881936","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (626, 'Kristen Hettinga', 'Kristen', 'Hettinga', 1076, '[{"email":"kristenh@testaproduce.com","type":"work"}]'::jsonb, '[{"number":"13127354069","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (627, 'Trevor', NULL, 'Trevor', 52, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (628, 'Adam Bliter', 'Adam', 'Bliter', 52, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (629, 'Elton', NULL, 'Elton', 363, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (630, 'Rachel', NULL, 'Rachel', 1084, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (631, 'Josh Owens', 'Josh', 'Owens', 1084, '[]'::jsonb, '[]'::jsonb, 'Poc (Point Of Contact)', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (632, 'Caroline Anderson', 'Caroline', 'Anderson', 757, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, NULL),
  (633, 'Robin Hadnett', 'Robin', 'Hadnett', 1163, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, NULL),
  (634, 'Clifton Riddle', 'Clifton', 'Riddle', 1163, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, NULL),
  (635, 'Catherine Bush', 'Catherine', 'Bush', 1163, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, NULL),
  (636, 'John Foster', 'John', 'Foster', 1163, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, NULL),
  (637, 'Paul', NULL, 'Paul', 1044, '[]'::jsonb, '[]'::jsonb, 'Sous Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (638, 'Rachel', NULL, 'Rachel', 831, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (639, 'Kristen Hettinga', 'Kristen', 'Hettinga', 1076, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (640, 'Quoc', NULL, 'Quoc', 613, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (641, 'Jason', NULL, 'Jason', 437, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (642, 'Brendon', NULL, 'Brendon', 437, '[]'::jsonb, '[]'::jsonb, 'Sous Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (643, 'Elaina Vazquez', 'Elaina', 'Vazquez', 1126, '[]'::jsonb, '[{"number":"12245055384","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (644, 'Willy/Debbie', NULL, 'Willy/Debbie', 619, '[]'::jsonb, '[]'::jsonb, 'Sous Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (645, 'Angel', NULL, 'Angel', 100, '[]'::jsonb, '[{"number":"17734145239","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (646, 'Aaron, Rachel Louise', 'Aaron, Rachel', 'Louise', 1087, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (647, 'Sophie Plakias', 'Sophie', 'Plakias', 748, '[]'::jsonb, '[{"number":"17088223218","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (648, 'Islam Gashi', 'Islam', 'Gashi', NULL, '[]'::jsonb, '[{"number":"18128558740","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (649, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18128555290","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (650, '"Missy" Melissa Schrader', '"Missy" Melissa', 'Schrader', 575, '[]'::jsonb, '[{"number":"17855326453","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (651, 'Mary Molt', 'Mary', 'Molt', 575, '[]'::jsonb, '[{"number":"17855326482","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (652, 'Kevin Cruz', 'Kevin', 'Cruz', 701, '[]'::jsonb, '[{"number":"15173551947","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (653, 'Brenda Nelson', 'Brenda', 'Nelson', 701, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (654, 'Rajeev Patgaonkar', 'Rajeev', 'Patgaonkar', 701, '[]'::jsonb, '[{"number":"15174020499","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (655, 'Rebecca Selesky', 'Rebecca', 'Selesky', 701, '[]'::jsonb, '[{"number":"15178840660","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (656, 'Casey Rae', 'Casey', 'Rae', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (657, 'Mr. Eric Barker', 'Mr. Eric', 'Barker', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (658, 'Bin An', 'Bin', 'An', 764, '[]'::jsonb, '[{"number":"15746317253","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (659, 'Eddie Hernandez', 'Eddie', 'Hernandez', 764, '[]'::jsonb, '[{"number":"15746317253","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (660, 'Matt Paisley', 'Matt', 'Paisley', 770, '[]'::jsonb, '[{"number":"15132547248","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (661, 'Frank Pazzanese', 'Frank', 'Pazzanese', 770, '[]'::jsonb, '[{"number":"15106122991","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (662, 'Sonny Rodriguez *', 'Sonny Rodriguez', '*', 842, '[]'::jsonb, '[{"number":"13617395573","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (663, 'Art Martinez', 'Art', 'Martinez', 1028, '[]'::jsonb, '[{"number":"13203633490","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (664, 'Anthony Finnestad', 'Anthony', 'Finnestad', 1028, '[]'::jsonb, '[{"number":"13203632706","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (665, 'Mary Binsfeld', 'Mary', 'Binsfeld', 1028, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (666, 'Naveen Rajagopal', 'Naveen', 'Rajagopal', 1098, '[]'::jsonb, '[{"number":"16142928380","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (667, 'Jadii Joseph', 'Jadii', 'Joseph', 1133, '[]'::jsonb, '[{"number":"15049572883","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (668, 'John Lange', 'John', 'Lange', 1133, '[]'::jsonb, '[{"number":"14048242460","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (669, 'Sean Mcmahon', 'Sean', 'Mcmahon', 1133, '[]'::jsonb, '[{"number":"12547104743","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (670, 'Andrew Cook', 'Andrew', 'Cook', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (671, 'Martin Folk', 'Martin', 'Folk', 1151, '[]'::jsonb, '[{"number":"17347645592","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (672, 'Chris Bernardi', 'Chris', 'Bernardi', 1161, '[{"email":"chris.bernardi@usfoods.com","type":"work"}]'::jsonb, '[{"number":"18136202831","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (673, 'Mr. Kyle Dearden', 'Mr. Kyle', 'Dearden', 1161, '[{"email":"kyle.dearden@usfoods.com","type":"work"}]'::jsonb, '[{"number":"18019173061","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (674, 'Mark David Garritson', 'Mark David', 'Garritson', 1161, '[{"email":"mark.garritson@usfoods.com","type":"work"}]'::jsonb, '[{"number":"16309154479","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (675, 'Maurice Broughton', 'Maurice', 'Broughton', 1161, '[{"email":"maurice.broughton@usfoods.com","type":"work"}]'::jsonb, '[{"number":"14044031905","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (676, 'Mischa Collins', 'Mischa', 'Collins', 1161, '[{"email":"mischa.collins@usfoods.com","type":"work"}]'::jsonb, '[{"number":"12056015902","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (677, 'Dougles Best', 'Dougles', 'Best', 1172, '[{"email":"douglas.e.best@vanderbilt.edu","type":"work"}]'::jsonb, '[{"number":"16153222999","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (678, 'Joshua Smith', 'Joshua', 'Smith', 1172, '[{"email":"joshua.v.smith@vanderbilt.edu","type":"work"}]'::jsonb, '[{"number":"15019188600","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (679, 'Maria Portelli', 'Maria', 'Portelli', 1172, '[{"email":"maria.portelli@vanderbilt.edu","type":"work"}]'::jsonb, '[{"number":"16153222999","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (680, 'Sean Carroll', 'Sean', 'Carroll', 1172, '[{"email":"sean.carroll@vanderbilt.edu","type":"work"}]'::jsonb, '[{"number":"16153222999","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (681, 'Dan Ahern', 'Dan', 'Ahern', 1196, '[{"email":"daniel.aherin@wsu.edu","type":"work"}]'::jsonb, '[{"number":"15093351238","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (682, 'Howard Campbell', 'Howard', 'Campbell', 1196, '[{"email":"howard.campbell@wsu.edu","type":"work"}]'::jsonb, '[{"number":"15098796296","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (683, 'Scott Banacka', 'Scott', 'Banacka', 899, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Presented three lines wonder juice, Valley lavash, and rapid Rasoi'),
  (684, 'Andrew Caplinger', 'Andrew', 'Caplinger', 179, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, 'indianapolis', 'IN', NULL, 'USA', NULL, 'presented Annasea nd Kaufholds'),
  (685, 'Andrew Hubbell', 'Andrew', 'Hubbell', 1218, '[{"email":"info@yanceysbrewery.com","type":"work"}]'::jsonb, '[{"number":"12706292739","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (686, 'Johny Perez', 'Johny', 'Perez', 1022, '[]'::jsonb, '[{"number":"15308633228","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (687, 'Johny Perez', 'Johny', 'Perez', 798, '[]'::jsonb, '[{"number":"15308633228","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (688, 'Johny Perez', 'Johny', 'Perez', 685, '[]'::jsonb, '[{"number":"15308633238","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (689, 'Johny Perez', 'Johny', 'Perez', 326, '[]'::jsonb, '[{"number":"15308633228","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (690, 'Tom Loventhal', 'Tom', 'Loventhal', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (691, 'Panos', NULL, 'Panos', 64, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (692, 'Raven Williams', 'Raven', 'Williams', 513, '[{"email":"ravenw@honeyberrycafe.com","type":"work"}]'::jsonb, '[{"number":"13125830333","type":"work"}]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (693, 'Matt Smith', 'Matt', 'Smith', 513, '[{"email":"matts@honeyberrycafe.com","type":"work"}]'::jsonb, '[{"number":"18474271333","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (694, 'Eddie Matt', 'Eddie', 'Matt', 1111, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (695, 'Josh Lundvell', 'Josh', 'Lundvell', 1214, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (696, 'Curd', NULL, 'Curd', 1074, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (697, 'Andrew Hubbell', 'Andrew', 'Hubbell', 1218, '[{"email":"andrew@yancysky.com","type":"work"}]'::jsonb, '[{"number":"12706292739","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (698, 'Danny Williams', 'Danny', 'Williams', 374, '[{"email":"fineartbistroglasowky@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (699, 'Marcus', NULL, 'Marcus', 1211, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (700, 'Jarrod', NULL, 'Jarrod', 778, '[]'::jsonb, '[{"number":"12707925807","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (701, 'Tommy Rhodes', 'Tommy', 'Rhodes', 87, '[{"email":"tommy@barefootrepublic.org","type":"work"}]'::jsonb, '[{"number":"16155999683","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (702, 'Terry And Shannon', 'Terry And', 'Shannon', 237, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (703, 'Hannah Russell', 'Hannah', 'Russell', 1178, '[]'::jsonb, '[{"number":"12709012121","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (704, 'Jae Craycraft', 'Jae', 'Craycraft', 822, '[{"email":"jae.craycraft@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (705, 'Traci Greenup', 'Traci', 'Greenup', 524, '[{"email":"traci.greenup@hthackney.com","type":"work"}]'::jsonb, '[{"number":"12704440695","type":"work"}]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (706, 'Edgar Maldonado', 'Edgar', 'Maldonado', 272, '[{"email":"emaldonado@crsonesource.com","type":"work"}]'::jsonb, '[{"number":"12706841469","type":"work"}]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (707, 'Robert(Bo) Ghee', 'Robert(Bo)', 'Ghee', 1060, '[{"email":"robert.gheejr@sysco.com","type":"work"}]'::jsonb, '[{"number":"12707913553","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (708, 'Gary Shelton', 'Gary', 'Shelton', 822, '[{"email":"gary.shelton@pfgc.com","type":"work"}]'::jsonb, '[{"number":"12707847940","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (709, 'Mark Burkhalter', 'Mark', 'Burkhalter', 454, '[{"email":"mark.burkhalter@gfs.com","type":"work"}]'::jsonb, '[{"number":"12709965195","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (710, 'Shawn Duggan', 'Shawn', 'Duggan', 822, '[{"email":"shawn.duggan@pfgc.com","type":"work"}]'::jsonb, '[{"number":"15024450574","type":"work"}]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (711, 'Jason Roller', 'Jason', 'Roller', 889, '[]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (712, 'Virginia Quintanilla', 'Virginia', 'Quintanilla', NULL, '[{"email":"virginiaquintanilla@dtmdistributors.com","type":"work"}]'::jsonb, '[{"number":"12703930160","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (713, 'Jack Gilbertson', 'Jack', 'Gilbertson', 21, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (714, 'Joe Ihl', 'Joe', 'Ihl', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (715, 'Freddy Sheir', 'Freddy', 'Sheir', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (716, 'Chad Bruinslott', 'Chad', 'Bruinslott', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (717, 'Erin Rogers', 'Erin', 'Rogers', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (718, 'Brittany Bradley', 'Brittany', 'Bradley', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (719, 'Kevin Skukalek', 'Kevin', 'Skukalek', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (720, 'Leslie Irvin', 'Leslie', 'Irvin', 203, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (721, 'Joe Smith', 'Joe', 'Smith', 987, '[]'::jsonb, '[{"number":"15134897044","type":"work"}]'::jsonb, 'Owner', NULL, '8322 E Kemper Rd', 'Cincinnati', 'OH', '45249.0', 'USA', NULL, NULL),
  (722, 'Matt Dalicandro', 'Matt', 'Dalicandro', 454, '[{"email":"matt.dalicandro@gfs.com","type":"work"}]'::jsonb, '[{"number":"15132597032","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (723, 'Joan Bauman', 'Joan', 'Bauman', 1147, '[{"email":"jbauman1@udayton.edu","type":"work"}]'::jsonb, '[{"number":"19372292446","type":"work"}]'::jsonb, 'Director Of Operations', NULL, 'Powerhouse 300 College Park', 'Dayton', 'OH', '45469.0', 'USA', 'Mike and Gary', NULL),
  (724, 'Ben Flores', 'Ben', 'Flores', 1098, '[{"email":"flores.552@osu.edu","type":"work"}]'::jsonb, '[{"number":"12516565540","type":"work"}]'::jsonb, 'Exec Chef', NULL, 'Office of Student Life. Dinning Serves. The Ohio Union 1739 North High Street', 'Columbus', 'OH', '43210.0', 'USA', 'Gary and Mike', NULL),
  (725, 'John Lathrop', 'John', 'Lathrop', 1082, '[{"email":"lathrop.36@osu.edu","type":"work"}]'::jsonb, '[{"number":"16142472710","type":"work"}]'::jsonb, 'Manager', NULL, '2110 Tuttle Park Place', 'Columbus', 'OH', '43210.0', 'USA', 'Gary', NULL),
  (726, 'Jack Gridley', 'Jack', 'Gridley', 312, '[{"email":"jgridley@dorothylane.com","type":"work"}]'::jsonb, '[{"number":"18667481391","type":"work"}]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (727, 'Larry Adkisson', 'Larry', 'Adkisson', 708, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (728, 'Renata Irving', 'Renata', 'Irving', 175, '[{"email":"rirving@cameronmitchell.com","type":"work"}]'::jsonb, '[{"number":"17408772220","type":"work"}]'::jsonb, 'Buyer', NULL, '390 W Nationwide Blvd Suite 300', 'Columbus', 'OH', '43215.0', 'USA', NULL, NULL),
  (729, 'Alec Bayman', 'Alec', 'Bayman', 1119, '[{"email":"bayman@tincaps.com","type":"work"}]'::jsonb, '[{"number":"12604072831","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (730, 'Jim Kokoowski', 'Jim', 'Kokoowski', 472, '[{"email":"jkokowski@pennmacfs.com","type":"work"}]'::jsonb, '[{"number":"14127607485","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (731, 'Nathan Williamson', 'Nathan', 'Williamson', 472, '[{"email":"nathan.williamson1@grecoandsons.com","type":"work"}]'::jsonb, '[{"number":"14128527773","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (732, 'Gavin Federico', 'Gavin', 'Federico', 472, '[{"email":"gavin.fedrico@grecoandsons.com","type":"work"}]'::jsonb, '[{"number":"14125104211","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (733, 'Scott Brooks', 'Scott', 'Brooks', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (734, 'Aaron Rich', 'Aaron', 'Rich', 454, '[]'::jsonb, '[]'::jsonb, 'Frozen Category Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (735, 'Maranda Thompson', 'Maranda', 'Thompson', 454, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (736, 'Lauren Vanryn', 'Lauren', 'Vanryn', 454, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (737, 'Gaetano', NULL, 'Gaetano', 302, '[]'::jsonb, '[{"number":"16303502171","type":"work"}]'::jsonb, 'Exec Chef', NULL, '204 N Edgewood Ave.', 'Wood Dale', 'IL', '60191.0', 'USA', NULL, 'Work with Jesse Ayello, Rep at Greco. cell: 312 898-1152'),
  (738, 'Brad', NULL, 'Brad', 1208, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (739, 'Henry', NULL, 'Henry', 952, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (740, 'Limdsay', NULL, 'Limdsay', 956, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (741, 'Matt\', NULL, 'Matt\', 652, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (742, 'Russ', NULL, 'Russ', 943, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (743, 'Alex Wagner', 'Alex', 'Wagner', 454, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (744, 'Aric Nichols', 'Aric', 'Nichols', 454, '[{"email":"aric.nichols@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (745, 'Martin Hart', 'Martin', 'Hart', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (746, 'Erin', NULL, 'Erin', 276, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (747, 'Jr', NULL, 'Jr', 253, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (748, 'Gera Klug', 'Gera', 'Klug', 110, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (749, 'Erica Kendera', 'Erica', 'Kendera', 206, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (750, 'Allie Gunning', 'Allie', 'Gunning', 447, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (751, 'Amy Hurley', 'Amy', 'Hurley', 911, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (752, 'Oliver Szeszoi', 'Oliver', 'Szeszoi', 467, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (753, 'Andi White', 'Andi', 'White', 687, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (754, 'Mike Montgomery', 'Mike', 'Montgomery', 447, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (755, 'Jack Lamey', 'Jack', 'Lamey', 912, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (756, 'Melinda Whitfield', 'Melinda', 'Whitfield', 1185, '[{"email":"melinda@whitfield.ord","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (757, 'Ann Scott', 'Ann', 'Scott', 1080, '[{"email":"info@the30bird.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (758, 'Nate Settle', 'Nate', 'Settle', 1017, '[{"email":"nate@spencers.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (759, 'Lesa Booker', 'Lesa', 'Booker', 618, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (760, 'Victor', NULL, 'Victor', 1230, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, '651 US 31 W Bypass STE 101', 'Bowling Green', 'KY', '42101.0', 'USA', NULL, NULL),
  (761, 'Doug Doscher', 'Doug', 'Doscher', 1229, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (762, 'Tom Schmitt', 'Tom', 'Schmitt', 1231, '[{"email":"cheftom@uncommonground.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, 'Wrigleyville', NULL, NULL, NULL, 'USA', NULL, NULL),
  (763, 'Brian Tamburrino', 'Brian', 'Tamburrino', 1233, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Cynthia is Director of New menu Innovations'),
  (764, 'Cynthia Ottavio', 'Cynthia', 'Ottavio', 1241, '[{"email":"cottavio@donatos.com","type":"work"}]'::jsonb, '[{"number":"16144167700","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (765, 'Oscar', NULL, 'Oscar', 1243, '[{"email":"chef@evilczech.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (766, 'Sierra Valdev', 'Sierra', 'Valdev', 1242, '[{"email":"director@mfgrestaurant.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (767, 'Dustin Barret', 'Dustin', 'Barret', 1242, '[{"email":"gm@evilczech.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (768, 'Moe Manna', 'Moe', 'Manna', 1239, '[{"email":"monder85@yahoo.com","type":"work"}]'::jsonb, '[{"number":"17082148349","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (769, 'Erik Keever', 'Erik', 'Keever', 1212, '[{"email":"erik.keever@windcreek.com","type":"work"}]'::jsonb, '[{"number":"18479210986","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (770, 'Tara Mcmurty', 'Tara', 'Mcmurty', 1290, '[{"email":"lovejpmcurty2010@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (771, 'Pwl', NULL, 'Pwl', 1291, '[]'::jsonb, '[{"number":"18005337132","type":"work"}]'::jsonb, NULL, NULL, 'PO Box 757', 'Paris', 'KY', '40362.0', 'USA', NULL, NULL),
  (772, 'Abby Smith', 'Abby', 'Smith', 1271, '[{"email":"asmith@baycliff.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (773, 'Rolinda Forsythe', 'Rolinda', 'Forsythe', NULL, '[{"email":"toddforsythe75@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (774, 'Wendy Britten', 'Wendy', 'Britten', 1275, '[{"email":"wendy.britten@bronsonbhh.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (775, 'Trevor Kipfmiller', 'Trevor', 'Kipfmiller', 1254, '[{"email":"tkipfmiller66@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (776, 'Chris Mascho', 'Chris', 'Mascho', NULL, '[{"email":"cjmascho@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (777, 'Kayla Mascho', 'Kayla', 'Mascho', NULL, '[{"email":"kaylamcginnis1788@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (778, 'Roel Smith', 'Roel', 'Smith', NULL, '[{"email":"roel@cascadehillscc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (779, 'Leighann Kourtjian', 'Leighann', 'Kourtjian', 1263, '[{"email":"tyler.hardisty@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (780, 'Andrew Baldwin', 'Andrew', 'Baldwin', 1279, '[{"email":"abaldwin@communityprograms.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (781, 'Crystal Burditt', 'Crystal', 'Burditt', NULL, '[{"email":"cozycatscafe@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (782, 'Tom Crowe-Garey', 'Tom', 'Crowe-Garey', NULL, '[{"email":"crowesnestcafe@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (783, 'Angela Overmyer', 'Angela', 'Overmyer', 1257, '[{"email":"doubledowndesserts@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (784, 'Brianne Daniel', 'Brianne', 'Daniel', 1273, '[{"email":"bdaniel@flatrockhomes.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (785, 'Kirk Bennett', 'Kirk', 'Bennett', 1251, '[{"email":"elijaha7219@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (786, 'Johnathon Thompson', 'Johnathon', 'Thompson', 1277, '[{"email":"jrthompson1@hfcc.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (787, 'Adam Russo', 'Adam', 'Russo', 1274, '[{"email":"adam@lincolnlake.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (788, 'Olivia Pelton', 'Olivia', 'Pelton', 1269, '[{"email":"opelton@usbnc.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (789, 'Chris Michael', 'Chris', 'Michael', 1255, '[{"email":"cmichael@madbrew.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (790, 'Megan Brooker', 'Megan', 'Brooker', 1272, '[{"email":"ellarook899@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (791, 'Josie Domin', 'Josie', 'Domin', 1285, '[{"email":"jdomin@mccschools.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (792, 'Lois Cole', 'Lois', 'Cole', 1285, '[{"email":"lcole@mccschools.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (793, 'Chris Dickinson', 'Chris', 'Dickinson', 1270, '[{"email":"matadorspizza@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (794, 'Frank Turchan', 'Frank', 'Turchan', 1283, '[{"email":"turchan@umich.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (795, 'Matt Higgins', 'Matt', 'Higgins', 1283, '[{"email":"matthigg@umich.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (796, 'Danielle Wendling', 'Danielle', 'Wendling', 1280, '[{"email":"dwendling@memorialhealthcare.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (797, 'Brock O''Connell', 'Brock', 'O''Connell', 1282, '[{"email":"broconne@med.umich.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (798, 'Vibhu Mahajan', 'Vibhu', 'Mahajan', 1282, '[{"email":"mahajanv@med.umich.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (799, 'June Williams', 'June', 'Williams', NULL, '[{"email":"juwillia@med.umich.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (800, 'Lauren Green', 'Lauren', 'Green', 1281, '[{"email":"greenl18@michigan.gov","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (801, 'Ernie Mason', 'Ernie', 'Mason', 1286, '[{"email":"ernie.mason@michindoh.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (802, 'Joel Papcun', 'Joel', 'Papcun', 1253, '[{"email":"joel@mep-cc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (803, 'Gayle Francis', 'Gayle', 'Francis', 1256, '[{"email":"logaf314@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (804, 'Monica Harter', 'Monica', 'Harter', 1259, '[{"email":"monicaharter@outlook.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (805, 'Jean Herman', 'Jean', 'Herman', 1288, '[{"email":"hermanje@northvilleschools.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (806, 'Andrea Hartman', 'Andrea', 'Hartman', NULL, '[{"email":"aharri1225@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (807, 'Brad Lemont', 'Brad', 'Lemont', 1260, '[{"email":"plantbasedconeys@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (808, 'Carley Cameron', 'Carley', 'Cameron', 1264, '[{"email":"tyler.hardisty@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (809, 'Chris Mcleish', 'Chris', 'Mcleish', 1267, '[{"email":"grillmanager@riverwalkplace.net","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (810, 'John Beem', 'John', 'Beem', 1266, '[{"email":"jjbeemiii@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (811, 'Brock Green', 'Brock', 'Green', 1289, '[{"email":"msingleton@spectrumhuman.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (812, 'Julie Lukowski', 'Julie', 'Lukowski', 1284, '[{"email":"schoolkitchen@splcs.net","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (813, 'Hilary Walker', 'Hilary', 'Walker', 1278, '[{"email":"hilary.walker@tellurideassociation.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (814, 'Sandy Edgley', 'Sandy', 'Edgley', 1276, '[{"email":"sedgley@aspirerhs.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (815, 'Devon Ingman', 'Devon', 'Ingman', 1268, '[{"email":"dingman33@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (816, 'Tal Sasson', 'Tal', 'Sasson', 1262, '[{"email":"info@thepitapost.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (817, 'Ryatt Foor', 'Ryatt', 'Foor', 1265, '[{"email":"ryattfoor@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (818, 'Jon B', 'Jon', 'B', 1110, '[{"email":"jbeverly@vaultfenton.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (819, 'Logan Crocker', 'Logan', 'Crocker', 1252, '[{"email":"lcrocker@treetops.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (820, 'Jesse Mullens', 'Jesse', 'Mullens', 1261, '[{"email":"jesse.mullens@eatsandcrafts.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (821, 'Jennifer Murray', 'Jennifer', 'Murray', 1287, '[{"email":"jmurray@wls4kids.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD'),
  (822, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (823, 'Rhonda Harper', 'Rhonda', 'Harper', 1292, '[]'::jsonb, '[{"number":"12706061273","type":"work"}]'::jsonb, 'Owner', NULL, '2339 Claudis Harris Rd', 'Adolphus', 'KY', '42120.0', 'USA', NULL, 'Showed interest in Cheese curds not open yet'),
  (824, 'Blake Kollker', 'Blake', 'Kollker', 1293, '[{"email":"blake.kollker@azzippizza.com","type":"work"}]'::jsonb, '[{"number":"18129094144","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (825, 'Victor', NULL, 'Victor', 1295, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (826, 'Jason Kuykendall', 'Jason', 'Kuykendall', 1296, '[{"email":"jkuykendall@ralphiesfuncenter.com","type":"work"}]'::jsonb, '[{"number":"12706294263","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (827, 'Rob', NULL, 'Rob', NULL, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (828, 'Graham Garrett', 'Graham', 'Garrett', 454, '[{"email":"graham.garrett@gfs.com","type":"work"}]'::jsonb, '[{"number":"16167174914","type":"work"}]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'MW REGIONALMERCHANDISING MANAGER -5 DC''S'),
  (829, 'Ethan Weinberger', 'Ethan', 'Weinberger', 454, '[{"email":"ethan.weinberger@gfs.com","type":"work"}]'::jsonb, '[{"number":"14197794822","type":"work"}]'::jsonb, 'Executive', NULL, NULL, 'Southfield', 'MI', NULL, 'USA', NULL, 'GLAKES MULTI-UNIT MANAGER'),
  (830, 'Dave Ryan', 'Dave', 'Ryan', NULL, '[{"email":"daveryan@berkott.net","type":"work"}]'::jsonb, '[{"number":"17082311623","type":"work"}]'::jsonb, 'Buyer', NULL, '1913 S Briggs', 'Joliet', 'IL', '60433.0', 'USA', NULL, 'Dave Ryan is Corporate Deli Buyer.'),
  (831, 'Steve Mcmillen', 'Steve', 'Mcmillen', 1368, '[{"email":"steve.mcmillen@greatlakesch.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (832, 'Pamela Kopplenger', 'Pamela', 'Kopplenger', 1281, '[{"email":"kopplebergerp@michigan.gov","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (833, 'Maranda Thompson', 'Maranda', 'Thompson', 454, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (834, 'Chris Tanner', 'Chris', 'Tanner', 1283, '[{"email":"chritan@umich.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (835, 'Frank Turchan', 'Frank', 'Turchan', 1283, '[{"email":"turchan@umich.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (836, 'Peggy Anderson', 'Peggy', 'Anderson', 1370, '[{"email":"pja1a@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (837, 'Evan Scheller', 'Evan', 'Scheller', 1371, '[{"email":"evan@battlealleybrewingcompany.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (838, 'Abby Smith', 'Abby', 'Smith', 1271, '[{"email":"asmith@baycliff.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (839, 'Todd Forsythe', 'Todd', 'Forsythe', NULL, '[{"email":"toddforsythe75@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (840, 'Bev Stange', 'Bev', 'Stange', 1373, '[{"email":"kkinney@benssupercenter.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (841, 'Skip Telgard', 'Skip', 'Telgard', 1374, '[{"email":"bluebirdleland@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (842, 'Ericson Booker', 'Ericson', 'Booker', 1375, '[{"email":"jroach33@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (843, 'Igor Ilijovski', 'Igor', 'Ilijovski', 1376, '[{"email":"bri@boyneriverinn.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (844, 'Andrew Wright', 'Andrew', 'Wright', 1377, '[{"email":"andrew.wright@scouting.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (845, 'Omri Robinson', 'Omri', 'Robinson', NULL, '[{"email":"grabby.gnat_0u@icloud.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (846, 'Gretchen Olds', 'Gretchen', 'Olds', 1379, '[{"email":"thebdbar.grill@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (847, 'Alexander Ausley', 'Alexander', 'Ausley', 1380, '[{"email":"alexander.ausley@miraclecamp.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (848, 'Ted Klonaris', 'Ted', 'Klonaris', 1381, '[{"email":"tedklonaris@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (849, 'Jim Chico', 'Jim', 'Chico', 1382, '[{"email":"jamesfwinter10@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (850, 'Joe', NULL, 'Joe', 218, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'Chesterton', 'IN', NULL, 'USA', NULL, NULL),
  (851, 'Melissa Coy', 'Melissa', 'Coy', 1383, '[{"email":"melissac@caascm.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (852, 'Julia Tyrrell', 'Julia', 'Tyrrell', 1384, '[{"email":"juliatyrrell@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (853, 'Matthew Losiewicz', 'Matthew', 'Losiewicz', 1385, '[{"email":"losiewiczmatthew@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (854, 'Bill Wilson', 'Bill', 'Wilson', 1386, '[{"email":"daybreakcafe@comcast.net","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (855, 'Kay Morgan', 'Kay', 'Morgan', 1387, '[{"email":"kdmorg5@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (856, 'Jehad Majed', 'Jehad', 'Majed', 1388, '[{"email":"jmajed@mac.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (857, 'Ruben Meneses', 'Ruben', 'Meneses', 1389, '[{"email":"docksidetorchlake@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (858, 'Brent Overmyer', 'Brent', 'Overmyer', 1257, '[{"email":"doubledowndesserts@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (859, 'Josh Layne', 'Josh', 'Layne', 1390, '[{"email":"joshualane13@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (860, 'Sinisa Cirovski', 'Sinisa', 'Cirovski', 1391, '[{"email":"eighteen87llc@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (861, 'Adam Macmillan', 'Adam', 'Macmillan', 1392, '[{"email":"mac5478@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (862, 'Dillon', NULL, 'Dillon', 108, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, 'Chesterton', 'IN', NULL, 'USA', NULL, 'VAF'),
  (863, 'Paris Hoisington', 'Paris', 'Hoisington', 1393, '[{"email":"jtlaw93@icloud.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (864, 'Sue Ann Braley', 'Sue Ann', 'Braley', 1394, '[{"email":"snnkibby@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (865, 'Lisa Davis', 'Lisa', 'Davis', 1395, '[{"email":"davis.donaven@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (866, 'Paul Veen', 'Paul', 'Veen', 1396, '[{"email":"pveen@haciendafiesta.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (867, 'Keith Ingrassia', 'Keith', 'Ingrassia', 1397, '[{"email":"keith.ingrassia@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (868, 'Johnathon Thompson', 'Johnathon', 'Thompson', 1277, '[{"email":"jrthompson1@hfcc.edu","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (869, 'Dave Meyer', 'Dave', 'Meyer', 1398, '[{"email":"henrysrestaurantottawa@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (870, 'Carolyn Peruski', 'Carolyn', 'Peruski', 1399, '[{"email":"jg2900m53@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (871, 'Dave Leidlein', 'Dave', 'Leidlein', 1400, '[{"email":"infojayell@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (872, 'Brad', NULL, 'Brad', 217, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, 'chesterton', 'IN', NULL, 'USA', NULL, 'VAF BLITZ'),
  (873, 'Bret Klun', 'Bret', 'Klun', 1401, '[{"email":"bretklun@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (874, 'Olivia Pelton', 'Olivia', 'Pelton', 1269, '[{"email":"opelton@usbnc.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (875, 'Mellisa Spinella', 'Mellisa', 'Spinella', 1402, '[{"email":"spinagcmlgc@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (876, 'Dave Coker', 'Dave', 'Coker', NULL, '[{"email":"mrscsgrilledcheese@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (877, 'Joe Bristol', 'Joe', 'Bristol', 1404, '[{"email":"jbdance@sbcglobal.net","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (878, 'Matthew Leeland', 'Matthew', 'Leeland', 1405, '[{"email":"mleeland@pbenet.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (879, 'Jack Alexander', 'Jack', 'Alexander', 1406, '[{"email":"katelyn@putinbayresort.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (880, 'Dana Saurman', 'Dana', 'Saurman', 1407, '[{"email":"dsaurman@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (881, 'Amanda', NULL, 'Amanda', 109, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, 'VALPARAISO', 'IN', NULL, 'USA', NULL, 'ANNASEA VAF'),
  (882, 'Crystal Pierce', 'Crystal', 'Pierce', 1408, '[{"email":"riverfrontgrillechesaning@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (883, 'Mario', NULL, 'Mario', 1191, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, 'Merrrillville', 'IN', NULL, 'USA', NULL, 'VAF BLITZ'),
  (884, 'Chris Mcleish', 'Chris', 'Mcleish', 1267, '[{"email":"grillmanager@riverwalkplace.net","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (885, 'Doris Rumfelt', 'Doris', 'Rumfelt', 1409, '[{"email":"dorispost253@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (886, 'John Beem', 'John', 'Beem', 1266, '[{"email":"jjbeemiii@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (887, 'Dawn Shafer', 'Dawn', 'Shafer', 1410, '[{"email":"dshafer4@outlook.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (888, 'Jesse Samsal', 'Jesse', 'Samsal', 1411, '[{"email":"jsamsal@shawneecountryclub.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (889, 'Lauretta Reiss', 'Lauretta', 'Reiss', 1412, '[{"email":"lauretta@smallbatchhs.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (890, 'Sarah Williams', 'Sarah', 'Williams', 1413, '[{"email":"smokinpigsbybigs@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (891, 'Christina Bentley', 'Christina', 'Bentley', 1284, '[{"email":"ccatalfio@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (892, 'Tammy Holsworth', 'Tammy', 'Holsworth', 1414, '[{"email":"tholsworth@sunrisestores.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (893, 'Kerry Emelander', 'Kerry', 'Emelander', 1415, '[{"email":"kemelander@prioritylc.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (894, 'Chris Zawila', 'Chris', 'Zawila', 1416, '[{"email":"czawila@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (895, 'Dave Wilder', 'Dave', 'Wilder', 1417, '[{"email":"chefwilder@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (896, 'Kailyn Switzer', 'Kailyn', 'Switzer', 1418, '[{"email":"agllaher_56@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (897, 'Brandi Sarver', 'Brandi', 'Sarver', 1419, '[{"email":"agmtpsannarbor@arborlodging.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (898, 'Shawn Ruddock', 'Shawn', 'Ruddock', 1420, '[{"email":"tracksideeatery@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (899, 'Kathleen Bridgewater', 'Kathleen', 'Bridgewater', 1421, '[{"email":"kathleenrn50@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (900, 'Jesse Mullens', 'Jesse', 'Mullens', 1261, '[{"email":"jesse.mullens@eatsandcrafts.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (901, 'Kelley Hohl', 'Kelley', 'Hohl', 1422, '[{"email":"krorick19@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (902, 'Nevin Nannoshi', 'Nevin', 'Nannoshi', 1423, '[{"email":"greekjalapenodixie@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (903, 'Zachariah Polasky', 'Zachariah', 'Polasky', 1424, '[{"email":"zchocolateshop@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (904, 'Paul Harmony', 'Paul', 'Harmony', 1425, '[{"email":"ppharmony72@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (905, 'Lauren Green', 'Lauren', 'Green', 1281, '[{"email":"greenl18@michigan.gov","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (906, 'Brian Perrone', 'Brian', 'Perrone', 1426, '[{"email":"brian@slowsbarbq.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (907, 'Brian Smith', 'Brian', 'Smith', 1252, '[{"email":"bsmith@treetops.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (908, 'David Kniffen', 'David', 'Kniffen', 1427, '[{"email":"conniern77@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (909, 'Robin Smith', 'Robin', 'Smith', 1428, '[{"email":"rsmith@warriorweb.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (910, 'Brian Paul', 'Brian', 'Paul', 1429, '[{"email":"bpaul@campblodgett.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (911, 'Caden Fulkerson', 'Caden', 'Fulkerson', 1430, '[{"email":"caden.fulkerson@cobeac.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (912, 'Ronald Cox', 'Ronald', 'Cox', 1431, '[{"email":"carmellascreamery@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (913, 'Katlyn Mcleod', 'Katlyn', 'Mcleod', 1274, '[{"email":"katlyn@lincolnlake.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (914, 'Rhonda Howard', 'Rhonda', 'Howard', 1432, '[{"email":"rhonda.howard@umhsparrow.org","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (915, 'Teresa Biller', 'Teresa', 'Biller', 1433, '[{"email":"tubbslakeresort@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'GFS NOVI SHOW LEAD 4/25 kaufholds\'),
  (916, 'Alfredo', NULL, 'Alfredo', 1435, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, 'Bowling green', 'KY', NULL, 'USA', NULL, 'Swap chicken'),
  (917, 'Zack Lockhart', 'Zack', 'Lockhart', 454, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, 'Grand Rapids', 'MI', NULL, 'USA', NULL, 'sold ranch and bakeable'),
  (918, 'Rut Thomason', 'Rut', 'Thomason', 323, '[{"email":"rut.thomason@dtmdistribotors.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, 'PO Box 1192', 'Bowling Green', 'KY', '42102.0', 'USA', NULL, 'introduced Kaufholds and McCrum'),
  (919, 'Issac', NULL, 'Issac', 1442, '[{"email":"tarandfeather70@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (920, 'Steven Zabel', 'Steven', 'Zabel', 820, '[{"email":"steven.zabel@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (921, 'Shawn Conklin', 'Shawn', 'Conklin', 1448, '[{"email":"sconklin@indianhills-bgky.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (922, 'Shane Macdougall', 'Shane', 'Macdougall', 1450, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (923, 'Brandon Smithson', 'Brandon', 'Smithson', 1454, '[{"email":"bsmithson@fourwindscasino.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (924, 'Jacob Giese', 'Jacob', 'Giese', 1455, '[]'::jsonb, '[]'::jsonb, 'Sous Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (925, 'Samantha Zastrow', 'Samantha', 'Zastrow', 1456, '[{"email":"smzastrow@wisc.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (926, 'Channie Mccall', 'Channie', 'Mccall', 1457, '[{"email":"cihomich@d.umn.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (927, 'Joesph Skeene', 'Joesph', 'Skeene', 1458, '[{"email":"skeenej@missouri.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (928, 'Travis Johnson', 'Travis', 'Johnson', 1459, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (929, 'Kamlesh Bhai', 'Kamlesh', 'Bhai', 1476, '[]'::jsonb, '[{"number":"17086631656","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (930, 'Robert Cooper', 'Robert', 'Cooper', 1477, '[{"email":"robert.cooper@ky.gov","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (931, 'Tammy', NULL, 'Tammy', 1478, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (932, 'Luke Holleb', 'Luke', 'Holleb', 292, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (933, 'Faith Thomas', 'Faith', 'Thomas', 454, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (934, 'Mitchell Burnett', 'Mitchell', 'Burnett', 454, '[]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (935, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (936, 'Ethan Weinberger', 'Ethan', 'Weinberger', 454, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (937, 'Terry Comer', 'Terry', 'Comer', 356, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (938, 'Mike Sakshaug', 'Mike', 'Sakshaug', 1051, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, '220 E North Ave.', 'Villa Park', 'IL', '60181.0', 'USA', NULL, NULL),
  (939, 'Sarah Robinson', 'Sarah', 'Robinson', 1485, '[{"email":"sarah@obryansobky.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (940, 'Rick Blasey', 'Rick', 'Blasey', 1487, '[{"email":"rick.blasey@usfoods.com","type":"work"}]'::jsonb, '[{"number":"13306875041","type":"work"}]'::jsonb, 'Poc (Point Of Contact)', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (941, 'Brian Miglin', 'Brian', 'Miglin', 1496, '[{"email":"chefbrian@hailstormbrewing.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (942, 'Nicholas Hanneken', 'Nicholas', 'Hanneken', 1161, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, '2nd email on OSU Cincy Annasea and first on McCrum coorsonation'),
  (943, 'Sam Dickstein', 'Sam', 'Dickstein', 620, '[{"email":"sdickstein12@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (944, 'Neal Hummitsch', 'Neal', 'Hummitsch', 1497, '[{"email":"nealhummitsch@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (945, 'Peggy Anderson', 'Peggy', 'Anderson', 1370, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (946, 'Evan Scheller', 'Evan', 'Scheller', 1371, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (947, 'Abby Smith', 'Abby', 'Smith', 1271, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (948, 'Todd Forsythe', 'Todd', 'Forsythe', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (949, 'Bev Stange', 'Bev', 'Stange', 1373, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (950, 'Skip Telgard', 'Skip', 'Telgard', 1374, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (951, 'Ericson Booker', 'Ericson', 'Booker', 1375, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (952, 'Igor Ilijovski', 'Igor', 'Ilijovski', 1376, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (953, 'Andrew Wright', 'Andrew', 'Wright', 1377, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (954, 'Omri Robinson', 'Omri', 'Robinson', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (955, 'Gretchen Olds', 'Gretchen', 'Olds', 1379, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (956, 'Alexander Ausley', 'Alexander', 'Ausley', 1380, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (957, 'Ted Klonaris', 'Ted', 'Klonaris', 1381, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (958, 'Jim Chico', 'Jim', 'Chico', 1382, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (959, 'Melissa Coy', 'Melissa', 'Coy', 1383, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (960, 'Julia Tyrrell', 'Julia', 'Tyrrell', 1384, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (961, 'Matthew Losiewicz', 'Matthew', 'Losiewicz', 1385, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (962, 'Bill Wilson', 'Bill', 'Wilson', 1386, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (963, 'Kay Morgan', 'Kay', 'Morgan', 1387, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (964, 'Jehad Majed', 'Jehad', 'Majed', 1388, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (965, 'Ruben Meneses', 'Ruben', 'Meneses', 1389, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (966, 'Brent Overmyer', 'Brent', 'Overmyer', 1257, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (967, 'Josh Layne', 'Josh', 'Layne', 1390, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (968, 'Sinisa Cirovski', 'Sinisa', 'Cirovski', 1391, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (969, 'Adam Macmillan', 'Adam', 'Macmillan', 1392, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (970, 'Paris Hoisington', 'Paris', 'Hoisington', 1393, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (971, 'Sue Ann Braley', 'Sue Ann', 'Braley', 1394, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (972, 'Lisa Davis', 'Lisa', 'Davis', 1395, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (973, 'Paul Veen', 'Paul', 'Veen', 1396, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (974, 'Keith Ingrassia', 'Keith', 'Ingrassia', 1397, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (975, 'Johnathon Thompson', 'Johnathon', 'Thompson', 1277, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (976, 'Dave Meyer', 'Dave', 'Meyer', 1398, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (977, 'Carolyn Peruski', 'Carolyn', 'Peruski', 1399, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (978, 'Dave Leidlein', 'Dave', 'Leidlein', 1400, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (979, 'Bret Klun', 'Bret', 'Klun', 1401, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (980, 'Olivia Pelton', 'Olivia', 'Pelton', 1269, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (981, 'Mellisa Spinella', 'Mellisa', 'Spinella', 1402, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (982, 'Dave Coker', 'Dave', 'Coker', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (983, 'Joe Bristol', 'Joe', 'Bristol', 1404, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (984, 'Matthew Leeland', 'Matthew', 'Leeland', 1405, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (985, 'Jack Alexander', 'Jack', 'Alexander', 1406, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (986, 'Dana Saurman', 'Dana', 'Saurman', 1407, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (987, 'Crystal Pierce', 'Crystal', 'Pierce', 1408, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (988, 'Chris Mcleish', 'Chris', 'Mcleish', 1267, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (989, 'Doris Rumfelt', 'Doris', 'Rumfelt', 1409, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (990, 'John Beem', 'John', 'Beem', 1266, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (991, 'Dawn Shafer', 'Dawn', 'Shafer', 1410, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (992, 'Jesse Samsal', 'Jesse', 'Samsal', 1411, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (993, 'Lauretta Reiss', 'Lauretta', 'Reiss', 1412, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (994, 'Sarah Williams', 'Sarah', 'Williams', 1413, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (995, 'Christina Bentley', 'Christina', 'Bentley', 1284, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (996, 'Tammy Holsworth', 'Tammy', 'Holsworth', 1414, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (997, 'Kerry Emelander', 'Kerry', 'Emelander', 1415, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (998, 'Chris Zawila', 'Chris', 'Zawila', 1416, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (999, 'Dave Wilder', 'Dave', 'Wilder', 1417, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1000, 'Kailyn Switzer', 'Kailyn', 'Switzer', 1418, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1001, 'Brandi Sarver', 'Brandi', 'Sarver', 1419, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1002, 'Shawn Ruddock', 'Shawn', 'Ruddock', 1420, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1003, 'Kathleen Bridgewater', 'Kathleen', 'Bridgewater', 1421, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1004, 'Jesse Mullens', 'Jesse', 'Mullens', 1261, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1005, 'Kelley Hohl', 'Kelley', 'Hohl', 1422, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1006, 'Nevin Nannoshi', 'Nevin', 'Nannoshi', 1423, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1007, 'Zachariah Polasky', 'Zachariah', 'Polasky', 1424, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1008, 'Paul Harmony', 'Paul', 'Harmony', 1425, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1009, 'Lauren Green', 'Lauren', 'Green', 1281, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1010, 'Brian Perrone', 'Brian', 'Perrone', 1426, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1011, 'Brian Smith', 'Brian', 'Smith', 1252, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1012, 'David Kniffen', 'David', 'Kniffen', 1427, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1013, 'Robin Smith', 'Robin', 'Smith', 1428, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1014, 'Brian Paul', 'Brian', 'Paul', 1429, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1015, 'Caden Fulkerson', 'Caden', 'Fulkerson', 1430, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1016, 'Ronald Cox', 'Ronald', 'Cox', 1431, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1017, 'Katlyn Mcleod', 'Katlyn', 'Mcleod', 1274, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1018, 'Rhonda Howard', 'Rhonda', 'Howard', 1432, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1019, 'Teresa Biller', 'Teresa', 'Biller', 1433, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1020, 'Brady Cohen', 'Brady', 'Cohen', 843, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1021, 'Steve Coppolillo', 'Steve', 'Coppolillo', NULL, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, 'Crown point', 'IN', NULL, 'USA', NULL, 'Dale to pirsue in June-'),
  (1022, 'Unknown', NULL, NULL, 860, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1023, 'Jeff Gibson', 'Jeff', 'Gibson', 861, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1024, 'Douglas Hunter', 'Douglas', 'Hunter', NULL, '[{"email":"customerservice@jacobspub.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, 'Evansville', 'IN', NULL, 'USA', NULL, NULL),
  (1025, 'Mark Pruett', 'Mark', 'Pruett', NULL, '[{"email":"mark.pruett@oakviewgroup.com","type":"work"}]'::jsonb, '[{"number":"12706878922","type":"work"}]'::jsonb, 'Executive', NULL, NULL, 'Owensboro', 'KY', NULL, 'USA', NULL, 'got Marks contact info will follow up'),
  (1026, 'Ashley Maldonado', 'Ashley', 'Maldonado', 272, '[{"email":"amaldonado@crsonesource.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Executive', NULL, NULL, 'Bowling green', 'KY', NULL, 'USA', NULL, 'Valerie Sharber is Dry and Frozen Senior Catergory Manager'),
  (1027, 'Valerie Sharber', 'Valerie', 'Sharber', 822, '[{"email":"valerie.sharber@pfgc.com","type":"work"}]'::jsonb, '[{"number":"12708467093","type":"work"}]'::jsonb, 'Executive', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1028, 'Steve Horwich', 'Steve', 'Horwich', 1076, '[{"email":"steveh@testaproduce.com","type":"work"}]'::jsonb, '[{"number":"13125457417","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1029, 'Kristine Campbell', 'Kristine', 'Campbell', 1076, '[{"email":"krisc@testaproduce.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1030, 'Megan Carmarigg', 'Megan', 'Carmarigg', 1076, '[{"email":"megabc@testaproduce.com","type":"work"}]'::jsonb, '[{"number":"13125235070","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1031, 'Michael Hanser', 'Michael', 'Hanser', 1076, '[{"email":"mikeh@testaproduce.com","type":"work"}]'::jsonb, '[{"number":"13127354075","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1032, 'Gee Cuyugan', 'Gee', 'Cuyugan', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1033, 'Gene Amdur', 'Gene', 'Amdur', 1163, '[{"email":"gene.amdur@usfoods.com","type":"work"}]'::jsonb, '[{"number":"18472685942","type":"work"}]'::jsonb, 'Frozen Buyer', NULL, '12301 Cumberland RD', 'Fishers', 'IN', '46038.0', 'USA', NULL, NULL),
  (1034, 'Susan Gannon', 'Susan', 'Gannon', 159, '[{"email":"sgannon@brownfoodservice.com","type":"work"}]'::jsonb, '[{"number":"16066381139","type":"work"}]'::jsonb, 'Frozen Buyer', NULL, '500 E Clayton LN', 'Louisa', 'KY', '41230.0', 'USA', NULL, NULL),
  (1035, 'Chris Helton', 'Chris', 'Helton', 272, '[{"email":"chelton@crsonesource.com","type":"work"}]'::jsonb, '[{"number":"12706841469","type":"work"}]'::jsonb, 'Frozen Buyer', NULL, '2803 Tamarack RD', 'Owensboro', 'KY', '42301.0', 'USA', NULL, NULL),
  (1036, 'Robin Baker', 'Robin', 'Baker', 823, '[{"email":"robin.baker@pfgc.com","type":"work"}]'::jsonb, '[{"number":"18596851785","type":"work"}]'::jsonb, 'Frozen Buyer', NULL, '910 KY 461', 'Somerset', 'KY', '42503.0', 'USA', NULL, NULL),
  (1037, 'Amy Raleigh', 'Amy', 'Raleigh', 823, '[{"email":"amy.raleigh@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Frozen Buyer', NULL, '910 KY 461', 'Somerset', 'KY', '42503.0', 'USA', NULL, NULL),
  (1038, 'Jenifer Steinbach', 'Jenifer', 'Steinbach', 1057, '[]'::jsonb, '[{"number":"17244522100","type":"work"}]'::jsonb, 'Buyer', NULL, '7705 National Turnpike', 'Louisville', 'KY', '40214.0', 'USA', NULL, NULL),
  (1039, 'Natalie Vogelheim', 'Natalie', 'Vogelheim', 820, '[{"email":"natalie.vogelheim@pfgc.com","type":"work"}]'::jsonb, '[{"number":"18287254524","type":"work"}]'::jsonb, 'Buyer', NULL, '543 12th St Drive NW', 'Hickory', 'NC', '28601.0', 'USA', NULL, NULL),
  (1040, 'Rick Deitering', 'Rick', 'Deitering', 1486, '[{"email":"rick.deitering@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '3765 Port Union Rd', 'Fairfield', 'OH', '45014.0', 'USA', NULL, NULL),
  (1041, 'Sean Saale', 'Sean', 'Saale', 1065, '[{"email":"sean.saale@sysco.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '10510 Evendale Dr', 'Cincinnati', 'OH', '45241.0', 'USA', NULL, NULL),
  (1042, 'Julie Myers', 'Julie', 'Myers', NULL, '[{"email":"julie.myers@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '535 Shepherd Ave', 'Cincinnati', 'OH', '45215.0', 'USA', NULL, NULL),
  (1043, 'Ashley Grace', 'Ashley', 'Grace', 1069, '[{"email":"ashley.grace@sysco.com","type":"work"}]'::jsonb, '[{"number":"16073770806","type":"work"}]'::jsonb, 'Frozen Buyer', NULL, '4000 W 62nd St', 'Indianapolis', 'IN', '46268.0', 'USA', NULL, NULL),
  (1044, 'Dina Mustafa', 'Dina', 'Mustafa', 1161, '[{"email":"dina.mustafa@usfoods.com","type":"work"}]'::jsonb, '[{"number":"18472685869","type":"work"}]'::jsonb, 'Frozen Buyer', NULL, '12301 Cumberland RD', 'Fishers', 'IN', '46038.0', 'USA', NULL, NULL),
  (1045, 'Steve Coppolillo', 'Steve', 'Coppolillo', 1562, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, 'Crown point', 'IN', NULL, 'USA', NULL, NULL),
  (1046, 'Brad', NULL, 'Brad', 253, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, 'Crown point', 'IN', NULL, 'USA', NULL, NULL),
  (1047, 'Bart', NULL, 'Bart', 934, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, 'Crown point', 'IN', NULL, 'USA', NULL, NULL),
  (1048, 'Ateve Coppolillo', 'Ateve', 'Coppolillo', 122, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, 'Crown point', 'IN', NULL, 'USA', NULL, NULL),
  (1049, 'Michael Gessler', 'Michael', 'Gessler', 1160, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, 'Bensenville', 'IL', NULL, 'USA', NULL, 'Emailed  holiday booking'),
  (1050, 'Jeff Forkenbrock', 'Jeff', 'Forkenbrock', 1160, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, 'Bensenville', 'IL', NULL, 'USA', NULL, 'Emailed  holiday booking'),
  (1051, 'Mike Forcier', 'Mike', 'Forcier', 1160, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, 'Bensenville', 'IL', NULL, 'USA', NULL, 'Emailed  holiday booking'),
  (1052, 'Wendy Galian', 'Wendy', 'Galian', 1160, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, 'Bensenville', 'IL', NULL, 'USA', NULL, 'Emailed  holiday booking'),
  (1053, 'Matthew Kerley', 'Matthew', 'Kerley', 1160, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, 'Bensenville', 'IL', NULL, 'USA', NULL, 'Emailed  holiday booking'),
  (1054, 'Matt Dean', 'Matt', 'Dean', 1160, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, 'Bensenville', NULL, NULL, 'USA', NULL, NULL),
  (1055, 'Us Foods-G4', 'Us', 'Foods-G4', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1056, 'Lesa Holford', 'Lesa', 'Holford', 808, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1057, 'Matt Kincaid', 'Matt', 'Kincaid', 1158, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1058, 'Us Foods-G8', 'Us', 'Foods-G8', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1059, 'Us Foods-G9', 'Us', 'Foods-G9', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1060, 'Pat Niebling', 'Pat', 'Niebling', 866, '[{"email":"pat.niebling@usfoods.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1061, 'Esequiel Dominquez', 'Esequiel', 'Dominquez', 1437, '[{"email":"edominguez@firsthospitality.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1062, 'Elton Manning', 'Elton', 'Manning', 1573, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1063, 'Hannah Seward', 'Hannah', 'Seward', NULL, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1064, 'Stephany Florek', 'Stephany', 'Florek', 1584, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1065, 'Trevor Pollok', 'Trevor', 'Pollok', 1573, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1066, 'Grady', NULL, 'Grady', 1610, '[{"email":"pgrady@armynavyclub.org","type":"work"}]'::jsonb, '[{"number":"12027212089","type":"work"}]'::jsonb, 'Food And Beverage Director', NULL, NULL, NULL, 'DC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1067, 'Bynum', NULL, 'Bynum', 1611, '[{"email":"catbynum@gmail.com","type":"work"}]'::jsonb, '[{"number":"12024418080","type":"work"}]'::jsonb, 'Manger', NULL, NULL, NULL, 'DC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1068, 'Tanner', NULL, 'Tanner', 1612, '[{"email":"ctanner@acfchefs.org","type":"work"}]'::jsonb, '[{"number":"19044840224","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1069, 'Clark', NULL, 'Clark', 1613, '[{"email":"hclark@affi.com","type":"work"}]'::jsonb, '[{"number":"15856061479","type":"work"}]'::jsonb, 'Director Of Business Development', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1070, 'Ingram', NULL, 'Ingram', 1614, '[{"email":"catering@biscottis.net","type":"work"}]'::jsonb, '[{"number":"19043872060","type":"work"}]'::jsonb, 'Catering Director', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1071, 'Liong', NULL, 'Liong', 1615, '[{"email":"kelvinole@blackpearljax.com","type":"work"}]'::jsonb, '[{"number":"14406799372","type":"work"}]'::jsonb, 'Founder And Managing Partner', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1072, 'Dammert', NULL, 'Dammert', 1616, '[{"email":"cdammert@dhmhotels.com","type":"work"}]'::jsonb, '[{"number":"13054095997","type":"work"}]'::jsonb, 'Corporate Director Food & Beverage', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1073, 'Hernandez', NULL, 'Hernandez', 1617, '[{"email":"nicole.hernandez@constellationculinary.com","type":"work"}]'::jsonb, '[{"number":"13055050726","type":"work"}]'::jsonb, 'Vice President Of Sales', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1074, 'Larcada', NULL, 'Larcada', 1618, '[{"email":"analarcada@gmail.com","type":"work"}]'::jsonb, '[{"number":"13056668545","type":"work"}]'::jsonb, 'Catering Sales', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1075, 'Miller', NULL, 'Miller', 1619, '[{"email":"jmiller@meltingpot.com","type":"work"}]'::jsonb, '[{"number":"18134860833","type":"work"}]'::jsonb, 'Director Of Culinary Innovation & Development', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1076, 'Stanzi', NULL, 'Stanzi', 1620, '[{"email":"marc.stanzi@naplesesplanadegcc.com","type":"work"}]'::jsonb, '[{"number":"14127083545","type":"work"}]'::jsonb, 'Executive Chef', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1077, 'Akkad', NULL, 'Akkad', 1621, '[{"email":"dodiakk@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'FL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1078, 'Bethke', NULL, 'Bethke', 1622, '[{"email":"bethke-kevin@aramark.com","type":"work"}]'::jsonb, '[{"number":"19012183018","type":"work"}]'::jsonb, 'General Manager', NULL, NULL, NULL, 'GA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1079, 'Summers', NULL, 'Summers', 1623, '[{"email":"tsummers@arcodb.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Director Of Partnership Development', NULL, NULL, NULL, 'GA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1080, 'Bai', NULL, 'Bai', 1624, '[{"email":"jack@gekkokitchen.com","type":"work"}]'::jsonb, '[{"number":"14044225851","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, 'GA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1081, 'Page', NULL, 'Page', 1625, '[{"email":"joshua.page@landingsclub.com","type":"work"}]'::jsonb, '[{"number":"19128560054","type":"work"}]'::jsonb, 'Assistant Director Of Club Operations', NULL, NULL, NULL, 'GA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1082, 'Basit', NULL, 'Basit', 1626, '[{"email":"sbasit@racetrac.com","type":"work"}]'::jsonb, '[{"number":"17707436349","type":"work"}]'::jsonb, 'Culinary Specialist', NULL, NULL, NULL, 'GA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1083, 'Becker', NULL, 'Becker', 1627, '[{"email":"archna@bhojanic.com","type":"work"}]'::jsonb, '[{"number":"14043861940","type":"work"}]'::jsonb, 'Chef/Owner', NULL, NULL, NULL, 'GA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1084, 'Mask', NULL, 'Mask', 1628, '[{"email":"larry.e.mask.naf@army.mil","type":"work"}]'::jsonb, '[{"number":"18086004809","type":"work"}]'::jsonb, 'Business And Recreation Chief', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1085, 'Miller', NULL, 'Miller', 1629, '[{"email":"dave@bagelmiller.com","type":"work"}]'::jsonb, '[{"number":"17736543610","type":"work"}]'::jsonb, 'Founder', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1086, 'Sherlock', NULL, 'Sherlock', 1630, '[{"email":"tsherlock@eddiemerlots.com","type":"work"}]'::jsonb, '[{"number":"16306510770","type":"work"}]'::jsonb, 'Area Manager', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1087, 'Bauwens', NULL, 'Bauwens', 1631, '[{"email":"randy@exmoorcountryclub.org","type":"work"}]'::jsonb, '[{"number":"18475796862","type":"work"}]'::jsonb, 'Assistant General Manager', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1088, 'Novak', NULL, 'Novak', 1632, '[{"email":"aspyn@fireplaceinn.com","type":"work"}]'::jsonb, '[{"number":"13126645264","type":"work"}]'::jsonb, 'General Manager', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1089, 'Wheeler', NULL, 'Wheeler', 1633, '[{"email":"mwheeler@flavorista.com","type":"work"}]'::jsonb, '[{"number":"17133761412","type":"work"}]'::jsonb, 'Business Development Manager', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1090, 'Rauen', NULL, 'Rauen', 1634, '[{"email":"rw@whittinghammeats.com","type":"work"}]'::jsonb, '[{"number":"17082594746","type":"work"}]'::jsonb, 'Sales', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1091, 'Lake', NULL, 'Lake', 1635, '[{"email":"larraine@coldchain3pl.com","type":"work"}]'::jsonb, '[{"number":"13126712244","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1092, 'Tseng', NULL, 'Tseng', 1636, '[{"email":"sakamotofun@gmail.com","type":"work"}]'::jsonb, '[{"number":"16305542388","type":"work"}]'::jsonb, 'Gm', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1093, 'Kraszewski', NULL, 'Kraszewski', 1637, '[{"email":"projectchapter2@hotmail.com","type":"work"}]'::jsonb, '[{"number":"16083455007","type":"work"}]'::jsonb, 'Entrepreneur / Food Service', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1094, 'Balis', NULL, 'Balis', 1638, '[{"email":"ajbalis21@gmail.com","type":"work"}]'::jsonb, '[{"number":"13123153442","type":"work"}]'::jsonb, 'Owner/ Chef', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1095, 'Leszczynska', NULL, 'Leszczynska', 1639, '[{"email":"e.leszczynska@hodowla-slimakow.pl","type":"work"}]'::jsonb, '[{"number":"17735121591","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1096, 'Lee', NULL, 'Lee', 1093, '[{"email":"virginiaalee7@gmail.com","type":"work"}]'::jsonb, '[{"number":"16303866308","type":"work"}]'::jsonb, 'Contributing Writer', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1097, 'Berhe', NULL, 'Berhe', 1640, '[{"email":"hzgbgb2025@gmail.com","type":"work"}]'::jsonb, '[{"number":"17737048606","type":"work"}]'::jsonb, 'Supervisor', NULL, NULL, NULL, 'IL', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1098, 'Perry', NULL, 'Perry', 1641, '[{"email":"maperry2125@gmail.com","type":"work"}]'::jsonb, '[{"number":"13177977931","type":"work"}]'::jsonb, 'Systems Director', NULL, NULL, NULL, 'IN', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1099, 'Bauman', NULL, 'Bauman', 1642, '[{"email":"mjbauman@pnw.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Ass. Professor Of Hospitality & Tourism', NULL, NULL, NULL, 'IN', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1100, 'Clark', NULL, 'Clark', 885, '[{"email":"afclark@pnw.edu","type":"work"}]'::jsonb, '[{"number":"12199892414","type":"work"}]'::jsonb, 'Executive Director - Auxiliary Services', NULL, NULL, NULL, 'IN', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1101, 'Hogan', NULL, 'Hogan', 1643, '[{"email":"shannon@teapluspoke.com","type":"work"}]'::jsonb, '[{"number":"17733660258","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, 'IN', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1102, 'Sanders', NULL, 'Sanders', 1644, '[{"email":"mathew.sanders@texasroadhouse.com","type":"work"}]'::jsonb, '[{"number":"15024269984","type":"work"}]'::jsonb, 'Product Coach', NULL, NULL, NULL, 'KY', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1103, 'Foley', NULL, 'Foley', 1645, '[{"email":"mfoley@northcoastseafoods.com","type":"work"}]'::jsonb, '[{"number":"16175938581","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, 'MA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1104, 'Tran', NULL, 'Tran', 1646, '[{"email":"patrick.tran@sysco.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Marketplace Business Development', NULL, NULL, NULL, 'MA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1105, 'Phillips', NULL, 'Phillips', 1647, '[{"email":"brandonp@thelachow.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Founder', NULL, NULL, NULL, 'MD', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1106, 'Rice', NULL, 'Rice', 1648, '[{"email":"rickyrice@savalfoods.com","type":"work"}]'::jsonb, '[{"number":"14439287555","type":"work"}]'::jsonb, 'Corporate Chef', NULL, NULL, NULL, 'MD', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1107, 'Vivio', NULL, 'Vivio', 1649, '[{"email":"pam@beyondjuiceryeatery.com","type":"work"}]'::jsonb, '[{"number":"15869451164","type":"work"}]'::jsonb, 'Co-Founder', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1108, 'Culver', NULL, 'Culver', 1650, '[{"email":"boyd@coldbreakusa.com","type":"work"}]'::jsonb, '[{"number":"16165910200","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1109, 'Florek', NULL, 'Florek', 1651, '[{"email":"sflorek@cplansing.com","type":"work"}]'::jsonb, '[{"number":"15173911302","type":"work"}]'::jsonb, 'Executive Chef', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1110, 'Leininger', NULL, 'Leininger', 1652, '[{"email":"eatwellwithkk@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1111, 'Merz', NULL, 'Merz', 701, '[{"email":"merz@msu.edu","type":"work"}]'::jsonb, '[{"number":"15175253304","type":"work"}]'::jsonb, 'Executive Chef', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1112, 'Bailey', NULL, 'Bailey', 1653, '[{"email":"chefjb2000@sbcglobal.net","type":"work"}]'::jsonb, '[]'::jsonb, 'General Manager', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1113, 'Surrock', NULL, 'Surrock', 1654, '[{"email":"tefititiki@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1114, 'Carano', NULL, 'Carano', 1655, '[{"email":"thecornersocial@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1115, 'Ozdenak', NULL, 'Ozdenak', 1656, '[{"email":"sayhan@medboxgrill.com","type":"work"}]'::jsonb, '[{"number":"16127193345","type":"work"}]'::jsonb, 'Cook', NULL, NULL, NULL, 'MN', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1116, 'Othman', NULL, 'Othman', 1657, '[{"email":"wholesale833@gmail.com","type":"work"}]'::jsonb, '[{"number":"13142367228","type":"work"}]'::jsonb, 'Ceo', NULL, NULL, NULL, 'MO', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1117, 'Malnar Mba Rd Ldn', 'Malnar Mba Rd', 'Ldn', 1658, '[{"email":"lauramalnar@iammorrison.com","type":"work"}]'::jsonb, '[{"number":"17655327689","type":"work"}]'::jsonb, 'Regional Manager-Client Success & Innovation', NULL, NULL, NULL, 'NC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1118, 'Bastian', NULL, 'Bastian', 1659, '[{"email":"chefloub@outlook.com","type":"work"}]'::jsonb, '[{"number":"13128331896","type":"work"}]'::jsonb, 'Svp Corporate Chef', NULL, NULL, NULL, 'NC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1119, 'Fabian Navarro', 'Fabian', 'Navarro', 1660, '[{"email":"fabianrayito@hotmail.com","type":"work"}]'::jsonb, '[{"number":"14342500404","type":"work"}]'::jsonb, 'Manager/Owner', NULL, NULL, NULL, 'NC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1120, 'Conklin', NULL, 'Conklin', 1661, '[{"email":"ryan.conklin@unchealth.unc.edu","type":"work"}]'::jsonb, '[{"number":"19197843398","type":"work"}]'::jsonb, 'Director', NULL, NULL, NULL, 'NC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1121, 'Mccutcheon', NULL, 'Mccutcheon', 1662, '[{"email":"mariana.g.mccutcheon.mil@army.mil","type":"work"}]'::jsonb, '[{"number":"14029927512","type":"work"}]'::jsonb, 'Senior Food Advisor', NULL, NULL, NULL, 'NE', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1122, 'Schmall', NULL, 'Schmall', 1662, '[{"email":"cowgirlshade@gmail.com","type":"work"}]'::jsonb, '[{"number":"13082250623","type":"work"}]'::jsonb, 'Culinary Nco', NULL, NULL, NULL, 'NE', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1123, 'Trilling', NULL, 'Trilling', 1663, '[{"email":"ltrilling@hanovermarriott.com","type":"work"}]'::jsonb, '[]'::jsonb, 'General Manager', NULL, NULL, NULL, 'NJ', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1124, 'Feig', NULL, 'Feig', 1664, '[{"email":"abraham@finelinesettings.com","type":"work"}]'::jsonb, '[{"number":"19492282364","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, 'NY', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1125, 'Pankovcin', NULL, 'Pankovcin', 1665, '[{"email":"pankovcin-john@aramark.com","type":"work"}]'::jsonb, '[{"number":"16316722266","type":"work"}]'::jsonb, 'District Manager', NULL, NULL, NULL, 'NY', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1126, 'Nielsen', NULL, 'Nielsen', 1666, '[{"email":"ksnfsc@rit.edu","type":"work"}]'::jsonb, '[{"number":"15854755403","type":"work"}]'::jsonb, 'Assistant Manager', NULL, NULL, NULL, 'NY', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1127, 'Vitelli', NULL, 'Vitelli', 1666, '[{"email":"ewvfsd@rit.edu","type":"work"}]'::jsonb, '[{"number":"15854752721","type":"work"}]'::jsonb, 'Assistant Dining Manager', NULL, NULL, NULL, 'NY', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1128, 'Gunasinghe', NULL, 'Gunasinghe', 1667, '[{"email":"kasungunasinghe@volcora.com","type":"work"}]'::jsonb, '[{"number":"16466274015","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, 'NY', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1129, 'Ahmed', NULL, 'Ahmed', NULL, '[{"email":"jasminmj86@yahoo.com","type":"work"}]'::jsonb, '[{"number":"16145158013","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1130, 'Brahler', NULL, 'Brahler', 1669, '[{"email":"avbrahler@outlook.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1131, 'Sommer', NULL, 'Sommer', 1670, '[{"email":"pam.sommer@hotheadburritos.com","type":"work"}]'::jsonb, '[{"number":"19374751128","type":"work"}]'::jsonb, 'Presidwnt', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1132, 'Shook', NULL, 'Shook', 1671, '[{"email":"grizz@curiositeaemporium.com","type":"work"}]'::jsonb, '[{"number":"14193603746","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1133, 'Dede', NULL, 'Dede', 1672, '[{"email":"cafe422@gmail.com","type":"work"}]'::jsonb, '[{"number":"13307206484","type":"work"}]'::jsonb, 'Owner - Café 422', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1134, 'Malvasi', NULL, 'Malvasi', 1672, '[{"email":"malvasi9961@gmail.com","type":"work"}]'::jsonb, '[{"number":"13307190139","type":"work"}]'::jsonb, 'Bar Manager', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1135, 'Musumeci', NULL, 'Musumeci', 1672, '[{"email":"ottavio54@gmail.com","type":"work"}]'::jsonb, '[{"number":"13307173126","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1136, 'Mills', NULL, 'Mills', 1673, '[{"email":"tastetheworld1@gmail.com","type":"work"}]'::jsonb, '[{"number":"15132577532","type":"work"}]'::jsonb, 'Chef/Owner', NULL, NULL, NULL, 'OH', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1137, 'Santos', NULL, 'Santos', 1674, '[{"email":"alyssa_santos@mac.com","type":"work"}]'::jsonb, '[{"number":"15737170461","type":"work"}]'::jsonb, 'Plus One', NULL, NULL, NULL, 'OK', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1138, 'Meyer', NULL, 'Meyer', 1674, '[{"email":"zac.meyer@halsmith.com","type":"work"}]'::jsonb, '[{"number":"14056265611","type":"work"}]'::jsonb, 'It Manager', NULL, NULL, NULL, 'OK', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1139, 'Vetere', NULL, 'Vetere', 1675, '[{"email":"coughlinslaw2@gmail.com","type":"work"}]'::jsonb, '[{"number":"14126009233","type":"work"}]'::jsonb, 'Partner', NULL, NULL, NULL, 'PA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1140, 'Mcleod', NULL, 'Mcleod', 1676, '[{"email":"fleetlandingexpo+andy@gmail.com","type":"work"}]'::jsonb, '[{"number":"18432772456","type":"work"}]'::jsonb, 'Executive Chef', NULL, NULL, NULL, 'SC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1141, 'Woo', NULL, 'Woo', 1677, '[{"email":"edmund@edmundwoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'SC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1142, 'Garner', NULL, 'Garner', 1678, '[{"email":"chefjoe@springdalehallclub.com","type":"work"}]'::jsonb, '[{"number":"18034323521","type":"work"}]'::jsonb, 'Chef De Cuisine', NULL, NULL, NULL, 'SC', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1143, 'Li', NULL, 'Li', 1679, '[{"email":"nan.li@chowbus.com","type":"work"}]'::jsonb, '[{"number":"18328883991","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, 'TX', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1144, 'Grasso', NULL, 'Grasso', 1680, '[{"email":"meg.grasso@elior-na.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Head Of Culinary', NULL, NULL, NULL, 'TX', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1145, 'Thomas', NULL, 'Thomas', 1681, '[{"email":"lowen.thomas@hilton.com","type":"work"}]'::jsonb, '[{"number":"14153518064","type":"work"}]'::jsonb, 'Executive Chef', NULL, NULL, NULL, 'TX', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1146, 'Tsui', NULL, 'Tsui', 1682, '[{"email":"info@kasushi.com","type":"work"}]'::jsonb, '[{"number":"18328403280","type":"work"}]'::jsonb, 'Chef/Owner', NULL, NULL, NULL, 'TX', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1147, 'Ramirez', NULL, 'Ramirez', 1683, '[{"email":"wramirez@legends.net","type":"work"}]'::jsonb, '[{"number":"17869148326","type":"work"}]'::jsonb, 'Banquets Chef', NULL, NULL, NULL, 'TX', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1148, 'Punyanitya', NULL, 'Punyanitya', 1684, '[{"email":"punyanitya@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'President', NULL, NULL, NULL, 'VA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1149, 'Grajeda', NULL, 'Grajeda', 1685, '[{"email":"arlene.l.grajeda.mil@us.navy.mil","type":"work"}]'::jsonb, '[{"number":"17574622591","type":"work"}]'::jsonb, 'Cs1', NULL, NULL, NULL, 'VA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1150, 'Pait', NULL, 'Pait', 1686, '[{"email":"david@macados.net","type":"work"}]'::jsonb, '[]'::jsonb, 'Area Supervisor', NULL, NULL, NULL, 'VA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1151, 'Macher', NULL, 'Macher', 1687, '[{"email":"rmacher@macados.net","type":"work"}]'::jsonb, '[{"number":"15403973097","type":"work"}]'::jsonb, 'President', NULL, NULL, NULL, 'VA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1152, 'Smyrk', NULL, 'Smyrk', 1688, '[{"email":"davesmyrk@gmail.com","type":"work"}]'::jsonb, '[{"number":"15072697312","type":"work"}]'::jsonb, 'Chef', NULL, NULL, NULL, 'VA', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1153, 'Schuster', NULL, 'Schuster', 1689, '[{"email":"ajsriverside@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'WI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1154, 'Framke', NULL, 'Framke', 1690, '[{"email":"framkeanna97@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Bar Manager', NULL, NULL, NULL, 'WI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1155, 'Silvestri', NULL, 'Silvestri', 1691, '[{"email":"anthony@magpieslg.com","type":"work"}]'::jsonb, '[{"number":"18474772952","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, 'WI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1156, 'Moran', NULL, 'Moran', 1692, '[{"email":"gmelmave@gmail.com","type":"work"}]'::jsonb, '[{"number":"14146302780","type":"work"}]'::jsonb, 'Manager', NULL, NULL, NULL, 'WI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1157, 'Mikrut', NULL, 'Mikrut', 1693, '[{"email":"stefron2233@uppercrustpizzeria-pub.com","type":"work"}]'::jsonb, '[{"number":"12622792233","type":"work"}]'::jsonb, 'Manager/Owner', NULL, NULL, NULL, 'WI', NULL, 'USA', NULL, 'NRA ANNASEA LEAD'),
  (1158, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1159, 'Kubeczko', NULL, 'Kubeczko', 378, '[{"email":"jakobkubeczko@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Cook', NULL, '49 Sugar Lane', 'Sugar Grove', 'IL', '60554.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1160, 'Jaffrani', NULL, 'Jaffrani', 1694, '[{"email":"hassan@idof.com","type":"work"}]'::jsonb, '[{"number":"17084961700","type":"work"}]'::jsonb, 'Executive', NULL, '6100 W 73rd St', 'Chicago', 'IL', '60638.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1161, 'Corcoran', NULL, 'Corcoran', 1695, '[{"email":"katiec@burgerone.com","type":"work"}]'::jsonb, '[{"number":"16303251444","type":"work"}]'::jsonb, 'General Manager', NULL, '241 55th Street', 'Clarendon Hills', 'IL', '60514.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1162, 'Otero', NULL, 'Otero', 1696, '[{"email":"bookings@frostydogsfoodtruck.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, '3 EMILY CT', 'Bolingbrook', 'IL', '60490.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1163, 'Bateman', NULL, 'Bateman', 1697, '[{"email":"needhamshop@gmail.com","type":"work"}]'::jsonb, '[{"number":"16306889867","type":"work"}]'::jsonb, 'Chef', NULL, '50W435 Main Street Rd', 'Elburn', 'IL', '60119.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1164, 'Eng', NULL, 'Eng', 1698, '[{"email":"kieeng@hotmail.com","type":"work"}]'::jsonb, '[{"number":"18478888088","type":"work"}]'::jsonb, 'Owner', NULL, '883 S Randall Rd', 'Elgin', 'IL', '60123.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1165, 'Patel', NULL, 'Patel', 1699, '[{"email":"cardinalharvard@gmail.com","type":"work"}]'::jsonb, '[{"number":"13475755192","type":"work"}]'::jsonb, 'Owner', NULL, '1320 s main St', 'Algonquin', 'IL', '60102.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1166, 'Kotake', NULL, 'Kotake', 1700, '[{"email":"nk@kotakeinc.com","type":"work"}]'::jsonb, '[{"number":"18479217200","type":"work"}]'::jsonb, 'Manager', NULL, '137 South Foley St', 'Bensenville', 'IL', '60106.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1167, 'Kubira', NULL, 'Kubira', 1701, '[]'::jsonb, '[{"number":"18157154574","type":"work"}]'::jsonb, 'Chef', NULL, '204 S Lincoln Avenue', 'Aurora', 'IL', '60505.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1168, 'Hummitsch', NULL, 'Hummitsch', 1702, '[{"email":"neal@sipselfservewinebar.com","type":"work"}]'::jsonb, '[{"number":"17082698585","type":"work"}]'::jsonb, 'Owner', NULL, '17424 S. Oak Park Ave', 'Tinley Park', 'IL', '60477.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1169, 'Dickstein', NULL, 'Dickstein', 620, '[{"email":"sdickstein12@gmail.com","type":"work"}]'::jsonb, '[{"number":"18472754878","type":"work"}]'::jsonb, 'Chef', NULL, '59 W Hubbard Street', 'Chicago', 'IL', '60654.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1170, 'Magsino', NULL, 'Magsino', 1703, '[{"email":"tjmagsino@gmail.com","type":"work"}]'::jsonb, '[{"number":"18473750300","type":"work"}]'::jsonb, NULL, NULL, '1601 E Algonquin Rd', 'Arlington Heights', 'IL', '60005.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1171, 'Stark', NULL, 'Stark', NULL, '[{"email":"nick@ocallaghanspub.com","type":"work"}]'::jsonb, '[{"number":"13125271180","type":"work"}]'::jsonb, 'Hr', NULL, '29 W Hubbard St', 'Chicago', 'IL', '60654.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1172, 'Miglin', NULL, 'Miglin', 1705, '[{"email":"chefbrian@hailstormbrewing.com","type":"work"}]'::jsonb, '[{"number":"18152630286","type":"work"}]'::jsonb, 'Head Chef', NULL, '8060 186th Street', 'Tinley Park', 'IL', '60487.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1173, 'Evans', NULL, 'Evans', NULL, '[{"email":"joe@ivyleaguekids.org","type":"work"}]'::jsonb, '[{"number":"17089358812","type":"work"}]'::jsonb, 'Manager', NULL, '20 Kansas street', 'Frankfort', 'IL', '60423.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1174, 'Miller', NULL, 'Miller', 1707, '[{"email":"kurt.miller70@gmail.com","type":"work"}]'::jsonb, '[{"number":"17655323332","type":"work"}]'::jsonb, 'Manager', NULL, '323 N 725 W', 'West Lafayette', 'IN', '47906.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1175, 'Adams', NULL, 'Adams', 1708, '[{"email":"bryan@pvccfwi.com","type":"work"}]'::jsonb, '[{"number":"12604138606","type":"work"}]'::jsonb, 'Food And Beverage Director - Executive Chef', NULL, '10900 Pine Mills Road', 'Fort Wayne', 'IN', '46845.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1176, 'Nally', NULL, 'Nally', 1709, '[{"email":"ryann05@gmail.com","type":"work"}]'::jsonb, '[{"number":"13173715426","type":"work"}]'::jsonb, 'Owner', NULL, '11640 BROOKS SCHOOL ROAD', 'FISHERS', 'IN', '46037.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1177, 'Baisden', NULL, 'Baisden', 1710, '[{"email":"cbaisden@ivytech.edu","type":"work"}]'::jsonb, '[{"number":"12192413446","type":"work"}]'::jsonb, 'Chef', NULL, '621 W, 650 S', 'Hebron', 'IN', '46341.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1178, 'Dussault', NULL, 'Dussault', 1711, '[{"email":"chefjamies@yahoo.com","type":"work"}]'::jsonb, '[{"number":"19314440951","type":"work"}]'::jsonb, 'Co Owner', NULL, '1826 Carneal lane', 'Oak Grove', 'KY', '42262.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1179, 'Linley', NULL, 'Linley', 701, '[{"email":"linley@msu.edu","type":"work"}]'::jsonb, '[{"number":"15174105144","type":"work"}]'::jsonb, 'Adsm', NULL, '801 Bancroft Ct', 'Lansing', 'MI', '48915.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1180, 'Speed', NULL, 'Speed', 1712, '[{"email":"kspeed37@yahoo.com","type":"work"}]'::jsonb, '[{"number":"16142061595","type":"work"}]'::jsonb, 'Owner', NULL, '6535 E. MAIN ST', 'Reynoldsburg', 'OH', '43068.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1181, 'Morris', NULL, 'Morris', 1713, '[{"email":"dommorrisdm@gmail.com","type":"work"}]'::jsonb, '[{"number":"13309686376","type":"work"}]'::jsonb, 'Associate', NULL, '911 N Mantua St', 'Kent', 'OH', '44240.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1182, 'Kamilaris', NULL, 'Kamilaris', 1714, '[{"email":"andreaskamilaris@yahoo.com","type":"work"}]'::jsonb, '[{"number":"14193455444","type":"work"}]'::jsonb, 'Owner', NULL, '5577 Monroe St Ste D', 'Sylvania', 'OH', '43560.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1183, 'Sniegocki', NULL, 'Sniegocki', 1715, '[{"email":"brian@sniegocki.org","type":"work"}]'::jsonb, '[{"number":"14193502818","type":"work"}]'::jsonb, 'Director', NULL, '312 W Dudley', 'Maumee', 'OH', '43537.0', 'USA', NULL, 'NRA KAUFHOLF LEAD'),
  (1184, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1185, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1186, 'Bron Lindsey', 'Bron', 'Lindsey', 1716, '[]'::jsonb, '[{"number":"16153360292","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1187, 'Domenic', NULL, 'Domenic', 837, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'VAF'),
  (1188, 'Meredith Collins', 'Meredith', 'Collins', 1575, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1189, 'Nick Hancotte', 'Nick', 'Hancotte', 1576, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1190, 'Elizabeth', NULL, 'Elizabeth', 1577, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1191, 'Tina Pagoroski', 'Tina', 'Pagoroski', 1578, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1192, 'Bagger Daves', 'Bagger', 'Daves', 1579, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1193, 'Kurt Kwiatowski', 'Kurt', 'Kwiatowski', 1580, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1194, 'Krystoff Ziarnoski', 'Krystoff', 'Ziarnoski', 1581, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1195, 'David', NULL, 'David', 1582, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1196, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1197, 'Daryl White', 'Daryl', 'White', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1198, 'Matthew Grew', 'Matthew', 'Grew', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, 'MI', NULL, 'USA', NULL, NULL),
  (1199, 'Kimber Wehling', 'Kimber', 'Wehling', 1718, '[{"email":"kimberw@panosfoods.com","type":"work"}]'::jsonb, '[{"number":"16307353200","type":"work"}]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'Contacted Kimber for Kaufholds and TCCF'),
  (1200, 'Frank ( )', 'Frank (', ')', 173, '[]'::jsonb, '[{"number":"17732717782","type":"work"}]'::jsonb, 'Exec Chef', NULL, '5343 N Clark St. Chicago, IL. 60640', NULL, 'IL', NULL, 'USA', NULL, 'Presented CCF Holiday Skus ( Cafe Classic Pumpkin, Carmel Apple Crunch, and Salted Chocolate CC'),
  (1201, 'Unknown', NULL, NULL, 1724, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1202, 'Adams', NULL, 'Adams', 1724, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1203, 'Clubb', NULL, 'Clubb', 1724, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1204, 'Turner', NULL, 'Turner', 1724, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1205, 'Gleim', NULL, 'Gleim', 1724, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1206, 'Mohnssen', NULL, 'Mohnssen', 1724, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1207, 'Jim Bowling', 'Jim', 'Bowling', 1728, '[{"email":"jim.bowling@pfgc.com","type":"work"}]'::jsonb, '[{"number":"16306210140","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1208, 'Alvaro "Cisco" Cortez', 'Alvaro "Cisco"', 'Cortez', 1728, '[{"email":"alvaro.cortez@pfgc.com","type":"work"}]'::jsonb, '[{"number":"13313211127","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1209, 'John Czech', 'John', 'Czech', 1728, '[{"email":"john.czech@pfgc.com","type":"work"}]'::jsonb, '[{"number":"13312199158","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1210, 'Dan Foote', 'Dan', 'Foote', 1728, '[{"email":"dan.foote@pfgc.com","type":"work"}]'::jsonb, '[{"number":"13312932275","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1211, 'Amanda Governale', 'Amanda', 'Governale', 1728, '[{"email":"amanda.governale@pfgc.com","type":"work"}]'::jsonb, '[{"number":"18153426363","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1212, 'Tony Lopez', 'Tony', 'Lopez', 1728, '[{"email":"anthony.lopez2@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1213, 'Dan Romanelli', 'Dan', 'Romanelli', 1728, '[{"email":"dan.romanelli2@pfgc.com","type":"work"}]'::jsonb, '[{"number":"13312291099","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1214, 'Ron Snell', 'Ron', 'Snell', 1728, '[{"email":"ron.snell@pfgc.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1215, 'Burim "Brian" Vedziovski', 'Burim "Brian"', 'Vedziovski', 1728, '[{"email":"brian.vedziovski@pfgc.com","type":"work"}]'::jsonb, '[{"number":"19207233723","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1216, 'Jason Weber', 'Jason', 'Weber', 1728, '[{"email":"jason.weber@pfgc.com","type":"work"}]'::jsonb, '[{"number":"13312233926","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1217, 'Allen Janet', 'Allen', 'Janet', 455, '[{"email":"allenmenu@comcast.net","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1218, 'Armstrong Molly', 'Armstrong', 'Molly', 454, '[{"email":"molly.armstrong@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1219, 'Kevin Avery', 'Kevin', 'Avery', 454, '[]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1220, 'Barry Bortz', 'Barry', 'Bortz', 454, '[{"email":"barry.bortz@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1221, 'Gary Bowron', 'Gary', 'Bowron', 454, '[{"email":"gary.bowron@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1222, 'Heather Bradshaw', 'Heather', 'Bradshaw', 454, '[{"email":"heather.bradshaw@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165517878","type":"work"}]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1223, 'Barry Brown', 'Barry', 'Brown', 454, '[{"email":"barry.brown@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1224, 'Elena Buist', 'Elena', 'Buist', 454, '[{"email":"elena.buist@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1225, 'Matt Campbell', 'Matt', 'Campbell', 454, '[{"email":"matthew.campbell@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1226, 'Chris Cawley', 'Chris', 'Cawley', 454, '[{"email":"chris.cawley@gfs.com","type":"work"}]'::jsonb, '[{"number":"15088242800","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1227, 'Lora Dickerson', 'Lora', 'Dickerson', 454, '[{"email":"lora.dickerson@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1228, 'David Donnelly', 'David', 'Donnelly', 454, '[{"email":"david.donnelly@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1229, 'Scott Eisel', 'Scott', 'Eisel', 454, '[{"email":"scott.eisel@gfs.com","type":"work"}]'::jsonb, '[{"number":"14198104211","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1230, 'Kathy Eising', 'Kathy', 'Eising', 454, '[{"email":"kathy.eising@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1231, 'Amy Gautraud', 'Amy', 'Gautraud', 454, '[{"email":"amy.gautraud@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1232, 'Dan Goeglein', 'Dan', 'Goeglein', 454, '[{"email":"dan.goeglein@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1233, 'Alex Grantham', 'Alex', 'Grantham', 454, '[]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1234, 'Derrick J. Haight', 'Derrick J.', 'Haight', 454, '[{"email":"derrick.haight@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1235, 'Jennifer Hinkle', 'Jennifer', 'Hinkle', 454, '[]'::jsonb, '[{"number":"17737176004","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1236, 'Matthew Hobkirk', 'Matthew', 'Hobkirk', 454, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1237, 'Dennis Kissinger', 'Dennis', 'Kissinger', 454, '[{"email":"dennis.kissinger@gfs.com","type":"work"}]'::jsonb, '[{"number":"18122191518","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1238, 'Karine Maheu', 'Karine', 'Maheu', 454, '[{"email":"karine.maheu@gfs.com","type":"work"}]'::jsonb, '[{"number":"15149433402","type":"work"}]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1239, 'Laine Marks', 'Laine', 'Marks', 454, '[{"email":"laine.marks@gfs.com","type":"work"}]'::jsonb, '[{"number":"17345646597","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1240, 'Barb Minger', 'Barb', 'Minger', 454, '[{"email":"barb.minger@gfs.com","type":"work"}]'::jsonb, '[{"number":"12604179056","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1241, 'Tiffany Nabozny', 'Tiffany', 'Nabozny', 454, '[{"email":"tiffany.nabozny@gfs.com","type":"work"}]'::jsonb, '[{"number":"15132051894","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1242, 'Brad Postema', 'Brad', 'Postema', 454, '[{"email":"brad.postema@gfs.com","type":"work"}]'::jsonb, '[{"number":"16143608602","type":"work"}]'::jsonb, 'Director Of Operations', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1243, 'Cindy Quarles', 'Cindy', 'Quarles', 454, '[{"email":"cynthia.quarles@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1244, 'Jeff Rohm', 'Jeff', 'Rohm', 454, '[{"email":"jrohmeo@gmail.com","type":"work"}]'::jsonb, '[{"number":"18009687500","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1245, 'Patrick Shaw', 'Patrick', 'Shaw', 454, '[{"email":"patrick.shaw@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1246, 'Amy Shearer', 'Amy', 'Shearer', 454, '[{"email":"amy.shearer@gfs.com","type":"work"}]'::jsonb, '[{"number":"16165307000","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1247, 'Leslie Sneed', 'Leslie', 'Sneed', 454, '[{"email":"leslie.sneed@gfs.com","type":"work"}]'::jsonb, '[{"number":"16186292301","type":"work"}]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1248, 'Mark Sulka', 'Mark', 'Sulka', 454, '[{"email":"mark.sulka@gfs.com","type":"work"}]'::jsonb, '[{"number":"16167176677","type":"work"}]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1249, 'Amy Suwalski', 'Amy', 'Suwalski', 454, '[{"email":"amy.suwalski@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1250, 'Josh Swift', 'Josh', 'Swift', 454, '[{"email":"josh.swift@gfs.com","type":"work"}]'::jsonb, '[{"number":"13025988376","type":"work"}]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1251, 'Michael Mocogni', 'Michael', 'Mocogni', 454, '[{"email":"michael.mocogni@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1252, 'Jennifer Toomey', 'Jennifer', 'Toomey', 454, '[{"email":"jennifer.toomey@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1253, 'Kristina Coury', 'Kristina', 'Coury', 454, '[{"email":"kristina.coury@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1254, 'Carlos Moreno', 'Carlos', 'Moreno', 454, '[{"email":"carlos.moreno@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1255, 'Lisa Hayes', 'Lisa', 'Hayes', 454, '[{"email":"lisa.hayes@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1256, 'Brad Meath', 'Brad', 'Meath', 454, '[{"email":"brad.meath@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1257, 'Todd Sobecki', 'Todd', 'Sobecki', 454, '[{"email":"todd.sobecki@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1258, 'Matt Spellbrink', 'Matt', 'Spellbrink', 454, '[{"email":"matt.spellbrink@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1259, 'John Davis', 'John', 'Davis', 454, '[{"email":"john.davis@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1260, 'Andrew Frisosky', 'Andrew', 'Frisosky', 454, '[{"email":"andrew.frisosky@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1261, 'James Pratt', 'James', 'Pratt', 454, '[{"email":"james.pratt@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1262, 'Aaron Temby', 'Aaron', 'Temby', 454, '[{"email":"aaron.temby@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1263, 'Hector Valdez', 'Hector', 'Valdez', 454, '[{"email":"hector.valdez1@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1264, 'John Jeffcott', 'John', 'Jeffcott', 454, '[{"email":"john.jeffcott@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1265, 'David Biallas', 'David', 'Biallas', 454, '[{"email":"david.biallas@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1266, 'Colleen Barrett', 'Colleen', 'Barrett', 454, '[{"email":"colleen.barrett@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1267, 'Grace Binelli', 'Grace', 'Binelli', 454, '[{"email":"grace.binelli@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1268, 'Amandalueck', NULL, 'Amandalueck', 454, '[{"email":"amanda.leuck@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1269, 'Jim Tobin', 'Jim', 'Tobin', 454, '[{"email":"jim.tobin@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1270, 'Bryn Halstrom', 'Bryn', 'Halstrom', 454, '[{"email":"brynn.hallstrom@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1271, 'Patty Sullivan', 'Patty', 'Sullivan', 454, '[{"email":"patty.sullivan@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1272, 'Barry Brown', 'Barry', 'Brown', 454, '[{"email":"barry.brown@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1273, 'Robert Doherty', 'Robert', 'Doherty', 454, '[{"email":"robert.doherty@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1274, 'Terri Sorg', 'Terri', 'Sorg', 454, '[{"email":"terri.sorg@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1275, 'Patty Sullivan', 'Patty', 'Sullivan', 454, '[{"email":"patty.sullivan@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, 'CHICAGOLAND', NULL, NULL, 'USA', NULL, NULL),
  (1276, 'Joseph.Cecchini@Abbott.Com', NULL, 'Joseph.Cecchini@Abbott.Com', 1730, '[{"email":"joseph.cecchini@abbott.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1277, 'Scott Padbury', 'Scott', 'Padbury', 1730, '[{"email":"scott.padbury@abbott.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1278, 'Jovani.Gomez@Abbvie.Com', NULL, 'Jovani.Gomez@Abbvie.Com', 1298, '[{"email":"jovani.gomez@abbvie.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1279, 'Tyler.Ringer@Abbvie.Com', NULL, 'Tyler.Ringer@Abbvie.Com', 1731, '[{"email":"tyler.ringer@abbvie.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '1401 SHERIDAN RD GATE 5', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1280, 'Addison.Kristin@Yahoo.Com', NULL, 'Addison.Kristin@Yahoo.Com', 1299, '[{"email":"addison.kristin@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1281, 'Acihlar@Co.Door.Wi.Us', NULL, 'Acihlar@Co.Door.Wi.Us', 1345, '[{"email":"acihlar@co.door.wi.us","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1282, 'Qirat62@Yahoo.Com', NULL, 'Qirat62@Yahoo.Com', 1732, '[{"email":"qirat62@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1283, 'Amigostacos62656@Gmail.Com', NULL, 'Amigostacos62656@Gmail.Com', 1300, '[{"email":"amigostacos62656@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1284, 'Angryoctopus36@Gmail.Com', NULL, 'Angryoctopus36@Gmail.Com', 1301, '[{"email":"angryoctopus36@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1285, 'Marisaw@Acog-Chicago.Net', NULL, 'Marisaw@Acog-Chicago.Net', 1302, '[{"email":"marisaw@acog-chicago.net","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1286, 'Jkvelazquezjr@Hammond.K12.In.Us', NULL, 'Jkvelazquezjr@Hammond.K12.In.Us', 1335, '[{"email":"jkvelazquezjr@hammond.k12.in.us","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1287, 'Garytaylorassembly@Gmail.Com', NULL, 'Garytaylorassembly@Gmail.Com', 1303, '[{"email":"garytaylorassembly@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1288, 'Barnstormersshowinfo@Gmail.Com', NULL, 'Barnstormersshowinfo@Gmail.Com', 1733, '[{"email":"barnstormersshowinfo@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '4031 M-139', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1289, 'Kklug@Beverlycc.Org', NULL, 'Kklug@Beverlycc.Org', 1304, '[{"email":"kklug@beverlycc.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1290, 'Kc111895@Gmail.Com', NULL, 'Kc111895@Gmail.Com', 1346, '[{"email":"kc111895@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '3271 W ILES AVE', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1291, 'Matt@Burlingtontap.Com', NULL, 'Matt@Burlingtontap.Com', 1734, '[{"email":"matt@burlingtontap.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '7305 McHenry St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1292, 'Erica.Cheers@Outlook.Com', NULL, 'Erica.Cheers@Outlook.Com', 1735, '[{"email":"erica.cheers@outlook.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1293, 'Evan.Tenenholtz@Gmail.Com', NULL, 'Evan.Tenenholtz@Gmail.Com', 1736, '[{"email":"evan.tenenholtz@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1294, 'Ira.Rose@Ymail.Com', NULL, 'Ira.Rose@Ymail.Com', 1736, '[{"email":"ira.rose@ymail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1295, 'Hawkshead18@Gmail.Com', NULL, 'Hawkshead18@Gmail.Com', 1341, '[{"email":"hawkshead18@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1296, 'Daniel.A.Jaehn@Powershealth.Org', NULL, 'Daniel.A.Jaehn@Powershealth.Org', 1737, '[{"email":"daniel.a.jaehn@powershealth.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1297, 'Heather.Scott5960@Gmail.Com', NULL, 'Heather.Scott5960@Gmail.Com', 1738, '[{"email":"heather.scott5960@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '3271 W ILES AVE', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1298, 'Countrytimekettlekorn@Gmail.Com', NULL, 'Countrytimekettlekorn@Gmail.Com', 1305, '[{"email":"countrytimekettlekorn@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '3709 miller', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1299, 'Cremeofthecropcatering@Gmail.Com', NULL, 'Cremeofthecropcatering@Gmail.Com', 1306, '[{"email":"cremeofthecropcatering@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '4460 Main Street', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1300, 'Contact@Mosswashing.Com', NULL, 'Contact@Mosswashing.Com', 1739, '[{"email":"contact@mosswashing.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1301, 'Daniel.May@Drinkswithdabney.Com', NULL, 'Daniel.May@Drinkswithdabney.Com', 1740, '[{"email":"daniel.may@drinkswithdabney.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '344 N Rose St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1302, 'Daniel.May@Drinkswithdabney.Com', NULL, 'Daniel.May@Drinkswithdabney.Com', 1740, '[{"email":"daniel.may@drinkswithdabney.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '344 N Rose St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1303, 'Missy@Daydreamerdomes.Com', NULL, 'Missy@Daydreamerdomes.Com', 1342, '[{"email":"missy@daydreamerdomes.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1304, 'Anthony.Lacroix@Warnerhospital.Org', NULL, 'Anthony.Lacroix@Warnerhospital.Org', 1307, '[{"email":"anthony.lacroix@warnerhospital.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '422 W WHITE ST', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1305, 'Anthony.Lacroix@Warnerhospital.Org', NULL, 'Anthony.Lacroix@Warnerhospital.Org', 1307, '[{"email":"anthony.lacroix@warnerhospital.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '422 W WHITE ST', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1306, 'Ale.Licea11@Gmail.Com', NULL, 'Ale.Licea11@Gmail.Com', 1741, '[{"email":"ale.licea11@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '1036 N KILBOURNE AVE', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1307, 'Hefedegreat@Gmail.Com', NULL, 'Hefedegreat@Gmail.Com', 1742, '[{"email":"hefedegreat@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1308, 'Rccoffey@Eiu.Edu', NULL, 'Rccoffey@Eiu.Edu', 1743, '[{"email":"rccoffey@eiu.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1309, 'Sjacobs@Eiu.Edu', NULL, 'Sjacobs@Eiu.Edu', 1743, '[{"email":"sjacobs@eiu.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1310, 'Palosemi000@Students.Elkhorn.K12.Wi.Us', NULL, 'Palosemi000@Students.Elkhorn.K12.Wi.Us', 1744, '[{"email":"palosemi000@students.elkhorn.k12.wi.us","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1311, 'Debbie.Sharpe@Gmail.Com', NULL, 'Debbie.Sharpe@Gmail.Com', 1745, '[{"email":"debbie.sharpe@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '1036 N KILBOURNE AVE', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1312, 'Jgronske@Epicburger.Com', NULL, 'Jgronske@Epicburger.Com', 1308, '[{"email":"jgronske@epicburger.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1313, 'Ruth.Bassett1959@Gmail.Com', NULL, 'Ruth.Bassett1959@Gmail.Com', 1309, '[{"email":"ruth.bassett1959@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1314, 'Findfaklandia@Gmail.Com', NULL, 'Findfaklandia@Gmail.Com', 1347, '[{"email":"findfaklandia@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1315, 'Findfaklandia@Gmail.Com', NULL, 'Findfaklandia@Gmail.Com', 1347, '[{"email":"findfaklandia@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '3807 S Packard Ave', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1316, 'Findfaklandia@Gmail.Com', NULL, 'Findfaklandia@Gmail.Com', 1347, '[{"email":"findfaklandia@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1317, 'Tkelly@Franciscancommunities.Org', NULL, 'Tkelly@Franciscancommunities.Org', 1746, '[{"email":"tkelly@franciscancommunities.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '1501 MERCY CREEK DR', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1318, 'Tkelly@Franciscancommunities.Org', NULL, 'Tkelly@Franciscancommunities.Org', 1746, '[{"email":"tkelly@franciscancommunities.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1319, 'Burimo@Hotmail.Com', NULL, 'Burimo@Hotmail.Com', 1348, '[{"email":"burimo@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1320, 'Gameonpeotone@Gmail.Com', NULL, 'Gameonpeotone@Gmail.Com', 1310, '[{"email":"gameonpeotone@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1321, 'Adam@Gejascafe.Com', NULL, 'Adam@Gejascafe.Com', 1747, '[{"email":"adam@gejascafe.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1322, 'Allie@Me.Com', NULL, 'Allie@Me.Com', 1336, '[{"email":"allie@me.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1323, 'Baldsilentbob70@Yahoo.Com', NULL, 'Baldsilentbob70@Yahoo.Com', 1336, '[{"email":"baldsilentbob70@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '1 W DUNES HWY', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1324, 'Baldsilentbob70@Yahoo.Com', NULL, 'Baldsilentbob70@Yahoo.Com', 1336, '[{"email":"baldsilentbob70@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '644 E Rand Rd', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1325, 'Gina@Golfvx.Com', NULL, 'Gina@Golfvx.Com', 451, '[{"email":"gina@golfvx.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '644 E Rand Rd', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1326, 'Jun@Golfvx.Com', NULL, 'Jun@Golfvx.Com', 451, '[{"email":"jun@golfvx.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '644 E Rand Rd', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1327, 'Todd@Hairycowbrewing.Com', NULL, 'Todd@Hairycowbrewing.Com', 1748, '[{"email":"todd@hairycowbrewing.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '410 E COLUMBUS DR', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1328, 'Ksimpson@Hampshireparkdistrict.Org', NULL, 'Ksimpson@Hampshireparkdistrict.Org', 1311, '[{"email":"ksimpson@hampshireparkdistrict.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1329, 'Jterrell@Heartlandalliance.Org', NULL, 'Jterrell@Heartlandalliance.Org', 1749, '[{"email":"jterrell@heartlandalliance.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '3500 S GILES AVE', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1330, 'Nbowe@Heritageal.Com', NULL, 'Nbowe@Heritageal.Com', 1750, '[{"email":"nbowe@heritageal.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1331, 'Adreifke@Heritageal.Com', NULL, 'Adreifke@Heritageal.Com', 1751, '[{"email":"adreifke@heritageal.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1332, 'Jlewandowski@Heritageal.Com', NULL, 'Jlewandowski@Heritageal.Com', 1349, '[{"email":"jlewandowski@heritageal.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1333, 'Jeffrey.Schoening@Independencevillages.Com', NULL, 'Jeffrey.Schoening@Independencevillages.Com', 1297, '[{"email":"jeffrey.schoening@independencevillages.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1334, 'Daniel.Neidlinger@Independencevillages.Com', NULL, 'Daniel.Neidlinger@Independencevillages.Com', 1354, '[{"email":"daniel.neidlinger@independencevillages.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1335, 'Lsiriphan@Independencevillages.Com', NULL, 'Lsiriphan@Independencevillages.Com', 1355, '[{"email":"lsiriphan@independencevillages.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1336, 'Aclayton53@Ivytech.Edu', NULL, 'Aclayton53@Ivytech.Edu', 1752, '[{"email":"aclayton53@ivytech.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '410 E COLUMBUS DR', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1337, 'Kleach27@Ivytech.Edu', NULL, 'Kleach27@Ivytech.Edu', 1752, '[{"email":"kleach27@ivytech.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '410 E COLUMBUS DR', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1338, 'Bseleb@Ivytech.Edu', NULL, 'Bseleb@Ivytech.Edu', 1752, '[{"email":"bseleb@ivytech.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1339, 'Mhinojosa5@Ivytech.Edu', NULL, 'Mhinojosa5@Ivytech.Edu', 1752, '[{"email":"mhinojosa5@ivytech.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1340, 'Bevnovakovic@Gmail.Com', NULL, 'Bevnovakovic@Gmail.Com', 1356, '[{"email":"bevnovakovic@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1341, 'Jelkallc@Gmail.Com', NULL, 'Jelkallc@Gmail.Com', 1356, '[{"email":"jelkallc@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '6326 1st A ve', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1342, 'Jewndorf@Stmonicasseniorliving.Com', NULL, 'Jewndorf@Stmonicasseniorliving.Com', 1357, '[{"email":"jewndorf@stmonicasseniorliving.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, 'N7891 US Highway 12', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1343, 'Sphillips@Athens-213.Org', NULL, 'Sphillips@Athens-213.Org', 1358, '[{"email":"sphillips@athens-213.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1344, 'Nick@Kiddieacademyil.Com', NULL, 'Nick@Kiddieacademyil.Com', 1753, '[{"email":"nick@kiddieacademyil.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1345, 'Olga@Kiddieacademyil.Com', NULL, 'Olga@Kiddieacademyil.Com', 1753, '[{"email":"olga@kiddieacademyil.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1346, 'Listwithmekrw@Gmail.Com', NULL, 'Listwithmekrw@Gmail.Com', 1359, '[{"email":"listwithmekrw@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1347, 'Aaront@Kbhouse.Org', NULL, 'Aaront@Kbhouse.Org', 1360, '[{"email":"aaront@kbhouse.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1348, 'Ksteffes@Kirbyhealth.Org', NULL, 'Ksteffes@Kirbyhealth.Org', 1312, '[{"email":"ksteffes@kirbyhealth.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1349, 'Kirk530@Gmail.Com', NULL, 'Kirk530@Gmail.Com', 1313, '[{"email":"kirk530@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1350, 'Fritsch_Indy@Yahoo.Com', NULL, 'Fritsch_Indy@Yahoo.Com', 1314, '[{"email":"fritsch_indy@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1351, 'Fritsch_Indy@Yahoo.Com', NULL, 'Fritsch_Indy@Yahoo.Com', 1314, '[{"email":"fritsch_indy@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1352, 'Janette.Solana@Lgyc.Org', NULL, 'Janette.Solana@Lgyc.Org', 1350, '[{"email":"janette.solana@lgyc.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1353, 'Thouke@Larabida.Org', NULL, 'Thouke@Larabida.Org', 1315, '[{"email":"thouke@larabida.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1354, 'Lmarcial@Anthemmemorycare.Com', NULL, 'Lmarcial@Anthemmemorycare.Com', 1754, '[{"email":"lmarcial@anthemmemorycare.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1355, 'Angelabrunette@Aol.Com', NULL, 'Angelabrunette@Aol.Com', 1316, '[{"email":"angelabrunette@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1356, 'Madisonpatch97@Gmail.Com', NULL, 'Madisonpatch97@Gmail.Com', 1343, '[{"email":"madisonpatch97@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1357, 'Robin@Lutherdale.Org', NULL, 'Robin@Lutherdale.Org', 1755, '[{"email":"robin@lutherdale.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1358, 'Grace@Lutherdale.Org', NULL, 'Grace@Lutherdale.Org', 1755, '[{"email":"grace@lutherdale.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1359, 'Robin@Lutherdale.Org', NULL, 'Robin@Lutherdale.Org', 1755, '[{"email":"robin@lutherdale.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, 'N7891 US Highway 12', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1360, 'Caitlyn@Macandcheeseshop.Com', NULL, 'Caitlyn@Macandcheeseshop.Com', 1351, '[{"email":"caitlyn@macandcheeseshop.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1361, 'Caitlyn@Macandcheeseshop.Com', NULL, 'Caitlyn@Macandcheeseshop.Com', 1351, '[{"email":"caitlyn@macandcheeseshop.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '2654 South Oneida', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1362, 'Rfamfoods@Gmail.Com', NULL, 'Rfamfoods@Gmail.Com', 1361, '[{"email":"rfamfoods@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '18849 Dixie Hwy', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1363, 'Morgan@Mapletreeinnrestaurant.Com', NULL, 'Morgan@Mapletreeinnrestaurant.Com', 660, '[{"email":"morgan@mapletreeinnrestaurant.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '8555 TAFT ST', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1364, 'Morgan@Mapletreeinnrestaurant.Com', NULL, 'Morgan@Mapletreeinnrestaurant.Com', 660, '[{"email":"morgan@mapletreeinnrestaurant.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '18849 Dixie Hwy', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1365, 'Krismcdonald74@Icloud.Com', NULL, 'Krismcdonald74@Icloud.Com', 1756, '[{"email":"krismcdonald74@icloud.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1366, 'Saboreskitchen@Gmail.Com', NULL, 'Saboreskitchen@Gmail.Com', 1757, '[{"email":"saboreskitchen@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1367, 'Saboreskitchen@Gmail.Com', NULL, 'Saboreskitchen@Gmail.Com', 1757, '[{"email":"saboreskitchen@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1368, 'Troy.Thorne@Gfs.Com', NULL, 'Troy.Thorne@Gfs.Com', 1317, '[{"email":"troy.thorne@gfs.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1369, 'Danna.Coleman@Rhs.Care', NULL, 'Danna.Coleman@Rhs.Care', 1337, '[{"email":"danna.coleman@rhs.care","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1370, 'Danna.Coleman@Rhs.Care', NULL, 'Danna.Coleman@Rhs.Care', 1337, '[{"email":"danna.coleman@rhs.care","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '8555 TAFT ST', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1371, 'Larhonda.Lindsey@Rhs.Care', NULL, 'Larhonda.Lindsey@Rhs.Care', 1337, '[{"email":"larhonda.lindsey@rhs.care","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '8555 TAFT ST', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1372, 'Danna.Coleman@Rhs.Care', NULL, 'Danna.Coleman@Rhs.Care', 1337, '[{"email":"danna.coleman@rhs.care","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1373, 'Ryan@Heardhosp.Com', NULL, 'Ryan@Heardhosp.Com', 1758, '[{"email":"ryan@heardhosp.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1374, 'Cateringandevents@Thefigandthepheasant.Com', NULL, 'Cateringandevents@Thefigandthepheasant.Com', NULL, '[{"email":"cateringandevents@thefigandthepheasant.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1375, 'Laurie.Nomellini@Central301.Net', NULL, 'Laurie.Nomellini@Central301.Net', 1759, '[{"email":"laurie.nomellini@central301.net","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1376, 'Tabitha.Gibson@Central301.Net', NULL, 'Tabitha.Gibson@Central301.Net', 1759, '[{"email":"tabitha.gibson@central301.net","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1377, 'Hortont@District65.Net', NULL, 'Hortont@District65.Net', 1760, '[{"email":"hortont@district65.net","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '1500 MCDANIEL AVE', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1378, 'Chefcelena1@Yahoo.Com', NULL, 'Chefcelena1@Yahoo.Com', 1318, '[{"email":"chefcelena1@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1379, 'Chefcelena1@Yahoo.Com', NULL, 'Chefcelena1@Yahoo.Com', 1318, '[{"email":"chefcelena1@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '2055 W BALMORAL AVE', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1380, 'Sophielima@Gmail.Com', NULL, 'Sophielima@Gmail.Com', 1319, '[{"email":"sophielima@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1381, 'Ktinoco@Nd.Edu', NULL, 'Ktinoco@Nd.Edu', 1338, '[{"email":"ktinoco@nd.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1382, 'Ktinoco@Nd.Edu', NULL, 'Ktinoco@Nd.Edu', 1338, '[{"email":"ktinoco@nd.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1383, 'Jdavis@Oakcrestdekalb.Org', NULL, 'Jdavis@Oakcrestdekalb.Org', 1761, '[{"email":"jdavis@oakcrestdekalb.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1384, 'Andrea.Diaz@Psd150.Org', NULL, 'Andrea.Diaz@Psd150.Org', 1762, '[{"email":"andrea.diaz@psd150.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1385, 'Miguel.Plata@Noahsarkwaterpark.Com', NULL, 'Miguel.Plata@Noahsarkwaterpark.Com', 1763, '[{"email":"miguel.plata@noahsarkwaterpark.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1386, 'Tonyaj@Paramountarts.Com', NULL, 'Tonyaj@Paramountarts.Com', 1320, '[{"email":"tonyaj@paramountarts.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1387, 'Tonyaj@Paramountarts.Com', NULL, 'Tonyaj@Paramountarts.Com', 1320, '[{"email":"tonyaj@paramountarts.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1388, 'Pauliesscheduling@Gmail.Com', NULL, 'Pauliesscheduling@Gmail.Com', NULL, '[{"email":"pauliesscheduling@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1389, 'Bwylie@Sblhs.Org', NULL, 'Bwylie@Sblhs.Org', 1321, '[{"email":"bwylie@sblhs.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1390, 'Info@Myperiperi.Com', NULL, 'Info@Myperiperi.Com', 1764, '[{"email":"info@myperiperi.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1391, 'Alegion18@Aol.Com', NULL, 'Alegion18@Aol.Com', 1322, '[{"email":"alegion18@aol.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1392, 'Amazarakos@Qualityinnbradley.Com', NULL, 'Amazarakos@Qualityinnbradley.Com', 1765, '[{"email":"amazarakos@qualityinnbradley.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1393, 'Kr.Sanderssmith@Gmail.Com', NULL, 'Kr.Sanderssmith@Gmail.Com', 1323, '[{"email":"kr.sanderssmith@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1394, 'Ryan.Quindt@Gmail.Com', NULL, 'Ryan.Quindt@Gmail.Com', 1766, '[{"email":"ryan.quindt@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1395, 'Foodmgr@Raderfamilyfarms.Com', NULL, 'Foodmgr@Raderfamilyfarms.Com', 1767, '[{"email":"foodmgr@raderfamilyfarms.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1396, 'Ahurley@Ridgecc.Org', NULL, 'Ahurley@Ridgecc.Org', 912, '[{"email":"ahurley@ridgecc.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1397, 'Jlamey@Ridgecc.Org', NULL, 'Jlamey@Ridgecc.Org', 912, '[{"email":"jlamey@ridgecc.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1398, 'Awallace@Rockfordrivets.Com', NULL, 'Awallace@Rockfordrivets.Com', 1768, '[{"email":"awallace@rockfordrivets.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1399, 'Hannas@Rockfordrivets.Com', NULL, 'Hannas@Rockfordrivets.Com', 1768, '[{"email":"hannas@rockfordrivets.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1400, 'Lhagens@Organiclifeusa.Com', NULL, 'Lhagens@Organiclifeusa.Com', 1769, '[{"email":"lhagens@organiclifeusa.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '305 Oakton St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1401, 'Christine_A_Hartney@Rush.Edu', NULL, 'Christine_A_Hartney@Rush.Edu', 1324, '[{"email":"christine_a_hartney@rush.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1402, 'Donald@Hoohaven.Org', NULL, 'Donald@Hoohaven.Org', 1325, '[{"email":"donald@hoohaven.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1403, 'Rockfalls@Live.Com', NULL, 'Rockfalls@Live.Com', 1325, '[{"email":"rockfalls@live.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1404, 'Donald@Hoohaven.Org', NULL, 'Donald@Hoohaven.Org', 1325, '[{"email":"donald@hoohaven.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1405, 'Pmiller1706@Gmail.Com', NULL, 'Pmiller1706@Gmail.Com', 1770, '[{"email":"pmiller1706@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1406, 'Tsorrentino@Sos.Org', NULL, 'Tsorrentino@Sos.Org', 1771, '[{"email":"tsorrentino@sos.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '4105 Naperville Rd', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1407, 'Sherri.Broadnax@Yahoo.Com', NULL, 'Sherri.Broadnax@Yahoo.Com', 1772, '[{"email":"sherri.broadnax@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1408, 'Mikes@Spring-Brook.Com', NULL, 'Mikes@Spring-Brook.Com', 1773, '[{"email":"mikes@spring-brook.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1409, 'Trudyp@Spring-Brook.Com', NULL, 'Trudyp@Spring-Brook.Com', 1773, '[{"email":"trudyp@spring-brook.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1410, 'Mikes@Spring-Brook.Com', NULL, 'Mikes@Spring-Brook.Com', 1773, '[{"email":"mikes@spring-brook.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '242 LAKE SHORE DR', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1411, 'Cbennett@Squarerootscp.Com', NULL, 'Cbennett@Squarerootscp.Com', 1025, '[{"email":"cbennett@squarerootscp.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1412, 'Kellyrmarks@Gmail.Com', NULL, 'Kellyrmarks@Gmail.Com', 1339, '[{"email":"kellyrmarks@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1413, 'Eli.Ramos@Storypoint.Com', NULL, 'Eli.Ramos@Storypoint.Com', 1326, '[{"email":"eli.ramos@storypoint.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1414, 'Luisflres12345@Gmail.Com', NULL, 'Luisflres12345@Gmail.Com', 1774, '[{"email":"luisflres12345@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1415, '.Surestaylombard@Gmail.Com', NULL, '.Surestaylombard@Gmail.Com', 1775, '[{"email":"gm.surestaylombard@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1416, 'Mr2007.Mf@Gmail.Com', NULL, 'Mr2007.Mf@Gmail.Com', 1340, '[{"email":"mr2007.mf@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1417, 'Faraz@Tandoorchicago.Com', NULL, 'Faraz@Tandoorchicago.Com', 1776, '[{"email":"faraz@tandoorchicago.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1418, 'Faraz@Tandoorchicago.Com', NULL, 'Faraz@Tandoorchicago.Com', 1776, '[{"email":"faraz@tandoorchicago.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1419, 'Tacostaqueromucho@Gmail.Com', NULL, 'Tacostaqueromucho@Gmail.Com', 1777, '[{"email":"tacostaqueromucho@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '3517 N Spaulding Ave', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1420, 'Spencer@Cellardoorbar.Com', NULL, 'Spencer@Cellardoorbar.Com', 1778, '[{"email":"spencer@cellardoorbar.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '1901 Franklin St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1421, 'Alyssahartness@Gmail.Com', NULL, 'Alyssahartness@Gmail.Com', 1327, '[{"email":"alyssahartness@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1422, 'Alonso@Matrixvenue.Com', NULL, 'Alonso@Matrixvenue.Com', 1328, '[{"email":"alonso@matrixvenue.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1423, 'Alonso@Matrixvenue.Com', NULL, 'Alonso@Matrixvenue.Com', 1328, '[{"email":"alonso@matrixvenue.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '808 S Route 59', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1424, 'Sabrina32620@Hotmail.Com', NULL, 'Sabrina32620@Hotmail.Com', 1329, '[{"email":"sabrina32620@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1425, 'Sabrina32620@Hotmail.Com', NULL, 'Sabrina32620@Hotmail.Com', 1329, '[{"email":"sabrina32620@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1426, 'Patti.Fairmont@Gmail.Com', NULL, 'Patti.Fairmont@Gmail.Com', 1330, '[{"email":"patti.fairmont@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1427, 'Patti.Fairmont@Gmail.Com', NULL, 'Patti.Fairmont@Gmail.Com', 1330, '[{"email":"patti.fairmont@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1428, 'Dluna@Southholland.Org', NULL, 'Dluna@Southholland.Org', 1779, '[{"email":"dluna@southholland.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1429, 'Kshannon@Woodsofcaledonia.Com', NULL, 'Kshannon@Woodsofcaledonia.Com', 1363, '[{"email":"kshannon@woodsofcaledonia.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1430, 'Olivera.Bezanovic@Trinity-Health.Org', NULL, 'Olivera.Bezanovic@Trinity-Health.Org', 1780, '[{"email":"olivera.bezanovic@trinity-health.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1431, 'Sofia.Quirk@Trinity-Health.Org', NULL, 'Sofia.Quirk@Trinity-Health.Org', 1331, '[{"email":"sofia.quirk@trinity-health.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1432, 'Sofia.Quirk@Trinity-Health.Org', NULL, 'Sofia.Quirk@Trinity-Health.Org', 1331, '[{"email":"sofia.quirk@trinity-health.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1433, 'Andi.White@Saintalphonsus.Org', NULL, 'Andi.White@Saintalphonsus.Org', 1781, '[{"email":"andi.white@saintalphonsus.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1434, 'Jody.Mcghee@Timber-Lee.Com', NULL, 'Jody.Mcghee@Timber-Lee.Com', 1353, '[{"email":"jody.mcghee@timber-lee.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1435, 'Jody.Mcghee@Timber-Lee.Com', NULL, 'Jody.Mcghee@Timber-Lee.Com', 1353, '[{"email":"jody.mcghee@timber-lee.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, 'N8705 Scout Rd', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1436, 'Info@Tinyscoffeebar.Com', NULL, 'Info@Tinyscoffeebar.Com', 1782, '[{"email":"info@tinyscoffeebar.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1437, 'Dsprocurement@Housing.Illinois.Edu', NULL, 'Dsprocurement@Housing.Illinois.Edu', 1332, '[{"email":"dsprocurement@housing.illinois.edu","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1438, 'Brett Stein', 'Brett', 'Stein', 1790, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1439, 'Don Omachel', 'Don', 'Omachel', 1790, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1440, 'Nuck', NULL, 'Nuck', 1790, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1441, 'Tom.Taylor@Sodexo.Com', NULL, 'Tom.Taylor@Sodexo.Com', 1783, '[{"email":"tom.taylor@sodexo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1442, 'Creidy@Woodridgeparks.Org', NULL, 'Creidy@Woodridgeparks.Org', 1784, '[{"email":"creidy@woodridgeparks.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1443, 'Andyvallejo90@Icloud.Com', NULL, 'Andyvallejo90@Icloud.Com', 1785, '[{"email":"andyvallejo90@icloud.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1444, 'D52Kwidm@D52Schools.Com', NULL, 'D52Kwidm@D52Schools.Com', 1333, '[{"email":"d52kwidm@d52schools.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1445, 'Anaples@Wc314.Org', NULL, 'Anaples@Wc314.Org', 1364, '[{"email":"anaples@wc314.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1446, 'Tdouglas@Whd147.Org', NULL, 'Tdouglas@Whd147.Org', 1787, '[{"email":"tdouglas@whd147.org","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1447, 'Vwilliams@Heritagegolfgroup.Com', NULL, 'Vwilliams@Heritagegolfgroup.Com', 1788, '[{"email":"vwilliams@heritagegolfgroup.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '250 W Greggs Pkwy', NULL, NULL, NULL, 'USA', NULL, NULL),
  (1448, 'Bernhagen265@Gmail.Com', NULL, 'Bernhagen265@Gmail.Com', 1789, '[{"email":"bernhagen265@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1449, 'Jvandyke@Wuskowhan.Com', NULL, 'Jvandyke@Wuskowhan.Com', 1344, '[{"email":"jvandyke@wuskowhan.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1450, 'Unknown', NULL, NULL, NULL, '[{"email":"jovani.gomez@abbvie.com","type":"work"}]'::jsonb, '[{"number":"18479327900","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1451, 'Unknown', NULL, NULL, NULL, '[{"email":"tyler.ringer@abbvie.com","type":"work"}]'::jsonb, '[{"number":"18479388660","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1452, 'Unknown', NULL, NULL, NULL, '[{"email":"addison.kristin@yahoo.com","type":"work"}]'::jsonb, '[{"number":"18473970111","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1453, 'Unknown', NULL, NULL, NULL, '[{"email":"acihlar@co.door.wi.us","type":"work"}]'::jsonb, '[{"number":"12626056646","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1454, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17732527200","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1455, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13128670110","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1456, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17737686555","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1457, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1458, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1459, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1460, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17736671500","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1461, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18478433993","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1462, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18003828540","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1463, 'Unknown', NULL, NULL, 78, '[]'::jsonb, '[{"number":"17735252522","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1464, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12692810022","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1465, 'Unknown', NULL, NULL, 1304, '[]'::jsonb, '[{"number":"17086368700","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1466, 'Unknown', NULL, NULL, 112, '[]'::jsonb, '[{"number":"16303263204","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1467, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13126677620","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1468, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13123376070","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1469, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16307719400","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1470, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16174774519","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1471, 'Unknown', NULL, NULL, 157, '[]'::jsonb, '[{"number":"18722447065","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1472, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12625392015","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1473, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16146213663","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1474, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13128882479","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1475, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1476, 'Unknown', NULL, NULL, 1735, '[]'::jsonb, '[{"number":"12197286558","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1477, 'Unknown', NULL, NULL, 212, '[]'::jsonb, '[{"number":"18883330318","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1478, 'Unknown', NULL, NULL, 219, '[]'::jsonb, '[{"number":"13124271825","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1479, 'Unknown', NULL, NULL, 1736, '[]'::jsonb, '[{"number":"13126422220","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1480, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12696374755","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1481, 'Unknown', NULL, NULL, 1737, '[]'::jsonb, '[{"number":"12198361600","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1482, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16308870123","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1483, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16362251300","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1484, 'Unknown', NULL, NULL, 257, '[]'::jsonb, '[{"number":"13124558626","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1485, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12627459175","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1486, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18159548767","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1487, 'Unknown', NULL, NULL, 1739, '[]'::jsonb, '[{"number":"15748259696","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1488, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12694759965","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1489, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12699060916","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1490, 'Unknown', NULL, NULL, 297, '[]'::jsonb, '[{"number":"13123628000","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1491, 'Unknown', NULL, NULL, 301, '[]'::jsonb, '[{"number":"13125271065","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1492, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12179359571","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1493, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13127872200","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1494, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16305710000","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1495, 'Unknown', NULL, NULL, 1741, '[]'::jsonb, '[{"number":"17084182041","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1496, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16084378464","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1497, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16305300111","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1498, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18153569980","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1499, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13125275800","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1500, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12175813000","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1501, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12627234920","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1502, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17732356361","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1503, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13122573262","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1504, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13122436097","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1505, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17735233876","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1506, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18885735727","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1507, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13125658000","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1508, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1509, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1510, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1511, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"14142128694","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1512, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"19205636324","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1513, 'Unknown', NULL, NULL, 392, '[]'::jsonb, '[{"number":"16308607100","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1514, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12198652141","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1515, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17089498553","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1516, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17732819101","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1517, 'Unknown', NULL, NULL, 436, '[]'::jsonb, '[{"number":"18479289900","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1518, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13124926262","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1519, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12198099047","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1520, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18477491054","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1521, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13122432158","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1522, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18154068198","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1523, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18476832690","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1524, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16309533400","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1525, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13126380700","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1526, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17734331200","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1527, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16308505555","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1528, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12486894110","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1529, 'Unknown', NULL, NULL, 510, '[]'::jsonb, '[{"number":"13126248651","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1530, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17736878667","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1531, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17152303405","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1532, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"14144257155","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1533, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"14143029700","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1534, 'Unknown', NULL, NULL, 1461, '[]'::jsonb, '[{"number":"18475181234","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1535, 'Unknown', NULL, NULL, 1297, '[]'::jsonb, '[{"number":"15152922858","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1536, 'Unknown', NULL, NULL, 1354, '[]'::jsonb, '[{"number":"13177452766","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1537, 'Unknown', NULL, NULL, 1355, '[]'::jsonb, '[{"number":"15159874100","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1538, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12193923600","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1539, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16305738180","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1540, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16083226564","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1541, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12193068071","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1542, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16305151745","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1543, 'Unknown', NULL, NULL, 1753, '[]'::jsonb, '[{"number":"17086287401","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1544, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12143330310","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1545, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16303232250","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1546, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12177622115","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1547, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17085746001","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1548, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18155841650","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1549, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17736048769","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1550, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12622455155","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1551, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1552, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17733636700","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1553, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17738626600","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1554, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18479070302","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1555, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1556, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18475445300","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1557, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17732767110","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1558, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18157226716","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1559, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12318433663","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1560, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12627422352","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1561, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16307392605","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1562, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18155494812","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1563, 'Unknown', NULL, NULL, 658, '[]'::jsonb, '[{"number":"13129448888","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1564, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17083883461","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1565, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12694292941","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1566, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18156081544","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1567, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18159627944","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1568, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12197694005","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1569, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18723153947","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1570, 'Unknown', NULL, NULL, 704, '[]'::jsonb, '[{"number":"17737966523","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1571, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"14142738709","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1572, 'Unknown', NULL, NULL, 723, '[]'::jsonb, '[{"number":"18003566639","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1573, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1574, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1575, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1576, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1577, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1578, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1579, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1580, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17734775845","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1581, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18157531000","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1582, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18474913741","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1583, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1584, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1585, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1586, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1587, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17087480495","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1588, 'Bryant Mitchell (Mitch)', 'Bryant Mitchell', '(Mitch)', NULL, '[]'::jsonb, '[{"number":"13126665335","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1589, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1590, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1591, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1592, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18007772551","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1593, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"16305758700","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1594, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13127267777","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1595, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1596, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17654944600","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1597, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1598, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"19377755542","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1599, 'Unknown', NULL, NULL, 890, '[]'::jsonb, '[{"number":"16306277708","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1600, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18473034100","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1601, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1602, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1603, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1604, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1605, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1606, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1607, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1608, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1609, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1610, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1611, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1612, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1613, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1614, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"17738808044","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1615, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1616, 'Unknown', NULL, NULL, 1363, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1617, 'Unknown', NULL, NULL, 1353, '[]'::jsonb, '[{"number":"12626420315","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1618, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12194270418","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1619, 'Unknown', NULL, NULL, 1137, '[]'::jsonb, '[{"number":"17737021600","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1620, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13124130238","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1621, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13129651708","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1622, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13124277800","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1623, 'Unknown', NULL, NULL, 1144, '[]'::jsonb, '[{"number":"13127262840","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1624, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"12173331000","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1625, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1626, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13092205397","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1627, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1628, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1629, 'Unknown', NULL, NULL, 1785, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1630, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1631, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1632, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18004416287","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1633, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1634, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"18158386941","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1635, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1636, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1637, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1638, 'Unknown', NULL, NULL, 1344, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1639, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[{"number":"13129999760","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1640, 'Tom Lynhome', 'Tom', 'Lynhome', 1793, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1641, 'Matthew Voss', 'Matthew', 'Voss', 1794, '[{"email":"filastname@vifoodsystems.com","type":"work"}]'::jsonb, '[{"number":"13303720431","type":"work"}]'::jsonb, 'Buyer', NULL, '2590 Elm Rd. NE.', 'warren', 'OH', NULL, 'USA', NULL, NULL),
  (1642, 'Wendy Kapsal', 'Wendy', 'Kapsal', 1794, '[{"email":"filastname@vifoodsystems.com","type":"work"}]'::jsonb, '[{"number":"13303720431","type":"work"}]'::jsonb, 'Buyer', NULL, '2590 Elm Rd. NE.', 'warren', 'OH', NULL, 'USA', NULL, NULL),
  (1643, 'James Falcone', 'James', 'Falcone', 1794, '[{"email":"filastname@vifoodsystems.com","type":"work"}]'::jsonb, '[{"number":"13303720431","type":"work"}]'::jsonb, 'Buyer', NULL, '2590 Elm Rd. NE.', 'warren', 'OH', NULL, 'USA', NULL, NULL),
  (1644, 'Kathy Plubell', 'Kathy', 'Plubell', 1794, '[{"email":"filastname@vifoodsystems.com","type":"work"}]'::jsonb, '[{"number":"13303720431","type":"work"}]'::jsonb, 'Buyer', NULL, '2590 Elm Rd. NE.', 'warren', 'OH', NULL, 'USA', NULL, NULL),
  (1645, 'Adam Bostwick', 'Adam', 'Bostwick', 1487, '[{"email":"adam.bostwick@isfoods.com","type":"work"}]'::jsonb, '[{"number":"12169905579","type":"work"}]'::jsonb, 'Exec Chef', NULL, NULL, 'twinsburg', 'OH', NULL, 'USA', NULL, NULL),
  (1646, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1647, 'Ryan Lamere', 'Ryan', 'Lamere', 357, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1648, 'Ryan Olivas', 'Ryan', 'Olivas', NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1649, 'Chris Pavlou', 'Chris', 'Pavlou', 1791, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1650, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1651, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1652, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1653, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1654, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1655, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1656, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1657, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1658, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1659, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1660, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1661, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1662, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1663, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1664, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1665, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1666, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1667, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1668, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1669, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1670, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1671, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1672, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1673, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1674, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1675, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1676, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1677, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1678, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1679, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1680, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1681, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1682, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1683, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1684, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1685, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1686, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1687, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1688, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1689, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1690, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1691, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1692, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1693, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1694, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1695, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1696, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1697, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1698, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1699, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1700, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1701, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1702, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1703, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1704, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1705, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1706, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1707, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1708, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1709, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1710, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1711, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1712, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1713, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1714, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1715, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1716, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1717, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1718, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1719, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1720, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1721, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1722, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1723, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1724, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1725, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1726, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1727, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1728, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1729, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1730, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1731, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1732, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1733, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1734, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1735, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1736, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1737, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1738, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1739, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1740, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1741, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1742, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1743, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1744, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1745, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1746, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1747, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1748, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1749, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1750, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1751, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1752, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1753, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1754, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1755, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1756, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1757, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1758, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1759, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1760, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1761, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1762, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1763, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1764, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1765, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1766, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1767, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1768, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1769, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1770, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1771, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1772, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1773, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1774, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1775, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1776, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1777, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1778, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1779, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1780, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1781, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1782, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1783, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1784, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1785, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1786, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1787, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1788, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1789, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1790, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1791, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1792, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1793, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1794, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1795, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1796, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1797, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1798, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1799, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1800, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1801, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1802, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1803, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1804, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1805, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1806, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1807, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1808, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1809, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1810, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1811, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1812, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1813, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1814, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1815, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1816, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1817, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1818, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1819, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1820, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1821, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1822, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1823, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1824, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1825, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1826, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1827, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1828, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1829, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1830, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1831, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1832, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1833, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1834, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1835, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1836, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1837, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1838, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1839, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1840, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1841, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1842, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1843, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1844, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1845, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1846, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1847, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1848, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1849, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1850, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1851, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1852, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1853, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1854, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1855, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1856, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1857, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1858, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1859, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1860, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1861, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1862, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1863, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1864, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1865, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1866, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1867, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1868, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1869, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1870, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1871, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1872, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1873, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1874, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1875, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1876, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1877, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1878, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1879, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1880, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1881, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1882, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1883, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1884, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1885, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1886, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1887, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1888, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1889, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1890, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1891, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1892, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1893, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1894, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1895, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1896, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1897, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1898, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1899, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1900, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1901, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1902, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1903, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1904, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1905, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1906, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1907, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1908, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1909, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1910, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1911, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1912, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1913, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1914, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1915, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1916, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1917, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1918, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1919, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1920, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1921, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1922, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1923, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1924, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1925, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1926, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1927, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1928, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1929, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1930, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1931, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1932, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1933, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1934, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1935, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1936, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1937, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1938, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1939, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1940, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1941, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1942, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1943, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1944, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1945, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1946, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1947, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1948, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1949, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1950, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1951, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1952, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1953, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1954, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1955, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1956, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1957, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1958, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1959, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1960, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1961, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1962, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1963, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1964, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1965, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1966, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1967, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1968, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1969, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1970, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1971, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1972, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1973, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1974, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1975, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1976, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1977, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1978, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1979, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1980, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1981, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1982, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1983, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1984, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1985, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1986, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1987, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1988, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1989, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1990, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1991, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1992, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1993, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1994, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1995, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1996, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1997, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1998, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (1999, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2000, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2001, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2002, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2003, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2004, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2005, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2006, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2007, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2008, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2009, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2010, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2011, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2012, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2013, 'Unknown', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL);

-- ============================================================================
-- RESET SEQUENCES (critical for new record creation)
-- ============================================================================
-- After inserting with explicit IDs, sequences must be updated to prevent conflicts
-- Without this, new records will fail with "duplicate key value violates unique constraint"

SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations));
SELECT setval('contacts_id_seq', (SELECT MAX(id) FROM contacts));

-- ============================================================================
-- VALIDATION QUERIES (run these to verify)
-- ============================================================================

-- Check counts
-- SELECT COUNT(*) as org_count FROM organizations;
-- SELECT COUNT(*) as contact_count FROM contacts;

-- Check no orphaned contacts
-- SELECT COUNT(*) as orphaned FROM contacts
-- WHERE organization_id IS NOT NULL
--   AND organization_id NOT IN (SELECT id FROM organizations);

-- Sample relationships
-- SELECT c.name as contact, o.name as organization
-- FROM contacts c
-- JOIN organizations o ON c.organization_id = o.id
-- LIMIT 5;
