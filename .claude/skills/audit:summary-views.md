---
name: audit:summary-views
description: Audit *_summary views for required columns and consistency. Use when creating views, debugging "column not found" errors, or reviewing schema. Triggers on view, summary, migration, schema, column missing, database audit.
---

# Summary Views Audit

## Purpose

Ensures all `*_summary` views include required columns and stay in sync with their base tables.

## When to Use

- After creating or modifying summary views
- When getting "column not found" errors
- During schema reviews
- Before deploying view migrations

## Required Columns

### All Summary Views Must Include:
| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key from base table |
| `created_at` | timestamptz | Audit trail |
| `updated_at` | timestamptz | Change tracking |
| `deleted_at` | timestamptz | Soft delete filtering |

### User-Owned Data Views Must Also Include:
| Column | Type | Purpose |
|--------|------|---------|
| `sales_id` | uuid | Owner reference for RLS |

## Audit Process

### 1. List All Summary Views
```bash
rg "CREATE.*VIEW.*_summary" supabase/migrations/ -l
```

### 2. Check Each View's Columns
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'contacts_summary';
```

### 3. Compare with Base Table
Ensure view includes all base table columns plus computed fields.

## Common Issues

### Missing Timestamp Columns
```sql
-- BAD: Missing updated_at
CREATE VIEW contacts_summary AS
SELECT id, name, created_at
FROM contacts;

-- GOOD: All required columns
CREATE VIEW contacts_summary AS
SELECT id, name, created_at, updated_at, deleted_at, sales_id
FROM contacts;
```

### Orphaned Computed Fields
When base table adds column, view must be updated:
```sql
-- After adding 'priority' to opportunities table
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
  o.*,
  o.priority,  -- New column
  COUNT(a.id) as nb_activities
FROM opportunities o
LEFT JOIN activities a ON a.opportunity_id = o.id
GROUP BY o.id;
```

## View-Table Mapping

| View | Base Table | Extra Columns |
|------|------------|---------------|
| contacts_summary | contacts | nb_notes, latest_activity |
| organizations_summary | organizations | nb_contacts, nb_opportunities |
| opportunities_summary | opportunities | nb_activities, customer_name |

## Fix Template

```sql
-- Recreate view with missing columns
DROP VIEW IF EXISTS table_summary;
CREATE VIEW table_summary AS
SELECT
  t.id,
  t.created_at,
  t.updated_at,
  t.deleted_at,
  t.sales_id,
  -- other columns...
FROM table t;
```

## Reference

- Provider Rules: View vs. Table Duality (reads from views, writes to tables)
- Engineering Constitution: Single source of truth
