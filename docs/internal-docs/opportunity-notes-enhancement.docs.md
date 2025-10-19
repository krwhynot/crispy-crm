# Opportunity Notes Enhancement Research

Research focused on adding Contact and Organization dropdowns to the "Add a note" section in OpportunityEdit's Notes & Activity tab.

## Overview

The current note creation flow in OpportunityEdit uses a simple textarea (`NoteInputs`) for adding notes to opportunities. The system uses separate tables (`contactNotes` and `opportunityNotes`) with a reference-specific architecture. Notes do NOT use the `activities` table - they are standalone entities with their own dedicated tables. Contact notes support a `status` field (configurable via `ConfigurationContext.noteStatuses`), but opportunity notes do not have status functionality.

## Relevant Files

### Core Note Implementation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityEdit.tsx`: Main edit form with tabs (Details, Notes & Activity)
  - Lines 65-77: Notes tab rendering with `ReferenceManyField` and `NotesIterator`
  - Line 70: Resource is `opportunityNotes` (not `activities`)
  - Line 72: Empty state shows `NoteCreate` component

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NoteCreate.tsx`: Note creation component
  - Lines 18-21: Foreign key mapping (`contacts: contact_id`, `opportunities: opportunity_id`)
  - Lines 34-44: Uses `CreateBase` with `NoteInputs` as form body
  - Lines 46-102: `NoteCreateButton` with transform logic for foreign keys and date handling
  - Line 72-78: Contact-specific logic (updates `last_seen` for contacts only, not opportunities)
  - Line 92: Default date handling via `getCurrentDate()` from validation

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NoteInputs.tsx`: Form inputs for notes
  - Lines 17-23: Simple `TextInput` with multiline for note text
  - Lines 25-42: "Show options" toggle for advanced fields (date picker, file attachments)
  - Lines 50-57: Date picker using `type="datetime-local"` (React Admin `TextInput`)
  - Lines 58-60: File upload using `FileInput` component
  - **DOES NOT accept `showStatus` prop** - status is handled separately in contact notes only

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NotesIterator.tsx`: List of notes
  - Lines 8-14: Accepts `reference` prop and optional `showStatus` prop
  - Line 19: Passes `showStatus` to `NoteCreate` (but `NoteCreate` doesn't use it currently)

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/Note.tsx`: Individual note display
  - Lines 30-37: Accepts `showStatus` prop for rendering status badges
  - Lines 117-119: Conditionally renders `Status` component when `showStatus && note.status`
  - **Status is only for contact notes** - opportunity notes don't have status field

### Reference Input Patterns
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Existing dropdown examples
  - Lines 112-121: `ReferenceInput` with `AutocompleteOrganizationInput` for customer organization
  - Lines 123-136: `ReferenceInput` with `SelectInput` for account manager
  - Lines 166-176: Uses `useMemo` to prevent filter object recreation (prevents value clearing)
  - Lines 181-191: `ReferenceArrayInput` with `AutocompleteArrayInput` for multiple contacts

- `/home/krwhynot/projects/crispy-crm/src/components/admin/select-input.tsx`: SelectInput component
  - Lines 30-285: Full implementation with choices, loading states, empty values
  - Lines 79-93: Choice context handling with `useChoicesContext`
  - Lines 147-160: Change handler with choice lookup
  - Lines 208-212: Reset functionality with X button

- `/home/krwhynot/projects/crispy-crm/src/components/admin/reference-input.tsx`: ReferenceInput wrapper
  - Lines 5-14: Thin wrapper around React Admin's `ReferenceInputBase`
  - Line 17: Default children is `AutocompleteInput`

### Task Creation Pattern (Similar Use Case)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tasks/AddTask.tsx`: Dialog-based creation with dropdowns
  - Lines 104-120: Uses `CreateBase` with `record` prop for defaults
  - Lines 154-163: `ReferenceInput` for contact selection with `AutocompleteInput`
  - Lines 167-172: Date picker using `type="date"`
  - Lines 173-181: `SelectInput` for task type using `ConfigurationContext.taskTypes`

### Validation & Schema
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/notes.ts`: Note validation schemas
  - Lines 23-42: Base note schema (text, date, sales_id, attachments)
  - Lines 54-62: Opportunity note schema extends base with `opportunity_id`
  - Line 27: `date` field is required string
  - Lines 270-272: `getCurrentDate()` returns ISO string
  - Lines 279-282: `formatDateForInput()` formats for datetime-local input
  - **No contact_id or organization_id fields in opportunity note schema**

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/types.ts`: TypeScript type definitions
  - Lines 223-233: `OpportunityNote` type includes `opportunity_id`, `text`, `attachments`, but no contact/org fields
  - Lines 168-176: `ContactNote` type includes optional `status` field
  - Line 232: Opportunity notes explicitly define `status?: undefined` for compatibility

### Configuration & Constants
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/root/ConfigurationContext.tsx`: App-wide configuration
  - Lines 24-25: `opportunityStages` and `noteStatuses` available via context
  - Lines 44, 60: `noteStatuses` used for contact note status selector
  - **Note: `noteStatuses` is only for contact notes, not opportunity notes**

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stageConstants.ts`: Stage configuration
  - Lines 24-81: `OPPORTUNITY_STAGES` array with value/label/color/description
  - Lines 121-124: `OPPORTUNITY_STAGE_CHOICES` formatted for SelectInput

### Database Schema
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251018152315_cloud_schema_fresh.sql`:
  - Lines 1546-1555: `opportunityNotes` table schema
    - Columns: `id`, `opportunity_id`, `text`, `attachments`, `sales_id`, `created_at`, `updated_at`, `date`
    - **NO `contact_id` or `organization_id` columns exist**
    - **NO `status` column** (unlike `contactNotes`)
  - Lines 1151-1160: `contactNotes` table schema for comparison
    - Same structure as `opportunityNotes` (no status column here either, but used in app)

## Architectural Patterns

### Note Creation Flow
1. **Component Hierarchy**: `OpportunityEdit` → Tabs → `ReferenceManyField` → `NotesIterator` → `NoteCreate`
2. **Form Pattern**: Uses React Admin's `CreateBase` + `Form` with transform function on submit
3. **Foreign Key Injection**: `NoteCreateButton` injects appropriate foreign key based on `reference` prop
4. **Date Handling**: Defaults to `getCurrentDate()` if user doesn't specify, transforms to ISO format
5. **Resource Naming**: Uses `opportunityNotes` (camelCase) as resource name, NOT `activities`

### ReferenceInput Usage Pattern
1. **Wrapper Pattern**: `ReferenceInput` wraps a child input component (`SelectInput`, `AutocompleteInput`, etc.)
2. **Filter Prop**: Pass `filter` object to narrow down choices (e.g., `{ organization_type: 'customer' }`)
3. **Memoization**: Use `useMemo` for filter objects to prevent unnecessary re-renders
4. **Choice Display**: Use `optionText` prop or custom components for display formatting

### Form State Management (Engineering Constitution #5)
1. **NO defaultValue on inputs**: Form-level `defaultValues` prop handles initial state
2. **Schema-driven defaults**: Use `zodSchema.partial().parse({})` for default values
3. **Record prop on CreateBase**: Pass initial values via `record` prop, not input-level defaults

## Gotchas & Edge Cases

### Critical Issues for Implementation

1. **Database Schema Limitation**: The `opportunityNotes` table does NOT have `contact_id` or `organization_id` columns. Adding these dropdowns requires:
   - Migration to add new columns to `opportunityNotes` table
   - Update to Zod validation schema (`opportunityNoteSchema`)
   - Update to TypeScript type (`OpportunityNote`)
   - RLS policy updates for new columns

2. **Status Field Confusion**:
   - Contact notes support `status` field with UI selector
   - Opportunity notes do NOT support status field
   - `NotesIterator` has `showStatus` prop but it's never set to `true` for opportunities
   - DO NOT add status functionality to opportunity notes without corresponding database changes

3. **Reference vs Foreign Key**:
   - `NoteCreate` uses a mapping system (`foreignKeyMapping`) to determine which foreign key to inject
   - Currently only supports `contact_id` (contacts) and `opportunity_id` (opportunities)
   - Will need to extend this pattern for additional optional foreign keys

4. **Filter Object Memoization** (Lines 173-176 in OpportunityInputs.tsx):
   - React Admin's `ReferenceInput` clears selected values when filter object changes
   - Always wrap filter objects in `useMemo` to prevent recreation on re-renders
   - See Engineering Constitution #1: NO OVER-ENGINEERING - simple memoization prevents clearing bug

5. **Date Input Type**:
   - Contact notes use `datetime-local` (includes time)
   - Tasks use `date` (date only)
   - Decision needed: Should opportunity notes include time or just date?

6. **Empty State Handling**:
   - `ReferenceManyField` has `empty` prop that shows `NoteCreate` when no notes exist
   - After first note is added, `NoteCreate` still shows via `NotesIterator` (line 19)
   - Ensure new inputs don't break this dual-rendering pattern

### Engineering Constitution Compliance

1. **Boy Scout Rule** (Constitution #3): When adding new inputs, check if existing patterns need cleanup
2. **Form State from Schema** (Constitution #5): Default values must come from form-level, NOT input-level
3. **Semantic Colors Only** (Constitution #6): Use CSS variables, never hex codes
4. **Single Source of Truth** (Constitution #2): Validation only at API boundary (Zod schemas)

## Implementation Recommendations

### Database Changes Required
```sql
-- Migration: Add contact and organization references to opportunityNotes
ALTER TABLE "public"."opportunityNotes"
  ADD COLUMN "contact_id" bigint REFERENCES contacts(id),
  ADD COLUMN "organization_id" bigint REFERENCES organizations(id);

-- Add indexes for performance
CREATE INDEX idx_opportunitynotes_contact_id ON opportunityNotes(contact_id);
CREATE INDEX idx_opportunitynotes_organization_id ON opportunityNotes(organization_id);

-- Update RLS policies to include new columns
```

### Code Changes Required

1. **Update Zod Schema** (`src/atomic-crm/validation/notes.ts`):
   - Add optional `contact_id` and `organization_id` to `opportunityNoteSchema`

2. **Update TypeScript Type** (`src/atomic-crm/types.ts`):
   - Add optional fields to `OpportunityNote` interface

3. **Modify NoteInputs** (`src/atomic-crm/notes/NoteInputs.tsx`):
   - Add `reference` prop to determine if it's for opportunities
   - Add `ReferenceInput` for contact selection (filtered by opportunity's contact_ids)
   - Add `ReferenceInput` for organization selection (filtered by opportunity's organizations)
   - Place these inputs inside the "Show options" collapsible section

4. **Update NoteCreate** (`src/atomic-crm/notes/NoteCreate.tsx`):
   - Pass `reference` prop to `NoteInputs`
   - Access opportunity record via `useRecordContext()` to get available contacts/organizations
   - No changes to transform function needed (form values will automatically include new fields)

### Example Implementation Pattern

Based on existing patterns, the new inputs should follow this structure:

```tsx
// Inside NoteInputs.tsx (in the collapsible section)
{reference === "opportunities" && (
  <>
    <ReferenceInput
      source="contact_id"
      reference="contacts_summary"
      filter={contactFilter} // Memoized filter based on opportunity's contact_ids
    >
      <AutocompleteInput
        label="Related Contact"
        optionText={contactOptionText}
        helperText={false}
      />
    </ReferenceInput>

    <ReferenceInput
      source="organization_id"
      reference="organizations"
      filter={orgFilter} // Memoized filter based on opportunity's organizations
    >
      <AutocompleteOrganizationInput
        label="Related Organization"
        helperText={false}
      />
    </ReferenceInput>
  </>
)}
```

## Testing Considerations

1. **Verify filter memoization**: Ensure dropdowns don't clear when other fields change
2. **Test empty state**: Confirm NoteCreate still works when no notes exist
3. **Validate form submission**: Ensure optional fields submit correctly
4. **Check RLS policies**: Verify users can only see/add notes with appropriate permissions
5. **Migration testing**: Test on local DB before cloud deployment

## Relevant Documentation

- [Engineering Constitution](docs/claude/engineering-constitution.md) - Core principles, especially #5 (form state)
- [Common Tasks - Adding Fields](docs/claude/common-tasks.md) - Field addition patterns
- [Supabase Workflow](docs/supabase/supabase_workflow_overview.md) - Migration workflow
- [React Admin ReferenceInput](https://marmelab.com/react-admin/ReferenceInput.html) - Official docs
- [React Admin CreateBase](https://marmelab.com/react-admin/CreateBase.html) - Form patterns
