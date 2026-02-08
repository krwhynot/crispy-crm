# Data Provider Architecture Rules

Governs `src/atomic-crm/providers/supabase/` - Composed Proxy Pattern (No Monoliths).

> **The Rule:** All resources MUST use `handlers/[resource]Handler.ts` registered in `composedDataProvider.ts`. Direct Supabase imports in components are banned.

## Composed Architecture

DO:
- `handlers/[resource]Handler.ts` - one file per resource
- `createTasksHandler()` - factory functions, not inline objects
- Register in `composedDataProvider.ts`

DON'T:
- Recreate monolithic `unifiedDataProvider.ts` - was successfully migrated and deleted
- Build auto-CRUD factories that guess table names

## View/Table Duality

DO:
- **Reads (list/getMany/getManyReference):** Query `contacts_summary`, `opportunities_summary` views
- **Reads (getOne):** Use the configured detail mapping (base table or summary view) per resource
- **Writes:** Target base tables directly
- Define `COMPUTED_FIELDS` in `callbacks/[resource]Callbacks.ts`
- `withLifecycleCallbacks` strips computed fields before save

DON'T:
- Write to views
- Read from base tables for lists
- Forget to strip computed fields

## Validation at Boundary

DO:
- Schemas in `src/atomic-crm/validation/`
- Register in `src/atomic-crm/providers/supabase/services/ValidationService.ts`
- `withValidation` wrapper enforces and throws 400 errors
- Treat edit as a round-trip contract:
  - `getOne -> defaultValues -> resolver -> provider update`
  - If any stage rejects fields, save can no-op before API calls

DON'T:
- Rely solely on React Admin form validation
- Skip provider-layer validation
- Parse raw DB/view records with strict write schemas in form defaults

## Edit Round-Trip Contract

DO:
- Keep one canonical `COMPUTED_FIELDS` list per resource in callbacks/transform layer
- Strip or sanitize view-only/computed fields before strict validation on save
- Add one guard test per resource: edit one field, click save, assert `dataProvider.update` called
- Add schema-drift tests so computed field stripping stays aligned with SQL view columns

DON'T:
- Assume save reached provider if no network call is visible
- Debug provider first when resolver validation can block submit earlier

## Storage Operations

DO:
- **Service Isolation:** Encapsulate storage logic in `src/atomic-crm/providers/supabase/services/StorageService.ts`. Don't call `supabase.storage` inside handlers directly.
- **MIME Validation:** Validate `file.type` against an allowed list (e.g., `['image/png', 'application/pdf']`) before upload.
- **Cleanup on Fail:** If a database transaction fails after a file upload, catch the error and delete the orphaned file immediately.
- **Signed URLs:** Use `createSignedUrl` for private assets; do not expose permanent paths.

DON'T:
- **Blocking Uploads:** Don't block the main UI thread. Use background uploads where possible.
- **Raw File Inputs:** Don't pass raw `File` objects deeper than the handler layer.

## Service Layer

DO:
- Handlers = plumbing (map React Admin params to Supabase params)
- Services = logic (business operations in `src/atomic-crm/providers/supabase/services/`)
- `OpportunitiesService.archive()` for complex operations

DON'T:
- Put business logic in handlers
- Scatter `supabase.rpc()` calls across generic handlers; keep them in resource callbacks or service-layer methods

## Soft Deletes

DO:
- `supportsSoftDelete: true` in callbacks config
- `withSkipDelete` converts DELETE to `UPDATE deleted_at = NOW()`
- Filter `deleted_at IS NULL` (handled by views)

DON'T:
- Use hard DELETE (except exempted resources like Tags)

## Error Handling & Side-Effects

DO:
- Wrap all handlers with `withErrorLogging` (outermost)
- Return success if record already deleted (idempotency)
- Try/catch external side-effects (storage, notifications, webhooks)
- Log side-effect failures but decide if they should block main transaction
- Await or explicitly void unawaited promises with error handling

DON'T:
- Use `console.log` or `console.error` - wrapper handles Sentry
- Fire-and-forget without error handling (`void deleteFiles()` with no catch)
- Let non-critical side-effects crash critical transactions
- Silent catches that hide errors (`catch { }`)

### Side-Effect Error Handling

WRONG:
```typescript
// Fire-and-forget - errors go into void, no logging
if (filePaths.length > 0) {
  void deleteStorageFiles(filePaths);
}

// Unawaited promise - may cause race conditions or silent failures
async function beforeDelete(params: DeleteParams) {
  deleteStorageFiles(params.id); // Missing await - caller doesn't know it failed
  return params;
}
```

RIGHT:
```typescript
// Explicit error handling with structured logging
if (filePaths.length > 0) {
  void deleteStorageFiles(filePaths).catch((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.warn('Storage cleanup failed after organization archive', {
      organizationId: params.id,
      fileCount: filePaths.length,
      error: errorMessage,
      operation: 'organizationsBeforeDelete',
      note: 'Archive succeeded - orphaned files can be cleaned up later',
    });
  });
}

// Await critical operations, fire-and-forget only for cleanup
async function beforeDelete(params: DeleteParams) {
  // Critical: Must succeed before returning
  await supabase.rpc('archive_organization_with_relations', { org_id: params.id });

  // Non-critical cleanup: Log failures but don't block
  void cleanupStorage(params.id).catch(logError);

  return params;
}
```

Side-effects should fail gracefully. Storage cleanup failure shouldn't rollback a successful archive.

### Transaction Boundaries

WRONG:
```typescript
// External API call in critical path - network errors crash transactions
async function beforeCreate(params: CreateParams) {
  await sendWelcomeEmail(params.data.email); // BLOCKS CREATE if email service is down
  return params;
}
```

RIGHT:
```typescript
// Separate critical path from non-critical side-effects
async function beforeCreate(params: CreateParams) {
  // Critical validation first
  if (!params.data.email) {
    throw new Error('Email required');
  }
  return params;
}

async function afterCreate(record: RaRecord, dataProvider: DataProvider) {
  // Non-critical: Send email in background, log failures
  void sendWelcomeEmail(record.email).catch((err: unknown) => {
    logger.warn('Welcome email failed', {
      userId: record.id,
      email: record.email,
      error: err instanceof Error ? err.message : String(err),
      note: 'User created successfully - email can be resent manually',
    });
  });
  return record;
}
```

Critical operations (database) should never depend on external services (email, storage).

## Hierarchical Integrity

DO:
- **Self-Exclusion:** When fetching candidates for a self-referential field (e.g., `parent_id`), usually via `getList`, you MUST explicitly exclude the current record's ID.
  - Example: `filter: { id_neq: currentRecord.id }`
- **Cycle Prevention:** If possible, filter out known descendants to prevent "grandparent -> child -> grandparent" loops.

DON'T:
- **Blind Fetching:** Never use a generic `useGetList('organizations')` for a Parent Dropdown without filters.
- **Client-Side Filtering:** Do not fetch all 10,000 organizations and try to filter the ID in JavaScript. Filter at the database query level.

// WRONG: Allows selecting self
<ReferenceInput source="parent_id" reference="organizations">
  <SelectInput optionText="name" />
</ReferenceInput>

// RIGHT: Enforces the rule
const { record } = useRecordContext();
<ReferenceInput 
  source="parent_id" 
  reference="organizations" 
  filter={{ id_neq: record?.id }} // <-- The Rule in Action
>
  <SelectInput optionText="name" />
</ReferenceInput>

## Hierarchical Constraints

DO:
- **Check Constraints:** Add a table constraint ensuring `id != parent_id`.
  - `ALTER TABLE organizations ADD CONSTRAINT no_self_parent CHECK (id != parent_id);`

## Wrapper Composition Order

WRONG:
```typescript
// Random order breaks safety
return withValidation(
  withErrorLogging(baseProvider)
);
```

RIGHT:
```typescript
export function createMyHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(              // 3. Outermost - catches all errors
    withLifecycleCallbacks(             // 2. Runs before/after callbacks (strip/sanitize in before*)
      withValidation(baseProvider),     // 1. Validates sanitized payload before base write
      [myResourceCallbacks]
    )
  );
}
```

Execution order matters: Strip/Sanitize -> Validate -> Log.

## Code Review Checklist

- [ ] File in `handlers/` (not `unifiedDataProvider`)
- [ ] Registered in `composedDataProvider.ts`
- [ ] List/getMany reads use `_summary` view mapping; writes target base table
- [ ] `COMPUTED_FIELDS` defined in callbacks
- [ ] Zod schema registered in `ValidationService`
- [ ] Edit round-trip verified (`getOne -> defaultValues -> resolver -> update`)
- [ ] `supportsSoftDelete: true` enabled
- [ ] `withErrorLogging` is outermost wrapper
- [ ] External side-effects wrapped in try/catch with logging
- [ ] Non-critical side-effects don't block critical transactions
- [ ] All async operations properly awaited or explicitly voided with error handlers
