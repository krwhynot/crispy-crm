# Strangler Fig Migration Strategy

## Table of Contents
1. [The Core Concept](#the-core-concept)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Rules](#implementation-rules)
4. [Migration Process](#migration-process)
5. [Examples](#examples)

---

## The Core Concept

The **Strangler Fig Pattern** is a technique for incrementally replacing a legacy system without breaking it. Named after the strangler fig tree that grows around a host tree until it can stand alone.

**In Crispy CRM:** We're migrating from a Monolithic Provider (`unifiedDataProvider.ts`) to a Composed Provider (`handlers/*`).

### Why This Matters
- **Risk Mitigation:** No big-bang rewrites that break everything
- **Continuous Delivery:** Ship features while migrating
- **Reversibility:** Can roll back individual resources
- **Team Velocity:** Multiple developers can work on different handlers

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Admin App                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   composedDataProvider.ts                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Router: resource → handler mapping                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────────────┐
│  handlers/      │ │  handlers/  │ │  unifiedDataProvider.ts │
│  tasksHandler   │ │  (new...)   │ │  (LEGACY - shrinking)   │
└─────────────────┘ └─────────────┘ └─────────────────────────┘
```

---

## Implementation Rules

### 1. The Monolith (`unifiedDataProvider.ts`)

**Status:** Legacy/Stable - DO NOT IMPROVE

**Allowed Actions:**
- Critical bug fixes (security, data corruption)
- Minimal patches for compatibility

**Forbidden Actions:**
- New resource handlers
- Refactoring existing code
- Adding new patterns or abstractions
- "Cleaning up" while you're there

### 2. The New Architecture (`handlers/*`)

**Status:** Active Development

**For New Resources:**
```typescript
// src/providers/supabase/handlers/invoicesHandler.ts
import { withErrorLogging } from '../wrappers/withErrorLogging';
import { withValidation } from '../wrappers/withValidation';
import { invoiceSchema } from '@/atomic-crm/validation/invoiceSchema';

const baseHandler = {
  getList: async (params) => { /* ... */ },
  getOne: async (params) => { /* ... */ },
  create: async (params) => { /* ... */ },
  update: async (params) => { /* ... */ },
  delete: async (params) => { /* ... */ },
};

export const createInvoicesHandler = () => {
  return withErrorLogging(
    withValidation(baseHandler, invoiceSchema)
  );
};
```

**Registration:**
```typescript
// src/providers/supabase/composedDataProvider.ts
import { createInvoicesHandler } from './handlers/invoicesHandler';

const handlers = {
  invoices: createInvoicesHandler(),
  // ... other handlers
};
```

### 3. Shrinking the Monolith

**Goal:** `unifiedDataProvider.ts` should only get smaller.

**Process:**
1. Pick ONE resource to migrate
2. Create handler in `handlers/`
3. Update router in `composedDataProvider.ts`
4. Test thoroughly
5. Delete code from `unifiedDataProvider.ts`
6. Commit with clear message: "Migrate [resource] to handler pattern"

---

## Migration Process

### Step 1: Identify Candidate Resource

Choose based on:
- Complexity (start simple)
- Test coverage (higher = safer)
- Active development (migrate what you're touching)

### Step 2: Extract to Handler

```typescript
// BEFORE: In unifiedDataProvider.ts
const dataProvider = {
  getList: async (resource, params) => {
    if (resource === 'tasks') {
      // 50+ lines of task-specific logic
    }
    // ...
  }
};

// AFTER: In handlers/tasksHandler.ts
export const createTasksHandler = () => ({
  getList: async (params) => {
    // Same logic, isolated
  },
  // ...
});
```

### Step 3: Wire Up Router

```typescript
// composedDataProvider.ts
const getHandlerForResource = (resource: string) => {
  const handlers = {
    tasks: createTasksHandler(),
    // Legacy resources fall through to unifiedDataProvider
  };
  return handlers[resource] || unifiedDataProvider;
};
```

### Step 4: Test & Verify

```bash
# Run tests for the migrated resource
npm test -- --grep "tasks"

# Manual verification
# 1. List tasks
# 2. Create task
# 3. Update task
# 4. Delete task (soft)
```

### Step 5: Delete from Monolith

```typescript
// REMOVE from unifiedDataProvider.ts:
if (resource === 'tasks') {
  // DELETE THIS ENTIRE BLOCK
}
```

### Step 6: Commit

```bash
git commit -m "Migrate tasks resource to handler pattern

- Extract tasks logic to handlers/tasksHandler.ts
- Add Zod validation at handler boundary
- Remove tasks code from unifiedDataProvider.ts
- Net reduction: -127 lines from monolith"
```

---

## Examples

### Example 1: Simple Resource Migration

**Before:** Tasks in monolith (200 lines)

**After:**
- `handlers/tasksHandler.ts` (80 lines)
- `callbacks/tasksCallbacks.ts` (40 lines)
- `unifiedDataProvider.ts` (-200 lines)

**Net:** Monolith shrinks, logic is isolated and testable.

### Example 2: New Resource (No Migration)

**Scenario:** Add "Invoices" feature

**Correct:**
```
1. Create handlers/invoicesHandler.ts
2. Create validation/invoiceSchema.ts
3. Register in composedDataProvider.ts
4. Done - never touched unifiedDataProvider.ts
```

**Wrong:**
```
1. Add invoices case to unifiedDataProvider.ts
// This GROWS the monolith - forbidden!
```

---

## Metrics to Track

- Lines in `unifiedDataProvider.ts` (should decrease)
- Number of resources in `handlers/` (should increase)
- Test coverage of handlers (should be high)
- Bug rate per resource (should decrease after migration)
