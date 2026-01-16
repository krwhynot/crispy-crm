-- ============================================================================
-- PART 15: E2E TESTING FLOWS
-- ============================================================================
-- Comprehensive E2E testing seed data with complete opportunity flows
-- Covers: Happy Path, Lost Deals, Sample Workflow, Stalled/In-Progress
--
-- ID Ranges (to avoid conflicts with existing seed data):
--   Customer Organizations: 100-107
--   Contacts: 200-211
--   Opportunities: 100-113
--   Activities: 200-260
--   Tasks: 100-120
--
-- Owner: Admin user (admin@test.com, sales_id = 1)
-- Naming convention: "E2E - [Flow Type] - [Description]"
-- ============================================================================

-- ============================================================================
-- SECTION 1: E2E CUSTOMER ORGANIZATIONS (IDs 100-107)
-- ============================================================================
-- Each E2E flow gets a dedicated customer to avoid interference

INSERT INTO "public"."organizations" (
  id, name, organization_type, segment_id, phone, email, website,
  address, city, state, postal_code, sales_id,
  notes, created_at, updated_at
)
VALUES
  -- Happy Path Customers (2)
  (100, 'E2E Happy Path Restaurant A', 'customer', '22222222-2222-4222-8222-000000000006',
   '555-100-0001', 'purchasing@e2e-happypath-a.test', 'https://e2e-happypath-a.test',
   '100 Test Boulevard', 'Chicago', 'IL', '60601', 1,
   'E2E Testing: Full happy path flow from new_lead to closed_won (90 day cycle)',
   NOW() - INTERVAL '95 days', NOW()),

  (101, 'E2E Happy Path Restaurant B', 'customer', '22222222-2222-4222-8222-000000000006',
   '555-101-0001', 'chef@e2e-happypath-b.test', 'https://e2e-happypath-b.test',
   '101 Quick Close Lane', 'Dallas', 'TX', '75201', 1,
   'E2E Testing: Fast close path (7 day cycle) for velocity metrics testing',
   NOW() - INTERVAL '10 days', NOW()),

  -- Lost Deal Customers (2)
  (102, 'E2E Lost Deal Corp A', 'customer', '22222222-2222-4222-8222-000000000007',
   '555-102-0001', 'procurement@e2e-lost-a.test', 'https://e2e-lost-a.test',
   '102 Budget Cut Drive', 'Houston', 'TX', '77001', 1,
   'E2E Testing: Lost to price_too_high at feedback_logged stage',
   NOW() - INTERVAL '60 days', NOW()),

  (103, 'E2E Lost Deal Corp B', 'customer', '22222222-2222-4222-8222-000000000007',
   '555-103-0001', 'director@e2e-lost-b.test', 'https://e2e-lost-b.test',
   '103 No Auth Street', 'Phoenix', 'AZ', '85001', 1,
   'E2E Testing: Lost to no_authorization at demo_scheduled stage',
   NOW() - INTERVAL '45 days', NOW()),

  -- Sample Workflow Customers (2)
  (104, 'E2E Sample Flow Restaurant A', 'customer', '22222222-2222-4222-8222-000000000006',
   '555-104-0001', 'kitchen@e2e-sample-a.test', 'https://e2e-sample-a.test',
   '104 Sample Testing Road', 'Seattle', 'WA', '98101', 1,
   'E2E Testing: Full sample workflow with all 4 states (sent/received/feedback_pending/feedback_received)',
   NOW() - INTERVAL '30 days', NOW()),

  (105, 'E2E Sample Flow Restaurant B', 'customer', '22222222-2222-4222-8222-000000000006',
   '555-105-0001', 'chef@e2e-sample-b.test', 'https://e2e-sample-b.test',
   '105 Feedback Pending Lane', 'Portland', 'OR', '97201', 1,
   'E2E Testing: Sample stuck in feedback_pending with overdue follow-up',
   NOW() - INTERVAL '25 days', NOW()),

  -- Stalled/In-Progress Customers (2)
  (106, 'E2E Stalled Account Corp', 'customer', '22222222-2222-4222-8222-000000000008',
   '555-106-0001', 'slowpoke@e2e-stalled.test', 'https://e2e-stalled.test',
   '106 Stagnant Boulevard', 'Denver', 'CO', '80201', 1,
   'E2E Testing: Stalled opportunity with 45+ days no activity',
   NOW() - INTERVAL '90 days', NOW()),

  (107, 'E2E Overdue Tasks Hotel', 'customer', '22222222-2222-4222-8222-000000000008',
   '555-107-0001', 'behindschedule@e2e-overdue.test', 'https://e2e-overdue.test',
   '107 Deadline Missed Avenue', 'Miami', 'FL', '33101', 1,
   'E2E Testing: Active opportunity with multiple overdue tasks',
   NOW() - INTERVAL '40 days', NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('organizations', 'id'), GREATEST(107, (SELECT MAX(id) FROM organizations)), true);


-- ============================================================================
-- SECTION 2: E2E CONTACTS (IDs 200-211)
-- ============================================================================
-- 1-2 contacts per E2E organization with varied roles

INSERT INTO "public"."contacts" (
  id, name, first_name, last_name, email, phone, title, department,
  organization_id, sales_id, created_at, updated_at
)
VALUES
  -- Happy Path A (Org 100) - Decision Maker + Chef
  (200, 'Patricia Decision', 'Patricia', 'Decision',
   '[{"email": "patricia@e2e-happypath-a.test", "type": "Work"}]',
   '[{"phone": "555-200-0001", "type": "Work"}]',
   'VP Purchasing', 'Operations', 100, 1, NOW() - INTERVAL '95 days', NOW()),
  (201, 'Chef Gordon TestKitchen', 'Gordon', 'TestKitchen',
   '[{"email": "chef.gordon@e2e-happypath-a.test", "type": "Work"}]',
   '[{"phone": "555-201-0001", "type": "Work"}]',
   'Executive Chef', 'Culinary', 100, 1, NOW() - INTERVAL '95 days', NOW()),

  -- Happy Path B (Org 101) - Quick decision maker
  (202, 'Quick Decider', 'Quick', 'Decider',
   '[{"email": "quick@e2e-happypath-b.test", "type": "Work"}]',
   '[{"phone": "555-202-0001", "type": "Work"}]',
   'Owner', 'Executive', 101, 1, NOW() - INTERVAL '10 days', NOW()),

  -- Lost Deal A (Org 102) - Budget conscious buyer
  (203, 'Budget Watcher', 'Budget', 'Watcher',
   '[{"email": "budget@e2e-lost-a.test", "type": "Work"}]',
   '[{"phone": "555-203-0001", "type": "Work"}]',
   'Procurement Manager', 'Purchasing', 102, 1, NOW() - INTERVAL '60 days', NOW()),

  -- Lost Deal B (Org 103) - No auth contact
  (204, 'Auth Blocker', 'Auth', 'Blocker',
   '[{"email": "auth@e2e-lost-b.test", "type": "Work"}]',
   '[{"phone": "555-204-0001", "type": "Work"}]',
   'Regional Director', 'Operations', 103, 1, NOW() - INTERVAL '45 days', NOW()),

  -- Sample Flow A (Org 104) - Full sample tester
  (205, 'Sample Tester', 'Sample', 'Tester',
   '[{"email": "sample@e2e-sample-a.test", "type": "Work"}]',
   '[{"phone": "555-205-0001", "type": "Work"}]',
   'R&D Chef', 'Culinary', 104, 1, NOW() - INTERVAL '30 days', NOW()),
  (206, 'Feedback Giver', 'Feedback', 'Giver',
   '[{"email": "feedback@e2e-sample-a.test", "type": "Work"}]',
   '[{"phone": "555-206-0001", "type": "Work"}]',
   'Quality Manager', 'Quality', 104, 1, NOW() - INTERVAL '30 days', NOW()),

  -- Sample Flow B (Org 105) - Stuck sample contact
  (207, 'Pending Feedback', 'Pending', 'Feedback',
   '[{"email": "pending@e2e-sample-b.test", "type": "Work"}]',
   '[{"phone": "555-207-0001", "type": "Work"}]',
   'Head Chef', 'Culinary', 105, 1, NOW() - INTERVAL '25 days', NOW()),

  -- Stalled (Org 106) - Unresponsive contact
  (208, 'No Response', 'No', 'Response',
   '[{"email": "ghost@e2e-stalled.test", "type": "Work"}]',
   '[{"phone": "555-208-0001", "type": "Work"}]',
   'Purchasing Director', 'Operations', 106, 1, NOW() - INTERVAL '90 days', NOW()),

  -- Overdue Tasks (Org 107) - Active but behind
  (209, 'Behind Schedule', 'Behind', 'Schedule',
   '[{"email": "behind@e2e-overdue.test", "type": "Work"}]',
   '[{"phone": "555-209-0001", "type": "Work"}]',
   'F&B Director', 'Food & Beverage', 107, 1, NOW() - INTERVAL '40 days', NOW()),
  (210, 'Task Owner', 'Task', 'Owner',
   '[{"email": "tasks@e2e-overdue.test", "type": "Work"}]',
   '[{"phone": "555-210-0001", "type": "Work"}]',
   'Sous Chef', 'Culinary', 107, 1, NOW() - INTERVAL '40 days', NOW()),

  -- Extra contact for additional lost deal scenarios
  (211, 'Competitor Loyalist', 'Competitor', 'Loyalist',
   '[{"email": "loyal@e2e-lost-a.test", "type": "Work"}]',
   '[{"phone": "555-211-0001", "type": "Work"}]',
   'Executive Chef', 'Culinary', 102, 1, NOW() - INTERVAL '60 days', NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('contacts', 'id'), GREATEST(211, (SELECT MAX(id) FROM contacts)), true);


-- ============================================================================
-- SECTION 3: E2E OPPORTUNITIES (IDs 100-113)
-- ============================================================================
-- Complete flows through all stages with appropriate win/loss reasons

INSERT INTO "public"."opportunities" (
  id, name, principal_organization_id, customer_organization_id,
  distributor_organization_id, opportunity_owner_id,
  stage, contact_ids, estimated_close_date, description,
  win_reason, loss_reason, close_reason_notes,
  created_at, updated_at
)
VALUES
  -- ========================================
  -- HAPPY PATH: Full Cycle Won (ID 100)
  -- ========================================
  -- 90-day journey through all stages to closed_won
  (100, 'E2E - Happy Path - McCRUM Full Cycle', 1, 100, 10, 1,
   'closed_won', ARRAY[200, 201]::bigint[], CURRENT_DATE - INTERVAL '5 days',
   'E2E Test: Complete 90-day sales cycle through all stages. Won on strong relationship.',
   'relationship', NULL, 'Great partnership built over consistent engagement. Chef loved product quality.',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '5 days'),

  -- ========================================
  -- HAPPY PATH: Fast Close (ID 101)
  -- ========================================
  -- 7-day quick win for velocity testing
  (101, 'E2E - Happy Path - SWAP Fast Close', 2, 101, 11, 1,
   'closed_won', ARRAY[202]::bigint[], CURRENT_DATE - INTERVAL '3 days',
   'E2E Test: 7-day fast close. Owner made quick decision. Tests velocity metrics.',
   'timing', NULL, 'Owner needed immediate solution. Perfect timing with menu launch.',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),

  -- ========================================
  -- LOST DEAL: Price Too High (ID 102)
  -- ========================================
  (102, 'E2E - Lost Deal - Frico Price Sensitivity', 5, 102, 18, 1,
   'closed_lost', ARRAY[203, 211]::bigint[], CURRENT_DATE - INTERVAL '20 days',
   'E2E Test: Lost at feedback_logged stage due to price concerns.',
   NULL, 'price_too_high', 'Budget cuts forced them to go with cheaper domestic alternative. 15% price gap.',
   NOW() - INTERVAL '55 days', NOW() - INTERVAL '20 days'),

  -- ========================================
  -- LOST DEAL: No Authorization (ID 103)
  -- ========================================
  (103, 'E2E - Lost Deal - Anchor No Auth', 6, 103, 10, 1,
   'closed_lost', ARRAY[204]::bigint[], CURRENT_DATE - INTERVAL '15 days',
   'E2E Test: Lost at demo_scheduled due to distributor authorization requirements.',
   NULL, 'no_authorization', 'Regional director loved product but corporate requires approved vendor list.',
   NOW() - INTERVAL '40 days', NOW() - INTERVAL '15 days'),

  -- ========================================
  -- LOST DEAL: Competitor Relationship (ID 104)
  -- ========================================
  (104, 'E2E - Lost Deal - Rapid Rasoi Competitor', 3, 102, 12, 1,
   'closed_lost', ARRAY[203]::bigint[], CURRENT_DATE - INTERVAL '25 days',
   'E2E Test: Lost to existing competitor relationship.',
   NULL, 'competitor_relationship', 'Long-standing relationship with competitor. Decided to stay loyal.',
   NOW() - INTERVAL '50 days', NOW() - INTERVAL '25 days'),

  -- ========================================
  -- LOST DEAL: No Response (ID 105)
  -- ========================================
  (105, 'E2E - Lost Deal - Lakeview No Response', 4, 103, 13, 1,
   'closed_lost', ARRAY[204]::bigint[], CURRENT_DATE - INTERVAL '10 days',
   'E2E Test: Lost at initial_outreach due to no response after multiple attempts.',
   NULL, 'no_response', 'Multiple emails and calls went unanswered. Contact may have left company.',
   NOW() - INTERVAL '35 days', NOW() - INTERVAL '10 days'),

  -- ========================================
  -- SAMPLE WORKFLOW: Sent State (ID 106)
  -- ========================================
  (106, 'E2E - Sample Flow - Sent State', 1, 104, 10, 1,
   'sample_visit_offered', ARRAY[205]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'E2E Test: Sample just sent, awaiting delivery confirmation.',
   NULL, NULL, NULL,
   NOW() - INTERVAL '5 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Received State (ID 107)
  -- ========================================
  (107, 'E2E - Sample Flow - Received State', 2, 104, 11, 1,
   'sample_visit_offered', ARRAY[205, 206]::bigint[], CURRENT_DATE + INTERVAL '25 days',
   'E2E Test: Sample received, chef testing in kitchen.',
   NULL, NULL, NULL,
   NOW() - INTERVAL '10 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Feedback Pending OVERDUE (ID 108)
  -- ========================================
  (108, 'E2E - Sample Flow - Feedback Pending OVERDUE', 3, 105, 12, 1,
   'sample_visit_offered', ARRAY[207]::bigint[], CURRENT_DATE + INTERVAL '20 days',
   'E2E Test: Sample feedback overdue by 2 days. Follow-up required.',
   NULL, NULL, NULL,
   NOW() - INTERVAL '15 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Feedback Received (ID 109)
  -- ========================================
  (109, 'E2E - Sample Flow - Feedback Received', 4, 104, 13, 1,
   'feedback_logged', ARRAY[205, 206]::bigint[], CURRENT_DATE + INTERVAL '15 days',
   'E2E Test: Sample feedback received, positive. Ready for next stage.',
   NULL, NULL, NULL,
   NOW() - INTERVAL '20 days', NOW()),

  -- ========================================
  -- STALLED: 45+ Days No Activity (ID 110)
  -- ========================================
  (110, 'E2E - Stalled - No Activity 45 Days', 5, 106, 18, 1,
   'sample_visit_offered', ARRAY[208]::bigint[], CURRENT_DATE + INTERVAL '60 days',
   'E2E Test: STALE opportunity - no activity in 45+ days. Should trigger staleness alerts.',
   NULL, NULL, NULL,
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '47 days'),

  -- ========================================
  -- STALLED: Overdue Tasks (ID 111)
  -- ========================================
  (111, 'E2E - Stalled - Multiple Overdue Tasks', 6, 107, 10, 1,
   'feedback_logged', ARRAY[209, 210]::bigint[], CURRENT_DATE + INTERVAL '30 days',
   'E2E Test: Active opportunity but behind schedule with 3 overdue tasks.',
   NULL, NULL, NULL,
   NOW() - INTERVAL '35 days', NOW()),

  -- ========================================
  -- STALLED: Ancient Deal (ID 112)
  -- ========================================
  (112, 'E2E - Stalled - Ancient New Lead', 7, 106, 17, 1,
   'new_lead', ARRAY[208]::bigint[], CURRENT_DATE + INTERVAL '90 days',
   'E2E Test: Created 6 months ago, still in new_lead. Tests long-running deal handling.',
   NULL, NULL, NULL,
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '30 days'),

  -- ========================================
  -- STALLED: On-Hold Status (ID 113)
  -- ========================================
  (113, 'E2E - Stalled - On Hold', 8, 107, 13, 1,
   'demo_scheduled', ARRAY[209]::bigint[], CURRENT_DATE + INTERVAL '45 days',
   'E2E Test: On-hold status for testing non-active status filtering.',
   NULL, NULL, NULL,
   NOW() - INTERVAL '30 days', NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('opportunities', 'id'), GREATEST(113, (SELECT MAX(id) FROM opportunities)), true);


-- ============================================================================
-- SECTION 4: E2E ACTIVITIES (IDs 200-260)
-- ============================================================================
-- Complete activity chains for each flow

INSERT INTO "public"."activities" (
  id, activity_type, type, subject, description, activity_date,
  duration_minutes, contact_id, organization_id, opportunity_id,
  follow_up_required, sample_status, follow_up_date,
  created_by, created_at, updated_at
)
VALUES
  -- ========================================
  -- HAPPY PATH A: Full 90-day journey (Opp 100)
  -- ========================================
  -- Day 1: Initial discovery
  (200, 'interaction', 'call', 'E2E: Initial discovery call',
   'Discussed current supplier situation. Identified pain points with quality consistency.',
   NOW() - INTERVAL '88 days', 30, 200, 100, 100, true, NULL, NULL,
   1, NOW() - INTERVAL '88 days', NOW()),

  -- Day 5: Follow-up email
  (201, 'interaction', 'email', 'E2E: Product catalog sent',
   'Sent comprehensive product catalog and pricing overview.',
   NOW() - INTERVAL '85 days', 10, 200, 100, 100, false, NULL, NULL,
   1, NOW() - INTERVAL '85 days', NOW()),

  -- Day 14: Meeting scheduled
  (202, 'interaction', 'meeting', 'E2E: Kitchen demo scheduled',
   'Scheduled on-site kitchen demo with executive chef.',
   NOW() - INTERVAL '76 days', 45, 201, 100, 100, true, NULL, NULL,
   1, NOW() - INTERVAL '76 days', NOW()),

  -- Day 21: Sample sent
  (203, 'interaction', 'sample', 'E2E: Sample products sent',
   'Shipped sample pack: Premium fries, hash browns, wedges.',
   NOW() - INTERVAL '69 days', 20, 201, 100, 100, true, 'sent', NOW() - INTERVAL '66 days',
   1, NOW() - INTERVAL '69 days', NOW()),

  -- Day 25: Sample received
  (204, 'interaction', 'sample', 'E2E: Sample received confirmation',
   'Chef confirmed receipt. Beginning kitchen testing this week.',
   NOW() - INTERVAL '65 days', 15, 201, 100, 100, true, 'received', NOW() - INTERVAL '60 days',
   1, NOW() - INTERVAL '65 days', NOW()),

  -- Day 35: Feedback call
  (205, 'interaction', 'call', 'E2E: Sample feedback discussion',
   'Chef extremely positive on quality. Fries performed better than current supplier.',
   NOW() - INTERVAL '55 days', 45, 201, 100, 100, false, 'feedback_received', NULL,
   1, NOW() - INTERVAL '55 days', NOW()),

  -- Day 42: Demo scheduled
  (206, 'interaction', 'demo', 'E2E: Full kitchen demo',
   'Demonstrated complete product line. VP Purchasing attended.',
   NOW() - INTERVAL '48 days', 120, 200, 100, 100, true, NULL, NULL,
   1, NOW() - INTERVAL '48 days', NOW()),

  -- Day 50: Proposal sent
  (207, 'interaction', 'proposal', 'E2E: Formal pricing proposal',
   'Submitted formal proposal with volume pricing tiers.',
   NOW() - INTERVAL '40 days', 30, 200, 100, 100, true, NULL, NULL,
   1, NOW() - INTERVAL '40 days', NOW()),

  -- Day 60: Contract review
  (208, 'interaction', 'contract_review', 'E2E: Contract terms discussion',
   'Reviewed contract terms with legal. Minor redlines on payment terms.',
   NOW() - INTERVAL '30 days', 60, 200, 100, 100, true, NULL, NULL,
   1, NOW() - INTERVAL '30 days', NOW()),

  -- Day 75: Follow-up
  (209, 'interaction', 'follow_up', 'E2E: Final approval follow-up',
   'Confirmed internal approval received. Ready for signature.',
   NOW() - INTERVAL '15 days', 20, 200, 100, 100, false, NULL, NULL,
   1, NOW() - INTERVAL '15 days', NOW()),

  -- Day 85: Won
  (210, 'interaction', 'note', 'E2E: Deal closed - Contract signed!',
   'Contract signed. 3-year agreement. First order shipping next week.',
   NOW() - INTERVAL '5 days', 10, 200, 100, 100, false, NULL, NULL,
   1, NOW() - INTERVAL '5 days', NOW()),

  -- ========================================
  -- HAPPY PATH B: Fast 7-day close (Opp 101)
  -- ========================================
  (211, 'interaction', 'call', 'E2E: Quick intro call',
   'Owner reached out directly. Urgent need for menu launch.',
   NOW() - INTERVAL '10 days', 20, 202, 101, 101, true, NULL, NULL,
   1, NOW() - INTERVAL '10 days', NOW()),

  (212, 'interaction', 'demo', 'E2E: Same-day product demo',
   'Rush demo at their location. Owner made decision on the spot.',
   NOW() - INTERVAL '8 days', 60, 202, 101, 101, true, NULL, NULL,
   1, NOW() - INTERVAL '8 days', NOW()),

  (213, 'interaction', 'proposal', 'E2E: Express pricing',
   'Provided pricing same day. Owner approved immediately.',
   NOW() - INTERVAL '6 days', 15, 202, 101, 101, false, NULL, NULL,
   1, NOW() - INTERVAL '6 days', NOW()),

  (214, 'interaction', 'note', 'E2E: Fast close complete',
   '7-day close! Owner needed solution for grand opening next week.',
   NOW() - INTERVAL '3 days', 5, 202, 101, 101, false, NULL, NULL,
   1, NOW() - INTERVAL '3 days', NOW()),

  -- ========================================
  -- LOST DEAL: Price Too High (Opp 102)
  -- ========================================
  (215, 'interaction', 'call', 'E2E: Initial outreach',
   'Good initial conversation. Interest in premium products.',
   NOW() - INTERVAL '50 days', 25, 203, 102, 102, true, NULL, NULL,
   1, NOW() - INTERVAL '50 days', NOW()),

  (216, 'interaction', 'demo', 'E2E: Product demonstration',
   'Successful demo. Chef loved quality but buyer concerned about budget.',
   NOW() - INTERVAL '40 days', 90, 211, 102, 102, true, NULL, NULL,
   1, NOW() - INTERVAL '40 days', NOW()),

  (217, 'interaction', 'sample', 'E2E: Sample sent for testing',
   'Sent premium cheese samples for kitchen trials.',
   NOW() - INTERVAL '35 days', 15, 211, 102, 102, true, 'sent', NOW() - INTERVAL '30 days',
   1, NOW() - INTERVAL '35 days', NOW()),

  (218, 'interaction', 'sample', 'E2E: Sample feedback - positive but price concern',
   'Chef feedback excellent. Procurement flagged 15% price premium vs current supplier.',
   NOW() - INTERVAL '28 days', 30, 203, 102, 102, false, 'feedback_received', NULL,
   1, NOW() - INTERVAL '28 days', NOW()),

  (219, 'interaction', 'note', 'E2E: Lost - Price sensitivity',
   'Budget cuts forced cheaper alternative. Will revisit next fiscal year.',
   NOW() - INTERVAL '20 days', 10, 203, 102, 102, false, NULL, NULL,
   1, NOW() - INTERVAL '20 days', NOW()),

  -- ========================================
  -- LOST DEAL: No Authorization (Opp 103)
  -- ========================================
  (220, 'interaction', 'call', 'E2E: Strong initial interest',
   'Regional director excited about products.',
   NOW() - INTERVAL '38 days', 30, 204, 103, 103, true, NULL, NULL,
   1, NOW() - INTERVAL '38 days', NOW()),

  (221, 'interaction', 'demo', 'E2E: Demo scheduled with team',
   'Full team demo. Everyone impressed with quality.',
   NOW() - INTERVAL '30 days', 120, 204, 103, 103, true, NULL, NULL,
   1, NOW() - INTERVAL '30 days', NOW()),

  (222, 'interaction', 'proposal', 'E2E: Proposal submitted',
   'Submitted comprehensive proposal. Waiting on corporate approval.',
   NOW() - INTERVAL '22 days', 25, 204, 103, 103, true, NULL, NULL,
   1, NOW() - INTERVAL '22 days', NOW()),

  (223, 'interaction', 'note', 'E2E: Lost - Not on approved vendor list',
   'Corporate requires pre-approved vendors only. Would need 6-month approval process.',
   NOW() - INTERVAL '15 days', 10, 204, 103, 103, false, NULL, NULL,
   1, NOW() - INTERVAL '15 days', NOW()),

  -- ========================================
  -- LOST DEAL: Competitor Relationship (Opp 104)
  -- ========================================
  (224, 'interaction', 'call', 'E2E: Competitive situation',
   'Strong existing relationship with competitor.',
   NOW() - INTERVAL '45 days', 25, 203, 102, 104, true, NULL, NULL,
   1, NOW() - INTERVAL '45 days', NOW()),

  (225, 'interaction', 'note', 'E2E: Lost to competitor loyalty',
   'Decided to stay with 10-year supplier relationship.',
   NOW() - INTERVAL '25 days', 5, 203, 102, 104, false, NULL, NULL,
   1, NOW() - INTERVAL '25 days', NOW()),

  -- ========================================
  -- LOST DEAL: No Response (Opp 105)
  -- ========================================
  (226, 'interaction', 'email', 'E2E: Initial outreach email',
   'Sent introduction email with product overview.',
   NOW() - INTERVAL '32 days', 10, 204, 103, 105, true, NULL, NULL,
   1, NOW() - INTERVAL '32 days', NOW()),

  (227, 'interaction', 'call', 'E2E: Follow-up call attempt 1',
   'Left voicemail. No response.',
   NOW() - INTERVAL '28 days', 5, 204, 103, 105, true, NULL, NULL,
   1, NOW() - INTERVAL '28 days', NOW()),

  (228, 'interaction', 'email', 'E2E: Follow-up email 2',
   'Second email attempt. No response.',
   NOW() - INTERVAL '22 days', 5, 204, 103, 105, true, NULL, NULL,
   1, NOW() - INTERVAL '22 days', NOW()),

  (229, 'interaction', 'call', 'E2E: Final call attempt',
   'Third call attempt. Phone disconnected. Contact may have left.',
   NOW() - INTERVAL '15 days', 5, 204, 103, 105, false, NULL, NULL,
   1, NOW() - INTERVAL '15 days', NOW()),

  (230, 'interaction', 'note', 'E2E: Marking as lost - no response',
   'Multiple attempts with no response. Closing as lost.',
   NOW() - INTERVAL '10 days', 5, 204, 103, 105, false, NULL, NULL,
   1, NOW() - INTERVAL '10 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Sent State (Opp 106)
  -- ========================================
  (231, 'interaction', 'call', 'E2E: Pre-sample call',
   'Discussed sample requirements with R&D Chef.',
   NOW() - INTERVAL '5 days', 20, 205, 104, 106, true, NULL, NULL,
   1, NOW() - INTERVAL '5 days', NOW()),

  (232, 'interaction', 'sample', 'E2E: Sample shipped - SENT status',
   'Sample pack shipped via FedEx. Tracking: 1234567890. Expected arrival in 3 days.',
   NOW() - INTERVAL '2 days', 15, 205, 104, 106, true, 'sent', CURRENT_DATE + INTERVAL '3 days',
   1, NOW() - INTERVAL '2 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Received State (Opp 107)
  -- ========================================
  (233, 'interaction', 'sample', 'E2E: Sample shipped',
   'Sample pack shipped to kitchen.',
   NOW() - INTERVAL '8 days', 15, 205, 104, 107, true, 'sent', NOW() - INTERVAL '5 days',
   1, NOW() - INTERVAL '8 days', NOW()),

  (234, 'interaction', 'sample', 'E2E: Sample received - RECEIVED status',
   'Chef confirmed receipt. Beginning kitchen trials this week.',
   NOW() - INTERVAL '5 days', 10, 205, 104, 107, true, 'received', CURRENT_DATE + INTERVAL '5 days',
   1, NOW() - INTERVAL '5 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Feedback Pending OVERDUE (Opp 108)
  -- ========================================
  (235, 'interaction', 'sample', 'E2E: Sample shipped',
   'Sample shipped for testing.',
   NOW() - INTERVAL '12 days', 15, 207, 105, 108, true, 'sent', NOW() - INTERVAL '9 days',
   1, NOW() - INTERVAL '12 days', NOW()),

  (236, 'interaction', 'sample', 'E2E: Sample received',
   'Chef received samples.',
   NOW() - INTERVAL '9 days', 10, 207, 105, 108, true, 'received', NOW() - INTERVAL '5 days',
   1, NOW() - INTERVAL '9 days', NOW()),

  (237, 'interaction', 'sample', 'E2E: OVERDUE - Feedback pending',
   'Follow-up date passed 2 days ago. Still awaiting feedback.',
   NOW() - INTERVAL '5 days', 5, 207, 105, 108, true, 'feedback_pending', CURRENT_DATE - INTERVAL '2 days',
   1, NOW() - INTERVAL '5 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Feedback Received (Opp 109)
  -- ========================================
  (238, 'interaction', 'sample', 'E2E: Sample sent',
   'Sent sample pack for kitchen trials.',
   NOW() - INTERVAL '18 days', 15, 205, 104, 109, true, 'sent', NOW() - INTERVAL '15 days',
   1, NOW() - INTERVAL '18 days', NOW()),

  (239, 'interaction', 'sample', 'E2E: Sample received',
   'Chef received and testing.',
   NOW() - INTERVAL '15 days', 10, 205, 104, 109, true, 'received', NOW() - INTERVAL '10 days',
   1, NOW() - INTERVAL '15 days', NOW()),

  (240, 'interaction', 'sample', 'E2E: Feedback received - POSITIVE',
   'Chef feedback: Excellent quality, consistent texture. Ready to move forward.',
   NOW() - INTERVAL '8 days', 30, 206, 104, 109, false, 'feedback_received', NULL,
   1, NOW() - INTERVAL '8 days', NOW()),

  -- ========================================
  -- STALLED: 45+ Days No Activity (Opp 110)
  -- ========================================
  -- Last activity was 47 days ago
  (241, 'interaction', 'call', 'E2E: Initial contact',
   'Good initial conversation about premium cheese needs.',
   NOW() - INTERVAL '58 days', 25, 208, 106, 110, true, NULL, NULL,
   1, NOW() - INTERVAL '58 days', NOW()),

  (242, 'interaction', 'sample', 'E2E: Sample sent - LAST ACTIVITY',
   'Sent sample pack. This is the last activity - 47 days ago.',
   NOW() - INTERVAL '47 days', 15, 208, 106, 110, true, 'sent', NOW() - INTERVAL '40 days',
   1, NOW() - INTERVAL '47 days', NOW()),

  -- ========================================
  -- STALLED: Overdue Tasks (Opp 111)
  -- ========================================
  (243, 'interaction', 'call', 'E2E: Active engagement',
   'Regular check-in. Account is active but rep is behind on tasks.',
   NOW() - INTERVAL '10 days', 20, 209, 107, 111, true, NULL, NULL,
   1, NOW() - INTERVAL '10 days', NOW()),

  (244, 'interaction', 'demo', 'E2E: Demo completed',
   'Successful demo. Multiple follow-up tasks created.',
   NOW() - INTERVAL '20 days', 90, 209, 107, 111, true, NULL, NULL,
   1, NOW() - INTERVAL '20 days', NOW()),

  -- ========================================
  -- STALLED: Ancient Deal (Opp 112)
  -- ========================================
  (245, 'interaction', 'call', 'E2E: Original contact 6 months ago',
   'Initial discovery call. Showed interest but timing not right.',
   NOW() - INTERVAL '175 days', 30, 208, 106, 112, true, NULL, NULL,
   1, NOW() - INTERVAL '175 days', NOW()),

  (246, 'interaction', 'email', 'E2E: Follow-up attempt',
   'Sent follow-up. No response. Will try again later.',
   NOW() - INTERVAL '150 days', 10, 208, 106, 112, false, NULL, NULL,
   1, NOW() - INTERVAL '150 days', NOW()),

  (247, 'interaction', 'note', 'E2E: Periodic check-in note',
   'Account still shows as new_lead after 6 months. Low priority.',
   NOW() - INTERVAL '30 days', 5, 208, 106, 112, false, NULL, NULL,
   1, NOW() - INTERVAL '30 days', NOW()),

  -- ========================================
  -- STALLED: On-Hold (Opp 113)
  -- ========================================
  (248, 'interaction', 'demo', 'E2E: Demo before hold',
   'Great demo. Customer requested pause due to renovation.',
   NOW() - INTERVAL '25 days', 90, 209, 107, 113, true, NULL, NULL,
   1, NOW() - INTERVAL '25 days', NOW()),

  (249, 'interaction', 'note', 'E2E: Placed on hold',
   'Customer renovation until Q2. Marking as on-hold.',
   NOW() - INTERVAL '20 days', 5, 209, 107, 113, false, NULL, NULL,
   1, NOW() - INTERVAL '20 days', NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('activities', 'id'), GREATEST(249, (SELECT MAX(id) FROM activities)), true);


-- ============================================================================
-- SECTION 5: E2E TASKS (IDs 100-120)
-- ============================================================================
-- Mix of overdue, due today, due tomorrow, and upcoming

INSERT INTO "public"."tasks" (
  id, title, due_date, contact_id, opportunity_id, sales_id, completed,
  created_at, updated_at
)
VALUES
  -- ========================================
  -- OVERDUE TASKS (For Opp 111 - Overdue Tasks scenario)
  -- ========================================
  (100, 'E2E: Send revised pricing after demo',
   CURRENT_DATE - INTERVAL '7 days', 209, 111, 1, false,
   NOW() - INTERVAL '15 days', NOW()),

  (101, 'E2E: Follow up on sample feedback',
   CURRENT_DATE - INTERVAL '5 days', 210, 111, 1, false,
   NOW() - INTERVAL '12 days', NOW()),

  (102, 'E2E: Schedule follow-up meeting',
   CURRENT_DATE - INTERVAL '3 days', 209, 111, 1, false,
   NOW() - INTERVAL '10 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Overdue follow-up (Opp 108)
  -- ========================================
  (103, 'E2E: Get sample feedback - OVERDUE',
   CURRENT_DATE - INTERVAL '2 days', 207, 108, 1, false,
   NOW() - INTERVAL '8 days', NOW()),

  -- ========================================
  -- SAMPLE WORKFLOW: Upcoming follow-ups
  -- ========================================
  (104, 'E2E: Confirm sample delivery (sent state)',
   CURRENT_DATE + INTERVAL '3 days', 205, 106, 1, false,
   NOW() - INTERVAL '2 days', NOW()),

  (105, 'E2E: Follow up on sample testing (received state)',
   CURRENT_DATE + INTERVAL '5 days', 205, 107, 1, false,
   NOW() - INTERVAL '5 days', NOW()),

  -- ========================================
  -- STALLED: Tasks for stale opportunity (Opp 110)
  -- ========================================
  (106, 'E2E: Re-engage stale contact',
   CURRENT_DATE - INTERVAL '10 days', 208, 110, 1, false,
   NOW() - INTERVAL '20 days', NOW()),

  -- ========================================
  -- COMPLETED TASKS: Happy Path A (Opp 100)
  -- ========================================
  (107, 'E2E: Send product catalog',
   NOW() - INTERVAL '85 days', 200, 100, 1, true,
   NOW() - INTERVAL '88 days', NOW() - INTERVAL '85 days'),

  (108, 'E2E: Schedule kitchen demo',
   NOW() - INTERVAL '76 days', 201, 100, 1, true,
   NOW() - INTERVAL '80 days', NOW() - INTERVAL '76 days'),

  (109, 'E2E: Send sample pack',
   NOW() - INTERVAL '69 days', 201, 100, 1, true,
   NOW() - INTERVAL '72 days', NOW() - INTERVAL '69 days'),

  (110, 'E2E: Follow up on sample feedback',
   NOW() - INTERVAL '55 days', 201, 100, 1, true,
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days'),

  (111, 'E2E: Submit formal proposal',
   NOW() - INTERVAL '40 days', 200, 100, 1, true,
   NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days'),

  (112, 'E2E: Contract finalization',
   NOW() - INTERVAL '10 days', 200, 100, 1, true,
   NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days'),

  -- ========================================
  -- DUE TODAY (General)
  -- ========================================
  (113, 'E2E: Call to confirm sample received',
   CURRENT_DATE, 205, 107, 1, false,
   NOW() - INTERVAL '2 days', NOW()),

  -- ========================================
  -- DUE TOMORROW
  -- ========================================
  (114, 'E2E: Prepare demo materials',
   CURRENT_DATE + INTERVAL '1 day', 209, 113, 1, false,
   NOW() - INTERVAL '3 days', NOW()),

  -- ========================================
  -- UPCOMING THIS WEEK
  -- ========================================
  (115, 'E2E: Review feedback and prepare proposal',
   CURRENT_DATE + INTERVAL '3 days', 206, 109, 1, false,
   NOW() - INTERVAL '5 days', NOW()),

  (116, 'E2E: Check on ancient deal status',
   CURRENT_DATE + INTERVAL '5 days', 208, 112, 1, false,
   NOW() - INTERVAL '7 days', NOW()),

  -- ========================================
  -- COMPLETED TASKS: Fast Close (Opp 101)
  -- ========================================
  (117, 'E2E: Rush demo setup',
   NOW() - INTERVAL '8 days', 202, 101, 1, true,
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),

  (118, 'E2E: Express pricing approval',
   NOW() - INTERVAL '6 days', 202, 101, 1, true,
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),

  (119, 'E2E: Contract signature',
   NOW() - INTERVAL '3 days', 202, 101, 1, true,
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),

  -- ========================================
  -- NEXT WEEK
  -- ========================================
  (120, 'E2E: Q2 re-engagement for on-hold deal',
   CURRENT_DATE + INTERVAL '10 days', 209, 113, 1, false,
   NOW() - INTERVAL '15 days', NOW());

-- Update sequence
SELECT setval(pg_get_serial_sequence('tasks', 'id'), GREATEST(120, (SELECT MAX(id) FROM tasks)), true);


-- ============================================================================
-- SECTION 6: E2E NOTES (Link to opportunities)
-- ============================================================================
-- Key decision points and context notes

INSERT INTO "public"."notes" (
  opportunity_id, contact_id, text, sales_id, created_at, updated_at
)
VALUES
  -- Happy Path A
  (100, 200, 'E2E Note: Initial discovery revealed competitor quality issues. Strong opportunity.',
   1, NOW() - INTERVAL '85 days', NOW()),
  (100, 201, 'E2E Note: Chef champion identified. Very enthusiastic about product quality.',
   1, NOW() - INTERVAL '70 days', NOW()),
  (100, 200, 'E2E Note: Deal closed! 3-year agreement. Excellent relationship built.',
   1, NOW() - INTERVAL '5 days', NOW()),

  -- Lost Deal - Price
  (102, 203, 'E2E Note: Budget constraints identified early. Risk factor for price sensitivity.',
   1, NOW() - INTERVAL '45 days', NOW()),
  (102, 203, 'E2E Note: Lost due to 15% price gap. Will revisit next fiscal year.',
   1, NOW() - INTERVAL '20 days', NOW()),

  -- Stalled
  (110, 208, 'E2E Note: Contact has gone dark. Multiple attempts with no response.',
   1, NOW() - INTERVAL '40 days', NOW()),

  -- On-Hold
  (113, 209, 'E2E Note: Customer pausing all vendor decisions during renovation. Expected Q2 restart.',
   1, NOW() - INTERVAL '20 days', NOW());


-- ============================================================================
-- SECTION 7: CAMPAIGN ASSIGNMENTS FOR E2E OPPORTUNITIES
-- ============================================================================
-- Group E2E opportunities into campaigns for filter testing

UPDATE opportunities SET campaign = 'E2E Testing - Happy Paths'
WHERE id IN (100, 101);

UPDATE opportunities SET campaign = 'E2E Testing - Lost Deals'
WHERE id IN (102, 103, 104, 105);

UPDATE opportunities SET campaign = 'E2E Testing - Sample Workflows'
WHERE id IN (106, 107, 108, 109);

UPDATE opportunities SET campaign = 'E2E Testing - Stalled Scenarios'
WHERE id IN (110, 111, 112, 113);


-- ============================================================================
-- E2E DATA SUMMARY
-- ============================================================================
-- This seed data provides the following for E2E testing:
--
-- ORGANIZATIONS: 8 (IDs 100-107)
-- CONTACTS: 12 (IDs 200-211)
-- OPPORTUNITIES: 14 (IDs 100-113)
--   - closed_won: 2 (IDs 100, 101)
--   - closed_lost: 4 (IDs 102, 103, 104, 105)
--   - sample_visit_offered: 4 (IDs 106, 107, 108, 110)
--   - feedback_logged: 2 (IDs 109, 111)
--   - demo_scheduled: 1 (ID 113)
--   - new_lead: 1 (ID 112)
-- ACTIVITIES: 50 (IDs 200-249)
-- TASKS: 21 (IDs 100-120)
--   - Overdue: 5 (IDs 100, 101, 102, 103, 106)
--   - Due today: 1 (ID 113)
--   - Completed: 9 (IDs 107-112, 117-119)
-- NOTES: 7
--
-- SAMPLE WORKFLOW STATES:
--   - sent: Opp 106 (Activity 232)
--   - received: Opp 107 (Activity 234)
--   - feedback_pending OVERDUE: Opp 108 (Activity 237)
--   - feedback_received: Opp 109 (Activity 240)
--
-- WIN/LOSS REASONS COVERED:
--   - Win: relationship, timing
--   - Loss: price_too_high, no_authorization, competitor_relationship, no_response
--
-- All E2E data owned by Admin user (sales_id = 1)
-- ============================================================================
