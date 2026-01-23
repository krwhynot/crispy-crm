# Notes Component Patterns

Standard patterns for note components in Crispy CRM. Notes are user-generated documentation tied to entities (contacts, opportunities, organizations).

## Component Hierarchy

```
                        Entity Views
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ContactShow        OpportunityShow      OrganizationShow
        │                    │                    │
        ▼                    ▼                    ▼
ReferenceManyField    ReferenceManyField   ReferenceManyField
(target: contact_id)  (target: opp_id)     (target: org_id)
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                      NotesIterator
                      (composition wrapper)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
         NoteCreate                     NotesList
         (form at top)              (list renderer)
              │                             │
              ▼                             ▼
         NoteInputs                       Note[]
         (shared inputs)            (rendered items)
                                           │
                                           ▼
                                    Note (edit mode)
                                           │
                                           ▼
                                      NoteInputs
```

### Entity Scoping Model

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│    Contacts     │   │  Opportunities  │   │  Organizations  │
│   (reference)   │   │   (reference)   │   │   (reference)   │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         ▼                     ▼                     ▼
   contactNotes          opportunityNotes      organizationNotes
   (resource)              (resource)            (resource)
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                        foreignKeyMapping
                   { contacts: "contact_id",
                     opportunities: "opportunity_id",
                     organizations: "organization_id" }
```

**Resource Naming Convention:**
- React Admin resources use **camelCase**: `contactNotes`, `opportunityNotes`, `organizationNotes`
- Database tables use **snake_case**: `contact_notes`, `opportunity_notes`, `organization_notes`
- `ReferenceManyField reference` prop uses snake_case (maps to database table)
- `useResourceContext()` returns camelCase (React Admin resource name)

---

## Pattern A: Note Creation Dialog

Lightweight creation flow embedded in the iterator. Uses `CreateBase` for resource context without full page navigation.

```tsx
// src/atomic-crm/notes/NoteCreate.tsx

const foreignKeyMapping = {
  contacts: "contact_id",
  opportunities: "opportunity_id",
  organizations: "organization_id",
};

export const NoteCreate = ({
  reference,
}: {
  reference: "contacts" | "opportunities" | "organizations";
}) => {
  const resource = useResourceContext();
  const record = useRecordContext();
  const { data: identity } = useGetIdentity();

  if (!record || !identity) return null;

  // Form defaults from Zod schema (Constitution #5)
  const formDefaults = {
    ...baseNoteSchema.partial().parse({}),
  };

  return (
    <CreateBase resource={resource} redirect={false}>
      <Form defaultValues={formDefaults}>
        <div className="space-y-3">
          <NoteFormContent reference={reference} record={record} />
        </div>
      </Form>
    </CreateBase>
  );
};
```

### Transform Function Pattern

The `SaveButton` transform links the note to its parent entity:

```tsx
// NoteCreateButton component
<SaveButton
  type="button"
  label="Add this note"
  transform={(data) => ({
    ...data,
    [foreignKeyMapping[reference]]: record.id,  // Dynamic FK
    sales_id: identity.id,                       // Note author
    date: data.date || getCurrentDate(),         // Default timestamp
  })}
  mutationOptions={{
    onSuccess: handleSuccess,
  }}
/>
```

### Side Effect: Contact `last_seen` Update

```tsx
const handleSuccess = () => {
  reset(baseNoteSchema.partial().parse({}), { keepValues: false });
  refetch();

  // Only update last_seen for contacts
  if (reference === "contacts") {
    update(reference, {
      id: record.id,
      data: { last_seen: new Date().toISOString() },
      previousData: record,
    });
  }

  notify("Note added");
};
```

**When to use**: Creating notes inline within entity detail views without page navigation.

---

## Pattern B: Note Iterator and NotesList

Composition pattern separating note creation from list rendering. `NotesIterator` combines both; `NotesList` handles list display only.

### NotesIterator (Composition Wrapper)

```tsx
// src/atomic-crm/notes/NotesIterator.tsx

interface NotesIteratorProps {
  reference: "contacts" | "opportunities" | "organizations";
  showEmptyState?: boolean;
}

/**
 * Combines NoteCreate form with NotesList.
 *
 * The showEmptyState prop controls whether to display an empty state message
 * when there are no notes. This should be true when using ReferenceManyField
 * without the `empty` prop (to avoid hiding the create form).
 */
export const NotesIterator = ({ reference, showEmptyState = false }: NotesIteratorProps) => {
  return (
    <div className="mt-4">
      <NoteCreate reference={reference} />
      <NotesList showEmptyState={showEmptyState} />
    </div>
  );
};
```

### NotesList (List Renderer)

Extracted component that handles list rendering only. Consumes `useListContext()` from parent `ReferenceManyField`.

```tsx
// src/atomic-crm/notes/NotesList.tsx

interface NotesListProps {
  showEmptyState?: boolean;
}

/**
 * Displays a list of notes from the current ListContext.
 *
 * Extracted from NotesIterator to allow the NoteCreate form to always be visible
 * even when there are no notes (solving the ReferenceManyField empty prop issue).
 */
export const NotesList = ({ showEmptyState = false }: NotesListProps) => {
  const { data, error, isPending } = useListContext();

  if (isPending || error) return null;

  // Show empty state when no notes and showEmptyState is enabled
  if (showEmptyState && (!data || data.length === 0)) {
    return (
      <div className="mt-4">
        <SidepaneEmptyState
          title={EMPTY_STATE_CONTENT.notes.title}
          description={EMPTY_STATE_CONTENT.notes.description}
        />
      </div>
    );
  }

  // No notes and empty state disabled - render nothing
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {data.map((note, index) => (
        <React.Fragment key={note.id}>
          <Note note={note} isLast={index === data.length - 1} />
          {index < data.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  );
};
```

### Embedding in Entity Views

NotesIterator requires `ReferenceManyField` wrapper to provide list context:

```tsx
// src/atomic-crm/contacts/ContactShow.tsx

<TabsContent value="notes" className="pt-2">
  <ReferenceManyField
    target="contact_id"
    reference="contact_notes"
    sort={{ field: "created_at", order: "DESC" }}
    empty={false}  // Prevent hiding content when no notes
  >
    <NotesIterator reference="contacts" showEmptyState />
  </ReferenceManyField>
</TabsContent>
```

### SlideOver Tab Pattern

```tsx
// src/atomic-crm/contacts/slideOverTabs/ContactNotesTab.tsx

export function ContactNotesTab({ record, mode: _mode }: ContactNotesTabProps) {
  return (
    <RecordContextProvider value={record}>
      <div className="space-y-4" data-tutorial="contact-notes-section">
        <ReferenceManyField
          target="contact_id"
          reference="contact_notes"
          sort={{ field: "created_at", order: "DESC" }}
          empty={false}  // Prevent hiding content when no notes
        >
          <NotesIterator reference="contacts" showEmptyState />
        </ReferenceManyField>
      </div>
    </RecordContextProvider>
  );
}
```

**When to use**: Displaying notes lists in entity detail views or slide-over panels.

---

## Pattern C: Rich Text Input

Progressive disclosure pattern for optional fields. Text input is always visible; date picker expands on demand.

```tsx
// src/atomic-crm/notes/NoteInputs.tsx

export const NoteInputs = () => {
  const [displayMore, setDisplayMore] = useState(false);
  const { setValue } = useFormContext();

  return (
    <div className="space-y-2">
      {/* Always visible: main text input */}
      <TextInput
        source="text"
        label={false}
        multiline
        helperText={false}
        placeholder="Add a note"
      />

      {/* Toggle for optional fields */}
      {!displayMore && (
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setDisplayMore(!displayMore);
              setValue("date", getCurrentDate());  // Pre-fill on expand
            }}
            className="text-sm text-muted-foreground underline"
          >
            Show options
          </Button>
          <span className="text-sm text-muted-foreground">
            (change date/time)
          </span>
        </div>
      )}

      {/* Expandable date picker */}
      <div
        className={cn(
          "space-y-3 mt-3 overflow-hidden transition-transform",
          !displayMore ? "scale-y-0 max-h-0" : "scale-y-100"
        )}
      >
        <TextInput
          source="date"
          label="Date & Time"
          helperText={false}
          type="datetime-local"
          // Defaults come from Zod schema (Constitution #5)
        />
      </div>
    </div>
  );
};
```

**When to use**: Form inputs with optional fields that shouldn't clutter the default UI.

---

## Pattern D: Activity Log Integration

Notes create activity log entries but remain separate from the immutable audit trail.

### Relationship Model

```
User Action               Notes System              Activity Log
    │                          │                         │
    ▼                          ▼                         ▼
Create Note ───────────► contact_notes ──────────► CONTACT_NOTE_CREATED
                         (editable)                (immutable event)
                              │                          │
                              ▼                          ▼
                         Note.tsx                ActivityLogContactNoteCreated
                         (CRUD UI)               (read-only display)
```

### Activity Event Types for Notes

```tsx
// Activity log displays note creation events
CONTACT_NOTE_CREATED      // "Sales rep added a note about Contact X"
OPPORTUNITY_NOTE_CREATED  // "Sales rep added a note about Opportunity X"
ORGANIZATION_NOTE_CREATED // "Sales rep added a note about Organization X"
```

### Key Distinction

| Aspect | Notes | Activity Log |
|--------|-------|--------------|
| **Purpose** | User documentation | System audit trail |
| **Mutability** | Editable (CRUD) | Immutable (read-only) |
| **Content** | Free-form text | Structured events |
| **Ownership** | User-authored | System-generated |

**When to use**: Understanding how notes fit into the broader event tracking system.

---

## Pattern E: Note Utilities

Helper functions for date handling and Zod validation schemas.

### Date Utilities

```tsx
// src/atomic-crm/notes/utils.ts

export const getCurrentDate = () => {
  const now = new Date();
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now.toISOString();
};

export const formatNoteDate = (dateString: string) => {
  const date = new Date(dateString);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.toISOString();
};
```

### Zod Validation Schemas

```tsx
// src/atomic-crm/validation/notes.ts

// Base schema with common fields
export const baseNoteSchema = z.strictObject({
  text: z
    .string()
    .trim()
    .min(1, "Note text is required")
    .max(10000, "Note text too long")
    .transform((val) => sanitizeHtml(val)),  // XSS prevention
  date: z.coerce.date({ error: "Date is required" }),
  sales_id: z.union([
    z.string().min(1, "Sales ID is required"),
    z.number().min(1, "Sales ID is required"),
  ]),
  attachments: z.array(attachmentSchema).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
});

// Entity-specific extensions
export const contactNoteSchema = baseNoteSchema.extend({
  contact_id: z.union([
    z.string().min(1, "Contact ID is required"),
    z.number().min(1, "Contact ID is required"),
  ]),
});

export const opportunityNoteSchema = baseNoteSchema.extend({
  opportunity_id: z.union([...]),
});

export const organizationNoteSchema = baseNoteSchema.extend({
  organization_id: z.union([...]),
});
```

### Form Defaults Pattern

```tsx
// Used in NoteCreate.tsx
const formDefaults = baseNoteSchema.partial().parse({});
// Returns: { text: undefined, date: undefined, ... }
// Zod provides safe empty state for form initialization
```

**When to use**: Date formatting, validation, and form initialization.

---

## Pattern F: Entity-Scoped Notes

Polymorphic rendering based on React Admin's resource context.

```tsx
// src/atomic-crm/notes/Note.tsx

export const Note = ({
  note,
}: {
  note: OpportunityNote | ContactNote | OrganizationNote;
  isLast: boolean;
}) => {
  const [isHover, setHover] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const resource = useResourceContext();  // Polymorphic key
  // Note: Prefer useSafeNotify for error messages (sanitizes user data)
  // import { useSafeNotify } from '@/atomic-crm/hooks/useSafeNotify';
  const notify = useNotify();  // Legacy - see useSafeNotify for error handling

  // Avatar rendering based on resource type (camelCase from useResourceContext)
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex items-center space-x-4 w-full">
        {/* Polymorphic avatar selection - uses camelCase resource names */}
        {resource === "contactNotes" ? (
          <Avatar width={20} height={20} />
        ) : resource === "opportunityNotes" ? (
          <ReferenceField source="opportunity_id" reference="opportunities">
            <ReferenceField source="customer_organization_id" reference="organizations">
              <OrganizationAvatar width={20} height={20} />
            </ReferenceField>
          </ReferenceField>
        ) : resource === "organizationNotes" ? (
          <ReferenceField source="organization_id" reference="organizations">
            <OrganizationAvatar width={20} height={20} />
          </ReferenceField>
        ) : null}

        {/* Author and timestamp */}
        <div className="inline-flex h-full items-center text-sm text-muted-foreground">
          <ReferenceField source="sales_id" reference="sales" link={false}>
            <WithRecord render={(record) => <SaleName sale={record} />} />
          </ReferenceField>{" "}
          added a note
        </div>

        {/* Hover actions */}
        <span className={`${isHover ? "visible" : "invisible"}`}>
          <Button onClick={handleEnterEditMode} aria-label="Edit note">
            <Edit className="size-4" />
          </Button>
          <Button onClick={handleDelete} aria-label="Delete note">
            <Trash2 className="size-4" />
          </Button>
        </span>

        <div className="flex-1"></div>
        <span className="text-sm text-muted-foreground">
          <RelativeDate date={note.created_at} />
        </span>
      </div>

      {/* Edit mode vs display mode */}
      {isEditing ? (
        <Form onSubmit={handleNoteUpdate} record={note}>
          <NoteInputs />
          {/* Save/Cancel buttons */}
        </Form>
      ) : (
        <div className="pt-2">
          {note.text?.split("\n").map((paragraph, index) => (
            <p className="text-sm leading-6 m-0" key={index}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Undoable Delete Pattern

```tsx
const [deleteNote] = useDelete(
  resource,
  { id: note.id, previousData: note },
  {
    mutationMode: "undoable",  // Shows undo toast
    onSuccess: () => {
      notify("Note deleted", { type: "info", undoable: true });
    },
  }
);
```

**When to use**: Displaying notes with context-aware avatars and inline editing.

---

## Comparison Table

| Aspect | Note | Activity | Task |
|--------|------|----------|------|
| **Primary Purpose** | User documentation | System audit trail | Action items |
| **Mutability** | Editable (CRUD) | Immutable | Editable |
| **Completion State** | N/A | N/A | Tracked (`completed_at`) |
| **Due Dates** | Optional (`date`) | N/A | Required (`due_date`) |
| **Entity Scope** | Contact, Opp, Org | All entities | Contact, Opp, Org |
| **Quick Actions** | Edit, Delete | None | Postpone, Complete |
| **Form Location** | Embedded in iterator | N/A | Separate panel |
| **Delete Behavior** | Undoable | N/A | Soft delete |

---

## Anti-Patterns

### 1. Orphaned Notes (Missing Entity ID)

```tsx
// WRONG: No entity linking
<SaveButton
  transform={(data) => ({
    ...data,
    sales_id: identity.id,
    // Missing: [foreignKeyMapping[reference]]: record.id
  })}
/>
```

**Fix**: Always include the foreign key via `foreignKeyMapping[reference]`.

### 2. Direct Supabase Import

```tsx
// WRONG: Bypasses data provider
import { supabase } from "@/lib/supabase";

const createNote = async (data) => {
  await supabase.from("contact_notes").insert(data);
};
```

**Fix**: Use React Admin's `useCreate` or `SaveButton` which route through `unifiedDataProvider`.

### 3. Form-Level Validation

```tsx
// WRONG: Validation in component
const NoteInputs = () => {
  const validate = (value) => {
    if (!value || value.length < 1) return "Required";
    if (value.length > 10000) return "Too long";
  };

  return <TextInput source="text" validate={validate} />;
};
```

**Fix**: Validation lives in `validation/notes.ts` Zod schemas, applied at API boundary.

### 4. Missing Reference Prop

```tsx
// WRONG: NotesIterator without reference
<NotesIterator />  // TypeScript error, but runtime would fail on FK mapping
```

**Fix**: Always pass `reference` prop matching the parent entity type.

### 5. Wrong Context Provider

```tsx
// WRONG: Using NotesIterator outside ReferenceManyField
<NotesIterator reference="contacts" />  // useListContext() returns undefined
```

**Fix**: Wrap in `ReferenceManyField` to provide list context.

---

## Migration Checklist

When extending notes to a new entity type (e.g., `principals`):

### 1. Zod Schema (`validation/notes.ts`)

- [ ] Add `principalNoteSchema` extending `baseNoteSchema`
- [ ] Add `createPrincipalNoteSchema` (omit `id`)
- [ ] Add `updatePrincipalNoteSchema` (partial, require `id`)
- [ ] Export types: `PrincipalNote`, `CreatePrincipalNoteInput`, `UpdatePrincipalNoteInput`
- [ ] Add validation functions: `validateCreatePrincipalNote`, `validateUpdatePrincipalNote`

### 2. Foreign Key Mapping (`NoteCreate.tsx`)

- [ ] Add to `foreignKeyMapping`: `principals: "principal_id"`

### 3. Avatar Rendering (`Note.tsx`)

- [ ] Add case for `resource === "principalNotes"` (camelCase for useResourceContext)
- [ ] Create or import appropriate avatar component

### 4. Type Definitions (`validation/notes.ts`)

- [ ] Add `PrincipalNote` to union type in Note component props
- [ ] Update `reference` union type to include `"principals"`

### 5. SlideOver Tab Component

- [ ] Create `src/atomic-crm/principals/slideOverTabs/PrincipalNotesTab.tsx`
- [ ] Follow ContactNotesTab pattern

### 6. Entity Detail View

- [ ] Add `ReferenceManyField` with `target="principal_id"` and `reference="principal_notes"` (snake_case)
- [ ] Use `empty={false}` to prevent hiding when no notes
- [ ] Use `<NotesIterator reference="principals" showEmptyState />` for the children
- [ ] Add tab trigger and content in Tabs component

### 7. Activity Log (Optional)

- [ ] Create `ActivityLogPrincipalNoteCreated.tsx`
- [ ] Add `PRINCIPAL_NOTE_CREATED` to activity types enum
- [ ] Update `ActivityLogIterator.tsx` to handle new event type

### 8. Data Provider

- [ ] Ensure `principal_notes` resource is configured in `composedDataProvider.ts` (snake_case for database)
- [ ] Add handler mapping in `resourceHandlers` for `principal_notes`
- [ ] Verify RLS policies in Supabase for `principal_notes` table

### 9. Testing

- [ ] Verify TypeScript compiles: `npx tsc --noEmit`
- [ ] Test note creation in browser
- [ ] Verify activity log entry appears
- [ ] Test edit and delete functionality
