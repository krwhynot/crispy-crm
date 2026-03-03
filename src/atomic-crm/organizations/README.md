# Organizations Module

Company/organization management for Crispy CRM. Handles Principals (manufacturers), Distributors, and Operators (restaurants) in the MFB broker model.

## Key Components

| File | Purpose |
|------|---------|
| `OrganizationList.tsx` | List view with PremiumDatagrid, card grid toggle, slide-over |
| `OrganizationCreate.tsx` | Create form with duplicate detection |
| `OrganizationEdit.tsx` | Tabbed edit form (details, contacts, authorizations, activities) |
| `OrganizationShow.tsx` | Read-only show view |
| `OrganizationSlideOver.tsx` | 40vw slide-over panel for quick view/edit |
| `resource.tsx` | React Admin resource config with error boundaries |

## Architecture

- **73 files** — largest feature module in the codebase
- **Hierarchy support**: Parent/child organizations via `ParentOrganizationInput`, `BranchLocationsSection`
- **Authorization tracking**: `AuthorizationsTab`, `AuthorizationCard` — tracks distributor product authorizations
- **Duplicate detection**: `DuplicateOrgWarningDialog` warns on similar names during create
- **View modes**: List (datagrid) and Card grid views with `OrganizationViewSwitcher`
- **CSV export**: `csvConstants.ts` defines export column mappings
- **Badges**: `OrganizationTypeBadge` (Principal/Distributor/Operator), `PriorityBadge` (A/B/C)

## Data Flow

- DB table: `organizations` (with summary view for list reads)
- Junction: `contact_organizations` links contacts to orgs (NOT deprecated `company_id`)
- Provider handler: `src/atomic-crm/providers/supabase/handlers/organizationsHandler.ts`
- Validation: `src/atomic-crm/validation/organizations.ts`

## Testing

- `__tests__/OrganizationList.render.test.tsx` — rendering, empty states, view switching
- `__tests__/OrganizationList.test-utils.ts` — shared mock factories

## Related

- BRD: `docs/brd/organizations.md`
- Contacts module (linked via junction table)
- Product Distributors module (authorization tracking)
