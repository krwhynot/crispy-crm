# ADR-009: Composed Data Provider Pattern

## Status

**Accepted**

## Date

Original: 2024-11 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

As Crispy CRM grew, the unified data provider ([ADR-001](../tier-1-foundations/ADR-001-unified-data-provider.md)) accumulated resource-specific logic:

- **Contacts**: JSONB array normalization for email/phone, soft delete filtering
- **Opportunities**: Product sync, optimistic locking, cascade soft delete
- **Tasks**: Completion timestamps, snooze handling
- **Notes**: Three types (contact, opportunity, organization) with similar but distinct logic

This led to a ~1650 line file with interleaved concerns:

```typescript
// Before: Resource-specific logic scattered throughout
async create(resource, params) {
  if (resource === "opportunities") {
    // 50 lines of opportunity-specific logic
  } else if (resource === "contacts") {
    // 30 lines of contact-specific logic
  } else if (resource === "tasks") {
    // 40 lines of task-specific logic
  }
  // ... generic handling
}
```

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Keep monolithic** | All logic in one place | 2000+ lines, hard to test, high coupling |
| **Inheritance hierarchy** | OOP familiarity | Deep inheritance chains, inflexible |
| **Middleware chain** | Familiar Express pattern | Ordering complexity, hard to debug |
| **Composition pattern** | Single responsibility, testable, flexible | More files, requires understanding composition order |

---

## Decision

**Use composition over inheritance** via a proxy pattern router that delegates to per-resource handlers.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    unifiedDataProvider                            │
│  (Entry point - delegates to composedDataProvider for routing)   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   composedDataProvider                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Proxy Pattern Router:                                         │ │
│  │   if (isHandledResource(resource))                           │ │
│  │     return handlers[resource].method(...)                    │ │
│  │   else                                                        │ │
│  │     return baseProvider.method(...)                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│contactsHandler│  │tasksHandler   │  │salesHandler   │
│               │  │               │  │               │
│ withErrorLog( │  │ withErrorLog( │  │ withErrorLog( │
│  withLifecycle│  │  withLifecycle│  │  withLifecycle│
│   withValid(  │  │   withValid(  │  │   withValid(  │
│    base)))    │  │    base)))    │  │    base)))    │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Handler Registry

```typescript
// src/atomic-crm/providers/supabase/composedDataProvider.ts:38-54

export const HANDLED_RESOURCES = [
  // Core CRM resources
  "contacts",
  "organizations",
  "opportunities",
  "activities",
  "products",
  // Task management
  "tasks",
  // Notes (3 types)
  "contact_notes",
  "opportunity_notes",
  "organization_notes",
  // Supporting resources
  "tags",
  "sales",
] as const;
```

### Composition Chain

Each handler composes wrappers in a specific order (innermost to outermost):

```typescript
// src/atomic-crm/providers/supabase/handlers/contactsHandler.ts:29-33

export function createContactsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseProvider),
      [contactsCallbacks]
    )
  );
}
```

**Critical Order**: `base → withValidation → withLifecycleCallbacks → withErrorLogging`

1. **withValidation** (innermost): Runs Zod validation first
2. **withLifecycleCallbacks**: Resource-specific logic (soft delete, JSONB normalization)
3. **withErrorLogging** (outermost): Catches all errors, logs to Sentry

### Proxy Pattern Implementation

```typescript
// src/atomic-crm/providers/supabase/composedDataProvider.ts:94-122

export function createComposedDataProvider(baseProvider: DataProvider): DataProvider {
  // Create composed handlers for each resource
  const handlers: HandlerRegistry = {
    contacts: createContactsHandler(baseProvider),
    organizations: createOrganizationsHandler(baseProvider),
    opportunities: createOpportunitiesHandler(baseProvider),
    // ... 11 total handlers
  };

  function getProviderForResource(resource: string): DataProvider {
    if (isHandledResource(resource)) {
      return handlers[resource];  // Use composed handler
    }
    return baseProvider;  // Fallback to base for unknown resources
  }

  return {
    getList: async (resource, params) => {
      const provider = getProviderForResource(resource);
      return provider.getList(resource, params);
    },
    // ... other methods delegate similarly
  };
}
```

---

## Consequences

### Positive

- **Single Responsibility**: Each handler file is ~30-50 lines, focused on one resource
- **Testability**: Handlers can be tested in isolation with mocked base provider
- **Flexibility**: Add new resources by creating handler + adding to registry
- **Debugging**: Stack traces show exactly which wrapper failed
- **Parallel Development**: Different developers can work on different handlers

### Negative

- **More Files**: 11 handler files + 3 wrapper files vs 1 monolithic file
- **Indirection**: Must trace through composition chain to understand full behavior
- **Ordering Matters**: Wrong composition order causes subtle bugs (validation must run before lifecycle)

### Neutral

- **Gradual Migration**: Can move resources to composition one at a time
- **Fallback Behavior**: Unconfigured resources work via base provider passthrough

---

## Code Examples

### Correct Pattern - Creating a Handler

```typescript
// src/atomic-crm/providers/supabase/handlers/tasksHandler.ts

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { tasksCallbacks } from "../callbacks";

export function createTasksHandler(baseProvider: DataProvider): DataProvider {
  // Composition order: base → validation → lifecycle → logging
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseProvider),
      [tasksCallbacks]
    )
  );
}
```

### Correct Pattern - Resource Routing

```typescript
// In composedDataProvider.ts - routing logic

const composedProvider: DataProvider = {
  getList: async (resource, params) => {
    const dbResource = getDatabaseResource(resource, "list");
    const processedParams = applySearchParams(resource, params);
    const provider = getProviderForResource(resource);  // Routes to handler
    return provider.getList(dbResource, processedParams);
  },
};
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Monolithic switch statement in provider
async create(resource: string, params: CreateParams) {
  // NEVER: Resource-specific logic inline creates 2000+ line files
  if (resource === "contacts") {
    // 50 lines of contact logic
  } else if (resource === "opportunities") {
    // 80 lines of opportunity logic
  } else if (resource === "tasks") {
    // 40 lines of task logic
  }
  // Unmaintainable!
}
```

```typescript
// WRONG: Wrong composition order
export function createBrokenHandler(base: DataProvider): DataProvider {
  // NEVER: Lifecycle runs BEFORE validation - transforms invalid data!
  return withErrorLogging(
    withValidation(
      withLifecycleCallbacks(base, [callbacks])  // WRONG ORDER
    )
  );
}
```

```typescript
// WRONG: Bypass composed provider
import { supabase } from "./supabase";

// NEVER: Bypasses validation, logging, lifecycle hooks
const result = await supabase.from("contacts").select("*");
```

---

## Handler Inventory

| Resource | Handler File | Callbacks | Special Logic |
|----------|-------------|-----------|---------------|
| contacts | `contactsHandler.ts` | JSONB normalization | Soft delete, email/phone arrays |
| organizations | `organizationsHandler.ts` | Segment handling | Soft delete |
| opportunities | `opportunitiesHandler.ts` | Product sync | Cascade delete, optimistic locking |
| activities | `activitiesHandler.ts` | - | Activity logging |
| products | `productsHandler.ts` | Distributor sync | Product-distributor junction |
| tasks | `tasksHandler.ts` | Completion handling | Snooze, timestamps |
| contact_notes | `notesHandler.ts` | - | Shared notes logic |
| opportunity_notes | `notesHandler.ts` | - | Shared notes logic |
| organization_notes | `notesHandler.ts` | - | Shared notes logic |
| tags | `tagsHandler.ts` | - | Tag management |
| sales | `salesHandler.ts` | - | User management |

---

## Related ADRs

- **[ADR-001: Unified Data Provider Entry Point](../tier-1-foundations/ADR-001-unified-data-provider.md)** - The entry point that delegates to this composed provider
- **[ADR-002: Zod Validation at API Boundary](../tier-1-foundations/ADR-002-zod-api-boundary.md)** - The validation wrapper used in composition chain

---

## References

- Composed Provider: `src/atomic-crm/providers/supabase/composedDataProvider.ts`
- Handler Index: `src/atomic-crm/providers/supabase/handlers/index.ts`
- Example Handler: `src/atomic-crm/providers/supabase/handlers/contactsHandler.ts`
- Validation Wrapper: `src/atomic-crm/providers/supabase/wrappers/withValidation.ts`
- React Admin Composition: https://marmelab.com/react-admin/DataProviderWriting.html#handling-side-effects
