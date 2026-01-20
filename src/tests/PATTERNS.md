# Test Infrastructure Patterns

Central test utilities for React Admin + Supabase components. Provides mock providers, entity factories, and rendering helpers that ensure consistent, isolated, and domain-accurate testing across Crispy CRM.

## Architecture Overview

```
src/tests/
├── setup.ts                    Global mocks + polyfills (auto-loaded by Vitest)
│   ├── Supabase client mock   ─── Prevents real DB calls
│   ├── Browser API polyfills  ─── jsdom compatibility
│   └── QueryClient factory    ─── Isolated test instances
│
├── utils/
│   ├── render-admin.tsx       ─── renderWithAdminContext()
│   │   └── Provider Stack: QueryClient > Tooltip > Router > AdminContext
│   │
│   ├── mock-providers.ts      ─── createMockDataProvider(), factories
│   │   ├── DataProvider       ─── CRUD with pessimistic delays
│   │   ├── AuthProvider       ─── Role-based permissions
│   │   └── Entity Factories   ─── Domain-accurate test data
│   │
│   ├── combobox.ts            ─── shadcn/ui combobox helpers
│   │   └── selectComboboxOption(), findCommandItem()
│   │
│   ├── typed-mocks.ts         ─── Typed mock factories for RA hooks
│   │   └── mockUseGetListReturn(), mockUseCreateReturn(), etc.
│   │
│   ├── typed-test-helpers.ts  ─── Type-safe test pattern helpers
│   │   └── mapExportRows(), getFilterValue(), createMockSetState()
│   │
│   └── index.ts               ─── Public API barrel export
│
└── fixtures/
    └── auth-users.json        ─── Static user/session data
```

---

## Pattern A: Global Mock Setup

Global mocks prevent real service calls and ensure jsdom compatibility for Radix UI/shadcn components. The `setup.ts` file runs automatically before every test via Vitest configuration.

**When to use**: This is automatic - `setup.ts` runs before every test file via Vitest config.

### Supabase Client Mock

```typescript
// src/tests/setup.ts
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
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
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "test-user-id", email: "test@example.com" } },
      error: null,
    }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: "test-user-id" }, session: {} },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
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

// Mock module globally
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));
```

### Browser API Polyfills

```typescript
// src/tests/setup.ts

// Mock window.matchMedia for responsive tests
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

// Mock IntersectionObserver for virtualized lists
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

// Mock ResizeObserver for components observing element size changes
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

### Radix UI Compatibility

```typescript
// src/tests/setup.ts

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

// Mock PointerEvent for Radix UI Select component
// jsdom doesn't implement PointerEvent, but Radix UI relies on it
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
    this.pointerId = props.pointerId ?? 1;
    this.pressure = props.pressure ?? 0;
    this.width = props.width ?? 1;
    this.height = props.height ?? 1;
  }
}

if (typeof window.PointerEvent === "undefined") {
  window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
}
```

### QueryClient Factory

```typescript
// src/tests/setup.ts

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0, // Immediately garbage collect to avoid cache pollution
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}, // Suppress React Query errors in tests
    },
  });
```

**Key points:**
- Supabase mock must be defined BEFORE `vi.mock()` call
- All query builder methods return `this` for chaining
- PointerEvent mock required for Select/Combobox components
- `gcTime: 0` prevents cache pollution between tests

---

## Pattern B: Admin Context Rendering

Wraps components in React Admin context with all necessary providers for testing components that use React Admin hooks (`useDataProvider`, `useGetIdentity`, `useRecordContext`, etc.)

**When to use**: Testing any component that uses React Admin hooks.

### Full Admin Context

```typescript
// Usage example
import { renderWithAdminContext, createMockOpportunity } from '@/tests/utils';

const { getByLabelText, dataProvider } = renderWithAdminContext(
  <OpportunityCreate />,
  {
    dataProvider: {
      create: vi.fn().mockResolvedValue({ data: { id: 1, name: 'Test' } })
    },
    userRole: 'admin',
    resource: 'opportunities',
    initialEntries: ['/opportunities/create']
  }
);

// Assert on provider calls
expect(dataProvider.create).toHaveBeenCalled();
```

### Provider Composition (from render-admin.tsx)

```typescript
// src/tests/utils/render-admin.tsx

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
```

### Lightweight Record Context

```typescript
// For components using only useRecordContext
import { renderWithRecordContext, createMockContact } from '@/tests/utils';

const contact = createMockContact({ first_name: 'John', last_name: 'Doe' });

const { getByText } = renderWithRecordContext(<ContactShow />, {
  record: contact,
  resource: 'contacts'
});

expect(getByText('John Doe')).toBeInTheDocument();
```

### RenderAdminOptions Interface

```typescript
// src/tests/utils/render-admin.tsx

export interface RenderAdminOptions extends Omit<RenderOptions, "wrapper"> {
  dataProvider?: Partial<DataProvider>;   // Override specific methods only
  authProvider?: AuthProvider;             // Full auth provider replacement
  queryClient?: QueryClient;               // Custom QueryClient instance
  resource?: string;                       // For ResourceContextProvider
  record?: any;                            // For RecordContextProvider
  userRole?: "admin" | "user";             // Mock auth provider role
  isAuthenticated?: boolean;               // Test unauthenticated states
  i18nProvider?: I18nProvider;             // Custom translations
  initialEntries?: string[];               // MemoryRouter initial routes
}
```

**Key points:**
- Provider hierarchy matters: QueryClient must wrap everything
- Use `record` option for components using `useRecordContext`
- Use `resource` option for components using `useResourceContext`
- Return value includes `queryClient`, `dataProvider`, `authProvider` for assertions

---

## Pattern C: Mock Provider Configuration

Configures providers for specific test scenarios with method overrides and role-based permissions.

**When to use**: When tests need specific data, errors, or behavior from providers.

### DataProvider Overrides

```typescript
// Override specific methods - defaults are merged in
import { renderWithAdminContext, createMockContact } from '@/tests/utils';

const contacts = [
  createMockContact({ id: 1, first_name: 'Alice' }),
  createMockContact({ id: 2, first_name: 'Bob' }),
];

const { getByText } = renderWithAdminContext(<ContactList />, {
  dataProvider: {
    getList: vi.fn().mockResolvedValue({
      data: contacts,
      total: 2,
      pageInfo: { hasNextPage: false, hasPreviousPage: false }
    })
  }
});
```

### Auth Role Testing

```typescript
// src/tests/utils/mock-providers.ts

export const createMockAuthProvider = (options?: {
  role?: "admin" | "user";
  isAuthenticated?: boolean;
}): AuthProvider => {
  const { role = "user", isAuthenticated = true } = options || {};

  return {
    login: async () => Promise.resolve(),
    logout: async () => Promise.resolve(),
    checkAuth: async () => {
      if (!isAuthenticated) return Promise.reject();
      return Promise.resolve();
    },
    checkError: async () => Promise.resolve(),
    getPermissions: async () =>
      Promise.resolve(role === "admin" ? ["admin"] : ["user"]),
    getIdentity: async () =>
      Promise.resolve({
        id: faker.number.int({ min: 1, max: 1000 }),
        fullName: faker.person.fullName(),
        avatar: faker.image.avatar(),
        administrator: role === "admin",
      }),
  };
};
```

### Usage Examples

```typescript
// Test admin-only features
renderWithAdminContext(<AdminPanel />, { userRole: 'admin' });

// Test unauthenticated state
renderWithAdminContext(<LoginRequired />, { isAuthenticated: false });

// Test regular user permissions
renderWithAdminContext(<UserDashboard />, { userRole: 'user' });
```

### Pessimistic Mode Simulation

```typescript
// src/tests/utils/mock-providers.ts

// DataProvider methods include 100ms delay for pessimistic mode simulation
create: async (resource, params) => {
  // Simulate pessimistic mode delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    data: {
      ...params.data,
      id: faker.number.int({ min: 1, max: 10000 }),
    },
  };
},
```

**Key points:**
- Overrides merge with defaults - only specify what you need
- Pessimistic delay simulates real API latency (100ms)
- Role sets both permissions and `identity.administrator` flag
- Use `isAuthenticated: false` to test unauthenticated states

---

## Pattern D: Test Data Factories

Generates domain-accurate test data using Faker.js, aligned with actual database schemas and business rules.

**When to use**: Creating test records that match actual database schemas and business rules.

### Entity Factories

```typescript
import {
  createMockOpportunity,
  createMockContact,
  createMockOrganization,
  createMockProduct,
  createMockTask
} from '@/tests/utils';

// Create with defaults
const opportunity = createMockOpportunity();
const contact = createMockContact();
const organization = createMockOrganization();

// Create with specific values
const wonDeal = createMockOpportunity({
  stage: 'closed_won',
  probability: 100,
  status: 'active'
});
```

### Override Pattern

```typescript
// src/tests/utils/mock-providers.ts

export const createMockOpportunity = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  name: faker.company.catchPhrase(),
  stage: faker.helpers.arrayElement([
    "new_lead", "initial_outreach", "sample_visit_offered",
    "feedback_logged", "demo_scheduled", "closed_won", "closed_lost"
  ]),
  status: faker.helpers.arrayElement([
    "active", "on_hold", "nurturing", "stalled", "expired"
  ]),
  priority: faker.helpers.arrayElement(["low", "medium", "high", "critical"]),
  probability: faker.number.int({ min: 0, max: 100 }),
  expected_closing_date: faker.date.future().toISOString().split("T")[0],
  customer_organization_id: faker.number.int({ min: 1, max: 100 }),
  contact_ids: [faker.number.int({ min: 1, max: 100 })],
  products: [],
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  deleted_at: null,
  ...overrides, // Overrides applied last
});
```

### Contact Factory (JSONB Arrays)

```typescript
// src/tests/utils/mock-providers.ts

export const createMockContact = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: [
    {
      value: faker.internet.email(),
      type: faker.helpers.arrayElement(["work", "home", "other"] as const),
    },
  ],
  phone: [
    {
      value: faker.phone.number(),
      type: faker.helpers.arrayElement(["work", "home", "other"] as const),
    },
  ],
  title: faker.person.jobTitle(),
  organization_id: faker.number.int({ min: 1, max: 100 }),
  department: faker.commerce.department(),
  company_name: faker.company.name(),
  avatar: faker.image.avatar(),
  tags: [],
  first_seen: faker.date.past().toISOString(),
  last_seen: faker.date.recent().toISOString(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  deleted_at: null,
  ...overrides,
});
```

### JSONB Array Helpers

```typescript
// Create email/phone arrays matching Zod schemas
import { createEmailArray, createPhoneArray } from '@/tests/utils/mock-providers';

const emails = createEmailArray([
  { value: 'work@example.com', type: 'work' },
  { value: 'personal@example.com', type: 'home' }
]);

const phones = createPhoneArray([
  { value: '+1-555-0100', type: 'work' },
  { value: '+1-555-0101' }  // defaults to 'work'
]);

const contact = createMockContact({ email: emails, phone: phones });
```

**Key points:**
- Factories produce schema-compliant data (stages, priorities match real values)
- Contact email/phone are JSONB arrays with `{ value, type }` structure
- `deleted_at` defaults to null (active records)
- Use overrides for specific test scenarios

---

## Pattern E: Error Simulation

Tests error states, boundaries, form validation display, and permission errors.

**When to use**: Testing error boundaries, form validation display, permission errors.

### Server Errors

```typescript
import { createServerError, createRejectedDataProvider } from '@/tests/utils';

// Create a 500 error
const error = createServerError("Database connection failed");
// { message: "Database connection failed", status: 500 }

// Use with rejected data provider
const { getByText } = renderWithAdminContext(<ContactList />, {
  dataProvider: createRejectedDataProvider('getList', error)
});

await waitFor(() => {
  expect(getByText(/error/i)).toBeInTheDocument();
});
```

### RLS Policy Violations

```typescript
import { createRLSViolationError } from '@/tests/utils';

// Generic RLS error
const rlsError = createRLSViolationError();
// {
//   message: "RLS policy violation",
//   errors: { _error: "You do not have permission to perform this action" }
// }

// Field-specific RLS error
const fieldError = createRLSViolationError('organization_id');
// {
//   message: "RLS policy violation",
//   errors: { organization_id: "You do not have permission to perform this action" }
// }
```

### Validation Errors

```typescript
import { createValidationError } from '@/tests/utils';

const validationError = createValidationError({
  email: 'Invalid email format',
  first_name: 'First name is required'
}, 'Validation failed');

// {
//   message: 'Validation failed',
//   errors: {
//     email: 'Invalid email format',
//     first_name: 'First name is required'
//   }
// }
```

### Rejected Data Provider

```typescript
import { createRejectedDataProvider, createServerError } from '@/tests/utils';

// Make getOne throw a server error
const errorProvider = createRejectedDataProvider(
  'getOne',
  createServerError('Record not found')
);

renderWithAdminContext(<ContactEdit id="123" />, {
  dataProvider: errorProvider
});

// The provider will wait 100ms then throw
await waitFor(() => {
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

### Network Errors

```typescript
import { createNetworkError, createRejectedDataProvider } from '@/tests/utils';

const networkError = createNetworkError();
// Error: "Network request failed: timeout"

renderWithAdminContext(<DataLoader />, {
  dataProvider: createRejectedDataProvider('getList', networkError)
});
```

**Key points:**
- RLS errors include field-specific messages when field provided
- Rejected providers maintain 100ms delay before throwing
- Use for testing error toast display and retry UI
- Validation errors follow `{ message, errors: Record<string, string> }` format

---

## Pattern F: Combobox Testing (shadcn/ui)

Specialized helpers for testing shadcn/ui Combobox components that use cmdk (Command) internally.

**When to use**: Testing any component that uses shadcn/ui Combobox or Command.

### selectComboboxOption

```typescript
import userEvent from '@testing-library/user-event';
import { selectComboboxOption } from '@/tests/utils';

const user = userEvent.setup();

// Open combobox, search, and select
await selectComboboxOption(
  "Select or type city...",   // Trigger button text
  "Chicago",                   // Search text to type
  "Chicago",                   // Option text to click
  { user, timeout: 5000 }
);
```

### selectComboboxByLabel

```typescript
import { selectComboboxByLabel, findComboboxByLabel } from '@/tests/utils';

// Find by associated label
const trigger = findComboboxByLabel("City *");
await user.click(trigger);

// Or use the all-in-one helper
await selectComboboxByLabel(
  "City *",
  "Dallas",
  "Dallas, TX",
  { user }
);
```

### Internal Helper: findCommandItem

```typescript
// src/tests/utils/combobox.ts

// Finds cmdk CommandItem by text content using [data-slot="command-item"] attribute
function findCommandItem(text: string): HTMLElement | null {
  const items = document.querySelectorAll('[data-slot="command-item"]');
  for (const item of items) {
    if (item.textContent?.includes(text)) {
      return item as HTMLElement;
    }
  }
  return null;
}
```

**Key points:**
- cmdk filtering in JSDOM can be slow - use provided timeout (default 5000ms)
- Command items are identified by `[data-slot="command-item"]` attribute
- Always use `userEvent.setup()` for realistic user interaction simulation

---

## Pattern G: Typed Mock Utilities

Provides strongly-typed mock factories for React Admin hooks to eliminate `as any` casts in test files.

**When to use**: Mocking React Admin hooks (`useGetList`, `useGetOne`, `useCreate`, `useDelete`, `useGetIdentity`) with proper TypeScript inference.

### Hook Return Value Factories

```typescript
import {
  mockUseGetListReturn,
  mockUseGetOneReturn,
  mockUseCreateReturn,
  mockUseDeleteReturn,
  mockUseGetIdentityReturn
} from '@/tests/utils';

// Create typed return values for useGetList
vi.mocked(useGetList).mockReturnValue(
  mockUseGetListReturn({
    data: [createMockContact()],
    total: 1,
    isPending: false
  })
);

// Create typed return values for useGetOne
vi.mocked(useGetOne).mockReturnValue(
  mockUseGetOneReturn({
    data: createMockOpportunity({ stage: 'closed_won' }),
    isPending: false
  })
);

// Create typed return values for mutation hooks (useCreate, useDelete)
vi.mocked(useCreate).mockReturnValue(
  mockUseCreateReturn({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: true
  })
);
```

### Mock Implementation Factories

```typescript
import { mockUseGetList, mockUseCreate } from '@/tests/utils';

// Create a full mock implementation
vi.mocked(useGetList).mockImplementation(
  mockUseGetList({ data: contacts, total: contacts.length })
);

// Mock useCreate with custom mutate function
const mutateFn = vi.fn();
vi.mocked(useCreate).mockImplementation(
  mockUseCreate({ mutate: mutateFn, isPending: false })
);
```

### Identity Mock

```typescript
import { mockUseGetIdentityReturn, type MockIdentity } from '@/tests/utils';

const adminUser: MockIdentity = {
  id: 1,
  fullName: 'Admin User',
  avatar: 'https://example.com/avatar.jpg',
  administrator: true
};

vi.mocked(useGetIdentity).mockReturnValue(
  mockUseGetIdentityReturn({ data: adminUser })
);
```

### Key Exports

| Export | Purpose |
|--------|---------|
| `mockUseGetListReturn<T>()` | Create typed return value for `useGetList` |
| `mockUseGetList<T>()` | Create mock implementation for `useGetList` |
| `mockUseGetOneReturn<T>()` | Create typed return value for `useGetOne` |
| `mockUseGetOne<T>()` | Create mock implementation for `useGetOne` |
| `mockUseCreateReturn<T>()` | Create typed return value for `useCreate` |
| `mockUseCreate<T>()` | Create mock implementation for `useCreate` |
| `mockUseDeleteReturn<T>()` | Create typed return value for `useDelete` |
| `mockUseDelete<T>()` | Create mock implementation for `useDelete` |
| `mockUseGetIdentityReturn()` | Create typed return value for `useGetIdentity` |
| `mockUseGetIdentity()` | Create mock implementation for `useGetIdentity` |
| `MockIdentity` | Interface for identity data |
| `GetListParams` | Re-exported type for parameter typing |

**Key points:**
- Generic type parameter `<RecordType>` provides proper inference for `data` field
- All return values include sensible defaults (empty arrays, `isPending: false`, etc.)
- Mutation hooks return tuple format `[mutateFn, state]` matching React Admin API
- Use `vi.mocked()` to access mock functions with proper typing

---

## Pattern H: Typed Test Helpers

Provides type-safe alternatives to common test patterns that would otherwise require `: any` casts.

**When to use**: Eliminating `any` types in test files for better type safety and IDE support.

### Export Row Mapping

```typescript
import { mapExportRows } from '@/tests/utils';

// Type-safe row mapping for CSV/Excel export tests
const contacts = [createMockContact(), createMockContact()];

const exportData = mapExportRows(contacts, (contact) => [
  contact.first_name,
  contact.last_name,
  contact.email[0]?.value ?? null
]);

expect(exportData).toHaveLength(2);
expect(exportData[0][0]).toBe(contacts[0].first_name);
```

### Filter Value Extraction

```typescript
import { getFilterValue } from '@/tests/utils';
import type { GetListParams } from 'ra-core';

// Extract filter values with type safety
const mockGetList = vi.fn().mockImplementation((resource: string, params: GetListParams) => {
  const searchTerm = getFilterValue<string>(params, 'q');
  const status = getFilterValue<'active' | 'inactive'>(params, 'status');

  // Filter logic here...
});
```

### Mock setState for Hook Testing

```typescript
import { createMockSetState, type MockSetState } from '@/tests/utils';

// Create a tracked setState mock
const [initialState, setState, getState] = createMockSetState<string[]>();

// Use in hook tests
setState((prev) => [...(prev ?? []), 'new item']);

expect(getState()).toEqual(['new item']);
```

### Type Definitions for DataProvider Mocks

```typescript
import type { MockGetListImpl, MockDataProviderMethod, HookState } from '@/tests/utils';
import type { Contact } from '@/types';

// Type a mock implementation properly
const mockImpl: MockGetListImpl<Contact> = (resource, params, options) => ({
  data: [createMockContact()],
  total: 1,
  isPending: false,
  error: null
});

// Type hook state in tests
const hookState: HookState<Contact> = {
  data: contacts,
  isPending: false,
  error: null
};
```

### Key Exports

| Export | Purpose |
|--------|---------|
| `mapExportRows<T>()` | Type-safe row mapping for export tests |
| `getFilterValue<T>()` | Extract filter values from `GetListParams` safely |
| `createMockSetState<T>()` | Create tracked setState mock for hook testing |
| `MockSetState<T>` | Type for mock setState callback |
| `MockGetListImpl<T>` | Type for `useGetList` mock implementation |
| `MockDataProviderMethod<T>` | Type for dataProvider method mocks |
| `HookState<T>` | Generic interface for hook state testing |

**Key points:**
- All helpers use generics for proper type inference
- `createMockSetState` returns `[initialState, setState, getState]` for state tracking
- Use these types instead of inline `: any` annotations
- Improves IDE autocomplete and catches type errors at compile time

---

## Pattern Comparison Table

| Aspect | A: Global Mocks | B: Admin Context | C: Provider Config | D: Data Factories | E: Error Sim | F: Combobox | G: Typed Mocks | H: Typed Helpers |
|--------|-----------------|------------------|-------------------|-------------------|--------------|-------------|----------------|------------------|
| **Purpose** | Prevent real calls | Render RA components | Custom behavior | Generate records | Test failures | Test shadcn/ui | Mock RA hooks | Eliminate `any` |
| **Scope** | All tests | Per-component | Per-test | Per-record | Per-scenario | Per-combobox | Per-hook mock | Per-test file |
| **Key export** | `createTestQueryClient` | `renderWithAdminContext` | `createMockDataProvider` | `createMockOpportunity` | `createServerError` | `selectComboboxOption` | `mockUseGetListReturn` | `mapExportRows` |
| **Automatic?** | Yes (Vitest) | No (explicit) | No (explicit) | No (explicit) | No (explicit) | No (explicit) | No (explicit) | No (explicit) |

---

## Anti-Patterns to Avoid

### 1. Importing Supabase Directly in Tests

```typescript
// BAD: Creates real client, may hit network
import { supabase } from '@/lib/supabase';

// GOOD: Use mock from setup.ts or override dataProvider
const { dataProvider } = renderWithAdminContext(<MyComponent />, {
  dataProvider: { getList: vi.fn().mockResolvedValue({ data: [], total: 0 }) }
});
```

### 2. Not Waiting for Async Updates

```typescript
// BAD: Assertion may run before re-render
fireEvent.click(saveButton);
expect(screen.getByText('Saved')).toBeInTheDocument();

// GOOD: Wait for state updates
await userEvent.click(saveButton);
await waitFor(() => {
  expect(screen.getByText('Saved')).toBeInTheDocument();
});
```

### 3. Sharing QueryClient Between Tests

```typescript
// BAD: Cache pollution between tests
const queryClient = new QueryClient();
// ... used in multiple tests

// GOOD: Fresh client per test
const { queryClient } = renderWithAdminContext(<MyComponent />);
// or
const queryClient = createTestQueryClient();
```

### 4. Hardcoding Domain Values

```typescript
// BAD: Values may not match real schema
const opp = { stage: 'prospect', priority: '1' };

// GOOD: Use factory with correct values
const opp = createMockOpportunity({ stage: 'new_lead', priority: 'high' });
```

### 5. Using fireEvent for User Interactions

```typescript
// BAD: fireEvent doesn't simulate real user behavior
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'test' } });

// GOOD: userEvent simulates real user behavior
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'test');
```

---

## Test Writing Checklist

When adding new tests:

1. [ ] Use `renderWithAdminContext` for React Admin components
2. [ ] Create test data with factories (`createMockOpportunity`, etc.)
3. [ ] Override only the provider methods you need to test
4. [ ] Wait for async operations with `waitFor` or `findBy*`
5. [ ] Test both success and error paths
6. [ ] Use `userEvent` over `fireEvent` for user interactions
7. [ ] Verify: `npm run test:unit` passes

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Global Mock Setup** | `setup.ts` |
| **B: Admin Context Rendering** | `utils/render-admin.tsx` |
| **C: Mock Provider Configuration** | `utils/mock-providers.ts` |
| **D: Test Data Factories** | `utils/mock-providers.ts` |
| **E: Error Simulation** | `utils/mock-providers.ts` |
| **F: Combobox Testing** | `utils/combobox.ts` |
| **G: Typed Mock Utilities** | `utils/typed-mocks.ts` |
| **H: Typed Test Helpers** | `utils/typed-test-helpers.ts` |
| **Static Fixtures** | `fixtures/auth-users.json` |
