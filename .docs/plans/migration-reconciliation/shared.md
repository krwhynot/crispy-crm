# Database Migration Reconciliation System

The migration reconciliation system addresses a critical drift between filesystem migrations (8 files) and database reality (67 migrations) by establishing the database as the single source of truth, implementing a baseline schema approach, and enforcing strict MCP-based workflows with automated drift detection through CI/CD pipelines.

## Relevant Files

### Core Migration Files
- `/supabase/migrations/20250926130000_baseline_schema.sql`: Consolidated baseline representing 65+ migrations
- `/supabase/migrations/RECONCILIATION_SUMMARY.md`: Migration history and reconciliation documentation
- `/supabase/migrations/archive/`: Historical migration files preserved for audit
- `/schema.sql`: Repository root baseline for drift detection (to be created)

### MCP Migration Tools
- `/scripts/mcp-migrate.js`: Primary migration execution engine with dry-run and rollback
- `/scripts/mcp-migrate-create.js`: Template-based migration file creation
- `/scripts/mcp-migrate-status.js`: Status checking and rollback eligibility
- `/scripts/mcp-generate-types.cjs`: Hash-based TypeScript type generation

### Validation & Testing
- `/src/atomic-crm/__tests__/migration-verification.test.ts`: Comprehensive schema verification
- `/scripts/validation/run-pre-validation.js`: Pre-migration validation orchestrator
- `/scripts/validation/go-no-go.js`: Migration readiness assessment

### CI/CD & Automation
- `/.github/workflows/check.yml`: CI workflow with linting and testing
- `/.github/workflows/deploy.yml`: Deployment with automatic migration push
- `/.husky/pre-commit`: Hook framework (to be implemented)

### Data Provider & Schema
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified data provider (783 lines)
- `/src/types/database.generated.ts`: Auto-generated TypeScript types
- `/src/atomic-crm/validation/`: Zod schemas at API boundaries

### Configuration
- `/.mcp.json`: MCP server configuration with environment setup
- `/.claude/settings.local.json`: Claude Code MCP permissions
- `/CLAUDE.md`: Engineering Constitution with migration standards

## Relevant Tables

### Migration Tracking
- `_migrations`: Supabase native DDL migration tracking
- `migration_history`: Custom business logic migration phases with rollback SQL

### Core Business Tables
- `opportunities`: Sales pipeline with multi-principal support
- `organizations`: Companies with hierarchical relationships
- `contacts`: People with JSONB email/phone arrays
- `contact_organizations`: Many-to-many junction with roles
- `opportunity_participants`: Multi-stakeholder opportunity tracking

## Relevant Patterns

**Baseline Schema Pattern**: Consolidates 65+ migrations into single baseline rather than reconstructing history, example in `/supabase/migrations/20250926130000_baseline_schema.sql`

**MCP-Only Workflow**: All database operations use MCP tools exclusively, eliminating CLI drift, implemented in `/scripts/mcp-migrate.js`

**Registry-Based Validation**: Resource-specific validation and transformation registries, see `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts:50-100`

**Summary View Strategy**: List operations use `_summary` views while CRUD uses base tables, configured in `/src/atomic-crm/providers/supabase/resources.ts`

**Soft Delete with Constraints**: Exclusion constraints ensure uniqueness for non-deleted records, pattern throughout schema

**Hash-Based Type Generation**: Incremental type updates only when migrations change, see `/scripts/mcp-generate-types.cjs:calculateHash()`

**48-Hour Rollback Window**: Migration rollback eligibility tracking, implemented in `/scripts/mcp-migrate-status.js`

**Full-Text Search Triggers**: Automatic search vector maintenance, defined in baseline schema

**YYYYMMDDHHMMSS Format**: Strict timestamp naming per Constitution, enforced by creation tools

## Relevant Docs

**`/home/krwhynot/Projects/atomic/.docs/plans/migration-reconciliation/requirements.md`**: You _must_ read this when working on baseline creation, pre-commit hooks, or CI/CD drift detection workflows.

**`/home/krwhynot/Projects/atomic/CLAUDE.md`**: You _must_ read this when working on migration naming conventions, MCP vs CLI workflows, or Engineering Constitution compliance.

**`/home/krwhynot/Projects/atomic/supabase/migrations/RECONCILIATION_SUMMARY.md`**: You _must_ read this when working on understanding migration history, reconciliation decisions, or baseline approach rationale.

**`/home/krwhynot/Projects/atomic/docs/mcp-troubleshooting.md`**: You _must_ read this when working on MCP tool configuration, network issues, or debugging MCP operations.

**`/home/krwhynot/Projects/atomic/.docs/plans/migration-reconciliation/migration-files.docs.md`**: You _must_ read this when working on migration file management, tracking systems, or archive patterns.

**`/home/krwhynot/Projects/atomic/.docs/plans/migration-reconciliation/data-provider.docs.md`**: You _must_ read this when working on data provider integration, validation patterns, or type generation.

**`/home/krwhynot/Projects/atomic/.docs/plans/migration-reconciliation/cicd-workflows.docs.md`**: You _must_ read this when working on GitHub Actions, deployment automation, or testing infrastructure.

**`/home/krwhynot/Projects/atomic/.docs/plans/migration-reconciliation/database-schema.docs.md`**: You _must_ read this when working on schema structure, RLS policies, or performance optimization.

**`/home/krwhynot/Projects/atomic/.docs/plans/migration-reconciliation/mcp-tools.docs.md`**: You _must_ read this when working on MCP configuration, tool usage patterns, or environment setup.