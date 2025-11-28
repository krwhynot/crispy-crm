# Contact Resource Feature & CRUD Matrix

**Audit Date:** 2025-11-28
**Auditor:** Claude (AI-assisted)
**Status:** Validated with user decisions

---

## Overview

This document captures the complete feature inventory for the Contact resource, comparing implemented code against PRD requirements. It includes user-validated decisions on implementation gaps.

---

## Feature Matrix (Component-Level)

### ContactList (`/contacts`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| View contacts in data grid | ✅ Implemented | ✅ Required | PremiumDatagrid with 7 columns |
| Search contacts (q filter) | ✅ Implemented | ✅ Required | Full-text search via SearchInput |
| Filter by Last Activity | ✅ Implemented | ✅ Required | Today, This week, Before this week, etc. |
| Filter by Tags | ✅ Implemented | ✅ Required | Multi-select tag badges |
| Filter by Account Manager | ✅ Implemented | ✅ Required | "Me" filter button |
| **Filter by Organization** | ❌ Missing | ✅ Required | **MVP #19 - Must implement** |
| Sort by first_name, last_name, last_seen | ✅ Implemented | ✅ Required | SortButton component |
| Export to CSV | ✅ Implemented | ✅ Required | jsonexport with field mapping |
| Create contact (button) | ✅ Implemented | ✅ Required | TopToolbar CreateButton |
| Floating Create button | ✅ Implemented | ✅ Required | FloatingCreateButton component |
| CSV Import button | ⚠️ Disabled | 🔧 Disabled | Commented out, awaiting testing |
| Bulk actions toolbar | ✅ Implemented | ✅ Required | BulkActionsToolbar component |
| Click row → SlideOver view | ✅ Implemented | ✅ Required | useSlideOverState hook |
| Pagination (25/page) | ✅ Implemented | ✅ Required | Default perPage=25 |

### ContactSlideOver (Quick View/Edit Panel)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| View mode | ✅ Implemented | ✅ Required | ResourceSlideOver wrapper |
| Edit mode toggle | ✅ Implemented | ✅ Required | onModeToggle callback |
| Details tab | ✅ Implemented | ✅ Required | ContactDetailsTab |
| Activities tab | ✅ Implemented | ✅ Required | ActivitiesTab component |
| Notes tab | ✅ Implemented | ✅ Required | ContactNotesTab |
| **Files tab** | ⚠️ Placeholder | ❌ Post-MVP | **Decision: Remove tab** |

### ContactShow (`/contacts/:id/show`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| View contact details | ✅ Implemented | ✅ Required | ResponsiveGrid layout |
| View associated organizations | ✅ Implemented | ✅ Required | Organizations section |
| Primary organization badge | ✅ Implemented | ✅ Required | Blue badge "Primary" |
| Details tab | ✅ Implemented | ✅ Required | Organizations list |
| Notes tab | ✅ Implemented | ✅ Required | NotesIterator + NoteCreate |
| Activities tab | ✅ Implemented | ✅ Required | ActivitiesTab component |
| Opportunities tab | ✅ Implemented | ✅ Required | OpportunitiesTab component |
| Edit button (sidebar) | ✅ Implemented | ✅ Required | EditButton in ContactAside |
| Tags management (sidebar) | ✅ Implemented | ✅ Required | TagsListEdit component |
| Tasks list + Add Task (sidebar) | ✅ Implemented | ✅ Required | TasksIterator + AddTask |

### ContactCreate (`/contacts/create`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Create new contact | ✅ Implemented | ✅ Required | CreateBase with transform |
| Identity tab | ✅ Implemented | ✅ Required | first_name, last_name |
| Position tab | ✅ Implemented | ✅ Required | title, department, org |
| Contact Info tab | ✅ Implemented | ✅ Required | email, phone, linkedin |
| Account tab | ✅ Implemented | ✅ Required | sales_id, notes |
| Cancel with unsaved warning | ✅ Implemented | ✅ Required | window.confirm on dirty |
| Save & Close | ✅ Implemented | ✅ Required | Redirect to /contacts |
| Save & Add Another | ✅ Implemented | ✅ Required | Form reset after save |
| **Organization required** | ❌ Missing | ✅ Required | **MVP #18 - Must enforce** |

### ContactEdit (`/contacts/:id`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Edit existing contact | ✅ Implemented | ✅ Required | EditBase with redirect |
| Same form tabs as Create | ✅ Implemented | ✅ Required | Shared ContactInputs |
| Sidebar with contact info | ✅ Implemented | ✅ Required | ContactAside component |
| Redirect to show after save | ✅ Implemented | ✅ Required | redirect="show" |

---

## CRUD Matrix

| Operation | Status | Gap | Required Action |
|-----------|--------|-----|-----------------|
| **CREATE** | ⚠️ Partial | Org not required | **MVP #18**: Enforce org requirement |
| **READ (List)** | ⚠️ Partial | No org filter | **MVP #19**: Add organization filter |
| **READ (Single)** | ✅ Works | — | None |
| **UPDATE** | ✅ Works | — | None |
| **DELETE** | ✅ Works | Soft delete | Verified working correctly |
| **SEARCH** | ✅ Works | — | Full-text search functional |
| **FILTER** | ⚠️ Partial | No org filter | **MVP #19**: Add organization filter |
| **SORT** | ✅ Works | — | 3 sort fields available |
| **EXPORT** | ✅ Works | — | CSV export functional |
| **IMPORT** | ⚠️ Disabled | Intentionally | Keep disabled per PRD decision |

---

## User-Validated Decisions

These decisions were validated against industry best practices (Salesforce, HubSpot) and confirmed by the user.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Organization Required | **Enforce** | Salesforce best practice - prevents orphan contacts |
| Q2 | Organization Filter | **Add filter** | Standard CRM feature, explicitly in PRD |
| Q3 | CSV Import | **Keep disabled** | PRD says disabled until tested |
| Q4 | Files Tab | **Remove tab** | PRD says no attachments in MVP |
| Q5 | Soft Delete | **Verified working** | `deleted_at` column exists, views filter correctly |
| Q6 | Multi-Org Relationship | **Single org only** | Simplify for MFB use case |

---

## Industry Research Summary

Research conducted via Perplexity API on 2025-11-28:

### Contact-Organization Relationship
- **Salesforce**: Allows orphan contacts but treats them as "private contacts" with restricted visibility
- **Best Practice**: Most organizations require Account field to prevent hidden contacts
- **Decision**: Enforce organization requirement (matches PRD intent)

### Soft Delete
- **Salesforce**: Uses soft delete by default (Recycle Bin)
- **Industry Standard**: Soft delete is the norm for data safety and compliance
- **Verification**: Crispy-CRM correctly implements soft delete with `deleted_at` column

### Multi-Organization Contacts
- **HubSpot**: Now supports multiple company associations per contact
- **Salesforce**: Supports many-to-many via junction objects
- **Decision**: Simplified to single-org for MFB's food brokerage use case

### CSV Import Timing
- **Industry Guidance**: CSV import is a secondary feature for MVP launch
- **Recommendation**: Focus on core functionality first, add data migration tools post-launch
- **Decision**: Keep disabled (already in PRD)

---

## Implementation Tasks

Priority-ordered tasks to close gaps:

| Priority | Task | Effort | PRD Reference |
|----------|------|--------|---------------|
| 1 | Enforce `organization_id` as required in ContactCreate | Medium | MVP #18 |
| 2 | Add organization filter to ContactListFilter | Small | MVP #19 |
| 3 | Remove Files tab from ContactSlideOver | Trivial | Decision #24 |
| 4 | Simplify multi-org UI to single-org | Medium | Q6 Decision |

---

## Database Schema Notes

From `supabase/migrations/20251018152315_cloud_schema_fresh.sql`:

```sql
-- contacts table (lines 1257-1286)
CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" bigint NOT NULL,
    "organization_id" bigint,  -- Currently nullable, should be required
    "deleted_at" timestamp with time zone,  -- Soft delete column
    -- ... other fields
);

COMMENT ON COLUMN "public"."contacts"."organization_id" IS
    'Primary organization for this contact. Replaces many-to-many contact_organizations relationship.';
```

The `contact_organizations` junction table is marked as **DEPRECATED**:
> "DEPRECATED: Junction table for contact-organization relationships. New contacts should use contacts.organization_id directly. Kept for historical data only."

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-28 | Initial audit with user-validated decisions |
