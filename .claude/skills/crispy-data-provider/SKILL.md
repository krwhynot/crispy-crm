---
name: crispy-data-provider
description: Data Provider architecture rules for Crispy CRM. Use when creating data handlers, adding new resources, modifying unifiedDataProvider, implementing CRUD operations, or working with React Admin handlers and Supabase queries. Enforces Strangler Fig migration pattern, View/Table duality, validation boundaries, and service layer encapsulation.
version: 1.0.0
---

# Crispy CRM Data Provider Architecture

Apply these rules when modifying the data provider layer (`src/atomic-crm/providers/supabase`).

## Quick Reference

| Rule | Summary |
|------|---------|
| **Migration** | New resources in `handlers/`, shrink `unifiedDataProvider.ts` |
| **Read/Write** | Read from Views, Write to Tables |
| **Validation** | Zod at Handler boundary, NOT in forms |
| **Business Logic** | Services, not raw Supabase calls |
| **Deletes** | Soft delete (`deleted_at`) unless explicitly told otherwise |

---

## 1. Migration Strategy (Strangler Fig)

**Goal:** Incrementally replace `unifiedDataProvider.ts` without breaking the app.

### Rules
- **Maintain `unifiedDataProvider.ts`:** Only apply bug fixes. No new logic.
- **Isolate New Resources:** All new resources use **Composed Handler Pattern** in `handlers/`.
- **Shrink the Monolith:** `unifiedDataProvider.ts` should only decrease in size.

### Decision Tree
```
Is this a NEW resource?
  YES → Create handler in src/providers/supabase/handlers/
  NO → Is this a CRITICAL bug fix?
    YES → Patch minimally in unifiedDataProvider.ts
    NO → Is this ASSIGNED migration work?
      YES → Create handler, migrate, delete from monolith
      NO → Do not modify unifiedDataProvider.ts
```

*See [migration-strategy.md](references/migration-strategy.md) for details.*

---

## 2. View vs. Table Duality

**Problem:** React Admin expects one "resource" but we have Views (read) and Tables (write).

### Rules
- **Read from Views:** `getList`, `getOne` query SQL Views (e.g., `contacts_summary`)
- **Write to Tables:** `create`, `update` go to Base Tables (e.g., `contacts`)
- **Strip Computed Fields:** Remove view-only fields before writing

### Example
```typescript
// READ - Use the View
const getList = async () => {
  const { data } = await supabase.from('contacts_summary').select('*');
  return { data, total: data.length };
};

// WRITE - Use the Table
const create = async (params) => {
  const cleaned = stripComputedFields(params.data);
  const { data } = await supabase.from('contacts').insert(cleaned);
  return { data };
};
```

*See [view-table-duality.md](references/view-table-duality.md) for implementation.*

---

## 3. Validation Boundaries

**Principle:** Validate at the API boundary, NOT in forms.

### Rules
- **Handler Validates:** Use Zod schemas from `src/atomic-crm/validation/`
- **Fail Fast:** Throw `HttpError` immediately on validation failure
- **Form Trust:** Forms may display errors but don't enforce validation

### Error Response Format
```typescript
throw new HttpError(400, "Validation Error", {
  errors: {
    email: "Invalid email format",
    first_name: "Required"
  }
});
```

*See [error-handling.md](references/error-handling.md) for mapping patterns.*

---

## 4. Service Layer Encapsulation

**Principle:** Data Provider translates; Services orchestrate.

### Rules
- **Provider = Translator:** Convert React Admin params → Supabase params
- **Service = Orchestrator:** Handle multi-step operations, business logic
- **No Raw Calls:** Complex logic belongs in Services, not Handlers

### When to Use Services
- Multi-table operations (e.g., "Create Opportunity + Link Products")
- Business rule enforcement (e.g., "Only 5 opportunities per contact")
- Cross-cutting concerns (e.g., audit logging)

### Example
```typescript
// Handler - Simple translation
const create = async (params) => {
  return opportunitiesService.createWithProducts(params.data);
};

// Service - Business logic
class OpportunitiesService {
  async createWithProducts(data) {
    const opportunity = await this.createOpportunity(data);
    await this.linkProducts(opportunity.id, data.product_ids);
    await this.logActivity(opportunity.id, 'created');
    return opportunity;
  }
}
```

---

## 5. Data Safety & Simplicity

### Soft Deletes (Always)
```typescript
// CORRECT
await supabase.from('contacts').update({ deleted_at: new Date() }).eq('id', id);

// WRONG - Never hard delete unless explicitly told
await supabase.from('contacts').delete().eq('id', id);
```

### Explicit Composition (No Magic)
```typescript
// CORRECT - Explicit composition order
export const createTasksHandler = () => {
  return withErrorLogging(           // 3. Outer: Catch errors
    withLifecycleCallbacks(          // 2. Middle: Transform
      withValidation(baseHandler),   // 1. Inner: Validate first
      tasksCallbacks
    )
  );
};

// WRONG - Auto-CRUD factory
export const tasksHandler = createAutoHandler('tasks'); // Hidden magic
```

*See [handler-patterns.md](references/handler-patterns.md) for composition examples.*

---

## Code Review Checklist

Before committing data provider changes, verify:

- [ ] New logic in `handlers/` (not `unifiedDataProvider.ts`)?
- [ ] Writes target Base Table (not View)?
- [ ] Zod validation at Handler boundary?
- [ ] Business logic in Service layer?
- [ ] Errors mapped to React Admin format?
- [ ] Soft delete used (not hard delete)?
- [ ] Handler composition is explicit?

---

## Anti-Patterns (BLOCK)

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Adding to `unifiedDataProvider.ts` | Create new handler |
| Writing to View | Write to Table, strip computed fields |
| Form-level Zod validation | Handler-level validation |
| Raw `supabase.from()` in handlers | Service layer for complex ops |
| Hard delete | Soft delete with `deleted_at` |
| Auto-CRUD factories | Explicit handler composition |

---

## Reference Files

For detailed implementation guidance:

- [migration-strategy.md](references/migration-strategy.md) - Strangler Fig details
- [handler-patterns.md](references/handler-patterns.md) - Handler composition templates
- [view-table-duality.md](references/view-table-duality.md) - Read/Write separation
- [error-handling.md](references/error-handling.md) - Zod → React Admin error mapping

---

**Skill Status:** COMPLETE
**Line Count:** < 200 (following 500-line rule)
**Progressive Disclosure:** Reference files for implementation details
