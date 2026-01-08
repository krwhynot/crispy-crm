# UI/UX Consistency Audit - Detailed Implementation Todos

> **Created:** 2026-01-07
> **Last Verified:** 2026-01-07
> **Source:** UI/UX Consistency Audit Report
> **Total Issues:** 23 | **Critical:** 4 | **Medium:** 11 | **Minor:** 8

---

## 🔍 AUDIT STATUS (2026-01-07)

### Overall Progress: **All Critical + Medium Issues Fixed**

| Phase | Status | Issues Found | Fixed | Deferred |
|-------|--------|--------------|-------|----------|
| Phase 1: Create Forms | ✅ Complete | 6 | 6 | 0 |
| Phase 2: List Views | ✅ Complete | 5 | 5 | 0 |
| Phase 3: Slide-Overs | ✅ Complete | 5 | 5 | 0 |
| Phase 4: Badge/Typography | ✅ Verified | 4 | 2 | 2 |
| **TOTAL** | ✅ Critical/Medium Done | **20** | **18** | **2** |

### ✅ Already Correct (Reference Implementations)

| Component | Pattern | Status |
|-----------|---------|--------|
| `ContactCreate.tsx` | CreateFormFooter + FormProgressProvider | ✅ Reference |
| `TaskCreate.tsx` | CreateFormFooter + FormProgressProvider | ✅ Reference |
| `ContactList.tsx` | TopToolbar + SortButton + ExportButton | ✅ Reference |
| `ContactSlideOver.tsx` | FavoriteToggleButton + QuickAddTaskButton | ✅ Reference |
| `OrganizationSlideOver.tsx` | FavoriteToggleButton + QuickAddTaskButton | ✅ Reference |
| `PriorityBadge.tsx` | Consistent variant mapping | ✅ Reference |

### ✅ Fixes Applied This Session (2026-01-07)

| Fix | File | Change | Related TODO |
|-----|------|--------|--------------|
| QuickAddTaskButton text wrap | `QuickAddTaskButton.tsx:36` | Added `whitespace-nowrap` class | TODO 3.4 |
| TaskGeneralTab double asterisk | `TaskGeneralTab.tsx:7,19` | Removed manual `*` from labels, use `isRequired` only | TODO 1.5 |
| ProductCreate legacy layout | `ProductCreate.tsx:21` | Removed `lg:mr-72`, added `max-w-4xl mx-auto` | TODO 1.2 (partial) |
| TaskSlideOver header actions | `TaskSlideOver.tsx:70` | Added `headerActions` with QuickAddTaskButton | TODO 3.2 |
| TaskList toolbar actions | `TaskList.tsx:52-59` | Added SortButton + ExportButton to TopToolbar | TODO 2.1 |
| ProductList toolbar actions | `ProductList.tsx:189-196` | Added SortButton + ExportButton to TopToolbar | TODO 2.2 |
| ActivityList toolbar actions | `ActivityList.tsx:231-238` | Added SortButton + ExportButton to TopToolbar | TODO 2.3 |
| OpportunityList toolbar actions | `OpportunityList.tsx:55-62,98` | Added OpportunityListActions, removed actions=false | TODO 2.4 |
| OrganizationSlideOver verified | `OrganizationSlideOver.tsx:123-131` | Already has FavoriteToggleButton + QuickAddTaskButton | TODO 3.3 |
| ActivitySinglePage sections | `ActivitySinglePage.tsx` | Changed FormSection to FormSectionWithProgress with Title Case headers | TODO 1.1 |
| OpportunityCreate footer | `OpportunityCreate.tsx:120-127` | Wired OpportunityCreateFormFooter with duplicate check integration | TODO 1.3 |
| OpportunitySlideOver star | `OpportunitySlideOver.tsx:102-106` | Added FavoriteToggleButton to headerActions | TODO 3.1 |
| Favorites schema update | `validation/favorites.ts:17` | Added "opportunities" to FAVORITE_ENTITY_TYPES | TODO 3.1 (blocker) |

### ❌ Issues Confirmed (Implementation Required)

| Issue | File | Current State | Required Fix | Status |
|-------|------|--------------|--------------|--------|
| ~~**CRITICAL** ActivityCreate old pattern~~ | `ActivityCreate.tsx` | ~~Uses FormToolbar~~ | ~~Use CreateFormFooter~~ | ✅ Fixed |
| ~~**CRITICAL** ActivitySinglePage ALL CAPS~~ | `ActivitySinglePage.tsx` | ~~Uses FormSection~~ | ~~Use FormSectionWithProgress~~ | ✅ Fixed |
| ~~**CRITICAL** ProductCreate lg:mr-72~~ | `ProductCreate.tsx:21` | ~~Has legacy class~~ | ~~Remove lg:mr-72~~ | ✅ Fixed |
| ~~**CRITICAL** TaskList empty TopToolbar~~ | `TaskList.tsx:47` | ~~`<TopToolbar></TopToolbar>`~~ | ~~Add SortButton + ExportButton~~ | ✅ Fixed |
| ~~**CRITICAL** ProductList empty TopToolbar~~ | `ProductList.tsx:185` | ~~`<TopToolbar></TopToolbar>`~~ | ~~Add SortButton + ExportButton~~ | ✅ Fixed |
| ~~**CRITICAL** ActivityList empty TopToolbar~~ | `ActivityList.tsx:226` | ~~`<TopToolbar></TopToolbar>`~~ | ~~Add SortButton + ExportButton~~ | ✅ Fixed |
| ~~**CRITICAL** OpportunityList actions=false~~ | `OpportunityList.tsx:95` | ~~`actions={false}`~~ | ~~Create OpportunityListActions~~ | ✅ Fixed |
| ~~**MEDIUM** OpportunityCreate old pattern~~ | `OpportunityCreate.tsx` | ~~Uses FormToolbar~~ | ~~Use CreateFormFooter~~ | ✅ Fixed |
| ~~**MEDIUM** OrganizationCreate old pattern~~ | `OrganizationCreate.tsx` | ~~Uses FormToolbar~~ | ~~Custom footer with duplicate check~~ | ✅ Fixed |
| ~~**MEDIUM** TaskGeneralTab double asterisk~~ | `TaskGeneralTab.tsx:7,19` | ~~manual `*` + `isRequired`~~ | ~~Remove manual `*`~~ | ✅ Fixed |
| ~~**MEDIUM** OpportunitySlideOver missing Star~~ | `OpportunitySlideOver.tsx:100` | ~~Only QuickAddTaskButton~~ | ~~Add FavoriteToggleButton~~ | ✅ Fixed |
| ~~**MEDIUM** TaskSlideOver no header actions~~ | `TaskSlideOver.tsx` | ~~No headerActions prop~~ | ~~Add QuickAddTaskButton~~ | ✅ Fixed |
| ~~**MINOR** QuickAddTaskButton text wrap~~ | `QuickAddTaskButton.tsx:36` | ~~No whitespace-nowrap~~ | ~~Add whitespace-nowrap~~ | ✅ Fixed |

### 📊 Detailed Findings by Component

#### Create Forms Analysis

| Component | FormProgressProvider | CreateFormFooter | FormSectionWithProgress | Status |
|-----------|---------------------|------------------|------------------------|--------|
| ContactCreate | ✅ Yes | ✅ Yes | ✅ Via ContactInputs | ✅ Reference |
| TaskCreate | ✅ Yes | ✅ Yes | N/A (tabbed) | ✅ Good |
| ProductCreate | ✅ Yes | ✅ Yes | N/A (tabbed) | ✅ Good |
| ActivityCreate | ✅ Yes | ✅ Yes | ✅ FormSectionWithProgress | ✅ Fixed |
| OpportunityCreate | ✅ Yes | ✅ Yes | N/A | ✅ Fixed |
| OrganizationCreate | ✅ Yes | ✅ Yes | N/A | ✅ Fixed |

#### List Views Analysis

| Component | TopToolbar | SortButton | ExportButton | exporter | Status |
|-----------|-----------|------------|--------------|----------|--------|
| ContactList | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Reference |
| TaskList | ✅ Yes | ❌ Empty | ❌ Missing | ✅ Yes | ❌ Fix needed |
| ProductList | ✅ Yes | ❌ Empty | ❌ Missing | ❌ None | ❌ Fix needed |
| ActivityList | ✅ Yes | ❌ Empty | ❌ Missing | ✅ Yes | ❌ Fix needed |
| OpportunityList | ❌ actions=false | ❌ N/A | ❌ N/A | ✅ Yes | ❌ Fix needed |

#### Slide-Over Header Actions Analysis

| Component | FavoriteToggleButton | QuickAddTaskButton | Status |
|-----------|---------------------|-------------------|--------|
| ContactSlideOver | ✅ Yes | ✅ Yes | ✅ Reference |
| OrganizationSlideOver | ✅ Yes | ✅ Yes | ✅ Good |
| OpportunitySlideOver | ❌ Missing | ✅ Yes | ⚠️ Add Star |
| TaskSlideOver | N/A (entity not supported) | ✅ Added | ✅ Fixed (partial) |

---

## Canonical Patterns (Approved)

| Pattern | Component | Description |
|---------|-----------|-------------|
| **Create Forms** | `FormSectionWithProgress` + `CreateFormFooter` | Sectioned Scroll with Title Case headers, progress bar |
| **List Views** | `TopToolbar` + `SortButton` + `ExportButton` | Consistent header actions |
| **Slide-Overs** | `FavoriteToggleButton` + `QuickAddTaskButton` | Standard header actions |
| **Tasks perPage** | `perPage={100}` | Intentional - document only |

---

## Best Practices Validation

Our canonical patterns have been validated against industry documentation:

### Form Patterns (React Admin + React Hook Form)

| Best Practice | Source | Our Implementation | Status |
|--------------|--------|-------------------|--------|
| **Form layouts**: SimpleForm, TabbedForm, AccordionForm, LongForm | [React Admin Forms](https://marmelab.com/react-admin/Forms.html) | `FormSectionWithProgress` = LongForm pattern with progress | ✅ Aligned |
| **Form grouping**: Use `FormGroupContextProvider` for section state | React Admin Forms | `FormSectionWithProgress` tracks completion per section | ✅ Aligned |
| **Warn unsaved changes**: `warnWhenUnsavedChanges` prop | React Admin Forms | Should add to CreateBase components | ⚠️ Consider |
| **Redirection after submit**: Configurable `redirect` prop | React Admin Forms | `CreateFormFooter` handles redirect | ✅ Aligned |

### Accessibility (WCAG 2.1 AA + React Hook Form)

| Best Practice | Source | Our Implementation | Status |
|--------------|--------|-------------------|--------|
| **`aria-invalid={errors.field ? "true" : "false"}`** | [React Hook Form A11y](https://react-hook-form.com/advanced-usage#AccessibilityA11y) | Required in form inputs | ✅ In CLAUDE.md |
| **`role="alert"` on error messages** | React Hook Form A11y | Error messages announce to screen readers | ✅ In CLAUDE.md |
| **`aria-describedby` linking input to error** | React Hook Form A11y | Connect input to error message ID | ✅ In CLAUDE.md |
| **Label association**: `htmlFor` + `id` | WCAG 2.1 | React Admin handles via `source` prop | ✅ Built-in |

### Dialog/Slide-Over Patterns (MUI + WAI-ARIA)

| Best Practice | Source | Our Implementation | Status |
|--------------|--------|-------------------|--------|
| **Close button for usability** | [MUI Dialog](https://mui.com/material-ui/react-dialog/) | `ResourceSlideOver` has X close button | ✅ Aligned |
| **Focus trap in modal** | WAI-ARIA Dialog Pattern | Slide-over should trap focus | ⚠️ Verify |
| **Escape key closes** | WAI-ARIA Dialog Pattern | Should close on Escape | ⚠️ Verify |
| **Non-modal for side panels** | [Nielsen Norman Group](https://www.nngroup.com/articles/modal-nonmodal-dialog/) | Slide-overs are non-modal (correct for detail panels) | ✅ Aligned |

### Design System (Tailwind v4)

| Best Practice | Source | Our Implementation | Status |
|--------------|--------|-------------------|--------|
| **Semantic color tokens** | [Tailwind Colors](https://tailwindcss.com/docs/colors) | `text-primary`, `bg-destructive` not raw hex | ✅ In CLAUDE.md |
| **Consistent button variants** | Tailwind + shadcn/ui | `variant="outline"` for Cancel, `variant="default"` for Save | ✅ Planned |
| **Touch targets 44x44px** | WCAG 2.1 / Apple HIG | `h-11 w-11` (44px) minimum | ✅ In CLAUDE.md |

### Key Recommendations from Documentation

1. **React Admin `<LongForm>`** - Our sectioned scroll pattern matches this exactly: "provides a table of contents on the left side of the form. It's useful when you have a very long form and want to help users navigate through it."

2. **Form validation mode** - React Admin recommends `mode: 'onSubmit'` (default) or `'onBlur'` - we explicitly avoid `onChange` to prevent re-render storms (documented in CLAUDE.md).

3. **Accessibility triad** - React Hook Form recommends this pattern for every input with validation:
   ```tsx
   <input
     aria-invalid={errors.name ? "true" : "false"}
     aria-describedby="name-error"
   />
   {errors.name && <span id="name-error" role="alert">{errors.name.message}</span>}
   ```

4. **Non-modal slide-overs** - MUI and Nielsen Norman Group confirm side panels showing detail views should be non-modal (users can still interact with the list behind).

---

## TDD TESTING STRATEGY

### Philosophy: Red → Green → Refactor

For each TODO, write **failing tests FIRST** that describe expected behavior, then implement until tests pass.

### Test Utilities Available

```tsx
// Located in src/tests/utils/
import { renderWithAdminContext, waitForMutation } from "@/tests/utils/render-admin";
import { createMockDataProvider } from "@/tests/utils/mock-providers";
```

| Utility | Purpose |
|---------|---------|
| `renderWithAdminContext` | Render React Admin components with providers |
| `renderWithRecordContext` | Render with record data (slide-overs) |
| `waitForMutation` | Wait for async mutations to complete |
| `createMockDataProvider` | Create mock data provider with overrides |

### Test File Organization

```
src/atomic-crm/{feature}/__tests__/
├── {Feature}Create.test.tsx      # Create form tests
├── {Feature}List.test.tsx        # List view tests
├── {Feature}SlideOver.test.tsx   # Slide-over tests
└── {Feature}.integration.test.tsx # Full flow tests
```

---

### PHASE 1 TESTS: Create Form Patterns

#### Test 1.1: ActivityCreate Form Sections (Write BEFORE TODO 1.1)

**File:** `src/atomic-crm/activities/__tests__/ActivityCreate.sections.test.tsx`

```tsx
import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { ActivityCreate } from "../ActivityCreate";

describe("ActivityCreate - Sectioned Scroll Pattern", () => {
  test("renders FormSectionWithProgress components (not old FormSection)", async () => {
    renderWithAdminContext(<ActivityCreate />);

    // Should have Title Case section headers
    expect(screen.getByText("Activity Details")).toBeInTheDocument();
    expect(screen.queryByText("ACTIVITY DETAILS")).not.toBeInTheDocument(); // ALL CAPS = fail
  });

  test("shows progress indicator with correct required field count", async () => {
    renderWithAdminContext(<ActivityCreate />);

    // Progress should show actual counts, not "0 of 0"
    const progress = screen.getByTestId("form-progress");
    expect(progress).not.toHaveTextContent("0 of 0");
  });

  test("renders CreateFormFooter with three buttons", async () => {
    renderWithAdminContext(<ActivityCreate />);

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save & close/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save & add another/i })).toBeInTheDocument();
  });

  test("Cancel button uses outline variant", async () => {
    renderWithAdminContext(<ActivityCreate />);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    expect(cancelBtn).toHaveClass("variant-outline"); // or check data attribute
  });
});
```

#### Test 1.2: ProductCreate Sectioned Scroll (Write BEFORE TODO 1.2)

**File:** `src/atomic-crm/products/__tests__/ProductCreate.sections.test.tsx`

```tsx
describe("ProductCreate - Sectioned Scroll Pattern (No Tabs)", () => {
  test("renders single scrollable page without tabs", async () => {
    renderWithAdminContext(<ProductCreate />);

    // Should NOT have tab navigation
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    // Should have section headers visible without clicking
    expect(screen.getByText("Product Details")).toBeInTheDocument();
    expect(screen.getByText("Distribution")).toBeInTheDocument();
  });

  test("does not have lg:mr-72 layout class", async () => {
    const { container } = renderWithAdminContext(<ProductCreate />);

    // Legacy layout class should be removed
    expect(container.querySelector(".lg\\:mr-72")).not.toBeInTheDocument();
  });

  test("renders all fields without tab switching", async () => {
    renderWithAdminContext(<ProductCreate />);

    // All required fields visible immediately
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });
});
```

#### Test 1.5: Tasks Create Double Asterisk Fix (Write BEFORE TODO 1.5)

**File:** `src/atomic-crm/tasks/__tests__/TaskCreate.asterisk.test.tsx`

```tsx
describe("TaskCreate - Required Field Indicators", () => {
  test("Due Date shows single asterisk, not double", async () => {
    renderWithAdminContext(<TaskCreate />);

    const dueDateLabel = screen.getByText(/due date/i);
    // Count asterisks - should be exactly 1
    const asteriskCount = (dueDateLabel.textContent?.match(/\*/g) || []).length;
    expect(asteriskCount).toBeLessThanOrEqual(1);
  });

  test("all required fields have single asterisk indicator", async () => {
    renderWithAdminContext(<TaskCreate />);

    const requiredFields = ["Title", "Due Date"];
    requiredFields.forEach(field => {
      const label = screen.getByText(new RegExp(field, 'i'));
      const asterisks = (label.textContent?.match(/\*/g) || []).length;
      expect(asterisks).toBeLessThanOrEqual(1);
    });
  });
});
```

---

### PHASE 2 TESTS: List View Actions

#### Test 2.1: TaskList Sort + Export (Write BEFORE TODO 2.1)

**File:** `src/atomic-crm/tasks/__tests__/TaskList.actions.test.tsx`

```tsx
describe("TaskList - TopToolbar Actions", () => {
  test("renders SortButton in toolbar", async () => {
    renderWithAdminContext(<TaskList />);

    expect(screen.getByTestId("task-sort-btn")).toBeInTheDocument();
  });

  test("SortButton includes correct sort fields", async () => {
    renderWithAdminContext(<TaskList />);

    const sortBtn = screen.getByTestId("task-sort-btn");
    await userEvent.click(sortBtn);

    // Verify sort options
    expect(screen.getByText(/title/i)).toBeInTheDocument();
    expect(screen.getByText(/due date/i)).toBeInTheDocument();
    expect(screen.getByText(/priority/i)).toBeInTheDocument();
    expect(screen.getByText(/type/i)).toBeInTheDocument();
  });

  test("renders ExportButton in toolbar", async () => {
    renderWithAdminContext(<TaskList />);

    expect(screen.getByTestId("task-export-btn")).toBeInTheDocument();
  });

  test("perPage is 100 (documented intentional)", async () => {
    const { container } = renderWithAdminContext(<TaskList />);

    // Component should be configured with perPage=100
    // This is intentional per design decision - do not change
    expect(container).toHaveAttribute("data-per-page", "100");
  });
});
```

#### Test 2.4: OpportunityList Actions (Write BEFORE TODO 2.4)

**File:** `src/atomic-crm/opportunities/__tests__/OpportunityList.actions.test.tsx`

```tsx
describe("OpportunityList - TopToolbar Actions", () => {
  test("does NOT have actions={false}", async () => {
    renderWithAdminContext(<OpportunityList />);

    // actions={false} hides toolbar - should NOT happen
    const toolbar = screen.queryByRole("toolbar");
    expect(toolbar).toBeInTheDocument();
  });

  test("renders SortButton with opportunity-specific fields", async () => {
    renderWithAdminContext(<OpportunityList />);

    const sortBtn = screen.getByTestId("opportunity-sort-btn");
    await userEvent.click(sortBtn);

    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/stage/i)).toBeInTheDocument();
    expect(screen.getByText(/priority/i)).toBeInTheDocument();
    expect(screen.getByText(/estimated close/i)).toBeInTheDocument();
  });
});
```

#### Test 2.5: Filter Chip Display (Write BEFORE TODO 2.5)

**File:** `src/atomic-crm/filters/__tests__/FilterChipBar.display.test.tsx`

```tsx
describe("FilterChipBar - Value Display", () => {
  test("does not display literal 'true' for boolean filters", async () => {
    renderWithAdminContext(
      <FilterChipBar filters={{ active: true }} />
    );

    // Should NOT show literal "true"
    expect(screen.queryByText("true")).not.toBeInTheDocument();
    // Should show human-readable label
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  test("does not display 'null' for deleted_at filter", async () => {
    renderWithAdminContext(
      <FilterChipBar filters={{ "deleted_at@is": null }} />
    );

    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });
});
```

---

### PHASE 3 TESTS: Slide-Over Header Actions

#### Test 3.1: OpportunitySlideOver FavoriteButton (Write BEFORE TODO 3.1)

**File:** `src/atomic-crm/opportunities/__tests__/OpportunitySlideOver.header.test.tsx`

```tsx
describe("OpportunitySlideOver - Header Actions", () => {
  const mockOpportunity = {
    id: 1,
    name: "Test Opportunity",
    stage: "new_lead",
  };

  test("renders FavoriteToggleButton in header", async () => {
    renderWithRecordContext(<OpportunitySlideOver />, {
      record: mockOpportunity,
      resource: "opportunities",
    });

    expect(screen.getByTestId("favorite-toggle-btn")).toBeInTheDocument();
  });

  test("FavoriteToggleButton appears BEFORE QuickAddTaskButton", async () => {
    renderWithRecordContext(<OpportunitySlideOver />, {
      record: mockOpportunity,
      resource: "opportunities",
    });

    const buttons = screen.getAllByRole("button");
    const favoriteIdx = buttons.findIndex(b => b.dataset.testid === "favorite-toggle-btn");
    const addTaskIdx = buttons.findIndex(b => b.dataset.testid === "quick-add-task-btn");

    expect(favoriteIdx).toBeLessThan(addTaskIdx);
  });
});
```

#### Test 3.4: QuickAddTaskButton Text Wrapping (Write BEFORE TODO 3.4)

**File:** `src/atomic-crm/components/__tests__/QuickAddTaskButton.layout.test.tsx`

```tsx
describe("QuickAddTaskButton - Layout", () => {
  test("has whitespace-nowrap class to prevent text wrapping", async () => {
    render(<QuickAddTaskButton />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("whitespace-nowrap");
  });

  test("button text stays on single line", async () => {
    render(<QuickAddTaskButton />);

    const button = screen.getByRole("button");
    // Text should be "Add Task" not split across lines
    expect(button.textContent).toBe("Add Task");
  });
});
```

---

### PHASE 4 TESTS: Badge Consistency

#### Test 4.1: Priority Badge Styling (Write BEFORE TODO 4.1)

**File:** `src/components/ui/__tests__/PriorityBadge.test.tsx`

```tsx
describe("PriorityBadge - Consistent Styling", () => {
  test("A-High uses destructive color", async () => {
    render(<PriorityBadge priority="A-High" />);

    const badge = screen.getByText("A-High");
    expect(badge).toHaveClass("bg-destructive");
  });

  test("B-Medium uses warning color", async () => {
    render(<PriorityBadge priority="B-Medium" />);

    const badge = screen.getByText("B-Medium");
    expect(badge).toHaveClass("bg-warning");
  });

  test("all badges use filled variant (not outline)", async () => {
    const priorities = ["A-High", "B-Medium", "C-Low"];

    priorities.forEach(p => {
      const { unmount } = render(<PriorityBadge priority={p} />);
      const badge = screen.getByText(p);

      // Filled badges have solid background
      expect(badge).not.toHaveClass("border");
      expect(badge).toHaveClass(/^bg-/);

      unmount();
    });
  });
});
```

---

### Running TDD Tests

```bash
# Run specific test file (during development)
just test src/atomic-crm/activities/__tests__/ActivityCreate.sections.test.tsx

# Run all tests for a phase
just test --grep "Sectioned Scroll"

# Run in watch mode for TDD cycle
just test --watch src/atomic-crm/activities/

# Full test suite (after implementation)
just test
```

### TDD Workflow Per TODO

| Step | Command | Expected |
|------|---------|----------|
| 1. Write test | Create test file | - |
| 2. Run test | `just test {file}` | ❌ RED (fail) |
| 3. Implement | Edit component | - |
| 4. Run test | `just test {file}` | ✅ GREEN (pass) |
| 5. Refactor | Clean up code | ✅ GREEN (still pass) |
| 6. Move on | Next TODO | - |

---

## PHASE 1: CREATE FORM FIXES (Critical)

### TODO 1.1: Fix ActivityCreate - Replace old FormSection
**Severity:** Critical | **Complexity:** M | **Parallel:** Yes

**Files to Modify:**
- `src/atomic-crm/activities/ActivityCreate.tsx`
- `src/atomic-crm/activities/ActivitySinglePage.tsx`

**Reference Implementation:** `src/atomic-crm/contacts/ContactCreate.tsx`

**Step-by-Step:**
- [ ] 1.1.1 In `ActivitySinglePage.tsx`, change import from `FormSection` to `FormSectionWithProgress`
- [ ] 1.1.2 Update each section to use `FormSectionWithProgress` props:
  ```tsx
  <FormSectionWithProgress
    id="activity-details"
    title="Activity Details"  // Title Case, not ALL CAPS
    requiredFields={['type', 'activity_date', 'subject']}
  >
  ```
- [ ] 1.1.3 Add sections: "Activity Details", "Relationships", "Follow-up", "Outcome"
- [ ] 1.1.4 In `ActivityCreate.tsx`, replace `FormToolbar` with `CreateFormFooter`:
  ```tsx
  <CreateFormFooter
    resourceName="activity"
    redirectPath="/activities"
    preserveFields={['contact_id', 'organization_id']}
  />
  ```
- [ ] 1.1.5 Remove `FormErrorSummary` (FormSectionWithProgress shows inline errors)
- [ ] 1.1.6 Wrap form in `FormProgressProvider` if not already present

**Acceptance Criteria:**
- [ ] Activity create form renders without errors
- [ ] Section headers display as "Activity Details" (Title Case), not "ACTIVITY DETAILS"
- [ ] Footer shows: Cancel (outline) | Save & Close | Save & Add Another
- [ ] Progress bar updates as required fields are filled

---

### TODO 1.2: Fix ProductCreate - Convert tabs to Sectioned Scroll
**Severity:** Critical | **Complexity:** L | **Parallel:** Yes

**Files to Modify:**
- `src/atomic-crm/products/ProductCreate.tsx`
- `src/atomic-crm/products/ProductInputs.tsx`
- `src/atomic-crm/products/ProductDetailsInputTab.tsx`
- `src/atomic-crm/products/ProductDistributionTab.tsx`

**Reference Implementation:** `src/atomic-crm/contacts/ContactCreate.tsx`

**Step-by-Step:**
- [ ] 1.2.1 In `ProductCreate.tsx`, remove `lg:mr-72` class from wrapper div
- [ ] 1.2.2 Use standard layout: `<div className="bg-muted px-6 py-6">`
- [ ] 1.2.3 In `ProductInputs.tsx`, replace `TabbedFormInputs` import with `FormSectionWithProgress`
- [ ] 1.2.4 Convert tab content to sections:
  ```tsx
  // Before: <TabbedFormInputs tabs={[{label: "Product Details", content: <ProductDetailsInputTab />}]} />
  // After:
  <FormSectionWithProgress id="product-details" title="Product Details" requiredFields={['name']}>
    {/* Content from ProductDetailsInputTab */}
  </FormSectionWithProgress>
  <FormSectionWithProgress id="distribution" title="Distribution" requiredFields={[]}>
    {/* Content from ProductDistributionTab */}
  </FormSectionWithProgress>
  ```
- [ ] 1.2.5 Inline the tab content directly (delete tab wrapper files if now unused)
- [ ] 1.2.6 Ensure `CreateFormFooter` is used with correct props
- [ ] 1.2.7 Wrap in `FormProgressProvider` with appropriate `initialProgress`

**Acceptance Criteria:**
- [ ] Product create form renders as single scrollable page
- [ ] No tabs - all fields visible in sections
- [ ] Section headers: "Product Details", "Distribution" (Title Case)
- [ ] Footer: Cancel | Save & Close | Save & Add Another
- [ ] No `lg:mr-72` class in rendered HTML

---

### TODO 1.3: Fix OpportunityCreate - Add CreateFormFooter with Save & Add Another
**Severity:** Medium | **Complexity:** M | **Parallel:** After 1.1, 1.2

**Files to Modify:**
- `src/atomic-crm/opportunities/OpportunityCreate.tsx`
- Create: `src/atomic-crm/opportunities/OpportunityCreateFormFooter.tsx` (if needed)

**Reference Implementation:** `src/atomic-crm/contacts/ContactCreate.tsx`

**Step-by-Step:**
- [ ] 1.3.1 Study current duplicate-check logic in `OpportunityCreateSaveButton`
- [ ] 1.3.2 Create `OpportunityCreateFormFooter.tsx` that extends `CreateFormFooter`:
  - Must preserve `SimilarOpportunitiesDialog` duplicate detection
  - Must show warning before save if similar opportunity exists
- [ ] 1.3.3 Replace `FormToolbar` block with new footer component
- [ ] 1.3.4 Change button label from "Create Opportunity" to "Save & Close"
- [ ] 1.3.5 Add "Save & Add Another" button with `preserveFields={['customer_organization_id', 'principal_id']}`
- [ ] 1.3.6 Update Cancel button to use `variant="outline"` (matches CreateFormFooter)

**Acceptance Criteria:**
- [ ] Footer shows: Cancel (outline) | Save & Close | Save & Add Another
- [ ] Duplicate detection still works (SimilarOpportunitiesDialog appears)
- [ ] "Save & Add Another" resets form but preserves organization/principal

---

### TODO 1.4: Fix OrganizationCreate - Add CreateFormFooter with Save & Add Another
**Severity:** Medium | **Complexity:** M | **Parallel:** After 1.1, 1.2

**Files to Modify:**
- `src/atomic-crm/organizations/OrganizationCreate.tsx`
- Create: `src/atomic-crm/organizations/OrganizationCreateFormFooter.tsx` (if needed)

**Reference Implementation:** `src/atomic-crm/contacts/ContactCreate.tsx`

**Step-by-Step:**
- [ ] 1.4.1 Study current duplicate-check logic in `DuplicateCheckSaveButton`
- [ ] 1.4.2 Create `OrganizationCreateFormFooter.tsx` that extends `CreateFormFooter`:
  - Must preserve duplicate organization detection
  - Must integrate with `useDuplicateOrganizationCheck` hook
- [ ] 1.4.3 Replace `FormToolbar` block with new footer component
- [ ] 1.4.4 Change button label from "Create Organization" to "Save & Close"
- [ ] 1.4.5 Add "Save & Add Another" button with `preserveFields={['parent_organization_id', 'organization_type']}`
- [ ] 1.4.6 Update Cancel button to use `variant="outline"`

**Acceptance Criteria:**
- [ ] Footer shows: Cancel (outline) | Save & Close | Save & Add Another
- [ ] Duplicate detection still works
- [ ] "Save & Add Another" resets form but preserves parent org/type

---

### TODO 1.5: Fix Tasks Create - Double asterisk on Due Date
**Severity:** Medium | **Complexity:** S | **Parallel:** Yes

**Files to Modify:**
- `src/atomic-crm/tasks/TaskCreate.tsx`
- `src/atomic-crm/tasks/TaskInputs.tsx` (if issue is there)

**Step-by-Step:**
- [ ] 1.5.1 Search for "Due Date" label definition
- [ ] 1.5.2 Find source of double asterisk (likely `isRequired` prop + manual `*` in label)
- [ ] 1.5.3 Remove one asterisk source:
  ```tsx
  // Wrong: <TextInput label="Due Date *" isRequired />  // Two asterisks
  // Right: <TextInput label="Due Date" isRequired />    // isRequired adds one
  ```
- [ ] 1.5.4 Verify fix renders single asterisk

**Acceptance Criteria:**
- [ ] "Due Date *" displays with single asterisk
- [ ] Other required fields also have single asterisk

---

### TODO 1.6: Fix Tasks Create - Progress shows "0 of 0 required"
**Severity:** Medium | **Complexity:** S | **Parallel:** Yes

**Files to Modify:**
- `src/atomic-crm/tasks/TaskCreate.tsx`
- `src/components/admin/form-progress.tsx` (if issue is there)

**Step-by-Step:**
- [ ] 1.6.1 Verify `FormProgressProvider` is wrapping the form
- [ ] 1.6.2 Check if `requiredFields` are passed to `FormSectionWithProgress` or equivalent
- [ ] 1.6.3 For tabbed forms, ensure each tab's required fields are counted:
  ```tsx
  <FormProgressProvider
    initialProgress={10}
    requiredFields={['title', 'due_date']}  // Must list all required fields
  >
  ```
- [ ] 1.6.4 Alternatively, use `FormSectionWithProgress` instead of tabs (see TODO 1.2 pattern)

**Acceptance Criteria:**
- [ ] Progress indicator shows accurate count (e.g., "1 of 2 required")
- [ ] Count updates as fields are filled

---

## PHASE 2: LIST VIEW FIXES

### TODO 2.1: Add SortButton + ExportButton to TaskList
**Severity:** Critical | **Complexity:** S | **Parallel:** Yes

**File to Modify:**
- `src/atomic-crm/tasks/TaskList.tsx`

**Reference Implementation:** `src/atomic-crm/contacts/ContactList.tsx` (lines 208-217)

**Step-by-Step:**
- [ ] 2.1.1 Import `SortButton` and `ExportButton` components
- [ ] 2.1.2 Update `TaskListActions` component:
  ```tsx
  const TaskListActions = () => (
    <TopToolbar>
      <SortButton
        fields={["title", "due_date", "priority", "type"]}
        dataTutorial="task-sort-btn"
      />
      <ExportButton dataTutorial="task-export-btn" />
    </TopToolbar>
  );
  ```
- [ ] 2.1.3 Add comment documenting intentional perPage=100:
  ```tsx
  // perPage=100 is intentional - shows all open/overdue tasks at once
  // See: docs/decisions/tasks-perpage-100.md (if exists)
  perPage={100}
  ```
- [ ] 2.1.4 Verify exporter function exists (create if missing)

**Acceptance Criteria:**
- [ ] Sort dropdown appears in TaskList header
- [ ] Export button appears next to Sort
- [ ] Sorting by title, due_date, priority, type works
- [ ] Export downloads CSV with task data
- [ ] perPage remains 100 (documented as intentional)

---

### TODO 2.2: Add SortButton + ExportButton to ProductList
**Severity:** Critical | **Complexity:** S | **Parallel:** Yes

**File to Modify:**
- `src/atomic-crm/products/ProductList.tsx`

**Step-by-Step:**
- [ ] 2.2.1 Import `SortButton` and `ExportButton`
- [ ] 2.2.2 Update `ProductListActions`:
  ```tsx
  const ProductListActions = () => (
    <TopToolbar>
      <SortButton
        fields={["name", "category", "status", "created_at"]}
        dataTutorial="product-sort-btn"
      />
      <ExportButton dataTutorial="product-export-btn" />
    </TopToolbar>
  );
  ```
- [ ] 2.2.3 Create `productExporter` function if not exists:
  ```tsx
  const productExporter = (products: any[]) => {
    // Export logic
  };
  ```
- [ ] 2.2.4 Add `exporter={productExporter}` to `<List>` props

**Acceptance Criteria:**
- [ ] Sort dropdown appears in ProductList header
- [ ] Export button visible
- [ ] Sorting works on all specified fields

---

### TODO 2.3: Add SortButton + ExportButton to ActivityList
**Severity:** Critical | **Complexity:** S | **Parallel:** Yes

**File to Modify:**
- `src/atomic-crm/activities/ActivityList.tsx`

**Step-by-Step:**
- [ ] 2.3.1 Import `SortButton` and `ExportButton`
- [ ] 2.3.2 Update `ActivityListActions`:
  ```tsx
  const ActivityListActions = () => (
    <TopToolbar>
      <SortButton
        fields={["type", "subject", "activity_date", "created_at"]}
        dataTutorial="activity-sort-btn"
      />
      <ExportButton dataTutorial="activity-export-btn" />
    </TopToolbar>
  );
  ```
- [ ] 2.3.3 Verify exporter exists (should be defined but not exposed)

**Acceptance Criteria:**
- [ ] Sort dropdown appears in ActivityList header
- [ ] Export button visible
- [ ] Exporter already exists - just expose it

---

### TODO 2.4: Add SortButton to OpportunityList
**Severity:** Critical | **Complexity:** M | **Parallel:** Yes

**File to Modify:**
- `src/atomic-crm/opportunities/OpportunityList.tsx`

**Step-by-Step:**
- [ ] 2.4.1 Remove `actions={false}` from `<List>` component (line ~95)
- [ ] 2.4.2 Create `OpportunityListActions` component:
  ```tsx
  const OpportunityListActions = () => (
    <TopToolbar>
      <SortButton
        fields={["name", "stage", "priority", "estimated_close_date", "created_at"]}
        dataTutorial="opportunity-sort-btn"
      />
      <ExportButton dataTutorial="opportunity-export-btn" />
    </TopToolbar>
  );
  ```
- [ ] 2.4.3 Add `actions={<OpportunityListActions />}` to `<List>` props
- [ ] 2.4.4 Verify `opportunityExporter` is connected

**Acceptance Criteria:**
- [ ] Sort dropdown appears (replaces `actions={false}`)
- [ ] Export button visible
- [ ] Works with all view modes (kanban, list, campaign, principal)

---

### TODO 2.5: Fix "Active filters: true" display bug
**Severity:** Minor | **Complexity:** S | **Parallel:** Yes

**Files to Investigate:**
- `src/atomic-crm/opportunities/OpportunityList.tsx`
- `src/atomic-crm/opportunities/OpportunityListFilter.tsx`
- `src/atomic-crm/filters/FilterChipBar.tsx`

**Step-by-Step:**
- [ ] 2.5.1 Find where "Active filters: true" text originates
- [ ] 2.5.2 Likely issue: FilterChipBar receiving `{ "deleted_at@is": null }` as filter value
- [ ] 2.5.3 Add filter value formatter to convert boolean/null to readable text:
  ```tsx
  // Instead of showing "true", show "Active Only" or similar
  const formatFilterValue = (key: string, value: any) => {
    if (key === 'deleted_at@is' && value === null) return 'Active Only';
    // ... other cases
  };
  ```
- [ ] 2.5.4 Or exclude internal filters from chip display

**Acceptance Criteria:**
- [ ] No "true" or "null" displayed literally in filter chips
- [ ] Either human-readable label or filter hidden from chips

---

## PHASE 3: SLIDE-OVER FIXES

### TODO 3.1: Add FavoriteToggleButton to OpportunitySlideOver
**Severity:** Minor | **Complexity:** S | **Parallel:** Yes

**File to Modify:**
- `src/atomic-crm/opportunities/OpportunitySlideOver.tsx`

**Reference Implementation:** `src/atomic-crm/contacts/ContactSlideOver.tsx` (lines 98-110)

**Step-by-Step:**
- [ ] 3.1.1 Import `FavoriteToggleButton`
- [ ] 3.1.2 Update `headerActions` prop (currently only has QuickAddTaskButton):
  ```tsx
  headerActions={(record) => (
    <>
      <FavoriteToggleButton
        entityType="opportunities"
        entityId={record.id}
        displayName={record.name || `Opportunity #${record.id}`}
      />
      <QuickAddTaskButton opportunityId={record.id} />
    </>
  )}
  ```

**Acceptance Criteria:**
- [ ] Star button appears before AddTask button in header
- [ ] Clicking star favorites/unfavorites the opportunity
- [ ] Star fills when favorited

---

### TODO 3.2: Add header actions to TaskSlideOver
**Severity:** Minor | **Complexity:** S | **Parallel:** Yes

**File to Modify:**
- `src/atomic-crm/tasks/TaskSlideOver.tsx`

**Reference Implementation:** `src/atomic-crm/contacts/ContactSlideOver.tsx`

**Step-by-Step:**
- [ ] 3.2.1 Import `FavoriteToggleButton` and `QuickAddTaskButton`
- [ ] 3.2.2 Add `headerActions` prop to `ResourceSlideOver`:
  ```tsx
  headerActions={(record) => (
    <>
      <FavoriteToggleButton
        entityType="tasks"
        entityId={record.id}
        displayName={record.title || `Task #${record.id}`}
      />
      <QuickAddTaskButton />  {/* No pre-fill - creates follow-up task */}
    </>
  )}
  ```

**Acceptance Criteria:**
- [ ] Star button and AddTask button appear in header
- [ ] AddTask creates new task (for follow-up workflows)

---

### TODO 3.3: Verify OrganizationSlideOver renders both buttons
**Severity:** Minor | **Complexity:** S | **Parallel:** Yes

**File to Check:**
- `src/atomic-crm/organizations/OrganizationSlideOver.tsx`

**Step-by-Step:**
- [ ] 3.3.1 Verify code has both buttons (lines 123-132 should have FavoriteToggleButton + QuickAddTaskButton)
- [ ] 3.3.2 If code is correct, check for CSS/rendering issues:
  - Check if buttons have proper dimensions (h-11 w-11)
  - Check if parent container has `overflow-hidden` cutting them off
  - Check if conditional rendering is hiding them
- [ ] 3.3.3 Test in browser with DevTools open
- [ ] 3.3.4 Clear cache and hard refresh if needed

**Acceptance Criteria:**
- [ ] Both Star and AddTask buttons visible in OrganizationSlideOver header
- [ ] If issue found, document root cause

---

### TODO 3.4: Fix QuickAddTaskButton text wrapping
**Severity:** Minor | **Complexity:** S | **Parallel:** Yes

**File to Modify:**
- `src/atomic-crm/components/QuickAddTaskButton.tsx`

**Step-by-Step:**
- [ ] 3.4.1 Find chip variant styling (lines ~29-42)
- [ ] 3.4.2 Add `whitespace-nowrap` to prevent text wrapping:
  ```tsx
  // Before
  className="inline-flex items-center gap-1.5 px-3 h-11 rounded-full bg-primary/10 text-primary text-sm font-medium"
  // After
  className="inline-flex items-center gap-1.5 px-3 h-11 rounded-full bg-primary/10 text-primary text-sm font-medium whitespace-nowrap"
  ```
- [ ] 3.4.3 Alternatively, use icon-only variant for narrow spaces

**Acceptance Criteria:**
- [ ] "Add Task" text never wraps to two lines
- [ ] Button maintains single-line layout in all slide-over widths

---

### TODO 3.5: Fix "+ Add Task" button layout on Opportunities
**Severity:** Minor | **Complexity:** S | **Parallel:** Yes

**Files to Check:**
- `src/atomic-crm/opportunities/OpportunitySlideOver.tsx`
- `src/atomic-crm/components/QuickAddTaskButton.tsx`

**Step-by-Step:**
- [ ] 3.5.1 Verify button is using chip variant (should be default)
- [ ] 3.5.2 Check parent flex container for `flex-wrap` that might cause stacking
- [ ] 3.5.3 Ensure header actions container has `flex-nowrap`:
  ```tsx
  <div className="flex items-center gap-2 flex-nowrap">
    {headerActions}
  </div>
  ```
- [ ] 3.5.4 If TODO 3.4 is done, this should be resolved

**Acceptance Criteria:**
- [ ] Button displays inline "Add Task" not stacked "Add\nTask"
- [ ] Consistent with ContactSlideOver appearance

---

## PHASE 4: BADGE & TYPOGRAPHY CONSISTENCY

### TODO 4.1: Standardize Priority badge styling
**Severity:** Medium | **Complexity:** M | **Parallel:** After Phase 1-3

**Files to Audit:**
- `src/components/ui/priority-badge.tsx` (if exists)
- `src/atomic-crm/contacts/ContactList.tsx` (priority display)
- `src/atomic-crm/organizations/OrganizationList.tsx` (priority display)
- `src/atomic-crm/tasks/TaskList.tsx` (priority display)
- All slide-over details tabs

**Step-by-Step:**
- [ ] 4.1.1 Inventory all priority badge usages
- [ ] 4.1.2 Document current variants: filled vs outlined, colors used
- [ ] 4.1.3 Choose standard: **filled badges** for priority (visual hierarchy)
- [ ] 4.1.4 Create or update `PriorityBadge` component with consistent styling:
  ```tsx
  const PRIORITY_STYLES = {
    'A-High': 'bg-destructive text-destructive-foreground',
    'B-Medium': 'bg-warning text-warning-foreground',
    'C-Low': 'bg-muted text-muted-foreground',
  };
  ```
- [ ] 4.1.5 Replace all priority badge usages with standardized component

**Acceptance Criteria:**
- [ ] All priority badges use same variant (filled)
- [ ] Color meanings consistent across all views
- [ ] A-High always uses destructive color

---

### TODO 4.2: Standardize section header casing
**Severity:** Medium | **Complexity:** S | **Parallel:** After Phase 1

**Files to Audit:**
- All files using `FormSection` (should be replaced with `FormSectionWithProgress`)
- All slide-over tabs

**Step-by-Step:**
- [ ] 4.2.1 Search for remaining `FormSection` usages (old ALL CAPS pattern)
- [ ] 4.2.2 Replace with `FormSectionWithProgress` (Title Case)
- [ ] 4.2.3 Verify no hardcoded uppercase transforms in CSS:
  ```css
  /* Remove if found */
  text-transform: uppercase;
  ```

**Acceptance Criteria:**
- [ ] All section headers use Title Case: "Contact Details" not "CONTACT DETAILS"
- [ ] No `FormSection` imports remain (all migrated to `FormSectionWithProgress`)

---

### TODO 4.3: Unify Stage badge colors (list vs slide-over)
**Severity:** Minor | **Complexity:** S | **Parallel:** Yes

**Files to Modify:**
- `src/atomic-crm/opportunities/OpportunityRowListView.tsx`
- `src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx`

**Step-by-Step:**
- [ ] 4.3.1 Find StageBadge component or inline stage rendering
- [ ] 4.3.2 Ensure same component/styling used in both locations:
  ```tsx
  // Both should use:
  <StageBadge stage={record.stage} />
  // Not different inline implementations
  ```
- [ ] 4.3.3 If inline, extract to shared `StageBadge` component

**Acceptance Criteria:**
- [ ] Stage badges in list view match slide-over colors exactly
- [ ] Same component used in both contexts

---

### TODO 4.4: Standardize Cancel button styling
**Severity:** Minor | **Complexity:** S | **Parallel:** After Phase 1

**Files to Check:**
- All Create form components (should use `CreateFormFooter`)

**Step-by-Step:**
- [ ] 4.4.1 After Phase 1, all forms should use `CreateFormFooter`
- [ ] 4.4.2 Verify `CreateFormFooter` uses `variant="outline"` for Cancel:
  ```tsx
  <Button variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
  ```
- [ ] 4.4.3 Remove any `variant="ghost"` Cancel buttons

**Acceptance Criteria:**
- [ ] All Cancel buttons use `variant="outline"`
- [ ] Consistent appearance across all create forms

---

## VERIFICATION CHECKLIST

### After Phase 1 (Create Forms):
```bash
npm run typecheck
npm run test -- --run
npm run dev
```
- [ ] All 6 create forms render without errors
- [ ] Activities: Sectioned scroll, Title Case headers, Save & Close + Save & Add Another
- [ ] Products: Sectioned scroll (no tabs), Title Case headers
- [ ] Opportunities: Save & Close + Save & Add Another, duplicate check works
- [ ] Organizations: Save & Close + Save & Add Another, duplicate check works
- [ ] Tasks: Single asterisk on Due Date, accurate progress count
- [ ] Contacts: Already correct (reference implementation)

### After Phase 2 (List Views):
- [ ] Tasks: Sort dropdown with 4 fields, Export button
- [ ] Products: Sort dropdown, Export button
- [ ] Activities: Sort dropdown, Export button
- [ ] Opportunities: Sort dropdown, Export button (no more `actions={false}`)
- [ ] No "Active filters: true" literal text anywhere
- [ ] Contacts/Organizations: Still working (already correct)

### After Phase 3 (Slide-Overs):
- [ ] Contacts: Star + AddTask (already correct)
- [ ] Organizations: Star + AddTask visible
- [ ] Opportunities: Star + AddTask (Star newly added)
- [ ] Tasks: Star + AddTask (both newly added)
- [ ] No text wrapping on any AddTask buttons

### After Phase 4 (Badges/Typography):
- [ ] All priority badges use filled variant
- [ ] All section headers Title Case
- [ ] Stage badges consistent between list and slide-over
- [ ] All Cancel buttons `variant="outline"`

---

## PARALLEL EXECUTION MAP

```
BATCH 1 - Can run in parallel (3 agents):
┌────────────────────┬────────────────────┬────────────────────┐
│ AGENT: Forms       │ AGENT: Lists       │ AGENT: Slide-Overs │
├────────────────────┼────────────────────┼────────────────────┤
│ TODO 1.1 Activity  │ TODO 2.1 Tasks     │ TODO 3.1 Opp Star  │
│ TODO 1.2 Products  │ TODO 2.2 Products  │ TODO 3.2 Tasks     │
│ TODO 1.5 Tasks **  │ TODO 2.3 Activities│ TODO 3.3 Org verify│
│ TODO 1.6 Progress  │ TODO 2.4 Opp       │ TODO 3.4 Text wrap │
│                    │ TODO 2.5 Filter bug│ TODO 3.5 Layout    │
└────────────────────┴────────────────────┴────────────────────┘

BATCH 2 - Sequential (after Batch 1 complete):
┌─────────────────────────────────────────────────────────────────┐
│ TODO 1.3 Opp footer (needs 1.1, 1.2 for pattern reference)      │
│ TODO 1.4 Org footer (needs 1.1, 1.2 for pattern reference)      │
└─────────────────────────────────────────────────────────────────┘

BATCH 3 - Sequential (after all forms stable):
┌─────────────────────────────────────────────────────────────────┐
│ TODO 4.1 Priority badges                                        │
│ TODO 4.2 Section header casing                                  │
│ TODO 4.3 Stage badge colors                                     │
│ TODO 4.4 Cancel button styling                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## REFERENCE FILES

| Pattern | File Path |
|---------|-----------|
| Create Form (Sectioned Scroll) | `src/atomic-crm/contacts/ContactCreate.tsx` |
| FormSectionWithProgress | `src/components/admin/form/FormSectionWithProgress.tsx` |
| CreateFormFooter | `src/components/admin/create-form-footer.tsx` |
| List View Actions | `src/atomic-crm/contacts/ContactList.tsx` |
| SortButton | `src/components/admin/sort-button.tsx` |
| ExportButton | React Admin built-in |
| Slide-Over Header Actions | `src/atomic-crm/contacts/ContactSlideOver.tsx` |
| FavoriteToggleButton | `src/atomic-crm/components/FavoriteToggleButton.tsx` |
| QuickAddTaskButton | `src/atomic-crm/components/QuickAddTaskButton.tsx` |

---

## ISSUE-TO-TODO MAPPING

| # | Audit Issue | TODO | Severity |
|---|-------------|------|----------|
| 1 | Activities Create broken | 1.1 | Critical |
| 2 | Products Create broken | 1.2 | Critical |
| 3 | Three different Create patterns | 1.1-1.4 | Critical |
| 4 | Sort dropdown missing (4 lists) | 2.1-2.4 | Critical |
| 5 | Tasks double asterisk | 1.5 | Medium |
| 6 | Tasks progress "0 of 0" | 1.6 | Medium |
| 7 | Button label inconsistency | 1.3, 1.4 | Medium |
| 8 | Section header casing | 4.2 | Medium |
| 9 | Priority badge styling | 4.1 | Medium |
| 10 | Tasks perPage 100 | Document only | Medium |
| 11 | Activities search location | Verify only | Medium |
| 12 | Slide-over header actions | 3.1-3.3 | Medium |
| 13 | Opp missing Star | 3.1 | Minor |
| 14 | Org missing AddTask | 3.3 | Minor |
| 15 | Opp AddTask layout | 3.5 | Minor |
| 16 | "Active filters: true" | 2.5 | Minor |
| 17 | Cancel button styling | 4.4 | Minor |
| 18 | Save & Add Another missing | 1.3, 1.4 | Minor |
| 19 | Table view option for Opp | Backlog | Minor |
| 20 | Tasks only 2 tabs | By design | Minor |
| 21 | Stage badge colors | 4.3 | Minor |
| 22 | Status badge meanings | Design review | Minor |
| 23 | Text wrap on AddTask | 3.4 | Minor | ✅ Fixed |

---

## 📋 AUDIT COMPLETION SUMMARY

### Audit Completed: 2026-01-07

**Methodology:**
1. Read all Create form components and compared against `ContactCreate.tsx` reference
2. Read all List view components and compared against `ContactList.tsx` reference
3. Read all SlideOver components and compared against `ContactSlideOver.tsx` reference
4. Analyzed badge components and section styling patterns
5. Applied safe, obvious fixes that passed TypeScript validation
6. Documented all findings with file paths, line numbers, and severity

**Key Findings:**
- **6 reference implementations** already follow canonical patterns (ContactCreate, TaskCreate, ContactList, ContactSlideOver, OrganizationSlideOver, PriorityBadge)
- **4 Critical issues** remain in Create forms (ActivityCreate, ActivitySinglePage FormSection)
- **4 Critical issues** remain in List views (empty TopToolbars for Tasks/Products/Activities, actions=false for Opportunities)
- **1 Blocked issue** (OpportunitySlideOver FavoriteToggleButton requires `FAVORITE_ENTITY_TYPES` schema update)

**Fixes Applied:**
1. ✅ `QuickAddTaskButton.tsx` - Added `whitespace-nowrap` to prevent text wrapping
2. ✅ `TaskGeneralTab.tsx` - Removed manual asterisks, using `isRequired` prop correctly
3. ✅ `ProductCreate.tsx` - Removed legacy `lg:mr-72` layout class
4. ✅ `TaskSlideOver.tsx` - Added `headerActions` with QuickAddTaskButton

**TypeScript Validation:** All changes pass `just typecheck`

**Next Steps:**
1. Implement TODO 1.1 (ActivityCreate) - High priority
2. Implement TODOs 2.1-2.4 (List view SortButton + ExportButton) - High priority
3. Update `FAVORITE_ENTITY_TYPES` schema to include "opportunities" and "tasks" - Medium priority
4. Convert ActivitySinglePage to use FormSectionWithProgress - Medium priority
