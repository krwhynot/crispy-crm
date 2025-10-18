# Local Development Database Setup

**Last Updated:** 2025-10-18
**Status:** ✅ Working - Database fully configured with shared team access

---

## Current Database State

Your local database is configured with:
- ✅ Fresh cloud schema (consolidated Oct 18, 2025)
- ✅ Auth triggers for automatic user-sales sync
- ✅ Shared team access (contacts, orgs, opportunities shared)
- ✅ Personal task lists (tasks are private per user)
- ✅ Audit trail (created_by, updated_by, created_at, updated_at)
- ✅ Helper function for clean RLS policies

---

## Active Migrations

These migrations are currently applied (in order):

1. **20251018152315_cloud_schema_fresh.sql** - Base schema from cloud
2. **20251018203500_update_rls_for_shared_team_access.sql** - RLS policies
3. **20251018204500_add_helper_function_and_audit_trail.sql** - Helper + audit
4. **20251018210000_add_created_by_audit_field.sql** - Created_by column
5. **20251018211500_restore_auth_triggers_and_backfill.sql** ⚠️ **CRITICAL**

---

## ⚠️ CRITICAL: Auth Triggers Migration

**File:** `20251018211500_restore_auth_triggers_and_backfill.sql`

**DO NOT DELETE THIS FILE!**

This migration restores triggers on `auth.users` that cannot be dumped by Supabase CLI tools. These triggers:
- Auto-create sales records when users sign up
- Keep auth.users and sales table in sync
- Are ESSENTIAL for the app to function

**Why it's critical:**
- Supabase's `db dump --schema public` excludes auth schema objects
- Without this migration, new users won't get sales records
- App will show blank pages (the issue we just fixed)

---

## Test User

**Email:** `admin@test.com`
**Password:** `password123`
**Sales ID:** 1
**User ID:** `d3129876-b1fe-40eb-9980-64f5f73c64d6`

This user is auto-created by `supabase/seed.sql` with sample data.

---

## Local-Specific Configuration

### Environment Variables (.env.local)
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Supabase Config (supabase/config.toml)
```toml
[auth]
site_url = "http://localhost:5173/"

[storage]
enabled = false  # Disabled due to version mismatch

[remotes.production]
project_id = "aaqnanddcqvfiwhshndl"
```

---

## Common Commands

### Reset Database (Applies All Migrations + Seed Data)
```bash
npx supabase db reset
```
This will:
1. Drop and recreate the database
2. Apply all migrations in order
3. Run `supabase/seed.sql` to create test user and sample data
4. Create sales record for test user (via auth trigger)

### Check Migration Status
```bash
npx supabase migration list
```

### Access Supabase Studio
```bash
# Open browser to:
http://localhost:54323
```

---

## Migration Best Practices

### ✅ Safe Operations

```bash
# Pull changes from cloud (read-only)
npx supabase db pull --linked

# Check differences before pushing
npx supabase db diff

# Push with confirmation prompts
npx supabase db push --linked

# Reset local only
npx supabase db reset
```

### ❌ Dangerous Operations

```bash
# NEVER run this - deletes production data!
npx supabase db reset --linked

# NEVER consolidate migrations this way again:
rm supabase/migrations/*
npx supabase db dump --linked --schema public
# ^ This loses auth triggers!
```

---

## Troubleshooting

### Blank Pages After Login
**Symptom:** User can log in but sees blank pages
**Cause:** Missing auth triggers (users have no sales records)
**Fix:** Verify `20251018211500_restore_auth_triggers_and_backfill.sql` exists and is applied

### PGRST301 Errors
**Symptom:** "No suitable key or wrong key type"
**Cause:** PostgREST schema cache corruption
**Fix:** Stop Supabase, remove Docker volumes, restart:
```bash
npx supabase stop
docker volume rm $(docker volume ls -q --filter label=com.supabase.cli.project=crispy-crm)
npx supabase start
npx supabase db reset
```

### Login Fails with "Invalid credentials"
**Check:** Are you using `admin@test.com` not `account@gmail.com`?
**Check:** Password is `password123` (set in seed.sql)

---

## Verification Checklist

After `npx supabase db reset`, verify:

- [ ] Supabase starts: `npx supabase status`
- [ ] Migrations applied: Check for errors during reset
- [ ] Test user exists: Visit debug.html, login with admin@test.com
- [ ] Sales record exists: "Test Sales Query" should return 1 record
- [ ] Sample data loaded: 5 organizations should exist
- [ ] App works: Visit http://localhost:5173, no blank pages

---

## Architecture Notes

### Data Model

```
auth.users (Supabase managed)
    ↓ [TRIGGER: on_auth_user_created]
sales (Application data - 1:1 with users)
    ↓ [FOREIGN KEYS]
contacts, organizations, opportunities (Shared team data)
tasks (Personal data - filtered by sales_id)
```

### Access Control

- **Shared Resources:** contacts, organizations, opportunities, products, notes
  - Policy: `USING (true)` - Everyone can see/edit all records

- **Personal Resources:** tasks
  - Policy: `USING (sales_id = public.get_current_sales_id())` - Only creator

### Audit Trail

All shared resources track:
- `created_by` - Sales ID who created (set on INSERT via DEFAULT)
- `created_at` - When created
- `updated_by` - Sales ID who last modified (set on UPDATE via trigger)
- `updated_at` - When last modified

---

## For More Information

- **Supabase Docs:** https://supabase.com/docs
- **CLI Reference:** https://supabase.com/docs/reference/cli
- **Local Development:** https://supabase.com/docs/guides/local-development

---

**Document Status:** ✅ Current and Complete
**Next Review:** When adding new migrations or changing architecture
