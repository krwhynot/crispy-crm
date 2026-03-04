# Notes Module

Free-text note management for Crispy CRM. Notes are embedded components consumed by contacts, opportunities, and organizations — they have no standalone routes or list pages. Sales reps use notes to capture context against any CRM record, with inline editing and an optional date/time override.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Low |
| Phase | 1 |
| Test Project | None |
| Dependents | 7 modules (contacts, opportunities, organizations, timeline, and others) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `NotesIterator.tsx` | Primary entry point — combines `NoteCreate` + `NotesList` for embedding in parent slide-overs |
| `NoteCreate.tsx` | Create form using `CreateBase`; injects FK (`contact_id`, `opportunity_id`, `organization_id`) and `sales_id` on submit |
| `NotesList.tsx` | Reads from `ListContext`; renders `Note` rows with separators and optional empty state |
| `Note.tsx` | Single note display with hover-revealed edit/delete actions and inline `useUpdate` editing |
| `NoteInputs.tsx` | Shared form fields: multiline text input and expandable date/time picker |
| `utils.ts` | `getCurrentDate` and `formatNoteDate` helpers for ISO timestamp normalisation |

## Architecture

Notes are **not** standalone React Admin resources. They are always embedded inside a parent resource (contact, opportunity, or organization) via `ReferenceManyField`. There is no `NoteEdit.tsx` — editing is handled inline inside `Note.tsx` with local `isEditing` state and `useUpdate`.

The `reference` prop on `NoteCreate` and `NotesIterator` determines which FK column is injected at save time:

```
contacts      → contact_id
opportunities → opportunity_id
organizations → organization_id
```

Cache invalidation after edits and deletes is targeted: only the specific parent entity's query keys are invalidated, using `contactNoteKeys`, `opportunityNoteKeys`, or `organizationNoteKeys` from `src/atomic-crm/queryKeys.ts`.

## Dependencies

### Internal Modules
- `src/atomic-crm/constants/` — `notificationMessages`
- `src/atomic-crm/validation/notes.ts` — Zod schemas (`noteFormSchema`, `baseNoteSchema`, and per-parent variants)
- `src/atomic-crm/queryKeys.ts` — query key factories for targeted cache invalidation

### npm Packages
- `ra-core` ^5.10.0 — `CreateBase`, `Form`, `useUpdate`, `useDelete`, `useListContext`
- `react-hook-form` ^7.66.1 — `useFormContext`, `useFormState`
- `zod` ^4.1.12 — schema validation and type inference
- `dompurify` ^3.2.7 — HTML sanitisation applied in `notes.ts` via `sanitizeHtml`
- `@tanstack/react-query` ^5.85.9 — `useQueryClient` for targeted invalidation

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Notes | Notes | 0.90 |

## Common Modification Patterns

When adding a new parent resource type (e.g., `products`), add the FK key to the `foreignKeyMapping` object in `NoteCreate.tsx`, extend the `reference` union type on `NoteCreate` and `NotesIterator`, and add a new branch to `invalidateParentCache` in `Note.tsx`. Validation schemas live in `src/atomic-crm/validation/notes.ts` — add a new `*NoteSchema` variant there following the existing `extend` pattern, then register it in `ValidationService`.

After any change, verify that inline edit (`Note.tsx`), create (`NoteCreate.tsx`), and delete (undoable via `useDelete`) still work on at least one parent resource type.

## Guardrails

- `dompurify` sanitisation is applied in `src/atomic-crm/validation/notes.ts` via the `sanitizeHtml` transform on `text`. Any change to sanitisation logic requires human review — misconfiguration allows XSS across all note-bearing record types.
- Notes share RLS policies with their parent resources (`contactNotes`, `opportunityNotes`, `organizationNotes` virtual resources in `composedDataProvider.ts`). RLS changes to parent tables affect note visibility.
- No dedicated test files exist for this module. The XSS boundary (`sanitizeHtml` + `dompurify`) is the highest-risk area and should be the first target for new tests.

## Related

- Full audit report: `docs/audit/baseline/risk-assessment.json` (module: `notes`)
- Validation schemas: `src/atomic-crm/validation/notes.ts`
- Provider handler: `src/atomic-crm/providers/supabase/composedDataProvider.ts` (resources `contactNotes`, `opportunityNotes`, `organizationNotes`)
- Timeline: `src/atomic-crm/timeline/` (reads notes alongside activities)
