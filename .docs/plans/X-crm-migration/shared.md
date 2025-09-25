# CRM Migration - Shared Architecture

The Atomic CRM migration transforms a simple CRM into an enterprise B2B system with principal-distributor relationships, multi-organization contact support, and enhanced opportunity management. The architecture leverages a dual data provider pattern (FakeRest/Supabase) with React Admin for the frontend, implementing a staged migration approach that maintains backward compatibility while introducing new capabilities through database views, junction tables, and enhanced RLS policies.

## Relevant Files

### Migration Scripts
- `/docs/merged/migrations/stage1/001_phase_1_1_foundation_setup.sql`: Core schema transformations, deals→opportunities rename
- `/docs/merged/migrations/stage1/002_phase_1_2_contact_organization_relationships.sql`: Junction tables for multi-org contacts
- `/docs/merged/migrations/stage1/003_phase_1_3_opportunity_enhancements.sql`: Opportunity participants and product relationships
- `/docs/merged/migrations/stage1/004_phase_1_4_activities_system.sql`: Interaction and engagement tracking system
- `/docs/merged/migrations/stage1_5/005_phase_1_5_basic_principal_features.sql`: Products table and principal-distributor relationships
- `/docs/merged/migrations/rollback/`: Rollback scripts for safe migration reversal
- `/docs/merged/migration-business-rules.md`: Business logic and validation rules for migration

### Database Schema
- `/supabase/migrations/20240730075029_init_db.sql`: Current production schema foundation
- `/supabase/migrations/20250109152531_email_jsonb.sql`: Email field JSONB migration
- `/supabase/migrations/20250113132531_phone_jsonb.sql`: Phone field JSONB migration
- `/supabase/config.toml`: Supabase configuration for local development and auth

### Frontend Components
- `/src/atomic-crm/deals/`: Deal components to be migrated to opportunities
- `/src/atomic-crm/contacts/`: Contact components requiring multi-org support
- `/src/atomic-crm/companies/`: Company components needing principal-distributor features
- `/src/atomic-crm/root/CRM.tsx`: Main application configuration and resource registry
- `/src/atomic-crm/types.ts`: TypeScript types requiring updates for new schema

### Data Providers
- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Production data provider with views and RLS
- `/src/atomic-crm/providers/fakerest/dataProvider.ts`: Demo provider with in-memory data
- `/src/atomic-crm/providers/commons/activity.ts`: Cross-resource activity aggregation
- `/src/atomic-crm/providers/fakerest/internal/supabaseAdapter.ts`: Filter compatibility layer

### Scripts & Automation
- `/scripts/supabase-remote-init.mjs`: Automated Supabase project setup and migration
- `/package.json`: CLI commands for development, testing, and migration execution
- `/scripts/seed-data.js`: Development seed data generator (TO BE UPDATED)
- `/scripts/generate-test-fixtures.js`: Test fixture generator (TO BE UPDATED)

### Migration Execution & Safety (TO BE IMPLEMENTED)
- `/scripts/migrate-production.js`: Main migration CLI command orchestrator - implements `npm run migrate:production`
- `/scripts/migration-dry-run.js`: Dry run validation with <1% warning threshold check
- `/scripts/migration-backup.js`: Automated full database backup before migration
- `/scripts/migration-rollback.js`: Emergency rollback execution with 48-hour window
- `/scripts/migration-state-tracker.js`: Resume capability and state persistence
- `/logs/migration.log`: Dedicated migration log file location

### Testing Infrastructure
- `/src/atomic-crm/providers/**/*.spec.ts`: Unit tests for data transformations and provider logic
- `/tests/migration/dry-run.spec.ts`: Dry run execution validation tests (TO BE CREATED)
- `/tests/migration/rollback.spec.ts`: Rollback scenario tests (TO BE CREATED)
- `/tests/migration/data-integrity.spec.ts`: 100-sample record spot checks (TO BE CREATED)
- `/tests/migration/resume.spec.ts`: Migration resume capability tests (TO BE CREATED)

### Monitoring & Observability (TO BE IMPLEMENTED)
- `/src/atomic-crm/components/MigrationStatus.tsx`: Real-time migration progress display
- `/src/atomic-crm/hooks/useMigrationMonitoring.ts`: Resource monitoring hook (CPU, memory, disk I/O)
- `/src/atomic-crm/pages/MigrationStatusPage.tsx`: Public status page during migration
- `/scripts/migration-monitor.js`: CLI monitoring tool for migration progress
- `/src/atomic-crm/services/migrationMetrics.ts`: Migration metrics collection service

### User Communication (TO BE IMPLEMENTED)
- `/src/atomic-crm/components/MigrationBanner.tsx`: In-app warning banner with countdown
- `/src/atomic-crm/components/MigrationNotification.tsx`: Email notification component
- `/src/atomic-crm/pages/WhatsNew.tsx`: Post-migration feature guide
- `/src/atomic-crm/components/MigrationChecklist.tsx`: User verification checklist UI
- `/templates/migration-emails/`: Email templates for T-24h, T-2h, T-30m notifications
- `/templates/opportunity-notifications/`: Updated notification templates (TO BE CREATED)
- `/templates/report-templates/`: Report generation templates (TO BE UPDATED)

### Data Validation (TO BE IMPLEMENTED)
- `/scripts/validation/referential-integrity.js`: Foreign key validation across all tables
- `/scripts/validation/unique-constraints.js`: Conflict detection for unique fields
- `/scripts/validation/required-fields.js`: Completeness check for new schema requirements
- `/scripts/validation/data-quality.js`: Source data quality assessment
- `/scripts/validation/go-no-go.js`: Automated Go/No-Go decision based on validation results
- `/scripts/validation/pre-migration-validation.sql`: Capture counts, check orphans, create backups
- `/scripts/validation/post-migration-validation.sql`: Verify no data loss, check integrity
- `/scripts/validation/rollback-validation.sql`: Verify backup data can be restored

### External Systems & Integrations (TO BE UPDATED)
- `/config/cache.config.js`: Cache configuration (Redis, application cache)
- `/config/search.config.js`: Search index configuration (Elasticsearch/PostgreSQL FTS)
- `/docs/api/`: API documentation and Swagger/OpenAPI specs
- `/integrations/webhooks/`: Webhook configurations and external API contracts
- `/monitoring/dashboards/`: Grafana/monitoring dashboard configurations
- `/monitoring/alerts/`: Alert rules and thresholds

### Development & Testing Infrastructure (TO BE UPDATED)
- `/tests/fixtures/`: Test data fixtures with deal references
- `/tests/e2e/`: End-to-end tests using old terminology
- `/.env.example`: Environment variable documentation
- `/scripts/dev-setup.js`: Local development environment setup
- `/docs/development/`: Developer documentation with deal references

## ⚠️ CRITICAL: Task Completion Verification

**MIGRATION WILL FAIL IF ANY TASK IS INCOMPLETE**

Every task must be:
1. **100% Complete** - Partial completion equals failure
2. **Verified Twice** - Initial completion + independent verification
3. **Documented** - Mark completion with timestamp and tester name
4. **Tested** - Run the actual code/query to confirm it works

**The difference between 99% and 100% completion is the difference between success and catastrophic failure.**

Example: Missing RLS policies (1 task) = All users locked out of system
Example: Missing view creation (1 line) = Application crashes for all users
Example: Missing backup column (1 task) = No rollback possible if issues occur

## Critical Migration Blockers (MUST FIX BEFORE EXECUTION)

### PostgreSQL Constraint Violation
- **Location**: `/docs/merged/migrations/stage1/002_phase_1_2_contact_organization_relationships.sql:75-82`
- **Issue**: CHECK constraint with subquery - illegal in PostgreSQL
- **Fix**: Replace with trigger function `validate_principal_organization()`

### Missing RLS Policies
- **Issue**: No RLS policy migration from deals to opportunities
- **Impact**: Complete data access failure after migration
- **Fix**: Copy all policies or create new ones for opportunities table

### Missing Critical Views
- **Issue**: drops `deals_summary` but never creates `opportunities_summary`
- **Fix**: Must recreate view immediately after table rename

### No Data Backup Strategy
- **Issue**: Original relationships overwritten without backup
- **Tables Affected**: contacts.company_id, opportunities.company_id
- **Fix**: Add backup columns before migration starts

### Junction Table Population Missing
- **Location**: Phase 1.2 migration
- **Issue**: No INSERT to populate contact_organizations from existing data
- **Fix**: Add migration query to preserve existing relationships

## Relevant Tables

### Current Schema
- `companies`: Organizations with sectors, sizes, and account management
- `contacts`: People with JSONB email/phone arrays and single company association
- `deals`: Sales opportunities with stages and kanban positioning
- `tasks`: Activity tracking with reminders
- `contactNotes` / `dealNotes`: Communication history
- `tags`: Flexible categorization with color themes
- `sales`: User management for CRM access

### Migration Target Schema
- `companies` (enhanced): Adds organization_type enum, principal/distributor flags, parent hierarchy
- `opportunities` (renamed from deals): Enhanced with lifecycle stages, multi-party relationships, probabilities
- `contact_organizations`: Junction table for many-to-many contact-organization relationships
- `products`: Principal-owned product catalog with SKU management
- `principal_distributor_relationships`: Partnership tracking with commission rates
- `migration_history`: Migration execution tracking and state management

### Database Views
- `companies_summary`: Aggregates deal and contact counts for list performance
- `contacts_summary`: Includes company names and task counts with FTS fields
- `contact_influence_profile`: Cross-organization influence metrics (migration target)
- `principal_advocacy_dashboard`: Principal relationship analytics (migration target)

## Relevant Patterns

**Dual Provider Architecture**: Environment-based switching between FakeRest (demo) and Supabase (production) providers with identical interfaces, enabling seamless development to production transitions - see `/src/atomic-crm/root/CRM.tsx:24-26`

**Resource Module Structure**: Consistent organization with index.ts, List, Show, Edit, Create, and Inputs components per feature - example in `/src/atomic-crm/contacts/`

**Modal-Based CRUD**: All edit/create operations use dialog components with route-based state management - see `/src/atomic-crm/deals/DealEdit.tsx`

**Lifecycle Callbacks**: Data transformations and side effects handled through beforeCreate/beforeUpdate/afterCreate hooks - implemented in `/src/atomic-crm/providers/supabase/dataProvider.ts`

**View Abstractions**: Database views optimize list operations while maintaining compatibility - `companies_summary` and `contacts_summary` in `/supabase/migrations/20240730075029_init_db.sql:565-599`

**Soft Delete Pattern**: Timestamp-based soft deletes with `archived_at` / `deleted_at` fields and RLS policy awareness - see migration scripts

**JSONB Flexibility**: Email and phone fields use JSONB arrays for multiple values with types - `/src/atomic-crm/types.ts:31-47`

**Migration Safety**: Transaction-wrapped operations with backup tables and rollback scripts - pattern in `/supabase/migrations/20241221120000_migrate_tag_colors.sql`

**Configuration Context**: Runtime configuration for stages, categories, and theming - `/src/atomic-crm/root/ConfigurationContext.tsx`

**Activity Aggregation**: Cross-resource activity tracking with parallel queries - `/src/atomic-crm/providers/commons/activity.ts`

**Migration Execution Pattern**: CLI command `npm run migrate:production` with explicit confirmation, dry-run requirement, and state tracking - see requirements.md

**Error Handling Pattern**: Transactional batches with individual record failure logging that doesn't halt migration - pattern from requirements.md

**Monitoring Pattern**: Real-time progress updates with resource tracking (CPU, memory, disk I/O) during migration execution - TO BE IMPLEMENTED

**Data Validation Pattern**: Pre-migration validation with Go/No-Go criteria requiring <1% data warnings - see requirements.md

**Rollback Pattern**: Full rollback capability for 48 hours with automated backup restoration - `/docs/merged/migrations/rollback/`

**Idempotency Pattern**: Migration resume capability through state tracking in `migration_history` table with upsert logic

**Backward Compatibility Pattern**: 1-month grace period for old API endpoints with deprecation warnings in development mode

**User Communication Pattern**: Phased notifications at T-24h, T-2h, T-30m with in-app banners and email alerts - TO BE IMPLEMENTED

**Commission Tracking Pattern**: Principal-distributor relationships with configurable commission rates in `principal_distributor_relationships` table

**Cache Invalidation Pattern**: Clear all cache layers (Redis, CDN, application) during migration to prevent stale data - TO BE IMPLEMENTED

**Search Index Rebuild Pattern**: Full reindex of Elasticsearch/FTS after schema changes to ensure search accuracy - TO BE IMPLEMENTED

**Audit Trail Preservation Pattern**: Map historical audit logs from deal references to opportunity references for compliance - TO BE IMPLEMENTED

**Environment Variable Migration Pattern**: Rename all DEAL_* environment variables to OPPORTUNITY_* with backward compatibility - TO BE IMPLEMENTED

**Test Data Migration Pattern**: Update all fixtures, seeds, and test data generators to use opportunity schema - TO BE IMPLEMENTED

**Transaction Safety Pattern**: Wrap entire migration in transaction with savepoints between phases for partial rollback capability - CRITICAL

**Batched Update Pattern**: Process large table updates in 10,000 row batches to prevent memory exhaustion and lock contention - REQUIRED

**Progress Monitoring Pattern**: Log progress every 1000 rows with timing information for visibility during long operations - REQUIRED

**Backup Table Pattern**: Create full backup tables before any modifications with timestamp suffix for emergency recovery - CRITICAL

**RLS Policy Migration Pattern**: Copy existing RLS policies to new tables using pg_policy system catalog to preserve access control - CRITICAL

**Task Completion Verification Pattern**: Every task requires: 1) Implementation 2) Testing 3) Independent review 4) Sign-off with timestamp. Use checklist: `[ ] Implemented [ ] Tested [ ] Reviewed [ ] Signed: Name @ DateTime` - MANDATORY

**Double-Check Pattern**: After completing all tasks, go through entire plan again checking each task output exists and works. Missing even one small item can break entire migration - CRITICAL

## Relevant Docs

**`.docs/plans/crm-migration/requirements.md`**: You _must_ read this when working on migration strategy, safety measures, user experience changes, or testing requirements.

**`.docs/plans/crm-migration/database-research.docs.md`**: You _must_ read this when working on schema transformations, migration scripts, RLS policies, or TypeScript type updates.

**`.docs/plans/crm-migration/frontend-research.docs.md`**: You _must_ read this when working on React Admin components, deal→opportunity UI migration, or multi-organization contact support.

**`.docs/plans/crm-migration/data-provider-research.docs.md`**: You _must_ read this when working on data provider updates, migration execution, backup/rollback implementation, or testing patterns.

**`/docs/merged/migration-business-rules.md`**: You _must_ read this when working on business logic validation, data transformation rules, or migration constraints.

**`CLAUDE.md`**: You _must_ read this when working on any aspect of the codebase to understand architectural decisions and coding standards.