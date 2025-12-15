# TaskCreate Form Audit

**Component:** `TaskCreate`
**File:** `src/atomic-crm/tasks/TaskCreate.tsx`
**Zod Schema:** `src/atomic-crm/validation/task.ts`
**Date:** 2025-12-15

---

## Form Structure Overview

**Form Type:** Full-page create form with centered card layout
**Layout Pattern:** Single column, no tabs
**Sections:** 1 (Main form fields)
**Total Fields:** 7
**Required Fields:** 3 (title, due_date, type)
**Optional Fields:** 4 (description, priority, opportunity_id, contact_id)

**Pre-filled Defaults:**
- `due_date`: Today's date
- `sales_id`: Current user ID
- `priority`: "medium"
- `type`: "Call"
- `completed`: false

**Actions:**
- Cancel (with dirty state confirmation)
- Save & Close (redirects to /tasks)
- Save & Add Another (resets form)

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│                      TaskCreate Form                        │
│                     (max-w-4xl centered)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [FormErrorSummary - if errors present]                    │
│                                                             │
│  Task Title * ───────────────────────────────────────────  │
│  │ What needs to be done?                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Description ────────────────────────────────────────────  │
│  │ Multiline textarea (2 rows)                           │  │
│  │ Optional details                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────────────┬─────────────────────────────┐  │
│  │ Due Date *             │ Type                        │  │
│  │ │ When is this due?    │ │ Category of task        │  │
│  │ └────────────────────  │ └─────────────────────────┘  │
│  └────────────────────────┴─────────────────────────────┘  │
│                                                             │
│  ┌────────────────────────┬─────────────────────────────┐  │
│  │ Priority               │ Opportunity                 │  │
│  │ │ How urgent?          │ │ Link to opportunity     │  │
│  │ └────────────────────  │ │ (optional)              │  │
│  └────────────────────────┴─────────────────────────────┘  │
│                                                             │
│  Contact ────────────────────────────────────────────────  │
│  │ Link to contact (optional)                            │  │
│  │ Avatar + Name + Title at Org                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Sticky Footer (bg-card, border-t)                          │
│  [Cancel]                    [Save & Close] [Save & Add]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Field Inventory

| # | Field Name | Label | Input Type | Required | Default | Validation | Helper Text | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|-------------|
| 1 | `title` | Task Title | TextInput | Yes | - | string min(1) max(500) | "What needs to be done?" | L66-71 |
| 2 | `description` | Description | TextInput (multiline) | No | - | string max(2000) nullable | "Optional details" | L74-80 |
| 3 | `due_date` | Due Date | TextInput (date) | Yes | Today | coerce.date() | "When is this due?" | L84-90 |
| 4 | `type` | Type | SelectInput | Yes* | "Call" | enum (7 values) | "Category of task" | L93-98 |
| 5 | `priority` | Priority | SelectInput | No | "medium" | enum (4 values) | "How urgent?" | L102-112 |
| 6 | `opportunity_id` | Opportunity | ReferenceInput + AutocompleteInput | No | - | number nullable | "Link to opportunity (optional)" | L114-120 |
| 7 | `contact_id` | Contact | ReferenceInput + AutocompleteInput | No | - | number nullable | "Link to contact (optional)" | L123-129 |
| - | `sales_id` | (Hidden) | - | Yes | Current user ID | number required | - | L34 |
| - | `completed` | (Hidden) | - | No | false | boolean default(false) | - | L113 in schema |

*Note: `type` has schema default but is pre-filled in form, functionally required.

---

## Input Types Used

| Input Type | Count | Fields |
|------------|-------|--------|
| TextInput | 3 | title, description, due_date |
| SelectInput | 2 | type, priority |
| ReferenceInput + AutocompleteInput | 2 | opportunity_id, contact_id |

**Total Unique Input Types:** 3

---

## Dropdowns Detail

### 1. Type (SelectInput)

**Source:** Configuration context (`taskTypes` from `defaultConfiguration.ts`)
**Line:** L93-98

**Choices:**
```typescript
[
  { id: "Call", name: "Call" },           // Phone conversations
  { id: "Email", name: "Email" },         // Email communications
  { id: "Meeting", name: "Meeting" },     // In-person/virtual meetings
  { id: "Follow-up", name: "Follow-up" }, // Re-engagement reminders
  { id: "Demo", name: "Demo" },           // Product demonstrations
  { id: "Proposal", name: "Proposal" },   // Formal offers and proposals
  { id: "Other", name: "Other" },         // Miscellaneous tasks
]
```

**Default:** "Call"
**Helper Text:** "Category of task"

---

### 2. Priority (SelectInput)

**Source:** Inline hardcoded choices
**Line:** L102-112

**Choices:**
```typescript
[
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
]
```

**Default:** "medium"
**Helper Text:** "How urgent?"

---

### 3. Opportunity (ReferenceInput + AutocompleteInput)

**Source:** Reference to `opportunities` resource
**Line:** L114-120

**Display:** Shows `title` field from opportunity record
**Helper Text:** "Link to opportunity (optional)"
**Searchable:** Yes (autocomplete)
**Required:** No

---

### 4. Contact (ReferenceInput + AutocompleteInput)

**Source:** Reference to `contacts_summary` view
**Line:** L123-129

**Display:** Custom ContactOptionRender component showing:
- Avatar (40x40px)
- Name (first_name + last_name formatted)
- Title at Organization (if available)

**Helper Text:** "Link to contact (optional)"
**Searchable:** Yes (autocomplete)
**Required:** No

---

## Sections & Layout Breakdown

### Main Content (Lines 39-45, 62-130)

**Container:** `div.bg-muted px-6 py-6`
**Card:** `div.max-w-4xl mx-auto create-form-card`
**Inner Spacing:** `div.space-y-6`

**Field Groups:**

1. **Full-width fields** (Lines 65-80):
   - Task Title (with tutorial marker `data-tutorial="task-title"`)
   - Description (multiline)

2. **Two-column grid** (Lines 82-99):
   - Grid: `grid-cols-2 gap-4`
   - Due Date (with tutorial marker `data-tutorial="task-due-date"`)
   - Type

3. **Two-column grid** (Lines 101-121):
   - Grid: `grid-cols-2 gap-4`
   - Priority
   - Opportunity

4. **Full-width field** (Lines 123-129):
   - Contact

---

### Sticky Footer (Lines 137-194)

**Container:** `sticky bottom-12 bg-card border-t border-border p-4 flex justify-between mt-6`

**Left Actions:**
- Cancel button (outline variant)
  - Shows confirmation dialog if form is dirty
  - Redirects to `/tasks`

**Right Actions:**
- Save & Close button (primary)
  - Tutorial marker: `data-tutorial="task-save-btn"`
  - Success: Shows toast, redirects to `/tasks`
  - Error: Shows error toast

- Save & Add Another button (primary)
  - Success: Shows toast, resets form
  - Error: Shows error toast

---

## Styling & Design Tokens

### Page Level
| Element | Classes | Token Type |
|---------|---------|------------|
| Page background | `bg-muted` | Semantic color |
| Page padding | `px-6 py-6` | Spacing |
| Card container | `max-w-4xl mx-auto` | Layout |
| Card styling | `create-form-card` | Design system class |

### Form Content
| Element | Classes | Token Type |
|---------|---------|------------|
| Form spacing | `space-y-6` | Spacing |
| Two-column grids | `grid grid-cols-2 gap-4` | Layout + Spacing |

### Footer
| Element | Classes | Token Type |
|---------|---------|------------|
| Footer container | `sticky bottom-12 bg-card border-t border-border p-4` | Position + Semantic colors + Spacing |
| Footer layout | `flex justify-between` | Layout |
| Button group | `flex gap-2` | Layout + Spacing |
| Footer spacing | `mt-6` | Spacing |

### Button Variants
- Cancel: `variant="outline"`
- Save buttons: Default (primary) variant

**Color Tokens Used:**
- `bg-muted` (page background)
- `bg-card` (footer background)
- `border-border` (footer border)

**No Raw Colors:** All colors use semantic tokens from Tailwind v4.

---

## Accessibility Audit

### Labels
| Field | Has Label | Label Text | isRequired Prop | Line |
|-------|-----------|------------|-----------------|------|
| title | Yes | "Task Title" | Yes | L66-71 |
| description | Yes | "Description" | No | L74-80 |
| due_date | Yes | "Due Date" | Yes | L84-90 |
| type | Yes | "Type" | No | L93-98 |
| priority | Yes | "Priority" | No | L102-112 |
| opportunity_id | Yes | "Opportunity" | No | L114-120 |
| contact_id | Yes | "Contact" | No | L123-129 |

**All fields have explicit labels:** Yes

### Helper Text
| Field | Helper Text | Line |
|-------|-------------|------|
| title | "What needs to be done?" | L70 |
| description | "Optional details" | L79 |
| due_date | "When is this due?" | L89 |
| type | "Category of task" | L97 |
| priority | "How urgent?" | L111 |
| opportunity_id | "Link to opportunity (optional)" | L118 |
| contact_id | "Link to contact (optional)" | L127 |

**All fields have helper text:** Yes

### ARIA Support
- FormField component provides `id` attribute (L50 in TextInput wrapper)
- FormLabel component uses `FieldTitle` with `isRequired` prop
- FormError component provides error messaging
- FormErrorSummary at top of form (L63) with AlertCircle icon
- All inputs wrapped in FormControl for proper accessibility

**Assumed ARIA attributes from shared components:**
- `aria-invalid` on inputs with errors
- `aria-describedby` linking to helper text and errors
- `role="alert"` on error messages

### Keyboard Navigation
- Standard tab order through fields
- Autocomplete inputs support keyboard navigation
- Cancel button handles Escape behavior via browser confirmation
- Form submission via Enter key

### Focus Management
- No custom focus management
- Relies on browser defaults

---

## Responsive Behavior

**Breakpoints Used:** None explicitly defined

**Layout Patterns:**
- Single column layout with max-width constraint
- Two-column grids use `grid-cols-2` (no responsive variants)
- Likely assumes desktop/tablet usage (1440px+ per CLAUDE.md)

**Potential Issues:**
- Fixed `grid-cols-2` on small screens may need responsive variants
- Sticky footer at `bottom-12` may interfere on mobile

**Notes:**
- Design system targets desktop-first (1440px+) with iPad support
- No explicit mobile breakpoints in this form

---

## Zod Schema Reference

**Schema File:** `src/atomic-crm/validation/task.ts`

### taskCreateSchema (Lines 75-81)

```typescript
export const taskCreateSchema = taskSchema.omit({
  id: true,
  created_by: true, // Auto-set by trigger_set_task_created_by
  created_at: true,
  updated_at: true,
  deleted_at: true, // Soft-delete managed by application
});
```

### Full taskSchema (Lines 35-62)

```typescript
export const taskSchema = z.strictObject({
  id: idSchema.optional(),
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(2000, "Description too long").nullable().optional(),
  due_date: z.coerce.date({ error: "Due date is required" }),
  reminder_date: z.coerce.date().nullable().optional(),
  completed: z.coerce.boolean().default(false),
  completed_at: z.string().nullable().optional(),
  priority: priorityLevelSchema.default("medium"),
  type: taskTypeSchema,
  contact_id: idSchema.nullable().optional(),
  opportunity_id: idSchema.nullable().optional(),
  organization_id: idSchema.nullable().optional(),
  sales_id: idSchema, // Required
  snooze_until: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce.date().nullable().optional()
  ),
  created_by: z.union([z.string(), z.number()]).optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});
```

### Enums

```typescript
// Lines 16-24
export const taskTypeSchema = z.enum([
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Demo",
  "Proposal",
  "Other",
]);

// Line 26
export const priorityLevelSchema = z.enum(["low", "medium", "high", "critical"]);
```

### Default Values Function (Lines 113-119)

```typescript
export const getTaskDefaultValues = () =>
  taskSchema.partial().parse({
    completed: false,
    priority: "medium" as const,
    type: "Call" as const,
    due_date: new Date(),
  });
```

**Validation Strategy:**
- Single source of truth at API boundary (unifiedDataProvider)
- No form-level validation (per Engineering Constitution)
- Coercion used for date inputs (`z.coerce.date()`)
- All strings have max length constraints (DoS prevention)
- StrictObject prevents mass assignment
- Enums provide allowlist validation

---

## Component Tree

```
TaskCreate (default export)
├── CreateBase (redirect="list")
│   └── div.bg-muted.px-6.py-6
│       └── div.max-w-4xl.mx-auto.create-form-card
│           └── Form (defaultValues from getTaskDefaultValues + sales_id)
│               └── TaskFormContent
│                   ├── FormErrorSummary
│                   ├── div.space-y-6
│                   │   ├── div[data-tutorial="task-title"]
│                   │   │   └── TextInput (title)
│                   │   ├── TextInput (description, multiline)
│                   │   ├── div.grid.grid-cols-2.gap-4
│                   │   │   ├── div[data-tutorial="task-due-date"]
│                   │   │   │   └── TextInput (due_date, type="date")
│                   │   │   └── SelectInput (type)
│                   │   ├── div.grid.grid-cols-2.gap-4
│                   │   │   ├── SelectInput (priority)
│                   │   │   └── ReferenceInput (opportunity_id)
│                   │   │       └── AutocompleteInput
│                   │   └── ReferenceInput (contact_id, ref="contacts_summary")
│                   │       └── AutocompleteInput (optionText=contactOptionText)
│                   └── TaskCreateFooter
│                       ├── Button (Cancel, variant="outline")
│                       └── div.flex.gap-2
│                           ├── SaveButton (Save & Close)
│                           └── SaveButton (Save & Add Another)
```

---

## Shared Components Used

### From `@/components/admin/`
1. **TextInput** (`text-input.tsx`)
   - Wraps Input/Textarea with FormField, FormLabel, FormControl, FormError
   - Handles date formatting for date/datetime-local inputs
   - Supports multiline via Textarea component
   - Uses `isRequired` prop for label asterisk

2. **SelectInput** (`select-input.tsx`)
   - Wraps shadcn Select with React Admin integration
   - Supports choices prop with `{ id, name }` format
   - Handles empty values and translations
   - Integrates with FormField, FormLabel, FormError

3. **ReferenceInput** (`reference-input.tsx`)
   - React Admin component for foreign key relationships
   - Fetches reference data from specified resource
   - Passes choices to child input component

4. **AutocompleteInput** (`autocomplete-input.tsx`)
   - Searchable dropdown with keyboard navigation
   - Supports custom `optionText` for display formatting
   - Used with ReferenceInput for relationships

5. **SaveButton** (`form` directory)
   - React Admin submit button with mutation handling
   - Supports custom success/error callbacks
   - Integrates with React Hook Form

6. **FormErrorSummary** (`FormErrorSummary.tsx`)
   - Displays all form errors at top of form
   - Collapsible error list with AlertCircle icon
   - Extracts errors from react-hook-form's errors object

### From `@/components/ui/`
1. **Button** (`button.tsx`)
   - shadcn button with variant support
   - Used for Cancel action

---

## Inconsistencies & Notes

### Strengths
1. **Consistent with design system:** Uses semantic color tokens, follows create-form-card pattern
2. **Comprehensive helper text:** Every field has contextual guidance
3. **Tutorial markers:** `data-tutorial` attributes for onboarding flows
4. **Dirty state handling:** Confirmation dialog prevents accidental data loss
5. **Dual save actions:** Save & Close vs Save & Add Another for workflow efficiency
6. **Pre-filled defaults:** Reduces cognitive load with sensible defaults
7. **FormErrorSummary:** Provides accessible error overview at form top
8. **Proper Zod usage:** Coercion for dates, strict objects, max lengths

### Potential Issues
1. **No responsive breakpoints:** Two-column grids may not work on small screens
2. **Sticky footer positioning:** `bottom-12` may need adjustment for different viewport sizes
3. **Type field functional requirement:** Schema has default but form pre-fills - effectively required
4. **Hidden sales_id field:** No UI indicator that task is auto-assigned to current user
5. **No organization_id field:** Schema supports it but form doesn't expose it
6. **No reminder_date field:** Schema supports it but form doesn't expose it
7. **No snooze_until field:** Schema supports it but form doesn't expose it (likely Edit-only)

### Pattern Consistency
- Follows unified create form pattern from other audited forms
- Uses same footer structure as ContactCreate, OrganizationCreate
- Consistent use of FormErrorSummary across forms
- Helper text pattern consistent with other forms

### Data Flow
```
User Input
    ↓
Form State (React Hook Form)
    ↓
getTaskDefaultValues() + sales_id pre-fill
    ↓
taskCreateSchema validation (API boundary)
    ↓
unifiedDataProvider.create()
    ↓
Supabase (with RLS + triggers)
```

### Type Safety
- TypeScript interfaces derived from Zod schemas
- Type-safe choices for priority and type dropdowns
- No `any` types used

### Security Considerations
- StrictObject prevents mass assignment of audit fields
- created_by auto-set by database trigger
- sales_id pre-filled from authenticated user identity
- No direct Supabase access (uses unifiedDataProvider)

---

## Comparison with Other Forms

### Similar Patterns
- **OpportunityCreate:** Also has full-page layout, sticky footer, Save & Add Another
- **ContactCreate:** Same footer structure, FormErrorSummary usage
- **OrganizationCreate:** Similar two-column grid layouts

### Unique Features
- **Tutorial markers:** Only form with `data-tutorial` attributes
- **Task-specific dropdowns:** Priority and Type enums specific to tasks
- **Dual relationship inputs:** Both opportunity and contact relationships

### Missing Features (compared to others)
- **No tabs:** Single-section form (simpler than Contact/Organization)
- **No nested inputs:** No address or email arrays
- **No file uploads:** No documents or images

---

## Recommendations

### Immediate Fixes
1. Add responsive variants to two-column grids: `grid-cols-1 md:grid-cols-2`
2. Review sticky footer positioning for mobile viewports
3. Consider exposing `organization_id` if users need direct org linking
4. Add visual indicator that task is auto-assigned to current user

### Future Enhancements
1. Add `reminder_date` field for task reminders
2. Consider rich text editor for description
3. Add bulk task creation (Save & Add Another optimization)
4. Implement quick-add modal variant for inline task creation

### Pattern Improvements
1. Extract two-column grid pattern to reusable component
2. Standardize tutorial marker placement across forms
3. Document task type choices in schema file (currently in defaultConfiguration)

---

**Audit completed:** 2025-12-15
**Auditor:** Agent 7
