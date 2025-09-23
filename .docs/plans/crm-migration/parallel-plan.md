# CRM Migration Parallel Implementation Plan - Stage 1 Only

## ⚠️ CRITICAL WARNING: 100% TASK COMPLETION REQUIRED

**THIS MIGRATION WILL FAIL CATASTROPHICALLY IF ANY SINGLE TASK IS NOT 100% COMPLETE**

Before starting, understand:
- **99% completion = 100% failure** - There is no partial success in database migrations
- **Every task must be verified twice** - Once by implementer, once by reviewer
- **Missing one line of code can lock out all users** - E.g., forgetting RLS policies
- **Skipping "small" tasks causes production disasters** - E.g., missing a view creation

### Mandatory Completion Process:
1. **Complete** the task fully - no shortcuts, no "good enough"
2. **Test** the implementation - actually run the code
3. **Verify** outputs exist - check database, files, configs
4. **Review** with fresh eyes - have someone else check
5. **Sign off** with timestamp - document who verified and when
6. **Double-check** - After ALL tasks done, review entire plan again

### Task Completion Checklist (REQUIRED for each task):
```
[ ] Task implemented completely
[ ] Code/SQL tested and working
[ ] Output verified in database/filesystem
[ ] Reviewed by: ____________
[ ] Signed off: ____________ @ ____________
[ ] Added to completion tracking document
```

This plan implements Stage 1 of the CRM migration, transforming Atomic CRM to support enhanced opportunity management (replacing deals) and multi-organization contact relationships. Stage 1 includes phases 1.1-1.4 only, excluding principal-distributor features which are part of Stage 1.5. The implementation is designed for parallel execution by multiple developers, with clear task boundaries and dependencies.

## Critically Relevant Files and Documentation

### Core Migration Documentation
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/shared.md` - Architecture overview and patterns
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` - Feature requirements and success criteria
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/database-research.docs.md` - Schema transformations
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/frontend-research.docs.md` - Component migration paths
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/data-provider-research.docs.md` - Provider architecture
- `/home/krwhynot/Projects/atomic/docs/merged/migration-business-rules.md` - Business logic validation

### Key Implementation Files
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` - Main app configuration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts` - Production provider
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/fakerest/dataProvider.ts` - Demo provider
- `/home/krwhynot/Projects/atomic/package.json` - CLI commands configuration
- `/home/krwhynot/Projects/atomic/supabase/migrations/` - Existing migrations
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/` - Stage 1 SQL migrations (phases 1.1-1.4)
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/rollback/rollback_stage1_complete.sql` - Stage 1 rollback script

## Stage 1 Scope

This implementation focuses exclusively on Stage 1 (phases 1.1-1.4), which includes:
- **Phase 1.1**: Foundation setup with deals→opportunities transformation
- **Phase 1.2**: Multi-organization contact relationships via junction tables
- **Phase 1.3**: Enhanced opportunity management with participants
- **Phase 1.4**: Activities system for tracking interactions and engagements

**Excluded from this plan** (part of Stage 1.5 and beyond):
- Principal-distributor relationships
- Product catalogs and SKUs
- Commission tracking
- Territory management
- Advanced B2B features

## Implementation Plan

### Phase 1: Migration Infrastructure

#### Task 1.1: CLI Migration Command Framework [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (Migration Strategy section)
- `/home/krwhynot/Projects/atomic/scripts/supabase-remote-init.mjs` (Reference pattern)
- `/home/krwhynot/Projects/atomic/package.json` (Add new commands)

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/migrate-production.js` - Main migration CLI orchestrator
- `/home/krwhynot/Projects/atomic/scripts/migration-dry-run.js` - Dry run validation logic
- `/home/krwhynot/Projects/atomic/scripts/migration-state-tracker.js` - State persistence for resume capability

Files to Modify:
- `/home/krwhynot/Projects/atomic/package.json` - Add `migrate:production` and `migrate:dry-run` commands

Implement the main migration CLI command with:
- Interactive confirmation prompts using readline
- Connection to Supabase using environment variables
- State tracking in `migration_history` table
- Proper error handling and logging to `logs/migration.log`
- Resume capability if migration is interrupted

#### Task 1.2: Backup and Rollback System [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/data-provider-research.docs.md` (Backup patterns)
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/rollback/` - Rollback SQL scripts
- `/home/krwhynot/Projects/atomic/supabase/migrations/20241221120001_rollback_tag_colors.sql` (Rollback pattern example)

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/migration-backup.js` - Automated backup before migration
- `/home/krwhynot/Projects/atomic/scripts/migration-rollback.js` - Emergency rollback execution
- `/home/krwhynot/Projects/atomic/scripts/migration-cleanup.js` - Backup table cleanup after verification

Files to Modify:
- `/home/krwhynot/Projects/atomic/package.json` - Add `migrate:backup` and `migrate:rollback` commands

Implement comprehensive backup system:
- Full database export using pg_dump
- Timestamp-based backup tables for each modified table
- 48-hour rollback window enforcement
- Verification of backup integrity before migration proceeds
- Cleanup of old backups after successful migration

#### Task 1.3: Data Validation Framework [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (Validation Checks section)
- `/home/krwhynot/Projects/atomic/docs/merged/migration-business-rules.md` - Business rules to validate

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/validation/referential-integrity.js` - Foreign key validation
- `/home/krwhynot/Projects/atomic/scripts/validation/unique-constraints.js` - Conflict detection
- `/home/krwhynot/Projects/atomic/scripts/validation/required-fields.js` - Completeness check
- `/home/krwhynot/Projects/atomic/scripts/validation/data-quality.js` - Source data assessment
- `/home/krwhynot/Projects/atomic/scripts/validation/go-no-go.js` - Automated decision logic

Implement pre-migration validation:
- Check all foreign keys reference valid records
- Detect unique constraint conflicts for new schema
- Verify required fields for migration (e.g., company must have valid sector)
- Calculate data quality score with <1% warning threshold
- Generate validation report with severity levels

#### Task 1.4: Migration Monitoring System [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (During Migration section)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/activity.ts` (Progress tracking pattern)

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/migration-monitor.js` - CLI monitoring tool
- `/home/krwhynot/Projects/atomic/src/atomic-crm/services/migrationMetrics.ts` - Metrics collection service
- `/home/krwhynot/Projects/atomic/src/atomic-crm/hooks/useMigrationMonitoring.ts` - React hook for UI monitoring

Implement real-time monitoring:
- Progress tracking by migration phase and batch
- Resource monitoring (CPU, memory, disk I/O)
- ETA calculation based on current progress
- Error logging with severity levels
- WebSocket or polling-based updates for UI

### Phase 2: Frontend Migration Components

#### Task 2.1: Deal to Opportunity UI Migration [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/frontend-research.docs.md` (Deal to Opportunity section)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/deals/` - All deal components
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts` - Deal type definition

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/` - New opportunity module directory

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts` - Add Opportunity type with enhanced fields
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` - Update resource registration

Transform deal components to opportunity components:
- Copy deal components to opportunities directory
- Update imports and rename Deal → Opportunity
- Add new fields: probability, priority, lifecycle stage
- Update kanban board to use opportunity stages enum
- Implement backward compatibility for existing deal URLs

#### Task 2.2: Multi-Organization Contact Support [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/frontend-research.docs.md` (Contact Multi-Organization section)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/` - Contact components
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/002_phase_1_2_contact_organization_relationships.sql`

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts` - Update Contact type for multiple organizations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactInputs.tsx` - Multi-org selection UI
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactShow.tsx` - Display all organizations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.tsx` - Handle multiple org filters

Implement multi-organization features:
- Replace single company_id with junction table support
- Add "Primary Organization" and "Associated Organizations" sections
- Update filters to search across all organizations
- Add role and influence level per organization
- Maintain backward compatibility for single org contacts

#### Task 2.2a: UI Text and Label Updates [Depends on: Task 2.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/deals/` - All components with text
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` - Resource registration
- `/home/krwhynot/Projects/atomic/docs/development/` - Documentation

**Instructions**

Files to Update:
- All opportunity component files for UI text strings
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` - Resource labels and props
- Dashboard components with deal references
- Translation files if present
- Error messages and validation text

Comprehensive text updates:
- Search repository-wide for "deal" (case-insensitive) in all .tsx, .ts files
- Update button labels ("Create Deal" → "Create Opportunity")
- Update breadcrumbs and navigation labels
- Update form field labels and placeholders
- Update tooltip and helper text
- Update error and success messages
- Update configuration prop names (dealCategories → opportunityCategories)
- Ensure consistent capitalization throughout

#### Task 2.3: Company Organization Type Support [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/frontend-research.docs.md` (Company Components section)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/` - Company components
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/001_phase_1_1_foundation_setup.sql` (Organization type enums)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts` - Add organization_type field
- `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/CompanyInputs.tsx` - Organization type selector
- `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/CompanyShow.tsx` - Display organization type
- `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/CompanyList.tsx` - Filter by organization type

Add basic organization features:
- Organization type enum selector (customer/prospect/vendor/partner)
- Priority level (A/B/C/D) for account management
- Segment field for categorization
- Parent company reference for hierarchies
- Enhanced search with full-text support

#### Task 2.4: User Communication Components [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (Communication Plan section)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/Layout.tsx` - App layout for banner placement

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/components/MigrationBanner.tsx` - Warning banner
- `/home/krwhynot/Projects/atomic/src/atomic-crm/components/MigrationNotification.tsx` - Email alerts
- `/home/krwhynot/Projects/atomic/src/atomic-crm/pages/MigrationStatusPage.tsx` - Public status page
- `/home/krwhynot/Projects/atomic/src/atomic-crm/components/MigrationChecklist.tsx` - User verification UI
- `/home/krwhynot/Projects/atomic/src/atomic-crm/pages/WhatsNew.tsx` - Feature guide

Implement user communication:
- In-app banner with countdown timer
- Email notification templates for T-24h, T-2h, T-30m
- Real-time migration status page
- Post-migration verification checklist
- Interactive feature tour for new capabilities

### Phase 3: Data Provider Updates

#### Task 3.1: Supabase Provider Migration Support [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/data-provider-research.docs.md`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/001_phase_1_1_foundation_setup.sql`

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts` (if exists)

Update Supabase provider:
- Add opportunity resource with deal fallback
- Support contact_organizations junction table
- Handle opportunity_participants and opportunity_contacts
- Update view names (deals → opportunities)
- Implement backward compatibility layer for 1 month

#### Task 3.2: FakeRest Provider Migration [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/data-provider-research.docs.md`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/fakerest/dataProvider.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/fakerest/dataGenerator.ts`

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/fakerest/dataProvider.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/fakerest/dataGenerator.ts`

Update demo provider:
- Generate opportunities instead of deals
- Create multi-organization contact relationships
- Generate opportunity participants from contacts
- Add activity history (interactions and engagements)
- Update demo data for new schema

#### Task 3.3: API Backward Compatibility Layer [Depends on: Tasks 3.1, 3.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (Backward Compatibility section)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/` - Shared provider logic

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/backwardCompatibility.ts`

Files to Modify:
- Both data providers to use compatibility layer

Implement compatibility:
- URL redirects from /deals/* to /opportunities/*
- Type adapters for Deal → Opportunity conversion
- Deprecation warnings in development mode
- 1-month grace period configuration
- Logging of deprecated endpoint usage

### Phase 3.5: System-Wide Consistency Updates

#### Task 3.5: Cache and Search Index Updates [Depends on: Tasks 3.1, 3.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/config/cache.config.js` - Cache configuration (if exists)
- `/home/krwhynot/Projects/atomic/config/search.config.js` - Search configuration (if exists)
- PostgreSQL documentation for full-text search

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/cache-invalidation.js` - Cache clearing script
- `/home/krwhynot/Projects/atomic/scripts/search-reindex.js` - Search index rebuild script

Implementation:
- Clear all Redis/cache layers during migration
- Rebuild PostgreSQL full-text search indexes
- Update any Elasticsearch indexes if present
- Invalidate CDN cache if applicable
- Document cache TTLs for gradual expiry

#### Task 3.6: Development Tooling Updates [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/scripts/` - All development scripts
- `/home/krwhynot/Projects/atomic/.env.example` - Environment variables
- `/home/krwhynot/Projects/atomic/tests/fixtures/` - Test fixtures

**Instructions**

Files to Update:
- `/home/krwhynot/Projects/atomic/scripts/seed-data.js` - Update data generators
- `/home/krwhynot/Projects/atomic/.env.example` - Rename DEAL_* variables
- `/home/krwhynot/Projects/atomic/tests/fixtures/*.json` - Update test data
- `/home/krwhynot/Projects/atomic/package.json` - Update script names if needed

Updates required:
- Rename all DEAL_* environment variables to OPPORTUNITY_*
- Update seed data generators to create opportunities
- Update test fixtures to use new schema
- Update development setup documentation
- Add migration notes to README

#### Task 3.7: External System Notifications [Depends on: Task 3.3]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/integrations/` - External integrations (if exists)
- `/home/krwhynot/Projects/atomic/docs/api/` - API documentation
- Webhook configurations

**Instructions**

Files to Update:
- `/home/krwhynot/Projects/atomic/docs/api/swagger.json` - API documentation
- `/home/krwhynot/Projects/atomic/monitoring/dashboards/` - Monitoring configs
- `/home/krwhynot/Projects/atomic/monitoring/alerts/` - Alert rules

External updates:
- Update API documentation (Swagger/OpenAPI)
- Notify webhook consumers of endpoint changes
- Update monitoring dashboard queries
- Update alert rules for opportunity metrics
- Create migration guide for API consumers
- Update any mobile app API contracts

### Phase 4: Testing Infrastructure

#### Task 4.1: Migration Test Suite [Depends on: Task 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (Testing Requirements section)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/*.spec.ts` - Test patterns

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/tests/migration/dry-run.spec.ts` - Dry run tests
- `/home/krwhynot/Projects/atomic/tests/migration/rollback.spec.ts` - Rollback scenarios
- `/home/krwhynot/Projects/atomic/tests/migration/data-integrity.spec.ts` - 100-sample checks
- `/home/krwhynot/Projects/atomic/tests/migration/resume.spec.ts` - Resume capability

Test critical paths:
- Dry run execution and validation
- Migration state tracking and resume
- Rollback with data verification
- Record count preservation
- Edge cases (nulls, special characters)

#### Task 4.2: Component Migration Tests [Depends on: Tasks 2.1, 2.2, 2.3]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (Integration Tests section)
- Existing component test patterns

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/*.spec.ts` - Opportunity tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/*.spec.ts` - Multi-org contact tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/*.spec.ts` - Organization type tests

Test user workflows:
- Create new opportunity with lifecycle stages
- Link contact to multiple organizations
- View opportunity participants
- Activity tracking and aggregation
- Backward compatibility of old endpoints

#### Task 4.3: Data Provider Tests [Depends on: Tasks 3.1, 3.2, 3.3]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/fakerest/internal/*.spec.ts` - Provider test patterns

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/*.spec.ts` - Supabase tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/fakerest/*.spec.ts` - FakeRest tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/backwardCompatibility.spec.ts`

Test provider logic:
- Opportunity CRUD operations
- Junction table queries
- View compatibility
- Filter transformations
- Backward compatibility adapters

#### Task 4.4: Performance and Load Testing [Depends on: Tasks 5.1, 5.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (Performance section)
- Database query plans and indexes

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/tests/performance/opportunity-queries.spec.ts`
- `/home/krwhynot/Projects/atomic/tests/performance/junction-table-performance.spec.ts`
- `/home/krwhynot/Projects/atomic/scripts/load-test.js`

Performance validation:
- Benchmark opportunity list queries with 10,000+ records
- Test junction table join performance
- Validate search index performance
- Load test new API endpoints
- Compare against baseline metrics

#### Task 4.5: User Acceptance Testing [Depends on: All Phase 2 tasks]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (User verification section)
- User verification checklist

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/tests/uat/opportunity-workflows.spec.ts`
- `/home/krwhynot/Projects/atomic/tests/uat/migration-checklist.md`
- `/home/krwhynot/Projects/atomic/docs/uat-guide.md`

UAT scenarios:
- Create opportunity with all new fields
- Link contact to multiple organizations
- Search and filter opportunities
- Verify all UI labels are updated
- Test backward compatibility URLs
- Validate report generation

#### Task 4.6: Audit and Compliance Testing [Depends on: Task 5.3]

**READ THESE BEFORE TASK**
- Audit trail requirements
- Compliance documentation

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/tests/audit/trail-continuity.spec.ts`
- `/home/krwhynot/Projects/atomic/tests/audit/data-integrity.spec.ts`

Compliance validation:
- Verify audit trail continuity
- Validate data retention policies
- Check permission preservation
- Verify no data loss
- Test rollback data restoration

### Phase 4.7: Final Verification Sweep [MANDATORY - DO NOT SKIP]

#### Task 4.7: Complete Plan Review and Sign-off [Depends on: ALL TASKS]

**THIS IS NOT OPTIONAL - SKIPPING THIS WILL CAUSE FAILURE**

**Instructions**

Go through EVERY task in this plan and verify:

1. **Check Task Completion Documentation**:
   - Every task has a sign-off with name and timestamp
   - Every task has been reviewed by someone other than implementer
   - No tasks marked "mostly done" or "should be fine"

2. **Verify Critical Items Exist**:
   ```sql
   -- Run these queries to verify critical items
   SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'opportunities'::regclass; -- Must be > 0
   SELECT COUNT(*) FROM pg_views WHERE viewname = 'opportunities_summary'; -- Must be 1
   SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'check_principal_organization'; -- Must be 1
   SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'contacts' AND column_name = 'company_id_backup'; -- Must be 1
   ```

3. **Test Critical Paths**:
   - Create a test opportunity - should work
   - Query with RLS enabled - should return data
   - Check backward compatibility - /deals should redirect to /opportunities
   - Verify all UI labels updated - no "deal" text visible

4. **Final Checklist**:
   ```
   [ ] All 23+ tasks have sign-offs
   [ ] Task 5.0 (Critical Fixes) verified working
   [ ] RLS policies migrated and tested
   [ ] Views created and accessible
   [ ] Backup columns populated
   [ ] Junction tables have data
   [ ] UI text fully updated
   [ ] Cache invalidation ready
   [ ] Validation queries return acceptable results
   [ ] Production safety measures in place
   [ ] Rollback scripts tested
   [ ] Team agrees migration is ready
   ```

**If ANY item above is not checked, DO NOT PROCEED WITH MIGRATION**

### Phase 5: Migration Execution Scripts

#### Task 5.0: Critical Migration Fixes [Depends on: none] **MUST DO FIRST - MIGRATION WILL FAIL WITHOUT THESE**

**READ THESE BEFORE TASK**
- Critical blockers section in shared.md
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/*.sql` - All migration scripts
- PostgreSQL CHECK constraint documentation

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/001_phase_1_1_foundation_setup.sql`
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/002_phase_1_2_contact_organization_relationships.sql`

**BLOCKER FIXES** (Migration fails without these):

1. **Fix PostgreSQL Constraint Violation** (Line 75-82 in 002):
```sql
-- REMOVE the CHECK constraint:
-- CONSTRAINT principal_must_be_principal CHECK (...)
-- REPLACE with trigger:
CREATE OR REPLACE FUNCTION validate_principal_organization()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM companies
        WHERE id = NEW.principal_organization_id
        AND is_principal = true
    ) THEN
        RAISE EXCEPTION 'Organization % is not marked as principal', NEW.principal_organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_principal_organization
    BEFORE INSERT OR UPDATE ON contact_preferred_principals
    FOR EACH ROW EXECUTE FUNCTION validate_principal_organization();
```

2. **Add RLS Policy Migration**:
```sql
-- Copy existing policies from deals to opportunities
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT polname, polcmd, polroles, polqual, polwithcheck
        FROM pg_policy
        WHERE polrelid = 'deals'::regclass
    LOOP
        -- Recreate on opportunities table
        EXECUTE format('CREATE POLICY %I ON opportunities AS %s',
            policy_record.polname,
            pg_get_policydef(policy_record.oid));
    END LOOP;
END $$;
```

3. **Create Missing View**:
```sql
-- After renaming deals to opportunities
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT o.*, c.name as company_name,
       array_agg(DISTINCT ct.name) as contact_names
FROM opportunities o
LEFT JOIN companies c ON o.customer_organization_id = c.id
LEFT JOIN contacts ct ON ct.id = ANY(o.contact_ids)
WHERE o.deleted_at IS NULL
GROUP BY o.id, c.name;

-- Backward compatibility
CREATE OR REPLACE VIEW deals_summary AS SELECT * FROM opportunities_summary;
```

4. **Add Backup Columns** (BEFORE any updates):
```sql
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id_backup BIGINT;
UPDATE contacts SET company_id_backup = company_id WHERE company_id IS NOT NULL;

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS original_company_id BIGINT;
UPDATE opportunities SET original_company_id = company_id;
```

5. **Populate Junction Table** (Add to phase 1.2):
```sql
INSERT INTO contact_organizations (
    contact_id, organization_id, is_primary_contact,
    purchase_influence, decision_authority, created_at
)
SELECT
    id, company_id, COALESCE(is_primary_contact, false),
    'Unknown', 'End User', created_at
FROM contacts
WHERE company_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

6. **Add Transaction Safety**:
```sql
BEGIN;
SAVEPOINT phase_1_1_start;
-- Phase 1.1 code
SAVEPOINT phase_1_1_complete;
-- Phase 1.2 code
SAVEPOINT phase_1_2_complete;
COMMIT;
```

#### Task 5.1: SQL Migration Orchestration [Depends on: Tasks 1.1, 5.0]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/*.sql` - Stage 1 migrations (phases 1.1-1.4)
- `/home/krwhynot/Projects/atomic/docs/merged/migration-business-rules.md` - Constraints
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/rollback/rollback_stage1_complete.sql` - Rollback script

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/migration-execute.js` - SQL execution engine

Execute migrations in order:
- Phase 1.1: Foundation setup and deals→opportunities rename
- Phase 1.2: Contact-organization many-to-many relationships
- Phase 1.3: Opportunity enhancements with participants
- Phase 1.4: Activities system (interactions and engagements)

Handle transactions and checkpoints between phases.

#### Task 5.1a: Pre-Migration Validation [Depends on: Task 5.0] **REQUIRED**

**READ THESE BEFORE TASK**
- Validation queries from Supabase agent review
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/shared.md` (Validation section)

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/validation/pre-migration-validation.sql`
- `/home/krwhynot/Projects/atomic/scripts/validation/capture-current-state.sql`

Validation queries to include:
```sql
-- Capture current counts
CREATE TEMP TABLE pre_migration_counts AS
SELECT 'deals' as entity, COUNT(*) as count,
       COUNT(DISTINCT company_id) as unique_companies
FROM deals
UNION ALL
SELECT 'contacts' as entity, COUNT(*) as count,
       COUNT(DISTINCT company_id) as unique_companies
FROM contacts;

-- Check for orphaned records
SELECT 'contacts_without_company' as check_type, COUNT(*) as count
FROM contacts WHERE company_id IS NULL
UNION ALL
SELECT 'deals_with_invalid_company' as check_type, COUNT(*) as count
FROM deals d
WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = d.company_id);

-- Create backup tables
CREATE TABLE backup_deals_pre_migration AS SELECT * FROM deals;
CREATE TABLE backup_contacts_pre_migration AS SELECT * FROM contacts;
CREATE TABLE backup_companies_pre_migration AS SELECT * FROM companies;
```

Go/No-Go criteria:
- Less than 1% orphaned records
- All foreign keys valid
- Backup tables successfully created
- Sufficient disk space (2x current DB size)

#### Task 5.2: Data Transformation Scripts [Depends on: Tasks 5.1, 5.1a]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/docs/merged/migration-business-rules.md` - Transformation rules
- Migration SQL files for data mapping logic

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/migration-transform.js` - Data transformation logic

Transform existing data:
- Map deal stages to opportunity lifecycle stages
- Create contact_organizations junction records from contact.company_id
- Populate opportunity participants from deal.contact_ids array
- Set initial opportunity probabilities based on stage
- Migrate deal activities to new activities system

#### Task 5.2a: Production Safety Implementation [Depends on: Task 5.0] **CRITICAL FOR PRODUCTION**

**READ THESE BEFORE TASK**
- Production safety assessment from Supabase agents
- PostgreSQL locking documentation

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/migration-production-safe.sql`

Production safety requirements:

1. **Batched Updates** (prevent lock contention):
```sql
-- Update in batches of 10000
DO $$
DECLARE
    batch_size INT := 10000;
    rows_updated INT;
BEGIN
    LOOP
        UPDATE opportunities
        SET customer_organization_id = company_id
        WHERE customer_organization_id IS NULL
        AND company_id IS NOT NULL
        LIMIT batch_size;

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        EXIT WHEN rows_updated = 0;

        -- Log progress
        RAISE NOTICE 'Updated % rows', rows_updated;
        -- Brief pause to reduce load
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;
```

2. **Resource Limits**:
```sql
SET lock_timeout = '10s';
SET statement_timeout = '30min';
SET work_mem = '256MB';
```

3. **Connection Management**:
```sql
-- Terminate other connections gracefully
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
AND pid <> pg_backend_pid()
AND state = 'idle';
```

4. **Progress Monitoring**:
```sql
-- Create progress tracking table
CREATE TABLE migration_progress (
    phase TEXT,
    step TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    rows_processed INT,
    status TEXT
);
```

Required downtime: 2 hours minimum
Test on production clone first: MANDATORY

#### Task 5.3: Post-Migration Verification [Depends on: Tasks 5.1, 5.2, 5.2a]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/crm-migration/requirements.md` (Success Criteria)
- Validation scripts from Task 1.3

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/scripts/migration-verify.js` - Post-migration checks
- `/home/krwhynot/Projects/atomic/scripts/migration-report.js` - Success report generation

Verify migration success:
- Record counts match expectations
- All foreign keys valid
- Business rules satisfied
- Performance baselines met
- Generate success report with metrics

## Advice

- **Transaction Safety**: Always wrap SQL migrations in transactions with savepoints between phases. If any phase fails, rollback to the last successful savepoint rather than losing all progress.

- **State Tracking**: Use the `migration_history` table with granular checkpoints. Track not just phases but individual batches within phases for fine-grained resume capability.

- **View Dependencies**: Database views depend on underlying tables. When renaming deals→opportunities, update all dependent views in the same transaction to avoid broken references.

- **Type Safety**: Create TypeScript union types that support both old (Deal) and new (Opportunity) shapes during the transition period. This prevents runtime errors while maintaining type safety.

- **Filter Compatibility**: The Supabase adapter transforms filters between providers. Test complex filters (OR, nested, array operations) thoroughly as these are most likely to break.

- **Performance Testing**: The activity aggregation query touches 5 large tables. Consider creating a materialized view or caching strategy if performance degrades post-migration.

- **RLS Policies**: Row Level Security policies reference table names directly. Update all policies when renaming tables or they will silently fail, causing data access issues.

- **Kanban Index**: The deal kanban uses an index field for positioning. Preserve these during migration to opportunities or the board layout will be scrambled.

- **Email Arrays**: Contacts use JSONB arrays for emails/phones. The junction table approach for organizations should follow the same flexible pattern.

- **Opportunity Probabilities**: Store probability values as integers (0-100) to match the database schema. Update these automatically based on stage unless manually overridden.

- **Soft Deletes**: Use consistent column names (deleted_at vs archived_at) across all tables. The migration mixes both - standardize to prevent confusion.

- **Testing Order**: Test the rollback procedure immediately after implementing backup, before writing the forward migration. It's easier to fix rollback issues before data is transformed.

- **Activities System**: Phase 1.4 introduces interactions (meetings, calls) and engagements (email, social). These are linked to opportunities and replace the simpler note system. Plan UI changes accordingly.

- **Junction Tables**: Stage 1 introduces several junction tables (contact_organizations, opportunity_participants). These require different React Admin patterns than the current array-based relationships.

- **RLS Policy Critical**: The migration MUST update Row Level Security policies when renaming tables. Missing this will cause complete data access failure. Always check RLS policies reference the new table names.

- **Cache Invalidation**: Not clearing caches will cause users to see stale "deals" data even after successful migration. Plan for Redis, CDN, and application cache clearing.

- **Search Index Rebuild**: Full-text search indexes must be completely rebuilt, not just updated. The TSV columns alone are insufficient - rebuild all search infrastructure.

- **Audit Trail Mapping**: Historical audit logs referencing "deals" need a mapping strategy. Consider a translation layer or batch update of historical records.

- **UI Text Audit**: Beyond component renaming, conduct a full repository search for "deal" in all strings, comments, and documentation. Users will notice any missed labels.

- **Test Data Consistency**: Update ALL test fixtures, seeds, and generators before testing begins. Mismatched test data will cause false test failures.

- **PostgreSQL CHECK Constraint**: NEVER use subqueries in CHECK constraints - PostgreSQL will reject them immediately. Use trigger functions instead.

- **Production Batching**: ALWAYS batch large updates (10,000 rows max) to prevent table locks that block all users. Include progress logging.

- **Backup Before Modify**: Create backup tables BEFORE any schema changes. Use timestamp suffix (e.g., _backup_20250122) for clarity.

- **Validation Gates**: Run pre-migration validation and abort if >1% data issues found. Better to delay than corrupt data.

- **RLS Policy Testing**: After migrating policies, test with an authenticated role to verify access works. Silent RLS failures are hard to debug.