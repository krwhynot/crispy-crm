# Supabase Database Workflow - Single Source of Truth

> **This is the ONLY workflow guide you need for Supabase database operations.**
> All other guides reference this document.

## Quick Reference

```bash
# Local Development
npm run db:local:start    # Start local Supabase
npm run db:local:reset    # Reset & seed database
npm run dev               # Start UI (uses local DB)

# Creating Migrations
npx supabase migration new <name>  # Create migration file

# Cloud Deployment
npm run db:cloud:push     # Deploy migrations to cloud
```

---

## 📦 Section 1: Local Development Setup

### 1.1 Configure Environment

```bash
# Use the local configuration
cp .env.local .env
```

This sets up:
- Local Supabase URL: `http://127.0.0.1:54321`
- Local database connection
- Test credentials

### 1.2 Start Local Supabase

```bash
npm run db:local:start
```

This command:
- ✅ Starts PostgreSQL in Docker
- ✅ Starts Supabase Studio at http://localhost:54323
- ✅ Starts API server at http://localhost:54321
- ✅ Runs all migrations from `supabase/migrations/`

**First time:** ~2 minutes (downloads Docker images)
**After that:** ~10 seconds

### 1.2 Verify Setup

```bash
npm run db:local:status
```

Should show:
- API URL: `http://127.0.0.1:54321`
- Studio URL: `http://127.0.0.1:54323`
- Database URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### 1.3 Reset Database (When Needed)

```bash
npm run db:local:reset
```

This will:
- Drop all data
- Re-run all migrations
- Apply seed data

---

## 🔨 Section 2: Creating Migrations

### Option A: Migration-First (Recommended)

```bash
# 1. Create migration file
npx supabase migration new add_feature_name

# 2. Edit the generated file
# Location: supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql
```

### ⚠️ CRITICAL: Migration Checklist

**Every table migration MUST include:**
- [ ] **RLS enabled** - `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- [ ] **RLS policies** - At minimum: SELECT, INSERT, UPDATE, DELETE
- [ ] **Indexes** - For foreign keys and frequently queried columns
- [ ] **Timestamps** - created_at, updated_at
- [ ] **Soft delete** - deleted_at column (if applicable)
- [ ] **Audit fields** - created_by, updated_by (link to sales.id)
- [ ] **Comments** - Document the table/column purpose

**Complete migration example:**
```sql
-- Create table with all required fields
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Foreign keys
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  sales_id BIGINT REFERENCES sales(id),

  -- Audit fields
  created_by BIGINT REFERENCES sales(id) DEFAULT get_current_sales_id(),
  updated_by BIGINT REFERENCES sales(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Search
  search_tsv TSVECTOR
);

-- CRITICAL: Enable RLS (without this, table is wide open!)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Add RLS policies for each operation
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (sales_id = get_current_sales_id());

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (sales_id = get_current_sales_id());

CREATE POLICY "Users can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (sales_id = get_current_sales_id());

CREATE POLICY "Users can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (sales_id = get_current_sales_id());

-- Add indexes for performance
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_sales_id ON projects(sales_id);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;

-- Add triggers for automatic updates
CREATE TRIGGER set_updated_by_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Document the table
COMMENT ON TABLE projects IS 'Project management for opportunities and tasks';
COMMENT ON COLUMN projects.search_tsv IS 'Full text search vector';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
```

**For Views:**
```sql
CREATE VIEW projects_summary
WITH (security_invoker = true) -- CRITICAL: Use security_invoker, not security_definer
AS
SELECT ... FROM projects ...;

GRANT SELECT ON projects_summary TO authenticated;
```

### Option B: Studio-First (For Experiments)

```bash
# 1. Make changes in Studio
open http://localhost:54323

# 2. Generate migration from changes
npx supabase db diff --use-migra | npx supabase migration new experiment_name

# 3. CRITICAL: Review the generated file!
cat supabase/migrations/*_experiment_name.sql
```

### Testing Your Migration

```bash
# Reset local database with new migration
npm run db:local:reset

# Start dev server and test
npm run dev
```

---

## 🚀 Section 3: Cloud Deployment

### 3.1 Configure Cloud Environment

```bash
# Use the cloud configuration
cp .env.cloud .env

# Add your service role key if needed (for migrations)
# Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
```

### 3.2 Pre-Deployment Checklist

- [ ] Migration tested locally (`npm run db:local:reset`)
- [ ] App works with migration (`npm run dev`)
- [ ] Migration file reviewed for DROP statements
- [ ] Git changes committed
- [ ] Cloud credentials configured

### 3.2 Deploy to Cloud

```bash
npm run db:cloud:push
```

**What happens:**
1. Shows pending migrations
2. Generates schema diff
3. **REQUIRES CONFIRMATION:** Type `APPLY MIGRATIONS`
4. Applies migrations to production

### 3.3 If Push Fails

**Connection Refused Error:**
```bash
# Use Supabase MCP tool instead (if configured)
# Or use the dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
```

**Network Issues:**
```bash
# Try direct push without diff
npx supabase db push --skip-diff

# Or use VPN if network is restricted
```

---

## 🔧 Section 4: Troubleshooting

### Common Migration Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| **Forgot RLS** | Table wide open, no security | Always add `ALTER TABLE x ENABLE ROW LEVEL SECURITY` |
| **No RLS policies** | 403 errors, users can't access data | Add policies for SELECT, INSERT, UPDATE, DELETE |
| **Wrong policy function** | Data leaks between users | Use `get_current_sales_id()` not `auth.uid()` |
| **No indexes** | Slow queries | Index foreign keys and WHERE clause columns |
| **No audit fields** | Can't track who changed data | Add created_by, updated_by linked to sales.id |
| **SECURITY DEFINER on views** | Bypasses RLS, security risk | Use `WITH (security_invoker = true)` |
| **No soft delete** | Can't recover deleted data | Add deleted_at TIMESTAMPTZ column |
| **Missing GRANT** | Permission denied errors | Add `GRANT SELECT, INSERT... TO authenticated` |

### Common Runtime Issues

| Issue | Solution |
|-------|----------|
| Docker not running | Start Docker Desktop |
| Port 54320 in use | `docker ps` and stop conflicting container |
| Migration fails locally | Check SQL syntax, foreign key constraints |
| Cloud push connection refused | Check network, try VPN, use dashboard |
| RLS policies blocking access | Check `auth.uid()` vs `user_id` references |
| View has no RLS | Recreate with `WITH (security_invoker = true)` |

### ⚠️ Sales Record Creation (Critical)

**SINGLE SOURCE:** Sales records are ONLY created by database triggers - never manually.

**Trigger Flow:**
1. User signs up → `auth.users` INSERT
2. Trigger `on_auth_user_created` fires automatically
3. Trigger calls `public.handle_new_user()` function
4. Function creates corresponding `sales` record with default role='rep'

**Seed File Pattern (CORRECT):**
```sql
-- 1. Create auth user (trigger auto-creates sales record)
INSERT INTO auth.users (...) VALUES (...);

-- 2. Update the auto-created sales record if needed
UPDATE sales SET role = 'admin' WHERE user_id = '<uuid>';
```

**Common Mistake (CAUSES DUPLICATES):**
```sql
-- ❌ WRONG - Creates duplicate because trigger already created it
INSERT INTO auth.users (...) VALUES (...);
INSERT INTO sales (...) VALUES (...);  -- Duplicate!
```

**Why This Matters:**
- Violates 1:1 mapping between `auth.users` and `sales`
- Creates duplicate entries in Users List UI
- Causes orphaned records that can't be deleted
- Breaks permission system (which user's role is correct?)

**If You Need to Add Test Users:**
```sql
-- Let trigger create sales record automatically
INSERT INTO auth.users (id, email, ...) VALUES (gen_random_uuid(), 'test@example.com', ...);

-- Then update role if needed
UPDATE sales SET role = 'manager' WHERE email = 'test@example.com';
```

**Reference:** Migration `20251116000000_fix_sales_schema_consistency.sql` fixed duplicates caused by violating this pattern.

### Auth Trigger Warning

⚠️ **Auth schema changes are NOT captured by `db diff`**

If you modify `auth.users` triggers:
1. Manually add to migration file
2. See example: `20251018211500_restore_auth_triggers_and_backfill.sql`

### Emergency Recovery

```bash
# If local is broken
docker stop $(docker ps -q)  # Stop all containers
docker system prune -a       # Clean everything
npm run db:local:start       # Fresh start

# If cloud migration failed partially
# Go to dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
# Run rollback SQL manually
```

---

## 📋 Complete Workflow Example

```bash
# 1. Start fresh local environment
npm run db:local:start
npm run db:local:reset

# 2. Create new feature
npx supabase migration new add_products_table

# 3. Edit migration file
code supabase/migrations/*_add_products_table.sql

# 4. Test locally
npm run db:local:reset
npm run dev
# Test in browser: http://localhost:5173

# 5. Commit to git
git add .
git commit -m "Add products table migration"

# 6. Deploy to cloud
npm run db:cloud:push
# Type: APPLY MIGRATIONS

# 7. Verify
# Check dashboard: https://supabase.com/dashboard
```

---

## 🎯 Key Principles

1. **Always test locally first** - Use `npm run db:local:reset`
2. **One migration per feature** - Keep them focused
3. **Review before deploying** - Check for DROP statements
4. **Never use `db reset` on production** - It deletes ALL data
5. **Use security_invoker for views** - Enforces RLS properly

---

## NPM Scripts Reference

```json
{
  "db:local:start": "npx supabase start",
  "db:local:stop": "npx supabase stop",
  "db:local:reset": "npx supabase db reset",
  "db:local:status": "npx supabase status",
  "db:cloud:push": "./scripts/db/safe-cloud-push.sh",
  "db:cloud:diff": "npx supabase db diff --linked",
  "dev": "vite",
  "dev:local": "npm run db:local:reset && npm run dev"
}
```

---

## WSL2 CLI Troubleshooting

> **Primary Guide:** `.claude/skills/supabase-crm/SKILL.md` has comprehensive troubleshooting

### Password-Based Authentication (Recommended for WSL2)

WSL2 has IPv6 connectivity issues that cause Supabase CLI timeouts. These timeouts trigger Fail2ban after 2 failed attempts, resulting in 30-minute IP bans.

**Solution:** Use password-based authentication:

```bash
# Add to .env (already gitignored)
SUPABASE_DB_PASSWORD=your_database_password_here

# Use with CLI commands
source .env && npx supabase db push
source .env && npx supabase migration list --linked
```

Get your password from: Supabase Dashboard > Project Settings > Database > Reset database password

### Check/Remove IP Bans

If CLI hangs at "Connecting to remote database...":

```bash
# Check for bans
npx supabase network-bans get --project-ref aaqnanddcqvfiwhshndl --experimental

# Remove ban
npx supabase network-bans remove --db-unban-ip <IP_ADDRESS> --project-ref aaqnanddcqvfiwhshndl --experimental
```

### MCP Fallback

When CLI is unavailable, use MCP tools which bypass connection issues:
- `mcp__supabase__apply_migration` - For DDL operations
- `mcp__supabase__execute_sql` - For queries
- `mcp__supabase__list_tables` - Check schema

---

## Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Local Studio](http://localhost:54323)
- [Local API](http://localhost:54321)

---

*Last Updated: December 2024*
*This document supersedes all other workflow guides.*