-- ============================================================================
-- TEST SEED DATA - Generated from CSV files (SUBSET)
-- ============================================================================
-- This is a TEST file with 100 organizations and 36 contacts
-- Generated: 2025-10-27T22:16:05.247Z
--
-- DO NOT use this in production - this is for testing the approach
-- Run with: psql <connection> -f supabase/test-seed.sql
-- ============================================================================

-- Test user (from original seed.sql)
-- Note: This is simplified - you may need to preserve the full test user setup

-- ============================================================================
-- ORGANIZATIONS (99 unique)
-- ============================================================================

INSERT INTO organizations (id, name, organization_type, priority, phone, linkedin_url, address, city, state, postal_code, notes) VALUES
  (1, '040 KITCHEN INC', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (2, '2d Restaurant', 'unknown', 'D', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (3, '7 K FARMS, INC.', 'distributor', 'D', NULL, NULL, NULL, NULL, 'IN', NULL, ''),
  (4, 'U. S. FOODSERVICE--CINCINNATI', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (5, '7 Monks Taproom Grand Rapids', 'unknown', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (6, '8 hospitality group', 'customer', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Hubbard Inn, MASQ joy, district parlay joy, parlay, LINKIN PARK, HVAC, pub, LIQR taco pub Cardoza''s pub Caf� Banda never have I ever'),
  (7, '86 FOOD SERVICE', 'unknown', 'C', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (8, '90 miles Cuban cafe', 'unknown', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (9, 'A & G FOODSERVICE', 'distributor', 'D', NULL, NULL, NULL, 'Chicago', 'IL', NULL, ''),
  (10, 'A Little Taste of Texas', 'customer', 'C', NULL, NULL, NULL, 'Glasgow', 'KY', NULL, 'email about samples cheese curds'),
  (11, 'A Plus Inc DBA: Noodles Etc', 'unknown', 'A', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (12, 'A&W', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
  (13, 'A.Fusion', 'customer', 'D', NULL, NULL, '4601 lincoln Highway', 'Matteson', 'IL', NULL, 'Garlic & Sriracha interest. End up purchasing original &jalape�o from PFG'),
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
  (28, 'Allen County School�s Food Service', 'customer', 'C', NULL, NULL, NULL, NULL, NULL, NULL, ''),
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
  (88, 'Barley�s Brewing Company Ale House #1', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, ''),
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
  (99, 'Beard and Belly', 'customer', 'B', NULL, NULL, NULL, NULL, NULL, NULL, '');

-- ============================================================================
-- CONTACTS (36 total)
-- ============================================================================

INSERT INTO contacts (id, name, first_name, last_name, organization_id, email, phone, title, department, address, city, state, postal_code, country, linkedin_url, notes) VALUES
  (1, 'Thor', NULL, 'Thor', 25, '[{"email":"aliceandfriendsvegankitchen@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (2, 'Darryl', NULL, 'Darryl', 27, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (3, 'Rodriguez', NULL, 'Rodriguez', 30, '[{"email":"elierrod@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (4, 'Cornell', NULL, 'Cornell', 31, '[{"email":"kyeandkris@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (5, 'Unknown', NULL, NULL, 34, '[{"email":"osroc44@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, 'President', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (6, 'Corso', NULL, 'Corso', 35, '[{"email":"osroc44@yahoo.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (7, 'Chef Tinaglia', 'Chef', 'Tinaglia', 42, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (8, 'Jay-', NULL, 'Jay-', 44, '[]'::jsonb, '[{"number":"12247352450.0","type":"work"}]'::jsonb, 'Manager', NULL, '111 W Campbell St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (9, 'Michael Campenil - Greco', 'Michael Campenil -', 'Greco', 44, '[]'::jsonb, '[{"number":"12247352450.0","type":"work"}]'::jsonb, 'Distributor Rep', NULL, '111 W Campbell St', NULL, NULL, NULL, 'USA', NULL, NULL),
  (10, 'Don Smith', 'Don', 'Smith', 63, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, 'In charge of all purchases for store'),
  (11, 'Mike', NULL, 'Mike', 63, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (12, 'Max', NULL, 'Max', 63, '[]'::jsonb, '[]'::jsonb, 'Distributor Rep', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (13, 'Spencer Beverly', 'Spencer', 'Beverly', 69, '[{"email":"spencer_beverly@hotmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (14, 'Cardelli', NULL, 'Cardelli', 78, '[]'::jsonb, '[]'::jsonb, 'Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (15, 'Kyle Ramsy', 'Kyle', 'Ramsy', 79, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (16, 'Paul Ramsy', 'Paul', 'Ramsy', 79, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (17, 'Community Engagement', 'Community', 'Engagement', 79, '[]'::jsonb, '[]'::jsonb, 'Vp', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (18, 'David Tsirekas Craig Richardson', 'David Tsirekas Craig', 'Richardson', 93, '[{"email":"craigbnb@gmail.com","type":"work"}]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (19, 'Arjay Liarakos', 'Arjay', 'Liarakos', 48, '[{"email":"aliarakos@artisanspecialtyfoods.com","type":"work"}]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (20, 'Jennifer Baldwin', 'Jennifer', 'Baldwin', 56, '[{"email":"jennifer.baldwin@atlanticfoods.biz","type":"work"}]'::jsonb, '[{"number":"15136002267.0","type":"work"}]'::jsonb, 'Distributor Slot Decisionmaker', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (21, 'Lonnie', NULL, 'Lonnie', 56, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (22, 'Christine Manolakis', 'Christine', 'Manolakis', 56, '[{"email":"chistina@atlanticfoods.biz","type":"work"}]'::jsonb, '[]'::jsonb, 'Buyer', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (23, 'Kristina Clark', 'Kristina', 'Clark', 56, '[{"email":"kristina.clark@atlanticfoods.biz","type":"work"}]'::jsonb, '[]'::jsonb, 'Executive', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (24, 'Ron Peterson', 'Ron', 'Peterson', 56, '[{"email":"ron.peterson@atlanticfoods.biz","type":"work"}]'::jsonb, '[{"number":"13308315946.0","type":"work"}]'::jsonb, 'Distributor Rep', NULL, '430 6th ST SE Canton', 'Canton', NULL, '44702.0', 'USA', NULL, NULL),
  (25, 'Nick Albanos', 'Nick', 'Albanos', 22, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (26, 'Matt Regula', 'Matt', 'Regula', 75, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (27, 'Sue And Tim', 'Sue And', 'Tim', 53, '[{"email":"newt3013@yahoo.com","type":"work"}]'::jsonb, '[{"number":"17083885520.0","type":"work"}]'::jsonb, 'Owner', NULL, '4901 cal sag rd', 'Crestwood', 'IL', '60445.0', 'USA', NULL, NULL),
  (28, 'Matt Regula', 'Matt', 'Regula', 75, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, 'Brea', 'OH', NULL, 'USA', NULL, NULL),
  (29, 'Ched Brent', 'Ched', 'Brent', 51, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (30, 'Peter Shuey', 'Peter', 'Shuey', 74, '[]'::jsonb, '[]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (31, 'Trevor', NULL, 'Trevor', 52, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (32, 'Adam Bliter', 'Adam', 'Bliter', 52, '[]'::jsonb, '[]'::jsonb, 'Manager', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (33, 'Panos', NULL, 'Panos', 64, '[]'::jsonb, '[]'::jsonb, 'Exec Chef', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (34, 'Tommy Rhodes', 'Tommy', 'Rhodes', 87, '[{"email":"tommy@barefootrepublic.org","type":"work"}]'::jsonb, '[{"number":"16155999683.0","type":"work"}]'::jsonb, 'Owner', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (35, 'Jack Gilbertson', 'Jack', 'Gilbertson', 21, '[]'::jsonb, '[]'::jsonb, 'Buyer', NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL),
  (36, 'Unknown', NULL, NULL, 78, '[]'::jsonb, '[{"number":"17735252522.0","type":"work"}]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL);

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
