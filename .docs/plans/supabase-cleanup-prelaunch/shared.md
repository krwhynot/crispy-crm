# Supabase Cleanup Pre-Launch - Shared Architecture Reference

**Plan ID**: `supabase-cleanup-prelaunch`
**Created**: 2025-10-15
**Purpose**: Comprehensive reference for implementing pre-launch Supabase infrastructure improvements

This document consolidates architectural knowledge, file references, patterns, and documentation needed to implement the automated test user creation, local-to-cloud sync, CI/CD pipeline, and script organization improvements outlined in requirements.md.

## Architecture Overview

The Atomic CRM uses a **local-first development workflow** with Supabase providing both local (Docker-based) and cloud PostgreSQL databases. The current infrastructure includes comprehensive data generation, validation, and migration tooling, but lacks automated test user management, bidirectional sync capabilities, and production-ready deployment safeguards. The new scripts will bridge these gaps while maintaining consistency with existing patterns.

**Key Architectural Decisions:**
1. **Unified Data Provider**: All database operations flow through a single provider layer that integrates validation, transformation, and PostgREST query formatting
2. **Database Views for Performance**: `contacts_summary` and `organizations_summary` views pre-join data to reduce N+1 queries
3. **Auth-Sales Sync via Triggers**: Database triggers automatically sync `auth.users` → `public.sales` table
4. **Edge Functions for Privileged Operations**: User management requires service role access, implemented via Deno edge functions
5. **Simple RLS Model**: All tables use authenticated-only RLS policies; fine-grained access control happens at application level
6. **Faker-Based Seed Data**: Test data generation uses @faker-js/faker with F&B industry focus

---

## Relevant Files

### Supabase Integration Layer

#### Data Provider Core
- **`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`** (829 lines) - Central data provider consolidating validation, transformation, error logging, and PostgREST formatting. Critical for understanding how database operations work.
- **`src/atomic-crm/providers/supabase/filterRegistry.ts`** (186 lines) - Filterable fields registry preventing 400 errors from stale cached filters. Must be updated after schema changes.
- **`src/atomic-crm/providers/supabase/dataProviderUtils.ts`** - Helper utilities for PostgREST escaping, array filter transformation, full-text search, JSONB normalization.
- **`src/atomic-crm/providers/supabase/authProvider.ts`** (89 lines) - Auth flow with role-based access control and sales table integration.
- **`src/atomic-crm/providers/supabase/supabase.ts`** - Supabase client initialization.

#### Edge Functions (User Management)
- **`supabase/functions/users/index.ts`** - User CRUD operations requiring admin privileges (invite, patch). Essential for test user creation.
- **`supabase/functions/updatePassword/index.ts`** - Password reset functionality.
- **`supabase/functions/_shared/cors-config.ts`** - Dynamic CORS configuration with origin allowlist.
- **`supabase/functions/_shared/supabaseAdmin.ts`** - Admin client for service role operations.

### Database Schema & Migrations

#### Migration Files
- **`supabase/migrations/20251013000000_cloud_schema_sync.sql`** (3445 lines) - Complete production schema with 22 tables, 17 functions, views, indexes, and RLS policies. Primary reference for database structure.
- **`supabase/migrations/20251015014019_restore_auth_triggers.sql`** (29 lines) - Auth triggers for user-sales sync. Critical: triggers excluded from schema dumps, must be manually restored.
- **`supabase/migrations/RECONCILIATION_SUMMARY.md`** - Migration reconciliation notes.

#### Key Tables for This Plan
- **`auth.users`** (Supabase managed) - Core authentication table, synced to `public.sales` via triggers.
- **`public.sales`** (lines 1933-1963) - User management table with `user_id` → `auth.users(id)`, includes `is_admin` flag.
- **`public.contacts`** (lines 1271-1326) - Core contact entity with JSONB email/phone arrays.
- **`public.organizations`** (lines 1329-1362) - Company/org management with hierarchy support.
- **`public.opportunities`** (lines 1488-1542) - Sales pipeline with multi-stakeholder support.
- **`public.activities`** (lines 1117-1144) - Activity tracking with dual behavior (engagements vs. interactions).
- **`public.products`** (lines 1878-1929) - Product catalog with F&B industry focus.

### Validation & Migration Framework

#### Pre-Migration Validation
- **`scripts/validation/run-pre-validation.js`** (426 lines) - Main validation orchestrator. Excellent template for new scripts.
- **`scripts/validation/pre-migration-validation.sql`** - SQL validation queries (7 validation sections).
- **`scripts/validation/go-no-go.js`** (18KB) - Automated migration decision logic with confidence scoring. <1% data warning threshold enforced.
- **`scripts/validation/data-quality.js`** (27KB) - Data quality scoring with weighted metrics.
- **`scripts/validation/referential-integrity.js`** (13KB) - FK integrity validation.

#### Migration Execution
- **`scripts/migrate-production.js`** - Production migration orchestrator with 10 phases and state management. Shows checkpoint/rollback patterns.
- **`scripts/post-migration-validation.js`** - Post-migration verification with multiple validation phases.

### Seed Data Generation

#### Seed Scripts
- **`scripts/seed-data.js`** (900 lines) - **Comprehensive seed data generator**. Excellent template for test user data generation. F&B industry-focused with realistic organization types, job titles, and products.
- **`scripts/seed-products.mjs`** - Product catalog seeding with validation testing.
- **`scripts/add-more-test-data.js`** (15KB) - Incremental data addition without cleanup.

#### Test Utilities
- **`src/tests/utils/mock-providers.ts`** - Mock data factories for unit tests using faker.

### Script Infrastructure

#### Utility Scripts (Reusable Patterns)
- **`scripts/cache-invalidation.js`** (368 lines) - Multi-layer cache management with dry-run support. Good pattern for cleanup operations.
- **`scripts/search-reindex.js`** (19KB) - Search index rebuilding with batch processing.
- **`scripts/supabase-remote-init.mjs`** (228 lines) - Remote Supabase initialization using CLI commands.

### Configuration & Documentation

#### Configuration Files
- **`supabase/config.toml`** - Local Supabase configuration (ports, PostgreSQL 15, auth settings, **storage disabled**).
- **`.env.example`** - Environment variable templates including opportunity configs.
- **`package.json`** - NPM scripts reference (67 scripts organized by category).

#### Documentation
- **`CLAUDE.md`** - Project architecture overview, essential commands, and migration patterns.
- **`docs/supabase/supabase_workflow_overview.md`** - Complete Supabase workflow guide (local to cloud).
- **`docs/supabase/supabase_commands_reference.md`** - Comprehensive Supabase CLI command reference.
- **`docs/database/migration-business-rules.md`** - 45 business rules enforced by validation framework.

---

## Relevant Tables

### Critical for Test User Creation & Sync
- **`auth.users`** - Supabase authentication table (cannot be directly modified, requires Edge Functions or CLI)
- **`public.sales`** - User management table synced from auth.users via triggers
- **`public.test_user_metadata`** - **NEW TABLE TO CREATE**: Tracks test users with role and data counts (simple tracking, no complex audit logging)

### Critical for Sync Operations
- **`public.migration_history`** - Migration tracking (supplemental to Supabase's built-in tracking)
- **`public.segments`** - Industry segments (uses uuid PK instead of bigint)

**Note**: Requirements originally specified `sync_operations_log` table, but this is over-engineered for pre-launch test data. Use simple console logging instead.

### Core CRM Entities (Will Be Synced)
- **`public.contacts`**, **`public.organizations`**, **`public.opportunities`**
- **`public.activities`**, **`public.tasks`**, **`public.contactNotes`**, **`public.opportunityNotes`**
- **`public.products`** and 7 product-related tables (pricing, inventory, features, etc.)
- **`public.tags`**, **`public.contact_preferred_principals`**

### Junction Tables
- **`public.contact_organizations`** (DEPRECATED but maintained for historical data)
- **`public.opportunity_participants`** (multi-stakeholder tracking)
- **`public.interaction_participants`** (activity attendance)

---

## Relevant Patterns

### 1. Auth-Sales Sync Pattern
**Location**: `supabase/migrations/20251015014019_restore_auth_triggers.sql`

Database triggers automatically sync user data from `auth.users` to `public.sales`:
- `on_auth_user_created` → `handle_new_user()` - Creates sales record when user signs up
- `on_auth_user_updated` → `handle_update_user()` - Syncs email changes

**Critical Gotcha**: Triggers excluded from `supabase db dump --schema public`, must be manually restored after schema sync. This is essential knowledge for the sync scripts.

### 2. Edge Function User Management Pattern
**Location**: `supabase/functions/users/index.ts`

Supabase lacks public API for user management. Edge functions provide secure API layer:
- POST /users - Invite new user (admin only)
- PATCH /users - Update user (admin or self)
- Uses `supabaseAdmin.auth.admin.*` methods with service role key
- Permission checks: Only administrators can invite/update users

**Usage Example**:
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/users" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"TestPass123!","first_name":"Admin","last_name":"User","administrator":true}'
```

### 3. Faker-Based Data Generation Pattern
**Location**: `scripts/seed-data.js`

Class-based generator with phased execution:
- Environment-driven configuration (`SEED_*_COUNT` variables)
- Dependency-ordered insertion (orgs → contacts → opportunities → activities)
- Dry-run support with `--dry-run` flag
- Industry-specific constants (44 F&B company names, 20 org types, 24 job titles)

**Key Methods**: `generateOrganizations()`, `generateContacts()`, `generateOpportunities()`, `insertData()`

### 4. Multi-Stage Validation Pattern
**Location**: `scripts/validation/run-pre-validation.js`

Validation separated into three stages:
1. **Pre-Migration SQL Validation**: Database-native checks (7 sections: entity counts, orphans, FKs, required fields, data quality, disk space, backups)
2. **Pre-Migration JavaScript Validation**: Complex business logic validation with external API integration
3. **Post-Migration Verification**: Comprehensive validation after migration execution

**Severity-Based Blocking**: CRITICAL → HIGH → MEDIUM → LOW with automated go/no-go decision logic.

### 5. Local-to-Remote Sync Pattern (To Be Implemented)
**Requirements Reference**: `requirements.md` lines 174-303

Proposed implementation:
1. Backup cloud database (pg_dump)
2. Dump local data (exclude auth/storage schemas)
3. Clear cloud data (TRUNCATE CASCADE)
4. Import local data to cloud
5. Sync auth.users separately (preserve encrypted passwords)
6. Log sync operation
7. Verify counts match

**Critical Challenge**: Auth user password preservation requires extracting `encrypted_password` from local `auth.users` and inserting to cloud, or using Edge Functions to recreate users.

### 6. Checkpoint & Rollback Pattern
**Location**: `scripts/migrate-production.js`

Migration state tracked in JSON with phase-level checkpoints:
```javascript
state = {
  startedAt: timestamp,
  completedPhases: [{id, completedAt}],
  currentPhase: "phase_1_1",
  errors: [{timestamp, phase, error}],
  warnings: [{timestamp, phase, warning}]
}
```

Allows resume after failure and provides rollback capability.

### 7. RLS Policy Pattern
**Location**: `supabase/migrations/20251013000000_cloud_schema_sync.sql` (lines 2839-2930+)

All tables use simple authenticated-only policies:
```sql
CREATE POLICY "authenticated_select_{table}" ON public.{table}
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);
```

**Security Note**: No user isolation at database level. `sales_id` and `created_by` track ownership but don't restrict access. Fine-grained access control must be implemented at application level.

### 8. JSONB Array Handling Pattern
**Location**: `src/atomic-crm/providers/supabase/dataProviderUtils.ts`

Contact email/phone stored as JSONB arrays, require special handling:
```javascript
// JSONB array fields use @cs (contains) operator
{tags: [1, 2, 3]} → {"tags@cs": "{1,2,3}"}

// Regular enum fields use @in operator
{status: ["active", "pending"]} → {"status@in": "(active,pending)"}
```

Response normalization ensures arrays: `normalizeJsonbArrayFields(data)`

### 9. Dry-Run Support Pattern
**Universal Pattern Across All Scripts**:
```javascript
const isDryRun = process.argv.includes("--dry-run");
if (isDryRun) {
  console.log("[DRY RUN] Would execute action");
  return;
}
```

### 10. Console Output Pattern
**Standard Pattern Using chalk + ora**:
```javascript
import chalk from "chalk";
import ora from "ora";

const spinner = ora();
spinner.start("Processing...");
spinner.succeed("Completed");

console.log(chalk.blue("ℹ Info message"));
console.log(chalk.green("✔ Success"));
console.log(chalk.yellow("⚠ Warning"));
console.log(chalk.red("✖ Error"));
```

---

## Relevant Docs

### Primary References (MUST READ)
**`.docs/plans/supabase-cleanup-prelaunch/requirements.md`** - You _must_ read this when working on ANY aspect of this plan. Contains complete feature specification, technical approach, UI/UX flows, success metrics, and implementation order.

**`.docs/plans/supabase-cleanup-prelaunch/supabase-integration.research.md`** - You _must_ read this when working on data provider integration, auth flow, edge functions, database views, or triggers. Contains 10 architectural patterns and 10 gotchas.

**`.docs/plans/supabase-cleanup-prelaunch/validation-migration.research.md`** - You _must_ read this when working on validation framework, migration patterns, or CI/CD integration. Documents multi-stage validation, severity-based blocking, and go/no-go logic.

**`.docs/plans/supabase-cleanup-prelaunch/seed-data.research.md`** - You _must_ read this when working on test user creation, data generation, or role-specific data volumes. Documents faker patterns, Edge Function usage, and database initialization.

**`.docs/plans/supabase-cleanup-prelaunch/database-schema.research.md`** - You _must_ read this when working on database structure, relationships, indexes, constraints, or RLS policies. Contains 22 table definitions, relationship diagrams, and 20 gotchas.

**`.docs/plans/supabase-cleanup-prelaunch/scripts-commands.research.md`** - You _must_ read this when working on script organization, npm commands, environment configuration, or Supabase CLI usage. Documents 67 npm scripts, script patterns, and tooling gaps.

### Project Documentation
**`CLAUDE.md`** - You _must_ read this when starting work on this project. Contains project overview, essential commands, migration patterns, code quality conventions, and common development tasks.

**`docs/supabase/supabase_workflow_overview.md`** - You _must_ read this when working on Supabase workflows, local-to-cloud sync, or migration deployment. Complete workflow guide with step-by-step instructions.

**`docs/database/migration-business-rules.md`** - You _must_ read this when working on data integrity, validation rules, or business logic enforcement. Documents 45 business rules enforced by validation framework.

### API References
**Supabase Edge Functions**: https://supabase.com/docs/guides/functions - Read this for Edge Function development, deployment, and secrets management.

**Supabase Auth Admin API**: https://supabase.com/docs/reference/javascript/auth-admin-createuser - Read this for user creation/management programmatic patterns.

**Supabase CLI Documentation**: https://supabase.com/docs/guides/cli - Read this for CLI command reference, local development, and migrations.

**PostgreSQL Full-Text Search**: https://www.postgresql.org/docs/current/textsearch.html - Read this when working with `search_tsv` columns and full-text search indexing.

**PostgREST API Documentation**: https://postgrest.org/en/stable/api.html - Read this for query syntax, operators, filtering, and JSONB handling.

### Internal Implementation References
**`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`** - Read this when understanding how database operations work. Shows validation → transformation → execution → normalization pipeline.

**`scripts/seed-data.js`** - Read this when implementing test data generation. Comprehensive example of faker usage, dependency-ordered insertion, and cleanup patterns.

**`scripts/validation/run-pre-validation.js`** - Read this when implementing validation logic. Well-structured orchestrator showing SQL execution, JSON report generation, and error handling.

**`scripts/migrate-production.js`** - Read this when implementing migration orchestration. Shows phase management, state tracking, user confirmations, and rollback patterns.

---

## Critical Gotchas & Common Pitfalls

### 1. Auth Table Access Restrictions
**Issue**: `auth.users` cannot be directly modified via PostgREST API.
**Solution**: Use Edge Functions (`supabase/functions/users`) with service role key or `supabase auth admin` CLI commands.
**Impact**: Test user creation must use Edge Function approach.

### 2. Triggers Excluded from Schema Dumps
**Issue**: `supabase db dump --schema public` excludes triggers on `auth.users` table.
**Why**: Triggers are in `auth` schema but execute functions in `public` schema; dump doesn't follow cross-schema references.
**Solution**: Manually restore auth triggers after schema sync (see `20251015014019_restore_auth_triggers.sql`).
**Detection**: If new users don't appear in `sales` table after signup, triggers are missing.

### 3. Contact Email/Phone Are JSONB Arrays
**Issue**: `contacts.email` and `contacts.phone` are JSONB arrays, not text fields.
**Format**: `[{"type":"work","value":"email@example.com","primary":true}]`
**Impact**: Queries must use JSONB operators. Simple string search won't work.
**Solution**: Use `email::text ILIKE '%pattern%'` or JSONB containment operators.

### 4. Deprecated contact_organizations Junction Table
**Issue**: Schema comments mark `contact_organizations` as DEPRECATED, but table remains with full indexes.
**Current Approach**: New contacts use `contacts.organization_id` directly.
**Legacy Data**: Historical many-to-many relationships remain in junction table.
**Impact**: Sync scripts must handle both patterns when syncing contact-organization relationships.

### 5. RLS Policies Don't Isolate Users
**Issue**: All RLS policies check `auth.uid() IS NOT NULL`, meaning any authenticated user can access all data.
**Implication**: No user isolation at database level. `sales.is_admin` flag is not used in RLS policies.
**Impact**: Test users can see/modify each other's data. This is acceptable pre-launch but must be addressed for multi-tenant scenarios.

### 6. Storage Service Disabled Locally
**Issue**: `supabase/config.toml` line 64 shows `enabled = false` for storage API due to CLI/Storage API version mismatch.
**Impact**: File upload features won't work in local development.
**Workaround**: Test file uploads in cloud environment, or update Supabase CLI to resolve version mismatch.

### 7. Product SKU Uniqueness Per Principal
**Constraint**: `unique_sku_per_principal` on (principal_id, sku, deleted_at).
**Gotcha**: SKU is unique within a principal (brand), but multiple principals can have same SKU. Includes `deleted_at`, so soft-deleting allows reusing SKU.

### 8. Quantity Available is Computed Column
**Issue**: `product_inventory.quantity_available` is GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED.
**Gotcha**: Cannot directly INSERT/UPDATE this column. Modify source columns instead.

### 9. Segment Table Uses UUID Primary Key
**Issue**: `segments.id` is `uuid`, while all other tables use `bigint` PKs.
**Impact**: Type mismatch in joins. `organizations.segment_id` is `uuid` to match.

### 10. Validation BEFORE Transformation
**Critical Ordering**: `unifiedDataProvider.ts` validates data with original field names BEFORE transforming them for database.
**Why**: Zod schemas expect original field names from forms. Transformations rename fields for database compatibility (e.g., `products` → `products_to_sync`).
**Impact**: New validation logic must follow this pattern or will fail.

---

## Implementation Checklist

Use this checklist to track progress on the supabase-cleanup-prelaunch plan:

### Phase 1: Foundation (Day 1-2)
- [ ] Create directory structure (`scripts/dev/`, `scripts/migration/`, `scripts/monitoring/`)
- [ ] Create migration: `20251016000000_add_test_users_metadata.sql`
- [ ] Create migration: `20251016000001_add_sync_log_table.sql`
- [ ] Apply migrations locally and to cloud
- [ ] Create `.env.production` template

### Phase 2: Core Scripts (Day 2-4)
- [ ] Create `scripts/dev/create-test-users.sh` - Test with local first
- [ ] Create `scripts/dev/sync-local-to-cloud.sh` - Test with small dataset
- [ ] Create `scripts/dev/verify-environment.sh` - Validate sync works
- [ ] Create `scripts/dev/reset-environment.sh` - Test full cycle
- [ ] Create `scripts/migration/backup.sh`
- [ ] Create `scripts/migration/validate.sh`
- [ ] Create `scripts/migration/deploy-safe.sh`
- [ ] Create `scripts/migration/rollback.sh`

### Phase 3: Monitoring & Tooling (Day 4-5)
- [ ] Create `scripts/monitoring/health-check.sh`
- [ ] Create `scripts/monitoring/status-report.sh`
- [ ] Update `package.json` with new npm scripts
- [ ] Test all scripts end-to-end

### Phase 4: CI/CD (Day 5-6)
- [ ] Create `.github/workflows/supabase-deploy.yml`
- [ ] Configure GitHub environment for manual approval
- [ ] Add required secrets to GitHub
- [ ] Test CI/CD with dummy migration

### Phase 5: Documentation & Polish (Day 6-7)
- [ ] Storage service investigation (30min timebox)
- [ ] Create `scripts/supabase/README.md`
- [ ] Update `docs/supabase/supabase_workflow_overview.md`
- [ ] Final end-to-end test

---

## Environment Variable Reference

### Required for All Scripts
```bash
VITE_SUPABASE_URL=http://localhost:54321                    # Local
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co  # Cloud
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required for User Creation & Sync
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Service role key
DATABASE_URL_PRODUCTION=postgresql://postgres:[PASSWORD]@db.aaqnanddcqvfiwhshndl.supabase.co:5432/postgres
TEST_ADMIN_EMAIL=admin@test.local
TEST_DIRECTOR_EMAIL=director@test.local
TEST_MANAGER_EMAIL=manager@test.local
TEST_USER_PASSWORD=TestPass123!
```

### Optional Configuration
```bash
SEED_ORGANIZATION_COUNT=50
SEED_CONTACT_COUNT=100
SEED_OPPORTUNITY_COUNT=75
OPPORTUNITY_DEFAULT_STAGE=new_lead
OPPORTUNITY_PIPELINE_STAGES=new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost
```

---

## Success Criteria

### Scripts
- ✅ All 10 new scripts created and executable
- ✅ All scripts have error handling and clear output
- ✅ Scripts work on both local and cloud targets
- ✅ Dry-run mode supported universally
- ✅ Backup created before all destructive operations

### CI/CD
- ✅ GitHub Actions workflow enabled and passing
- ✅ Manual approval gate working
- ✅ Dry-run step catches schema issues
- ✅ Post-deployment validation runs automatically

### Test Users
- ✅ 3 test users auto-created with role-specific data
- ✅ Login works in both local and cloud
- ✅ Each user has correct permission level
- ✅ Admin: 100 contacts, 50 orgs, 75 opps
- ✅ Director: 60 contacts, 30 orgs, 40 opps
- ✅ Manager: 40 contacts, 20 orgs, 25 opps

### Sync Operations
- ✅ Local → Cloud sync works without data loss
- ✅ Verification shows matching counts
- ✅ Auth users sync with passwords intact
- ✅ Sync operation log tracks history

### Monitoring
- ✅ Health checks return proper exit codes
- ✅ Status reports show accurate metrics
- ✅ Sync operation log provides debugging info

---

## Quick Reference Commands

### Local Development
```bash
npm run supabase:local:start          # Start local Supabase
npm run dev:local                     # Reset DB + start dev server
npm run dev:users:create              # Create 3 test users locally
npm run seed:data                     # Generate test data
```

### Sync Operations (To Be Implemented)
```bash
npm run dev:sync:push -- --force      # Push local data to cloud
npm run dev:verify                    # Verify local/cloud parity
npm run dev:reset                     # Reset both environments
```

### Migration & Deployment
```bash
npm run validate:pre-migration        # Run validation framework
npm run migrate:production            # Production migration
npm run migrate:validate              # Post-migration validation
npm run supabase:deploy               # Deploy migrations + functions
```

### Monitoring (To Be Implemented)
```bash
npm run monitor:health                # Quick health check
npm run monitor:health -- cloud       # Check cloud health
npm run monitor:status -- cloud       # Detailed status report
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-15
**Maintained By**: Claude Code (Sonnet 4.5)
**Status**: Complete - Ready for Implementation
