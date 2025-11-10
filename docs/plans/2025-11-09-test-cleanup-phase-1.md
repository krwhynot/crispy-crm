# Test Cleanup Phase 1: Remove Obsolete Tests

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove 4 obsolete test files (1,926 lines) that test deleted features or duplicate existing coverage, improving test suite execution time by ~10 seconds and eliminating misleading passing tests.

**Architecture:** This is a safe cleanup pass removing tests that either (1) test database tables/features that were deleted in migrations, or (2) duplicate coverage provided by newer, better-structured test files. No production code changes required.

**Tech Stack:** Vitest, Playwright, React Testing Library

**Impact:**
- Remove: 4 test files, 1,926 lines of test code
- Time saved: ~10 seconds per test run
- Pass rate: 95.4% → 97.5% (removing N/A tests)
- Risk: Zero (tests cover non-existent or duplicated functionality)

---

## Context: Why These Tests Are Obsolete

### 1. ContactMultiOrg.spec.ts (764 lines)
- Tests `contact_organizations` junction table
- **Evidence:** Migration `20251103220544_remove_deprecated_contact_organizations.sql` dropped this table
- **Migration comment:** "Table has 0 rows and relationship pattern was simplified"
- **Current model:** Contacts use simple `organization_id`, NOT many-to-many
- **Verdict:** 100% obsolete

### 2. dataProvider.spec.ts (816 lines)
- Tests legacy data provider with contact_organizations logic
- Tests mock provider behavior, not real integration
- **Superseded by:** `unifiedDataProvider.test.ts` (comprehensive, current)
- **Verdict:** 70% obsolete, 30% duplicate

### 3. contactImport.logic.spec.ts (190 lines)
- Tests import logic from wrong location
- **Actual location:** `/src/atomic-crm/contacts/contactImport.logic.ts`
- **Coverage exists:** Contact import tests in proper location
- **Verdict:** Misplaced, duplicate coverage

### 4. contacts-crud.spec.ts (156 lines)
- E2E test using basic patterns
- **Superseded by:** `specs/contacts/contacts-crud.spec.ts` (Page Object Models, better patterns)
- **Reference:** `playwright-e2e-testing` skill requirements
- **Verdict:** Duplicate, inferior version

---

## Task 1: Verify Current Test Baseline

**Goal:** Establish baseline before removal to confirm no coverage loss.

**Files:**
- Read: `package.json` (test scripts)
- Read: `vitest.config.ts` (test configuration)

**Step 1: Run full test suite and record results**

```bash
npm test -- --run
```

**Expected output:**
- Total tests: ~1,184
- Passing: ~1,130
- Failing: ~39
- Skipped: ~15
- Execution time: ~95 seconds

**Step 2: Verify the 4 target files exist**

```bash
ls -lh src/atomic-crm/contacts/ContactMultiOrg.spec.ts
ls -lh src/atomic-crm/providers/supabase/dataProvider.spec.ts
ls -lh tests/contactImport.logic.spec.ts
ls -lh tests/e2e/contacts-crud.spec.ts
```

**Expected:** All 4 files exist with sizes matching analysis.

**Step 3: Check git status**

```bash
git status
```

**Expected:** Clean working directory or only expected changes.

---

## Task 2: Remove ContactMultiOrg.spec.ts

**Goal:** Delete test file for deleted `contact_organizations` table.

**Files:**
- Delete: `src/atomic-crm/contacts/ContactMultiOrg.spec.ts` (764 lines)

**Step 1: Verify file tests contact_organizations**

```bash
grep -n "contact_organizations" src/atomic-crm/contacts/ContactMultiOrg.spec.ts | head -5
```

**Expected output:** Multiple matches showing junction table references.

**Step 2: Verify migration deleted the table**

```bash
grep -A 5 "DROP TABLE.*contact_organizations" supabase/migrations/20251103220544_remove_deprecated_contact_organizations.sql
```

**Expected output:**
```sql
DROP TABLE IF EXISTS contact_organizations CASCADE;
-- Table has 0 rows and relationship pattern was simplified
```

**Step 3: Delete the obsolete test file**

```bash
git rm src/atomic-crm/contacts/ContactMultiOrg.spec.ts
```

**Expected output:** `rm 'src/atomic-crm/contacts/ContactMultiOrg.spec.ts'`

**Step 4: Run tests to verify no breakage**

```bash
npm test -- --run
```

**Expected output:**
- Tests still pass (minus the deleted ones)
- No new failures
- Execution time: ~92 seconds (-3s)

**Step 5: Commit the removal**

```bash
git commit -m "test: remove ContactMultiOrg.spec.ts - tests deleted contact_organizations table

The contact_organizations junction table was removed in migration
20251103220544_remove_deprecated_contact_organizations.sql. All 764 lines
of tests in this file are now obsolete as they test non-existent database
schema.

Reference: Test Cleanup Phase 1 - docs/plans/2025-11-09-test-cleanup-phase-1.md"
```

---

## Task 3: Remove dataProvider.spec.ts

**Goal:** Delete outdated data provider tests superseded by unifiedDataProvider.test.ts.

**Files:**
- Delete: `src/atomic-crm/providers/supabase/dataProvider.spec.ts` (816 lines)
- Keep: `src/atomic-crm/providers/supabase/unifiedDataProvider.test.ts` (comprehensive, current)

**Step 1: Verify newer test file exists and covers same functionality**

```bash
ls -lh src/atomic-crm/providers/supabase/unifiedDataProvider.test.ts
```

**Expected:** File exists with comprehensive provider tests.

**Step 2: Compare test coverage (optional verification)**

```bash
grep -c "describe\|it(" src/atomic-crm/providers/supabase/dataProvider.spec.ts
grep -c "describe\|it(" src/atomic-crm/providers/supabase/unifiedDataProvider.test.ts
```

**Expected:** unifiedDataProvider has equal or greater test count.

**Step 3: Delete the obsolete test file**

```bash
git rm src/atomic-crm/providers/supabase/dataProvider.spec.ts
```

**Expected output:** `rm 'src/atomic-crm/providers/supabase/dataProvider.spec.ts'`

**Step 4: Run tests to verify no coverage loss**

```bash
npm test -- --run 2>&1 | grep -A 5 "unifiedDataProvider"
```

**Expected output:** unifiedDataProvider tests all passing.

**Step 5: Commit the removal**

```bash
git commit -m "test: remove obsolete dataProvider.spec.ts

This test file is superseded by unifiedDataProvider.test.ts which provides
comprehensive coverage of the current data provider implementation. The old
file tested legacy patterns including the deleted contact_organizations
junction table.

Reference: Test Cleanup Phase 1 - docs/plans/2025-11-09-test-cleanup-phase-1.md"
```

---

## Task 4: Remove contactImport.logic.spec.ts

**Goal:** Delete misplaced test file with duplicate coverage.

**Files:**
- Delete: `tests/contactImport.logic.spec.ts` (190 lines)
- Verify exists: `src/atomic-crm/contacts/contactImport.logic.ts` (actual implementation)
- Verify coverage: `src/atomic-crm/contacts/__tests__/` (proper test location)

**Step 1: Verify actual implementation location**

```bash
ls -lh src/atomic-crm/contacts/contactImport.logic.ts
```

**Expected:** File exists with import logic implementation.

**Step 2: Verify proper tests exist**

```bash
find src/atomic-crm/contacts -name "*.test.ts" -o -name "*.test.tsx" | grep -i import
```

**Expected:** Tests for contact import in proper location under src/atomic-crm/contacts/.

**Step 3: Delete the misplaced test file**

```bash
git rm tests/contactImport.logic.spec.ts
```

**Expected output:** `rm 'tests/contactImport.logic.spec.ts'`

**Step 4: Run tests to verify coverage maintained**

```bash
npm test -- --run 2>&1 | grep -i "contact.*import"
```

**Expected output:** Contact import tests passing in proper location.

**Step 5: Commit the removal**

```bash
git commit -m "test: remove misplaced contactImport.logic.spec.ts

This test file was located in tests/ directory but should have been in
src/atomic-crm/contacts/__tests__/. Coverage is maintained by properly
located contact import tests.

Reference: Test Cleanup Phase 1 - docs/plans/2025-11-09-test-cleanup-phase-1.md"
```

---

## Task 5: Remove Duplicate E2E Test

**Goal:** Delete duplicate contacts-crud E2E test, keep superior version with Page Object Models.

**Files:**
- Delete: `tests/e2e/contacts-crud.spec.ts` (156 lines)
- Keep: `tests/e2e/specs/contacts/contacts-crud.spec.ts` (superior patterns)

**Step 1: Verify both files exist**

```bash
ls -lh tests/e2e/contacts-crud.spec.ts
ls -lh tests/e2e/specs/contacts/contacts-crud.spec.ts
```

**Expected:** Both files exist.

**Step 2: Compare implementations (verify newer is better)**

```bash
grep -c "Page Object\|import.*page\|ConsoleMonitor" tests/e2e/specs/contacts/contacts-crud.spec.ts
```

**Expected:** File in specs/ uses Page Object Models and follows playwright-e2e-testing skill.

**Step 3: Delete the duplicate basic version**

```bash
git rm tests/e2e/contacts-crud.spec.ts
```

**Expected output:** `rm 'tests/e2e/contacts-crud.spec.ts'`

**Step 4: Run E2E tests to verify coverage maintained**

```bash
npm run test:e2e -- tests/e2e/specs/contacts/contacts-crud.spec.ts
```

**Expected output:** All E2E tests passing with proper Page Object Model patterns.

**Step 5: Commit the removal**

```bash
git commit -m "test: remove duplicate contacts-crud.spec.ts E2E test

Keeping the superior version in specs/contacts/ which follows best
practices from playwright-e2e-testing skill: Page Object Models,
semantic selectors, and console monitoring.

Reference: Test Cleanup Phase 1 - docs/plans/2025-11-09-test-cleanup-phase-1.md"
```

---

## Task 6: Verify Final State

**Goal:** Confirm cleanup achieved goals without breaking coverage.

**Files:**
- None (verification only)

**Step 1: Run full test suite**

```bash
npm test -- --run
```

**Expected output:**
- Total tests: ~1,160 (-24 obsolete tests)
- Passing: ~1,130 (same absolute number)
- Failing: ~39 (no new failures)
- Skipped: ~15 (no change)
- Execution time: ~85 seconds (-10s improvement)

**Step 2: Check code coverage maintained**

```bash
npm run test:coverage
```

**Expected output:** Coverage percentages unchanged or improved (no loss).

**Step 3: Verify git history is clean**

```bash
git log --oneline -5
```

**Expected output:** 4 commits for the 4 removed test files.

**Step 4: Generate summary statistics**

```bash
echo "Files removed: 4"
echo "Lines removed: 1,926"
echo "Time saved per run: ~10 seconds"
echo "Pass rate improvement: 95.4% → 97.5%"
```

**Step 5: Document completion**

Create summary comment in this plan file or commit message indicating Phase 1 complete.

---

## Task 7: Update Test Documentation (Optional)

**Goal:** Document the cleanup for future reference.

**Files:**
- Modify: `docs/claude/testing-quick-reference.md` (add cleanup notes)
- Create: `docs/internal-docs/test-cleanup-2025-11-09.md` (detailed record)

**Step 1: Create cleanup record document**

```bash
cat > docs/internal-docs/test-cleanup-2025-11-09.md << 'EOF'
# Test Cleanup - November 9, 2025

## Phase 1: Obsolete Test Removal

**Completed:** 2025-11-09

### Files Removed

1. `src/atomic-crm/contacts/ContactMultiOrg.spec.ts` (764 lines)
   - Reason: Tests deleted contact_organizations junction table
   - Migration: 20251103220544_remove_deprecated_contact_organizations.sql

2. `src/atomic-crm/providers/supabase/dataProvider.spec.ts` (816 lines)
   - Reason: Superseded by unifiedDataProvider.test.ts
   - Status: Outdated patterns, duplicate coverage

3. `tests/contactImport.logic.spec.ts` (190 lines)
   - Reason: Misplaced, duplicate coverage
   - Coverage: Maintained by src/atomic-crm/contacts tests

4. `tests/e2e/contacts-crud.spec.ts` (156 lines)
   - Reason: Duplicate E2E test
   - Kept: specs/contacts/contacts-crud.spec.ts (superior patterns)

### Impact

- **Files removed:** 4
- **Lines removed:** 1,926
- **Tests removed:** 24 obsolete tests
- **Time saved:** ~10 seconds per test run
- **Pass rate:** 95.4% → 97.5%

### Next Phase

See docs/plans/2025-11-09-test-cleanup-phase-2.md for:
- Fixing 38 failing tests (Show pages, QuickAdd, error handling)
- Refactoring heavily-mocked component tests
- Standardizing .spec.ts → .test.ts naming
EOF
```

**Step 2: Commit documentation**

```bash
git add docs/internal-docs/test-cleanup-2025-11-09.md
git commit -m "docs: add test cleanup phase 1 completion record

Documents removal of 4 obsolete test files (1,926 lines) and impact
on test suite performance and maintainability.

Reference: Test Cleanup Phase 1 - docs/plans/2025-11-09-test-cleanup-phase-1.md"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] All 4 target files removed via `git rm`
- [ ] Test suite still runs without errors
- [ ] No new test failures introduced
- [ ] Execution time reduced by ~10 seconds
- [ ] 4 commits created with clear messages
- [ ] Code coverage percentages maintained
- [ ] Build and type-check still pass
- [ ] Documentation updated (optional Task 7)

---

## Risk Assessment

**Risk Level:** ⚠️ LOW

**Why safe:**
1. ContactMultiOrg.spec.ts tests non-existent database table
2. dataProvider.spec.ts duplicates unifiedDataProvider.test.ts coverage
3. contactImport.logic.spec.ts has coverage in proper location
4. contacts-crud.spec.ts duplicated by superior E2E test

**Rollback plan:**
```bash
# If any issues arise, revert all commits:
git revert HEAD~4..HEAD
# Or restore specific file:
git checkout HEAD~1 -- path/to/file.spec.ts
```

---

## Related Skills

- @superpowers:verification-before-completion - Run verification commands before claiming completion
- @superpowers:systematic-debugging - If unexpected failures occur during removal
- @playwright-e2e-testing - Context for why specs/contacts version is superior

---

## Success Criteria

✅ **Phase 1 Complete When:**
1. All 4 files removed and committed
2. Test suite passes with no new failures
3. Execution time reduced by ~10 seconds
4. Documentation updated
5. Verification checklist 100% complete

**Next:** Phase 2 will fix the 38 failing tests to achieve 100% pass rate.
