-- ============================================================================
-- PART 11: OPPORTUNITIES (50 opportunities)
-- ============================================================================
-- Even distribution across 7 stages (~7 per stage):
--   new_lead, initial_outreach, sample_visit_offered, feedback_logged,
--   demo_scheduled, closed_won, closed_lost
-- Links Principal + Distributor (optional) + Customer
-- ============================================================================

INSERT INTO "public"."opportunities" (
  id, name, principal_id, customer_id, distributor_id, sales_id,
  stage, contact_id, expected_close_date, description,
  created_at, updated_at
)
VALUES
  -- ========================================
  -- NEW_LEAD (7 opportunities)
  -- ========================================
  (1, 'McCRUM Fries - Capital Grille', 1, 20, 10, 2,
   'new_lead', 39, CURRENT_DATE + INTERVAL '60 days',
   'Potential to replace current fry supplier with premium Idaho product',
   NOW() - INTERVAL '2 days', NOW()),

  (2, 'SWAP Plant-Based - Panera', 2, 27, 11, 3,
   'new_lead', 53, CURRENT_DATE + INTERVAL '45 days',
   'Interest in plant-based options for menu expansion',
   NOW() - INTERVAL '5 days', NOW()),

  (3, 'Rapid Rasoi - Marriott Banquets', 3, 30, 12, 3,
   'new_lead', 59, CURRENT_DATE + INTERVAL '90 days',
   'Indian cuisine for convention center catering',
   NOW() - INTERVAL '1 day', NOW()),

  (4, 'Lakeview Farms - Sunrise Senior', 4, 38, 13, 4,
   'new_lead', 76, CURRENT_DATE + INTERVAL '30 days',
   'Dessert and dip products for senior dining',
   NOW() - INTERVAL '3 days', NOW()),

  (5, 'Frico Cheese - Mortons', 5, 22, 18, 4,
   'new_lead', 43, CURRENT_DATE + INTERVAL '75 days',
   'Premium Italian cheeses for tableside presentations',
   NOW() - INTERVAL '4 days', NOW()),

  (6, 'Anchor Butter - Ruth''s Chris', 6, 21, 10, 5,
   'new_lead', 41, CURRENT_DATE + INTERVAL '55 days',
   'NZ grass-fed butter for signature dishes',
   NOW() - INTERVAL '6 days', NOW()),

  (7, 'Custom Culinary - HCA Healthcare', 9, 33, 11, 6,
   'new_lead', 66, CURRENT_DATE + INTERVAL '120 days',
   'Soup bases for hospital nutrition services',
   NOW() - INTERVAL '7 days', NOW()),

  -- ========================================
  -- INITIAL_OUTREACH (7 opportunities)
  -- ========================================
  (8, 'McCRUM Hash Browns - Hilton', 1, 31, 11, 2,
   'initial_outreach', 62, CURRENT_DATE + INTERVAL '50 days',
   'Breakfast program hash brown supply',
   NOW() - INTERVAL '10 days', NOW()),

  (9, 'SWAP Oat Milk - Shake Shack', 2, 29, 19, 3,
   'initial_outreach', 57, CURRENT_DATE + INTERVAL '40 days',
   'Barista oat milk for shake menu expansion',
   NOW() - INTERVAL '12 days', NOW()),

  (10, 'Rapid Rasoi Naan - Buffalo Wild Wings', 3, 25, 13, 3,
   'initial_outreach', 49, CURRENT_DATE + INTERVAL '35 days',
   'Naan as appetizer/shareables addition',
   NOW() - INTERVAL '8 days', NOW()),

  (11, 'Lakeview Parfaits - Sodexo Campus', 4, 36, 12, 4,
   'initial_outreach', 72, CURRENT_DATE + INTERVAL '60 days',
   'Grab-and-go parfaits for campus retail',
   NOW() - INTERVAL '14 days', NOW()),

  (12, 'Frico Parmesan - Levy Restaurants', 5, 39, 18, 4,
   'initial_outreach', 78, CURRENT_DATE + INTERVAL '45 days',
   'Premium Parmesan for stadium premium suites',
   NOW() - INTERVAL '9 days', NOW()),

  (13, 'Tattooed Chef - Chipotle', 7, 28, 17, 5,
   'initial_outreach', 55, CURRENT_DATE + INTERVAL '80 days',
   'Plant-based bowl ingredients',
   NOW() - INTERVAL '11 days', NOW()),

  (14, 'Litehouse Ranch - Red Robin', 8, 26, 13, 5,
   'initial_outreach', 51, CURRENT_DATE + INTERVAL '30 days',
   'Premium ranch for bottomless fries upgrade',
   NOW() - INTERVAL '15 days', NOW()),

  -- ========================================
  -- SAMPLE_VISIT_OFFERED (7 opportunities)
  -- ========================================
  (15, 'McCRUM Wedges - Applebees', 1, 24, 11, 2,
   'sample_visit_offered', 47, CURRENT_DATE + INTERVAL '25 days',
   'Seasoned wedges for new appetizer menu',
   NOW() - INTERVAL '20 days', NOW()),

  (16, 'SWAP Jackfruit - Aramark', 2, 35, 17, 3,
   'sample_visit_offered', 70, CURRENT_DATE + INTERVAL '40 days',
   'BBQ jackfruit for campus sustainability initiatives',
   NOW() - INTERVAL '18 days', NOW()),

  (17, 'Rapid Rasoi Samosas - Hyatt', 3, 32, 12, 3,
   'sample_visit_offered', 64, CURRENT_DATE + INTERVAL '35 days',
   'Appetizer samosas for hotel bars',
   NOW() - INTERVAL '22 days', NOW()),

  (18, 'Lakeview Dips - Brookdale', 4, 37, 13, 4,
   'sample_visit_offered', 74, CURRENT_DATE + INTERVAL '20 days',
   'French onion dip for resident happy hours',
   NOW() - INTERVAL '17 days', NOW()),

  (19, 'Anchor Cream - Ascension', 6, 34, 11, 5,
   'sample_visit_offered', 68, CURRENT_DATE + INTERVAL '50 days',
   'UHT cream for patient trays',
   NOW() - INTERVAL '25 days', NOW()),

  (20, 'Tattooed Chef Bowls - Panera', 7, 27, 17, 5,
   'sample_visit_offered', 54, CURRENT_DATE + INTERVAL '30 days',
   'Plant-based Buddha bowls for catering',
   NOW() - INTERVAL '19 days', NOW()),

  (21, 'Custom Culinary Bases - Marriott', 9, 30, 10, 6,
   'sample_visit_offered', 60, CURRENT_DATE + INTERVAL '45 days',
   'Gold Label bases for banquet soups',
   NOW() - INTERVAL '21 days', NOW()),

  -- ========================================
  -- FEEDBACK_LOGGED (7 opportunities)
  -- ========================================
  (22, 'McCRUM Diced - Chilis', 1, 23, 11, 2,
   'feedback_logged', 45, CURRENT_DATE + INTERVAL '15 days',
   'Diced potatoes for loaded dishes - positive sample feedback',
   NOW() - INTERVAL '30 days', NOW()),

  (23, 'SWAP Cauliflower - Shake Shack', 2, 29, 19, 3,
   'feedback_logged', 58, CURRENT_DATE + INTERVAL '20 days',
   'Cauliflower rice for low-carb options - testing complete',
   NOW() - INTERVAL '28 days', NOW()),

  (24, 'Rapid Rasoi Curry - Levy', 3, 39, 18, 3,
   'feedback_logged', 79, CURRENT_DATE + INTERVAL '25 days',
   'Butter chicken for stadium Indian station - chef approved',
   NOW() - INTERVAL '32 days', NOW()),

  (25, 'Frico Gorgonzola - Capital Grille', 5, 20, 18, 4,
   'feedback_logged', 40, CURRENT_DATE + INTERVAL '10 days',
   'Gorgonzola crumbles for wedge salad - pricing review',
   NOW() - INTERVAL '35 days', NOW()),

  (26, 'Anchor Butter - Morton''s', 6, 22, 10, 4,
   'feedback_logged', 44, CURRENT_DATE + INTERVAL '18 days',
   'Clarified butter for steaks - quality confirmed',
   NOW() - INTERVAL '26 days', NOW()),

  (27, 'Litehouse Blue Cheese - BWW', 8, 25, 13, 5,
   'feedback_logged', 50, CURRENT_DATE + INTERVAL '12 days',
   'Chunky blue cheese for wing dipping - volume pricing TBD',
   NOW() - INTERVAL '29 days', NOW()),

  (28, 'Custom Culinary Demi - Ruth''s Chris', 9, 21, 10, 6,
   'feedback_logged', 42, CURRENT_DATE + INTERVAL '22 days',
   'Demi-glace for signature sauces - final approval pending',
   NOW() - INTERVAL '33 days', NOW()),

  -- ========================================
  -- DEMO_SCHEDULED (8 opportunities)
  -- ========================================
  (29, 'McCRUM Full Line - Sysco', 1, 10, NULL, 2,
   'demo_scheduled', 19, CURRENT_DATE + INTERVAL '7 days',
   'Full product line review for Sysco distribution',
   NOW() - INTERVAL '40 days', NOW()),

  (30, 'SWAP Plant Line - US Foods', 2, 11, NULL, 3,
   'demo_scheduled', 21, CURRENT_DATE + INTERVAL '10 days',
   'Complete plant-based lineup presentation',
   NOW() - INTERVAL '38 days', NOW()),

  (31, 'Rapid Rasoi Menu - GFS', 3, 13, NULL, 3,
   'demo_scheduled', 25, CURRENT_DATE + INTERVAL '5 days',
   'Full Indian menu demo for regional distribution',
   NOW() - INTERVAL '42 days', NOW()),

  (32, 'Lakeview Desserts - Hilton Corp', 4, 31, 12, 4,
   'demo_scheduled', 63, CURRENT_DATE + INTERVAL '14 days',
   'Dessert line for corporate standardization',
   NOW() - INTERVAL '36 days', NOW()),

  (33, 'Frico Italian Line - European Imports', 5, 18, NULL, 4,
   'demo_scheduled', 35, CURRENT_DATE + INTERVAL '8 days',
   'Full Italian cheese portfolio review',
   NOW() - INTERVAL '45 days', NOW()),

  (34, 'Anchor Dairy - Chefs Warehouse', 6, 19, NULL, 5,
   'demo_scheduled', 38, CURRENT_DATE + INTERVAL '12 days',
   'Premium dairy line for fine dining distribution',
   NOW() - INTERVAL '41 days', NOW()),

  (35, 'Tattooed Chef Retail - PFG', 7, 12, NULL, 5,
   'demo_scheduled', 23, CURRENT_DATE + INTERVAL '9 days',
   'Retail-ready plant-based items for C-store',
   NOW() - INTERVAL '39 days', NOW()),

  (36, 'Litehouse Dressings - Ben E. Keith', 8, 15, NULL, 6,
   'demo_scheduled', 29, CURRENT_DATE + INTERVAL '6 days',
   'Regional dressing distribution agreement',
   NOW() - INTERVAL '44 days', NOW()),

  -- ========================================
  -- CLOSED_WON (7 opportunities)
  -- ========================================
  (37, 'McCRUM Fries - Applebees National', 1, 24, 11, 2,
   'closed_won', 48, CURRENT_DATE - INTERVAL '10 days',
   'National fry contract secured - 3 year agreement',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '10 days'),

  (38, 'SWAP Oat Milk - Panera Regional', 2, 27, 17, 3,
   'closed_won', 53, CURRENT_DATE - INTERVAL '5 days',
   'Midwest region oat milk supply - pilot program',
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days'),

  (39, 'Rapid Rasoi - Aramark Campuses', 3, 35, 12, 3,
   'closed_won', 71, CURRENT_DATE - INTERVAL '15 days',
   'Campus Indian station program - 25 universities',
   NOW() - INTERVAL '120 days', NOW() - INTERVAL '15 days'),

  (40, 'Lakeview Dips - Sodexo National', 4, 36, 13, 4,
   'closed_won', 73, CURRENT_DATE - INTERVAL '20 days',
   'National dip contract for campus retail',
   NOW() - INTERVAL '100 days', NOW() - INTERVAL '20 days'),

  (41, 'Frico Parmesan - Sysco National', 5, 10, NULL, 4,
   'closed_won', 20, CURRENT_DATE - INTERVAL '8 days',
   'National Parmesan distribution agreement',
   NOW() - INTERVAL '75 days', NOW() - INTERVAL '8 days'),

  (42, 'Anchor - GFS Regional', 6, 13, NULL, 5,
   'closed_won', 26, CURRENT_DATE - INTERVAL '12 days',
   'Midwest butter and cream distribution',
   NOW() - INTERVAL '85 days', NOW() - INTERVAL '12 days'),

  (43, 'Custom Culinary - HCA National', 9, 33, 11, 6,
   'closed_won', 67, CURRENT_DATE - INTERVAL '25 days',
   'Healthcare soup base standardization program',
   NOW() - INTERVAL '150 days', NOW() - INTERVAL '25 days'),

  -- ========================================
  -- CLOSED_LOST (7 opportunities)
  -- ========================================
  (44, 'McCRUM - Chipotle National', 1, 28, 17, 2,
   'closed_lost', 56, CURRENT_DATE - INTERVAL '30 days',
   'Lost to incumbent - price sensitivity',
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '30 days'),

  (45, 'SWAP - BWW Pilot', 2, 25, 13, 3,
   'closed_lost', 49, CURRENT_DATE - INTERVAL '45 days',
   'Menu direction changed - no plant-based focus',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days'),

  (46, 'Rapid Rasoi - Red Robin', 3, 26, 13, 3,
   'closed_lost', 52, CURRENT_DATE - INTERVAL '20 days',
   'Decided against ethnic menu expansion',
   NOW() - INTERVAL '70 days', NOW() - INTERVAL '20 days'),

  (47, 'Lakeview - Shake Shack', 4, 29, 19, 4,
   'closed_lost', 57, CURRENT_DATE - INTERVAL '35 days',
   'Brand fit concerns - looking for artisan suppliers',
   NOW() - INTERVAL '80 days', NOW() - INTERVAL '35 days'),

  (48, 'Tattooed Chef - Marriott', 7, 30, 12, 5,
   'closed_lost', 61, CURRENT_DATE - INTERVAL '40 days',
   'Budget constraints - postponed plant-based initiative',
   NOW() - INTERVAL '95 days', NOW() - INTERVAL '40 days'),

  (49, 'Litehouse - Hyatt National', 8, 32, 12, 5,
   'closed_lost', 65, CURRENT_DATE - INTERVAL '15 days',
   'Lost to competitor on pricing',
   NOW() - INTERVAL '110 days', NOW() - INTERVAL '15 days'),

  (50, 'Custom Culinary - Brookdale', 9, 37, 13, 6,
   'closed_lost', 75, CURRENT_DATE - INTERVAL '50 days',
   'GPO contract locked with competitor',
   NOW() - INTERVAL '130 days', NOW() - INTERVAL '50 days');

-- Reset sequence
SELECT setval(pg_get_serial_sequence('opportunities', 'id'), 50, true);
