# UI Standards Overlay

Scope: three-tier component boundaries, wrapper hygiene, and accessible UI composition.

## Applies

- `CORE-001`, `CORE-014`, `CORE-015`, `CORE-016`, `CORE-017`

## UI Rules

- [UI-001] Tier 1 (`src/components/ui`) remains presentational only; no `react-admin` or Supabase imports, and no business logic.
- [UI-002] Tier 2 (`src/components/ra-wrappers`) owns React Admin integration, including `useInput` wiring and RA prop compatibility.
- [UI-003] Dialog/modal wrappers include required title landmarks (`DialogTitle`/equivalent), visible or `sr-only`.
- [UI-004] Wrapper components must destructure custom library props before spreading to DOM elements.
- [UI-005] File uploads use wrapper components with client-side validation, user feedback, and progress/preview behavior.
- [UI-006] Global styling uses CSS variables and semantic tokens; avoid hardcoded hex colors and magic spacing values.
- [UI-007] Feature pages should consume Tier 2 wrappers for repeated patterns instead of rebuilding raw Tier 1 compositions.
- [UI-008] UI architecture audits use `CMD-007` for Datagrid violations and component-boundary spot checks.

## Canonical Risk Stub (Prop Hygiene)

```tsx
// required shape
const Row = ({ rowClassName, record, ...domProps }) => (
  <tr className={rowClassName} {...domProps} />
);
```

## Checklist IDs

- `UI-001`
- `UI-002`
- `UI-003`
- `UI-004`
- `UI-005`
- `UI-006`
- `UI-007`
- `UI-008`
