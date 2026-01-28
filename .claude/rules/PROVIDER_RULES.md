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
- **Reads:** Query `contacts_summary`, `opportunities_summary` views
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
- Register in `services/ValidationService.ts`
- `withValidation` wrapper enforces and throws 400 errors

DON'T:
- Rely solely on React Admin form validation
- Skip provider-layer validation

## Storage Operations

DO:
- **Service Isolation:** Encapsulate storage logic in `src/services/StorageService.ts`. Don't call `supabase.storage` inside handlers directly.
- **MIME Validation:** Validate `file.type` against an allowed list (e.g., `['image/png', 'application/pdf']`) before upload.
- **Cleanup on Fail:** If a database transaction fails after a file upload, catch the error and delete the orphaned file immediately.
- **Signed URLs:** Use `createSignedUrl` for private assets; do not expose permanent paths.

DON'T:
- **Blocking Uploads:** Don't block the main UI thread. Use background uploads where possible.
- **Raw File Inputs:** Don't pass raw `File` objects deeper than the handler layer.
- 
## Service Layer

DO:
- Handlers = plumbing (map React Admin params to Supabase params)
- Services = logic (business operations in `src/services/`)
- `OpportunitiesService.archive()` for complex operations

DON'T:
- Put business logic in handlers
- Call `supabase.rpc()` directly in handlers

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
  return withErrorLogging(              // 4. Outermost - catches all errors
    withLifecycleCallbacks(             // 3. Strips computed fields
      withValidation(baseProvider),     // 2. Validates first
      [myResourceCallbacks]
    )
  );
}
```

Order matters: Validate → Strip → Log (inside to outside).

## Code Review Checklist

- [ ] File in `handlers/` (not `unifiedDataProvider`)
- [ ] Registered in `composedDataProvider.ts`
- [ ] Reads from `_summary` view, writes to base table
- [ ] `COMPUTED_FIELDS` defined in callbacks
- [ ] Zod schema registered in `ValidationService`
- [ ] `supportsSoftDelete: true` enabled
- [ ] `withErrorLogging` is outermost wrapper
- [ ] External side-effects wrapped in try/catch with logging
- [ ] Non-critical side-effects don't block critical transactions
- [ ] All async operations properly awaited or explicitly voided with error handlers
