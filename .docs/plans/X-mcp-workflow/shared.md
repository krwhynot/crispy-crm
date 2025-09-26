# MCP Workflow Transition - Architecture Overview

The MCP workflow transition transforms the Atomic CRM from a Docker-dependent local development model to a cloud-first approach using Model Context Protocol (MCP) tools. This transition maintains the robust database-first architecture where PostgreSQL schema drives TypeScript types, while eliminating the need for Docker, Supabase CLI, and local database infrastructure. The system uses sophisticated hash-based change detection to minimize type regeneration overhead and comprehensive validation to ensure type safety throughout the build pipeline.

## Relevant Files

### Type Generation & Build System
- `/scripts/generate-types.cjs`: Core type generation script with SHA256 hash tracking and schema validation
- `/scripts/check-migrations.cjs`: Migration change detection and automatic type regeneration trigger
- `/src/types/database.generated.ts`: Auto-generated TypeScript types from database schema (never edited manually)
- `/src/types/supabase.ts`: Legacy type file to be removed during MCP transition
- `/.migration-hash`: Git-ignored file tracking migration changes for efficient regeneration
- `/package.json`: 65+ npm scripts including type generation, migration, and validation commands
- `/makefile`: High-level orchestration commands with Docker dependencies to be replaced
- `/vite.config.ts`: Advanced build configuration with chunk splitting and compression

### Migration Management
- `/supabase/migrations/`: Primary migration directory with timestamp and sequential numbered files
- `/supabase/migrations/fixed/`: Core migration phases (000-106) for schema transformation
- `/scripts/migration-execute.js`: Core migration orchestration engine with resume capability
- `/scripts/migration-rollback.js`: Emergency rollback system with 48-hour window
- `/scripts/post-migration-validation.js`: Comprehensive post-migration validation suite
- `/scripts/final-verification.js`: Final integrity checks after migration completion

### Test Infrastructure
- `/vitest.config.ts`: Test configuration with coverage thresholds (60% global, 70-80% critical)
- `/src/tests/smoke/db-smoke.test.ts`: Database connectivity and basic operation tests
- `/src/tests/smoke/critical-path.test.ts`: Business workflow validation tests
- `/src/tests/integration/`: End-to-end data provider and transformer tests
- `/.env.example`: Environment configuration with hardcoded localhost URLs to be updated

### CI/CD Integration
- `/.github/workflows/check.yml`: 5-stage validation pipeline requiring type/migration sync
- `/scripts/validate-environment.cjs`: Environment validation supporting both local and remote
- `/scripts/pre-deploy-check.js`: Pre-deployment validation checks

### Data Provider & Transformers
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Single consolidated data provider
- `/src/atomic-crm/transformers/`: Bidirectional conversion between database and application types
- `/src/atomic-crm/transformers/utils.ts`: Core transformation utilities (toDate, toIdentifier, etc.)

## Relevant Tables

### Core Business Entities
- `organizations`: Company records with sectors (renamed from companies)
- `contacts`: People with JSONB email/phone arrays for flexibility
- `opportunities`: Sales pipeline management (migrated from deals)
- `tasks`: Activity tracking with reminders
- `tags`: Categorization with semantic color tokens

### Relationship Tables
- `contact_organization`: Many-to-many junction table
- `opportunity_contacts`: Opportunity participants tracking
- `contactNotes`: Communication history for contacts
- `opportunityNotes`: Communication history for opportunities

### Summary Views (Optimized for Lists)
- `organizations_summary`: Aggregated organization data with counts
- `contacts_summary`: Contact list with computed fields
- `opportunities_summary`: Pipeline view with stage information
- `init_state`: Migration state tracking view

## Relevant Patterns

### Database-First Architecture
**Pattern**: PostgreSQL schema is the single source of truth, with TypeScript types auto-generated and never manually edited. See example: `/scripts/generate-types.cjs:120-150`

### Hash-Based Change Detection
**Pattern**: SHA256 hash of migration file metadata (name + mtime + size) determines when type regeneration is needed, avoiding unnecessary network calls. Implementation: `/scripts/generate-types.cjs:58-75`

### Unified Data Provider
**Pattern**: Single consolidated data provider handles all CRUD operations through React Admin's DataProvider interface with integrated transformations. Core implementation: `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

### Transformer Registry
**Pattern**: Each database entity has a corresponding transformer for bidirectional conversion between database and application types. Example: `/src/atomic-crm/transformers/organizations.ts`

### Migration State Tracking
**Pattern**: Comprehensive migration history table with savepoints enables resume from interrupted migrations and partial rollbacks. Implementation: `/scripts/migration-execute.js:200-250`

### Test Data Cleanup Hooks
**Pattern**: AfterAll hooks track and delete test data using service role to bypass RLS, ensuring clean test environment. Example: `/src/tests/smoke/critical-path.test.ts:50-70`

### Environment-Aware Execution
**Pattern**: Scripts detect local vs remote vs CI environments and adapt behavior accordingly, with graceful fallbacks. Implementation: `/scripts/generate-types.cjs:300-350`

### Schema Validation Framework
**Pattern**: Comprehensive validation of required tables, views, enums, and columns ensures database integrity before operations. Core logic: `/scripts/generate-types.cjs:180-250`

## Relevant Docs

**`/home/krwhynot/Projects/atomic/CLAUDE.md`**: You _must_ read this when working on any aspect of the codebase - contains critical architecture rules, conventions, and database-first principles.

**`/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/requirements.md`**: You _must_ read this when implementing MCP workflow features - contains complete functional and non-functional requirements, implementation phases, and success criteria.

**`/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/type-generation-research.docs.md`**: You _must_ read this when modifying type generation, migration hash system, or build integration.

**`/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/test-infrastructure-research.docs.md`**: You _must_ read this when updating test configuration, removing hardcoded URLs, or implementing cloud database connectivity.

**`/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/migration-system-research.docs.md`**: You _must_ read this when working on migration application, rollback mechanisms, or CI/CD integration.

**`/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/build-system-research.docs.md`**: You _must_ read this when modifying npm scripts, updating Makefile commands, or changing the build pipeline.