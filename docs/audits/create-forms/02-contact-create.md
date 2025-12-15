# Contact Create Form Audit

> **Form:** ContactCreate
> **Type:** Full-page Create Form
> **Audited:** 2025-12-15
> **Files:** ContactCreate.tsx, ContactCompactForm.tsx, ContactAdditionalDetails.tsx
> **Schema:** src/atomic-crm/validation/contacts.ts

---

## Executive Summary

The ContactCreate form implements a compact, single-page layout with progressive disclosure. It uses 11 user-facing fields split between core identity fields (always visible) and optional details (in collapsible sections). The form enforces required fields through Zod validation at the API boundary and provides smart UX features like email-based name parsing.

**Key Characteristics:**
- Single-page layout with collapsible sections
- Smart email parsing auto-fills first/last name
- Organization autocomplete with inline creation
- Self-referential manager selection
- Array inputs for emails and phone numbers with type classification

---

## Form Structure Overview

| Aspect | Value |
|--------|-------|
| **Form Type** | Full-page create form |
| **Layout** | Single column with progressive disclosure |
| **Tabs** | None (refactored from 2-tab to single-page) |
| **Sections** | 2 collapsible sections (Additional Details, Organization & Territory) |
| **Total Fields** | 11 user-facing fields |
| **Required Fields** | 4 (first_name, last_name, organization_id, sales_id) |
| **Footer** | Sticky with Cancel + 2 Save buttons |
| **Tutorial** | ContactFormTutorial component |

---

## ASCII Wireframe

```
┌────────────────────────────────────────────────────────────┐
│ CREATE CONTACT                                              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  [First Name *]          [Last Name *]          [Avatar]   │
│                                                             │
│  [Organization * ──────────────────────────────────]       │
│   (Autocomplete with create)                               │
│                                                             │
│  [Account Manager * ───────────────────────────────]       │
│   (Select dropdown)                                        │
│                                                             │
│  Email addresses                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [Email value] [Type ▼]                         [+]  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Phone numbers                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [Phone value] [Type ▼]                         [+]  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌── Additional Details ──────────────────────────────┐   │
│  │ ▼                                                   │   │
│  │  [Job Title]              [Department ▼]           │   │
│  │  [LinkedIn URL]                                    │   │
│  │  [Notes ──────────────────────────────────]        │   │
│  │      (multiline)                                   │   │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌── Organization & Territory ────────────────────────┐   │
│  │ ▼                                                   │   │
│  │  [Reports To]                                      │   │
│  │   (Contact autocomplete)                           │   │
│  │  [District Code]         [Territory]               │   │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
├────────────────────────────────────────────────────────────┤
│ [Cancel]                  [Save & Close] [Save & Add Another] │
└────────────────────────────────────────────────────────────┘
```

---

## Complete Field Inventory

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 1 | `first_name` | First Name * | Text | Yes | - | max 100 chars | ContactCompactForm.tsx:44 |
| 2 | `last_name` | Last Name * | Text | Yes | - | max 100 chars | ContactCompactForm.tsx:47 |
| 3 | `organization_id` | Organization * | ReferenceInput + Autocomplete | Yes | - | number (FK) | ContactCompactForm.tsx:56-63 |
| 4 | `sales_id` | Account manager * | ReferenceInput + SelectInput | Yes | defaults.sales_id | number (FK) | ContactCompactForm.tsx:68-82 |
| 5 | `email` | Email addresses | ArrayInput + TextInput + SelectInput | No | [] | array of {value: email, type: enum} | ContactCompactForm.tsx:87-112 |
| 6 | `phone` | Phone numbers | ArrayInput + TextInput + SelectInput | No | [] | array of {value: string, type: enum} | ContactCompactForm.tsx:116-141 |
| 7 | `title` | Job Title | Text | No | - | max 100 chars | ContactAdditionalDetails.tsx:13 |
| 8 | `department` | Department | SelectInput | No | - | enum from DEPARTMENT_CHOICES | ContactAdditionalDetails.tsx:14-20 |
| 9 | `linkedin_url` | LinkedIn URL | Text | No | - | LinkedIn domain validation | ContactAdditionalDetails.tsx:22-26 |
| 10 | `notes` | Notes | TextInput (multiline) | No | - | max 5000 chars, sanitized HTML | ContactAdditionalDetails.tsx:27 |
| 11 | `manager_id` | Reports To | ReferenceInput + Autocomplete | No | - | number (FK to contacts) | ContactManagerInput.tsx:20-36 |
| 12 | `district_code` | District Code | Text | No | - | max 10 chars | ContactAdditionalDetails.tsx:35-39 |
| 13 | `territory_name` | Territory | Text | No | - | max 100 chars | ContactAdditionalDetails.tsx:40-44 |

**System Fields (Auto-populated, not in form):**
- `first_seen`: Set to current timestamp (ContactCreate.tsx:20)
- `last_seen`: Set to current timestamp (ContactCreate.tsx:21)
- `tags`: Empty array default (ContactCreate.tsx:22)

---

## Input Types Used

| Input Type | Count | Fields |
|------------|-------|--------|
| TextInput | 6 | first_name, last_name, title, linkedin_url, notes, district_code, territory_name |
| ReferenceInput + AutocompleteInput | 2 | organization_id, manager_id |
| ReferenceInput + SelectInput | 1 | sales_id |
| ArrayInput + SimpleFormIterator | 2 | email, phone |
| SelectInput (within ArrayInput) | 3 | email.type, phone.type, department |
| Avatar Component | 1 | Display only (no input) |

---

## Dropdowns Detail

### Email/Phone Type Dropdown
- **Source:** `personalInfoTypes` constant (ContactCompactForm.tsx:15)
- **Choices:**
  - `work` (default)
  - `home`
  - `other`
- **Appearance:** Inline within SimpleFormIterator, 24px min-width (w-24)

### Department Dropdown
- **Source:** `DEPARTMENT_CHOICES` from constants.ts
- **Choices (11 options):**
  - `senior_management` - Senior Management
  - `sales_management` - Sales Management
  - `district_management` - District Management
  - `area_sales` - Area Sales
  - `sales_specialist` - Sales Specialist
  - `sales_support` - Sales Support
  - `procurement` - Procurement
  - `operations` - Operations
  - `marketing` - Marketing
  - `finance` - Finance
  - `other` - Other
- **Features:** Empty text placeholder "Select department"

### Account Manager Dropdown
- **Reference:** `sales` resource
- **Filter:** Active users with user_id not null, disabled != true
- **Sort:** By last_name ASC
- **Display:** Custom renderer via `saleOptionRenderer`
- **Required:** Yes, defaults to current user's sales_id

---

## Sections & Layout Breakdown

### 1. Core Identity Section (Always Visible)
**Layout:** CompactFormRow with custom 3-column grid `[1fr_1fr_auto]`
- First Name (required)
- Last Name (required)
- Avatar (display component)

**Source:** ContactCompactForm.tsx:42-52

### 2. Organization Section (Always Visible)
**Layout:** Full-width row
- Organization (required, autocomplete with inline create)

**Source:** ContactCompactForm.tsx:54-64

### 3. Account Manager Section (Always Visible)
**Layout:** Full-width row
- Account Manager (required, select dropdown)

**Source:** ContactCompactForm.tsx:66-83

### 4. Email Section (Always Visible)
**Layout:** ArrayInput with inline SimpleFormIterator
- Dynamic array of email entries
- Each entry: value (text) + type (select)
- Disables reordering and clear
- Smart email parsing on paste/blur

**Source:** ContactCompactForm.tsx:85-113

**Smart Feature:** Auto-extracts first/last name from email pattern (firstname.lastname@domain.com)
- Handler: `handleEmailChange` (ContactCompactForm.tsx:20-26)
- Triggers: onPaste and onBlur events

### 5. Phone Section (Always Visible)
**Layout:** ArrayInput with inline SimpleFormIterator
- Dynamic array of phone entries
- Each entry: value (text) + type (select)
- Disables reordering and clear

**Source:** ContactCompactForm.tsx:115-141

### 6. Additional Details (Collapsible)
**Layout:** CollapsibleSection (collapsed by default)
- Row 1 (CompactFormRow 2-col): Job Title, Department
- Row 2 (full-width): LinkedIn URL
- Row 3 (full-width): Notes (multiline, 3 rows)

**Source:** ContactAdditionalDetails.tsx:10-29

### 7. Organization & Territory (Collapsible)
**Layout:** CollapsibleSection (collapsed by default)
- Row 1 (full-width): Reports To (manager selector)
- Row 2 (CompactFormRow 2-col): District Code, Territory

**Source:** ContactAdditionalDetails.tsx:31-47

---

## Styling & Design Tokens

### Semantic Colors (Tailwind v4)
- Background: `bg-muted` (outer container), `bg-card` (footer)
- Borders: `border-border`
- Text: Default foreground, `text-muted-foreground` for labels

### Spacing
- Container padding: `px-6 py-6`
- Max width: `max-w-4xl mx-auto`
- Form gap: `space-y-3` (between sections)
- CompactFormRow gap: `gap-3`
- CollapsibleSection content: `space-y-4`

### Touch Targets
- Buttons: Default button sizing (meets 44px requirement)
- Avatar: `w-11 h-11` (44px x 44px)

### Layout Classes
- Create form card: `.create-form-card` (custom class)
- Sticky footer: `sticky bottom-12` with border-t
- CompactFormRow grids: `md:grid-cols-2` or custom `md:grid-cols-[1fr_1fr_auto]`

---

## Accessibility Audit

### Labels
- All inputs have visible labels (no floating labels)
- Required fields marked with asterisk (*)
- Helper text provided for required fields: "Required field"

### ARIA Attributes
- FormErrorSummary displays validation errors at top
- Error summary collapses if more than 3 errors
- Field labels map defined in CONTACT_FIELD_LABELS (ContactInputs.tsx:5-16)

### Helper Text
| Field | Helper Text |
|-------|-------------|
| first_name | "Required field" |
| last_name | "Required field" |
| organization_id | "Required field" |
| sales_id | "Required field" |
| linkedin_url | "Format: https://linkedin.com/in/username" |
| district_code | "e.g., D1, D73" |
| territory_name | "e.g., Western Suburbs" |
| manager_id | "Direct manager / supervisor" |
| email | Placeholder: "Email (valid email required)" |
| phone | Placeholder: "Phone number" |

### Tutorial System
- `data-tutorial` attributes on key sections:
  - `contact-first-name` (line 43)
  - `contact-last-name` (line 46)
  - `contact-organization` (line 55)
  - `contact-account-manager` (line 67)
  - `contact-email` (line 86)
  - `contact-phone` (line 116)
  - `contact-save-btn` (line 107)

---

## Responsive Behavior

### Breakpoints
- Mobile (<768px): Single column, full-width fields
- Desktop (≥768px): CompactFormRow activates 2-column grids
- Target: 1440px desktop (no scrolling), 1024px iPad (minimal scrolling)

### Grid Adaptations
- CompactFormRow: `grid-cols-1` → `md:grid-cols-2`
- Identity row: Custom grid `md:grid-cols-[1fr_1fr_auto]` for avatar alignment
- ArrayInput items: Full-width on mobile, inline on desktop

---

## Zod Schema Reference

**Primary Schema:** `contactBaseSchema` (contacts.ts:86-168)

### Required Fields (enforced by createContactSchema)
```typescript
// contacts.ts:510-546
- first_name OR last_name (at least one)
- sales_id (Account manager)
- organization_id (No orphan contacts)
- email (at least one email address) - enforced by validateCreateContact
```

### Field Validations
```typescript
first_name: z.string().max(100).optional().nullable()
last_name: z.string().max(100).optional().nullable()
email: z.array(emailAndTypeSchema).default([])
  // emailAndTypeSchema: { value: email().max(254), type: enum }
phone: z.array(phoneNumberAndTypeSchema).default([])
  // phoneNumberAndTypeSchema: { value: string().max(30), type: enum }
title: z.string().max(100).optional().nullable()
department: z.string().max(100).optional().nullable()
linkedin_url: LinkedIn domain validation + URL parsing
notes: z.string().max(5000).optional().nullable() + sanitizeHtml transform
manager_id: z.coerce.number().nullable().optional()
organization_id: z.coerce.number().nullable().optional()
district_code: z.string().max(10).nullable().optional()
territory_name: z.string().max(100).nullable().optional()
sales_id: z.coerce.number().nullish()
```

### Custom Refinements
1. **Name requirement:** At least first_name or last_name must be provided (line 511)
2. **Email array validation:** Each entry must have valid email format (line 387-395)
3. **Organization requirement:** Contacts cannot exist without organization (line 540-545)
4. **Email requirement for create:** At least one email must be provided (line 549-555)

### Transform Functions
- `transformContactData`: Computes `name` from first_name + last_name (line 176-196)
- `sanitizeHtml`: Applied to notes field (line 144)

---

## Component Tree

```
ContactCreate (ContactCreate.tsx:13)
├── CreateBase (redirect="list", transform=transformData)
│   ├── FormLoadingSkeleton (if loading)
│   └── Form (defaultValues=formDefaults)
│       └── ContactFormContent
│           ├── ContactInputs
│           │   ├── FormErrorSummary
│           │   └── ContactCompactForm
│           │       ├── CompactFormRow (identity)
│           │       │   ├── TextInput (first_name)
│           │       │   ├── TextInput (last_name)
│           │       │   └── Avatar
│           │       ├── ReferenceInput (organization_id)
│           │       │   └── AutocompleteOrganizationInput
│           │       ├── ReferenceInput (sales_id)
│           │       │   └── SelectInput
│           │       ├── ArrayInput (email)
│           │       │   └── SimpleFormIterator
│           │       │       ├── TextInput (value)
│           │       │       └── SelectInput (type)
│           │       ├── ArrayInput (phone)
│           │       │   └── SimpleFormIterator
│           │       │       ├── TextInput (value)
│           │       │       └── SelectInput (type)
│           │       └── ContactAdditionalDetails
│           │           ├── CollapsibleSection (Additional Details)
│           │           │   ├── CompactFormRow
│           │           │   │   ├── TextInput (title)
│           │           │   │   └── SelectInput (department)
│           │           │   ├── TextInput (linkedin_url)
│           │           │   └── TextInput (notes, multiline)
│           │           └── CollapsibleSection (Organization & Territory)
│           │               ├── ContactManagerInput
│           │               │   └── ReferenceInput (manager_id)
│           │               │       └── AutocompleteInput
│           │               └── CompactFormRow
│           │                   ├── TextInput (district_code)
│           │                   └── TextInput (territory_name)
│           └── ContactCreateFooter
│               ├── Button (Cancel)
│               ├── SaveButton (Save & Close)
│               └── SaveButton (Save & Add Another)
└── ContactFormTutorial
```

---

## Shared Components Used

### From @/components/admin/
- `TextInput` - Standard text/multiline inputs
- `ReferenceInput` - Foreign key relationship inputs
- `SelectInput` - Dropdown selections
- `ArrayInput` - Dynamic array field management
- `SimpleFormIterator` - Array item renderer with add/remove
- `CompactFormRow` - 2-column grid layout for related fields
- `FormLoadingSkeleton` - Loading state placeholder
- `SaveButton` - Submit button with mutation handling
- `FormErrorSummary` - Collapsible error list at form top

### From @/components/ui/
- `Button` - Cancel button
- `Avatar`, `AvatarImage`, `AvatarFallback` - User avatar display

### From @/components/admin/form/
- `CollapsibleSection` - Progressive disclosure container

### Domain Components
- `AutocompleteOrganizationInput` - Organization autocomplete with create
- `ContactManagerInput` - Self-referential contact selector
- `ContactFormTutorial` - Onboarding tutorial overlay

---

## Hooks & Context

### React Hook Form
- `useFormContext` - Access form methods (setValue, getValues, reset)
- `useFormState` - Access form state (errors, isDirty)

### React Admin
- `useNotify` - Toast notifications
- `useRedirect` - Navigation after save
- `useSmartDefaults` - Organization-specific defaults (sales_id)
- `useGetIdentity` - Current user identity (in AutocompleteOrganizationInput)
- `useCreate` - Mutation for inline organization creation
- `useRecordContext` - Access current record in nested components

### Smart Defaults
**Source:** `useSmartDefaults` hook
- `sales_id`: Pre-populated from current user context
- Form defaults generated via: `contactBaseSchema.partial().parse({})`

---

## Form Behavior

### Save Actions
1. **Save & Close**
   - Validates form
   - Calls create mutation
   - Shows success toast
   - Redirects to `/contacts` list
   - Source: ContactCreate.tsx:104-115

2. **Save & Add Another**
   - Validates form
   - Calls create mutation
   - Shows success toast
   - Resets form to defaults
   - Stays on create page
   - Source: ContactCreate.tsx:116-126

### Cancel Behavior
- Checks if form is dirty (has unsaved changes)
- Shows confirmation dialog if dirty
- Redirects to `/contacts` list on confirm
- Source: ContactCreate.tsx:83-89

### Smart Email Parsing
**Trigger:** Paste or blur on email value input
**Logic:**
1. Extract email address
2. Split on "@" to get local part
3. Split local part on "." to get first/last components
4. Capitalize first letter of each component
5. Populate first_name and last_name only if they're empty
6. Source: ContactCompactForm.tsx:20-38

**Example:** `john.smith@company.com` → First: "John", Last: "Smith"

### Manager Selection
- Self-referential FK to contacts table
- Filters out current contact to prevent self-reference
- Filter: `"id@neq": record.id` (ContactManagerInput.tsx:23)
- Search: Fuzzy match on first_name and last_name

---

## Validation Strategy

### Validation Location
Per Engineering Constitution: **All validation at API boundary only**
- Forms do NOT validate
- Validation happens in `unifiedDataProvider`
- Function: `validateCreateContact` (contacts.ts:494-573)

### Validation Mode
- **Mode:** `onSubmit` (default, no onChange validation)
- Error display: FormErrorSummary at top + inline field errors
- Error summary auto-expands if ≤3 errors

### Error Handling
```typescript
// ContactCreate.tsx:91-96
const handleError = useCallback(
  (error: Error) => {
    notify(error.message || "Failed to create contact", { type: "error" });
  },
  [notify]
);
```

---

## Data Transform

**Transform Function:** `transformData` (ContactCreate.tsx:18-23)

```typescript
const transformData = (data: Contact) => ({
  ...data,
  first_seen: new Date().toISOString(),
  last_seen: new Date().toISOString(),
  tags: [],
});
```

**Purpose:** Auto-populate system fields before API submission

---

## Inconsistencies & Notes

### Inconsistencies
1. **Department validation mismatch:**
   - Schema: `contactDepartmentSchema` has 7 enum values (contacts.ts:13-21)
   - Form: `DEPARTMENT_CHOICES` has 11 values (constants.ts:5-17)
   - Missing in schema: "operations", "marketing", "finance", "other"
   - **Impact:** Form allows selecting values that schema will reject

2. **Email requirement confusion:**
   - Base schema: `email` array defaults to [] (optional)
   - Create schema: `validateCreateContact` requires at least one email (line 549)
   - UI: Email field not marked with asterisk (not visually required)
   - **Impact:** User can submit without email and get validation error

3. **Department_type field unused:**
   - Schema defines `department_type: contactDepartmentSchema` (line 103)
   - Form uses freeform text `department` field instead
   - `department_type` enum field never populated from form
   - **Impact:** Enum field intended for structured filtering goes unused

### Positive Patterns
1. **Smart defaults from schema:** Form uses `contactBaseSchema.partial().parse({})` to derive defaults (ContactCreate.tsx:40)
2. **Progressive disclosure:** Optional fields hidden in collapsible sections
3. **Smart UX:** Email parsing, inline organization creation
4. **Accessibility:** Tutorial system, helper text, error summary
5. **Array management:** Clean UX for adding multiple emails/phones
6. **Self-reference prevention:** Manager selector filters out current contact

### Notes
- Form successfully refactored from 2-tab to single-page with collapsible sections
- Avatar component is display-only (no file upload in create form)
- Tags array initialized as empty, likely managed elsewhere
- Form adheres to Tailwind v4 semantic colors
- Touch targets meet 44px minimum (h-11)
- No retry logic or circuit breakers (pre-launch fail-fast approach)

---

## References

### Files Analyzed
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactCreate.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactCompactForm.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactInputs.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactAdditionalDetails.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/Avatar.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactManagerInput.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/contacts.ts`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/constants.ts`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AutocompleteOrganizationInput.tsx`

### Related Documentation
- Engineering Constitution: Fail-fast, Zod validation at API boundary
- CLAUDE.md: Forms validation, Tailwind v4 semantic colors
- Plan: 2025-12-06-compact-create-forms.md
