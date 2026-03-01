# BRD: Organizations

**Status:** Draft | **Last Updated:** 2026-03-01 | **Source:** Zod schemas, handler logic, UI components

---

## 1. Domain Overview

Organizations are the central entity in the MFB sales model. They represent principals (manufacturers), distributors, customers (operators/restaurants), and prospects. Organizations support hierarchical parent-child relationships, dual account management, and segment-based categorization for playbook routing.

**Business role:** Track the "what company" across the pipeline. Organization type drives routing (principal vs customer vs distributor). Priority (A/B/C/D) drives rep attention allocation.

---

## 2. Schema Fields

### Core Identity

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `id` | number | auto-increment | No |
| `name` | string | trim, min 1, max 255 | Yes |
| `organization_type` | enum | see enums | Yes |
| `priority` | enum | A/B/C/D | Yes |
| `status` | enum | active/inactive | Yes |
| `status_reason` | enum | see enums | No |
| `logo` | file | RA file schema | No |
| `logo_url` | string | URL, max 2048 | No |

### Business Details

| Field | Type | Constraints |
|-------|------|-------------|
| `description` | string | trim, max 5000, HTML sanitized |
| `email` | string | email format, max 254 |
| `phone` | string | trim, max 30, min 10 digits |
| `website` | string | URL, max 2048, auto-prefix https |
| `linkedin_url` | string | URL, max 2048, LinkedIn domain, auto-prefix https |
| `context_links` | URL[] | max 20 entries |
| `employee_count` | number | positive integer |
| `founded_year` | number | 1800 to current year |
| `tax_identifier` | string | trim, max 50 |
| `sector` | string | trim, max 100 |
| `cuisine` | string | trim, max 100 (restaurant-specific) |

### Location (Primary)

| Field | Type | Constraints |
|-------|------|-------------|
| `address` | string | trim, max 500 |
| `city` | string | trim, max 100 |
| `state` | string | trim, max 100 |
| `postal_code` | string | trim, max 20, US ZIP format |

### Billing / Shipping

| Field | Type | Constraints |
|-------|------|-------------|
| `billing_street` / `shipping_street` | string | trim, max 255 |
| `billing_city` / `shipping_city` | string | trim, max 100 |
| `billing_state` / `shipping_state` | string | trim, max 2 (abbreviation) |
| `billing_postal_code` / `shipping_postal_code` | string | trim, max 20 |
| `billing_country` / `shipping_country` | string | trim, max 2, default "US" |

### Relationships

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `parent_organization_id` | number | FK to organizations (self) | No |
| `segment_id` | UUID | FK to segments | Yes (non-Unknown) |
| `playbook_category_id` | UUID | FK to playbook_categories | No |
| `sales_id` | number | FK to sales | Yes |
| `secondary_sales_id` | number | FK to sales | No |
| `tags` | number[] | max 50, FK array to tags | No |

### Financial

| Field | Type | Constraints |
|-------|------|-------------|
| `payment_terms` | enum | see enums |
| `credit_limit` | number | non-negative |
| `territory` | string | trim, max 100 |

### Metadata

| Field | Type | Notes |
|-------|------|-------|
| `created_at` / `updated_at` | string | DB-managed |
| `created_by` / `updated_by` | number | FK to sales (audit) |
| `deleted_at` | string | Soft delete |
| `notes` | string | trim, max 5000, HTML sanitized |
| `is_operating_entity` | boolean | default true |
| `needs_review` | boolean | default false |
| `org_scope` | enum | national/regional/local |
| `import_session_id` | UUID | Import batch tracking |

### Computed (View-Only)

`nb_contacts`, `nb_opportunities`, `nb_notes`

---

## 3. Business Rules

1. **Name always required** -- min 1 character enforced.
2. **Type, Priority, Status required** -- no silent defaults on full create.
3. **Segment required on create** -- must not be the Unknown segment on full create.
4. **Segment type routing** -- distributors/principals use "playbook" segments; customers/prospects use "operator" segments.
5. **ZIP code validation** -- US format only: `12345` or `12345-6789`.
6. **Phone validation** -- minimum 10 digits after stripping non-digits.
7. **URL auto-prefix** -- LinkedIn and website URLs auto-get `https://` if missing.
8. **HTML sanitization** -- `description` and `notes` sanitized.
9. **Parent-child hierarchy** -- `parent_organization_id` enables org tree relationships.

---

## 4. Enums

- **`organizationType`**: `"prospect"` | `"customer"` | `"principal"` | `"distributor"`
- **`organizationPriority`**: `"A"` | `"B"` | `"C"` | `"D"`
- **`orgScope`**: `"national"` | `"regional"` | `"local"`
- **`orgStatus`**: `"active"` | `"inactive"`
- **`orgStatusReason`**: `"active_customer"` | `"prospect"` | `"authorized_distributor"` | `"account_closed"` | `"out_of_business"` | `"disqualified"`
- **`paymentTerms`**: `"net_30"` | `"net_60"` | `"net_90"` | `"cod"` | `"prepaid"` | `"2_10_net_30"`

---

## 5. CRUD Operations

| Operation | Handler Pattern | Notes |
|-----------|----------------|-------|
| List | `organizations_summary` view | Precomputed `nb_contacts`, `nb_opportunities` |
| GetOne | `organizations` base table | |
| Create | `organizations` base table | Requires `name`, `organization_type`, `sales_id`, `segment_id`, `priority`, `status` |
| Update | `organizations` base table | All fields partial except `id` |
| Delete | Soft delete | Sets `deleted_at` via `withSkipDelete` |

**Form Variants:**

| Variant | Defaults | Unknown Segment |
|---------|----------|-----------------|
| **create** | type=prospect, priority=C, status=active | Not allowed |
| **edit** | preserve existing | Allowed |
| **quickCreate** | type=prospect, priority=C, status=active | Allowed |

**Wrapper chain:** `baseProvider -> withValidation -> withSkipDelete -> withLifecycleCallbacks -> withErrorLogging`

---

## 6. UI Views

- **OrganizationList** -- Datagrid with type/priority filters
- **OrganizationCreate** -- Multi-section form (identity, location, billing/shipping, financial)
- **OrganizationEdit** -- Tabbed form (details, contacts, opportunities, notes, distributors)
- **OrganizationShow** -- Read-only view with hierarchy display
- **OrganizationSlideOver** -- 40vw slide-over for quick editing
- **Hierarchy components** -- ParentOrganizationInput, BranchLocationsSection
- **Badge components** -- OrganizationTypeBadge, PriorityBadge

---

## 7. Related Entities

| Relationship | Type | Entity |
|-------------|------|--------|
| `parent_organization_id` | N:1 self-ref | organizations |
| `segment_id` | N:1 | segments |
| `playbook_category_id` | N:1 | playbook_categories |
| `sales_id` | N:1 (required) | sales |
| `secondary_sales_id` | N:1 (optional) | sales |
| `tags` | M:N (array FK) | tags |
| `organization_distributors` | M:N junction | organizations (distributors) |
| `opportunity_participants` | M:N junction | opportunities |
| contacts | 1:N | contacts (`organization_id`) |
| opportunities | 1:N | opportunities (as customer, principal, or distributor) |

---

## 8. Open Questions

- Should `credit_limit` have a configurable maximum?
- Is the 2-character state abbreviation constraint sufficient for international use?
- Should parent org type be constrained (e.g., a prospect can't parent a principal)?
