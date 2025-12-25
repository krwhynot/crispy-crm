# Manual E2E Testing Setup

This guide covers the setup required for manual E2E testing with Claude Chrome for Crispy CRM.

## Prerequisites

Before running manual E2E tests, ensure the following are in place:

1. **Local Development Server Running**
   - Base URL: `http://127.0.0.1:5173`
   - Start with: `npm run dev` or `just dev`

2. **Supabase Local Instance Running**
   - Start with: `npx supabase start`
   - Verify with: `npx supabase status`

3. **Test Database Seeded**
   - See [Seeding Test Data](#seeding-test-data) below

## Test User Credentials

Manual E2E tests support three user roles with the following credentials:

### Admin User
- **Email**: `admin@test.com`
- **Password**: `password123`
- **Capabilities**: Full system access, user management, all CRM features
- **Auth File**: `tests/e2e/.auth/user.json`

### Manager User
- **Email**: `manager@mfbroker.com`
- **Password**: `password123`
- **Capabilities**: Team oversight, all reps' data, reports, full CRM features
- **Auth File**: `tests/e2e/.auth/manager-user.json`

### Rep User
- **Email**: `rep@mfbroker.com`
- **Password**: `password123`
- **Capabilities**: Own opportunities, activities, individual contributor features
- **Auth File**: `tests/e2e/.auth/rep-user.json`

These credentials are defined in `/home/krwhynot/projects/crispy-crm/tests/e2e/support/poms/LoginPage.ts`.

## Seeding Test Data

Manual E2E tests require seeded test data to function correctly. Use the provided seed scripts to populate the database.

### Dashboard V3 Test Data

The primary seed script is located at:
```
scripts/seed-e2e-dashboard-v3.sh
```

#### Seed Local Database

```bash
./scripts/seed-e2e-dashboard-v3.sh
```

This script:
1. Checks that Supabase local instance is running
2. Verifies required migrations are applied
3. Checks for test user existence
4. Applies seed data from `tests/e2e/fixtures/dashboard-v3-seed.sql`
5. Provides next steps for verification

#### Seed Cloud Database (Use with Caution)

```bash
./scripts/seed-e2e-dashboard-v3.sh --cloud
```

**Warning**: This seeds the cloud database. You will be prompted to confirm before proceeding.

### Seed Script Requirements

The seed script requires:
- Supabase CLI installed: `brew install supabase/tap/supabase`
- Migration `20251118050755` applied
- Test user exists: `test@example.com` (or any of the three role users)

### Creating Test Users Manually

If test users do not exist, create them via:

**Option 1: Supabase Dashboard**
1. Navigate to Supabase Dashboard → Authentication → Users → Add User
2. Create each user with the emails listed above
3. Set password to `password123`

**Option 2: Sign Up via App**
1. Navigate to `http://127.0.0.1:5173/signup`
2. Register with the email and password for each role
3. Confirm email if required

## Environment Setup

### 1. Start Supabase

```bash
npx supabase start
```

Verify it's running:
```bash
npx supabase status
```

Expected output should include:
- API URL
- DB URL
- Studio URL
- Auth tokens

### 2. Apply Migrations

Ensure all database migrations are applied:

```bash
npx supabase db reset
```

### 3. Seed Test Data

Run the seed script:

```bash
./scripts/seed-e2e-dashboard-v3.sh
```

Verify seed success by checking the output for:
```
✓ Seed data applied successfully!
```

### 4. Start Development Server

```bash
npm run dev
```

Or using the justfile:
```bash
just dev
```

Verify the app loads at `http://127.0.0.1:5173`.

### 5. Verify Login

Manually verify that you can log in with each test user:

1. Navigate to `http://127.0.0.1:5173`
2. Log in with `admin@test.com` / `password123`
3. Verify dashboard loads
4. Log out
5. Repeat for manager and rep users

## Troubleshooting

### Supabase Not Running

**Symptom**: `Error: Local Supabase is not running`

**Solution**:
```bash
npx supabase start
```

### Migration Not Applied

**Symptom**: `Error: Migration 20251118050755 not applied!`

**Solution**:
```bash
npx supabase db reset
```

### Test User Not Found

**Symptom**: `Warning: Test user test@example.com not found`

**Solution**: Create the test user via Supabase Dashboard or app signup (see [Creating Test Users Manually](#creating-test-users-manually))

### Login Form Not Appearing

**Symptom**: App redirects to blank page or dashboard doesn't load

**Solution**:
1. Check browser console for errors
2. Verify Supabase is running: `npx supabase status`
3. Check network tab for failed API requests
4. Clear browser localStorage and cookies
5. Restart development server

### Seed Data Fails to Apply

**Symptom**: SQL errors when running seed script

**Solution**:
1. Ensure migrations are up to date: `npx supabase db reset`
2. Check that seed file exists: `tests/e2e/fixtures/dashboard-v3-seed.sql`
3. Verify database connection: `npx supabase status`

## Quick Start Checklist

Use this checklist before starting manual E2E testing:

- [ ] Supabase running (`npx supabase status`)
- [ ] Development server running (`http://127.0.0.1:5173` loads)
- [ ] Test data seeded (`./scripts/seed-e2e-dashboard-v3.sh`)
- [ ] Admin user can log in (`admin@test.com`)
- [ ] Manager user can log in (`manager@mfbroker.com`)
- [ ] Rep user can log in (`rep@mfbroker.com`)
- [ ] Dashboard loads without console errors

## Next Steps

Once setup is complete:

1. Review [README.md](./README.md) for test categories
2. Choose a test workflow to execute
3. Begin manual E2E testing with Claude Chrome
4. Document results and findings
