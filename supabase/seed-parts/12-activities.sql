-- ============================================================================
-- PART 12: ACTIVITIES (150 activities)
-- ============================================================================
-- Two activity_type values: 'interaction' (opportunity-linked) or 'engagement'
-- Type column: call, email, meeting, demo, proposal, follow_up,
--              trade_show, site_visit, contract_review, check_in, social, note
-- All opportunity-linked activities MUST use activity_type='interaction'
-- CRITICAL: Contact must belong to the opportunity's customer organization
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
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (1, 'interaction', 'call', 'Initial discovery call', 'Discussed current supplier situation and pain points', NOW() - INTERVAL '5 days', 30, 39, 20, 1, true, 2, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (2, 'interaction', 'call', 'Follow-up pricing discussion', 'Reviewed volume pricing tiers', NOW() - INTERVAL '10 days', 25, 53, 27, 2, false, 3, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (3, 'interaction', 'call', 'Introduction call with chef', 'Introduced product line capabilities', NOW() - INTERVAL '8 days', 20, 59, 30, 3, true, 3, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (4, 'interaction', 'call', 'Quarterly check-in', 'Reviewed account status and upcoming needs', NOW() - INTERVAL '15 days', 35, 76, 38, 4, false, 4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (5, 'interaction', 'call', 'Pricing negotiation call', 'Discussed volume discounts and payment terms', NOW() - INTERVAL '12 days', 45, 43, 22, 5, true, 4, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (6, 'interaction', 'call', 'Product inquiry follow-up', 'Answered questions about product specs', NOW() - INTERVAL '3 days', 15, 41, 21, 6, false, 5, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (7, 'interaction', 'call', 'Budget discussion', 'Reviewed budget cycles and timing', NOW() - INTERVAL '20 days', 40, 66, 33, 7, true, 6, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (8, 'interaction', 'call', 'Sample coordination', 'Arranged sample delivery details', NOW() - INTERVAL '18 days', 20, 62, 31, 8, false, 2, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (9, 'interaction', 'call', 'Menu planning discussion', 'Discussed integration with current menu', NOW() - INTERVAL '22 days', 30, 57, 29, 9, true, 3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (10, 'interaction', 'call', 'Contract renewal discussion', 'Reviewed terms for upcoming renewal', NOW() - INTERVAL '25 days', 35, 49, 25, 10, false, 3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (11, 'interaction', 'call', 'New product introduction', 'Presented new product additions', NOW() - INTERVAL '28 days', 25, 72, 36, 11, true, 4, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (12, 'interaction', 'call', 'Competitive situation review', 'Discussed competitor offerings', NOW() - INTERVAL '30 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '30 days', NOW()),

  -- ========================================
  -- EMAIL Activities (12)
  -- ========================================
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (13, 'interaction', 'email', 'Product catalog sent', 'Sent comprehensive product catalog PDF', NOW() - INTERVAL '4 days', 5, 55, 28, 13, false, 5, NOW() - INTERVAL '4 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (14, 'interaction', 'email', 'Pricing proposal attached', 'Sent formal pricing proposal document', NOW() - INTERVAL '6 days', 10, 51, 26, 14, true, 5, NOW() - INTERVAL '6 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (15, 'interaction', 'email', 'Sample request confirmation', 'Confirmed sample shipment details', NOW() - INTERVAL '14 days', 5, 47, 24, 15, false, 2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (16, 'interaction', 'email', 'Meeting recap sent', 'Sent summary of discussion points', NOW() - INTERVAL '16 days', 15, 70, 35, 16, true, 3, NOW() - INTERVAL '16 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (17, 'interaction', 'email', 'Spec sheets requested', 'Chef requested detailed specifications', NOW() - INTERVAL '19 days', 5, 64, 32, 17, false, 3, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (18, 'interaction', 'email', 'Introduction email', 'Initial outreach to new contact', NOW() - INTERVAL '7 days', 10, 74, 37, 18, true, 4, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (19, 'interaction', 'email', 'Follow-up after call', 'Summarized call discussion points', NOW() - INTERVAL '9 days', 10, 68, 34, 19, false, 5, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (20, 'interaction', 'email', 'Case study shared', 'Sent relevant customer success story', NOW() - INTERVAL '11 days', 5, 54, 27, 20, true, 5, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (21, 'interaction', 'email', 'Thank you note', 'Thanked for demo attendance', NOW() - INTERVAL '13 days', 5, 60, 30, 21, false, 6, NOW() - INTERVAL '13 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (22, 'interaction', 'email', 'Contract draft sent', 'Sent initial contract for review', NOW() - INTERVAL '17 days', 15, 45, 23, 22, true, 2, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (23, 'interaction', 'email', 'Questions answered', 'Responded to technical questions', NOW() - INTERVAL '21 days', 10, 58, 29, 23, false, 3, NOW() - INTERVAL '21 days', NOW()),
  -- Opp 24: customer_org 39 -> contacts 78, 79, 80
  (24, 'interaction', 'email', 'Update on order status', 'Provided shipping information', NOW() - INTERVAL '23 days', 5, 79, 39, 24, false, 3, NOW() - INTERVAL '23 days', NOW()),

  -- ========================================
  -- MEETING Activities (12) - includes sample visits
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (25, 'interaction', 'meeting', 'Kitchen sample presentation', 'Chef tasted products in their kitchen', NOW() - INTERVAL '2 days', 90, 40, 20, 25, true, 4, NOW() - INTERVAL '2 days', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (26, 'interaction', 'meeting', 'Menu review meeting', 'Reviewed potential menu applications', NOW() - INTERVAL '5 days', 60, 44, 22, 26, false, 4, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (27, 'interaction', 'meeting', 'Product tasting session', 'Sampled new product line', NOW() - INTERVAL '8 days', 120, 50, 25, 27, true, 5, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (28, 'interaction', 'meeting', 'Quarterly business review', 'Reviewed partnership performance', NOW() - INTERVAL '12 days', 90, 42, 21, 28, false, 6, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (29, 'interaction', 'meeting', 'New product introduction', 'Presented seasonal additions', NOW() - INTERVAL '15 days', 60, 19, 10, 29, true, 2, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (30, 'interaction', 'meeting', 'Chef training session', 'Trained kitchen staff on products', NOW() - INTERVAL '18 days', 180, 21, 11, 30, false, 3, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (31, 'interaction', 'meeting', 'Distribution review', 'Discussed distribution strategy', NOW() - INTERVAL '22 days', 60, 25, 13, 31, true, 3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (32, 'interaction', 'meeting', 'Sample delivery follow-up', 'Gathered feedback on samples', NOW() - INTERVAL '25 days', 45, 63, 31, 32, false, 4, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (33, 'interaction', 'meeting', 'Partnership discussion', 'Explored expanded relationship', NOW() - INTERVAL '28 days', 75, 35, 18, 33, true, 4, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (34, 'interaction', 'meeting', 'Menu planning workshop', 'Collaborated on menu development', NOW() - INTERVAL '30 days', 120, 38, 19, 34, false, 5, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (35, 'interaction', 'meeting', 'Sales team alignment', 'Synced on account strategy', NOW() - INTERVAL '32 days', 45, 23, 12, 35, true, 5, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (36, 'interaction', 'meeting', 'Executive meeting', 'Met with VP for approval', NOW() - INTERVAL '35 days', 60, 29, 15, 36, false, 6, NOW() - INTERVAL '35 days', NOW()),

  -- ========================================
  -- DEMO Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (37, 'interaction', 'demo', 'Full product line demo', 'Demonstrated complete portfolio', NOW() - INTERVAL '6 days', 120, 39, 20, 1, true, 2, NOW() - INTERVAL '6 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (38, 'interaction', 'demo', 'Kitchen demo with chef', 'Hands-on cooking demonstration', NOW() - INTERVAL '10 days', 90, 43, 22, 5, false, 4, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (39, 'interaction', 'demo', 'New product showcase', 'Presented latest innovations', NOW() - INTERVAL '14 days', 60, 47, 24, 15, true, 2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (40, 'interaction', 'demo', 'Taste testing event', 'Organized tasting for culinary team', NOW() - INTERVAL '18 days', 150, 57, 29, 9, false, 3, NOW() - INTERVAL '18 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (41, 'interaction', 'demo', 'Virtual product demo', 'Online demo for remote team', NOW() - INTERVAL '22 days', 45, 72, 36, 11, true, 4, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (42, 'interaction', 'demo', 'Competitive comparison', 'Side-by-side product testing', NOW() - INTERVAL '26 days', 90, 49, 25, 10, false, 3, NOW() - INTERVAL '26 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (43, 'interaction', 'demo', 'Executive demo', 'Presented to leadership team', NOW() - INTERVAL '30 days', 60, 19, 10, 29, true, 2, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (44, 'interaction', 'demo', 'Distribution partner demo', 'Demo for distributor category team', NOW() - INTERVAL '34 days', 75, 21, 11, 30, false, 3, NOW() - INTERVAL '34 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (45, 'interaction', 'demo', 'Chef collaboration demo', 'Co-created recipes with chef', NOW() - INTERVAL '38 days', 180, 55, 28, 13, true, 6, NOW() - INTERVAL '38 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (46, 'interaction', 'demo', 'Menu integration demo', 'Showed menu applications', NOW() - INTERVAL '42 days', 90, 70, 35, 16, false, 3, NOW() - INTERVAL '42 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (47, 'interaction', 'demo', 'Quality comparison demo', 'Compared to current supplier', NOW() - INTERVAL '46 days', 60, 64, 32, 17, true, 3, NOW() - INTERVAL '46 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (48, 'interaction', 'demo', 'ROI demonstration', 'Showed cost savings potential', NOW() - INTERVAL '50 days', 45, 74, 37, 18, false, 4, NOW() - INTERVAL '50 days', NOW()),

  -- ========================================
  -- PROPOSAL Activities (12)
  -- ========================================
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (49, 'interaction', 'proposal', 'Initial pricing proposal', 'Submitted first pricing quote', NOW() - INTERVAL '7 days', 30, 53, 27, 2, true, 3, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (50, 'interaction', 'proposal', 'Volume discount proposal', 'Offered tiered pricing', NOW() - INTERVAL '11 days', 25, 59, 30, 3, false, 3, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (51, 'interaction', 'proposal', 'Custom product proposal', 'Proposed customized solution', NOW() - INTERVAL '15 days', 45, 76, 38, 4, true, 4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (52, 'interaction', 'proposal', 'Partnership proposal', 'Submitted partnership terms', NOW() - INTERVAL '19 days', 60, 66, 33, 7, false, 6, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (53, 'interaction', 'proposal', 'Revised pricing proposal', 'Updated pricing based on feedback', NOW() - INTERVAL '23 days', 30, 62, 31, 8, true, 2, NOW() - INTERVAL '23 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (54, 'interaction', 'proposal', 'Annual contract proposal', 'Proposed yearly agreement', NOW() - INTERVAL '27 days', 40, 78, 39, 12, false, 4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (55, 'interaction', 'proposal', 'Regional distribution proposal', 'Proposed regional rollout', NOW() - INTERVAL '31 days', 35, 51, 26, 14, true, 5, NOW() - INTERVAL '31 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (56, 'interaction', 'proposal', 'Pilot program proposal', 'Proposed limited trial', NOW() - INTERVAL '35 days', 45, 68, 34, 19, false, 5, NOW() - INTERVAL '35 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (57, 'interaction', 'proposal', 'Renewal proposal', 'Proposed contract renewal terms', NOW() - INTERVAL '39 days', 30, 54, 27, 20, true, 5, NOW() - INTERVAL '39 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (58, 'interaction', 'proposal', 'Expansion proposal', 'Proposed additional products', NOW() - INTERVAL '43 days', 50, 60, 30, 21, false, 6, NOW() - INTERVAL '43 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (59, 'interaction', 'proposal', 'National rollout proposal', 'Proposed nationwide distribution', NOW() - INTERVAL '47 days', 60, 45, 23, 22, true, 2, NOW() - INTERVAL '47 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (60, 'interaction', 'proposal', 'Exclusive partnership proposal', 'Proposed exclusive arrangement', NOW() - INTERVAL '51 days', 45, 58, 29, 23, false, 3, NOW() - INTERVAL '51 days', NOW()),

  -- ========================================
  -- FOLLOW_UP Activities (12)
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (61, 'interaction', 'follow_up', 'Post-demo follow-up', 'Checked in after demo', NOW() - INTERVAL '3 days', 15, 40, 20, 25, true, 4, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (62, 'interaction', 'follow_up', 'Proposal follow-up', 'Followed up on submitted proposal', NOW() - INTERVAL '8 days', 20, 44, 22, 26, false, 4, NOW() - INTERVAL '8 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (63, 'interaction', 'follow_up', 'Sample feedback follow-up', 'Gathered feedback on samples', NOW() - INTERVAL '12 days', 25, 50, 25, 27, true, 5, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (64, 'interaction', 'follow_up', 'Meeting recap follow-up', 'Confirmed next steps', NOW() - INTERVAL '16 days', 15, 42, 21, 28, false, 6, NOW() - INTERVAL '16 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (65, 'interaction', 'follow_up', 'Decision timeline follow-up', 'Checked on decision progress', NOW() - INTERVAL '20 days', 20, 19, 10, 29, true, 2, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (66, 'interaction', 'follow_up', 'Contract review follow-up', 'Checked on legal review status', NOW() - INTERVAL '24 days', 15, 21, 11, 30, false, 3, NOW() - INTERVAL '24 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (67, 'interaction', 'follow_up', 'Budget approval follow-up', 'Inquired about budget status', NOW() - INTERVAL '28 days', 20, 25, 13, 31, true, 3, NOW() - INTERVAL '28 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (68, 'interaction', 'follow_up', 'Trial results follow-up', 'Discussed pilot outcomes', NOW() - INTERVAL '32 days', 30, 63, 31, 32, false, 4, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (69, 'interaction', 'follow_up', 'Competitive update follow-up', 'Checked on competitive situation', NOW() - INTERVAL '36 days', 25, 35, 18, 33, true, 4, NOW() - INTERVAL '36 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (70, 'interaction', 'follow_up', 'Menu launch follow-up', 'Checked on menu roll-out', NOW() - INTERVAL '40 days', 20, 38, 19, 34, false, 5, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (71, 'interaction', 'follow_up', 'Stakeholder alignment follow-up', 'Confirmed internal alignment', NOW() - INTERVAL '44 days', 25, 23, 12, 35, true, 5, NOW() - INTERVAL '44 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (72, 'interaction', 'follow_up', 'Executive decision follow-up', 'Followed up with decision maker', NOW() - INTERVAL '48 days', 30, 29, 15, 36, false, 6, NOW() - INTERVAL '48 days', NOW()),

  -- ========================================
  -- TRADE_SHOW Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (73, 'interaction', 'trade_show', 'NRA Show booth visit', 'Met at National Restaurant Association show', NOW() - INTERVAL '60 days', 30, 39, 20, 1, true, 2, NOW() - INTERVAL '60 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (74, 'interaction', 'trade_show', 'Regional food show', 'Connected at regional industry event', NOW() - INTERVAL '65 days', 45, 53, 27, 2, false, 3, NOW() - INTERVAL '65 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (75, 'interaction', 'trade_show', 'Healthcare foodservice expo', 'Met at ANFP conference', NOW() - INTERVAL '70 days', 30, 66, 33, 7, true, 6, NOW() - INTERVAL '70 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (76, 'interaction', 'trade_show', 'Distributor show', 'Presented at distributor event', NOW() - INTERVAL '75 days', 60, 19, 10, 29, false, 2, NOW() - INTERVAL '75 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (77, 'interaction', 'trade_show', 'Plant-based summit', 'Exhibited at specialty show', NOW() - INTERVAL '80 days', 45, 55, 28, 13, true, 6, NOW() - INTERVAL '80 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (78, 'interaction', 'trade_show', 'Hotel F&B conference', 'Connected at hospitality event', NOW() - INTERVAL '85 days', 30, 59, 30, 3, false, 3, NOW() - INTERVAL '85 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (79, 'interaction', 'trade_show', 'Campus dining expo', 'Met at higher ed foodservice show', NOW() - INTERVAL '90 days', 45, 70, 35, 16, true, 3, NOW() - INTERVAL '90 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (80, 'interaction', 'trade_show', 'Senior living conference', 'Exhibited at AHCA conference', NOW() - INTERVAL '95 days', 30, 74, 37, 18, false, 4, NOW() - INTERVAL '95 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (81, 'interaction', 'trade_show', 'Casual dining summit', 'Met at chain restaurant event', NOW() - INTERVAL '100 days', 45, 47, 24, 15, true, 2, NOW() - INTERVAL '100 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (82, 'interaction', 'trade_show', 'Sports venue expo', 'Connected at venue management show', NOW() - INTERVAL '105 days', 30, 78, 39, 12, false, 4, NOW() - INTERVAL '105 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (83, 'interaction', 'trade_show', 'Distributor partner day', 'Attended partner event', NOW() - INTERVAL '110 days', 60, 25, 13, 31, true, 3, NOW() - INTERVAL '110 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (84, 'interaction', 'trade_show', 'Specialty foods show', 'Exhibited at Fancy Food Show', NOW() - INTERVAL '115 days', 45, 35, 18, 33, false, 4, NOW() - INTERVAL '115 days', NOW()),

  -- ========================================
  -- SITE_VISIT Activities (12)
  -- ========================================
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (85, 'interaction', 'site_visit', 'Kitchen tour and assessment', 'Visited kitchen to assess needs', NOW() - INTERVAL '4 days', 120, 41, 21, 6, true, 5, NOW() - INTERVAL '4 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (86, 'interaction', 'site_visit', 'Distribution center visit', 'Toured warehouse facility', NOW() - INTERVAL '9 days', 180, 21, 11, 30, false, 3, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (87, 'interaction', 'site_visit', 'Plant tour for buyer', 'Showed manufacturing facility', NOW() - INTERVAL '14 days', 240, 19, 10, 29, true, 2, NOW() - INTERVAL '14 days', NOW()),
  -- Opp 17: customer_org 32 -> contacts 64, 65
  (88, 'interaction', 'site_visit', 'Kitchen installation review', 'Reviewed equipment setup', NOW() - INTERVAL '19 days', 90, 64, 32, 17, false, 3, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (89, 'interaction', 'site_visit', 'Multi-unit assessment', 'Visited several locations', NOW() - INTERVAL '24 days', 300, 72, 36, 11, true, 4, NOW() - INTERVAL '24 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (90, 'interaction', 'site_visit', 'Quality audit visit', 'Conducted quality review', NOW() - INTERVAL '29 days', 150, 62, 31, 8, false, 2, NOW() - INTERVAL '29 days', NOW()),
  -- Opp 10: customer_org 25 -> contacts 49, 50
  (91, 'interaction', 'site_visit', 'New location opening', 'Supported new store opening', NOW() - INTERVAL '34 days', 180, 49, 25, 10, true, 3, NOW() - INTERVAL '34 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (92, 'interaction', 'site_visit', 'Commissary visit', 'Toured central kitchen', NOW() - INTERVAL '39 days', 120, 57, 29, 9, false, 3, NOW() - INTERVAL '39 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (93, 'interaction', 'site_visit', 'Executive site tour', 'Hosted leadership visit', NOW() - INTERVAL '44 days', 180, 38, 19, 34, true, 5, NOW() - INTERVAL '44 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (94, 'interaction', 'site_visit', 'Training facility visit', 'Conducted on-site training', NOW() - INTERVAL '49 days', 240, 68, 34, 19, false, 5, NOW() - INTERVAL '49 days', NOW()),
  -- Opp 21: customer_org 30 -> contacts 59, 60, 61
  (95, 'interaction', 'site_visit', 'Banquet kitchen visit', 'Assessed banquet operations', NOW() - INTERVAL '54 days', 120, 60, 30, 21, true, 6, NOW() - INTERVAL '54 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (96, 'interaction', 'site_visit', 'Regional office visit', 'Met at regional headquarters', NOW() - INTERVAL '59 days', 90, 23, 12, 35, false, 5, NOW() - INTERVAL '59 days', NOW()),

  -- ========================================
  -- CONTRACT_REVIEW Activities (12)
  -- ========================================
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (97, 'interaction', 'contract_review', 'Initial contract review', 'Reviewed initial terms', NOW() - INTERVAL '5 days', 60, 42, 21, 28, true, 6, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (98, 'interaction', 'contract_review', 'Pricing terms discussion', 'Negotiated pricing section', NOW() - INTERVAL '10 days', 45, 45, 23, 22, false, 2, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 20: customer_org 27 -> contacts 53, 54
  (99, 'interaction', 'contract_review', 'Legal review meeting', 'Discussed legal concerns', NOW() - INTERVAL '15 days', 90, 54, 27, 20, true, 5, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 23: customer_org 29 -> contacts 57, 58
  (100, 'interaction', 'contract_review', 'Renewal terms review', 'Reviewed renewal conditions', NOW() - INTERVAL '20 days', 60, 58, 29, 23, false, 3, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 24: customer_org 39 -> contacts 78, 79, 80
  (101, 'interaction', 'contract_review', 'Volume commitment review', 'Discussed volume requirements', NOW() - INTERVAL '25 days', 45, 79, 39, 24, true, 3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 22: customer_org 23 -> contacts 45, 46
  (102, 'interaction', 'contract_review', 'Payment terms negotiation', 'Negotiated payment schedule', NOW() - INTERVAL '30 days', 60, 46, 23, 22, false, 2, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (103, 'interaction', 'contract_review', 'Distribution agreement review', 'Reviewed distributor terms', NOW() - INTERVAL '35 days', 75, 26, 13, 31, true, 3, NOW() - INTERVAL '35 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (104, 'interaction', 'contract_review', 'Service level review', 'Discussed SLA terms', NOW() - INTERVAL '40 days', 45, 30, 15, 36, false, 6, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (105, 'interaction', 'contract_review', 'Exclusivity terms review', 'Discussed exclusive arrangement', NOW() - INTERVAL '45 days', 60, 23, 12, 35, true, 5, NOW() - INTERVAL '45 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (106, 'interaction', 'contract_review', 'Final contract review', 'Final review before signing', NOW() - INTERVAL '50 days', 90, 20, 10, 29, false, 2, NOW() - INTERVAL '50 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (107, 'interaction', 'contract_review', 'Amendment review', 'Reviewed contract changes', NOW() - INTERVAL '55 days', 45, 22, 11, 30, true, 3, NOW() - INTERVAL '55 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (108, 'interaction', 'contract_review', 'Term extension review', 'Discussed term extension', NOW() - INTERVAL '60 days', 60, 24, 12, 35, false, 5, NOW() - INTERVAL '60 days', NOW()),

  -- ========================================
  -- CHECK_IN Activities (12)
  -- ========================================
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (109, 'interaction', 'check_in', 'Monthly account check-in', 'Regular monthly touchpoint', NOW() - INTERVAL '2 days', 20, 48, 24, 15, false, 4, NOW() - INTERVAL '2 days', NOW()),
  -- Opp 14: customer_org 26 -> contacts 51, 52
  (110, 'interaction', 'check_in', 'Relationship maintenance call', 'Nurturing key relationship', NOW() - INTERVAL '7 days', 25, 52, 26, 14, true, 5, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (111, 'interaction', 'check_in', 'Quarterly business check-in', 'Quarterly account review', NOW() - INTERVAL '12 days', 30, 67, 33, 7, false, 6, NOW() - INTERVAL '12 days', NOW()),
  -- Opp 19: customer_org 34 -> contacts 68, 69
  (112, 'interaction', 'check_in', 'New contact introduction', 'Introduction to new team member', NOW() - INTERVAL '17 days', 20, 69, 34, 19, true, 4, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 16: customer_org 35 -> contacts 70, 71
  (113, 'interaction', 'check_in', 'Holiday greeting call', 'Season greetings touchpoint', NOW() - INTERVAL '22 days', 15, 71, 35, 16, false, 3, NOW() - INTERVAL '22 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (114, 'interaction', 'check_in', 'Account health check', 'Verified account satisfaction', NOW() - INTERVAL '27 days', 25, 73, 36, 11, true, 4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 18: customer_org 37 -> contacts 74, 75
  (115, 'interaction', 'check_in', 'Post-order check-in', 'Followed up after delivery', NOW() - INTERVAL '32 days', 15, 75, 37, 18, false, 6, NOW() - INTERVAL '32 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (116, 'interaction', 'check_in', 'Year-end review call', 'Annual relationship review', NOW() - INTERVAL '37 days', 30, 77, 38, 4, true, 4, NOW() - INTERVAL '37 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (117, 'interaction', 'check_in', 'New year planning call', 'Discussed upcoming year plans', NOW() - INTERVAL '42 days', 25, 80, 39, 12, false, 2, NOW() - INTERVAL '42 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (118, 'interaction', 'check_in', 'Summer season check-in', 'Seasonal planning discussion', NOW() - INTERVAL '47 days', 20, 56, 28, 13, true, 6, NOW() - INTERVAL '47 days', NOW()),
  -- Opp 43: customer_org 33 -> contacts 66, 67
  (119, 'interaction', 'check_in', 'Executive relationship check', 'Executive level touchpoint', NOW() - INTERVAL '52 days', 30, 66, 33, 43, false, 6, NOW() - INTERVAL '52 days', NOW()),
  -- Opp 43: customer_org 33 -> contacts 66, 67
  (120, 'interaction', 'check_in', 'Operations alignment check', 'Verified operational alignment', NOW() - INTERVAL '57 days', 25, 67, 33, 43, true, 6, NOW() - INTERVAL '57 days', NOW()),

  -- ========================================
  -- SOCIAL Activities (12)
  -- ========================================
  -- Opp 1: customer_org 20 -> contacts 39, 40
  (121, 'interaction', 'social', 'Industry dinner event', 'Networking dinner with contacts', NOW() - INTERVAL '10 days', 180, 39, 20, 1, false, 2, NOW() - INTERVAL '10 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (122, 'interaction', 'social', 'Golf outing', 'Client appreciation golf', NOW() - INTERVAL '20 days', 300, 19, 10, 29, true, 2, NOW() - INTERVAL '20 days', NOW()),
  -- Opp 5: customer_org 22 -> contacts 43, 44
  (123, 'interaction', 'social', 'Wine dinner event', 'Hosted wine pairing dinner', NOW() - INTERVAL '30 days', 180, 43, 22, 5, false, 4, NOW() - INTERVAL '30 days', NOW()),
  -- Opp 12: customer_org 39 -> contacts 78, 79, 80
  (124, 'interaction', 'social', 'Sporting event tickets', 'Hosted at baseball game', NOW() - INTERVAL '40 days', 240, 78, 39, 12, true, 4, NOW() - INTERVAL '40 days', NOW()),
  -- Opp 3: customer_org 30 -> contacts 59, 60, 61
  (125, 'interaction', 'social', 'Charity event', 'Connected at charity fundraiser', NOW() - INTERVAL '50 days', 180, 59, 30, 3, false, 3, NOW() - INTERVAL '50 days', NOW()),
  -- Opp 13: customer_org 28 -> contacts 55, 56
  (126, 'interaction', 'social', 'Industry awards dinner', 'Attended awards ceremony together', NOW() - INTERVAL '60 days', 240, 55, 28, 13, true, 6, NOW() - INTERVAL '60 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (127, 'interaction', 'social', 'Coffee meeting', 'Informal catch-up coffee', NOW() - INTERVAL '70 days', 60, 66, 33, 7, false, 6, NOW() - INTERVAL '70 days', NOW()),
  -- Opp 11: customer_org 36 -> contacts 72, 73
  (128, 'interaction', 'social', 'Happy hour networking', 'After-work networking event', NOW() - INTERVAL '80 days', 120, 72, 36, 11, true, 4, NOW() - INTERVAL '80 days', NOW()),
  -- Opp 15: customer_org 24 -> contacts 47, 48
  (129, 'interaction', 'social', 'Holiday party', 'Annual holiday celebration', NOW() - INTERVAL '90 days', 180, 47, 24, 15, false, 2, NOW() - INTERVAL '90 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (130, 'interaction', 'social', 'Client appreciation lunch', 'Thank you lunch for key buyer', NOW() - INTERVAL '100 days', 90, 21, 11, 30, true, 3, NOW() - INTERVAL '100 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (131, 'interaction', 'social', 'Industry mixer', 'Networking at industry event', NOW() - INTERVAL '110 days', 120, 25, 13, 31, false, 3, NOW() - INTERVAL '110 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (132, 'interaction', 'social', 'New Year celebration', 'Rang in New Year with client', NOW() - INTERVAL '120 days', 180, 35, 18, 33, true, 4, NOW() - INTERVAL '120 days', NOW()),

  -- ========================================
  -- NOTE Activities (18 - general notes)
  -- ========================================
  -- Opp 25: customer_org 20 -> contacts 39, 40
  (133, 'interaction', 'note', 'Competitive intelligence', 'Learned competitor is offering lower prices', NOW() - INTERVAL '1 day', 5, 40, 20, 25, false, 4, NOW() - INTERVAL '1 day', NOW()),
  -- Opp 26: customer_org 22 -> contacts 43, 44
  (134, 'interaction', 'note', 'Menu change planned', 'Chef mentioned upcoming menu revamp', NOW() - INTERVAL '3 days', 5, 44, 22, 26, true, 4, NOW() - INTERVAL '3 days', NOW()),
  -- Opp 27: customer_org 25 -> contacts 49, 50
  (135, 'interaction', 'note', 'Budget cycle timing', 'Budget decisions made in Q3', NOW() - INTERVAL '5 days', 5, 50, 25, 27, false, 5, NOW() - INTERVAL '5 days', NOW()),
  -- Opp 28: customer_org 21 -> contacts 41, 42
  (136, 'interaction', 'note', 'Key stakeholder identified', 'CFO has final approval authority', NOW() - INTERVAL '7 days', 5, 42, 21, 28, true, 6, NOW() - INTERVAL '7 days', NOW()),
  -- Opp 29: customer_org 10 -> contacts 19, 20
  (137, 'interaction', 'note', 'Expansion plans shared', 'Opening 5 new locations next year', NOW() - INTERVAL '9 days', 5, 19, 10, 29, false, 2, NOW() - INTERVAL '9 days', NOW()),
  -- Opp 30: customer_org 11 -> contacts 21, 22
  (138, 'interaction', 'note', 'Pain point identified', 'Current supplier has quality issues', NOW() - INTERVAL '11 days', 5, 21, 11, 30, true, 3, NOW() - INTERVAL '11 days', NOW()),
  -- Opp 31: customer_org 13 -> contacts 25, 26
  (139, 'interaction', 'note', 'Timeline update', 'Decision pushed to next quarter', NOW() - INTERVAL '13 days', 5, 25, 13, 31, false, 3, NOW() - INTERVAL '13 days', NOW()),
  -- Opp 32: customer_org 31 -> contacts 62, 63
  (140, 'interaction', 'note', 'Contact leaving', 'Key contact taking new job', NOW() - INTERVAL '15 days', 5, 63, 31, 32, true, 4, NOW() - INTERVAL '15 days', NOW()),
  -- Opp 33: customer_org 18 -> contacts 35, 36
  (141, 'interaction', 'note', 'Vendor consolidation', 'Looking to reduce vendor count', NOW() - INTERVAL '17 days', 5, 35, 18, 33, false, 4, NOW() - INTERVAL '17 days', NOW()),
  -- Opp 34: customer_org 19 -> contacts 37, 38
  (142, 'interaction', 'note', 'Sustainability focus', 'Increasing focus on sustainability', NOW() - INTERVAL '19 days', 5, 38, 19, 34, true, 5, NOW() - INTERVAL '19 days', NOW()),
  -- Opp 35: customer_org 12 -> contacts 23, 24
  (143, 'interaction', 'note', 'Regional preference', 'Prefers local/regional suppliers', NOW() - INTERVAL '21 days', 5, 23, 12, 35, false, 5, NOW() - INTERVAL '21 days', NOW()),
  -- Opp 36: customer_org 15 -> contacts 29, 30
  (144, 'interaction', 'note', 'Pricing sensitivity', 'Very price sensitive account', NOW() - INTERVAL '23 days', 5, 29, 15, 36, true, 6, NOW() - INTERVAL '23 days', NOW()),
  -- Opp 2: customer_org 27 -> contacts 53, 54
  (145, 'interaction', 'note', 'Quality over price', 'Willing to pay premium for quality', NOW() - INTERVAL '25 days', 5, 53, 27, 2, false, 3, NOW() - INTERVAL '25 days', NOW()),
  -- Opp 4: customer_org 38 -> contacts 76, 77
  (146, 'interaction', 'note', 'Contract renewal timing', 'Contract up for renewal in June', NOW() - INTERVAL '27 days', 5, 76, 38, 4, true, 4, NOW() - INTERVAL '27 days', NOW()),
  -- Opp 6: customer_org 21 -> contacts 41, 42
  (147, 'interaction', 'note', 'Decision maker identified', 'VP Operations makes final call', NOW() - INTERVAL '29 days', 5, 41, 21, 6, false, 5, NOW() - INTERVAL '29 days', NOW()),
  -- Opp 7: customer_org 33 -> contacts 66, 67
  (148, 'interaction', 'note', 'Competitor weakness', 'Competitor having supply issues', NOW() - INTERVAL '31 days', 5, 66, 33, 7, true, 6, NOW() - INTERVAL '31 days', NOW()),
  -- Opp 8: customer_org 31 -> contacts 62, 63
  (149, 'interaction', 'note', 'Budget approved', 'Got budget approval for new vendor', NOW() - INTERVAL '33 days', 5, 62, 31, 8, false, 2, NOW() - INTERVAL '33 days', NOW()),
  -- Opp 9: customer_org 29 -> contacts 57, 58
  (150, 'interaction', 'note', 'Trial feedback positive', 'Pilot program getting great reviews', NOW() - INTERVAL '35 days', 5, 57, 29, 9, true, 3, NOW() - INTERVAL '35 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('activities', 'id'), 150, true);
