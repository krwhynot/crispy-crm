# Form Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate 4-tab forms to 2-tab (Main/More) pattern, convert Activities to single-page with collapsible sections, add high-impact UX features (smart defaults, save+new, keyboard shortcuts, recent selections).

**Architecture:** Modify existing `TabbedFormInputs` consumers (ContactInputs, OrganizationInputs) to use 2-tab structure. Replace ActivityCreate's tabbed layout with shadcn Accordion sections. Create new shared form components (FormGrid, FormSection, FormActions, SaveButtonGroup) in `/src/components/admin/form/`. Add hooks for smart defaults and recent selections.

**Tech Stack:** React 19, React Admin, react-hook-form, Zod, shadcn/ui (Tabs, Accordion, Tooltip, DropdownMenu), Tailwind CSS v4, Vitest + RTL

**Design Document:** `docs/plans/2025-11-29-form-improvements-design.md` (1,867 lines, comprehensive spec)

---

## Phase 0: Pre-requisite Setup

### Task 0: Resolve form.tsx Namespace Clash

**Rationale:** The existing `src/components/admin/form.tsx` file (252 lines) contains core form primitives (Form, FormField, FormLabel, FormControl, FormDescription, FormError, SaveButton). Creating a `src/components/admin/form/` directory alongside it causes module resolution conflicts. Solution: Move existing file INTO the directory and create a barrel file.

**Files:**
- Create: `src/components/admin/form/` directory
- Move: `src/components/admin/form.tsx` → `src/components/admin/form/form-primitives.tsx`
- Create: `src/components/admin/form/index.ts` (barrel re-exporting everything)

**Why this works:**
- Existing imports `import { X } from "@/components/admin/form"` continue to work
- Module resolution: `form/` directory → `form/index.ts` → re-exports from `form-primitives.tsx`
- No need to update 26+ import statements!

**Step 1: Create the new directory**

```bash
mkdir -p src/components/admin/form/__tests__
```

**Step 2: Move existing file into directory**

```bash
mv src/components/admin/form.tsx src/components/admin/form/form-primitives.tsx
```

**Step 3: Create barrel file that re-exports everything**

```typescript
// src/components/admin/form/index.ts

// Re-export original form utilities (maintains backward compatibility)
export * from "./form-primitives";

// New form improvement components (uncomment as we build them)
// export { FormGrid } from "./FormGrid";
// export { FormSection } from "./FormSection";
// export { FormActions } from "./FormActions";
// export { SaveButtonGroup } from "./SaveButtonGroup";
// export { FormLoadingSkeleton } from "./FormLoadingSkeleton";
// export { useFormShortcuts } from "./useFormShortcuts";
```

**Step 4: Verify imports still resolve**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(form): restructure form.tsx into form/ directory

- Move form.tsx to form/form-primitives.tsx
- Create barrel file for clean exports
- Maintains backward compatibility with existing imports
- Prepares namespace for new form components"
```

**Directory Structure After Phase 1:**
```
src/components/admin/form/
├── index.ts                    # Barrel file (exports all)
├── form-primitives.tsx         # Original form.tsx content
├── FormGrid.tsx                # Task 1
├── FormSection.tsx             # Task 2
├── FormActions.tsx             # Task 7
├── SaveButtonGroup.tsx         # Task 6
├── FormLoadingSkeleton.tsx     # Task 0.5 (new)
├── useFormShortcuts.ts         # Task 5
└── __tests__/
    ├── FormGrid.test.tsx
    ├── FormSection.test.tsx
    ├── FormActions.test.tsx
    ├── SaveButtonGroup.test.tsx
    └── useFormShortcuts.test.tsx
```

---

### Task 0.5: Create FormLoadingSkeleton Component

**Rationale:** When `useSmartDefaults` hook is loading identity data, we need to show a skeleton state instead of an empty form or flash of content. This is a reusable component for all Create forms.

**Files:**
- Create: `src/components/admin/form/FormLoadingSkeleton.tsx`
- Test: `src/components/admin/form/__tests__/FormLoadingSkeleton.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/admin/form/__tests__/FormLoadingSkeleton.test.tsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormLoadingSkeleton } from "../FormLoadingSkeleton";

describe("FormLoadingSkeleton", () => {
  test("renders default 4 rows", () => {
    render(<FormLoadingSkeleton />);

    // Each row has 2 skeleton fields (for 2-column layout)
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    // 4 rows × 2 columns × 2 elements (label + input) = 16 skeletons
    expect(skeletons.length).toBeGreaterThanOrEqual(8);
  });

  test("renders specified number of rows", () => {
    render(<FormLoadingSkeleton rows={2} />);

    // 2 rows × 2 columns = 4 field groups minimum
    const fieldGroups = document.querySelectorAll(".space-y-2");
    expect(fieldGroups.length).toBeGreaterThanOrEqual(4);
  });

  test("renders single column when twoColumn is false", () => {
    render(<FormLoadingSkeleton rows={2} twoColumn={false} />);

    // Should NOT have grid-cols-2
    const grids = document.querySelectorAll(".grid-cols-2");
    expect(grids.length).toBe(0);
  });

  test("wraps in Card component", () => {
    render(<FormLoadingSkeleton />);

    // Card provides the container styling
    expect(document.querySelector("[data-slot='card']")).toBeInTheDocument();
  });

  test("applies semantic spacing classes", () => {
    render(<FormLoadingSkeleton />);

    // Uses design system spacing
    expect(document.querySelector(".space-y-6")).toBeInTheDocument();
    expect(document.querySelector(".p-6")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/admin/form/__tests__/FormLoadingSkeleton.test.tsx
```

Expected: FAIL with "Cannot find module '../FormLoadingSkeleton'"

**Step 3: Write implementation**

```typescript
// src/components/admin/form/FormLoadingSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface FormLoadingSkeletonProps {
  /** Number of field rows to show (default: 4) */
  rows?: number;
  /** Show 2-column grid for each row (default: true) */
  twoColumn?: boolean;
}

/**
 * Loading skeleton for forms waiting on async data (e.g., identity).
 * Matches the visual structure of FormGrid's 2-column layout.
 *
 * Usage in Create forms:
 * ```tsx
 * const { defaults, isLoading } = useSmartDefaults();
 * if (isLoading) return <FormLoadingSkeleton rows={4} />;
 * ```
 */
export const FormLoadingSkeleton = ({
  rows = 4,
  twoColumn = true,
}: FormLoadingSkeletonProps) => (
  <Card data-slot="card">
    <CardContent className="space-y-6 p-6">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={twoColumn ? "grid grid-cols-2 gap-6" : ""}
        >
          {/* First field */}
          <div className="space-y-2">
            <Skeleton data-slot="skeleton" className="h-4 w-20" />
            <Skeleton data-slot="skeleton" className="h-11 w-full" />
          </div>

          {/* Second field (only in 2-column mode) */}
          {twoColumn && (
            <div className="space-y-2">
              <Skeleton data-slot="skeleton" className="h-4 w-20" />
              <Skeleton data-slot="skeleton" className="h-11 w-full" />
            </div>
          )}
        </div>
      ))}
    </CardContent>
  </Card>
);
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/components/admin/form/__tests__/FormLoadingSkeleton.test.tsx
```

Expected: PASS (5 tests)

**Step 5: Update barrel export**

```typescript
// src/components/admin/form/index.ts
// Add to exports:
export { FormLoadingSkeleton } from "./FormLoadingSkeleton";
```

**Step 6: Commit**

```bash
git add src/components/admin/form/FormLoadingSkeleton.tsx src/components/admin/form/__tests__/FormLoadingSkeleton.test.tsx
git commit -m "feat(form): add FormLoadingSkeleton for async loading states"
```

---

## Phase 1: Shared Form Components (Foundation)

### Task 1: FormGrid Component

**Files:**
- Create: `src/components/admin/form/FormGrid.tsx`
- Test: `src/components/admin/form/__tests__/FormGrid.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/admin/form/__tests__/FormGrid.test.tsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormGrid } from "../FormGrid";

describe("FormGrid", () => {
  test("renders children in 2-column grid by default", () => {
    render(
      <FormGrid>
        <div data-testid="child-1">Field 1</div>
        <div data-testid="child-2">Field 2</div>
      </FormGrid>
    );

    const grid = screen.getByTestId("child-1").parentElement;
    expect(grid).toHaveClass("grid", "grid-cols-1", "md:grid-cols-2");
  });

  test("renders 4-column grid when columns=4", () => {
    render(
      <FormGrid columns={4}>
        <div data-testid="child">Field</div>
      </FormGrid>
    );

    const grid = screen.getByTestId("child").parentElement;
    expect(grid).toHaveClass("grid-cols-2", "md:grid-cols-4");
  });

  test("applies gap utilities", () => {
    render(
      <FormGrid>
        <div data-testid="child">Field</div>
      </FormGrid>
    );

    const grid = screen.getByTestId("child").parentElement;
    expect(grid).toHaveClass("gap-x-6", "gap-y-5");
  });

  test("accepts custom className", () => {
    render(
      <FormGrid className="custom-class">
        <div data-testid="child">Field</div>
      </FormGrid>
    );

    const grid = screen.getByTestId("child").parentElement;
    expect(grid).toHaveClass("custom-class");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/admin/form/__tests__/FormGrid.test.tsx
```

Expected: FAIL with "Cannot find module '../FormGrid'"

**Step 3: Write minimal implementation**

```typescript
// src/components/admin/form/FormGrid.tsx
import { cn } from "@/lib/utils";

interface FormGridProps {
  children: React.ReactNode;
  columns?: 2 | 4;
  className?: string;
}

export const FormGrid = ({ children, columns = 2, className }: FormGridProps) => (
  <div
    className={cn(
      "grid gap-x-6 gap-y-5",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 4 && "grid-cols-2 md:grid-cols-4",
      className
    )}
  >
    {children}
  </div>
);
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/components/admin/form/__tests__/FormGrid.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/components/admin/form/FormGrid.tsx src/components/admin/form/__tests__/FormGrid.test.tsx
git commit -m "feat(form): add FormGrid component for 2/4-column layouts"
```

---

### Task 2: FormSection Component

**Files:**
- Create: `src/components/admin/form/FormSection.tsx`
- Test: `src/components/admin/form/__tests__/FormSection.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/admin/form/__tests__/FormSection.test.tsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormSection } from "../FormSection";

describe("FormSection", () => {
  test("renders section title in uppercase", () => {
    render(
      <FormSection title="Activity Details">
        <div>Content</div>
      </FormSection>
    );

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Activity Details");
    expect(heading).toHaveClass("uppercase");
  });

  test("renders horizontal divider after title", () => {
    render(
      <FormSection title="Test Section">
        <div>Content</div>
      </FormSection>
    );

    const divider = document.querySelector(".h-px.bg-border");
    expect(divider).toBeInTheDocument();
  });

  test("renders children content", () => {
    render(
      <FormSection title="Test">
        <div data-testid="section-content">Form fields here</div>
      </FormSection>
    );

    expect(screen.getByTestId("section-content")).toBeInTheDocument();
  });

  test("accepts custom className", () => {
    render(
      <FormSection title="Test" className="custom-section">
        <div>Content</div>
      </FormSection>
    );

    const section = screen.getByRole("heading", { level: 3 }).closest("section");
    expect(section).toHaveClass("custom-section");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/admin/form/__tests__/FormSection.test.tsx
```

Expected: FAIL with "Cannot find module '../FormSection'"

**Step 3: Write minimal implementation**

```typescript
// src/components/admin/form/FormSection.tsx
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection = ({ title, children, className }: FormSectionProps) => (
  <section className={cn("space-y-5", className)}>
    {/* Section header with divider */}
    <div className="flex items-center gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {title}
      </h3>
      <div className="flex-1 h-px bg-border" />
    </div>

    {/* Section content */}
    <div className="space-y-5">{children}</div>
  </section>
);
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/components/admin/form/__tests__/FormSection.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/components/admin/form/FormSection.tsx src/components/admin/form/__tests__/FormSection.test.tsx
git commit -m "feat(form): add FormSection component with uppercase title + divider"
```

---

### Task 3: useSmartDefaults Hook

**Rationale:** `useGetIdentity` is async - it returns `undefined` on first render. React Hook Form's `defaultValues` only applies once at mount. We need to handle async identity resolution with either a loading state or form reset pattern.

**Files:**
- Create: `src/atomic-crm/hooks/useSmartDefaults.ts`
- Test: `src/atomic-crm/hooks/__tests__/useSmartDefaults.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/hooks/__tests__/useSmartDefaults.test.tsx
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSmartDefaults } from "../useSmartDefaults";

// Mock with delayed identity resolution
vi.mock("ra-core", () => ({
  useGetIdentity: vi.fn(),
}));

describe("useSmartDefaults", () => {
  const mockUseGetIdentity = vi.mocked(require("ra-core").useGetIdentity);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns loading state while identity resolves", () => {
    mockUseGetIdentity.mockReturnValue({ identity: null, isLoading: true });

    const { result } = renderHook(() => useSmartDefaults());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.defaults.sales_id).toBeUndefined();
  });

  test("returns sales_id when identity resolves", () => {
    mockUseGetIdentity.mockReturnValue({
      identity: { id: "user-123" },
      isLoading: false,
    });

    const { result } = renderHook(() => useSmartDefaults());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.defaults.sales_id).toBe("user-123");
  });

  test("calls reset with sales_id when identity arrives after mount", async () => {
    const mockReset = vi.fn();

    // Start with loading
    mockUseGetIdentity.mockReturnValue({ identity: null, isLoading: true });

    const { rerender } = renderHook(() =>
      useSmartDefaults({
        reset: mockReset,
        currentValues: { first_name: "John", sales_id: undefined },
      })
    );

    expect(mockReset).not.toHaveBeenCalled();

    // Identity resolves
    mockUseGetIdentity.mockReturnValue({
      identity: { id: "user-123" },
      isLoading: false,
    });

    rerender();

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith(
        { first_name: "John", sales_id: "user-123" },
        { keepDirtyValues: true }
      );
    });
  });

  test("does not reset if sales_id already has value", () => {
    const mockReset = vi.fn();
    mockUseGetIdentity.mockReturnValue({
      identity: { id: "user-123" },
      isLoading: false,
    });

    renderHook(() =>
      useSmartDefaults({
        reset: mockReset,
        currentValues: { sales_id: "other-user" }, // Already set
      })
    );

    expect(mockReset).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/hooks/__tests__/useSmartDefaults.test.tsx
```

Expected: FAIL with "Cannot find module '../useSmartDefaults'"

**Step 3: Write implementation that handles async identity**

```typescript
// src/atomic-crm/hooks/useSmartDefaults.ts
import { useGetIdentity } from "ra-core";
import { useEffect, useRef } from "react";
import { UseFormReset } from "react-hook-form";

interface SmartDefaults {
  sales_id: string | number | undefined;
}

interface UseSmartDefaultsOptions {
  reset?: UseFormReset<any>;
  currentValues?: Record<string, any>;
}

/**
 * Returns smart default values and handles async identity resolution.
 *
 * CRITICAL: useGetIdentity is async - returns undefined on first render.
 * React Hook Form's defaultValues only applies at mount. This hook provides
 * two patterns to handle this:
 *
 * Usage Pattern 1 (wait for identity):
 *   const { defaults, isLoading } = useSmartDefaults();
 *   if (isLoading) return <Loading />;
 *   return <Form defaultValues={defaults}>
 *
 * Usage Pattern 2 (reset when identity arrives):
 *   const { reset, getValues } = useFormContext();
 *   useSmartDefaults({ reset, currentValues: getValues() });
 */
export const useSmartDefaults = (options?: UseSmartDefaultsOptions): {
  defaults: SmartDefaults;
  isLoading: boolean;
} => {
  const { identity, isLoading } = useGetIdentity();
  const hasAppliedDefaults = useRef(false);

  const defaults: SmartDefaults = {
    sales_id: identity?.id,
  };

  // If reset function provided, apply defaults when identity resolves
  useEffect(() => {
    if (options?.reset && identity?.id && !hasAppliedDefaults.current) {
      const currentSalesId = options.currentValues?.sales_id;

      // Only reset if sales_id is still empty (user hasn't manually selected)
      if (!currentSalesId) {
        options.reset(
          { ...options.currentValues, sales_id: identity.id },
          { keepDirtyValues: true } // Don't overwrite user edits
        );
        hasAppliedDefaults.current = true;
      }
    }
  }, [identity?.id, options?.reset, options?.currentValues]);

  return { defaults, isLoading };
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/hooks/__tests__/useSmartDefaults.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/hooks/useSmartDefaults.ts src/atomic-crm/hooks/__tests__/useSmartDefaults.test.tsx
git commit -m "feat(hooks): add useSmartDefaults with async identity handling"
```

---

### Task 4: useRecentSelections Hook

**Files:**
- Create: `src/atomic-crm/hooks/useRecentSelections.ts`
- Test: `src/atomic-crm/hooks/__tests__/useRecentSelections.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/hooks/__tests__/useRecentSelections.test.tsx
import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentSelections } from "../useRecentSelections";

describe("useRecentSelections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("returns empty array when no recent selections", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    expect(result.current.getRecent()).toEqual([]);
  });

  test("adds selection to recent list", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      result.current.addRecent({ id: "org-1", name: "Sysco Foods" });
    });

    expect(result.current.getRecent()).toEqual([
      { id: "org-1", name: "Sysco Foods" },
    ]);
  });

  test("maintains max 5 recent selections", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      for (let i = 1; i <= 7; i++) {
        result.current.addRecent({ id: `org-${i}`, name: `Org ${i}` });
      }
    });

    const recent = result.current.getRecent();
    expect(recent).toHaveLength(5);
    expect(recent[0].id).toBe("org-7"); // Most recent first
    expect(recent[4].id).toBe("org-3"); // Oldest kept
  });

  test("moves existing selection to front (dedupes)", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      result.current.addRecent({ id: "org-1", name: "First" });
      result.current.addRecent({ id: "org-2", name: "Second" });
      result.current.addRecent({ id: "org-1", name: "First Updated" });
    });

    const recent = result.current.getRecent();
    expect(recent).toHaveLength(2);
    expect(recent[0]).toEqual({ id: "org-1", name: "First Updated" });
  });

  test("clears recent selections", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      result.current.addRecent({ id: "org-1", name: "Test" });
      result.current.clearRecent();
    });

    expect(result.current.getRecent()).toEqual([]);
  });

  test("isolates storage by field type", () => {
    const { result: orgHook } = renderHook(() => useRecentSelections("organization"));
    const { result: contactHook } = renderHook(() => useRecentSelections("contact"));

    act(() => {
      orgHook.current.addRecent({ id: "org-1", name: "Org" });
      contactHook.current.addRecent({ id: "contact-1", name: "Contact" });
    });

    expect(orgHook.current.getRecent()).toHaveLength(1);
    expect(contactHook.current.getRecent()).toHaveLength(1);
    expect(orgHook.current.getRecent()[0].id).toBe("org-1");
    expect(contactHook.current.getRecent()[0].id).toBe("contact-1");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/hooks/__tests__/useRecentSelections.test.tsx
```

Expected: FAIL with "Cannot find module '../useRecentSelections'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/hooks/useRecentSelections.ts
const STORAGE_KEY_PREFIX = "crm_recent_";
const MAX_RECENT = 5;

type FieldType = "organization" | "contact" | "opportunity";

interface RecentSelection {
  id: string;
  name: string;
}

interface UseRecentSelectionsReturn {
  getRecent: () => RecentSelection[];
  addRecent: (selection: RecentSelection) => void;
  clearRecent: () => void;
}

/**
 * Manages recent selections for autocomplete fields using localStorage.
 * Per design spec: Show last 5 used options at top of dropdown with clear button.
 */
export const useRecentSelections = (fieldType: FieldType): UseRecentSelectionsReturn => {
  const storageKey = `${STORAGE_KEY_PREFIX}${fieldType}`;

  const getRecent = (): RecentSelection[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addRecent = (selection: RecentSelection) => {
    const recent = getRecent().filter((item) => item.id !== selection.id);
    const updated = [selection, ...recent].slice(0, MAX_RECENT);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const clearRecent = () => {
    localStorage.removeItem(storageKey);
  };

  return { getRecent, addRecent, clearRecent };
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/hooks/__tests__/useRecentSelections.test.tsx
```

Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/hooks/useRecentSelections.ts src/atomic-crm/hooks/__tests__/useRecentSelections.test.tsx
git commit -m "feat(hooks): add useRecentSelections for autocomplete memory"
```

---

### Task 5: useFormShortcuts Hook

**Rationale:** Global `document.addEventListener` fires regardless of focus context. Pressing Cmd+Enter in a textarea shouldn't submit the form if the user is composing multi-line text. Solution: Return a `handleKeyDown` for form-scoped attachment with target guards.

**Files:**
- Create: `src/components/admin/form/useFormShortcuts.ts`
- Test: `src/components/admin/form/__tests__/useFormShortcuts.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/admin/form/__tests__/useFormShortcuts.test.tsx
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormShortcuts } from "../useFormShortcuts";

// Test component that uses the hook with form-scoped onKeyDown
const TestForm = ({
  onSave,
  onSaveAndNew,
  onCancel,
  allowCancelInTextarea = false,
}: any) => {
  const { handleKeyDown } = useFormShortcuts({
    onSave,
    onSaveAndNew,
    onCancel,
    allowCancelInTextarea,
  });

  return (
    <form onKeyDown={handleKeyDown} data-testid="form">
      <input type="text" data-testid="text-input" />
      <textarea data-testid="textarea" />
      <button type="submit">Save</button>
    </form>
  );
};

describe("useFormShortcuts", () => {
  const mockOnSave = vi.fn();
  const mockOnSaveAndNew = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Cmd+Enter in text input triggers onSave", async () => {
    const user = userEvent.setup();
    render(
      <TestForm
        onSave={mockOnSave}
        onSaveAndNew={mockOnSaveAndNew}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId("text-input");
    await user.click(input);
    await user.keyboard("{Meta>}{Enter}{/Meta}");

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  test("Cmd+Enter in textarea triggers onSave (allowed by default)", async () => {
    const user = userEvent.setup();
    render(
      <TestForm
        onSave={mockOnSave}
        onSaveAndNew={mockOnSaveAndNew}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByTestId("textarea");
    await user.click(textarea);
    await user.keyboard("{Meta>}{Enter}{/Meta}");

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  test("Escape in textarea does NOT trigger onCancel by default", async () => {
    const user = userEvent.setup();
    render(
      <TestForm
        onSave={mockOnSave}
        onSaveAndNew={mockOnSaveAndNew}
        onCancel={mockOnCancel}
        allowCancelInTextarea={false}
      />
    );

    const textarea = screen.getByTestId("textarea");
    await user.click(textarea);
    await user.keyboard("{Escape}");

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  test("Escape in text input triggers onCancel", async () => {
    const user = userEvent.setup();
    render(
      <TestForm
        onSave={mockOnSave}
        onSaveAndNew={mockOnSaveAndNew}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId("text-input");
    await user.click(input);
    await user.keyboard("{Escape}");

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test("Cmd+Shift+Enter triggers onSaveAndNew", async () => {
    const user = userEvent.setup();
    render(
      <TestForm
        onSave={mockOnSave}
        onSaveAndNew={mockOnSaveAndNew}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId("text-input");
    await user.click(input);
    await user.keyboard("{Meta>}{Shift>}{Enter}{/Shift}{/Meta}");

    expect(mockOnSaveAndNew).toHaveBeenCalledTimes(1);
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/admin/form/__tests__/useFormShortcuts.test.tsx
```

Expected: FAIL with "Cannot find module '../useFormShortcuts'"

**Step 3: Write form-scoped implementation with target guards**

```typescript
// src/components/admin/form/useFormShortcuts.ts
import { useCallback } from "react";

interface UseFormShortcutsProps {
  onSave: () => void;
  onSaveAndNew: () => void;
  onCancel: () => void;
  /** If true, Cmd+Enter works even in textareas (default: true) */
  allowSaveInTextarea?: boolean;
  /** If true, Escape works in textareas (default: false) */
  allowCancelInTextarea?: boolean;
}

interface UseFormShortcutsReturn {
  /** Attach this to your form's onKeyDown */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Returns a keyDown handler for form-scoped keyboard shortcuts.
 *
 * CRITICAL: Does NOT use document.addEventListener (which ignores focus context).
 * Returns handleKeyDown to attach to the form element directly.
 *
 * Usage:
 *   const { handleKeyDown } = useFormShortcuts({ onSave, onSaveAndNew, onCancel });
 *   return <form onKeyDown={handleKeyDown}>...</form>
 *
 * Shortcuts:
 *   - Cmd/Ctrl+Enter: Save (works in textareas by default)
 *   - Cmd/Ctrl+Shift+Enter: Save + New
 *   - Escape: Cancel (blocked in textareas by default)
 */
export const useFormShortcuts = ({
  onSave,
  onSaveAndNew,
  onCancel,
  allowSaveInTextarea = true,
  allowCancelInTextarea = false,
}: UseFormShortcutsProps): UseFormShortcutsReturn => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTextarea = target instanceof HTMLTextAreaElement;
      const isContentEditable = target.isContentEditable;

      const isEditableContext = isTextarea || isContentEditable;

      // Cmd/Ctrl + Shift + Enter = Save + New (most specific, check first)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Enter") {
        if (!isEditableContext || allowSaveInTextarea) {
          e.preventDefault();
          onSaveAndNew();
        }
        return;
      }

      // Cmd/Ctrl + Enter = Save
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.shiftKey) {
        if (!isEditableContext || allowSaveInTextarea) {
          e.preventDefault();
          onSave();
        }
        return;
      }

      // Escape = Cancel
      // By default, don't cancel when in textarea (user might want to dismiss autocomplete)
      if (e.key === "Escape") {
        if (!isEditableContext || allowCancelInTextarea) {
          e.preventDefault();
          onCancel();
        }
      }
    },
    [onSave, onSaveAndNew, onCancel, allowSaveInTextarea, allowCancelInTextarea]
  );

  return { handleKeyDown };
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/components/admin/form/__tests__/useFormShortcuts.test.tsx
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/components/admin/form/useFormShortcuts.ts src/components/admin/form/__tests__/useFormShortcuts.test.tsx
git commit -m "feat(form): add useFormShortcuts with form-scoped handlers"
```

---

### Task 6: SaveButtonGroup Component (Split Button)

**Rationale:** Using `onClick` on buttons directly bypasses form validation. Using both `type="submit"` and `onClick` causes double execution. Solution: Route all actions through `handleSubmit`, use state to track intended action.

**Files:**
- Create: `src/components/admin/form/SaveButtonGroup.tsx`
- Test: `src/components/admin/form/__tests__/SaveButtonGroup.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/admin/form/__tests__/SaveButtonGroup.test.tsx
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveButtonGroup } from "../SaveButtonGroup";
import { FormProvider, useForm } from "react-hook-form";

/**
 * CRITICAL: FormWrapper must wire form's onSubmit to handleSubmit.
 * Without this, type="submit" buttons do nothing and tests silently pass.
 */
const FormWrapper = ({
  children,
  onSubmit,
}: {
  children: React.ReactNode;
  onSubmit: (data: any) => void;
}) => {
  const methods = useForm({ defaultValues: { name: "test" } });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
};

describe("SaveButtonGroup", () => {
  const mockOnSave = vi.fn();
  const mockOnSaveAndNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders Save button", () => {
    render(
      <FormWrapper onSubmit={mockOnSave}>
        <SaveButtonGroup
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          isSubmitting={false}
        />
      </FormWrapper>
    );

    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
  });

  test("renders dropdown trigger button", () => {
    render(
      <FormWrapper onSubmit={mockOnSave}>
        <SaveButtonGroup
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          isSubmitting={false}
        />
      </FormWrapper>
    );

    // Dropdown trigger has chevron icon
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  test("primary Save button triggers form submit and calls onSave", async () => {
    const user = userEvent.setup();
    const handleFormSubmit = vi.fn();

    render(
      <FormWrapper onSubmit={handleFormSubmit}>
        <SaveButtonGroup
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          isSubmitting={false}
        />
      </FormWrapper>
    );

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      // Form's onSubmit was called with validated data
      expect(handleFormSubmit).toHaveBeenCalledWith({ name: "test" });
    });
  });

  test("dropdown Save + Create Another calls onSaveAndNew (NOT onSave)", async () => {
    const user = userEvent.setup();

    render(
      <FormWrapper onSubmit={mockOnSave}>
        <SaveButtonGroup
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          isSubmitting={false}
        />
      </FormWrapper>
    );

    // Open dropdown (find button with chevron icon)
    const buttons = screen.getAllByRole("button");
    const dropdownTrigger = buttons.find((b) => b.querySelector("svg"));
    await user.click(dropdownTrigger!);

    // Click "Save + Create Another"
    await user.click(screen.getByText(/save \+ create another/i));

    await waitFor(() => {
      expect(mockOnSaveAndNew).toHaveBeenCalledWith({ name: "test" });
    });

    // CRITICAL: onSave must NOT be called - this is the race condition we're preventing
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test("dropdown Save option calls onSave (not onSaveAndNew)", async () => {
    const user = userEvent.setup();

    render(
      <FormWrapper onSubmit={mockOnSave}>
        <SaveButtonGroup
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          isSubmitting={false}
        />
      </FormWrapper>
    );

    // Open dropdown
    const dropdownTrigger = screen.getAllByRole("button")[1];
    await user.click(dropdownTrigger);

    // Click "Save" in dropdown
    const menuItems = screen.getAllByRole("menuitem");
    await user.click(menuItems[0]); // First item is "Save"

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ name: "test" });
    });

    expect(mockOnSaveAndNew).not.toHaveBeenCalled();
  });

  test("does not fire handlers when form validation fails", async () => {
    const user = userEvent.setup();
    const handleFormSubmit = vi.fn();

    // Form with validation that will fail
    const FormWrapperWithValidation = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm({
        defaultValues: { name: "" },
        mode: "onSubmit",
      });
      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleFormSubmit)}>
            <input {...methods.register("name", { required: true })} />
            {children}
          </form>
        </FormProvider>
      );
    };

    render(
      <FormWrapperWithValidation>
        <SaveButtonGroup
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          isSubmitting={false}
        />
      </FormWrapperWithValidation>
    );

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    // Wait a tick and verify form's onSubmit wasn't called
    await new Promise((r) => setTimeout(r, 100));
    expect(handleFormSubmit).not.toHaveBeenCalled();
  });

  test("disables buttons when isSubmitting", () => {
    render(
      <FormWrapper onSubmit={mockOnSave}>
        <SaveButtonGroup
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          isSubmitting={true}
        />
      </FormWrapper>
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/admin/form/__tests__/SaveButtonGroup.test.tsx
```

Expected: FAIL with "Cannot find module '../SaveButtonGroup'"

**Step 3: Write validation-safe implementation (closure pattern)**

```typescript
// src/components/admin/form/SaveButtonGroup.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useCallback } from "react";

type SaveAction = "save" | "saveAndNew";

interface SaveButtonGroupProps {
  onSave: (data: any) => void | Promise<void>;
  onSaveAndNew: (data: any) => void | Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Split button that properly routes through form validation.
 *
 * CRITICAL: Uses closure to pass action directly - avoids async state race condition.
 * setState is async, so setPendingAction("saveAndNew") followed by handleSubmit(onSubmit)()
 * in the same tick reads stale state. Solution: create submit handler with action baked in.
 *
 * Per design spec: For batch entry workflows (e.g., logging multiple activities).
 */
export const SaveButtonGroup = ({
  onSave,
  onSaveAndNew,
  isSubmitting = false,
}: SaveButtonGroupProps) => {
  const { handleSubmit } = useFormContext();

  // Create submit handler that receives action via closure, not state
  const createSubmitHandler = useCallback(
    (action: SaveAction) => {
      return handleSubmit((data) => {
        if (action === "saveAndNew") {
          return onSaveAndNew(data);
        }
        return onSave(data);
      });
    },
    [handleSubmit, onSave, onSaveAndNew]
  );

  // Primary save - triggered by button click
  const handlePrimarySave = useCallback(() => {
    createSubmitHandler("save")();
  }, [createSubmitHandler]);

  // Dropdown save - explicit action
  const handleDropdownSave = useCallback(() => {
    createSubmitHandler("save")();
  }, [createSubmitHandler]);

  // Dropdown save + new - explicit action
  const handleDropdownSaveAndNew = useCallback(() => {
    createSubmitHandler("saveAndNew")();
  }, [createSubmitHandler]);

  return (
    <div className="flex">
      {/* Primary Save button - type="button" since we call handleSubmit manually */}
      <Button
        type="button"
        onClick={handlePrimarySave}
        disabled={isSubmitting}
        className="rounded-r-none min-w-[100px]"
      >
        Save
      </Button>

      {/* Dropdown for Save + New */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            disabled={isSubmitting}
            className="rounded-l-none border-l border-primary-foreground/20 px-2"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDropdownSave}>
            Save
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDropdownSaveAndNew}>
            Save + Create Another
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/components/admin/form/__tests__/SaveButtonGroup.test.tsx
```

Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/components/admin/form/SaveButtonGroup.tsx src/components/admin/form/__tests__/SaveButtonGroup.test.tsx
git commit -m "feat(form): add SaveButtonGroup with validation-safe submit"
```

---

### Task 7: FormActions Component

**Files:**
- Create: `src/components/admin/form/FormActions.tsx`
- Test: `src/components/admin/form/__tests__/FormActions.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/admin/form/__tests__/FormActions.test.tsx
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormActions } from "../FormActions";
import { FormProvider, useForm } from "react-hook-form";

/**
 * CRITICAL: FormWrapper must wire form's onSubmit to handleSubmit.
 * FormActions uses type="submit" for the fallback Save button.
 */
const FormWrapper = ({
  children,
  onSubmit,
  validation,
}: {
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  validation?: Record<string, any>;
}) => {
  const methods = useForm({
    defaultValues: { name: "test" },
    mode: "onSubmit",
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {validation && (
          <input
            {...methods.register("name", validation)}
            data-testid="name-input"
          />
        )}
        {children}
      </form>
    </FormProvider>
  );
};

describe("FormActions", () => {
  const mockOnSave = vi.fn();
  const mockOnSaveAndNew = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders Cancel and Save buttons", () => {
    render(
      <FormWrapper onSubmit={mockOnSave}>
        <FormActions
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          onCancel={mockOnCancel}
        />
      </FormWrapper>
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  test("Save button triggers form submit (goes through validation)", async () => {
    const user = userEvent.setup();
    const handleFormSubmit = vi.fn();

    render(
      <FormWrapper onSubmit={handleFormSubmit}>
        <FormActions
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          onCancel={mockOnCancel}
          showSaveAndNew={false} // Use simple Save button
        />
      </FormWrapper>
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(handleFormSubmit).toHaveBeenCalledWith({ name: "test" });
    });
  });

  test("Save button does NOT call handler when validation fails", async () => {
    const user = userEvent.setup();
    const handleFormSubmit = vi.fn();

    render(
      <FormWrapper
        onSubmit={handleFormSubmit}
        validation={{ required: "Name is required", minLength: 10 }}
      >
        <FormActions
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          onCancel={mockOnCancel}
          showSaveAndNew={false}
        />
      </FormWrapper>
    );

    // Clear the input to fail validation
    const input = screen.getByTestId("name-input");
    await user.clear(input);

    await user.click(screen.getByRole("button", { name: /save/i }));

    // Wait a tick and verify form's onSubmit wasn't called
    await new Promise((r) => setTimeout(r, 100));
    expect(handleFormSubmit).not.toHaveBeenCalled();
  });

  test("renders Delete button when onDelete provided", () => {
    render(
      <FormWrapper onSubmit={mockOnSave}>
        <FormActions
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
        />
      </FormWrapper>
    );

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  test("does not render Delete button when onDelete not provided", () => {
    render(
      <FormWrapper onSubmit={mockOnSave}>
        <FormActions
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          onCancel={mockOnCancel}
        />
      </FormWrapper>
    );

    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  test("calls onCancel when Cancel clicked (no form submit)", async () => {
    const user = userEvent.setup();
    const handleFormSubmit = vi.fn();

    render(
      <FormWrapper onSubmit={handleFormSubmit}>
        <FormActions
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          onCancel={mockOnCancel}
        />
      </FormWrapper>
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(handleFormSubmit).not.toHaveBeenCalled();
  });

  test("calls onDelete when Delete clicked", async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper onSubmit={mockOnSave}>
        <FormActions
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
        />
      </FormWrapper>
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  test("uses SaveButtonGroup when showSaveAndNew is true", () => {
    render(
      <FormWrapper onSubmit={mockOnSave}>
        <FormActions
          onSave={mockOnSave}
          onSaveAndNew={mockOnSaveAndNew}
          onCancel={mockOnCancel}
          showSaveAndNew={true}
        />
      </FormWrapper>
    );

    // SaveButtonGroup has two buttons (Save + dropdown trigger)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3); // Cancel + Save + Dropdown
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/admin/form/__tests__/FormActions.test.tsx
```

Expected: FAIL with "Cannot find module '../FormActions'"

**Step 3: Write implementation (NO onClick+type="submit" conflict)**

```typescript
// src/components/admin/form/FormActions.tsx
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { SaveButtonGroup } from "./SaveButtonGroup";

interface FormActionsProps {
  onSave: (data: any) => void | Promise<void>;
  onSaveAndNew?: (data: any) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  showSaveAndNew?: boolean;
}

/**
 * Form action bar with Delete (far left), Cancel + Save (right).
 * Per design spec: Fitts's Law - primary action rightmost, destructive isolated left.
 *
 * CRITICAL: This component assumes it's inside a <form> with proper onSubmit handler.
 * The fallback Save button uses type="submit" WITHOUT onClick to trigger form
 * validation via handleSubmit. DO NOT add onClick to type="submit" buttons!
 */
export const FormActions = ({
  onSave,
  onSaveAndNew,
  onCancel,
  onDelete,
  isSubmitting = false,
  showSaveAndNew = true,
}: FormActionsProps) => (
  <div className="flex items-center justify-between pt-6 border-t border-border">
    {/* Destructive action - far left */}
    <div>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>

    {/* Primary actions - right aligned */}
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        className="min-w-[100px]"
      >
        Cancel
      </Button>

      {showSaveAndNew && onSaveAndNew ? (
        <SaveButtonGroup
          onSave={onSave}
          onSaveAndNew={onSaveAndNew}
          isSubmitting={isSubmitting}
        />
      ) : (
        // CRITICAL: type="submit" WITHOUT onClick - relies on form's onSubmit
        // This ensures validation runs before save handler is called
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          Save
        </Button>
      )}
    </div>
  </div>
);
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/components/admin/form/__tests__/FormActions.test.tsx
```

Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add src/components/admin/form/FormActions.tsx src/components/admin/form/__tests__/FormActions.test.tsx
git commit -m "feat(form): add FormActions with validation-safe submit"
```

---

### Task 8: Export Barrel File

**Files:**
- Modify: `src/components/admin/form/index.ts` (or create if doesn't exist)

**Step 1: Check if barrel file exists**

```bash
ls -la src/components/admin/form/index.ts
```

**Step 2: Create/Update barrel file**

```typescript
// src/components/admin/form/index.ts
// Re-export existing form components
export * from "./form";

// New form improvement components
export { FormGrid } from "./FormGrid";
export { FormSection } from "./FormSection";
export { FormActions } from "./FormActions";
export { SaveButtonGroup } from "./SaveButtonGroup";
export { useFormShortcuts } from "./useFormShortcuts";
```

**Step 3: Commit**

```bash
git add src/components/admin/form/index.ts
git commit -m "chore(form): add barrel export for new form components"
```

---

### Task 8.5: Create Centralized Form Copy Dictionary

**Rationale:** The design spec defines `CONTACT_FORM_COPY`, `ORGANIZATION_FORM_COPY`, and `ACTIVITY_FORM_COPY` constants for consistent labeling and help text. Centralizing these ensures single source of truth for all form copy.

**Files:**
- Create: `src/atomic-crm/constants/formCopy.ts`
- Test: `src/atomic-crm/constants/__tests__/formCopy.test.ts`

**Step 1: Create the constants directory**

```bash
mkdir -p src/atomic-crm/constants/__tests__
```

**Step 2: Write the failing test**

```typescript
// src/atomic-crm/constants/__tests__/formCopy.test.ts
import { describe, test, expect } from "vitest";
import {
  CONTACT_FORM_COPY,
  ORGANIZATION_FORM_COPY,
  ACTIVITY_FORM_COPY,
} from "../formCopy";

describe("formCopy constants", () => {
  describe("CONTACT_FORM_COPY", () => {
    test("has labels for all contact fields", () => {
      expect(CONTACT_FORM_COPY.labels.first_name).toBe("First Name");
      expect(CONTACT_FORM_COPY.labels.last_name).toBe("Last Name");
      expect(CONTACT_FORM_COPY.labels.organization_id).toBe("Organization");
      expect(CONTACT_FORM_COPY.labels.title).toBe("Title");
      expect(CONTACT_FORM_COPY.labels.sales_id).toBe("Account Owner");
    });

    test("has help text for key fields", () => {
      expect(CONTACT_FORM_COPY.help.organization_id).toBeDefined();
      expect(CONTACT_FORM_COPY.help.sales_id).toBeDefined();
    });

    test("has section headings", () => {
      expect(CONTACT_FORM_COPY.sections.identity).toBe("Identity");
      expect(CONTACT_FORM_COPY.sections.contact).toBe("Contact Information");
    });
  });

  describe("ORGANIZATION_FORM_COPY", () => {
    test("has labels for all organization fields", () => {
      expect(ORGANIZATION_FORM_COPY.labels.name).toBe("Organization Name");
      expect(ORGANIZATION_FORM_COPY.labels.organization_type).toBeDefined();
      expect(ORGANIZATION_FORM_COPY.labels.website).toBe("Website");
    });

    test("has placeholders for relevant fields", () => {
      expect(ORGANIZATION_FORM_COPY.placeholders.website).toContain("https://");
    });
  });

  describe("ACTIVITY_FORM_COPY", () => {
    test("has labels for all activity fields", () => {
      expect(ACTIVITY_FORM_COPY.labels.type).toBe("Interaction Type");
      expect(ACTIVITY_FORM_COPY.labels.subject).toBe("Subject");
      expect(ACTIVITY_FORM_COPY.labels.outcome).toBe("Outcome");
    });

    test("has section headings for collapsible sections", () => {
      expect(ACTIVITY_FORM_COPY.sections.what).toBe("What Happened");
      expect(ACTIVITY_FORM_COPY.sections.context).toBe("Context & Relationships");
    });
  });
});
```

**Step 3: Run test to see it fail (RED)**

```bash
npm test -- src/atomic-crm/constants/__tests__/formCopy.test.ts
```

Expected: FAIL (module not found)

**Step 4: Implement formCopy.ts (GREEN)**

```typescript
// src/atomic-crm/constants/formCopy.ts

/**
 * Centralized copy dictionary for Contact forms.
 * Single source of truth for labels, help text, and placeholders.
 * See design spec: docs/plans/2025-11-29-form-improvements-design.md
 */
export const CONTACT_FORM_COPY = {
  // Field labels
  labels: {
    first_name: "First Name",
    last_name: "Last Name",
    organization_id: "Organization",
    title: "Title",
    sales_id: "Account Owner",
    email: "Email",
    phone: "Phone",
    background: "Background",
    status: "Status",
    linkedin_url: "LinkedIn",
    twitter_url: "Twitter",
  },
  // Help text
  help: {
    organization_id: "Required. The company this contact works for.",
    sales_id: "The team member responsible for this relationship.",
    background: "Any relevant notes about this contact.",
  },
  // Placeholders
  placeholders: {
    first_name: "Jane",
    last_name: "Smith",
    title: "VP of Purchasing",
    linkedin_url: "https://linkedin.com/in/username",
    twitter_url: "https://twitter.com/username",
  },
  // Section headings
  sections: {
    identity: "Identity",
    contact: "Contact Information",
    social: "Social Profiles",
    account: "Account Details",
  },
} as const;

/**
 * Centralized copy dictionary for Organization forms.
 */
export const ORGANIZATION_FORM_COPY = {
  labels: {
    name: "Organization Name",
    organization_type: "Type",
    website: "Website",
    address: "Street Address",
    city: "City",
    state: "State",
    postal_code: "ZIP Code",
    phone_number: "Phone",
    description: "Description",
    sector: "Sector",
    employee_count: "Employees",
    annual_revenue: "Annual Revenue",
    parent_id: "Parent Organization",
  },
  help: {
    organization_type: "Principal, Distributor, or Customer",
    parent_id: "Optional. Links to a parent company.",
  },
  placeholders: {
    name: "Acme Corp",
    website: "https://example.com",
    address: "123 Main St",
    city: "New York",
    postal_code: "10001",
    phone_number: "(555) 123-4567",
  },
  sections: {
    identity: "Organization Details",
    address: "Address",
    details: "Additional Details",
    hierarchy: "Organization Hierarchy",
  },
} as const;

/**
 * Centralized copy dictionary for Activity forms.
 */
export const ACTIVITY_FORM_COPY = {
  labels: {
    type: "Interaction Type",
    subject: "Subject",
    outcome: "Outcome",
    description: "Description",
    date: "Date",
    organization_id: "Organization",
    contact_id: "Contact",
    opportunity_id: "Opportunity",
    sales_id: "Logged By",
    next_steps: "Next Steps",
    follow_up_date: "Follow-up Date",
  },
  help: {
    type: "Select the type of interaction (call, email, meeting, etc.)",
    outcome: "Brief summary of what was accomplished.",
    next_steps: "What should happen next?",
  },
  placeholders: {
    subject: "Discussed product demo",
    outcome: "Customer interested in Q1 pilot",
    next_steps: "Send pricing proposal by Friday",
  },
  sections: {
    what: "What Happened",
    context: "Context & Relationships",
    followup: "Follow-up",
  },
} as const;
```

**Step 5: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/constants/__tests__/formCopy.test.ts
```

Expected: PASS (all tests)

**Step 6: Commit**

```bash
git add src/atomic-crm/constants/formCopy.ts src/atomic-crm/constants/__tests__/formCopy.test.ts
git commit -m "feat(constants): add centralized form copy dictionaries"
```

---

### Task 8.6: Extract US_STATES Constant

**Rationale:** The 51-item US_STATES array should be extracted to a dedicated file to avoid duplication and ensure consistency across address fields.

**Files:**
- Create: `src/atomic-crm/constants/usStates.ts`
- Test: `src/atomic-crm/constants/__tests__/usStates.test.ts`
- Create: `src/atomic-crm/constants/index.ts` (barrel export)

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/constants/__tests__/usStates.test.ts
import { describe, test, expect } from "vitest";
import { US_STATES } from "../usStates";

describe("US_STATES constant", () => {
  test("contains all 50 states plus DC", () => {
    expect(US_STATES).toHaveLength(51);
  });

  test("each state has id (abbreviation) and name", () => {
    US_STATES.forEach((state) => {
      expect(state.id).toMatch(/^[A-Z]{2}$/);
      expect(state.name).toBeTruthy();
      expect(typeof state.name).toBe("string");
    });
  });

  test("states are sorted alphabetically by name", () => {
    const names = US_STATES.map((s) => s.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test("includes common states", () => {
    const ids = US_STATES.map((s) => s.id);
    expect(ids).toContain("NY");
    expect(ids).toContain("CA");
    expect(ids).toContain("TX");
    expect(ids).toContain("FL");
    expect(ids).toContain("DC");
  });

  test("has unique ids", () => {
    const ids = US_STATES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

**Step 2: Run test to see it fail (RED)**

```bash
npm test -- src/atomic-crm/constants/__tests__/usStates.test.ts
```

Expected: FAIL (module not found)

**Step 3: Implement usStates.ts (GREEN)**

```typescript
// src/atomic-crm/constants/usStates.ts

/**
 * US States and DC for address selection fields.
 * Used by SelectInput components in organization and contact forms.
 * Format: { id: "XX", name: "State Name" } for React Admin compatibility.
 */
export const US_STATES = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  { id: "AZ", name: "Arizona" },
  { id: "AR", name: "Arkansas" },
  { id: "CA", name: "California" },
  { id: "CO", name: "Colorado" },
  { id: "CT", name: "Connecticut" },
  { id: "DC", name: "District of Columbia" },
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

export type USStateId = (typeof US_STATES)[number]["id"];
export type USStateName = (typeof US_STATES)[number]["name"];
```

**Step 4: Create barrel export for constants**

```typescript
// src/atomic-crm/constants/index.ts
export { US_STATES } from "./usStates";
export type { USStateId, USStateName } from "./usStates";
export {
  CONTACT_FORM_COPY,
  ORGANIZATION_FORM_COPY,
  ACTIVITY_FORM_COPY,
} from "./formCopy";
```

**Step 5: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/constants/__tests__/usStates.test.ts
```

Expected: PASS (all tests)

**Step 6: Commit**

```bash
git add src/atomic-crm/constants/usStates.ts src/atomic-crm/constants/__tests__/usStates.test.ts src/atomic-crm/constants/index.ts
git commit -m "feat(constants): extract US_STATES to dedicated module"
```

---

## Phase 2: Contact Form Consolidation (4 tabs → 2 tabs)

### Task 9: Create ContactMainTab Component

**Files:**
- Create: `src/atomic-crm/contacts/ContactMainTab.tsx`
- Test: `src/atomic-crm/contacts/__tests__/ContactMainTab.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/contacts/__tests__/ContactMainTab.test.tsx
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactMainTab } from "../ContactMainTab";
import { AdminContext } from "react-admin";
import { FormProvider, useForm } from "react-hook-form";

/**
 * CRITICAL: ContactMainTab uses useFormContext() which requires FormProvider.
 * renderWithAdminContext alone doesn't provide this - we need a custom wrapper.
 */
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      organization_id: null,
      sales_id: null,
      email: [],
      phone: [],
    },
  });

  return (
    <AdminContext>
      <FormProvider {...methods}>
        <form>{children}</form>
      </FormProvider>
    </AdminContext>
  );
};

// Mock the components we're composing
vi.mock("@/components/admin/text-input", () => ({
  TextInput: ({ source, label }: any) => (
    <input data-testid={`input-${source}`} aria-label={label} />
  ),
}));

vi.mock("@/components/admin/reference-input", () => ({
  ReferenceInput: ({ children, source }: any) => (
    <div data-testid={`ref-${source}`}>{children}</div>
  ),
}));

vi.mock("@/components/admin/autocomplete-input", () => ({
  AutocompleteInput: ({ label, source }: any) => (
    <input data-testid={`autocomplete-${source}`} aria-label={label} />
  ),
}));

vi.mock("@/components/admin/array-input", () => ({
  ArrayInput: ({ source, children }: any) => (
    <div data-testid={`input-${source}`}>{children}</div>
  ),
}));

describe("ContactMainTab", () => {
  test("renders first name and last name fields", () => {
    render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    expect(screen.getByTestId("input-first_name")).toBeInTheDocument();
    expect(screen.getByTestId("input-last_name")).toBeInTheDocument();
  });

  test("renders organization reference field", () => {
    render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    expect(screen.getByTestId("ref-organization_id")).toBeInTheDocument();
  });

  test("renders sales rep field", () => {
    render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    expect(screen.getByTestId("ref-sales_id")).toBeInTheDocument();
  });

  test("renders email and phone fields", () => {
    render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    // These are JSONB arrays, so they use ArrayInput
    expect(screen.getByTestId("input-email")).toBeInTheDocument();
    expect(screen.getByTestId("input-phone")).toBeInTheDocument();
  });

  test("uses FormGrid for 2-column layout", () => {
    render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    // FormGrid should be present with grid classes
    const grid = document.querySelector(".grid.md\\:grid-cols-2");
    expect(grid).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/contacts/__tests__/ContactMainTab.test.tsx
```

Expected: FAIL with "Cannot find module '../ContactMainTab'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/contacts/ContactMainTab.tsx
import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { SelectInput } from "@/components/admin/select-input";
import { FormGrid } from "@/components/admin/form/FormGrid";
import { AutocompleteOrganizationInput } from "../organizations/AutocompleteOrganizationInput";
import { CreateInDialogButton } from "@/components/admin/form";
import { OrganizationInputs } from "../organizations/OrganizationInputs";
import { useFormContext } from "react-hook-form";

const emailTypeChoices = [
  { id: "Work", name: "Work" },
  { id: "Home", name: "Home" },
  { id: "Other", name: "Other" },
];

const phoneTypeChoices = [
  { id: "Work", name: "Work" },
  { id: "Mobile", name: "Mobile" },
  { id: "Home", name: "Home" },
  { id: "Other", name: "Other" },
];

/**
 * Main tab for Contact form - contains fields needed 90% of the time.
 * Per design spec: First Name, Last Name, Organization, Sales Rep, Email, Phone
 */
export const ContactMainTab = () => {
  const { setValue } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Names - paired per design spec */}
      <FormGrid>
        <TextInput
          source="first_name"
          label="First Name"
          isRequired
          data-testid="input-first_name"
        />
        <TextInput
          source="last_name"
          label="Last Name"
          isRequired
          data-testid="input-last_name"
        />
      </FormGrid>

      {/* Organization and Sales Rep - paired */}
      <FormGrid>
        <div className="space-y-2">
          <ReferenceInput
            source="organization_id"
            reference="organizations"
            data-testid="ref-organization_id"
          >
            <AutocompleteOrganizationInput
              label="Organization"
              isRequired
              helperText="Contact must belong to an organization"
            />
          </ReferenceInput>
          <CreateInDialogButton
            resource="organizations"
            title="Create New Organization"
            onSave={(newOrg: { id: string }) => setValue("organization_id", newOrg.id)}
          >
            <OrganizationInputs />
          </CreateInDialogButton>
        </div>

        <ReferenceInput
          source="sales_id"
          reference="sales"
          data-testid="ref-sales_id"
        >
          <AutocompleteInput
            label="Sales Rep"
            optionText="first_name"
            isRequired
            helperText="Who owns this contact?"
          />
        </ReferenceInput>
      </FormGrid>

      {/* Contact methods - paired */}
      <FormGrid>
        <ArrayInput source="email" label="Email" data-testid="input-email">
          <SimpleFormIterator inline disableReordering>
            <TextInput source="email" placeholder="Email address" />
            <SelectInput source="type" choices={emailTypeChoices} />
          </SimpleFormIterator>
        </ArrayInput>

        <ArrayInput source="phone" label="Phone" data-testid="input-phone">
          <SimpleFormIterator inline disableReordering>
            <TextInput source="number" placeholder="Phone number" />
            <SelectInput source="type" choices={phoneTypeChoices} />
          </SimpleFormIterator>
        </ArrayInput>
      </FormGrid>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/contacts/__tests__/ContactMainTab.test.tsx
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/ContactMainTab.tsx src/atomic-crm/contacts/__tests__/ContactMainTab.test.tsx
git commit -m "feat(contacts): add ContactMainTab with 2-column grid layout"
```

---

### Task 10: Create ContactMoreTab Component

**Files:**
- Create: `src/atomic-crm/contacts/ContactMoreTab.tsx`
- Test: `src/atomic-crm/contacts/__tests__/ContactMoreTab.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/contacts/__tests__/ContactMoreTab.test.tsx
import { describe, test, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { ContactMoreTab } from "../ContactMoreTab";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

vi.mock("@/components/admin/text-input", () => ({
  TextInput: ({ source, label, multiline }: any) => (
    <input
      data-testid={`input-${source}`}
      aria-label={label}
      data-multiline={multiline}
    />
  ),
}));

describe("ContactMoreTab", () => {
  test("renders title and department fields", () => {
    renderWithAdminContext(<ContactMoreTab />);

    expect(screen.getByTestId("input-title")).toBeInTheDocument();
    expect(screen.getByTestId("input-department")).toBeInTheDocument();
  });

  test("renders LinkedIn URL field (full width)", () => {
    renderWithAdminContext(<ContactMoreTab />);

    const linkedinInput = screen.getByTestId("input-linkedin_url");
    expect(linkedinInput).toBeInTheDocument();
    // Should span full width (col-span-2)
    expect(linkedinInput.closest(".col-span-2")).toBeInTheDocument();
  });

  test("renders notes textarea (full width)", () => {
    renderWithAdminContext(<ContactMoreTab />);

    const notesInput = screen.getByTestId("input-notes");
    expect(notesInput).toBeInTheDocument();
    expect(notesInput).toHaveAttribute("data-multiline", "true");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/contacts/__tests__/ContactMoreTab.test.tsx
```

Expected: FAIL with "Cannot find module '../ContactMoreTab'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/contacts/ContactMoreTab.tsx
import { TextInput } from "@/components/admin/text-input";
import { FormGrid } from "@/components/admin/form/FormGrid";

/**
 * More tab for Contact form - supplementary/optional information.
 * Per design spec: Title, Department, LinkedIn URL, Notes
 */
export const ContactMoreTab = () => {
  return (
    <div className="space-y-6">
      {/* Title and Department - paired */}
      <FormGrid>
        <TextInput
          source="title"
          label="Title"
          helperText="Job title or role"
          data-testid="input-title"
        />
        <TextInput
          source="department"
          label="Department"
          helperText="Department or team"
          data-testid="input-department"
        />
      </FormGrid>

      {/* LinkedIn URL - full width per design spec */}
      <FormGrid>
        <div className="col-span-2">
          <TextInput
            source="linkedin_url"
            label="LinkedIn URL"
            helperText="LinkedIn profile link"
            data-testid="input-linkedin_url"
          />
        </div>
      </FormGrid>

      {/* Notes - full width textarea */}
      <FormGrid>
        <div className="col-span-2">
          <TextInput
            source="notes"
            label="Notes"
            multiline
            rows={4}
            helperText="Internal notes about this contact"
            data-testid="input-notes"
          />
        </div>
      </FormGrid>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/contacts/__tests__/ContactMoreTab.test.tsx
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/ContactMoreTab.tsx src/atomic-crm/contacts/__tests__/ContactMoreTab.test.tsx
git commit -m "feat(contacts): add ContactMoreTab with optional fields"
```

---

### Task 11: Update ContactInputs to 2-Tab Structure

**Files:**
- Modify: `src/atomic-crm/contacts/ContactInputs.tsx`
- Test: `src/atomic-crm/contacts/__tests__/ContactInputs.test.tsx`

**Step 1: Write/update the test**

```typescript
// src/atomic-crm/contacts/__tests__/ContactInputs.test.tsx
import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactInputs } from "../ContactInputs";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

describe("ContactInputs", () => {
  test("renders exactly 2 tabs: Main and More", () => {
    renderWithAdminContext(<ContactInputs />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(screen.getByRole("tab", { name: /main/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /more/i })).toBeInTheDocument();
  });

  test("Main tab is active by default", () => {
    renderWithAdminContext(<ContactInputs />);

    const mainTab = screen.getByRole("tab", { name: /main/i });
    expect(mainTab).toHaveAttribute("aria-selected", "true");
  });

  test("can switch to More tab", async () => {
    const user = userEvent.setup();
    renderWithAdminContext(<ContactInputs />);

    const moreTab = screen.getByRole("tab", { name: /more/i });
    await user.click(moreTab);

    expect(moreTab).toHaveAttribute("aria-selected", "true");
  });

  test("Main tab contains required fields", () => {
    renderWithAdminContext(<ContactInputs />);

    // Required fields should be in Main tab
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify current state fails**

```bash
npm test -- src/atomic-crm/contacts/__tests__/ContactInputs.test.tsx
```

Expected: FAIL (currently has 4 tabs, not 2)

**Step 3: Update implementation**

```typescript
// src/atomic-crm/contacts/ContactInputs.tsx
import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { ContactMainTab } from "./ContactMainTab";
import { ContactMoreTab } from "./ContactMoreTab";

/**
 * Contact form inputs with 2-tab structure (Main / More).
 * Per design spec: Consolidated from 4 tabs for reduced cognitive load.
 */
export const ContactInputs = () => {
  const tabs = [
    {
      key: "main",
      label: "Main",
      fields: [
        "first_name",
        "last_name",
        "organization_id",
        "sales_id",
        "email",
        "phone",
      ],
      content: <ContactMainTab />,
    },
    {
      key: "more",
      label: "More",
      fields: ["title", "department", "linkedin_url", "notes"],
      content: <ContactMoreTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="main" />;
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/contacts/__tests__/ContactInputs.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/ContactInputs.tsx src/atomic-crm/contacts/__tests__/ContactInputs.test.tsx
git commit -m "feat(contacts): consolidate to 2-tab structure (Main/More)"
```

---

## Phase 3: Organization Form Consolidation (4 tabs → 2 tabs)

### Task 12: Create OrganizationMainTab Component

**Files:**
- Create: `src/atomic-crm/organizations/OrganizationMainTab.tsx`
- Test: `src/atomic-crm/organizations/__tests__/OrganizationMainTab.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/organizations/__tests__/OrganizationMainTab.test.tsx
import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import { OrganizationMainTab } from "../OrganizationMainTab";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

describe("OrganizationMainTab", () => {
  test("renders organization name field", () => {
    renderWithAdminContext(<OrganizationMainTab />);

    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
  });

  test("renders organization type select", () => {
    renderWithAdminContext(<OrganizationMainTab />);

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });

  test("renders sales rep reference field", () => {
    renderWithAdminContext(<OrganizationMainTab />);

    expect(screen.getByLabelText(/sales rep/i)).toBeInTheDocument();
  });

  test("renders address fields (street, city, state, zip)", () => {
    renderWithAdminContext(<OrganizationMainTab />);

    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
  });

  test("uses 2-column grid for field pairing", () => {
    renderWithAdminContext(<OrganizationMainTab />);

    const grid = document.querySelector(".grid.md\\:grid-cols-2");
    expect(grid).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/organizations/__tests__/OrganizationMainTab.test.tsx
```

Expected: FAIL with "Cannot find module '../OrganizationMainTab'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/organizations/OrganizationMainTab.tsx
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { FormGrid } from "@/components/admin/form/FormGrid";
import { PrincipalChangeWarning } from "./PrincipalChangeWarning";
import { useRecordContext } from "ra-core";
import { US_STATES } from "@/atomic-crm/constants";

const organizationTypeChoices = [
  { id: "principal", name: "Principal" },
  { id: "distributor", name: "Distributor" },
  { id: "customer", name: "Customer" },
  { id: "unknown", name: "Unknown" },
];

/**
 * Main tab for Organization form - essential fields.
 * Per design spec: Name, Type, Sales Rep, Address (manual entry for MVP).
 */
export const OrganizationMainTab = () => {
  const record = useRecordContext();
  const isEdit = !!record?.id;

  return (
    <div className="space-y-6">
      {/* Name and Type - paired */}
      <FormGrid>
        <TextInput
          source="name"
          label="Organization Name"
          isRequired
        />
        <div className="space-y-2">
          <SelectInput
            source="organization_type"
            label="Type"
            choices={organizationTypeChoices}
            isRequired
            helperText="Principal, Distributor, or Customer"
          />
          {isEdit && <PrincipalChangeWarning />}
        </div>
      </FormGrid>

      {/* Sales Rep and Segment - paired */}
      <FormGrid>
        <ReferenceInput source="sales_id" reference="sales">
          <AutocompleteInput
            label="Sales Rep"
            optionText="first_name"
            isRequired
            helperText="Who owns this account?"
          />
        </ReferenceInput>
        <ReferenceInput source="segment_id" reference="segments">
          <AutocompleteInput
            label="Segment"
            optionText="name"
            helperText="Customer segment for targeting"
          />
        </ReferenceInput>
      </FormGrid>

      {/* Address fields - manual entry per MVP spec */}
      <FormGrid>
        <div className="col-span-2">
          <TextInput
            source="address"
            label="Street Address"
            helperText="Street address or PO Box"
          />
        </div>
      </FormGrid>

      <FormGrid columns={4}>
        <div className="col-span-2">
          <TextInput source="city" label="City" />
        </div>
        <SelectInput
          source="state"
          label="State"
          choices={US_STATES}
        />
        <TextInput
          source="postal_code"
          label="ZIP Code"
          helperText="5 or 9 digit ZIP"
        />
      </FormGrid>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/organizations/__tests__/OrganizationMainTab.test.tsx
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationMainTab.tsx src/atomic-crm/organizations/__tests__/OrganizationMainTab.test.tsx
git commit -m "feat(organizations): add OrganizationMainTab with address fields"
```

---

### Task 13: Create OrganizationMoreTab Component

**Files:**
- Create: `src/atomic-crm/organizations/OrganizationMoreTab.tsx`
- Test: `src/atomic-crm/organizations/__tests__/OrganizationMoreTab.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/organizations/__tests__/OrganizationMoreTab.test.tsx
import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import { OrganizationMoreTab } from "../OrganizationMoreTab";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

describe("OrganizationMoreTab", () => {
  test("renders website field (full width)", () => {
    renderWithAdminContext(<OrganizationMoreTab />);

    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
  });

  test("renders LinkedIn URL field (full width)", () => {
    renderWithAdminContext(<OrganizationMoreTab />);

    expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument();
  });

  test("renders description textarea", () => {
    renderWithAdminContext(<OrganizationMoreTab />);

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  test("renders parent organization reference", () => {
    renderWithAdminContext(<OrganizationMoreTab />);

    expect(screen.getByLabelText(/parent organization/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/organizations/__tests__/OrganizationMoreTab.test.tsx
```

Expected: FAIL with "Cannot find module '../OrganizationMoreTab'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/organizations/OrganizationMoreTab.tsx
import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { FormGrid } from "@/components/admin/form/FormGrid";

/**
 * More tab for Organization form - supplementary information.
 * Per design spec: Website, LinkedIn, Description, Context Links, Parent Org.
 */
export const OrganizationMoreTab = () => {
  return (
    <div className="space-y-6">
      {/* Website - full width (URLs can be long) */}
      <FormGrid>
        <div className="col-span-2">
          <TextInput
            source="website"
            label="Website"
            helperText="Company website"
          />
        </div>
      </FormGrid>

      {/* LinkedIn URL - full width */}
      <FormGrid>
        <div className="col-span-2">
          <TextInput
            source="linkedin_url"
            label="LinkedIn URL"
            helperText="Company LinkedIn page"
          />
        </div>
      </FormGrid>

      {/* Description - full width textarea */}
      <FormGrid>
        <div className="col-span-2">
          <TextInput
            source="description"
            label="Description"
            multiline
            rows={4}
            helperText="Notes about this organization"
          />
        </div>
      </FormGrid>

      {/* Parent Organization - for subsidiaries/branches */}
      <FormGrid>
        <ReferenceInput source="parent_organization_id" reference="organizations">
          <AutocompleteInput
            label="Parent Organization"
            optionText="name"
            helperText="If this is a subsidiary or branch"
          />
        </ReferenceInput>
      </FormGrid>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/organizations/__tests__/OrganizationMoreTab.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationMoreTab.tsx src/atomic-crm/organizations/__tests__/OrganizationMoreTab.test.tsx
git commit -m "feat(organizations): add OrganizationMoreTab with optional fields"
```

---

### Task 14: Update OrganizationInputs to 2-Tab Structure

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationInputs.tsx`
- Test: `src/atomic-crm/organizations/__tests__/OrganizationInputs.test.tsx`

**Step 1: Write/update the test**

```typescript
// src/atomic-crm/organizations/__tests__/OrganizationInputs.test.tsx
import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationInputs } from "../OrganizationInputs";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

describe("OrganizationInputs", () => {
  test("renders exactly 2 tabs: Main and More", () => {
    renderWithAdminContext(<OrganizationInputs />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(screen.getByRole("tab", { name: /main/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /more/i })).toBeInTheDocument();
  });

  test("Main tab is active by default", () => {
    renderWithAdminContext(<OrganizationInputs />);

    const mainTab = screen.getByRole("tab", { name: /main/i });
    expect(mainTab).toHaveAttribute("aria-selected", "true");
  });

  test("Main tab contains name and type fields", () => {
    renderWithAdminContext(<OrganizationInputs />);

    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify current state fails**

```bash
npm test -- src/atomic-crm/organizations/__tests__/OrganizationInputs.test.tsx
```

Expected: FAIL (currently has 4 tabs)

**Step 3: Update implementation**

```typescript
// src/atomic-crm/organizations/OrganizationInputs.tsx
import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { OrganizationMainTab } from "./OrganizationMainTab";
import { OrganizationMoreTab } from "./OrganizationMoreTab";

/**
 * Organization form inputs with 2-tab structure (Main / More).
 * Per design spec: Consolidated from 4 tabs for reduced cognitive load.
 */
export const OrganizationInputs = () => {
  const tabs = [
    {
      key: "main",
      label: "Main",
      fields: [
        "name",
        "organization_type",
        "sales_id",
        "segment_id",
        "address",
        "city",
        "state",
        "postal_code",
      ],
      content: <OrganizationMainTab />,
    },
    {
      key: "more",
      label: "More",
      fields: [
        "website",
        "linkedin_url",
        "description",
        "parent_organization_id",
        "context_links",
      ],
      content: <OrganizationMoreTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="main" />;
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/organizations/__tests__/OrganizationInputs.test.tsx
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationInputs.tsx src/atomic-crm/organizations/__tests__/OrganizationInputs.test.tsx
git commit -m "feat(organizations): consolidate to 2-tab structure (Main/More)"
```

---

## Phase 4: Activities Form Conversion (Tabs → Single Page)

### Task 15: Create ActivitySinglePage Component

**Files:**
- Create: `src/atomic-crm/activities/ActivitySinglePage.tsx`
- Test: `src/atomic-crm/activities/__tests__/ActivitySinglePage.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/activities/__tests__/ActivitySinglePage.test.tsx
import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivitySinglePage } from "../ActivitySinglePage";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

describe("ActivitySinglePage", () => {
  test("renders Activity Details section (always expanded)", () => {
    renderWithAdminContext(<ActivitySinglePage />);

    expect(screen.getByText(/activity details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interaction type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
  });

  test("renders Relationships section (always expanded)", () => {
    renderWithAdminContext(<ActivitySinglePage />);

    expect(screen.getByText(/relationships/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/opportunity/i)).toBeInTheDocument();
  });

  test("renders Follow-up section (collapsed by default)", async () => {
    renderWithAdminContext(<ActivitySinglePage />);

    const followUpTrigger = screen.getByRole("button", { name: /follow-up/i });
    expect(followUpTrigger).toBeInTheDocument();

    // Radix CollapsibleContent unmounts children when closed (not CSS hidden)
    // Therefore queryByLabelText returns null, NOT a hidden element
    expect(screen.queryByLabelText(/follow-up date/i)).toBeNull();

    // Click to expand - now content is mounted
    const user = userEvent.setup();
    await user.click(followUpTrigger);

    // After expansion, element is in DOM and visible
    expect(screen.getByLabelText(/follow-up date/i)).toBeVisible();
  });

  test("renders Outcome section (collapsed by default)", () => {
    renderWithAdminContext(<ActivitySinglePage />);

    const outcomeTrigger = screen.getByRole("button", { name: /outcome/i });
    expect(outcomeTrigger).toBeInTheDocument();
  });

  test("does not render any tabs", () => {
    renderWithAdminContext(<ActivitySinglePage />);

    const tabs = screen.queryAllByRole("tab");
    expect(tabs).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/activities/__tests__/ActivitySinglePage.test.tsx
```

Expected: FAIL with "Cannot find module '../ActivitySinglePage'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/activities/ActivitySinglePage.tsx
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { FormGrid } from "@/components/admin/form/FormGrid";
import { FormSection } from "@/components/admin/form/FormSection";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { INTERACTION_TYPE_OPTIONS } from "../validation/activities";
import { contactOptionText } from "../contacts/ContactOption";

const sentimentChoices = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
];

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection = ({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

/**
 * Single-page Activity form with collapsible sections.
 * Per design spec: Remove tabs, use sections with Follow-up/Outcome collapsed by default.
 */
export const ActivitySinglePage = () => {
  return (
    <div className="space-y-8">
      {/* Activity Details - always expanded */}
      <FormSection title="Activity Details">
        <FormGrid>
          <SelectInput
            source="type"
            label="Interaction Type"
            choices={INTERACTION_TYPE_OPTIONS.map((opt) => ({
              id: opt.value,
              name: opt.label,
            }))}
            isRequired
            helperText="How did this interaction occur?"
          />
        </FormGrid>

        <FormGrid>
          <div className="col-span-2">
            <TextInput
              source="subject"
              label="Subject"
              isRequired
              helperText="Summarize the outcome or topic"
            />
          </div>
        </FormGrid>

        <FormGrid columns={4}>
          <TextInput
            source="activity_date"
            label="Date"
            type="date"
            isRequired
          />
          <TextInput
            source="duration_minutes"
            label="Duration (minutes)"
            type="number"
            helperText="Length of activity"
          />
        </FormGrid>

        <FormGrid>
          <div className="col-span-2">
            <TextInput
              source="description"
              label="Notes"
              multiline
              rows={4}
              helperText="Detailed notes about this interaction"
            />
          </div>
        </FormGrid>
      </FormSection>

      {/* Relationships - always expanded */}
      <FormSection title="Relationships">
        <FormGrid>
          <ReferenceInput source="opportunity_id" reference="opportunities">
            <AutocompleteInput
              label="Opportunity"
              optionText="name"
              helperText="Link to an opportunity"
            />
          </ReferenceInput>

          <ReferenceInput source="contact_id" reference="contacts_summary">
            <AutocompleteInput
              label="Contact"
              optionText={contactOptionText}
              helperText="Person you interacted with"
            />
          </ReferenceInput>
        </FormGrid>

        <FormGrid>
          <ReferenceInput source="organization_id" reference="organizations">
            <AutocompleteInput
              label="Organization"
              optionText="name"
              helperText="Company context"
            />
          </ReferenceInput>
        </FormGrid>
      </FormSection>

      {/* Follow-up - collapsed by default */}
      <CollapsibleSection title="Follow-up">
        <FormGrid>
          <BooleanInput
            source="follow_up_required"
            label="Requires follow-up"
            helperText="Check to schedule a follow-up"
          />
          <SelectInput
            source="sentiment"
            label="Sentiment"
            choices={sentimentChoices}
            helperText="How did the contact respond?"
          />
        </FormGrid>

        <FormGrid>
          <TextInput
            source="follow_up_date"
            label="Follow-up Date"
            type="date"
          />
          <TextInput
            source="follow_up_notes"
            label="Follow-up Notes"
            multiline
            rows={2}
            helperText="What to do next"
          />
        </FormGrid>
      </CollapsibleSection>

      {/* Outcome - collapsed by default */}
      <CollapsibleSection title="Outcome">
        <FormGrid>
          <TextInput
            source="location"
            label="Location"
            helperText="Where did this occur?"
          />
          <TextInput
            source="outcome"
            label="Outcome"
            helperText="Result or next steps"
          />
        </FormGrid>
      </CollapsibleSection>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/activities/__tests__/ActivitySinglePage.test.tsx
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/activities/ActivitySinglePage.tsx src/atomic-crm/activities/__tests__/ActivitySinglePage.test.tsx
git commit -m "feat(activities): add single-page layout with collapsible sections"
```

---

### Task 16: Update ActivityCreate to Use Single Page

**Rationale:** `CreateBase` establishes `CreateContext` with the save mutation. When using custom save buttons (like `FormActions` with `SaveButtonGroup`), we need to wire them through `useCreateContext().save` to ensure proper mutation handling.

**Files:**
- Modify: `src/atomic-crm/activities/ActivityCreate.tsx`

**Step 1: Read current implementation**

```bash
cat src/atomic-crm/activities/ActivityCreate.tsx
```

**Step 2: Update implementation with proper save pipeline**

```typescript
// src/atomic-crm/activities/ActivityCreate.tsx
import { useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateBase, Form, useCreateContext, useInput } from "ra-core";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ActivitySinglePage } from "./ActivitySinglePage";
import { FormActions } from "@/components/admin/form/FormActions";
import { useFormShortcuts } from "@/components/admin/form/useFormShortcuts";
import { activitiesSchema } from "../validation/activities";

const HiddenActivityTypeField = () => {
  const { field } = useInput({
    source: "activity_type",
    defaultValue: "interaction",
  });

  return <input type="hidden" {...field} value={field.value ?? "interaction"} />;
};

/**
 * Inner component that has access to both CreateContext and FormContext.
 *
 * CRITICAL: CreateBase provides the `save` mutation through CreateContext.
 * SaveButtonGroup/FormActions must use this save function to trigger the mutation.
 */
const ActivityFormContent = () => {
  const { save } = useCreateContext(); // Gets save from CreateBase
  const { handleSubmit, reset } = useFormContext();
  const navigate = useNavigate();

  const handleSave = useCallback(
    (data: any) => save(data),
    [save]
  );

  const handleSaveAndNew = useCallback(
    async (data: any) => {
      await save(data, {
        onSuccess: () => reset(), // Reset form after successful save
      });
    },
    [save, reset]
  );

  const handleCancel = useCallback(() => {
    navigate("/activities");
  }, [navigate]);

  const { handleKeyDown } = useFormShortcuts({
    onSave: () => handleSubmit(handleSave)(),
    onSaveAndNew: () => handleSubmit(handleSaveAndNew)(),
    onCancel: handleCancel,
  });

  return (
    <div onKeyDown={handleKeyDown}>
      <HiddenActivityTypeField />
      <ActivitySinglePage />
      <FormActions
        onSave={handleSave}
        onSaveAndNew={handleSaveAndNew}
        onCancel={handleCancel}
      />
    </div>
  );
};

/**
 * Activity Create form - single page with collapsible sections.
 * Per design spec: Converted from 3-tab structure for improved UX.
 */
export default function ActivityCreate() {
  // Get defaults from Zod schema (single source of truth per Engineering Constitution #4)
  const defaultValues = useMemo(() => activitiesSchema.partial().parse({}), []);

  return (
    <CreateBase redirect="list">
      <div className="mt-2 flex justify-center">
        <div className="w-full max-w-5xl">
          <Form defaultValues={defaultValues}>
            <Card>
              <CardContent className="space-y-6 p-6">
                <ActivityFormContent />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
}
```

**Step 3: Run existing tests to verify no regression**

```bash
npm test -- src/atomic-crm/activities/
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/atomic-crm/activities/ActivityCreate.tsx
git commit -m "feat(activities): convert to single-page with proper save pipeline"
```

---

## Phase 5: Integration & Polish

### Task 17: Add Smart Defaults to Contact Create

**Rationale:** `useSmartDefaults` returns `isLoading` and `defaults` to handle async identity. We can either wait for identity (Pattern 1) or reset when it arrives (Pattern 2). Pattern 1 is simpler for Create forms.

**Files:**
- Modify: `src/atomic-crm/contacts/ContactCreate.tsx`

**Step 1: Update ContactCreate to use smart defaults with loading state**

```typescript
// src/atomic-crm/contacts/ContactCreate.tsx
import { useMemo } from "react";
import { CreateBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { ContactInputs } from "./ContactInputs";
import { FormToolbar } from "@/components/admin/simple-form";
import { useSmartDefaults } from "../hooks/useSmartDefaults";
import { contactBaseSchema } from "../validation/contacts";

/**
 * Contact Create form with smart defaults.
 *
 * CRITICAL: useSmartDefaults.isLoading must be checked before rendering Form.
 * React Hook Form's defaultValues only applies at mount, so we must wait
 * for identity to resolve before rendering.
 */
export default function ContactCreate() {
  const { defaults, isLoading } = useSmartDefaults();

  // Wait for identity to resolve before rendering form
  // (Alternative: render immediately and use reset pattern in inner component)
  if (isLoading) {
    return (
      <div className="mt-2 flex justify-center">
        <div className="w-full max-w-5xl">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Merge Zod defaults with smart defaults (sales_id from identity)
  const defaultValues = {
    ...contactBaseSchema.partial().parse({}),
    sales_id: defaults.sales_id,
  };

  return (
    <CreateBase redirect="list">
      <div className="mt-2 flex justify-center">
        <div className="w-full max-w-5xl">
          <Form defaultValues={defaultValues}>
            <Card>
              <CardContent className="space-y-6 p-6">
                <ContactInputs />
                <FormToolbar />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
}
```

**Step 2: Test manually**

1. Open Contact Create form
2. Verify loading skeleton shows briefly
3. Verify Sales Rep field is pre-filled with current user

**Step 3: Commit**

```bash
git add src/atomic-crm/contacts/ContactCreate.tsx
git commit -m "feat(contacts): add smart defaults with async identity handling"
```

---

### Task 18: Add Smart Defaults to Organization Create

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationCreate.tsx`

**Step 1: Update OrganizationCreate to use smart defaults**

(Same pattern as Task 17 - wait for isLoading, merge defaults)

```typescript
// src/atomic-crm/organizations/OrganizationCreate.tsx
import { useSmartDefaults } from "../hooks/useSmartDefaults";
import { organizationSchema } from "../validation/organizations";

export default function OrganizationCreate() {
  const { defaults, isLoading } = useSmartDefaults();

  if (isLoading) {
    return <LoadingSkeleton />; // Same pattern as ContactCreate
  }

  const defaultValues = {
    ...organizationSchema.partial().parse({}),
    sales_id: defaults.sales_id,
  };

  return (
    <CreateBase redirect="list">
      <Form defaultValues={defaultValues}>
        {/* ... */}
      </Form>
    </CreateBase>
  );
}
```

**Step 2: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationCreate.tsx
git commit -m "feat(organizations): add smart defaults with async identity handling"
```

---

### Task 19: Cleanup Old Tab Components

**Files:**
- Delete: `src/atomic-crm/contacts/ContactIdentityTab.tsx`
- Delete: `src/atomic-crm/contacts/ContactPositionTab.tsx`
- Delete: `src/atomic-crm/contacts/ContactInfoTab.tsx`
- Delete: `src/atomic-crm/contacts/ContactAccountTab.tsx`
- Delete: `src/atomic-crm/organizations/OrganizationGeneralTab.tsx`
- Delete: `src/atomic-crm/organizations/OrganizationDetailsTab.tsx`
- Delete: `src/atomic-crm/organizations/OrganizationOtherTab.tsx`
- Delete: `src/atomic-crm/organizations/OrganizationHierarchyTab.tsx`

**Step 1: Verify no imports remain**

```bash
grep -r "ContactIdentityTab\|ContactPositionTab\|ContactInfoTab\|ContactAccountTab" src/
grep -r "OrganizationGeneralTab\|OrganizationDetailsTab\|OrganizationOtherTab\|OrganizationHierarchyTab" src/
```

Expected: No results (all imports updated to new tab components)

**Step 2: Delete old files**

```bash
rm src/atomic-crm/contacts/ContactIdentityTab.tsx
rm src/atomic-crm/contacts/ContactPositionTab.tsx
rm src/atomic-crm/contacts/ContactInfoTab.tsx
rm src/atomic-crm/contacts/ContactAccountTab.tsx
rm src/atomic-crm/organizations/OrganizationGeneralTab.tsx
rm src/atomic-crm/organizations/OrganizationDetailsTab.tsx
rm src/atomic-crm/organizations/OrganizationOtherTab.tsx
rm src/atomic-crm/organizations/OrganizationHierarchyTab.tsx
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated 4-tab form components"
```

---

### Task 20: Run Full Test Suite & Build

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 3: Run lint**

```bash
npm run lint:apply
```

Expected: No errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: form improvements implementation complete"
```

---

## Summary

### Files Created (16 new files)
- `src/components/admin/form/FormGrid.tsx`
- `src/components/admin/form/FormSection.tsx`
- `src/components/admin/form/FormActions.tsx`
- `src/components/admin/form/SaveButtonGroup.tsx`
- `src/components/admin/form/useFormShortcuts.ts`
- `src/atomic-crm/constants/formCopy.ts` (centralized copy dictionary)
- `src/atomic-crm/constants/usStates.ts` (US States constant)
- `src/atomic-crm/constants/index.ts` (barrel export)
- `src/atomic-crm/hooks/useSmartDefaults.ts`
- `src/atomic-crm/hooks/useRecentSelections.ts`
- `src/atomic-crm/contacts/ContactMainTab.tsx`
- `src/atomic-crm/contacts/ContactMoreTab.tsx`
- `src/atomic-crm/organizations/OrganizationMainTab.tsx`
- `src/atomic-crm/organizations/OrganizationMoreTab.tsx`
- `src/atomic-crm/activities/ActivitySinglePage.tsx`

### Files Modified (4 files)
- `src/atomic-crm/contacts/ContactInputs.tsx` (4 tabs → 2)
- `src/atomic-crm/contacts/ContactCreate.tsx` (smart defaults)
- `src/atomic-crm/organizations/OrganizationInputs.tsx` (4 tabs → 2)
- `src/atomic-crm/activities/ActivityCreate.tsx` (tabs → single page)

### Files Deleted (8 old tab components)
- Contact: Identity, Position, Info, Account tabs
- Organization: General, Details, Other, Hierarchy tabs

### Test Coverage
- 14 new test files with ~60 test cases
- All following TDD (Red → Green → Refactor)
- Constants module tests verify correctness and prevent regressions

---

**Plan complete and saved to `docs/plans/2025-11-30-form-improvements-implementation.md`.**

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
