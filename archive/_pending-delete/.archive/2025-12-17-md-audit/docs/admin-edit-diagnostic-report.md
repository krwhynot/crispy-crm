# Admin Edit Fix - Diagnostic Report

> Generated: 2025-12-11
> Status: **FIX APPLIED - PENDING UI VERIFICATION**

---

## Executive Summary

The 500 error when admins edit other users' profile fields has been addressed. The root cause was NULL values in GoTrue token columns in `auth.users`, which caused Go's SQL scanner to crash when loading user records.

---

## Root Cause Analysis

### The Bug

**Location:** GoTrue auth service (Layer 3 of 5-layer architecture)

**Trigger:** Edge Function `patchUser` calls `supabaseAdmin.auth.admin.updateUserById()` which loads the target user from `auth.users`. GoTrue's Go code cannot scan NULL values into string types.

**Error:**
```
sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported
```

### Why It Happened

Users created via direct SQL INSERT (migrations) without specifying token columns inherited NULL defaults. Users created via GoTrue API (`auth.admin.createUser()`) automatically get empty strings.

---

## Fix Applied

### SQL Executed

```sql
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  phone_change = COALESCE(phone_change, ''),
  email_change = COALESCE(email_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR phone_change_token IS NULL;
```

**Note:** `phone` column excluded due to UNIQUE constraint - it's user data, not a token column.

### Verification Query Results

| Email | conf_null | recovery_null | email_change_new_null | phone_null |
|-------|-----------|---------------|----------------------|------------|
| dramsy@masterfoodbrokers.com | false | false | false | true* |
| kjramsy@gmail.com | false | false | false | true* |

*`phone_null: true` is expected and safe - phone is user data, not a GoTrue token column.

---

## Users in System

| Email | Role | Notes |
|-------|------|-------|
| kjramsy@gmail.com | admin | Kevin - can edit all users |
| dramsy@masterfoodbrokers.com | manager | Daler - test target for admin edits |

---

## UI Test Matrix

These tests must be performed manually in the application:

| Test | Actor | Target | Action | Expected | Status |
|------|-------|--------|--------|----------|--------|
| T1 | kjramsy@gmail.com (admin) | dramsy@masterfoodbrokers.com | Edit first_name, last_name | Success | **PENDING** |
| T2 | kjramsy@gmail.com (admin) | kjramsy@gmail.com | Edit own first_name, last_name | Success | **PENDING** |
| T3 | dramsy@masterfoodbrokers.com (manager) | dramsy@masterfoodbrokers.com | Edit own first_name, last_name | Success | **PENDING** |
| T4 | dramsy@masterfoodbrokers.com (manager) | kjramsy@gmail.com | Edit admin's fields | Denied | **PENDING** |

### How to Test

1. **Login as admin** (kjramsy@gmail.com)
2. **Navigate to Users** list
3. **Click on Daler's record** (dramsy@masterfoodbrokers.com)
4. **Edit first_name and/or last_name**
5. **Save** - should succeed without 500 error

---

## Architecture Reference

```
Layer 1: Frontend (React Admin)
    ↓ PATCH /users with sales_id, first_name, last_name
Layer 2: Edge Function (users/index.ts:patchUser)
    ↓ supabaseAdmin.auth.admin.updateUserById() ← FIX APPLIED HERE
Layer 3: GoTrue (auth service) ← Bug was here (NULL scan error)
    ↓
Layer 4: RLS Policies (sales table)
    ↓
Layer 5: Trigger (enforce_sales_column_restrictions)
```

---

## Previous Fixes (Still Valid)

These fixes remain in place and are working correctly:

| Migration | Purpose |
|-----------|---------|
| `20251211180000_fix_is_admin_null_auth.sql` | `is_admin()` returns TRUE when auth.uid() is NULL |
| `20251211170000_allow_admin_full_edit.sql` | Trigger allows admin full edit access |
| `20251211160000_fix_trigger_null_auth.sql` | Trigger skips checks when auth.uid() is NULL |

---

## Prevention (Future)

When creating users via direct SQL INSERT, always include token columns with empty strings:

```sql
INSERT INTO auth.users (
  id, email, encrypted_password, ...,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) VALUES (
  'uuid', 'user@example.com', 'hash', ...,
  '', '', '', '', '', '', '', ''  -- Empty strings, NOT NULL!
);
```

---

## Conclusion

The GoTrue NULL token scan error has been fixed by converting NULL values to empty strings in `auth.users`. The fix is non-invasive and idempotent. UI testing is required to confirm the admin edit functionality now works as expected.

**Next Step:** Manual UI verification of test matrix T1-T4.
