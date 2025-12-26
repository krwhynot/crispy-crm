# P2/P3 Verification Report

**Generated:** 2025-12-26
**Verified by:** Claude Code audit
**Source:** docs/technical-debt.md

---

## Summary

| Priority | Total | Fixed | Partial | Open | Cannot Verify |
|----------|-------|-------|---------|------|---------------|
| **P2 Medium** | 19* | 6 | 2 | 9 | 2 |
| **P3 Low** | 12 | 5 | 2 | 4 | 1 |
| **Combined** | 31 | 11 | 4 | 13 | 3 |

*Note: technical-debt.md claims 18 P2 items but lists 19 actual items.

**Recommended Actions:**
- ✅ DELETE: 6 P2 items, 5 P3 items (fixed)
- 📝 UPDATE: 4 items with corrected descriptions
- ❌ KEEP: 13 items still open

---

## P2 Item Details

### Import Health

#### IMP-01: 4-level deep imports need @/ alias
**Status:** OPEN
**Evidence:** Confirmed at `src/atomic-crm/providers/supabase/extensions/__tests__/customMethodsExtension.test.ts:31-32`
```typescript
} from "../../../../types";
import type { QuickAddInput } from "../../../../validation/quickAdd";
```
**File(s):** `customMethodsExtension.test.ts:31-32`
**Action:** KEEP

---

#### IMP-02: 3-level deep imports in provider/service layer
**Status:** CANNOT_VERIFY
**Evidence:** Would require full import audit across all mentioned files
**File(s):** Multiple - ValidationService.ts, TransformService.ts, etc.
**Action:** KEEP (needs separate audit)

---

#### IMP-03: 5 imports include unnecessary .tsx extension
**Status:** OPEN
**Evidence:** Confirmed in multiple files:
- `src/components/supabase/forgot-password-page.tsx:4` - imports layout.tsx
- `src/components/supabase/forgot-password-page.tsx:7` - imports button.tsx
- `src/main.tsx:11` - imports App.tsx
- `src/components/admin/ListNoResults.tsx:7` - imports button.tsx
- `src/atomic-crm/root/CRM.tsx:38` - imports StartPage.tsx
**File(s):** 5 files as listed
**Action:** KEEP + UPDATE FILE LIST

---

### Dead Code

#### DEAD-01: OrganizationDatagridHeader.tsx - 81 lines, zero imports
**Status:** FIXED ✅
**Evidence:** File IS imported and used in `OrganizationList.tsx:23-27`:
```typescript
import {
  OrganizationNameHeader,
  OrganizationTypeHeader,
  OrganizationPriorityHeader,
} from "./OrganizationDatagridHeader";
```
**File(s):** N/A
**Action:** DELETE

---

#### DEAD-02: useNotifyWithRetry hook - zero consumers
**Status:** OPEN
**Evidence:** Hook exists at `src/atomic-crm/utils/useNotifyWithRetry.tsx`, exported from barrel at `src/atomic-crm/utils/index.ts:47`. No consumers found importing it outside the barrel.
**File(s):** `src/atomic-crm/utils/useNotifyWithRetry.tsx`
**Action:** KEEP

---

#### DEAD-03: CSV import constants unused
**Status:** UPDATE REQUIRED
**Evidence:** The contacts/csvConstants.ts file only has 17 lines and exports only `FULL_NAME_SPLIT_MARKER` which IS used by:
- ContactImportDialog.tsx
- csvProcessor.ts
- ContactImportPreview.tsx
- columnAliases.ts

The line numbers 12, 18, 35 in the debt item don't match reality.
**File(s):** File changed - needs re-audit
**Action:** DELETE (constants are used) or UPDATE description

---

#### DEAD-04: Organization column aliases unused
**Status:** FIXED ✅
**Evidence:** Exports ARE used:
- `OrganizationImportDialog.tsx` - uses findCanonicalField, mapHeadersToFields
- `OrganizationImportPreview.tsx` - uses ORGANIZATION_COLUMN_ALIASES
- `organizationColumnAliases.test.ts` - tests exports
**File(s):** N/A
**Action:** DELETE

---

#### DEAD-05: InteractionParticipant, DashboardSnapshot types
**Status:** OPEN
**Evidence:** Both types exist in `src/atomic-crm/types.ts` (lines 185, 339). Search for imports in src/ found only types.ts itself - no consumers.
**File(s):** `src/atomic-crm/types.ts:185, 339`
**Action:** KEEP

---

#### DEAD-06: BADGE_TOUCH_CLASSES
**Status:** OPEN
**Evidence:** Constant exists at `src/atomic-crm/organizations/constants.ts:234-235`. Not imported anywhere in src/ besides the definition file.
**File(s):** `src/atomic-crm/organizations/constants.ts:234`
**Action:** KEEP

---

#### DEAD-07: SalesShowView
**Status:** PARTIAL
**Evidence:** `SalesShowView` is defined at `src/atomic-crm/sales/resource.tsx:29-32` and exported at line 35. It IS used in the default export (`show: SalesShowView` at line 41). However, need to verify if the show route is actually registered in the app.
**File(s):** `src/atomic-crm/sales/resource.tsx:29-35`
**Action:** UPDATE: Verify if sales show route is registered

---

### Database Schema

#### DB-01: is_principal/is_distributor columns still exist
**Status:** FIXED ✅
**Evidence:** Migration `20251018232818_remove_deprecated_organization_fields.sql` removes these columns:
```sql
ALTER TABLE "public"."organizations"
    DROP COLUMN IF EXISTS "is_principal",
    DROP COLUMN IF EXISTS "is_distributor";
```
**File(s):** N/A
**Action:** DELETE

---

#### DB-02: No DB text length constraints
**Status:** CANNOT_VERIFY
**Evidence:** Would require full migration audit to check for VARCHAR/TEXT column constraints. Zod has limits but DB may not enforce them.
**File(s):** Multiple migration files
**Action:** KEEP (needs separate audit)

---

#### DB-03: Duplicate indexes idx_companies_*
**Status:** FIXED ✅
**Evidence:** Same migration `20251018232818` drops the duplicate indexes:
```sql
DROP INDEX IF EXISTS "idx_companies_is_principal";
DROP INDEX IF EXISTS "idx_companies_is_distributor";
```
**File(s):** N/A
**Action:** DELETE

---

### UI/UX (Lower Priority)

#### UI-19: AddTask invalid max-h-9/10 class
**Status:** FIXED ✅
**Evidence:** `AddTask.tsx:119` now uses valid Tailwind class `max-h-[90vh]`:
```typescript
<DialogContent className="lg:max-w-xl max-h-[90vh] overflow-y-auto">
```
**File(s):** N/A
**Action:** DELETE

---

#### UI-20: LogActivityFAB z-50 conflict
**Status:** PARTIAL
**Evidence:** `LogActivityFAB.tsx:219` now uses `z-40` instead of z-50. However, may still conflict with other z-40 elements.
**File(s):** `src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx:219`
**Action:** UPDATE: z-50 → z-40, verify no remaining conflicts

---

#### UI-21: SimilarOpportunitiesDialog non-standard CSS var
**Status:** FIXED ✅
**Evidence:** `stageConstants.ts` uses semantic CSS variables:
- `var(--info-subtle)`, `var(--tag-teal-bg)`, `var(--warning-subtle)`, etc.
These ARE semantic design tokens, not raw colors.
**File(s):** N/A
**Action:** DELETE

---

### Forms (Lower Priority)

#### FORM-02: FormErrorSummary expand button < 44px
**Status:** OPEN
**Evidence:** `FormErrorSummary.tsx:136-155` - the expand button uses `text-xs` but has no explicit height class (like `h-11` or `min-h-[44px]`):
```typescript
<button
  type="button"
  onClick={() => setIsExpanded(!isExpanded)}
  className="flex items-center gap-1 text-xs text-destructive/80 hover:text-destructive transition-colors"
  aria-expanded={isExpanded}
>
```
**File(s):** `src/components/admin/FormErrorSummary.tsx:136`
**Action:** KEEP

---

#### FORM-03: FormErrorSummary error item button < 44px
**Status:** OPEN
**Evidence:** `FormErrorSummary.tsx:168-174` - error item button has no size constraint:
```typescript
<button
  type="button"
  onClick={() => focusField(field)}
  className="text-left hover:underline focus:underline focus:outline-none"
>
```
**File(s):** `src/components/admin/FormErrorSummary.tsx:168`
**Action:** KEEP

---

#### FORM-04: SimpleFormIterator uses sm: instead of md:
**Status:** OPEN
**Evidence:** `simple-form-iterator.tsx:324` uses mobile-first `sm:flex-row`:
```typescript
inline ? "flex-col sm:flex-row gap-2" : "flex-col"
```
Design system specifies `md:` breakpoint for desktop-first approach.
**File(s):** `src/components/admin/simple-form-iterator.tsx:324`
**Action:** KEEP

---

## P3 Item Details

### UI/UX Improvements

#### UI-22: dialog/alert-dialog footers use mobile-first pattern
**Status:** FIXED ✅
**Evidence:** Both components use desktop-first `max-md:flex-col-reverse`:
- `dialog.tsx:82`: `"flex flex-row justify-end gap-2 max-md:flex-col-reverse"`
- `alert-dialog.tsx:53`: `"flex flex-row justify-end gap-2 max-md:flex-col-reverse"`
**File(s):** N/A
**Action:** DELETE

---

#### UI-23: drawer bg-black/80 should use semantic token
**Status:** FIXED ✅
**Evidence:** `drawer.tsx:30` uses semantic `bg-overlay` token:
```typescript
className={cn(
  "...fixed inset-0 z-50 bg-overlay",
  className
)}
```
**File(s):** N/A
**Action:** DELETE

---

#### UI-24: Dialog/Sheet missing aria-describedby auto-linking
**Status:** OPEN
**Evidence:**
- `dialog.tsx:55`: Manual pass-through only: `aria-describedby={props["aria-describedby"] ?? undefined}`
- `sheet.tsx`: No explicit aria-describedby handling
No auto-linking mechanism like `useId()` for Description components.
**File(s):** `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`
**Action:** KEEP

---

#### UI-25: gap-1 violations should be gap-2
**Status:** OPEN
**Evidence:** Found 19 files in src/components using `gap-1`:
- sidebar.tsx, list-pagination.tsx, simple-form-iterator.tsx
- image-editor-field.tsx, autocomplete-array-input.tsx, file-input.tsx
- toggle-group.tsx, NotificationDropdown.tsx, FilterableColumnHeader.tsx
- FormErrorSummary.tsx, pagination.tsx, calendar.tsx, alert.tsx, etc.
**File(s):** 19 files in src/components
**Action:** KEEP (may be intentional in some cases - needs design review)

---

### Async/State Improvements

#### ASYNC-04: Extend useInAppUnsavedChanges to all edit forms
**Status:** OPEN
**Evidence:** Hook exists at `src/hooks/useInAppUnsavedChanges.ts` but only used in:
- `OpportunityCreateWizard.tsx`
Not used in any slide-over edit tabs (OrganizationDetailsTab, ContactDetailsTab, TaskSlideOverDetailsTab).
**File(s):** All slide-over edit tabs missing this hook
**Action:** KEEP

---

#### ASYNC-05: Add explicit retry button on fetch errors
**Status:** CANNOT_VERIFY
**Evidence:** Requires UI behavior review - not a code pattern search.
**File(s):** List components
**Action:** KEEP (needs manual testing)

---

#### ASYNC-06: Implement updated_at version check for opportunities
**Status:** OPEN
**Evidence:** No optimistic locking found in data provider or opportunity forms.
**File(s):** Data provider, opportunity forms
**Action:** KEEP

---

#### ASYNC-07: Add AbortController to EntityCombobox search
**Status:** OPEN
**Evidence:** `EntityCombobox.tsx` has no AbortController. Search is delegated to parent via `onSearchChange` callback. AbortController IS used in other files (8 found) but not here.
**File(s):** `src/atomic-crm/dashboard/v3/components/EntityCombobox.tsx`
**Action:** KEEP

---

#### ASYNC-08: Extend beforeunload protection to create forms
**Status:** PARTIAL
**Evidence:** `beforeunload` found in 4 files:
- OrganizationImportDialog.tsx
- useUnsavedChangesWarning.ts
- ContactImportDialog.tsx
- notification.tsx

Not confirmed in all create form components.
**File(s):** All create form components need verification
**Action:** UPDATE: Verify coverage, list missing components

---

### i18n/Edge Cases

#### EC-01: RTL text support missing (dir="auto")
**Status:** PARTIAL
**Evidence:**
- `input.tsx:9`: HAS `dir="auto"` ✅
- `textarea.tsx`: MISSING `dir="auto"` ❌
**File(s):** `src/components/ui/textarea.tsx`
**Action:** UPDATE: input.tsx fixed, only textarea.tsx needs dir="auto"

---

#### EC-02: Avatar emoji handling uses charAt(0)
**Status:** FIXED ✅
**Evidence:** `Avatar.tsx:29-30` correctly uses `Array.from()` which properly handles multi-byte characters like emojis:
```typescript
{record.first_name ? Array.from(record.first_name)[0]?.toUpperCase() : null}
{record.last_name ? Array.from(record.last_name)[0]?.toUpperCase() : null}
```
**File(s):** N/A
**Action:** DELETE

---

#### EC-03: Number input only parses English decimal format
**Status:** FIXED ✅
**Evidence:** `number-input.tsx:92-101` handles both `.` and `,` as decimal separators:
```typescript
const convertStringToNumber = (value?: string | null) => {
  // ...
  const normalized = value.replace(",", ".");
  const float = parseFloat(normalized);
  return isNaN(float) ? 0 : float;
};
```
**File(s):** N/A
**Action:** DELETE

---

## Recommended Updates to technical-debt.md

### Items to DELETE (Fixed)

**P2:**
- DEAD-01: OrganizationDatagridHeader.tsx (IS used)
- DEAD-03: CSV constants (ARE used, file changed)
- DEAD-04: Organization column aliases (ARE used)
- DB-01: is_principal/is_distributor (removed in migration)
- DB-03: Duplicate indexes (removed in migration)
- UI-19: AddTask max-h class (fixed to max-h-[90vh])
- UI-21: SimilarOpportunitiesDialog CSS var (uses semantic tokens)

**P3:**
- UI-22: dialog/alert-dialog footers (use desktop-first max-md:)
- UI-23: drawer bg-black/80 (uses bg-overlay)
- EC-02: Avatar emoji (uses Array.from())
- EC-03: Number input decimal (handles both . and ,)

### Items to UPDATE

1. **IMP-03:** Update file list with correct paths found
2. **DEAD-07 (SalesShowView):** Clarify - used in default export, verify route registration
3. **UI-20 (LogActivityFAB):** Changed from z-50 to z-40
4. **ASYNC-08:** List specific create forms missing beforeunload
5. **EC-01:** Note that input.tsx is fixed, only textarea.tsx needs update

---

## New Issues Discovered

None discovered during this verification.

---

## Verification Methodology

1. **Grep searches** for imports, exports, and pattern usage
2. **File reads** for specific line number verification
3. **Glob searches** to locate files mentioned in debt items
4. **Cross-reference** between definitions and usages

**Limitations:**
- Some items (DB constraints, retry UI, optimistic locking) require runtime or deeper audit
- Route registration verification not performed for DEAD-07
