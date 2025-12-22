# Audit 04: Activities & Notes Polymorphic Relationships

**Date:** 2025-12-12
**Scope:** Activities and Notes modules across all entities
**Status:** ✅ Completed with actionable findings

---

## 1. Executive Summary

The Notes implementation demonstrates **excellent pattern replication** with minimal drift. A shared component architecture (`NotesIterator`, `Note`, `NoteCreate`) handles all three note types through parameterization rather than duplication.

The Activities implementation uses a **multi-reference pattern** (not true polymorphism) with separate nullable foreign keys. This approach is pragmatic for the current scale but has trade-offs.

**Critical Finding:** UI/UX inconsistency in ActivitiesTab components - icon touch targets differ between Contact (44px ✅) and Organization (32px ❌) views.

### Summary Scorecard

| Area | Status | Notes |
|------|--------|-------|
| Notes Tab Components | ✅ Excellent | Near-identical structure |
| Notes Shared Components | ✅ Excellent | Well-designed abstraction |
| Notes Validation Schemas | ✅ Excellent | Consistent, secure patterns |
| Notes Database Schema | ✅ Aligned | Recent migration fixed drift |
| Activities Relationship Pattern | ⚠️ Acceptable | Multi-reference, not polymorphic |
| Activities UI Consistency | ❌ Needs Fix | Touch target violation |

---

## 2. Notes Implementation Matrix

### 2.1 Tab Components

| Aspect | OrganizationNotesTab | OpportunityNotesTab | ContactNotesTab | Consistent? |
|--------|----------------------|---------------------|-----------------|-------------|
| **Location** | `organizations/slideOverTabs/` | `opportunities/slideOverTabs/` | `contacts/` | ⚠️ ContactNotesTab not in slideOverTabs |
| **RecordContextProvider** | ✅ Uses | ✅ Uses | ✅ Uses | ✅ |
| **ReferenceManyField target** | `organization_id` | `opportunity_id` | `contact_id` | ✅ |
| **ReferenceManyField reference** | `organizationNotes` | `opportunityNotes` | `contactNotes` | ✅ |
| **NotesIterator reference** | `organizations` | `opportunities` | `contacts` | ✅ |
| **Helper text** | ✅ Mode-aware | ✅ Mode-aware | ✅ Mode-aware | ✅ |
| **Import path depth** | `../../notes` | `../../notes` | `../notes` | ⚠️ Different depth |

### 2.2 Shared Components

| Component | Purpose | Entity Handling |
|-----------|---------|-----------------|
| `NotesIterator.tsx` | Renders note list + create form | Accepts `reference` prop |
| `Note.tsx` | Display/edit/delete single note | Uses `useResourceContext()` for conditional avatar |
| `NoteCreate.tsx` | Create note form | Uses `foreignKeyMapping` object |
| `NoteInputs.tsx` | Text + date inputs | Generic, no entity awareness |

### 2.3 Database Schema (Post-Migration)

| Column | organization_notes | opportunity_notes | contact_notes | Aligned? |
|--------|-------------------|-------------------|---------------|----------|
| `id` | bigint (PK) | bigint (PK) | bigint (PK) | ✅ |
| `{entity}_id` | bigint (FK) | bigint (FK) | bigint (FK) | ✅ |
| `text` | text | text | text | ✅ |
| `attachments` | jsonb | jsonb | jsonb | ✅ (fixed by migration) |
| `sales_id` | bigint (FK) | bigint (FK) | bigint (FK) | ✅ |
| `date` | timestamptz | timestamptz | timestamptz | ✅ |
| `created_at` | timestamptz | timestamptz | timestamptz | ✅ |
| `updated_at` | timestamptz | timestamptz | timestamptz | ✅ |
| `updated_by` | bigint (FK) | bigint (FK) | bigint (FK) | ✅ |
| `created_by` | bigint (FK) | bigint (FK) | bigint (FK) | ✅ |
| `deleted_at` | timestamptz | timestamptz | timestamptz | ✅ |

### 2.4 Validation Schemas

All note schemas in `src/atomic-crm/validation/notes.ts`:

```typescript
// Base schema with z.strictObject() - GOOD security practice
export const baseNoteSchema = z.strictObject({
  text: z.string().min(1).max(10000).transform(sanitizeHtml),
  date: z.coerce.date(),
  sales_id: z.union([z.string().min(1), z.number().min(1)]),
  attachments: z.array(attachmentSchema).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Entity-specific schemas extend base
export const contactNoteSchema = baseNoteSchema.extend({
  contact_id: z.union([z.string().min(1), z.number().min(1)]),
});
// Same pattern for opportunity and organization
```

**Positive observations:**
- Uses `z.strictObject()` for mass assignment prevention ✅
- Uses `z.coerce.date()` for form input handling ✅
- Has `.max()` limits for DoS prevention ✅
- HTML sanitization on text input ✅

---

## 3. Pattern Replication Quality Assessment

### 3.1 Notes: Excellent (A)

**What works well:**
1. Single `NoteCreate` component with `foreignKeyMapping` lookup
2. Single `Note` component with `useResourceContext()` for entity-aware rendering
3. Validation schemas follow extension pattern from base
4. Database schema fully aligned via migration

**Minor drift detected:**
1. `ContactNotesTab.tsx` lives in `contacts/` not `contacts/slideOverTabs/` (inconsistent directory structure)
2. Import path depth differs (`../../notes` vs `../notes`) - cosmetic only

### 3.2 Activities: Acceptable (B-)

The Activities tabs (`contacts/ActivitiesTab.tsx` and `organizations/ActivitiesTab.tsx`) have **copy-paste drift**:

| Aspect | Contact ActivitiesTab | Organization ActivitiesTab |
|--------|----------------------|---------------------------|
| **Page size** | Hardcoded `50` | `ACTIVITY_PAGE_SIZE` constant |
| **Icon container** | `w-11 h-11` (44px ✅) | `w-8 h-8` (32px ❌) |
| **Organization link** | ✅ Shown | ❌ Omitted (intentional) |
| **Contact link** | N/A | N/A |

---

## 4. Polymorphic Relationship Analysis

### 4.1 Current Implementation: Multi-Reference Pattern

The `activities` table uses **nullable foreign keys** rather than true polymorphism:

```sql
-- activities table structure
contact_id      bigint  REFERENCES contacts(id)       -- nullable
organization_id bigint  REFERENCES organizations(id)  -- nullable
opportunity_id  bigint  REFERENCES opportunities(id)  -- nullable
```

### 4.2 Evaluation

| Criterion | Assessment |
|-----------|------------|
| **Query Simplicity** | ✅ Excellent - `WHERE contact_id = ?` is simple |
| **Referential Integrity** | ✅ Full FK constraints |
| **Index Efficiency** | ⚠️ 3 separate partial indexes needed |
| **Sparse Data** | ⚠️ Most rows have 2 NULL FK columns |
| **Orphan Prevention** | ❌ No constraint requiring at-least-one-FK |
| **Type Safety** | ✅ No magic strings for entity types |
| **Scalability** | ⚠️ Adding new entity types requires migration |

### 4.3 Alternative: True Polymorphic Pattern

```sql
-- Would look like this (NOT currently used):
notable_type    text    CHECK (notable_type IN ('contact', 'organization', 'opportunity'))
notable_id      bigint  NOT NULL
-- + conditional FK trigger or application-level validation
```

**Recommendation:** Current pattern is acceptable for MFB's scale (6 users, 3 entity types). True polymorphism adds complexity without proportional benefit here.

---

## 5. UI/UX Consistency Findings

### 5.1 Notes Components

| Aspect | Status | Details |
|--------|--------|---------|
| Visual design | ✅ Consistent | All use same `Note` component |
| Interaction patterns | ✅ Consistent | Same hover-reveal edit/delete |
| Empty states | ✅ Consistent | Helper text varies by entity |
| Loading states | ✅ Consistent | `NotesIterator` handles uniformly |
| Touch targets | ✅ Consistent | Edit/Delete buttons inherit 44px from Button |

### 5.2 Activities Components

| Aspect | Contact | Organization | Issue? |
|--------|---------|--------------|--------|
| Icon container | `w-11 h-11` | `w-8 h-8` | ❌ **WCAG violation** |
| Log button | `h-11` | `h-11` | ✅ |
| Related links | `min-h-11` | `min-h-11` | ✅ |
| Empty state | ✅ | ✅ | ✅ |
| Error state | ✅ | ✅ | ✅ |

**Critical Issue:** Organization ActivitiesTab icon container is 32px, violating the 44px minimum touch target requirement.

---

## 6. Database Schema Review

### 6.1 Notes Tables - Fully Aligned

Migration `20251212034757_align_notes_schemas.sql` addressed:
- ✅ `attachments` column: TEXT[] → JSONB
- ✅ FK delete behavior: CASCADE → SET NULL for `sales_id`
- ✅ RLS policies: Added ownership-based UPDATE/DELETE
- ✅ Performance indexes: Added partial indexes for common queries
- ✅ Triggers: Added `updated_at` and `updated_by` auto-population

### 6.2 Activities Table

| Aspect | Status |
|--------|--------|
| RLS enabled | ✅ Yes |
| Soft delete | ✅ `deleted_at` column |
| Audit fields | ✅ `created_at`, `updated_at`, `created_by` |
| FK indexes | ✅ Individual indexes exist |
| Composite indexes | ⚠️ Could add `(organization_id, created_at DESC)` |

---

## 7. Edge Cases & Concerns

### 7.1 Note on Soft-Deleted Entity

**Question:** What happens to notes when parent entity is soft-deleted?

**Current Behavior:** Notes remain visible if you navigate to the parent directly. RLS filters on `notes.deleted_at`, not parent's `deleted_at`.

**Recommendation:** Add cascade soft-delete trigger OR application-level filtering by parent's deletion status.

### 7.2 Activity Logged Against Inaccessible Entity

**Question:** Can user see activities linked to entities they can't access?

**Current Behavior:** Activities use shared-access RLS (all authenticated users). If RLS is later tightened on parent entities, activities may become orphaned from UI perspective.

**Risk Level:** Low for current shared-access model.

### 7.3 Bulk Delete Cascade

**Question:** Delete entity → what happens to notes/activities?

**Current Behavior:**
- Notes: FK has `ON DELETE CASCADE` (for hard delete only; soft delete doesn't trigger)
- Activities: FK has `ON DELETE SET NULL`

**Recommendation:** For soft-delete cascade, implement trigger or application-level handler.

### 7.4 Permission Model for Notes

**Question:** Can viewers add notes? Edit others' notes?

**Current RLS:**
- SELECT: All authenticated users (shared read)
- INSERT: All authenticated users
- UPDATE/DELETE: Only note author (`sales_id` match)

**Implication:** Users can see all notes but only edit/delete their own. This is appropriate for team collaboration.

---

## 8. Remediation Tasks

### Priority 1: Critical (WCAG Violation)

```
[ ] Fix Organization ActivitiesTab icon size
    File: src/atomic-crm/organizations/ActivitiesTab.tsx
    Line: 110
    Change: w-8 h-8 → w-11 h-11
```

### Priority 2: Code Quality

```
[ ] Extract shared ActivityTimelineEntry component
    Currently duplicated between contacts/ActivitiesTab and organizations/ActivitiesTab
    Create: src/atomic-crm/activities/components/ActivityTimelineEntry.tsx

[ ] Replace hardcoded page size in contacts/ActivitiesTab
    Line 25: perPage: 50 → ACTIVITY_PAGE_SIZE (import from constants)

[ ] Move ContactNotesTab to slideOverTabs directory for consistency
    From: src/atomic-crm/contacts/ContactNotesTab.tsx
    To: src/atomic-crm/contacts/slideOverTabs/ContactNotesTab.tsx
```

### Priority 3: Future Considerations

```
[ ] Add at-least-one-FK constraint to activities table
    Ensures every activity is linked to at least one entity
    Implementation: CHECK constraint or trigger

[ ] Consider cascade soft-delete for notes/activities
    When parent entity is soft-deleted, also soft-delete related notes
    Implementation: Trigger function

[ ] Add composite indexes for activity queries
    CREATE INDEX idx_activities_org_date ON activities(organization_id, created_at DESC)
    WHERE deleted_at IS NULL;
```

---

## 9. Appendix: Type Definition Inconsistencies

Minor inconsistencies in `src/atomic-crm/types.ts`:

```typescript
// ContactNote - has status?: undefined
export interface ContactNote extends Pick<RaRecord, "id"> {
  contact_id: Identifier;
  text: string;
  created_at: string;
  updated_at: string;
  status?: undefined;  // For compatibility
  attachments?: AttachmentNote[];
  sales_id?: Identifier;
}

// OrganizationNote - has date field, sales_id required
export interface OrganizationNote extends Pick<RaRecord, "id"> {
  organization_id: Identifier;
  text: string;
  date: string;        // Present here but not in ContactNote
  created_at: string;
  updated_at: string;
  sales_id: Identifier; // Required, not optional like ContactNote
  attachments?: AttachmentNote[];
  status?: undefined;
}
```

**Recommendation:** Align type definitions:
1. Add `date` to `ContactNote` interface
2. Make `sales_id` consistently optional or required across all note types

---

## 10. Conclusion

The Notes implementation is a **model example** of pattern replication done right. The use of shared components with parameterization (`NoteCreate` with `foreignKeyMapping`, `Note` with `useResourceContext()`) demonstrates clean architecture.

The Activities implementation has accumulated minor copy-paste drift that should be addressed, most critically the touch target violation in the Organization view.

The multi-reference pattern for activity relationships is pragmatic for current scale. True polymorphism would add complexity without proportional benefit for MFB's 6-user, 3-entity-type use case.

**Overall Grade: B+**
- Notes: A
- Activities: B-
- Schema: A-
- UI/UX: B (one violation)
