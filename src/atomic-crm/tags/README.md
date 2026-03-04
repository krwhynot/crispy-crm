# Tags Module

Tagging system for Crispy CRM. Provides full CRUD management of tags (id, name, color) and
embeddable components for linking tags to contacts, opportunities, and organizations inline.
Tags are intentionally simple lookup entities with no relationships of their own.

## Key Components

| File | Purpose |
|------|---------|
| `TagList.tsx` | Admin list view for managing all tags |
| `TagCreate.tsx` | Create form |
| `TagEdit.tsx` | Edit form |
| `TagInputs.tsx` | Shared form field group (name + color picker) |
| `TagChip.tsx` | Inline display chip with unlink button and click-to-edit via `TagEditModal` |
| `TagSelectWithCreate.tsx` | Searchable select with "Create new tag" dialog footer (Pattern F) |
| `TagQuickInput.tsx` | Searchable select with inline quick-create by name only, default color `warm` (Pattern E) |
| `TagDialog.tsx` | Reusable dialog for name + color creation/editing |
| `TagCreateModal.tsx` | Modal wrapper for tag creation |
| `TagEditModal.tsx` | Modal wrapper for tag editing, opened from `TagChip` |
| `tag-colors.ts` | `getTagColorClass()` — maps color keys to Tailwind semantic classes |
| `colors.ts` | Available color options for the color picker |
| `types.ts` | `Tag` type (id, name, color) |
| `resource.tsx` | React Admin resource config; `TagShow` intentionally omitted (see `index.tsx`) |

## Architecture

- **18 files, 932 LOC** — small, isolated module with zero fan-in from other atomic-crm modules
- **No `TagShow`**: tags have no related entities to display; `rowClick="edit"` sends users directly to the edit form
- **Two embed patterns**: `TagSelectWithCreate` (full dialog, name + color) vs `TagQuickInput` (inline quick-create, name only, defaults to `warm` color)
- **`TagChip`** is the read surface: click opens `TagEditModal`, X button calls an `onUnlink` callback
- **Color system**: centralized in `tag-colors.ts` and `colors.ts`; semantic Tailwind tokens only — no hardcoded hex

## Data Flow

- DB table: `tags`
- Provider handler: `src/atomic-crm/providers/supabase/handlers/tagsHandler.ts`
- Validation schema: `src/atomic-crm/validation/tags.ts`
- Query keys: `src/atomic-crm/queryKeys.ts` (consumed by this module for cache invalidation)
- All writes go through `composedDataProvider.ts` — do not import Supabase directly

## Dependencies

### Internal Modules
- `components` — shared atomic-crm component primitives
- `constants` — `notificationMessages` and other shared constants
- `hooks` — `useSafeNotify`
- `queryKeys` — TanStack Query key factories

### npm Packages (inherited from app)
- `react-admin ^5.10.0` — `ReferenceInput`, `useCreate`, `useRefresh`
- `lucide-react ^0.542.0` — `PlusIcon`, `X`
- `zod ^4.1.12` — validation schema

## Testing

- `__tests__/TagList.test.tsx` — list rendering (partial coverage)
- Provider handler tests: `src/atomic-crm/providers/supabase/handlers/__tests__/tagsHandler.test.ts`

## Common Modification Patterns

To add a new tag field, update `TagInputs.tsx` first (shared field group), then reflect the change
in the Zod schema at `src/atomic-crm/validation/tags.ts` and the handler at
`handlers/tagsHandler.ts`. New color options belong in `colors.ts` with a corresponding mapping
added to `tag-colors.ts`. Run `npx tsc --noEmit` and `npm run lint` before marking any change
complete (phase 1 exit criteria).

## Guardrails

- **Low risk, Phase 1** — safe to modify freely per `docs/audit/baseline/risk-assessment.json`
- `TagChip`'s `onUnlink` callback must remain async and callers are responsible for query invalidation
- Tag color values are an allowlist; adding values requires updating both `colors.ts` and `tag-colors.ts` together
- Do not add direct Supabase imports — all data access routes through `composedDataProvider.ts`

## Related

- Full audit report: `docs/audit/baseline/`
- Risk assessment: `docs/audit/baseline/risk-assessment.json` (`tags` entry, risk_score: 3)
