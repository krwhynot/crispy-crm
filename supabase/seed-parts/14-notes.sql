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
