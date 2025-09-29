# E2E Test Setup Instructions

## Prerequisites

Before running E2E tests, you need a valid test user in your Supabase database.

## Option 1: Use Existing Test User (Recommended)

If you already have a test user account in Supabase:

1. Update `playwright/.env` with your test credentials:
   ```bash
   TEST_USER_EMAIL=your-test-email@example.com
   TEST_USER_PASSWORD=your-actual-password
   ```

2. Run tests:
   ```bash
   npm run test:e2e
   ```

## Option 2: Create New Test User via Dashboard

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/auth/users

2. **Add User:**
   - Click "Add User" → "Create new user"
   - Email: `test@gmail.com` (or your preferred email)
   - Password: Create a strong password
   - Auto Confirm User: **Yes** (important!)
   - Click "Create user"

3. **Update Test Credentials:**
   Edit `playwright/.env`:
   ```bash
   TEST_USER_EMAIL=test@gmail.com
   TEST_USER_PASSWORD=the-password-you-just-created
   ```

4. **Run Tests:**
   ```bash
   npm run test:e2e
   ```

## Option 3: Use Setup Script (Service Role Key Required)

If you have the `SUPABASE_SERVICE_ROLE_KEY` configured:

```bash
npm run test:e2e:setup
```

This will create a test user with:
- Email: `test@gmail.com`
- Password: `password`
- Auto-confirmed

## Troubleshooting

### Tests fail at login screen

**Symptom:** Tests timeout waiting for dashboard, screenshot shows login page

**Cause:** Invalid credentials

**Solution:**
1. Verify the test user exists in Supabase Dashboard → Authentication → Users
2. Try logging in manually with the test credentials
3. If login fails manually, reset the password in Supabase Dashboard
4. Update `playwright/.env` with correct credentials

### Cannot create user via setup script

**Symptom:** `Failed to create user: ...` error

**Cause:** Missing or invalid service role key

**Solution:**
1. Get service role key from Supabase Dashboard → Settings → API
2. Add to root `.env`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run `npm run test:e2e:setup` again

### Test user exists but login still fails

**Symptom:** User shows in dashboard but tests fail

**Possible causes:**
1. **Email not confirmed:** Check "Email Confirmed" column in dashboard
2. **Wrong password:** Try manual login first
3. **User disabled:** Check user status in dashboard

**Solution:**
- Reset password via Supabase Dashboard
- Ensure "Email Confirmed" is ✓
- Update `playwright/.env` with new password

## Recommended Test User Setup

For consistent E2E testing:

1. **Create dedicated test account:**
   - Email: `e2e-test@yourdomain.com`
   - Strong password stored in password manager
   - Auto-confirmed email

2. **Configure environment:**
   ```bash
   # playwright/.env
   TEST_USER_EMAIL=e2e-test@yourdomain.com
   TEST_USER_PASSWORD=your-strong-password
   ```

3. **Document for team:**
   - Share test credentials securely with team
   - Add to team password manager
   - Include in onboarding documentation

## Security Notes

- **Never commit** `playwright/.env` to version control (already in .gitignore)
- Use different test users for different environments
- Rotate test passwords regularly
- Test user should have minimal permissions (read/write to test data only)

## Current Test User Info

The tests are currently configured to use:
- **Email:** `test@gmail.com`
- **Password:** Set in `playwright/.env`

This user should exist in your Supabase project: `aaqnanddcqvfiwhshndl`

---

After setup is complete, run tests with:
```bash
npm run test:e2e
```