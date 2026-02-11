# Orphan Analysis Summary

**Generated:** 2026-02-09T08:52:08Z

## Overview

Automated database orphan detection that identifies:
- Orphaned tables (no foreign key relationships)
- Orphaned records (active records pointing to soft-deleted parents)
- Empty tables

## Current Results

### Summary

| Metric | Value |
|--------|-------|
| **Orphaned tables** | 6 |
| **Tables with orphaned records** | 2 |
| **Total orphaned records** | 1,195 |
| **Empty tables** | 17 |

### Orphaned Tables

Tables with no foreign key relationships (incoming or outgoing):

| Table | Analysis |
|-------|----------|
| `migration_history` | System table for tracking applied migrations |
| `notifications` | Standalone notification storage (no FK to users yet) |
| `tags` | Reference table - needs junction tables for entity linking |
| `task_id_mapping` | Migration tracking table |
| `test_user_metadata` | Test fixture data |
| `user_favorites` | User preferences (no FK constraints defined) |

**Recommendation:** Review whether these tables need foreign key relationships added or are intentionally standalone.

### Orphaned Records

**1,195 active records** point to soft-deleted parents across 2 tables:

| Child Table | FK Column | Parent Table | Orphaned Count | Issue |
|-------------|-----------|--------------|----------------|-------|
| `activities` | `opportunity_id` | `opportunities` | 369 | Activities linked to deleted opportunities |
| `activities` | `organization_id` | `organizations` | 308 | Activities linked to deleted organizations |
| `opportunity_contacts` | `contact_id` | `contacts` | 149 | Junction records for deleted contacts |
| `opportunity_contacts` | `opportunity_id` | `opportunities` | 369 | Junction records for deleted opportunities |

**Root Cause:** Cascade soft-delete triggers are not implemented. When a parent record is soft-deleted, child records remain active.

**Recommendations:**
1. Implement cascade soft-delete triggers (set child `deleted_at` when parent is deleted)
2. Or accept orphaned records as intentional (preserve activity history even when parent is deleted)
3. Run cleanup script to soft-delete orphaned records if business rules require it

### Empty Tables (17)

| Category | Tables |
|----------|--------|
| **Notes** | `contact_notes`, `opportunity_notes`, `organization_notes` |
| **Participants** | `interaction_participants`, `opportunity_participants` |
| **Products** | `products`, `opportunity_products`, `product_distributors`, `product_distributor_authorizations` |
| **System** | `dashboard_snapshots`, `migration_history`, `notifications`, `tutorial_progress`, `test_user_metadata`, `user_favorites` |
| **Authorization** | `distributor_principal_authorizations` |
| **Reference** | `tags` |

**Note:** Empty tables may indicate unused features or awaiting seed data.

### Tables with Data

| Table | Row Count |
|-------|-----------|
| `audit_trail` | 75,029 |
| `organizations` | 2,369 |
| `contacts` | 2,007 |
| `organization_distributors` | 673 |
| `activities` | 503 |
| `opportunities` | 372 |
| `opportunity_contacts` | 369 |
| `segments` | 40 |
| `task_id_mapping` | 6 |
| `tasks_deprecated` | 6 |
| `sales` | 4 |

## How It Works

The orphan analysis script (`scripts/orphan-analysis.ts`) uses:

1. **Dynamic table discovery** via `information_schema.tables`
2. **Full FK coverage** via `information_schema.table_constraints` and related views
3. **Service role connection** (bypasses RLS for complete visibility)
4. **Conditional soft-delete filtering** (only applies `deleted_at IS NULL` when column exists)

### Detection Strategy

1. **Orphaned Tables:** Tables with no foreign key relationships (no incoming or outgoing FKs)
2. **Soft-Deleted Parents:** Active child records where `parent.deleted_at IS NOT NULL`
3. **Missing Parents:** FK values pointing to non-existent IDs (critical integrity violation)

### Script Features

- Direct `pg.Client` connection using `DATABASE_URL`
- Safe SQL generation via `client.escapeIdentifier()`
- Distinguishes `soft_deleted_parent` from `missing_parent` orphan types
- JSON output to `docs/architecture/erd-artifacts/orphan-analysis.json`

## Usage

```bash
# Run analysis
npm run analyze:orphans

# View results
cat docs/architecture/erd-artifacts/orphan-analysis.json

# View summary only
cat docs/architecture/erd-artifacts/orphan-analysis.json | jq '.summary'

# View orphaned records by type
cat docs/architecture/erd-artifacts/orphan-analysis.json | jq '.orphaned_records | group_by(.orphan_type)'
```

## Interpreting Results

| Finding | Severity | Action |
|---------|----------|--------|
| **Orphaned tables** | Low | Review if FK relationships are needed |
| **soft_deleted_parent** | Medium | Implement cascade soft-delete or accept as intentional |
| **missing_parent** | Critical | Data integrity violation - investigate immediately |
| **Empty tables** | Info | May need seed data or indicate unused features |

## Next Steps

1. **Address orphaned records:** Decide whether to implement cascade soft-delete triggers or document as intentional behavior
2. **Review orphaned tables:** Add FK relationships where appropriate (e.g., `tags` → junction tables)
3. **Automate in CI/CD:** Run analysis after migrations to catch new integrity issues
4. **Schedule periodic runs:** Weekly analysis to track data quality trends
