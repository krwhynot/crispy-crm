# Database: Advanced Patterns

## Purpose

Document advanced database patterns: triggers, JSONB columns, indexes, and views.

## Pattern: Triggers

### Sync Trigger Pattern

**From `20251111121526_add_role_based_permissions.sql:353`:**

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION sync_is_admin_from_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_admin := (NEW.role = 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER keep_is_admin_synced
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_admin_from_role();

COMMENT ON TRIGGER keep_is_admin_synced ON sales IS 'Keeps is_admin column in sync with role column during transition period';
```

**When to Use Triggers:**
- Sync computed fields
- Enforce complex constraints
- Audit changes (created_at, updated_at)
- Cascade updates/deletes

### Updated_at Trigger Pattern

```sql
-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### Auth Trigger Pattern

```sql
-- Create sales record when auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.sales (
    user_id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'rep', -- Default role
    NEW.created_at,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Pattern: JSONB Columns

### Creating JSONB Arrays

```sql
-- Create table with JSONB array columns
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  first_name TEXT,
  last_name TEXT,

  -- JSONB arrays for multi-valued fields
  email JSONB DEFAULT '[]'::jsonb,
  phone JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Example data
INSERT INTO contacts (first_name, last_name, email, phone) VALUES (
  'John',
  'Doe',
  '[{"email": "john@example.com", "type": "Work"}, {"email": "john.doe@personal.com", "type": "Home"}]'::jsonb,
  '[{"number": "555-1234", "type": "Work"}]'::jsonb
);

-- Query JSONB arrays
SELECT first_name, last_name,
       email->0->>'email' AS primary_email
FROM contacts
WHERE email @> '[{"type": "Work"}]'::jsonb;
```

**Why JSONB:**
- Flexible schema (add fields without migration)
- Efficient indexing
- Rich query operators
- Perfect for UI-driven arrays (email, phone, tags)

### GIN Index for JSONB

```sql
-- Index for JSONB queries
CREATE INDEX idx_contacts_email_gin ON contacts USING GIN (email);
CREATE INDEX idx_contacts_tags_gin ON contacts USING GIN (tags);

-- Enables fast queries like:
-- WHERE email @> '[{"type": "Work"}]'::jsonb
-- WHERE tags @> '["vip"]'::jsonb
```

## Pattern: Indexes

### Common Index Patterns

```sql
-- Primary key (automatic index)
id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY

-- Foreign key index (for joins)
CREATE INDEX idx_tasks_sales_id ON tasks(sales_id);
CREATE INDEX idx_tasks_opportunity_id ON tasks(opportunity_id);

-- Filtered index (for common queries)
CREATE INDEX idx_tasks_incomplete ON tasks(sales_id) WHERE completed = false;
CREATE INDEX idx_opportunities_active ON opportunities(stage) WHERE stage NOT IN ('closed_won', 'closed_lost');

-- Multi-column index (for composite queries)
CREATE INDEX idx_opportunities_stage_priority ON opportunities(stage, priority);

-- Text search index
CREATE INDEX idx_contacts_search_tsv ON contacts USING GIN(search_tsv);

-- Role-based query index
CREATE INDEX idx_sales_role ON sales(role);
```

## Pattern: Views for Computed Columns

### Summary View Pattern

```sql
-- View with aggregated data
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.type,
  -- Count relationships
  COUNT(DISTINCT c.id) AS contact_count,
  COUNT(DISTINCT opp.id) AS opportunity_count,
  COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage = 'closed_won') AS won_count,
  -- Computed fields
  COALESCE(SUM(opp.estimated_value) FILTER (WHERE opp.stage NOT IN ('closed_won', 'closed_lost')), 0) AS pipeline_value,
  MAX(act.created_at) AS last_activity_date
FROM organizations o
LEFT JOIN contacts c ON c.organization_id = o.id
LEFT JOIN opportunities opp ON opp.customer_organization_id = o.id
LEFT JOIN activities act ON act.organization_id = o.id
GROUP BY o.id, o.name, o.type;

-- Grant and RLS for view
GRANT SELECT ON organizations_summary TO authenticated;

ALTER VIEW organizations_summary SET (security_invoker = true);
```

**Benefits:**
- Computed columns without denormalization
- Consistent aggregation logic
- Efficient caching (materialized views)
- Simplifies application queries

## Quick Reference

| Pattern | Use Case |
|---------|----------|
| Sync trigger | Keep computed columns updated |
| Updated_at trigger | Automatic timestamp updates |
| Auth trigger | Create related records on signup |
| JSONB arrays | Flexible multi-value fields |
| GIN index | Fast JSONB queries |
| Filtered index | Optimize common queries |
| Views | Computed/aggregated columns |

## Related Resources

- [database-security.md](database-security.md) - GRANT + RLS
- [database-roles.md](database-roles.md) - Role-based permissions
- [database-reference.md](database-reference.md) - Decision tree

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
