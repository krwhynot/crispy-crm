# BRD: Opportunities

**Status:** Draft | **Last Updated:** 2026-03-01 | **Source:** Zod schemas, handler logic, UI components

---

## 1. Domain Overview

Opportunities represent sales deals flowing through a 7-stage pipeline. Each opportunity connects a customer organization to a principal (manufacturer) and optionally a distributor. Opportunities support product line tracking, duplicate detection, participant management, and structured close workflows with win/loss analysis.

**Business role:** Track the "deal" from initial lead through close. Stage progression, activity logging, and task management drive pipeline velocity metrics on the dashboard.

---

## 2. Schema Fields

### Core Identity

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `id` | number/string | auto-increment | No |
| `name` | string | trim, min 1, max 255 | Yes |
| `description` | string | trim, max 2000, HTML sanitized | No |
| `stage` | enum | see enums | Yes |
| `priority` | enum | see enums | Yes |
| `status` | enum | active/on_hold/nurturing/stalled/expired | No |
| `lead_source` | enum | see enums | No |
| `campaign` | string | trim, max 100 | No |

### Timeline

| Field | Type | Constraints |
|-------|------|-------------|
| `estimated_close_date` | date | default 30 days from now |
| `actual_close_date` | date | required when closing |
| `stage_changed_at` | string | system-managed |

### Close Workflow

| Field | Type | Required When |
|-------|------|---------------|
| `win_reason` | enum | `stage === "closed_won"` |
| `loss_reason` | enum | `stage === "closed_lost"` |
| `close_reason_notes` | string (max 500) | reason is `"other"` |
| `actual_close_date` | date | any closed stage |

### Relationships

| Field | Type | Required (Create) |
|-------|------|-------------------|
| `customer_organization_id` | number/string | Yes |
| `principal_organization_id` | number/string | Yes |
| `distributor_organization_id` | number/string | No |
| `opportunity_owner_id` | number/string | No |
| `account_manager_id` | number/string | No |
| `primary_contact_id` | number | No |
| `contact_ids` | number[] (max 100) | No |
| `related_opportunity_id` | number/string | No (same principal only) |
| `founding_interaction_id` | number/string | No |
| `tags` | string[] (max 20) | No |

### Strategy

| Field | Type | Constraints |
|-------|------|-------------|
| `next_action` | string | trim, max 500 |
| `next_action_date` | date | |
| `decision_criteria` | string | trim, max 2000, HTML sanitized |
| `competition` | string | max 2000 |
| `notes` | string | trim, max 5000, HTML sanitized |
| `probability` | number | |

### Metadata

| Field | Type | Notes |
|-------|------|-------|
| `version` | number | Optimistic locking |
| `created_at` / `updated_at` | string | DB-managed |
| `created_by` / `updated_by` | number/string | Audit |
| `deleted_at` | string | Soft delete |
| `stage_manual` / `status_manual` | boolean | Manual override flags |
| `index` | number | Board position |

### Computed (View-Only)

`customer_organization_name`, `principal_organization_name`, `distributor_organization_name`, `primary_contact_name`, `days_in_stage`, `last_activity_date`, `days_since_last_activity`, `pending_task_count`, `overdue_task_count`, `next_task_id`, `next_task_title`, `next_task_due_date`, `next_task_priority`, `products` (JSONB array), `search_tsv`

---

## 3. Business Rules

### Stage Transition Policy

| From | To | Allowed |
|------|----|---------|
| Active | Active | Yes (any direction) |
| Active | Closed | Yes |
| Closed | Active | Yes (reopen) |
| Closed | Closed | **No** (must reopen first) |
| Same | Same | **No** (no-op) |

### Close Requirements

1. **Win reason required** when `stage === "closed_won"`.
2. **Loss reason required** when `stage === "closed_lost"`.
3. **Close notes required** when reason is `"other"`.
4. **Actual close date required** when stage is any closed value.
5. Defense-in-depth: constraints also enforced at DB level via CHECK.

### Other Rules

6. **Related opportunity validation** -- must reference same principal, cannot self-reference.
7. **Duplicate detection** -- same principal + customer + product combination blocked.
8. **Contact validation on create** -- if `contact_ids` explicitly provided, must have at least 1.
9. **HTML sanitization** -- `description`, `notes`, `decision_criteria`, `close_reason_notes`.
10. **Product sync** -- `products_to_sync` virtual field triggers RPC-based product management.

---

## 4. Enums

- **`opportunityStage`**: `"new_lead"` | `"initial_outreach"` | `"sample_visit_offered"` | `"feedback_logged"` | `"demo_scheduled"` | `"closed_won"` | `"closed_lost"`
- **`opportunityPriority`**: `"low"` | `"medium"` | `"high"` | `"critical"`
- **`leadSource`**: `"referral"` | `"trade_show"` | `"website"` | `"cold_call"` | `"email_campaign"` | `"social_media"` | `"partner"` | `"existing_customer"`
- **`winReason`**: `"relationship"` | `"product_quality"` | `"price_competitive"` | `"timing"` | `"other"`
- **`lossReason`**: `"price_too_high"` | `"no_authorization"` | `"competitor_relationship"` | `"product_fit"` | `"timing"` | `"no_response"` | `"other"`
- **`participantRole`**: `"customer"` | `"principal"` | `"distributor"` | `"competitor"`

---

## 5. CRUD Operations

| Operation | Handler Pattern | Notes |
|-----------|----------------|-------|
| List | `opportunities_summary` view | Products, task counts, activity dates precomputed |
| GetOne | `opportunities` base table | |
| Create | `opportunities` + RPC | `createWithProducts()` via OpportunitiesService |
| Update | `opportunities` + RPC | `updateWithProducts()` for product sync |
| Delete | Soft delete | `archive_opportunity_with_relations` RPC |

**Wrapper chain:** `baseProvider -> withValidation -> withSkipDelete -> withLifecycleCallbacks(custom handler) -> withErrorLogging`

The custom handler intercepts create/update to route through `OpportunitiesService` for product sync via `sync_opportunity_with_products` RPC.

---

## 6. UI Views

- **OpportunityList** -- Kanban board (grouped by stage) and list/table view
- **OpportunityCreate** -- Multi-step form (identity, organizations, contacts, products)
- **OpportunityEdit** -- Tabbed form (details, products, participants, notes, activities, tasks)
- **OpportunitySlideOver** -- 40vw slide-over for quick editing

---

## 7. Related Entities

| Relationship | Type | Entity |
|-------------|------|--------|
| `customer_organization_id` | N:1 (required) | organizations |
| `principal_organization_id` | N:1 (required) | organizations |
| `distributor_organization_id` | N:1 (optional) | organizations |
| `opportunity_owner_id` | N:1 | sales |
| `account_manager_id` | N:1 | sales |
| `primary_contact_id` | N:1 | contacts |
| `contact_ids` | M:N (array FK) | contacts |
| `related_opportunity_id` | N:1 self-ref | opportunities |
| `opportunity_participants` | M:N junction | organizations (by role) |
| `opportunity_contacts` | M:N junction | contacts (by role) |
| `opportunity_products` | M:N junction | products |
| activities | 1:N | activities |
| tasks | 1:N | tasks |
| notes | 1:N | opportunity_notes |

### Junction Tables

**opportunity_participants:** `opportunity_id` + `organization_id` + `role` + `is_primary` + `notes`

**opportunity_contacts:** `opportunity_id` + `contact_id` + `role` + `is_primary` + `notes`

**opportunity_products:** Synced via `sync_opportunity_with_products` RPC, not direct CRUD.

---

## 8. Open Questions

- Should stage transition history be tracked (audit log of stage changes)?
- Should `probability` auto-calculate based on stage, or remain fully manual?
- Is the 100-contact limit per opportunity sufficient for enterprise deals?
