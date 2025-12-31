---
name: generate-patterns-src-tests
directory: src/tests/
complexity: HIGH
output: src/tests/PATTERNS.md
---

# Generate PATTERNS.md for Test Infrastructure

## Context

The `src/tests/` directory contains the complete test infrastructure for Crispy CRM. This includes global test setup, React Admin component testing utilities, mock providers for data and auth, test data factories using Faker.js, and specialized component test helpers for shadcn/ui.

This directory is critical because:
- All unit tests depend on the global setup for mocks and polyfills
- React Admin components require specific context providers to render correctly
- Consistent mock patterns prevent flaky tests and test pollution
- Test data factories ensure domain model accuracy across all tests

## Phase 1: Exploration

Read these files in order to understand the test infrastructure:

1. `/home/krwhynot/projects/crispy-crm/src/tests/setup.ts` - **Global test configuration**
   - Supabase client mock with full query builder chain
   - Browser API polyfills (matchMedia, IntersectionObserver, ResizeObserver)
   - Pointer event mocks for Radix UI components
   - QueryClient factory for isolated test instances

2. `/home/krwhynot/projects/crispy-crm/src/tests/utils/render-admin.tsx` - **React Admin test wrapper**
   - `renderWithAdminContext()` - Full admin context with data/auth providers
   - `renderWithRecordContext()` - Lightweight wrapper for record-based components
   - Provider composition pattern (QueryClient > TooltipProvider > MemoryRouter > CoreAdminContext)
   - Extended render result with queryClient, dataProvider, authProvider access

3. `/home/krwhynot/projects/crispy-crm/src/tests/utils/mock-providers.ts` - **Mock providers and factories**
   - `createMockDataProvider()` - All CRUD methods with pessimistic mode delays
   - `createMockAuthProvider()` - Role-based auth with admin/user permissions
   - Entity factories: `createMockOpportunity`, `createMockContact`, `createMockOrganization`, `createMockProduct`, `createMockTask`
   - Error simulation: `createServerError`, `createRLSViolationError`, `createValidationError`, `createRejectedDataProvider`

4. `/home/krwhynot/projects/crispy-crm/src/tests/utils/combobox.ts` - **shadcn/ui Combobox helpers**
   - `selectComboboxOption()` - Open, search, and select pattern
   - `findCommandItem()` - cmdk item discovery via data-slot attribute
   - Timeout handling for slow JSDOM filtering
   - Label-based selection helpers

5. `/home/krwhynot/projects/crispy-crm/src/tests/utils/index.ts` - **Barrel export**
   - Shows public API surface for test utilities
   - Groups: render utilities, mock providers/factories, setup utilities, combobox helpers

6. `/home/krwhynot/projects/crispy-crm/src/tests/fixtures/auth-users.json` - **Static test data**
   - Pre-defined user personas (valid, admin, expired, unverified, blocked)
   - Session fixtures with mock JWT tokens
   - Permission sets for role-based testing
   - Error response fixtures

## Phase 2: Pattern Identification

Identify these 5 patterns with the following focus areas:

### Pattern A: Global Mock Setup
- How Supabase is globally mocked before module imports
- Browser API polyfills required for jsdom
- Radix UI/shadcn compatibility (PointerEvent, pointer capture)
- QueryClient factory with test-optimized settings

### Pattern B: Admin Context Rendering
- `renderWithAdminContext()` options and usage
- Provider composition hierarchy
- When to use full admin vs record context
- Accessing providers from render result for assertions

### Pattern C: Mock Provider Configuration
- DataProvider method overrides pattern
- Pessimistic mode simulation with delays
- AuthProvider role switching
- Partial override merging

### Pattern D: Test Data Factories
- Entity factory functions with Faker.js
- Override pattern for customization
- JSONB array factories (email, phone)
- Domain model alignment (stages, priorities, statuses)

### Pattern E: Error Simulation
- Server error creation
- RLS violation mocking
- Validation error formatting
- Rejected data provider pattern for error state testing

## Phase 3: Generate PATTERNS.md

Generate a PATTERNS.md file with this structure:

```markdown
# Test Infrastructure Patterns

{Brief description: Central test utilities for React Admin + Supabase components}

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
│   └── index.ts               ─── Public API barrel export
│
└── fixtures/
    └── auth-users.json        ─── Static user/session data
```

---

## Pattern A: Global Mock Setup

{Description of how global mocks prevent real service calls}

**When to use**: This is automatic - `setup.ts` runs before every test file via Vitest config.

### Supabase Client Mock

```typescript
// src/tests/setup.ts
{Show the mockSupabaseClient structure with query builder chain}
```

### Browser API Polyfills

```typescript
// src/tests/setup.ts
{Show matchMedia, IntersectionObserver, ResizeObserver mocks}
```

### Radix UI Compatibility

```typescript
// src/tests/setup.ts
{Show PointerEvent mock and pointer capture polyfills}
```

**Key points:**
- Supabase mock must be defined BEFORE vi.mock() call
- All query builder methods return `this` for chaining
- PointerEvent mock required for Select/Combobox components
- gcTime: 0 prevents cache pollution between tests

---

## Pattern B: Admin Context Rendering

{Description of wrapping components in React Admin context}

**When to use**: Testing any component that uses React Admin hooks (useDataProvider, useGetIdentity, useRecordContext, etc.)

### Full Admin Context

```typescript
// Usage example from tests
{Show renderWithAdminContext usage with options}
```

### Lightweight Record Context

```typescript
// For components using only useRecordContext
{Show renderWithRecordContext usage}
```

### Accessing Providers

```typescript
// Asserting on provider calls
{Show destructuring queryClient, dataProvider from result}
```

**Key points:**
- Provider hierarchy matters: QueryClient must wrap everything
- Use `record` option for components using useRecordContext
- Use `resource` option for components using useResourceContext
- Return value includes providers for assertion access

---

## Pattern C: Mock Provider Configuration

{Description of configuring providers for specific test scenarios}

**When to use**: When tests need specific data, errors, or behavior from providers.

### DataProvider Overrides

```typescript
// Overriding specific methods
{Show partial override pattern}
```

### Auth Role Testing

```typescript
// Testing admin vs user permissions
{Show createMockAuthProvider with role option}
```

### Pessimistic Mode Simulation

```typescript
// Default 100ms delay in create/update
{Show the delay pattern from mock-providers.ts}
```

**Key points:**
- Overrides merge with defaults - only specify what you need
- Pessimistic delay simulates real API latency
- Role sets both permissions and identity.administrator flag
- Use isAuthenticated: false to test unauthenticated states

---

## Pattern D: Test Data Factories

{Description of generating domain-accurate test data}

**When to use**: Creating test records that match actual database schemas and business rules.

### Entity Factories

```typescript
// Creating test records
{Show createMockOpportunity, createMockContact usage}
```

### Override Pattern

```typescript
// Customizing factory output
{Show override spread pattern}
```

### JSONB Array Factories

```typescript
// Email and phone arrays matching Zod schemas
{Show createEmailArray, createPhoneArray}
```

**Key points:**
- Factories produce schema-compliant data (stages, priorities match real values)
- Contact email/phone are JSONB arrays with { value, type } structure
- deleted_at defaults to null (active records)
- Use overrides for specific test scenarios

---

## Pattern E: Error Simulation

{Description of testing error states and handling}

**When to use**: Testing error boundaries, form validation display, permission errors.

### Server Errors

```typescript
// 500 errors
{Show createServerError usage}
```

### RLS Policy Violations

```typescript
// Permission errors from Supabase RLS
{Show createRLSViolationError usage}
```

### Rejected Data Provider

```typescript
// Making specific methods throw
{Show createRejectedDataProvider pattern}
```

**Key points:**
- RLS errors include field-specific messages when field provided
- Rejected providers maintain 100ms delay before throwing
- Use for testing error toast display and retry UI
- Validation errors follow { message, errors: Record<string, string> } format

---

## Pattern Comparison Table

| Aspect | A: Global Mocks | B: Admin Context | C: Provider Config | D: Data Factories | E: Error Sim |
|--------|-----------------|------------------|-------------------|-------------------|--------------|
| **Purpose** | Prevent real calls | Render RA components | Custom behavior | Generate records | Test failures |
| **Scope** | All tests | Per-component | Per-test | Per-record | Per-scenario |
| **Key export** | createTestQueryClient | renderWithAdminContext | createMockDataProvider | createMockOpportunity | createServerError |
| **Automatic?** | Yes (Vitest) | No (explicit) | No (explicit) | No (explicit) | No (explicit) |

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
| **Combobox Testing** | `utils/combobox.ts` |
| **Static Fixtures** | `fixtures/auth-users.json` |
```

## Phase 4: Write the File

Write the generated PATTERNS.md to: `/home/krwhynot/projects/crispy-crm/src/tests/PATTERNS.md`

Ensure all code examples are extracted from the actual files read in Phase 1 - no pseudo-code or invented examples.
