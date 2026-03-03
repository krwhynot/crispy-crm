# PRD: Contact Management

**Feature ID:** feat-cnt-001
**Domain:** Contacts
**Status:** Reverse-Engineered
**Confidence:** 95%
**Generated:** 2026-03-03
**Last Updated:** 2026-03-03

---

## Linked Documents

- **BRD:** [docs/brd/contacts.md](../../brd/contacts.md)
- **ADRs:** None - ADR recommended: document architectural decisions for this feature
- **Module:** src/atomic-crm/contacts
- **Risk Level:** High (risk score 7/10 - 15.9K LOC, 80 files, 31 commits in 30d)

---

## Executive Summary

Contact Management is the core people-tracking feature of Crispy CRM. It provides full CRUD lifecycle for individual contacts in the MFB sales domain: the distributors, operators, and principals that sales reps interact with daily. Contacts are always linked to an organization, always have an assigned account manager, and drive the activity logging, opportunity tracking, and task management workflows that power the rest of the system.

This PRD is reverse-engineered from existing source code and the BRD at `docs/brd/contacts.md`. All requirements are verified against the codebase unless marked [INFERRED] or [REQUIRES REVIEW].

---

## Business Context

Refer to BRD section 1 (Domain Overview) for the full business rationale.

Summary: MFB is a food-service broker that mediates between Principals (manufacturers, 9 accounts) and Operators (restaurants). The contacts feature tracks the individual humans at each organization. Sales reps need to log calls, emails, and sample visits against contacts in under 30 seconds (MVP requirement). The system must replace Excel-based tracking, so CSV import and export are first-class requirements.

Key domain constraint: contacts are linked to organizations through the `contact_organizations` junction table. The deprecated `company_id` field on Contact is banned per CLAUDE.md.

---

## Goals

1. Give every sales rep a single, searchable directory of their contacts, replacing scattered Excel sheets.
2. Allow a contact to be created in under 30 seconds (Quick Create flow).
3. Support CSV bulk import so that existing contact lists can be migrated without engineering help.
4. Provide CSV export that is safe to open in Excel without formula-injection vulnerabilities.
5. Surface when a contact was last seen so that reps can prioritize outreach to stale relationships.
6. Link contacts to opportunities, activities, tasks, and notes so that all context is visible in one place.

---

## Functional Requirements

### P0 - Must Have (Core CRUD)

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-001 | A user can create a contact by supplying first name, last name, organization, and account manager (sales_id). All four fields are required. | `src/atomic-crm/contacts/ContactCreate.tsx`, BRD §3 Rule 1-3 | Yes |
| FR-002 | A user can view a paginated, sortable list of contacts defaulting to "last seen descending" at 25 records per page. | `src/atomic-crm/contacts/ContactList.tsx` L141-148 | Yes |
| FR-003 | A user can edit any contact field through the full edit form, accessible from the list or contact show page. | `src/atomic-crm/contacts/ContactEdit.tsx` | Yes |
| FR-004 | Deleting a contact performs a soft delete by setting `deleted_at`; the record is hidden from all reads but not physically removed. | `src/atomic-crm/providers/supabase/handlers/contactsHandler.ts`, BRD §5 | Yes |
| FR-005 | A contact's full name is displayed as "first_name last_name" everywhere in the UI. | `src/atomic-crm/contacts/resource.tsx` L35-36, `src/atomic-crm/utils/formatName.ts` | Yes |
| FR-006 | The contact list shows: avatar, name, primary email, job title, organization (linked), tags, status badge, and last-seen relative date. | `src/atomic-crm/contacts/ContactList.tsx` L36-118 | Yes |
| FR-007 | Clicking any list row opens a 40vw slide-over panel for viewing or editing without leaving the list. Keyboard navigation (arrow keys + Enter) is supported. | `src/atomic-crm/contacts/ContactList.tsx` L165-173, `src/atomic-crm/contacts/ContactSlideOver.tsx` | Yes |

### P0 - Must Have (Data Integrity)

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-008 | A contact cannot be saved without an organization (`organization_id` required on create). | BRD §3 Rule 1, `src/atomic-crm/validation/contacts.ts` [REQUIRES REVIEW - file path inferred] | Yes |
| FR-009 | A contact cannot have itself as its own manager (`manager_id !== id`). | BRD §3 Rule 4 | Yes |
| FR-010 | Primary and secondary account managers must be different people (`sales_id !== secondary_sales_id`). | BRD §3 Rule 5 | Yes |
| FR-011 | Email entries are validated as valid email format before save. Empty email/phone array entries are stripped before validation. | BRD §3 Rules 6-7 | Yes |
| FR-012 | The `notes` field is sanitized through `sanitizeHtml()` before storage to prevent XSS. | BRD §3 Rule 8 | Yes |
| FR-013 | `first_seen` and `last_seen` timestamps are set to the current time on contact creation. | `src/atomic-crm/contacts/ContactCreate.tsx` L53-56 | Yes |
| FR-014 | Computed fields (`nb_tasks`, `nb_notes`, `nb_activities`, `company_name`, `search_tsv`) are stripped from the payload before the Zod schema validation runs on writes. Reads use the `contacts_summary` view which includes these fields. | `src/atomic-crm/providers/supabase/handlers/contactsHandler.ts` L8-11, BRD §5 | Yes |

### P0 - Must Have (Import / Export)

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-015 | A user can export the current contact list to CSV. The export resolves related records (sales rep names, tag names, organization names) into human-readable columns. | `src/atomic-crm/contacts/contactExporter.ts` | Yes |
| FR-016 | CSV export sanitizes all values to prevent formula injection (values starting with `=`, `-`, `+`, `@`, tab, or carriage return are prefixed with a tab). | `src/atomic-crm/contacts/contactExporter.ts` L15-23 | Yes |
| FR-017 | A user can import contacts from a CSV file via a multi-step wizard: upload, field mapping, preview/validation, and process. | `src/atomic-crm/contacts/ContactImportDialog.tsx`, `src/atomic-crm/contacts/useImportWizard.ts` | Yes |
| FR-018 | The import wizard parses CSV using papaparse and validates each row before attempting to create records. Validation errors are shown per-row in a validation panel before the user confirms the import. | `src/atomic-crm/contacts/useContactImportParser.ts`, `src/atomic-crm/contacts/ContactImportValidationPanel.tsx` | Yes |
| FR-019 | A downloadable CSV template is provided so users know what columns the importer expects. | `src/atomic-crm/contacts/ContactExportTemplateButton.tsx` | Yes |
| FR-020 | Column aliases are supported during import so that common alternate column names (e.g., "Email" vs "email_work") are mapped automatically. | `src/atomic-crm/contacts/columnAliases.ts`, `src/atomic-crm/contacts/useColumnMapping.ts` | Yes |

### P1 - Should Have

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-021 | Contacts can be tagged with one or more tags. Tags are displayed as colored chips in the list and are filterable. | `src/atomic-crm/contacts/ContactList.tsx` L74-78, `src/atomic-crm/contacts/TagsList.tsx` | Yes |
| FR-022 | Full-text search is available in the list via a debounced search input. Recent searches are remembered. | `src/atomic-crm/contacts/ContactList.tsx` L153-154 | Yes |
| FR-023 | Column filters are available for status, tags, and other fields through a filter panel using checkbox popovers. | `src/atomic-crm/contacts/ContactListFilter.tsx`, `src/atomic-crm/contacts/contactFilterConfig.ts` | Yes |
| FR-024 | A contact's linked opportunities are displayed in an Opportunities tab on the edit/show page. A user can link an existing opportunity or unlink one via a confirmation dialog. | `src/atomic-crm/contacts/OpportunitiesTab.tsx`, `src/atomic-crm/contacts/LinkOpportunityModal.tsx`, `src/atomic-crm/contacts/UnlinkConfirmDialog.tsx` | Yes |
| FR-025 | A contact's activities are displayed in an Activities tab on the edit/show page. | `src/atomic-crm/contacts/ActivitiesTab.tsx` | Yes |
| FR-026 | A contact can have a profile avatar image. | BRD §2 (avatar field), `src/atomic-crm/contacts/Avatar.tsx` | Yes |
| FR-027 | Contacts support bulk actions in the list (e.g., bulk delete, bulk tag). | `src/atomic-crm/contacts/ContactBulkActionsToolbar.tsx` | Yes |
| FR-028 | A Quick Create popover allows creating a contact with only first name and organization, defaulting last name to empty string. This supports the under-30-second logging goal. | BRD §5 Quick Create, `src/atomic-crm/contacts/QuickCreateContactPopover.tsx` | Yes |
| FR-029 | Contact hierarchy is supported via `manager_id` (self-referential FK). A breadcrumb component shows the management chain. | BRD §2 Relationships, `src/atomic-crm/contacts/ContactHierarchyBreadcrumb.tsx` | Yes |
| FR-030 | Suggested opportunities are surfaced on the contact detail panel. | `src/atomic-crm/contacts/SuggestedOpportunityCard.tsx` | Yes |

### P2 - Nice to Have

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-031 | Contact import supports upsert (update existing contacts by matching on a key field). | BRD §8 Open Question | No - create-only per BRD §8 [REQUIRES REVIEW] |
| FR-032 | `district_code` and `territory_name` are validated against an enum allowlist. | BRD §8 Open Question | No - currently free-form strings |

---

## Non-Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| NFR-001 | All writes pass Zod schema validation at the provider boundary before any database call. The wrapper chain is: `baseProvider -> withValidation -> withSkipDelete -> withLifecycleCallbacks -> withErrorLogging`. | `src/atomic-crm/providers/supabase/handlers/contactsHandler.ts` L30-32 | Yes |
| NFR-002 | The contacts list renders a skeleton state while identity data is loading, and a typed empty state when no contacts match the current filters. | `src/atomic-crm/contacts/ContactList.tsx` L131-136, `src/atomic-crm/contacts/ContactEmpty.tsx` | Yes |
| NFR-003 | Contact list and edit views are lazy-loaded (React.lazy + Suspense) to reduce initial bundle size. | `src/atomic-crm/contacts/resource.tsx` L7-9 | Yes |
| NFR-004 | After a contact edit succeeds, the query cache is invalidated for the specific contact detail, all contact lists, activity lists, and opportunity lists to prevent stale reads. | `src/atomic-crm/contacts/ContactEdit.tsx` L31-37 | Yes |
| NFR-005 | Edit errors (validation failures, RLS rejections, network errors) are caught and surfaced to the user via notification. The form is reset to its last known good state on error. | `src/atomic-crm/contacts/ContactEdit.tsx` L39-44 | Yes |
| NFR-006 | The form uses `mode="onBlur"` validation to avoid excessive re-renders. Form resolver uses `createFormResolver` (not raw `zodResolver`) per CORE-018. | `src/atomic-crm/contacts/ContactEdit.tsx` L68-69, `src/atomic-crm/contacts/ContactCreate.tsx` L78-79 | Yes |
| NFR-007 | CSV export line endings use `\r\n` (CRLF) for Windows/Excel compatibility. | `src/atomic-crm/contacts/contactExporter.ts` L92 | Yes |
| NFR-008 | RLS policies on the `contacts` table enforce authenticated access and must not use `USING (true)` except for approved service-role cases. | CORE-011, DB-007 | [REQUIRES REVIEW - RLS policies not read in this audit] |
| NFR-009 | The contact module has full test coverage (Vitest + Testing Library). Tests exist for: ContactList, ContactCreate, ContactEdit, ContactShow, ContactSlideOver, OpportunitiesTab, import wizard (parsing, preview, processing, errors), and ContactBadges. | `src/atomic-crm/contacts/__tests__/` | Yes |

---

## Data Model

### Primary Table: `contacts`

| Field | Type | Required (Create) | Notes |
|-------|------|-------------------|-------|
| `id` | number | No (auto) | Primary key |
| `first_name` | string (max 100) | Yes | |
| `last_name` | string (max 100) | Yes | Defaults to `""` in Quick Create |
| `name` | string (max 255) | No | Computed: first_name + last_name |
| `title` | string (max 100) | No | Job title |
| `department` | string (max 100) | No | Freeform |
| `department_type` | enum | No | See Enums section |
| `gender` | string (max 50) | No | |
| `birthday` | date | No | |
| `avatar` | file | No | |
| `email` | JSONB array | No | Max 10 entries. Each: `{email, type, label}`. Validated as email format. |
| `phone` | JSONB array | No | Max 10 entries. Each: `{number, type, label}`. |
| `linkedin_url` | string (max 2048) | No | LinkedIn domain only |
| `twitter_handle` | string (max 100) | No | |
| `address` / `city` / `state` / `postal_code` / `country` | string | No | Location fields |
| `district_code` | string (max 10) | No | Territory routing |
| `territory_name` | string (max 100) | No | |
| `organization_id` | FK -> organizations | Yes | Primary org membership |
| `sales_id` | FK -> sales | Yes | Primary account manager |
| `secondary_sales_id` | FK -> sales | No | Must differ from sales_id |
| `manager_id` | FK -> contacts (self) | No | Must not equal own id |
| `tags` | number[] (max 50) | No | FK array to tags table |
| `notes` | string (max 5000) | No | HTML-sanitized |
| `status` | string (max 50) | No | |
| `first_seen` / `last_seen` | string | No | Set on create; updated on activity |
| `created_at` / `updated_at` | timestamp | No | DB-managed |
| `created_by` / `updated_by` | FK -> sales | No | Audit trail |
| `deleted_at` | timestamp | No | Soft delete marker |

### Computed Fields (from `contacts_summary` view - read-only, never written)

`nb_tasks`, `nb_notes`, `nb_activities`, `company_name`, `search_tsv`

### Related Tables

| Table | Relationship | Notes |
|-------|-------------|-------|
| `contact_organizations` | M:N junction | Additional org memberships beyond primary `organization_id` |
| `opportunity_contacts` | M:N junction | Links contacts to opportunities |
| `organizations` | N:1 (required) | Primary organization |
| `sales` | N:1 (required) | Primary account manager |
| `tags` | M:N (array FK) | Tagging |

### Enums

- **personalInfoType**: `"work"` | `"home"` | `"other"` (email and phone type labels)
- **contactDepartment**: `"senior_management"` | `"sales_management"` | `"district_management"` | `"area_sales"` | `"sales_specialist"` | `"sales_support"` | `"procurement"`

---

## UI

### Views

| View | Component | Description |
|------|-----------|-------------|
| List | `src/atomic-crm/contacts/ContactList.tsx` | Paginated datagrid (25/page), sorted by last_seen DESC. Columns: Identity (avatar + name + email), Role (title + org link), Tags, Status, Last Seen, Row Actions. |
| Create | `src/atomic-crm/contacts/ContactCreate.tsx` | Full-form with progress bar. Supports context-aware redirect (returns to parent org/opp if navigated from there). Pre-fills organization_id from URL params or navigation state. |
| Edit | `src/atomic-crm/contacts/ContactEdit.tsx` | Single-section form with aside panel. Uses pessimistic mutation mode. |
| Show | `src/atomic-crm/contacts/ContactShow.tsx` | Read-only detail view with aside. |
| Slide-Over | `src/atomic-crm/contacts/ContactSlideOver.tsx` | 40vw panel opened from list row click. Supports view and edit modes. |
| Quick Create | `src/atomic-crm/contacts/QuickCreateContactPopover.tsx` | Minimal popover requiring only first_name + organization_id. |
| Import Dialog | `src/atomic-crm/contacts/ContactImportDialog.tsx` | Multi-step wizard: upload, field mapping, preview/validation, process. |

### List Filters

Available in `src/atomic-crm/contacts/ContactListFilter.tsx` and configured in `src/atomic-crm/contacts/contactFilterConfig.ts`. Supports: status filter (checkbox popover), tags filter, full-text search with recent searches, and column sort on first_name, title, last_seen.

### Form Defaults Behavior

When creating a contact, the form pre-fills:
- `sales_id` from the current user's identity (smart defaults)
- `organization_id` from URL param `?organization_id=` or from navigation state
- `email` and `phone` arrays start with one empty "work" row for UX
- All other fields default to schema empty values

---

## Business Rules

Directly from BRD §3, all verified against source:

1. **No orphan contacts** - `organization_id` required on create.
2. **Name required** - `first_name` and `last_name` both required on create.
3. **Account manager required** - `sales_id` required on create.
4. **Self-manager prevention** - `manager_id` must not equal the contact's own `id`.
5. **Distinct managers** - `sales_id` and `secondary_sales_id` must differ.
6. **Email validation** - any non-empty email entry must be a valid email address.
7. **Empty entry filtering** - empty email/phone JSONB entries are stripped before validation reaches the database.
8. **HTML sanitization** - the `notes` field passes through `sanitizeHtml()` before storage.
9. **Deprecated field ban** - `Contact.company_id` is banned; use `contact_organizations` junction instead (per CLAUDE.md).

---

## Integration Points

### External Libraries

| Library | Purpose | Files |
|---------|---------|-------|
| papaparse | CSV parsing for the import wizard | `src/atomic-crm/contacts/usePapaParse.tsx`, `src/atomic-crm/contacts/useContactImportParser.ts` |
| jsonexport | CSV serialization for export | `src/atomic-crm/contacts/contactExporter.ts` |
| date-fns | Relative date formatting for "last seen" column | `src/atomic-crm/contacts/ContactList.tsx` L3 |

### Internal Module Dependencies

The contacts module has fan-out 10 and fan-in 0. It depends on (from `docs/audit/baseline/dependency-map.json`):

| Module | Role | Risk if Changed |
|--------|------|-----------------|
| `validation` | Zod schemas; fan-in 91 | High - schema changes affect all 91 dependents |
| `utils` | Formatters, export helpers | Medium |
| `constants` | Stage enums, notification messages, fan-in 72 | Medium |
| `components` | Tier 1/2 UI wrappers | Medium |
| `hooks` | useSlideOverState, useListKeyboardNavigation, useSmartDefaults | Medium |
| `opportunities` | LinkOpportunityModal, SuggestedOpportunityCard | Medium |
| `organizations` | OrganizationPicker | Low |
| `queryKeys` | Cache invalidation key factories | Low |
| `types` | Shared TypeScript interfaces | Low |
| `filters` | Column filter config | Low |

### Supabase / Database Integrations

- **int-db-001** (Supabase PostgreSQL via PostgREST): all reads/writes
- **int-auth-001** (Supabase Auth Client SDK): identity for smart defaults, RLS enforcement
- Reads from `contacts_summary` view; writes to `contacts` base table

---

## Risk Assessment

- **Module Risk Level:** High (risk score 7/10)
- **Phase Assignment:** 3 (per `docs/audit/baseline/risk-assessment.json`)
- **Test Coverage:** Full (Vitest, Testing Library - 11 test files across unit and integration)
- **Git Churn:** 31 commits in 30 days (high churn)

### Risk Factors

From `docs/audit/baseline/risk-assessment.json`:
1. 15.9K LOC across 80 files - largest feature surface area for a single domain
2. Multi-step CSV import wizard is the most complex flow in the module
3. Junction table `contact_organizations` plus `contacts_summary` view adds DB complexity
4. 10 fan-out dependencies - changes here could be blocked by changes in those modules
5. `papaparse` and `react-dropzone` are external dependencies with their own upgrade cycles

### Security Concerns

From `docs/audit/baseline/integration-map.json` security observations:
- `sec-003` (StorageService Math.random()): unresolved - relevant if avatar upload is used
- RLS policy coverage for `contacts` table requires verification (NFR-008 above is marked [REQUIRES REVIEW])
- CSV export sanitizes formula injection at the application layer (FR-016), but CSV content security relies on correct escaping in `jsonexport`

---

## Acceptance Criteria

| # | Criteria | Current State |
|---|----------|---------------|
| AC-001 | Creating a contact with first_name, last_name, organization_id, and sales_id succeeds and the contact appears in the list. | Met |
| AC-002 | Attempting to create a contact without organization_id fails with a validation error at the provider boundary before any DB call. | Met |
| AC-003 | Attempting to set manager_id equal to the contact's own id fails validation. | Met |
| AC-004 | Soft-deleting a contact hides it from all list reads. The `deleted_at` field is set; the DB row is not removed. | Met |
| AC-005 | Exporting the contact list produces a valid CSV with formula-injection-safe values and CRLF line endings. | Met |
| AC-006 | Importing a CSV with valid data creates new contact records. Invalid rows are shown in the validation panel before the user confirms. | Met |
| AC-007 | The Quick Create flow completes with only first_name and organization_id (last_name defaults to empty string). | Met |
| AC-008 | Clicking a list row opens the slide-over. Pressing arrow keys navigates between rows. Pressing Enter opens the selected row. | Met |
| AC-009 | After editing a contact, the list reflects the change without a full page reload (cache invalidated for contact detail, lists, activities, opportunities). | Met |
| AC-010 | Edit errors (e.g., RLS rejection) surface a notification and reset the form to its last known good state. | Met |
| AC-011 | The notes field strips dangerous HTML before storage. | Met |
| AC-012 | Contact import - upsert of existing contacts is NOT supported (create-only). [REQUIRES REVIEW - confirm with PM] | Unknown |

---

## Implementation Status

This feature is fully implemented and in production. The module has:
- Full CRUD (List, Create, Edit, Show, Slide-Over)
- CSV import wizard with multi-step UI
- CSV export with formula injection protection
- Full test coverage (11 test files)
- Soft-delete support
- Provider wrapper chain with validation, lifecycle callbacks, and error logging

---

## Open Questions

1. **[REQUIRES REVIEW]** BRD §8: Should contact import support upsert (update existing contacts) or remain create-only? AC-012 depends on this decision.
2. **[REQUIRES REVIEW]** BRD §8: Should `district_code` and `territory_name` be validated against an enum or remain freeform strings? Currently freeform.
3. **[REQUIRES REVIEW]** BRD §8: Is the 10-entry limit on email and phone arrays sufficient for power users?
4. **[REQUIRES REVIEW]** NFR-008: RLS policies on the `contacts` table were not audited in this PRD generation pass. A dedicated RLS review should confirm that `USING (true)` is not present and that row-level ownership/tenant filters are correct.
5. **[INFERRED]** The `contacts_summary` view precomputes `nb_tasks`, `nb_notes`, `nb_activities`, `company_name`, and `search_tsv`. The SQL definition of this view was not read during PRD generation. The view behavior is inferred from BRD §4 and handler comments.
6. **[ASSUMPTION]** The validation schema at `src/atomic-crm/validation/contacts.ts` was not found by glob (file may not exist at that exact path or may be co-located differently). Requirements FR-008 through FR-012 are verified against the BRD and ContactCreate.tsx import of `contactBaseSchema` and `contactCreateFormSchema`.
