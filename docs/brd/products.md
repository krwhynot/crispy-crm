# BRD: Products

**Status:** Draft | **Last Updated:** 2026-03-03 | **Source:** Zod schemas, handler logic, UI components

---

## 1. Domain Overview

Products represent the F&B consumable items that Principals (manufacturers) bring to market through Distributors. Each product belongs to exactly one Principal and is categorized within a defined set of food and beverage consumable types. Products serve as the linkage between a Principal's line card and the Distributor network that carries those products.

**Business role:** Track the "what" in the sales process. A product's category, status, and distributor coverage tell sales reps which items are available, who carries them, and what certifications or allergen information needs to be communicated to Operators (restaurants). Products are referenced on Opportunities to track which items are being introduced to a prospect.

---

## 2. Schema Fields

### Core Identity

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `id` | number | auto-increment | No |
| `name` | string | trim, min 1, max 255 | Yes |
| `principal_id` | number | int, positive, FK to organizations | Yes |
| `category` | string | trim, min 1, max 100; free-text with suggested values | Yes (defaults to `beverages`) |
| `status` | enum | `active` \| `discontinued` \| `coming_soon` | No (defaults to `active`) |
| `description` | string | trim, max 2000 | No |
| `manufacturer_part_number` | string | max 100 | No |
| `marketing_description` | string | trim, max 2000 | No |

### Food and Health

| Field | Type | Constraints |
|-------|------|-------------|
| `certifications` | string[] | max 50 entries, each max 100 chars |
| `allergens` | string[] | max 50 entries, each max 100 chars |
| `ingredients` | string | trim, max 5000 |
| `nutritional_info` | record | keys max 50 chars; values string (max 100) or number |

### Distributor Fields (Transient - Form Only)

These fields are accepted at the API boundary and processed by `productsHandler` before the DB write. They are not stored directly on the `products` table.

| Field | Type | Notes |
|-------|------|-------|
| `distributor_ids` | number[] | max 100; IDs of distributor orgs carrying this product |
| `product_distributors` | record | keyed by distributor ID; value: `{ vendor_item_number: string \| null }` |

### System Fields

| Field | Type | Notes |
|-------|------|-------|
| `created_by` / `updated_by` | number | FK to sales (audit) |
| `created_at` / `updated_at` | string | DB-managed timestamps |
| `deleted_at` | string | Soft delete marker |

### Computed (View-Only, from `products_summary`)

`principal_name` — joined from organizations table; stripped before DB writes by `productsCallbacks`.

---

## 3. Business Rules

1. **Principal required** — `principal_id` is required on create; every product must have an owning manufacturer. Source: `src/atomic-crm/validation/products.ts`, `productSchema`.
2. **Name required** — `name` required on create (min 1, max 255). Source: `src/atomic-crm/validation/products.ts`, `productSchema`.
3. **Category required** — `category` is required; defaults to `beverages` if not provided. Database accepts any non-empty string (open text) but the UI suggests a fixed set of F&B categories. Source: `src/atomic-crm/validation/products.ts`, `productCategorySchema`.
4. **Status lifecycle** — Product status is limited to `active`, `discontinued`, or `coming_soon`. Statuses `seasonal` and `limited_availability` were removed on 2025-10-18. Source: `src/atomic-crm/validation/products.ts`, `productStatusSchema`.
5. **Atomic create with distributors** — When `distributor_ids` is non-empty on create, the handler calls the `create_product_with_distributors` RPC to insert the product and its distributor links in a single transaction. Source: `src/atomic-crm/providers/supabase/handlers/productsHandler.ts`, `create` method.
6. **Atomic update with distributors** — When `distributor_ids` or `distributors` is non-empty on update, the handler delegates to `ProductsService.updateWithDistributors()` for an atomic sync of product data and distributor associations. Source: `src/atomic-crm/providers/supabase/handlers/productsHandler.ts`, `update` method.
7. **Soft delete via RPC** — Product deletes set `deleted_at` via `ProductsService.softDelete()` RPC to bypass RLS SELECT restrictions that would otherwise prevent reading the soft-deleted row to return a result. Source: `src/atomic-crm/providers/supabase/handlers/productsHandler.ts`, `delete` method.
8. **Computed fields stripped before save** — `principal_name`, `created_at`, `updated_at`, `deleted_at` are passed in the update payload from the summary view but stripped by `productsCallbacks` before the DB write. Source: `src/atomic-crm/validation/products.ts`, `productUpdateWithDistributorsSchema`.
9. **Distributor fields stripped on plain create** — If no distributors are present, `distributor_ids`, `product_distributors`, and `distributors` are stripped from the payload before passing to the base provider to prevent unknown-key rejection by `z.strictObject()`. Source: `src/atomic-crm/providers/supabase/handlers/productsHandler.ts`, `create` method.
10. **Max distributor limit** — A product can be associated with at most 100 distributors. Source: `src/atomic-crm/validation/products.ts`, `distributorFieldsSchema`.

---

## 4. Enums

- **`productStatusSchema`**: `"active"` | `"discontinued"` | `"coming_soon"`
- **`FB_CONSUMABLE_CATEGORIES`** (suggested values, not enforced by DB): `"beverages"` | `"dairy"` | `"frozen"` | `"fresh_produce"` | `"meat_poultry"` | `"seafood"` | `"dry_goods"` | `"snacks"` | `"condiments"` | `"baking_supplies"` | `"spices_seasonings"` | `"canned_goods"` | `"pasta_grains"` | `"oils_vinegars"` | `"sweeteners"` | `"other"`

---

## 5. CRUD Operations

| Operation | Handler Pattern | Notes |
|-----------|----------------|-------|
| List | `products_summary` view [INFERRED] | Includes precomputed `principal_name` |
| GetOne | `products` base table | |
| Create | `products` base table or `create_product_with_distributors` RPC | RPC path used when distributors are present |
| Update | `products` base table or `ProductsService.updateWithDistributors()` | Service path used when distributor data is present |
| Delete | Soft delete via RPC | `ProductsService.softDelete()` sets `deleted_at` |
| DeleteMany | Soft delete via RPC | `ProductsService.softDeleteMany()` sets `deleted_at` on multiple records |

**Wrapper chain:** `customProductsHandler -> withValidation -> withSkipDelete -> withLifecycleCallbacks -> withErrorLogging`

Note: The entire custom handler (including delete/deleteMany) is defined inside the wrapper chain so that `withErrorLogging` catches all errors. This was a deliberate fix for "zombie delete" bugs where errors previously bypassed logging.

---

## 6. UI Views

- **ProductList** — Datagrid with sortable columns (name, category, status, principal name, certifications), filterable badges, keyword search, keyboard navigation, and slide-over integration
- **ProductCreate** — Tabbed form: general details + distribution tab (distributor multi-select with vendor item numbers)
- **ProductEdit** — Tabbed form with same structure; pessimistic mutation mode; cache invalidation for linked distributors on save
- **ProductShow** — Read-only display
- **ProductSlideOver** — 40vw slide-over for quick view/edit from list
- **ProductCard** — Card representation used in card-grid view variants

---

## 7. Related Entities

| Relationship | Type | Entity | Notes |
|-------------|------|--------|-------|
| `principal_id` | N:1 (required) | organizations | Principal (manufacturer) that owns this product |
| `product_distributors` | M:N junction | organizations (distributors) | Distributors carrying this product; managed via `ProductsService` |
| `opportunity_products` | M:N junction | opportunities | Products attached to an opportunity for tracking |

---

## 8. Open Questions

- Should `category` remain free-text or be constrained to the `FB_CONSUMABLE_CATEGORIES` enum at the DB level? The validation comment notes "Database now accepts TEXT to allow custom categories."
- Is `manufacturer_part_number` surfaced in the current UI forms? It is present in the update schema but not confirmed in `ProductInputs.tsx`.
- Should certifications and allergens be constrained to a controlled vocabulary, or remain free-text strings?
- Are there plans to track pricing or volume at the product-distributor level? The `vendor_item_number` field on `product_distributors` currently only captures the distributor's item code.
