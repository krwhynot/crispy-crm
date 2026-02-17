# Feature Module Overlay

Scope: feature-module file layout and UI/data access conventions for `src/atomic-crm/*` resources.

## Applies

- `CORE-001`, `CORE-008`, `CORE-010`, `CORE-016`, `CORE-017`

## Module Rules

- [MOD-001] Resource modules keep standard files (`index.tsx`, `List`, `Create`, `Edit`, `Show`, and shared `Inputs`).
- [MOD-002] Do not create nested `utils/` or `components/` folders inside feature modules; move reusable helpers to shared directories.
- [MOD-003] Feature data access must use React Admin/provider hooks, not direct Supabase imports.
- [MOD-004] List/getMany reads follow provider summary-resource mapping; writes route through base resources.
- [MOD-005] Forms use `mode="onSubmit"` or `mode="onBlur"`; avoid large inline `validate` blocks.
- [MOD-006] Reusable form controls live in `[Entity]Inputs.tsx`.
- [MOD-007] Use Tier 2 wrappers for admin UI; move business logic to hooks/services.
- [MOD-008] Module styling uses semantic tokens and 44px minimum interactive targets.
- [MOD-009] Use standard `DeleteButton` for soft-delete resources unless a documented exception exists.
- [MOD-010] Remove unused imports during module edits.

## Checklist IDs

- `MOD-001`
- `MOD-002`
- `MOD-003`
- `MOD-004`
- `MOD-005`
- `MOD-006`
- `MOD-007`
- `MOD-008`
- `MOD-009`
- `MOD-010`
