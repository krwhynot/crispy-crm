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

### 1.1 Start Local Supabase

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

Example migration:
```sql
-- Add new table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
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

### 3.1 Pre-Deployment Checklist

- [ ] Migration tested locally (`npm run db:local:reset`)
- [ ] App works with migration (`npm run dev`)
- [ ] Migration file reviewed for DROP statements
- [ ] Git changes committed

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

### Common Issues

| Issue | Solution |
|-------|----------|
| Docker not running | Start Docker Desktop |
| Port 54320 in use | `docker ps` and stop conflicting container |
| Migration fails locally | Check SQL syntax, foreign key constraints |
| Cloud push connection refused | Check network, try VPN, use dashboard |
| RLS policies blocking access | Check `auth.uid()` vs `user_id` references |
| View has no RLS | Recreate with `WITH (security_invoker = true)` |

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

## Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Local Studio](http://localhost:54323)
- [Local API](http://localhost:54321)

---

*Last Updated: October 2024*
*This document supersedes all other workflow guides.*