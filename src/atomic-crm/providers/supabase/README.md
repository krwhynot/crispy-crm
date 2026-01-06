# Supabase Data Provider Architecture

This directory contains the **Composed Handler Architecture** for the Crispy CRM data layer. The legacy `unifiedDataProvider.ts` monolith (1090+ LOC) was deleted after successful migration to this modular architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    composedDataProvider.ts                   │
│         (Routes requests to resource-specific handlers)      │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  contacts   │    │ opportunities│    │  products   │
   │   Handler   │    │   Handler    │    │   Handler   │
   └─────────────┘    └─────────────┘    └─────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
              ┌──────────────────────────┐
              │    Services (Business    │
              │    Logic Layer)          │
              └──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   Supabase (Database)    │
              └──────────────────────────┘
```

## Directory Structure

```
src/atomic-crm/providers/supabase/
├── README.md                    # This file
├── index.ts                     # Main export (dataProvider)
├── composedDataProvider.ts      # Handler router
├── handlers/                    # Resource-specific handlers
│   ├── contactsHandler.ts       # Contact management
│   ├── organizationsHandler.ts  # Organization management
│   ├── opportunitiesHandler.ts  # Deal pipeline (complex: cascade delete, products sync)
│   ├── productsHandler.ts       # Product catalog
│   ├── productDistributorsHandler.ts # Composite key junction
│   ├── activitiesHandler.ts     # Call/email/meeting tracking
│   ├── tasksHandler.ts          # Task management
│   ├── notesHandler.ts          # Notes (contact, opportunity, organization)
│   ├── tagsHandler.ts           # Tags (hard delete)
│   ├── salesHandler.ts          # Sales records (RLS bypass)
│   ├── segmentsHandler.ts       # Playbook categories
│   └── junctionHandlers.ts      # Junction tables (6 tables with soft delete)
├── callbacks/                   # Lifecycle callbacks (beforeSave, beforeDelete)
│   ├── contactsCallbacks.ts
│   ├── organizationsCallbacks.ts
│   ├── opportunitiesCallbacks.ts
│   ├── commonTransforms.ts      # Shared utilities (createQToIlikeTransformer)
│   └── ...
├── wrappers/                    # Handler composition wrappers
│   ├── withValidation.ts        # Zod schema validation
│   ├── withErrorLogging.ts      # Structured error handling
│   └── index.ts
├── services/                    # Business logic layer
│   ├── segments.service.ts
│   └── ...
├── filterRegistry.ts            # Type-safe filter field definitions
├── dataProviderUtils.ts         # Shared utilities
└── extensions/                  # Extended DataProvider types
```

## Golden Rules

### 1. Wrapper Composition Order (Critical!)

When creating handlers, wrappers MUST be applied in this order:

```typescript
// Correct Order: innermost → outermost
return withErrorLogging(
  withLifecycleCallbacks(
    withValidation(baseProvider),
    [resourceCallbacks]
  )
);
```

**Visual Flow:**

```
┌─────────────────────────────────────────────────┐
│  withErrorLogging (catches all errors)          │
│    ┌─────────────────────────────────────────┐  │
│    │ withLifecycleCallbacks (strips fields)  │  │
│    │   ┌─────────────────────────────────┐   │  │
│    │   │ withValidation (Zod schemas)    │   │  │
│    │   │   ┌─────────────────────────┐   │   │  │
│    │   │   │ baseProvider (Supabase) │   │   │  │
│    │   │   └─────────────────────────┘   │   │  │
│    │   └─────────────────────────────────┘   │  │
│    └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

Request Flow: Error handler → Callbacks strip fields → Validation → DB
```

**Why this order matters:** `beforeSave` callbacks strip computed/view-only fields BEFORE Zod validates, preventing "Unrecognized keys" errors.

### 2. View vs. Table Duality

| Operation | Target | Example |
|-----------|--------|---------|
| **Reads** (`getList`, `getOne`) | SQL View (`*_summary`) | `opportunities_summary` |
| **Writes** (`create`, `update`) | Base Table | `opportunities` |

**Important:** Always strip view-only computed fields before saving. This is handled by `beforeSave` callbacks.

### 3. Zod at the Boundary

- All validation happens at the API boundary via `withValidation` wrapper
- Form-level validation is NOT the source of truth
- Use schemas from `src/atomic-crm/validation/`

### 4. Service Layer for Business Logic

- **Handlers** = Translation (React Admin params → Supabase params)
- **Services** = Business logic (multi-table operations, RPC calls)

```typescript
// Handler intercepts, delegates to service
const service = new OpportunitiesService(baseProvider);
if (hasProducts) {
  return service.createWithProducts(data);
}
```

### 5. Soft Deletes by Default

- Use `deleted_at` timestamp instead of hard deletes
- Exception: `tags` resource uses hard deletes
- All `getList` queries filter `.is('deleted_at', null)`

## Creating a New Handler

```typescript
// src/atomic-crm/providers/supabase/handlers/exampleHandler.ts
import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { exampleCallbacks } from "../callbacks";

export function createExampleHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseProvider),
      [exampleCallbacks]
    )
  );
}
```

Then register in `composedDataProvider.ts`:

```typescript
const resourceHandlers: Record<string, DataProvider> = {
  // ... existing handlers
  examples: createExampleHandler(baseProvider),
};
```

## Security

### Filter Registry (Type-Safe)

The `filterRegistry.ts` enforces:
- Only registered resources can be filtered
- Only declared fields per resource are filterable
- Unknown resources throw `UnregisteredResourceError` (security hardening)

### Type Safety

- `COMPUTED_FIELDS` arrays use `satisfies keyof Type` for compile-time safety
- Handler inputs validated with Zod schemas (`.passthrough()` for flexibility)
- Filter fields bound to `Database["public"]["Tables"]` types

## Testing

Each handler has corresponding tests:
- `handlers/__tests__/opportunitiesHandler.test.ts`
- `handlers/contactsHandler.test.ts`
- etc.

Run tests:
```bash
npm test -- --grep "handler"
```

## Handled Resources

### Core CRM Resources
- `contacts` - Customer contacts with JSONB array normalization
- `organizations` - Companies (principals, distributors, operators)
- `opportunities` - Sales pipeline (cascade delete via RPC, products sync)
- `activities` - Interaction tracking (calls, emails, meetings)
- `products` - Product catalog with distributor relationships

### Supporting Resources
- `tasks` - Task management with completion/snooze handling
- `contact_notes`, `opportunity_notes`, `organization_notes` - Notes (snake_case)
- `tags` - Tagging system (hard delete, no soft delete)
- `sales` - Sales records (RLS bypass via Edge Function)
- `segments` - Playbook categories
- `product_distributors` - Composite key junction (product_id + distributor_id)

### Junction Tables (Soft Delete Protected)
These junction tables have handlers to prevent data loss from hard deletes:
- `opportunity_participants` - Links opportunities to sales reps
- `opportunity_contacts` - Links opportunities to contacts
- `interaction_participants` - Links activities to contacts
- `distributor_principal_authorizations` - Links distributors to principals
- `organization_distributors` - Links organizations to distributor records
- `user_favorites` - User-favorited records

## Migration History

- **Phase 1-4**: Incremental handler migration (Strangler Fig pattern)
- **Phase 5**: Deleted `unifiedDataProvider.ts` monolith (1090+ LOC)
- **Phase 6**: Extracted shared utilities (`commonTransforms.ts`)
- **Phase 7**: Type safety hardening (`filterRegistry.ts`)
- **Phase 8**: Health & hardening (junction handlers, log cleanup, DRY search)

See `docs/TODOs/TODO_PROVIDER.md` for complete migration history.
