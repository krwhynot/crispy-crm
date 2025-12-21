# Plan: Compact Create Forms with Reusable Components

> **Created:** 2025-12-06
> **Type:** Refactoring
> **Scope:** Contacts, Organizations, Opportunities create forms
> **Testing:** TDD Strict (failing tests first)
> **Execution:** Hybrid (sequential foundation → parallel forms)

---

## Objective

Make all CRM create forms compact enough to minimize scrolling on desktop (1440px+) and iPad (1024px) by:
1. Creating reusable `CollapsibleSection` and `CompactFormRow` components
2. Applying grid-based layouts for related fields
3. Using progressive disclosure for optional fields

---

## Research Summary

| Source | Key Finding |
|--------|-------------|
| [NN/Group](https://www.nngroup.com/articles/web-form-design/) | Single-column layouts = 78% error-free vs 42% multi-column |
| [NN/Group](https://www.nngroup.com/articles/form-design-white-space/) | Exception: logically related short fields CAN share a row |
| [Ant Design](https://ant.design/docs/spec/research-form) | Progressive disclosure for 7-15 fields |

---

## Current State

| Form | Fields | Tabs | Layout |
|------|--------|------|--------|
| **Contacts** | 11 | 2 (Main/More) | Stacked single-column |
| **Organizations** | 12 | 2 (Main/More) | 2-column FormGrid |
| **Opportunities** | 19 | 4 tabs | Mixed layouts |

---

## Target Architecture

### New Reusable Components

```
src/components/admin/form/
├── CollapsibleSection.tsx    # NEW
├── CompactFormRow.tsx        # NEW
├── FormSection.tsx           # EXISTING
├── FormGrid.tsx              # EXISTING
└── index.ts                  # UPDATE
```

### Form-Specific Files

```
src/atomic-crm/contacts/
├── ContactCompactForm.tsx         # NEW
├── ContactAdditionalDetails.tsx   # NEW
├── ContactInputs.tsx              # MODIFY
├── ContactCreate.tsx              # MODIFY
├── ContactMainTab.tsx             # DELETE
└── ContactMoreTab.tsx             # DELETE

src/atomic-crm/organizations/
├── OrganizationCompactForm.tsx    # NEW
├── OrganizationInputs.tsx         # MODIFY
├── OrganizationCreate.tsx         # MODIFY
├── OrganizationMainTab.tsx        # DELETE
└── OrganizationMoreTab.tsx        # DELETE

src/atomic-crm/opportunities/
├── forms/OpportunityCompactForm.tsx    # NEW
├── forms/OpportunityInputs.tsx         # MODIFY
├── OpportunityCreate.tsx               # MODIFY
├── forms/tabs/*                        # DELETE (4 files)
```

---

## Execution Plan

### Stage 1: Foundation Components (Sequential)

Execute these tasks in order before dispatching parallel agents.

#### Task A1: Write Failing Tests for CollapsibleSection

**File:** `src/components/admin/form/__tests__/CollapsibleSection.test.tsx`

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "../CollapsibleSection";

describe("CollapsibleSection", () => {
  it("renders collapsed by default", () => {
    render(
      <CollapsibleSection title="Additional Details">
        <input data-testid="hidden-input" />
      </CollapsibleSection>
    );
    expect(screen.getByRole("button", { name: /additional details/i })).toBeInTheDocument();
    expect(screen.queryByTestId("hidden-input")).not.toBeVisible();
  });

  it("expands when trigger clicked", () => {
    render(
      <CollapsibleSection title="Additional Details">
        <input data-testid="hidden-input" />
      </CollapsibleSection>
    );
    fireEvent.click(screen.getByRole("button", { name: /additional details/i }));
    expect(screen.getByTestId("hidden-input")).toBeVisible();
  });

  it("supports defaultOpen prop", () => {
    render(
      <CollapsibleSection title="Details" defaultOpen>
        <input data-testid="visible-input" />
      </CollapsibleSection>
    );
    expect(screen.getByTestId("visible-input")).toBeVisible();
  });

  it("has 44px minimum touch target", () => {
    render(<CollapsibleSection title="Test"><div /></CollapsibleSection>);
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveClass("h-11");
  });
});
```

**Constitution Checklist:**
- [ ] No retry logic
- [ ] Semantic Tailwind colors only
- [ ] 44px touch targets (h-11)

---

#### Task A2: Implement CollapsibleSection

**File:** `src/components/admin/form/CollapsibleSection.tsx`

```typescript
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("border border-border rounded-md", className)}
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between px-3",
          "text-sm font-medium text-muted-foreground",
          "hover:bg-muted/50 transition-colors",
          "h-11",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <span>{title}</span>
        <ChevronDown
          data-testid="collapsible-chevron"
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
```

---

#### Task A3: Write Failing Tests for CompactFormRow

**File:** `src/components/admin/form/__tests__/CompactFormRow.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { CompactFormRow } from "../CompactFormRow";

describe("CompactFormRow", () => {
  it("renders children in a grid", () => {
    render(
      <CompactFormRow>
        <input data-testid="input-1" />
        <input data-testid="input-2" />
      </CompactFormRow>
    );
    expect(screen.getByTestId("input-1")).toBeInTheDocument();
    expect(screen.getByTestId("input-2")).toBeInTheDocument();
  });

  it("applies 2-column grid by default on md+", () => {
    const { container } = render(
      <CompactFormRow><div /><div /></CompactFormRow>
    );
    expect(container.firstChild).toHaveClass("md:grid-cols-2");
  });

  it("supports custom column configuration", () => {
    const { container } = render(
      <CompactFormRow columns="grid-cols-[1fr_1fr_auto]">
        <div /><div /><div />
      </CompactFormRow>
    );
    expect(container.firstChild).toHaveClass("grid-cols-[1fr_1fr_auto]");
  });

  it("uses gap-3 for spacing", () => {
    const { container } = render(<CompactFormRow><div /></CompactFormRow>);
    expect(container.firstChild).toHaveClass("gap-3");
  });
});
```

---

#### Task A4: Implement CompactFormRow

**File:** `src/components/admin/form/CompactFormRow.tsx`

```typescript
import { cn } from "@/lib/utils";

interface CompactFormRowProps {
  children: React.ReactNode;
  columns?: string;
  className?: string;
  alignItems?: "start" | "center" | "end";
}

export const CompactFormRow = ({
  children,
  columns,
  className,
  alignItems = "end",
}: CompactFormRowProps) => {
  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  }[alignItems];

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        columns ?? "md:grid-cols-2",
        alignClass,
        className
      )}
    >
      {children}
    </div>
  );
};
```

---

#### Task A5: Update Exports

**File:** `src/components/admin/form/index.ts`

```typescript
export { FormSection } from "./FormSection";
export { FormGrid } from "./FormGrid";
export { CollapsibleSection } from "./CollapsibleSection";
export { CompactFormRow } from "./CompactFormRow";
```

---

### Stage 2: Parallel Agent Dispatch

After Stage 1 completes, dispatch 3 agents **in a single message**:

---

#### AGENT 1 - Contacts Form

```
TASK: Refactor Contact Create form to compact layout
SCOPE: src/atomic-crm/contacts/

FILES TO CREATE:
- src/atomic-crm/contacts/ContactAdditionalDetails.tsx
- src/atomic-crm/contacts/ContactCompactForm.tsx

FILES TO MODIFY:
- src/atomic-crm/contacts/ContactInputs.tsx
- src/atomic-crm/contacts/ContactCreate.tsx

FILES TO DELETE:
- src/atomic-crm/contacts/ContactMainTab.tsx
- src/atomic-crm/contacts/ContactMoreTab.tsx

CONSTRAINTS:
- Use CollapsibleSection and CompactFormRow from @/components/admin/form
- Preserve smart email parsing (handleEmailPaste, handleEmailBlur)
- Preserve CreateInDialogButton for organization creation
- Keep data-tutorial attributes
- Tailwind v4 semantic colors only
- 44px touch targets (h-11)

DELIVERABLE:
- Compact form: 4 visible rows + 1 collapsible section
- All tests pass
- Form saves correctly
```

---

#### AGENT 2 - Organizations Form

```
TASK: Refactor Organization Create form to compact layout
SCOPE: src/atomic-crm/organizations/

FILES TO CREATE:
- src/atomic-crm/organizations/OrganizationCompactForm.tsx

FILES TO MODIFY:
- src/atomic-crm/organizations/OrganizationInputs.tsx
- src/atomic-crm/organizations/OrganizationCreate.tsx

FILES TO DELETE:
- src/atomic-crm/organizations/OrganizationMainTab.tsx
- src/atomic-crm/organizations/OrganizationMoreTab.tsx

CONSTRAINTS:
- Use CollapsibleSection and CompactFormRow from @/components/admin/form
- Preserve DuplicateCheckSaveButton and duplicate warning dialog
- Organization types: principal, distributor, operator, unknown
- Segments: A, B, C, D

DELIVERABLE:
- Compact form: 4 visible rows + 1 collapsible section
- Duplicate check preserved
- All tests pass
```

---

#### AGENT 3 - Opportunities Form

```
TASK: Refactor Opportunity Create form to compact layout
SCOPE: src/atomic-crm/opportunities/

FILES TO CREATE:
- src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx

FILES TO MODIFY:
- src/atomic-crm/opportunities/forms/OpportunityInputs.tsx
- src/atomic-crm/opportunities/OpportunityCreate.tsx

FILES TO DELETE:
- src/atomic-crm/opportunities/forms/tabs/OpportunityGeneralTab.tsx
- src/atomic-crm/opportunities/forms/tabs/OpportunityClassificationTab.tsx
- src/atomic-crm/opportunities/forms/tabs/OpportunityRelationshipsTab.tsx
- src/atomic-crm/opportunities/forms/tabs/OpportunityAdditionalInfoTab.tsx

CONSTRAINTS:
- Use CollapsibleSection and CompactFormRow from @/components/admin/form
- Preserve OpportunityCreateSaveButton and similar opportunities dialog
- Relationships section: defaultOpen={true}
- 7 pipeline stages, 3 priority levels

DELIVERABLE:
- Compact form: 6 visible fields + 3 collapsible sections
- Similar opportunity check preserved
- All tests pass
```

---

### Stage 3: Integration & Verification

After all agents complete:

1. **Run tests:** `npm test`
2. **Check types:** `npm run build`
3. **Visual verification:**
   - 1440px desktop: no scrolling
   - 1024px iPad: minimal scrolling

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│           STAGE 1: Foundation (Sequential)              │
│  A1 → A2 → A3 → A4 → A5                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────┬─────────────────┬─────────────────────┐
│   AGENT 1       │   AGENT 2       │     AGENT 3         │
│   Contacts      │   Organizations │     Opportunities   │
│   (parallel)    │   (parallel)    │     (parallel)      │
└─────────────────┴─────────────────┴─────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           STAGE 3: Integration & Verification           │
└─────────────────────────────────────────────────────────┘
```

---

## Files Summary

| Action | Count | Files |
|--------|-------|-------|
| CREATE | 6 | CollapsibleSection, CompactFormRow, 3 CompactForms, 1 AdditionalDetails |
| MODIFY | 7 | form/index, 3 Inputs, 3 Create |
| DELETE | 8 | Contact tabs (2), Org tabs (2), Opp tabs (4) |

---

## Verification Checklist

- [ ] No scrolling on 1440px desktop
- [ ] Minimal scrolling on 1024px iPad
- [ ] 44px touch targets maintained
- [ ] Smart features preserved (email parsing, duplicate checks)
- [ ] Form validation works
- [ ] All tests pass
- [ ] No TypeScript errors
