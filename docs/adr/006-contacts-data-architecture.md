# ADR-006: Contacts Data Architecture

**Status:** Proposed
**Date:** 2026-03-04
**Deciders:** Engineering team
**Feature:** Contacts (feat-con-001)

## Context

Contacts is a high-risk feature (fan_out=10) with several architectural decisions that evolved over time:

1. The original `contact_organizations` junction table was replaced by a direct `organization_id` FK — a significant data model migration
2. CSV import is the primary bulk data entry path, requiring a multi-stage pipeline with security sanitization
3. Bulk operations (reassign, export, delete) need to work within the cascade archive pattern
4. JSONB array columns (`email`, `phone`) require normalization after reads

## Decision

### Direct FK Replaces Junction Table (Belongs-To Pattern)

Migrate from `contact_organizations` many-to-many junction to a direct `organization_id bigint NOT NULL` FK on the `contacts` table. The business rule is that every contact belongs to exactly one organization — the many-to-many model was over-engineered for the actual domain.

Enforcement at every layer:
- **DB:** `organization_id bigint NOT NULL` constraint
- **Zod:** `if (!data.organization_id) → "Organization is required"` in `contacts-core.ts`
- **Form:** `OrganizationPicker` with `isRequired`

The `contact_organizations` table still exists in the database with zombie stored procedures (`get_organization_contacts`, `set_primary_organization`), but the live application uses `contacts.organization_id` exclusively. The view surfaces the organization name as `company_name` (computed, stripped before writes).

### Multi-Stage CSV Import Pipeline

A 6-step import flow designed for security and data quality:

1. **Parse:** PapaParse reads CSV with a 4-row structure (row 0-1: instructions/empty, row 2: headers, row 3+: data)
2. **Header alias resolution:** `columnAliases.ts` maps dozens of CSV header variants (e.g., `"fname"`, `"given name"`, `"prenom"`) to canonical field names. A `FULL_NAME_SPLIT_MARKER` triggers automatic splitting into `first_name` + `last_name`
3. **Security sanitization:** `sanitizeCsvValue()` strips formula injection characters (`=`, `+`, `-`, `@`) and HTML from all cell values — defense against CSV injection attacks
4. **Data quality decisions:** `applyDataQualityTransformations()` handles org-only rows (auto-fills `first_name="General"`, `last_name="Contact"`) and contacts without email/phone (skip unless user approves)
5. **Zod validation:** `importContactSchema` (more permissive than core — accepts `organization_name` string instead of `organization_id` FK, auto-coerces phone numbers to strings)
6. **Batch processing:** Valid rows process in batches of 10 with a concurrency limiter (max 10 simultaneous requests). Organizations and tags are looked up/created with in-memory caches to avoid duplicate creation

**Preview/dry-run mode** passes `meta: { dryRun: true }` to skip DB writes. **Abort support** checks an `AbortController` signal at each batch boundary; partial imports are left in place (no rollback — idempotent creates prevent duplicates on re-import). **Rate limiting** gates import start via `contactImportLimiter.canProceed()`.

### Cascade Archive via RPC

Standard soft delete is disabled on the handler (`supportsSoftDelete: false`). Deletes route through `archive_contact_with_relations` RPC, which atomically archives the contact plus all linked activities, tasks, contact_notes, interaction_participants, and opportunity_contacts. The `beforeGetList` callback manually applies `deleted_at IS NULL` since factory soft delete is disabled.

### JSONB Array Normalization

`email`, `phone`, and `tags` are JSONB array columns that can be `null` from the database. The `afterReadTransform: normalizeJsonbArrays` callback ensures they are always arrays after reads, preventing `null.map()` errors throughout the UI.

### Self-Manager Guard

DB-level `CONSTRAINT contacts_no_self_manager CHECK (id IS DISTINCT FROM manager_id)` prevents a contact from being their own manager. Mirrored in the Zod schema for UX-friendly error messages.

### Summary View for Reads

`contacts_summary` view (with `security_invoker`) joins `organizations` for `company_name` and uses lateral subqueries for `nb_notes`, `nb_tasks`, `nb_activities` (all soft-delete aware). Full-text search via auto-generated `search_tsv` tsvector column.

## Consequences

### Positive

- Direct FK is simpler, faster (no junction table JOIN), and matches the actual 1:many business relationship
- CSV import pipeline catches formula injection before data enters the system
- Header alias resolution handles messy real-world CSV exports from various CRM tools
- Batch processing with concurrency limits prevents API overload during large imports
- Cascade RPC guarantees no orphaned related records

### Negative

- Junction table still exists as technical debt — zombie stored procedures reference it
- No rollback on partial CSV imports — user must manually clean up failed imports
- Import schema (`importContactSchema`) diverges from core schema — two schemas to maintain
- Sequential bulk reassign (one update per contact) is O(n) — no batch update API

### Neutral

- `secondary_sales_id` column exists in validation and bulk reassign but may not be in the original DDL — added in a later migration
- `department_type` enum values are not documented in the ADR — they are business-configurable

## Alternatives Considered

### Option A: Keep Junction Table (Many-to-Many)

Maintain `contact_organizations` for contacts that work across multiple organizations. Rejected: MFB's domain model is strictly one contact per organization. The junction table added complexity (double JOINs, ambiguous "primary" organization) without business value.

### Option B: Client-Side CSV Parsing Only

Parse and validate CSV entirely in the browser, send validated JSON to the API. Rejected: the import needs server-side organization/tag lookup and creation, which requires multiple API calls per row. A hybrid approach (client parse + server batch process) was chosen.

### Option C: Transactional Import (All-or-Nothing)

Wrap the entire CSV import in a single database transaction. Rejected: large imports (500+ contacts) would hold a transaction open for minutes, risking timeouts and lock contention. Batch processing with idempotent creates is more resilient.

### Option D: Soft Delete Without Cascade

Set `deleted_at` on the contact only. Rejected: orphaned activities and tasks would appear in dashboards, and `opportunity_contacts` junction records would reference deleted contacts.

## References

- `src/atomic-crm/contacts/` — feature module
- `src/atomic-crm/validation/contacts/` — core and import Zod schemas
- `src/atomic-crm/contacts/csvProcessor.ts` — PapaParse transformer and sanitization
- `src/atomic-crm/contacts/contactImport.logic.ts` — data quality business logic
- `src/atomic-crm/contacts/useContactImport.tsx` — import hook with caching and concurrency
- `src/atomic-crm/providers/supabase/handlers/contactsHandler.ts` — provider composition
- `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts` — lifecycle callbacks
- `supabase/migrations/20260214003329_remote_schema.sql` — DB schema and views
- `docs/prd/contacts/PRD-contacts.md`
- `docs/brd/contacts.md`
