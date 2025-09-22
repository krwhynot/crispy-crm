# Stage 1 Migration Execution Guide

## Overview

This guide provides step-by-step instructions for executing the Stage 1 migration of the merged CRM system. The migration combines the best features of Atomic CRM with the sophisticated relationship tracking from the old food brokerage CRM.

## Migration Architecture

```
Stage 1: MVP Foundation
├── Phase 1.1: Foundation Setup (ENUMs, base tables, search)
├── Phase 1.2: Contact-Organization Relationships (many-to-many)
├── Phase 1.3: Opportunity Enhancements (multi-principal)
└── Phase 1.4: Activities System (engagements vs interactions)
```

## Pre-Migration Checklist

### 1. Environment Requirements

```bash
# Check PostgreSQL version (15+ required)
psql --version

# Check Supabase CLI
npx supabase --version

# Ensure you have database access
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT version();"
```

### 2. Backup Current Database

```bash
# Create full backup
pg_dump -h localhost -p 54322 -U postgres -d postgres > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_before_migration_*.sql
```

### 3. Review Current Schema

```sql
-- Connect to database
psql "postgresql://postgres:postgres@localhost:54322/postgres"

-- Check existing tables
\dt

-- Verify no existing enum types conflict
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Check for deals table (will be renamed)
SELECT COUNT(*) FROM deals;
```

## Migration Execution

### Phase 1.1: Foundation Setup

**Purpose**: Establish core enums, enhance base tables, add search capabilities

```bash
# Execute Phase 1.1
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1/001_phase_1_1_foundation_setup.sql

# Verify execution
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT phase_number, phase_name, status, completed_at
FROM migration_history
WHERE phase_number = '1.1';
"
```

**Validation checks**:
```sql
-- Verify enums created
SELECT typname FROM pg_type
WHERE typtype = 'e'
AND typname IN ('organization_type', 'contact_role', 'opportunity_stage');

-- Verify opportunities table exists (renamed from deals)
\dt opportunities

-- Check enhanced columns on companies
\d companies

-- Test search functionality
SELECT name, organization_type FROM companies WHERE search_tsv @@ plainto_tsquery('food');
```

### Phase 1.2: Contact-Organization Relationships

**Purpose**: Implement many-to-many relationships between contacts and organizations

```bash
# Execute Phase 1.2
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1/002_phase_1_2_contact_organization_relationships.sql

# Verify execution
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT phase_number, phase_name, status, completed_at
FROM migration_history
WHERE phase_number = '1.2';
"
```

**Validation checks**:
```sql
-- Check junction tables created
\dt contact_organizations
\dt contact_preferred_principals

-- Verify data migration
SELECT COUNT(*) FROM contact_organizations;

-- Test helper functions
SELECT * FROM get_contact_organizations(1) LIMIT 5;

-- Check advocacy tracking
SELECT * FROM contact_influence_profile LIMIT 5;
```

### Phase 1.3: Opportunity Enhancements

**Purpose**: Add multi-principal support with flexible participant model

```bash
# Execute Phase 1.3
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1/003_phase_1_3_opportunity_enhancements.sql

# Verify execution
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT phase_number, phase_name, status, completed_at
FROM migration_history
WHERE phase_number = '1.3';
"
```

**Validation checks**:
```sql
-- Check participant tables
\dt opportunity_participants
\dt opportunity_products

-- Verify participant migration
SELECT role, COUNT(*)
FROM opportunity_participants
GROUP BY role;

-- Test multi-principal view
SELECT id, name, principal_count, participant_count
FROM opportunities_with_participants
WHERE principal_count > 1;
```

### Phase 1.4: Activities System

**Purpose**: Implement engagement vs interaction tracking system

```bash
# Execute Phase 1.4
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1/004_phase_1_4_activities_system.sql

# Verify execution
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT phase_number, phase_name, status, completed_at
FROM migration_history
WHERE phase_number = '1.4';
"
```

**Validation checks**:
```sql
-- Check activities table
\dt activities

-- Verify activity types
SELECT activity_type, COUNT(*)
FROM activities
GROUP BY activity_type;

-- Test activity functions
SELECT log_engagement(
    'call'::interaction_type,
    'Check-in call',
    'General relationship building',
    p_contact_id := 1,
    p_duration_minutes := 30
);

-- Check analytics views
SELECT * FROM engagement_analytics LIMIT 5;
```

## Post-Migration Validation

### 1. Complete System Check

```sql
-- Run comprehensive validation
DO $$
DECLARE
    v_table_count INTEGER;
    v_enum_count INTEGER;
    v_function_count INTEGER;
    v_view_count INTEGER;
BEGIN
    -- Count new tables
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'contact_organizations',
        'contact_preferred_principals',
        'opportunity_participants',
        'opportunity_products',
        'activities',
        'interaction_participants',
        'migration_history'
    );

    -- Count enums
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type
    WHERE typtype = 'e'
    AND typname IN (
        'organization_type',
        'contact_role',
        'opportunity_stage',
        'opportunity_status',
        'interaction_type',
        'activity_type',
        'priority_level'
    );

    -- Count functions
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name LIKE '%opportunity%'
       OR routine_name LIKE '%contact%'
       OR routine_name LIKE '%activity%';

    -- Count views
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name LIKE '%_analytics'
       OR table_name LIKE '%_profile'
       OR table_name LIKE '%_dashboard';

    RAISE NOTICE 'Migration validation results:';
    RAISE NOTICE '  Tables created: %', v_table_count;
    RAISE NOTICE '  Enums created: %', v_enum_count;
    RAISE NOTICE '  Functions created: %', v_function_count;
    RAISE NOTICE '  Views created: %', v_view_count;

    IF v_table_count < 6 OR v_enum_count < 7 THEN
        RAISE EXCEPTION 'Migration incomplete!';
    ELSE
        RAISE NOTICE 'All validations passed ✓';
    END IF;
END $$;
```

### 2. Test Core Functionality

```sql
-- Test creating opportunity with participants
SELECT create_opportunity_with_participants(
    '{"name": "Test Multi-Principal Deal", "stage": "qualified", "estimated_value": 50000}'::jsonb,
    ARRAY[
        '{"organization_id": 1, "role": "customer", "is_primary": true}'::jsonb,
        '{"organization_id": 2, "role": "principal", "is_primary": true}'::jsonb,
        '{"organization_id": 3, "role": "principal", "is_primary": false}'::jsonb
    ]
);

-- Test activity timeline
SELECT * FROM get_activity_timeline('organization', 1, 10);

-- Test contact influence
SELECT * FROM contact_influence_profile WHERE advocated_principals_count > 0;
```

### 3. Performance Check

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Migration fails with "type already exists"

```sql
-- Check and drop conflicting types
DROP TYPE IF EXISTS organization_type CASCADE;
-- Then retry migration
```

#### Issue: Foreign key violations during migration

```sql
-- Temporarily disable foreign key checks
SET session_replication_role = 'replica';
-- Run migration
-- Re-enable
SET session_replication_role = 'origin';
```

#### Issue: RLS policies blocking access

```sql
-- Temporarily disable RLS
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
-- Perform operations
-- Re-enable
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

### Rollback Procedure

If issues are encountered, use the rollback script:

```bash
# Execute complete rollback
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/rollback/rollback_stage1_complete.sql

# Verify rollback
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT phase_number, phase_name, status
FROM migration_history
WHERE phase_number LIKE '1.%';
"

# Check backup tables created
\dt *_backup
```

## Production Deployment

### 1. Staging Environment Test

```bash
# Deploy to staging first
supabase db push --db-url "postgresql://postgres:password@staging-host:5432/postgres"

# Run smoke tests
npm run test:integration
```

### 2. Production Deployment Window

**Recommended timeline**: 2-3 hours during low-traffic period

1. **Hour 0-0.5**: Backup and preparation
2. **Hour 0.5-1.5**: Execute migrations
3. **Hour 1.5-2**: Validation and testing
4. **Hour 2-2.5**: Buffer for issues
5. **Hour 2.5-3**: Documentation and handoff

### 3. Monitoring Post-Deployment

```sql
-- Monitor error logs
SELECT * FROM migration_history
WHERE status = 'failed' OR error_message IS NOT NULL;

-- Check query performance
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%opportunity_participants%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Next Steps

After successful Stage 1 deployment:

1. **Monitor for 24-48 hours** before proceeding to Stage 2
2. **Gather user feedback** on new contact-organization relationships
3. **Performance tune** based on actual usage patterns
4. **Plan Stage 2** implementation (Products, Principal-Distributor relationships)

## Support and Resources

- Migration scripts: `/merged/migrations/stage1/`
- Rollback scripts: `/merged/migrations/rollback/`
- Type definitions: `/merged/types/database.types.ts`
- Business rules: `/migration-business-rules.md`

## Success Metrics

Track these KPIs post-migration:

- [ ] All phases show "completed" status
- [ ] No data loss (row counts match or exceed pre-migration)
- [ ] Query performance within 10% of baseline
- [ ] All automated tests passing
- [ ] No critical errors in first 24 hours
- [ ] User acceptance criteria met

---

**Migration Version**: Stage 1 MVP
**Last Updated**: 2025-01-22
**Estimated Duration**: 30-45 minutes per phase
**Risk Level**: Medium (data preserved, rollback available)