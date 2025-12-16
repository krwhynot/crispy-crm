-- ============================================
-- Row Styling Test Data
-- Creates 6 test opportunities for visual verification of conditional row styling
--
-- Run with: npx supabase db execute --file scripts/seed-row-styling-test.sql
-- Or paste directly into Supabase SQL Editor (http://localhost:54323)
-- ============================================

DO $$
DECLARE
  v_sales_id BIGINT;
  v_principal_id BIGINT;
  v_customer_id BIGINT;
  v_today DATE := CURRENT_DATE;
  v_past_date DATE := CURRENT_DATE - INTERVAL '7 days';
  v_future_date DATE := CURRENT_DATE + INTERVAL '14 days';
BEGIN
  -- Get first available sales user
  SELECT id INTO v_sales_id FROM sales WHERE deleted_at IS NULL LIMIT 1;

  IF v_sales_id IS NULL THEN
    RAISE EXCEPTION 'No sales users found. Please seed users first with: npm run db:local:seed-orgs';
  END IF;

  -- Get first available principal organization
  SELECT id INTO v_principal_id
  FROM organizations
  WHERE organization_type = 'principal' AND deleted_at IS NULL
  LIMIT 1;

  -- Get first available customer organization
  SELECT id INTO v_customer_id
  FROM organizations
  WHERE organization_type IN ('customer', 'distributor', 'operator') AND deleted_at IS NULL
  LIMIT 1;

  RAISE NOTICE 'Using sales_id: %, principal_id: %, customer_id: %', v_sales_id, v_principal_id, v_customer_id;

  -- ============================================
  -- TEST 1: Normal Opportunity (no special styling)
  -- Expected: Default appearance, no background, full opacity
  -- ============================================
  INSERT INTO opportunities (
    name,
    description,
    stage,
    priority,
    estimated_close_date,
    principal_organization_id,
    customer_organization_id,
    created_by
  ) VALUES (
    '🧪 TEST: Normal Opportunity',
    'Row styling test - should have DEFAULT styling (no background, full opacity)',
    'demo_scheduled',
    'medium',
    v_future_date,
    v_principal_id,
    v_customer_id,
    v_sales_id
  );

  -- ============================================
  -- TEST 2: Overdue Opportunity (red background)
  -- Expected: bg-error-subtle (light red tint)
  -- ============================================
  INSERT INTO opportunities (
    name,
    description,
    stage,
    priority,
    estimated_close_date,
    principal_organization_id,
    customer_organization_id,
    created_by
  ) VALUES (
    '🧪 TEST: Overdue Opportunity',
    'Row styling test - should have RED BACKGROUND (bg-error-subtle)',
    'feedback_logged',
    'high',
    v_past_date,
    v_principal_id,
    v_customer_id,
    v_sales_id
  );

  -- ============================================
  -- TEST 3: Hot Lead (primary left border)
  -- Expected: border-l-4 border-l-primary
  -- ============================================
  INSERT INTO opportunities (
    name,
    description,
    stage,
    priority,
    estimated_close_date,
    principal_organization_id,
    customer_organization_id,
    created_by
  ) VALUES (
    '🧪 TEST: Hot Lead',
    'Row styling test - should have PRIMARY LEFT BORDER',
    'new_lead',
    'medium',
    v_future_date,
    v_principal_id,
    v_customer_id,
    v_sales_id
  );

  -- ============================================
  -- TEST 4: Overdue + Hot Lead (combined styles)
  -- Expected: Red background AND left border
  -- ============================================
  INSERT INTO opportunities (
    name,
    description,
    stage,
    priority,
    estimated_close_date,
    principal_organization_id,
    customer_organization_id,
    created_by
  ) VALUES (
    '🧪 TEST: Overdue Hot Lead',
    'Row styling test - should have RED BACKGROUND + LEFT BORDER',
    'new_lead',
    'critical',
    v_past_date,
    v_principal_id,
    v_customer_id,
    v_sales_id
  );

  -- ============================================
  -- TEST 5: Closed Won (green tint, 75% opacity)
  -- Expected: bg-success-subtle/50 opacity-75
  -- NOTE: Even with past date, should NOT show red
  -- ============================================
  INSERT INTO opportunities (
    name,
    description,
    stage,
    priority,
    estimated_close_date,
    principal_organization_id,
    customer_organization_id,
    created_by
  ) VALUES (
    '🧪 TEST: Closed Won',
    'Row styling test - should have GREEN TINT + 75% OPACITY (NOT red even though past date)',
    'closed_won',
    'medium',
    v_past_date,  -- Past date intentionally to verify no red styling
    v_principal_id,
    v_customer_id,
    v_sales_id
  );

  -- ============================================
  -- TEST 6: Closed Lost (50% opacity)
  -- Expected: opacity-50 (clearly faded)
  -- NOTE: Should NOT show red even with past date
  -- ============================================
  INSERT INTO opportunities (
    name,
    description,
    stage,
    priority,
    estimated_close_date,
    principal_organization_id,
    customer_organization_id,
    created_by
  ) VALUES (
    '🧪 TEST: Closed Lost',
    'Row styling test - should have 50% OPACITY (faded, NOT red)',
    'closed_lost',
    'low',
    v_past_date,  -- Past date intentionally to verify no red styling
    v_principal_id,
    v_customer_id,
    v_sales_id
  );

  RAISE NOTICE '';
  RAISE NOTICE '✅ Created 6 test opportunities for row styling verification';
  RAISE NOTICE '🔍 Search for "🧪 TEST:" in the Opportunities list to find them';
  RAISE NOTICE '';

END $$;

-- ============================================
-- Verify the test data was created
-- ============================================
SELECT
  name,
  stage,
  estimated_close_date,
  CASE
    WHEN stage = 'closed_won' THEN '🟢 GREEN + 75% opacity'
    WHEN stage = 'closed_lost' THEN '⚫ 50% opacity (faded)'
    WHEN stage = 'new_lead' AND estimated_close_date < CURRENT_DATE THEN '🔴▌ RED bg + LEFT border'
    WHEN stage = 'new_lead' THEN '▌ LEFT border only'
    WHEN estimated_close_date < CURRENT_DATE THEN '🔴 RED background'
    ELSE '⬜ Normal (no styling)'
  END AS expected_styling
FROM opportunities
WHERE name LIKE '%🧪 TEST:%'
ORDER BY
  CASE stage
    WHEN 'demo_scheduled' THEN 1  -- Normal first
    WHEN 'feedback_logged' THEN 2  -- Overdue
    WHEN 'new_lead' THEN 3         -- Hot lead variants
    WHEN 'closed_won' THEN 4
    WHEN 'closed_lost' THEN 5
    ELSE 3
  END,
  estimated_close_date DESC;
