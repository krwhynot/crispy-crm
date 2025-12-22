# NoteCreate Form Audit

**Form Type:** Embedded Create Form (Used in Slideovers)
**File Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NoteCreate.tsx`
**Last Audited:** 2025-12-15
**Complexity:** Low (2 fields, minimal layout)

---

## Executive Summary

NoteCreate is a minimal, embedded form used within Contact, Opportunity, and Organization slideovers to quickly add notes. It features:

- **No tabs or sections** - single compact layout
- **2 fields total** - text (multiline) and optional date/time
- **Collapsible date field** - hidden by default, revealed via "Show options" link
- **Context-aware foreign keys** - automatically associates note with parent record
- **Auto-updates last_seen** - updates contact's last_seen timestamp on note creation
- **Form reset on success** - clears form after successful note addition

This is the simplest create form in the system, optimized for rapid note entry during sales activities.

---

## Form Structure Overview

| Metric | Value |
|--------|-------|
| **Total Fields** | 2 (1 visible by default, 1 collapsible) |
| **Tabs** | 0 |
| **Sections** | 0 (flat layout) |
| **Required Fields** | 1 (text) |
| **Optional Fields** | 1 (date) |
| **Form Type** | React Admin CreateBase + Form |
| **Layout** | Single column, collapsible options |

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────────┐
│ [FormErrorSummary - if errors]                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Add a note                                  │ │
│ │                                             │ │
│ │ [Multiline textarea - text field]           │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│                   [Show options] (change date)  │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Collapsed - Date & Time field]             │ │
│ │ (Revealed when "Show options" clicked)      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│                         [Add this note] button  │
└─────────────────────────────────────────────────┘
```

---

## Complete Field Inventory

| # | Field Name | Label | Input Type | Required | Default Value | Validation | Source Line | Component |
|---|------------|-------|------------|----------|---------------|------------|-------------|-----------|
| 1 | `text` | (no label) | Textarea (multiline) | Yes | `""` | Min 1, max 10000 chars, HTML sanitized | L15-21 | TextInput (NoteInputs.tsx) |
| 2 | `date` | "Date & Time" | datetime-local | No | Current date/time | Coerced to Date | L46-53 | TextInput (NoteInputs.tsx) |
| - | `sales_id` | - | (hidden) | Yes | From identity | Union: string\|number, min 1 | L108 | Injected via transform |
| - | `contact_id` / `opportunity_id` / `organization_id` | - | (hidden) | Yes | From parent record | Union: string\|number, min 1 | L107 | Injected via transform |

### Hidden/Computed Fields

| Field | Source | Value | Line |
|-------|--------|-------|------|
| `sales_id` | `useGetIdentity()` | Current user ID | L108 |
| Foreign key | `foreignKeyMapping[reference]` | Parent record ID | L107 |
| `date` (fallback) | `getCurrentDate()` | Current ISO timestamp | L109 |

---

## Input Types Summary

| Input Type | Count | Fields |
|------------|-------|--------|
| **Textarea** | 1 | text |
| **datetime-local** | 1 | date (collapsible) |
| **Hidden/Computed** | 2 | sales_id, foreign key |

---

## Sections & Layout Breakdown

### No Traditional Sections

This form uses a flat, collapsible layout:

1. **Error Summary** (conditional - L62)
   - `FormErrorSummary` component
   - Only shown if validation errors exist

2. **Main Input Area** (L14-55, NoteInputs.tsx)
   - Text input (always visible)
   - Collapsible options toggle
   - Date/time input (hidden by default)

3. **Action Button** (L101-117)
   - Single "Add this note" button
   - Right-aligned

### Collapsible Date Field Behavior

- **Default:** Date field hidden, defaults to current date/time
- **Trigger:** "Show options" link button (L25-37, NoteInputs.tsx)
- **On Click:**
  - Sets `displayMore` state to `true`
  - Calls `setValue("date", getCurrentDate())` to populate field
  - Reveals date input with scale-y animation (L40-54, NoteInputs.tsx)
- **Animation:** CSS transform with `transition-transform ease-in-out duration-300`

---

## Styling & Design Tokens

### Layout Spacing

| Element | Class | Spacing |
|---------|-------|---------|
| Form wrapper | `space-y-3` | 0.75rem vertical gap |
| NoteInputs wrapper | `space-y-2` | 0.5rem vertical gap |
| Collapsible section | `space-y-3 mt-3` | 0.75rem gap, 0.75rem top margin |
| Button container | `flex justify-end` | Right-aligned |

### Color Tokens (Semantic)

| Element | Token | Usage |
|---------|-------|-------|
| Date input | `text-primary` | L51 (NoteInputs.tsx) |
| Show options link | `text-muted-foreground` | L32, L36 (NoteInputs.tsx) |
| Button text | `text-muted-foreground` | L32 (NoteInputs.tsx) |

### Component Variants

| Component | Variant | Props |
|-----------|---------|-------|
| Show options button | `variant="link"` | `size="sm"`, underline hover |
| Save button | (default) | `type="button"`, custom transform |

### Animation Classes

- `transition-transform ease-in-out duration-300` - Smooth collapsible reveal
- `scale-y-0 max-h-0 h-0` - Collapsed state
- `scale-y-100` - Expanded state
- `origin-top` - Transform origin for scaling

---

## Accessibility Audit

### Labels & ARIA

| Field | Label Method | ARIA | Line | Issue |
|-------|--------------|------|------|-------|
| `text` | `label={false}` | Via FormField/FormLabel (text-input.tsx) | L17 | No visible label (placeholder only) |
| `date` | "Date & Time" via TextInput | Via FormField/FormLabel | L48 | Proper label when expanded |

### Accessibility Strengths

1. **Error Handling**
   - `FormErrorSummary` with `role="alert"` (FormErrorSummary.tsx L121)
   - Per-field errors via `FormError` with `role="alert"`, `aria-live="polite"` (form-primitives.tsx L124-125)

2. **Form Control**
   - `aria-invalid={!!error}` on inputs (form-primitives.tsx L93)
   - `aria-describedby` linking to descriptions/errors (form-primitives.tsx L92)

3. **Interactive Elements**
   - "Show options" button is keyboard-accessible (`<Button>` component)
   - Collapsible section uses proper state management (not display:none)

### Accessibility Concerns

1. **No visible label on text field** (L17-18, NoteInputs.tsx)
   - Uses `label={false}` and relies on placeholder text
   - Violates WCAG 3.3.2 (Labels or Instructions)
   - **Recommendation:** Add visible label or use `aria-label`

2. **Collapsible content accessibility**
   - No `aria-expanded` on "Show options" button
   - No `aria-controls` linking button to collapsible region
   - **Recommendation:** Add ARIA states for screen reader clarity

3. **Helper text on link**
   - "(change date/time)" text (L36) is not properly associated with button
   - **Recommendation:** Move inside button or use `aria-describedby`

---

## Responsive Behavior

### Layout Characteristics

- **Single column layout** - no responsive breakpoints needed
- **Full-width inputs** - `w-full` class on FormField (text-input.tsx L50)
- **No grid or multi-column layouts** - inherently mobile-friendly

### Mobile Considerations

- Textarea auto-resizes based on content
- datetime-local input uses native browser picker (mobile-friendly)
- Button remains right-aligned across all screen sizes

---

## Zod Schema Reference

### baseNoteSchema (notes.ts L25-47)

```typescript
export const baseNoteSchema = z.strictObject({
  // Required fields
  text: z
    .string()
    .min(1, "Note text is required")
    .max(10000, "Note text too long")
    .transform((val) => sanitizeHtml(val)),
  date: z.coerce.date({ error: "Date is required" }),
  sales_id: z.union([
    z.string().min(1, "Sales ID is required"),
    z.number().min(1, "Sales ID is required"),
  ]),

  // Optional fields
  attachments: z.array(attachmentSchema).optional(),

  // ID only present on updates
  id: z.union([z.string(), z.number()]).optional(),

  // Timestamps (automatically managed by database)
  created_at: z.string().optional(),
  update_at: z.string().optional(),
});
```

### Specialized Schemas

- **contactNoteSchema** (L52-57): Extends baseNoteSchema with `contact_id`
- **opportunityNoteSchema** (L62-67): Extends baseNoteSchema with `opportunity_id`
- **organizationNoteSchema** (L73-78): Extends baseNoteSchema with `organization_id`

### Form Default Values (L36-38)

```typescript
const formDefaults = {
  ...baseNoteSchema.partial().parse({}),
};
```

Generates: `{ attachments: undefined }` (all other fields required or computed)

---

## Component Tree

```
NoteCreate (Root)
├── CreateBase (React Admin)
│   └── Form (React Hook Form)
│       └── div.space-y-3
│           └── NoteFormContent
│               ├── FormErrorSummary (conditional)
│               ├── NoteInputs
│               │   └── div.space-y-2
│               │       ├── TextInput (text field)
│               │       │   └── FormField
│               │       │       ├── FormLabel (hidden)
│               │       │       ├── FormControl
│               │       │       │   └── Textarea
│               │       │       └── FormError
│               │       ├── div.flex (Show options toggle)
│               │       │   ├── Button (variant="link")
│               │       │   └── span (helper text)
│               │       └── div (collapsible section)
│               │           └── TextInput (date field)
│               │               └── FormField
│               │                   ├── FormLabel
│               │                   ├── FormControl
│               │                   │   └── Input (type="datetime-local")
│               │                   └── FormError
│               └── NoteCreateButton
│                   └── div.flex.justify-end
│                       └── SaveButton
│                           └── Button
```

---

## Shared Components Used

### From React Admin (ra-core)

| Component | Purpose | Source Line |
|-----------|---------|-------------|
| `CreateBase` | Provides create context | L41 |
| `Form` | React Hook Form provider | L42 |
| `useGetIdentity` | Fetches current user | L32 |
| `useListContext` | Refetch notes list | L80 |
| `useRecordContext` | Parent record data | L31 |
| `useResourceContext` | Current resource name | L30 |
| `useUpdate` | Update contact last_seen | L76 |
| `useNotify` | Success notification | L77 |
| `useFormContext` | Form methods access | L79 |
| `useFormState` | Form errors | L58 |

### From Project Components

| Component | File | Purpose | Source Line |
|-----------|------|---------|-------------|
| `SaveButton` | `@/components/admin/form` | Custom save with transform | L102 |
| `FormErrorSummary` | `@/components/admin/FormErrorSummary` | Error banner | L62 |
| `NoteInputs` | `./NoteInputs` | Form fields | L64 |
| `TextInput` | `@/components/admin/text-input` | RA-wrapped input | L15, L46 (NoteInputs) |
| `Button` | `@/components/ui/button` | shadcn Button | L25 (NoteInputs) |

### From Validation

| Function | Purpose | Source Line |
|----------|---------|-------------|
| `baseNoteSchema` | Zod validation schema | L37 |
| `getCurrentDate()` | ISO timestamp helper | L109 |

---

## Unique Features & Patterns

### 1. Multi-Reference Support

**Implementation:** Uses `reference` prop to determine which foreign key to populate (L25-28):

```typescript
const foreignKeyMapping = {
  contacts: "contact_id",
  opportunities: "opportunity_id",
  organizations: "organization_id",
};
```

**Usage in SaveButton transform** (L105-110):
```typescript
transform={(data) => ({
  ...data,
  [foreignKeyMapping[reference]]: record.id,
  sales_id: identity.id,
  date: data.date || getCurrentDate(),
})}
```

### 2. Conditional Contact Last Seen Update

**Logic** (L88-95):
- Only updates `last_seen` for contacts (not opportunities/organizations)
- Fires on successful note creation
- Uses `useUpdate` hook to silently update timestamp
- No error handling (fire-and-forget pattern)

```typescript
if (reference === "contacts") {
  update(reference, {
    id: (record && record.id) as unknown as Identifier,
    data: { last_seen: new Date().toISOString() },
    previousData: record,
  });
}
```

### 3. Form Reset on Success

**Pattern** (L84-86):
```typescript
reset(baseNoteSchema.partial().parse({}), { keepValues: false });
refetch();
```

- Resets form to default values (empty state)
- Forces refetch of notes list to show new note
- `keepValues: false` ensures complete reset

### 4. Collapsible Date Field UX

**User Flow:**
1. User sees only text field by default
2. Date field hidden but pre-populated with current date
3. Click "Show options" → reveals date field via animation
4. If date not shown, form uses `getCurrentDate()` fallback (L109)

**State Management** (NoteInputs.tsx):
- Local `useState` for `displayMore` toggle
- CSS transforms for smooth reveal animation
- Manual `setValue` call on expand to set current date

### 5. No Edit Form

Notes have no dedicated edit form - they are:
- Created via this embedded form
- Displayed in read-only list
- Likely deleted but not updated (common pattern for immutable notes)

---

## Data Flow

### On Component Mount

1. `useRecordContext()` gets parent record (contact/opportunity/organization)
2. `useGetIdentity()` fetches current user
3. Form defaults set via `baseNoteSchema.partial().parse({})` (L36-38)
4. `NoteInputs` renders with empty text field

### On Form Submit

1. User clicks "Add this note" button
2. `SaveButton` triggers with transform function (L105-110):
   - Spreads form data
   - Injects foreign key from parent record
   - Injects `sales_id` from identity
   - Falls back to `getCurrentDate()` if date not set
3. `CreateBase` handles submission via data provider
4. On success callback (L84-97):
   - Resets form to empty state
   - Refetches notes list
   - Updates contact's `last_seen` (contacts only)
   - Shows "Note added" notification

### Data Provider Interaction

- **Create:** Posts to appropriate notes table (contact_notes, opportunity_notes, organization_notes)
- **Update:** Silently updates contact's last_seen timestamp
- **List Refetch:** Triggers via `refetch()` from `useListContext()`

---

## Form Validation

### Validation Strategy

- **Schema-level:** All validation in `baseNoteSchema` (notes.ts L25-47)
- **No form-level validation:** Uses React Admin's default behavior
- **Validation timing:** On submit (default mode)

### Validation Rules

| Field | Rules | Error Messages |
|-------|-------|----------------|
| `text` | Required, min 1 char, max 10000 chars, HTML sanitized | "Note text is required", "Note text too long" |
| `date` | Coerced to Date | "Date is required" |
| `sales_id` | Union string\|number, min 1 | "Sales ID is required" |
| Foreign key | Union string\|number, min 1 | "[Resource] ID is required" |

### HTML Sanitization

Text field uses `sanitizeHtml()` transform (notes.ts L31):
```typescript
.transform((val) => sanitizeHtml(val))
```

Prevents XSS attacks by stripping dangerous HTML from note content.

---

## Form Performance

### Optimization Strategies

1. **Minimal re-renders** - Only 2 fields in form context
2. **Collapsible field not in form** - Date field hidden via CSS, not conditional render
3. **No watchers** - No `watch()` or `useWatch()` calls
4. **Form reset pattern** - Efficient full reset with `keepValues: false`

### Potential Performance Concerns

None identified. This is the simplest form in the system.

---

## Inconsistencies & Notes

### Design Inconsistencies

1. **No visible label on text field**
   - All other forms have labels for required fields
   - Uses placeholder as label (accessibility issue)
   - **Location:** NoteInputs.tsx L15-21

2. **Collapsible pattern unique to this form**
   - No other forms use "Show options" + CSS animation pattern
   - Could be extracted to reusable component
   - **Location:** NoteInputs.tsx L23-54

3. **Button label duplication**
   - SaveButton has both `label` prop and children with same text (L104, L115)
   - React Admin pattern requires both (label for translation, children for display)
   - **Location:** NoteCreate.tsx L102-116

### Architecture Inconsistencies

4. **Fire-and-forget update pattern**
   - Contact last_seen update has no error handling (L89-95)
   - All other forms show errors for failed mutations
   - **Justification:** Last seen is non-critical metadata
   - **Location:** NoteCreate.tsx L88-95

5. **Foreign key injection via transform**
   - Most forms use hidden inputs for foreign keys
   - This form injects via SaveButton transform
   - **Justification:** Cleaner for multi-reference support
   - **Location:** NoteCreate.tsx L105-110

### Validation Inconsistencies

6. **Date field optionality**
   - Schema requires `date` field (notes.ts L32)
   - Form allows undefined date (fallback to current)
   - **Resolution:** Transform provides fallback (L109)
   - **Location:** NoteCreate.tsx L109

7. **Attachments field in schema but not form**
   - Schema includes optional `attachments` array (notes.ts L39)
   - Form has no UI for attachments
   - **Note:** Likely future feature, schema prepared
   - **Location:** notes.ts L39

### Related Forms

**ActivityNoteForm** (ActivityNoteForm.tsx):
- Similar purpose but different pattern
- Used for opportunities only
- Creates activities (not notes table)
- Has 5 fields vs 2 fields
- No collapsible pattern

**Comparison:**
- NoteCreate: General-purpose, minimal, embedded
- ActivityNoteForm: Opportunity-specific, full-featured, standalone

---

## Recommendations

### High Priority

1. **Add visible label to text field**
   - Change `label={false}` to `label="Note"` or similar
   - Improves accessibility (WCAG 3.3.2)
   - **File:** NoteInputs.tsx L15-21

2. **Add ARIA attributes to collapsible section**
   - Add `aria-expanded` to "Show options" button
   - Add `aria-controls` linking to collapsible region
   - Add `id` to collapsible region
   - **File:** NoteInputs.tsx L23-54

### Medium Priority

3. **Extract collapsible field pattern**
   - Create reusable `CollapsibleFormField` component
   - Reduces duplication if pattern used elsewhere
   - **File:** New component in `@/components/admin/form/`

4. **Add error handling to last_seen update**
   - Log errors silently (don't show to user)
   - Helps diagnose issues in production
   - **File:** NoteCreate.tsx L88-95

### Low Priority

5. **Implement attachments UI**
   - Schema already supports attachments
   - Add file upload field (collapsible like date?)
   - **File:** NoteInputs.tsx

6. **Consider edit functionality**
   - Allow editing note text after creation
   - Create NoteEdit component
   - **File:** New file `NoteEdit.tsx`

---

## Testing Recommendations

### Unit Tests

```typescript
// Test cases to cover:
describe('NoteCreate', () => {
  it('renders text field by default', () => {});
  it('hides date field by default', () => {});
  it('reveals date field when "Show options" clicked', () => {});
  it('submits with current date when date field not shown', () => {});
  it('injects correct foreign key based on reference prop', () => {});
  it('updates contact last_seen on success (contacts only)', () => {});
  it('does not update last_seen for opportunities', () => {});
  it('resets form after successful submission', () => {});
  it('refetches notes list after submission', () => {});
  it('shows validation error for empty text field', () => {});
  it('sanitizes HTML in text field', () => {});
});
```

### E2E Tests

```typescript
// Test scenarios:
test('Create note on contact slideover', async ({ page }) => {
  // 1. Navigate to contact
  // 2. Open slideover
  // 3. Add note with default date
  // 4. Verify note appears in list
  // 5. Verify form resets
});

test('Create note with custom date', async ({ page }) => {
  // 1. Open note form
  // 2. Click "Show options"
  // 3. Change date
  // 4. Submit
  // 5. Verify custom date saved
});

test('Create note on opportunity vs contact', async ({ page }) => {
  // 1. Create note on contact → verify last_seen updated
  // 2. Create note on opportunity → verify no last_seen field
});
```

---

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-12-15 | Initial audit created | Claude Agent |

---

## Appendix: Key Source Files

### Primary Files

1. `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NoteCreate.tsx` - Main form component
2. `/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NoteInputs.tsx` - Form fields with collapsible pattern
3. `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/notes.ts` - Zod schemas

### Related Files

4. `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/ActivityNoteForm.tsx` - Similar but different pattern
5. `/home/krwhynot/projects/crispy-crm/src/components/admin/text-input.tsx` - TextInput wrapper
6. `/home/krwhynot/projects/crispy-crm/src/components/admin/form/form-primitives.tsx` - SaveButton, FormField, FormError
7. `/home/krwhynot/projects/crispy-crm/src/components/admin/FormErrorSummary.tsx` - Error banner

---

**Audit Status:** Complete
**Form Complexity:** Low
**Accessibility Score:** 6/10 (missing visible label, ARIA attributes)
**Code Quality Score:** 9/10 (clean, well-structured, minimal)
**Recommended Action:** Minor accessibility improvements, otherwise production-ready
