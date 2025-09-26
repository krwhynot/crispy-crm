# MCP Workflow Transition - Parallel Execution Plan

This plan orchestrates the complete transition from Docker/Supabase CLI-dependent local development to a cloud-first MCP workflow. The transition eliminates all local database infrastructure while maintaining the robust database-first architecture where PostgreSQL schema drives TypeScript types. Tasks are designed for parallel execution with clear dependency chains, enabling multiple developers to work simultaneously on independent components.

## Critically Relevant Files and Documentation

### Core Implementation Files
- `/scripts/generate-types.cjs` - Type generation with hash tracking (modify for MCP)
- `/scripts/check-migrations.cjs` - Migration change detection system
- `/package.json` - 65+ npm scripts requiring MCP equivalents
- `/makefile` - Docker-dependent commands to be replaced
- `/.env.example` - Hardcoded localhost URLs to update

### Essential Documentation
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Critical architecture rules and conventions
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/shared.md` - Architecture overview and patterns
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/requirements.md` - Complete functional requirements
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/type-generation-research.docs.md` - Type system details
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/test-infrastructure-research.docs.md` - Test configuration

## Implementation Plan

### Phase 1: Core Infrastructure

#### Task 1.1: Create MCP Type Generation Script [Depends on: none]

**READ THESE BEFORE TASK**
- `/scripts/generate-types.cjs` - Current implementation with hash tracking
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/type-generation-research.docs.md`
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Database-first principles

**Instructions**

Files to Create
- `/scripts/mcp-generate-types.cjs` - New MCP-based type generation

Files to Modify
- None (new parallel implementation)

Create a new type generation script that:
- Uses `mcp__supabase__generate_typescript_types` instead of Supabase CLI
- Maintains the existing SHA256 hash tracking system from lines 29-76
- Preserves ALL validation logic from lines 81-250 including:
  - Required tables validation (organizations, contacts, opportunities, etc.)
  - Required views validation (summary views)
  - Required enums validation (color_token, note_type, etc.)
  - Column type validation for key tables
  - Detection of deprecated backward compatibility views
- Implements proper error handling for network failures with retry logic
- Adds progress indicators for network operations (spinner for >1 second operations)
- Distinguishes between network errors vs schema validation errors in messages
- Returns appropriate exit codes for CI integration

#### Task 1.2: Create MCP Migration Application Scripts [Depends on: none]

**READ THESE BEFORE TASK**
- `/scripts/migration-execute.js` - Current migration orchestration
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/migration-system-research.docs.md`
- `/supabase/migrations/` - Migration file structure

**Instructions**

Files to Create
- `/scripts/mcp-migrate.js` - Apply migrations via MCP
- `/scripts/mcp-migrate-status.js` - Check pending migrations
- `/scripts/mcp-migrate-create.js` - Create new migration files

Files to Modify
- None (new parallel implementation)

Implement migration management that:
- Uses `mcp__supabase__apply_migration` for database changes
- Maintains sequential numbering pattern (108_feature.sql)
- Provides dry-run capability for validation
- Tracks migration state in database
- Supports partial rollback with 48-hour window
- Includes comprehensive logging for debugging

#### Task 1.3: Update Test Configuration for Cloud Database [Depends on: none]

**READ THESE BEFORE TASK**
- `/vitest.config.ts` - Test configuration with coverage thresholds
- `/.env.example` - Environment variables with localhost URLs
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/test-infrastructure-research.docs.md`
- `/src/tests/smoke/db-smoke.test.ts` - Database connectivity tests

**Instructions**

Files to Create
- `/src/tests/setup-mcp.ts` - MCP-specific test setup

Files to Modify
- `/vitest.config.ts` - Update setup files and environment
- `/.env.example` - Replace localhost with Crispy database URLs
- `/src/tests/smoke/db-smoke.test.ts` - Remove localhost fallbacks
- `/src/tests/smoke/critical-path.test.ts` - Update connection strings

Update test infrastructure to:
- Connect all tests to Crispy database (aaqnanddcqvfiwhshndl)
- Remove all localhost URL fallbacks WITH proper validation that cloud URLs are configured
- Implement test data namespacing with unique prefixes: `test_${env}_${timestamp}_${random}`
- Configure Vitest for sequential write tests, parallel read tests using `describe.sequential` and `describe.concurrent`
- Add cleanup hooks using service role for RLS bypass with try/finally for guaranteed cleanup
- Implement connection retry logic with exponential backoff for network resilience
- Add emergency cleanup mechanism for orphaned test data
- Adjust performance thresholds from 500ms to 1000-2000ms for cloud latency
- Configure connection pooling for performance
- Maintain test execution within 20% of current baseline

### Phase 2: Build System Integration

#### Task 2.1: Create MCP-Aware NPM Scripts [Depends on: 1.1, 1.2]

**READ THESE BEFORE TASK**
- `/package.json` - Current 65+ npm scripts
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/build-system-research.docs.md`
- `/scripts/check-migrations.cjs` - Migration verification logic

**Instructions**

Files to Modify
- `/package.json` - Add MCP-specific commands

Add new npm scripts:
- `mcp:generate-types` - Generate TypeScript types via MCP
- `mcp:generate-types:force` - Force regeneration ignoring hash
- `mcp:generate-types:watch` - Watch mode for development
- `mcp:migrate` - Apply pending migrations
- `mcp:migrate:create` - Create new migration file
- `mcp:migrate:status` - Check migration status
- `mcp:migrate:dry-run` - Validate without applying
- `mcp:test` - Run tests against cloud database
- `mcp:validate` - Comprehensive validation suite
- `mcp:dev` - Development server with MCP
- `mcp:build` - Production build with MCP

#### Task 2.2: Update Build Pipeline for MCP [Depends on: 1.1, 2.1]

**READ THESE BEFORE TASK**
- `/vite.config.ts` - Build configuration with optimizations
- `/scripts/mcp-generate-types.cjs` - New MCP type generation from Task 1.1
- `/.github/workflows/check.yml` - CI pipeline configuration

**Instructions**

Files to Modify
- `/vite.config.ts` - Update pre-build hooks to use MCP script
- `/package.json` - Switch build commands to use MCP scripts

Modify build process to:
- Keep MCP and CLI scripts completely separate (no mixing)
- Update package.json to call MCP scripts: `"generate:types": "node scripts/mcp-generate-types.cjs"`
- Check for stale types before build using hash comparison
- Automatically regenerate if migrations changed
- Use MCP for type generation in CI environment
- Provide clear progress indicators during generation
- Fail builds appropriately on type generation errors
- Complete generation within 5-second target

### Phase 3: Type System Unification

#### Task 3.0: Type Compatibility Analysis [Depends on: 2.2]

**READ THESE BEFORE TASK**
- `/src/types/supabase.ts` - Legacy manual type definitions
- `/src/types/database.generated.ts` - Auto-generated types
- `/src/atomic-crm/transformers/tags.ts` - Only file importing legacy types

**Instructions**

Files to Create
- `/docs/type-migration-guide.md` - Compatibility analysis and migration guide

Analyze type compatibility:
- Compare structure differences between `supabase.ts` and `database.generated.ts`
- Identify schema changes (companies→organizations, deals→opportunities, activities table removed)
- Document all files importing from `supabase.ts` (currently only tags.ts)
- Create mapping guide for incompatible types
- Verify that generated types support all current usage patterns

#### Task 3.1: Remove Legacy Type Files [Depends on: 3.0]

**READ THESE BEFORE TASK**
- `/src/types/supabase.ts` - Legacy manual type definitions
- `/src/types/database.generated.ts` - Auto-generated types
- `/docs/type-migration-guide.md` - Compatibility analysis from Task 3.0
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/type-generation-research.docs.md`

**Instructions**

Files to Delete
- `/src/types/supabase.ts` - Legacy type file

Files to Modify
- Update all imports currently using `supabase.ts`

Remove legacy type system by:
- First ensuring type compatibility based on Task 3.0 analysis
- Using grep/ripgrep to find all import statements
- Updating imports to use `database.generated.ts`
- Handling any schema differences identified in compatibility analysis
- Ensuring no type casting workarounds remain
- Verifying TypeScript compilation succeeds

#### Task 3.2: Update Transformer Type Imports [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/transformers/` - All transformer files
- `/src/atomic-crm/transformers/utils.ts` - Core utilities
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Transformation patterns

**Instructions**

Files to Modify
- `/src/atomic-crm/transformers/organizations.ts`
- `/src/atomic-crm/transformers/contacts.ts`
- `/src/atomic-crm/transformers/opportunities.ts`
- `/src/atomic-crm/transformers/tasks.ts`
- `/src/atomic-crm/transformers/tags.ts`
- All other transformer files in directory

Update each transformer to:
- Import from `database.generated.ts` exclusively
- Remove any type assertions or workarounds
- Ensure bi-directional conversion types align
- Validate transformer tests still pass
- Check for proper null handling in transformations

### Phase 4: Environment & Configuration

#### Task 4.1: Update Environment Configuration [Depends on: 1.3]

**READ THESE BEFORE TASK**
- `/.env.example` - Current environment template
- `/scripts/validate-environment.cjs` - Environment validation
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/requirements.md` - Configuration requirements

**Instructions**

Files to Modify
- `/.env.example` - Update with cloud-first values
- `/scripts/validate-environment.cjs` - Add MCP validation

Update configuration to:
- Replace all localhost URLs with Crispy database endpoints
- Add MCP-specific environment variables if needed
- Include helpful comments for each variable
- Provide sensible defaults where appropriate
- Add validation for required MCP configuration
- Create clear error messages for missing values

#### Task 4.2: Remove Docker Dependencies [Depends on: 2.1, 2.2]

**READ THESE BEFORE TASK**
- `/makefile` - Docker-dependent orchestration
- `/docker-compose.yml` (if exists) - Container configuration
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/shared.md` - Migration approach

**Instructions**

Files to Modify
- `/makefile` - Remove or update Docker commands

Files to Delete (if present)
- `/docker-compose.yml`
- `/Dockerfile`
- `/.dockerignore`

Clean up Docker artifacts:
- Remove or comment out Docker-dependent make targets
- Update make commands to use MCP equivalents
- Delete Docker configuration files if present
- Update any documentation references to Docker
- Ensure no scripts have Docker prerequisites

### Phase 5: CI/CD Updates

#### Task 5.1: Update GitHub Actions for MCP [Depends on: 2.1, 4.1]

**READ THESE BEFORE TASK**
- `/.github/workflows/check.yml` - Current CI pipeline
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/requirements.md` - CI/CD requirements

**Instructions**

Files to Modify
- `/.github/workflows/check.yml` - Remove Docker, add MCP

Update CI pipeline to:
- Remove Docker setup steps completely
- Use MCP commands for type generation
- Configure MCP authentication via secrets
- Run tests against cloud database
- Validate types match schema before deployment
- Add appropriate caching for dependencies

#### Task 5.2: Create Deployment Validation Scripts [Depends on: 1.2, 5.1]

**READ THESE BEFORE TASK**
- `/scripts/pre-deploy-check.js` - Current validation
- `/scripts/final-verification.js` - Post-deployment checks
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/migration-system-research.docs.md`

**Instructions**

Files to Create
- `/scripts/mcp-deploy-validate.js` - MCP deployment validation

Files to Modify
- `/scripts/pre-deploy-check.js` - Add MCP checks

Implement deployment validation:
- Verify all migrations applied successfully
- Check database schema matches expectations
- Validate TypeScript types are current
- Run smoke tests against deployed environment
- Generate deployment report with findings
- Return appropriate exit codes for CI

### Phase 6: Documentation & Developer Experience

#### Task 6.1: Update CLAUDE.md for MCP Workflow [Depends on: all previous tasks]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Current documentation
- All implementation changes from previous tasks

**Instructions**

Files to Modify
- `/home/krwhynot/Projects/atomic/CLAUDE.md`

Update documentation to:
- Replace Docker/CLI commands with MCP equivalents
- Update "Core Commands" section with new npm scripts
- Revise "Database & Type Generation" instructions
- Add "MCP Workflow" section with best practices
- Update troubleshooting for network issues
- Remove all references to local development

#### Task 6.2: Create MCP Troubleshooting Guide [Depends on: all previous tasks]

**READ THESE BEFORE TASK**
- Implementation experiences from all previous tasks
- `/home/krwhynot/Projects/atomic/.docs/plans/mcp-workflow/requirements.md` - Error handling requirements

**Instructions**

Files to Create
- `/docs/mcp-troubleshooting.md` - Comprehensive troubleshooting guide

Create guide covering:
- Common network connectivity issues and solutions
- Type generation problems and fixes
- Migration application errors and recovery
- Test execution issues with cloud database
- Authentication and permission problems
- Performance optimization tips
- Rollback procedures for emergencies

## Advice

- **Hash System is Critical**: The SHA256 hash tracking prevents unnecessary type regeneration. Preserve this logic exactly as it dramatically reduces network calls and improves developer experience.

- **Type Compatibility Is Complex**: The migration from `supabase.ts` to `database.generated.ts` involves schema changes (companies→organizations, deals→opportunities). Task 3.0 MUST be completed before 3.1 to prevent compilation failures.

- **Test Isolation Strategy**: Implement unique test prefixes (`test_${env}_${timestamp}_${random}`) to prevent data collisions. Use try/finally blocks for guaranteed cleanup. The service role bypass pattern from `/src/tests/smoke/critical-path.test.ts:50-70` is essential.

- **Migration State Management**: Use `mcp__supabase__execute_sql` to query `migration_history` table for state tracking, NOT `mcp__supabase__list_migrations` which only shows files. The distinction between `apply_migration` (DDL) and `execute_sql` (queries) is crucial.

- **Keep Implementations Separate**: Don't mix MCP and CLI implementations in the same file. Create new MCP scripts alongside existing ones, then switch via package.json. This enables safe rollback without code changes.

- **Validation Must Be Complete**: Port ALL validation logic from `generate-types.cjs:81-250`, not just hash tracking. This includes tables, views, enums, columns, and deprecated view detection.

- **Network Resilience Required**: Implement retry logic with exponential backoff for all MCP operations. Cloud latency requires adjusting thresholds from 500ms to 1000-2000ms.

- **Error Messages Matter**: MCP network failures will be common initially. Clearly distinguish between network issues, authentication problems, schema validation errors, and application errors.

- **CI Caching**: The type generation adds 2-3 seconds to builds. Cache the generated types file in CI based on the migration hash to avoid regeneration on every build.

- **Sequential vs Parallel Tests**: Use `describe.sequential` for write operations and `describe.concurrent` for read-only tests. Don't force all tests to be sequential as it severely impacts performance.

- **Migration Numbering**: Continue from 108 onwards. The fixed migrations (000-106) should never be modified. Use timestamp prefixes only for hotfixes.

- **Progress Indicators**: Network operations feel slow without feedback. Add spinners or progress bars for operations taking more than 1 second.