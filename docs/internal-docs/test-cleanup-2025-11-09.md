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
