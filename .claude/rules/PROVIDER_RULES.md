---
globs: ["src/atomic-crm/providers/**"]
---

# Provider Rules Overlay

Scope: composed Supabase provider handlers, validation/lifecycle wrappers, storage side-effects, and hierarchy safeguards.

## Applies

- `CORE-001`, `CORE-007`, `CORE-008`, `CORE-009`, `CORE-010`, `CORE-012`, `CORE-013`, `CORE-019`

## Provider Rules

- [PRV-001] Every resource uses `handlers/[resource]Handler.ts` and is registered in `composedDataProvider.ts`.
- [PRV-002] Provider callbacks define and strip `COMPUTED_FIELDS`; list reads follow summary mapping while writes target base tables.
- [PRV-003] Resource schemas are registered in `ValidationService` and enforced by `withValidation` before writes.
- [PRV-004] Wrapper composition keeps error logging outermost and preserves sanitize/validate callback order.
- [PRV-005] Edit round-trip contract (`getOne -> defaults -> resolver -> update`) must stay valid; each resource keeps a save-path guard test.
- [PRV-006] Handlers do transport/plumbing only; business workflows live in service-layer methods.
- [PRV-007] Storage operations run through `StorageService`, validate MIME allowlists, and remove orphaned files on downstream failures.
- [PRV-008] Private assets use signed URLs; raw `File` objects do not leak beyond handler boundary.
- [PRV-009] Soft-delete resources set `supportsSoftDelete: true` and route deletes through `withSkipDelete` semantics.
- [PRV-010] Side-effects use explicit error handling and structured logging; no silent failures.
- [PRV-011] Non-critical external side-effects (email/storage cleanup/webhooks) cannot block critical DB transactions.
- [PRV-012] Self-referential selectors exclude current record IDs and prevent obvious hierarchy cycles.
- [PRV-013] Self-referential tables must enforce `id != parent_id` with a DB constraint.
- [PRV-014] Async provider operations are either awaited or explicitly fire-and-forget with `.catch` logging.

## Canonical Risk Stub (Wrapper Order)

```ts
return withErrorLogging(
  withLifecycleCallbacks(
    withValidation(baseProvider),
    [callbacks]
  )
);
```

## Checklist IDs

- `PRV-001`
- `PRV-002`
- `PRV-003`
- `PRV-004`
- `PRV-005`
- `PRV-006`
- `PRV-007`
- `PRV-008`
- `PRV-009`
- `PRV-010`
- `PRV-011`
- `PRV-012`
- `PRV-013`
- `PRV-014`
