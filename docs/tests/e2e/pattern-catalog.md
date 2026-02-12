# Test Pattern Catalog

> Comprehensive catalog of testing patterns used in Crispy CRM, extracted from 283 test files (3,520 tests total).

## Quick Reference

| Category | Patterns | Key Files |
|----------|----------|-----------|
| [Unit: Validation](#1-validation-testing-patterns) | Schema Safety Parse, String Boundary, Mass Assignment | `validation/__tests__/` |
| [Unit: Components](#2-component-testing-patterns) | Mock useListContext, Mock useShowContext, localStorage | `*/__tests__/*.test.tsx` |
| [Unit: Hooks](#3-hook-testing-patterns) | Async Mock Setup, Optimistic Rollback, Date Logic | `hooks/__tests__/` |
| [Unit: Data Provider](#4-data-provider--service-patterns) | PostgREST Transform, Service Delegation | `providers/supabase/__tests__/` |
| [Unit: Integration](#5-integration-test-patterns) | Complete Form Flow, Error Preservation | `*.integration.test.tsx` |
| [E2E: POMs](#6-page-object-model-pom-patterns) | Base POM, Form POM, Tab Navigation | `tests/e2e/support/poms/` |
| [E2E: Forms](#7-e2e-form-testing-patterns) | Validation Errors, Success Redirects | `tests/e2e/specs/forms/` |
| [E2E: CRUD](#8-crud-operations-patterns) | Lifecycle Suite, Timestamp Isolation | `tests/e2e/specs/*/crud.spec.ts` |
| [E2E: Monitoring](#9-console-error-monitoring-pattern) | RLS Detection, React Error Filtering | `tests/e2e/support/utils/` |
| [E2E: Auth](#10-authentication-patterns) | Fixture-based, Manual Login Fallback | `tests/e2e/support/fixtures/` |
| [E2E: RBAC](#11-rbac-testing-pattern) | Role-Specific Operations | `tests/e2e/specs/rbac/` |
| [E2E: A11y](#12-accessibility-testing-pattern) | Keyboard Navigation, Skip Links | `tests/e2e/accessibility/` |
| [Utilities](#13-test-utilities) | renderWithAdminContext, Mock Factories | `src/tests/utils/` |

---

## Unit Test Patterns

### 1. Validation Testing Patterns

#### Pattern: Zod Schema Safety Parse with Exhaustive Case Coverage

**Purpose:** Validate Zod schemas at API boundary with comprehensive test coverage for valid/invalid inputs

**Example from:** `src/atomic-crm/validation/__tests__/task.test.ts:24-77`

```typescript
describe("taskTypeSchema", () => {
  it("should accept all valid task types", () => {
    const validTypes: TaskType[] = [
      "Call",
      "Email",
      "Meeting",
      "Follow-up",
      "Demo",
      "Proposal",
      "Other",
    ];

    validTypes.forEach((type) => {
      const result = taskTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid task types", () => {
    const invalidTypes = [
      "InvalidType",
      "call",          // Case-sensitive check
      "EMAIL",         // Case-sensitive check
      "",
      "None",          // Deprecated values
      "Discovery",     // Deprecated values
    ];

    invalidTypes.forEach((type) => {
      const result = taskTypeSchema.safeParse(type);
      expect(result.success).toBe(false);
    });
  });
});
```

**When to use:** For every Zod schema - validates enum values, required fields, string length constraints, integer bounds.

---

#### Pattern: String Length Boundary Testing (DoS Prevention)

**Purpose:** Prevent Denial of Service via unbounded string inputs by testing `.max()` constraints

**Example from:** `src/atomic-crm/validation/__tests__/task.test.ts:127-142`

```typescript
it("should reject task with title exceeding 500 characters", () => {
  const longTitle = "a".repeat(501);
  const invalidTask = { ...validTask, title: longTitle };
  const result = taskSchema.safeParse(invalidTask);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toContain("Title too long");
  }
});

it("should accept task with title at 500 character limit", () => {
  const maxTitle = "a".repeat(500);
  const validMaxTask = { ...validTask, title: maxTitle };
  const result = taskSchema.safeParse(validMaxTask);
  expect(result.success).toBe(true);
});
```

**When to use:** For every string field with `.max()` - test boundary (limit), one-over-limit (rejection), at-limit (acceptance).

---

#### Pattern: z.strictObject Mass Assignment Prevention

**Purpose:** Ensure creation schemas reject unrecognized fields (security: prevents privilege escalation)

**Example from:** `src/atomic-crm/validation/__tests__/task.test.ts:359-399`

```typescript
it("should reject id field on creation (z.strictObject security)", () => {
  const dataWithId = {
    id: 999,                          // Attacker tries to set ID
    title: "New task",
    due_date: "2025-01-20",
    type: "Call",
    contact_id: 1,
    sales_id: 1,
  };

  expect(() => taskCreateSchema.parse(dataWithId)).toThrow();
});

it("should reject created_by on creation (z.strictObject security)", () => {
  const dataWithCreatedBy = {
    title: "New task",
    // ... other fields ...
    created_by: 999,  // Trigger should set this, not user
  };

  expect(() => taskCreateSchema.parse(dataWithCreatedBy)).toThrow();
});
```

**When to use:** For every create/update schema - test that audit fields, ID fields, and timestamp fields are rejected.

---

#### Pattern: RPC Parameter Validation with Null Handling

**Purpose:** Validate RPC function parameters including optional null values and fallback patterns

**Example from:** `src/atomic-crm/validation/__tests__/rpc.test.ts:216-279`

```typescript
describe("checkAuthorizationParamsSchema", () => {
  it("should accept valid params with distributor and principal", () => {
    const result = checkAuthorizationParamsSchema.safeParse({
      _distributor_id: 100,
      _principal_id: 200,
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid params with distributor and product (Product→Org fallback)", () => {
    const result = checkAuthorizationParamsSchema.safeParse({
      _distributor_id: 100,
      _product_id: 50,
    });
    expect(result.success).toBe(true);
  });

  it("should accept null for optional parameters", () => {
    const result = checkAuthorizationParamsSchema.safeParse({
      _distributor_id: 100,
      _principal_id: null,
      _product_id: null,
    });
    expect(result.success).toBe(true);
  });
});
```

**When to use:** For RPC wrapper schemas - test required vs optional params, null handling, and fallback chains.

---

### 2. Component Testing Patterns

#### Pattern: Mock useListContext for List Components

**Purpose:** Test list components by mocking React Admin's data context and filtering logic

**Example from:** `src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx:16-40`

```typescript
// Mock useListContext to test components directly
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(),
  };
});

import { useListContext } from "ra-core";

describe("OpportunityListContent", () => {
  const defaultListContext = {
    data: mockOpportunities,
    total: mockOpportunities.length,
    isPending: false,
    isLoading: false,
    filterValues: { "deleted_at@is": null },
    setFilters: vi.fn(),
    setSort: vi.fn(),
    setPage: vi.fn(),
    setPerPage: vi.fn(),
    page: 1,
    perPage: 100,
    sort: { field: "index", order: "DESC" },
    resource: "opportunities",
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useListContext as any).mockReturnValue(defaultListContext);
  });

  test("renders list with mocked data from useListContext", async () => {
    renderWithAdminContext(<OpportunityListContent openSlideOver={mockOpenSlideOver} />);

    await waitFor(() => {
      expect(screen.getByText("Tech Deal")).toBeInTheDocument();
    });
  });
});
```

**When to use:** For list components with multi-select filters, pagination, and dynamic data.

---

#### Pattern: Mock useShowContext with Loading States

**Purpose:** Test detail components with loading, error, and data states

**Example from:** `src/atomic-crm/organizations/__tests__/OrganizationShow.test.tsx:109-128`

```typescript
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useShowContext: vi.fn(),
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      error: null,
    })),
  };
});

test("renders loading state", () => {
  (useShowContext as any).mockReturnValue({
    record: undefined,
    isPending: true,
    error: null,
  });

  renderWithAdminContext(
    <Routes>
      <Route path="/organizations/:id/show" element={<OrganizationShow />} />
    </Routes>,
    {
      resource: "organizations",
      initialEntries: ["/organizations/1/show"],
    }
  );

  // When isPending is true, the component returns null
  expect(screen.queryByRole("main")).not.toBeInTheDocument();
});

test("renders with valid organization data", async () => {
  const mockOrg = createMockOrganization({
    id: 1,
    name: "Tech Corp",
    nb_contacts: 5,
    nb_opportunities: 3,
  });

  (useShowContext as any).mockReturnValue({
    record: mockOrg,
    isPending: false,
    error: null,
  });

  renderWithAdminContext(
    <Routes>
      <Route path="/organizations/:id/show" element={<OrganizationShow />} />
    </Routes>,
    {
      resource: "organizations",
      record: mockOrg,
      initialEntries: ["/organizations/1/show"],
    }
  );

  await waitFor(() => {
    expect(screen.getByText("Tech Corp")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /5 contacts/i })).toBeInTheDocument();
  });
});
```

**When to use:** For detail/show components - test three states: loading (isPending=true), loaded (record present), error.

---

#### Pattern: localStorage Persistence Testing

**Purpose:** Test that UI preferences (filters, column visibility) persist across sessions

**Example from:** `src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx:221-289`

```typescript
describe("OpportunityList localStorage persistence", () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    vi.clearAllMocks();
  });

  test("persists stage filter preferences to localStorage", () => {
    const updateStagePreferences = (selectedStages: string[]): void => {
      const allStages = OPPORTUNITY_STAGE_CHOICES.map((choice) => choice.id);
      const hiddenStages = allStages.filter((stage) => !selectedStages.includes(stage));

      if (hiddenStages.length > 0) {
        localStorage.setItem("opportunity_hidden_stages", JSON.stringify(hiddenStages));
      }
    };

    const selectedStages = ["new_lead", "demo_scheduled", "initial_outreach"];
    updateStagePreferences(selectedStages);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "opportunity_hidden_stages",
      expect.stringContaining("closed_won")
    );
  });

  test("reads default stage filter from localStorage", () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "opportunity_hidden_stages") {
        return JSON.stringify(["closed_won", "closed_lost"]);
      }
      return null;
    });

    const getInitialStageFilter = (): string[] | undefined => {
      const hiddenStages = JSON.parse(
        localStorage.getItem("opportunity_hidden_stages") || '["closed_won", "closed_lost"]'
      );
      return OPPORTUNITY_STAGE_CHOICES.map((choice) => choice.id).filter(
        (stage) => !hiddenStages.includes(stage)
      );
    };

    const visibleStages = getInitialStageFilter();
    expect(visibleStages).not.toContain("closed_won");
    expect(visibleStages).toContain("new_lead");
  });
});
```

**When to use:** For any component that persists UI state - mock localStorage, test write on change, test read on mount.

---

### 3. Hook Testing Patterns

#### Pattern: Comprehensive Mock Setup for Async Hooks

**Purpose:** Test hooks that depend on multiple external modules and side effects

**Example from:** `src/atomic-crm/hooks/__tests__/useFilterCleanup.test.ts:15-48`

```typescript
// Mock ra-core's useStore hook
const mockSetItem = vi.fn();
vi.mock("ra-core", () => ({
  useStore: () => [null, { setItem: mockSetItem }],
}));

// Mock the filterRegistry validation function
vi.mock("../../providers/supabase/filterRegistry", () => ({
  isValidFilterField: vi.fn(),
}));

import { isValidFilterField } from "../../providers/supabase/filterRegistry";

describe("useFilterCleanup", () => {
  // Spy on console methods
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("when no stored params exist", () => {
    it("should do nothing and not call setItem", () => {
      // Arrange - localStorage is empty

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert
      expect(mockSetItem).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
```

**When to use:** For hooks with external dependencies - mock each dependency, clear state in beforeEach, test all code paths.

---

#### Pattern: Optimistic Update with Rollback Testing

**Purpose:** Test that optimistic UI updates rollback on API failure (critical for UX)

**Example from:** `src/atomic-crm/dashboard/__tests__/useMyTasks.test.ts:396-460`

```typescript
describe("snoozeTask() - Optimistic Update", () => {
  it("should optimistically update task due date", async () => {
    const dates = createTestDates();
    const mockTask = createMockTask({ id: 1, due_date: dates.today.toISOString() });
    baseTasksData = [mockTask];
    const tomorrowDate = addDays(dates.today, 1);
    mockUpdate.mockResolvedValueOnce({
      data: { ...mockTask, due_date: tomorrowDate.toISOString() }
    });

    const { result } = renderHook(() => useMyTasks());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].status).toBe("today");
    });

    await act(async () => {
      await result.current.snoozeTask(1);
    });

    // Should have moved to tomorrow status via optimistic update
    await waitFor(() => {
      expect(result.current.tasks[0].status).toBe("tomorrow");
    }, { timeout: 2000 });
  });

  it("should rollback on API failure", async () => {
    const dates = createTestDates();
    const mockTask = createMockTask({ id: 1, due_date: dates.today.toISOString() });
    baseTasksData = [mockTask];
    mockUpdate.mockRejectedValueOnce(new Error("Snooze failed"));

    const { result } = renderHook(() => useMyTasks());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    const originalStatus = result.current.tasks[0].status;

    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.snoozeTask(1);
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error?.message).toBe("Snooze failed");
    // Should rollback to original status
    expect(result.current.tasks[0].status).toBe(originalStatus);
  });
});
```

**When to use:** For hooks with side effects (mutations) - test optimistic update succeeds and rollback on error.

---

#### Pattern: Date Logic Testing with Real Time

**Purpose:** Test time-dependent logic using start-of-day calculations to avoid timezone issues

**Example from:** `src/atomic-crm/dashboard/__tests__/useMyTasks.test.ts:165-178`

```typescript
// Create test fixtures based on real current time
const createTestDates = () => {
  const now = new Date();
  const today = startOfDay(now);
  return {
    now,
    today,
    yesterday: addDays(today, -1),
    tomorrow: addDays(today, 1),
    twoDaysOut: addDays(today, 2),
    fiveDaysOut: addDays(today, 5),
    eightDaysOut: addDays(today, 8),
  };
};

describe("calculateStatus() - Date Logic", () => {
  it("should return correct status for various dates", async () => {
    const dates = createTestDates();
    const { result } = renderHook(() => useMyTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.calculateStatus(dates.yesterday)).toBe("overdue");
    expect(result.current.calculateStatus(dates.today)).toBe("today");
    expect(result.current.calculateStatus(dates.tomorrow)).toBe("tomorrow");
    expect(result.current.calculateStatus(dates.fiveDaysOut)).toBe("upcoming");
    expect(result.current.calculateStatus(dates.eightDaysOut)).toBe("later");
  });

  it("should handle same day with different times", async () => {
    const { result } = renderHook(() => useMyTasks());

    const earlyToday = new Date();
    earlyToday.setHours(0, 1, 0, 0);

    const lateToday = new Date();
    lateToday.setHours(23, 59, 0, 0);

    // Both should return 'today' since they're on the same calendar day
    expect(result.current.calculateStatus(earlyToday)).toBe("today");
    expect(result.current.calculateStatus(lateToday)).toBe("today");
  });
});
```

**When to use:** For time-dependent logic - use `startOfDay` to eliminate timezone/time-of-day variance in tests.

---

### 4. Data Provider & Service Patterns

#### Pattern: PostgREST Operator Transformation Testing

**Purpose:** Verify correct transformation of React Admin filter syntax to PostgREST operators

**Example from:** `src/atomic-crm/providers/supabase/__tests__/dataProviderUtils.transform.test.ts:12-127`

```typescript
describe("transformArrayFilters", () => {
  describe("JSONB array fields (tags, email, phone)", () => {
    it("should transform tags array to @cs operator", () => {
      const filter = { tags: [1, 2, 3] };
      expect(transformArrayFilters(filter)).toEqual({
        "tags@cs": "{1,2,3}",  // PostgreSQL array syntax
      });
    });

    it("should escape special characters in JSONB array values", () => {
      const filter = { email: ["user@example.com", "name, with, commas"] };
      expect(transformArrayFilters(filter)).toEqual({
        "email@cs": '{"user@example.com","name, with, commas"}',
      });
    });
  });

  describe("regular array fields (non-JSONB)", () => {
    it("should transform status array to @in operator", () => {
      const filter = { status: ["active", "pending"] };
      expect(transformArrayFilters(filter)).toEqual({
        "status@in": "(active,pending)",  // SQL IN syntax
      });
    });
  });

  describe("preserving existing PostgREST operators", () => {
    it("should preserve @is operator with null value for soft delete filtering", () => {
      // CRITICAL: The @is operator specifically needs null as a value
      const filter = {
        "deleted_at@is": null,
        status: "active",
      };
      expect(transformArrayFilters(filter)).toEqual({
        "deleted_at@is": null,  // Preserved exactly
        status: "active",
      });
    });
  });
});
```

**When to use:** For filter transformation functions - test JSONB vs regular array operators, special char escaping, operator normalization.

---

#### Pattern: Service Delegation with Error Wrapping

**Purpose:** Test service layer that wraps lower-level functions with error handling and logging

**Example from:** `src/atomic-crm/services/__tests__/activities.service.test.ts:35-159`

```typescript
describe("ActivitiesService", () => {
  let service: ActivitiesService;
  let mockDataProvider: DataProvider;
  let mockGetActivityLog: any;

  beforeEach(() => {
    mockDataProvider = createMockDataProvider();
    service = new ActivitiesService(mockDataProvider);
    mockGetActivityLog = vi.mocked(getActivityLog);
    mockGetActivityLog.mockClear();
  });

  describe("getActivityLog", () => {
    test("should delegate to getActivityLog function with dataProvider", async () => {
      const mockActivities = [
        {
          id: 1,
          activity_type: "interaction",
          type: "call",
          subject: "Sales call",
          activity_date: "2024-01-15",
        },
      ];

      mockGetActivityLog.mockResolvedValue(mockActivities);

      const result = await service.getActivityLog();

      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, undefined, undefined);
      expect(result).toEqual(mockActivities);
    });

    test("should throw with enhanced error message on RPC failure", async () => {
      mockGetActivityLog.mockRejectedValue(new Error("RPC execution failed"));

      await expect(service.getActivityLog()).rejects.toThrow(
        "Get activity log failed: RPC execution failed"
      );
    });
  });

  describe("Performance Optimization (BOY SCOUT RULE)", () => {
    test("should make single RPC call instead of 5 separate queries", async () => {
      mockGetActivityLog.mockResolvedValue([
        { id: 1, source: "activities" },
        { id: 2, source: "contact_notes" },
      ]);

      await service.getActivityLog();

      // Verify getActivityLog was called only once (not 5 times)
      expect(mockGetActivityLog).toHaveBeenCalledTimes(1);
    });
  });
});
```

**When to use:** For service classes - test parameter passing, error wrapping, and performance optimizations.

---

### 5. Integration Test Patterns

#### Pattern: Complete E2E Form Flow with User Interactions

**Purpose:** Test complete user workflows through complex forms with validations and side effects

**Example from:** `src/atomic-crm/opportunities/__tests__/QuickAdd.integration.test.tsx:237-308`

```typescript
/**
 * Helper to select a city from the city combobox.
 */
async function selectCity(
  cityName: string,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  const cityTrigger = screen.getByText("Select or type city...");
  await user.click(cityTrigger);

  const searchInput = await screen.findByPlaceholderText("Search cities...");
  await user.type(searchInput, cityName);

  await waitFor(
    () => {
      const item = findCommandItem(cityName);
      if (!item) {
        throw new Error(`City "${cityName}" not found in options`);
      }
    },
    { timeout: 5000 }
  );

  const cityItem = findCommandItem(cityName);
  await user.click(cityItem);
}

describe("QuickAdd Integration", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorage.clear();

    mockCreateBoothVisitor.mockResolvedValue({
      data: {
        contact_id: 1,
        organization_id: 2,
        opportunity_id: 3,
        success: true,
      },
    });
  });

  it("completes full atomic creation flow with Save & Close", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // 1. Open dialog
    const quickAddButton = screen.getByText(/quick add/i);
    await user.click(quickAddButton);

    // 2. Verify dialog opened
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Quick Add Booth Visitor")).toBeInTheDocument();

    // 3. Fill form fields
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john.doe@example.com");
    await user.type(screen.getByLabelText(/organization name/i), "Acme Corp");

    // City uses Combobox - use helper
    await selectCity("Chicago", user);

    // 4. Submit with Save & Close
    const saveCloseButton = screen.getByText(/save & close/i);
    await user.click(saveCloseButton);

    // 5. Verify atomic transaction was called
    await waitFor(() => {
      expect(mockCreateBoothVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          org_name: "Acme Corp",
        })
      );
    });

    // 6. Verify success toast shown
    expect(mockNotify).toHaveBeenCalledWith("✅ Created: John Doe - Acme Corp", {
      type: "success",
      autoHideDuration: 2000,
    });

    // 7. Verify dialog closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  }, 20000);  // Long timeout for async operations

  it("handles errors and preserves form data", async () => {
    mockCreateBoothVisitor.mockRejectedValueOnce(new Error("Database connection failed"));

    renderWithAdminContext(<QuickAddButton />);

    await user.click(screen.getByText(/quick add/i));

    // Fill all required fields
    await user.type(screen.getByLabelText(/first name/i), "Error");
    await user.type(screen.getByLabelText(/last name/i), "Test");
    await user.type(screen.getByLabelText(/email/i), "error@test.com");

    // Submit
    await user.click(screen.getByText(/save & close/i));

    // Verify error toast shown
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        "Failed to create booth visitor: Database connection failed",
        { type: "error" }
      );
    });

    // Verify dialog stays open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Verify form data preserved
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Error");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Test");
    expect(screen.getByLabelText(/email/i)).toHaveValue("error@test.com");

    // Verify no automatic retry (fail fast principle)
    expect(mockCreateBoothVisitor).toHaveBeenCalledTimes(1);
  }, 20000);
});
```

**When to use:** For complete user workflows - test dialog open/close, form filling, validations, API calls, toasts, state persistence.

---

## E2E Test Patterns

### 6. Page Object Model (POM) Patterns

#### Pattern: Base POM with Semantic Selectors

**Purpose:** Foundation for all POMs with reusable semantic selector methods

**Example from:** `tests/e2e/support/poms/BasePage.ts:1-71`

```typescript
import type { Page, Locator } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Wait for a specific URL pattern
   */
  async waitForURL(pattern: string | RegExp, timeout = 10000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Get a button by its accessible name
   */
  getButton(name: string | RegExp): Locator {
    return this.page.getByRole("button", { name });
  }

  /**
   * Get a text input by its label
   */
  getTextInput(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Get text content
   */
  getText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get a row in a table/grid
   */
  getRow(): Locator {
    return this.page.getByRole("row");
  }
}
```

**When to use:**
- All POMs should extend this class
- Always use semantic selectors: `getByRole()`, `getByLabel()`, `getByText()`, never CSS selectors
- Encapsulate page elements in helper methods
- Use regex patterns for flexible matching

---

#### Pattern: Form POM with Tabbed Navigation

**Purpose:** Handle complex multi-tab forms with required/optional fields

**Example from:** `tests/e2e/support/poms/ContactFormPage.ts:26-100`

```typescript
export class ContactFormPage extends BasePage {
  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async gotoCreate(): Promise<void> {
    await this.goto("/#/contacts/create");
    await waitForFormReady(this.page);
  }

  async gotoEdit(contactId: number | string): Promise<void> {
    await this.goto(`/#/contacts/${contactId}`);
    await waitForFormReady(this.page);
  }

  // ============================================================================
  // TAB NAVIGATION
  // ============================================================================

  async clickMainTab(): Promise<void> {
    await this.page.getByRole("tab", { name: /main/i }).click();
  }

  async clickMoreTab(): Promise<void> {
    await this.page.getByRole("tab", { name: /more/i }).click();
  }

  // ============================================================================
  // FORM FIELDS
  // ============================================================================

  async fillFirstName(firstName: string): Promise<void> {
    const input = this.page.getByLabel(/first name/i);
    await expect(input).toBeVisible();
    await input.fill(firstName);
  }

  async fillLastName(lastName: string): Promise<void> {
    const input = this.page.getByLabel(/last name/i);
    await expect(input).toBeVisible();
    await input.fill(lastName);
  }
}
```

**When to use:**
- Forms with multiple tabs - organize methods by logical sections
- Always verify element visibility before interaction
- Use semantic label matching with case-insensitive regex
- Group related methods with comment separators

---

### 7. E2E Form Testing Patterns

#### Pattern: Error Scenarios with Inline Validation

**Purpose:** Test form validation when users attempt submission without required fields

**Example from:** `tests/e2e/specs/forms/contact-form.spec.ts:52-81`

```typescript
test("ERROR - Empty form shows required field errors and disables submit", async ({ page }) => {
  const formPage = new ContactFormPage(page);

  // Verify we're on create form
  await formPage.expectStillOnCreateForm();

  // The form uses INLINE VALIDATION with DISABLED SUBMIT BUTTONS
  // Save buttons should be disabled when required fields are empty
  const saveButton = page.getByRole("button", { name: /save.*close/i });
  await expect(saveButton).toBeDisabled();

  // Verify validation errors are shown for required fields inline
  const requiredFieldMessages = page.getByText(/required field/i);
  const messageCount = await requiredFieldMessages.count();
  expect(messageCount).toBeGreaterThan(0);

  // Check specific required fields show as invalid
  const firstNameInput = formPage.getFirstNameInput();
  const lastNameInput = formPage.getLastNameInput();

  // Touch fields to trigger validation state display
  await firstNameInput.focus();
  await firstNameInput.blur();
  await lastNameInput.focus();
  await lastNameInput.blur();

  // Verify form cannot be submitted (button still disabled)
  await expect(saveButton).toBeDisabled();
});
```

**When to use:**
- Test forms with inline validation (validation shows errors before submission)
- Test disabled submit buttons until form is valid
- Use `focus()` / `blur()` to trigger validation state visibility

---

#### Pattern: Success Scenarios with Redirect Verification

**Purpose:** Verify form successfully saves and redirects

**Example from:** `tests/e2e/specs/forms/contact-form.spec.ts:130-159`

```typescript
test("SUCCESS - Valid minimal form saves and redirects to list", async ({ page }) => {
  const testData = generateTestContact();
  const testContact = {
    firstName: testData.firstName,
    lastName: testData.lastName,
    email: testData.email,
    organization: DEFAULT_TEST_ORGANIZATION.searchText,
    accountManager: "Admin",
  };

  const formPage = new ContactFormPage(page);

  // Fill all required fields (minimal valid form)
  await formPage.fillRequiredFields(testContact);

  // Submit form
  await formPage.clickSaveAndClose();

  // ContactCreate redirects to list, not show page
  await expect(page).toHaveURL(/\/#\/contacts($|\?)/, { timeout: 10000 });

  // Verify we left the create page (form saved successfully)
  await expect(page).not.toHaveURL(/\/create/);

  // Assert no RLS or React errors
  expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
  expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
});
```

**When to use:**
- Test successful form submission with minimal required data
- Always verify redirect URL using regex patterns
- Check console for RLS (Row-Level Security) and React errors

---

### 8. CRUD Operations Patterns

#### Pattern: Complete CRUD Lifecycle Test Suite

**Purpose:** Test create, read, update, delete operations in sequence

**Example from:** `tests/e2e/specs/contacts/contacts-crud.spec.ts:54-210`

```typescript
test.describe("Contacts CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Login using POM (semantic selectors, no CSS)
    const loginPage = new LoginPage(page);
    await loginPage.goto("/");

    // Wait for either login form or dashboard
    const isLoginFormVisible = await page
      .getByLabel(/email/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isLoginFormVisible) {
      await loginPage.login("admin@test.com", "password123");
    } else {
      // Already logged in, wait for dashboard
      await page.waitForURL(/\/#\//, { timeout: 10000 });
    }
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("CREATE - Create a new contact", async ({ page }) => {
    // Generate unique test data with timestamp
    const timestamp = Date.now();
    const testContact = {
      firstName: `TestFirst-${timestamp}`,
      lastName: `TestLast-${timestamp}`,
      email: `test-${timestamp}@example.com`,
    };

    const listPage = new ContactsListPage(page);
    const formPage = new ContactFormPage(page);
    const showPage = new ContactShowPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Click Create button
    await listPage.clickCreate();

    // Fill and submit form
    await formPage.createContact(testContact);

    // Verify contact was created
    await showPage.expectContactVisible(testContact);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("DELETE - Delete a contact", async ({ page }) => {
    const timestamp = Date.now();
    const deleteContact = {
      firstName: `DeleteFirst-${timestamp}`,
      lastName: `DeleteLast-${timestamp}`,
      email: `delete-${timestamp}@example.com`,
    };

    const listPage = new ContactsListPage(page);
    const formPage = new ContactFormPage(page);
    const showPage = new ContactShowPage(page);

    // Create a contact specifically for deletion
    await listPage.navigate();
    await listPage.clickCreate();
    await formPage.createContact(deleteContact);

    // Delete it
    await showPage.deleteContact();

    // Verify redirect to list
    await expect(page).toHaveURL("/#/contacts");

    // Verify contact is no longer visible
    await listPage.expectContactNotVisible(deleteContact.email);

    expect(consoleMonitor.hasRLSErrors()).toBe(false);
  });
});
```

**When to use:**
- Test complete CRUD lifecycle with separate tests for each operation
- Use `beforeEach` for setup (login, navigation)
- Use `afterEach` for cleanup and console error reporting
- Generate unique test data with timestamp for isolation

---

#### Pattern: Timestamp-Based Test Data Isolation

**Purpose:** Prevent test data collisions when running tests in parallel

**Example from:** `tests/e2e/specs/opportunities/crud.spec.ts:45-83`

```typescript
test("should create opportunity with minimal required fields", async ({ page }) => {
  // Generate unique test data using timestamp
  const timestamp = Date.now();
  const opportunityName = `Test Opportunity ${timestamp}`;
  const orgName = "A&W"; // From seed.sql (id: 12, customer type)

  const listPage = new OpportunitiesListPage(page);
  const formPage = new OpportunityFormPage(page);

  // Navigate to opportunities list
  await listPage.goto();

  // Navigate to create form
  await listPage.clickCreate();

  // Fill and submit form
  await formPage.fillName(opportunityName);
  await formPage.selectOrganization(orgName);
  await formPage.submit();

  // Verify redirect to show page or list
  await page.waitForURL(/\/#\/opportunities(\/\d+\/show)?/, { timeout: 10000 });
});

// Test data isolation with concurrent creates
test("should maintain test data isolation with concurrent creates", async ({ page }) => {
  // Using high-resolution timestamp for uniqueness
  const timestamp1 = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const name1 = `Concurrent Test ${timestamp1}`;

  const timestamp2 = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const name2 = `Concurrent Test ${timestamp2}`;

  // Verify names are different (data isolation works)
  expect(name1).not.toBe(name2);
});
```

**When to use:**
- Always use `Date.now()` in test data names for uniqueness
- For higher collision avoidance, combine timestamp + random string

---

### 9. Console Error Monitoring Pattern

#### Pattern: Comprehensive Console Monitoring

**Purpose:** Capture and categorize console errors, warnings, and exceptions for diagnostics

**Example from:** `tests/e2e/support/utils/console-monitor.ts:1-145`

```typescript
export class ConsoleMonitor {
  private errors: Array<{ type: string; message: string; timestamp: number }> = [];

  /**
   * Attach console monitoring to a page
   */
  async attach(page: Page): Promise<void> {
    this.errors = [];

    page.on("console", (msg) => {
      const type = msg.type();
      if (type === "error" || type === "warning") {
        this.errors.push({
          type,
          message: msg.text(),
          timestamp: Date.now(),
        });
      }
    });

    page.on("pageerror", (error) => {
      this.errors.push({
        type: "exception",
        message: error.message,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Check if any RLS (Row Level Security) errors occurred
   */
  hasRLSErrors(): boolean {
    return this.errors.some(
      (e) =>
        e.message.includes("permission denied") ||
        e.message.includes("RLS") ||
        e.message.includes("row-level security")
    );
  }

  /**
   * Check if any critical React errors occurred
   */
  hasReactErrors(): boolean {
    const ignoredPatterns = [
      "DialogContent",
      "DialogTitle",
      "aria-describedby",
      "Missing `Description`",
      "VisuallyHidden",
      "rowClassName",
    ];

    return this.errors.some((e) => {
      const isReactRelated =
        e.message.includes("React") ||
        e.message.includes("Hook") ||
        (e.message.includes("component") && e.type === "error");

      if (!isReactRelated) return false;

      const isIgnored = ignoredPatterns.some((pattern) => e.message.includes(pattern));
      return !isIgnored;
    });
  }

  /**
   * Get a formatted report of all errors
   */
  getReport(): string {
    if (this.errors.length === 0) {
      return "No console errors detected";
    }

    let report = `\n=== Console Errors Report (${this.errors.length} errors) ===\n`;

    if (this.hasRLSErrors()) {
      report += "\n⚠️  RLS/Permission errors detected!\n";
    }
    if (this.hasReactErrors()) {
      report += "⚠️  React errors detected!\n";
    }

    return report;
  }

  clear(): void {
    this.errors = [];
  }
}

export const consoleMonitor = new ConsoleMonitor();
```

**Test Usage:**
```typescript
test.beforeEach(async ({ page }) => {
  await consoleMonitor.attach(page);
});

test.afterEach(async () => {
  if (consoleMonitor.getErrors().length > 0) {
    console.log(consoleMonitor.getReport());
  }
  consoleMonitor.clear();
});

test("should not have RLS errors", async () => {
  // ... test actions ...
  expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
  expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
});
```

**When to use:**
- Attach in `test.beforeEach()` to monitor all console output
- Use `hasRLSErrors()` to detect permission/security issues
- Always `clear()` errors between tests to prevent spillover

---

### 10. Authentication Patterns

#### Pattern: Authenticated Test Fixture

**Purpose:** Provide pre-authenticated page with console monitoring

**Example from:** `tests/e2e/support/fixtures/authenticated.ts:1-33`

```typescript
import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";
import { consoleMonitor } from "../utils/console-monitor";

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Page already has auth from storage state
    await use(page);

    // Report console errors after test (if any)
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }

    consoleMonitor.clear();
  },
});

export { expect } from "@playwright/test";
```

**Test Usage:**
```typescript
import { test, expect } from "../support/fixtures/authenticated";

test.describe("Dashboard V3 - Full Stack E2E", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard-v3");
    await authenticatedPage.waitForLoadState("networkidle");
  });

  test("renders all three panels with correct headers", async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h3:has-text("Pipeline by Principal")')).toBeVisible();
    await expect(authenticatedPage.locator('h3:has-text("My Tasks")')).toBeVisible();
  });
});
```

**When to use:**
- Use `authenticatedPage` fixture when auth is already set up via storage state
- Avoids manual login in each test (faster execution)
- Attaches console monitoring automatically

---

### 11. RBAC Testing Pattern

#### Pattern: Role-Specific Operations Testing

**Purpose:** Verify that different user roles can perform their specific actions

**Example from:** `tests/e2e/specs/rbac/admin-operations.spec.ts:35-178`

```typescript
test.describe("Admin RBAC Operations", () => {
  // Use admin auth fixture
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await consoleMonitor.attach(page);
  });

  test.afterEach(async () => {
    if (consoleMonitor.getErrors().length > 0) {
      console.log("Console errors:", consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("A1: Admin can access /sales team management", async ({ page }) => {
    const listPage = new SalesListPage(page);

    await listPage.navigate();
    await listPage.expectUsersVisible();

    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
  });

  test("A2: Admin can create new user with manager role", async ({ page }) => {
    const timestamp = Date.now();
    const newUser = {
      firstName: `NewManager-${timestamp}`,
      lastName: `Test-${timestamp}`,
      email: `new-manager-${timestamp}@example.com`,
      role: "manager" as const,
    };

    const listPage = new SalesListPage(page);
    const formPage = new SalesFormPage(page);

    await listPage.navigate();
    await listPage.clickCreate();
    await formPage.createUser(newUser);

    await page.waitForURL(/\/#\/sales/, { timeout: 10000 });
    await listPage.expectUserByEmailVisible(newUser.email);

    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });
});
```

**When to use:**
- Test role-specific access (admin, manager, rep)
- Use `test.use({ storageState })` to specify which user role
- Test both permission-granted and permission-denied scenarios
- Always check for RLS errors when testing security

---

### 12. Accessibility Testing Pattern

#### Pattern: Keyboard Navigation & Screen Reader Testing

**Purpose:** Verify skip links and focus management for accessibility

**Example from:** `tests/e2e/accessibility/skip-link.spec.ts:1-76`

```typescript
test.describe("Skip to Content Link", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should be visible when focused via keyboard", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test("should skip to main content when clicked", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await skipLink.click({ force: true });

    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("should skip to main content when activated with keyboard", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");

    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("should be visually hidden until focused", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    // Check it's hidden by default (sr-only uses clip)
    const initialBoundingBox = await skipLink.boundingBox();
    expect(initialBoundingBox?.width).toBeLessThanOrEqual(1);
    expect(initialBoundingBox?.height).toBeLessThanOrEqual(1);

    // Focus the skip link
    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    // Should now be visible with a real bounding box
    const focusedBoundingBox = await skipLink.boundingBox();
    expect(focusedBoundingBox?.width).toBeGreaterThan(50);
    expect(focusedBoundingBox?.height).toBeGreaterThan(20);
  });
});
```

**When to use:**
- Test keyboard navigation using `.focus()`, `.blur()`, and `page.keyboard.press()`
- Verify skip links are visually hidden until focused (test bounding box size)
- Test focus management and focus order
- Use `getByRole("link", { name })` for semantic link selection

---

## 13. Test Utilities

### Pattern: renderWithAdminContext for Isolated Component Testing

**Purpose:** Provide a single wrapper function that sets up all React Admin providers

**Example from:** `src/tests/utils/render-admin.tsx:98-165`

```typescript
export interface RenderAdminOptions extends Omit<RenderOptions, "wrapper"> {
  dataProvider?: Partial<DataProvider>;
  authProvider?: AuthProvider;
  queryClient?: QueryClient;
  resource?: string;
  record?: any;
  userRole?: "admin" | "user";
  isAuthenticated?: boolean;
  i18nProvider?: I18nProvider;
  initialEntries?: string[];
}

export function renderWithAdminContext(
  ui: ReactElement,
  options: RenderAdminOptions = {}
): RenderAdminResult {
  const {
    dataProvider: dataProviderOverrides,
    authProvider: authProviderOption,
    queryClient: queryClientOption,
    i18nProvider: i18nProviderOption,
    resource,
    record,
    userRole = "user",
    isAuthenticated = true,
    initialEntries = ["/"],
    ...renderOptions
  } = options;

  const queryClient = queryClientOption || createTestQueryClient();
  const dataProvider = createMockDataProvider(dataProviderOverrides);
  const authProvider =
    authProviderOption || createMockAuthProvider({ role: userRole, isAuthenticated });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <CoreAdminContext
            dataProvider={dataProvider}
            authProvider={authProvider}
            i18nProvider={i18nProvider}
          >
            {resource ? (
              <ResourceContextProvider value={resource}>
                {record ? (
                  <RecordContextProvider value={record}>{children}</RecordContextProvider>
                ) : (
                  children
                )}
              </ResourceContextProvider>
            ) : record ? (
              <RecordContextProvider value={record}>{children}</RecordContextProvider>
            ) : (
              children
            )}
          </CoreAdminContext>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    queryClient,
    dataProvider,
    authProvider,
  };
}
```

**When to use:** For every component test - replaces `render()` with single provider setup.

---

### Pattern: Mock Data Provider Factory with Override Support

**Purpose:** Provide a configurable base mock that can be customized per test

**Example from:** `src/tests/utils/mock-providers.ts:27-139`

```typescript
export const createMockDataProvider = (overrides?: Partial<DataProvider>): DataProvider => {
  const defaultProvider: DataProvider = {
    getList: async <RecordType extends Record<string, any> = any>(
      _resource: string,
      _params: GetListParams
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        data: [] as RecordType[],
        total: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    },

    create: async <RecordType extends Record<string, any> = any>(
      resource: string,
      params: CreateParams
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        data: {
          ...params.data,
          id: faker.number.int({ min: 1, max: 10000 }),
        } as RecordType,
      };
    },

    update: async <RecordType extends Record<string, any> = any>(
      resource: string,
      params: UpdateParams
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        data: { ...params.previousData, ...params.data } as RecordType,
      };
    },

    rpc: async (_functionName: string, _params?: Record<string, any>) => {
      return [];
    },
  };

  return {
    ...defaultProvider,
    ...overrides,
  };
};
```

**When to use:** For every component/service test - override only the methods you need to test.

---

## Engineering Constitution Alignment

The test patterns enforce Crispy CRM's principles:

| Principle | Pattern | How Enforced |
|-----------|---------|--------------|
| **Fail Fast** | Error scenario tests | Tests verify errors throw immediately (no retries) |
| **Single Source of Truth** | Data provider tests | All data access tested through `unifiedDataProvider` |
| **Zod at API Boundary** | Validation pattern | Tests validate schemas accept/reject correctly |
| **Form Performance** | Hook tests | Tests verify `onSubmit`/`onBlur` mode, not `onChange` |
| **Accessibility** | A11y pattern | Tests verify aria attributes, focus management |
| **Data Integrity** | RLS monitoring | Console monitor checks for permission errors |

---

## Summary Matrix

| Pattern | Category | Location | Tests |
|---------|----------|----------|-------|
| Schema Safety Parse | Unit/Validation | `validation/__tests__/` | 362 |
| String Boundary | Unit/Validation | `validation/__tests__/` | ~50 |
| Mass Assignment | Unit/Validation | `validation/__tests__/` | ~30 |
| Mock useListContext | Unit/Component | `*/__tests__/*.test.tsx` | 450+ |
| Mock useShowContext | Unit/Component | `*/__tests__/*.test.tsx` | 100+ |
| localStorage | Unit/Component | `*/__tests__/*.test.tsx` | ~40 |
| Async Mock Setup | Unit/Hook | `hooks/__tests__/` | 76 |
| Optimistic Rollback | Unit/Hook | `hooks/__tests__/` | ~20 |
| PostgREST Transform | Unit/Provider | `providers/__tests__/` | 512 |
| Base POM | E2E | `support/poms/` | All E2E |
| CRUD Lifecycle | E2E | `specs/*/crud.spec.ts` | 100+ |
| Console Monitor | E2E | `support/utils/` | All E2E |
| RBAC Testing | E2E | `specs/rbac/` | 50+ |
| Accessibility | E2E | `accessibility/` | 30+ |

---

*Generated from 283 test files containing 3,520 tests across unit, integration, and E2E categories.*
