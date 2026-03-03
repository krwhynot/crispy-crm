# PRD: Organization Management

**Domain:** Organizations
**Status:** Reverse-Engineered
**Confidence:** 0.95
**Generated:** 2026-03-03
**Last Updated:** 2026-03-03

## Linked Documents
- **BRD:** [docs/brd/organizations.md](../../brd/organizations.md)
- **ADRs:** None - ADR recommended: document architectural decisions for this feature (self-referential hierarchy constraint, wrapper composition order, import wizard flow, CSV column alias strategy)
- **Feature ID:** feat-org-001
- **Module:** src/atomic-crm/organizations
- **Risk Level:** High (risk score 7 / phase 3)

---

## Problem Statement

MFB (the brokerage) manages relationships with four distinct company types: principals (manufacturers), distributors, customers (operators/restaurants), and prospects. Before this CRM, these company records lived in spreadsheets with no enforced hierarchy, no priority tiers, and no linkage to contacts or deals.

The Organization Management feature provides a single place to create, classify, and track every company in the MFB pipeline. It answers the question "what company is this?" for every contact and opportunity in the system. Organization type drives downstream routing (principal vs. distributor vs. operator segment), and priority (A/B/C/D) signals where reps should spend attention.

Without this feature, contacts cannot be assigned to companies, opportunities cannot reference a customer or principal, and segment-based playbook routing breaks down entirely.

---

## Goals

1. Every company in the MFB pipeline has exactly one canonical record in the CRM.
2. Reps can create a new organization in under 60 seconds via Quick Create or the full create form.
3. Duplicate organizations are blocked at creation time through a case-insensitive name check.
4. Organizations are classifiable by type, priority, status, and segment so that list filtering and reporting are accurate.
5. Parent-child hierarchy allows branch locations and subsidiary structures to be modeled.
6. CSV bulk import supports migration from Excel with column alias mapping and a preview/validation step.
7. Soft delete ensures no permanent data loss; records with `deleted_at` set are hidden from all standard views.

---

## Requirements

### Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-001 | Create an organization with required fields: name, organization_type, sales_id (account manager), segment_id, priority, status | `src/atomic-crm/validation/organizations.ts` `createOrganizationSchema` | Yes |
| FR-002 | Prevent duplicate organization names via case-insensitive check before save; show a blocking dialog if a potential duplicate exists | `src/atomic-crm/organizations/useDuplicateOrgCheck.ts`, `DuplicateOrgWarningDialog.tsx` | Yes |
| FR-003 | Quick Create popover allows creating an organization with name, type, priority, segment, city, and state only; Unknown segment is permitted in quick create | `src/atomic-crm/validation/organizations.ts` `organizationQuickCreateSchema`, `QuickCreatePopover.tsx` | Yes |
| FR-004 | Edit an organization across all fields; update schema is partial (all fields optional) except id | `src/atomic-crm/validation/organizations.ts` `updateOrganizationSchema` | Yes |
| FR-005 | Soft-delete an organization (set `deleted_at`); deleted records are hidden from list views | `src/atomic-crm/providers/supabase/handlers/organizationsHandler.ts`, BRD §5 | Yes |
| FR-006 | List view shows organizations in a datagrid with columns: name + hierarchy chips, type badge, priority badge, segment, state, contact count, opportunity count | `src/atomic-crm/organizations/OrganizationList.tsx` | Yes |
| FR-007 | List view supports card grid view as an alternative to the datagrid; view preference is persisted to localStorage | `src/atomic-crm/organizations/OrganizationList.tsx`, `OrganizationCardGrid.tsx`, `OrganizationViewSwitcher.tsx` | Yes |
| FR-008 | List view supports filter by type, priority, segment, and state; supports text search by name | `src/atomic-crm/organizations/OrganizationListFilter.tsx`, `organizationFilterConfig.ts` | Yes |
| FR-009 | List view supports saved queries (named filter presets) | `src/atomic-crm/organizations/OrganizationSavedQueries.tsx` | Yes |
| FR-010 | List view supports CSV export with related data denormalized (segment name, account manager name, parent org name) | `src/atomic-crm/organizations/OrganizationList.tsx` exporter function | Yes |
| FR-011 | List view supports CSV bulk import with: column alias mapping, multi-step preview, validation, and import session tracking via `import_session_id` | `src/atomic-crm/organizations/useOrganizationImport.tsx`, `organizationColumnAliases.ts`, `OrganizationImportDialog.tsx` | Yes |
| FR-012 | Slide-over panel (40vw) opens from the list for quick view or quick edit of an organization without full-page navigation | `src/atomic-crm/organizations/OrganizationSlideOver.tsx` | Yes |
| FR-013 | Slide-over includes tabs for: organization details (right panel), contacts, opportunities, activities | `src/atomic-crm/organizations/slideOverTabs/` | Yes |
| FR-014 | Organization show page displays all fields in read-only mode with hierarchy breadcrumb | `src/atomic-crm/organizations/OrganizationShow.tsx`, `OrganizationHierarchyBreadcrumb.tsx` | Yes |
| FR-015 | Organization edit page uses tabbed form: details, contacts, opportunities, notes, distributors | BRD §6 | Yes |
| FR-016 | Parent-child hierarchy: an organization can have one parent (`parent_organization_id`) and many branch children; `ParentOrganizationSection` displays this relationship; `BranchLocationsSection` lists children | `src/atomic-crm/organizations/ParentOrganizationSection.tsx`, `BranchLocationsSection.tsx`, `ParentOrganizationInput.tsx` | Yes |
| FR-017 | Organization type is constrained to: prospect, customer, principal, distributor; principal type has special handling (PrincipalAwareTypeInput, PrincipalChangeWarning) | `src/atomic-crm/validation/organizations.ts` `organizationTypeSchema`, `PrincipalAwareTypeInput.tsx`, `PrincipalChangeWarning.tsx` | Yes |
| FR-018 | Authorizations tab manages which distributors are authorized for a principal organization; includes AddPrincipalDialog and product exception management | `src/atomic-crm/organizations/AuthorizationsTab.tsx`, `AddPrincipalDialog.tsx`, `ProductExceptionsSection.tsx`, `AddProductExceptionDialog.tsx` | Yes |
| FR-019 | Bulk delete is available from the list view datagrid toolbar | `src/atomic-crm/organizations/OrganizationBulkDeleteButton.tsx`, `OrganizationBulkActionsToolbar.tsx` | Yes |
| FR-020 | Organization status (active/inactive) and status reason are tracked and editable | `src/atomic-crm/organizations/OrganizationStatusSection.tsx`, BRD §2 | Yes |
| FR-021 | Tags (up to 50) can be applied to an organization and edited inline | `src/atomic-crm/validation/organizations.ts` tags field, `OrganizationTagsList.tsx`, `OrganizationTagsListEdit.tsx` | Yes |

### Non-Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| NFR-001 | All organization writes (create, update, delete) must pass Zod schema validation at the provider layer before any database call | `src/atomic-crm/providers/supabase/handlers/organizationsHandler.ts`, CORE-007 | Yes |
| NFR-002 | List reads must use the `organizations_summary` SQL view (precomputed `nb_contacts`, `nb_opportunities`, `nb_notes`) rather than calculating counts in JavaScript | BRD §5, DB-001, DB-002 | Yes |
| NFR-003 | Writes must target the `organizations` base table, not the summary view | BRD §5, CORE-008 | Yes |
| NFR-004 | Provider wrapper chain must follow the order: `baseProvider -> withValidation -> withSkipDelete -> withLifecycleCallbacks -> withErrorLogging` | `src/atomic-crm/providers/supabase/handlers/organizationsHandler.ts`, PRV-004 | Yes |
| NFR-005 | `description` and `notes` fields must be HTML-sanitized before write | `src/atomic-crm/validation/organizations.ts` lines 149-155, 169-173 | Yes |
| NFR-006 | Soft delete sets `deleted_at`; hard deletes are not permitted for this resource | BRD §5, CORE-010, PRV-009 | Yes |
| NFR-007 | `created_at`, `updated_at`, `created_by`, `updated_by` are database-managed; client must not write these fields directly | BRD §2, DB-010 | Yes |
| NFR-008 | ZIP code validation enforces US format only: `12345` or `12345-6789` | `src/atomic-crm/validation/organizations.ts` lines 140-144 | Yes |
| NFR-009 | Phone must have at least 10 digits after stripping non-digit characters | `src/atomic-crm/validation/organizations.ts` lines 128-135 | Yes |
| NFR-010 | Website and LinkedIn URL fields auto-prefix `https://` if no protocol is present; LinkedIn must also validate to the linkedin.com domain | `src/atomic-crm/validation/organizations.ts` `urlAutoPrefix`, `isLinkedinUrl` | Yes |
| NFR-011 | No direct Supabase imports in feature UI components; all data access goes through the composedDataProvider | CORE-001 | Yes |
| NFR-012 | List components use `PremiumDatagrid` wrapper, not raw `Datagrid` from react-admin | `src/atomic-crm/organizations/OrganizationList.tsx`, CORE-016 | Yes |
| NFR-013 | Forms use `createFormResolver` (not `zodResolver` directly) for React Admin compatibility | `src/atomic-crm/organizations/OrganizationCreate.tsx` line 17, CORE-018 | Yes |
| NFR-014 | The self-referential `parent_organization_id` must be excluded from autocomplete results for the current record to prevent hierarchy cycles | `src/atomic-crm/organizations/ParentOrganizationInput.tsx`, PRV-012 | Yes |

---

## Acceptance Criteria

| # | Criteria | Current State |
|---|----------|---------------|
| AC-001 | A user can create an organization by providing name, type, account manager, segment, priority, and status; the record appears in the list after save | Met |
| AC-002 | Creating an organization with the same name as an existing one (case-insensitive) shows the DuplicateOrgWarningDialog before allowing save | Met |
| AC-003 | Quick Create popover accepts name, type, priority, segment, city, state; saves successfully; allows Unknown segment | Met |
| AC-004 | Soft-deleting an organization removes it from the list view and all searches | Met |
| AC-005 | Editing any field on an existing organization and saving persists the change; computed fields (`nb_contacts`, `nb_opportunities`) are not overwritten | Met |
| AC-006 | List view filters by type, priority, segment, and state work individually and in combination | Met |
| AC-007 | CSV export produces a file with all required columns including denormalized names for segment, account manager, and parent organization | Met |
| AC-008 | CSV bulk import parses a file, maps column aliases, shows a preview with row counts, and creates records on confirm | Met |
| AC-009 | Slide-over opens on row click and displays organization details, contacts tab, opportunities tab, and activities tab | Met |
| AC-010 | Parent organization can be assigned; hierarchy breadcrumb and branch chips appear in the list and show views | Met |
| AC-011 | An organization record with `status = inactive` can be set via the OrganizationStatusSection and a status reason optionally selected | Met |
| AC-012 | A principal-type organization's authorization tab lists authorized distributors and allows adding/removing them with product exceptions | Met |
| AC-013 | Tags can be added and removed from an organization record inline | Met |
| AC-014 | Attempting to set `parent_organization_id` to the record's own id is prevented | Met |
| AC-015 | Unknown segment is blocked during full create (`createOrganizationSchema` refine) but permitted during quick create and edit | Met |

---

## Dependencies

### Internal Dependencies

| Module | Role | Risk Level |
|--------|------|------------|
| `src/atomic-crm/providers/supabase/composedDataProvider.ts` | Routes all data operations for organizations; handler registered here | High (Caution Zone) |
| `src/atomic-crm/providers/supabase/handlers/organizationsHandler.ts` | Composes validation, lifecycle, skip-delete, and error-logging wrappers | Medium |
| `src/atomic-crm/validation/organizations.ts` | Canonical Zod schemas for create, update, quick create | Medium |
| `src/atomic-crm/sales` | Account manager assignment (`sales_id`, `secondary_sales_id`) | Medium |
| `src/atomic-crm/contacts` | Contacts linked via `contact_organizations` junction table; count displayed as `nb_contacts` | High |
| `src/atomic-crm/opportunities` | Opportunities reference organizations as customer, principal, or distributor; count displayed as `nb_opportunities` | High |
| `src/atomic-crm/tags` | Tags applied to organizations via array FK `tags[]` | Low |
| `src/atomic-crm/segments` | Segment classification required on create; drives playbook routing | Medium |
| `src/components/ra-wrappers/` | PremiumDatagrid, SectionCard, FilterableBadge, List, CreateButton | Medium |

### External Dependencies

No third-party API integrations specific to this feature. The CSV import uses the browser's native file picker and PapaParse (same dependency as contacts import). Logo upload uses Supabase Storage via `StorageService` [REQUIRES REVIEW: logo upload path not verified in handler].

### Database Tables

| Table | Access Mode | Notes |
|-------|-------------|-------|
| `organizations` | Read (getOne, getMany) + Write (create, update, soft-delete) | Base table for all writes |
| `organizations_summary` | Read (list, getMany) | SQL view with precomputed `nb_contacts`, `nb_opportunities`, `nb_notes`, and `segment_name` |
| `contact_organizations` | Read (via related contacts tab) | Junction table; not written directly by this module |
| `organization_distributors` | Read + Write (via AuthorizationsTab) | M:N junction for principal-distributor authorizations |
| `segments` | Read (for segment selector) | Referenced via `segment_id` FK |
| `tags` | Read (for tag selector) | Referenced via `tags[]` array FK |
| `sales` | Read (for account manager selector) | Referenced via `sales_id`, `secondary_sales_id` FKs |
| `playbook_categories` | Read (for playbook category selector) | Referenced via `playbook_category_id` FK |

---

## Risk Assessment

- **Module Risk Level:** High (risk score 7)
- **Phase Assignment:** Phase 3
- **Test Coverage:** Partial (unit and integration tests exist; see `__tests__/` and `*.spec.tsx` files; CSV import logic and column alias mapping have dedicated test files)
- **Risk Factors from Baseline:**
  - 18,539 LOC across 97 files - second-largest feature module in the codebase
  - 36 commits in 30 days - highest 30-day churn among feature modules
  - Self-referential parent-child hierarchy adds complexity and requires DB constraint (`id != parent_id`)
  - Principal authorization with `organization_distributors` junction table adds cross-module coupling
  - Product exception management couples this module to the Products domain
  - 3 fan-in dependents (opportunities depends on organizations as a core reference)
- **Security Concerns:** RLS policies on `organizations` and `organization_distributors` must enforce authenticated access and rep ownership boundaries; junction-table policies must validate authorization for both linked FKs (DB-008). No external API calls identified in this module.

---

## Data Model Summary

Core required fields on create: `name`, `organization_type`, `sales_id`, `segment_id`, `priority`, `status`.

Key enums (centralized in `src/atomic-crm/validation/organizations.ts` and `src/atomic-crm/organizations/constants.ts`):

- `organizationType`: `prospect` | `customer` | `principal` | `distributor`
- `organizationPriority`: `A` | `B` | `C` | `D`
- `orgStatus`: `active` | `inactive`
- `orgStatusReason`: `active_customer` | `prospect` | `authorized_distributor` | `account_closed` | `out_of_business` | `disqualified`
- `orgScope`: `national` | `regional` | `local`
- `paymentTerms`: `net_30` | `net_60` | `net_90` | `cod` | `prepaid` | `2_10_net_30`

Computed/view-only fields (must be stripped before Zod validation per PRV-002): `nb_contacts`, `nb_opportunities`, `nb_notes`, `segment_name`.

---

## Implementation Status

The feature is fully implemented and in production use. All CRUD operations, hierarchy management, authorization tab, CSV import, and slide-over panel are present and tested at the unit level. The following sub-features are confirmed present in source:

- Full create form with duplicate detection
- Quick create popover (minimal fields)
- Edit form with tabbed layout
- Show page with hierarchy breadcrumb
- Slide-over (view + edit modes, multiple tabs)
- Datagrid list with card grid alternative, view preference persistence
- CSV import wizard with column alias mapping
- CSV export with denormalized related data
- Bulk delete toolbar
- Tags management inline
- Authorizations tab with distributor linking and product exceptions
- Status / status reason section
- Parent organization hierarchy section and branch locations section
- Organization type and priority badge components (reused by other modules)

---

## Open Questions

1. **Credit limit maximum** [BRD §8]: Should `credit_limit` have a configurable upper bound? Currently only `nonnegative()` is enforced (`src/atomic-crm/validation/organizations.ts` line 214).
2. **International addresses** [BRD §8]: The `billing_state` and `shipping_state` fields are limited to 2-character abbreviations (`max(2)`). Is the US-only assumption correct for all org types, or should international formats be supported?
3. **Parent org type constraint** [BRD §8]: Should parent organization type be constrained? For example, should a prospect be prevented from being set as the parent of a principal?
4. **Logo upload path** [REQUIRES REVIEW]: The `logo` field uses `optionalRaFileSchema` and `logo_url` stores a direct URL. The storage upload path and bucket configuration for org logos have not been verified in the handler.
5. **Summary view sync lag**: If a contact is added to an organization, the `nb_contacts` count in the `organizations_summary` view may not refresh immediately in the same React Admin list session. Cache invalidation strategy for cross-resource updates should be documented in an ADR. [REQUIRES REVIEW]
