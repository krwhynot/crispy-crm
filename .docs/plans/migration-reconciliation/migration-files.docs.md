# Database Migration System Research

Comprehensive analysis of the Atomic CRM database migration system architecture, including current files, naming conventions, tracking mechanisms, and application tools.

## Relevant Files

- `/home/krwhynot/Projects/atomic/supabase/migrations/20250926130000_baseline_schema.sql`: Current baseline schema representing consolidated state
- `/home/krwhynot/Projects/atomic/supabase/migrations/RECONCILIATION_SUMMARY.md`: Migration reconciliation documentation and status
- `/home/krwhynot/Projects/atomic/supabase/migrations/archive/`: Archived migration files (8 files from inconsistent state period)
- `/home/krwhynot/Projects/atomic/scripts/mcp-migrate.js`: MCP-based migration application engine
- `/home/krwhynot/Projects/atomic/scripts/mcp-migrate-create.js`: Migration file creation tool with naming validation
- `/home/krwhynot/Projects/atomic/scripts/mcp-migrate-status.js`: Migration status checking utilities
- `/home/krwhynot/Projects/atomic/src/atomic-crm/__tests__/migration-verification.test.ts`: Comprehensive migration verification test suite
- `/home/krwhynot/Projects/atomic/supabase/config.toml`: Supabase configuration for local development

## Architectural Patterns

- **Baseline Schema Approach**: Single consolidated baseline migration (20250926130000) replaces 65+ historical migrations
- **Archive Pattern**: Previous migrations moved to `/archive/` directory instead of deletion for audit trail
- **MCP-First Workflow**: All database operations use Supabase MCP tools instead of CLI for consistency
- **Migration History Tracking**: Custom `migration_history` table for business logic migration phases
- **YYYYMMDDHHMMSS Naming**: Engineering Constitution compliance with 14-digit timestamp format
- **Fresh Start Architecture**: Complete "deals" to "opportunities" terminology migration with no backward compatibility

## Edge Cases & Gotchas

- **Dual Migration Systems**: Custom `migration_history` table exists alongside Supabase's native `_migrations` table for different purposes
- **Archive vs Delete**: Historical migrations archived (not deleted) due to reconciliation drift between filesystem and database state
- **65 vs 8 Discrepancy**: Database had 65 applied migrations while filesystem only had 8 files, requiring baseline consolidation approach
- **MCP vs CLI Workflow**: Local development uses MCP tools while CI/CD traditionally used Supabase CLI, causing drift
- **No Local Supabase**: Development connects directly to remote Supabase project, no local instance required
- **Service Role vs Anon Key**: Different permission levels used in migration verification tests vs application code
- **Timestamp Conflicts**: Migration numbering starts from 108+ to avoid conflicts with existing sequences

## Current Migration State

### Active Migrations
- `20250926130000_baseline_schema.sql`: Placeholder baseline representing 65 consolidated migrations

### Archived Migrations
- `20250125000000_fresh_crm_schema.sql`: Original comprehensive CRM schema (65,452 bytes)
- `20250126000000_organization_pipeline_migration.sql`: Company to organization terminology migration
- `20250126103000_add_set_primary_organization_rpc.sql`: RPC function for primary organization setting
- `20250925094751_fix_summary_view_permissions.sql`: Security definer view permissions fix
- `20250926002021_add_set_primary_organization_rpc.sql`: Duplicate RPC function migration
- `20250926005310_remove_backward_compatibility.sql`: Cleanup of legacy deals references
- `20250926113415_create_missing_summary_views.sql`: React Admin summary views creation
- `20250126000000_fix_organization_terminology.sql`: Additional terminology cleanup

### Migration Tracking Tables

1. **Custom Migration History** (`migration_history`):
   ```sql
   - id: BIGSERIAL PRIMARY KEY
   - phase_number: TEXT (business logic phases)
   - phase_name: TEXT (human readable names)
   - status: TEXT (pending/completed/error)
   - started_at/completed_at: TIMESTAMPTZ
   - error_message: TEXT
   - rollback_sql: TEXT
   - rows_affected: BIGINT
   ```

2. **Supabase Native** (`_migrations`):
   - Used by Supabase CLI for DDL migration tracking
   - Separate from custom business logic migration phases

## Migration Application Tools

### MCP Tools (Primary)
- **Apply Migration**: `mcp__supabase__apply_migration(project_id, name, query)` for DDL operations
- **Execute SQL**: `mcp__supabase__execute_sql(project_id, query)` for data queries
- **List Migrations**: `mcp__supabase__list_migrations(project_id)` shows filesystem migrations only

### Script Utilities
- **mcp-migrate.js**: Comprehensive migration engine with dry-run capability, state tracking, and 48-hour rollback window
- **mcp-migrate-create.js**: Template-based migration file creation with sequential numbering from 108+
- **mcp-migrate-status.js**: Status checking and drift detection utilities

### Validation & Testing
- **migration-verification.test.ts**: Vitest-based comprehensive schema verification
- **validate-provider-consolidation.ts**: Constitution compliance validation
- **Performance tests**: Junction table and query optimization verification

## Migration Naming Conventions

### Engineering Constitution Format
- **Pattern**: `YYYYMMDDHHMMSS_descriptive_name.sql`
- **Example**: `20250926130000_baseline_schema.sql`
- **Enforcement**: ESLint rules and script validation prevent non-compliant names

### Content Structure
```sql
-- Migration header with purpose and date
-- Business context and rationale
-- DDL statements with proper ordering
-- Index creation for performance
-- RLS policy definitions
-- Trigger and function creation
-- Migration history tracking insert
```

## Key Insights

1. **Reconciliation Approach**: System chose "database as source of truth" over "filesystem as source of truth" due to operational complexity

2. **Baseline Strategy**: Single baseline migration consolidates 65 historical migrations into current state rather than maintaining full history

3. **MCP-Only Workflow**: Complete migration to MCP tools eliminates CLI/MCP drift but requires different mental model from traditional Supabase development

4. **Custom Migration Tracking**: Business logic migrations tracked separately from DDL migrations, enabling different rollback and monitoring strategies

5. **Archive Pattern**: Historical migrations preserved for audit rather than deleted, maintaining forensic capability

6. **Constitution Compliance**: Strict adherence to YYYYMMDDHHMMSS format and fail-fast principles with no backward compatibility

7. **Fresh Start Success**: Complete terminology migration from "deals" to "opportunities" demonstrates system's ability to handle breaking changes

## Relevant Docs

- [Engineering Constitution](/home/krwhynot/Projects/atomic/CLAUDE.md): Core principles including migration format requirements
- [Migration Reconciliation Requirements](/home/krwhynot/Projects/atomic/.docs/plans/migration-reconciliation/requirements.md): Detailed reconciliation system specifications
- [Supabase Migration Docs](https://supabase.com/docs/guides/database/migrations): Official migration documentation