# Lint Cleanup - Hybrid Approach (Delete Safe + Prefix Uncertain)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 181 lint errors (162 errors, 19 warnings) across 76 files using hybrid approach - delete obviously dead code, prefix with `_` for work-in-progress features, fix all other categories systematically.

**Architecture:** Category-by-category systematic fix: (1) Unused variables with hybrid delete/prefix, (2) React hooks dependencies, (3) Accessibility issues, (4) Type imports, (5) Misc issues. Each category has verification steps between batches to prevent breakage.

**Tech Stack:** ESLint, TypeScript ESLint, React Hooks ESLint, jsx-a11y, React Refresh

---

## Pre-Implementation

### Task 0: Baseline Verification

**Files:**
- None (verification only)

**Step 1: Capture current lint baseline**

Run: `npm run lint:check 2>&1 | tee baseline-lint-errors.txt`

Expected: 181 problems (162 errors, 19 warnings)

**Step 2: Verify tests pass before changes**

Run: `npm test -- --run`

Expected: All tests passing

**Step 3: Create feature branch**

```bash
git checkout -b fix/lint-cleanup-hybrid
```

**Step 4: Commit baseline for reference**

```bash
git add baseline-lint-errors.txt
git commit -m "docs: capture lint error baseline (181 issues)"
```

---

## Category 1: Unused Variables (120 errors) - Hybrid Approach

### Task 1.1: Scripts - Delete Dead Imports/Vars

**Files:**
- Modify: `scripts/dev/create-test-users-http.mjs:99,231`
- Modify: `scripts/dev/create-test-users.mjs:19`
- Modify: `scripts/migrate-opportunities-csv.ts:37,197,277`
- Modify: `scripts/test-csv-import.mjs:232`
- Modify: `scripts/validate-provider-consolidation.ts:207,215,223,244`

**Context:** Scripts folder - most are one-off utilities or migration scripts. Delete obviously unused code since these aren't active features.

**Step 1: Fix create-test-users-http.mjs**

In `scripts/dev/create-test-users-http.mjs`:

Line 99: Delete `listAuthUsers` (function defined but never called)
Line 231: Change `} catch (err) {` to `} catch {` (error not used)

**Step 2: Fix create-test-users.mjs**

In `scripts/dev/create-test-users.mjs`:

Line 19: Remove `import { createHash } from 'crypto';` (never used)

**Step 3: Fix migrate-opportunities-csv.ts**

In `scripts/migrate-opportunities-csv.ts`:

Line 37: Change `} catch (error) {` to `} catch {`
Line 197: Delete line `const priority = ...` (assigned but never used)
Line 277: Change `(error) =>` to `() =>` in callback

**Step 4: Fix test-csv-import.mjs**

In `scripts/test-csv-import.mjs`:

Line 232: Delete entire `importContactsWithoutContactInfo` constant definition

**Step 5: Fix validate-provider-consolidation.ts**

In `scripts/validate-provider-consolidation.ts`:

Lines 207, 215, 223, 244: All have `_error` that's defined but not used - these should be deleted entirely (remove the variable destructuring)

**Step 6: Verify no regressions**

Run: `npm run lint:check 2>&1 | grep scripts/ | wc -l`

Expected: 0 errors in scripts folder (was ~10)

**Step 7: Commit**

```bash
git add scripts/
git commit -m "fix(lint): remove unused vars in scripts folder

- Delete dead imports and unused function definitions
- Simplify catch blocks with unused error params
- Reduces lint errors by ~10"
```

---

### Task 1.2: Contacts - Prefix WIP Import Features

**Files:**
- Modify: `src/atomic-crm/contacts/ContactEmpty.tsx:3`
- Modify: `src/atomic-crm/contacts/ContactImportDialog.tsx:28,282`
- Modify: `src/atomic-crm/contacts/ContactImportPreview.tsx:120`
- Modify: `src/atomic-crm/contacts/ContactList.tsx:14,15`
- Modify: `src/atomic-crm/contacts/useContactImport.tsx:5,6`

**Context:** Contact import feature appears to be work-in-progress. Prefix with `_` to preserve for future completion.

**Step 1: Prefix ContactImportButton in ContactEmpty.tsx**

In `src/atomic-crm/contacts/ContactEmpty.tsx` line 3:

Change:
```typescript
import { ContactImportButton } from './ContactImportButton';
```

To:
```typescript
import { ContactImportButton as _ContactImportButton } from './ContactImportButton';
```

**Step 2: Prefix ContactImportButton in ContactList.tsx**

In `src/atomic-crm/contacts/ContactList.tsx` lines 14-15:

Change:
```typescript
import { ContactImportButton } from './ContactImportButton';
import { ContactExportTemplateButton } from './ContactExportTemplateButton';
```

To:
```typescript
import { ContactImportButton as _ContactImportButton } from './ContactImportButton';
import { ContactExportTemplateButton as _ContactExportTemplateButton } from './ContactExportTemplateButton';
```

**Step 3: Fix ContactImportDialog.tsx**

In `src/atomic-crm/contacts/ContactImportDialog.tsx`:

Line 28: Change `import { useEffect } from 'react';` - remove `useEffect` from import or delete entire import if it's the only one
Line 282: Change function signature from `(current, total) =>` to `() =>` (params not used)

**Step 4: Prefix getConfidenceIcon in ContactImportPreview.tsx**

In `src/atomic-crm/contacts/ContactImportPreview.tsx` line 120:

Change:
```typescript
const getConfidenceIcon = ...
```

To:
```typescript
const _getConfidenceIcon = ...
```

**Step 5: Prefix useContactImport utilities**

In `src/atomic-crm/contacts/useContactImport.tsx` lines 5-6:

Change:
```typescript
import { mapHeadersToFields, isFullNameColumn, findCanonicalField } from './helpers';
import { importContactSchema } from './validation';
```

To:
```typescript
import { mapHeadersToFields as _mapHeadersToFields, isFullNameColumn as _isFullNameColumn, findCanonicalField as _findCanonicalField } from './helpers';
import { importContactSchema as _importContactSchema } from './validation';
```

**Step 6: Verify contacts module still works**

Run: `npm test -- --run src/atomic-crm/contacts`

Expected: All contact tests pass

**Step 7: Commit**

```bash
git add src/atomic-crm/contacts/
git commit -m "fix(lint): prefix unused contact import feature code with _

- Preserves WIP import functionality for future completion
- All imports prefixed with _ to satisfy lint rules
- Reduces lint errors by ~10"
```

---

### Task 1.3: Contacts Tests - Delete Mock Functions

**Files:**
- Modify: `src/atomic-crm/contacts/__tests__/ContactCreate.test.tsx:10,11`
- Modify: `src/atomic-crm/contacts/__tests__/ContactList.test.tsx:14,18,55,363,424`
- Modify: `src/atomic-crm/contacts/useContactFilterChips.ts:47`

**Context:** Test files with unused mocks and test utilities - safe to delete.

**Step 1: Fix ContactCreate.test.tsx**

In `src/atomic-crm/contacts/__tests__/ContactCreate.test.tsx` lines 10-11:

Remove these imports entirely:
```typescript
createMockContact,
createMockOrganization,
```

**Step 2: Fix ContactList.test.tsx**

In `src/atomic-crm/contacts/__tests__/ContactList.test.tsx`:

Line 14: Remove `downloadCSV` from imports
Line 18: Change `import()` to `import type()` for type-only import
Line 55: Change `(value, multiselect) =>` to `() =>`
Line 363: Change `} catch (e) {` to `} catch {`
Line 424: Change `(fetchRelatedRecords) =>` to `() =>`

**Step 3: Fix useContactFilterChips.ts**

In `src/atomic-crm/contacts/useContactFilterChips.ts` line 47:

Change callback signature from `(salesId) =>` to `() =>`

**Step 4: Verify tests still pass**

Run: `npm test -- --run src/atomic-crm/contacts/__tests__/`

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/__tests__/ src/atomic-crm/contacts/useContactFilterChips.ts
git commit -m "fix(lint): remove unused test mocks and callback params in contacts

- Delete unused mock factory imports
- Fix unused callback parameters
- Convert to type-only imports where appropriate"
```

---

### Task 1.4: Opportunities - Prefix and Cleanup

**Files:**
- Modify: `src/atomic-crm/opportunities/OpportunityEdit.tsx:14`
- Modify: `src/atomic-crm/opportunities/OpportunityShow.spec.tsx:184`
- Modify: `src/atomic-crm/opportunities/__tests__/OpportunityCreate.unit.test.tsx:10,11,229`
- Modify: `src/atomic-crm/opportunities/__tests__/OpportunityEdit.unit.test.tsx:303`
- Modify: `src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx` (various)

**Step 1: Prefix NoteCreate in OpportunityEdit.tsx**

In `src/atomic-crm/opportunities/OpportunityEdit.tsx` line 14:

Change:
```typescript
import { NoteCreate } from '../notes/NoteCreate';
```

To:
```typescript
import { NoteCreate as _NoteCreate } from '../notes/NoteCreate';
```

**Step 2: Fix OpportunityShow.spec.tsx**

In `src/atomic-crm/opportunities/OpportunityShow.spec.tsx` line 184:

Change callback `(params) =>` to `() =>`

**Step 3: Fix OpportunityCreate.unit.test.tsx**

In `src/atomic-crm/opportunities/__tests__/OpportunityCreate.unit.test.tsx`:

Line 10: Remove `vi` from import (keeping only what's used)
Line 11: Remove `createMockOpportunity` import
Line 229: Change `} catch (error) {` to `} catch {`

**Step 4: Fix OpportunityEdit.unit.test.tsx**

In `src/atomic-crm/opportunities/__tests__/OpportunityEdit.unit.test.tsx` line 303:

Change `} catch (error) {` to `} catch {`

**Step 5: Check for OpportunityList.test.tsx issues**

Read file and fix any remaining unused var issues (likely similar patterns)

**Step 6: Verify opportunity tests pass**

Run: `npm test -- --run src/atomic-crm/opportunities`

Expected: All tests pass

**Step 7: Commit**

```bash
git add src/atomic-crm/opportunities/
git commit -m "fix(lint): clean up unused vars in opportunities module

- Prefix WIP NoteCreate import
- Remove unused test imports
- Simplify unused catch params"
```

---

### Task 1.5: Organizations - Cleanup Imports

**Files:**
- Modify: `src/atomic-crm/organizations/` (multiple files with unused imports/vars)

**Step 1: Read and catalog organization errors**

Run: `cat /tmp/lint-errors.txt | grep organizations/`

**Step 2: Apply same patterns as contacts/opportunities**

- Delete unused imports in test files
- Prefix WIP import features with `_`
- Simplify unused callback params to `() =>`
- Change unused catch params to bare `catch {}`

**Step 3: Fix each file systematically**

(Apply fixes based on error patterns - similar to previous tasks)

**Step 4: Verify organization tests**

Run: `npm test -- --run src/atomic-crm/organizations`

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/atomic-crm/organizations/
git commit -m "fix(lint): clean up unused vars in organizations module"
```

---

### Task 1.6: Provider and Services - Technical Cleanup

**Files:**
- Modify: `src/atomic-crm/providers/supabase/__tests__/dataProviderUtils.escape.test.ts`
- Modify: `src/atomic-crm/providers/supabase/dataProvider.spec.ts`
- Modify: `src/atomic-crm/providers/supabase/dataProviderUtils.ts`
- Modify: `src/atomic-crm/providers/supabase/services/StorageService.ts`
- Modify: `src/atomic-crm/providers/supabase/services/ValidationService.ts`
- Modify: `src/atomic-crm/providers/supabase/unifiedDataProvider.backup.ts`
- Modify: `src/atomic-crm/providers/supabase/unifiedDataProvider.test.ts`
- Modify: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Context:** Core provider code - be conservative. Prefix anything uncertain.

**Step 1: Analyze provider errors**

Run: `cat /tmp/lint-errors.txt | grep providers/`

**Step 2: Apply conservative fixes**

- Test files: delete unused mocks/imports
- Production files: prefix with `_` if uncertain
- Catch blocks: only simplify if error truly unused

**Step 3: Fix each file**

(Follow same patterns as before, but more conservative)

**Step 4: Verify provider tests**

Run: `npm test -- --run src/atomic-crm/providers`

Expected: All tests pass

**Step 5: Verify integration tests**

Run: `npm test -- --run src/atomic-crm/tests`

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/atomic-crm/providers/ src/atomic-crm/services/
git commit -m "fix(lint): clean up unused vars in data providers and services

- Conservative approach for core infrastructure
- Prefix uncertain code with _
- Delete obvious dead code in tests"
```

---

### Task 1.7: Components - UI and Admin

**Files:**
- Modify: `src/components/admin/__tests__/*.tsx` (multiple test files)
- Modify: `src/components/admin/*.tsx` (various component files)
- Modify: `src/components/ui/*.tsx` (various UI components)
- Modify: `src/components/supabase/*.tsx` (auth pages)

**Step 1: Fix admin test files**

Apply standard test file cleanup:
- Remove unused imports
- Simplify unused callback params
- Delete unused mock functions

**Step 2: Fix admin components**

- Prefix WIP features with `_`
- Remove dead imports
- Fix unused destructured props

**Step 3: Fix UI components**

(Same patterns)

**Step 4: Fix Supabase auth components**

(Same patterns)

**Step 5: Verify component tests**

Run: `npm test -- --run src/components`

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/components/
git commit -m "fix(lint): clean up unused vars in UI and admin components"
```

---

### Task 1.8: Remaining Files - Misc Cleanup

**Files:**
- Modify: `src/atomic-crm/misc/usePapaParse.tsx:145`
- Modify: `src/atomic-crm/tasks/AddTask.tsx`
- Modify: `src/atomic-crm/tasks/TaskEdit.tsx`
- Modify: `src/atomic-crm/validation/tasks.ts`
- Modify: `src/atomic-crm/validation/__tests__/notes/*.test.ts`
- Modify: `src/tests/integration/auth-flow.test.ts`

**Step 1: Apply standard cleanup patterns to each file**

**Step 2: Verify all tests still pass**

Run: `npm test -- --run`

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/misc/ src/atomic-crm/tasks/ src/atomic-crm/validation/ src/tests/
git commit -m "fix(lint): clean up remaining unused var issues"
```

---

### Task 1.9: Verify Category 1 Complete

**Files:**
- None (verification only)

**Step 1: Check unused vars are fixed**

Run: `npm run lint:check 2>&1 | grep -E "no-unused-vars|@typescript-eslint/no-unused-vars" | wc -l`

Expected: 0 unused var errors (was 120)

**Step 2: Verify app still runs**

Run: `npm run dev` (let it start, then Ctrl+C)

Expected: App starts without errors

**Step 3: Quick smoke test**

Run: `npm run test:smoke` (if exists) or manual verification

Expected: Core functionality works

---

## Category 2: React Hooks Dependencies (9 warnings)

### Task 2.1: Fix useOrganizationNames Hook

**Files:**
- Modify: `src/atomic-crm/filters/useOrganizationNames.ts:49`

**Context:** Missing `organizationIds` in dependency array

**Step 1: Read current implementation**

Run: `cat src/atomic-crm/filters/useOrganizationNames.ts | grep -A 10 -B 5 "useEffect"`

**Step 2: Add missing dependency**

In `src/atomic-crm/filters/useOrganizationNames.ts` line 49:

Change:
```typescript
}, []); // Missing organizationIds
```

To:
```typescript
}, [organizationIds]); // Fixed: added missing dependency
```

**Step 3: Verify hook works correctly**

Run: `npm test -- --run src/atomic-crm/filters/useOrganizationNames`

Expected: Tests pass (if exists) or no runtime errors

**Step 4: Commit**

```bash
git add src/atomic-crm/filters/useOrganizationNames.ts
git commit -m "fix(lint): add missing organizationIds to useEffect deps"
```

---

### Task 2.2: Fix useSalesNames Hook

**Files:**
- Modify: `src/atomic-crm/filters/useSalesNames.ts:49`

**Step 1: Add missing dependency**

In `src/atomic-crm/filters/useSalesNames.ts` line 49:

Change dependency array from `[]` to `[salesIds]`

**Step 2: Verify**

Run: `npm test -- --run src/atomic-crm/filters`

Expected: Tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/filters/useSalesNames.ts
git commit -m "fix(lint): add missing salesIds to useEffect deps"
```

---

### Task 2.3: Fix useTagNames Hook

**Files:**
- Modify: `src/atomic-crm/filters/useTagNames.ts:50`

**Context:** Multiple missing deps AND complex expression in deps array

**Step 1: Read implementation**

Run: `cat src/atomic-crm/filters/useTagNames.ts | grep -A 15 -B 10 "useEffect"`

**Step 2: Extract complex expression to variable**

Before the useEffect, add:
```typescript
const tagIdsKey = JSON.stringify(tagIds.sort());
```

**Step 3: Fix dependency array**

Change:
```typescript
}, [JSON.stringify(tagIds.sort())]); // Complex expression
```

To:
```typescript
}, [dataProvider, tagIds, tagMap, tagIdsKey]); // All dependencies
```

**Step 4: Verify**

Run: `npm test -- --run src/atomic-crm/filters/useTagNames`

Expected: Tests pass

**Step 5: Commit**

```bash
git add src/atomic-crm/filters/useTagNames.ts
git commit -m "fix(lint): fix useTagNames hook dependencies

- Extract complex expression to variable
- Add all missing dependencies to useEffect"
```

---

### Task 2.4: Fix Remaining Hook Dependencies

**Files:**
- Modify: `src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx:26` (useMemo)
- Modify: `src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx:388` (unnecessary dep)
- Modify: `src/atomic-crm/organizations/OrganizationListFilter.tsx:61` (useMemo)
- Modify: `src/components/admin/saved-queries.tsx:127` (useCallback)

**Step 1: Fix each hook dependency issue**

For missing dependencies: add them to the array
For unnecessary dependencies: remove them
For complex expressions: extract to variables first

**Step 2: Verify tests**

Run: `npm test -- --run`

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/opportunities/__tests__/ src/atomic-crm/organizations/ src/components/admin/
git commit -m "fix(lint): fix remaining React hooks dependency warnings"
```

---

### Task 2.5: Verify Category 2 Complete

**Files:**
- None (verification only)

**Step 1: Check hooks warnings are fixed**

Run: `npm run lint:check 2>&1 | grep "react-hooks/exhaustive-deps" | wc -l`

Expected: 0 hooks errors (was 9)

---

## Category 3: Accessibility (11 errors)

### Task 3.1: Remove autoFocus Props

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationImportDialog.tsx:140`
- Modify: `src/atomic-crm/organizations/OrganizationListFilter.tsx:52`
- Modify: `src/components/admin/filter-form.tsx:338`
- Modify: `src/components/admin/number-input.tsx:82`
- Modify: `src/components/admin/saved-queries.tsx:150`

**Context:** autoFocus reduces usability/accessibility - should be removed

**Step 1: Remove all autoFocus props**

In each file listed, find and remove the `autoFocus` prop:

Change:
```typescript
<Input autoFocus placeholder="..." />
```

To:
```typescript
<Input placeholder="..." />
```

**Step 2: Verify app still usable**

Run: `npm run dev` and manually test forms

Expected: Forms still work, just without auto-focus

**Step 3: Commit**

```bash
git add src/atomic-crm/organizations/ src/components/admin/
git commit -m "fix(a11y): remove autoFocus props to improve accessibility

- AutoFocus reduces usability for keyboard/screen reader users
- Forms remain functional without auto-focus"
```

---

### Task 3.2: Fix Interactive Element Accessibility

**Files:**
- Modify: `src/components/admin/select-input.tsx:119` (role="option" needs aria-selected)
- Modify: `src/components/ui/sidebar.tsx:459` (menuitemcheckbox needs keyboard listener + focus)
- Modify: `src/components/ui/pagination.tsx:249` (button role needs tabindex)

**Step 1: Fix select-input option role**

In `src/components/admin/select-input.tsx` line 119:

Add `aria-selected` attribute:
```typescript
<div role="option" aria-selected={isSelected}>
```

**Step 2: Fix sidebar menuitemcheckbox**

In `src/components/ui/sidebar.tsx` line 459:

Add keyboard listener and make focusable:
```typescript
<div
  role="menuitemcheckbox"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.currentTarget.click();
    }
  }}
  onClick={...}
>
```

**Step 3: Fix pagination button**

In `src/components/ui/pagination.tsx` line 249:

Add tabIndex:
```typescript
<div role="button" tabIndex={0} onClick={...} onKeyDown={...}>
```

**Step 4: Verify accessibility**

Run: `npm run dev` and test keyboard navigation

Expected: All interactive elements keyboard accessible

**Step 5: Commit**

```bash
git add src/components/admin/select-input.tsx src/components/ui/sidebar.tsx src/components/ui/pagination.tsx
git commit -m "fix(a11y): make interactive elements keyboard accessible

- Add aria-selected to option role
- Add keyboard listeners to click handlers
- Add tabIndex for focusable elements"
```

---

### Task 3.3: Fix Anchor Content

**Files:**
- Modify: `src/components/ui/navigation-menu.tsx:53`

**Step 1: Add accessible content to anchor**

In `src/components/ui/navigation-menu.tsx` line 53:

Change:
```typescript
<a href={...} />
```

To:
```typescript
<a href={...} aria-label="Navigation link">{children}</a>
```

Or add visual content that screen readers can access.

**Step 2: Verify navigation works**

Run: `npm run dev` and check navigation

Expected: Navigation still works with accessible content

**Step 3: Commit**

```bash
git add src/components/ui/navigation-menu.tsx
git commit -m "fix(a11y): add accessible content to navigation anchor"
```

---

### Task 3.4: Verify Category 3 Complete

**Files:**
- None (verification only)

**Step 1: Check a11y errors fixed**

Run: `npm run lint:check 2>&1 | grep "jsx-a11y" | wc -l`

Expected: 0 accessibility errors (was 11)

---

## Category 4: Type Imports (3 errors)

### Task 4.1: Convert to Type-Only Imports

**Files:**
- Modify: `src/atomic-crm/contacts/__tests__/ContactList.test.tsx:18`
- Modify: Other files with `@typescript-eslint/consistent-type-imports` errors

**Step 1: Find all type import violations**

Run: `cat /tmp/lint-errors.txt | grep "consistent-type-imports"`

**Step 2: Convert to type-only imports**

Change:
```typescript
import { SomeType } from './module';
```

To:
```typescript
import type { SomeType } from './module';
```

**Step 3: Verify builds**

Run: `npm run build`

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/
git commit -m "fix(lint): convert to type-only imports for consistency"
```

---

## Category 5: Miscellaneous (remaining errors)

### Task 5.1: Fix Control Regex

**Files:**
- Modify: `scripts/generate-seed.ts:65`

**Context:** Control characters in regex

**Step 1: Read the regex**

Run: `cat scripts/generate-seed.ts | grep -A 3 -B 3 "no-control-regex"`

**Step 2: Escape control characters or use \s**

Change problematic regex to use proper escapes or character classes

**Step 3: Verify script still works**

Run: `npm run generate:seed` (if safe to run)

**Step 4: Commit**

```bash
git add scripts/generate-seed.ts
git commit -m "fix(lint): fix control character regex in seed generator"
```

---

### Task 5.2: Fix React Refresh Exports

**Files:**
- Modify: `src/atomic-crm/opportunities/LeadSourceInput.tsx:3`
- Modify: Other files with `react-refresh/only-export-components` warnings

**Context:** Files should only export components for fast refresh

**Step 1: Move constants to separate file**

Create `src/atomic-crm/opportunities/constants.ts` and move exported constants there

**Step 2: Update imports**

Update files that import these constants

**Step 3: Verify app still works**

Run: `npm run dev`

Expected: Fast refresh works correctly

**Step 4: Commit**

```bash
git add src/atomic-crm/opportunities/
git commit -m "fix(lint): move constants to separate files for fast refresh"
```

---

### Task 5.3: Fix Ban TS Comment

**Files:**
- Find files with `@typescript-eslint/ban-ts-comment` errors

**Step 1: Find violations**

Run: `cat /tmp/lint-errors.txt | grep "ban-ts-comment"`

**Step 2: Remove or justify ts-ignore comments**

Either:
- Fix the underlying type issue
- Add `// eslint-disable-next-line` with explanation if truly necessary

**Step 3: Commit**

```bash
git add <files>
git commit -m "fix(lint): remove or justify TypeScript comment suppressions"
```

---

## Final Verification

### Task 6.1: Complete Lint Check

**Files:**
- None (verification only)

**Step 1: Run full lint check**

Run: `npm run lint`

Expected: ✓ 0 problems (0 errors, 0 warnings)

**Step 2: Verify all tests pass**

Run: `npm test -- --run`

Expected: All tests pass

**Step 3: Verify build succeeds**

Run: `npm run build`

Expected: Build completes successfully

**Step 4: Verify app runs**

Run: `npm run dev` and test core features:
- Login
- View contacts
- View opportunities
- View organizations
- Create new records

Expected: All core features work

---

### Task 6.2: Final Commit and Summary

**Files:**
- Create: `docs/lint-cleanup-summary.md`

**Step 1: Create summary document**

Create `docs/lint-cleanup-summary.md`:

```markdown
# Lint Cleanup Summary - 2025-11-01

## Results

**Before:** 181 problems (162 errors, 19 warnings)
**After:** 0 problems (0 errors, 0 warnings)

## Approach

Hybrid strategy: Delete safe code + prefix uncertain code with `_`

### Categories Fixed

1. **Unused Variables (120)**: Deleted dead imports/vars, prefixed WIP features
2. **React Hooks (9)**: Added missing dependencies, extracted complex expressions
3. **Accessibility (11)**: Removed autoFocus, added keyboard support, ARIA attrs
4. **Type Imports (3)**: Converted to type-only imports
5. **Miscellaneous (38)**: Fixed regex, fast refresh exports, TS comments

## Code Preserved with `_` Prefix

Features preserved for future completion:
- Contact import functionality
- Contact export templates
- Note creation in opportunities
- Various test mocks and utilities

## Testing

- ✓ All unit tests pass
- ✓ Build succeeds
- ✓ App runs without errors
- ✓ Core features verified

## Files Modified

76 files across:
- `scripts/` - Migration and dev scripts
- `src/atomic-crm/` - Core CRM modules
- `src/components/` - UI and admin components
- `src/tests/` - Test files
```

**Step 2: Commit summary**

```bash
git add docs/lint-cleanup-summary.md
git commit -m "docs: add lint cleanup summary

Fixed all 181 lint issues using hybrid approach:
- Deleted obvious dead code
- Prefixed WIP features with _
- Fixed React hooks dependencies
- Improved accessibility
- Standardized type imports

All tests pass, build succeeds, app verified working."
```

**Step 3: Clean up baseline file**

```bash
git rm baseline-lint-errors.txt
git commit -m "chore: remove lint error baseline (no longer needed)"
```

---

## Execution Notes

**Estimated Time:** 3-4 hours (systematic approach)

**Risk Level:** Low-Medium
- Test coverage provides safety net
- Hybrid approach preserves uncertain code
- Category-by-category prevents overwhelming changes

**Dependencies:**
- None (can execute immediately)

**Rollback Plan:**
- Branch-based approach allows easy rollback
- Each commit is isolated for selective revert if needed

**Success Criteria:**
- `npm run lint` returns 0 errors/warnings
- `npm test -- --run` all tests pass
- `npm run build` succeeds
- App runs and core features work

---
