# Database

## Two-Layer Security: GRANT + RLS

PostgreSQL needs BOTH grants AND RLS policies. RLS without GRANT = "permission denied". GRANT without RLS = all rows visible.

```sql
-- Step 1: Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Step 2: GRANT table access
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

-- Step 3: RLS policies
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated USING (public.is_admin());
```

## Migration Structure

```bash
# Always use Supabase CLI (never manual numbering)
npx supabase migration new add_contact_tags
```

Migration file parts: (1) Types/Enums, (2) Tables, (3) Enable RLS, (4) GRANT, (5) RLS Policies, (6) Verification DO block.

## Enum Management

```sql
-- Add value (safe, irreversible)
ALTER TYPE priority_level ADD VALUE IF NOT EXISTS 'urgent' AFTER 'critical';

-- Cannot remove enum values. Deprecate or create new enum and migrate.
COMMENT ON TYPE priority_level IS 'DEPRECATED: urgent no longer used';
```

## Role-Based Helper Functions

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

Use SECURITY DEFINER so functions can query sales table from RLS context.

## Permission Matrix

| Resource | Admin | Manager | Rep |
|----------|-------|---------|-----|
| Shared (Contacts/Orgs) - View/Create | All | All | All |
| Shared - Delete | Yes | No | No |
| Personal (Tasks) - Edit | All | All | Own |
| Opportunities - Edit | All | All | Own |

## Triggers

```sql
-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

Use triggers for: sync computed fields, enforce constraints, audit timestamps, cascade updates.

## JSONB Columns

```sql
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email JSONB DEFAULT '[]'::jsonb,
  phone JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GIN index for JSONB queries
CREATE INDEX idx_contacts_email_gin ON contacts USING GIN (email);
```

## Views for Computed Columns

```sql
CREATE OR REPLACE VIEW organizations_summary AS
SELECT o.id, o.name, o.type,
  COUNT(DISTINCT c.id) AS contact_count,
  COUNT(DISTINCT opp.id) AS opportunity_count
FROM organizations o
LEFT JOIN contacts c ON c.organization_id = o.id
LEFT JOIN opportunities opp ON opp.customer_organization_id = o.id
GROUP BY o.id, o.name, o.type;
```

Read from views, write to base tables.

## Common Index Patterns

```sql
-- Foreign key (for joins)
CREATE INDEX idx_tasks_sales_id ON tasks(sales_id);

-- Filtered (for common queries)
CREATE INDEX idx_tasks_incomplete ON tasks(sales_id) WHERE completed = false;

-- Text search
CREATE INDEX idx_contacts_search_tsv ON contacts USING GIN(search_tsv);
```

## Verification Blocks

Always add a DO block at the end of migrations:

```sql
DO $$
BEGIN
  PERFORM 1 FROM pg_type WHERE typname = 'user_role';
  IF NOT FOUND THEN RAISE EXCEPTION 'user_role enum not created'; END IF;

  PERFORM 1 FROM information_schema.columns
  WHERE table_name = 'sales' AND column_name = 'role';
  IF NOT FOUND THEN RAISE EXCEPTION 'role column not added'; END IF;

  RAISE NOTICE 'Migration verified successfully';
END $$;
```

## Database Decision Tree

```
Need to add table/column?
|
+- Step 1: npx supabase migration new <name>
+- Step 2: Define schema (enums first, then tables with GENERATED ALWAYS AS IDENTITY)
+- Step 3: ALTER TABLE <name> ENABLE ROW LEVEL SECURITY
+- Step 4: GRANT permissions to authenticated
+- Step 5: CREATE RLS policies (use helper functions)
+- Step 6: Add indexes (foreign keys, filtered, GIN)
+- Step 7: Verification DO block
```

## Testing Locally

```bash
npx supabase db reset          # Reset local database
npx supabase migration list    # Check migration status
npm run db:cloud:push:dry-run  # Validate against cloud
npm run db:cloud:push          # Push to cloud
```
