# Testing & Development Artifacts Archive

**Date**: November 2-4, 2025
**Purpose**: Historical snapshots of testing, linting, and database state
**Status**: All artifacts are historical reference only

---

## Overview

This archive contains testing artifacts and snapshots created during the November 2025 development sprint. These files were used for one-time testing, baseline establishment, or data export purposes and are no longer needed in the project root.

---

## Contents

### 1. activities-db-dump.sql (1.4MB, 4,278 lines)

**Original Name**: `activities` (renamed for clarity)
**Date**: November 2, 2025
**Type**: PostgreSQL database dump
**Purpose**: Snapshot of database state, likely for testing or backup

**Details**:
- Complete PostgreSQL dump with session settings
- Contains 8 table operations (INSERT/CREATE/COPY)
- Used `session_replication_role = replica` mode
- Includes data for activities-related tables

**Why Archived**:
- Database dumps don't belong in project root
- Point-in-time snapshot (Nov 2) is now outdated
- Proper database backups should use Supabase backup system
- This was likely a manual export for testing purposes

**Recommendation**: If database restore is needed, use Supabase backup/restore features instead of manual SQL dumps.

---

### 2. baseline-lint-errors.txt (35KB)

**Date**: November 2, 2025
**Type**: ESLint error baseline snapshot
**Purpose**: Snapshot of existing lint errors to track cleanup progress

**Content**:
```
> eslint **/*.{mjs,ts,tsx}

/scripts/dev/create-test-users-http.mjs
  99:16  error  'listAuthUsers' is defined but never used
  231:14 error  'err' is defined but never used
[... more errors ...]
```

**Errors Captured**:
- scripts/dev/*.mjs: Unused variables
- scripts/generate-seed.ts: Control character regex warning
- scripts/migrate-opportunities-csv.ts: Unused variables

**Why Archived**:
- Baseline established on Nov 2, 2025
- Lint errors are dynamic - this snapshot is outdated
- Current lint status should be checked with `npm run lint:check`
- No longer useful as a baseline (code has changed significantly)

**Note**: If you need to establish a new baseline, run `npm run lint:check > baseline-lint-errors-$(date +%Y%m%d).txt`

---

### 3. color-contrast-report.json (3.1KB)

**Date**: November 4, 2025 21:43:49 UTC
**Type**: Color contrast test results (WCAG compliance)
**Purpose**: Verify tag color accessibility meets WCAG 2.1 Level AA standards

**Test Results**:
- **Total Tests**: 18
- **Passed**: 18 ✅
- **Failed**: 0
- **Warnings**: 0

**Tests Performed**:
- Tag color contrast ratios (warm, green, teal, etc.)
- Light and dark mode variants
- Minimum ratio requirement: 4.5:1 for text
- All tags achieved 12.04-12.95 contrast ratio (excellent)

**Example Results**:
```json
{
  "mode": "light",
  "test": "Tag warm",
  "ratio": "12.22",
  "minRatio": 4.5,
  "bg": "tag-warm-bg",
  "fg": "tag-warm-fg"
}
```

**Why Archived**:
- Tests completed successfully (100% pass rate)
- Point-in-time verification (Nov 4)
- Color system is now stable and validated
- Similar to dashboard test reports - work product artifact

**Note**: If color system changes, re-run contrast tests. This report serves as historical proof of compliance.

---

## Historical Context

### Database Dump (activities)
Created during database schema evolution work (likely Phase 2-3). This was probably used to:
- Backup activity-related table data before schema changes
- Test migration scenarios
- Preserve data during database refactoring

Not needed long-term as Supabase provides automated backups.

### Lint Baseline
Created to establish a starting point for code quality improvements. Common practice when:
- Inheriting legacy code
- Starting major cleanup effort
- Tracking progress toward zero-lint goal

Outdated once significant code changes occur (which they have).

### Color Contrast Report
Created during Phase 4 design system validation. Part of accessibility testing to ensure:
- Tag colors meet WCAG standards
- Design system compliance
- Brand colors (MFB "Garden to Table" theme) are accessible

Successful completion means the color system is approved.

---

## Recommendations

### For Database Backups
- **Don't**: Use manual SQL dumps in root directory
- **Do**: Use Supabase backup/restore features
- **Do**: Export to `/docs/archive/` if manual backup needed
- **Do**: Name with clear purpose: `backup-YYYY-MM-DD-description.sql`

### For Lint Baselines
- **Don't**: Keep outdated baselines in root
- **Do**: Archive after major cleanup milestones
- **Do**: Run fresh baseline when needed: `npm run lint:check > baseline-$(date +%Y%m%d).txt`
- **Consider**: Using `eslint --max-warnings 0` in CI instead of baselines

### For Test Reports
- **Don't**: Keep test reports in root after tests pass
- **Do**: Archive with other work products
- **Do**: Document test methodology in `/docs/testing/`
- **Consider**: Automated test reports in CI artifacts instead

---

## Archive Status

| File | Size | Date | Status | Can Delete? |
|------|------|------|--------|-------------|
| activities-db-dump.sql | 1.4MB | Nov 2 | Outdated | ⚠️ Review first |
| baseline-lint-errors.txt | 35KB | Nov 2 | Outdated | ✅ Yes |
| color-contrast-report.json | 3.1KB | Nov 4 | Complete | ✅ Yes |

**Recommendation**:
- Keep database dump for 30 days (until Dec 4, 2025) then delete
- Safe to delete lint baseline immediately (outdated)
- Safe to delete color contrast report immediately (tests passed, validated)

---

**Archived**: November 4, 2025
**Reason**: Root directory cleanup
**Future**: Use proper backup systems instead of root-level artifacts
