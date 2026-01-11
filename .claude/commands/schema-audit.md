---
description: Audit database schema for consistency and missing patterns
argument-hint: "[optional: table-name to focus on]"
allowed-tools: Read, Grep, Glob, Bash(ls:*), Bash(cat:*), Task, TodoWrite
---

# Schema Consistency Audit

Launch the `schema-auditor` agent for comprehensive database schema analysis.

**Scope:** ${ARGUMENTS:-"all tables and views"}

## What This Audit Checks

The schema-auditor agent performs these validations:

### 1. Required Columns
Every table must have:
- `id` (uuid, primary key)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `deleted_at` (timestamptz, for soft deletes)

### 2. View Consistency
For each `*_summary` view:
- Contains all base table columns
- Computed fields exist (`nb_notes`, `nb_activities`, `latest_*`)
- No orphaned views (base table must exist)
- User-scoped views have `sales_id` column

### 3. Foreign Key Indexes
- All foreign keys have corresponding indexes
- No duplicate indexes on same columns

### 4. Constraint Validation
- NOT NULL on required fields
- CHECK constraints for enum columns
- Proper ON DELETE behavior (SET NULL or CASCADE)

## Agent Dispatch

```
Launch schema-auditor agent with prompt:

"Audit the database schema for: [scope]

Reference files:
- Migrations: supabase/migrations/*.sql
- TypeScript types: src/types/supabase.ts
- Zod schemas: src/atomic-crm/validation/
- Domain types: src/atomic-crm/types/

Checklist:
[ ] Required columns (id, created_at, updated_at, deleted_at)
[ ] View-to-table consistency for *_summary views
[ ] Foreign key index coverage
[ ] Type consistency (DB types vs TS types)

Output format: Markdown report with severity ratings"
```

## Output Format

```markdown
## Schema Audit Report

**Tables Checked:** [count]
**Views Checked:** [count]
**Issues Found:** [count]

### CRITICAL Issues
| Table/View | Issue | Recommendation |
|------------|-------|----------------|

### WARNING Issues
| Table/View | Issue | Recommendation |
|------------|-------|----------------|

### Type Mismatches
| Location | DB Type | TS Type | Severity |
|----------|---------|---------|----------|

### Missing Indexes
| Table | Column(s) | Suggested Index |
|-------|-----------|-----------------|

### Recommendations
1. [Priority] [Specific migration or type fix]
```

## Related Commands

- `/audit:data-integrity` - Data integrity patterns audit
- `/audit:security` - RLS and auth audit
- `/db-migrate` - Create new migrations
