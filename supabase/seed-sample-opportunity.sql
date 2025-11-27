-- ============================================================================
-- SAMPLE OPPORTUNITY WITH FULL DATA
-- ============================================================================
-- This seed script creates a comprehensive sample opportunity demonstrating:
--   - All 3 organization types (customer, principal, distributor)
--   - Junction records for contacts (opportunity_contacts)
--   - Junction records for products (opportunity_products)
--   - Associated notes (opportunityNotes)
--
-- USAGE: Run after main seed.sql or append to it
--   psql <connection> -f supabase/seed-sample-opportunity.sql
--
-- PREREQUISITES:
--   - Organizations exist: IDs 6 (customer), 1802 (principal), 9 (distributor)
--   - Products exist: IDs 1-5 (from Rapid Rasoi catalog)
--   - Contacts exist: IDs 1-5 (from main seed data)
--   - Sales user exists (for opportunity_owner_id and notes.sales_id)
-- ============================================================================

BEGIN;

-- ============================================================================
-- Get the sales_id for the admin user (created by main seed.sql)
-- ============================================================================
DO $$
DECLARE
  v_sales_id BIGINT;
  v_opportunity_id BIGINT;
BEGIN
  -- Get existing admin sales record
  SELECT id INTO v_sales_id
  FROM sales
  WHERE user_id = 'd3129876-b1fe-40eb-9980-64f5f73c64d6';

  IF v_sales_id IS NULL THEN
    RAISE EXCEPTION 'Admin sales record not found. Run main seed.sql first.';
  END IF;

  -- ============================================================================
  -- CREATE COMPREHENSIVE SAMPLE OPPORTUNITY
  -- ============================================================================
  -- This opportunity demonstrates the full tri-party relationship:
  --   - Customer: 8 hospitality group (ID 6) - multi-location restaurant group
  --   - Principal: Rapid Rasoi (ID 1802) - Indian food manufacturer
  --   - Distributor: A & G FOODSERVICE (ID 9) - Chicago distributor
  -- ============================================================================

  INSERT INTO opportunities (
    name,
    description,
    stage,
    status,
    priority,
    estimated_close_date,
    actual_close_date,
    customer_organization_id,
    principal_organization_id,
    distributor_organization_id,
    opportunity_owner_id,
    account_manager_id,
    lead_source,
    next_action,
    next_action_date,
    competition,
    decision_criteria,
    campaign,
    notes,
    contact_ids,
    tags,
    created_at,
    updated_at
  ) VALUES (
    'Hubbard Inn Indian Menu Launch - Q1 2025',
    E'Multi-location rollout of new Indian fusion menu items across 8 Hospitality Group properties.\n\nScope:\n- Hubbard Inn (flagship)\n- MASQ\n- Joy District\n- Parlay\n\nKey products: Tikka Gravy Base, Makhani Sauce, Tandoori Marinade\n\nVolume estimate: 200+ cases/month across all locations.',
    'demo_scheduled',
    'active',
    'critical',
    CURRENT_DATE + INTERVAL '45 days',
    NULL,  -- not closed yet
    6,     -- Customer: 8 hospitality group
    1802,  -- Principal: Rapid Rasoi
    9,     -- Distributor: A & G FOODSERVICE
    v_sales_id,
    v_sales_id,
    'trade_show',
    'Confirm chef demo date with Executive Chef',
    CURRENT_DATE + INTERVAL '3 days',
    'House-made bases, Sysco Indian line',
    E'1. Flavor consistency across locations\n2. Shelf life (minimum 90 days)\n3. Competitive pricing vs house-made\n4. Training/support provided',
    'NRA Show 2024 Follow-up',
    E'Met at NRA Show booth. Executive Chef Sarah loved our Tikka samples.\nMulti-brand rollout potential - could expand to Joy, MASQ, Parlay locations.\nDistributor A&G already services their accounts.',
    ARRAY[]::bigint[],  -- Will be populated via junction table
    ARRAY['hot-lead', 'multi-location', 'q1-priority'],
    NOW() - INTERVAL '14 days',
    NOW()
  )
  RETURNING id INTO v_opportunity_id;

  RAISE NOTICE 'Created opportunity ID: %', v_opportunity_id;

  -- ============================================================================
  -- OPPORTUNITY CONTACTS (Junction Table)
  -- ============================================================================
  -- Links contacts to opportunity with roles and metadata
  -- Using contacts from existing seed data (adjust IDs as needed)
  -- ============================================================================

  INSERT INTO opportunity_contacts (
    opportunity_id,
    contact_id,
    role,
    is_primary,
    notes,
    created_at
  ) VALUES
    -- Primary decision maker
    (v_opportunity_id, 1, 'Decision Maker', true,
     'Executive Chef - final approval on all menu items', NOW()),

    -- Influencer
    (v_opportunity_id, 2, 'Influencer', false,
     'Sous Chef - will conduct kitchen trials', NOW()),

    -- Purchasing
    (v_opportunity_id, 3, 'Purchasing', false,
     'Handles all vendor contracts and pricing negotiations', NOW()),

    -- Operations
    (v_opportunity_id, 4, 'Operations', false,
     'Manages distribution logistics across locations', NOW()),

    -- Distributor contact
    (v_opportunity_id, 5, 'Distributor Rep', false,
     'A&G sales rep - coordinate delivery schedule', NOW());

  RAISE NOTICE 'Created 5 opportunity_contacts records';

  -- ============================================================================
  -- OPPORTUNITY PRODUCTS (Junction Table)
  -- ============================================================================
  -- Links products to opportunity with denormalized names for performance
  -- Using Rapid Rasoi products (IDs 1-17 from main seed)
  -- ============================================================================

  INSERT INTO opportunity_products (
    opportunity_id,
    product_id_reference,
    product_name,
    product_category,
    notes,
    created_at,
    updated_at
  ) VALUES
    -- Primary products being pitched
    (v_opportunity_id, 6, 'Delhi Tikka Gravy Base', 'sauces_condiments',
     'Main product for tikka menu items - chef favorite from samples', NOW(), NOW()),

    (v_opportunity_id, 9, 'Makhani Gravy Base', 'sauces_condiments',
     'For butter chicken and paneer makhani - high margin item', NOW(), NOW()),

    (v_opportunity_id, 11, 'Tandoori Marination', 'spices_seasonings',
     'Requested for tandoori chicken and paneer tikka', NOW(), NOW()),

    -- Secondary products (add-on opportunities)
    (v_opportunity_id, 10, 'Biryani Mix', 'spices_seasonings',
     'Potential add-on for catering menu', NOW(), NOW()),

    (v_opportunity_id, 8, 'Korma Gravy Base', 'sauces_condiments',
     'Mild option requested for vegetarian korma dish', NOW(), NOW());

  RAISE NOTICE 'Created 5 opportunity_products records';

  -- ============================================================================
  -- OPPORTUNITY NOTES (opportunityNotes Table)
  -- ============================================================================
  -- Activity notes tracking the sales conversation history
  -- ============================================================================

  INSERT INTO "opportunityNotes" (
    opportunity_id,
    text,
    sales_id,
    date,
    created_at,
    updated_at
  ) VALUES
    -- Initial contact note
    (v_opportunity_id,
     E'Met Executive Chef Sarah at NRA Show booth. Very impressed with our Tikka and Makhani samples.\n\nKey points discussed:\n- Currently making sauces in-house but consistency is an issue\n- Expanding Indian fusion items across all 4 locations\n- Looking for a single-source solution\n\nAction: Send product specs and pricing by EOW.',
     v_sales_id,
     NOW() - INTERVAL '14 days',
     NOW() - INTERVAL '14 days',
     NOW() - INTERVAL '14 days'),

    -- Follow-up call
    (v_opportunity_id,
     E'Follow-up call with Sarah and Purchasing Manager Mike.\n\nDiscussed:\n- Volume estimates: 50 cases/month per location (200 total)\n- Pricing structure for volume commitment\n- A&G can handle distribution (already their vendor)\n\nCompetition: They also got samples from Sysco Indian line.\n\nNext: Schedule on-site demo at Hubbard Inn kitchen.',
     v_sales_id,
     NOW() - INTERVAL '10 days',
     NOW() - INTERVAL '10 days',
     NOW() - INTERVAL '10 days'),

    -- Sample delivery
    (v_opportunity_id,
     E'Delivered full sample kit to Hubbard Inn:\n- 2 cases Tikka Gravy Base\n- 2 cases Makhani Gravy Base\n- 1 case Tandoori Marinade\n- 1 case Korma Base\n\nSarah will test over next week with kitchen staff.\nScheduled demo for next Tuesday 10am.',
     v_sales_id,
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '5 days'),

    -- Recent update
    (v_opportunity_id,
     E'Quick check-in call. Sarah says kitchen team loves the Tikka base - "best consistency they''ve ever seen."\n\nMakhani getting good feedback too. Some staff prefer our version over house-made.\n\nDemo still on for Tuesday. She''s inviting the GM from Joy location to observe.\n\nThis could be bigger than expected!',
     v_sales_id,
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '2 days');

  RAISE NOTICE 'Created 4 opportunityNotes records';

  -- ============================================================================
  -- UPDATE contact_ids ARRAY (denormalized for quick access)
  -- ============================================================================
  -- The opportunities table has a contact_ids array for denormalized access
  -- This should match the junction table records

  UPDATE opportunities
  SET contact_ids = ARRAY[1, 2, 3, 4, 5]::bigint[]
  WHERE id = v_opportunity_id;

  RAISE NOTICE 'Updated contact_ids array on opportunity';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to validate)
-- ============================================================================

-- Check the created opportunity
-- SELECT o.id, o.name, o.stage, o.priority,
--        cust.name AS customer, prin.name AS principal, dist.name AS distributor
-- FROM opportunities o
-- JOIN organizations cust ON o.customer_organization_id = cust.id
-- JOIN organizations prin ON o.principal_organization_id = prin.id
-- LEFT JOIN organizations dist ON o.distributor_organization_id = dist.id
-- WHERE o.name LIKE 'Hubbard Inn%';

-- Check opportunity contacts
-- SELECT oc.*, c.first_name, c.last_name
-- FROM opportunity_contacts oc
-- JOIN contacts c ON oc.contact_id = c.id
-- WHERE oc.opportunity_id = (SELECT id FROM opportunities WHERE name LIKE 'Hubbard Inn%' LIMIT 1);

-- Check opportunity products
-- SELECT op.*, p.sku
-- FROM opportunity_products op
-- JOIN products p ON op.product_id_reference = p.id
-- WHERE op.opportunity_id = (SELECT id FROM opportunities WHERE name LIKE 'Hubbard Inn%' LIMIT 1);

-- Check opportunity notes
-- SELECT * FROM "opportunityNotes"
-- WHERE opportunity_id = (SELECT id FROM opportunities WHERE name LIKE 'Hubbard Inn%' LIMIT 1)
-- ORDER BY date DESC;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- Expected results after running this script:
--   - 1 opportunity with all 3 org types populated
--   - 5 opportunity_contacts junction records (with roles)
--   - 5 opportunity_products junction records (with notes)
--   - 4 opportunityNotes records (conversation history)
-- ============================================================================
