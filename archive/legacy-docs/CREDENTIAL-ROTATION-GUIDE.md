# Credential Rotation Guide

**Created:** 2025-11-22
**Status:** ACTION REQUIRED
**Priority:** URGENT - Credentials exposed in git history

---

## Overview

Production Supabase credentials were committed to `.env-archive/` folder and are in git history. This guide walks through rotating all affected credentials.

**Project:** `aaqnanddcqvfiwhshndl` (Supabase Cloud)

---

## Step 1: Rotate Database Password

1. Go to: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/settings/database
2. Click **"Reset database password"**
3. Copy the new password
4. Update these locations:
   - [ ] `.env.local` - `DATABASE_URL` connection string
   - [ ] `.env.cloud` - if present
   - [ ] Vercel Dashboard → Environment Variables (if deployed there)
   - [ ] GitHub Secrets → `DATABASE_URL` (if used in CI)

---

## Step 2: Regenerate JWT Secret

1. Go to: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/settings/api
2. Scroll to **"JWT Settings"**
3. Click **"Generate a new JWT secret"**
4. **WARNING:** This will invalidate ALL existing sessions and tokens
5. No code changes needed - Supabase handles this internally

---

## Step 3: Regenerate Service Role Key

1. Go to: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/settings/api
2. Find **"Project API keys"** section
3. Click **"Generate new key"** next to `service_role`
4. Copy the new key
5. Update these locations:
   - [ ] `.env.local` - `SUPABASE_SERVICE_ROLE_KEY`
   - [ ] GitHub Secrets → `SUPABASE_SERVICE_ROLE_KEY`
   - [ ] Any scripts that use the service role key

---

## Step 4: (Optional) Regenerate Anon Key

The anon key is public by design, but you may want to rotate it anyway:

1. Go to: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/settings/api
2. Find **"Project API keys"** section
3. Click **"Generate new key"** next to `anon`
4. Update these locations:
   - [ ] `.env.local` - `VITE_SUPABASE_ANON_KEY`
   - [ ] `.env.cloud` - `VITE_SUPABASE_ANON_KEY`
   - [ ] Vercel Dashboard → Environment Variables

---

## Step 5: Verify Application Works

After rotating credentials:

```bash
# Test local development
npm run dev

# Verify Supabase connection
# Login should work with admin@test.com / password123
```

---

## Step 6: Scrub Git History

After credentials are rotated and verified working, run the git history scrub:

```bash
# This will be executed by Claude after you confirm rotation is complete
# Commands are prepared in the cleanup process
```

---

## Credentials Summary

| Secret | Old Value (COMPROMISED) | Action |
|--------|------------------------|--------|
| DB Password | `lYWWmtS5UmIu9Dlh` | Rotate in Dashboard |
| JWT Secret | `sHbpum5xlg1Q...` (64 chars) | Regenerate in Dashboard |
| Service Role Key | `eyJhbGc...nP4` | Regenerate in Dashboard |
| Anon Key | `eyJhbGc...CUzU` | Optional rotate |

---

## After Rotation Checklist

- [ ] Database password rotated
- [ ] JWT secret regenerated
- [ ] Service role key regenerated
- [ ] `.env.local` updated with new values
- [ ] Vercel environment variables updated (if applicable)
- [ ] GitHub secrets updated (if applicable)
- [ ] Application tested and working
- [ ] Ready for git history scrub

---

**IMPORTANT:** Do NOT delete this file until the full cleanup is complete. It serves as your checklist.
