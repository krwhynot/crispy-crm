-- ============================================================================
-- E2E TEST DATA - Full Dataflow Coverage
-- ============================================================================
-- Comprehensive seed data for ALL application dataflows:
-- Opportunities, Activities, Tasks, Tags, Notes, Products, Product-Distributors,
-- Notifications, soft-deleted records, snoozed tasks, varied statuses
--
-- Uses [RPT] prefix for cleanup. Uses dynamic dates relative to NOW().
-- Run with: npm run db:local:seed:e2e
-- Or: psql <connection> -f supabase/seed-e2e.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- CLEANUP: Remove previous [RPT] E2E data (idempotent re-runs)
-- ============================================================================
DELETE FROM notifications WHERE message LIKE '[RPT]%';
DELETE FROM contact_notes WHERE text LIKE '[RPT]%';
DELETE FROM opportunity_notes WHERE text LIKE '[RPT]%';
DELETE FROM organization_notes WHERE text LIKE '[RPT]%';
DELETE FROM product_distributors WHERE notes LIKE '[RPT]%';

-- Activities/tasks cleanup (activities table stores both)
DELETE FROM activities WHERE subject LIKE '[RPT]%';

-- Opportunity-products for [RPT] opportunities
DELETE FROM opportunity_products WHERE opportunity_id IN (
  SELECT id FROM opportunities WHERE name LIKE '[RPT]%'
);
DELETE FROM opportunities WHERE name LIKE '[RPT]%';

-- Reset tag assignments on contacts (tags are bigint[] on contacts)
UPDATE contacts SET tags = NULL WHERE tags IS NOT NULL;

-- ============================================================================
-- TAGS (10 tags - ON CONFLICT for idempotency)
-- ============================================================================
INSERT INTO tags (name, color, description, created_at, updated_at)
VALUES
  ('Decision Maker', '#10B981', 'Executive or VP with buying authority', NOW(), NOW()),
  ('Champion', '#3B82F6', 'Internal advocate at the account', NOW(), NOW()),
  ('Gatekeeper', '#F59E0B', 'Controls access to decision makers', NOW(), NOW()),
  ('Influencer', '#8B5CF6', 'Has influence on purchasing decisions', NOW(), NOW()),
  ('Technical', '#EC4899', 'Technical contact for product specs', NOW(), NOW()),
  ('Budget Holder', '#EF4444', 'Controls the budget for purchases', NOW(), NOW()),
  ('New Contact', '#06B6D4', 'Recently added to the system', NOW(), NOW()),
  ('VIP', '#F97316', 'High-value relationship', NOW(), NOW()),
  ('Needs Follow-up', '#84CC16', 'Requires follow-up action', NOW(), NOW()),
  ('Cold Lead', '#6B7280', 'Low engagement, needs nurturing', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- PREREQUISITE: Additional principal organizations (90006-90010)
-- Base seed only creates 90001-90005. We add 5 more for variety.
-- ============================================================================
INSERT INTO organizations (id, name, organization_type, city, state, priority, created_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  (90006, 'Better Balance Foods', 'principal'::organization_type, 'Portland', 'OR', 'A', NOW(), NOW()),
  (90007, 'Hazelnut Growers Co-op', 'principal'::organization_type, 'Salem', 'OR', 'B', NOW(), NOW()),
  (90008, 'Kaufhold''s Bakery Supply', 'principal'::organization_type, 'Milwaukee', 'WI', 'A', NOW(), NOW()),
  (90009, 'Market Square Foods', 'principal'::organization_type, 'Indianapolis', 'IN', 'B', NOW(), NOW()),
  (90010, 'SWAP Specialty Wholesale', 'principal'::organization_type, 'Columbus', 'OH', 'C', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  organization_type = EXCLUDED.organization_type,
  updated_at = NOW();

-- ============================================================================
-- PREREQUISITE: Additional auth.users + sales reps
-- Base seed creates 4 reps (IDs 1,3,5,7). We add 3 more for varied performance.
-- ============================================================================
-- Auth users (ON CONFLICT skip for idempotency)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'::UUID, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'sarah@mfbroker.com', '$2a$06$D1i1NooDX7tKNCQT2ZQFMeFFV8pTHQanj6ykjYIyG0Z4ATyk1vNx2',
   NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'::UUID, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'marcus@mfbroker.com', '$2a$06$D1i1NooDX7tKNCQT2ZQFMeFFV8pTHQanj6ykjYIyG0Z4ATyk1vNx2',
   NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'::UUID, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'emily@mfbroker.com', '$2a$06$D1i1NooDX7tKNCQT2ZQFMeFFV8pTHQanj6ykjYIyG0Z4ATyk1vNx2',
   NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{}')
ON CONFLICT (id) DO NOTHING;

-- Sales reps (trigger auto-creates from auth.users, but we set details)
-- The on_auth_user_created trigger may or may not fire depending on timing,
-- so we upsert by user_id to be safe.
INSERT INTO sales (user_id, first_name, last_name, email, role, created_at, updated_at)
VALUES
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'::UUID, 'Sarah', 'Chen', 'sarah@mfbroker.com', 'rep', NOW(), NOW()),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'::UUID, 'Marcus', 'Johnson', 'marcus@mfbroker.com', 'rep', NOW(), NOW()),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'::UUID, 'Emily', 'Rodriguez', 'emily@mfbroker.com', 'rep', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================================
-- PREREQUISITE: Products (120 across 10 principals)
-- Creates [RPT]-prefixed products for all 10 principal orgs (12 per principal)
-- ============================================================================
DELETE FROM products WHERE name LIKE '[RPT]%';

DO $$
DECLARE
  v_principal_ids BIGINT[] := ARRAY[90001, 90002, 90003, 90004, 90005, 90006, 90007, 90008, 90009, 90010];
  v_categories TEXT[] := ARRAY['dairy', 'beverages', 'frozen', 'fresh_produce', 'meat_poultry', 'seafood', 'dry_goods', 'snacks', 'condiments', 'baking_supplies', 'spices_seasonings', 'canned_goods'];
  v_product_names TEXT[] := ARRAY[
    'Classic Blend', 'Premium Reserve', 'Organic Select', 'Heritage Line',
    'Artisan Series', 'Gold Label', 'Farm Fresh', 'Chef''s Choice',
    'Signature Cut', 'Estate Collection', 'Natural Harvest', 'Family Recipe'
  ];
  v_idx INT;
  v_p_idx INT;
  v_admin_id BIGINT;
BEGIN
  SELECT id INTO v_admin_id FROM sales WHERE email = 'admin@test.com' LIMIT 1;

  FOR v_p_idx IN 1..10 LOOP
    FOR v_idx IN 1..12 LOOP
      INSERT INTO products (
        name, principal_id, category, status, description, created_by, created_at, updated_at
      ) VALUES (
        '[RPT] ' || v_product_names[v_idx] || ' - P' || v_p_idx,
        v_principal_ids[v_p_idx],
        v_categories[v_idx],
        'active'::product_status,
        'Report seed product ' || v_idx || ' for principal ' || v_p_idx,
        v_admin_id,
        NOW() - ((v_idx * v_p_idx) || ' days')::INTERVAL,
        NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created 120 [RPT] products across 10 principals';
END $$;

-- ============================================================================
-- MAIN DO BLOCK: Dynamic data generation
-- ============================================================================
DO $$
DECLARE
  -- Sales rep IDs (dynamically fetched from sales table)
  v_sales_ids BIGINT[];
  v_sales_id BIGINT;

  -- Product IDs (dynamically fetched after [RPT] product creation)
  v_product_ids BIGINT[];

  -- Principal org IDs (5 base + 5 added above)
  v_principal_ids BIGINT[] := ARRAY[90001, 90002, 90003, 90004, 90005, 90006, 90007, 90008, 90009, 90010];
  v_principal_names TEXT[] := ARRAY['Midwest Foods', 'Great Lakes', 'Heartland', 'Michigan Specialty', 'North Star', 'Better Balance', 'Hazelnut Growers', 'Kaufhold''s', 'Market Square', 'SWAP'];

  -- Customer org IDs (first 60 non-principal, non-deleted orgs for variety)
  v_customer_ids BIGINT[];

  -- Distributor org IDs (from organization_distributors junction)
  v_distributor_ids BIGINT[];

  -- Tag IDs (fetched after upsert)
  v_tag_ids BIGINT[];

  -- Working variables
  v_opp_id BIGINT;
  v_contact_id BIGINT;
  v_product_id BIGINT;
  v_idx INT;
  v_rep_idx INT;
  v_principal_idx INT;
  v_customer_idx INT;
  v_stage TEXT;
  v_priority TEXT;
  v_campaign TEXT;
  v_days_ago INT;
  v_act_type TEXT;
  v_sentiment TEXT;
  v_opp_count INT := 0;
  v_act_count INT := 0;
  v_task_count INT := 0;

  -- Opportunity stages (matching enum)
  v_stages TEXT[] := ARRAY['new_lead', 'initial_outreach', 'sample_visit_offered', 'feedback_logged', 'demo_scheduled', 'closed_won', 'closed_lost'];

  -- Activity types (expanded to cover all interaction_type enum values)
  v_act_types TEXT[] := ARRAY[
    'call', 'email', 'meeting', 'demo', 'proposal', 'follow_up',
    'trade_show', 'site_visit', 'contract_review', 'check_in',
    'social', 'note', 'sample', 'administrative', 'other', 'stage_change',
    'call', 'email', 'meeting', 'call', 'email', 'sample', 'site_visit', 'check_in'
  ];

  -- Sentiments
  v_sentiments TEXT[] := ARRAY['positive', 'neutral', 'negative', 'positive', 'positive', 'neutral'];

  -- Priorities
  v_priorities TEXT[] := ARRAY['low', 'medium', 'high', 'critical', 'medium', 'high'];

  -- Campaigns (3 campaigns for tagging)
  v_campaigns TEXT[] := ARRAY['Grand Rapids Trade Show', 'Q4 Email Outreach', 'Midwest Distributor Summit', NULL, NULL, NULL, NULL, NULL];

  -- Task subjects per type
  v_task_subjects_call TEXT[] := ARRAY[
    'Call to discuss pricing for %s products',
    'Follow-up call with %s buyer',
    'Check-in call re: %s delivery schedule',
    'Call %s about seasonal availability'
  ];
  v_task_subjects_email TEXT[] := ARRAY[
    'Send %s product catalog to prospect',
    'Email %s sample tracking update',
    'Send pricing proposal for %s items',
    'Follow-up email re: %s contract'
  ];
  v_task_subjects_meeting TEXT[] := ARRAY[
    'Schedule tasting meeting for %s products',
    'Quarterly review meeting with %s team',
    'On-site visit to demo %s line',
    'Meet with %s buyer re: Q2 order'
  ];

  -- Sample statuses
  v_sample_statuses TEXT[] := ARRAY['sent', 'received', 'feedback_pending', 'feedback_received'];

BEGIN
  -- ============================================================================
  -- Fetch sales rep IDs (all active, non-deleted reps)
  -- ============================================================================
  SELECT ARRAY_AGG(id ORDER BY id) INTO v_sales_ids
  FROM sales WHERE disabled = false AND deleted_at IS NULL;

  IF v_sales_ids IS NULL OR array_length(v_sales_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No active sales reps found. Run seed.sql first.';
  END IF;

  RAISE NOTICE 'Found % active sales reps: %', array_length(v_sales_ids, 1), v_sales_ids;

  -- ============================================================================
  -- Fetch [RPT] product IDs (created by prerequisite block above)
  -- ============================================================================
  SELECT ARRAY_AGG(id ORDER BY id) INTO v_product_ids
  FROM products WHERE name LIKE '[RPT]%' AND deleted_at IS NULL;

  IF v_product_ids IS NULL OR array_length(v_product_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No [RPT] products found. Product creation block above must run first.';
  END IF;

  RAISE NOTICE 'Found % [RPT] products (IDs % to %)', array_length(v_product_ids, 1), v_product_ids[1], v_product_ids[array_length(v_product_ids, 1)];

  -- ============================================================================
  -- Fetch customer org IDs (non-principal, non-deleted, max 60)
  -- ============================================================================
  SELECT ARRAY_AGG(id ORDER BY id) INTO v_customer_ids
  FROM (
    SELECT id FROM organizations
    WHERE deleted_at IS NULL AND id < 90000
    ORDER BY id LIMIT 60
  ) sub;

  -- ============================================================================
  -- Fetch distributor org IDs
  -- ============================================================================
  SELECT ARRAY_AGG(DISTINCT distributor_id ORDER BY distributor_id) INTO v_distributor_ids
  FROM (
    SELECT DISTINCT distributor_id FROM organization_distributors
    WHERE deleted_at IS NULL
    ORDER BY distributor_id LIMIT 15
  ) sub;

  -- ============================================================================
  -- Fetch tag IDs (in name order matching our insert)
  -- ============================================================================
  SELECT ARRAY_AGG(id ORDER BY name) INTO v_tag_ids
  FROM tags WHERE name IN (
    'Budget Holder', 'Champion', 'Cold Lead', 'Decision Maker', 'Gatekeeper',
    'Influencer', 'Needs Follow-up', 'New Contact', 'Technical', 'VIP'
  );

  -- ============================================================================
  -- TAG ASSIGNMENTS (36 contacts with tags)
  -- ============================================================================
  -- Sorted v_tag_ids: [Budget Holder, Champion, Cold Lead, Decision Maker, Gatekeeper,
  --                     Influencer, Needs Follow-up, New Contact, Technical, VIP]
  -- Index:             [1,             2,        3,         4,              5,
  --                     6,          7,              8,           9,         10]

  -- Single-tag contacts (30 contacts, 3 per tag)
  -- Decision Maker (idx 4)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[4]]::bigint[] WHERE id IN (5, 7, 13) AND deleted_at IS NULL;
  -- Champion (idx 2)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[2]]::bigint[] WHERE id IN (1, 11, 19) AND deleted_at IS NULL;
  -- Gatekeeper (idx 5)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[5]]::bigint[] WHERE id IN (20, 46, 54) AND deleted_at IS NULL;
  -- Influencer (idx 6)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[6]]::bigint[] WHERE id IN (45, 55, 72) AND deleted_at IS NULL;
  -- Technical (idx 9)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[9]]::bigint[] WHERE id IN (41, 43, 57) AND deleted_at IS NULL;
  -- Budget Holder (idx 1)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[1]]::bigint[] WHERE id IN (21, 42, 59) AND deleted_at IS NULL;
  -- New Contact (idx 8)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[8]]::bigint[] WHERE id IN (10, 14, 32) AND deleted_at IS NULL;
  -- VIP (idx 10)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[10]]::bigint[] WHERE id IN (25, 33, 62) AND deleted_at IS NULL;
  -- Needs Follow-up (idx 7)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[7]]::bigint[] WHERE id IN (48, 52, 67) AND deleted_at IS NULL;
  -- Cold Lead (idx 3)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[3]]::bigint[] WHERE id IN (24, 30, 44) AND deleted_at IS NULL;

  -- Multi-tag contacts (6 contacts with 2-3 tags)
  UPDATE contacts SET tags = ARRAY[v_tag_ids[4], v_tag_ids[1], v_tag_ids[10]]::bigint[] WHERE id = 3 AND deleted_at IS NULL;  -- Decision Maker + Budget Holder + VIP
  UPDATE contacts SET tags = ARRAY[v_tag_ids[4], v_tag_ids[2]]::bigint[] WHERE id = 39 AND deleted_at IS NULL;  -- Decision Maker + Champion
  UPDATE contacts SET tags = ARRAY[v_tag_ids[4], v_tag_ids[6], v_tag_ids[9]]::bigint[] WHERE id = 78 AND deleted_at IS NULL;  -- Decision Maker + Influencer + Technical
  UPDATE contacts SET tags = ARRAY[v_tag_ids[2], v_tag_ids[7]]::bigint[] WHERE id = 40 AND deleted_at IS NULL;  -- Champion + Needs Follow-up
  UPDATE contacts SET tags = ARRAY[v_tag_ids[1], v_tag_ids[10]]::bigint[] WHERE id = 60 AND deleted_at IS NULL;  -- Budget Holder + VIP
  UPDATE contacts SET tags = ARRAY[v_tag_ids[6], v_tag_ids[9]]::bigint[] WHERE id = 70 AND deleted_at IS NULL;  -- Influencer + Technical

  -- ============================================================================
  -- OPPORTUNITIES (~120 across all stages, campaigns, statuses)
  -- ============================================================================
  FOR v_idx IN 1..120 LOOP
    v_rep_idx := ((v_idx - 1) % array_length(v_sales_ids, 1)) + 1;
    v_sales_id := v_sales_ids[v_rep_idx];
    v_principal_idx := ((v_idx - 1) % 10) + 1;
    v_customer_idx := ((v_idx - 1) % array_length(v_customer_ids, 1)) + 1;

    -- Distribute stages: weighted toward early pipeline
    CASE
      WHEN v_idx <= 25 THEN v_stage := 'new_lead';
      WHEN v_idx <= 45 THEN v_stage := 'initial_outreach';
      WHEN v_idx <= 60 THEN v_stage := 'sample_visit_offered';
      WHEN v_idx <= 72 THEN v_stage := 'feedback_logged';
      WHEN v_idx <= 84 THEN v_stage := 'demo_scheduled';
      WHEN v_idx <= 108 THEN v_stage := 'closed_won';
      ELSE v_stage := 'closed_lost';
    END CASE;

    v_priority := v_priorities[((v_idx - 1) % 6) + 1];
    v_days_ago := (v_idx * 73 % 90) + 1;  -- Spread across 90 days
    v_campaign := v_campaigns[((v_idx - 1) % 8) + 1]; -- 3 campaigns + 5 NULLs

    INSERT INTO opportunities (
      name, description, stage, status, priority,
      estimated_close_date, actual_close_date,
      customer_organization_id, principal_organization_id,
      opportunity_owner_id, account_manager_id, created_by, campaign,
      created_at, updated_at,
      win_reason, loss_reason
    ) VALUES (
      '[RPT] ' || v_principal_names[v_principal_idx] || ' - Deal #' || v_idx,
      'Report seed opportunity #' || v_idx || ' for ' || v_principal_names[v_principal_idx],
      v_stage::opportunity_stage,
      'active'::opportunity_status,
      v_priority::priority_level,
      CURRENT_DATE + (v_idx || ' days')::INTERVAL,
      CASE WHEN v_stage IN ('closed_won', 'closed_lost')
        THEN (NOW() - (v_days_ago || ' days')::INTERVAL)::DATE
        ELSE NULL
      END,
      v_customer_ids[v_customer_idx],
      v_principal_ids[v_principal_idx],
      v_sales_id, v_sales_id, v_sales_id, v_campaign,
      NOW() - (v_days_ago || ' days')::INTERVAL,
      NOW() - ((v_days_ago / 2) || ' days')::INTERVAL,
      CASE WHEN v_stage = 'closed_won' THEN
        (ARRAY['relationship', 'product_quality', 'price_competitive', 'timing'])[((v_idx - 1) % 4) + 1]::win_reason
        ELSE NULL END,
      CASE WHEN v_stage = 'closed_lost' THEN
        (ARRAY['price_too_high', 'competitor_relationship', 'timing', 'no_authorization'])[((v_idx - 1) % 4) + 1]::loss_reason
        ELSE NULL END
    ) RETURNING id INTO v_opp_id;

    v_opp_count := v_opp_count + 1;

    -- ============================================================================
    -- OPPORTUNITY-PRODUCT LINKS (2 products per opportunity)
    -- ============================================================================
    v_product_id := v_product_ids[((v_idx - 1) % array_length(v_product_ids, 1)) + 1];
    INSERT INTO opportunity_products (
      opportunity_id, product_id_reference, product_name, product_category, notes,
      created_by, created_at, updated_at
    ) VALUES (
      v_opp_id, v_product_id,
      (SELECT name FROM products WHERE id = v_product_id),
      (SELECT category FROM products WHERE id = v_product_id),
      NULL, v_sales_id, NOW() - (v_days_ago || ' days')::INTERVAL, NOW()
    );

    v_product_id := v_product_ids[((v_idx + 59) % array_length(v_product_ids, 1)) + 1];
    INSERT INTO opportunity_products (
      opportunity_id, product_id_reference, product_name, product_category, notes,
      created_by, created_at, updated_at
    ) VALUES (
      v_opp_id, v_product_id,
      (SELECT name FROM products WHERE id = v_product_id),
      (SELECT category FROM products WHERE id = v_product_id),
      NULL, v_sales_id, NOW() - (v_days_ago || ' days')::INTERVAL, NOW()
    );

    -- ============================================================================
    -- ACTIVITIES (~4 per opportunity = ~480 total)
    -- ============================================================================
    FOR v_rep_idx IN 1..4 LOOP
      v_act_type := v_act_types[((v_idx * 4 + v_rep_idx - 1) % array_length(v_act_types, 1)) + 1];
      v_sentiment := v_sentiments[((v_idx + v_rep_idx - 1) % 6) + 1];

      -- Get a contact for ~70% of activities
      -- MUST belong to the opportunity's customer org (trigger validates contacts.organization_id = opp.customer_organization_id)
      v_contact_id := NULL;
      IF random() < 0.7 THEN
        SELECT c.id INTO v_contact_id
        FROM contacts c
        WHERE c.deleted_at IS NULL
          AND c.organization_id = v_customer_ids[v_customer_idx]
        ORDER BY (c.id + v_idx + v_rep_idx) % 100  -- pseudo-random ordering
        LIMIT 1;
        -- v_contact_id remains NULL if no contacts exist for this org (that's OK)
      END IF;

      INSERT INTO activities (
        activity_type, type, subject, description,
        activity_date, duration_minutes,
        contact_id, organization_id, opportunity_id,
        sentiment, sample_status,
        created_by, created_at, updated_at
      ) VALUES (
        'activity'::activity_type,
        v_act_type::interaction_type,
        '[RPT] ' || initcap(replace(v_act_type, '_', ' ')) || ' - ' || v_principal_names[v_principal_idx] || ' #' || v_idx || '.' || v_rep_idx,
        'Auto-generated activity for report coverage. ' || v_principal_names[v_principal_idx] || ' deal #' || v_idx,
        NOW() - ((v_days_ago - v_rep_idx + 1) || ' days')::INTERVAL,
        CASE WHEN v_act_type IN ('call', 'check_in') THEN 15 + (v_idx % 30)
             WHEN v_act_type IN ('meeting', 'demo', 'trade_show') THEN 30 + (v_idx % 60)
             ELSE NULL END,
        v_contact_id,
        v_customer_ids[v_customer_idx],
        v_opp_id,
        v_sentiment,
        CASE WHEN v_act_type = 'sample' THEN
          v_sample_statuses[((v_idx + v_rep_idx - 1) % 4) + 1]::sample_status
          ELSE NULL END,
        v_sales_id,
        NOW() - ((v_days_ago - v_rep_idx + 1) || ' days')::INTERVAL,
        NOW() - ((v_days_ago - v_rep_idx) || ' days')::INTERVAL
      );

      v_act_count := v_act_count + 1;
    END LOOP;
  END LOOP;

  -- ============================================================================
  -- VARIED OPPORTUNITY STATUSES (on_hold, nurturing)
  -- ============================================================================
  -- 5 on_hold (stalled deals)
  UPDATE opportunities SET status = 'on_hold'::opportunity_status
  WHERE name LIKE '[RPT]%' AND stage IN ('feedback_logged'::opportunity_stage, 'demo_scheduled'::opportunity_stage)
    AND id IN (
      SELECT id FROM opportunities WHERE name LIKE '[RPT]%' AND stage IN ('feedback_logged'::opportunity_stage, 'demo_scheduled'::opportunity_stage)
      ORDER BY id LIMIT 5
    );

  -- 3 nurturing (long-term)
  UPDATE opportunities SET status = 'nurturing'::opportunity_status
  WHERE name LIKE '[RPT]%' AND stage = 'initial_outreach'::opportunity_stage
    AND id IN (
      SELECT id FROM opportunities WHERE name LIKE '[RPT]%' AND stage = 'initial_outreach'::opportunity_stage AND status = 'active'::opportunity_status
      ORDER BY id LIMIT 3
    );

  -- ============================================================================
  -- TASKS (~150, stored in activities with activity_type='task')
  -- ============================================================================
  FOR v_idx IN 1..150 LOOP
    v_rep_idx := ((v_idx - 1) % array_length(v_sales_ids, 1)) + 1;
    v_sales_id := v_sales_ids[v_rep_idx];
    v_principal_idx := ((v_idx - 1) % 10) + 1;
    v_priority := v_priorities[((v_idx - 1) % 6) + 1];

    -- Get an opportunity to link to (~80% of tasks)
    v_opp_id := NULL;
    IF v_idx <= 120 THEN
      SELECT id INTO v_opp_id FROM opportunities
      WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
      ORDER BY id
      OFFSET v_idx - 1 LIMIT 1;
    END IF;

    -- Determine task type and subject
    v_act_type := (ARRAY['call', 'email', 'meeting', 'follow_up', 'demo', 'proposal', 'administrative', 'other'])[((v_idx - 1) % 8) + 1];

    INSERT INTO activities (
      activity_type, type, subject, description,
      due_date, reminder_date, completed, completed_at,
      priority, sales_id, opportunity_id,
      created_by, created_at, updated_at
    ) VALUES (
      'task'::activity_type,
      v_act_type::interaction_type,
      '[RPT] ' || initcap(replace(v_act_type, '_', ' ')) || ' task for ' || v_principal_names[v_principal_idx] || ' #' || v_idx,
      'Auto-generated task #' || v_idx || ' for ' || v_principal_names[v_principal_idx],
      CASE
        -- 25 overdue (due 1-14 days ago)
        WHEN v_idx <= 25 THEN CURRENT_DATE - ((v_idx % 14) + 1 || ' days')::INTERVAL
        -- 8 due today
        WHEN v_idx <= 33 THEN CURRENT_DATE
        -- 52 completed (due in past, already done)
        WHEN v_idx <= 85 THEN CURRENT_DATE - ((v_idx % 30) || ' days')::INTERVAL
        -- 65 upcoming (due 1-30 days out)
        ELSE CURRENT_DATE + (((v_idx - 85) % 30) + 1 || ' days')::INTERVAL
      END,
      CASE
        WHEN v_idx <= 33 THEN CURRENT_DATE - INTERVAL '1 day'
        WHEN v_idx <= 85 THEN CURRENT_DATE - ((v_idx % 30) + 1 || ' days')::INTERVAL
        ELSE CURRENT_DATE + (((v_idx - 85) % 30) || ' days')::INTERVAL
      END,
      CASE WHEN v_idx > 33 AND v_idx <= 85 THEN true ELSE false END,  -- 52 completed
      CASE WHEN v_idx > 33 AND v_idx <= 85 THEN NOW() - ((v_idx % 15) || ' days')::INTERVAL ELSE NULL END,
      v_priority::priority_level,
      v_sales_id,
      v_opp_id,
      v_sales_id,
      NOW() - ((v_idx % 60 + 1) || ' days')::INTERVAL,
      NOW() - ((v_idx % 30) || ' days')::INTERVAL
    );

    v_task_count := v_task_count + 1;
  END LOOP;

  -- ============================================================================
  -- SNOOZED TASKS (10 tasks snoozed for various durations)
  -- ============================================================================
  -- Snooze 10 upcoming incomplete tasks
  WITH snoozeable AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM activities
    WHERE activity_type = 'task'
      AND subject LIKE '[RPT]%'
      AND completed = false
      AND due_date > CURRENT_DATE
    LIMIT 10
  )
  UPDATE activities SET
    snooze_until = CASE
      WHEN s.rn <= 3 THEN NOW() + INTERVAL '1 day'
      WHEN s.rn <= 6 THEN NOW() + INTERVAL '3 days'
      WHEN s.rn <= 8 THEN NOW() + INTERVAL '7 days'
      ELSE NOW() + INTERVAL '14 days'
    END
  FROM snoozeable s
  WHERE activities.id = s.id;

  -- ============================================================================
  -- PRODUCT-DISTRIBUTOR LINKS (~80 records)
  -- ============================================================================
  IF v_distributor_ids IS NOT NULL AND array_length(v_distributor_ids, 1) > 0 THEN
    FOR v_idx IN 1..80 LOOP
      v_product_id := v_product_ids[((v_idx - 1) % array_length(v_product_ids, 1)) + 1];

      BEGIN
        INSERT INTO product_distributors (
          product_id, distributor_id, vendor_item_number, status, notes,
          created_at, updated_at
        ) VALUES (
          v_product_id,
          v_distributor_ids[((v_idx - 1) % array_length(v_distributor_ids, 1)) + 1],
          CASE WHEN v_idx % 3 != 0 THEN 'VIN-' || LPAD(v_idx::TEXT, 5, '0') ELSE NULL END,
          (ARRAY['active', 'active', 'active', 'pending', 'inactive'])[((v_idx - 1) % 5) + 1],
          '[RPT] Product-distributor link #' || v_idx,
          NOW() - ((v_idx % 60) || ' days')::INTERVAL,
          NOW()
        );
      EXCEPTION WHEN unique_violation THEN
        -- Skip duplicate product-distributor combos
        NULL;
      END;
    END LOOP;
  END IF;

  -- ============================================================================
  -- PRODUCT STATUS VARIETY
  -- ============================================================================
  -- 5 discontinued products
  UPDATE products SET status = 'discontinued'::product_status
  WHERE id IN (
    SELECT id FROM products WHERE deleted_at IS NULL AND status = 'active'::product_status
    ORDER BY id LIMIT 5
  );

  -- 3 coming_soon products
  UPDATE products SET status = 'coming_soon'::product_status
  WHERE id IN (
    SELECT id FROM products WHERE deleted_at IS NULL AND status = 'active'::product_status
    ORDER BY id DESC LIMIT 3
  );

  -- ============================================================================
  -- NOTES (75 total: 30 contact + 30 opportunity + 15 organization)
  -- ============================================================================
  -- Contact notes (30)
  FOR v_idx IN 1..30 LOOP
    v_sales_id := v_sales_ids[((v_idx - 1) % array_length(v_sales_ids, 1)) + 1];
    v_days_ago := (v_idx * 3) % 90 + 1;

    INSERT INTO contact_notes (
      contact_id, text, sales_id, date, created_by, created_at, updated_at
    ) VALUES (
      ((v_idx - 1) % 80) + 1,  -- Spread across first 80 contacts
      '[RPT] Contact note #' || v_idx || ': '
        || (ARRAY[
          'Discussed pricing and delivery schedule for upcoming quarter.',
          'Met at trade show, interested in new product line.',
          'Requested samples of seasonal offerings.',
          'Follow-up needed on proposal sent last week.',
          'Budget approved for next fiscal year purchases.',
          'Prefers email communication, available Tue/Thu.',
          'Key decision maker for Midwest region.',
          'Mentioned competitor pricing is aggressive.',
          'Wants to schedule a tasting for the team.',
          'Positive feedback on recent delivery quality.'
        ])[((v_idx - 1) % 10) + 1],
      v_sales_id,
      (NOW() - (v_days_ago || ' days')::INTERVAL)::DATE,
      v_sales_id,
      NOW() - (v_days_ago || ' days')::INTERVAL,
      NOW() - ((v_days_ago - 1) || ' days')::INTERVAL
    );
  END LOOP;

  -- Opportunity notes (30)
  FOR v_idx IN 1..30 LOOP
    v_sales_id := v_sales_ids[((v_idx - 1) % array_length(v_sales_ids, 1)) + 1];
    v_days_ago := (v_idx * 3) % 60 + 1;

    SELECT id INTO v_opp_id FROM opportunities
    WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
    ORDER BY id
    OFFSET v_idx - 1 LIMIT 1;

    IF v_opp_id IS NOT NULL THEN
      INSERT INTO opportunity_notes (
        opportunity_id, text, sales_id, date, created_by, created_at, updated_at
      ) VALUES (
        v_opp_id,
        '[RPT] Opportunity note #' || v_idx || ': '
          || (ARRAY[
            'Pricing discussion went well, moving to next stage.',
            'Customer requested a revised proposal with volume discounts.',
            'Sample delivery confirmed for next week.',
            'Competitor undercutting by 10%, need strategy discussion.',
            'Decision expected by end of month.',
            'Key stakeholder on vacation until next Monday.',
            'Budget cycle resets in Q1, timing is critical.',
            'Strong relationship with chef, leverage for close.',
            'Need to involve distributor for logistics discussion.',
            'Follow-up scheduled after board meeting.'
          ])[((v_idx - 1) % 10) + 1],
        v_sales_id,
        (NOW() - (v_days_ago || ' days')::INTERVAL)::DATE,
        v_sales_id,
        NOW() - (v_days_ago || ' days')::INTERVAL,
        NOW() - ((v_days_ago - 1) || ' days')::INTERVAL
      );
    END IF;
  END LOOP;

  -- Organization notes (15) - NOTE: organization_notes has NO created_by column
  FOR v_idx IN 1..15 LOOP
    v_sales_id := v_sales_ids[((v_idx - 1) % array_length(v_sales_ids, 1)) + 1];
    v_days_ago := (v_idx * 5) % 90 + 1;

    INSERT INTO organization_notes (
      organization_id, text, sales_id, date, created_at, updated_at
    ) VALUES (
      v_principal_ids[((v_idx - 1) % 10) + 1],
      '[RPT] Organization note #' || v_idx || ': '
        || (ARRAY[
          'Annual review meeting scheduled for next month.',
          'New product line launching in Q2, need to prepare samples.',
          'Warehouse expansion may affect delivery routes.',
          'Key contact change: new VP of Purchasing started.',
          'Quality audit completed, all items passed.'
        ])[((v_idx - 1) % 5) + 1],
      v_sales_id,
      (NOW() - (v_days_ago || ' days')::INTERVAL)::DATE,
      NOW() - (v_days_ago || ' days')::INTERVAL,
      NOW() - ((v_days_ago - 1) || ' days')::INTERVAL
    );
  END LOOP;

  -- ============================================================================
  -- SOFT-DELETED RECORDS (for RLS testing)
  -- ============================================================================
  -- 3 soft-deleted opportunities
  UPDATE opportunities SET deleted_at = NOW()
  WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
    AND id IN (
      SELECT id FROM opportunities WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
      ORDER BY id DESC LIMIT 3
    );

  -- 3 soft-deleted products
  UPDATE products SET deleted_at = NOW()
  WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
    AND id IN (
      SELECT id FROM products WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
      ORDER BY id DESC LIMIT 3
    );

  -- 5 soft-deleted activities
  UPDATE activities SET deleted_at = NOW()
  WHERE subject LIKE '[RPT]%' AND deleted_at IS NULL AND activity_type = 'activity'
    AND id IN (
      SELECT id FROM activities WHERE subject LIKE '[RPT]%' AND deleted_at IS NULL AND activity_type = 'activity'
      ORDER BY id DESC LIMIT 5
    );

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'E2E SEED DATA ADDED SUCCESSFULLY';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '- Tags: 10 (with 36 contact assignments, 6 multi-tag)';
  RAISE NOTICE '- Opportunities: % (5 on_hold, 3 nurturing, 3 soft-deleted)', v_opp_count;
  RAISE NOTICE '- Opportunity-Product links: % (2 per opp)', v_opp_count * 2;
  RAISE NOTICE '- Activities: % (with contact_id on ~70%%, expanded types)', v_act_count;
  RAISE NOTICE '- Tasks: % (25 overdue, 8 today, 52 completed, 10 snoozed)', v_task_count;
  RAISE NOTICE '- Product-distributor links: ~80 (active/pending/inactive)';
  RAISE NOTICE '- Product statuses: 5 discontinued, 3 coming_soon';
  RAISE NOTICE '- Notes: 75 (30 contact + 30 opportunity + 15 organization)';
  RAISE NOTICE '- Soft-deleted: 3 opps + 3 products + 5 activities';
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================================
-- NOTIFICATIONS (5 types x all active sales reps)
-- ============================================================================
-- Dynamically fetch user_ids from sales table for all active reps
INSERT INTO notifications (user_id, type, message, entity_type, entity_id, read, created_at)
SELECT
  s.user_id,
  n.ntype,
  '[RPT] ' || n.msg,
  n.etype,
  n.eid,
  n.is_read,
  NOW() - (n.days_ago || ' days')::INTERVAL
FROM (VALUES
  ('task_overdue', 'Overdue: Follow up on pricing proposal', 'task', 1, false, 1),
  ('task_assigned', 'New task assigned: Schedule demo meeting', 'task', 2, false, 2),
  ('mention', 'You were mentioned in a note on Annasea deal', 'opportunity', 1, true, 3),
  ('opportunity_won', 'Deal closed! Great Lakes Q4 order confirmed', 'opportunity', 2, true, 5),
  ('opportunity_lost', 'Lost: Heartland competitive bid - review loss notes', 'opportunity', 3, true, 7)
) AS n(ntype, msg, etype, eid, is_read, days_ago)
CROSS JOIN (
  SELECT user_id FROM sales WHERE disabled = false AND deleted_at IS NULL
) s;

-- ============================================================================
-- RESET SEQUENCES
-- ============================================================================
SELECT setval('opportunities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM opportunities));
SELECT setval('activities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM activities));
SELECT setval('"contactNotes_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM contact_notes));
SELECT setval('"opportunityNotes_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM opportunity_notes));
SELECT setval('"organizationNotes_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM organization_notes));
SELECT setval('notifications_id_seq', (SELECT COALESCE(MAX(id), 1) FROM notifications));
SELECT setval('tags_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tags));

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify all data gaps are filled:
--
-- SELECT 'tags' as entity, COUNT(*) FROM tags WHERE deleted_at IS NULL
-- UNION ALL SELECT 'contact_notes', COUNT(*) FROM contact_notes WHERE text LIKE '[RPT]%'
-- UNION ALL SELECT 'opportunity_notes', COUNT(*) FROM opportunity_notes WHERE text LIKE '[RPT]%'
-- UNION ALL SELECT 'organization_notes', COUNT(*) FROM organization_notes WHERE text LIKE '[RPT]%'
-- UNION ALL SELECT 'product_distributors', COUNT(*) FROM product_distributors WHERE notes LIKE '[RPT]%'
-- UNION ALL SELECT 'snoozed_tasks', COUNT(*) FROM activities WHERE snooze_until IS NOT NULL AND subject LIKE '[RPT]%'
-- UNION ALL SELECT 'soft_deleted_opps', COUNT(*) FROM opportunities WHERE name LIKE '[RPT]%' AND deleted_at IS NOT NULL
-- UNION ALL SELECT 'on_hold_opps', COUNT(*) FROM opportunities WHERE status = 'on_hold' AND name LIKE '[RPT]%'
-- UNION ALL SELECT 'nurturing_opps', COUNT(*) FROM opportunities WHERE status = 'nurturing' AND name LIKE '[RPT]%'
-- UNION ALL SELECT 'discontinued_products', COUNT(*) FROM products WHERE status = 'discontinued'
-- UNION ALL SELECT 'coming_soon_products', COUNT(*) FROM products WHERE status = 'coming_soon'
-- UNION ALL SELECT 'activities_with_contact', COUNT(*) FROM activities WHERE contact_id IS NOT NULL AND subject LIKE '[RPT]%'
-- UNION ALL SELECT 'sample_with_status', COUNT(*) FROM activities WHERE sample_status IS NOT NULL AND subject LIKE '[RPT]%'
-- UNION ALL SELECT 'notifications', COUNT(*) FROM notifications WHERE message LIKE '[RPT]%'
-- UNION ALL SELECT 'rpt_opportunities', COUNT(*) FROM opportunities WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
-- UNION ALL SELECT 'rpt_activities', COUNT(*) FROM activities WHERE subject LIKE '[RPT]%' AND deleted_at IS NULL AND activity_type = 'activity'
-- UNION ALL SELECT 'rpt_tasks', COUNT(*) FROM activities WHERE subject LIKE '[RPT]%' AND activity_type = 'task'
-- ORDER BY entity;
