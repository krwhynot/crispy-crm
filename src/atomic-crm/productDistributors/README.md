# ProductDistributors Module

Junction table management linking products to distributors, surfaced in the UI as "DOT Numbers". Admins and managers use this module to record which distributor carries which product, including the vendor item number (DOT/Sysco/USF reference), validity window, and authorization status. It is a Phase 2 module with medium risk and 11 fan-in dependents despite being only 626 LOC.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium (score 4/10) |
| Phase | 2 |
| DB Table | `product_distributors` |
| Dependents | 11 (fan-in) |
| Test Project | `__tests__/ProductDistributorList.test.tsx` (partial, added this audit cycle) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `ProductDistributorList.tsx` | List view with `PremiumDatagrid`, DOT number search, and filter sidebar |
| `ProductDistributorCreate.tsx` | Create form with `ReferenceInput` selectors for product and distributor |
| `ProductDistributorEdit.tsx` | Edit form; `product_id` and `distributor_id` are read-only after creation |
| `ProductDistributorShow.tsx` | Read-only show view |
| `ProductDistributorInputs.tsx` | Shared form fields: DOT number, status, valid from/to, notes |
| `ProductDistributorListFilter.tsx` | Filter sidebar for the list view |
| `constants.ts` | `PRODUCT_DISTRIBUTOR_STATUS_CHOICES`: `pending`, `active`, `inactive` |
| `productDistributorsConfig.ts` | React Admin resource config (icon, label "DOT Numbers") |
| `productDistributorFilterConfig.ts` | Filter field definitions for `ListPageLayout` |
| `resource.tsx` | Lazy-loaded views wrapped in `ResourceErrorBoundary` |

## Dependencies

### Internal Modules
- `src/atomic-crm/utils/` — `autocompleteDefaults` helpers
- `src/atomic-crm/validation/productDistributors.ts` — Zod schema; `productDistributorSchema` drives create form defaults

### npm Packages
- `react-admin ^5.10.0` — `List`, `TextField`, `DateField`, `SelectField`, `CreateBase`, `Form`
- `ra-core ^5.10.0` — `CreateBase`, `Form`
- `react-hook-form ^7.66.1` — `useFormState` for inline error summary
- `lucide-react ^0.542.0` — `Package` icon

### External Integrations
None specific to this module. All DB access goes through `composedDataProvider.ts` via `productDistributorsHandler.ts`.

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Product Distributor Assignments | ProductDistributors | 0.95 |

## Common Modification Patterns

To add a new field: add a column to the `product_distributors` migration, extend `src/atomic-crm/validation/productDistributors.ts`, then add the corresponding input to `ProductDistributorInputs.tsx`. The `product_id` and `distributor_id` FK fields are intentionally excluded from `ProductDistributorInputs` — they are handled separately in Create (editable `ReferenceInput`) and Edit (read-only `ReferenceField`). The list reads from a summary view via the handler to avoid N+1 queries; use denormalized fields such as `product_name` and `distributor_name` instead of reference lookups in `PremiumDatagrid`. After any schema change run `npx tsc --noEmit` and the handler test suite (`productDistributorsHandler.test.ts`).

## Guardrails

- **DB-008** — RLS policies on `product_distributors` must validate authorization for both the `product_id` FK and the `distributor_id` FK. Permissive junction policies (`USING (true)`) are banned per DB-007.
- **DB-009** — Both FK columns must be backed by indexes to avoid full-table scans in junction policy checks.
- **Phase 2 entry criteria** — RLS policy audit (`CMD-006`) is required before merging any migration touching this table. See `docs/audit/baseline/risk-assessment.json` for full phase exit criteria.
- **composedDataProvider.ts** is a Caution Zone; register handler changes there only after verifying the handler in isolation.

## Related

- Provider handler: `src/atomic-crm/providers/supabase/handlers/productDistributorsHandler.ts`
- Validation schema: `src/atomic-crm/validation/productDistributors.ts`
- Service layer: `src/atomic-crm/services/productDistributors.service.ts`
- Full audit report: `docs/audit/baseline/risk-assessment.json` (module: `productDistributors`)
- Products module: `src/atomic-crm/products/`
- Organizations module (distributors): `src/atomic-crm/organizations/`
