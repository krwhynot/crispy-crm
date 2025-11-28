-- ============================================================================
-- PART 12: ACTIVITIES (150 activities)
-- ============================================================================
-- All 13 activity types distributed across opportunities
-- Types: call, email, sample, meeting, demo, proposal, follow_up,
--        trade_show, site_visit, contract_review, check_in, social, note
-- ~12 activities per type
-- ============================================================================

INSERT INTO "public"."activities" (
  id, activity_type, type, subject, description, activity_date,
  duration_minutes, contact_id, organization_id, opportunity_id,
  follow_up_required, sales_id, created_at, updated_at
)
VALUES
  -- ========================================
  -- CALL Activities (12)
  -- ========================================
  (1, 'call', 'call', 'Initial discovery call', 'Discussed current supplier situation and pain points', NOW() - INTERVAL '5 days', 30, 39, 20, 1, true, 2, NOW() - INTERVAL '5 days', NOW()),
  (2, 'call', 'call', 'Follow-up pricing discussion', 'Reviewed volume pricing tiers', NOW() - INTERVAL '10 days', 25, 53, 27, 2, false, 3, NOW() - INTERVAL '10 days', NOW()),
  (3, 'call', 'call', 'Introduction call with chef', 'Introduced product line capabilities', NOW() - INTERVAL '8 days', 20, 59, 30, 3, true, 3, NOW() - INTERVAL '8 days', NOW()),
  (4, 'call', 'call', 'Quarterly check-in', 'Reviewed account status and upcoming needs', NOW() - INTERVAL '15 days', 35, 76, 38, 4, false, 4, NOW() - INTERVAL '15 days', NOW()),
  (5, 'call', 'call', 'Pricing negotiation call', 'Discussed volume discounts and payment terms', NOW() - INTERVAL '12 days', 45, 43, 22, 5, true, 4, NOW() - INTERVAL '12 days', NOW()),
  (6, 'call', 'call', 'Product inquiry follow-up', 'Answered questions about product specs', NOW() - INTERVAL '3 days', 15, 41, 21, 6, false, 5, NOW() - INTERVAL '3 days', NOW()),
  (7, 'call', 'call', 'Budget discussion', 'Reviewed budget cycles and timing', NOW() - INTERVAL '20 days', 40, 66, 33, 7, true, 6, NOW() - INTERVAL '20 days', NOW()),
  (8, 'call', 'call', 'Sample coordination', 'Arranged sample delivery details', NOW() - INTERVAL '18 days', 20, 62, 31, 8, false, 2, NOW() - INTERVAL '18 days', NOW()),
  (9, 'call', 'call', 'Menu planning discussion', 'Discussed integration with current menu', NOW() - INTERVAL '22 days', 30, 57, 29, 9, true, 3, NOW() - INTERVAL '22 days', NOW()),
  (10, 'call', 'call', 'Contract renewal discussion', 'Reviewed terms for upcoming renewal', NOW() - INTERVAL '25 days', 35, 49, 25, 10, false, 3, NOW() - INTERVAL '25 days', NOW()),
  (11, 'call', 'call', 'New product introduction', 'Presented new product additions', NOW() - INTERVAL '28 days', 25, 72, 36, 11, true, 4, NOW() - INTERVAL '28 days', NOW()),
  (12, 'call', 'call', 'Competitive situation review', 'Discussed competitor offerings', NOW() - INTERVAL '30 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '30 days', NOW()),

  -- ========================================
  -- EMAIL Activities (12)
  -- ========================================
  (13, 'email', 'email', 'Product catalog sent', 'Sent comprehensive product catalog PDF', NOW() - INTERVAL '4 days', 5, 55, 28, 13, false, 5, NOW() - INTERVAL '4 days', NOW()),
  (14, 'email', 'email', 'Pricing proposal attached', 'Sent formal pricing proposal document', NOW() - INTERVAL '6 days', 10, 51, 26, 14, true, 5, NOW() - INTERVAL '6 days', NOW()),
  (15, 'email', 'email', 'Sample request confirmation', 'Confirmed sample shipment details', NOW() - INTERVAL '14 days', 5, 47, 24, 15, false, 2, NOW() - INTERVAL '14 days', NOW()),
  (16, 'email', 'email', 'Meeting recap sent', 'Sent summary of discussion points', NOW() - INTERVAL '16 days', 15, 70, 35, 16, true, 3, NOW() - INTERVAL '16 days', NOW()),
  (17, 'email', 'email', 'Spec sheets requested', 'Chef requested detailed specifications', NOW() - INTERVAL '19 days', 5, 64, 32, 17, false, 3, NOW() - INTERVAL '19 days', NOW()),
  (18, 'email', 'email', 'Introduction email', 'Initial outreach to new contact', NOW() - INTERVAL '7 days', 10, 74, 37, 18, true, 4, NOW() - INTERVAL '7 days', NOW()),
  (19, 'email', 'email', 'Quote follow-up', 'Following up on sent quotation', NOW() - INTERVAL '21 days', 5, 68, 34, 19, false, 5, NOW() - INTERVAL '21 days', NOW()),
  (20, 'email', 'email', 'Contract draft sent', 'Sent initial contract for review', NOW() - INTERVAL '23 days', 15, 54, 27, 20, true, 5, NOW() - INTERVAL '23 days', NOW()),
  (21, 'email', 'email', 'Thank you note', 'Post-meeting thank you', NOW() - INTERVAL '26 days', 5, 60, 30, 21, false, 6, NOW() - INTERVAL '26 days', NOW()),
  (22, 'email', 'email', 'Reference request', 'Sent customer reference contacts', NOW() - INTERVAL '29 days', 10, 45, 23, 22, false, 2, NOW() - INTERVAL '29 days', NOW()),
  (23, 'email', 'email', 'Product update notification', 'Informed about new product launch', NOW() - INTERVAL '32 days', 5, 58, 29, 23, true, 3, NOW() - INTERVAL '32 days', NOW()),
  (24, 'email', 'email', 'Scheduling confirmation', 'Confirmed upcoming demo date', NOW() - INTERVAL '35 days', 5, 79, 39, 24, false, 3, NOW() - INTERVAL '35 days', NOW()),

  -- ========================================
  -- SAMPLE Activities (12)
  -- ========================================
  (25, 'sample', 'sample', 'Initial product samples delivered', 'Sent 5 SKU variety pack for evaluation', NOW() - INTERVAL '17 days', 60, 40, 20, 25, true, 4, NOW() - INTERVAL '17 days', NOW()),
  (26, 'sample', 'sample', 'Chef evaluation samples', 'Sent samples for kitchen testing', NOW() - INTERVAL '24 days', 45, 44, 22, 26, true, 4, NOW() - INTERVAL '24 days', NOW()),
  (27, 'sample', 'sample', 'Menu development samples', 'Provided samples for R&D testing', NOW() - INTERVAL '27 days', 90, 50, 25, 27, false, 5, NOW() - INTERVAL '27 days', NOW()),
  (28, 'sample', 'sample', 'Re-sample after feedback', 'Sent adjusted formulation samples', NOW() - INTERVAL '31 days', 60, 42, 21, 28, true, 6, NOW() - INTERVAL '31 days', NOW()),
  (29, 'sample', 'sample', 'Full line samples for buyer', 'Complete product line for category review', NOW() - INTERVAL '34 days', 120, 19, 10, 29, false, 2, NOW() - INTERVAL '34 days', NOW()),
  (30, 'sample', 'sample', 'Competitor comparison samples', 'Side-by-side comparison pack', NOW() - INTERVAL '37 days', 75, 21, 11, 30, true, 3, NOW() - INTERVAL '37 days', NOW()),
  (31, 'sample', 'sample', 'Banquet menu samples', 'Samples for catering menu development', NOW() - INTERVAL '40 days', 90, 25, 13, 31, false, 3, NOW() - INTERVAL '40 days', NOW()),
  (32, 'sample', 'sample', 'Dessert line samples', 'Full dessert product sampling', NOW() - INTERVAL '33 days', 60, 63, 31, 32, true, 4, NOW() - INTERVAL '33 days', NOW()),
  (33, 'sample', 'sample', 'Cheese variety pack', 'Italian cheese collection samples', NOW() - INTERVAL '36 days', 45, 35, 18, 33, false, 4, NOW() - INTERVAL '36 days', NOW()),
  (34, 'sample', 'sample', 'Dairy products sample', 'Butter and cream sample kit', NOW() - INTERVAL '39 days', 60, 38, 19, 34, true, 5, NOW() - INTERVAL '39 days', NOW()),
  (35, 'sample', 'sample', 'Plant-based samples', 'Vegan product line samples', NOW() - INTERVAL '42 days', 75, 23, 12, 35, false, 5, NOW() - INTERVAL '42 days', NOW()),
  (36, 'sample', 'sample', 'Dressing sampler kit', 'Ranch and blue cheese variety', NOW() - INTERVAL '45 days', 45, 29, 15, 36, true, 6, NOW() - INTERVAL '45 days', NOW()),

  -- ========================================
  -- MEETING Activities (12)
  -- ========================================
  (37, 'meeting', 'meeting', 'Initial discovery meeting', 'In-person meeting to understand needs', NOW() - INTERVAL '48 days', 90, 48, 24, 37, true, 2, NOW() - INTERVAL '48 days', NOW()),
  (38, 'meeting', 'meeting', 'Product presentation meeting', 'Formal product line presentation', NOW() - INTERVAL '50 days', 120, 53, 27, 38, false, 3, NOW() - INTERVAL '50 days', NOW()),
  (39, 'meeting', 'meeting', 'Chef collaboration session', 'Joint menu development workshop', NOW() - INTERVAL '52 days', 180, 71, 35, 39, true, 3, NOW() - INTERVAL '52 days', NOW()),
  (40, 'meeting', 'meeting', 'Quarterly business review', 'QBR with key stakeholders', NOW() - INTERVAL '55 days', 90, 73, 36, 40, false, 4, NOW() - INTERVAL '55 days', NOW()),
  (41, 'meeting', 'meeting', 'Contract negotiation meeting', 'Terms and pricing discussion', NOW() - INTERVAL '58 days', 120, 20, 10, 41, true, 4, NOW() - INTERVAL '58 days', NOW()),
  (42, 'meeting', 'meeting', 'Distribution partnership meeting', 'Regional expansion discussion', NOW() - INTERVAL '60 days', 90, 26, 13, 42, false, 5, NOW() - INTERVAL '60 days', NOW()),
  (43, 'meeting', 'meeting', 'Healthcare compliance review', 'Dietary requirements discussion', NOW() - INTERVAL '62 days', 75, 67, 33, 43, true, 6, NOW() - INTERVAL '62 days', NOW()),
  (44, 'meeting', 'meeting', 'Executive introduction', 'C-level relationship building', NOW() - INTERVAL '65 days', 60, 56, 28, 44, false, 2, NOW() - INTERVAL '65 days', NOW()),
  (45, 'meeting', 'meeting', 'Menu innovation workshop', 'Collaborative menu development', NOW() - INTERVAL '68 days', 150, 49, 25, 45, true, 3, NOW() - INTERVAL '68 days', NOW()),
  (46, 'meeting', 'meeting', 'Regional sales meeting', 'Territory planning session', NOW() - INTERVAL '70 days', 90, 52, 26, 46, false, 3, NOW() - INTERVAL '70 days', NOW()),
  (47, 'meeting', 'meeting', 'Budget planning meeting', 'FY planning discussion', NOW() - INTERVAL '72 days', 120, 57, 29, 47, true, 4, NOW() - INTERVAL '72 days', NOW()),
  (48, 'meeting', 'meeting', 'Senior living food committee', 'Resident dining committee presentation', NOW() - INTERVAL '75 days', 90, 65, 32, 48, false, 4, NOW() - INTERVAL '75 days', NOW()),

  -- ========================================
  -- DEMO Activities (12)
  -- ========================================
  (49, 'demo', 'demo', 'Kitchen demo - fry station', 'Demonstrated fry preparation methods', NOW() - INTERVAL '38 days', 120, 39, 20, 1, true, 5, NOW() - INTERVAL '38 days', NOW()),
  (50, 'demo', 'demo', 'Plant-based cooking demo', 'Chef demonstration of versatility', NOW() - INTERVAL '41 days', 90, 53, 27, 2, false, 5, NOW() - INTERVAL '41 days', NOW()),
  (51, 'demo', 'demo', 'Indian cuisine demo', 'Full menu preparation demonstration', NOW() - INTERVAL '44 days', 180, 59, 30, 3, true, 6, NOW() - INTERVAL '44 days', NOW()),
  (52, 'demo', 'demo', 'Dessert service demo', 'Plating and presentation techniques', NOW() - INTERVAL '47 days', 75, 76, 38, 4, false, 2, NOW() - INTERVAL '47 days', NOW()),
  (53, 'demo', 'demo', 'Cheese cutting demo', 'Proper handling and portioning', NOW() - INTERVAL '49 days', 60, 43, 22, 5, true, 3, NOW() - INTERVAL '49 days', NOW()),
  (54, 'demo', 'demo', 'Butter applications demo', 'High-heat cooking techniques', NOW() - INTERVAL '51 days', 90, 41, 21, 6, false, 3, NOW() - INTERVAL '51 days', NOW()),
  (55, 'demo', 'demo', 'Soup base preparation', 'From-scratch soup demonstration', NOW() - INTERVAL '53 days', 120, 66, 33, 7, true, 4, NOW() - INTERVAL '53 days', NOW()),
  (56, 'demo', 'demo', 'Breakfast station demo', 'Hash brown preparation methods', NOW() - INTERVAL '56 days', 90, 62, 31, 8, false, 4, NOW() - INTERVAL '56 days', NOW()),
  (57, 'demo', 'demo', 'Oat milk barista demo', 'Latte art and steaming techniques', NOW() - INTERVAL '59 days', 60, 57, 29, 9, true, 5, NOW() - INTERVAL '59 days', NOW()),
  (58, 'demo', 'demo', 'Naan bread service demo', 'Proper reheating and presentation', NOW() - INTERVAL '61 days', 45, 49, 25, 10, false, 5, NOW() - INTERVAL '61 days', NOW()),
  (59, 'demo', 'demo', 'Campus dining demo', 'High-volume service techniques', NOW() - INTERVAL '64 days', 150, 72, 36, 11, true, 6, NOW() - INTERVAL '64 days', NOW()),
  (60, 'demo', 'demo', 'Stadium concessions demo', 'Quick-serve application demo', NOW() - INTERVAL '67 days', 120, 78, 39, 12, false, 2, NOW() - INTERVAL '67 days', NOW()),

  -- ========================================
  -- PROPOSAL Activities (11)
  -- ========================================
  (61, 'proposal', 'proposal', 'Initial pricing proposal', 'Presented volume-based pricing tiers', NOW() - INTERVAL '43 days', 30, 55, 28, 13, true, 3, NOW() - INTERVAL '43 days', NOW()),
  (62, 'proposal', 'proposal', 'Annual contract proposal', 'Full year commitment proposal', NOW() - INTERVAL '46 days', 45, 51, 26, 14, true, 3, NOW() - INTERVAL '46 days', NOW()),
  (63, 'proposal', 'proposal', 'Menu program proposal', 'Custom menu integration proposal', NOW() - INTERVAL '54 days', 60, 47, 24, 15, false, 4, NOW() - INTERVAL '54 days', NOW()),
  (64, 'proposal', 'proposal', 'Distribution agreement proposal', 'Territory exclusive proposal', NOW() - INTERVAL '57 days', 45, 70, 35, 16, true, 4, NOW() - INTERVAL '57 days', NOW()),
  (65, 'proposal', 'proposal', 'Revised pricing proposal', 'Adjusted terms after negotiation', NOW() - INTERVAL '63 days', 30, 64, 32, 17, false, 5, NOW() - INTERVAL '63 days', NOW()),
  (66, 'proposal', 'proposal', 'Multi-year proposal', '3-year partnership proposal', NOW() - INTERVAL '66 days', 60, 74, 37, 18, true, 5, NOW() - INTERVAL '66 days', NOW()),
  (67, 'proposal', 'proposal', 'Healthcare program proposal', 'Nutrition-compliant product proposal', NOW() - INTERVAL '69 days', 45, 68, 34, 19, false, 6, NOW() - INTERVAL '69 days', NOW()),
  (68, 'proposal', 'proposal', 'Pilot program proposal', 'Limited market test proposal', NOW() - INTERVAL '71 days', 30, 54, 27, 20, true, 2, NOW() - INTERVAL '71 days', NOW()),
  (69, 'proposal', 'proposal', 'Rebate program proposal', 'Volume incentive program', NOW() - INTERVAL '73 days', 45, 60, 30, 21, false, 2, NOW() - INTERVAL '73 days', NOW()),
  (70, 'proposal', 'proposal', 'Custom product proposal', 'Private label development', NOW() - INTERVAL '76 days', 60, 45, 23, 22, true, 3, NOW() - INTERVAL '76 days', NOW()),
  (71, 'proposal', 'proposal', 'Sustainability program proposal', 'Eco-friendly packaging option', NOW() - INTERVAL '78 days', 45, 58, 29, 23, false, 3, NOW() - INTERVAL '78 days', NOW()),

  -- ========================================
  -- FOLLOW_UP Activities (12)
  -- ========================================
  (72, 'follow_up', 'follow_up', 'Post-sample follow-up', 'Checked on sample evaluation status', NOW() - INTERVAL '11 days', 15, 79, 39, 24, false, 4, NOW() - INTERVAL '11 days', NOW()),
  (73, 'follow_up', 'follow_up', 'Quote status check', 'Following up on pending quotation', NOW() - INTERVAL '13 days', 10, 40, 20, 25, true, 4, NOW() - INTERVAL '13 days', NOW()),
  (74, 'follow_up', 'follow_up', 'Decision timeline follow-up', 'Checking on approval process', NOW() - INTERVAL '16 days', 20, 44, 22, 26, false, 5, NOW() - INTERVAL '16 days', NOW()),
  (75, 'follow_up', 'follow_up', 'Contract review follow-up', 'Status of legal review', NOW() - INTERVAL '20 days', 15, 50, 25, 27, true, 5, NOW() - INTERVAL '20 days', NOW()),
  (76, 'follow_up', 'follow_up', 'Budget approval follow-up', 'Checking budget cycle timing', NOW() - INTERVAL '23 days', 20, 42, 21, 28, false, 6, NOW() - INTERVAL '23 days', NOW()),
  (77, 'follow_up', 'follow_up', 'Demo scheduling follow-up', 'Confirming demo logistics', NOW() - INTERVAL '27 days', 10, 19, 10, 29, true, 2, NOW() - INTERVAL '27 days', NOW()),
  (78, 'follow_up', 'follow_up', 'Reference check follow-up', 'Did they contact references?', NOW() - INTERVAL '30 days', 15, 21, 11, 30, false, 2, NOW() - INTERVAL '30 days', NOW()),
  (79, 'follow_up', 'follow_up', 'Pilot results follow-up', 'Checking on test results', NOW() - INTERVAL '33 days', 25, 25, 13, 31, true, 3, NOW() - INTERVAL '33 days', NOW()),
  (80, 'follow_up', 'follow_up', 'Meeting action items', 'Following up on commitments', NOW() - INTERVAL '36 days', 15, 63, 31, 32, false, 3, NOW() - INTERVAL '36 days', NOW()),
  (81, 'follow_up', 'follow_up', 'Proposal review status', 'Has committee reviewed?', NOW() - INTERVAL '39 days', 20, 35, 18, 33, true, 4, NOW() - INTERVAL '39 days', NOW()),
  (82, 'follow_up', 'follow_up', 'Training scheduling', 'Following up on staff training', NOW() - INTERVAL '42 days', 15, 38, 19, 34, false, 4, NOW() - INTERVAL '42 days', NOW()),
  (83, 'follow_up', 'follow_up', 'Launch date confirmation', 'Confirming go-live timing', NOW() - INTERVAL '45 days', 20, 23, 12, 35, true, 5, NOW() - INTERVAL '45 days', NOW()),

  -- ========================================
  -- TRADE_SHOW Activities (11)
  -- ========================================
  (84, 'trade_show', 'trade_show', 'NRA Show - Booth visit', 'Met at National Restaurant Association Show', NOW() - INTERVAL '90 days', 30, 29, 15, 36, false, 5, NOW() - INTERVAL '90 days', NOW()),
  (85, 'trade_show', 'trade_show', 'IFDA Conference meeting', 'Distributor conference connection', NOW() - INTERVAL '95 days', 45, 48, 24, 37, true, 6, NOW() - INTERVAL '95 days', NOW()),
  (86, 'trade_show', 'trade_show', 'NACUFS Annual Conference', 'College foodservice show', NOW() - INTERVAL '100 days', 60, 53, 27, 38, false, 2, NOW() - INTERVAL '100 days', NOW()),
  (87, 'trade_show', 'trade_show', 'Healthcare Foodservice Show', 'AHF annual meeting', NOW() - INTERVAL '105 days', 45, 71, 35, 39, true, 2, NOW() - INTERVAL '105 days', NOW()),
  (88, 'trade_show', 'trade_show', 'MUFSO Conference', 'Multi-unit foodservice event', NOW() - INTERVAL '110 days', 30, 73, 36, 40, false, 3, NOW() - INTERVAL '110 days', NOW()),
  (89, 'trade_show', 'trade_show', 'Sysco Food Show', 'Regional distributor show', NOW() - INTERVAL '115 days', 90, 20, 10, 41, true, 3, NOW() - INTERVAL '115 days', NOW()),
  (90, 'trade_show', 'trade_show', 'US Foods Innovation Show', 'New product showcase', NOW() - INTERVAL '120 days', 75, 26, 13, 42, false, 4, NOW() - INTERVAL '120 days', NOW()),
  (91, 'trade_show', 'trade_show', 'Plant-Based World Expo', 'Specialty show connection', NOW() - INTERVAL '125 days', 45, 67, 33, 43, true, 4, NOW() - INTERVAL '125 days', NOW()),
  (92, 'trade_show', 'trade_show', 'Senior Living Executive Conference', 'Industry networking', NOW() - INTERVAL '130 days', 60, 56, 28, 44, false, 5, NOW() - INTERVAL '130 days', NOW()),
  (93, 'trade_show', 'trade_show', 'Western Foodservice Show', 'Regional expo meeting', NOW() - INTERVAL '135 days', 30, 49, 25, 45, true, 5, NOW() - INTERVAL '135 days', NOW()),
  (94, 'trade_show', 'trade_show', 'PMA Fresh Summit', 'Produce industry connection', NOW() - INTERVAL '140 days', 45, 52, 26, 46, false, 6, NOW() - INTERVAL '140 days', NOW()),

  -- ========================================
  -- SITE_VISIT Activities (11)
  -- ========================================
  (95, 'site_visit', 'site_visit', 'Plant tour - Idaho facility', 'Manufacturing facility visit', NOW() - INTERVAL '80 days', 240, 57, 29, 47, true, 2, NOW() - INTERVAL '80 days', NOW()),
  (96, 'site_visit', 'site_visit', 'Customer kitchen visit', 'On-site needs assessment', NOW() - INTERVAL '82 days', 120, 65, 32, 48, false, 2, NOW() - INTERVAL '82 days', NOW()),
  (97, 'site_visit', 'site_visit', 'Distribution center tour', 'Logistics capabilities review', NOW() - INTERVAL '84 days', 180, 39, 20, 1, true, 3, NOW() - INTERVAL '84 days', NOW()),
  (98, 'site_visit', 'site_visit', 'Corporate headquarters visit', 'Executive relationship building', NOW() - INTERVAL '86 days', 150, 53, 27, 2, false, 3, NOW() - INTERVAL '86 days', NOW()),
  (99, 'site_visit', 'site_visit', 'Test kitchen visit', 'R&D collaboration session', NOW() - INTERVAL '88 days', 180, 59, 30, 3, true, 4, NOW() - INTERVAL '88 days', NOW()),
  (100, 'site_visit', 'site_visit', 'Regional office visit', 'Team introduction meeting', NOW() - INTERVAL '91 days', 120, 76, 38, 4, false, 4, NOW() - INTERVAL '91 days', NOW()),
  (101, 'site_visit', 'site_visit', 'QA facility inspection', 'Quality assurance review', NOW() - INTERVAL '93 days', 240, 43, 22, 5, true, 5, NOW() - INTERVAL '93 days', NOW()),
  (102, 'site_visit', 'site_visit', 'New store opening support', 'Launch assistance visit', NOW() - INTERVAL '96 days', 300, 41, 21, 6, false, 5, NOW() - INTERVAL '96 days', NOW()),
  (103, 'site_visit', 'site_visit', 'Commissary kitchen tour', 'Central production review', NOW() - INTERVAL '98 days', 180, 66, 33, 7, true, 6, NOW() - INTERVAL '98 days', NOW()),
  (104, 'site_visit', 'site_visit', 'Stadium walkthrough', 'Concession operations review', NOW() - INTERVAL '101 days', 150, 62, 31, 8, false, 2, NOW() - INTERVAL '101 days', NOW()),
  (105, 'site_visit', 'site_visit', 'Hotel F&B operation visit', 'Full service assessment', NOW() - INTERVAL '103 days', 210, 57, 29, 9, true, 3, NOW() - INTERVAL '103 days', NOW()),

  -- ========================================
  -- CONTRACT_REVIEW Activities (11)
  -- ========================================
  (106, 'contract_review', 'contract_review', 'Initial contract review', 'First pass of terms', NOW() - INTERVAL '55 days', 60, 49, 25, 10, false, 3, NOW() - INTERVAL '55 days', NOW()),
  (107, 'contract_review', 'contract_review', 'Legal redlines review', 'Discussed legal changes', NOW() - INTERVAL '57 days', 45, 72, 36, 11, true, 4, NOW() - INTERVAL '57 days', NOW()),
  (108, 'contract_review', 'contract_review', 'Pricing schedule review', 'Volume tier confirmation', NOW() - INTERVAL '60 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '60 days', NOW()),
  (109, 'contract_review', 'contract_review', 'Terms negotiation', 'Payment terms discussion', NOW() - INTERVAL '62 days', 60, 55, 28, 13, true, 5, NOW() - INTERVAL '62 days', NOW()),
  (110, 'contract_review', 'contract_review', 'Service level review', 'SLA terms finalization', NOW() - INTERVAL '65 days', 45, 51, 26, 14, false, 5, NOW() - INTERVAL '65 days', NOW()),
  (111, 'contract_review', 'contract_review', 'Renewal terms review', 'Auto-renewal clause review', NOW() - INTERVAL '68 days', 30, 47, 24, 15, true, 6, NOW() - INTERVAL '68 days', NOW()),
  (112, 'contract_review', 'contract_review', 'Exclusivity discussion', 'Territory exclusivity terms', NOW() - INTERVAL '70 days', 45, 70, 35, 16, false, 2, NOW() - INTERVAL '70 days', NOW()),
  (113, 'contract_review', 'contract_review', 'Insurance requirements', 'Liability coverage review', NOW() - INTERVAL '73 days', 30, 64, 32, 17, true, 2, NOW() - INTERVAL '73 days', NOW()),
  (114, 'contract_review', 'contract_review', 'Quality standards review', 'Spec compliance terms', NOW() - INTERVAL '76 days', 45, 74, 37, 18, false, 3, NOW() - INTERVAL '76 days', NOW()),
  (115, 'contract_review', 'contract_review', 'Termination clause review', 'Exit terms discussion', NOW() - INTERVAL '79 days', 30, 68, 34, 19, true, 3, NOW() - INTERVAL '79 days', NOW()),
  (116, 'contract_review', 'contract_review', 'Final contract approval', 'Executive sign-off meeting', NOW() - INTERVAL '81 days', 60, 54, 27, 20, false, 4, NOW() - INTERVAL '81 days', NOW()),

  -- ========================================
  -- CHECK_IN Activities (12)
  -- ========================================
  (117, 'check_in', 'check_in', 'Monthly relationship check-in', 'Regular cadence call', NOW() - INTERVAL '2 days', 20, 60, 30, 21, false, 4, NOW() - INTERVAL '2 days', NOW()),
  (118, 'check_in', 'check_in', 'Post-implementation check-in', 'How is rollout going?', NOW() - INTERVAL '9 days', 25, 45, 23, 22, true, 5, NOW() - INTERVAL '9 days', NOW()),
  (119, 'check_in', 'check_in', 'Quarterly review prep', 'Pre-QBR check-in', NOW() - INTERVAL '15 days', 30, 58, 29, 23, false, 5, NOW() - INTERVAL '15 days', NOW()),
  (120, 'check_in', 'check_in', 'Holiday planning check-in', 'Seasonal inventory discussion', NOW() - INTERVAL '21 days', 20, 79, 39, 24, true, 6, NOW() - INTERVAL '21 days', NOW()),
  (121, 'check_in', 'check_in', 'New hire introduction', 'Meet new purchasing contact', NOW() - INTERVAL '26 days', 30, 40, 20, 25, false, 2, NOW() - INTERVAL '26 days', NOW()),
  (122, 'check_in', 'check_in', 'Service satisfaction check', 'Delivery performance review', NOW() - INTERVAL '32 days', 25, 44, 22, 26, true, 2, NOW() - INTERVAL '32 days', NOW()),
  (123, 'check_in', 'check_in', 'Menu change check-in', 'New menu planning status', NOW() - INTERVAL '38 days', 30, 50, 25, 27, false, 3, NOW() - INTERVAL '38 days', NOW()),
  (124, 'check_in', 'check_in', 'Budget cycle check-in', 'Next FY planning status', NOW() - INTERVAL '44 days', 35, 42, 21, 28, true, 3, NOW() - INTERVAL '44 days', NOW()),
  (125, 'check_in', 'check_in', 'Year-end review', 'Annual performance discussion', NOW() - INTERVAL '48 days', 45, 19, 10, 29, false, 4, NOW() - INTERVAL '48 days', NOW()),
  (126, 'check_in', 'check_in', 'Market update check-in', 'Competitive landscape review', NOW() - INTERVAL '52 days', 25, 21, 11, 30, true, 4, NOW() - INTERVAL '52 days', NOW()),
  (127, 'check_in', 'check_in', 'Executive sponsor check-in', 'Relationship maintenance', NOW() - INTERVAL '58 days', 30, 25, 13, 31, false, 5, NOW() - INTERVAL '58 days', NOW()),
  (128, 'check_in', 'check_in', 'Product feedback check-in', 'User satisfaction pulse', NOW() - INTERVAL '63 days', 20, 63, 31, 32, true, 5, NOW() - INTERVAL '63 days', NOW()),

  -- ========================================
  -- SOCIAL Activities (11)
  -- ========================================
  (129, 'social', 'social', 'Industry dinner networking', 'Dinner at NRA Show', NOW() - INTERVAL '92 days', 150, 35, 18, 33, false, 6, NOW() - INTERVAL '92 days', NOW()),
  (130, 'social', 'social', 'Golf outing', 'Customer appreciation golf', NOW() - INTERVAL '97 days', 300, 38, 19, 34, true, 2, NOW() - INTERVAL '97 days', NOW()),
  (131, 'social', 'social', 'Sporting event', 'Hosted at local MLB game', NOW() - INTERVAL '102 days', 240, 23, 12, 35, false, 2, NOW() - INTERVAL '102 days', NOW()),
  (132, 'social', 'social', 'Holiday party attendance', 'Customer holiday celebration', NOW() - INTERVAL '107 days', 180, 29, 15, 36, true, 3, NOW() - INTERVAL '107 days', NOW()),
  (133, 'social', 'social', 'Coffee catch-up', 'Informal relationship building', NOW() - INTERVAL '8 days', 45, 48, 24, 37, false, 3, NOW() - INTERVAL '8 days', NOW()),
  (134, 'social', 'social', 'Lunch meeting', 'Business lunch discussion', NOW() - INTERVAL '19 days', 90, 53, 27, 38, true, 4, NOW() - INTERVAL '19 days', NOW()),
  (135, 'social', 'social', 'Customer appreciation event', 'Annual thank you event', NOW() - INTERVAL '112 days', 180, 71, 35, 39, false, 4, NOW() - INTERVAL '112 days', NOW()),
  (136, 'social', 'social', 'Industry award dinner', 'Award ceremony networking', NOW() - INTERVAL '117 days', 210, 73, 36, 40, true, 5, NOW() - INTERVAL '117 days', NOW()),
  (137, 'social', 'social', 'Charity event', 'Industry charity fundraiser', NOW() - INTERVAL '122 days', 180, 20, 10, 41, false, 5, NOW() - INTERVAL '122 days', NOW()),
  (138, 'social', 'social', 'Supplier dinner', 'Executive dinner meeting', NOW() - INTERVAL '127 days', 150, 26, 13, 42, true, 6, NOW() - INTERVAL '127 days', NOW()),
  (139, 'social', 'social', 'Wine tasting event', 'Client entertainment event', NOW() - INTERVAL '132 days', 180, 67, 33, 43, false, 2, NOW() - INTERVAL '132 days', NOW()),

  -- ========================================
  -- NOTE Activities (11)
  -- ========================================
  (140, 'note', 'note', 'Competitor intelligence noted', 'Learned about competitor pricing', NOW() - INTERVAL '7 days', 5, 56, 28, 44, false, 2, NOW() - INTERVAL '7 days', NOW()),
  (141, 'note', 'note', 'Menu change notification', 'Customer updating menu Q2', NOW() - INTERVAL '14 days', 5, 49, 25, 45, true, 3, NOW() - INTERVAL '14 days', NOW()),
  (142, 'note', 'note', 'Budget timing noted', 'FY starts in July', NOW() - INTERVAL '22 days', 5, 52, 26, 46, false, 3, NOW() - INTERVAL '22 days', NOW()),
  (143, 'note', 'note', 'Key contact leaving', 'Primary contact retiring June', NOW() - INTERVAL '29 days', 10, 57, 29, 47, true, 4, NOW() - INTERVAL '29 days', NOW()),
  (144, 'note', 'note', 'Expansion plans noted', 'Opening 5 new locations', NOW() - INTERVAL '35 days', 5, 65, 32, 48, false, 4, NOW() - INTERVAL '35 days', NOW()),
  (145, 'note', 'note', 'Quality concern logged', 'Reported texture issue batch 2234', NOW() - INTERVAL '41 days', 10, 39, 20, 1, true, 5, NOW() - INTERVAL '41 days', NOW()),
  (146, 'note', 'note', 'Preferred communication noted', 'Prefers email over calls', NOW() - INTERVAL '47 days', 5, 53, 27, 2, false, 5, NOW() - INTERVAL '47 days', NOW()),
  (147, 'note', 'note', 'Decision process noted', 'Committee meets monthly', NOW() - INTERVAL '53 days', 5, 59, 30, 3, true, 6, NOW() - INTERVAL '53 days', NOW()),
  (148, 'note', 'note', 'Dietary requirements noted', 'Need allergen-free options', NOW() - INTERVAL '59 days', 10, 76, 38, 4, false, 2, NOW() - INTERVAL '59 days', NOW()),
  (149, 'note', 'note', 'Sustainability focus noted', 'Pursuing B-Corp certification', NOW() - INTERVAL '64 days', 5, 43, 22, 5, true, 3, NOW() - INTERVAL '64 days', NOW()),
  (150, 'note', 'note', 'Price sensitivity noted', 'Very cost-conscious buyer', NOW() - INTERVAL '69 days', 5, 41, 21, 6, false, 3, NOW() - INTERVAL '69 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('activities', 'id'), 150, true);
