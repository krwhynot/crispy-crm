# Orphan Analysis Summary

**Generated:** 2026-02-09T06:54:49.780Z

## Overview

Automated database orphan detection script that identifies:
- Orphaned tables (no foreign key relationships)
- Orphaned records (NULL FKs, soft-deleted parents, missing parents)
- Empty tables

## Current Results

### Summary
- **Orphaned tables:** 1 (tags)
- **Tables with orphaned records:** 0
- **Empty tables:** 6
- **Total orphaned records:** 0

### Orphaned Tables
- `tags` - No foreign key relationships detected

**Analysis:** The `tags` table is designed to be a standalone reference table. It should have junction tables (e.g., `contact_tags`, `opportunity_tags`, `organization_tags`) to link tags to entities. This is a normal pattern, not a problem.

### Empty Tables
All core tables are empty because this is a development/test environment:
- contacts
- organizations
- opportunities
- products
- activities
- tags

**Recommendation:** Run `npm run seed:e2e:dashboard-v3` to populate with test data.

### Orphaned Records
No orphaned records detected. This indicates good referential integrity in the current (empty) database state.

## Interpretation

### Development Environment
The analysis shows a clean, empty database. This is expected for local development environments before seeding test data.

### Production Environment
When run against a production database, expected findings:
- **null_fk (acceptable):** Optional relationships like `opportunities.account_manager_id` can be NULL
- **soft_deleted_parent (needs attention):** Indicates cascade soft-delete triggers are missing
- **missing_parent (critical):** Should never occur if foreign key constraints are properly defined

## Next Steps

1. **Add more tables to knownTables array** in `scripts/orphan-analysis.ts`:
   - Currently only checks 18 tables
   - Missing: opportunity_contacts, sales, companies, segments, etc.

2. **Improve regex patterns** to catch all FK relationships:
   - Currently detects 16 out of 125+ REFERENCES statements
   - Missing patterns: multi-line FK declarations, complex table names with underscores

3. **Run against production data** to identify real orphan issues

4. **Automate in CI/CD** to catch data integrity issues early

## Usage

```bash
# Run analysis
npm run analyze:orphans

# View results
cat docs/architecture/erd-artifacts/orphan-analysis.json

# Pretty print
npx tsx -e "console.log(JSON.stringify(require('./docs/architecture/erd-artifacts/orphan-analysis.json'), null, 2))"
```

## Technical Details

**Foreign Key Extraction:**
- Parses SQL migration files using regex
- Patterns: `ALTER TABLE ... ADD FOREIGN KEY` and inline `REFERENCES`
- Current limitation: Misses complex multi-line patterns

**Orphan Detection:**
- Uses Supabase client to query tables
- Filters by `deleted_at IS NULL` to respect soft deletes
- Checks both directions: NULL child FKs and missing parents

**Performance:**
- Queries run sequentially to avoid rate limiting
- Empty tables skip orphan checks
- Full scan takes ~15-30 seconds on local database

**RLS Considerations:**
- Uses anon key, so RLS policies apply
- May not see all data if RLS is restrictive
- For full analysis, use service_role key (modify script)

## Known Limitations

1. **Static table list:** Must manually add new tables to `knownTables` array
2. **Regex coverage:** Misses ~85% of FK relationships (16/125 captured)
3. **RLS filtering:** Anon key may hide data due to row-level security
4. **No polymorphic FK support:** Special handling needed for `activities.activity_parentable_id`
5. **No VIEW analysis:** Only checks base tables, not `_summary` views

## Improvement Opportunities

**Priority 1: Complete FK Discovery**
- Parse schema from `supabase db dump --schema-only` instead of regex
- Or query `information_schema.table_constraints` via service_role key

**Priority 2: Dynamic Table Discovery**
- Auto-discover all tables instead of hardcoded list
- Query `information_schema.tables` for public schema

**Priority 3: Polymorphic Relationships**
- Add special handling for `activity_parentable_type` + `activity_parentable_id`
- Check multiple parent tables based on type field

**Priority 4: Cascade Delete Verification**
- Verify ON DELETE CASCADE/SET NULL behavior
- Check if soft-delete triggers exist for all relationships

**Priority 5: Performance**
- Batch queries instead of sequential
- Use database functions for complex checks
- Cache table metadata
