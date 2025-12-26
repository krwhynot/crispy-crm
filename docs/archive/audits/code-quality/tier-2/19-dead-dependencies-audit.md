# Dead Code Audit - Dependencies & Orphans

**Agent:** 19 - Dead Code Hunter (Dependencies & Orphans)
**Date:** 2025-12-24
**Dependencies Checked:** 109 packages (70 production + 39 dev)
**Source Files Checked:** 1,032 files

---

## Executive Summary

The Crispy CRM codebase is remarkably clean with minimal dead code. Only **1 unused npm dependency** was identified (`vite-bundle-visualizer`), and no truly orphaned source files exist. The audit did identify **barrel export gaps** where components are used but not exported from their feature index files - this is an organizational pattern choice, not dead code.

**Removable Dependencies:** 1 package (~15KB)
**Orphaned Files:** 0 confirmed orphans
**Cleanup Effort:** <15 minutes

---

## Unused npm Dependencies

### Production Dependencies

All 70 production dependencies are actively used:

| Status | Count | Notes |
|--------|-------|-------|
| Used in code | 55 | Direct imports in src/ |
| Used in config | 7 | Vite plugins, CSS imports |
| Used implicitly | 8 | TypeScript, build tools |

**Verification Notes:**
- `@tailwindcss/vite` - Used in vite.config.ts:3
- `@vitejs/plugin-react` - Used in vite.config.ts:4
- `@sentry/vite-plugin` - Used in vite.config.ts:7
- `rollup-plugin-visualizer` - Used in vite.config.ts:5
- `vite-plugin-simple-html` - Used in vite.config.ts:6
- `tailwindcss` - Imported in src/index.css:1
- `tw-animate-css` - Imported in src/index.css:2
- `typescript` - Used by tsc in build scripts

### Dev Dependencies - UNUSED

| Package | Size (est) | Purpose | Action |
|---------|------------|---------|--------|
| `vite-bundle-visualizer` | ~15KB | Bundle analysis | **REMOVE** - Project uses `rollup-plugin-visualizer` instead |

**Note:** This package was installed but never configured or used. The project correctly uses `rollup-plugin-visualizer` in vite.config.ts.

### Dev Dependencies - USED

All other 38 devDependencies are actively used:

| Category | Packages | Usage |
|----------|----------|-------|
| Testing | `vitest`, `@vitest/*`, `@testing-library/*`, `@playwright/test` | Test commands |
| Storybook | `storybook`, `@storybook/*`, `chromatic` | Component docs |
| Linting | `eslint`, `eslint-plugin-*`, `prettier` | Code quality |
| Types | `@types/*` | TypeScript support |
| Build | `husky`, `terser`, `gh-pages` | CI/CD |
| Scripts | `chalk`, `dotenv`, `execa`, `ora`, `pg` | Utility scripts |

### Removal Commands

```bash
npm uninstall vite-bundle-visualizer
```

---

## Orphaned Source Files

### Summary: NO TRUE ORPHANS

After comprehensive analysis, **no files are truly orphaned**. Initial detection flagged files that aren't exported from barrel exports (index.ts files), but these files ARE imported directly by consuming components.

### Barrel Export Pattern Analysis

The codebase uses a **mixed import pattern**:

1. **Barrel exports** - Feature directories have index.ts exporting main components
2. **Direct imports** - Internal components are imported directly, not via barrel

This is a valid architecture pattern for tree-shaking optimization.

#### Files Not in Barrel Exports (But Still Used)

| Feature | Files Not Exported | Status |
|---------|-------------------|--------|
| Organizations | 31 internal components | **USED** - imported directly |
| Sales | 13 internal components | **USED** - imported directly |
| Tasks | 15 internal components | **USED** - imported directly |

**Example verification:**
```
OrganizationList.tsx → Found at src/atomic-crm/organizations/OrganizationList.tsx
BulkReassignButton.tsx → Found at src/atomic-crm/organizations/BulkReassignButton.tsx
TaskCreate.tsx → Found at src/atomic-crm/tasks/TaskCreate.tsx
```

### Entry Points Verified

| File | Type | Status |
|------|------|--------|
| src/main.tsx | Application entry | VALID |
| src/App.tsx | Root component | VALID |
| vite.config.ts | Build config | VALID |
| vitest.config.ts | Test config | VALID |
| playwright.config.ts | E2E config | VALID |
| .storybook/* | Storybook config | VALID |

---

## Test File Analysis

### Test Organization Pattern

Tests are located in `__tests__/` subdirectories alongside their source files:
```
src/atomic-crm/organizations/
├── OrganizationList.tsx          # Source
└── __tests__/
    └── OrganizationList.test.tsx # Test
```

### Test Coverage Verification

| Source File | Test File | Status |
|-------------|-----------|--------|
| OrganizationList.tsx | OrganizationList.test.tsx | MATCHED |
| BulkReassignButton.tsx | BulkReassignButton.test.tsx | MATCHED |
| TaskCreate.tsx | TaskCreate.test.tsx | MATCHED |
| FloatingCreateButton.tsx | FloatingCreateButton.test.tsx | MATCHED |

**All test files have corresponding source files.**

---

## Configuration Files

### Active Configurations

| File | Purpose | Status |
|------|---------|--------|
| vite.config.ts | Build config | ACTIVE |
| vitest.config.ts | Unit test config | ACTIVE |
| vitest.integration.config.ts | Integration tests | ACTIVE |
| playwright.config.ts | E2E tests | ACTIVE |
| eslint.config.js | Linting rules | ACTIVE |
| .prettierrc.mjs | Code formatting | ACTIVE |
| tsconfig.json | TypeScript base | ACTIVE |
| tsconfig.app.json | App TypeScript | ACTIVE |
| tsconfig.node.json | Node TypeScript | ACTIVE |
| components.json | shadcn/ui config | ACTIVE |
| vercel.json | Deployment config | ACTIVE |

### Obsolete Configs

| Config Type | Status |
|-------------|--------|
| Babel (.babelrc) | NOT PRESENT (correct - using Vite) |
| Webpack (webpack.config.js) | NOT PRESENT (correct - using Vite) |
| Jest (jest.config.js) | NOT PRESENT (correct - using Vitest) |

**All configurations are valid and necessary.**

---

## Assets Analysis

### Referenced Assets

All image assets in `public/` and `src/` are referenced by the codebase.

**No unreferenced assets found.**

---

## Type Definitions

### .d.ts Files

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| src/vite-env.d.ts | 1 | Vite types | ESSENTIAL |
| src/emails/vite-env.d.ts | 15 | Email types | USED by Edge Functions |

### Edge Function Types

The `src/emails/` directory is **NOT orphaned**:
- Used by `supabase/functions/daily-digest/`
- Used by `supabase/functions/digest-opt-out/`

---

## Hooks Analysis

### src/hooks/ - All Hooks Active

| Hook | Import Count | Exported in index.ts |
|------|--------------|---------------------|
| useUserRole | 4 | YES |
| useTeamMembers | 3 | YES |
| useSlideOverState | 7 | YES |
| useKeyboardShortcuts | 2 | YES |
| useListKeyboardNavigation | 8 | YES |
| useIsMobile | 6 | YES |
| useBreakpoint | 2 | YES |
| useCityStateMapping | 2 | YES |
| useInAppUnsavedChanges | 2 | YES |
| useDialogError | 1 | YES |
| useBulkExport | 2 | NO (direct import) |
| useUnsavedChangesWarning | 4 | NO (direct import) |
| useSupportCreateSuggestion | 4 | NO (direct import) |
| saved-queries | 4 | NO (direct import) |
| simple-form-iterator-context | 2 | NO (direct import) |

**All hooks are actively used.**

---

## Cleanup Impact Summary

| Category | Count | Size/Lines | Effort |
|----------|-------|------------|--------|
| npm dependencies | 1 | ~15 KB | `npm uninstall` |
| Orphaned files | 0 | 0 | N/A |
| Stale configs | 0 | N/A | N/A |
| Dead assets | 0 | 0 | N/A |
| Dead types | 0 | 0 | N/A |
| **Total** | **1** | **~15 KB** | **<5 min** |

---

## Cleanup Script

```bash
#!/bin/bash
# Crispy CRM - Minimal Dead Code Cleanup

# Remove unused dependency
npm uninstall vite-bundle-visualizer

echo "Cleanup complete! Removed 1 unused dev dependency."

# Verify build still works
npm run build

echo "Build verified. Done."
```

---

## Verification Steps

Before running cleanup:
- [x] Verified `vite-bundle-visualizer` has zero references
- [x] Confirmed `rollup-plugin-visualizer` is the active visualizer
- [x] No files are truly orphaned
- [x] All configs are necessary
- [x] All hooks are used
- [x] All types are used

---

## Recommendations

### Quick Win (< 5 min)
1. **Remove `vite-bundle-visualizer`** - saves ~15KB, cleans up package.json

### Optional Improvements (No urgency)

1. **Consider barrel export consistency** - Some features export all components, others use direct imports. Both patterns work; consistency is optional.

2. **Document import pattern** - Add a comment in CLAUDE.md explaining the mixed barrel/direct import pattern choice.

---

## Conclusion

The Crispy CRM codebase is exceptionally well-maintained with minimal dead code:

| Metric | Status |
|--------|--------|
| Unused production deps | 0 |
| Unused dev deps | 1 (minor) |
| Orphaned source files | 0 |
| Orphaned test files | 0 |
| Stale configurations | 0 |
| Unreferenced assets | 0 |
| Dead types | 0 |

**Overall Grade: A+**

The only actionable item is removing `vite-bundle-visualizer`, which takes less than 5 minutes and has zero risk.
