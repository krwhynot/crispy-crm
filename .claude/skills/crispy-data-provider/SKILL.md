---
name: crispy-data-provider
description: Data Provider architecture rules for Crispy CRM. Use when creating data handlers, adding new resources, modifying unifiedDataProvider, implementing CRUD operations, or working with React Admin handlers and Supabase queries. Enforces Strangler Fig migration pattern, View/Table duality, validation boundaries, and service layer encapsulation.
version: 1.0.0
---

# Crispy CRM Data Provider Architecture

Apply these rules when modifying the data provider layer (`src/atomic-crm/providers/supabase`).

### Data Provider Architecture
> Full architecture rules: `.claude/rules/PROVIDER_RULES.md` (always loaded)
> Covers: View/Table duality, validation boundaries, service layer, soft deletes, wrapper composition, error handling, side-effects, review checklist.

---

## Migration Strategy (Strangler Fig)

**Goal:** Incrementally replace `unifiedDataProvider.ts` without breaking the app.

### Rules
- **Maintain `unifiedDataProvider.ts`:** Only apply bug fixes. No new logic.
- **Isolate New Resources:** All new resources use **Composed Handler Pattern** in `handlers/`.
- **Shrink the Monolith:** `unifiedDataProvider.ts` should only decrease in size.

### Decision Tree
```
Is this a NEW resource?
  YES -> Create handler in src/providers/supabase/handlers/
  NO -> Is this a CRITICAL bug fix?
    YES -> Patch minimally in unifiedDataProvider.ts
    NO -> Is this ASSIGNED migration work?
      YES -> Create handler, migrate, delete from monolith
      NO -> Do not modify unifiedDataProvider.ts
```

### Handler Creation Workflow

1. Create `handlers/[resource]Handler.ts` with factory function
2. Define `COMPUTED_FIELDS` in `callbacks/[resource]Callbacks.ts`
3. Register Zod schema in `services/ValidationService.ts`
4. Register handler in `composedDataProvider.ts`
5. Verify reads target `_summary` view, writes target base table

*See [migration-strategy.md](references/migration-strategy.md) for details.*

---

## Reference Files

For detailed implementation guidance:

- [migration-strategy.md](references/migration-strategy.md) - Strangler Fig details
- [handler-patterns.md](references/handler-patterns.md) - Handler composition templates
- [view-table-duality.md](references/view-table-duality.md) - Read/Write separation
- [error-handling.md](references/error-handling.md) - Zod -> React Admin error mapping

---

**Skill Status:** COMPLETE
**Progressive Disclosure:** Reference files for implementation details
