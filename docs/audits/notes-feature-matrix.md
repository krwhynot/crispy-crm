# Notes Resource Feature & CRUD Matrix

**Audit Date:** 2025-11-28
**Auditor:** Claude (AI-assisted)
**Status:** Validated with user decisions

---

## Overview

This document captures the complete feature inventory for the Notes resource, comparing implemented code against PRD requirements and industry best practices from Salesforce and HubSpot. It includes user-validated decisions on implementation gaps.

**Key Finding:** Notes are implemented as three separate tables (`contactNotes`, `opportunityNotes`, `organizationNotes`) rather than the PRD's conceptual model where `note` is one of 13 activity types. The code also includes features (attachments, status system) that conflict with PRD decisions.

---

## Feature Matrix (Component-Level)

### Note.tsx (View/Edit Single Note)

| Feature | Code Status | PRD Requirement | Industry Pattern | Notes |
|---------|-------------|-----------------|------------------|-------|
| Display note text | ✅ Implemented | ✅ Required | ✅ Standard | Multi-line text with paragraph preservation |
| Author attribution | ✅ Implemented | ✅ Required | ✅ Standard | Shows sales rep via ReferenceField |
| Timestamp (relative) | ✅ Implemented | ✅ Required | ✅ Standard | RelativeDate component |
| Edit button (hover) | ✅ Implemented | ✅ Required | ✅ Standard | Inline edit mode toggle |
| Delete button (hover) | ✅ Implemented | ✅ Required | ✅ Standard | Undoable soft delete |
| **Status badge** | ⚠️ Implemented | ❌ Not in PRD | ❌ Not standard | **Decision: Remove** |
| **Attachments display** | ⚠️ Implemented | ❌ PRD Decision #24 | ✅ Industry supports | **Decision: Remove UI** |
| Avatar by resource type | ✅ Implemented | ✅ Required | ✅ Standard | Contact/Org avatar based on context |

### NoteCreate.tsx (Create Note Form)

| Feature | Code Status | PRD Requirement | Industry Pattern | Notes |
|---------|-------------|-----------------|------------------|-------|
| Create note form | ✅ Implemented | ✅ Required | ✅ Standard | CreateBase wrapper |
| Auto-link to parent record | ✅ Implemented | ✅ Required | ✅ Standard | foreignKeyMapping handles contact/opp/org |
| Auto-set current user | ✅ Implemented | ✅ Required | ✅ Standard | identity.id → sales_id |
| Auto-set current date | ✅ Implemented | ✅ Required | ✅ Standard | getCurrentDate() default |
| Update contact last_seen | ✅ Implemented | ✅ Required | ✅ Standard | Only for contact notes |
| Toast notification | ✅ Implemented | ✅ Required | ✅ Standard | "Note added" notify |

### NoteInputs.tsx (Form Fields)

| Feature | Code Status | PRD Requirement | Industry Pattern | Notes |
|---------|-------------|-----------------|------------------|-------|
| Text input (multiline) | ✅ Implemented | ✅ Required | ✅ Standard | TextInput with placeholder |
| Date/time picker | ✅ Implemented | ✅ Optional | ✅ Standard | Hidden by default, expandable |
| **File attachments** | ⚠️ Implemented | ❌ PRD Decision #24 | ✅ Industry supports | **Decision: Remove UI** |
| "Show options" toggle | ✅ Implemented | ✅ UX feature | ✅ Standard | Reveals date/attachments |

### NotesIterator.tsx (List Notes)

| Feature | Code Status | PRD Requirement | Industry Pattern | Notes |
|---------|-------------|-----------------|------------------|-------|
| List notes chronologically | ✅ Implemented | ✅ Required | ✅ Standard | useListContext data mapping |
| Create form at top | ✅ Implemented | ✅ Required | ✅ Standard | NoteCreate inline |
| Separator between notes | ✅ Implemented | ✅ UX feature | ✅ Standard | Shadcn Separator |
| **Search/filter notes** | ❌ Missing | ⚠️ Post-MVP | ✅ Industry standard | **Post-MVP feature** |
| **Pin important note** | ❌ Missing | ❌ Not in PRD | ✅ HubSpot has this | **Post-MVP feature** |

### StatusSelector.tsx

| Feature | Code Status | PRD Requirement | Industry Pattern | Notes |
|---------|-------------|-----------------|------------------|-------|
| Cold/Warm/Hot/In-Contract | ⚠️ Implemented | ❌ Not in PRD | ❌ Not standard | **Decision: Remove entirely** |
| Color-coded badges | ⚠️ Implemented | ❌ Not in PRD | ❌ Not standard | Status belongs on parent record |

### NoteAttachments.tsx

| Feature | Code Status | PRD Requirement | Industry Pattern | Notes |
|---------|-------------|-----------------|------------------|-------|
| Image grid preview | ⚠️ Implemented | ❌ PRD Decision #24 | ✅ Industry supports | **Decision: Remove UI** |
| File link list | ⚠️ Implemented | ❌ PRD Decision #24 | ✅ Industry supports | **Decision: Remove UI** |
| MIME type detection | ⚠️ Implemented | ❌ PRD Decision #24 | ✅ Industry supports | Keep schema for post-MVP |

---

## CRUD Matrix

| Operation | contactNotes | opportunityNotes | organizationNotes | PRD Status |
|-----------|--------------|------------------|-------------------|------------|
| **CREATE** | ✅ Works | ✅ Works | ✅ Works | ✅ Aligned |
| **READ (List)** | ✅ Works | ✅ Works | ✅ Works | ✅ Aligned |
| **READ (Single)** | ✅ Works | ✅ Works | ✅ Works | ✅ Aligned |
| **UPDATE** | ✅ Works | ✅ Works | ✅ Works | ✅ Aligned |
| **DELETE** | ✅ Works | ✅ Works | ✅ Works | ✅ Soft delete |
| **SEARCH** | ❌ Missing | ❌ Missing | ❌ Missing | Post-MVP |
| **FILTER** | ❌ Missing | ❌ Missing | ❌ Missing | Post-MVP |
| **EXPORT** | ❌ Missing | ❌ Missing | ❌ Missing | Not required |

---

## Permission Matrix (RLS)

| Operation | contactNotes | opportunityNotes | organizationNotes | PRD 3.3 Requirement |
|-----------|--------------|------------------|-------------------|---------------------|
| **SELECT** | Team-wide | Team-wide | Team-wide (non-deleted) | ✅ Aligned |
| **INSERT** | Any auth user | Any auth user | Any auth user | ✅ Aligned |
| **UPDATE** | Author only* | Author only* | Author only (explicit) | ⚠️ **Gap: Need Manager/Admin** |
| **DELETE** | Author only* | Author only* | Author only (explicit) | ⚠️ **Gap: Need Manager/Admin** |

*inferred from code behavior - `contact_notes` and `opportunity_notes` tables lack explicit RLS policies in reviewed migrations

**PRD Section 3.3 states:** "Soft delete available to: Record owner, Manager, Admin"

**Decision:** Add Manager/Admin override to UPDATE and DELETE policies for all 3 note tables.

---

## Database Schema Summary

### contactNotes Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | bigint | NO | PK with sequence |
| contact_id | bigint | NO | FK to contacts |
| text | text | NO | Note content |
| attachments | text[] | YES | **Keep schema, remove UI** |
| sales_id | bigint | YES | FK to sales |
| date | timestamptz | NO | User-specified date |
| created_at | timestamptz | YES | Auto timestamp |
| updated_at | timestamptz | YES | Auto timestamp |

### opportunityNotes Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | bigint | NO | PK with sequence |
| opportunity_id | bigint | NO | FK to opportunities |
| text | text | NO | Note content |
| attachments | text[] | YES | **Keep schema, remove UI** |
| sales_id | bigint | YES | FK to sales |
| date | timestamptz | NO | User-specified date |
| created_at | timestamptz | YES | Auto timestamp |
| updated_at | timestamptz | YES | Auto timestamp |

### organizationNotes Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | bigint | NO | PK with sequence |
| organization_id | bigint | NO | FK to organizations |
| text | text | NO | Note content |
| attachments | jsonb | YES | **Keep schema, remove UI** (improved over text[]) |
| sales_id | bigint | YES | FK to sales |
| date | timestamptz | NO | User-specified date |
| created_at | timestamptz | YES | Auto timestamp |
| updated_at | timestamptz | YES | Auto timestamp |
| deleted_at | timestamptz | YES | Soft delete |
| updated_by | bigint | YES | Audit trail |

---

## User-Validated Decisions

These decisions were validated against industry best practices (Salesforce, HubSpot via Perplexity research) and confirmed by the user.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Note Attachments | **Remove UI (align with PRD)** | PRD Decision #24 says "No attachments in MVP". Keep schema for post-MVP. |
| Q2 | StatusSelector (Cold/Warm/Hot) | **Remove entirely** | Not in PRD. Industry pattern: status belongs on parent record (Contact/Deal), not individual notes. |
| Q3 | Notes vs Activities | **Migrate to Activities (post-MVP)** | PRD Section 6.1 defines `note` as one of 13 activity types. Unification enables unified timeline. |
| Q4 | Update/Delete Permissions | **Add Manager/Admin override** | PRD Section 3.3 explicitly allows "Record owner, Manager, Admin" for soft delete. |
| Q5 | Search/Filter | **Add basic text search (post-MVP)** | Industry standard (Salesforce SOSL, HubSpot search). Acceptable to defer for MVP. |
| Q6 | Multi-Association | **Add junction table (post-MVP)** | Both Salesforce (ContentDocumentLink) and HubSpot (associations API) support many-to-many note linking. |

---

## Industry Research Summary

Research conducted via Perplexity API on 2025-11-28:

### Salesforce Notes Implementation

- **Enhanced Notes** built on `ContentNote` object with `ContentVersion` for versioning
- Supports up to **2 GB** of notes/attachments per record
- **Privacy flag** (`SharingPrivacy`) allows hiding notes from users with record access
- `ContentDocumentLink` enables **many-to-many** associations (one note → multiple records)
- Full-text search via **SOSL** (Salesforce Object Search Language)
- Notes appear in **Activity Timeline** alongside emails, calls, meetings

### HubSpot Notes Implementation

- Notes as activities via **Engagements API** (now Notes API v3)
- `hs_note_body` field with **65,536 character limit**
- `hs_timestamp` determines position in record timeline
- `hs_attachment_ids` supports **semicolon-separated** file references
- `hs_pinned_engagement_id` allows **pinning** one note to record top
- **Team-based permissions**: All notes / Team's notes / Own notes
- Notes appear in unified **Activity Timeline**

### Key Differences from Crispy-CRM

| Aspect | Salesforce/HubSpot | Crispy-CRM (Current) |
|--------|-------------------|---------------------|
| Data Model | Single notes entity with polymorphic associations | 3 separate tables per parent type |
| Multi-Association | Many-to-many (note → multiple records) | Single foreign key per table |
| Status System | Status on parent record, not notes | StatusSelector on notes (**remove**) |
| Attachments | Fully supported | Implemented but **PRD says no** |
| Timeline | Unified activity timeline | Separate notes tab per record |

---

## Implementation Tasks

Priority-ordered tasks to close gaps:

### MVP Tasks

| Priority | Task | Effort | PRD Reference |
|----------|------|--------|---------------|
| 1 | Remove FileInput from NoteInputs.tsx | Small | Decision #24 |
| 2 | Remove NoteAttachments.tsx usage from Note.tsx | Small | Decision #24 |
| 3 | Remove StatusSelector component and `showStatus` prop | Small | Not in PRD |
| 4 | Remove `noteStatuses` from ConfigurationContext | Small | Cleanup |
| 5 | Add Manager/Admin RLS override for organizationNotes | Medium | PRD 3.3 |
| 6 | Verify/add RLS policies for contactNotes, opportunityNotes | Medium | PRD 3.3 |

### Post-MVP Tasks

| Priority | Task | Effort | Rationale |
|----------|------|--------|-----------|
| 1 | Migrate notes to unified Activities system | Large | PRD 6.1 defines note as activity type |
| 2 | Add basic text search within notes | Medium | Industry standard |
| 3 | Create `note_associations` junction table | Medium | Enable multi-record linking |
| 4 | Re-enable attachment UI | Small | Schema already exists |
| 5 | Add note pinning capability | Small | HubSpot pattern |

---

## Files Affected

### Remove Attachment UI

- `src/atomic-crm/notes/NoteInputs.tsx` - Remove FileInput and FileField imports/usage
- `src/atomic-crm/notes/Note.tsx` - Remove NoteAttachments component usage

### Remove StatusSelector

- `src/atomic-crm/notes/StatusSelector.tsx` - Delete file or keep for future
- `src/atomic-crm/notes/Note.tsx` - Remove `showStatus` prop and Status component
- `src/atomic-crm/notes/NotesIterator.tsx` - Remove `showStatus` prop
- `src/atomic-crm/notes/NoteCreate.tsx` - Remove any status-related code
- `src/atomic-crm/notes/index.ts` - Remove StatusSelector export
- `src/atomic-crm/root/defaultConfiguration.ts` - Remove `defaultNoteStatuses`
- `src/atomic-crm/root/ConfigurationContext.tsx` - Remove `noteStatuses` from context

### Update RLS Policies

- `supabase/migrations/YYYYMMDDHHMMSS_update_notes_rls.sql` - New migration needed

---

## Appendix: Zod Validation Schema

The existing validation schema in `src/atomic-crm/validation/notes.ts` is well-structured:

```typescript
// Base schema - keep as-is
const baseNoteSchema = z.object({
  text: z.string().min(1, "Note text is required"),
  date: z.string().min(1, "Date is required"),
  sales_id: z.union([z.string(), z.number()]),
  attachments: z.array(attachmentSchema).optional(), // Keep for post-MVP
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
```

**No changes needed** to validation schema. The `attachments` field should remain optional for future use.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-28 | Initial audit with 6 user-validated decisions |
