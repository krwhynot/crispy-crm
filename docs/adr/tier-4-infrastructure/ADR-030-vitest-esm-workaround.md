# ADR-030: Vitest Configuration with React Admin ESM Workaround

## Status

**Accepted**

## Date

Original: 2024-11 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Crispy CRM requires a robust testing framework that can handle React Admin's ESM-based package structure, Vite's build system, and the various browser APIs used by component libraries (Radix UI, react-virtual).

### Core Challenges

1. **React Admin ESM Directory Imports**: React Admin packages (`ra-core`, `ra-ui-materialui`, etc.) use ESM with directory imports. Node.js ESM resolution does not support directory imports without explicit `index.js` files, causing errors like:
   ```
   Cannot find module 'ra-core/dist/esm/core'
   ```

2. **jsdom Browser API Gaps**: The jsdom environment lacks implementations for `IntersectionObserver`, `ResizeObserver`, `PointerEvent`, and `matchMedia` - all required by our component stack.

3. **Supabase Network Isolation**: Unit tests must not make real network calls. Without mocking, tests fail with "supabase.from is not a function" or make actual API requests.

4. **Coverage Quality**: Pre-launch MVP requires consistent code quality with measurable test coverage thresholds.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Jest** | Mature ecosystem, widespread adoption | Requires complex babel-jest config for ESM, no native Vite integration |
| **Vitest with default config** | Fast, Vite-native | React Admin ESM fails without `server.deps.inline` |
| **Testing without mocks** | Tests real behavior | Flaky tests, network dependency, slow execution |
| **Istanbul coverage provider** | Battle-tested | Slower than V8, requires instrumentation |
| **Lower coverage thresholds (50%)** | Easier to pass | Insufficient quality assurance for MVP |

---

## Decision

**Use Vitest with explicit ESM inlining for React Admin packages, V8 coverage provider, and comprehensive browser API mocks.**

### Vitest Configuration

```typescript
// vitest.config.ts:4-67

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom", "./src/tests/setup.ts"],
    timeout: 10000,
    // ...
  },
});
```

### React Admin ESM Workaround (lines 47-59)

The critical fix for React Admin ESM compatibility:

```typescript
// vitest.config.ts:47-59

// Force Vitest to transform React Admin packages (needed for ESM compatibility)
// All ra-* packages need to be inlined to avoid ESM directory import errors
server: {
  deps: {
    inline: [
      "react-admin",
      "ra-core",
      "ra-ui-materialui",
      "ra-data-fakerest",
      "ra-i18n-polyglot",
      "ra-language-english",
    ],
  },
},
```

**Why this works:** `server.deps.inline` tells Vitest to transform these packages rather than treating them as external. This resolves ESM directory imports by bundling the packages during test execution.

### Coverage Configuration (lines 19-37)

```typescript
// vitest.config.ts:19-37

coverage: {
  provider: "v8",
  reporter: ["text", "json", "html", "lcov"],
  include: ["src/**/*.{ts,tsx}"],
  exclude: [
    "src/**/*.test.{ts,tsx}",
    "src/**/*.spec.{ts,tsx}",
    "src/tests/**",
    "src/**/__tests__/**",
    "src/**/*.d.ts",
    "src/vite-env.d.ts",
  ],
  all: true,
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
},
```

**Coverage Decisions:**
- **V8 Provider**: Fastest coverage collection, built into Node.js, no instrumentation overhead
- **70% Thresholds**: Balanced quality gate - high enough to ensure coverage, low enough for MVP velocity
- **`all: true`**: Reports uncovered files to identify blind spots

### Test Environment Variables (lines 10-18)

```typescript
// vitest.config.ts:10-18

env: {
  VITE_SUPABASE_URL: "https://test.supabase.co",
  VITE_SUPABASE_ANON_KEY: "test-anon-key",
  OPPORTUNITY_DEFAULT_STAGE: "new_lead",
  OPPORTUNITY_PIPELINE_STAGES:
    "new_lead,initial_outreach,sample_visit_offered,feedback_logged,demo_scheduled,closed_won,closed_lost",
},
```

Unit tests use hardcoded test values, not `.env` files. This ensures test isolation and deterministic behavior.

### Browser API Mocks (setup.ts)

#### IntersectionObserver (lines 135-157)

Required for virtualized lists (react-virtual) and lazy-loading components:

```typescript
// src/tests/setup.ts:137-157

class IntersectionObserverMock {
  observe = () => null;
  disconnect = () => null;
  unobserve = () => null;
  takeRecords = () => [];
  root = null;
  rootMargin = "";
  thresholds = [];
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});
```

#### ResizeObserver (lines 159-170)

Required for responsive components that observe element size changes:

```typescript
// src/tests/setup.ts:159-170

class ResizeObserverMock {
  observe = () => null;
  disconnect = () => null;
  unobserve = () => null;
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});
```

#### PointerEvent (lines 178-221)

Required for Radix UI Select component. Without this, dropdown tests fail with "target.hasPointerCapture is not a function":

```typescript
// src/tests/setup.ts:178-221

// Mock Pointer Capture API for Radix UI Select component
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn();
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}

// Mock PointerEvent for Radix UI Select
class MockPointerEvent extends Event {
  button: number;
  ctrlKey: boolean;
  pointerType: string;
  pointerId: number;
  pressure: number;
  width: number;
  height: number;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.button = props.button ?? 0;
    this.ctrlKey = props.ctrlKey ?? false;
    this.pointerType = props.pointerType ?? "mouse";
    // ...
  }
}

if (typeof window.PointerEvent === "undefined") {
  window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
}
```

#### matchMedia (lines 119-133)

Required for responsive breakpoint queries:

```typescript
// src/tests/setup.ts:119-133

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});
```

### Supabase Mock (lines 15-93)

Comprehensive mock preventing network calls and providing chainable query builders:

```typescript
// src/tests/setup.ts:15-93

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    // ... all chainable methods
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((resolve) =>
      resolve({ data: [], error: null, count: 0, status: 200, statusText: "OK" })
    ),
  })),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: "test-token",
          user: { id: "test-user-id", email: "test@example.com" },
        },
      },
      error: null,
    }),
    // ... auth methods
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: "https://example.com/test.jpg" },
      })),
    })),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));
```

---

## Consequences

### Positive

- **React Admin Tests Work**: ESM inlining resolves all directory import errors without babel configuration
- **Fast Execution**: Vite-based runner with V8 coverage is significantly faster than Jest + Istanbul
- **Browser API Coverage**: All component libraries (Radix UI, react-virtual) work in tests
- **Network Isolation**: Supabase mock ensures no real API calls, deterministic tests
- **Quality Gates**: 70% coverage thresholds enforce consistent test coverage
- **Shared Config Patterns**: Vitest shares Vite's resolve aliases and configuration

### Negative

- **Manual Mock Maintenance**: Browser API mocks must be updated if jsdom adds support or libraries change
- **ESM Inline List**: New React Admin packages require adding to `server.deps.inline`
- **Coverage Threshold Friction**: 70% can block PRs during rapid prototyping

### Neutral

- **Standard Vitest Pattern**: Configuration follows Vitest best practices for React projects
- **Setup File Complexity**: `setup.ts` is comprehensive but well-documented

---

## Code Examples

### Correct Pattern - Running Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest src/atomic-crm/contacts/__tests__/ContactList.test.tsx
```

### Correct Pattern - Test with React Admin Components

```typescript
// Uses renderWithAdminContext which leverages the global mocks
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OpportunityList } from "./OpportunityList";

describe("OpportunityList", () => {
  it("renders without ESM errors", () => {
    // This works because ra-core is inlined
    const { getByRole } = renderWithAdminContext(<OpportunityList />, {
      resource: "opportunities",
    });

    expect(getByRole("grid")).toBeInTheDocument();
  });
});
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Importing React Admin without ESM workaround in jest.config.js
// This will fail with: Cannot find module 'ra-core/dist/esm/core'
module.exports = {
  testEnvironment: "jsdom",
  // Missing transformIgnorePatterns for ra-* packages
};
```

```typescript
// WRONG: Real Supabase client in tests
import { createClient } from "@supabase/supabase-js";

describe("DataTest", () => {
  it("fetches data", async () => {
    // NEVER: Makes real network call, flaky, slow
    const supabase = createClient(url, key);
    const { data } = await supabase.from("contacts").select();
  });
});
```

```typescript
// WRONG: Missing IntersectionObserver mock
// Test will fail with: IntersectionObserver is not defined
import { VirtualList } from "./VirtualList";

it("renders virtual list", () => {
  render(<VirtualList items={items} />); // Crashes
});
```

```typescript
// WRONG: Using onChange mode in QueryClient (violates fail-fast)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // NEVER: Fail-fast = retry: false
      staleTime: Infinity, // NEVER: Causes cache pollution
    },
  },
});
```

---

## Related ADRs

- **[ADR-018: Test Render Utility](./ADR-018-test-render-utility.md)** - Test utilities that depend on this configuration
- **[ADR-021: Multi-Environment Configuration](./ADR-021-multi-environment-config.md)** - Environment variables for test configuration
- **[ADR-014: Fail-Fast Philosophy](../tier-1-foundations/ADR-014-fail-fast-philosophy.md)** - Test QueryClient mirrors fail-fast (retry: false)

---

## References

- Vitest configuration: `vitest.config.ts`
- Global test setup: `src/tests/setup.ts`
- Test utilities: `src/tests/utils/render-admin.tsx`
- Vitest Documentation: https://vitest.dev/
- React Admin Testing: https://marmelab.com/react-admin/Testing.html
- Radix UI Select Testing Issue: https://github.com/shadcn-ui/ui/discussions/4168
