# Migration System Research - MCP Workflow Transition

Comprehensive analysis of the current migration management system to understand structure, processes, and requirements for MCP workflow integration.

## Migration File Structure

### Current Organization
- **Primary Location**: `supabase/migrations/` - Contains timestamp-based migration files
- **Fixed Migrations**: `supabase/migrations/fixed/` - Sequential numbered migrations (000-106)
- **Migration Patterns**: Two distinct numbering systems coexist:
  - Timestamp-based: `YYYYMMDD_HH_feature_description.sql`
  - Sequential numbered: `000_migration_infrastructure.sql` through `106_validate_integrity.sql`

### Key Migration Files
- `/home/krwhynot/Projects/atomic/supabase/migrations/107_critical_schema_fixes.sql`: Latest sequential migration
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250124_recreate_init_state_view.sql`: Recent timestamp-based migration
- `/home/krwhynot/Projects/atomic/supabase/migrations/fixed/000_migration_infrastructure.sql`: Core migration infrastructure
- `/home/krwhynot/Projects/atomic/supabase/migrations/fixed/100_phase_1_1_foundation.sql`: Foundation phase migration
- `/home/krwhynot/Projects/atomic/supabase/migrations/fixed/106_validate_integrity.sql`: Final validation migration

### Migration Content Structure
- **Foundation Phases** (100-103): Core schema transformations (deals→opportunities)
- **Infrastructure** (000-003): Migration tracking and foundation setup
- **Data Population** (104-106): View recreation and data integrity validation
- **Critical Fixes** (107+): Schema fixes and hardening

## Application Process

### Local Development Flow
- **Make Commands**: `makefile` provides basic Supabase commands
  - `supabase-migrate-database`: Apply migrations via `npx supabase migration up`
  - `supabase-reset-database`: Reset database via `npx supabase db reset`
  - `supabase-deploy`: Push to remote via `npx supabase db push`

### NPM Script Integration
- **Type Generation Trigger**: `generate:types` automatically runs after schema changes
- **Migration Detection**: `check:migrations` validates migration consistency
- **Production Migration**: `migrate:production` orchestrates full migration process
- **Comprehensive Suite**: 15+ migration-related scripts in `package.json`

### Migration Execution Scripts
- `/home/krwhynot/Projects/atomic/scripts/migration-execute.js`: Core migration orchestrator
- `/home/krwhynot/Projects/atomic/scripts/check-migrations.cjs`: Change detection and type regeneration
- `/home/krwhynot/Projects/atomic/scripts/generate-types.cjs`: Database-first type generation
- `/home/krwhynot/Projects/atomic/scripts/final-verification.js`: Comprehensive post-migration validation

### Migration Hash System
- **Change Detection**: SHA256 hash of migration file metadata (filename + mtime + size)
- **Hash Storage**: `.migration-hash` file tracks last known state
- **Auto-Regeneration**: Types regenerate automatically when migrations change
- **CI Integration**: Validates type/migration synchronization

## Validation and Safety

### Pre-Migration Validation
- **Environment Checks**: Database connectivity and CLI availability
- **Migration File Validation**: Ensures all required files exist
- **State Verification**: Checks migration history and current state
- **Schema Validation**: Required tables, views, and enums validation

### Schema Validation Framework
- **Required Tables**: organizations, contacts, opportunities, tasks, tags, sales, notes, junction tables
- **Required Views**: Summary views (organizations_summary, contacts_summary, opportunities_summary, init_state)
- **Required Enums**: organization_type, opportunity_stage, opportunity_pipeline
- **Column Validation**: Expected columns and types in key tables
- **Backward Compatibility Checks**: Ensures deprecated views are removed

### Post-Migration Validation
- `/home/krwhynot/Projects/atomic/scripts/post-migration-validation.js`: Comprehensive post-execution checks
- `/home/krwhynot/Projects/atomic/scripts/migration-verify.js`: Detailed migration verification
- **Data Integrity Checks**: Record counts, relationships, and constraints
- **Performance Validation**: Query performance and index effectiveness

### Error Handling and Logging
- **Transaction Safety**: Savepoints between phases for partial rollback
- **Progress Tracking**: Migration history table tracks execution state
- **Resume Capability**: Can resume from interrupted migrations
- **Comprehensive Logging**: Timestamped logs in `logs/migration.log`

## CI/CD Integration

### GitHub Actions Workflow
- **File**: `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`
- **Migration Hash Verification**: `node ./scripts/check-migrations.cjs --verify`
- **Type Synchronization Check**: Validates committed types match database schema
- **TypeScript Compilation**: Ensures generated types compile correctly
- **Build Integration**: Migration changes trigger full build process

### CI Validation Strategy
- **Verify Mode**: In CI, only validates - doesn't regenerate types
- **Hash Mismatch Detection**: Prevents deployment with stale types
- **Error Reporting**: Clear instructions for local type regeneration
- **Build Failure Prevention**: Stops deployment if migrations/types are out of sync

### Environment-Aware Execution
- **Local vs Remote**: Supports both local Supabase and remote instances
- **Service Key Handling**: Separate keys for local development vs production
- **Docker Dependency**: Graceful handling when Docker/Supabase unavailable
- **CI Placeholder**: Creates placeholder types in CI when Supabase unavailable

## Rollback Mechanisms

### Emergency Rollback System
- `/home/krwhynot/Projects/atomic/scripts/migration-rollback.js`: Comprehensive rollback orchestrator
- **Backup-Based Recovery**: Restores from timestamp-based backup tables
- **48-Hour Window**: Enforced rollback time limit for safety
- **Structural Rollback**: Reverses schema changes (opportunities→deals)
- **Data Restoration**: Truncate-and-restore pattern for each table

### Rollback Safety Features
- **Confirmation Requirements**: Multi-step confirmation ("EMERGENCY_ROLLBACK" typing)
- **Environment Validation**: Checks Supabase CLI and project connectivity
- **Backup Verification**: Validates backup table existence before rollback
- **Transaction Safety**: Individual table rollbacks in transactions
- **Progress Tracking**: Updates migration history with rollback status

### Rollback Limitations
- **Data Loss Warning**: All migration changes permanently destroyed
- **Time Window**: Cannot rollback after 48 hours without manual intervention
- **Backup Dependency**: Requires pre-migration backup creation
- **No Undo**: Rollback actions cannot be reversed

## MCP Transition Requirements

### Integration Points for MCP Workflow
1. **Supabase MCP Tool Integration**: Direct database access through MCP rather than CLI
2. **Migration Orchestration**: Adapt `migration-execute.js` for MCP-based execution
3. **Type Generation**: Integrate MCP Supabase tools with existing type generation
4. **Validation Framework**: Extend validation to use MCP database access patterns
5. **State Management**: Maintain existing progress tracking with MCP integration

### Required Adaptations
- **Database Connection**: Replace Supabase client with MCP Supabase tools
- **SQL Execution**: Use MCP `execute_sql` instead of direct client calls
- **Migration Application**: Adapt `apply_migration` calls for MCP workflow
- **Validation Queries**: Convert validation scripts to use MCP query patterns
- **Error Handling**: Integrate MCP error responses with existing error handling

### Compatibility Considerations
- **Existing Scripts**: Maintain backward compatibility with current npm scripts
- **CI/CD Integration**: Ensure MCP transition doesn't break GitHub Actions
- **Development Workflow**: Support both MCP and traditional workflows during transition
- **Type Generation**: Preserve automatic type regeneration on schema changes
- **Rollback Safety**: Maintain existing rollback mechanisms with MCP integration

### Implementation Strategy
1. **Phase 1**: Create MCP-aware versions of core migration scripts
2. **Phase 2**: Integrate MCP Supabase tools with existing validation framework
3. **Phase 3**: Adapt CI/CD workflows to support MCP-based migrations
4. **Phase 4**: Update documentation and developer workflows
5. **Phase 5**: Deprecate traditional CLI-based approaches where appropriate

## Relevant Files

- `/home/krwhynot/Projects/atomic/makefile`: Basic Supabase commands and build targets
- `/home/krwhynot/Projects/atomic/scripts/check-migrations.cjs`: Migration change detection and type regeneration
- `/home/krwhynot/Projects/atomic/scripts/generate-types.cjs`: Database-first TypeScript type generation
- `/home/krwhynot/Projects/atomic/scripts/migration-execute.js`: Core migration orchestration engine
- `/home/krwhynot/Projects/atomic/scripts/migration-rollback.js`: Emergency rollback system
- `/home/krwhynot/Projects/atomic/scripts/post-migration-validation.js`: Comprehensive validation runner
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`: CI/CD integration for migration validation
- `/home/krwhynot/Projects/atomic/supabase/migrations/fixed/`: Sequential numbered migration files
- `/home/krwhynot/Projects/atomic/package.json`: Migration-related npm scripts (lines 16-52)

## Architectural Patterns

- **Database-First Architecture**: TypeScript types auto-generated from schema, never manually edited
- **Migration Hash System**: SHA256-based change detection prevents type drift
- **Sequential + Timestamp Coexistence**: Dual numbering system for different migration phases
- **Transaction Safety**: Savepoints and rollback capabilities for complex migrations
- **Validation-First Approach**: Comprehensive pre/post migration validation
- **Resume Capability**: State tracking allows interrupted migration recovery
- **Environment Awareness**: Different behaviors for local/remote/CI environments

## Edge Cases & Gotchas

- **Docker Dependency**: Local type generation requires Docker/Supabase running
- **Service Key vs Anon Key**: Different authentication for different environments
- **Migration File Detection**: Hash calculation uses filename + mtime + size, not content
- **Rollback Time Limit**: 48-hour window enforced for safety, requires manual intervention after
- **Type Regeneration Triggers**: Automatic on migration changes, can cause CI failures if not committed
- **Dual Migration Systems**: Fixed/ directory uses sequential, root uses timestamps
- **Schema Validation**: Hardcoded table/view/enum expectations may need updates
- **CI Placeholder Types**: Creates stub types when Supabase unavailable in CI