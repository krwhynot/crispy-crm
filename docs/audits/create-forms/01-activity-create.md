# ActivityCreate Form Audit

**Form:** `ActivityCreate`
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/activities/ActivityCreate.tsx`
**Date:** 2025-12-15
**Schema:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/activities.ts`

---

## Form Structure Overview

- **Form Type:** Single-page form (no tabs)
- **Layout:** Card-based with collapsible sections
- **Sections:** 4 total
  1. Activity Details (always visible)
  2. Relationships (always visible)
  3. Follow-up (collapsible)
  4. Outcome (collapsible)
- **Total Fields:** 14 fields (3 hidden/auto-filled)
- **Required Fields:** 4 (activity_type, type, subject, activity_date)
- **Optional Fields:** 10

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  ActivityCreate                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ FormErrorSummary (if errors)                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [Hidden Fields]                                            │
│  - activity_type: "interaction"                             │
│  - created_by: {current_user_id}                            │
│                                                             │
│  ┌─ ACTIVITY DETAILS ────────────────────────────────────┐  │
│  │                                                        │  │
│  │  [Interaction Type*]   (SelectInput - full width)     │  │
│  │                                                        │  │
│  │  [Subject*]            (TextInput - full width)       │  │
│  │                                                        │  │
│  │  [Date*]               [Duration (minutes)]           │  │
│  │  (date input)          (number input)                 │  │
│  │                                                        │  │
│  │  [Notes]               (TextInput - multiline)        │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ RELATIONSHIPS ───────────────────────────────────────┐  │
│  │                                                        │  │
│  │  [Opportunity]         [Contact]                      │  │
│  │  (autocomplete)        (autocomplete)                 │  │
│  │                                                        │  │
│  │  [Organization]        (full width autocomplete)      │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌▶ FOLLOW-UP ──────────────────────────────────────────┐  │
│  │  (collapsible - initially closed)                     │  │
│  │                                                        │  │
│  │  [Sentiment]           (SelectInput)                  │  │
│  │                                                        │  │
│  │  [Follow-up Date]      [Follow-up Notes]              │  │
│  │  (date input)          (multiline)                    │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌▶ OUTCOME ────────────────────────────────────────────┐  │
│  │  (collapsible - initially closed)                     │  │
│  │                                                        │  │
│  │  [Location]            [Outcome]                      │  │
│  │  (text input)          (text input)                   │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Delete]                   [Cancel]  [Save]           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Field Inventory

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 1 | `activity_type` | (hidden) | hidden | Yes | `"interaction"` | enum: engagement\|interaction | ActivityCreate.tsx:11-16 |
| 2 | `created_by` | (hidden) | - | No | `{current_user_id}` | union(string, number) | ActivityCreate.tsx:25 |
| 3 | `type` | Interaction Type | SelectInput | Yes | `"call"` | enum: 13 types | ActivitySinglePage.tsx:27-36 |
| 4 | `subject` | Subject | TextInput | Yes | - | min(1), max(255) | ActivitySinglePage.tsx:40-45 |
| 5 | `activity_date` | Date | TextInput (type="date") | Yes | `new Date()` | coerce.date() | ActivitySinglePage.tsx:48 |
| 6 | `duration_minutes` | Duration (minutes) | TextInput (type="number") | No | - | positive int | ActivitySinglePage.tsx:49-54 |
| 7 | `description` | Notes | TextInput (multiline) | No | - | string, sanitized | ActivitySinglePage.tsx:58-64 |
| 8 | `opportunity_id` | Opportunity | ReferenceInput + AutocompleteInput | Yes* | - | union(string, number) | ActivitySinglePage.tsx:71-78 |
| 9 | `contact_id` | Contact | ReferenceInput + AutocompleteInput | No** | - | union(string, number) | ActivitySinglePage.tsx:80-87 |
| 10 | `organization_id` | Organization | ReferenceInput + AutocompleteInput | No** | - | union(string, number) | ActivitySinglePage.tsx:90-97 |
| 11 | `sentiment` | Sentiment | SelectInput | No | - | enum: positive\|neutral\|negative | ActivitySinglePage.tsx:120-125 |
| 12 | `follow_up_date` | Follow-up Date | TextInput (type="date") | No | - | coerce.date() | ActivitySinglePage.tsx:129 |
| 13 | `follow_up_notes` | Follow-up Notes | TextInput (multiline) | No | - | string, sanitized | ActivitySinglePage.tsx:130-136 |
| 14 | `location` | Location | TextInput | No | - | string | ActivitySinglePage.tsx:162 |
| 15 | `outcome` | Outcome | TextInput | No | - | string, sanitized | ActivitySinglePage.tsx:163 |

**Notes:**
- `*` Required for `activity_type="interaction"` (validated at API boundary)
- `**` At least one of `contact_id` or `organization_id` is required (validated at API boundary)

---

## Input Types Used

| Input Type | Count | Fields |
|------------|-------|--------|
| **Hidden** | 1 | activity_type |
| **TextInput (text)** | 3 | subject, location, outcome |
| **TextInput (date)** | 2 | activity_date, follow_up_date |
| **TextInput (number)** | 1 | duration_minutes |
| **TextInput (multiline)** | 2 | description, follow_up_notes |
| **SelectInput** | 2 | type, sentiment |
| **ReferenceInput + AutocompleteInput** | 3 | opportunity_id, contact_id, organization_id |

**Total unique input components:** 3 (TextInput, SelectInput, ReferenceInput+AutocompleteInput)

---

## Dropdowns Detail

### 1. Interaction Type (`type`)
- **Source Line:** ActivitySinglePage.tsx:27-36
- **Choices:** 13 options from `INTERACTION_TYPE_OPTIONS`
- **Values:**
  ```typescript
  [
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "meeting", label: "Meeting" },
    { value: "demo", label: "Demo" },
    { value: "proposal", label: "Proposal" },
    { value: "follow_up", label: "Follow Up" },
    { value: "trade_show", label: "Trade Show" },
    { value: "site_visit", label: "Site Visit" },
    { value: "contract_review", label: "Contract Review" },
    { value: "check_in", label: "Check In" },
    { value: "social", label: "Social" },
    { value: "note", label: "Note" },
    { value: "sample", label: "Sample" }
  ]
  ```
- **Default:** `"call"` (from schema)
- **Required:** Yes
- **Helper Text:** "Choose how this interaction occurred"

### 2. Sentiment (`sentiment`)
- **Source Line:** ActivitySinglePage.tsx:120-125
- **Choices:** 3 options (local constant)
- **Values:**
  ```typescript
  [
    { id: "positive", name: "Positive" },
    { id: "neutral", name: "Neutral" },
    { id: "negative", name: "Negative" }
  ]
  ```
- **Default:** None
- **Required:** No
- **Helper Text:** "How did the contact respond?"

---

## Sections & Layout Breakdown

### Section 1: Activity Details (Always Visible)
- **Title:** "Activity Details"
- **Collapsed by Default:** No
- **Fields:** 5
  1. Interaction Type (full width, wrapped in tutorial div)
  2. Subject (full width)
  3. Date + Duration (2-column grid)
  4. Notes (full width, wrapped in tutorial div)

### Section 2: Relationships (Always Visible)
- **Title:** "Relationships"
- **Collapsed by Default:** No
- **Fields:** 3
  1. Opportunity + Contact (2-column grid, opportunity wrapped in tutorial div)
  2. Organization (full width)

### Section 3: Follow-up (Collapsible)
- **Title:** "Follow-up"
- **Collapsed by Default:** Yes (controlled by `followUpOpen` state)
- **Source Line:** ActivitySinglePage.tsx:100-140
- **Trigger:** Button with chevron icon
- **Fields:** 3
  1. Sentiment (full width in grid)
  2. Follow-up Date + Follow-up Notes (2-column grid)

### Section 4: Outcome (Collapsible)
- **Title:** "Outcome"
- **Collapsed by Default:** Yes (controlled by `outcomeOpen` state)
- **Source Line:** ActivitySinglePage.tsx:142-167
- **Trigger:** Button with chevron icon
- **Fields:** 2
  1. Location + Outcome (2-column grid)

---

## Styling & Design Tokens

### Layout Tokens
- **Card Spacing:** `p-6` (padding: 1.5rem)
- **Section Spacing:** `space-y-6` (gap: 1.5rem between sections)
- **Form Grid Gap:** `gap-x-6 gap-y-5` (horizontal: 1.5rem, vertical: 1.25rem)
- **Max Width:** `max-w-5xl` (80rem / 1280px)

### Color Tokens
| Element | Token | Line |
|---------|-------|------|
| Section headers | `text-muted-foreground` | ActivitySinglePage.tsx:112 |
| Section border | `border-border` | ActivitySinglePage.tsx:104 |
| Collapsible trigger | `border-border` | ActivitySinglePage.tsx:104 |

### Typography Tokens
| Element | Tokens | Line |
|---------|--------|------|
| Section title | `text-xs font-semibold uppercase tracking-wider` | ActivitySinglePage.tsx:112 |

### Sizing Tokens
- **Icon Size:** `h-4 w-4` (chevron icons)
- **Card Container:** `w-full max-w-5xl`

### Spacing Patterns
- Card content: `space-y-6` (1.5rem vertical rhythm)
- Collapsible content: `pt-6` (top padding after expansion)
- Section header: `pb-2` (bottom padding on border)

---

## Accessibility Audit

### Labels & ARIA
| Field | Has Label | ARIA Attributes | Helper Text | Line |
|-------|-----------|-----------------|-------------|------|
| type | Yes | - | "Choose how this interaction occurred" | 27-36 |
| subject | Yes | - | "Summarize the outcome or topic" | 40-45 |
| activity_date | Yes | - | None | 48 |
| duration_minutes | Yes | - | "Optional length of the activity" | 49-54 |
| description | Yes | - | "Optional narrative for this interaction" | 58-64 |
| opportunity_id | Yes | - | "Required for interaction activities" | 71-78 |
| contact_id | Yes | - | "Optional contact involved" | 80-87 |
| organization_id | Yes | - | "Optional organization context" | 90-97 |
| sentiment | Yes | - | "How did the contact respond?" | 120-125 |
| follow_up_date | Yes | - | None | 129 |
| follow_up_notes | Yes | - | "Optional next steps summary" | 130-136 |
| location | Yes | - | "Where did this occur?" | 162 |
| outcome | Yes | - | "Optional result summary" | 163 |

### Collapsible Sections
- **Follow-up Section:**
  - Trigger has `aria-label="Follow-up"` (line 105)
  - Button has `type="button"` to prevent form submission
  - Visual indicator (chevron) shows expanded/collapsed state

- **Outcome Section:**
  - Trigger has `aria-label="Outcome"` (line 147)
  - Button has `type="button"` to prevent form submission
  - Visual indicator (chevron) shows expanded/collapsed state

### Error Handling
- **FormErrorSummary** component displays at top of form (line 52)
- Accessible error banner with `role="alert"` and `aria-live="polite"`
- Errors extracted from `useFormState()`
- Clicking error scrolls to and focuses the field

### Helper Text
- **13 of 15 visible fields** have helper text (87% coverage)
- Missing helper text:
  1. `activity_date` (date is self-explanatory)
  2. `follow_up_date` (date is self-explanatory)

### Keyboard Navigation
- All collapsible sections keyboard accessible (button elements)
- Form submission via Enter key (standard form behavior)
- Tab order follows logical visual flow

---

## Responsive Behavior

### Breakpoints
- **FormGrid:** Changes from 1 column to 2 columns at `md` breakpoint (768px)
  - Mobile: `grid-cols-1`
  - Desktop: `md:grid-cols-2`

### Layout Changes
- **Mobile (< 768px):**
  - All fields stack vertically (single column)
  - Full width inputs
  - Collapsible sections remain functional

- **Tablet/Desktop (≥ 768px):**
  - Fields in FormGrid display in 2 columns
  - Pairs: Date/Duration, Opportunity/Contact, Follow-up Date/Notes, Location/Outcome

### Container Behavior
- **Outer wrapper:** `w-full max-w-5xl` prevents excessive width on large screens
- **Centered layout:** `flex justify-center` centers the form card
- **Responsive padding:** Card uses `p-6` at all breakpoints

---

## Zod Schema Reference

**Schema File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/activities.ts`

### Base Schema: `activitiesSchema`
- **Type:** `z.strictObject()` with `superRefine` for cross-field validation
- **Lines:** 70-185

### Key Validation Rules
1. **activity_type = "interaction"** → `opportunity_id` is required (line 130-136)
2. **activity_type = "engagement"** → `opportunity_id` must NOT be set (line 139-145)
3. **Either `contact_id` OR `organization_id` required** (line 148-154)
4. **If `follow_up_required`** → `follow_up_date` required (line 157-163)
5. **If `type = "sample"`** → `sample_status` required (line 167-173)
6. **If `type ≠ "sample"`** → `sample_status` must NOT be set (line 178-184)

### Default Values (Applied in Form)
```typescript
{
  ...activitiesSchema.partial().parse({}),
  created_by: identity?.id
}
```

From schema defaults:
- `activity_type: "interaction"` (line 72)
- `type: "call"` (line 73)
- `activity_date: new Date()` (line 80)
- `follow_up_required: false` (line 89)

### Coercion Rules
- `activity_date`: `z.coerce.date()` (line 80)
- `follow_up_required`: `z.coerce.boolean()` (line 89)
- `follow_up_date`: `z.coerce.date()` (line 90)
- `duration_minutes`: `z.number().int().positive()` (line 81)

### Sanitization
Fields with HTML sanitization (via `sanitizeHtml`):
- `description` (line 79)
- `follow_up_notes` (line 95)
- `outcome` (line 102)

### String Constraints
- `subject`: min(1), max(255) (line 74)
- All array fields have max constraints (DoS prevention)

---

## Component Tree

```
ActivityCreate (src/atomic-crm/activities/ActivityCreate.tsx)
├── CreateBase (ra-core)
│   └── Form (react-hook-form FormProvider)
│       ├── Card (shadcn/ui)
│       │   └── CardContent
│       │       └── ActivityFormContent
│       │           ├── FormErrorSummary
│       │           ├── HiddenActivityTypeField
│       │           │   └── useInput (ra-core)
│       │           ├── ActivitySinglePage
│       │           │   ├── FormSection (Activity Details)
│       │           │   │   ├── FormGrid
│       │           │   │   │   └── SelectInput (type)
│       │           │   │   ├── TextInput (subject)
│       │           │   │   ├── FormGrid
│       │           │   │   │   ├── TextInput (activity_date, type="date")
│       │           │   │   │   └── TextInput (duration_minutes, type="number")
│       │           │   │   └── TextInput (description, multiline)
│       │           │   ├── FormSection (Relationships)
│       │           │   │   ├── FormGrid
│       │           │   │   │   ├── ReferenceInput (opportunity_id)
│       │           │   │   │   │   └── AutocompleteInput
│       │           │   │   │   └── ReferenceInput (contact_id)
│       │           │   │   │       └── AutocompleteInput
│       │           │   │   └── ReferenceInput (organization_id)
│       │           │   │       └── AutocompleteInput
│       │           │   ├── Collapsible (Follow-up)
│       │           │   │   ├── CollapsibleTrigger (button + chevron)
│       │           │   │   └── CollapsibleContent
│       │           │   │       └── FormGrid
│       │           │   │           ├── SelectInput (sentiment)
│       │           │   │           ├── TextInput (follow_up_date, type="date")
│       │           │   │           └── TextInput (follow_up_notes, multiline)
│       │           │   └── Collapsible (Outcome)
│       │           │       ├── CollapsibleTrigger (button + chevron)
│       │           │       └── CollapsibleContent
│       │           │           └── FormGrid
│       │           │               ├── TextInput (location)
│       │           │               └── TextInput (outcome)
│       │           └── FormToolbar
│       │               ├── DeleteButton
│       │               ├── CancelButton
│       │               └── SaveButton
```

---

## Shared Components Used

### From `@/components/admin/`
1. **TextInput** (`text-input.tsx`)
   - Used 8 times
   - Variants: text, date, number, multiline

2. **SelectInput** (`select-input.tsx`)
   - Used 2 times
   - Fields: type, sentiment

3. **ReferenceInput** (`reference-input.tsx`)
   - Used 3 times
   - Always paired with AutocompleteInput

4. **AutocompleteInput** (`autocomplete-input.tsx`)
   - Used 3 times (nested in ReferenceInput)
   - Fields: opportunity_id, contact_id, organization_id

5. **FormGrid** (`form/FormGrid.tsx`)
   - Used 5 times
   - All instances use default 2-column layout

6. **FormSection** (`form/FormSection.tsx`)
   - Used 2 times
   - Sections: Activity Details, Relationships

7. **FormErrorSummary** (`FormErrorSummary.tsx`)
   - Used 1 time
   - Displays at top of form

### From `@/components/ui/`
1. **Card, CardContent** (`card`)
2. **Collapsible, CollapsibleContent, CollapsibleTrigger** (`collapsible`)

### From `@/atomic-crm/layout/`
1. **FormToolbar** (`FormToolbar.tsx`)
   - Contains: DeleteButton, CancelButton, SaveButton

### From React Admin (`ra-core`)
1. **CreateBase** - Form wrapper with data provider integration
2. **Form** - React Hook Form provider
3. **useInput** - Hook for controlled inputs
4. **useFormState** - Hook for form state/errors
5. **useGetIdentity** - Hook for current user

---

## Inconsistencies & Notes

### 1. Sample Status Field Missing
**Issue:** Schema validates `sample_status` when `type="sample"`, but field not in form.

**Evidence:**
- Validation: activities.ts:167-173
- Form: ActivitySinglePage.tsx - no `sample_status` field found

**Impact:** Users cannot create sample activities (validation will fail).

**Recommendation:** Add `sample_status` SelectInput conditionally when `type="sample"`.

---

### 2. Follow-up Required Field Missing
**Issue:** Schema has `follow_up_required` boolean, but form lacks checkbox/toggle.

**Evidence:**
- Schema field: activities.ts:89 (`follow_up_required: z.coerce.boolean().default(false)`)
- Schema validation: activities.ts:157-163 (requires `follow_up_date` when true)
- Form: No checkbox/toggle in Follow-up section

**Current Behavior:**
- Field defaults to `false` (from schema)
- Users can set `follow_up_date` without enabling flag
- Validation rule at line 157-163 only fires if `follow_up_required=true`

**Impact:** Minor - validation rule is one-directional (only checks if flag is true). Form still functional.

**Recommendation:** Add checkbox/toggle for `follow_up_required` in Follow-up section for explicit user control.

---

### 3. Helper Text Inconsistency
**Issue:** Some optional fields have "Optional" prefix in helper text, others don't.

**Evidence:**
- Has "Optional": duration_minutes (line 53), description (line 63), contact_id (line 84), organization_id (line 94), follow_up_notes (line 135), outcome (line 163)
- Missing "Optional": location (line 162)

**Impact:** Minor UX inconsistency.

**Recommendation:** Standardize all optional field helper texts to include or exclude "Optional" prefix.

---

### 4. Collapsible Section State Not Persisted
**Issue:** Collapsible sections reset when form re-renders (e.g., validation errors).

**Evidence:**
- State: ActivitySinglePage.tsx:19-20 (local component state)
- No persistence mechanism (localStorage, URL params, etc.)

**Impact:** User must re-expand sections after validation errors.

**Recommendation:** Consider session storage or URL state for collapsed/expanded preferences.

---

### 5. Tutorial Data Attributes Incomplete
**Issue:** Only 3 fields have `data-tutorial` attributes for onboarding.

**Evidence:**
- `data-tutorial="activity-type"` (line 26)
- `data-tutorial="activity-description"` (line 57)
- `data-tutorial="activity-opportunity"` (line 70)
- FormToolbar has `data-tutorial="activity-save-btn"` (ActivityCreate.tsx:55)

**Impact:** Incomplete tutorial/onboarding flow.

**Recommendation:** Add tutorial attributes to all critical fields or remove entirely if not used.

---

### 6. Organization Name Display Function Missing
**Issue:** `contact_id` uses custom `contactOptionText` function, but `organization_id` uses plain `"name"`.

**Evidence:**
- Contact: ActivitySinglePage.tsx:83 (`optionText={contactOptionText}`)
- Organization: ActivitySinglePage.tsx:93 (`optionText="name"`)

**Current Behavior:** Organizations display simple name, contacts display formatted text.

**Impact:** Minor - inconsistent display formatting in autocomplete dropdowns.

**Recommendation:** Consider creating `organizationOptionText` for consistent formatting.

---

### 7. Missing Fields from Schema
**Fields in schema but not in form:**
- `attachments` (array of strings, max 20)
- `attendees` (array of strings)
- `tags` (array of union(string, number))

**Impact:** These fields cannot be set during creation, must be edited later.

**Note:** May be intentional design decision to keep create form simple.

---

### 8. Default Form Values Pattern
**Good Practice Observed:** Form uses `activitiesSchema.partial().parse({})` pattern (line 23).

**Evidence:** ActivityCreate.tsx:21-27

**Benefit:** Ensures defaults from Zod schema are applied to form state.

**Note:** This is a best practice per Engineering Constitution.

---

## Summary Statistics

- **Total Fields:** 15 (including 1 hidden)
- **Visible Fields:** 14
- **Required Fields:** 4 direct + 2 conditional
- **Optional Fields:** 10
- **Default Values:** 4 (activity_type, type, activity_date, follow_up_required)
- **Sections:** 4 (2 always visible, 2 collapsible)
- **Input Components:** 3 unique types
- **Helper Text Coverage:** 87% (13/15)
- **Accessibility:** Full labels, ARIA on collapsibles, error summary
- **Responsive:** 2 breakpoints (mobile/desktop grid)
- **Validation:** Zod schema at API boundary only
- **Shared Components:** 10 from design system

---

## Recommendations Priority

### High Priority
1. **Add `sample_status` field** - Blocking for sample activity creation
2. **Add `follow_up_required` checkbox** - Schema validation expects it

### Medium Priority
3. **Standardize helper text** - "Optional" prefix consistency
4. **Add organization option text formatter** - Match contact formatting

### Low Priority
5. **Persist collapsible state** - Better UX during validation errors
6. **Complete tutorial attributes** - Or remove if unused
7. **Consider adding attachments/attendees/tags** - Schema supports, form doesn't

---

**Audit Completed:** 2025-12-15
**Form Status:** Functional with minor gaps (sample_status blocking)
