# Pipedrive-Style Kanban Board Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing kanban board into a Pipedrive-style visual pipeline with richer cards, inline actions, stage metrics, progression indicators, and column customization.

**Architecture:** Enhance existing `@hello-pangea/dnd` implementation in `src/atomic-crm/opportunities/` by enriching OpportunityCard with more visible data, adding OpportunityColumn header metrics, implementing inline actions menu, quick-add modal, and localStorage-based column customization preferences.

**Tech Stack:** React 19, TypeScript, @hello-pangea/dnd, React Admin, Zod, Tailwind CSS 4, date-fns, Vitest, React Testing Library

---

## Phase 1: Enhanced Card Details & Visual Polish

### Task 1.1: Add Contact Data Hook

**Files:**
- Create: `src/atomic-crm/opportunities/useOpportunityContacts.ts`
- Test: `src/atomic-crm/opportunities/__tests__/useOpportunityContacts.test.ts`

**Step 1: Write the failing test**

Create test file:

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useOpportunityContacts } from "../useOpportunityContacts";
import { useGetMany } from "react-admin";
import { describe, it, expect, vi } from "vitest";

vi.mock("react-admin", () => ({
  useGetMany: vi.fn(),
}));

describe("useOpportunityContacts", () => {
  it("returns primary contact when contact_ids has values", async () => {
    (useGetMany as any).mockReturnValue({
      data: [{ id: 1, firstName: "John", lastName: "Doe" }],
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useOpportunityContacts([1, 2])
    );

    await waitFor(() => {
      expect(result.current.primaryContact).toEqual({
        id: 1,
        firstName: "John",
        lastName: "Doe",
      });
    });
  });

  it("returns null when contact_ids is empty", () => {
    (useGetMany as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useOpportunityContacts([]));

    expect(result.current.primaryContact).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test useOpportunityContacts.test.ts
```

Expected: FAIL with "Cannot find module '../useOpportunityContacts'"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/opportunities/useOpportunityContacts.ts`:

```typescript
import { useGetMany } from "react-admin";
import type { Contact } from "../types";

export function useOpportunityContacts(contactIds: number[]) {
  const { data: contacts, isLoading } = useGetMany<Contact>(
    "contacts",
    { ids: contactIds },
    { enabled: contactIds.length > 0 }
  );

  const primaryContact = contacts && contacts.length > 0 ? contacts[0] : null;

  return {
    primaryContact,
    isLoading,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test useOpportunityContacts.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/opportunities/useOpportunityContacts.ts src/atomic-crm/opportunities/__tests__/useOpportunityContacts.test.ts
git commit -m "feat(opportunities): add hook to fetch primary contact"
```

---

### Task 1.2: Redesign OpportunityCard Component

**Files:**
- Modify: `src/atomic-crm/opportunities/OpportunityCard.tsx`
- Test: `src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx`

**Step 1: Write the failing test**

Create test file:

```typescript
import { render, screen } from "@testing-library/react";
import { OpportunityCard } from "../OpportunityCard";
import { describe, it, expect, vi } from "vitest";
import { useOpportunityContacts } from "../useOpportunityContacts";

vi.mock("../useOpportunityContacts");
vi.mock("react-admin", () => ({
  useRecordContext: () => ({
    id: 1,
    name: "Test Opportunity",
    contact_ids: [1],
    estimated_close_date: "2025-12-31",
    priority: "high",
    days_in_stage: 5,
    last_interaction_date: "2025-11-01",
  }),
}));

describe("OpportunityCard", () => {
  it("displays primary contact name", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: { id: 1, firstName: "John", lastName: "Doe" },
      isLoading: false,
    });

    render(<OpportunityCard index={0} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("displays estimated close date", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    render(<OpportunityCard index={0} />);

    expect(screen.getByText(/Dec 31/)).toBeInTheDocument();
  });

  it("displays days in stage badge", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    render(<OpportunityCard index={0} />);

    expect(screen.getByText("5 days in stage")).toBeInTheDocument();
  });

  it("shows priority badge with correct color", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    render(<OpportunityCard index={0} />);

    const badge = screen.getByText("High");
    expect(badge).toHaveClass("bg-destructive");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test OpportunityCard.test.tsx
```

Expected: FAIL (elements not found)

**Step 3: Update OpportunityCard implementation**

Modify `src/atomic-crm/opportunities/OpportunityCard.tsx`:

```typescript
import { useRecordContext, type Identifier } from "react-admin";
import { Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { useOpportunityContacts } from "./useOpportunityContacts";
import type { Opportunity } from "../types";

interface OpportunityCardProps {
  index: number;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive text-destructive-foreground",
};

export function OpportunityCard({ index }: OpportunityCardProps) {
  const record = useRecordContext<Opportunity>();
  const { primaryContact, isLoading: contactsLoading } = useOpportunityContacts(
    record?.contact_ids || []
  );

  if (!record) return null;

  const closeDate = record.estimated_close_date
    ? format(new Date(record.estimated_close_date), "MMM d, yyyy")
    : "No date set";

  const daysInStage = record.days_in_stage || 0;
  const isStuck = daysInStage > 14;

  return (
    <Draggable draggableId={String(record.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-card rounded-lg border border-border
            p-[var(--spacing-widget-padding)]
            mb-[var(--spacing-content)]
            transition-all duration-200
            hover:shadow-md hover:-translate-y-1
            ${snapshot.isDragging ? "opacity-50 rotate-2" : "opacity-100"}
          `}
        >
          {/* Header: Name + Priority */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-sm text-foreground line-clamp-2">
              {record.name}
            </h3>
            <span
              className={`
                text-xs px-2 py-0.5 rounded-full whitespace-nowrap
                ${priorityColors[record.priority || "medium"]}
              `}
            >
              {record.priority ? record.priority.charAt(0).toUpperCase() + record.priority.slice(1) : "Medium"}
            </span>
          </div>

          {/* Primary Contact */}
          {contactsLoading ? (
            <div className="h-4 bg-muted animate-pulse rounded mb-2" />
          ) : primaryContact ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>
                {primaryContact.firstName} {primaryContact.lastName}
              </span>
            </div>
          ) : null}

          {/* Close Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{closeDate}</span>
          </div>

          {/* Days in Stage Badge */}
          {daysInStage > 0 && (
            <div
              className={`
                inline-flex items-center gap-1 text-xs px-2 py-1 rounded
                ${isStuck ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}
              `}
            >
              {isStuck && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span>{daysInStage} days in stage</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test OpportunityCard.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/opportunities/OpportunityCard.tsx src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx
git commit -m "feat(opportunities): enhance card with contact, date, and stage indicators"
```

---

### Task 1.3: Add Stage Metrics to Column Headers

**Files:**
- Modify: `src/atomic-crm/opportunities/OpportunityColumn.tsx`
- Create: `src/atomic-crm/opportunities/useStageMetrics.ts`
- Test: `src/atomic-crm/opportunities/__tests__/useStageMetrics.test.ts`

**Step 1: Write the failing test for metrics hook**

Create `src/atomic-crm/opportunities/__tests__/useStageMetrics.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { calculateStageMetrics } from "../useStageMetrics";

describe("calculateStageMetrics", () => {
  it("calculates count and average days in stage", () => {
    const opportunities = [
      { id: 1, days_in_stage: 5 },
      { id: 2, days_in_stage: 10 },
      { id: 3, days_in_stage: 15 },
    ];

    const metrics = calculateStageMetrics(opportunities);

    expect(metrics.count).toBe(3);
    expect(metrics.avgDaysInStage).toBe(10);
    expect(metrics.stuckCount).toBe(1); // >14 days
  });

  it("handles empty array", () => {
    const metrics = calculateStageMetrics([]);

    expect(metrics.count).toBe(0);
    expect(metrics.avgDaysInStage).toBe(0);
    expect(metrics.stuckCount).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test useStageMetrics.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Implement metrics calculation**

Create `src/atomic-crm/opportunities/useStageMetrics.ts`:

```typescript
import type { Opportunity } from "../types";

export interface StageMetrics {
  count: number;
  avgDaysInStage: number;
  stuckCount: number; // >14 days
}

export function calculateStageMetrics(
  opportunities: Opportunity[]
): StageMetrics {
  if (opportunities.length === 0) {
    return { count: 0, avgDaysInStage: 0, stuckCount: 0 };
  }

  const totalDays = opportunities.reduce(
    (sum, opp) => sum + (opp.days_in_stage || 0),
    0
  );
  const avgDays = Math.round(totalDays / opportunities.length);
  const stuck = opportunities.filter((opp) => (opp.days_in_stage || 0) > 14).length;

  return {
    count: opportunities.length,
    avgDaysInStage: avgDays,
    stuckCount: stuck,
  };
}

export function useStageMetrics(opportunities: Opportunity[]): StageMetrics {
  return calculateStageMetrics(opportunities);
}
```

**Step 4: Run test to verify it passes**

```bash
npm test useStageMetrics.test.ts
```

Expected: PASS

**Step 5: Update OpportunityColumn to show metrics**

Modify `src/atomic-crm/opportunities/OpportunityColumn.tsx` (add to existing file):

```typescript
// Add import at top
import { useStageMetrics } from "./useStageMetrics";

// Inside component, after getting filtered opportunities:
const metrics = useStageMetrics(filteredOpportunities);

// Update header section (replace existing stage name header):
<div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
  <div className="flex items-center gap-2">
    <h2 className="font-semibold text-base text-foreground">
      {stage.label}
    </h2>
    <span className="text-sm text-muted-foreground">
      ({metrics.count})
    </span>
  </div>

  {metrics.count > 0 && (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span title="Average days in this stage">
        ~{metrics.avgDaysInStage}d
      </span>
      {metrics.stuckCount > 0 && (
        <span className="text-warning" title="Opportunities stuck >14 days">
          ⚠ {metrics.stuckCount}
        </span>
      )}
    </div>
  )}
</div>
```

**Step 6: Run tests**

```bash
npm test OpportunityColumn
```

Expected: PASS

**Step 7: Commit**

```bash
git add src/atomic-crm/opportunities/useStageMetrics.ts src/atomic-crm/opportunities/__tests__/useStageMetrics.test.ts src/atomic-crm/opportunities/OpportunityColumn.tsx
git commit -m "feat(opportunities): add stage metrics to column headers"
```

---

## Phase 2: Inline Actions & Quick-Add

### Task 2.1: Create Inline Actions Menu Component

**Files:**
- Create: `src/atomic-crm/opportunities/OpportunityCardActions.tsx`
- Test: `src/atomic-crm/opportunities/__tests__/OpportunityCardActions.test.tsx`

**Step 1: Write the failing test**

Create test file:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { OpportunityCardActions } from "../OpportunityCardActions";
import { describe, it, expect, vi } from "vitest";

describe("OpportunityCardActions", () => {
  it("shows actions menu on button click", () => {
    render(<OpportunityCardActions opportunityId={1} />);

    const button = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(button);

    expect(screen.getByText("View Details")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Mark as Won")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("prevents drag when clicking actions button", () => {
    const onMouseDown = vi.fn();
    render(<OpportunityCardActions opportunityId={1} />);

    const button = screen.getByRole("button", { name: /actions/i });
    button.onmousedown = onMouseDown;

    fireEvent.mouseDown(button);

    expect(onMouseDown).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test OpportunityCardActions.test.tsx
```

Expected: FAIL

**Step 3: Implement actions menu component**

Create `src/atomic-crm/opportunities/OpportunityCardActions.tsx`:

```typescript
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdate, useDelete, useNotify, useRefresh } from "react-admin";

interface OpportunityCardActionsProps {
  opportunityId: number;
}

export function OpportunityCardActions({ opportunityId }: OpportunityCardActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const notify = useNotify();
  const refresh = useRefresh();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opportunities/${opportunityId}/show`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opportunities/${opportunityId}`);
  };

  const handleMarkWon = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await update("opportunities", {
        id: opportunityId,
        data: { stage: "closed_won" },
        previousData: {},
      });
      notify("Opportunity marked as won", { type: "success" });
      refresh();
    } catch (error) {
      notify("Error updating opportunity", { type: "error" });
    }
    setIsOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this opportunity?")) {
      try {
        await deleteOne("opportunities", { id: opportunityId, previousData: {} });
        notify("Opportunity deleted", { type: "success" });
        refresh();
      } catch (error) {
        notify("Error deleting opportunity", { type: "error" });
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Actions menu"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => e.stopPropagation()} // Prevent drag
        className="p-1 rounded hover:bg-muted transition-colors"
      >
        <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={handleViewDetails}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              View Details
            </button>
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleMarkWon}
              className="w-full px-4 py-2 text-left text-sm text-success-strong hover:bg-accent transition-colors"
            >
              Mark as Won
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test OpportunityCardActions.test.tsx
```

Expected: PASS

**Step 5: Integrate into OpportunityCard**

Modify `src/atomic-crm/opportunities/OpportunityCard.tsx` (add actions menu to header):

```typescript
// Add import
import { OpportunityCardActions } from "./OpportunityCardActions";

// In the header section, update to:
<div className="flex items-start justify-between gap-2 mb-2">
  <h3 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
    {record.name}
  </h3>
  <div className="flex items-center gap-1">
    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${priorityColors[record.priority || "medium"]}`}>
      {record.priority ? record.priority.charAt(0).toUpperCase() + record.priority.slice(1) : "Medium"}
    </span>
    <OpportunityCardActions opportunityId={record.id as number} />
  </div>
</div>
```

**Step 6: Commit**

```bash
git add src/atomic-crm/opportunities/OpportunityCardActions.tsx src/atomic-crm/opportunities/__tests__/OpportunityCardActions.test.tsx src/atomic-crm/opportunities/OpportunityCard.tsx
git commit -m "feat(opportunities): add inline actions menu to cards"
```

---

### Task 2.2: Create Quick-Add Opportunity Modal

**Files:**
- Create: `src/atomic-crm/opportunities/QuickAddOpportunity.tsx`
- Test: `src/atomic-crm/opportunities/__tests__/QuickAddOpportunity.test.tsx`

**Step 1: Write the failing test**

Create test file:

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuickAddOpportunity } from "../QuickAddOpportunity";
import { describe, it, expect, vi } from "vitest";

vi.mock("react-admin", () => ({
  useCreate: () => [vi.fn().mockResolvedValue({ data: { id: 1 } })],
  useNotify: () => vi.fn(),
  useRefresh: () => vi.fn(),
}));

describe("QuickAddOpportunity", () => {
  it("renders button to open modal", () => {
    render(<QuickAddOpportunity stage="new_lead" />);

    expect(screen.getByText("+ New Opportunity")).toBeInTheDocument();
  });

  it("opens modal on button click", () => {
    render(<QuickAddOpportunity stage="new_lead" />);

    fireEvent.click(screen.getByText("+ New Opportunity"));

    expect(screen.getByText("Create Opportunity")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("pre-fills stage field with column stage", () => {
    render(<QuickAddOpportunity stage="demo_scheduled" />);

    fireEvent.click(screen.getByText("+ New Opportunity"));

    const stageInput = screen.getByDisplayValue("Demo Scheduled");
    expect(stageInput).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test QuickAddOpportunity.test.tsx
```

Expected: FAIL

**Step 3: Implement quick-add component**

Create `src/atomic-crm/opportunities/QuickAddOpportunity.tsx`:

```typescript
import { useState } from "react";
import { useCreate, useNotify, useRefresh } from "react-admin";
import { opportunityCreateSchema } from "../validation/opportunities";
import type { OpportunityStageValue } from "../types";

interface QuickAddOpportunityProps {
  stage: OpportunityStageValue;
}

export function QuickAddOpportunity({ stage }: QuickAddOpportunityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      notify("Name is required", { type: "error" });
      return;
    }

    try {
      const validatedData = opportunityCreateSchema.parse({
        name: name.trim(),
        stage,
        status: "active",
      });

      await create("opportunities", { data: validatedData });
      notify("Opportunity created", { type: "success" });
      setIsOpen(false);
      setName("");
      refresh();
    } catch (error) {
      notify("Error creating opportunity", { type: "error" });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-2 px-3 text-sm text-primary hover:bg-primary/10 rounded transition-colors border border-dashed border-border"
      >
        + New Opportunity
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Opportunity</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter opportunity name"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Stage</label>
                <input
                  type="text"
                  value={stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setName("");
                  }}
                  className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test QuickAddOpportunity.test.tsx
```

Expected: PASS

**Step 5: Add to OpportunityColumn**

Modify `src/atomic-crm/opportunities/OpportunityColumn.tsx` (add at top of column, before opportunities):

```typescript
// Add import
import { QuickAddOpportunity } from "./QuickAddOpportunity";

// Add after header, before droppable section:
<div className="mb-3">
  <QuickAddOpportunity stage={stage.value} />
</div>
```

**Step 6: Commit**

```bash
git add src/atomic-crm/opportunities/QuickAddOpportunity.tsx src/atomic-crm/opportunities/__tests__/QuickAddOpportunity.test.tsx src/atomic-crm/opportunities/OpportunityColumn.tsx
git commit -m "feat(opportunities): add quick-add opportunity button to columns"
```

---

## Phase 3: Column Customization

### Task 3.1: Create Column Preferences Hook

**Files:**
- Create: `src/atomic-crm/opportunities/useColumnPreferences.ts`
- Test: `src/atomic-crm/opportunities/__tests__/useColumnPreferences.test.ts`

**Step 1: Write the failing test**

Create test file:

```typescript
import { renderHook, act } from "@testing-library/react";
import { useColumnPreferences } from "../useColumnPreferences";
import { describe, it, expect, beforeEach } from "vitest";

describe("useColumnPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with all columns visible and expanded", () => {
    const { result } = renderHook(() => useColumnPreferences());

    expect(result.current.collapsedStages).toEqual([]);
    expect(result.current.visibleStages).toEqual([
      "new_lead",
      "initial_outreach",
      "sample_visit_offered",
      "awaiting_response",
      "feedback_logged",
      "demo_scheduled",
      "closed_won",
      "closed_lost",
    ]);
  });

  it("toggles column collapse state", () => {
    const { result } = renderHook(() => useColumnPreferences());

    act(() => {
      result.current.toggleCollapse("new_lead");
    });

    expect(result.current.collapsedStages).toContain("new_lead");
  });

  it("persists preferences to localStorage", () => {
    const { result } = renderHook(() => useColumnPreferences());

    act(() => {
      result.current.toggleCollapse("new_lead");
    });

    const stored = localStorage.getItem("opportunity.kanban.collapsed_stages");
    expect(stored).toBe(JSON.stringify(["new_lead"]));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test useColumnPreferences.test.ts
```

Expected: FAIL

**Step 3: Implement preferences hook**

Create `src/atomic-crm/opportunities/useColumnPreferences.ts`:

```typescript
import { useState, useEffect } from "react";
import type { OpportunityStageValue } from "../types";
import { OPPORTUNITY_STAGES } from "./stageConstants";

const COLLAPSED_KEY = "opportunity.kanban.collapsed_stages";
const VISIBLE_KEY = "opportunity.kanban.visible_stages";

export function useColumnPreferences() {
  const allStages = OPPORTUNITY_STAGES.map((s) => s.value);

  const [collapsedStages, setCollapsedStages] = useState<OpportunityStageValue[]>(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [visibleStages, setVisibleStages] = useState<OpportunityStageValue[]>(() => {
    const stored = localStorage.getItem(VISIBLE_KEY);
    return stored ? JSON.parse(stored) : allStages;
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsedStages));
  }, [collapsedStages]);

  useEffect(() => {
    localStorage.setItem(VISIBLE_KEY, JSON.stringify(visibleStages));
  }, [visibleStages]);

  const toggleCollapse = (stage: OpportunityStageValue) => {
    setCollapsedStages((prev) =>
      prev.includes(stage)
        ? prev.filter((s) => s !== stage)
        : [...prev, stage]
    );
  };

  const toggleVisibility = (stage: OpportunityStageValue) => {
    setVisibleStages((prev) =>
      prev.includes(stage)
        ? prev.filter((s) => s !== stage)
        : [...prev, stage]
    );
  };

  const collapseAll = () => {
    setCollapsedStages(allStages);
  };

  const expandAll = () => {
    setCollapsedStages([]);
  };

  return {
    collapsedStages,
    visibleStages,
    toggleCollapse,
    toggleVisibility,
    collapseAll,
    expandAll,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test useColumnPreferences.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/opportunities/useColumnPreferences.ts src/atomic-crm/opportunities/__tests__/useColumnPreferences.test.ts
git commit -m "feat(opportunities): add column preferences hook"
```

---

### Task 3.2: Add Column Customization Controls

**Files:**
- Create: `src/atomic-crm/opportunities/ColumnCustomizationMenu.tsx`
- Modify: `src/atomic-crm/opportunities/OpportunityListContent.tsx`
- Test: `src/atomic-crm/opportunities/__tests__/ColumnCustomizationMenu.test.tsx`

**Step 1: Write the failing test**

Create test file:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnCustomizationMenu } from "../ColumnCustomizationMenu";
import { describe, it, expect, vi } from "vitest";

describe("ColumnCustomizationMenu", () => {
  const mockProps = {
    visibleStages: ["new_lead", "initial_outreach"],
    toggleVisibility: vi.fn(),
    collapseAll: vi.fn(),
    expandAll: vi.fn(),
  };

  it("renders customization button", () => {
    render(<ColumnCustomizationMenu {...mockProps} />);

    expect(screen.getByRole("button", { name: /customize/i })).toBeInTheDocument();
  });

  it("shows menu on button click", () => {
    render(<ColumnCustomizationMenu {...mockProps} />);

    fireEvent.click(screen.getByRole("button", { name: /customize/i }));

    expect(screen.getByText("Collapse All")).toBeInTheDocument();
    expect(screen.getByText("Expand All")).toBeInTheDocument();
  });

  it("calls collapseAll when clicked", () => {
    render(<ColumnCustomizationMenu {...mockProps} />);

    fireEvent.click(screen.getByRole("button", { name: /customize/i }));
    fireEvent.click(screen.getByText("Collapse All"));

    expect(mockProps.collapseAll).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test ColumnCustomizationMenu.test.tsx
```

Expected: FAIL

**Step 3: Implement customization menu**

Create `src/atomic-crm/opportunities/ColumnCustomizationMenu.tsx`:

```typescript
import { useState, useRef, useEffect } from "react";
import { OPPORTUNITY_STAGES } from "./stageConstants";
import type { OpportunityStageValue } from "../types";

interface ColumnCustomizationMenuProps {
  visibleStages: OpportunityStageValue[];
  toggleVisibility: (stage: OpportunityStageValue) => void;
  collapseAll: () => void;
  expandAll: () => void;
}

export function ColumnCustomizationMenu({
  visibleStages,
  toggleVisibility,
  collapseAll,
  expandAll,
}: ColumnCustomizationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Customize columns"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-sm border border-border rounded hover:bg-accent transition-colors"
      >
        Customize Columns
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-64 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-border">
              <button
                onClick={() => {
                  collapseAll();
                  setIsOpen(false);
                }}
                className="text-sm text-primary hover:underline mr-3"
              >
                Collapse All
              </button>
              <button
                onClick={() => {
                  expandAll();
                  setIsOpen(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                Expand All
              </button>
            </div>

            <div className="px-4 py-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Visible Stages
              </p>
              {OPPORTUNITY_STAGES.map((stage) => (
                <label
                  key={stage.value}
                  className="flex items-center gap-2 py-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleStages.includes(stage.value)}
                    onChange={() => toggleVisibility(stage.value)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">{stage.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test ColumnCustomizationMenu.test.tsx
```

Expected: PASS

**Step 5: Integrate into OpportunityListContent**

Modify `src/atomic-crm/opportunities/OpportunityListContent.tsx`:

```typescript
// Add imports
import { useColumnPreferences } from "./useColumnPreferences";
import { ColumnCustomizationMenu } from "./ColumnCustomizationMenu";

// Inside component, after other hooks:
const {
  collapsedStages,
  visibleStages,
  toggleCollapse,
  toggleVisibility,
  collapseAll,
  expandAll,
} = useColumnPreferences();

// Add controls above the kanban board:
<div className="flex justify-end mb-4">
  <ColumnCustomizationMenu
    visibleStages={visibleStages}
    toggleVisibility={toggleVisibility}
    collapseAll={collapseAll}
    expandAll={expandAll}
  />
</div>

// Filter columns by visibility:
{OPPORTUNITY_STAGES.filter((stage) => visibleStages.includes(stage.value)).map((stage) => (
  <OpportunityColumn
    key={stage.value}
    stage={stage}
    isCollapsed={collapsedStages.includes(stage.value)}
    onToggleCollapse={() => toggleCollapse(stage.value)}
  />
))}
```

**Step 6: Update OpportunityColumn to handle collapse**

Modify `src/atomic-crm/opportunities/OpportunityColumn.tsx` (add props and conditional rendering):

```typescript
// Add to props interface:
interface OpportunityColumnProps {
  stage: OpportunityStage;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Add collapse button in header:
<button
  type="button"
  onClick={onToggleCollapse}
  className="p-1 hover:bg-accent rounded transition-colors"
  aria-label={isCollapsed ? "Expand column" : "Collapse column"}
>
  <svg className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
</button>

// Conditional rendering of column content:
{isCollapsed ? (
  <div className="flex items-center justify-center py-8 text-muted-foreground">
    <span className="text-sm">{metrics.count} opportunities</span>
  </div>
) : (
  <Droppable droppableId={stage.value}>
    {/* existing droppable content */}
  </Droppable>
)}
```

**Step 7: Commit**

```bash
git add src/atomic-crm/opportunities/ColumnCustomizationMenu.tsx src/atomic-crm/opportunities/__tests__/ColumnCustomizationMenu.test.tsx src/atomic-crm/opportunities/OpportunityListContent.tsx src/atomic-crm/opportunities/OpportunityColumn.tsx
git commit -m "feat(opportunities): add column customization menu"
```

---

## Phase 4: Testing & Documentation

### Task 4.1: Run Full Test Suite

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass with >70% coverage

**Step 2: Check coverage**

```bash
npm run test:coverage
```

Expected: opportunities module has >70% coverage

**Step 3: Fix any failing tests**

(If tests fail, debug and fix them before proceeding)

**Step 4: Commit if fixes were needed**

```bash
git add .
git commit -m "test(opportunities): fix test failures"
```

---

### Task 4.2: Create E2E Tests

**Files:**
- Create: `tests/e2e/opportunities-kanban-enhancements.spec.ts`

**Step 1: Write E2E test**

Create test file:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Opportunities Kanban Enhancements", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/");
    await page.fill('input[name="username"]', "admin@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to opportunities
    await page.click('a[href*="/opportunities"]');
    await page.waitForSelector('[data-testid="kanban-board"]');
  });

  test("displays enhanced card details", async ({ page }) => {
    const firstCard = page.locator(".opportunity-card").first();

    // Check for contact name
    await expect(firstCard.locator("text=John Doe")).toBeVisible();

    // Check for close date
    await expect(firstCard.locator('[aria-label="Estimated close date"]')).toBeVisible();

    // Check for days in stage badge
    await expect(firstCard.locator("text=/\\d+ days in stage/")).toBeVisible();
  });

  test("shows stage metrics in column headers", async ({ page }) => {
    const column = page.locator('[data-stage="new_lead"]').first();

    // Check for count
    await expect(column.locator("text=/\\(\\d+\\)/")).toBeVisible();

    // Check for average days
    await expect(column.locator("text=/~\\d+d/")).toBeVisible();
  });

  test("opens inline actions menu", async ({ page }) => {
    const firstCard = page.locator(".opportunity-card").first();

    // Click actions button
    await firstCard.locator('[aria-label="Actions menu"]').click();

    // Verify menu items
    await expect(page.locator("text=View Details")).toBeVisible();
    await expect(page.locator("text=Edit")).toBeVisible();
    await expect(page.locator("text=Mark as Won")).toBeVisible();
    await expect(page.locator("text=Delete")).toBeVisible();
  });

  test("quick-add creates opportunity in correct stage", async ({ page }) => {
    // Click quick-add in "Initial Outreach" column
    await page.locator('[data-stage="initial_outreach"] button:has-text("+ New Opportunity")').click();

    // Fill form
    await page.fill('input[id="name"]', "Test Quick-Add Opportunity");
    await page.click('button[type="submit"]:has-text("Create")');

    // Verify opportunity appears in correct column
    await expect(page.locator('[data-stage="initial_outreach"] text=Test Quick-Add Opportunity')).toBeVisible();
  });

  test("column customization collapses and expands columns", async ({ page }) => {
    // Open customization menu
    await page.click('button:has-text("Customize Columns")');

    // Click collapse all
    await page.click('button:has-text("Collapse All")');

    // Verify columns are collapsed
    const collapsedColumn = page.locator('[data-stage="new_lead"]').first();
    await expect(collapsedColumn.locator("text=/\\d+ opportunities/")).toBeVisible();

    // Expand all
    await page.click('button:has-text("Customize Columns")');
    await page.click('button:has-text("Expand All")');

    // Verify columns are expanded
    await expect(page.locator(".opportunity-card").first()).toBeVisible();
  });

  test("column visibility toggles work", async ({ page }) => {
    // Open customization menu
    await page.click('button:has-text("Customize Columns")');

    // Uncheck "Closed Lost"
    await page.uncheck('input[type="checkbox"] ~ text=Closed Lost');

    // Close menu
    await page.click('body'); // Click outside

    // Verify column is hidden
    await expect(page.locator('[data-stage="closed_lost"]')).not.toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

```bash
npm run test:e2e
```

Expected: All E2E tests pass

**Step 3: Fix any failures**

(Debug and fix if needed)

**Step 4: Commit**

```bash
git add tests/e2e/opportunities-kanban-enhancements.spec.ts
git commit -m "test(opportunities): add E2E tests for kanban enhancements"
```

---

### Task 4.3: Update Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Document in CLAUDE.md**

Add to "Opportunities Module" section in `CLAUDE.md`:

```markdown
### Kanban Board Features

**View:** Default view with drag-and-drop stage transitions

**Enhanced Cards:**
- Primary contact name with icon
- Estimated close date
- Priority badge (semantic colors)
- Days in stage indicator
- Warning badge for stuck opportunities (>14 days)
- Inline actions menu (view, edit, mark won, delete)

**Column Features:**
- Stage metrics in headers (count, avg days, stuck count)
- Quick-add opportunity button (pre-fills stage)
- Collapse/expand individual columns
- Column visibility toggle

**Customization:**
- Preferences persisted to localStorage
- Keys: `opportunity.kanban.collapsed_stages`, `opportunity.kanban.visible_stages`
- "Customize Columns" menu with collapse all/expand all

**Library:** `@hello-pangea/dnd` v18.0.1 (fork of react-beautiful-dnd)

**Ref:** [Implementation Plan](docs/plans/2025-11-10-pipedrive-kanban-enhancements.md)
```

**Step 2: Commit documentation**

```bash
git add CLAUDE.md
git commit -m "docs(opportunities): document kanban enhancements"
```

---

## Phase 5: Final Review & Verification

### Task 5.1: Manual QA Testing

**Step 1: Start development server**

```bash
npm run dev:local
```

**Step 2: Test each feature manually**

Checklist:
- [ ] Enhanced cards show all details correctly
- [ ] Stage metrics update when opportunities move
- [ ] Inline actions menu works (view, edit, mark won, delete)
- [ ] Quick-add creates opportunities in correct stage
- [ ] Column collapse/expand works
- [ ] Column visibility toggle works
- [ ] Preferences persist after page reload
- [ ] Drag-and-drop still works correctly
- [ ] No console errors
- [ ] Responsive on iPad (768px)

**Step 3: Document any issues found**

(Create bug fixes if needed)

---

### Task 5.2: Final Commit and Summary

**Step 1: Final commit**

```bash
git add .
git commit -m "feat(opportunities): pipedrive-style kanban enhancements complete

- Enhanced cards with contact, date, priority, and stage indicators
- Stage metrics in column headers (count, avg days, stuck count)
- Inline actions menu (view, edit, mark won, delete)
- Quick-add opportunity button in each column
- Column customization (collapse, visibility)
- Preferences persisted to localStorage
- Full test coverage (unit + E2E)

Ref: docs/plans/2025-11-10-pipedrive-kanban-enhancements.md"
```

**Step 2: Verify git log**

```bash
git log --oneline -10
```

Expected: Clean commit history with descriptive messages

---

## Completion Checklist

✅ Enhanced card details implemented
✅ Stage metrics added to columns
✅ Inline actions menu working
✅ Quick-add functionality complete
✅ Column customization implemented
✅ All unit tests passing (>70% coverage)
✅ E2E tests passing
✅ Documentation updated
✅ Manual QA complete
✅ Commits follow conventional commit format
