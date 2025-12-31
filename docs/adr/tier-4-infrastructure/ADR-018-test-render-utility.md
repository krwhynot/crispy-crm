# ADR-018: Test Render Utility

## Status

**Accepted**

## Date

Original: 2024-11 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Testing React Admin components presents several challenges:

1. **Provider Stack Complexity**: React Admin components require multiple nested providers (AdminContext, QueryClient, Router, etc.). Each test would need to manually set up this provider hierarchy.

2. **Supabase Client Mocking**: The application uses Supabase throughout. Without consistent mocking, tests would make real network calls or fail with "supabase.from is not a function" errors.

3. **Browser API Gaps**: jsdom (used by Vitest) lacks implementations for `IntersectionObserver`, `ResizeObserver`, `PointerEvent`, and `matchMedia` - all required by our component libraries (Radix UI, react-virtual).

4. **Cache Pollution**: React Query's default caching behavior causes test pollution when queries from one test affect another.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Manual provider setup per test** | Full control | Massive duplication, 20+ lines per test |
| **Shared `beforeEach` in describe blocks** | Less duplication | Still scattered, inconsistent across files |
| **Single `renderWithAdminContext` utility** | DRY, consistent mocks | Learning curve, utility must evolve with app |
| **Testing Library's `wrapper` option only** | Simple | Doesn't solve mocking or browser APIs |

---

## Decision

**Create `renderWithAdminContext()` utility** that wraps components with all necessary providers and exposes test helpers.

### Provider Stack Architecture

```
QueryClientProvider (test config: retry: false, gcTime: 0)
  → TooltipProvider
    → MemoryRouter
      → CoreAdminContext (React Admin)
        → ResourceContextProvider (optional)
          → RecordContextProvider (optional)
```

### Implementation Files

1. **`src/tests/utils/render-admin.tsx`** - Main render utility
2. **`src/tests/setup.ts`** - Global mocks and test QueryClient factory
3. **`src/tests/utils/mock-providers.ts`** - Mock DataProvider and AuthProvider factories

### Test QueryClient Configuration

```typescript
// src/tests/setup.ts:97-117

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0, // Immediately garbage collect - avoid cache pollution
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}, // Silence React Query errors in tests
    },
  });
```

This configuration aligns with [ADR-014: Fail-Fast Philosophy](./ADR-014-fail-fast-philosophy.md):
- `retry: false` - Fail immediately, no retry logic
- `gcTime: 0` - Aggressive cache cleanup prevents test pollution
- Silent logger - Prevents noise in test output

---

## Consequences

### Positive

- **DRY Test Setup**: No repetitive provider wrapping in each test file
- **Consistent Mocking**: All tests use same Supabase and browser API mocks
- **Test Isolation**: Each test gets fresh QueryClient, no cache pollution
- **Type Safety**: Utility is fully typed with `RenderAdminOptions` interface

### Negative

- **Learning Curve**: Developers must understand utility options
- **Maintenance**: Utility must be updated when provider stack changes
- **Abstraction Cost**: Debugging test failures requires understanding the wrapper

### Neutral

- **Trade-off Accepted**: Utility complexity is worthwhile for test maintainability

---

## Code Examples

### Render Utility Implementation

```typescript
// src/tests/utils/render-admin.tsx:98-165

export function renderWithAdminContext(
  ui: ReactElement,
  options: RenderAdminOptions = {}
): RenderAdminResult {
  const {
    dataProvider: dataProviderOverrides,
    authProvider: authProviderOption,
    queryClient: queryClientOption,
    resource,
    record,
    userRole = "user",
    isAuthenticated = true,
    initialEntries = ["/"],
    ...renderOptions
  } = options;

  const queryClient = queryClientOption || createTestQueryClient();
  const dataProvider = createMockDataProvider(dataProviderOverrides);
  const authProvider = authProviderOption || createMockAuthProvider({ role: userRole, isAuthenticated });

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
                ) : children}
              </ResourceContextProvider>
            ) : record ? (
              <RecordContextProvider value={record}>{children}</RecordContextProvider>
            ) : children}
          </CoreAdminContext>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient, dataProvider, authProvider };
}
```

### Supabase Mock

```typescript
// src/tests/setup.ts:15-93

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { access_token: "test-token" } },
    }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));
```

### Browser API Mocks

```typescript
// src/tests/setup.ts:137-221

// IntersectionObserver for virtualized lists
class IntersectionObserverMock {
  observe = () => null;
  disconnect = () => null;
  unobserve = () => null;
}
Object.defineProperty(window, "IntersectionObserver", { value: IntersectionObserverMock });

// PointerEvent for Radix UI Select
class MockPointerEvent extends Event {
  button: number;
  pointerType: string;
  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.button = props.button ?? 0;
    this.pointerType = props.pointerType ?? "mouse";
  }
}
window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
```

### Correct Pattern - Using the Utility

```typescript
// In OpportunityCreate.test.tsx

import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OpportunityCreate } from "./OpportunityCreate";

describe("OpportunityCreate", () => {
  it("renders form with default values", () => {
    const { getByLabelText } = renderWithAdminContext(<OpportunityCreate />, {
      resource: "opportunities",
      userRole: "admin",
    });

    expect(getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("calls dataProvider.create on submit", async () => {
    const mockCreate = vi.fn().mockResolvedValue({ data: { id: 1 } });

    const { getByRole } = renderWithAdminContext(<OpportunityCreate />, {
      resource: "opportunities",
      dataProvider: { create: mockCreate },
    });

    // ... fill form and submit
    expect(mockCreate).toHaveBeenCalledWith("opportunities", expect.any(Object));
  });
});
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Manual provider setup in each test file
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CoreAdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";

describe("OpportunityCreate", () => {
  it("renders form", () => {
    // NEVER: 20+ lines of boilerplate per test file
    const queryClient = new QueryClient();
    const dataProvider = { getList: vi.fn(), create: vi.fn(), ... };

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CoreAdminContext dataProvider={dataProvider}>
            <OpportunityCreate />
          </CoreAdminContext>
        </MemoryRouter>
      </QueryClientProvider>
    );
  });
});
```

```typescript
// WRONG: Using real QueryClient without retry: false
const queryClient = new QueryClient(); // NEVER: Default retry causes flaky tests
```

```typescript
// WRONG: Missing Supabase mock
// Test file without vi.mock("@supabase/supabase-js")
// NEVER: Tests will make real network calls or fail with "from is not a function"
```

```typescript
// WRONG: Missing browser API mocks
// NEVER: Tests using Radix UI Select will fail with "PointerEvent is not defined"
// NEVER: Tests using virtualized lists will fail with "IntersectionObserver is not defined"
```

---

## Related ADRs

- **[ADR-001: Unified Data Provider Entry Point](./ADR-001-unified-data-provider.md)** - The provider being mocked in tests
- **[ADR-014: Fail-Fast Philosophy](./ADR-014-fail-fast-philosophy.md)** - Test config mirrors fail-fast (no retries)

---

## References

- Render utility: `src/tests/utils/render-admin.tsx`
- Global setup: `src/tests/setup.ts`
- Mock providers: `src/tests/utils/mock-providers.ts`
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Vitest: https://vitest.dev/
