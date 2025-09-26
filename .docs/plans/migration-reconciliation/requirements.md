# Database Migration Reconciliation System Requirements

## Executive Summary

This document defines requirements for a Database Migration Reconciliation System that prevents and detects drift between filesystem migrations and actual database state in the Atomic CRM project. The system ensures the repository remains the single source of truth for database schema while supporting MCP-based local development workflows.

## Problem Statement

### Current State
- **67 migrations** exist in the production database
- **8 migration files** existed in the filesystem (now archived)
- **Significant drift** between database reality and version control
- **Dual workflow confusion** between MCP tools and Supabase CLI
- **No reproducibility** - cannot recreate database from repository
- **CI/CD limitations** - cannot create isolated test environments

### Root Cause
The drift occurred due to inconsistent workflows where local development used Supabase MCP tools (direct database modifications) while CI/CD expected filesystem-based migrations. This resulted in the database evolving independently of version-controlled migration files.

### Impact
- 🔴 **HIGH RISK**: Cannot recreate database from repository
- 🔴 **HIGH RISK**: CI/CD cannot create isolated test environments
- 🟡 **MEDIUM RISK**: Knowledge loss if database corruption occurs
- 🟡 **MEDIUM RISK**: Onboarding friction for new developers

## Goals & Success Criteria

### Primary Goals
1. **Eliminate drift** between filesystem migrations and database state
2. **Establish single source of truth** with database as authoritative source
3. **Enable reproducibility** - recreate exact database from repository
4. **Streamline workflow** - MCP-only approach with clear processes

### Success Metrics
- ✅ Zero undetected drift between database and filesystem post-implementation
- ✅ 100% of schema changes tracked through migration files
- ✅ Ability to recreate production schema from repository alone
- ✅ CI/CD can spin up isolated test environments from migrations
- ✅ < 5 minute detection time for any schema drift

## User Flows

### Flow 1: Initial Baseline Creation (One-time Setup)

**Actor**: Senior Developer / DevOps Engineer

**Steps**:
1. Execute `pg_dump` on production database with specific flags:
   ```bash
   pg_dump "postgres://[CONNECTION_STRING]" \
     --schema-only \
     --schema=public \
     --quote-all-identifiers \
     --no-owner \
     --no-privileges \
     --exclude-schema='auth|extensions|...' \
     > supabase/migrations/YYYYMMDDHHMMSS_baseline_schema.sql
   ```
2. Create `schema.sql` in repository root with same content
3. Mark baseline as applied in all environments via MCP:
   ```sql
   INSERT INTO _migrations (version, name, applied_at, success)
   VALUES ('YYYYMMDDHHMMSS', 'baseline_schema', NOW(), true);
   ```
4. Commit both files to version control
5. Document process in migration README

**Expected Outcome**: Clean starting point with squashed migration history

### Flow 2: Creating New Migrations

**Actor**: Developer

**Prerequisites**:
- Baseline established
- MCP tools configured
- Local database connected

**Steps**:
1. Developer identifies need for schema change
2. Creates migration file: `supabase/migrations/YYYYMMDDHHMMSS_feature_name.sql`
3. Writes DDL statements following PostgreSQL best practices
4. Applies migration using MCP tool:
   ```javascript
   await applyMigration(projectId, name, query)
   ```
5. System automatically regenerates `schema.sql` via pg_dump
6. Developer reviews changes to ensure correctness
7. Stages both migration and updated `schema.sql`
8. Pre-commit hook validates:
   - Migration naming convention
   - Schema.sql is included
   - No timestamp conflicts
9. Commits changes with descriptive message

**Expected Outcome**: Migration and baseline committed together, maintaining sync

### Flow 3: Pre-Commit Validation

**Actor**: Git Pre-commit Hook

**Trigger**: Developer runs `git commit` with staged migration files

**Steps**:
1. Hook detects `.sql` files in `supabase/migrations/`
2. Validates migration filename format: `YYYYMMDDHHMMSS_*.sql`
3. Checks if `schema.sql` is also staged
4. Verifies no duplicate timestamps exist
5. If validation passes: Allow commit
6. If validation fails:
   - Block commit
   - Display specific error message
   - Suggest corrective action

**Expected Outcome**: Only valid migrations with updated baselines enter version control

### Flow 4: Post-Merge Drift Detection

**Actor**: GitHub Actions

**Trigger**: Push to main branch

**Steps**:
1. Checkout repository code
2. Spin up clean PostgreSQL container
3. Apply all migrations from `supabase/migrations/` sequentially
4. Generate schema dump from migrated database
5. Compare generated schema with `schema.sql` in repository
6. If schemas match:
   - Mark check as passed
   - Log success
7. If drift detected:
   - Mark check as failed
   - Output diff summary in check result
   - Log full diff for debugging
   - Notify team (optional future enhancement)

**Expected Outcome**: Immediate detection of any schema drift

### Flow 5: Investigating Drift

**Actor**: Developer

**Trigger**: GitHub Actions reports drift

**Steps**:
1. Developer reviews GitHub Actions failure summary
2. Examines diff output to understand discrepancy
3. Determines root cause:
   - Missing migration file?
   - Manual database change?
   - Corrupted baseline?
4. Takes corrective action:
   - Create missing migration
   - Regenerate baseline
   - Revert unauthorized changes
5. Commits fix and monitors next CI run

**Expected Outcome**: Drift resolved and prevention measures improved

## Technical Implementation

### Components

#### 1. Baseline Schema Management
- **File**: `schema.sql` (repository root)
- **Format**: PostgreSQL DDL from `pg_dump --schema-only`
- **Updates**: Automatically on migration application
- **Version Control**: Committed alongside migrations

#### 2. Migration Files
- **Location**: `supabase/migrations/`
- **Format**: `YYYYMMDDHHMMSS_descriptive_name.sql`
- **Content**: PostgreSQL DDL statements
- **Order**: Applied sequentially by timestamp

#### 3. MCP Migration Tooling
- **Apply Migration**: `mcp__supabase__apply_migration`
- **List Migrations**: `mcp__supabase__list_migrations`
- **Auto-baseline**: Integrated pg_dump after apply
- **History Table**: `_migrations` in database

#### 4. Pre-commit Hook
- **Location**: `.husky/pre-commit` or `.git/hooks/pre-commit`
- **Language**: Bash/Node.js
- **Validations**:
  ```bash
  # Check for migration files
  if git diff --staged --name-only | grep -q "supabase/migrations/.*\.sql"; then
    # Verify schema.sql is also staged
    if ! git diff --staged --name-only | grep -q "schema.sql"; then
      echo "ERROR: Migration changes require updated schema.sql"
      exit 1
    fi
    # Validate naming convention
    # Check for timestamp duplicates
  fi
  ```

#### 5. GitHub Actions Workflow
- **File**: `.github/workflows/migration-drift-detection.yml`
- **Trigger**: Push to main
- **Jobs**:
  ```yaml
  drift-detection:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
    steps:
      - checkout
      - setup database
      - apply migrations
      - generate schema
      - compare schemas
      - report results
  ```

### Database Schema for Migration Tracking

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  version VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  checksum VARCHAR(64),
  applied_at TIMESTAMP NOT NULL,
  applied_by VARCHAR(255),
  execution_time INTEGER,
  success BOOLEAN NOT NULL
);
```

### pg_dump Configuration

Standardized flags for consistent schema extraction:

```bash
pg_dump "${DATABASE_URL}" \
  --schema-only \                 # Structure without data
  --schema=public \                # Application schema only
  --quote-all-identifiers \        # Handle reserved words
  --no-owner \                     # Portable ownership
  --no-privileges \                # Skip permissions
  --exclude-schema='auth|extensions|graphql|graphql_public|net|pgbouncer|pgsodium|pgsodium_masks|realtime|supabase_functions|storage|pg_*|information_schema' \
  > schema.sql
```

## Assumptions & Constraints

### Assumptions
1. **MCP tools remain available** for all developers
2. **PostgreSQL 15+** compatibility maintained
3. **Supabase managed schemas** remain separate from application schema
4. **Development continues** on non-production environments
5. **Git workflow** includes pull requests and main branch protection

### Constraints
1. **No backward compatibility** - breaking changes acceptable
2. **MCP-only workflow** - no Supabase CLI usage locally
3. **Single database** - no multi-tenant schema variations
4. **Public schema only** - other schemas out of scope
5. **No data migrations** - schema structure only

### Out of Scope
- Historical reconstruction of 67 missing migration files
- Data migration or seeding functionality
- Multi-environment configuration management
- Rollback automation
- Database backup/restore procedures

## Implementation Plan

### Phase 1: Baseline Establishment (Day 1)
1. Generate baseline schema via pg_dump
2. Create initial migration file
3. Mark as applied in all environments
4. Document process

### Phase 2: Automation Setup (Day 2-3)
1. Implement auto-baseline generation in MCP tools
2. Create pre-commit hook
3. Test validation logic
4. Document developer workflow

### Phase 3: CI/CD Integration (Day 4-5)
1. Create GitHub Actions workflow
2. Configure PostgreSQL service
3. Implement drift detection
4. Test with sample migrations

### Phase 4: Cleanup & Documentation (Day 6)
1. Remove obsolete migration scripts from package.json
2. Update CLAUDE.md with new workflow
3. Create developer guide
4. Team training session

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| pg_dump output varies between versions | Medium | High | Standardize PostgreSQL version, normalize output |
| Developer forgets to commit schema.sql | High | Medium | Pre-commit hook enforcement |
| Manual database changes bypass system | Low | High | Regular CI/CD checks, access controls |
| Migration conflicts from parallel development | Medium | Medium | Timestamp-based naming, PR reviews |
| MCP tools unavailable | Low | High | Maintain fallback documentation for CLI approach |

## Documentation Requirements

### Developer Guide
- Step-by-step migration creation process
- Common pg_dump commands
- Troubleshooting drift issues
- MCP tool configuration

### Operations Runbook
- Initial baseline creation procedure
- Drift resolution workflows
- Emergency recovery procedures
- Monitoring setup

### Architecture Decision Record (ADR)
- Why squash 67 migrations vs reconstruct
- Why MCP-only vs dual workflow
- Why post-merge vs pre-merge detection
- Why timestamp vs sequential versioning

## Appendix

### A. Example Migration File

```sql
-- supabase/migrations/20250127093045_add_customer_segments.sql
-- Description: Add customer segmentation support

CREATE TABLE customer_segments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_customer_segments_deleted_at
  ON customer_segments(deleted_at)
  WHERE deleted_at IS NULL;

-- RLS Policy
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated" ON customer_segments
  FOR ALL TO authenticated
  USING (deleted_at IS NULL);
```

### B. Pre-commit Hook Example

```bash
#!/bin/bash
# .husky/pre-commit

# Check for migration files
MIGRATION_FILES=$(git diff --staged --name-only | grep "supabase/migrations/.*\.sql")

if [ -n "$MIGRATION_FILES" ]; then
  echo "📦 Migration files detected, validating..."

  # Check schema.sql is staged
  if ! git diff --staged --name-only | grep -q "schema.sql"; then
    echo "❌ ERROR: Migration requires updated schema.sql"
    echo "Run: npm run db:regenerate-baseline"
    exit 1
  fi

  # Validate naming convention
  for file in $MIGRATION_FILES; do
    basename=$(basename "$file")
    if ! [[ $basename =~ ^[0-9]{14}_[a-z_]+\.sql$ ]]; then
      echo "❌ ERROR: Invalid migration name: $basename"
      echo "Expected: YYYYMMDDHHMMSS_description.sql"
      exit 1
    fi
  done

  echo "✅ Migration validation passed"
fi
```

### C. GitHub Actions Workflow

```yaml
name: Migration Drift Detection

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  detect-drift:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Apply migrations
        run: |
          for file in supabase/migrations/*.sql; do
            psql -h localhost -U postgres -d postgres -f "$file"
          done
        env:
          PGPASSWORD: postgres

      - name: Generate schema
        run: |
          pg_dump -h localhost -U postgres -d postgres \
            --schema-only \
            --schema=public \
            --quote-all-identifiers \
            --no-owner \
            --no-privileges \
            --exclude-schema='pg_*|information_schema' \
            > generated_schema.sql
        env:
          PGPASSWORD: postgres

      - name: Compare schemas
        run: |
          if ! diff -u schema.sql generated_schema.sql > schema_diff.txt; then
            echo "::error::Schema drift detected!"
            echo "### 🚨 Schema Drift Detected" >> $GITHUB_STEP_SUMMARY
            echo '```diff' >> $GITHUB_STEP_SUMMARY
            head -100 schema_diff.txt >> $GITHUB_STEP_SUMMARY
            echo '```' >> $GITHUB_STEP_SUMMARY
            exit 1
          fi
          echo "✅ No schema drift detected" >> $GITHUB_STEP_SUMMARY
```

---

*Document Version: 1.0.0*
*Created: 2025-01-26*
*Status: Draft*