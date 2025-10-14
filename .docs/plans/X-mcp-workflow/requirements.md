# MCP-Only Workflow Requirements

## Executive Summary

This document outlines the requirements for transitioning the Atomic CRM application from a local database-dependent development workflow to a cloud-first, MCP-only approach. This transition eliminates the need for Docker, Supabase CLI, and local database infrastructure while maintaining type safety and developer productivity.

## Current State Analysis

### Existing Architecture
- **Database-First Design**: TypeScript types auto-generated from PostgreSQL schema
- **Local Development**: Requires Docker and Supabase CLI for development
- **Type Generation**: Uses `npx supabase gen types typescript --local` before builds
- **Migration Tracking**: SHA-256 hash system tracks schema changes
- **Dual Type System**: Legacy manual types coexist with auto-generated types

### Pain Points
1. Docker/Supabase CLI dependency blocks development without local setup
2. Type generation fails without local database running
3. Hardcoded localhost URLs throughout test infrastructure
4. Inconsistent type imports (manual vs. generated)
5. Complex local environment setup for new developers

## Target State

### Core Architecture Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Migration Approach** | Clean Break | Remove all local dependencies immediately for consistency |
| **Type Generation** | Hybrid with Hash Checking | Regenerate only when schema changes, minimizing network calls |
| **Test Environment** | Shared Crispy Database | Single source of truth with proper cleanup |
| **Developer Commands** | New MCP-Specific Scripts | Clear separation from legacy commands |
| **Migration Management** | SQL Files + MCP Apply | Version control benefits with cloud execution |
| **Network Requirement** | Always Online | Simplifies architecture, aligns with modern development |
| **Documentation** | MCP-Only | No confusion with dual workflows |

## Functional Requirements

### FR1: Type Generation System

#### FR1.1: MCP-Based Type Generation
- **Must** use `mcp__supabase__generate_typescript_types` for all type generation
- **Must** maintain migration hash tracking to detect schema changes
- **Must** generate types only when migrations change (unless forced)
- **Must** complete generation within 5 seconds under normal network conditions

#### FR1.2: Build Integration
- **Must** check for stale types before build
- **Must** automatically regenerate if schema has changed
- **Must** fail builds if type generation fails
- **Should** provide clear progress indicators during generation

#### FR1.3: Type Unification
- **Must** remove legacy `src/types/supabase.ts` file
- **Must** update all imports to use `database.generated.ts`
- **Must** ensure all transformers use generated types

### FR2: Test Infrastructure

#### FR2.1: Cloud Database Connection
- **Must** connect all tests to Crispy database (aaqnanddcqvfiwhshndl)
- **Must** remove all localhost URL fallbacks
- **Must** use environment variables for connection configuration

#### FR2.2: Test Isolation
- **Must** implement cleanup hooks for test data
- **Must** run tests sequentially to avoid conflicts
- **Should** use transaction rollbacks where possible
- **Should** implement test data namespacing

#### FR2.3: Test Performance
- **Must** maintain test execution time within 20% of current baseline
- **Should** implement connection pooling for test runs
- **Should** cache database schema for faster test initialization

### FR3: Migration Management

#### FR3.1: Migration Application
- **Must** use `mcp__supabase__apply_migration` for all migrations
- **Must** maintain SQL files in `supabase/migrations/` directory
- **Must** follow sequential numbering pattern (e.g., 108_feature.sql)

#### FR3.2: Migration Workflow Commands
- **Must** provide `npm run mcp:migrate` command
- **Must** provide `npm run mcp:migrate:status` to check pending migrations
- **Should** provide `npm run mcp:migrate:dry-run` for validation

#### FR3.3: Migration Safety
- **Must** validate migration syntax before application
- **Should** create automatic backups before migrations
- **Should** provide rollback capability

### FR4: Developer Experience

#### FR4.1: Command Structure
New npm scripts required:
- `npm run mcp:generate-types` - Generate TypeScript types
- `npm run mcp:generate-types:force` - Force regeneration
- `npm run mcp:migrate` - Apply pending migrations
- `npm run mcp:migrate:create` - Create new migration file
- `npm run mcp:test` - Run tests against cloud database
- `npm run mcp:validate` - Validate schema and types

#### FR4.2: Environment Configuration
- **Must** use `.env` for all configuration
- **Must** provide `.env.example` with required variables
- **Must** validate environment on startup
- **Should** provide helpful error messages for missing configuration

#### FR4.3: Error Handling
- **Must** provide clear error messages for network failures
- **Must** distinguish between MCP errors and application errors
- **Should** implement retry logic for transient failures

### FR5: CI/CD Integration

#### FR5.1: Build Pipeline
- **Must** work without Docker in CI environment
- **Must** use MCP for type generation in CI
- **Must** validate types match schema before deployment

#### FR5.2: Deployment Process
- **Must** apply migrations via MCP before deployment
- **Must** verify migration success before proceeding
- **Should** run smoke tests against deployed environment

## Non-Functional Requirements

### NFR1: Performance
- Type generation must complete within 5 seconds (typical)
- Build time increase must not exceed 10% overall
- Test execution time must remain within 20% of baseline

### NFR2: Reliability
- Must handle network interruptions gracefully
- Must provide clear feedback on connection issues
- Must validate all MCP responses

### NFR3: Security
- Must never expose service role keys to client code
- Must use appropriate authentication for MCP calls
- Must sanitize all database inputs

### NFR4: Maintainability
- Must follow existing code style and conventions
- Must maintain clear separation between MCP and application logic
- Must document all new commands and workflows

### NFR5: Developer Onboarding
- New developer setup must complete within 15 minutes
- Must require only Node.js and internet connection
- Must provide clear troubleshooting guide

## Implementation Phases

### Phase 1: Type Generation System (Critical Path)
**Duration**: 2-3 days
- Modify `scripts/generate-types.cjs` for MCP usage
- Create new npm commands for type generation
- Update build scripts to use new commands
- Remove Docker/CLI dependencies

### Phase 2: Type Unification
**Duration**: 1-2 days
- Remove legacy type files
- Update all transformer imports
- Fix type inconsistencies
- Run full type checking

### Phase 3: Test Infrastructure
**Duration**: 2-3 days
- Update test configuration for cloud database
- Remove localhost fallbacks
- Implement test cleanup hooks
- Configure sequential execution

### Phase 4: Migration Workflow
**Duration**: 1-2 days
- Create MCP-based migration commands
- Update migration scripts
- Remove Makefile local commands
- Test migration pipeline

### Phase 5: Documentation & Cleanup
**Duration**: 1 day
- Update CLAUDE.md
- Remove local development references
- Create troubleshooting guide
- Update CI/CD workflows

## Success Criteria

1. **Zero Local Dependencies**: Application builds and runs without Docker or Supabase CLI
2. **Type Safety Maintained**: All TypeScript types remain in sync with database schema
3. **Test Reliability**: All tests pass consistently against cloud database
4. **Developer Productivity**: Build and test times remain within acceptable limits
5. **Documentation Completeness**: All workflows documented with MCP-only approach

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Network outages block development | Medium | High | Document offline workarounds, consider fallback modes |
| Type generation latency impacts productivity | Low | Medium | Hash-based caching minimizes regeneration |
| Test conflicts in shared database | Medium | Medium | Sequential execution and cleanup hooks |
| Migration errors in production | Low | High | Dry-run validation and backup procedures |
| Learning curve for developers | Medium | Low | Comprehensive documentation and examples |

## Dependencies

### External Dependencies
- Supabase MCP Tool availability
- Crispy database (aaqnanddcqvfiwhshndl) uptime
- Network connectivity

### Technical Prerequisites
- Node.js 18+ installed
- Valid Supabase project credentials
- MCP tools properly configured

## Constraints

1. **No Backward Compatibility**: Clean break from local development
2. **Always-Online Requirement**: Internet connection mandatory
3. **Single Database**: Crispy database for all environments
4. **Breaking Change Acceptable**: Existing developer workflows will break

## Assumptions

1. All developers have reliable internet connections
2. Crispy database has sufficient resources for development load
3. MCP tools are stable and performant
4. Network latency (2-3 seconds) for type generation is acceptable
5. Team is prepared for workflow transition

## Open Questions

None - all questions have been resolved during requirements gathering.

## Approval

This document represents the complete requirements for transitioning to an MCP-only workflow. Implementation can proceed according to the defined phases.

**Status**: Approved
**Date**: 2025-09-24
**Version**: 1.0.0