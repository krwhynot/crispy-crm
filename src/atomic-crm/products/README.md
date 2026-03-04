# Products Module

F&B product catalog for Crispy CRM. Manages the SKU line card for each Principal (manufacturer), tracks distributor coverage via a junction table, and links products to Opportunities so sales reps can record which items are being introduced to a prospect. Admins and Managers use this module to maintain the "what" in the sales process — category, status, certifications, allergens, and which distributors carry each product.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium |
| Phase | 2 |
| Test Project | `__tests__/` (8 test files — partial coverage) |
| Dependents | 0 internal consumers (leaf module) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `ProductList.tsx` | List view with `PremiumDatagrid`, keyboard navigation, and slide-over integration |
| `ProductCreate.tsx` | Create form with `FormProgressBar` and `onBlur` validation mode |
| `ProductEdit.tsx` | Tabbed edit form; pessimistic mutation; cache invalidation on save |
| `ProductShow.tsx` | Read-only detail view |
| `ProductSlideOver.tsx` | 40vw slide-over for quick view/edit from the list |
| `ProductInputs.tsx` | Shared tabbed form inputs (Details tab + Distribution tab) |
| `ProductDetailsInputTab.tsx` | Name, principal, category, status, description fields |
| `ProductDistributionTab.tsx` | Distributor multi-select with vendor item number fields |
| `ProductDistributorInput.tsx` | Individual distributor row input component |
| `ProductCard.tsx` | Card representation used in card-grid view variants |
| `ProductListFilter.tsx` | Filter sidebar for the list view |
| `ProductsDatagridHeader.tsx` | Sortable/filterable column header components |
| `constants.ts` | `PRODUCT_STATUS_CHOICES` derived from Zod enum (DOM-006) |
| `productFilterConfig.ts` | Filter configuration passed to `ListPageLayout` |
| `resource.tsx` | React Admin resource config; all views are lazy-loaded with error boundaries |

## Dependencies

### Internal Modules
- `src/atomic-crm/constants/` — app-wide constants
- `src/atomic-crm/queryKeys.ts` — TanStack Query key factory
- `src/atomic-crm/utils/` — shared utilities (`ucFirst`, `formatFieldLabel`)
- `src/atomic-crm/validation/` — Zod schemas (`productSchema`, `productStatusSchema`, `FB_CONSUMABLE_CATEGORIES`)

### Key npm Packages
- `react-admin` `^5.10.0` — resource CRUD, data hooks
- `react-hook-form` `^7.66.1` — form state (`onBlur` mode)
- `zod` `^4.1.12` — schema validation at API boundary
- `ra-core` `^5.10.0` — `useGetIdentity`, `CreateBase`, `Form`

### External Integrations
None specific to this module. All DB access goes through `composedDataProvider` via `productsHandler`.

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Product Catalog | Products | 0.90 |
| Product Distributor Assignments | ProductDistributors | 0.95 |

## Common Modification Patterns

New product fields are added in three places in sequence: the Zod schema at `src/atomic-crm/validation/products.ts`, the form inputs in `ProductDetailsInputTab.tsx` or `ProductDistributionTab.tsx`, and the provider handler at `src/atomic-crm/providers/supabase/handlers/productsHandler.ts` (to strip computed fields before write). Distributor linking uses the `create_product_with_distributors` RPC on create and `ProductsService.updateWithDistributors()` on update — do not bypass these paths with direct table writes. After any schema change, run the relevant `__tests__/` suite plus `npx tsc --noEmit` to catch type regressions in the 91-dependent `validation` module.

## Guardrails

- `src/atomic-crm/providers/supabase/handlers/productsHandler.ts` — handler routing hub; changes affect all product CRUD operations. Requires human review per CLAUDE.md Caution Zones (`composedDataProvider.ts`).
- `src/atomic-crm/providers/supabase/composedDataProvider.ts` — god class registering `productsHandler`; modify only with a tech lead review.
- `src/atomic-crm/validation/products.ts` — source of truth for TypeScript types via `z.infer`; 91 downstream dependents mean schema changes cascade broadly.
- `supabase/migrations/` — the `create_product_with_distributors` RPC and `product_distributors` RLS policies live here; production schema changes require `npx supabase db push --dry-run` before push (Caution Zone per CLAUDE.md).
- Junction table `product_distributors` — RLS must validate both FK sides per DB-008. Confirm with `CMD-006` after any policy change.

## Related

- BRD: `docs/brd/products.md`
- ProductDistributors module: `src/atomic-crm/productDistributors/`
- Validation schemas: `src/atomic-crm/validation/products.ts`
- Provider handler: `src/atomic-crm/providers/supabase/handlers/productsHandler.ts`
- Service layer: `src/atomic-crm/services/products.service.ts`
