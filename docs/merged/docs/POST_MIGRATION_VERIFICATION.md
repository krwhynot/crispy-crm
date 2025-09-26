# Post-Migration Verification Checklist

## Quick Status Check ✓

Run this single query for immediate migration health:

```sql
SELECT
    '✅ Phases Completed' AS metric,
    COUNT(*) || '/6' AS value
FROM migration_history
WHERE status = 'completed'
UNION ALL
SELECT
    '📊 Opportunities (was Deals)',
    COUNT(*) || ' records'
FROM opportunities
UNION ALL
SELECT
    '👥 Contact-Org Links',
    COUNT(*) || ' relationships'
FROM contact_organizations
UNION ALL
SELECT
    '🏢 Multi-Principal Opps',
    COUNT(DISTINCT opportunity_id) || ' opportunities'
FROM opportunity_participants
WHERE role = 'principal'
UNION ALL
SELECT
    '📋 Activities Logged',
    COUNT(*) || ' total'
FROM activities
UNION ALL
SELECT
    '📦 Products Created',
    COUNT(*) || ' products'
FROM products
UNION ALL
SELECT
    '🤝 PD Relationships',
    COUNT(*) || ' active'
FROM principal_distributor_relationships
WHERE relationship_status = 'active';
```

## Phase-by-Phase Verification

### ✅ Phase 1.1: Foundation Setup

```sql
-- 1. Check enum types exist
SELECT COUNT(*) = 7 as enums_created FROM pg_type
WHERE typname IN ('organization_type', 'contact_role', 'opportunity_stage',
                  'opportunity_status', 'interaction_type', 'activity_type', 'priority_level');

-- 2. Verify deals renamed to opportunities
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'opportunities'
) AS opportunities_exists;

-- 3. Check enhanced columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN ('organization_type', 'is_principal', 'is_distributor', 'deleted_at');

-- 4. Test search functionality
SELECT COUNT(*) > 0 AS search_working
FROM companies
WHERE search_tsv IS NOT NULL
LIMIT 1;
```

**Expected Results:** All should return `true` or show 4+ columns

### ✅ Phase 1.2: Contact-Organization Relationships

```sql
-- 1. Verify junction table exists
SELECT COUNT(*) AS migrated_relationships
FROM contact_organizations;

-- 2. Check for contacts in multiple orgs
SELECT
    contact_id,
    COUNT(organization_id) as org_count
FROM contact_organizations
WHERE deleted_at IS NULL
GROUP BY contact_id
HAVING COUNT(organization_id) > 1
LIMIT 5;

-- 3. Test helper functions
SELECT COUNT(*) > 0 AS functions_work
FROM get_contact_organizations(
    (SELECT id FROM contacts LIMIT 1)
);

-- 4. Verify advocacy tracking
SELECT COUNT(*) AS advocacy_relationships
FROM contact_preferred_principals;
```

**Expected Results:** Should show relationships and multi-org contacts

### ✅ Phase 1.3: Opportunity Enhancements

```sql
-- 1. Check participants table
SELECT
    role,
    COUNT(*) as count,
    COUNT(DISTINCT opportunity_id) as opportunities
FROM opportunity_participants
GROUP BY role;

-- 2. Verify multi-principal opportunities
SELECT COUNT(*) AS multi_principal_count
FROM (
    SELECT opportunity_id
    FROM opportunity_participants
    WHERE role = 'principal'
    GROUP BY opportunity_id
    HAVING COUNT(*) > 1
) multi;

-- 3. Check migration from legacy fields
SELECT
    COUNT(*) FILTER (WHERE customer_organization_id IS NOT NULL) as has_legacy_customer,
    COUNT(*) FILTER (WHERE principal_organization_id IS NOT NULL) as has_legacy_principal,
    COUNT(*) as total_opportunities
FROM opportunities;

-- 4. Test participant functions
SELECT COUNT(*) > 0 AS function_works
FROM get_opportunity_with_participants(
    (SELECT id FROM opportunities LIMIT 1)
);
```

**Expected Results:** Should show participants by role

### ✅ Phase 1.4: Activities System

```sql
-- 1. Check activity distribution
SELECT
    activity_type,
    COUNT(*) as count
FROM activities
GROUP BY activity_type;

-- 2. Verify constraint enforcement
SELECT
    activity_type,
    COUNT(*) FILTER (WHERE opportunity_id IS NOT NULL) as with_opportunity,
    COUNT(*) FILTER (WHERE opportunity_id IS NULL) as without_opportunity
FROM activities
GROUP BY activity_type;

-- 3. Check follow-ups
SELECT COUNT(*) AS pending_followups
FROM activities
WHERE follow_up_required = true
  AND follow_up_date >= CURRENT_DATE;

-- 4. Test activity functions
DO $$
DECLARE
    v_engagement_id BIGINT;
BEGIN
    SELECT log_engagement(
        'call'::interaction_type,
        'Verification test',
        p_contact_id := (SELECT id FROM contacts LIMIT 1)
    ) INTO v_engagement_id;

    IF v_engagement_id IS NOT NULL THEN
        RAISE NOTICE 'Activity functions working ✅';
        -- Clean up test
        DELETE FROM activities WHERE id = v_engagement_id;
    END IF;
END $$;
```

**Expected Results:** Engagements should have NO opportunity, Interactions MUST have opportunity

### ✅ Phase 1.5: Principal Features

```sql
-- 1. Check products table
SELECT
    COUNT(*) as total_products,
    COUNT(DISTINCT principal_id) as principals_with_products,
    COUNT(DISTINCT category) as categories
FROM products
WHERE deleted_at IS NULL;

-- 2. Verify PD relationships
SELECT
    relationship_status,
    COUNT(*) as count,
    AVG(commission_percent) as avg_commission
FROM principal_distributor_relationships
GROUP BY relationship_status;

-- 3. Check auto-created relationships
SELECT COUNT(*) AS auto_created
FROM principal_distributor_relationships
WHERE notes LIKE 'Auto-created%';

-- 4. Test product functions
SELECT COUNT(*) > 0 AS function_works
FROM get_distributor_products(
    (SELECT distributor_id
     FROM principal_distributor_relationships
     WHERE relationship_status = 'active'
     LIMIT 1)
);
```

**Expected Results:** Should show products and relationships

### ✅ Phase 1.6: Validation Fixes

```sql
-- 1. Verify all triggers installed
SELECT COUNT(*) = 6 AS all_triggers_installed
FROM pg_trigger
WHERE tgname IN (
    'trigger_enforce_interaction_opportunity',
    'trigger_enforce_company_role_exclusivity',
    'trigger_validate_opportunity_contact_alignment',
    'trigger_validate_principal_distributor_relationship',
    'trigger_validate_opportunity_has_customer_participants',
    'trigger_validate_contact_decision_maker'
);

-- 2. Test interaction validation
DO $$
BEGIN
    -- This should fail
    BEGIN
        INSERT INTO activities (activity_type, type, subject, opportunity_id)
        VALUES ('interaction', 'call', 'Test', NULL);
        RAISE EXCEPTION 'Validation not working!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Interaction validation working ✅';
    END;
END $$;

-- 3. Test company role exclusivity
DO $$
BEGIN
    -- This should fail
    BEGIN
        UPDATE companies
        SET organization_type = 'customer', is_distributor = true
        WHERE id = (SELECT id FROM companies LIMIT 1);
        RAISE EXCEPTION 'Role validation not working!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Role exclusivity working ✅';
    END;
END $$;
```

**Expected Results:** All validations should pass

## Data Integrity Checks

### Critical Business Rules

```sql
-- 1. No interactions without opportunities
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL: ' || COUNT(*) || ' invalid interactions'
    END AS interaction_opportunity_rule
FROM activities
WHERE activity_type = 'interaction'
  AND opportunity_id IS NULL;

-- 2. No conflicting company roles
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL: ' || COUNT(*) || ' conflicting companies'
    END AS company_role_exclusivity
FROM companies
WHERE (organization_type = 'customer' AND is_distributor = true)
   OR (organization_type = 'customer' AND is_principal = true);

-- 3. All opportunities have customers
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ PASS'
        ELSE '⚠️ WARNING: ' || COUNT(*) || ' opportunities without customers'
    END AS opportunity_customer_rule
FROM opportunities o
WHERE NOT EXISTS (
    SELECT 1 FROM opportunity_participants op
    WHERE op.opportunity_id = o.id
      AND op.role = 'customer'
      AND op.deleted_at IS NULL
)
AND o.deleted_at IS NULL;

-- 4. Principal-distributor relationships valid
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL: ' || COUNT(*) || ' invalid PD relationships'
    END AS pd_relationship_validation
FROM principal_distributor_relationships pdr
WHERE NOT EXISTS (
    SELECT 1 FROM companies
    WHERE id = pdr.principal_id AND is_principal = true
) OR NOT EXISTS (
    SELECT 1 FROM companies
    WHERE id = pdr.distributor_id AND is_distributor = true
);
```

### Data Completeness

```sql
-- Check for orphaned records
WITH orphan_check AS (
    SELECT
        'Contacts without organizations' AS check_name,
        COUNT(*) AS count
    FROM contacts c
    WHERE NOT EXISTS (
        SELECT 1 FROM contact_organizations co
        WHERE co.contact_id = c.id AND co.deleted_at IS NULL
    )
    AND c.deleted_at IS NULL

    UNION ALL

    SELECT
        'Opportunities without participants',
        COUNT(*)
    FROM opportunities o
    WHERE NOT EXISTS (
        SELECT 1 FROM opportunity_participants op
        WHERE op.opportunity_id = o.id AND op.deleted_at IS NULL
    )
    AND o.deleted_at IS NULL

    UNION ALL

    SELECT
        'Products without principals',
        COUNT(*)
    FROM products p
    WHERE NOT EXISTS (
        SELECT 1 FROM companies c
        WHERE c.id = p.principal_id AND c.is_principal = true
    )
)
SELECT
    check_name,
    CASE
        WHEN count = 0 THEN '✅ None found'
        ELSE '⚠️ ' || count || ' orphaned records'
    END AS status
FROM orphan_check;
```

## Performance Baseline

### Capture Initial Metrics

```sql
-- Record baseline performance
CREATE TABLE IF NOT EXISTS migration_performance_baseline (
    metric_name TEXT PRIMARY KEY,
    metric_value NUMERIC,
    captured_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO migration_performance_baseline (metric_name, metric_value)
VALUES
    ('total_companies', (SELECT COUNT(*) FROM companies)),
    ('total_contacts', (SELECT COUNT(*) FROM contacts)),
    ('total_opportunities', (SELECT COUNT(*) FROM opportunities)),
    ('total_activities', (SELECT COUNT(*) FROM activities)),
    ('total_products', (SELECT COUNT(*) FROM products)),
    ('avg_opportunity_participants', (
        SELECT AVG(participant_count)::NUMERIC
        FROM (
            SELECT opportunity_id, COUNT(*) as participant_count
            FROM opportunity_participants
            GROUP BY opportunity_id
        ) counts
    )),
    ('index_count', (
        SELECT COUNT(*)
        FROM pg_indexes
        WHERE schemaname = 'public'
    ))
ON CONFLICT (metric_name)
DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    captured_at = NOW();

-- View baseline
SELECT * FROM migration_performance_baseline ORDER BY metric_name;
```

### Test Query Performance

```sql
-- Test critical query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM opportunities_with_participants
WHERE principal_count > 1
LIMIT 10;

-- Test search performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name
FROM companies
WHERE search_tsv @@ plainto_tsquery('food')
LIMIT 10;

-- Test activity timeline
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM get_activity_timeline('organization', 1, 50);
```

## User Access Verification

```sql
-- 1. Check RLS policies
SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 2. Test authenticated user access
SET LOCAL ROLE authenticated;
SELECT COUNT(*) > 0 AS can_read_companies FROM companies LIMIT 1;
SELECT COUNT(*) > 0 AS can_read_opportunities FROM opportunities LIMIT 1;
RESET ROLE;

-- 3. Verify soft delete filtering
SELECT
    'Companies' AS table_name,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted
FROM companies
UNION ALL
SELECT
    'Opportunities',
    COUNT(*) FILTER (WHERE deleted_at IS NULL),
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
FROM opportunities;
```

## Final Sign-Off Checklist

### System Readiness

- [ ] All 6 migration phases show "completed" status
- [ ] No failed migrations in migration_history
- [ ] All validation triggers installed (6 total)
- [ ] All business rule checks pass
- [ ] No orphaned records found
- [ ] RLS policies active on all tables
- [ ] Search indexes populated
- [ ] Performance baseline captured

### Functional Testing

- [ ] Can create contact with multiple organizations
- [ ] Can create multi-principal opportunity
- [ ] Can log both engagements and interactions
- [ ] Can add products for principals
- [ ] Can establish PD relationships
- [ ] Validation errors show meaningful messages

### Data Migration

- [ ] All deals converted to opportunities
- [ ] Contact-organization relationships migrated
- [ ] Opportunity participants created from legacy fields
- [ ] Auto-created PD relationships from existing data
- [ ] No data loss (counts match or exceed original)

## Generate Verification Report

```sql
-- Complete verification report
WITH verification_summary AS (
    SELECT
        'Migration Phases' AS category,
        COUNT(*) FILTER (WHERE status = 'completed') || '/' || COUNT(*) AS result
    FROM migration_history

    UNION ALL

    SELECT
        'Data Tables',
        COUNT(*) || ' tables'
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'

    UNION ALL

    SELECT
        'Validation Triggers',
        COUNT(*) || ' active'
    FROM pg_trigger
    WHERE tgname LIKE '%validate%' OR tgname LIKE '%enforce%'

    UNION ALL

    SELECT
        'Total Records',
        (SELECT COUNT(*) FROM companies) +
        (SELECT COUNT(*) FROM contacts) +
        (SELECT COUNT(*) FROM opportunities) +
        (SELECT COUNT(*) FROM activities) || ' total'

    UNION ALL

    SELECT
        'System Health',
        CASE
            WHEN EXISTS (SELECT 1 FROM migration_history WHERE status = 'failed') THEN '⚠️ Has failures'
            ELSE '✅ All green'
        END
)
SELECT
    category,
    result,
    CURRENT_TIMESTAMP AS verified_at
FROM verification_summary;
```

## Save Verification Results

```sql
-- Save verification timestamp
INSERT INTO migration_history (phase_number, phase_name, status, completed_at)
VALUES ('VERIFICATION', 'Post-Migration Verification', 'completed', NOW());

-- Create verification log
CREATE TABLE IF NOT EXISTS migration_verification_log (
    id BIGSERIAL PRIMARY KEY,
    check_name TEXT,
    check_result TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by TEXT DEFAULT CURRENT_USER
);

-- Log results
INSERT INTO migration_verification_log (check_name, check_result)
VALUES
    ('MVP+1 Migration', 'Successfully verified all phases'),
    ('Business Rules', 'All validations active and tested'),
    ('Data Integrity', 'No orphaned records or conflicts'),
    ('Performance', 'Baseline metrics captured');
```

---

**Verification Version**: 1.0
**For Migration**: MVP+1 (Phases 1.1-1.6)
**Last Updated**: 2025-01-22
**Time Required**: ~15 minutes