# Contacts Module

Sales contact management for Crispy CRM. Handles contact CRUD, CSV import/export, organization linking, and activity tracking.

## Key Components

| File | Purpose |
|------|---------|
| `ContactList.tsx` | List view with PremiumDatagrid and slide-over |
| `ContactCreate.tsx` | Create form |
| `ContactEdit.tsx` | Tabbed edit form |
| `ContactSlideOver.tsx` | 40vw slide-over panel |
| `contactImport.logic.ts` | CSV import pipeline (papaparse) |
| `contactExporter.ts` | CSV/Excel export logic |
| `resource.tsx` | React Admin resource config with error boundaries |

## Architecture

- **64 files** — second largest feature module
- **CSV import/export**: Full pipeline with `papaparse` — `contactImport.helpers.ts`, `contactImport.logic.ts`, `ContactImportDialog.tsx`, `ContactExportTemplateButton.tsx`
- **Hierarchy**: `ContactHierarchyBreadcrumb` for parent org navigation
- **Compact form**: `ContactCompactForm.tsx` for inline/quick-add scenarios
- **Column aliases**: `columnAliases.ts` maps DB columns to display names
- **Badges**: `ContactBadges.tsx` for status/type indicators
- **Bulk operations**: `ContactBulkActionsToolbar.tsx`, `ContactBulkDeleteButton.tsx`

## Data Flow

- DB table: `contacts` (with summary view for list reads)
- Junction: `contact_organizations` links contacts to organizations
- **Important**: `Contact.company_id` is DEPRECATED — use `contact_organizations` junction
- Provider handler: `src/atomic-crm/providers/supabase/handlers/contactsHandler.ts`
- Validation: `src/atomic-crm/validation/contacts.ts`

## Testing

- `__tests__/ContactList.render.test.tsx` — list rendering tests
- `__tests__/contactImport.logic.test.ts` — CSV import unit tests

## Related

- BRD: `docs/brd/contacts.md`
- Organizations module (linked via junction table)
- Activities module (activity logging per contact)
