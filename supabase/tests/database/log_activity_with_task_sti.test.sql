-- ============================================================================
-- log_activity_with_task_sti.test.sql
-- ============================================================================
-- PURPOSE: Gate 3 - Verify log_activity_with_task RPC inserts tasks into
--          activities table with activity_type='task' (STI pattern)
--
-- CONTEXT: Migration 20260208000002_fix_rpc_sti.sql updated the RPC to use
--          Single Table Inheritance pattern. Tasks are now stored in the
--          activities table instead of the deprecated tasks table.
--
-- TESTS:
--   1. Task inserted into activities table with activity_type='task'
--   2. No row in deprecated tasks table
--   3. Activity also inserted correctly
--   4. Return value contains both IDs
--
-- References:
--   - STI Migration: 20260208000002_fix_rpc_sti.sql
--   - Deprecation: 20260121000005_deprecate_tasks_table.sql
-- ============================================================================

BEGIN;

SELECT plan(5);

-- ============================================================================
-- SETUP: Create test user with sales record (required for get_current_sales_id)
-- ============================================================================

-- Clean up any existing test data
DELETE FROM public.sales WHERE user_id = '99990080-aaaa-aaaa-aaaa-000000000001';
DELETE FROM auth.users WHERE id = '99990080-aaaa-aaaa-aaaa-000000000001';

-- Create test user (handle_new_user trigger creates sales record automatically)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('99990080-aaaa-aaaa-aaaa-000000000001', 'test-sti-080@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated');

-- Create test organization (required FK for activities)
INSERT INTO organizations (id, name, deleted_at)
VALUES (999080, 'Test Org STI', NULL)
ON CONFLICT (id) DO NOTHING;

-- Create test contact (optional FK)
INSERT INTO contacts (id, name, organization_id, deleted_at)
VALUES (999080, 'Test Contact STI', 999080, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SETUP: Authenticate as test user
-- ============================================================================

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '99990080-aaaa-aaaa-aaaa-000000000001';

-- ============================================================================
-- TEST: Call log_activity_with_task RPC
-- ============================================================================

-- Store the result for verification
CREATE TEMP TABLE rpc_result AS
SELECT log_activity_with_task(
  jsonb_build_object(
    'activity_type', 'activity',
    'type', 'call',
    'subject', 'STI Test Activity',
    'activity_date', NOW()::text,
    'organization_id', 999080
  ),
  jsonb_build_object(
    'title', 'STI Follow-up Task',
    'type', 'Follow-up',
    'due_date', (NOW() + INTERVAL '1 day')::date::text,
    'contact_id', 999080
  )
) AS result;

-- ============================================================================
-- SECTION 1: Verify STI Pattern - Task in activities table
-- ============================================================================

-- Test 1: Task was inserted into activities table with activity_type='task'
SELECT ok(
  EXISTS(
    SELECT 1 FROM activities
    WHERE subject = 'STI Follow-up Task'
    AND activity_type = 'task'
    AND deleted_at IS NULL
  ),
  'Task inserted into activities table with activity_type=task (STI pattern)'
);

-- Test 2: No row in deprecated tasks table (if it still has data visibility)
-- Note: tasks_deprecated has read-only policy, so we check via direct access
SELECT ok(
  NOT EXISTS(
    SELECT 1 FROM tasks_deprecated
    WHERE title = 'STI Follow-up Task'
  ),
  'No task in deprecated tasks table'
);

-- ============================================================================
-- SECTION 2: Verify Activity was also inserted
-- ============================================================================

-- Test 3: Activity was inserted correctly
SELECT ok(
  EXISTS(
    SELECT 1 FROM activities
    WHERE subject = 'STI Test Activity'
    AND activity_type = 'activity'
    AND type = 'call'
    AND deleted_at IS NULL
  ),
  'Activity inserted into activities table with activity_type=activity'
);

-- ============================================================================
-- SECTION 3: Verify RPC return value
-- ============================================================================

-- Test 4: RPC returned success with activity_id
SELECT ok(
  (SELECT (result->>'success')::boolean FROM rpc_result),
  'RPC returned success=true'
);

-- Test 5: RPC returned task_id (not null when task was provided)
SELECT ok(
  (SELECT (result->>'task_id')::bigint IS NOT NULL FROM rpc_result),
  'RPC returned task_id (not null)'
);

-- ============================================================================
-- CLEANUP & FINISH
-- ============================================================================

DROP TABLE IF EXISTS rpc_result;

SELECT * FROM finish();

ROLLBACK;
