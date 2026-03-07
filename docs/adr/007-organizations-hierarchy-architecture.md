# ADR-007: Organizations Hierarchy Architecture

**Status:** Proposed
**Date:** 2026-03-04
**Deciders:** Engineering team
**Feature:** Organizations (feat-org-001)

## Context

Organizations is a high-risk feature (fan_out=10) that models MFB's multi-level business relationships: Principals (manufacturers), Distributors (warehouse/delivery), and Operators (restaurants). Key architectural decisions:

1. Organizations support a **self-referential hierarchy** (parent/child) requiring cycle prevention at three layers
2. The **authorization model** uses intentionally asymmetric RLS — reads are open, writes are role-gated
3. **Duplicate detection** is advisory (UX-level hard block) rather than database-enforced
4. Four **organization types** drive conditional UI rendering and feature gating

## Decision

### Three-Layer Cycle Prevention for Self-Referential Hierarchy

Organizations have a `parent_organization_id bigint` nullable FK back to `organizations.id`, enabling hierarchies like "Sysco Corporation → Sysco Chicago → Sysco Chicago South." Cycle prevention is enforced at three independent layers:

1. **DB CHECK constraint** (`organizations_no_self_parent`): `id IS DISTINCT FROM parent_organization_id` — prevents immediate self-loops
2. **DB trigger** (`check_organization_cycle`, BEFORE INSERT/UPDATE OF `parent_organization_id`): recursive CTE walks the ancestor chain. If the current org's `id` appears anywhere, it raises `'Circular reference detected: Organization % would create a cycle'`
3. **UI** (`ParentOrganizationInput`): calls `useOrganizationDescendants(record.id)` RPC, which returns all descendant IDs via a recursive CTE. Passes `excludeIds = [self, ...descendants]` to the dropdown. The dropdown is gated behind `isReady` loading state so exclusions are populated before the user can interact.

**Parent deletion protection:** Two triggers (`check_parent_deletion`, `prevent_parent_deletion`) block hard-deleting any organization that has non-deleted children. Soft-delete of parents with active opportunities is also blocked by `prevent_org_delete_with_active_opps`.

**Hierarchy fields in view:** `organizations_summary` precomputes `child_branch_count`, `total_contacts_across_branches`, `total_opportunities_across_branches`, and `parent_organization_name` via lateral subqueries.

### Intentionally Asymmetric RLS (Open Read, Gated Write)

| Policy | Operation | Rule |
|---|---|---|
| `organizations_select_all` | SELECT | `deleted_at IS NULL` — all authenticated users see all orgs |
| `organizations_insert_owner` | INSERT | `created_by = current_sales_id()` OR `is_admin_or_manager()` |
| `organizations_update_role_based` | UPDATE | `is_admin_or_manager()` OR `can_access_by_role(sales_id, created_by)` |
| `organizations_delete_owner_or_admin` | DELETE | `deleted_at IS NULL` AND (`created_by = current_sales_id()` OR `is_admin_or_manager()`) |

SELECT is intentionally permissive because organizations are shared team data — reps need to see all orgs to link contacts and opportunities. Writes are gated by ownership or role. The `organizations_summary` view uses `security_invoker=on` to inherit the caller's RLS context.

### Advisory Duplicate Detection (No DB Unique Constraint)

`useDuplicateOrgCheck` performs a case-insensitive `ilike` search on organization name at form submit time. If a match is found, `DuplicateOrgWarningDialog` presents a hard block with two choices: "View Existing" or "Change Name." There is no bypass path.

**No DB-level unique constraint by design.** Similar names are legitimately different entities in MFB's domain (e.g., "Sysco Chicago" vs "Sysco - Chicago" vs "Sysco Chicago South"). A unique constraint would require complex normalization rules that don't fit the business reality.

The check is soft-delete aware indirectly — list reads route through `organizations_summary` which already filters `deleted_at IS NULL`.

### Four Organization Types with Conditional Features

Defined as `z.enum(["prospect", "customer", "principal", "distributor"])` — single source of truth in `src/atomic-crm/validation/organizations.ts`.

| Type | Business Meaning | UI Behavior |
|---|---|---|
| `prospect` | Potential customer in pipeline (80% of new orgs) | Default for new orgs; listed first in choices |
| `customer` | Active paying account | Standard form |
| `principal` | Food manufacturer MFB represents (only 9) | Type change triggers `PrincipalChangeWarning`; limited creation |
| `distributor` | Warehouse/delivery partner (Sysco, USF, etc.) | `AuthorizationsTab` renders for distributor-type only, tracking principal authorizations with product-level exceptions |

**Scope model** (orthogonal to type): `org_scope` (national/regional/local) models geographic level. `is_operating_entity` boolean distinguishes ordering locations from corporate/brand groupings. Smart default: selecting "national" scope auto-sets `is_operating_entity = false`.

### Cascade Archive via RPC

`archive_organization_with_relations(org_id)` archives the organization plus contacts (recursively), opportunities, activities, tasks, and organization_notes in a single transaction. Storage cleanup is fire-and-forget after the RPC.

## Consequences

### Positive

- Three-layer cycle prevention makes it nearly impossible to create hierarchy loops — each layer catches different failure modes
- Open read RLS reduces complexity for cross-team views (pipeline, reports, dashboard)
- Advisory duplicate detection balances data quality with legitimate name variation
- Type-conditional UI keeps forms simple for the 80% case (prospect) while supporting specialized workflows (distributor authorizations)

### Negative

- Recursive CTE in cycle check and descendant lookup could be expensive for deep hierarchies (mitigated by MFB's flat structure — typically 2-3 levels)
- No DB-level duplicate prevention means duplicates can be created via direct SQL or API
- Two triggers for parent deletion protection (`check_parent_deletion` + `prevent_parent_deletion`) appear redundant — may be a migration artifact
- 14 computed fields must be stripped before writes — any new view column requires adding to the strip list

### Neutral

- `useOrganizationVariant` hook derives UI behavior from `organization_type` — this adds indirection but keeps form components type-agnostic
- The `get_organization_descendants` RPC was patched for empty `search_path` (`20260217192050`) — a security fix that required explicit `public.` schema prefixes

## Alternatives Considered

### Option A: Adjacency List with Application-Layer Cycle Detection

Store `parent_organization_id` but detect cycles only in the application. Rejected: direct SQL updates (migrations, admin scripts) could bypass app-layer checks, corrupting the hierarchy.

### Option B: Materialized Path (Closure Table)

Store the full ancestor path for each org. Faster reads for deep trees, but MFB hierarchies are shallow (2-3 levels), and the recursive CTE approach avoids maintaining a separate path table.

### Option C: DB Unique Constraint on Normalized Name

Add a unique index on `lower(trim(name))`. Rejected: legitimate business entities like "Sysco Chicago" and "Sysco - Chicago" would conflict. The advisory UI check provides sufficient protection for the actual data quality problem (exact or near-exact duplicates).

### Option D: Separate Tables per Organization Type

`principals`, `distributors`, `customers`, `prospects` as separate tables. Rejected: organizations change type over time (prospect → customer), and many queries need to span all types (opportunity creation, report filters).

## References

- `src/atomic-crm/organizations/` — feature module
- `src/atomic-crm/validation/organizations.ts` — Zod schemas and type enum
- `src/atomic-crm/organizations/ParentOrganizationInput.tsx` — UI cycle prevention
- `src/atomic-crm/organizations/useDuplicateOrgCheck.ts` — duplicate detection hook
- `src/atomic-crm/organizations/DuplicateOrgWarningDialog.tsx` — hard-block dialog
- `src/atomic-crm/organizations/authorization-types.ts` — distributor authorization model
- `src/hooks/useOrganizationDescendants.ts` — RPC hook for hierarchy traversal
- `src/atomic-crm/providers/supabase/handlers/organizationsHandler.ts` — provider composition
- `src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts` — lifecycle callbacks
- `supabase/migrations/20260214003329_remote_schema.sql` — DB schema, triggers, RLS policies
- `supabase/migrations/20260217192050_fix_org_descendants_search_path.sql` — RPC security fix
- `docs/prd/organizations/PRD-organizations.md`
- `docs/brd/organizations.md`
