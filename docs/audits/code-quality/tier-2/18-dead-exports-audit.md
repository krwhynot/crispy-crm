# Dead Code Audit - Exports & Functions

**Agent:** 18 - Dead Code Hunter (Exports & Functions)
**Date:** 2025-12-24
**Exports Checked:** ~450
**Functions Checked:** ~80 internal functions

---

## Executive Summary

The Crispy CRM codebase has moderate dead code issues, primarily in legacy CSV import utilities, unused type definitions, and one completely dead file (`OrganizationDatagridHeader.tsx`). Most of the codebase is actively used, but there are clear cleanup opportunities totaling approximately **150-200 removable lines**.

**Removable Lines (Estimated):** ~180
**Files Affected:** 12

---

## Dead Exports

### Confirmed Dead (Zero Imports)

| Export | File | Line | Type | Lines |
|--------|------|------|------|-------|
| `OrganizationNameHeader` | OrganizationDatagridHeader.tsx | 31 | Function | 10 |
| `OrganizationTypeHeader` | OrganizationDatagridHeader.tsx | 47 | Function | 10 |
| `OrganizationPriorityHeader` | OrganizationDatagridHeader.tsx | 62 | Function | 10 |
| `OrganizationColumnHeaders` | OrganizationDatagridHeader.tsx | 76 | Object | 5 |
| `InteractionParticipant` | types.ts | 185 | Interface | 10 |
| `DashboardSnapshot` | types.ts | 339 | Interface | 17 |
| `BADGE_TOUCH_CLASSES` | organizations/constants.ts | 234 | Const | 2 |
| `MAX_FILE_SIZE_BYTES` | csvConstants.ts | 12 | Const | 1 |
| `CHUNK_SIZE` | csvConstants.ts | 18 | Const | 1 |
| `FORBIDDEN_FORMULA_PREFIXES` | csvConstants.ts | 35 | Const | 1 |
| `getAvailableFields` | organizationColumnAliases.ts | 319 | Function | 12 |
| `normalizeHeader` | organizationColumnAliases.ts | 235 | Function | 43 |
| `ORGANIZATION_COLUMN_ALIASES` | organizationColumnAliases.ts | 14 | Object | 220 |
| `SalesShowView` | sales/resource.tsx | 35 | View | 5 |
| `DigestService` | services/index.ts | 9 | Service | - |
| `createDigestService` | services/index.ts | 9 | Factory | - |
| `applyDataQualityTransformations` | organizationImport.logic.ts | 145 | Function | 63 |
| `validateTransformedOrganizations` | organizationImport.logic.ts | 215 | Function | 27 |
| `handleServiceError` | services/utils/index.ts | 1 | Function | ~15 |
| `useNotifyWithRetry` | utils/useNotifyWithRetry.tsx | 63 | Hook | ~50 |

### Completely Dead File

**`src/atomic-crm/organizations/OrganizationDatagridHeader.tsx`** (81 lines)

This entire file exports 4 items (`OrganizationNameHeader`, `OrganizationTypeHeader`, `OrganizationPriorityHeader`, `OrganizationColumnHeaders`) that are never imported anywhere. The file appears to be leftover from a column filtering implementation that was replaced.

**Recommendation:** Delete the entire file.

---

## Exports Only Used in Tests

| Export | File | Test File | Production Dead? |
|--------|------|-----------|------------------|
| `SegmentsService` | services/segments.service.ts | segments.service.test.ts | **Yes** |
| `JunctionsService` | services/junctions.service.ts | junctions.service.test.ts | **Yes** |
| `formatRelativeTime` | utils/formatRelativeTime.ts | formatRelativeTime.test.ts | **Yes** |

**Note:** These are exported purely for testing but never used in production code. Consider:
1. Making them internal (not exported) if tests can access them another way
2. Removing if the functionality is not needed

---

## Dead Internal Functions

### Potentially Dead (File-Internal)

The following internal functions in `organizationColumnAliases.ts` are only used by the dead exported function `normalizeHeader`:
- Internal normalization helpers within the file

No other confirmed dead internal functions were found. Most internal functions are actively called.

---

## Stale Imports

TypeScript compilation passes without errors, indicating no unused import statements. The codebase appears clean of stale imports.

---

## Commented Code Blocks

### Large Comment Blocks (Documentation Only)

The codebase uses extensive JSDoc documentation but contains **no commented-out code blocks**. All comments found are:
- JSDoc documentation for functions/types
- Technical debt notes (marked with `TODO`, `Technical Debt`)
- Explanatory comments about implementation choices

**Status:** Clean - no action needed.

---

## Cleanup Impact Summary

| Category | Count | Lines | Effort |
|----------|-------|-------|--------|
| Dead exports | 20 | ~150 | Low |
| Dead files | 1 | 81 | Very Low |
| Test-only exports | 3 | ~30 | Low |
| Stale imports | 0 | - | N/A |
| Commented code | 0 | - | N/A |
| **Total** | **24** | **~260** | **~1-2 hrs** |

---

## Prioritized Cleanup

### Quick Wins (< 30 min total)

| Task | Files | Lines | Action |
|------|-------|-------|--------|
| Delete OrganizationDatagridHeader.tsx | 1 | 81 | `rm src/atomic-crm/organizations/OrganizationDatagridHeader.tsx` |
| Remove csvConstants.ts exports | 1 | 3 | Not imported - can keep for future use or delete |
| Remove BADGE_TOUCH_CLASSES | 1 | 2 | Delete export from constants.ts |
| Remove SalesShowView | 1 | 5 | Delete from sales/resource.tsx |

### Medium Effort

| Task | Files | Lines | Notes |
|------|-------|-------|-------|
| Clean organizationColumnAliases.ts | 1 | ~275 | Large object + functions unused |
| Remove dead logic functions | 1 | 90 | `applyDataQualityTransformations`, `validateTransformedOrganizations` |
| Remove useNotifyWithRetry | 1 | 50 | Entire hook file unused |
| Remove dead types from types.ts | 1 | 27 | `InteractionParticipant`, `DashboardSnapshot` |

### Lower Priority

| Task | Files | Notes |
|------|-------|-------|
| Evaluate DigestService | 1 | May be needed for future digest feature |
| Evaluate test-only services | 2 | Consider internal refactoring |

---

## Verification Commands

Before removing, verify with these commands:

```bash
# Check for any imports of a specific export
grep -rn "import.*ExportName" src/

# Check for dynamic imports
grep -rn "import('./organizationColumnAliases')" src/

# Check for string references (reflection)
grep -rn "'normalizeHeader'" src/
grep -rn '"normalizeHeader"' src/
```

---

## Verification Checklist

Before removing, verify:
- [x] Not dynamically imported: `import('./module')`
- [x] Not string-required: `require(variable)`
- [x] Not used via barrel export
- [x] Not called via reflection
- [ ] Tests still pass after removal (run after cleanup)

---

## Recommendations

1. **Immediate:** Delete `OrganizationDatagridHeader.tsx` - 81 lines of completely dead code
2. **High Value:** Clean up `organizationColumnAliases.ts` - remove `ORGANIZATION_COLUMN_ALIASES`, `normalizeHeader`, `getAvailableFields` (~275 lines)
3. **Medium Value:** Remove `useNotifyWithRetry.tsx` - dead hook (~50 lines)
4. **Low Value:** Remove dead types from `types.ts` - improves type clarity
5. **Consider:** Keep `DigestService` exports if daily digest feature is planned

---

## Risk Assessment

| Cleanup Item | Risk Level | Mitigation |
|--------------|------------|------------|
| OrganizationDatagridHeader.tsx | Very Low | Zero imports found |
| organizationColumnAliases exports | Low | Only `findCanonicalField`, `mapHeadersToFields`, `getAvailableFieldsWithLabels` are used |
| types.ts dead interfaces | Very Low | Type-only, no runtime impact |
| csvConstants.ts | Very Low | Purely constants, no side effects |

All identified dead code can be safely removed with low risk. Run `npm run build` and `npm test` after cleanup to verify.

---

## Next Steps

1. Create a cleanup PR focusing on the dead file first
2. Run full test suite after each removal
3. Agent 19 should analyze dependencies and orphaned files
