# PRD: Opportunity Pipeline

**Feature ID:** feat-opp-001
**Domain:** Opportunities
**Status:** Reverse-Engineered
**Confidence:** 95%
**Generated:** 2026-03-03
**Last Updated:** 2026-03-03

## Linked Documents

- **BRD:** [docs/brd/opportunities.md](../../brd/opportunities.md)
- **ADRs:** None - ADR needed: document architectural decisions for this feature
- **Module:** src/atomic-crm/opportunities
- **Risk Level:** High (risk score 9/10 — highest coupling in codebase)

---

## Executive Summary

The Opportunity Pipeline is the business-critical revenue tracking center of Crispy CRM. It gives MFB sales reps and managers a structured, 7-stage pipeline to take a deal from initial lead through a formal close. Each opportunity links a Principal (manufacturer), a customer organization (restaurant operator), and optionally a distributor. The pipeline drives the KPIs shown on the executive dashboard and is the primary surface where activities, tasks, and notes are captured to support the "10+ activities per week per principal" target.

This is the largest and most coupled feature module in the codebase: 26,800 LOC, 152 files, 19 modules that depend on it, and 771 commits in 6 months.

---

## Business Context

See `docs/brd/opportunities.md` for full business requirements. Key context from the BRD and CLAUDE.md:

- **Business model:** MFB brokers deals between Principals (9 manufacturers) and restaurant Operators through a network of 50+ Distributors.
- **Core problem solved:** Salespeople previously tracked deals in Excel. Crispy CRM centralizes deal data and enforces a consistent pipeline stage process.
- **Success metric:** Under 2 seconds for a Principal to see their pipeline summary; 100% rep adoption within 30 days; 10+ logged activities per week per principal.
- **MVP scope:** Quick logging (under 30 seconds), Excel export, sample tracking, tablet support, task snooze. PDF generation, volume/price tracking, territory management, and external integrations are explicitly out of scope for MVP.

---

## Feature Requirements

### Functional Requirements

| ID | Requirement | Priority | Source | Verified |
|----|-------------|----------|--------|----------|
| FR-001 | Users can create an opportunity with a name, stage, priority, customer organization, and principal organization as required fields. | P0 | `src/atomic-crm/validation/opportunities/opportunities-core.ts` lines 11-19; BRD §2 | Yes |
| FR-002 | Opportunities progress through 7 stages: `new_lead`, `initial_outreach`, `sample_visit_offered`, `feedback_logged`, `demo_scheduled`, `closed_won`, `closed_lost`. | P0 | `src/atomic-crm/constants/stage-enums.ts` lines 27-35 | Yes |
| FR-003 | Stage transitions are constrained: active-to-active and active-to-closed are allowed; closed-to-closed is blocked (must reopen first); same-to-same is a no-op. | P0 | BRD §3 Stage Transition Policy | Yes |
| FR-004 | When closing as `closed_won`, a win reason is required. When closing as `closed_lost`, a loss reason is required. When reason is `"other"`, close reason notes are required. An actual close date is required for any closed stage. | P0 | `src/atomic-crm/validation/opportunities/opportunities-core.ts`; BRD §3 Close Requirements | Yes |
| FR-005 | Win reasons: relationship, product_quality, price_competitive, timing, other. Loss reasons: price_too_high, no_authorization, competitor_relationship, product_fit, timing, no_response, other. | P0 | `src/atomic-crm/validation/opportunities/opportunities-core.ts` lines 41-58 | Yes |
| FR-006 | The pipeline list view renders a Kanban board grouped by stage. A table/list view is also available. | P0 | BRD §6 UI Views; `src/atomic-crm/opportunities/resource.tsx` | Yes |
| FR-007 | Opportunity records are soft-deleted (set `deleted_at`). The `archive_opportunity_with_relations` RPC is called on delete to cascade soft-delete to related records. | P0 | `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts` lines 288-292; BRD §5 | Yes |
| FR-008 | Opportunity products are managed via a virtual `products_to_sync` field that triggers the `sync_opportunity_with_products` RPC. Products are not written directly via CRUD on the junction table from the UI. | P0 | `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts` lines 183-194; BRD §5 | Yes |
| FR-009 | An opportunity can be linked to a related opportunity, but only one with the same principal organization. An opportunity cannot be linked to itself. | P1 | `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts` lines 67-90; BRD §3 Rule 6 | Yes |
| FR-010 | Duplicate detection blocks creating an opportunity with the same principal, customer, and product combination. | P1 | BRD §3 Rule 7; `src/atomic-crm/validation/opportunities/opportunities-duplicates.ts` | Yes |
| FR-011 | An opportunity supports up to 100 associated contacts via the `opportunity_contacts` junction table. | P1 | BRD §2 Relationships | Yes |
| FR-012 | Opportunity participants (organizations by role: customer, principal, distributor, competitor) are tracked via the `opportunity_participants` junction table. | P1 | BRD §7 Junction Tables | Yes |
| FR-013 | The edit view presents a tabbed form covering: details, products, participants, notes, activities, and tasks. | P1 | BRD §6 OpportunityEdit | Yes |
| FR-014 | A slide-over (40vw) is available for quick editing of an opportunity without leaving the current view. | P1 | BRD §6 OpportunitySlideOver | Yes |
| FR-015 | Opportunities can be tagged (up to 20 tags). | P2 | BRD §2 Relationships | Yes |
| FR-016 | Opportunity list reads from the `opportunities_summary` SQL view, which precomputes: days in stage, last activity date, pending/overdue task counts, next task details, and product data. | P0 | BRD §5 CRUD Operations | Yes |
| FR-017 | A `/opportunities/create` route redirects to the list view; new opportunities are created via Quick Add on the list. | P1 | `src/atomic-crm/opportunities/resource.tsx` lines 11-17 | Yes |
| FR-018 | HTML content in `description`, `notes`, `decision_criteria`, and `close_reason_notes` fields is sanitized server-side before persistence. | P0 | BRD §3 Rule 9; `src/atomic-crm/validation/opportunities/opportunities-core.ts` line 2 (sanitizeHtml import) | Yes |
| FR-019 | Optimistic locking is applied on update using a `version` field to prevent lost updates from concurrent edits. | P1 | `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts` line 247 | Yes |

### Non-Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| NFR-001 | Pipeline list and Principal dashboard queries must return results in under 2 seconds. | CLAUDE.md Goals | No - performance not tested in audit |
| NFR-002 | The module must support desktop (1440px+) and iPad form factors. | CLAUDE.md Stack | Yes - feature pattern uses 40vw slide-over |
| NFR-003 | All DB access routes through `composedDataProvider.ts`; no direct Supabase imports in feature UI components. [CORE-001] | CLAUDE.md Architecture; CORE_CONSTRAINTS.md | Yes |
| NFR-004 | Zod schemas enforce shape at the API (provider) boundary, not in form components. [CORE-004, CORE-007] | CLAUDE.md Architecture | Yes - opportunityProductSyncHandlerSchema verified in handler |
| NFR-005 | RLS policies enforce authenticated access and tenant isolation on `opportunities` and all junction tables. [CORE-011] | DATABASE_LAYER.md DB-011 | [REQUIRES REVIEW] - RLS policies not sampled in this audit |
| NFR-006 | Stage enum values are consumed from `src/atomic-crm/constants/stage-enums.ts`; no inline string literals for stage values. [DOM-006] | `src/atomic-crm/constants/stage-enums.ts` | Yes |
| NFR-007 | Error handling wrapper `withErrorLogging` is always the outermost composition layer. [PRV-004] | `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts` line 312 | Yes |
| NFR-008 | Non-critical side-effects (product sync via RPC) must not block the core opportunity write transaction. [PRV-011] | BRD §5; handler pattern | [REQUIRES REVIEW] - atomicity depends on RPC implementation |

---

## Data Model

### Primary Table: `opportunities`

Reads via `opportunities_summary` SQL view. Writes to base `opportunities` table.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | number/string | auto | Primary key |
| `name` | string (max 255) | Yes | Trimmed |
| `stage` | enum | Yes | 7 values; see stage enums |
| `priority` | enum | Yes | low / medium / high / critical |
| `status` | enum | No | active / on_hold / nurturing / stalled / expired |
| `customer_organization_id` | number/string | Yes | FK to organizations |
| `principal_organization_id` | number/string | Yes | FK to organizations |
| `distributor_organization_id` | number/string | No | FK to organizations |
| `opportunity_owner_id` | number/string | No | FK to sales (rep) |
| `account_manager_id` | number/string | No | FK to sales |
| `primary_contact_id` | number | No | FK to contacts |
| `related_opportunity_id` | number/string | No | Self-ref; same principal only |
| `win_reason` | enum | Conditional | Required if closed_won |
| `loss_reason` | enum | Conditional | Required if closed_lost |
| `close_reason_notes` | string (max 500) | Conditional | Required if reason = "other" |
| `actual_close_date` | date | Conditional | Required on any close |
| `estimated_close_date` | date | No | Default: 30 days from now |
| `description` | string (max 2000) | No | HTML sanitized |
| `notes` | string (max 5000) | No | HTML sanitized |
| `decision_criteria` | string (max 2000) | No | HTML sanitized |
| `next_action` | string (max 500) | No | |
| `probability` | number | No | Manual; not auto-calculated [OPEN QUESTION] |
| `lead_source` | enum | No | 8 values |
| `campaign` | string (max 100) | No | |
| `version` | number | No | Optimistic locking counter |
| `deleted_at` | timestamp | No | Soft delete |
| `stage_changed_at` | timestamp | No | System-managed |
| `index` | number | No | Kanban board position |
| `tags` | string[] (max 20) | No | |

### Computed Fields (View-Only — `opportunities_summary`)

These are read from the view and stripped before writes:

`customer_organization_name`, `principal_organization_name`, `distributor_organization_name`, `primary_contact_name`, `days_in_stage`, `last_activity_date`, `days_since_last_activity`, `pending_task_count`, `overdue_task_count`, `next_task_id`, `next_task_title`, `next_task_due_date`, `next_task_priority`, `products` (JSONB array), `search_tsv`

### Junction Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| `opportunity_contacts` | opportunity_id, contact_id, role, is_primary, notes | Links contacts to opportunities |
| `opportunity_participants` | opportunity_id, organization_id, role, is_primary, notes | Links organizations by role |
| `opportunity_products` | Managed via `sync_opportunity_with_products` RPC | Links products to opportunities |

### Related Tables (Read Only in this Feature)

| Table | Relationship |
|-------|-------------|
| `activities` | 1:N — activities logged against an opportunity |
| `tasks` | 1:N — tasks assigned to an opportunity |
| `opportunity_notes` | 1:N — rich-text notes on an opportunity |
| `organizations` | N:1 — customer, principal, distributor |
| `contacts` | M:N via junction |
| `sales` | N:1 — owner and account manager |
| `products` | M:N via junction (RPC-managed) |

---

## User Interface

### Screens

| Screen | Component (Lazy-loaded) | Description |
|--------|------------------------|-------------|
| List / Kanban | `OpportunityList` | Kanban board (default) grouped by stage, plus table view. Reads from `opportunities_summary` view. |
| Edit | `OpportunityEdit` | Tabbed form: details, products, participants, notes, activities, tasks. |
| Quick Add / Create | Redirect to list | `/opportunities/create` redirects to list; creation happens via Quick Add on the list. |
| Slide-Over | `OpportunitySlideOver` | 40vw panel for quick edits without full page navigation. |

### Key User Flows

1. **Create an opportunity (Quick Add):** Rep opens list, triggers Quick Add, fills required fields (name, stage, priority, customer org, principal org), optionally adds products, saves. Target: under 30 seconds.
2. **Advance a stage:** Rep opens slide-over or edit view, changes stage dropdown. If moving to a closed stage, close workflow fields appear (win/loss reason, close date).
3. **Close an opportunity:** Stage is set to `closed_won` or `closed_lost`. Win/loss reason and actual close date become required. Notes field appears when reason is "other".
4. **Reopen a closed opportunity:** Allowed by moving from a closed stage back to any active stage. Moving between closed stages is blocked.
5. **Log an activity:** From the Activities tab in edit view or the slide-over, rep logs a Call, Email, or Sample. Sample activities require a follow-up.
6. **Add products:** From the Products tab, rep selects products to associate. Sync is handled via `sync_opportunity_with_products` RPC.

---

## Business Rules and Validation

All rules are enforced at the provider layer (Zod schemas + handler logic). DB-level CHECK constraints provide defense-in-depth per BRD §3 Rule 5.

| Rule | Enforcement Point | Source |
|------|------------------|--------|
| `closed_won` requires `win_reason` | Zod schema (opportunities-operations.ts) | BRD §3 Rule 1 |
| `closed_lost` requires `loss_reason` | Zod schema | BRD §3 Rule 2 |
| Reason `"other"` requires `close_reason_notes` | Zod schema | BRD §3 Rule 3 |
| Any closed stage requires `actual_close_date` | Zod schema | BRD §3 Rule 4 |
| DB CHECK also enforces close requirements | supabase/migrations | BRD §3 Rule 5 |
| `related_opportunity_id` must share same principal | `validateRelatedOpportunity()` in handler | BRD §3 Rule 6 |
| Self-reference on `related_opportunity_id` blocked | `validateRelatedOpportunity()` in handler | BRD §3 Rule 6 |
| Duplicate principal + customer + product blocked | `opportunities-duplicates.ts` | BRD §3 Rule 7 |
| `contact_ids` explicitly provided must have >= 1 entry | Zod schema | BRD §3 Rule 8 |
| HTML fields sanitized before persistence | `sanitizeHtml` utility, provider boundary | BRD §3 Rule 9 |
| Closed-to-closed stage transition blocked | [REQUIRES REVIEW] — enforced in Zod or handler; not sampled in this audit | BRD §3 Transition Policy |
| Optimistic locking on update (version check) | Handler; `OpportunitiesService.updateWithProducts` | Handler lines 247-257 |
| Stage enum values must come from `constants/stage-enums.ts` | TypeScript type; DOM-006 | `src/atomic-crm/constants/stage-enums.ts` |

---

## Integration Points

### Internal Module Dependencies

| Module | Fan-In Role | Risk |
|--------|-------------|------|
| `src/atomic-crm/constants` (72 fan-in) | `STAGE` enum and predicates consumed from here | Medium — blast radius if enum values renamed |
| `src/atomic-crm/validation` (91 fan-in) | Zod schemas for all opportunity shapes | High — schema changes cascade |
| `src/atomic-crm/providers` (god class) | All DB writes route through `composedDataProvider.ts` | High — Caution Zone |
| `src/atomic-crm/services` | `OpportunitiesService` handles createWithProducts / updateWithProducts | Medium |
| `src/atomic-crm/organizations` | FK for customer, principal, distributor lookups | High |
| `src/atomic-crm/hooks` | Shared React hooks (filter cleanup, etc.) | Low |
| `src/atomic-crm/utils` | Formatting, staleness calculation | Medium |

### Modules That Depend on Opportunities

`contacts`, `dashboard`, `filters`, `reports`, `root` — changes to opportunity types, enums, or resource names have broad downstream effects.

### External / Database Integrations

| Integration | Type | Used For |
|-------------|------|----------|
| Supabase PostgreSQL (`int-db-001`) | PostgREST via composedDataProvider | All CRUD; reads `opportunities_summary` view |
| `sync_opportunity_with_products` RPC | Supabase RPC | Atomic product association sync |
| `archive_opportunity_with_relations` RPC | Supabase RPC | Cascades soft-delete to related records on delete |
| `opportunities_summary` SQL view | Database view | Precomputed fields for list reads |
| `daily-digest` edge function (`int-edge-001`) | Supabase Edge (pg_cron 07:00 UTC) | Consumes opportunity data for digest emails |
| `check-overdue-tasks` edge function (`int-edge-002`) | Supabase Edge (pg_cron 09:00 UTC) | Checks tasks linked to opportunities |
| `capture-dashboard-snapshots` edge function (`int-edge-006`) | Supabase Edge (pg_cron 23:00 UTC) | Snapshots pipeline data for trend charts |
| Sentry (`int-monitor-001`) | Runtime error tracking | Captures provider-layer errors |

---

## Non-Functional Requirements (Security and Performance)

- **RLS:** All access to `opportunities`, `opportunity_contacts`, `opportunity_participants`, and `opportunity_products` must be governed by Row Level Security policies. Policies must validate both FK sides for junction tables. [DB-008, DB-011] [REQUIRES REVIEW — policies not audited in this session]
- **Soft delete visibility:** RLS read policies must filter `deleted_at IS NULL`. [DB-003]
- **No direct Supabase imports in feature UI.** [CORE-001]
- **Security observation:** `.env.development` and `.env.production` contain live Supabase keys committed to version control (sec-001, sec-002 — HIGH severity). This is an existing finding unrelated to this feature but affects the full stack.
- **HTML sanitization:** `description`, `notes`, `decision_criteria`, `close_reason_notes` must pass through `sanitizeHtml` before DB writes to prevent XSS.

---

## Current Implementation Status

| Area | Status | Notes |
|------|--------|-------|
| 7-stage pipeline with Kanban + list view | Implemented | Verified in resource.tsx and BRD |
| Create / Edit / SlideOver UI | Implemented | Lazy-loaded components confirmed |
| Close workflow (win/loss reasons, close date) | Implemented | Zod schemas verified in opportunities-core.ts |
| Product sync via RPC | Implemented | Verified in opportunitiesHandler.ts |
| Soft delete via archive RPC | Implemented | Verified in handler composition |
| Related opportunity validation (same principal, no self-ref) | Implemented | `validateRelatedOpportunity()` verified |
| Duplicate detection | Implemented | `opportunities-duplicates.ts` verified |
| Optimistic locking | Implemented | `version` field in handler |
| Stage enums in shared `constants/` module | Implemented | Circular dependency resolved in commit c74a58343 |
| HTML sanitization at API boundary | Implemented | `sanitizeHtml` import in opportunities-core.ts |
| Test coverage | Partial | `opportunitiesHandler.test.ts` exists; UI tests not sampled |
| RLS policies for junction tables | [REQUIRES REVIEW] | Not sampled in this audit |
| Closed-to-closed transition enforcement | [REQUIRES REVIEW] | Rule exists in BRD; enforcement point not traced to code |
| `probability` auto-calculation from stage | Not implemented (by design) | Fully manual per BRD open question |

---

## Known Gaps and Future Work

1. **ADR needed:** No architectural decision records exist for this feature. Decisions worth documenting:
   - Strangler Fig migration pattern (noted in handler header as "95% compliant")
   - Choice to use `withErrorLogging` as outermost wrapper
   - Product sync via RPC vs. direct junction table CRUD
   - Redirect of `/create` to list + Quick Add pattern

2. **Open questions from BRD §8:**
   - Should stage transition history be tracked in an audit log?
   - Should `probability` auto-calculate from stage, or stay fully manual?
   - Is the 100-contact limit per opportunity sufficient for future enterprise deals?

3. **Test coverage gap:** Test coverage is partial. The handler has tests (`opportunitiesHandler.test.ts`) but UI components, stage transition enforcement, and close-workflow edge cases lack verified test coverage.

4. **RLS audit needed:** Junction table policies (`opportunity_contacts`, `opportunity_participants`, `opportunity_products`) should be audited to confirm they validate both FK sides per DB-008 and enforce soft-delete visibility per DB-003. Run `CMD-006` against current migrations.

5. **Closed-to-closed transition rule:** BRD §3 states this is blocked but the enforcement point (Zod schema vs. handler vs. DB CHECK) was not traced during this audit. [REQUIRES REVIEW]

6. **Performance baseline:** The under-2-second principal dashboard query requirement (NFR-001) has not been verified against real data volumes. Needs a load test or profiling session against production-scale data.

7. **Security findings (existing):** sec-001 and sec-002 (live keys in `.env` files) are pre-existing high-severity findings affecting all features including this one. Track separately.
