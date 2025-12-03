# Supabase MCP Integration Guide

Using MCP tools alongside CLI for enhanced workflows.

## Table of Contents

- [Available MCP Tools](#available-mcp-tools)
- [CLI vs MCP: When to Use Which](#cli-vs-mcp-when-to-use-which)
- [Combined Workflows](#combined-workflows)
- [SQL Execution Patterns](#sql-execution-patterns)
- [Schema Exploration](#schema-exploration)

---

## Available MCP Tools

### mcp__supabase__execute_sql

Execute SQL directly against the database.

**Use for:**
- Quick queries and data exploration
- Testing SQL before adding to migrations
- Debugging data issues
- One-off data fixes

**Example:**
```
mcp__supabase__execute_sql("SELECT * FROM organizations LIMIT 5")
```

---

### mcp__supabase__list_tables

List all tables in the database.

**Use for:**
- Quick schema overview
- Verifying migrations applied
- Finding table names

**Example:**
```
mcp__supabase__list_tables()
```

---

## CLI vs MCP: When to Use Which

| Task | Use CLI | Use MCP |
|------|---------|---------|
| Create migration file | ✅ `supabase migration new` | ❌ |
| Apply migrations | ✅ `supabase db reset` | ❌ |
| Quick data query | ❌ | ✅ `execute_sql` |
| Schema exploration | ❌ | ✅ `list_tables` |
| Generate types | ✅ `supabase gen types` | ❌ |
| Deploy functions | ✅ `supabase functions deploy` | ❌ |
| Test SQL syntax | ❌ | ✅ `execute_sql` |
| Debug RLS policies | ❌ | ✅ `execute_sql` |
| Push to production | ✅ `supabase db push` | ❌ |

### Key Principle

**MCP for exploration/debugging, CLI for persistent changes**

- MCP tools are great for reading and quick queries
- CLI is required for migrations, deployments, and type generation

---

## Combined Workflows

### Workflow 1: Design New Table

1. **Explore existing schema** (MCP):
   ```
   mcp__supabase__list_tables()
   mcp__supabase__execute_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations'")
   ```

2. **Create migration** (CLI):
   ```bash
   supabase migration new add_products_table
   ```

3. **Write SQL in migration file** (Edit tool)

4. **Apply and test** (CLI):
   ```bash
   supabase db reset
   ```

5. **Verify table exists** (MCP):
   ```
   mcp__supabase__execute_sql("SELECT * FROM products LIMIT 1")
   ```

6. **Generate types** (CLI):
   ```bash
   supabase gen types typescript --local > src/types/supabase.ts
   ```

---

### Workflow 2: Debug RLS Policy

1. **Check current policies** (MCP):
   ```
   mcp__supabase__execute_sql("SELECT schemaname, tablename, policyname, cmd, qual FROM pg_policies WHERE tablename = 'opportunities'")
   ```

2. **Test as different user** (MCP):
   ```
   mcp__supabase__execute_sql("SET ROLE authenticated; SET request.jwt.claims = '{\"sub\": \"user-uuid\"}'; SELECT * FROM opportunities;")
   ```

3. **Create fix migration** (CLI):
   ```bash
   supabase migration new fix_opportunities_rls
   ```

4. **Apply and verify** (CLI + MCP):
   ```bash
   supabase db reset
   ```
   ```
   mcp__supabase__execute_sql("SELECT * FROM pg_policies WHERE tablename = 'opportunities'")
   ```

---

### Workflow 3: Data Investigation

1. **Find anomalies** (MCP):
   ```
   mcp__supabase__execute_sql("SELECT organization_id, COUNT(*) FROM contacts GROUP BY organization_id HAVING COUNT(*) > 100")
   ```

2. **Trace relationships** (MCP):
   ```
   mcp__supabase__execute_sql("SELECT c.*, o.name as org_name FROM contacts c JOIN organizations o ON c.organization_id = o.id WHERE c.id = 'some-uuid'")
   ```

3. **Fix data if needed** (MCP for one-off, migration for systematic):
   - One-off fix: `mcp__supabase__execute_sql("UPDATE ...")`
   - Systematic fix: Create migration with `supabase migration new`

---

## SQL Execution Patterns

### Pattern 1: Schema Exploration

```
-- List all tables
mcp__supabase__list_tables()

-- Get table structure
mcp__supabase__execute_sql("
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'contacts'
  ORDER BY ordinal_position
")

-- Get foreign keys
mcp__supabase__execute_sql("
  SELECT
    tc.table_name, kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'contacts'
")
```

---

### Pattern 2: Data Validation

```
-- Check for orphaned records
mcp__supabase__execute_sql("
  SELECT c.id, c.name
  FROM contacts c
  LEFT JOIN organizations o ON c.organization_id = o.id
  WHERE o.id IS NULL AND c.organization_id IS NOT NULL
")

-- Check for duplicates
mcp__supabase__execute_sql("
  SELECT email, COUNT(*)
  FROM contacts
  GROUP BY email
  HAVING COUNT(*) > 1
")

-- Validate constraints
mcp__supabase__execute_sql("
  SELECT *
  FROM opportunities
  WHERE close_date < created_at
")
```

---

### Pattern 3: Performance Investigation

```
-- Slow queries (requires pg_stat_statements)
mcp__supabase__execute_sql("
  SELECT query, calls, mean_exec_time, total_exec_time
  FROM pg_stat_statements
  ORDER BY total_exec_time DESC
  LIMIT 10
")

-- Table sizes
mcp__supabase__execute_sql("
  SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
  FROM pg_catalog.pg_statio_user_tables
  ORDER BY pg_total_relation_size(relid) DESC
")

-- Index usage
mcp__supabase__execute_sql("
  SELECT
    indexrelname AS index_name,
    idx_scan AS times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
  FROM pg_stat_user_indexes
  ORDER BY idx_scan DESC
")
```

---

## Schema Exploration

### Quick Reference Queries

| What | Query |
|------|-------|
| All tables | `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` |
| Table columns | `SELECT * FROM information_schema.columns WHERE table_name = 'X'` |
| Table indexes | `SELECT * FROM pg_indexes WHERE tablename = 'X'` |
| RLS policies | `SELECT * FROM pg_policies WHERE tablename = 'X'` |
| Foreign keys | See pattern above |
| Row counts | `SELECT reltuples::bigint FROM pg_class WHERE relname = 'X'` |

---

## When NOT to Use MCP

**Always use CLI for:**
- Creating migrations (version control)
- Applying migrations (consistency)
- Deploying Edge Functions
- Generating TypeScript types
- Pushing to production
- Linking projects

**MCP is for exploration, not persistence!**

---

**Line Count:** ~260
