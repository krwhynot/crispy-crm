# ADR-001: Supabase Provider Composition Pattern

**Status:** Accepted
**Date:** 2025-10-01
**Deciders:** Engineering team

## Context

The CRM needs a data access layer that integrates React Admin with Supabase while supporting per-resource customization (validation, soft delete, error handling, computed field stripping). The standard `ra-supabase` data provider handles basic CRUD but doesn't accommodate resource-specific business logic.

## Decision

Adopt a **composed data provider** pattern where each resource gets a dedicated handler factory (`create{Resource}Handler`) that wraps the base Supabase provider with a standard chain of middleware:

```
baseProvider -> withValidation -> withSkipDelete -> withLifecycleCallbacks -> withErrorLogging
```

All handlers are registered in `composedDataProvider.ts`, which routes requests by resource name. This replaces a monolithic provider with per-resource composition.

## Consequences

### Positive

- Each resource's behavior is isolated and testable in its handler file
- Adding a new resource is mechanical: create handler, register in composedDataProvider
- Middleware order is explicit and consistent across resources
- Error handling is centralized at the outermost wrapper

### Negative

- More files per resource (handler + callbacks + service)
- Wrapper chain ordering is critical — wrong order causes subtle bugs (e.g., validation before computed field stripping)
- Debugging requires understanding which wrapper modifies the request at each layer

### Neutral

- `composedDataProvider.ts` becomes a routing hub — changes to it affect all resources

## Alternatives Considered

### Option A: Monolithic Provider with Switch Statements

One large provider with `switch(resource)` blocks. Rejected: poor separation of concerns, hard to test, grows unbounded.

### Option B: react-admin withLifecycleCallbacks Only

Use React Admin's built-in callback system without additional wrappers. Rejected: doesn't support Zod validation at API boundary or structured error logging.

## References

- `src/atomic-crm/providers/supabase/composedDataProvider.ts`
- `src/atomic-crm/providers/supabase/wrappers/`
- `.claude/rules/PROVIDER_RULES.md` (PRV-001 through PRV-014)
