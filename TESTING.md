# Testing Strategy - Atomic CRM

**Last Updated:** 2025-10-06
**Team Size:** 6-7 users
**Testing Philosophy:** Simple, practical, fast

---

## Quick Smoke Test (30 seconds)

Run before each deployment:

```bash
npm run test:smoke
```

**What it checks:**
- ✅ Dev server is running on port 5173
- ✅ App HTML loads with React root element
- ✅ Vite client is serving assets
- ✅ Supabase API is reachable

**If this passes, you're 90% good to deploy.**

---

## Manual Testing Checklist (5 minutes)

Before each release, test these 5 critical paths:

### 1. Login & Navigation (1 min)
- [ ] Can login as test@gmail.com
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

## Database Migration Protocol

**CRITICAL:** Before deploying any database schema changes, follow this manual protocol to prevent data loss.

### Migration Checklist (Required)

1. **Generate Migration** (Developer)
   ```bash
   # Create migration file with timestamp format: YYYYMMDDHHMMSS_description.sql
   # Example: 20250106153000_add_priority_to_tasks.sql
   ```

2. **Test Locally** (Developer)
   - [ ] Run migration on local database with seed data
   - [ ] Verify schema changes are correct
   - [ ] Test affected features still work
   - [ ] Check for breaking changes in existing queries

3. **Staging Verification** (Required Before Production)
   - [ ] Run migration on staging environment
   - [ ] Verify data integrity (row counts, critical fields)
   - [ ] Test all CRUD operations for affected tables
   - [ ] Check for performance regressions

4. **Peer Review** (Recommended)
   - [ ] Another team member reviews migration SQL
   - [ ] Verify rollback strategy exists
   - [ ] Confirm backup plan is documented

5. **Production Deployment**
   - [ ] Backup database before migration
   - [ ] Run migration during low-traffic window
   - [ ] Verify data integrity immediately after
   - [ ] Monitor for errors in first 15 minutes

### Example Migration Workflow

```bash
# 1. Create migration locally
supabase migration new add_priority_to_tasks

# 2. Edit migration file
# supabase/migrations/20250106153000_add_priority_to_tasks.sql

# 3. Test locally
supabase db reset  # Resets local DB and runs all migrations

# 4. Deploy to staging
npm run supabase:deploy  # (on staging environment)

# 5. Manual verification on staging
# - Check schema: \d tasks
# - Check data: SELECT * FROM tasks LIMIT 5;

# 6. Deploy to production
npm run supabase:deploy  # (on production environment)
```

**If migration fails:** See rollback procedures in `docs/deployment.md`

---

## When Something Breaks

### User Reports Bug
1. **Try to reproduce** - Can you make it happen?
2. **Check browser console** - F12 → Console tab
3. **Check Supabase logs** - Dashboard → Logs
4. **Fix it** - Make the change
5. **Retest manually** - Run the 5-minute checklist

### Build Fails
```bash
npm run build
```
- Check the error message
- Usually TypeScript or import issues
- Fix and retry

---

## Advanced Testing (Optional)

### Accessibility Quick Check
```bash
# Install axe DevTools browser extension
# Run on 3 key pages: Dashboard, Contacts List, Opportunity Form
```

### Performance Check
```bash
# Chrome DevTools → Lighthouse
# Run on Dashboard
# Target: Performance score > 80
```

---

## Testing Philosophy

For a 6-7 user CRM, we prioritize:

1. **Speed** - 5 minutes of testing vs 5 hours of debugging
2. **Simplicity** - Checklists anyone can follow
3. **Reality** - Test what users actually do
4. **Feedback** - Users will tell you immediately if something breaks

### What We DON'T Do

❌ **E2E Automation** - Overkill for small team
❌ **Unit Tests for CRUD** - Simple operations don't need tests
❌ **Integration Tests** - Supabase handles that
❌ **Load Testing** - 6-7 users won't cause load

### What We DO

✅ **Smoke Test** - 30 second sanity check
✅ **Manual Checklist** - 5 minute critical path validation
✅ **User Feedback** - Real users = best QA team
✅ **Browser Console** - Catch errors before users do

---

## CI/CD Integration

### GitHub Actions (Optional)

```yaml
# .github/workflows/smoke-test.yml
name: Smoke Test
on: [push, pull_request]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build  # Just check it builds
```

**That's it.** No complex E2E infrastructure needed.

---

## Troubleshooting

### Smoke test fails: "Dev server not running"
```bash
npm run dev
# Wait 10 seconds
npm run test:smoke
```

### Smoke test fails: "Cannot connect to Supabase"
1. Check `.env` file exists
2. Verify `VITE_SUPABASE_URL` is correct
3. Verify `VITE_SUPABASE_ANON_KEY` is correct
4. Check internet connection

### Manual test fails
- Note which step failed
- Check browser console (F12)
- Check Network tab for failed requests
- Fix the specific issue
- Retest that step

---

## Documentation

- **E2E Tests (Legacy):** `.docs/testing/` - Complex Playwright setup (not actively used)
- **RBAC Guide:** `.docs/testing/rbac-explained.md` - Understanding roles
- **Test Fixes:** `.docs/testing/smoke-test-fixes-2025-10-06.md` - Historical reference

---

## Questions?

**Q: Should we add more tests?**
A: Only if you have >20 users or complex workflows breaking regularly.

**Q: What about regression testing?**
A: The 5-minute manual checklist IS regression testing.

**Q: Can we automate the checklist?**
A: Not worth it for 6-7 users. Time better spent building features.

**Q: How do we test for production?**
A: Same checklist, different environment. Deploy to staging first.

---

**Remember:** With 6-7 users, your users ARE your QA team. They'll tell you immediately if something breaks. Focus on building great features, not perfect test coverage.
