# Sales Module

CRM user management for Crispy CRM. A "sales" record is the CRM user profile that maps 1:1 to a Supabase Auth account. Every contact, opportunity, activity, and task in the system is owned by a sales user via foreign key. Admins use this module to invite team members, assign roles, manage access, and disable users while preserving historical attribution.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium |
| Phase | 2 |
| Churn | 17 commits in 14 days — above CI/CD threshold for 3 consecutive audits |
| DB Table | `sales` |
| Dependents | None (leaf module) |

## Key Components

| File | Purpose |
|------|---------|
| `SalesList.tsx` | List view with `PremiumDatagrid`, slide-over, and sidebar filter |
| `SalesCreate.tsx` | Create form — triggers Edge Function to provision Supabase Auth user |
| `SalesEdit.tsx` | Standalone edit form using `SalesService.salesUpdate()` via TanStack Mutation |
| `SalesSlideOver.tsx` | 40vw slide-over panel with tabbed view/edit |
| `SalesPermissionsTab.tsx` | Role selector, disabled toggle, admin password reset, danger zone — active hotspot |
| `SalesGeneralTab.tsx` | Profile fields: name, email, phone, avatar |
| `SalesProfileTab.tsx` | Additional profile display |
| `UserDisableReassignDialog.tsx` | Wizard that counts and batch-reassigns owned records before disabling a user |
| `SalesInputs.tsx` | Shared form inputs for create and edit |
| `salesFilterConfig.ts` | Filter configuration for the list sidebar |
| `resource.tsx` | React Admin resource registration |

## Architecture

- **20 files, 3.2K LOC** — smallest standalone feature module
- **All writes route through the `users` Edge Function** — `SalesService.salesUpdate()` calls `PATCH /users`; create calls `POST /users`. Direct table writes are not used for mutations. Source: `src/atomic-crm/services/sales.service.ts`
- **Soft-disable, not hard-delete** — "removing" a user sets `disabled: true` via `withSkipDelete`. The row and all historical FK attribution are preserved. The `deleted_at` field marks tombstoned rows
- **Re-invite by email match** — if a prior sales row with a matching email exists (with `user_id = NULL`), the Edge Function restores it instead of creating a duplicate
- **Computed field stripping** — `administrator` is computed by DB trigger from `role`; it is listed in `COMPUTED_FIELDS` and stripped before every write. Source: `src/atomic-crm/providers/supabase/callbacks/salesCallbacks.ts`
- **Identity cache invalidation** — when role changes, `invalidateIdentityCache()` is called so the current user's permissions update without a page reload

## Data Flow

- DB table: `sales`
- Provider handler: `src/atomic-crm/providers/supabase/handlers/salesHandler.ts`
- Service layer: `src/atomic-crm/services/sales.service.ts`
- Validation: `src/atomic-crm/validation/sales.ts` — `salesSchema`, `createSalesSchema`, `updateSalesSchema`, `salesPermissionsSchema`
- Wrapper chain: `customHandler → withValidation → withSkipDelete → withLifecycleCallbacks → withErrorLogging`

## Roles and Permissions

| Role | Access |
|------|--------|
| `admin` | Full system access; can manage users, see all data |
| `manager` | All data; cannot manage users |
| `rep` | Own data only |

- Writes are Admin-only (RLS + Edge Function gate)
- `SalesPermissionsTab` blocks self-edit of own role or disabled status

## Disable / Reassign Flow

Disabling a user with owned records triggers `UserDisableReassignDialog`:

1. Fetches counts of opportunities, contacts, organizations, and tasks owned by the user
2. If none — allows direct disable
3. If records exist — requires selecting a target user for bulk reassignment
4. Reassigns all records in batches of 50 via `dataProvider.update()`
5. Disables the user and invalidates all affected query caches

This prevents "dead revenue" — opportunities owned by an inaccessible `sales_id`.

## Common Modification Patterns

Role and permission changes go in `SalesPermissionsTab.tsx` and `src/atomic-crm/validation/sales.ts`. When adding a new field, add it to the Zod schema first, then to `SalesInputs.tsx`; confirm the field is stripped in `salesCallbacks.ts` if it is computed or view-only. After any change to `SalesPermissionsTab.tsx`, run the three test files under `__tests__/` and manually verify the disable/reassign flow on a staging account — the dialog depends on four concurrent `getList` calls and is not covered by unit tests.

## Testing

| File | Covers |
|------|--------|
| `__tests__/SalesList.render.test.tsx` | List rendering |
| `__tests__/SalesCreate.test.tsx` | Create form |
| `__tests__/SalesEdit.test.tsx` | Edit form |

`UserDisableReassignDialog` and `SalesPermissionsTab` have no dedicated unit tests. Manual QA on staging is required for the disable/reassign flow.

## Guardrails

- `SalesPermissionsTab.tsx` — active hotspot; any change requires running all three test files and verifying the disable flow manually
- `UserDisableReassignDialog.tsx` — high-consequence; reassigns records across four resource types; verify abort/cancel path on slow connections
- `src/atomic-crm/services/sales.service.ts` — all mutations call the Edge Function; changes here affect user provisioning in production
- `src/atomic-crm/providers/supabase/callbacks/salesCallbacks.ts` — `COMPUTED_FIELDS` list must stay in sync with any new view-only columns added to the `sales` table
- RLS on the `sales` table restricts writes to `admin` role; changes require `CMD-006` policy audit

## Related

- BRD: `docs/brd/sales.md`
- Edge Function: `supabase/functions/users/index.ts`
- Auth provider: `src/atomic-crm/providers/supabase/authProvider.ts`
- Validation: `src/atomic-crm/validation/sales.ts`
- Full audit report: `docs/audit/baseline/risk-assessment.json`
