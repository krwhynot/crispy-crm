# ADR-001: Unified Data Provider Entry Point

## Status

**Accepted**

## Date

Original: 2024-10 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Crispy CRM is built with React Admin, which requires a **DataProvider** interface for all database operations (CRUD, custom queries, file storage). The application uses Supabase as its backend, presenting several architectural challenges:

1. **Security**: Without centralization, Supabase client imports would scatter across 400+ components, making security audits nearly impossible and increasing the attack surface for issues like mass assignment or SQL injection.

2. **Validation Consistency**: Data validation needs to happen at a single boundary to prevent drift between form validation and API validation (see [ADR-002](./ADR-002-zod-api-boundary.md)).

3. **Cross-Cutting Concerns**: Error logging, soft delete handling, JSONB normalization, and authentication token management must be applied consistently to all operations.

4. **Testing**: Mocking database operations requires a single, well-defined interface rather than scattered client imports.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Direct Supabase imports** | Simple, no abstraction | Scattered security surface, no centralized validation, hard to mock |
| **Multiple resource-specific providers** | Separation of concerns | Inconsistent patterns, validation drift, complex testing |
| **Repository pattern** | Familiar OOP pattern | Over-engineering for React Admin's existing DataProvider interface |
| **Single unified provider** | Single audit point, centralized validation, easy mocking | Single file grows large |

---

## Decision

**All database access flows through ONE entry point**: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

This file (~1650 lines) implements:

1. **Standard CRUD Operations**: `getList`, `getOne`, `getMany`, `getManyReference`, `create`, `update`, `delete`, `deleteMany`
2. **Custom Business Methods**: `salesCreate`, `archiveOpportunity`, `createBoothVisitor`, junction table operations
3. **RPC Calls**: `rpc()` method with Zod validation for database functions
4. **Storage Operations**: `storage.upload()`, `storage.remove()`, `storage.list()`
5. **Edge Function Invocation**: `invoke()` method for Supabase Edge Functions

### Implementation Pattern

```typescript
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts:495-566

export const unifiedDataProvider: DataProvider = {
  async getList<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    return wrapMethod("getList", resource, params, async () => {
      // 1. Validate and clean filters
      if (processedParams.filter) {
        processedParams.filter = validationService.validateFilters(
          resource,
          processedParams.filter
        );
      }

      // 2. Apply search parameters and soft delete filtering
      const searchParams = applySearchParams(resource, processedParams);

      // 3. Route to appropriate database resource (base table or view)
      const dbResource = getDatabaseResource(resource, "list");

      // 4. Execute via base Supabase provider
      const result = await baseDataProvider.getList(dbResource, searchParams);

      // 5. Normalize response data (JSONB arrays)
      return {
        ...result,
        data: normalizeResponseData(resource, result.data),
      };
    });
  },
  // ... other methods follow same pattern
};
```

### Key Design Principles

1. **Validate First, Transform Second** (line 370-382): Data is validated against Zod schemas before any transformations are applied.

2. **Consistent Error Logging** (line 195-271): All errors go through `logError()` which sends to Sentry with rich context tags.

3. **Soft Delete Handling** (line 1034-1044): Resources with soft delete use `deleted_at` timestamps instead of hard deletes.

4. **Service Delegation** (line 170-174): Complex operations delegate to service classes (`SalesService`, `OpportunitiesService`, etc.).

---

## Consequences

### Positive

- **Single Security Audit Point**: All database access can be reviewed in one file
- **Centralized Validation**: Zod validation happens at API boundary only (see [ADR-002](./ADR-002-zod-api-boundary.md))
- **Consistent Error Handling**: All operations log to Sentry with consistent tags (`method`, `resource`, `service`)
- **Easy Testing**: Mock one interface to test entire application data layer
- **Cross-Cutting Concerns**: Soft delete, JSONB normalization, auth token management applied consistently

### Negative

- **Large File Size**: ~1650 lines in one file can be challenging to navigate
- **Single Point of Change**: All data layer modifications touch this file
- **Cognitive Load**: New developers must understand the full provider to make changes

### Neutral

- **Requires Discipline**: Team must resist temptation to bypass provider with direct Supabase imports
- **Evolution to Composition**: Growing complexity led to [ADR-009](./ADR-009-composed-data-provider.md) for per-resource handlers

---

## Code Examples

### Correct Pattern

```typescript
// In any component - use data provider through React Admin hooks
import { useDataProvider } from "react-admin";

function MyComponent() {
  const dataProvider = useDataProvider();

  const handleCreate = async (data) => {
    // All validation, logging, and security handled by provider
    await dataProvider.create("contacts", { data });
  };
}
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Direct Supabase import bypasses validation and security
import { supabase } from "@/providers/supabase/supabase";

function MyComponent() {
  const handleCreate = async (data) => {
    // NO validation, NO logging, NO soft delete handling
    await supabase.from("contacts").insert(data);  // NEVER
  };
}
```

---

## Related ADRs

- **[ADR-002: Zod Validation at API Boundary](./ADR-002-zod-api-boundary.md)** - Explains why validation happens in this provider, not in forms
- **[ADR-009: Composed Data Provider Pattern](./ADR-009-composed-data-provider.md)** - Explains how the provider delegates to per-resource handlers

---

## References

- Implementation: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- React Admin DataProvider interface: https://marmelab.com/react-admin/DataProviderWriting.html
- Engineering Constitution: `CLAUDE.md` (Data Provider section)
