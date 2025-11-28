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
