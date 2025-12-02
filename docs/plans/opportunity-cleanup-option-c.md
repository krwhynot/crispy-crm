# Opportunity Module Cleanup - Option C: Architectural Alignment

**Created:** 2025-12-02
**Status:** Ready for Implementation
**Estimated Effort:** 3-5 days
**Risk Level:** Medium-High (touches many files, layout changes)

---

## Executive Summary

This plan aligns the Opportunity module with the established Contacts/Organizations patterns, addressing:
- **God components** (OpportunityShow 437 lines, BulkActionsToolbar 507 lines)
- **Design system violations** (hardcoded colors, touch targets)
- **Architectural drift** (different layout, filter, and navigation patterns)
- **UX confusion** (double-tabbed Edit form)

---

## Phase Overview

| Phase | Description | Files Changed | Risk | Duration |
|-------|-------------|---------------|------|----------|
| **1** | Design System Fixes | 5 files | Low | 2-3 hours |
| **2** | Component Extractions | 8 new files, 3 modified | Medium | 4-6 hours |
| **3** | OpportunityEdit Flattening | 3 files | Medium | 2-3 hours |
| **4** | OpportunityShow Layout | 2 new files, 1 modified | Medium-High | 3-4 hours |
| **5** | Filter System Alignment | 4 new files, 2 modified, 2 deleted | High | 4-6 hours |

**Total: 17 new files, 14 modified files, 2 deleted files**

---

## Phase 1: Design System Fixes (Foundation)

**Goal:** Fix all color and touch target violations before structural changes.

### Task 1.1: Create Constants File

**File:** `src/atomic-crm/opportunities/constants.ts`

```typescript
/**
 * Centralized constants for opportunities module
 */

/** Minimum width for detail field columns (150px) */
export const DETAIL_FIELD_MIN_WIDTH = "min-w-[150px]";

/** Touch target minimum height - WCAG AA compliant (44px) */
export const TOUCH_TARGET_MIN_HEIGHT = "min-h-[44px]";

/** Standard action button height (44px) */
export const ACTION_BUTTON_HEIGHT = "h-11";
```

### Task 1.2: Add Missing CSS Utility

**File:** `src/index.css` (add to `@layer utilities` section ~line 303)

```css
.text-warning-strong {
  color: hsl(var(--warning-strong));
}
```

### Task 1.3: Fix Warning Components

**Files to modify:**
- `src/atomic-crm/opportunities/components/ContactOrgMismatchWarning.tsx`
- `src/atomic-crm/opportunities/components/DistributorAuthorizationWarning.tsx`

**Replacements (both files have identical patterns):**

| Current | Replacement |
|---------|-------------|
| `border-amber-500/50 bg-amber-50 dark:bg-amber-950/20` | `border-warning/50 bg-warning-subtle` |
| `text-amber-600` | `text-warning` |
| `text-amber-800 dark:text-amber-400` | `text-warning-strong` |
| `text-amber-700 dark:text-amber-300` | `text-warning` |
| `border-amber-600 text-amber-700 hover:bg-amber-100` | `border-warning text-warning hover:bg-warning-subtle` |
| `bg-amber-600 hover:bg-amber-700` | `bg-warning hover:bg-warning-strong` |

### Task 1.4: Fix ActivitiesList.tsx

**File:** `src/atomic-crm/opportunities/ActivitiesList.tsx`

**Lines 29-36 (sentiment colors):**
```typescript
className={
  activity.sentiment === "positive"
    ? "border-success text-success"
    : activity.sentiment === "negative"
      ? "border-destructive text-destructive"
      : "border-muted text-muted-foreground"
}
```

**Line 60 (follow-up badge):**
```typescript
// Replace: bg-yellow-50 text-yellow-700 border-yellow-300
// With: bg-warning-subtle text-warning border-warning
```

### Task 1.5: Fix OpportunityShow.tsx Colors & Touch Targets

**File:** `src/atomic-crm/opportunities/OpportunityShow.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 352 | `bg-orange-500` | `bg-warning` |
| 388 | `h-9` | `min-h-[44px]` |
| 428 | `h-9` | `min-h-[44px]` |
| 120, 153, 162, 190, 212, 221, 250, 265 | `min-w-[150px]` | Import `DETAIL_FIELD_MIN_WIDTH` from constants |

### Verification

```bash
npm run validate:colors
grep -rn "amber\|orange-500\|green-500\|red-500\|yellow-50" src/atomic-crm/opportunities/
# Should return 0 results
```

---

## Phase 2: Component Extractions

**Goal:** Break apart god components into testable, reusable pieces.

### Task 2.1: Create Foundation Components (Parallel Safe)

#### ArchivedBanner.tsx
**Path:** `src/atomic-crm/opportunities/components/ArchivedBanner.tsx`
**Source:** OpportunityShow.tsx lines 351-355
**Props:** None (presentational)

```typescript
export const ArchivedBanner = () => (
  <div className="bg-warning text-warning-foreground px-4 py-2 rounded-t-lg font-medium">
    This opportunity has been archived
  </div>
);
```

#### MetadataField.tsx
**Path:** `src/atomic-crm/opportunities/components/MetadataField.tsx`
**Source:** Repeated pattern in OpportunityShow.tsx

```typescript
export interface MetadataFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const MetadataField = ({ label, children, className }: MetadataFieldProps) => (
  <div className={cn("flex flex-col", DETAIL_FIELD_MIN_WIDTH, className)}>
    <span className="text-xs text-muted-foreground tracking-wide uppercase">
      {label}
    </span>
    {children}
  </div>
);
```

#### MetadataRow.tsx
**Path:** `src/atomic-crm/opportunities/components/MetadataRow.tsx`

```typescript
export interface MetadataRowProps {
  children: React.ReactNode;
  className?: string;
}

export const MetadataRow = ({ children, className }: MetadataRowProps) => (
  <div className={cn("flex gap-8 mb-4", className)}>
    {children}
  </div>
);
```

### Task 2.2: Create ArchiveActions.tsx

**Path:** `src/atomic-crm/opportunities/components/ArchiveActions.tsx`
**Source:** OpportunityShow.tsx lines 357-433
**Exports:** `ArchiveButton`, `UnarchiveButton`

```typescript
export interface ArchiveActionsProps {
  record: Opportunity;
}

export const ArchiveButton = ({ record }: ArchiveActionsProps) => {
  // Extract mutation logic from OpportunityShow.tsx lines 357-393
};

export const UnarchiveButton = ({ record }: ArchiveActionsProps) => {
  // Extract mutation logic from OpportunityShow.tsx lines 396-433
};
```

### Task 2.3: Create Shared ContactSelectField

**Path:** `src/atomic-crm/shared/components/ContactSelectField.tsx`
**Source:** ActivityNoteForm.tsx lines 29-75

```typescript
export interface ContactSelectFieldProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  organizationId: number | string | null | undefined;
  name?: string; // defaults to "contact_id"
  error?: string;
  label?: string;
  placeholder?: string;
}
```

### Task 2.4: Create Bulk Actions Decomposition

#### useBulkActionsState.ts
**Path:** `src/atomic-crm/opportunities/hooks/useBulkActionsState.ts`
**Source:** BulkActionsToolbar.tsx lines 59-163

```typescript
export interface UseBulkActionsStateOptions {
  selectedIds: (string | number)[];
  opportunities: Opportunity[];
  onUnselectItems: () => void;
}

export interface UseBulkActionsStateResult {
  activeAction: BulkAction;
  selectedStage: string;
  selectedStatus: string;
  selectedOwner: string;
  isProcessing: boolean;
  // ... handlers
}
```

#### BulkSelectBar.tsx
**Path:** `src/atomic-crm/opportunities/components/BulkSelectBar.tsx`
**Source:** BulkActionsToolbar.tsx lines 203-254

#### BulkActionDialogs.tsx
**Path:** `src/atomic-crm/opportunities/components/BulkActionDialogs.tsx`
**Source:** BulkActionsToolbar.tsx lines 256-504

### Task 2.5: Create Components Index

**Path:** `src/atomic-crm/opportunities/components/index.ts`

```typescript
export { ArchivedBanner } from "./ArchivedBanner";
export { ArchiveButton, UnarchiveButton } from "./ArchiveActions";
export { MetadataField } from "./MetadataField";
export { MetadataRow } from "./MetadataRow";
export { BulkSelectBar } from "./BulkSelectBar";
export { BulkActionDialogs } from "./BulkActionDialogs";
```

### Task 2.6: Update Source Files

1. **OpportunityShow.tsx:** Import from `./components`, remove inline definitions
2. **BulkActionsToolbar.tsx:** Import hook and components, compose together
3. **ActivityNoteForm.tsx:** Import `ContactSelectField` from shared

---

## Phase 3: OpportunityEdit Form Flattening

**Goal:** Remove confusing double-tabbed structure.

### Current Structure (PROBLEM)

```
OpportunityEdit
├── Outer Tabs (2)
│   ├── "Details" ──────────────────────────┐
│   │   └── OpportunityInputs (4 inner tabs)│
│   │       ├── "General"                   │
│   │       ├── "Classification"            │
│   │       ├── "Relationships"             │
│   │       └── "Details" ← NAME COLLISION  │
│   └── "Notes & Activity"
```

### Target Structure (SOLUTION)

```
OpportunityEdit
├── Single-Level Tabs (5)
│   ├── "General"
│   ├── "Classification"
│   ├── "Relationships"
│   ├── "Additional Info" (renamed from inner "Details")
│   └── "Activity" (renamed from "Notes & Activity")
```

### Task 3.1: Rename OpportunityDetailsTab

**Current:** `src/atomic-crm/opportunities/forms/tabs/OpportunityDetailsTab.tsx`
**Target:** `src/atomic-crm/opportunities/forms/tabs/OpportunityAdditionalInfoTab.tsx`

- Rename file
- Rename exported component
- Update tab key from `"details"` to `"additional-info"`
- Update label from `"Details"` to `"Additional Info"`

### Task 3.2: Create OpportunityActivityTab

**Path:** `src/atomic-crm/opportunities/forms/tabs/OpportunityActivityTab.tsx`

```typescript
import { ActivityNoteForm } from "../../ActivityNoteForm";
import { NotesIterator } from "../../../notes";

export const OpportunityActivityTab = () => {
  const record = useRecordContext<Opportunity>();

  return (
    <div className="space-y-6">
      <ActivityNoteForm opportunity={record!} />
      <Separator />
      <ReferenceManyField
        target="opportunity_id"
        reference="opportunityNotes"
        sort={{ field: "created_at", order: "DESC" }}
      >
        <NotesIterator reference="opportunities" />
      </ReferenceManyField>
    </div>
  );
};
```

### Task 3.3: Refactor OpportunityEdit.tsx

**Remove:**
- Outer `<Tabs>` wrapper
- Import of `OpportunityInputs`

**Add:**
- Direct `<TabbedFormInputs>` with all 5 tabs
- Import all tab components directly

```typescript
const tabs: TabDefinition[] = [
  { key: "general", label: "General", fields: ["name", "description", "estimated_close_date"], content: <OpportunityGeneralTab mode="edit" /> },
  { key: "classification", label: "Classification", fields: ["stage", "priority", "lead_source"], content: <OpportunityClassificationTab /> },
  { key: "relationships", label: "Relationships", fields: [...], content: <OpportunityRelationshipsTab /> },
  { key: "additional-info", label: "Additional Info", fields: [...], content: <OpportunityAdditionalInfoTab /> },
  { key: "activity", label: "Activity", fields: [], content: <OpportunityActivityTab /> },
];
```

### Task 3.4: Update OpportunityInputs.tsx

Update inner tab reference from `"Details"` to `"Additional Info"` for OpportunityCreate compatibility.

---

## Phase 4: OpportunityShow Layout Refactor

**Goal:** Add sidebar to match Contacts/Organizations pattern.

### Task 4.1: Create OpportunityAside.tsx

**Path:** `src/atomic-crm/opportunities/OpportunityAside.tsx`
**Pattern:** Follow `src/atomic-crm/contacts/ContactAside.tsx`

**Sections to include:**
1. Edit/Show button (top)
2. **Pipeline Status** - Stage badge, Priority badge, Status
3. **Key Dates** - Expected close, Created, Stage changed
4. **Ownership** - Owner, Account Manager, Created By
5. **Lead Source** (conditional)
6. **Tasks** - ReferenceManyField + AddTask button
7. **Quick Notes** (conditional)

### Task 4.2: Refactor OpportunityShow.tsx

**Import:**
```typescript
import { ResponsiveGrid } from "@/components/design-system";
import { OpportunityAside } from "./OpportunityAside";
```

**Structure:**
```tsx
<ResponsiveGrid variant="dashboard" className="mt-2 mb-2">
  <main role="main" aria-label="Opportunity details">
    {record.deleted_at ? <ArchivedBanner /> : null}
    <Card>
      {/* Keep: Header, OrganizationInfoCard, WorkflowManagement,
          RelatedOpportunities, Contacts, Description, ProductsTable */}
    </Card>
  </main>

  <aside aria-label="Opportunity information">
    <OpportunityAside />
  </aside>
</ResponsiveGrid>
```

**Content Distribution:**

| Main Area (Card with tabs) | Sidebar (OpportunityAside) |
|---------------------------|---------------------------|
| OpportunityHeader | Edit/Show button |
| OrganizationInfoCard | Pipeline Status (stage, priority) |
| WorkflowManagementSection | Key Dates |
| RelatedOpportunitiesSection | Ownership info |
| Contacts list | Lead Source |
| Description | Tasks section |
| ProductsTable | Quick notes |

---

## Phase 5: Filter System Alignment

**Goal:** Replace custom filter pattern with standard sidebar approach.

### Task 5.1: Create useOpportunityFilterChips.ts

**Path:** `src/atomic-crm/opportunities/useOpportunityFilterChips.ts`
**Pattern:** Follow `src/atomic-crm/organizations/useOrganizationFilterChips.ts`

```typescript
export interface UseOpportunityFilterChipsResult {
  chips: FilterChip[];
  removeFilterValue: (key: string, value: any) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}
```

### Task 5.2: Create SidebarActiveFilters.tsx

**Path:** `src/atomic-crm/opportunities/SidebarActiveFilters.tsx`
**Pattern:** Follow `src/atomic-crm/contacts/SidebarActiveFilters.tsx`

### Task 5.3: Create OpportunityListFilter.tsx

**Path:** `src/atomic-crm/opportunities/OpportunityListFilter.tsx`
**Pattern:** Follow `src/atomic-crm/contacts/ContactListFilter.tsx`

**Filter Categories:**
| Category | Icon | Filter Key | Type |
|----------|------|------------|------|
| Quick Filters | Zap | (presets) | Preset buttons |
| Stage | Layers | stage | Multi-select toggles |
| Priority | Flag | priority | Multi-select toggles |
| Principal | Building2 | principal_organization_id | Select dropdown |
| Customer | Building2 | customer_organization_id | Select dropdown |
| Campaign | Megaphone | campaign | Select dropdown |
| Owner | Users | opportunity_owner_id | Toggle "Me" |

### Task 5.4: Update OpportunityList.tsx

**Remove:**
- `filters={opportunityFilters}` prop
- `<FilterPresetsBar />` component
- `<FilterChipsPanel />` component
- `<FilterButton />` from toolbar

**Add:**
- Wrap content in `<StandardListLayout filterComponent={<OpportunityListFilter />}>`

### Task 5.5: Delete Deprecated Files

- `src/atomic-crm/opportunities/FilterPresetsBar.tsx`
- `src/atomic-crm/filters/useOpportunityFilters.tsx` (verify no other imports first)

---

## File Change Summary

### New Files (17)

| File | Phase |
|------|-------|
| `src/atomic-crm/opportunities/constants.ts` | 1 |
| `src/atomic-crm/opportunities/components/ArchivedBanner.tsx` | 2 |
| `src/atomic-crm/opportunities/components/MetadataField.tsx` | 2 |
| `src/atomic-crm/opportunities/components/MetadataRow.tsx` | 2 |
| `src/atomic-crm/opportunities/components/ArchiveActions.tsx` | 2 |
| `src/atomic-crm/opportunities/components/BulkSelectBar.tsx` | 2 |
| `src/atomic-crm/opportunities/components/BulkActionDialogs.tsx` | 2 |
| `src/atomic-crm/opportunities/components/index.ts` | 2 |
| `src/atomic-crm/opportunities/hooks/useBulkActionsState.ts` | 2 |
| `src/atomic-crm/shared/components/ContactSelectField.tsx` | 2 |
| `src/atomic-crm/opportunities/forms/tabs/OpportunityActivityTab.tsx` | 3 |
| `src/atomic-crm/opportunities/forms/tabs/OpportunityAdditionalInfoTab.tsx` | 3 |
| `src/atomic-crm/opportunities/OpportunityAside.tsx` | 4 |
| `src/atomic-crm/opportunities/useOpportunityFilterChips.ts` | 5 |
| `src/atomic-crm/opportunities/SidebarActiveFilters.tsx` | 5 |
| `src/atomic-crm/opportunities/OpportunityListFilter.tsx` | 5 |

### Modified Files (14)

| File | Phase |
|------|-------|
| `src/index.css` | 1 |
| `src/atomic-crm/opportunities/components/ContactOrgMismatchWarning.tsx` | 1 |
| `src/atomic-crm/opportunities/components/DistributorAuthorizationWarning.tsx` | 1 |
| `src/atomic-crm/opportunities/ActivitiesList.tsx` | 1 |
| `src/atomic-crm/opportunities/OpportunityShow.tsx` | 1, 2, 4 |
| `src/atomic-crm/opportunities/BulkActionsToolbar.tsx` | 2 |
| `src/atomic-crm/opportunities/ActivityNoteForm.tsx` | 2 |
| `src/atomic-crm/opportunities/hooks/index.ts` | 2 |
| `src/atomic-crm/opportunities/OpportunityEdit.tsx` | 3 |
| `src/atomic-crm/opportunities/forms/OpportunityInputs.tsx` | 3 |
| `src/atomic-crm/opportunities/OpportunityList.tsx` | 5 |

### Deleted Files (2)

| File | Phase |
|------|-------|
| `src/atomic-crm/opportunities/FilterPresetsBar.tsx` | 5 |
| `src/atomic-crm/filters/useOpportunityFilters.tsx` | 5 |
| `src/atomic-crm/opportunities/forms/tabs/OpportunityDetailsTab.tsx` | 3 (renamed) |

---

## Execution Commands

```bash
# Phase 1: Design System Fixes
/sc:implement "opportunity constants file" --persona-frontend --safe-mode
/sc:implement "warning component color fixes" --persona-frontend --validate
/sc:implement "ActivitiesList sentiment colors" --persona-frontend --validate
/sc:implement "OpportunityShow color and touch fixes" --persona-frontend --validate
/sc:test "npm run validate:colors" --validate

# Phase 2: Component Extractions
/sc:implement "ArchivedBanner MetadataField MetadataRow" --persona-frontend --safe-mode
/sc:implement "ArchiveActions component" --persona-frontend --safe-mode
/sc:implement "ContactSelectField shared component" --persona-frontend --safe-mode
/sc:implement "useBulkActionsState hook" --persona-frontend --safe-mode
/sc:implement "BulkSelectBar and BulkActionDialogs" --persona-frontend --safe-mode
/sc:implement "update source files to use extractions" --persona-frontend --validate
/sc:test "npm run test:ci -- --grep Opportunity" --validate

# Phase 3: Edit Form Flattening
/sc:implement "rename OpportunityDetailsTab to AdditionalInfo" --persona-frontend --safe-mode
/sc:implement "OpportunityActivityTab component" --persona-frontend --safe-mode
/sc:implement "OpportunityEdit flattened tabs" --persona-frontend --validate
/sc:test "npm run test:ci -- --grep OpportunityEdit" --validate

# Phase 4: Show Layout
/sc:implement "OpportunityAside component" --persona-frontend --c7
/sc:implement "OpportunityShow ResponsiveGrid layout" --persona-frontend --validate
/sc:test "npm run test:ci -- --grep OpportunityShow" --validate

# Phase 5: Filter System
/sc:implement "useOpportunityFilterChips hook" --persona-frontend --safe-mode
/sc:implement "SidebarActiveFilters component" --persona-frontend --safe-mode
/sc:implement "OpportunityListFilter component" --persona-frontend --c7
/sc:implement "OpportunityList StandardListLayout integration" --persona-frontend --validate
/sc:cleanup "delete deprecated filter files" --safe-mode
/sc:test "npm run test:ci" --validate
```

---

## Success Criteria

### Phase 1
- [ ] `npm run validate:colors` passes
- [ ] No hardcoded amber/orange/green/red/yellow colors in opportunities/
- [ ] Archive/Unarchive buttons have 44px touch targets

### Phase 2
- [ ] OpportunityShow.tsx < 300 lines
- [ ] BulkActionsToolbar.tsx < 150 lines
- [ ] All extracted components have unit tests
- [ ] Existing functionality unchanged

### Phase 3
- [ ] OpportunityEdit shows 5 flat tabs (no nesting)
- [ ] No tab named "Details" inside another "Details"
- [ ] OpportunityCreate still works with 4 tabs

### Phase 4
- [ ] OpportunityShow uses ResponsiveGrid with sidebar
- [ ] OpportunityAside follows ContactAside pattern
- [ ] Pipeline status, dates, ownership in sidebar

### Phase 5
- [ ] OpportunityList uses StandardListLayout
- [ ] Filter sidebar matches Contacts/Organizations
- [ ] Filter presets integrated as FilterCategory
- [ ] FilterPresetsBar.tsx deleted

---

## Rollback Plan

Each phase can be rolled back independently:

1. **Phase 1:** Revert CSS changes (git checkout src/index.css)
2. **Phase 2:** Keep old inline components, delete extracted files
3. **Phase 3:** Restore outer tabs in OpportunityEdit
4. **Phase 4:** Remove ResponsiveGrid wrapper, delete OpportunityAside
5. **Phase 5:** Restore FilterPresetsBar import, remove StandardListLayout

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking tests | Run test suite after each phase |
| Visual regressions | Manual testing checklist per phase |
| Mobile responsiveness | Test sidebar hide on mobile breakpoint |
| Filter state loss | Verify filter persistence in URL |
| Performance impact | Monitor bundle size changes |
