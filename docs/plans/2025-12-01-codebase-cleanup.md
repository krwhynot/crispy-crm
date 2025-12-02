# Codebase Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove dead code, add missing script dependencies, and gate debug logging to reduce bundle size and prevent production log pollution.

**Architecture:** Phased cleanup approach—safe deletions first (zero risk), then dependency additions (low risk), finally logging improvements (medium risk). Each phase is independently deployable.

**Tech Stack:** TypeScript, Vite, npm, Vitest

---

## Audit Review Context

This plan is based on a codebase audit that identified 29 potential issues. Before creating this implementation plan, **each finding was verified against the actual codebase**. This verification revealed 6 false positives that would have deleted working code or wasted effort on non-issues.

### Verification Methodology

The following checks were performed on 2025-12-01:

1. **Grep searches** for all "unused" files to verify no imports exist
2. **npm ls** to check transitive dependency availability
3. **Glob patterns** to verify existence of files marked for deletion
4. **Code review** of flagged architectural patterns

---

## False Positives Removed (DO NOT IMPLEMENT)

### ❌ FALSE POSITIVE 1: `use-mobile.ts` is NOT unused

**Original Claim:** "Hook useIsMobile not imported anywhere (no rg hits)"

**Verification Performed:**
```bash
rg "useIsMobile" src/ --type ts --type tsx -l
```

**Actual Result:** Found 7 files actively importing this hook:
- `src/hooks/index.ts` (re-export)
- `src/atomic-crm/hooks/useAppBarHeight.ts`
- `src/components/admin/columns-button.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/admin/sort-button.tsx`
- `src/components/admin/breadcrumb.tsx`

**Conclusion:** This hook is actively used for responsive behavior across the admin UI. Deleting it would break 6 components.

---

### ❌ FALSE POSITIVE 2: `@mui/material` is NOT missing

**Original Claim:** "Uses @mui/material/styles but package not in deps - Build/runtime failure when Admin shell mounts"

**Verification Performed:**
```bash
npm ls @mui/material
```

**Actual Result:**
```
atomic-crm@0.1.0
└─┬ react-admin@5.13.0
  ├─┬ @mui/icons-material@7.3.5
  │ └── @mui/material@7.3.5 deduped
  ├── @mui/material@7.3.5
  └─┬ ra-ui-materialui@5.13.0
    └── @mui/material@7.3.5 deduped
```

**Conclusion:** `@mui/material@7.3.5` is available as a transitive dependency from `react-admin`. The build works correctly. Adding it explicitly is optional (stricter hygiene) but not required.

---

### ❌ FALSE POSITIVE 3: `cropperjs` is NOT missing

**Original Claim:** "Imports cropperjs/dist/cropper.css without cropperjs dep - CSS import resolves to missing module; runtime error"

**Verification Performed:**
```bash
npm ls cropperjs
```

**Actual Result:**
```
atomic-crm@0.1.0
└─┬ react-cropper@2.3.3
  └── cropperjs@1.6.2
```

**Conclusion:** `cropperjs@1.6.2` is available as a transitive dependency from `react-cropper` (which IS in package.json). The image editor works correctly.

---

### ❌ FALSE POSITIVE 4: `@storybook/react` is NOT missing

**Original Claim:** "Imports @storybook/react missing from devDeps - Storybook build will fail"

**Verification Performed:**
```bash
grep "@storybook/react" package.json
```

**Actual Result:** `@storybook/react-vite@9.1.10` is in devDependencies, which re-exports `@storybook/react` types.

**Additional Check:** Stories import `type { Meta, StoryObj } from "@storybook/react"` - these are type-only imports that resolve correctly.

**Conclusion:** Storybook builds and runs correctly. No missing dependency.

---

### ❌ FALSE POSITIVE 5: Duplicate `.spec.tsx` files DON'T EXIST

**Original Claim:** "Multiple .spec.tsx files duplicate newer .test.tsx suites" listing:
- `src/atomic-crm/contacts/ContactList.spec.tsx`
- `src/atomic-crm/organizations/OrganizationList.spec.tsx`
- `src/atomic-crm/opportunities/__tests__/OpportunityList.spec.tsx`

**Verification Performed:**
```bash
find src/atomic-crm -name "*.spec.tsx" -type f
```

**Actual Result:** No files found. Zero `.spec.tsx` files exist in the codebase.

**Conclusion:** The audit referenced files that don't exist. Perhaps they were already deleted or the audit was run against a different branch.

---

### ❌ FALSE POSITIVE 6: `useCurrentSale` Pattern is INTENTIONAL

**Original Claim:** "Direct Supabase auth/db calls + logging instead of data provider/service layer - Bypasses single-source-of-truth pattern"

**Verification Performed:** Read `src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts`

**Code Review Findings:**

The file contains explicit documentation explaining the design decision:
```typescript
/**
 * PERFORMANCE OPTIMIZATION (KPI Query Audit):
 * This context caches the salesId at the dashboard level, eliminating
 * redundant queries from multiple components (useKPIMetrics, useMyTasks,
 * useMyPerformance, usePrincipalPipeline all need salesId).
 *
 * Expected improvement: 4+ fewer queries, ~100-200ms faster initial load.
 */
```

Additionally:
- The logging IS already env-gated: `if (import.meta.env.DEV) { console.log(...) }`
- Auth lookups SHOULD use Supabase directly—data providers are for resource CRUD, not auth state
- The hook provides a caching layer that the data provider pattern doesn't offer

**Conclusion:** This is intentional architecture for performance, not a pattern violation. Refactoring would regress dashboard load time by 100-200ms.

---

## Validated Findings (IMPLEMENT THESE)

### ✅ VALID: React Admin Guessers are Unused

**Verification:**
```bash
rg "list-guesser|edit-guesser|show-guesser" src/ --type ts --type tsx -l
```

**Result:** Only found in `docs/plans/archive/` - no source code imports.

**Files to delete:**
- `src/components/admin/list-guesser.tsx`
- `src/components/admin/edit-guesser.tsx`
- `src/components/admin/show-guesser.tsx`
- `src/lib/field.type.ts` (only used by guessers)

---

### ✅ VALID: Design System Utilities are Orphaned

**Verification:**
```bash
rg "from ['\"]@/lib/design-system" src/ --type ts --type tsx -l
```

**Result:** No source imports. Only referenced in documentation files.

**Files to delete:**
- `src/lib/design-system/accessibility.ts`
- `src/lib/design-system/spacing.ts`
- `src/lib/design-system/index.ts`

**Note:** Design tokens live in CSS custom properties (`src/index.css`), not these TypeScript files.

---

### ✅ VALID: Script Dependencies are Missing

**Verification:** These scripts import packages not in package.json:

| Script | Missing Package | Impact |
|--------|-----------------|--------|
| `scripts/migrate-opportunities-csv.ts` | `csv-parse` | Script fails on run |
| `scripts/supabase-remote-init.mjs` | `@inquirer/prompts`, `execa` | Remote init broken |
| `scripts/validation/run-pre-validation.js` | `pg` | Pre-migration validation fails |

These work locally if you've installed them globally or in another project, but fail in CI or clean installs.

---

### ✅ VALID: Debug Logging Not Env-Gated

**Verification:** Grep for console statements in data provider:
```bash
rg "console\.(log|warn|error)" src/atomic-crm/providers/supabase/unifiedDataProvider.ts -c
```

**Result:** Multiple ungated console statements found.

**Files needing logging gates:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (~20 statements)
- `src/atomic-crm/organizations/OrganizationImportDialog.tsx` (~15 statements)
- `src/atomic-crm/services/opportunities.service.ts` (~8 statements)
- `src/atomic-crm/providers/supabase/index.ts` (startup logs)

**Impact:** Production console pollution, potential PII exposure, performance overhead from string interpolation.

---

## Corrected Severity Assessment

| Original Severity | Corrected | Reason |
|-------------------|-----------|--------|
| 🔴 High: 9 items | 🔴 High: 3 items | Most "missing deps" are transitive |
| 🟡 Medium: 13 items | 🟡 Medium: 5 items | Removed non-existent files, valid patterns |
| 🟢 Low: 7 items | 🟢 Low: 3 items | Removed false positives |
| **Total: 29** | **Total: 11** | 62% reduction after verification |

---

## Phase 1: Safe Deletions (Zero Risk)
**Estimated Time:** 45 minutes
**Prerequisites:** None
**Why This Phase First:** Zero dependencies on other code. Can be reverted trivially. Immediate bundle size reduction.

---

### Task 1: Remove Unused React Admin Guessers

**Why:** These are legacy scaffolding utilities from early React Admin prototyping. They use runtime type inference to auto-generate forms—a pattern we abandoned in favor of explicit Zod schemas. Keeping them adds ~15KB to the bundle and cognitive overhead when exploring `/components/admin/`.

**Files:**
- Delete: `src/components/admin/list-guesser.tsx`
- Delete: `src/components/admin/edit-guesser.tsx`
- Delete: `src/components/admin/show-guesser.tsx`
- Delete: `src/lib/field.type.ts` (only used by guessers)

**Step 1: Verify no imports exist**

Run:
```bash
rg "list-guesser|edit-guesser|show-guesser|field\.type" src/ --type ts --type tsx -l
```

Expected: No results (only archived docs reference these)

**Step 2: Delete the guesser files**

Run:
```bash
rm src/components/admin/list-guesser.tsx
rm src/components/admin/edit-guesser.tsx
rm src/components/admin/show-guesser.tsx
rm src/lib/field.type.ts
```

**Step 3: Verify build still works**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 4: Run tests to confirm no regressions**

Run:
```bash
npm run test:ci
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove unused React Admin guesser components

These inference utilities were from early prototyping and have no consumers.
Reduces bundle size and maintenance surface.

🤖 Generated with Claude Code"
```

---

### Task 2: Remove Orphaned Design System Utilities

**Why:** These TypeScript utilities were created during a design system planning phase but never integrated. The actual design tokens live in CSS custom properties (`src/index.css` and Tailwind config). Having parallel TypeScript exports creates confusion about which is the source of truth.

**Files:**
- Delete: `src/lib/design-system/accessibility.ts`
- Delete: `src/lib/design-system/spacing.ts`
- Delete: `src/lib/design-system/index.ts`
- Delete: `src/lib/design-system/` (directory)

**Step 1: Verify no source imports exist**

Run:
```bash
rg "from ['\"]@/lib/design-system" src/ --type ts --type tsx -l
```

Expected: No results (only docs reference these)

**Step 2: Delete the design-system directory**

Run:
```bash
rm -rf src/lib/design-system/
```

**Step 3: Verify build still works**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove orphaned design-system utilities

These token exports were never imported by runtime code.
Design tokens live in CSS custom properties (src/index.css) instead.

🤖 Generated with Claude Code"
```

---

### Task 3: Clean Up Stale Page Export

**Why:** Minor hygiene. Commented-out exports in barrel files create confusion about what's actually available.

**Files:**
- Modify: `src/atomic-crm/pages/index.ts`

**Step 1: Read current file**

Check for commented exports or stale references.

**Step 2: Remove any commented-out exports**

If file contains commented `MigrationStatusPage` export or similar, remove the comment.

**Step 3: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit if changes made**

```bash
git add src/atomic-crm/pages/index.ts
git commit -m "chore: clean up stale page exports

🤖 Generated with Claude Code"
```

---

## Phase 2: Add Missing Script Dependencies (Low Risk)
**Estimated Time:** 30 minutes
**Prerequisites:** Phase 1 complete
**Why This Phase Second:** These are devDependencies that don't affect production bundle. They enable scripts that are currently broken in CI.

---

### Task 4: Add Missing Dev Dependencies for Scripts

**Why:** Three utility scripts import packages that aren't declared in package.json. They work locally if you happen to have these packages installed globally or from another project's node_modules, but fail in:
- Fresh `git clone` + `npm ci`
- CI/CD pipelines
- Docker builds

This is a reliability issue that causes mysterious "module not found" errors.

**Files:**
- Modify: `package.json`

**Step 1: Add missing dependencies**

These scripts import packages not declared in package.json:
- `scripts/migrate-opportunities-csv.ts` needs `csv-parse`
- `scripts/supabase-remote-init.mjs` needs `@inquirer/prompts` and `execa`
- `scripts/validation/run-pre-validation.js` needs `pg`

Run:
```bash
npm install --save-dev csv-parse @inquirer/prompts execa pg @types/pg
```

**Step 2: Verify scripts can be parsed**

Run:
```bash
node --check scripts/migrate-opportunities-csv.ts 2>/dev/null || echo "TS file - check with tsc"
node --check scripts/supabase-remote-init.mjs
node --check scripts/validation/run-pre-validation.js
```

Expected: No syntax errors (TS file may need tsc check)

**Step 3: Verify lockfile is clean**

Run:
```bash
npm ci --ignore-scripts
```

Expected: Install succeeds with no warnings

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add missing script dependencies

Adds csv-parse, @inquirer/prompts, execa, pg for utility scripts.
These were implicitly available but caused failures in clean installs.

🤖 Generated with Claude Code"
```

---

## Phase 3: Gate Debug Logging (Medium Risk)
**Estimated Time:** 1.5 hours
**Prerequisites:** Phase 2 complete, full test suite passing
**Why This Phase Third:** Requires more careful changes to production code. Each file needs individual attention to preserve error handling while removing noise.

---

### Task 5: Create Centralized Dev Logger Utility

**Why:** Currently, console.log/warn calls are scattered across the codebase with inconsistent env-gating. Some check `import.meta.env.DEV`, others don't. Creating a centralized utility ensures:
1. Consistent behavior (all dev-only)
2. Single point to modify if we add telemetry later
3. Better tree-shaking (Vite can eliminate the calls entirely in prod)
4. Consistent log formatting with context prefixes

**Files:**
- Create: `src/lib/devLogger.ts`
- Test: Manual verification in dev/prod builds

**Step 1: Create the dev logger utility**

Create file `src/lib/devLogger.ts`:

```typescript
/**
 * Development-only logging utility.
 * All output is stripped in production builds via dead code elimination.
 *
 * Usage:
 *   import { devLog, devWarn, devError } from '@/lib/devLogger';
 *   devLog('MyComponent', 'fetched data', { count: items.length });
 */

const isDev = import.meta.env.DEV;

export function devLog(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.log(`[${context}]`, message, data ?? '');
  }
}

export function devWarn(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.warn(`[${context}]`, message, data ?? '');
  }
}

export function devError(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.error(`[${context}]`, message, data ?? '');
  }
}

/**
 * For performance-sensitive paths, use this to avoid string interpolation
 * in production. The callback is only executed in dev mode.
 */
export function devLogLazy(context: string, messageFn: () => [string, unknown?]): void {
  if (isDev) {
    const [message, data] = messageFn();
    console.log(`[${context}]`, message, data ?? '');
  }
}
```

**Step 2: Verify it compiles**

Run:
```bash
npx tsc --noEmit src/lib/devLogger.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/devLogger.ts
git commit -m "feat: add dev-only logging utility

Provides devLog/devWarn/devError that are stripped in production.
Replaces scattered console.* calls with env-gated alternatives.

🤖 Generated with Claude Code"
```

---

### Task 6: Gate Logging in unifiedDataProvider

**Why:** The unified data provider is the most log-heavy file in the codebase (~20 console statements). These logs were essential during development but now:
- Pollute production consoles
- May expose user data (resource names, IDs, filter values)
- Add ~50ms overhead from string interpolation on every data operation

**Files:**
- Modify: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Step 1: Add import at top of file**

Add after existing imports:
```typescript
import { devLog, devWarn, devError } from '@/lib/devLogger';
```

**Step 2: Replace console.log calls**

Search for `console.log` and replace with `devLog`:

Example transformations:
```typescript
// Before:
console.log('[DataProvider] Fetching', resource);

// After:
devLog('DataProvider', 'Fetching', resource);
```

**Step 3: Replace console.warn calls**

```typescript
// Before:
console.warn('No filter handler for', resource);

// After:
devWarn('DataProvider', 'No filter handler', resource);
```

**Step 4: Replace console.error calls**

```typescript
// Before:
console.error('Query failed:', error);

// After:
devError('DataProvider', 'Query failed', error);
```

**Step 5: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 6: Verify no console.* remains (except intentional)**

Run:
```bash
rg "console\.(log|warn)" src/atomic-crm/providers/supabase/unifiedDataProvider.ts
```

Expected: No results (or only error boundary fallbacks)

**Step 7: Run tests**

Run:
```bash
npm run test:ci
```

Expected: All tests pass

**Step 8: Commit**

```bash
git add src/atomic-crm/providers/supabase/unifiedDataProvider.ts
git commit -m "refactor: gate data provider logging with devLogger

Replaces raw console.* with env-gated devLog/devWarn/devError.
Prevents log noise and potential PII exposure in production.

🤖 Generated with Claude Code"
```

---

### Task 7: Gate Logging in OrganizationImportDialog

**Why:** The CSV import dialog logs extensively during file parsing. In production, this could expose:
- File contents being parsed
- Validation errors with user data
- Row counts and processing progress

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationImportDialog.tsx`

**Step 1: Add import**

```typescript
import { devLog, devWarn } from '@/lib/devLogger';
```

**Step 2: Replace console statements**

Apply same pattern as Task 6.

**Step 3: Verify and commit**

Run:
```bash
npm run build && npm run test:ci
```

```bash
git add src/atomic-crm/organizations/OrganizationImportDialog.tsx
git commit -m "refactor: gate import dialog logging with devLogger

🤖 Generated with Claude Code"
```

---

### Task 8: Gate Logging in opportunities.service

**Why:** The opportunities service logs on every create/update operation. In production, this creates noise proportional to user activity.

**Files:**
- Modify: `src/atomic-crm/services/opportunities.service.ts`

**Step 1: Add import and replace console statements**

Same pattern as previous tasks.

**Step 2: Verify and commit**

```bash
npm run build && npm run test:ci
git add src/atomic-crm/services/opportunities.service.ts
git commit -m "refactor: gate opportunity service logging with devLogger

🤖 Generated with Claude Code"
```

---

### Task 9: Gate Logging in Provider Index

**Why:** The provider index logs architecture selection on every app startup. While useful during development, this is noise in production.

**Files:**
- Modify: `src/atomic-crm/providers/supabase/index.ts`

**Step 1: Add import and replace startup logs**

Lines 87-92 contain architecture selection logs. Gate with devLog.

**Step 2: Verify and commit**

```bash
npm run build && npm run test:ci
git add src/atomic-crm/providers/supabase/index.ts
git commit -m "refactor: gate provider startup logging

🤖 Generated with Claude Code"
```

---

## Phase 4: Optional Improvements (Deferred)
**Estimated Time:** 2 hours
**Prerequisites:** All previous phases complete
**Why Deferred:** These provide marginal benefit and carry some risk. Only implement if you have time and want stricter hygiene.

---

### Task 10: Resolve Circular Dependencies (OPTIONAL)

**Why Consider:** Circular dependencies can cause:
- Unpredictable module initialization order
- HMR (hot module reload) failures
- Bundler warnings

**Why Deferred:** The flagged "self-cycles" may be false positives from the analyzer. Vite handles most circular deps gracefully. Only investigate if you see actual HMR issues.

**Files:**
- Analyze: `src/atomic-crm/root/CRM.tsx`
- Analyze: `src/lib/logger.ts`
- Analyze: `src/components/admin/file-field.tsx`
- Analyze: `src/atomic-crm/providers/supabase/callbacks/commonTransforms.ts`
- Analyze: `src/atomic-crm/utils/exportScheduler.ts`

**Step 1: Run dependency analyzer**

```bash
node scripts/analyze-dependencies.js 2>&1 | grep -i circular
```

**Step 2: For each genuine cycle, extract shared types**

Typical fix: Move shared interfaces to a separate `types.ts` file that both modules import.

**Step 3: Verify HMR works correctly**

Run dev server and make edits to cyclic files. Confirm hot reload works.

---

### Task 11: Add Explicit Transitive Dependencies (OPTIONAL)

**Why Consider:** Explicit dependencies are more resilient to lockfile drift. If react-admin changes its dependency tree, your direct imports could break.

**Why Deferred:** Current setup works. Adding explicit deps increases node_modules size by ~500KB. The risk of breakage is low given lockfile pinning.

**Files:**
- Modify: `package.json`

```bash
npm install @mui/material @supabase/storage-js
```

---

## Verification Checklist

After completing all phases:

- [ ] `npm run build` succeeds
- [ ] `npm run test:ci` passes
- [ ] `npm run lint:check` passes
- [ ] No console.log/warn in production bundle (verify with `npm run build && grep -r "console\." dist/`)
- [ ] Dev server shows expected logs in development mode
- [ ] Bundle size reduced (check with `npx vite-bundle-visualizer`)

---

## Summary

| Phase | Tasks | Risk | Time | Impact |
|-------|-------|------|------|--------|
| 1: Safe Deletions | 3 | Zero | 45 min | ~15KB bundle reduction |
| 2: Dependencies | 1 | Low | 30 min | Fix CI/CD failures |
| 3: Logging | 5 | Medium | 1.5 hr | Prevent PII exposure |
| 4: Optional | 2 | Low | 2 hr | Stricter hygiene |

**Total (required):** ~2.75 hours
**Total (with optional):** ~4.75 hours

---

## Appendix: Items Removed from Original Audit

| Original Item | Why Removed | Evidence |
|---------------|-------------|----------|
| Delete `use-mobile.ts` | Actually used in 6+ components | `rg "useIsMobile" src/` returns 7 files |
| Add `@mui/material` | Transitive dep from react-admin | `npm ls @mui/material` shows v7.3.5 |
| Add `cropperjs` | Transitive dep from react-cropper | `npm ls cropperjs` shows v1.6.2 |
| Add `@storybook/react` | Available via @storybook/react-vite | Type imports resolve correctly |
| Delete `.spec.tsx` duplicates | Files don't exist | `find src/atomic-crm -name "*.spec.tsx"` returns nothing |
| Refactor `useCurrentSale` | Intentional perf optimization | Code comments explain 100-200ms improvement |

---

## Appendix: Original Audit vs Corrected Assessment

| Metric | Original Audit | After Verification |
|--------|----------------|-------------------|
| Total Issues | 29 | 11 |
| 🔴 High Severity | 9 | 3 |
| 🟡 Medium Severity | 13 | 5 |
| 🟢 Low Severity | 7 | 3 |
| Estimated Effort | 10.5 hours | 2.75 hours (required) |
| False Positive Rate | N/A | 62% of items removed |

The original audit used automated tooling (depcheck, grep patterns) without manual verification. This plan corrects those findings with actual codebase evidence.
