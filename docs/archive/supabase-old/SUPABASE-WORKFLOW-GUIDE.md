# 📘 Official Supabase Workflow Guide

Based on [Supabase Official Documentation](https://supabase.com/docs/guides/deployment/managing-environments)

## 🎯 The Correct Local → Cloud Workflow

### Environment Setup

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   LOCAL     │────▶│   STAGING    │────▶│  PRODUCTION    │
│  Database   │     │  (Optional)  │     │   Database     │
└─────────────┘     └──────────────┘     └────────────────┘
     Docker             Supabase            Supabase Cloud
```

---

## 📋 Step-by-Step Workflow

### 1️⃣ Initial Setup (One Time)

```bash
# Initialize Supabase in your repo
npx supabase init

# Link to your cloud project
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID

# Pull existing schema from cloud (if project has data)
npx supabase db pull

# Start local Supabase
npx supabase start
```

**Access Points:**
- Local Studio: http://localhost:54323
- Local API: http://localhost:54321

---

### 2️⃣ Daily Development Workflow

#### Option A: Manual Migrations (Recommended for Complex Changes)

```bash
# 1. Create a new migration file
npx supabase migration new add_feature_name

# 2. Edit the migration file with SQL
# File location: supabase/migrations/<timestamp>_add_feature_name.sql

# 3. Apply to local database
npx supabase db reset

# 4. Test your changes locally
npm run dev

# 5. Commit migration to git
git add supabase/migrations/
git commit -m "Add feature_name migration"
```

#### Option B: Auto Schema Diff (Good for Quick Changes)

```bash
# 1. Make changes in Studio UI (http://localhost:54323)
# Example: Create tables, add columns, etc.

# 2. Generate migration from diff
npx supabase db diff -f feature_name

# 3. ⚠️ CRITICAL: Review generated migration
cat supabase/migrations/<timestamp>_feature_name.sql

# ⚠️ CHECK: Did you modify auth schema?
# - Triggers on auth.users?
# - Functions called by auth triggers?
# These will NOT be in the generated migration!
# Manually add them using git history or Dashboard as reference.

# 4. Test locally
npx supabase db reset

# 5. Commit to git
git add supabase/migrations/
git commit -m "Add feature_name"
```

---

## ⚠️ CRITICAL: Auth Schema Exclusions

### The Problem

Supabase's `db dump` and `db diff` commands **exclude the `auth` schema by design** for security reasons. This means:

❌ **NOT Captured by Automated Tools:**
- Triggers on `auth.users`
- Functions used by auth triggers
- Policies on auth tables
- Auth schema modifications

✅ **Captured by Automated Tools:**
- Public schema tables, functions, policies
- RLS policies on public tables
- Indexes, constraints, views

### Real-World Impact

**Example:** The auth triggers issue (Oct 2025)
```sql
-- This trigger is CRITICAL for the app to work
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

When we consolidated migrations using `npx supabase db dump`, this trigger was **excluded**, causing:
- ❌ New users had no sales records
- ❌ App showed blank pages after login
- ❌ 1:1 mapping between auth.users and sales table broken

### The Solution

**When modifying auth schema objects:**

1. **Create manual migration file** - Never rely on `db diff`
2. **Document in comments** - Add big warnings like in `20251018211500_restore_auth_triggers_and_backfill.sql`
3. **Test thoroughly** - Verify auth flow works after migration
4. **Preserve separately** - Never delete these migrations when consolidating

**Reference:** See `supabase/migrations/20251018211500_restore_auth_triggers_and_backfill.sql` for example.

---

### 3️⃣ Deploying to Production

#### ✅ SAFE Method (Using Our Script)

```bash
npm run db:cloud:push
```

This script will:
1. Show you pending migrations
2. Show schema diff
3. Require explicit confirmation
4. Only apply new migrations (preserves data)

#### ✅ SAFE Method (Manual)

```bash
# 1. Check what will be applied
npx supabase migration list --linked

# 2. Preview changes
npx supabase db diff --linked

# 3. Apply migrations safely
npx supabase db push

# 4. Verify in dashboard
# Visit: https://supabase.com/dashboard/project/YOUR_REF
```

#### ❌ NEVER DO THIS

```bash
# DESTRUCTIVE - Deletes ALL data including users!
npx supabase db reset --linked

# DANGEROUS - Bypasses safety checks
npx supabase db push --no-verify
```

---

## 🔄 Common Workflows

### Making Schema Changes

```bash
# Local development
npx supabase migration new my_change
# Edit supabase/migrations/<timestamp>_my_change.sql
npx supabase db reset          # Apply locally
npm run dev                    # Test

# Deploy to production
npm run db:cloud:push          # Safe deployment
```

### Syncing Local with Production

```bash
# If team members deployed changes to production
npx supabase db pull           # Pull latest from cloud
npx supabase db reset          # Apply to local
```

⚠️ **Warning:** `npx supabase db pull` will overwrite uncommitted local migration files. If you have local schema changes that aren't in version control, commit them first or use `npx supabase db diff` to save them before pulling.

### Testing Migrations Before Production

```bash
# 1. Create migration locally
npx supabase migration new test_feature

# 2. Test locally
npx supabase db reset

# 3. Review the migration
cat supabase/migrations/<timestamp>_test_feature.sql

# 4. If satisfied, deploy
npm run db:cloud:push
```

---

## 🚀 Advanced: CI/CD with GitHub Actions

### Recommended Setup

```yaml
# .github/workflows/production.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.PRODUCTION_DB_PASSWORD }}
      SUPABASE_PROJECT_ID: ${{ secrets.PRODUCTION_PROJECT_ID }}

    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase link --project-ref $SUPABASE_PROJECT_ID
      - run: supabase db push  # ✅ Safe - only applies new migrations
```

---

## 🛡️ Safety Principles

### ✅ DO

1. **Always test locally first**
   ```bash
   npx supabase db reset  # Local testing
   ```

2. **Use version control**
   ```bash
   git add supabase/migrations/
   git commit -m "Descriptive message"
   ```

3. **Review before deploying**
   ```bash
   npx supabase db diff --linked  # Preview changes
   ```

4. **Use safe deployment commands**
   ```bash
   npm run db:cloud:push  # With confirmations
   ```

### ❌ DON'T

1. **Never reset production**
   ```bash
   npx supabase db reset --linked  # ❌ DELETES EVERYTHING
   ```

2. **Don't skip reviews**
   - Always review migration files before deploying
   - Check `npx supabase db diff` output

3. **Don't modify production directly**
   - Make changes locally first
   - Use migrations, not manual SQL in dashboard

---

## 🔍 Key Commands Reference

| Command | Environment | Purpose | Safe? |
|---------|-------------|---------|-------|
| `npx supabase db reset` | Local | Reset local DB, apply all migrations | ✅ Safe |
| `npx supabase db push` | Cloud | Apply new migrations only | ✅ Safe |
| `npm run db:cloud:push` | Cloud | Safe push with confirmations | ✅ Safe |
| `npx supabase db pull` | Local | Pull cloud schema to local | ✅ Safe |
| `npx supabase db diff --linked` | Read-only | Show cloud vs local diff | ✅ Safe |
| `npx supabase migration list --linked` | Read-only | Show migration status | ✅ Safe |
| `npx supabase db reset --linked` | Cloud | **DELETE ALL PRODUCTION DATA** | ❌ NEVER |

---

## 📊 Migration Best Practices

### Naming Conventions

```bash
# Good migration names
20251017000000_add_users_table.sql
20251017000100_add_email_index.sql
20251017000200_enable_rls_on_users.sql

# Bad migration names
migration.sql
fix.sql
temp.sql
```

### Migration Content

```sql
-- ✅ Good: Idempotent, safe
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL
);

-- ❌ Bad: Not idempotent
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text
);

-- ✅ Good: Handles existing data
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone text;

-- ❌ Bad: Fails if column exists
ALTER TABLE users
  ADD COLUMN phone text;
```

---

## 🚨 What We Learned

### Mistake #1: Production Database Reset

```bash
npx supabase db reset --linked  # ❌ This destroyed all users
```

**What happened:**
1. Dropped all tables (including `auth.users`)
2. Deleted all user accounts
3. Lost all production data
4. Re-applied migrations to empty database

**The Correct Approach:**
```bash
npx supabase db push  # ✅ Only applies new migrations
```

**What this does:**
1. Checks migration history
2. Applies only missing migrations
3. Preserves all existing data
4. Keeps user accounts intact

### Mistake #2: Migration Consolidation Without Auth Triggers

```bash
# ❌ This loses auth triggers
rm supabase/migrations/*
npx supabase db dump --linked --schema public > migrations/new_base.sql
```

**What happened:**
1. Dumped public schema only (auth excluded)
2. Lost triggers on auth.users
3. New users couldn't get sales records
4. App showed blank pages after login

**The Correct Approach:**
```bash
# ✅ Manual migration for auth triggers
npx supabase migration new restore_auth_triggers
# Then manually add trigger creation SQL
# Reference: supabase/migrations/20251018211500_restore_auth_triggers_and_backfill.sql
```

**What this does:**
1. Preserves auth schema modifications
2. Documents triggers in version control
3. Ensures 1:1 user-sales mapping works
4. App functions correctly after signup

---

## 📚 Additional Resources

- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [CLI Reference](https://supabase.com/docs/reference/cli)
- [Migration Best Practices](https://supabase.com/docs/guides/database/migrations)

---

## 💡 Pro Tips

1. **Always commit migrations before deploying**
   - This ensures team members can pull changes
   - Provides version history

2. **Use descriptive migration names**
   - Helps understand what changed when
   - Makes rollbacks easier

3. **Test migrations in staging first**
   - Create a staging Supabase project
   - Deploy there before production

4. **Keep migrations small**
   - One logical change per migration
   - Easier to debug and rollback

5. **Document complex migrations**
   - Add comments explaining the "why"
   - Include rollback instructions if needed

---

## 🆘 Emergency Procedures

### If You Accidentally Run `db reset --linked`

1. **Don't panic** - The database structure is intact
2. **Recreate admin users** via Dashboard:
   - Go to: Auth > Users > Add user
   - Create necessary accounts
3. **Restore from backup** if available:
   - Dashboard > Database > Backups
4. **Document the incident** for future prevention

### If Migration Fails

```bash
# 1. Check the error message
npx supabase db push --debug

# 2. Fix the migration file
# Edit: supabase/migrations/<timestamp>_failed_migration.sql

# 3. Test locally first
npx supabase db reset

# 4. Deploy again
npm run db:cloud:push
```

---

**Remember:** Local = `db reset` ✅ | Production = `db push` ✅ | **NEVER** = `db reset --linked` ❌
