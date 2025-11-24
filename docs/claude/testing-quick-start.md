# Testing Coverage - Quick Start Guide

## Current State (as of 2025-11-08)

```
✓ 845 tests passing
✗ 2 tests failing (flaky - timeout issues)
⊘ 13 tests skipped
────────────────────────
860 total tests running

Files with tests: 67/457 (14.6%)
Coverage: ~62% of assertions passing
```

## What's Critical (Breaks Users)

### 1. Auth - ZERO TESTS
**File:** `src/atomic-crm/providers/supabase/authProvider.ts`

**Scenarios not tested:**
- Login → redirects to dashboard
- Session check on app load
- Missing user (no sales record)
- Permission denied on protected routes

**To test:** ~8 tests, 1 day

### 2. Data Provider CRUD - PARTIAL
**Files:** 
- `unifiedDataProvider.ts` - Partial coverage
- `filterRegistry.ts` - NO TESTS
- `dataProviderCache.ts` - NO TESTS

**Scenarios not tested:**
- Fetch list (filtering, pagination)
- Create record + return ID
- Update without overwriting
- Delete (soft vs hard)
- Cache invalidation

**To test:** ~34 tests, 2 days

### 3. Services - ZERO TESTS
**Files:**
- `sales.service.ts`
- `opportunities.service.ts`
- `activities.service.ts`
- `junctions.service.ts` (critical for multi-participant opps)

**Impact:** Multi-participant opportunities don't work if services break

**To test:** ~24 tests, 2 days

### 4. Show Pages - ZERO TESTS
**Files:**
- `ContactShow.tsx` - Users can't view contact details
- `OrganizationShow.tsx` - Can't view org details
- `OpportunityShow.tsx` - Can't view opportunity + activity
- `ProductShow.tsx` - Can't view product details

**To test:** ~20 tests, 2 days

### 5. Activity Module - ZERO TESTS
**Files:** `activity-log/*.tsx` (9 files)

**Critical for MVP:** Activity timeline shows what actually happened

**To test:** ~12 tests, 1 day

---

## Quick Wins (1-2 Days Each)

### Fix Flaky Tests (1 day)
**Problem:** `QuickAdd.integration.test.tsx` timeouts

2 tests timing out on combobox discovery. Switch from arbitrary timeouts to condition-based waiting.

```typescript
// BEFORE: times out after 5000ms
await waitFor(() => { 
  expect(screen.getByRole('combobox', { name: /city/i })).toBeTruthy(); 
}, { timeout: 5000 })

// AFTER: waits for condition
await expect(page.getByRole('combobox', { name: /city/i })).toBeVisible();
```

### Add Auth Tests (1 day)
**Create:** `src/atomic-crm/providers/supabase/__tests__/authProvider.test.ts`

```typescript
describe('authProvider', () => {
  test('login clears cached sale', async () => {
    const result = await authProvider.login({ username, password });
    expect(result).toBeDefined();
    // cached sale should be cleared
  });

  test('checkAuth allows set-password page', async () => {
    window.location.pathname = '/set-password';
    expect(await authProvider.checkAuth()).toBeUndefined();
  });

  test('getIdentity returns user profile', async () => {
    const identity = await authProvider.getIdentity();
    expect(identity.fullName).toBeDefined();
    expect(identity.avatar).toBeDefined();
  });

  test('canAccess checks admin role', async () => {
    const hasAccess = await authProvider.canAccess({ 
      resource: 'sales',
      action: 'list'
    });
    expect(hasAccess).toBe(true); // or false based on role
  });
});
```

### Add Filter Registry Tests (1 day)
**Create:** `src/atomic-crm/providers/supabase/__tests__/filterRegistry.test.ts`

```typescript
describe('filterRegistry', () => {
  test('contacts has required fields', () => {
    const fields = filterableFields.contacts;
    expect(fields).toContain('first_name');
    expect(fields).toContain('organization_id');
    expect(fields).not.toContain('nonexistent_field');
  });

  test('isValidFilterField catches invalid fields', () => {
    expect(isValidFilterField('contacts', 'first_name')).toBe(true);
    expect(isValidFilterField('contacts', 'fake_column')).toBe(false);
  });

  test('opportunities has multi-participant fields', () => {
    const fields = filterableFields.opportunities;
    expect(fields).toContain('contact_ids'); // array field
    expect(fields).toContain('stage');
  });
});
```

---

## Module-by-Module Test Plan

### validation/ (92% done)
Status: Good, keep going ✓

### opportunities/ (40% done - 14/35 files)
**Missing critical tests:**
- [ ] OpportunityShow.tsx - Display logic
- [ ] OpportunityList.tsx - List view rendering
- [ ] Kanban view tests (E2E blocked on auth)

**Effort:** 3 days for critical paths

### contacts/ (20% done - 3/15 files)
**Missing:**
- [ ] ContactShow.tsx
- [ ] ContactList content rendering
- [ ] Import/export logic

**Effort:** 2 days

### organizations/ (29% done - 4/14 files)
**Missing:**
- [ ] OrganizationShow.tsx
- [ ] OrganizationList content
- [ ] Import logic

**Effort:** 2 days

### providers/ (53% done - 8/15 files)
**Missing:**
- [ ] authProvider.ts (CRITICAL)
- [ ] filterRegistry.ts
- [ ] dataProviderCache.ts

**Effort:** 3 days (critical)

### dashboard/ (5% done - 1/20 files)
**Only OpportunitiesByPrincipal has test**
**Missing:**
- [ ] Principal dashboard table
- [ ] Widget rendering
- [ ] Report logic

**Effort:** 2 days

### root/, layout/, settings/ (0% done)
**Zero tests for:**
- [ ] CRM.tsx - App setup
- [ ] ConfigurationContext.tsx
- [ ] Layout.tsx - Navigation
- [ ] Header.tsx
- [ ] SettingsPage.tsx

**Effort:** 2 days

### services/ (0% done)
**All 4 service files untested**
**Effort:** 2 days (critical)

### activity-log/ (0% done)
**All 9 files untested, MVP feature**
**Effort:** 1 day (critical)

### hooks/ (0% done)
**All 9 files untested**
**Priority:** useFilterCleanup, useKeyboardShortcuts
**Effort:** 1 day

### misc/, tags/, notes/, products/, sales/ (0% done)
**Effort:** Lower priority, 2-3 days combined

---

## Testing Priority Matrix

```
CRITICAL (Launch Blocker) - Week 1
├─ Fix QuickAdd flaky tests (1 day)
├─ Auth tests (1 day)
├─ Data Provider CRUD (2 days)
├─ Services tests (2 days)
└─ Show pages (2 days)
Total: 8 days

HIGH (Core Features) - Week 2-3
├─ Activity module (1 day)
├─ Tasks module (1 day)
├─ Hooks (useFilterCleanup, etc) (1 day)
├─ Layout/Root components (1 day)
└─ Dashboard (1 day)
Total: 5 days

MEDIUM (Robustness) - Week 4
├─ Error paths (network, RLS, validation) (2 days)
├─ UI components (misc/) (1 day)
└─ List components edge cases (1 day)
Total: 4 days

NICE-TO-HAVE (Polish) - Week 5+
├─ Tags, Notes, Products (1 day each)
└─ Integration workflows (2 days)
Total: 5 days
```

---

## Testing Strategy by Type

### Unit Tests (Fast, run in CI)
```bash
npm test                    # Watch mode
npm run test:unit          # Single run
npm run test:coverage      # With coverage
```

**Good for:**
- Validation schemas (already done)
- Utility functions
- Service logic

### Integration Tests (Medium speed)
```bash
npm test -- --grep "integration"
```

**Good for:**
- Form + validation + submission
- Component + data provider
- Multi-resource workflows

### E2E Tests (Slow, manual verification)
```bash
npm run test:e2e           # All tests
npm run test:e2e -- --headed  # With browser visible
```

**Good for:**
- Full user workflows
- Cross-browser compatibility
- Visual regression

---

## Files to Create (Quick Reference)

### Phase 1 (Critical)
```
src/atomic-crm/providers/supabase/__tests__/
  ├─ authProvider.test.ts (NEW - 8 tests)
  ├─ filterRegistry.test.ts (NEW - 12 tests)
  └─ dataProviderCache.test.ts (NEW - 6 tests)

src/atomic-crm/services/__tests__/
  ├─ sales.service.test.ts (NEW)
  ├─ opportunities.service.test.ts (NEW - critical)
  ├─ activities.service.test.ts (NEW)
  └─ junctions.service.test.ts (NEW - critical)

src/atomic-crm/root/__tests__/
  └─ CRM.test.tsx (NEW)

src/atomic-crm/{contacts,organizations,opportunities}/__tests__/
  └─ {Contact,Organization,Opportunity}Show.test.tsx (NEW)
```

### Phase 2 (High)
```
src/atomic-crm/activity-log/__tests__/
  ├─ ActivityLog.test.tsx (NEW)
  └─ ActivityLogIterator.test.tsx (NEW)

src/atomic-crm/tasks/__tests__/
  ├─ AddTask.test.tsx (NEW)
  └─ TaskEdit.test.tsx (NEW)

src/atomic-crm/hooks/__tests__/
  ├─ useFilterCleanup.test.ts (NEW)
  └─ useKeyboardShortcuts.test.ts (NEW)

src/atomic-crm/layout/__tests__/
  ├─ Layout.test.tsx (NEW)
  └─ Header.test.tsx (NEW)
```

---

## Success Criteria

**Launch Ready** (70%+ coverage):
- All critical paths have tests
- Auth flow verified
- Data provider CRUD verified
- Show pages verified
- Services verified
- No flaky tests

**Current:** 62% → **Target:** 75%+ in 12 days

---

## Commands to Remember

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- authProvider.test

# Run specific pattern
npm test -- --grep "should create opportunity"

# E2E tests
npm run test:e2e
npm run test:e2e -- --headed

# Fix linting issues automatically
npm run lint:apply
```

---

See full analysis: [TESTING-COVERAGE-GAP-ANALYSIS.md](./TESTING-COVERAGE-GAP-ANALYSIS.md)
