# Manual E2E Test Plan — High Priority Fixes (2026-01-23)

**Scope:** 154 High Severity Issues
**Prerequisite:** Critical issues resolved (see `manual-e2e-critical-2026-01-23.md`)
**Categories:** TypeScript, Performance, Code Quality, Error Handling, Integration
**URL:** http://localhost:5173

---

## Test Users

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@test.com | `password123` | admin |
| Manager | manager@mfbroker.com | `password123` | manager |
| Rep | rep@mfbroker.com | `password123` | rep |

---

## Test Suite 1: TypeScript Hardening

### Test 1.1: Check for Remaining `as any` in Tests
**Target:** 0 instances (was: 299)

**Steps:**
```bash
rg "as any" src/ --type ts | wc -l
```

**Expected Result:**
- [ ] Count is 0 or significantly reduced
- [ ] No `as any` in production code (non-test files)
- [ ] Test files use typed mock factories

**Verification:**
```bash
# Production code should have zero
rg "as any" src/atomic-crm/ --type ts | grep -v test | grep -v __tests__ | wc -l
# Expected: 0

# Check for typed-mocks usage
rg "mockUseGetListReturn|mockUseRecordContextReturn" src/ --type ts | wc -l
# Expected: > 0 (using typed factories)
```

---

### Test 1.2: Check for Untyped useRecordContext
**Target:** 0 instances

**Steps:**
```bash
rg "useRecordContext\(\)" src/atomic-crm/ --type tsx
rg "useRecordContext<" src/atomic-crm/ --type tsx
```

**Expected Result:**
- [ ] All `useRecordContext` calls have generic type parameter
- [ ] Pattern: `useRecordContext<Contact>()` not `useRecordContext()`

**Example Correct Usage:**
```typescript
const record = useRecordContext<Contact>();
// NOT: const record = useRecordContext();
```

---

### Test 1.3: IDE Autocomplete Verification
**Steps:**
1. Open VS Code in `/home/krwhynot/projects/crispy-crm`
2. Open `src/atomic-crm/contacts/ContactList.tsx`
3. Find a `useRecordContext` call
4. Type `record.` and observe autocomplete

**Expected Result:**
- [ ] Autocomplete shows typed fields (first_name, last_name, email, etc.)
- [ ] No `any` type shown in hover
- [ ] Field suggestions match Contact schema

---

### Test 1.4: Type Check Passes
**Steps:**
```bash
npx tsc --noEmit 2>&1 | head -50
```

**Expected Result:**
- [ ] No type errors
- [ ] Exit code 0
- [ ] No "implicitly has type 'any'" warnings

---

## Test Suite 2: Performance

### Test 2.1: List View Re-renders (React DevTools Profiler)
**Steps:**
1. Install React DevTools browser extension
2. Open app at http://localhost:5173
3. Open DevTools > Profiler tab
4. Go to Contacts list
5. Click "Start profiling"
6. Scroll through list, hover items
7. Stop profiling

**Expected Result:**
- [ ] Row components do NOT re-render on sibling hover
- [ ] No "wasted renders" on static content
- [ ] Render count per interaction < 5

**Metrics to Capture:**
- Render count for ContactList on scroll: ____
- Render count per row hover: ____

---

### Test 2.2: Inline Objects Eliminated
**Target:** 0 inline object literals in render

**Steps:**
```bash
# Check for inline sort objects
rg "sort=\{\{" src/atomic-crm/ --type tsx | wc -l

# Check for inline filter objects
rg "filter=\{\{" src/atomic-crm/ --type tsx | wc -l

# Check for inline style objects
rg "style=\{\{" src/atomic-crm/ --type tsx | wc -l
```

**Expected Result:**
- [ ] `sort={{` count: 0 (use constants)
- [ ] `filter={{` count: 0 (use useMemo or constants)
- [ ] `style={{` count: 0 or justified (use className)

**Correct Pattern:**
```typescript
// Constants file
export const CONTACT_SORT = { field: 'last_name', order: 'ASC' } as const;

// Component
<List sort={CONTACT_SORT}>
```

---

### Test 2.3: Large List Scrolling
**Steps:**
1. Go to Organizations list (should have 100+ records)
2. Use smooth scroll (trackpad or arrow keys)
3. Observe performance

**Expected Result:**
- [ ] No janky scrolling or stuttering
- [ ] FPS stays above 30 (check Performance tab)
- [ ] No memory spikes during scroll

**Performance Tab Check:**
1. Open DevTools > Performance
2. Click Record
3. Scroll through list for 10 seconds
4. Stop recording
5. Check "Frames" section

**Metrics:**
- Average FPS during scroll: ____
- Dropped frames: ____
- Longest frame (ms): ____

---

### Test 2.4: Memoized Cells Verification
**Steps:**
```bash
# Check for React.memo usage in list cells
rg "React\.memo|memo\(" src/atomic-crm/ --type tsx | wc -l

# Check for useCallback in list components
rg "useCallback" src/atomic-crm/ --type tsx | wc -l
```

**Expected Result:**
- [ ] Cell components wrapped in `React.memo`
- [ ] Event handlers use `useCallback`
- [ ] Expensive computations use `useMemo`

---

## Test Suite 3: Code Quality

### Test 3.1: File Size Limits
**Target:** No file over 400 lines

**Steps:**
```bash
# Find files over 400 lines
fd -e tsx -e ts . src/atomic-crm/ --exec wc -l {} \; | awk '$1 > 400 {print $0}' | sort -rn
```

**Expected Result:**
- [ ] No files exceed 400 lines
- [ ] Large files split into logical modules

**If violations found, list them:**
| File | Lines | Action Needed |
|------|-------|---------------|
| | | |

---

### Test 3.2: Test File Organization
**Steps:**
```bash
# Test files should be in __tests__ directories
fd -e test.tsx -e test.ts . src/atomic-crm/ | grep -v __tests__ | wc -l

# Each feature should have tests
ls -la src/atomic-crm/contacts/__tests__/
ls -la src/atomic-crm/organizations/__tests__/
ls -la src/atomic-crm/opportunities/__tests__/
```

**Expected Result:**
- [ ] All test files in `__tests__/` directories
- [ ] Each major feature has test coverage
- [ ] Test file naming: `[Component].test.tsx`

---

### Test 3.3: Constants Centralized
**Steps:**
```bash
# Check for magic strings in components
rg '"closed_won"|"closed_lost"|"new_lead"' src/atomic-crm/ --type tsx | grep -v constants | wc -l

# Constants should exist
cat src/atomic-crm/opportunities/constants.ts 2>/dev/null | head -20
```

**Expected Result:**
- [ ] Magic strings count: 0 in components
- [ ] All stages defined in `constants.ts`
- [ ] Components import from constants

**Correct Pattern:**
```typescript
// constants.ts
export const OPPORTUNITY_STAGES = {
  WON: 'closed_won',
  LOST: 'closed_lost',
  NEW: 'new_lead',
} as const;

// Component
import { OPPORTUNITY_STAGES } from './constants';
<SelectItem value={OPPORTUNITY_STAGES.WON}>
```

---

## Test Suite 4: Error Handling

### Test 4.1: No Silent Catches
**Target:** 0 empty catch blocks

**Steps:**
```bash
# Find empty catch blocks
rg "catch\s*\([^)]*\)\s*\{\s*\}" src/ --type ts | wc -l

# Find catch blocks with only comments
rg -A2 "catch\s*\(" src/atomic-crm/ --type ts | grep -B1 "// " | head -20
```

**Expected Result:**
- [ ] No empty `catch { }` blocks
- [ ] All catches either log or re-throw
- [ ] Error context preserved

**Correct Pattern:**
```typescript
// WRONG
try { ... } catch { }

// RIGHT
try { ... } catch (error) {
  logger.error('Operation failed', { error, context: { id } });
  throw error; // or handle gracefully
}
```

---

### Test 4.2: Error Propagation (Offline Mode Test)
**Steps:**
1. Open app, go to Contacts list
2. Open DevTools > Network tab
3. Click "Offline" checkbox
4. Try to create a new contact
5. Submit the form

**Expected Result:**
- [ ] Clear error message displayed to user
- [ ] Form data NOT lost (still in form)
- [ ] Console shows structured error log
- [ ] No unhandled promise rejection

**Check Console:**
- [ ] Error has `[ERROR]` prefix
- [ ] Context includes operation name
- [ ] Timestamp in ISO format

---

### Test 4.3: Error Context Quality
**Steps:**
1. Trigger an error (e.g., submit invalid data)
2. Check browser console

**Expected Result:**
- [ ] Error includes operation context (what was being done)
- [ ] Error includes entity context (which record)
- [ ] Stack trace available for debugging
- [ ] User-friendly message in UI (not raw error)

**Sample Good Error:**
```
[ERROR] 2026-01-23T12:00:00.000Z ContactCreate failed
  Context: { operation: 'create', resource: 'contacts', email: 'test@...' }
  Error: Validation failed: email already exists
```

---

## Test Suite 5: Integration

### Test 5.1: Full Workflow - Create Contact
**Steps:**
1. Login as Admin
2. Go to Contacts > Create
3. Fill all fields:
   - First Name: "Integration"
   - Last Name: "Test"
   - Email: "integration-test@example.com"
   - Phone: "555-123-4567"
   - Organization: Select existing
4. Save

**Expected Result:**
- [ ] Form submits without error
- [ ] Redirected to contact detail or list
- [ ] New contact appears in list
- [ ] All fields saved correctly

**Verification:**
- [ ] Open saved contact
- [ ] All fields match input
- [ ] `created_at` timestamp set
- [ ] Organization linked correctly

---

### Test 5.2: Full Workflow - Filter and Sort
**Steps:**
1. Go to Organizations list
2. Apply text filter: type "test" in search
3. Wait for debounce (300ms)
4. Sort by Name (click column header)
5. Change sort direction (click again)

**Expected Result:**
- [ ] Filter applies after debounce delay
- [ ] Results update without full page reload
- [ ] Sort indicator shows correct direction
- [ ] Combined filter + sort works correctly

**Metrics:**
- Filter response time: ____ ms
- Sort response time: ____ ms

---

### Test 5.3: Full Workflow - Bulk Operations
**Steps:**
1. Go to Contacts list
2. Select 3+ contacts using checkboxes
3. Click bulk action toolbar
4. Click "Delete" (or "Archive")
5. Confirm

**Expected Result:**
- [ ] Bulk action toolbar appears on selection
- [ ] All selected records processed
- [ ] List refreshes after operation
- [ ] Count updates correctly
- [ ] No orphaned data

**Verification:**
```bash
# Check for orphaned junction records
# (This would be run against Supabase)
# SELECT * FROM contact_organizations WHERE contact_id NOT IN (SELECT id FROM contacts WHERE deleted_at IS NULL);
```

---

## Final Verification Commands

```bash
#!/bin/bash
# High Priority Fix Verification Script
# Run from project root: /home/krwhynot/projects/crispy-crm

echo "=== TypeScript Checks ==="

# 1.1: as any count
echo -n "as any in production code: "
rg "as any" src/atomic-crm/ --type ts | grep -v test | grep -v __tests__ | wc -l

# 1.4: Type check
echo "Type check:"
npx tsc --noEmit 2>&1 | tail -5

echo ""
echo "=== Performance Checks ==="

# 2.2: Inline objects
echo -n "Inline sort objects: "
rg "sort=\{\{" src/atomic-crm/ --type tsx 2>/dev/null | wc -l

echo -n "Inline filter objects: "
rg "filter=\{\{" src/atomic-crm/ --type tsx 2>/dev/null | wc -l

echo ""
echo "=== Code Quality Checks ==="

# 3.1: Large files
echo "Files over 400 lines:"
fd -e tsx -e ts . src/atomic-crm/ --exec wc -l {} \; 2>/dev/null | awk '$1 > 400 {print $0}' | sort -rn | head -5

# 3.3: Magic strings
echo -n "Magic stage strings in components: "
rg '"closed_won"|"closed_lost"|"new_lead"' src/atomic-crm/ --type tsx 2>/dev/null | grep -v constants | wc -l

echo ""
echo "=== Error Handling Checks ==="

# 4.1: Empty catches
echo -n "Empty catch blocks: "
rg "catch\s*\([^)]*\)\s*\{\s*\}" src/ --type ts 2>/dev/null | wc -l

# 4.3: Raw console.error
echo -n "Raw console.error (should be 0): "
rg "console\.error" src/atomic-crm/ --type ts | grep -v test | grep -v logger | wc -l

echo ""
echo "=== Build Verification ==="
npm run build 2>&1 | tail -10

echo ""
echo "=== Test Suite ==="
npm test -- --run 2>&1 | tail -20

echo ""
echo "=== Verification Complete ==="
```

---

## Sign-Off Table

| Suite | Status | Tester | Notes |
|-------|--------|--------|-------|
| 1. TypeScript Hardening | [ ] Pass / [ ] Fail | | |
| 2. Performance | [ ] Pass / [ ] Fail | | |
| 3. Code Quality | [ ] Pass / [ ] Fail | | |
| 4. Error Handling | [ ] Pass / [ ] Fail | | |
| 5. Integration | [ ] Pass / [ ] Fail | | |

---

## Metrics Tracking

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| `as any` count (prod) | 299 | 0 | | |
| Untyped useRecordContext | Unknown | 0 | | |
| Inline object literals | Unknown | 0 | | |
| Files > 400 lines | Unknown | 0 | | |
| Empty catch blocks | Unknown | 0 | | |
| Magic strings in components | Unknown | 0 | | |
| Type check errors | Unknown | 0 | | |

---

## Issue Tracking

If tests fail, record issues here:

| Test ID | Issue Description | Severity | Ticket |
|---------|-------------------|----------|--------|
| | | | |
| | | | |
| | | | |

---

**Tested by:** _______________
**Date:** _______________
**Environment:** [ ] Local / [ ] Staging / [ ] Production
**Browser:** _______________
**Node Version:** _______________
**Notes:**

---

## Related Documents

- Critical fixes: `docs/manual-e2e-critical-2026-01-23.md`
- General E2E tests: `docs/manual-e2e-tests.md`
- Test patterns: `docs/architecture/TEST_PATTERNS.md`
