# Database Security Patterns

## Critical: Two-Layer Security
PostgreSQL with Supabase requires BOTH:
1. **GRANT** - Table-level access permissions
2. **RLS Policies** - Row-level filtering

**Common mistake:** RLS without GRANT = "permission denied" error

## Standard Pattern for New Tables
```sql
-- 1. Create table
CREATE TABLE my_table (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 3. Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
GRANT USAGE ON SEQUENCE my_table_id_seq TO authenticated;

-- 4. Create RLS policies
CREATE POLICY select_my_table ON my_table 
  FOR SELECT TO authenticated 
  USING (true);  -- or specific condition
```

## RLS Policy Patterns

### Shared Data (Team-wide Access)
```sql
-- Contacts, organizations - everyone can see
USING (true)
```

### Personal Data (Owner Only)
```sql
-- Tasks - only owner's records
USING (
  sales_id IN (
    SELECT id FROM sales WHERE user_id = auth.uid()
  )
)
```

### Admin-Only Data
```sql
-- Settings, audit logs
USING (
  (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
)
```

### Hierarchical Access
```sql
-- Managers see team data
USING (
  sales_id IN (
    SELECT id FROM sales 
    WHERE user_id = auth.uid() 
    OR manager_id = (SELECT id FROM sales WHERE user_id = auth.uid())
  )
)
```

## Cloud Sync Warning
Running `npx supabase db pull` may strip GRANT statements.
Always verify grants exist after syncing from cloud.

## Test User (Local Development)
- **Email:** admin@test.com
- **Password:** password123
- Defined in `supabase/seed.sql`
