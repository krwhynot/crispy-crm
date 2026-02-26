-- Stage Transition Validation Test Setup (WF-H1-004)
-- Use this script to create test opportunities for manual testing

-- ==============================================================================
-- SETUP: Create Test Opportunities
-- ==============================================================================

-- Get sample organization IDs for testing
SELECT
  'Customer Orgs:' as type,
  id,
  name,
  organization_type
FROM organizations
WHERE organization_type IN ('customer', 'prospect')
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 3;

SELECT
  'Principal Orgs:' as type,
  id,
  name,
  organization_type
FROM organizations
WHERE organization_type = 'principal'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 3;

-- Create test opportunity for stage transition testing
-- NOTE: Replace the organization IDs with actual IDs from your local database
-- Run the queries above first to get valid IDs

-- Test Opportunity 1: new_lead (for testing valid progressions)
INSERT INTO opportunities (
  name,
  customer_organization_id,
  principal_organization_id,
  stage,
  priority,
  status,
  estimated_close_date,
  created_at,
  updated_at
)
VALUES (
  'TEST - Stage Validation - New Lead',
  (SELECT id FROM organizations WHERE organization_type IN ('customer', 'prospect') AND deleted_at IS NULL LIMIT 1),
  (SELECT id FROM organizations WHERE organization_type = 'principal' AND deleted_at IS NULL LIMIT 1),
  'new_lead',
  'medium',
  'active',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
)
RETURNING id, name, stage, customer_organization_id, principal_organization_id;

-- Test Opportunity 2: initial_outreach (for testing mid-pipeline transitions)
INSERT INTO opportunities (
  name,
  customer_organization_id,
  principal_organization_id,
  stage,
  priority,
  status,
  estimated_close_date,
  created_at,
  updated_at
)
VALUES (
  'TEST - Stage Validation - Initial Outreach',
  (SELECT id FROM organizations WHERE organization_type IN ('customer', 'prospect') AND deleted_at IS NULL LIMIT 1),
  (SELECT id FROM organizations WHERE organization_type = 'principal' AND deleted_at IS NULL LIMIT 1),
  'initial_outreach',
  'medium',
  'active',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
)
RETURNING id, name, stage, customer_organization_id, principal_organization_id;

-- Test Opportunity 3: demo_scheduled (for testing terminal transitions)
INSERT INTO opportunities (
  name,
  customer_organization_id,
  principal_organization_id,
  stage,
  priority,
  status,
  estimated_close_date,
  created_at,
  updated_at
)
VALUES (
  'TEST - Stage Validation - Demo Scheduled',
  (SELECT id FROM organizations WHERE organization_type IN ('customer', 'prospect') AND deleted_at IS NULL LIMIT 1),
  (SELECT id FROM organizations WHERE organization_type = 'principal' AND deleted_at IS NULL LIMIT 1),
  'demo_scheduled',
  'medium',
  'active',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
)
RETURNING id, name, stage, customer_organization_id, principal_organization_id;

-- Test Opportunity 4: closed_won (for testing terminal state protection)
INSERT INTO opportunities (
  name,
  customer_organization_id,
  principal_organization_id,
  stage,
  priority,
  status,
  estimated_close_date,
  win_reason,
  actual_close_date,
  created_at,
  updated_at
)
VALUES (
  'TEST - Stage Validation - Closed Won',
  (SELECT id FROM organizations WHERE organization_type IN ('customer', 'prospect') AND deleted_at IS NULL LIMIT 1),
  (SELECT id FROM organizations WHERE organization_type = 'principal' AND deleted_at IS NULL LIMIT 1),
  'closed_won',
  'medium',
  'active',
  NOW(),
  'relationship', -- Required for closed_won
  NOW(),
  NOW(),
  NOW()
)
RETURNING id, name, stage, win_reason, customer_organization_id, principal_organization_id;

-- Test Opportunity 5: closed_lost (for testing terminal state protection)
INSERT INTO opportunities (
  name,
  customer_organization_id,
  principal_organization_id,
  stage,
  priority,
  status,
  estimated_close_date,
  loss_reason,
  actual_close_date,
  created_at,
  updated_at
)
VALUES (
  'TEST - Stage Validation - Closed Lost',
  (SELECT id FROM organizations WHERE organization_type IN ('customer', 'prospect') AND deleted_at IS NULL LIMIT 1),
  (SELECT id FROM organizations WHERE organization_type = 'principal' AND deleted_at IS NULL LIMIT 1),
  'closed_lost',
  'medium',
  'active',
  NOW(),
  'price', -- Required for closed_lost
  NOW(),
  NOW(),
  NOW()
)
RETURNING id, name, stage, loss_reason, customer_organization_id, principal_organization_id;

-- ==============================================================================
-- VERIFY: List all test opportunities
-- ==============================================================================

SELECT
  id,
  name,
  stage,
  status,
  win_reason,
  loss_reason,
  customer_organization_id,
  principal_organization_id,
  created_at
FROM opportunities
WHERE name LIKE 'TEST - Stage Validation%'
  AND deleted_at IS NULL
ORDER BY stage, created_at DESC;

-- ==============================================================================
-- CLEANUP: Remove test opportunities after testing
-- ==============================================================================

-- Soft delete test opportunities (follows Crispy CRM soft-delete pattern)
UPDATE opportunities
SET deleted_at = NOW()
WHERE name LIKE 'TEST - Stage Validation%'
  AND deleted_at IS NULL;

-- Verify cleanup
SELECT COUNT(*) as remaining_test_opps
FROM opportunities
WHERE name LIKE 'TEST - Stage Validation%'
  AND deleted_at IS NULL;

-- Hard delete (only if needed - not recommended)
-- DELETE FROM opportunities
-- WHERE name LIKE 'TEST - Stage Validation%';

-- ==============================================================================
-- MONITORING: Check validation during tests
-- ==============================================================================

-- Monitor opportunity stage changes during testing
SELECT
  id,
  name,
  stage,
  updated_at,
  version,
  stage_changed_at
FROM opportunities
WHERE name LIKE 'TEST - Stage Validation%'
  AND deleted_at IS NULL
ORDER BY updated_at DESC;

-- Check stage_history if it exists (audit trail)
-- Note: Crispy CRM may not have stage_history table yet
-- SELECT * FROM stage_history WHERE opportunity_id IN (
--   SELECT id FROM opportunities WHERE name LIKE 'TEST - Stage Validation%'
-- ) ORDER BY changed_at DESC;
