# Data Provider Architecture Rules

Governs `src/atomic-crm/providers/supabase/` - Composed Proxy Pattern (No Monoliths).

## Composed Architecture

DO:
- `handlers/[resource]Handler.ts` - one file per resource
- `createTasksHandler()` - factory functions, not inline objects
- Register in `composedDataProvider.ts`

DON'T:
- Recreate monolithic `unifiedDataProvider.ts` - it's dead
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

## Error Handling

DO:
- Wrap all handlers with `withErrorLogging` (outermost)
- Return success if record already deleted (idempotency)

DON'T:
- Use `console.log` or `console.error` - wrapper handles Sentry

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
