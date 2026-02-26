# Domain Integrity Overlay

Scope: entity schemas, derived types, update contracts, and typed testing boundaries.

## Applies

- `CORE-003`, `CORE-004`, `CORE-005`, `CORE-006`, `CORE-007`

## Domain Rules

- [DOM-001] Each entity keeps canonical schema definitions in `src/atomic-crm/validation/[entity].ts`.
- [DOM-002] Validation schemas must match database columns and expected nullability/shape.
- [DOM-003] Export domain types from `z.infer<typeof schema>`; avoid parallel manual interfaces.
- [DOM-004] Create schemas default to strict unknown-key rejection.
- [DOM-005] Update schemas must document one strategy: strict+round-trip coverage, or passthrough+explicit sanitize.
- [DOM-006] Domain enums/status strings must be centralized in module constants.
- [DOM-007] Coerce form-originated scalar values at schema boundaries (for example `z.coerce.number()`).
- [DOM-008] Replace unsafe casts with type guards or constrained generics.
- [DOM-009] React Admin hook mocks must use typed factories from `src/tests/utils/typed-mocks.ts`.
- [DOM-010] Each persisted business table must map to at least one canonical `z.object` schema.
- [DOM-011] Form defaults should be schema-derived (`schema.partial().parse({})`) to reduce drift.

## Canonical Risk Stub (Update Contract)

```ts
// Required: pick one explicit update strategy
const updateSchema = entityBaseSchema.passthrough();
// ...then sanitize/whitelist before DB write
```

## Checklist IDs

- `DOM-001`
- `DOM-002`
- `DOM-003`
- `DOM-004`
- `DOM-005`
- `DOM-006`
- `DOM-007`
- `DOM-008`
- `DOM-009`
- `DOM-010`
- `DOM-011`
