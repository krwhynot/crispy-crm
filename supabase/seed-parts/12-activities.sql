-- ============================================================================
-- PART 12: ACTIVITIES (150 activities)
-- ============================================================================
-- Two activity_type values: 'interaction' (opportunity-linked) or 'engagement'
-- Type column: call, email, meeting, demo, proposal, follow_up,
--              trade_show, site_visit, contract_review, check_in, social, note
-- All opportunity-linked activities MUST use activity_type='interaction'
-- ============================================================================

INSERT INTO "public"."activities" (
  id, activity_type, type, subject, description, activity_date,
  duration_minutes, contact_id, organization_id, opportunity_id,
  follow_up_required, created_by, created_at, updated_at
)
VALUES
  -- ========================================
  -- CALL Activities (12)
  -- ========================================
  (1, 'interaction', 'call', 'Initial discovery call', 'Discussed current supplier situation and pain points', NOW() - INTERVAL '5 days', 30, 39, 20, 1, true, 2, NOW() - INTERVAL '5 days', NOW()),
  (2, 'interaction', 'call', 'Follow-up pricing discussion', 'Reviewed volume pricing tiers', NOW() - INTERVAL '10 days', 25, 53, 27, 2, false, 3, NOW() - INTERVAL '10 days', NOW()),
  (3, 'interaction', 'call', 'Introduction call with chef', 'Introduced product line capabilities', NOW() - INTERVAL '8 days', 20, 59, 30, 3, true, 3, NOW() - INTERVAL '8 days', NOW()),
  (4, 'interaction', 'call', 'Quarterly check-in', 'Reviewed account status and upcoming needs', NOW() - INTERVAL '15 days', 35, 76, 38, 4, false, 4, NOW() - INTERVAL '15 days', NOW()),
  (5, 'interaction', 'call', 'Pricing negotiation call', 'Discussed volume discounts and payment terms', NOW() - INTERVAL '12 days', 45, 43, 22, 5, true, 4, NOW() - INTERVAL '12 days', NOW()),
  (6, 'interaction', 'call', 'Product inquiry follow-up', 'Answered questions about product specs', NOW() - INTERVAL '3 days', 15, 41, 21, 6, false, 5, NOW() - INTERVAL '3 days', NOW()),
  (7, 'interaction', 'call', 'Budget discussion', 'Reviewed budget cycles and timing', NOW() - INTERVAL '20 days', 40, 66, 33, 7, true, 6, NOW() - INTERVAL '20 days', NOW()),
  (8, 'interaction', 'call', 'Sample coordination', 'Arranged sample delivery details', NOW() - INTERVAL '18 days', 20, 62, 31, 8, false, 2, NOW() - INTERVAL '18 days', NOW()),
  (9, 'interaction', 'call', 'Menu planning discussion', 'Discussed integration with current menu', NOW() - INTERVAL '22 days', 30, 57, 29, 9, true, 3, NOW() - INTERVAL '22 days', NOW()),
  (10, 'interaction', 'call', 'Contract renewal discussion', 'Reviewed terms for upcoming renewal', NOW() - INTERVAL '25 days', 35, 49, 25, 10, false, 3, NOW() - INTERVAL '25 days', NOW()),
  (11, 'interaction', 'call', 'New product introduction', 'Presented new product additions', NOW() - INTERVAL '28 days', 25, 72, 36, 11, true, 4, NOW() - INTERVAL '28 days', NOW()),
  (12, 'interaction', 'call', 'Competitive situation review', 'Discussed competitor offerings', NOW() - INTERVAL '30 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '30 days', NOW()),

  -- ========================================
  -- EMAIL Activities (12)
  -- ========================================
  (13, 'interaction', 'email', 'Product catalog sent', 'Sent comprehensive product catalog PDF', NOW() - INTERVAL '4 days', 5, 55, 28, 13, false, 5, NOW() - INTERVAL '4 days', NOW()),
  (14, 'interaction', 'email', 'Pricing proposal attached', 'Sent formal pricing proposal document', NOW() - INTERVAL '6 days', 10, 51, 26, 14, true, 5, NOW() - INTERVAL '6 days', NOW()),
  (15, 'interaction', 'email', 'Sample request confirmation', 'Confirmed sample shipment details', NOW() - INTERVAL '14 days', 5, 47, 24, 15, false, 2, NOW() - INTERVAL '14 days', NOW()),
  (16, 'interaction', 'email', 'Meeting recap sent', 'Sent summary of discussion points', NOW() - INTERVAL '16 days', 15, 70, 35, 16, true, 3, NOW() - INTERVAL '16 days', NOW()),
  (17, 'interaction', 'email', 'Spec sheets requested', 'Chef requested detailed specifications', NOW() - INTERVAL '19 days', 5, 64, 32, 17, false, 3, NOW() - INTERVAL '19 days', NOW()),
  (18, 'interaction', 'email', 'Introduction email', 'Initial outreach to new contact', NOW() - INTERVAL '7 days', 10, 74, 37, 18, true, 4, NOW() - INTERVAL '7 days', NOW()),
  (19, 'interaction', 'email', 'Follow-up after call', 'Summarized call discussion points', NOW() - INTERVAL '9 days', 10, 68, 34, 19, false, 5, NOW() - INTERVAL '9 days', NOW()),
  (20, 'interaction', 'email', 'Case study shared', 'Sent relevant customer success story', NOW() - INTERVAL '11 days', 5, 54, 27, 20, true, 5, NOW() - INTERVAL '11 days', NOW()),
  (21, 'interaction', 'email', 'Thank you note', 'Thanked for demo attendance', NOW() - INTERVAL '13 days', 5, 60, 30, 21, false, 6, NOW() - INTERVAL '13 days', NOW()),
  (22, 'interaction', 'email', 'Contract draft sent', 'Sent initial contract for review', NOW() - INTERVAL '17 days', 15, 45, 23, 22, true, 2, NOW() - INTERVAL '17 days', NOW()),
  (23, 'interaction', 'email', 'Questions answered', 'Responded to technical questions', NOW() - INTERVAL '21 days', 10, 58, 29, 23, false, 3, NOW() - INTERVAL '21 days', NOW()),
  (24, 'interaction', 'email', 'Update on order status', 'Provided shipping information', NOW() - INTERVAL '23 days', 5, 79, 39, 24, false, 3, NOW() - INTERVAL '23 days', NOW()),

  -- ========================================
  -- MEETING Activities (12) - includes sample visits
  -- ========================================
  (25, 'interaction', 'meeting', 'Kitchen sample presentation', 'Chef tasted products in their kitchen', NOW() - INTERVAL '2 days', 90, 40, 20, 25, true, 4, NOW() - INTERVAL '2 days', NOW()),
  (26, 'interaction', 'meeting', 'Menu review meeting', 'Reviewed potential menu applications', NOW() - INTERVAL '5 days', 60, 44, 22, 26, false, 4, NOW() - INTERVAL '5 days', NOW()),
  (27, 'interaction', 'meeting', 'Product tasting session', 'Sampled new product line', NOW() - INTERVAL '8 days', 120, 50, 25, 27, true, 5, NOW() - INTERVAL '8 days', NOW()),
  (28, 'interaction', 'meeting', 'Quarterly business review', 'Reviewed partnership performance', NOW() - INTERVAL '12 days', 90, 42, 21, 28, false, 6, NOW() - INTERVAL '12 days', NOW()),
  (29, 'interaction', 'meeting', 'New product introduction', 'Presented seasonal additions', NOW() - INTERVAL '15 days', 60, 19, 10, 29, true, 2, NOW() - INTERVAL '15 days', NOW()),
  (30, 'interaction', 'meeting', 'Chef training session', 'Trained kitchen staff on products', NOW() - INTERVAL '18 days', 180, 21, 11, 30, false, 3, NOW() - INTERVAL '18 days', NOW()),
  (31, 'interaction', 'meeting', 'Distribution review', 'Discussed distribution strategy', NOW() - INTERVAL '22 days', 60, 25, 13, 31, true, 3, NOW() - INTERVAL '22 days', NOW()),
  (32, 'interaction', 'meeting', 'Sample delivery follow-up', 'Gathered feedback on samples', NOW() - INTERVAL '25 days', 45, 63, 31, 32, false, 4, NOW() - INTERVAL '25 days', NOW()),
  (33, 'interaction', 'meeting', 'Partnership discussion', 'Explored expanded relationship', NOW() - INTERVAL '28 days', 75, 35, 18, 33, true, 4, NOW() - INTERVAL '28 days', NOW()),
  (34, 'interaction', 'meeting', 'Menu planning workshop', 'Collaborated on menu development', NOW() - INTERVAL '30 days', 120, 38, 19, 34, false, 5, NOW() - INTERVAL '30 days', NOW()),
  (35, 'interaction', 'meeting', 'Sales team alignment', 'Synced on account strategy', NOW() - INTERVAL '32 days', 45, 23, 12, 35, true, 5, NOW() - INTERVAL '32 days', NOW()),
  (36, 'interaction', 'meeting', 'Executive meeting', 'Met with VP for approval', NOW() - INTERVAL '35 days', 60, 29, 15, 36, false, 6, NOW() - INTERVAL '35 days', NOW()),

  -- ========================================
  -- DEMO Activities (12)
  -- ========================================
  (37, 'interaction', 'demo', 'Full product line demo', 'Demonstrated complete portfolio', NOW() - INTERVAL '6 days', 120, 39, 20, 1, true, 2, NOW() - INTERVAL '6 days', NOW()),
  (38, 'interaction', 'demo', 'Kitchen demo with chef', 'Hands-on cooking demonstration', NOW() - INTERVAL '10 days', 90, 43, 22, 5, false, 4, NOW() - INTERVAL '10 days', NOW()),
  (39, 'interaction', 'demo', 'New product showcase', 'Presented latest innovations', NOW() - INTERVAL '14 days', 60, 47, 24, 15, true, 2, NOW() - INTERVAL '14 days', NOW()),
  (40, 'interaction', 'demo', 'Taste testing event', 'Organized tasting for culinary team', NOW() - INTERVAL '18 days', 150, 57, 29, 9, false, 3, NOW() - INTERVAL '18 days', NOW()),
  (41, 'interaction', 'demo', 'Virtual product demo', 'Online demo for remote team', NOW() - INTERVAL '22 days', 45, 72, 36, 11, true, 4, NOW() - INTERVAL '22 days', NOW()),
  (42, 'interaction', 'demo', 'Competitive comparison', 'Side-by-side product testing', NOW() - INTERVAL '26 days', 90, 49, 25, 10, false, 3, NOW() - INTERVAL '26 days', NOW()),
  (43, 'interaction', 'demo', 'Executive demo', 'Presented to leadership team', NOW() - INTERVAL '30 days', 60, 19, 10, 29, true, 2, NOW() - INTERVAL '30 days', NOW()),
  (44, 'interaction', 'demo', 'Distribution partner demo', 'Demo for distributor category team', NOW() - INTERVAL '34 days', 75, 21, 11, 30, false, 3, NOW() - INTERVAL '34 days', NOW()),
  (45, 'interaction', 'demo', 'Chef collaboration demo', 'Co-created recipes with chef', NOW() - INTERVAL '38 days', 180, 55, 28, 13, true, 6, NOW() - INTERVAL '38 days', NOW()),
  (46, 'interaction', 'demo', 'Menu integration demo', 'Showed menu applications', NOW() - INTERVAL '42 days', 90, 70, 35, 16, false, 3, NOW() - INTERVAL '42 days', NOW()),
  (47, 'interaction', 'demo', 'Quality comparison demo', 'Compared to current supplier', NOW() - INTERVAL '46 days', 60, 64, 32, 17, true, 3, NOW() - INTERVAL '46 days', NOW()),
  (48, 'interaction', 'demo', 'ROI demonstration', 'Showed cost savings potential', NOW() - INTERVAL '50 days', 45, 74, 37, 18, false, 4, NOW() - INTERVAL '50 days', NOW()),

  -- ========================================
  -- PROPOSAL Activities (12)
  -- ========================================
  (49, 'interaction', 'proposal', 'Initial pricing proposal', 'Submitted first pricing quote', NOW() - INTERVAL '7 days', 30, 53, 27, 2, true, 3, NOW() - INTERVAL '7 days', NOW()),
  (50, 'interaction', 'proposal', 'Volume discount proposal', 'Offered tiered pricing', NOW() - INTERVAL '11 days', 25, 59, 30, 3, false, 3, NOW() - INTERVAL '11 days', NOW()),
  (51, 'interaction', 'proposal', 'Custom product proposal', 'Proposed customized solution', NOW() - INTERVAL '15 days', 45, 76, 38, 4, true, 4, NOW() - INTERVAL '15 days', NOW()),
  (52, 'interaction', 'proposal', 'Partnership proposal', 'Submitted partnership terms', NOW() - INTERVAL '19 days', 60, 66, 33, 7, false, 6, NOW() - INTERVAL '19 days', NOW()),
  (53, 'interaction', 'proposal', 'Revised pricing proposal', 'Updated pricing based on feedback', NOW() - INTERVAL '23 days', 30, 62, 31, 8, true, 2, NOW() - INTERVAL '23 days', NOW()),
  (54, 'interaction', 'proposal', 'Annual contract proposal', 'Proposed yearly agreement', NOW() - INTERVAL '27 days', 40, 78, 39, 12, false, 4, NOW() - INTERVAL '27 days', NOW()),
  (55, 'interaction', 'proposal', 'Regional distribution proposal', 'Proposed regional rollout', NOW() - INTERVAL '31 days', 35, 51, 26, 14, true, 5, NOW() - INTERVAL '31 days', NOW()),
  (56, 'interaction', 'proposal', 'Pilot program proposal', 'Proposed limited trial', NOW() - INTERVAL '35 days', 45, 68, 34, 19, false, 5, NOW() - INTERVAL '35 days', NOW()),
  (57, 'interaction', 'proposal', 'Renewal proposal', 'Proposed contract renewal terms', NOW() - INTERVAL '39 days', 30, 54, 27, 20, true, 5, NOW() - INTERVAL '39 days', NOW()),
  (58, 'interaction', 'proposal', 'Expansion proposal', 'Proposed additional products', NOW() - INTERVAL '43 days', 50, 60, 30, 21, false, 6, NOW() - INTERVAL '43 days', NOW()),
  (59, 'interaction', 'proposal', 'National rollout proposal', 'Proposed nationwide distribution', NOW() - INTERVAL '47 days', 60, 45, 23, 22, true, 2, NOW() - INTERVAL '47 days', NOW()),
  (60, 'interaction', 'proposal', 'Exclusive partnership proposal', 'Proposed exclusive arrangement', NOW() - INTERVAL '51 days', 45, 58, 29, 23, false, 3, NOW() - INTERVAL '51 days', NOW()),

  -- ========================================
  -- FOLLOW_UP Activities (12)
  -- ========================================
  (61, 'interaction', 'follow_up', 'Post-demo follow-up', 'Checked in after demo', NOW() - INTERVAL '3 days', 15, 40, 20, 25, true, 4, NOW() - INTERVAL '3 days', NOW()),
  (62, 'interaction', 'follow_up', 'Proposal follow-up', 'Followed up on submitted proposal', NOW() - INTERVAL '8 days', 20, 44, 22, 26, false, 4, NOW() - INTERVAL '8 days', NOW()),
  (63, 'interaction', 'follow_up', 'Sample feedback follow-up', 'Gathered feedback on samples', NOW() - INTERVAL '12 days', 25, 50, 25, 27, true, 5, NOW() - INTERVAL '12 days', NOW()),
  (64, 'interaction', 'follow_up', 'Meeting recap follow-up', 'Confirmed next steps', NOW() - INTERVAL '16 days', 15, 42, 21, 28, false, 6, NOW() - INTERVAL '16 days', NOW()),
  (65, 'interaction', 'follow_up', 'Decision timeline follow-up', 'Checked on decision progress', NOW() - INTERVAL '20 days', 20, 19, 10, 29, true, 2, NOW() - INTERVAL '20 days', NOW()),
  (66, 'interaction', 'follow_up', 'Contract review follow-up', 'Checked on legal review status', NOW() - INTERVAL '24 days', 15, 21, 11, 30, false, 3, NOW() - INTERVAL '24 days', NOW()),
  (67, 'interaction', 'follow_up', 'Budget approval follow-up', 'Inquired about budget status', NOW() - INTERVAL '28 days', 20, 25, 13, 31, true, 3, NOW() - INTERVAL '28 days', NOW()),
  (68, 'interaction', 'follow_up', 'Trial results follow-up', 'Discussed pilot outcomes', NOW() - INTERVAL '32 days', 30, 63, 31, 32, false, 4, NOW() - INTERVAL '32 days', NOW()),
  (69, 'interaction', 'follow_up', 'Competitive update follow-up', 'Checked on competitive situation', NOW() - INTERVAL '36 days', 25, 35, 18, 33, true, 4, NOW() - INTERVAL '36 days', NOW()),
  (70, 'interaction', 'follow_up', 'Menu launch follow-up', 'Checked on menu roll-out', NOW() - INTERVAL '40 days', 20, 38, 19, 34, false, 5, NOW() - INTERVAL '40 days', NOW()),
  (71, 'interaction', 'follow_up', 'Stakeholder alignment follow-up', 'Confirmed internal alignment', NOW() - INTERVAL '44 days', 25, 23, 12, 35, true, 5, NOW() - INTERVAL '44 days', NOW()),
  (72, 'interaction', 'follow_up', 'Executive decision follow-up', 'Followed up with decision maker', NOW() - INTERVAL '48 days', 30, 29, 15, 36, false, 6, NOW() - INTERVAL '48 days', NOW()),

  -- ========================================
  -- TRADE_SHOW Activities (12)
  -- ========================================
  (73, 'interaction', 'trade_show', 'NRA Show booth visit', 'Met at National Restaurant Association show', NOW() - INTERVAL '60 days', 30, 39, 20, 1, true, 2, NOW() - INTERVAL '60 days', NOW()),
  (74, 'interaction', 'trade_show', 'Regional food show', 'Connected at regional industry event', NOW() - INTERVAL '65 days', 45, 53, 27, 2, false, 3, NOW() - INTERVAL '65 days', NOW()),
  (75, 'interaction', 'trade_show', 'Healthcare foodservice expo', 'Met at ANFP conference', NOW() - INTERVAL '70 days', 30, 66, 33, 7, true, 6, NOW() - INTERVAL '70 days', NOW()),
  (76, 'interaction', 'trade_show', 'Distributor show', 'Presented at distributor event', NOW() - INTERVAL '75 days', 60, 19, 10, 29, false, 2, NOW() - INTERVAL '75 days', NOW()),
  (77, 'interaction', 'trade_show', 'Plant-based summit', 'Exhibited at specialty show', NOW() - INTERVAL '80 days', 45, 55, 28, 13, true, 6, NOW() - INTERVAL '80 days', NOW()),
  (78, 'interaction', 'trade_show', 'Hotel F&B conference', 'Connected at hospitality event', NOW() - INTERVAL '85 days', 30, 59, 30, 3, false, 3, NOW() - INTERVAL '85 days', NOW()),
  (79, 'interaction', 'trade_show', 'Campus dining expo', 'Met at higher ed foodservice show', NOW() - INTERVAL '90 days', 45, 70, 35, 16, true, 3, NOW() - INTERVAL '90 days', NOW()),
  (80, 'interaction', 'trade_show', 'Senior living conference', 'Exhibited at AHCA conference', NOW() - INTERVAL '95 days', 30, 74, 37, 18, false, 4, NOW() - INTERVAL '95 days', NOW()),
  (81, 'interaction', 'trade_show', 'Casual dining summit', 'Met at chain restaurant event', NOW() - INTERVAL '100 days', 45, 47, 24, 15, true, 2, NOW() - INTERVAL '100 days', NOW()),
  (82, 'interaction', 'trade_show', 'Sports venue expo', 'Connected at venue management show', NOW() - INTERVAL '105 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '105 days', NOW()),
  (83, 'interaction', 'trade_show', 'Distributor partner day', 'Attended partner event', NOW() - INTERVAL '110 days', 60, 25, 13, 31, true, 3, NOW() - INTERVAL '110 days', NOW()),
  (84, 'interaction', 'trade_show', 'Specialty foods show', 'Exhibited at Fancy Food Show', NOW() - INTERVAL '115 days', 45, 35, 18, 33, false, 4, NOW() - INTERVAL '115 days', NOW()),

  -- ========================================
  -- SITE_VISIT Activities (12)
  -- ========================================
  (85, 'interaction', 'site_visit', 'Kitchen tour and assessment', 'Visited kitchen to assess needs', NOW() - INTERVAL '4 days', 120, 41, 21, 6, true, 5, NOW() - INTERVAL '4 days', NOW()),
  (86, 'interaction', 'site_visit', 'Distribution center visit', 'Toured warehouse facility', NOW() - INTERVAL '9 days', 180, 21, 11, 30, false, 3, NOW() - INTERVAL '9 days', NOW()),
  (87, 'interaction', 'site_visit', 'Plant tour for buyer', 'Showed manufacturing facility', NOW() - INTERVAL '14 days', 240, 19, 10, 29, true, 2, NOW() - INTERVAL '14 days', NOW()),
  (88, 'interaction', 'site_visit', 'Kitchen installation review', 'Reviewed equipment setup', NOW() - INTERVAL '19 days', 90, 64, 32, 17, false, 3, NOW() - INTERVAL '19 days', NOW()),
  (89, 'interaction', 'site_visit', 'Multi-unit assessment', 'Visited several locations', NOW() - INTERVAL '24 days', 300, 72, 36, 11, true, 4, NOW() - INTERVAL '24 days', NOW()),
  (90, 'interaction', 'site_visit', 'Quality audit visit', 'Conducted quality review', NOW() - INTERVAL '29 days', 150, 62, 31, 8, false, 2, NOW() - INTERVAL '29 days', NOW()),
  (91, 'interaction', 'site_visit', 'New location opening', 'Supported new store opening', NOW() - INTERVAL '34 days', 180, 49, 25, 10, true, 3, NOW() - INTERVAL '34 days', NOW()),
  (92, 'interaction', 'site_visit', 'Commissary visit', 'Toured central kitchen', NOW() - INTERVAL '39 days', 120, 57, 29, 9, false, 3, NOW() - INTERVAL '39 days', NOW()),
  (93, 'interaction', 'site_visit', 'Executive site tour', 'Hosted leadership visit', NOW() - INTERVAL '44 days', 180, 38, 19, 34, true, 5, NOW() - INTERVAL '44 days', NOW()),
  (94, 'interaction', 'site_visit', 'Training facility visit', 'Conducted on-site training', NOW() - INTERVAL '49 days', 240, 68, 34, 19, false, 5, NOW() - INTERVAL '49 days', NOW()),
  (95, 'interaction', 'site_visit', 'Banquet kitchen visit', 'Assessed banquet operations', NOW() - INTERVAL '54 days', 120, 60, 30, 21, true, 6, NOW() - INTERVAL '54 days', NOW()),
  (96, 'interaction', 'site_visit', 'Regional office visit', 'Met at regional headquarters', NOW() - INTERVAL '59 days', 90, 23, 12, 35, false, 5, NOW() - INTERVAL '59 days', NOW()),

  -- ========================================
  -- CONTRACT_REVIEW Activities (12)
  -- ========================================
  (97, 'interaction', 'contract_review', 'Initial contract review', 'Reviewed initial terms', NOW() - INTERVAL '5 days', 60, 42, 21, 28, true, 6, NOW() - INTERVAL '5 days', NOW()),
  (98, 'interaction', 'contract_review', 'Pricing terms discussion', 'Negotiated pricing section', NOW() - INTERVAL '10 days', 45, 45, 23, 22, false, 2, NOW() - INTERVAL '10 days', NOW()),
  (99, 'interaction', 'contract_review', 'Legal review meeting', 'Discussed legal concerns', NOW() - INTERVAL '15 days', 90, 54, 27, 20, true, 5, NOW() - INTERVAL '15 days', NOW()),
  (100, 'interaction', 'contract_review', 'Renewal terms review', 'Reviewed renewal conditions', NOW() - INTERVAL '20 days', 60, 58, 29, 23, false, 3, NOW() - INTERVAL '20 days', NOW()),
  (101, 'interaction', 'contract_review', 'Volume commitment review', 'Discussed volume requirements', NOW() - INTERVAL '25 days', 45, 79, 39, 24, true, 3, NOW() - INTERVAL '25 days', NOW()),
  (102, 'interaction', 'contract_review', 'Payment terms negotiation', 'Negotiated payment schedule', NOW() - INTERVAL '30 days', 60, 46, 23, 22, false, 2, NOW() - INTERVAL '30 days', NOW()),
  (103, 'interaction', 'contract_review', 'Distribution agreement review', 'Reviewed distributor terms', NOW() - INTERVAL '35 days', 75, 26, 13, 31, true, 3, NOW() - INTERVAL '35 days', NOW()),
  (104, 'interaction', 'contract_review', 'Service level review', 'Discussed SLA terms', NOW() - INTERVAL '40 days', 45, 30, 15, 36, false, 6, NOW() - INTERVAL '40 days', NOW()),
  (105, 'interaction', 'contract_review', 'Exclusivity terms review', 'Discussed exclusive arrangement', NOW() - INTERVAL '45 days', 60, 33, 17, 35, true, 5, NOW() - INTERVAL '45 days', NOW()),
  (106, 'interaction', 'contract_review', 'Final contract review', 'Final review before signing', NOW() - INTERVAL '50 days', 90, 20, 10, 29, false, 2, NOW() - INTERVAL '50 days', NOW()),
  (107, 'interaction', 'contract_review', 'Amendment review', 'Reviewed contract changes', NOW() - INTERVAL '55 days', 45, 22, 11, 30, true, 3, NOW() - INTERVAL '55 days', NOW()),
  (108, 'interaction', 'contract_review', 'Term extension review', 'Discussed term extension', NOW() - INTERVAL '60 days', 60, 24, 12, 35, false, 5, NOW() - INTERVAL '60 days', NOW()),

  -- ========================================
  -- CHECK_IN Activities (12)
  -- ========================================
  (109, 'interaction', 'check_in', 'Monthly account check-in', 'Regular monthly touchpoint', NOW() - INTERVAL '2 days', 20, 48, 24, 15, false, 4, NOW() - INTERVAL '2 days', NOW()),
  (110, 'interaction', 'check_in', 'Relationship maintenance call', 'Nurturing key relationship', NOW() - INTERVAL '7 days', 25, 52, 26, 14, true, 5, NOW() - INTERVAL '7 days', NOW()),
  (111, 'interaction', 'check_in', 'Quarterly business check-in', 'Quarterly account review', NOW() - INTERVAL '12 days', 30, 67, 33, 7, false, 6, NOW() - INTERVAL '12 days', NOW()),
  (112, 'interaction', 'check_in', 'New contact introduction', 'Introduction to new team member', NOW() - INTERVAL '17 days', 20, 69, 34, 19, true, 4, NOW() - INTERVAL '17 days', NOW()),
  (113, 'interaction', 'check_in', 'Holiday greeting call', 'Season greetings touchpoint', NOW() - INTERVAL '22 days', 15, 71, 35, 16, false, 3, NOW() - INTERVAL '22 days', NOW()),
  (114, 'interaction', 'check_in', 'Account health check', 'Verified account satisfaction', NOW() - INTERVAL '27 days', 25, 73, 36, 11, true, 4, NOW() - INTERVAL '27 days', NOW()),
  (115, 'interaction', 'check_in', 'Post-order check-in', 'Followed up after delivery', NOW() - INTERVAL '32 days', 15, 75, 37, 18, false, 6, NOW() - INTERVAL '32 days', NOW()),
  (116, 'interaction', 'check_in', 'Year-end review call', 'Annual relationship review', NOW() - INTERVAL '37 days', 30, 77, 38, 4, true, 4, NOW() - INTERVAL '37 days', NOW()),
  (117, 'interaction', 'check_in', 'New year planning call', 'Discussed upcoming year plans', NOW() - INTERVAL '42 days', 25, 80, 39, 12, false, 2, NOW() - INTERVAL '42 days', NOW()),
  (118, 'interaction', 'check_in', 'Summer season check-in', 'Seasonal planning discussion', NOW() - INTERVAL '47 days', 20, 56, 28, 13, true, 6, NOW() - INTERVAL '47 days', NOW()),
  (119, 'interaction', 'check_in', 'Executive relationship check', 'Executive level touchpoint', NOW() - INTERVAL '52 days', 30, 17, 9, 43, false, 6, NOW() - INTERVAL '52 days', NOW()),
  (120, 'interaction', 'check_in', 'Operations alignment check', 'Verified operational alignment', NOW() - INTERVAL '57 days', 25, 18, 9, 43, true, 6, NOW() - INTERVAL '57 days', NOW()),

  -- ========================================
  -- SOCIAL Activities (12)
  -- ========================================
  (121, 'interaction', 'social', 'Industry dinner event', 'Networking dinner with contacts', NOW() - INTERVAL '10 days', 180, 39, 20, 1, false, 2, NOW() - INTERVAL '10 days', NOW()),
  (122, 'interaction', 'social', 'Golf outing', 'Client appreciation golf', NOW() - INTERVAL '20 days', 300, 19, 10, 29, true, 2, NOW() - INTERVAL '20 days', NOW()),
  (123, 'interaction', 'social', 'Wine dinner event', 'Hosted wine pairing dinner', NOW() - INTERVAL '30 days', 180, 43, 22, 5, false, 4, NOW() - INTERVAL '30 days', NOW()),
  (124, 'interaction', 'social', 'Sporting event tickets', 'Hosted at baseball game', NOW() - INTERVAL '40 days', 240, 78, 39, 12, true, 4, NOW() - INTERVAL '40 days', NOW()),
  (125, 'interaction', 'social', 'Charity event', 'Connected at charity fundraiser', NOW() - INTERVAL '50 days', 180, 59, 30, 3, false, 3, NOW() - INTERVAL '50 days', NOW()),
  (126, 'interaction', 'social', 'Industry awards dinner', 'Attended awards ceremony together', NOW() - INTERVAL '60 days', 240, 55, 28, 13, true, 6, NOW() - INTERVAL '60 days', NOW()),
  (127, 'interaction', 'social', 'Coffee meeting', 'Informal catch-up coffee', NOW() - INTERVAL '70 days', 60, 66, 33, 7, false, 6, NOW() - INTERVAL '70 days', NOW()),
  (128, 'interaction', 'social', 'Happy hour networking', 'After-work networking event', NOW() - INTERVAL '80 days', 120, 72, 36, 11, true, 4, NOW() - INTERVAL '80 days', NOW()),
  (129, 'interaction', 'social', 'Holiday party', 'Annual holiday celebration', NOW() - INTERVAL '90 days', 180, 47, 24, 15, false, 2, NOW() - INTERVAL '90 days', NOW()),
  (130, 'interaction', 'social', 'Client appreciation lunch', 'Thank you lunch for key buyer', NOW() - INTERVAL '100 days', 90, 21, 11, 30, true, 3, NOW() - INTERVAL '100 days', NOW()),
  (131, 'interaction', 'social', 'Industry mixer', 'Networking at industry event', NOW() - INTERVAL '110 days', 120, 25, 13, 31, false, 3, NOW() - INTERVAL '110 days', NOW()),
  (132, 'interaction', 'social', 'New Year celebration', 'Rang in New Year with client', NOW() - INTERVAL '120 days', 180, 35, 18, 33, true, 4, NOW() - INTERVAL '120 days', NOW()),

  -- ========================================
  -- NOTE Activities (18 - general notes)
  -- ========================================
  (133, 'interaction', 'note', 'Competitive intelligence', 'Learned competitor is offering lower prices', NOW() - INTERVAL '1 day', 5, 40, 20, 25, false, 4, NOW() - INTERVAL '1 day', NOW()),
  (134, 'interaction', 'note', 'Menu change planned', 'Chef mentioned upcoming menu revamp', NOW() - INTERVAL '3 days', 5, 44, 22, 26, true, 4, NOW() - INTERVAL '3 days', NOW()),
  (135, 'interaction', 'note', 'Budget cycle timing', 'Budget decisions made in Q3', NOW() - INTERVAL '5 days', 5, 50, 25, 27, false, 5, NOW() - INTERVAL '5 days', NOW()),
  (136, 'interaction', 'note', 'Key stakeholder identified', 'CFO has final approval authority', NOW() - INTERVAL '7 days', 5, 42, 21, 28, true, 6, NOW() - INTERVAL '7 days', NOW()),
  (137, 'interaction', 'note', 'Expansion plans shared', 'Opening 5 new locations next year', NOW() - INTERVAL '9 days', 5, 19, 10, 29, false, 2, NOW() - INTERVAL '9 days', NOW()),
  (138, 'interaction', 'note', 'Pain point identified', 'Current supplier has quality issues', NOW() - INTERVAL '11 days', 5, 21, 11, 30, true, 3, NOW() - INTERVAL '11 days', NOW()),
  (139, 'interaction', 'note', 'Timeline update', 'Decision pushed to next quarter', NOW() - INTERVAL '13 days', 5, 25, 13, 31, false, 3, NOW() - INTERVAL '13 days', NOW()),
  (140, 'interaction', 'note', 'Contact leaving', 'Key contact taking new job', NOW() - INTERVAL '15 days', 5, 63, 31, 32, true, 4, NOW() - INTERVAL '15 days', NOW()),
  (141, 'interaction', 'note', 'Vendor consolidation', 'Looking to reduce vendor count', NOW() - INTERVAL '17 days', 5, 35, 18, 33, false, 4, NOW() - INTERVAL '17 days', NOW()),
  (142, 'interaction', 'note', 'Sustainability focus', 'Increasing focus on sustainability', NOW() - INTERVAL '19 days', 5, 38, 19, 34, true, 5, NOW() - INTERVAL '19 days', NOW()),
  (143, 'interaction', 'note', 'Regional preference', 'Prefers local/regional suppliers', NOW() - INTERVAL '21 days', 5, 23, 12, 35, false, 5, NOW() - INTERVAL '21 days', NOW()),
  (144, 'interaction', 'note', 'Pricing sensitivity', 'Very price sensitive account', NOW() - INTERVAL '23 days', 5, 29, 15, 36, true, 6, NOW() - INTERVAL '23 days', NOW()),
  (145, 'interaction', 'note', 'Quality over price', 'Willing to pay premium for quality', NOW() - INTERVAL '25 days', 5, 53, 27, 2, false, 3, NOW() - INTERVAL '25 days', NOW()),
  (146, 'interaction', 'note', 'Contract renewal timing', 'Contract up for renewal in June', NOW() - INTERVAL '27 days', 5, 76, 38, 4, true, 4, NOW() - INTERVAL '27 days', NOW()),
  (147, 'interaction', 'note', 'Decision maker identified', 'VP Operations makes final call', NOW() - INTERVAL '29 days', 5, 41, 21, 6, false, 5, NOW() - INTERVAL '29 days', NOW()),
  (148, 'interaction', 'note', 'Competitor weakness', 'Competitor having supply issues', NOW() - INTERVAL '31 days', 5, 66, 33, 7, true, 6, NOW() - INTERVAL '31 days', NOW()),
  (149, 'interaction', 'note', 'Budget approved', 'Got budget approval for new vendor', NOW() - INTERVAL '33 days', 5, 62, 31, 8, false, 2, NOW() - INTERVAL '33 days', NOW()),
  (150, 'interaction', 'note', 'Trial feedback positive', 'Pilot program getting great reviews', NOW() - INTERVAL '35 days', 5, 57, 29, 9, true, 3, NOW() - INTERVAL '35 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('activities', 'id'), 150, true);
