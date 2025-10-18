# Local Development Customizations

**Created:** 2025-10-18
**Purpose:** Document local-specific changes to reapply after cloud-to-local migration

---

## Overview

This document tracks all local-only customizations that differ from the cloud/production database. After pulling a fresh schema from cloud, these changes must be reapplied.

## Local-Specific Files to Preserve

### 1. Environment Configuration

**File:** `.env.local`

```bash
# Local Supabase Configuration
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Application Configuration
APP_NAME=Atomic CRM (Local)
APP_VERSION=0.1.0
```

**Action:** Keep this file - it's already local-specific

---

### 2. Test Data Seeding

**File:** `supabase/seed.sql`

Contains:
- Test user: `admin@test.com` / `password123`
- 5 Principal organizations (Heritage Creamery Foods, etc.)
- Sample contacts, opportunities, products
- Task and note examples

**Action:** Preserve this entire file - it's for local development only

---

### 3. Supabase Configuration

**File:** `supabase/config.toml`

**Local-specific settings:**

```toml
[studio]
api_url = "http://127.0.0.1"  # Local API URL

[auth]
site_url = "http://localhost:5173/"
additional_redirect_urls = ["https://localhost:5173/auth-callback.html"]

[storage]
enabled = false  # Disabled due to CLI/Storage API version mismatch

[remotes.production]
project_id = "aaqnanddcqvfiwhshndl"  # Cloud production reference
```

**Action:** Keep these local overrides

---

## Migrations to Verify After Cloud Pull

After pulling from cloud, verify these migrations exist (they should be in cloud already):

1. ✅ `20251013000000_cloud_schema_sync.sql` - Base schema
2. ✅ `20251015014019_restore_auth_triggers.sql` - Auth user triggers
3. ✅ `20251016000000_add_test_users_metadata.sql` - Test metadata table
4. ✅ `20251016004137_add_test_user_metadata_constraint.sql` - Unique constraint
5. ✅ `20251016175722_fix_security_definer_views.sql` - View security
6. ✅ `20251016175758_fix_function_search_paths.sql` - Function paths
7. ✅ `20251017013837_remove_inventory_features.sql` - Inventory cleanup
8. ✅ `20251017141210_migrate_colors_to_semantic.sql` - Color migration
9. ✅ `20251018031206_remove_unused_org_fields.sql` - Org field cleanup
10. ✅ `20251018104712_remove_deprecated_organization_flags.sql` - Flag cleanup
11. ✅ `20251018104713_remove_unused_feature_columns.sql` - Feature cleanup
12. ✅ `20251018181819_remove_seasonal_and_limited_availability_statuses.sql` - Status cleanup

**Action:** If any are missing, they may have been local-only and need to be pushed to cloud first

---

## Local-Only Migrations (Not in Cloud)

**Check if these migrations exist in cloud before cleanup:**

- `supabase/migrations/.env` - This seems incorrect (shouldn't have .env in migrations)
- `RECONCILIATION_SUMMARY.md` - Documentation file (not a migration)

**Action:** Remove these non-migration files from migrations directory

---

## Database Schema Differences

### Known Local-Only Changes

None identified - all schema changes should be in cloud already.

### Test Users

**Local test accounts** (created by seed.sql):
- `admin@test.com` / `password123` (sales_id will be auto-assigned)

**Action:** These are created by seed.sql, no migration needed

---

## Steps to Reapply After Migration

1. **Pull fresh schema from cloud:**
   ```bash
   npx supabase db pull --linked
   ```

2. **Verify migrations match cloud:**
   ```bash
   npx supabase db diff
   ```
   (Should show no differences if all local migrations were already pushed)

3. **Reset local database:**
   ```bash
   npx supabase db reset
   ```
   This will:
   - Apply all migrations
   - Run seed.sql automatically
   - Create test users and sample data

4. **Verify test user exists:**
   ```sql
   SELECT email FROM auth.users WHERE email = 'admin@test.com';
   ```

5. **Test login with** `admin@test.com` / `password123`

---

## Critical Notes

⚠️ **NEVER run `npx supabase db reset --linked`** - This will wipe production data!

✅ **Safe commands:**
- `npx supabase db reset` (local only)
- `npx supabase db pull --linked` (read-only from cloud)
- `npx supabase db push --linked` (with confirmation prompts)

---

## Troubleshooting

### If PGRST301 errors persist after migration:

1. Stop all containers: `npx supabase stop`
2. Remove Docker volumes: `docker volume rm $(docker volume ls -q --filter label=com.supabase.cli.project=crispy-crm)`
3. Start fresh: `npx supabase start`
4. Reset database: `npx supabase db reset`

### If schema is out of sync:

1. Check cloud migrations: `npx supabase migration list --linked`
2. Compare with local: `npx supabase migration list`
3. Pull any missing migrations: `npx supabase db pull --linked`

---

## Files to Keep (Do Not Delete)

- ✅ `.env.local` - Local environment variables
- ✅ `supabase/seed.sql` - Test data
- ✅ `supabase/config.toml` - Supabase configuration
- ✅ `supabase/migrations/` - All migration files (will be refreshed)

## Files to Remove Before Migration

- ❌ `supabase/migrations/.env` - Invalid file in migrations
- ❌ `supabase/migrations/RECONCILIATION_SUMMARY.md` - Documentation (not a migration)
- ❌ Docker volumes (will be recreated)

---

## Post-Migration Verification Checklist

- [ ] Supabase starts without errors: `npx supabase status`
- [ ] Migrations applied successfully: Check for NOTICE/ERROR messages
- [ ] Test user exists: Query `auth.users` for `admin@test.com`
- [ ] Sample data loaded: Check organizations, contacts, opportunities tables
- [ ] App connects: Visit `http://localhost:5173/debug.html`
- [ ] Login works: Use `admin@test.com` / `password123`
- [ ] API queries return data: Test Sales/Contacts/Organizations queries
- [ ] No PGRST301 errors: Check connection test in debug.html

---

**Document Status:** ✅ Complete
**Last Updated:** 2025-10-18
**Next Action:** Proceed to Phase 2 (Cleanup)
