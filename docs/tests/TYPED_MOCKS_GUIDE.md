# Typed Mock Infrastructure Guide

This guide documents the typed mock infrastructure for testing React Admin components in Crispy CRM. **Using typed mocks eliminates `as any` casts** and ensures test data matches actual Zod schemas.

## Architecture Overview

The typed mock infrastructure is split into two files with clear responsibilities:

```
┌─────────────────────────────────────────────────────────────┐
│ Test File (ContactShow.test.tsx)                           │
├─────────────────────────────────────────────────────────────┤
│ import { mockUseShowContextReturn }                        │ ← Framework Plumbing
│   from '@/tests/utils/typed-mocks'                         │
│                                                             │
│ import { createMockContact }                               │ ← Domain Logic
│   from '@/tests/utils/mock-providers'                      │
└─────────────────────────────────────────────────────────────┘
```

| File | Purpose | Contains |
|------|---------|----------|
| `typed-mocks.ts` | **Framework plumbing** | React Admin hook mocks (`useGetList`, `useShowContext`, etc.) |
| `mock-providers.ts` | **Domain logic** | Entity factories (`createMockContact`, `createMockOpportunity`, etc.) |

## React Admin Hook Mocks (`typed-mocks.ts`)

### Available Hook Mocks

| Hook | Mock Factory | Returns |
|------|-------------|---------|
| `useGetList` | `mockUseGetListReturn<T>()` | `UseGetListHookValue<T>` |
| `useGetOne` | `mockUseGetOneReturn<T>()` | `UseGetOneHookValue<T>` |
| `useCreate` | `mockUseCreateReturn<T>()` | `[mutate, state]` tuple |
| `useUpdate` | `mockUseUpdateReturn<T>()` | `[mutate, state]` tuple |
| `useDelete` | `mockUseDeleteReturn<T>()` | `[mutate, state]` tuple |
| `useShowContext` | `mockUseShowContextReturn<T>()` | `ShowControllerResult<T>` |
| `useListContext` | `mockUseListContextReturn<T>()` | `ListControllerResult<T>` |
| `useRecordContext` | `mockUseRecordContextReturn<T>()` | `T \| undefined` |
| `useGetIdentity` | `mockUseGetIdentityReturn()` | Identity object |

### Usage Patterns

#### useShowContext (Show pages)

```typescript
import { mockUseShowContextReturn } from "@/tests/utils/typed-mocks";
import { createMockContact } from "@/tests/utils/mock-providers";

// Loading state
vi.mocked(useShowContext).mockReturnValue(
  mockUseShowContextReturn({ isPending: true })
);

// Success state with record
vi.mocked(useShowContext).mockReturnValue(
  mockUseShowContextReturn({
    record: createMockContact({ id: 1, first_name: "Alice" }),
  })
);

// No record state
vi.mocked(useShowContext).mockReturnValue(
  mockUseShowContextReturn({ record: undefined })
);
```

#### useGetList (List pages)

```typescript
import { mockUseGetListReturn } from "@/tests/utils/typed-mocks";
import { createMockOpportunity } from "@/tests/utils/mock-providers";

vi.mocked(useGetList).mockReturnValue(
  mockUseGetListReturn({
    data: [
      createMockOpportunity({ id: 1, name: "Deal A" }),
      createMockOpportunity({ id: 2, name: "Deal B" }),
    ],
    total: 2,
  })
);
```

#### useListContext (List components)

```typescript
import { mockUseListContextReturn } from "@/tests/utils/typed-mocks";
import { createMockContact } from "@/tests/utils/mock-providers";

vi.mocked(useListContext).mockReturnValue(
  mockUseListContextReturn({
    data: [createMockContact()],
    total: 1,
    filterValues: { status: "active" },
    sort: { field: "name", order: "ASC" },
  })
);
```

#### useCreate / useUpdate / useDelete (Mutations)

```typescript
import { mockUseCreateReturn, mockUseUpdateReturn } from "@/tests/utils/typed-mocks";

// Default state (not pending)
vi.mocked(useCreate).mockReturnValue(mockUseCreateReturn());

// Pending state
vi.mocked(useUpdate).mockReturnValue(
  mockUseUpdateReturn({ isPending: true })
);

// With custom mutate function
const mockMutate = vi.fn();
vi.mocked(useCreate).mockReturnValue(
  mockUseCreateReturn({ mutate: mockMutate })
);
```

## Entity Factories (`mock-providers.ts`)

### Available Entity Factories

| Entity | Factory | Key Fields |
|--------|---------|------------|
| Contact | `createMockContact()` | `first_name`, `last_name`, `email[]`, `phone[]`, `organization_id` |
| Organization | `createMockOrganization()` | `name`, `segment_id`, `priority` |
| Opportunity | `createMockOpportunity()` | `name`, `stage`, `customer_organization_id` |
| Task | `createMockTask()` | `title`, `task_type`, `due_date`, `sales_id` |
| Product | `createMockProduct()` | `name`, `sku`, `category` |
| Activity | `createMockActivity()` | `subject`, `type`, `activity_date`, `contact_id` |
| Sample Activity | `createMockSampleActivity()` | Activity + `sample_status` |

### Usage Patterns

```typescript
import {
  createMockContact,
  createMockOpportunity,
  createMockActivity,
} from "@/tests/utils/mock-providers";

// Default mock with Faker.js generated values
const contact = createMockContact();

// Override specific fields
const customContact = createMockContact({
  id: 1,
  first_name: "Alice",
  last_name: "Smith",
  organization_id: 10,
});

// Nested relationships
const opportunity = createMockOpportunity({
  id: 5,
  customer_organization_id: createMockOrganization({ id: 10 }).id,
});
```

### JSONB Array Helpers

```typescript
import { createEmailArray, createPhoneArray } from "@/tests/utils/mock-providers";

const contact = createMockContact({
  email: createEmailArray([
    { value: "work@example.com", type: "work" },
    { value: "personal@example.com", type: "home" },
  ]),
  phone: createPhoneArray([
    { value: "555-0100", type: "work" },
  ]),
});
```

## Data Provider Mocks

```typescript
import { createMockDataProvider, createMockAuthProvider } from "@/tests/utils/mock-providers";

// Default data provider
const dataProvider = createMockDataProvider();

// With custom method overrides
const dataProvider = createMockDataProvider({
  getList: async () => ({
    data: [createMockContact()],
    total: 1,
  }),
});

// Auth provider with role
const authProvider = createMockAuthProvider({ role: "admin" });
```

## Error Simulation

```typescript
import {
  createServerError,
  createRLSViolationError,
  createValidationError,
  createRejectedDataProvider,
} from "@/tests/utils/mock-providers";

// 500 error
const error = createServerError("Database connection failed");

// RLS policy violation
const rlsError = createRLSViolationError("company_id");

// Validation error with field messages
const validationError = createValidationError({
  email: "Invalid email format",
  name: "Name is required",
});

// Data provider that throws on specific method
const errorProvider = createRejectedDataProvider("getList", new Error("Failed"));
```

## Best Practices

### DO

```typescript
// Use typed factories
vi.mocked(useShowContext).mockReturnValue(
  mockUseShowContextReturn({ record: createMockContact() })
);

// Override only what you need
createMockContact({ id: 1, first_name: "Test" });

// Use vi.mocked() for type-safe mocking
vi.mocked(useGetList).mockReturnValue(...);
```

### DON'T

```typescript
// ❌ Don't use `as any` casts
(useShowContext as any).mockReturnValue({...});

// ❌ Don't manually type out all fields
const contact = {
  id: 1,
  first_name: "Test",
  last_name: "User",
  email: [],
  phone: [],
  // ... 15 more fields
} as any;

// ❌ Don't use inline object literals for entities
vi.mocked(useGetList).mockReturnValue({
  data: [{ id: 1, name: "Test" } as any],
  total: 1,
} as any);
```

## Quick Reference

### Common Import Pattern

```typescript
import { vi } from "vitest";
import {
  mockUseShowContextReturn,
  mockUseListContextReturn,
  mockUseGetListReturn,
  mockUseCreateReturn,
} from "@/tests/utils/typed-mocks";
import {
  createMockContact,
  createMockOrganization,
  createMockOpportunity,
} from "@/tests/utils/mock-providers";
```

### Component Prop Typing for Mocks

```typescript
import type { ReactNode } from "react";

// Mock component with typed props
vi.mock("@/components/SomeWrapper", () => ({
  SomeWrapper: ({ children }: { children: ReactNode }) => (
    <div data-testid="wrapper">{children}</div>
  ),
}));

// Mock with source prop
vi.mock("@/components/TextField", () => ({
  TextField: ({ source }: { source: string }) => (
    <span data-testid={`field-${source}`}>{source}</span>
  ),
}));
```

## Related Files

- `src/tests/utils/typed-mocks.ts` - Hook mock factories
- `src/tests/utils/mock-providers.ts` - Entity factories and data providers
- `src/tests/utils/render-admin.tsx` - React Admin test wrapper
- `.claude/rules/DOMAIN_INTEGRITY.md` - Rule mandating typed mock usage
