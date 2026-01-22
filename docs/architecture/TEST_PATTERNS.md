# Test Patterns Architecture

This document provides an architectural overview of testing patterns in Crispy CRM. For detailed templates and copy-paste code, see the linked documentation.

> **Engineering Constitution Alignment:** Tests enforce fail-fast principles, Zod at API boundary validation, and single data provider source of truth.

---

## Quick Reference

| Need | Go To |
|------|-------|
| Copy-paste test templates | [Test Authoring Guide](../tests/e2e/test-authoring-guide.md) |
| Detailed utility patterns (A-H) | [src/tests/PATTERNS.md](../../src/tests/PATTERNS.md) |
| Test pyramid & metrics | [Test Architecture](../tests/e2e/test-architecture.md) |
| E2E checklists | [docs/tests/e2e/](../tests/e2e/) |

---

## Core Principles

### 1. No Direct Supabase in Tests

**Constitution Rule:** Single source of truth via `unifiedDataProvider`

```typescript
// ❌ WRONG: Direct Supabase import
import { supabase } from '@/lib/supabase';

// ✅ CORRECT: Use mock data provider
import { renderWithAdminContext } from '@/tests/utils';

const { dataProvider } = renderWithAdminContext(<MyComponent />, {
  dataProvider: { getList: vi.fn().mockResolvedValue({ data: [], total: 0 }) }
});
```

**Rationale:** Tests should validate behavior through the same abstraction as production code. Direct Supabase access:
- Bypasses validation layer
- Creates network dependencies
- Makes tests non-deterministic

---

### 2. Integration Tests Are Acceptable

**When Integration Tests Are Appropriate:**

| Scenario | Test Type | Rationale |
|----------|-----------|-----------|
| Component + Data Provider interaction | Integration | Validates full React Admin lifecycle |
| Form submission workflow | Integration | Tests validation, loading states, error display |
| Slide-over CRUD operations | Integration | Tests modal/drawer open/close + data flow |
| Pure utility functions | Unit | No external dependencies |
| Zod schema validation | Unit | Input/output transformation only |
| Hook state management | Unit | Isolated state logic |

**Current Integration Test Files:**
- `ActivityCreate.integration.test.tsx`
- `ContactCreate.integration.test.tsx`
- `OpportunityCreateWizard.integration.test.tsx`
- `QuickAdd.integration.test.tsx`
- `OrganizationCreate.integration.test.tsx`
- `TaskCreate.integration.test.tsx`
- `services.integration.test.ts`

---

### 3. Mock at the Boundary

**Constitution Rule:** Fail-fast with clear error boundaries

```typescript
// ✅ CORRECT: Mock the data provider (boundary)
renderWithAdminContext(<ContactList />, {
  dataProvider: {
    getList: vi.fn().mockResolvedValue({
      data: [createMockContact()],
      total: 1
    })
  }
});

// ❌ WRONG: Mock internal implementation
vi.mock('../utils/formatContact', () => ({
  formatContact: vi.fn()
}));
```

**Rationale:** Mocking at the boundary:
- Tests real integration of internal code
- Catches regressions in internal logic
- Matches production failure modes

---

## Test Utility Stack

### renderWithAdminContext

The primary rendering utility for React Admin components.

```typescript
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
```

**Provider Stack (innermost to outermost):**
1. `RecordContextProvider` - For `useRecordContext` access
2. `ResourceContextProvider` - For `useResourceContext` access
3. `CoreAdminContext` - DataProvider, AuthProvider, I18nProvider
4. `MemoryRouter` - Route simulation
5. `TooltipProvider` - shadcn/ui tooltips
6. `QueryClientProvider` - React Query cache

### Entity Factories

Generate domain-accurate test data:

```typescript
import {
  createMockOpportunity,
  createMockContact,
  createMockOrganization,
  createMockProduct,
  createMockTask
} from '@/tests/utils';

// Valid stage values (schema-accurate)
const opportunity = createMockOpportunity({
  stage: 'closed_won',
  probability: 100
});

// JSONB array format (email/phone)
const contact = createMockContact({
  email: [{ value: 'test@example.com', type: 'work' }]
});
```

---

## Pattern Quick Reference

| Pattern | Location | Purpose |
|---------|----------|---------|
| **A: Global Mocks** | `src/tests/setup.ts` | Supabase client, browser APIs, Radix polyfills |
| **B: Admin Context** | `src/tests/utils/render-admin.tsx` | React Admin provider wrapping |
| **C: Provider Config** | `src/tests/utils/mock-providers.ts` | DataProvider/AuthProvider overrides |
| **D: Data Factories** | `src/tests/utils/mock-providers.ts` | Schema-accurate test records |
| **E: Error Simulation** | `src/tests/utils/mock-providers.ts` | Server, RLS, validation errors |
| **F: Combobox Testing** | `src/tests/utils/combobox.ts` | shadcn/ui Combobox helpers |
| **G: Typed Mocks** | `src/tests/utils/typed-mocks.ts` | React Admin hook mocks |
| **H: Typed Helpers** | `src/tests/utils/typed-test-helpers.ts` | Type-safe test utilities |

For detailed code examples of each pattern, see [src/tests/PATTERNS.md](../../src/tests/PATTERNS.md).

---

## Anti-Patterns

### 1. Direct Supabase Access

```typescript
// ❌ Creates real client, may hit network
import { supabase } from '@/lib/supabase';
await supabase.from('contacts').select('*');
```

### 2. Missing Async Waits

```typescript
// ❌ Assertion may run before re-render
fireEvent.click(saveButton);
expect(screen.getByText('Saved')).toBeInTheDocument();

// ✅ Wait for state updates
await userEvent.click(saveButton);
await waitFor(() => {
  expect(screen.getByText('Saved')).toBeInTheDocument();
});
```

### 3. Hardcoded Domain Values

```typescript
// ❌ Values may not match real schema
const opp = { stage: 'prospect', priority: '1' };

// ✅ Use factory with correct values
const opp = createMockOpportunity({ stage: 'new_lead', priority: 'high' });
```

### 4. fireEvent vs userEvent

```typescript
// ❌ fireEvent doesn't simulate real user behavior
fireEvent.change(input, { target: { value: 'test' } });

// ✅ userEvent simulates real user behavior
const user = userEvent.setup();
await user.type(input, 'test');
```

---

## Test Commands

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific feature
npm test -- src/atomic-crm/opportunities

# Watch mode
npm test -- --watch

# Run E2E tests
npx playwright test

# E2E with UI
npx playwright test --ui
```

---

## Related Documentation

- [Engineering Constitution](../../CLAUDE.md) - Core principles (fail-fast, Zod at boundary)
- [Test Authoring Guide](../tests/e2e/test-authoring-guide.md) - Templates and examples
- [Test Architecture](../tests/e2e/test-architecture.md) - Pyramid and metrics
- [src/tests/PATTERNS.md](../../src/tests/PATTERNS.md) - Detailed patterns A-H
- [PROVIDER_RULES.md](../../.claude/rules/PROVIDER_RULES.md) - Data provider patterns
