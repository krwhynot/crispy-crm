-- ============================================================================
-- Seed Opportunities for E2E Tests
-- ============================================================================
-- Creates minimal opportunities needed for existing tasks (IDs 7-20) to pass
-- E2E tests. Links to Kaufholds principal (ID 1796).
--
-- Background: Cloud database has tasks but no opportunities, causing
-- priority_tasks view to return zero results and E2E tests to fail.
-- ============================================================================

-- Insert opportunities with explicit IDs matching existing tasks
INSERT INTO opportunities (
  id,
  name,
  customer_organization_id,
  principal_organization_id,
  stage,
  status,
  priority,
  description,
  estimated_close_date,
  opportunity_owner_id,
  account_manager_id,
  lead_source,
  created_at
) VALUES
  -- Opportunity 14 (for tasks 7, 8, 19)
  (14, 'Coffee & Demo Program', 13, 1796, 'demo_scheduled', 'active', 'high',
   'Coffee samples and training materials demo',
   CURRENT_DATE + INTERVAL '30 days', 4, 4, 'referral', NOW() - INTERVAL '15 days'),

  -- Opportunity 15 (for task 9)
  (15, 'Dessert Vendor Evaluation', 26, 1796, 'initial_outreach', 'active', 'medium',
   'Dessert products evaluation for menu planning',
   CURRENT_DATE + INTERVAL '45 days', 4, 4, 'cold_call', NOW() - INTERVAL '10 days'),

  -- Opportunity 17 (for tasks 12, 16)
  (17, 'Fries Portfolio & Spring Menu', 44, 1796, 'sample_visit_offered', 'active', 'critical',
   'Fries product line and spring menu timeline discussion',
   CURRENT_DATE + INTERVAL '21 days', 4, 4, 'existing_customer', NOW() - INTERVAL '20 days'),

  -- Opportunity 18 (for tasks 13, 17)
  (18, 'Wellness Products & Demo Kit', 52, 1796, 'sample_visit_offered', 'active', 'high',
   'Wellness catalog and product demonstration',
   CURRENT_DATE + INTERVAL '14 days', 4, 4, 'email_campaign', NOW() - INTERVAL '7 days')

ON CONFLICT (id) DO NOTHING;

-- Reset sequence to prevent ID conflicts
SELECT setval('opportunities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM opportunities));
