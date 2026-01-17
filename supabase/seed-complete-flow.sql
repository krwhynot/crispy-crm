-- ============================================================================
-- COMPLETE DATA FLOW SEED DATA
-- ============================================================================
-- Purpose: Creates programmatic test data covering full business flow
--          Principal -> Distributor -> Customer -> Opportunity -> Closed Won
--
-- Run AFTER: npx supabase db reset (which runs seed.sql)
-- Run WITH: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seed-complete-flow.sql
--
-- Data Model (HIGH IDs to avoid conflicts):
--   Organizations: 10001-10003 (Principal, Distributor, Customer)
--   Products: 1001-1006 (6 products from Principal)
--   Contact: 10001 (Executive Chef at Customer)
--   Opportunity: 10001 (Full sales cycle, closed_won)
--   Activities: 8 records showing 75-day progression
--   Tasks: 5 records (3 completed, 2 pending)
--   Notes: Contact notes (2), Opportunity notes (3), Organization notes (2)
--   Tags: 5 tags for tracking progression
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: Validate Prerequisites
-- ============================================================================
DO $$
DECLARE
    v_sales_id BIGINT;
BEGIN
    -- Get admin user's sales_id for created_by references
    SELECT id INTO v_sales_id FROM sales WHERE email = 'admin@test.com' LIMIT 1;

    IF v_sales_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Run "npx supabase db reset" first to create seed users.';
    END IF;

    RAISE NOTICE 'Using sales_id: % for created_by references', v_sales_id;
END $$;

-- ============================================================================
-- PHASE 2: Organizations (Principal, Distributor, Customer)
-- ============================================================================
-- Note: Using OVERRIDING SYSTEM VALUE for IDENTITY columns

-- 10001: Principal (Manufacturer)
INSERT INTO organizations (id, name, organization_type, city, state, priority, notes, created_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES (
    10001,
    'Acme Food Manufacturing',
    'principal',
    'Chicago',
    'IL',
    'A',
    'Premium condiment manufacturer. Strong presence in Midwest.',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    organization_type = EXCLUDED.organization_type,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    priority = EXCLUDED.priority,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- 10002: Distributor
INSERT INTO organizations (id, name, organization_type, city, state, priority, created_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES (
    10002,
    'Metro Foodservice Distribution',
    'distributor',
    'Grand Rapids',
    'MI',
    'B',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    organization_type = EXCLUDED.organization_type,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    priority = EXCLUDED.priority,
    updated_at = NOW();

-- 10003: Customer (Restaurant)
INSERT INTO organizations (id, name, organization_type, city, state, priority, notes, created_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES (
    10003,
    'Riverfront Grill & Bar',
    'customer',
    'Kalamazoo',
    'MI',
    'A',
    'Popular waterfront restaurant. High volume during summer season.',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    organization_type = EXCLUDED.organization_type,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    priority = EXCLUDED.priority,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- ============================================================================
-- PHASE 3: Products (6 products from Principal)
-- ============================================================================

INSERT INTO products (id, principal_id, name, description, manufacturer_part_number, category, status, created_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
    (1001, 10001, 'BBQ Sauce Classic', 'Our signature smoky BBQ sauce with a perfect balance of sweet and tangy', 'ACME-BBQ-001', 'condiments', 'active', NOW(), NOW()),
    (1002, 10001, 'Chipotle Sauce', 'Spicy chipotle pepper sauce with smoky undertones', 'ACME-CHP-002', 'condiments', 'active', NOW(), NOW()),
    (1003, 10001, 'Honey Mustard', 'Sweet and tangy honey mustard dressing', 'ACME-HM-003', 'condiments', 'active', NOW(), NOW()),
    (1004, 10001, 'Ranch Dressing', 'Creamy buttermilk ranch dressing', 'ACME-RCH-004', 'condiments', 'active', NOW(), NOW()),
    (1005, 10001, 'Cajun Spice Blend', 'Authentic Louisiana-style cajun seasoning', 'ACME-CAJ-005', 'spices_seasonings', 'active', NOW(), NOW()),
    (1006, 10001, 'Garlic Herb Rub', 'Mediterranean-inspired garlic and herb seasoning', 'ACME-GHR-006', 'spices_seasonings', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    principal_id = EXCLUDED.principal_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    manufacturer_part_number = EXCLUDED.manufacturer_part_number,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ============================================================================
-- PHASE 4: Distributor Authorization (Principal <-> Distributor)
-- ============================================================================
-- Metro Foodservice is authorized to sell Acme products

INSERT INTO distributor_principal_authorizations (distributor_id, principal_id, is_authorized, authorization_date, created_at, updated_at)
VALUES (
    10002,  -- Metro Foodservice Distribution
    10001,  -- Acme Food Manufacturing
    true,
    '2025-01-01',
    NOW(),
    NOW()
) ON CONFLICT (distributor_id, principal_id) DO UPDATE SET
    is_authorized = EXCLUDED.is_authorized,
    authorization_date = EXCLUDED.authorization_date,
    updated_at = NOW();

-- ============================================================================
-- PHASE 5: Organization-Distributor Link (Customer <-> Distributor)
-- ============================================================================
-- Riverfront Grill buys from Metro Foodservice

INSERT INTO organization_distributors (organization_id, distributor_id, is_primary, created_at, updated_at)
VALUES (
    10003,  -- Riverfront Grill & Bar (customer)
    10002,  -- Metro Foodservice Distribution (distributor)
    true,
    NOW(),
    NOW()
) ON CONFLICT (organization_id, distributor_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    updated_at = NOW();

-- ============================================================================
-- PHASE 6: Contact (Decision maker at Customer)
-- ============================================================================

INSERT INTO contacts (id, name, first_name, last_name, title, organization_id, email, phone, created_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES (
    10001,
    'Marcus Chen',
    'Marcus',
    'Chen',
    'Executive Chef',
    10003,  -- Riverfront Grill & Bar
    '[{"type": "work", "email": "marcus@riverfrontgrill.com"}]'::jsonb,
    '[{"type": "work", "number": "269-555-1234"}]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    title = EXCLUDED.title,
    organization_id = EXCLUDED.organization_id,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- ============================================================================
-- PHASE 7: Contact Notes
-- ============================================================================

DO $$
DECLARE
    v_sales_id BIGINT;
BEGIN
    SELECT id INTO v_sales_id FROM sales WHERE email = 'admin@test.com' LIMIT 1;

    -- Contact Note 1
    INSERT INTO "contactNotes" (contact_id, text, sales_id, date, created_at, updated_at)
    VALUES (
        10001,
        'Met at Grand Rapids Food Show 2025. Very interested in new BBQ line.',
        v_sales_id,
        NOW() - INTERVAL '75 days',
        NOW() - INTERVAL '75 days',
        NOW() - INTERVAL '75 days'
    );

    -- Contact Note 2
    INSERT INTO "contactNotes" (contact_id, text, sales_id, date, created_at, updated_at)
    VALUES (
        10001,
        'Follow-up call scheduled. Marcus wants to try samples in new summer menu.',
        v_sales_id,
        NOW() - INTERVAL '70 days',
        NOW() - INTERVAL '70 days',
        NOW() - INTERVAL '70 days'
    );
END $$;

-- ============================================================================
-- PHASE 8: Tags (for tracking progression)
-- ============================================================================

INSERT INTO tags (id, name, color, description, created_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'hot-lead', 'red-500', 'High priority lead requiring immediate attention', NOW(), NOW()),
    (2, 'trade-show', 'blue-500', 'Lead originated from trade show', NOW(), NOW()),
    (3, 'sample-sent', 'yellow-500', 'Product samples have been sent', NOW(), NOW()),
    (4, 'demo-completed', 'green-500', 'On-site demo has been completed', NOW(), NOW()),
    (5, 'closed-won', 'purple-500', 'Deal successfully closed', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- PHASE 9: Opportunity (Full sales cycle)
-- ============================================================================

DO $$
DECLARE
    v_sales_id BIGINT;
BEGIN
    SELECT id INTO v_sales_id FROM sales WHERE email = 'admin@test.com' LIMIT 1;

    INSERT INTO opportunities (id, name, description, stage, status, priority, customer_organization_id, principal_organization_id, distributor_organization_id, estimated_close_date, actual_close_date, lead_source, opportunity_owner_id, created_by, created_at, updated_at)
    OVERRIDING SYSTEM VALUE
    VALUES (
        10001,
        'BBQ Sauce Program - Riverfront Grill',
        'Full BBQ sauce product line rollout for summer menu featuring BBQ Classic and Chipotle sauces',
        'closed_won',
        'active',
        'high',
        10003,  -- Riverfront Grill & Bar (customer)
        10001,  -- Acme Food Manufacturing (principal)
        10002,  -- Metro Foodservice Distribution (distributor)
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '5 days',
        'trade_show',
        v_sales_id,
        v_sales_id,
        NOW() - INTERVAL '75 days',
        NOW() - INTERVAL '5 days'
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        stage = EXCLUDED.stage,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        customer_organization_id = EXCLUDED.customer_organization_id,
        principal_organization_id = EXCLUDED.principal_organization_id,
        distributor_organization_id = EXCLUDED.distributor_organization_id,
        estimated_close_date = EXCLUDED.estimated_close_date,
        actual_close_date = EXCLUDED.actual_close_date,
        lead_source = EXCLUDED.lead_source,
        opportunity_owner_id = EXCLUDED.opportunity_owner_id,
        updated_at = NOW();
END $$;

-- ============================================================================
-- PHASE 10: Opportunity Contacts (Junction table)
-- ============================================================================

INSERT INTO opportunity_contacts (opportunity_id, contact_id, role, is_primary, notes, created_at)
VALUES (
    10001,
    10001,
    'Decision Maker',
    true,
    'Primary contact and decision maker for all food purchases',
    NOW()
) ON CONFLICT (opportunity_id, contact_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_primary = EXCLUDED.is_primary,
    notes = EXCLUDED.notes;

-- ============================================================================
-- PHASE 11: Opportunity Products
-- ============================================================================

INSERT INTO opportunity_products (opportunity_id, product_id_reference, product_name, product_category, notes, created_at, updated_at)
VALUES
    (10001, 1001, 'BBQ Sauce Classic', 'condiments', 'Primary product - featured on summer menu', NOW(), NOW()),
    (10001, 1002, 'Chipotle Sauce', 'condiments', 'Secondary product - for spicy menu items', NOW(), NOW())
ON CONFLICT (opportunity_id, product_id_reference) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    product_category = EXCLUDED.product_category,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- ============================================================================
-- PHASE 12: Activities (8 activities showing 75-day progression)
-- ============================================================================

DO $$
DECLARE
    v_sales_id BIGINT;
BEGIN
    SELECT id INTO v_sales_id FROM sales WHERE email = 'admin@test.com' LIMIT 1;

    -- Activity 1: Trade Show Introduction (Day 1)
    INSERT INTO activities (activity_type, type, subject, description, activity_date, contact_id, organization_id, opportunity_id, outcome, created_by, created_at, updated_at)
    VALUES (
        'engagement',
        'trade_show',
        'Trade Show Introduction',
        'Initial meeting with Marcus Chen at Grand Rapids Food Show 2025. Very interested in our BBQ sauce line for their summer menu refresh.',
        NOW() - INTERVAL '75 days',
        10001,
        10003,
        NULL,  -- engagement doesn't require opportunity_id
        'Scheduled follow-up call',
        v_sales_id,
        NOW() - INTERVAL '75 days',
        NOW() - INTERVAL '75 days'
    );

    -- Activity 2: Follow-up Call (Day 5)
    INSERT INTO activities (activity_type, type, subject, description, activity_date, duration_minutes, contact_id, organization_id, opportunity_id, sentiment, outcome, created_by, created_at, updated_at)
    VALUES (
        'interaction',
        'call',
        'Follow-up from trade show',
        'Discussed product line details and pricing structure. Marcus confirmed interest in BBQ Classic and Chipotle sauces.',
        NOW() - INTERVAL '70 days',
        25,
        10001,
        10003,
        10001,
        'positive',
        'Sample kit requested',
        v_sales_id,
        NOW() - INTERVAL '70 days',
        NOW() - INTERVAL '70 days'
    );

    -- Activity 3: Sample Delivery (Day 15)
    INSERT INTO activities (activity_type, type, subject, description, activity_date, contact_id, organization_id, opportunity_id, outcome, created_by, created_at, updated_at)
    VALUES (
        'interaction',
        'meeting',
        'Sample delivery - BBQ and Chipotle sauces',
        'Delivered sample kit including BBQ Classic, Chipotle Sauce, and recipe suggestions. Kitchen team will test over next 2 weeks.',
        NOW() - INTERVAL '60 days',
        10001,
        10003,
        10001,
        'Samples delivered successfully',
        v_sales_id,
        NOW() - INTERVAL '60 days',
        NOW() - INTERVAL '60 days'
    );

    -- Activity 4: Feedback Call (Day 30)
    INSERT INTO activities (activity_type, type, subject, description, activity_date, duration_minutes, contact_id, organization_id, opportunity_id, sentiment, outcome, created_by, created_at, updated_at)
    VALUES (
        'interaction',
        'call',
        'Sample feedback discussion',
        'Marcus loved the BBQ sauce - perfect consistency for their pulled pork sandwiches. Chipotle sauce also a hit with the kitchen staff.',
        NOW() - INTERVAL '45 days',
        30,
        10001,
        10003,
        10001,
        'positive',
        'Positive feedback on BBQ sauce. Wants to feature on summer menu.',
        v_sales_id,
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '45 days'
    );

    -- Activity 5: Demo at Restaurant (Day 45)
    INSERT INTO activities (activity_type, type, subject, description, activity_date, duration_minutes, contact_id, organization_id, opportunity_id, location, outcome, created_by, created_at, updated_at)
    VALUES (
        'interaction',
        'demo',
        'On-site product demo',
        'Conducted full product demo in Riverfront Grill kitchen. Demonstrated proper application techniques and serving suggestions.',
        NOW() - INTERVAL '30 days',
        90,
        10001,
        10003,
        10001,
        'Riverfront Grill & Bar - Kitchen',
        'Demo successful - moving to pricing discussion',
        v_sales_id,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '30 days'
    );

    -- Activity 6: Pricing Discussion (Day 55)
    INSERT INTO activities (activity_type, type, subject, description, activity_date, contact_id, organization_id, opportunity_id, outcome, created_by, created_at, updated_at)
    VALUES (
        'interaction',
        'email',
        'Pricing proposal sent',
        'Sent detailed pricing proposal for initial order through Metro Foodservice. Volume discount applied for 50+ case order.',
        NOW() - INTERVAL '20 days',
        10001,
        10003,
        10001,
        'Awaiting review - follow up in 5 days',
        v_sales_id,
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '20 days'
    );

    -- Activity 7: Final Negotiation (Day 65)
    INSERT INTO activities (activity_type, type, subject, description, activity_date, duration_minutes, contact_id, organization_id, opportunity_id, sentiment, outcome, created_by, created_at, updated_at)
    VALUES (
        'interaction',
        'call',
        'Final terms discussion',
        'Finalized pricing and delivery schedule. Marcus confirmed order will go through Metro Foodservice for monthly delivery starting next week.',
        NOW() - INTERVAL '10 days',
        20,
        10001,
        10003,
        10001,
        'positive',
        'Terms agreed - PO expected this week',
        v_sales_id,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '10 days'
    );

    -- Activity 8: Closed Won (Day 70)
    INSERT INTO activities (activity_type, type, subject, description, activity_date, contact_id, organization_id, opportunity_id, sentiment, outcome, created_by, created_at, updated_at)
    VALUES (
        'interaction',
        'email',
        'Purchase order received',
        'Received official PO from Riverfront Grill via Metro Foodservice. Initial order: 30 cases BBQ Classic, 20 cases Chipotle Sauce.',
        NOW() - INTERVAL '5 days',
        10001,
        10003,
        10001,
        'positive',
        'Deal closed - initial order placed. Reorder expected monthly.',
        v_sales_id,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
    );
END $$;

-- ============================================================================
-- PHASE 13: Tasks (5 tasks - 3 completed, 2 pending)
-- ============================================================================

DO $$
DECLARE
    v_sales_id BIGINT;
BEGIN
    SELECT id INTO v_sales_id FROM sales WHERE email = 'admin@test.com' LIMIT 1;

    -- Task 1: Send sample kit (COMPLETED)
    INSERT INTO tasks (title, description, due_date, completed, completed_at, priority, contact_id, opportunity_id, sales_id, type, created_at, updated_at)
    VALUES (
        'Send sample kit',
        'Prepare and ship sample kit with BBQ Classic and Chipotle Sauce',
        (NOW() - INTERVAL '65 days')::date,
        true,
        NOW() - INTERVAL '60 days',
        'high',
        10001,
        10001,
        v_sales_id,
        'Follow-up',
        NOW() - INTERVAL '70 days',
        NOW() - INTERVAL '60 days'
    );

    -- Task 2: Schedule demo visit (COMPLETED)
    INSERT INTO tasks (title, description, due_date, completed, completed_at, priority, contact_id, opportunity_id, sales_id, type, created_at, updated_at)
    VALUES (
        'Schedule demo visit',
        'Coordinate on-site demo with Marcus at Riverfront Grill kitchen',
        (NOW() - INTERVAL '35 days')::date,
        true,
        NOW() - INTERVAL '30 days',
        'high',
        10001,
        10001,
        v_sales_id,
        'Meeting',
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '30 days'
    );

    -- Task 3: Send pricing proposal (COMPLETED)
    INSERT INTO tasks (title, description, due_date, completed, completed_at, priority, contact_id, opportunity_id, sales_id, type, created_at, updated_at)
    VALUES (
        'Send pricing proposal',
        'Prepare and send detailed pricing proposal with volume discounts',
        (NOW() - INTERVAL '22 days')::date,
        true,
        NOW() - INTERVAL '20 days',
        'medium',
        10001,
        10001,
        v_sales_id,
        'Proposal',
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '20 days'
    );

    -- Task 4: Q2 check-in call (PENDING - future)
    INSERT INTO tasks (title, description, due_date, completed, priority, contact_id, opportunity_id, sales_id, type, created_at, updated_at)
    VALUES (
        'Q2 check-in call',
        'Quarterly check-in to discuss reorder volume and satisfaction',
        (NOW() + INTERVAL '30 days')::date,
        false,
        'medium',
        10001,
        10001,
        v_sales_id,
        'Call',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
    );

    -- Task 5: Discuss expanded product line (PENDING - future)
    INSERT INTO tasks (title, description, due_date, completed, priority, contact_id, opportunity_id, sales_id, type, created_at, updated_at)
    VALUES (
        'Discuss expanded product line',
        'Present Honey Mustard and Ranch Dressing options for fall menu',
        (NOW() + INTERVAL '60 days')::date,
        false,
        'low',
        10001,
        10001,
        v_sales_id,
        'Meeting',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
    );
END $$;

-- ============================================================================
-- PHASE 14: Opportunity Notes
-- ============================================================================

DO $$
DECLARE
    v_sales_id BIGINT;
BEGIN
    SELECT id INTO v_sales_id FROM sales WHERE email = 'admin@test.com' LIMIT 1;

    -- Note 1
    INSERT INTO "opportunityNotes" (opportunity_id, text, sales_id, date, created_at, updated_at)
    VALUES (
        10001,
        'Marcus loved the BBQ sauce. Wants to feature it prominently on their new summer menu alongside pulled pork sandwiches.',
        v_sales_id,
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '45 days'
    );

    -- Note 2
    INSERT INTO "opportunityNotes" (opportunity_id, text, sales_id, date, created_at, updated_at)
    VALUES (
        10001,
        'Metro Foodservice confirmed they can handle the volume. Good regional coverage in western Michigan.',
        v_sales_id,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    );

    -- Note 3
    INSERT INTO "opportunityNotes" (opportunity_id, text, sales_id, date, created_at, updated_at)
    VALUES (
        10001,
        'Deal closed! Initial order 50 cases (30 BBQ Classic, 20 Chipotle). Reorder expected monthly based on summer volume projections.',
        v_sales_id,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
    );
END $$;

-- ============================================================================
-- PHASE 15: Organization Notes
-- ============================================================================

DO $$
DECLARE
    v_sales_id BIGINT;
BEGIN
    SELECT id INTO v_sales_id FROM sales WHERE email = 'admin@test.com' LIMIT 1;

    -- Note for Acme (Principal)
    INSERT INTO "organizationNotes" (organization_id, text, sales_id, date, created_at, updated_at)
    VALUES (
        10001,
        'Premium condiment manufacturer based in Chicago. Strong presence in Midwest market. Key products include BBQ sauces, hot sauces, and spice blends.',
        v_sales_id,
        NOW() - INTERVAL '90 days',
        NOW() - INTERVAL '90 days',
        NOW() - INTERVAL '90 days'
    );

    -- Note for Riverfront (Customer)
    INSERT INTO "organizationNotes" (organization_id, text, sales_id, date, created_at, updated_at)
    VALUES (
        10003,
        'Popular waterfront restaurant in Kalamazoo. High volume during summer season (May-September). Known for BBQ and American cuisine.',
        v_sales_id,
        NOW() - INTERVAL '75 days',
        NOW() - INTERVAL '75 days',
        NOW() - INTERVAL '75 days'
    );
END $$;

-- ============================================================================
-- PHASE 16: Reset Sequences (avoid ID conflicts with future inserts)
-- ============================================================================

SELECT setval('organizations_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM organizations), 10010), true);
SELECT setval('contacts_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM contacts), 10010), true);
SELECT setval('products_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM products), 1010), true);
SELECT setval('opportunities_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM opportunities), 10010), true);
SELECT setval('tags_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM tags), 10), true);
SELECT setval('activities_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM activities), 10020), true);
SELECT setval('tasks_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM tasks), 10010), true);
SELECT setval('"contactNotes_id_seq"', GREATEST((SELECT COALESCE(MAX(id), 0) FROM "contactNotes"), 10010), true);
SELECT setval('"opportunityNotes_id_seq"', GREATEST((SELECT COALESCE(MAX(id), 0) FROM "opportunityNotes"), 10010), true);
SELECT setval('"organizationNotes_id_seq"', GREATEST((SELECT COALESCE(MAX(id), 0) FROM "organizationNotes"), 10010), true);

-- ============================================================================
-- PHASE 17: Verification
-- ============================================================================

DO $$
DECLARE
    v_org_count INTEGER;
    v_product_count INTEGER;
    v_contact_count INTEGER;
    v_opp_stage TEXT;
    v_activity_count INTEGER;
    v_task_count INTEGER;
    v_contact_note_count INTEGER;
    v_opp_note_count INTEGER;
    v_org_note_count INTEGER;
    v_tag_count INTEGER;
BEGIN
    -- Count organizations created
    SELECT COUNT(*) INTO v_org_count FROM organizations WHERE id IN (10001, 10002, 10003);

    -- Count products created
    SELECT COUNT(*) INTO v_product_count FROM products WHERE principal_id = 10001;

    -- Check contact
    SELECT COUNT(*) INTO v_contact_count FROM contacts WHERE id = 10001;

    -- Check opportunity stage
    SELECT stage::TEXT INTO v_opp_stage FROM opportunities WHERE id = 10001;

    -- Count activities for this opportunity
    SELECT COUNT(*) INTO v_activity_count FROM activities WHERE opportunity_id = 10001 OR (contact_id = 10001 AND opportunity_id IS NULL);

    -- Count tasks for this opportunity
    SELECT COUNT(*) INTO v_task_count FROM tasks WHERE opportunity_id = 10001;

    -- Count notes
    SELECT COUNT(*) INTO v_contact_note_count FROM "contactNotes" WHERE contact_id = 10001;
    SELECT COUNT(*) INTO v_opp_note_count FROM "opportunityNotes" WHERE opportunity_id = 10001;
    SELECT COUNT(*) INTO v_org_note_count FROM "organizationNotes" WHERE organization_id IN (10001, 10003);

    -- Count tags
    SELECT COUNT(*) INTO v_tag_count FROM tags WHERE id BETWEEN 1 AND 5;

    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'COMPLETE FLOW SEED DATA VERIFICATION';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Organizations created: % (expected: 3)', v_org_count;
    RAISE NOTICE 'Products created: % (expected: 6)', v_product_count;
    RAISE NOTICE 'Contact created: % (expected: 1)', v_contact_count;
    RAISE NOTICE 'Opportunity stage: % (expected: closed_won)', v_opp_stage;
    RAISE NOTICE 'Activities created: % (expected: 8)', v_activity_count;
    RAISE NOTICE 'Tasks created: % (expected: 5)', v_task_count;
    RAISE NOTICE 'Contact notes: % (expected: 2)', v_contact_note_count;
    RAISE NOTICE 'Opportunity notes: % (expected: 3)', v_opp_note_count;
    RAISE NOTICE 'Organization notes: % (expected: 2)', v_org_note_count;
    RAISE NOTICE 'Tags created: % (expected: 5)', v_tag_count;
    RAISE NOTICE '============================================================';

    -- Fail if critical data is missing
    IF v_org_count < 3 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Only % organizations created', v_org_count;
    END IF;

    IF v_opp_stage != 'closed_won' THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Opportunity stage is %, expected closed_won', v_opp_stage;
    END IF;

    RAISE NOTICE 'All verifications passed!';
    RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================================================
-- POST-COMMIT: Summary Query (run after COMMIT)
-- ============================================================================
-- You can run this query to verify the complete data flow:
--
-- SELECT
--     o.name as opportunity,
--     o.stage,
--     cust.name as customer,
--     prin.name as principal,
--     dist.name as distributor,
--     c.name as contact,
--     (SELECT COUNT(*) FROM activities WHERE opportunity_id = o.id) as activities,
--     (SELECT COUNT(*) FROM tasks WHERE opportunity_id = o.id) as tasks
-- FROM opportunities o
-- JOIN organizations cust ON o.customer_organization_id = cust.id
-- JOIN organizations prin ON o.principal_organization_id = prin.id
-- JOIN organizations dist ON o.distributor_organization_id = dist.id
-- JOIN opportunity_contacts oc ON oc.opportunity_id = o.id AND oc.is_primary = true
-- JOIN contacts c ON oc.contact_id = c.id
-- WHERE o.id = 10001;
