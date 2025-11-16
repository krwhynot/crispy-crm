# Legacy Test Files (Quarantined)

This directory contains test files that have been quarantined as part of the test suite cleanup initiative.

## Why These Tests Are Quarantined

These tests were removed from the active test suite because they:
- Have no assertions (only log output or take screenshots)
- Use deprecated patterns (CSS selectors for auth instead of fixtures)
- Provide low signal-to-noise ratio for CI/CD
- Create maintenance burden without providing regression coverage

## Files in This Directory

### verify-dashboard.spec.ts
**Why quarantined:** Uses CSS selectors for login (not the authenticated fixture), takes screenshots without any assertions. Predates the POM-based test suite.

**Original purpose:** Manual verification of dashboard layout

**Replacement:** Use `tests/e2e/dashboard-widgets.spec.ts` with proper POM and assertions

### debug-supabase.spec.ts
**Why quarantined:** Only logs console messages and saves screenshots to `/tmp`, no assertions. Useful for debugging but shouldn't run in CI.

**Original purpose:** Debug Supabase connection issues

**How to use if needed:** Run manually with `npx playwright test tests/legacy/debug-supabase.spec.ts --headed`

### debug-opportunities-nav.spec.ts
**Why quarantined:** Same pattern as debug-supabase - logs only, no assertions

**Original purpose:** Debug navigation issues in opportunities module

### dashboard-widgets-verification.spec.ts
**Why quarantined:** Takes screenshots across multiple viewports but only checks visibility without asserting on actual widget content. Duplicates coverage from `tests/e2e/dashboard-widgets.spec.ts`.

**Original purpose:** Visual verification of widget layout across devices

**Replacement:** The main dashboard test suite provides better coverage with proper assertions

## When to Run These Tests

These tests can still be run manually for debugging purposes:

```bash
# Run a specific legacy test
npx playwright test tests/legacy/debug-supabase.spec.ts --headed

# Run all legacy tests (not recommended)
npx playwright test tests/legacy/
```

## Future Actions

- **Delete completely** once replaced functionality is confirmed working
- **Extract useful patterns** (like screenshot utilities) into proper test helpers
- **Document debugging workflows** that don't require these files

## Cleanup Date

- **Quarantined:** 2025-11-15
- **Reason:** Test suite cleanup initiative (Phase 1)
- **Review Date:** 2025-12-01 (delete if no longer needed)
