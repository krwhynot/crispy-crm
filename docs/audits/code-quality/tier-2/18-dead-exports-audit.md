# Dead Code Audit - Exports & Functions

**Agent:** 18 - Dead Code Hunter (Exports & Functions)
**Date:** 2025-12-21
**Exports Checked:** ~150+ named exports across src/atomic-crm/
**Functions Checked:** ~80 internal functions

---

## Executive Summary

The codebase contains **significant dead code** primarily in utility modules that were written but never integrated into production. Three entire utility files (`contextMenu.tsx`, `keyboardShortcuts.ts`, `exportScheduler.ts`) totaling **738 lines** are only used in tests. Additionally, the `OrganizationType.tsx` file with 3 components is completely dead (replaced by `OrganizationBadges.tsx`). Several exports from import logic files are also unused.

**Removable Lines (Estimated):** ~900+ lines
**Files Affected:** 12+ files

---

## Dead Exports

### Confirmed Dead (Zero Imports)

| Export | File | Line | Type | Lines |
|--------|------|------|------|-------|
| `OrganizationType` | OrganizationType.tsx | 30 | Component | 27 |
| `OrganizationTypeChip` | OrganizationType.tsx | 59 | Component | 12 |
| `OrganizationPriorityChip` | OrganizationType.tsx | 73 | Component | 12 |
| `sanitizeFormulaInjection` | organizationImport.logic.ts | 87 | Function | 25 |
| `validateOrganizationRow` | organizationImport.logic.ts | 114 | Function | 33 |
| `applyDataQualityTransformations` | organizationImport.logic.ts | 212 | Function | 70 |
| `validateTransformedOrganizations` | organizationImport.logic.ts | 282 | Function | ~30 |
| `getHeaderMappingDescription` | organizationColumnAliases.ts | 342 | Function | 17 |
| `validateRequiredMappings` | organizationColumnAliases.ts | 359 | Function | 18 |
| `getAvailableFields` | organizationColumnAliases.ts | 378 | Function | 12 |
| `getUnmappedHeaders` | organizationColumnAliases.ts | 295 | Function | 24 |
| `legacyFindOpportunityLabel` | opportunity.ts | 15 | Re-export | 0 |
| `registerShortcut` | keyboardShortcuts.ts | export | Function | - |
| `unregisterShortcut` | keyboardShortcuts.ts | export | Function | - |

### Entire Files Dead (Production)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `OrganizationType.tsx` | 85 | Badge components | **Replaced by OrganizationBadges.tsx** |
| `sizes.ts` | 7 | Organization size choices | **Imported but unused** |

### Test-Only Exports (Candidates for Review)

| Export | File | Test File | Lines | Verdict |
|--------|------|-----------|-------|---------|
| `ContextMenu` | contextMenu.tsx | contextMenu.test.tsx | 210 | **Remove** - never used in production |
| `keyboardShortcuts` | keyboardShortcuts.ts | keyboardShortcuts.test.ts | 193 | **Remove** - never used in production |
| `ExportScheduler` | exportScheduler.ts | exportScheduler.test.ts | 335 | **Remove** - never used in production |

---

## Dead Internal Functions

### Confirmed Dead (Never Called)

| Function | File | Line | Lines | Notes |
|----------|------|------|-------|-------|
| Internal constants in `OrganizationType.tsx` | OrganizationType.tsx | 6-28 | 22 | Used only by dead components |

### Duplicated Functions (Code Smell)

| Function | Location 1 | Location 2 | Action |
|----------|-----------|-----------|--------|
| `ucFirst` | opportunityUtils.ts:24 | OpportunityArchivedList.tsx:137 | ✅ **FIXED 2025-12-21** - Consolidated to `src/atomic-crm/utils/formatters.ts` |

---

## Stale Imports

### Imports of Unused Items

| File | Line | Import Statement | Unused Items |
|------|------|------------------|--------------|
| OrganizationAside.tsx | 14 | `import { sizes as _sizes } from "./sizes"` | `_sizes` (underscore indicates unused) |

**Total Stale Imports:** 1 confirmed, potentially more hidden by ESLint suppression

### Import Cleanup Commands
```bash
# Quick fix with ESLint (if unused-imports plugin configured)
npx eslint --fix --rule 'unused-imports/no-unused-imports: error' src/

# Manual verification
grep -rn "as _" src/atomic-crm/
```

---

## Commented Code Blocks

### Assessment: **Clean**

No significant commented-out code blocks found. The codebase follows good practices with code in git history rather than comments.

### Minor Items Found

| File | Line Range | Content | Action |
|------|------------|---------|--------|
| *None significant* | - | - | - |

---

## Deprecated Code (Candidates for Removal)

The following items are marked `@deprecated` and may be dead:

| Export | File | Deprecation Reason | Status |
|--------|------|--------------------|--------|
| `OrganizationShow` | OrganizationShow.tsx:2 | Use OrganizationSlideOver instead | **Verify no routes use it** |
| `ACTIVITY_PAGE_SIZE` | constants.ts:212 | Use from activities/constants.ts | **Check for dual definitions** |
| `linkType` | SimpleListItem.tsx:98 | Use rowClick instead | **Check usage** |
| `TABLET_VISIBLE` | listPatterns.ts:38 | Use COLUMN_VISIBILITY | **Check imports** |
| `DESKTOP_ONLY` | listPatterns.ts:40 | Use COLUMN_VISIBILITY | **Check imports** |
| Various segment schemas | validation/segments.ts | Use fixed categories | **Audit segment code** |
| `taskSchema` | task.ts:125 | Use taskCreateSchema | **Check imports** |
| `taskUpdateSchemaLegacy` | task.ts:128 | Use taskUpdateSchema | **Check imports** |

---

## Cleanup Impact Summary

| Category | Count | Lines | Effort |
|----------|-------|-------|--------|
| Dead exports (functions) | 11 | ~200 | Low |
| Dead exports (components) | 3 | ~51 | Low |
| Test-only files | 3 | ~738 | Low (remove files) |
| Stale imports | 1 | - | Auto-fix |
| Dead files | 2 | ~92 | Low |
| **Total** | **20** | **~1,081** | **~2-3 hrs** |

---

## Prioritized Cleanup

### Quick Wins (< 30 min total)

| Task | Files | Lines | Command/Action |
|------|-------|-------|----------------|
| Remove stale import `_sizes` | OrganizationAside.tsx | 1 | Delete line 14 |
| Delete `sizes.ts` | sizes.ts | 7 | `rm src/atomic-crm/organizations/sizes.ts` |
| Delete `OrganizationType.tsx` | OrganizationType.tsx | 85 | Verify no imports, then delete |

### Medium Effort (1-2 hours)

| Task | Files | Lines | Action |
|------|-------|-------|--------|
| Delete test-only utilities | 3 files | 738 | Remove contextMenu.tsx, keyboardShortcuts.ts, exportScheduler.ts + tests |
| Remove dead organizationImport.logic.ts exports | 1 file | ~155 | Remove unused functions |
| Remove dead organizationColumnAliases.ts exports | 1 file | ~70 | Remove unused functions |
| Consolidate `ucFirst` | 2 files | - | ✅ **DONE 2025-12-21** - Moved to `formatters.ts` |

### Requires Verification

| Task | Files | Verification Needed |
|------|-------|---------------------|
| Remove deprecated patterns | Multiple | Ensure no routes/imports reference them |

---

## Verification Checklist

Before removing, verify:
- [ ] Not dynamically imported: `import('./module')`
- [ ] Not string-required: `require(variable)`
- [ ] Not used via barrel export
- [ ] Not called via reflection
- [ ] Tests still pass after removal
- [ ] Build succeeds after removal

---

## Verification Commands

```bash
# Verify OrganizationType.tsx is truly dead
grep -rn "OrganizationType\|OrganizationTypeChip\|OrganizationPriorityChip" src/ --include="*.tsx" --include="*.ts" | grep -v "OrganizationType.tsx" | grep -v "type OrganizationType"

# Verify sizes.ts is only stale-imported
grep -rn "from.*sizes" src/atomic-crm/

# Verify test-only utils aren't secretly used
grep -rn "ContextMenu\|keyboardShortcuts\|exportScheduler" src/ --include="*.tsx" --include="*.ts" | grep -v "__tests__" | grep -v "\.test\."

# Run tests after cleanup
npm run test

# Run build after cleanup
npm run build
```

---

## Recommendations

1. **Immediate:** Delete `sizes.ts` and remove stale import from `OrganizationAside.tsx` - zero risk
2. **High Priority:** Delete `OrganizationType.tsx` - already replaced by `OrganizationBadges.tsx`
3. **Medium Priority:** Remove test-only utility files (contextMenu, keyboardShortcuts, exportScheduler) - these add ~700 lines of dead production code
4. **Low Priority:** Clean up unused exports from organizationImport.logic.ts and organizationColumnAliases.ts
5. **Consider:** Run ESLint with `unused-imports` plugin for automated detection going forward

---

## Risk Assessment

| Cleanup Item | Risk Level | Mitigation |
|--------------|------------|------------|
| `sizes.ts` removal | **Very Low** | Imported but never used |
| `OrganizationType.tsx` removal | **Low** | Replaced by OrganizationBadges.tsx |
| Test-only files | **Low** | Only tested, not imported in production |
| organizationImport.logic.ts exports | **Medium** | Verify import preview functionality works |

---

## Next Steps

1. Run verification commands above
2. Create a cleanup branch
3. Remove dead code in priority order
4. Run full test suite
5. Deploy to staging for QA verification
