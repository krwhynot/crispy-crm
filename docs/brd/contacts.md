# BRD: Contacts

**Status:** Draft | **Last Updated:** 2026-03-01 | **Source:** Zod schemas, handler logic, UI components

---

## 1. Domain Overview

Contacts represent individual people associated with organizations (operators, distributors, principals). Each contact must belong to an organization and have an assigned account manager (sales rep). Contacts support hierarchical management via `manager_id` and dual account ownership via `sales_id` / `secondary_sales_id`.

**Business role:** Track the "who" in the sales process. A contact's org membership, department, and territory drive routing and reporting.

---

## 2. Schema Fields

### Core Identity

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `id` | number | auto-increment | No |
| `first_name` | string | trim, max 100 | Yes |
| `last_name` | string | trim, max 100 | Yes |
| `name` | string | trim, max 255 | No (computed) |
| `title` | string | trim, max 100 | No |
| `department` | string | trim, max 100 | No |
| `department_type` | enum | see enums | No |
| `gender` | string | trim, max 50 | No |
| `birthday` | date | coerce | No |
| `avatar` | file | RA file schema | No |

### Communication

| Field | Type | Constraints |
|-------|------|-------------|
| `email` | JSONB array | max 10 entries, each: `{email, type, label}` |
| `phone` | JSONB array | max 10 entries, each: `{number, type, label}` |
| `linkedin_url` | string | max 2048, LinkedIn domain only |
| `twitter_handle` | string | trim, max 100 |

### Location

| Field | Type | Constraints |
|-------|------|-------------|
| `address` | string | trim, max 500 |
| `city` | string | trim, max 100 |
| `state` | string | trim, max 100 |
| `postal_code` | string | trim, max 20 |
| `country` | string | trim, max 100 |
| `district_code` | string | trim, max 10 |
| `territory_name` | string | trim, max 100 |

### Relationships

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `organization_id` | number | FK to organizations | Yes |
| `sales_id` | number | FK to sales | Yes |
| `secondary_sales_id` | number | FK to sales | No |
| `manager_id` | number | FK to contacts (self) | No |
| `tags` | number[] | max 50, FK array to tags | No |

### Metadata

| Field | Type | Notes |
|-------|------|-------|
| `created_at` / `updated_at` | string | DB-managed timestamps |
| `created_by` / `updated_by` | number | FK to sales (audit) |
| `deleted_at` | string | Soft delete marker |
| `first_seen` / `last_seen` | string | Activity tracking |
| `status` | string | trim, max 50 |
| `notes` | string | trim, max 5000, HTML sanitized |

### Computed (View-Only)

`nb_tasks`, `nb_notes`, `nb_activities`, `company_name`, `search_tsv`

---

## 3. Business Rules

1. **No orphan contacts** -- `organization_id` required on create.
2. **Name required** -- `first_name` and `last_name` required on create.
3. **Account manager required** -- `sales_id` required on create.
4. **Self-manager prevention** -- `manager_id !== id` (superRefine).
5. **Distinct managers** -- `sales_id !== secondary_sales_id` (superRefine).
6. **Email validation** -- non-empty email entries validated as valid email format.
7. **Empty entry filtering** -- empty JSONB entries (email/phone) stripped before validation.
8. **HTML sanitization** -- `notes` field sanitized via `sanitizeHtml()`.

---

## 4. Enums

- **`personalInfoType`**: `"work"` | `"home"` | `"other"` (email/phone type)
- **`contactDepartment`**: `"senior_management"` | `"sales_management"` | `"district_management"` | `"area_sales"` | `"sales_specialist"` | `"sales_support"` | `"procurement"`

---

## 5. CRUD Operations

| Operation | Handler Pattern | Notes |
|-----------|----------------|-------|
| List | `contacts_summary` view | Precomputed `nb_tasks`, `company_name` |
| GetOne | `contacts` base table | |
| Create | `contacts` base table | Requires `first_name`, `last_name`, `sales_id`, `organization_id` |
| Update | `contacts` base table | All fields partial |
| Delete | Soft delete | Sets `deleted_at` via `withSkipDelete` |

**Quick Create:** Strict object requiring only `first_name` (min 1) and `organization_id`. `last_name` defaults to `""`.

**Wrapper chain:** `baseProvider -> withValidation -> withSkipDelete -> withLifecycleCallbacks -> withErrorLogging`

---

## 6. UI Views

- **ContactList** -- Datagrid with column filters, FTS search
- **ContactCreate** -- Full form with all fields
- **ContactEdit** -- Tabbed form (details, organizations, opportunities, notes, activities)
- **ContactSlideOver** -- 40vw slide-over for quick editing from list

---

## 7. Related Entities

| Relationship | Type | Entity |
|-------------|------|--------|
| `organization_id` | N:1 (required) | organizations |
| `sales_id` | N:1 (required) | sales |
| `secondary_sales_id` | N:1 (optional) | sales |
| `manager_id` | N:1 self-ref (optional) | contacts |
| `tags` | M:N (array FK) | tags |
| `contact_organizations` | M:N junction | organizations |
| `opportunity_contacts` | M:N junction | opportunities |

---

## 8. Open Questions

- Should `district_code` and `territory_name` be freeform or enum-constrained?
- Is the 10-entry limit on email/phone sufficient for power users?
- Should contact import support updating existing contacts (upsert) vs create-only?
