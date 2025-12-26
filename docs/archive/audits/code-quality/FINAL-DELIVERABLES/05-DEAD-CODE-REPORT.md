# Dead Code Report

**Generated:** 2025-12-24
**Agent:** 25D - Forensic Aggregator (Compliance & Cleanup)
**Total Removable Lines:** ~260
**Total Removable Dependencies:** 1
**Estimated Bundle Savings:** ~15 KB (minimal due to tree-shaking)

---

## Executive Summary

The Crispy CRM codebase is **remarkably clean** with minimal dead code. Agent 18 (Exports & Functions) and Agent 19 (Dependencies & Orphans) found only:
- **1 completely dead file** (81 lines)
- **20 dead exports** (~150 lines)
- **1 unused npm dependency** (~15 KB)
- **0 orphaned files**

This is excellent for a project of this size (~1,032 source files, 70 production dependencies).

**Dead Code Health Grade: A-**

---

## Summary by Category

| Category | Count | Lines | Savings |
|----------|-------|-------|---------|
| Dead File | 1 | 81 | - |
| Dead Exports | 20 | ~150 | - |
| Test-Only Exports | 3 | ~30 | N/A |
| Unused npm Dependencies | 1 | - | ~15 KB |
| Orphaned Files | 0 | 0 | - |
| Stale Configs | 0 | 0 | - |
| **Total** | **25** | **~260** | **~15 KB** |

---

## Quick Wins (< 30 minutes total)

### 1. Delete Dead File
**File:** `src/atomic-crm/organizations/OrganizationDatagridHeader.tsx`
**Lines:** 81
**Status:** Completely unused - zero imports found

```bash
# Immediate deletion - safe
rm src/atomic-crm/organizations/OrganizationDatagridHeader.tsx
```

**Exports removed:**
- `OrganizationNameHeader`
- `OrganizationTypeHeader`
- `OrganizationPriorityHeader`
- `OrganizationColumnHeaders`

---

### 2. Remove Unused npm Dependency
**Package:** `vite-bundle-visualizer`
**Size:** ~15 KB
**Reason:** Project uses `rollup-plugin-visualizer` instead

```bash
# Remove duplicate visualizer package
npm uninstall vite-bundle-visualizer
```

---

### 3. Clean CSV Import Dead Exports
**File:** `src/atomic-crm/organizations/import/csvConstants.ts`

| Export | Lines | Status |
|--------|-------|--------|
| `MAX_FILE_SIZE_BYTES` | 1 | Unused |
| `CHUNK_SIZE` | 1 | Unused |
| `FORBIDDEN_FORMULA_PREFIXES` | 1 | Unused |

**Action:** Remove if no future import feature planned, or keep if upcoming feature.

---

### 4. Remove Dead Badge Constant
**File:** `src/atomic-crm/organizations/constants.ts`

```typescript
// Line 234 - Remove this unused constant
export const BADGE_TOUCH_CLASSES = "...";
```

---

### 5. Remove Dead Sales View
**File:** `src/atomic-crm/sales/resource.tsx`

```typescript
// Line 35 - Remove this unused export
export const SalesShowView = ...;
```

---

## Medium Effort (1-2 hours)

### 6. Clean organizationColumnAliases.ts
**File:** `src/atomic-crm/organizations/import/organizationColumnAliases.ts`
**Removable Lines:** ~275

| Export | Lines | Status |
|--------|-------|--------|
| `ORGANIZATION_COLUMN_ALIASES` | 220 | Unused |
| `normalizeHeader` | 43 | Unused |
| `getAvailableFields` | 12 | Unused |

**Keep:** `findCanonicalField`, `mapHeadersToFields`, `getAvailableFieldsWithLabels` (actively used)

---

### 7. Remove Dead Import Logic Functions
**File:** `src/atomic-crm/organizations/import/organizationImport.logic.ts`

| Export | Lines | Status |
|--------|-------|--------|
| `applyDataQualityTransformations` | 63 | Unused |
| `validateTransformedOrganizations` | 27 | Unused |

**Total:** 90 lines

---

### 8. Remove Dead Hook
**File:** `src/utils/useNotifyWithRetry.tsx`
**Lines:** ~50
**Status:** Unused - no imports found

```bash
rm src/utils/useNotifyWithRetry.tsx
```

---

### 9. Remove Dead Types
**File:** `src/atomic-crm/types.ts`

| Export | Lines | Status |
|--------|-------|--------|
| `InteractionParticipant` | 10 | Unused interface |
| `DashboardSnapshot` | 17 | Unused interface |

**Total:** 27 lines

---

### 10. Remove Dead Services
**File:** `src/atomic-crm/services/index.ts`

| Export | Status |
|--------|--------|
| `DigestService` | Unused (unless daily-digest feature is planned) |
| `createDigestService` | Unused (same) |
| `handleServiceError` | Unused utility |

**Action:** Verify daily-digest Edge Function integration, then remove if not connected.

---

## Test-Only Exports (Acceptable)

These exports are only used in tests, which is acceptable but could be internalized:

| File | Export | Test Usage |
|------|--------|------------|
| `services/segments.service.ts` | `SegmentsService` | `segments.service.test.ts` |
| `services/junctions.service.ts` | `JunctionsService` | `junctions.service.test.ts` |
| `utils/formatRelativeTime.ts` | `formatRelativeTime` | `formatRelativeTime.test.ts` |

**Recommendation:** Keep for now - test coverage is valuable.

---

## False Positives (Keep These)

Agent 18 flagged, but Agent 19/21 verified as used:

| File | Export | Actual Status |
|------|--------|---------------|
| Report Tab Components | Various | React.lazy() dynamic imports |
| Dashboard Widgets | Various | Conditional rendering |
| Test Utilities | mockData, testHelpers | Test-only by design |
| Edge Function Emails | `src/emails/*` | Used by Supabase Edge Functions |

---

## Complete Cleanup Script

```bash
#!/bin/bash
# Forensic Audit Dead Code Cleanup Script
# Generated: 2025-12-24
# Agent: 25D - Forensic Aggregator
#
# ⚠️ REVIEW BEFORE RUNNING
# Run tests after each section to verify

set -e

echo "=== Phase 1: Remove Unused npm Dependency ==="
npm uninstall vite-bundle-visualizer
echo "✅ Dependency removed (~15 KB saved)"

echo "=== Phase 2: Remove Dead File ==="
rm -f src/atomic-crm/organizations/OrganizationDatagridHeader.tsx
echo "✅ Dead file removed (81 lines)"

echo "=== Phase 3: Remove Dead Hook ==="
rm -f src/utils/useNotifyWithRetry.tsx
echo "✅ Dead hook removed (~50 lines)"

echo "=== Phase 4: Verify Build ==="
npm run build
echo "✅ Build successful"

echo "=== Phase 5: Run Tests ==="
npm test
echo "✅ All tests pass"

echo ""
echo "=== Cleanup Summary ==="
echo "Removed: 1 npm dependency, 2 files (~131 lines)"
echo "Saved: ~15 KB bundle size"
echo ""
echo "⚠️ Manual cleanup still needed:"
echo "  - Remove dead exports from organizationColumnAliases.ts (~275 lines)"
echo "  - Remove dead exports from organizationImport.logic.ts (~90 lines)"
echo "  - Remove dead types from types.ts (~27 lines)"
echo "  - Remove BADGE_TOUCH_CLASSES from constants.ts"
echo "  - Remove SalesShowView from resource.tsx"
echo ""
echo "=== Cleanup Complete ==="
```

---

## Verification Checklist

Before removing any code:

- [ ] Verify no dynamic imports: `grep -r "import\s*\(" src/ | grep <export_name>`
- [ ] Verify no string requires: `grep -r "require\s*(" src/ | grep <export_name>`
- [ ] Check barrel exports: `grep -r "export.*from" src/`
- [ ] Search for reflection usage: `grep -r "'<export_name>'" src/`

After cleanup:

- [ ] All tests pass (`npm test`)
- [ ] App builds successfully (`npm run build`)
- [ ] Bundle size reduced (`ANALYZE=true npm run build`)
- [ ] No runtime errors (manual smoke test)
- [ ] Git diff reviewed before commit

---

## Dead Code by Location

```
Dead Code Distribution by Directory:

src/atomic-crm/organizations/
├── OrganizationDatagridHeader.tsx    81 lines (DEAD FILE)
├── import/
│   ├── organizationColumnAliases.ts  ~275 lines (partial)
│   ├── organizationImport.logic.ts   ~90 lines (partial)
│   └── csvConstants.ts               ~3 lines (partial)
└── constants.ts                      ~2 lines (partial)

src/atomic-crm/
├── types.ts                          ~27 lines (partial)
├── services/index.ts                 ~15 lines (partial)
└── sales/resource.tsx                ~5 lines (partial)

src/utils/
└── useNotifyWithRetry.tsx            ~50 lines (DEAD FILE)

Total: ~548 potential lines
Confirmed safe to remove: ~260 lines
```

---

## Categorized by Effort

### Quick Wins (< 30 min, ~131 lines)

| Task | Lines | Command |
|------|-------|---------|
| Delete OrganizationDatagridHeader.tsx | 81 | `rm ...` |
| Delete useNotifyWithRetry.tsx | 50 | `rm ...` |
| Remove vite-bundle-visualizer | - | `npm uninstall ...` |

### Medium Effort (1-2 hours, ~115 lines)

| Task | Lines | Notes |
|------|-------|-------|
| Clean organizationColumnAliases.ts | ~275 | Keep 3 used exports |
| Clean organizationImport.logic.ts | ~90 | Remove 2 functions |
| Remove dead types | 27 | Interface removal |

### Lower Priority (Optional, ~14 lines)

| Task | Lines | Notes |
|------|-------|-------|
| csvConstants.ts cleanup | 3 | Keep if import feature planned |
| BADGE_TOUCH_CLASSES | 2 | Simple constant |
| SalesShowView | 5 | Dead view export |
| Evaluate DigestService | ~15 | Depends on Edge Function plans |

---

## Impact Analysis

### Bundle Size Impact

| Item | Size Impact | Notes |
|------|-------------|-------|
| vite-bundle-visualizer | ~15 KB | Dev dependency |
| Dead exports | ~0 KB | Tree-shaken out |
| Dead files | ~0 KB | Tree-shaken out |
| **Total** | **~15 KB** | Minimal production impact |

> **Note:** Bundle impact is minimal because Vite/Rollup tree-shakes unused exports. The main benefit is **maintainability**.

### Maintainability Benefit

| Benefit | Description |
|---------|-------------|
| Reduced cognitive load | Fewer exports to understand |
| Cleaner imports | No unused re-exports |
| Faster IDE indexing | Less code to parse |
| Clearer ownership | No "is this used?" questions |

---

## Prevention Measures

### Add to CI Pipeline

```yaml
# .github/workflows/dead-code.yml
name: Dead Code Check

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx ts-prune --error
        name: Check for unused exports
```

### Add npm Script

```json
// package.json
{
  "scripts": {
    "lint:dead-code": "npx ts-prune --ignore 'test|__tests__|.d.ts'",
    "lint:unused-deps": "npx depcheck --ignores='@types/*'"
  }
}
```

---

## Audit Complete

All 5 final deliverables created:

| # | Deliverable | Status | Lines |
|---|-------------|--------|-------|
| 1 | 01-PRIORITIZED-FIX-LIST.md | ✅ Complete | ~600 |
| 2 | 02-PATTERN-DOCUMENTATION.md | ✅ Complete | ~600 |
| 3 | 03-RISK-ASSESSMENT.md | ✅ Complete | ~600 |
| 4 | 04-COMPLIANCE-SCORECARD.md | ✅ Complete | ~340 |
| 5 | 05-DEAD-CODE-REPORT.md | ✅ Complete | ~330 |

---

## Conclusion

The Crispy CRM codebase has **minimal dead code** - approximately 260 confirmed removable lines (0.25% of codebase), plus 1 unused npm dependency. This is excellent for a project of this size.

**Key Metrics:**
- Dead files: 1 (81 lines)
- Dead exports: 20 (~150 lines)
- Unused dependencies: 1 (~15 KB)
- Orphaned files: 0

**Recommended Actions:**
1. ✅ Run cleanup script for quick wins (30 min)
2. ✅ Manual cleanup of partial files (1-2 hours)
3. ✅ Add `ts-prune` to CI to prevent accumulation
4. ✅ Document removal in changelog

---

*Dead code report compiled by Agent 25D - Forensic Aggregator*
*Generated: 2025-12-24*
*Sources: Agent 18 (Exports), Agent 19 (Dependencies), 25A Master Findings*
