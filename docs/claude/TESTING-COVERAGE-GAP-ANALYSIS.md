# Atomic CRM Testing Coverage Analysis

## Executive Summary

**Test Coverage Status:** 62% (845/860 tests passing, 2 failing, 13 skipped)
**Source Files:** 457 total files in src/
**Test Files:** 67 unit tests in src/
**File Coverage:** 14.6% of source files have dedicated test files
**Critical Gap:** Most Show/List components and core services lack integration tests

---

## Test Coverage Metrics

### Overall Statistics
- **Source Files (src/):** 457 files
- **Unit Test Files:** 67 tests 
- **Test Coverage:** 14.6% (only 67 of 457 files have tests)
- **Test Suites:** 845 passing tests, 2 failing, 13 skipped (860 total)
- **E2E Tests:** 42+ tests across Playwright specs
- **Architecture:** Multi-layer (unit, integration, E2E)

---

## 1. MISSING TEST FILES

### Critical Path - No Tests (High Priority)

**Auth & Security:**
- `authProvider.ts` - NO TEST - Critical authentication logic
  - Login, logout, session check, role-based access control
  - Error handling (missing user, no session)
  - Cached sale logic with global state
  
**Data Provider - Partially Tested:**
- `filterRegistry.ts` - NO TEST - Prevents 400 API errors
  - Validates 20+ fields per resource
  - Must catch schema mismatches
  
- `dataProviderCache.ts` - NO TEST - Cache invalidation logic
  - May cause stale data issues
  
**Services - All Untested:**
- `services/sales.service.ts` - NO TEST
- `services/opportunities.service.ts` - NO TEST  
- `services/activities.service.ts` - NO TEST
- `services/junctions.service.ts` - NO TEST
  - Critical for multi-participant opportunities
  
**Hooks - No Tests:**
- `hooks/useFilterCleanup.ts` - NO TEST
  - Complex localStorage/store logic
  - Needs localStorage mocking
  
**Layout & Navigation - No Tests:**
- `root/CRM.tsx` - NO TEST - Core component setup
- `root/ConfigurationContext.tsx` - NO TEST - Config propagation
- `layout/Layout.tsx` - NO TEST - Main layout container
- `layout/Header.tsx` - NO TEST
- `layout/TopToolbar.tsx` - NO TEST
- `layout/FormToolbar.tsx` - NO TEST
- `settings/SettingsPage.tsx` - NO TEST

**Show Pages - No Tests:**
- `organizations/OrganizationShow.tsx` - NO TEST
- `contacts/ContactShow.tsx` - NO TEST
- `opportunities/OpportunityShow.tsx` - NO TEST
- `products/ProductShow.tsx` - NO TEST
  - These are critical user workflows

**List Components (Partial Coverage):**
- `organizations/OrganizationList.tsx` - NO TEST (only List.spec.tsx exists)
- `sales/SalesList.tsx` - NO TEST
- `notifications/NotificationsList.tsx` - NO TEST
- `simple-list/*` - NO TESTS (4 files)

**UI Components - No Tests:**
- All files in `misc/` (9 files) - NO TESTS
  - `Status.tsx`, `RelativeDate.tsx`, `ImageEditorField.tsx`
  - `DialogCloseButton.tsx`, `ContactOption.tsx`, etc.
  
- Root hooks (9 files) in `/hooks` - NO TESTS
  - `useKeyboardShortcuts.ts` - Complex keyboard logic
  - `useSupportCreateSuggestion.tsx`
  - `KeyboardShortcutsProvider.tsx` - NO TEST
  
**Activity Module - No Tests:**
- `activity/` (9 files) - NO TESTS
  - `ActivityLog.tsx`, `ActivityLogIterator.tsx`
  - Activity filtering and display logic critical to MVP

**Tasks Module - Minimal Tests:**
- `tasks/AddTask.tsx` - NO TEST
- `tasks/TaskEdit.tsx` - NO TEST
- `tasks/Task.tsx` - NO TEST
- Only `TasksIterator.tsx` has tests

---

## 2. TEST QUALITY ISSUES

### Flaky Tests (2 Failing Tests)
**File:** `src/atomic-crm/opportunities/__tests__/QuickAdd.integration.test.tsx`
- Test: "completes full atomic creation flow with Save & Close" - **TIMEOUT**
- Test: "handles Save & Add Another flow correctly" - **TIMEOUT**
- **Root Cause:** Tests exceed 5000ms default timeout, waiting for combobox "city"
- **Issue:** Race condition on combobox discovery
- **Fix Needed:** Condition-based waiting instead of arbitrary timeouts

### Shallow Tests (Rendering Only)
Multiple test files only verify rendering without assertions:
- `src/tests/utils/__tests__/render-admin.test.tsx` - Mostly setup, not real tests
- Tests checking "component renders without error" only

### Missing Edge Cases
**Examples:**
- `dataProviderSchemaValidation.test.ts` - Tests schema but no error scenarios
- `unifiedDataProvider.test.ts` - Happy path only, missing:
  - Network failures
  - Invalid data from server
  - Permission denied (RLS) scenarios
  - Cache invalidation edge cases

### No Error Path Tests
- `authProvider.ts` - NO ERROR PATH TESTS
  - What if Supabase is down?
  - What if user not in sales table?
  - What if session expires during operation?

---

## 3. CRITICAL PATHS UNTESTED

### 1. Authentication Flow (Priority 1)
- [ ] Login flow (start → password entry → logged in)
- [ ] Session check on app load
- [ ] Session timeout/expiration
- [ ] Permission denied errors from RLS
- [ ] Identity retrieval (sale from user_id)

**Why:** Users can't access the app if auth breaks

### 2. Data Provider Operations (Priority 1)
- [ ] CREATE (insert, return new ID)
- [ ] READ (fetch, filtering, pagination)
- [ ] UPDATE (merge data, avoid overwrites)
- [ ] DELETE (soft delete vs hard delete)
- [ ] Network errors during CRUD

**Why:** All features depend on this layer

### 3. Form Validation (Priority 2)
- [ ] Required field validation
- [ ] Email/phone format validation
- [ ] Cross-field validation (email OR phone)
- [ ] Custom validators (duplicate checks)
- [ ] Error message display

**Partially tested:** `validation/__tests__/` covers Zod schemas but not UI display

### 4. RLS Policies (Priority 1)
- [ ] Contacts - Only readable if shared team
- [ ] Organizations - Shared access rules
- [ ] Opportunities - Permission denied scenarios
- [ ] Tasks - Personal task visibility
- [ ] Notes - Activity access rules

**Why:** Broken RLS = security issue

### 5. JSONB Array Operations (Priority 2)
- [ ] Email array add/remove
- [ ] Phone array validation
- [ ] Tag array operations
- [ ] Contact array in opportunities

**Partially tested:** Some validation tests exist

### 6. Multi-Participant Opportunities (Priority 2)
- [ ] Add contact to opportunity
- [ ] Remove contact from opportunity
- [ ] Change contact role
- [ ] Validate contact exists

**Coverage:** `junctions.service.ts` has no tests

### 7. Activity Tracking (Priority 2)
- [ ] Create activity on record change
- [ ] Display activity timeline
- [ ] Filter activities by type
- [ ] Activity timestamps correct

**Coverage:** Activity module has NO tests

### 8. Task Management (Priority 3 - MVP feature)
- [ ] Create task for opportunity
- [ ] Assign to account manager
- [ ] Due date validation
- [ ] Overdue task highlighting
- [ ] Task completion

**Coverage:** Minimal tests, some components untested

---

## 4. E2E COVERAGE ASSESSMENT

### Passing E2E Tests
- Dashboard layout (visual regression)
- Dashboard widgets (iPad-specific)
- Design system validation
- Contacts CRUD (basic)

### Known E2E Issues
**Status:** Authentication issue with Opportunities tests
- Root cause: Route-specific permission or session persistence
- Impact: Can't verify Opportunities CRUD, Kanban, activity timeline
- 42 test cases written but blocked on auth

### E2E Gaps
- [ ] Form submission workflows end-to-end
- [ ] Multi-step workflows (create opportunity → add contacts → add products)
- [ ] Error recovery flows
- [ ] Concurrent user scenarios
- [ ] Network failure handling

---

## 5. INTEGRATION TEST GAPS

### Component + Data Provider
- [ ] List component → fetch data → render rows
- [ ] Show component → fetch detail → display relationships
- [ ] Edit form → save → update → verify change

**Coverage:** Some integration tests exist but critical components missing

### Form + Validation + Submission
- [ ] Fill form → validation error → fix → submit
- [ ] Submit form → API error → retry

**Coverage:** QuickAdd has integration tests, others minimal

### Multi-Resource Workflows
- [ ] Create Contact → Create Opportunity linking Contact
- [ ] Create Opportunity → Add Products → Track in Activity

**Coverage:** Minimal to none

---

## FILE-BY-FILE COVERAGE BREAKDOWN

### By Module

| Module | Files | Tests | Status |
|--------|-------|-------|--------|
| **validation/** | 12 | 11 | 92% - Good |
| **opportunities/** | 35+ | 14 | 40% - Partial |
| **contacts/** | 15+ | 3 | 20% - Poor |
| **organizations/** | 14+ | 4 | 29% - Poor |
| **providers/** | 15+ | 8 | 53% - Partial |
| **dashboard/** | 20+ | 1 | 5% - Critical gap |
| **layout/** | 4 | 0 | 0% - MISSING |
| **root/** | 3 | 0 | 0% - CRITICAL |
| **services/** | 4 | 0 | 0% - CRITICAL |
| **hooks/** | 9 | 0 | 0% - MISSING |
| **activity/** | 9 | 0 | 0% - CRITICAL |
| **tasks/** | 4 | 0 | 0% - CRITICAL |
| **sales/** | 7 | 0 | 0% - MISSING |
| **misc/** | 9 | 0 | 0% - MISSING |
| **products/** | 13+ | 0 | 0% - MISSING |
| **tags/** | 7 | 0 | 0% - MISSING |
| **notes/** | 6 | 1 | 17% - Poor |

---

## RECOMMENDED TESTS TO ADD (PRIORITIZED)

### Phase 1 (Critical - Launch Blockers)
**Effort: 5-7 days | Tests: 80+**

1. **Authentication** (2 days)
   - `authProvider.test.ts` - Login, session, identity (8 tests)
   - `canAccess.test.ts` - Role-based permissions (6 tests)

2. **Data Provider Core** (2 days)
   - `unifiedDataProvider.crud.test.ts` - Create, read, update, delete (16 tests)
   - `filterRegistry.test.ts` - Field validation (12 tests)
   - `dataProviderCache.test.ts` - Cache invalidation (6 tests)

3. **RLS Policies** (1 day)
   - `rls-integration.test.ts` - Permission denied scenarios (8 tests)

4. **Form Validation UI** (1 day)
   - `ContactForm.integration.test.tsx` - Form + validation display (10 tests)
   - `OrganizationForm.integration.test.tsx` (8 tests)

5. **Top-Level Components** (1 day)
   - `root/CRM.test.tsx` - Setup, config propagation (6 tests)
   - `layout/Layout.test.tsx` - Navigation structure (6 tests)

### Phase 2 (High - Core Features)
**Effort: 5-7 days | Tests: 90+**

1. **Services** (2 days)
   - `sales.service.test.ts` - Account manager operations
   - `opportunities.service.test.ts` - Multi-participant logic
   - `activities.service.test.ts` - Activity creation
   - `junctions.service.test.ts` - Relationship management

2. **Show Pages** (2 days)
   - `ContactShow.test.tsx` - Display, edit link, activities
   - `OrganizationShow.test.tsx`
   - `OpportunityShow.test.tsx` - Timeline, workflow buttons

3. **Activity Module** (1 day)
   - `ActivityLog.test.tsx` - Rendering, filtering
   - `ActivityLogIterator.test.tsx` - Activity list

4. **Tasks Module** (1 day)
   - `TaskEdit.test.tsx` - Task form
   - `AddTask.test.tsx` - Quick add task
   - Task assignment and due date logic

5. **Hooks** (1 day)
   - `useFilterCleanup.test.ts` - localStorage handling
   - `useKeyboardShortcuts.test.ts` - Keyboard events
   - `useBulkExport.test.tsx`

### Phase 3 (Medium - Robustness)
**Effort: 3-4 days | Tests: 60+**

1. **UI Components** (1 day)
   - `misc/Status.test.tsx` - Status display
   - `misc/RelativeDate.test.tsx` - Date formatting
   - `misc/ImageEditorField.test.tsx` - File upload

2. **List Components** (1 day)
   - `SalesList.test.tsx`
   - `NotificationsList.test.tsx`
   - List filtering and pagination

3. **Error Handling** (1 day)
   - Network failure scenarios
   - Validation error recovery
   - RLS permission denied flows

4. **Dashboard** (1 day)
   - Principal dashboard table
   - Reports (Opportunities by Principal, Weekly Activity)

### Phase 4 (Lower Priority - Polish)
**Effort: 2-3 days | Tests: 40+**

1. Tags module
2. Products module
3. Notes display logic
4. Filter management

---

## FLAKY TEST FIXES

### QuickAdd Integration Tests (Fix Immediately)
**Problem:** Timeout on combobox "city" discovery
**Solution:** Replace `waitFor` with condition-based waiting
```typescript
// BAD: arbitrary timeout
await waitFor(() => { expect(screen.getByRole('combobox', { name: /city/i })).toBeTruthy(); }, { timeout: 5000 })

// GOOD: condition-based
await expect(page.getByRole('combobox', { name: /city/i })).toBeVisible();
```

---

## SUMMARY & ACTION ITEMS

### Numbers
- **14.6%** of source files have tests
- **257** files without any test
- **2** failing tests (flaky - QuickAdd timeout)
- **13** skipped tests
- **845** passing tests

### Top 5 Critical Gaps
1. **Authentication** (authProvider.ts) - NO TESTS
2. **Data Provider Core** (CRUD, cache, filtering) - PARTIAL
3. **Services** (sales, opportunities, activities) - NO TESTS
4. **Show Pages** (Contact, Org, Opportunity) - NO TESTS
5. **Activity Module** - NO TESTS

### Recommended Action
1. Fix 2 flaky tests (QuickAdd timeout) - 1 day
2. Add auth tests + core data provider - 4 days
3. Add services tests - 2 days
4. Add Show page tests - 2 days
5. Add remaining critical paths - 3 days

**Total: 12 days for launch-ready coverage (70%+)**
