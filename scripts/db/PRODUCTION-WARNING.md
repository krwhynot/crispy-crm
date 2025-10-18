# ⚠️ PRODUCTION DATABASE SAFETY GUIDE

## ❌ NEVER DO THIS ON PRODUCTION

```bash
# DESTRUCTIVE - Deletes ALL data including auth.users
npx supabase db reset --linked

# DESTRUCTIVE - Bypasses safety checks
npx supabase db push --no-verify
```

## ✅ SAFE PRODUCTION WORKFLOW

### Option 1: Using the Safe Script (Recommended)
```bash
npm run db:cloud:push
```
This script:
- ✅ Shows you what will change before applying
- ✅ Requires explicit confirmation
- ✅ Only applies new migrations (never resets)
- ✅ Preserves all user data and auth credentials

### Option 2: Manual Safe Workflow
```bash
# 1. See what migrations are pending
npx supabase migration list --linked

# 2. Review what changes will be made
npx supabase db diff --linked

# 3. If changes look good, push ONLY new migrations
npx supabase db push

# 4. Verify in dashboard
# https://supabase.com/dashboard/project/YOUR_PROJECT_REF
```

## 🔧 Creating Migrations Safely

### When you need to sync local changes to cloud:

```bash
# 1. Make changes locally and test
npx supabase db reset  # LOCAL only - safe

# 2. Generate migration from diff
npx supabase db diff --linked | npx supabase migration new sync_schema

# 3. Review the generated migration file
cat supabase/migrations/TIMESTAMP_sync_schema.sql

# 4. Apply to production safely
npm run db:cloud:push

# 5. ⚠️ CRITICAL: Manually verify auth schema changes!
# The `db diff` command EXCLUDES the `auth` schema. If you created
# triggers on `auth.users` or functions called by those triggers,
# you MUST manually add them to the migration file.
# See: supabase/migrations/20251018211500_restore_auth_triggers_and_backfill.sql
```

## 🚨 What Went Wrong Before

**The Mistake:**
```bash
npx supabase db reset --linked  # ❌ DELETED ALL DATA
```

This command:
- ❌ Dropped all tables (including auth.users)
- ❌ Deleted all user accounts
- ❌ Lost all data
- ✅ Then re-applied migrations to empty database

**The Correct Approach:**
```bash
npx supabase db push  # ✅ Only applies new migrations
```

This command:
- ✅ Checks migration history
- ✅ Only applies missing migrations
- ✅ Preserves all existing data
- ✅ Keeps user accounts intact

## 🛡️ Additional Safeguards

### 1. Always use the staging environment first
If you have a staging Supabase project:
```bash
# Link to staging
npx supabase link --project-ref YOUR_STAGING_REF

# Test migration
npx supabase db push

# If successful, link to production
npx supabase link --project-ref YOUR_PROD_REF
npm run db:cloud:push
```

### 2. Backup before major changes
```bash
# The Supabase dashboard has automatic daily backups
# For manual backup before big migration:
# Go to: https://supabase.com/dashboard/project/YOUR_REF/database/backups
# Click "Create backup" before applying migration
```

### 3. Monitor after deployment
```bash
# Check for errors
npx supabase functions logs --project-ref YOUR_REF

# Check auth logs
# Dashboard → Authentication → Logs
```

## 📚 Key Commands Reference

| Command | Safe? | Description |
|---------|-------|-------------|
| `npx supabase db push` | ✅ Yes | Applies only new migrations |
| `npx supabase db reset` | ✅ Local only | Resets LOCAL database |
| `npx supabase db reset --linked` | ❌ NEVER | Deletes ALL production data |
| `npm run db:cloud:push` | ✅ Yes | Safe script with confirmations |
| `npx supabase migration new <name>` | ✅ Yes | Creates new migration file |
| `npx supabase db diff --linked` | ✅ Yes | Shows changes (read-only) |

## 🎯 Remember

1. **Local development**: `npx supabase db reset` is fine
2. **Production**: ONLY use `npx supabase db push` or `npm run db:cloud:push`
3. **Never**: Use `--linked` with `db reset`
4. **Always**: Review diffs before pushing to production
