---
globs: ["src/**/*.ts", "src/**/*.tsx"]
---

# Code Quality Overlay

Scope: production cleanliness, type safety hygiene, React Admin resolver discipline, and accessibility enforcement for application code.

## Applies

- `CORE-002`, `CORE-003`, `CORE-004`, `CORE-014`, `CORE-015`, `CORE-016`, `CORE-017`, `CORE-018`, `CORE-019`, `CORE-021`, `CORE-022`

## Overlay Notes

- Quality checks in this file are references to canonical core constraints; no duplicate normative text lives here.
- Use `DOM-*` rules for schema/type specifics and `UI-*` rules for tier/wrapper implementation details.

## Canonical Risk Stub (Resolver)

```tsx
// Avoid this in React Admin forms
resolver={zodResolver(mySchema)}

// Required pattern
resolver={createFormResolver(mySchema)}
```

## Command IDs

- Pre-commit gate: `CMD-001`, `CMD-002`, `CMD-003`, `CMD-004`, `CMD-005`
- Datagrid audit: `CMD-007`

## Checklist IDs

- `CORE-002`
- `CORE-003`
- `CORE-004`
- `CORE-014`
- `CORE-015`
- `CORE-016`
- `CORE-017`
- `CORE-018`
- `CORE-019`
- `CORE-021`
- `CORE-022`
