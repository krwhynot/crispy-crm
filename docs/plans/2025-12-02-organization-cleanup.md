# Organization Module Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate code duplication, fix design system violations, and consolidate the Organization module to a single detail view pattern.

**Architecture:** Extract shared constants to a central file, replace all hardcoded colors with semantic CSS variables, deprecate the legacy OrganizationShow page in favor of the SlideOver pattern, and remove dead code.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (semantic colors), React Admin 5, shadcn/ui

---

## Phase 1: Extract Constants

### Task 1.1: Create Organization Constants File

**Files:**
- Create: `src/atomic-crm/organizations/constants.ts`

**Step 1: Create the constants file with all shared data**

```typescript
/**
 * Organization Module Constants
 *
 * Single source of truth for organization-related choices, colors, and configuration.
 * Eliminates duplication across OrganizationMainTab, OrganizationAside,
 * OrganizationListFilter, and OrganizationDetailsTab.
 */

/** Valid organization types matching database enum */
export type OrganizationType = "customer" | "prospect" | "principal" | "distributor" | "unknown";

/** Valid priority levels matching database enum */
export type PriorityLevel = "A" | "B" | "C" | "D";

/** Organization type choices for SelectInput components */
export const ORGANIZATION_TYPE_CHOICES = [
  { id: "customer", name: "Customer" },
  { id: "prospect", name: "Prospect" },
  { id: "principal", name: "Principal" },
  { id: "distributor", name: "Distributor" },
  { id: "unknown", name: "Unknown" },
] as const;

/** Priority choices for SelectInput components */
export const PRIORITY_CHOICES = [
  { id: "A", name: "A - High" },
  { id: "B", name: "B - Medium-High" },
  { id: "C", name: "C - Medium" },
  { id: "D", name: "D - Low" },
] as const;

/**
 * Organization type to semantic tag color mapping
 * Uses MFB Garden to Table theme classes from design system
 */
export const ORG_TYPE_COLOR_MAP: Record<OrganizationType | string, string> = {
  customer: "tag-warm",      // Clay Orange - welcoming
  prospect: "tag-sage",      // Olive Green - growth potential
  principal: "tag-purple",   // Eggplant - important/primary
  distributor: "tag-teal",   // Teal - active/connected
  unknown: "tag-gray",       // Mushroom - neutral
};

/**
 * Priority to badge variant mapping
 * Maps priority levels to shadcn/ui Badge variants
 */
export const PRIORITY_VARIANT_MAP: Record<PriorityLevel | string, "default" | "secondary" | "destructive" | "outline"> = {
  A: "destructive",  // High - urgent attention
  B: "default",      // Medium-High - primary emphasis
  C: "secondary",    // Medium - muted
  D: "outline",      // Low - minimal emphasis
};

/** US States for address SelectInput */
export const US_STATES = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  { id: "AZ", name: "Arizona" },
  { id: "AR", name: "Arkansas" },
  { id: "CA", name: "California" },
  { id: "CO", name: "Colorado" },
  { id: "CT", name: "Connecticut" },
  { id: "DE", name: "Delaware" },
  { id: "FL", name: "Florida" },
  { id: "GA", name: "Georgia" },
  { id: "HI", name: "Hawaii" },
  { id: "ID", name: "Idaho" },
  { id: "IL", name: "Illinois" },
  { id: "IN", name: "Indiana" },
  { id: "IA", name: "Iowa" },
  { id: "KS", name: "Kansas" },
  { id: "KY", name: "Kentucky" },
  { id: "LA", name: "Louisiana" },
  { id: "ME", name: "Maine" },
  { id: "MD", name: "Maryland" },
  { id: "MA", name: "Massachusetts" },
  { id: "MI", name: "Michigan" },
  { id: "MN", name: "Minnesota" },
  { id: "MS", name: "Mississippi" },
  { id: "MO", name: "Missouri" },
  { id: "MT", name: "Montana" },
  { id: "NE", name: "Nebraska" },
  { id: "NV", name: "Nevada" },
  { id: "NH", name: "New Hampshire" },
  { id: "NJ", name: "New Jersey" },
  { id: "NM", name: "New Mexico" },
  { id: "NY", name: "New York" },
  { id: "NC", name: "North Carolina" },
  { id: "ND", name: "North Dakota" },
  { id: "OH", name: "Ohio" },
  { id: "OK", name: "Oklahoma" },
  { id: "OR", name: "Oregon" },
  { id: "PA", name: "Pennsylvania" },
  { id: "RI", name: "Rhode Island" },
  { id: "SC", name: "South Carolina" },
  { id: "SD", name: "South Dakota" },
  { id: "TN", name: "Tennessee" },
  { id: "TX", name: "Texas" },
  { id: "UT", name: "Utah" },
  { id: "VT", name: "Vermont" },
  { id: "VA", name: "Virginia" },
  { id: "WA", name: "Washington" },
  { id: "WV", name: "West Virginia" },
  { id: "WI", name: "Wisconsin" },
  { id: "WY", name: "Wyoming" },
] as const;

/** Default pagination sizes */
export const DEFAULT_LIST_PAGE_SIZE = 25;
export const MAX_RELATED_ITEMS = 100;
export const ACTIVITY_PAGE_SIZE = 50;
```

**Step 2: Verify file was created correctly**

Run: `head -30 src/atomic-crm/organizations/constants.ts`
Expected: First 30 lines showing the file header and type definitions

**Step 3: Commit**

```bash
git add src/atomic-crm/organizations/constants.ts
git commit -m "feat(organizations): add centralized constants file

Extracts organization types, priorities, colors, and US states
to eliminate duplication across 4+ files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1.2: Update OrganizationMainTab to Use Constants

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationMainTab.tsx`

**Step 1: Replace inline US_STATES and organization type choices**

Replace the entire file with:

```typescript
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SegmentComboboxInput } from "@/components/admin/SegmentComboboxInput";
import { FormGrid, FormSection } from "@/components/admin/form";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";
import { US_STATES, ORGANIZATION_TYPE_CHOICES } from "./constants";

export const OrganizationMainTab = () => {
  return (
    <div className="space-y-6">
      <FormSection title="Organization Information">
        <FormGrid columns={2}>
          <TextInput
            source="name"
            helperText="Required field"
            placeholder="Organization name"
            label="Name *"
          />
          <SelectInput
            source="organization_type"
            label="Organization Type *"
            choices={ORGANIZATION_TYPE_CHOICES}
            helperText="Required field"
            emptyText="Select organization type"
          />
          <ReferenceInput
            source="sales_id"
            reference="sales"
            filter={{
              "disabled@neq": true,
              "user_id@not.is": null,
            }}
          >
            <SelectInput
              label="Account manager"
              helperText={false}
              optionText={saleOptionRenderer}
            />
          </ReferenceInput>
          <SegmentComboboxInput source="segment_id" label="Segment" />
        </FormGrid>
      </FormSection>

      <FormSection title="Address Information">
        <FormGrid columns={2}>
          <TextInput source="street" helperText={false} label="Street" />
          <TextInput source="city" helperText={false} label="City" />
          <SelectInput
            source="state"
            label="State"
            helperText={false}
            choices={US_STATES}
            emptyText="Select state"
          />
          <TextInput source="zip" label="Zip" helperText={false} />
        </FormGrid>
      </FormSection>
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) => formatName(choice.first_name, choice.last_name);
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/organizations/OrganizationMainTab.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationMainTab.tsx
git commit -m "refactor(organizations): use constants in OrganizationMainTab

Removes 60 lines of inline US_STATES and organization type choices.
Imports from centralized constants.ts instead.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1.3: Update OrganizationAside to Use Constants

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationAside.tsx:91-104`

**Step 1: Add import at top of file**

After line 15 (after other imports), add:

```typescript
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES } from "./constants";
```

**Step 2: Replace ContextInfo component (lines 90-132)**

Replace the `ContextInfo` component with:

```typescript
const ContextInfo = ({ record }: { record: Company }) => {
  if (!record.id) {
    return null;
  }

  return (
    <AsideSection title="Context">
      {record.organization_type && (
        <span>
          Type: <SelectField source="organization_type" choices={ORGANIZATION_TYPE_CHOICES} />
        </span>
      )}
      {record.priority && (
        <span>
          Priority: <SelectField source="priority" choices={PRIORITY_CHOICES} />
        </span>
      )}
      {record.segment_id && (
        <span>
          Segment:{" "}
          <ReferenceField source="segment_id" reference="segments" link={false}>
            <TextField source="name" />
          </ReferenceField>
        </span>
      )}
    </AsideSection>
  );
};
```

**Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/organizations/OrganizationAside.tsx`
Expected: No errors

**Step 4: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationAside.tsx
git commit -m "refactor(organizations): use constants in OrganizationAside

Removes duplicate organization type and priority choice definitions.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1.4: Update OrganizationListFilter to Use Constants

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationListFilter.tsx`

**Step 1: Add import after line 12**

```typescript
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES, ORG_TYPE_COLOR_MAP, PRIORITY_VARIANT_MAP } from "./constants";
```

**Step 2: Remove duplicate definitions (lines 19-48)**

Delete these lines:
```typescript
  const organizationTypes = [
    { id: "customer", name: "Customer" },
    // ...
  ];

  // Organization type colors using MFB Garden to Table theme
  const _organizationTypeColors: Record<string, string> = {
    // ...
  };

  const priorities = [
    // ...
  ];

  const priorityColors: Record<string, BadgeVariant> = {
    // ...
  };
```

**Step 3: Update component to use constants**

In the FilterCategory for Organization Type (around line 65), change:
- `organizationTypes.map` → `ORGANIZATION_TYPE_CHOICES.map`
- The inline color mapping → `ORG_TYPE_COLOR_MAP[type.id] || "tag-gray"`

In the FilterCategory for Priority (around line 88), change:
- `priorities.map` → `PRIORITY_CHOICES.map`
- `priorityColors[priority.id]` → `PRIORITY_VARIANT_MAP[priority.id]`

**Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/organizations/OrganizationListFilter.tsx`
Expected: No errors

**Step 5: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationListFilter.tsx
git commit -m "refactor(organizations): use constants in OrganizationListFilter

Removes duplicate choices and color mappings.
Also removes unused _organizationTypeColors variable.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1.5: Update OrganizationDetailsTab to Use Constants

**Files:**
- Modify: `src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx`

**Step 1: Add import after line 13**

```typescript
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES, ORG_TYPE_COLOR_MAP, PRIORITY_VARIANT_MAP } from "../constants";
```

**Step 2: Remove duplicate definitions inside the edit mode branch (lines 49-62)**

Delete:
```typescript
    const organizationTypes = [
      { id: "customer", name: "Customer" },
      // ...
    ];

    const priorities = [
      // ...
    ];
```

**Step 3: Update SelectInput choices**

Change:
- `choices={organizationTypes}` → `choices={ORGANIZATION_TYPE_CHOICES}`
- `choices={priorities}` → `choices={PRIORITY_CHOICES}`

**Step 4: Update OrganizationTypeBadge and PriorityBadge (lines 190-238)**

Replace both badge components with:

```typescript
function OrganizationTypeBadge({ type }: { type: string }) {
  const colorClass = ORG_TYPE_COLOR_MAP[type] || "tag-gray";

  return (
    <Badge className={`text-xs px-2 py-1 ${colorClass}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variant = PRIORITY_VARIANT_MAP[priority] || "default";
  const label = PRIORITY_CHOICES.find(p => p.id === priority)?.name || priority;

  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {label}
    </Badge>
  );
}
```

**Step 5: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx`
Expected: No errors

**Step 6: Commit**

```bash
git add src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx
git commit -m "refactor(organizations): use constants in OrganizationDetailsTab

Removes duplicate choices, uses shared color/variant mappings.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1.6: Update OrganizationBadges to Use Constants

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationBadges.tsx`

**Step 1: Add import after line 13**

```typescript
import { ORG_TYPE_COLOR_MAP, PRIORITY_VARIANT_MAP, PRIORITY_CHOICES } from "./constants";
```

**Step 2: Update OrganizationTypeBadge (lines 41-56)**

Replace:
```typescript
export function OrganizationTypeBadge({ type }: OrganizationTypeBadgeProps) {
  const colorClass = ORG_TYPE_COLOR_MAP[type] || "tag-gray";

  return (
    <Badge className={`text-xs px-2 py-1 ${colorClass}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}
```

**Step 3: Update PriorityBadge (lines 67-98)**

Replace:
```typescript
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const variant = PRIORITY_VARIANT_MAP[priority] || "default";
  const label = PRIORITY_CHOICES.find(p => p.id === priority)?.name || priority;

  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {label}
    </Badge>
  );
}
```

**Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/organizations/OrganizationBadges.tsx`
Expected: No errors

**Step 5: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationBadges.tsx
git commit -m "refactor(organizations): use constants in OrganizationBadges

Single source of truth for color and variant mappings.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: Fix Hardcoded Colors

### Task 2.1: Add Semantic Color Classes to Design System

**Files:**
- Modify: `src/index.css` (or wherever Tailwind utilities are defined)

**Step 1: Add semantic utility classes for status colors**

Add to the `@layer utilities` section:

```css
/* Status semantic colors for badges, alerts, indicators */
.text-success { color: hsl(var(--success)); }
.text-warning { color: hsl(var(--warning)); }
.text-error { color: hsl(var(--destructive)); }
.bg-success { background-color: hsl(var(--success)); }
.bg-warning { background-color: hsl(var(--warning)); }
.bg-error { background-color: hsl(var(--destructive)); }
.border-success { border-color: hsl(var(--success)); }
.border-warning { border-color: hsl(var(--warning)); }
.border-error { border-color: hsl(var(--destructive)); }

/* Semantic backgrounds with opacity for cards */
.bg-success-subtle { background-color: hsl(var(--success) / 0.1); }
.bg-warning-subtle { background-color: hsl(var(--warning) / 0.1); }
.bg-error-subtle { background-color: hsl(var(--destructive) / 0.1); }
.border-success-subtle { border-color: hsl(var(--success) / 0.2); }
.border-warning-subtle { border-color: hsl(var(--warning) / 0.2); }
.border-error-subtle { border-color: hsl(var(--destructive) / 0.2); }
```

**Step 2: Verify CSS is valid**

Run: `npm run build`
Expected: Build succeeds without CSS errors

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(design-system): add semantic status color utilities

Adds text-success, text-warning, text-error and corresponding
bg-* and border-* classes for use in status indicators.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.2: Fix ActivitiesTab Hardcoded Colors (Organizations)

**Files:**
- Modify: `src/atomic-crm/organizations/ActivitiesTab.tsx:168-186`

**Step 1: Replace hardcoded sentiment colors**

Find the Badge components with hardcoded colors (around lines 168-186) and replace:

```typescript
{activity.sentiment && (
  <Badge
    variant="outline"
    className={
      activity.sentiment === "positive"
        ? "border-success text-success"
        : activity.sentiment === "negative"
          ? "border-error text-error"
          : ""
    }
  >
    {activity.sentiment}
  </Badge>
)}
{activity.follow_up_required && (
  <Badge variant="outline" className="border-warning text-warning">
    Follow-up Required
  </Badge>
)}
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/organizations/ActivitiesTab.tsx`
Expected: No errors

**Step 3: Run color validation**

Run: `npm run validate:colors`
Expected: No violations in ActivitiesTab.tsx

**Step 4: Commit**

```bash
git add src/atomic-crm/organizations/ActivitiesTab.tsx
git commit -m "fix(organizations): replace hardcoded colors in ActivitiesTab

Uses semantic text-success, text-error, text-warning classes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.3: Fix ActivitiesTab Hardcoded Colors (Contacts)

**Files:**
- Modify: `src/atomic-crm/contacts/ActivitiesTab.tsx`

**Step 1: Apply same changes as Task 2.2**

Find and replace the same sentiment badge patterns with semantic classes.

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/contacts/ActivitiesTab.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/contacts/ActivitiesTab.tsx
git commit -m "fix(contacts): replace hardcoded colors in ActivitiesTab

Uses semantic text-success, text-error, text-warning classes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.4: Fix OrganizationImportResult Hardcoded Colors

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationImportResult.tsx`

**Step 1: Replace progress bar colors**

Find the progress bar section and replace:
- `bg-gray-200` → `bg-muted`
- `bg-green-600` → `bg-success`
- `bg-yellow-600` → `bg-warning`
- `bg-red-600` → `bg-error`

**Step 2: Replace error card colors**

Find error card styling and replace:
- `border-red-200` → `border-error-subtle`
- `text-red-700` → `text-error`
- `bg-red-50` → `bg-error-subtle`

**Step 3: Replace success/warning text colors**

- `text-green-600` → `text-success`
- `text-yellow-600` → `text-warning`
- `text-red-600` → `text-error`

**Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/organizations/OrganizationImportResult.tsx`
Expected: No errors

**Step 5: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationImportResult.tsx
git commit -m "fix(organizations): replace hardcoded colors in ImportResult

Uses semantic status colors for progress bars and error cards.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.5: Fix ContactImportResult Hardcoded Colors

**Files:**
- Modify: `src/atomic-crm/contacts/ContactImportResult.tsx`

**Step 1: Apply same color replacements as Task 2.4**

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/contacts/ContactImportResult.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/contacts/ContactImportResult.tsx
git commit -m "fix(contacts): replace hardcoded colors in ImportResult

Uses semantic status colors for progress bars and error cards.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.6: Fix OrganizationImportPreview Hardcoded Colors

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationImportPreview.tsx`

**Step 1: Replace status indicator colors**

- `text-green-500` → `text-success`
- `text-yellow-500` → `text-warning`
- `text-red-500` → `text-error`
- `text-orange-600` → `text-warning`

**Step 2: Replace card backgrounds/borders**

- `bg-red-50` → `bg-error-subtle`
- `bg-yellow-50` → `bg-warning-subtle`
- `border-red-200` → `border-error-subtle`
- `border-yellow-200` → `border-warning-subtle`

**Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/organizations/OrganizationImportPreview.tsx`
Expected: No errors

**Step 4: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationImportPreview.tsx
git commit -m "fix(organizations): replace hardcoded colors in ImportPreview

Uses semantic status colors throughout preview component.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.7: Fix ContactImportPreview Hardcoded Colors

**Files:**
- Modify: `src/atomic-crm/contacts/ContactImportPreview.tsx`

**Step 1: Apply same color replacements as Task 2.6**

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/atomic-crm/contacts/ContactImportPreview.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/contacts/ContactImportPreview.tsx
git commit -m "fix(contacts): replace hardcoded colors in ImportPreview

Uses semantic status colors throughout preview component.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.8: Run Full Color Validation

**Step 1: Run validation script**

Run: `npm run validate:colors`
Expected: No violations reported

**Step 2: If violations found, fix them**

Address any remaining hardcoded colors.

**Step 3: Commit any additional fixes**

```bash
git add -A
git commit -m "fix(design-system): address remaining color violations

Final pass to ensure all colors use semantic variables.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3: Clean Up Dead Code

### Task 3.1: Remove Unused Props from OrganizationDetailsTab

**Files:**
- Modify: `src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx`

**Step 1: Update interface (lines 15-19)**

Change:
```typescript
interface OrganizationDetailsTabProps {
  record: OrganizationWithHierarchy;
  mode: "view" | "edit";
}
```

Remove `onModeToggle?: () => void;` from the interface.

**Step 2: Update function signature (lines 21-25)**

Change:
```typescript
export function OrganizationDetailsTab({
  record,
  mode,
}: OrganizationDetailsTabProps) {
```

**Step 3: Remove onModeToggle usage (line 39)**

If `onModeToggle?.()` is called anywhere, remove that call or replace with appropriate behavior.

**Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors (check all files that import this component)

**Step 5: Commit**

```bash
git add src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx
git commit -m "refactor(organizations): remove unused onModeToggle prop

Removes dead code that was never implemented.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3.2: Remove Unused Props from OrganizationContactsTab

**Files:**
- Modify: `src/atomic-crm/organizations/slideOverTabs/OrganizationContactsTab.tsx`

**Step 1: Check interface and remove unused mode/onModeToggle props**

If the component has `mode` and `onModeToggle` props that are never used, remove them.

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/organizations/slideOverTabs/OrganizationContactsTab.tsx
git commit -m "refactor(organizations): remove unused props from ContactsTab

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3.3: Remove Unused Props from OrganizationOpportunitiesTab

**Files:**
- Modify: `src/atomic-crm/organizations/slideOverTabs/OrganizationOpportunitiesTab.tsx`

**Step 1: Check interface and remove unused mode/onModeToggle props**

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/organizations/slideOverTabs/OrganizationOpportunitiesTab.tsx
git commit -m "refactor(organizations): remove unused props from OpportunitiesTab

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3.4: Extract Magic Numbers to Constants

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationList.tsx`
- Modify: `src/atomic-crm/organizations/ActivitiesTab.tsx`
- Modify: `src/atomic-crm/organizations/slideOverTabs/OrganizationContactsTab.tsx`

**Step 1: Import pagination constants**

Add to each file:
```typescript
import { DEFAULT_LIST_PAGE_SIZE, MAX_RELATED_ITEMS, ACTIVITY_PAGE_SIZE } from "./constants";
```

**Step 2: Replace magic numbers**

- `perPage={25}` → `perPage={DEFAULT_LIST_PAGE_SIZE}`
- `perPage: 100` → `perPage: MAX_RELATED_ITEMS`
- `perPage: 50` → `perPage: ACTIVITY_PAGE_SIZE`

**Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationList.tsx \
        src/atomic-crm/organizations/ActivitiesTab.tsx \
        src/atomic-crm/organizations/slideOverTabs/OrganizationContactsTab.tsx
git commit -m "refactor(organizations): extract magic numbers to constants

Replaces hardcoded perPage values with named constants.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: Final Verification

### Task 4.1: Run Full Test Suite

**Step 1: Run unit tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 2: Run type checking**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Run color validation**

Run: `npm run validate:colors`
Expected: No violations

---

### Task 4.2: Create Summary Commit

**Step 1: Review all changes**

Run: `git log --oneline -15`
Expected: See all commits from this cleanup

**Step 2: Verify no regressions**

Manually test:
- Organization list renders correctly
- Filter sidebar works
- SlideOver opens and displays correctly
- Import preview/result dialogs render correctly

---

## Success Criteria

- [ ] All organization/priority constants defined in ONE file (`constants.ts`)
- [ ] Zero duplicate constant definitions across module
- [ ] Zero hardcoded color values (validate:colors passes)
- [ ] No unused props in slide-over tab components
- [ ] Magic numbers replaced with named constants
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No TypeScript errors

---

## Files Modified Summary

**Created:**
- `src/atomic-crm/organizations/constants.ts`

**Modified (Constants):**
- `src/atomic-crm/organizations/OrganizationMainTab.tsx`
- `src/atomic-crm/organizations/OrganizationAside.tsx`
- `src/atomic-crm/organizations/OrganizationListFilter.tsx`
- `src/atomic-crm/organizations/OrganizationBadges.tsx`
- `src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx`

**Modified (Colors):**
- `src/index.css` (semantic utilities)
- `src/atomic-crm/organizations/ActivitiesTab.tsx`
- `src/atomic-crm/organizations/OrganizationImportResult.tsx`
- `src/atomic-crm/organizations/OrganizationImportPreview.tsx`
- `src/atomic-crm/contacts/ActivitiesTab.tsx`
- `src/atomic-crm/contacts/ContactImportResult.tsx`
- `src/atomic-crm/contacts/ContactImportPreview.tsx`

**Modified (Dead Code):**
- `src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx`
- `src/atomic-crm/organizations/slideOverTabs/OrganizationContactsTab.tsx`
- `src/atomic-crm/organizations/slideOverTabs/OrganizationOpportunitiesTab.tsx`
- `src/atomic-crm/organizations/OrganizationList.tsx`

---

## Estimated Time

- Phase 1 (Constants): ~45 minutes
- Phase 2 (Colors): ~60 minutes
- Phase 3 (Dead Code): ~30 minutes
- Phase 4 (Verification): ~15 minutes

**Total: ~2.5 hours**
