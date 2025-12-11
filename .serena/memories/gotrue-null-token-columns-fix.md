# GoTrue NULL Token Columns Issue

**Date:** 2025-12-11
**Impact:** Edge Function user management 500 errors

## Problem

When using `supabaseAdmin.auth.admin.updateUserById()` in Edge Functions, GoTrue returns "Database error loading user" if the auth.users row has NULL values in varchar token columns.

## Root Cause

GoTrue (Supabase's auth service) uses Go's `database/sql` package which cannot scan NULL values into Go string types. The error:

```
sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported
```

## Affected Columns

These varchar columns in `auth.users` must contain empty strings (''), not NULL:

- `confirmation_token`
- `recovery_token`
- `email_change_token_new`
- `email_change`
- `phone_change_token`
- `email_change_token_current`
- `reauthentication_token`

## Fix

For existing users with NULL values:

```sql
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL 
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL;
```

## Prevention

When manually inserting test users into auth.users, always set these columns to empty strings:

```sql
INSERT INTO auth.users (id, email, ..., confirmation_token, recovery_token, ...)
VALUES (
  'uuid-here',
  'user@example.com',
  ...,
  '',  -- confirmation_token
  '',  -- recovery_token
  ...
);
```

## Symptoms

- Edge Function returns 500 "Internal Server Error"
- GoTrue auth logs show: `sql: Scan error on column index X, name "xxx_token": converting NULL to string is unsupported`
- Happens on any auth.admin operation that loads a user with NULL token columns

## Notes

- Users created via `supabaseAdmin.auth.admin.createUser()` don't have this issue (GoTrue sets proper defaults)
- Issue typically occurs with manually seeded test users
