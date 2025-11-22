# Testing Guide

> **NEW:** See [Testing Strategy](../testing/strategy.md) for comprehensive guidelines on test coverage, when to add tests, and high-risk areas requiring coverage.
>
> **E2E Standards:** All Playwright tests must follow [E2E Testing Standards](../../tests/e2e/README.md) for authentication, selectors, and waiting patterns.

Comprehensive testing strategy for Atomic CRM - practical, fast, and focused on what matters.

## Testing Philosophy

For a small team (6-7 users), we prioritize:

1. **Speed** - 5 minutes of testing vs 5 hours of debugging
2. **Simplicity** - Checklists anyone can follow
3. **Reality** - Test what users actually do
4. **Feedback** - Users will tell you immediately if something breaks

---

## Quick Smoke Test (30 seconds)

Run before each deployment:

```bash
npm run test:smoke
```

**What it checks:**
- ✅ Dev server running on port 5173
- ✅ App HTML loads with React root element
- ✅ Vite client serving assets
- ✅ Supabase API reachable

**If this passes, you're 90% good to deploy.**

---

## Manual Testing Checklist (5 minutes)

Test these 5 critical paths before each release:

### 1. Login & Navigation (1 min)
- [ ] Can login as admin@test.com
- [ ] Dashboard loads without errors
- [ ] All menu items are clickable

### 2. Contacts (1 min)
- [ ] Can view contacts list
- [ ] Can create a new contact
- [ ] Can edit an existing contact
- [ ] Search works

### 3. Opportunities (1 min)
- [ ] Can view opportunities list
- [ ] Can create a new opportunity
- [ ] Can drag opportunity on kanban board
- [ ] Filters work

### 4. Organizations (1 min)
- [ ] Can view organizations list
- [ ] Can create a new organization
- [ ] Can link organization to contact

### 5. Tasks & Activities (1 min)
- [ ] Can create a task
- [ ] Can mark task as complete
- [ ] Can log an activity
- [ ] Timeline displays correctly

**If all 5 pass → Ship it! 🚀**

---

## Database Migration Testing

**CRITICAL:** Test all migrations locally before deploying to production.

### Migration Workflow

```bash
# 1. Make schema changes via Studio or SQL
http://localhost:54323

# 2. Generate migration from changes
npx supabase db diff --schema public -f migration_name

# 3. Test locally
npm run db:local:reset

# 4. Verify affected features still work
# Run manual checklist for impacted areas

# 5. Deploy to production
npm run db:cloud:push
```

### Migration Checklist

1. **Generate Migration** (Developer)
   - [ ] Create migration file with timestamp: `YYYYMMDDHHMMSS_description.sql`
   - [ ] Review generated SQL for correctness

2. **Test Locally** (Developer)
   - [ ] Run migration on local database with seed data
   - [ ] Verify schema changes are correct
   - [ ] Test affected features still work
   - [ ] Check for breaking changes in existing queries
   - [ ] Verify BOTH GRANT permissions AND RLS policies exist

3. **Peer Review** (Recommended)
   - [ ] Another team member reviews migration SQL
   - [ ] Verify rollback strategy exists
   - [ ] Confirm backup plan is documented

4. **Production Deployment**
   - [ ] Backup database before migration
   - [ ] Run migration during low-traffic window
   - [ ] Verify data integrity immediately after
   - [ ] Monitor for errors in first 15 minutes

---

## Testing Local Supabase

### Quick Infrastructure Check

```bash
# Verify all services running
npx supabase status

# Check database connection
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT version();"

# Count tables
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dt public.*"
```

### Access Web Interfaces

- **Supabase Studio**: http://localhost:54323
  - Visual database editor
  - Table browser
  - SQL editor
  - Authentication manager

- **Application**: http://localhost:5173
  - Login: admin@test.com / password123

### Manual API Testing

```bash
# Set credentials
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_ANON_KEY="sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

# List contacts
curl "$SUPABASE_URL/rest/v1/contacts?select=*&limit=10" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Create a contact
curl -X POST "$SUPABASE_URL/rest/v1/contacts" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Contact", "emails": [{"email": "test@example.com"}]}'
```

### Testing RLS Policies

```bash
# Check current policies
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"

# Verify authenticated access works
curl "$SUPABASE_URL/rest/v1/contacts?select=id" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Verify unauthenticated access fails
curl "$SUPABASE_URL/rest/v1/contacts?select=id"
```

---

## When Something Breaks

### User Reports Bug

1. **Try to reproduce** - Can you make it happen?
2. **Check browser console** - F12 → Console tab
3. **Check Supabase logs** - Dashboard → Logs or `npx supabase logs`
4. **Fix it** - Make the change
5. **Retest manually** - Run the 5-minute checklist

### Build Fails

```bash
npm run build
```
- Check the error message
- Usually TypeScript or import issues
- Fix and retry

### Tests Fail

```bash
npm test
```
- Read the error messages
- Fix the specific failing test
- Rerun to verify

---

## Automated Testing (Optional)

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- contacts.test.tsx

# Run with coverage
npm run test:coverage
```

Target: 70% coverage minimum

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - run: npm run build
```

---

## Troubleshooting Tests

### Smoke test fails: "Dev server not running"
```bash
npm run dev
# Wait 10 seconds
npm run test:smoke
```

### Smoke test fails: "Cannot connect to Supabase"
1. Check `.env.local` file exists
2. Verify `VITE_SUPABASE_URL` is correct
3. Run `npx supabase status`
4. Restart Supabase: `npm run db:local:stop && npm run db:local:start`

### "Permission denied" in tests
This means missing GRANT permissions. See [Two-Layer Security in Setup Guide](../setup-and-deployment.md).

### RLS policies blocking queries
```bash
# Check RLS policies
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
"
```

### Connection refused
```bash
# Verify Docker containers running
docker ps | grep supabase

# Restart if needed
npm run db:local:stop
npm run db:local:start
```

---

## Performance Testing

### Query Performance

```bash
# Time a query
time curl "$SUPABASE_URL/rest/v1/contacts?select=*&limit=1000" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### Load Testing

For a 6-7 user application, load testing is usually overkill. Focus on query optimization if you notice slowdowns.

### Accessibility Quick Check

- Install axe DevTools browser extension
- Run on 3 key pages: Dashboard, Contacts List, Opportunity Form
- Fix critical issues

### Lighthouse Performance Check

- Chrome DevTools → Lighthouse
- Run on Dashboard
- Target: Performance score > 80

---

## What We DON'T Do

❌ **E2E Automation** - Overkill for small team
❌ **Unit Tests for simple CRUD** - Simple operations don't need tests
❌ **Heavy Integration Tests** - Supabase handles that
❌ **Load Testing** - 6-7 users won't cause load issues

## What We DO

✅ **Smoke Test** - 30 second sanity check
✅ **Manual Checklist** - 5 minute critical path validation
✅ **Migration Testing** - Always test locally first
✅ **User Feedback** - Real users = best QA team
✅ **Browser Console** - Catch errors before users do

---

## Pre-Commit Checklist

```bash
# Run before committing
npm run lint
npm test
npm run build
```

If all three pass, you're good to commit.

---

## Further Reading

- [Setup & Deployment Guide](../setup-and-deployment.md)
- [Database Migrations](./03-database-migrations.md)
- [Supabase Workflow](../supabase/WORKFLOW.md)
- [docs/claude/testing-quick-reference.md](../claude/testing-quick-reference.md)

---

**Remember:** With 6-7 users, your users ARE your QA team. They'll tell you immediately if something breaks. Focus on building great features, not perfect test coverage.
