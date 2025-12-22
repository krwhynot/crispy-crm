# Contact Create Form Audit

**Audit Date:** 2025-12-15
**Git Branch:** `feature/distributor-organization-modeling`
**Git Commit:** `1cd3fbd3`
**File Path:** `src/atomic-crm/contacts/ContactCreate.tsx`
**Zod Schema:** `src/atomic-crm/validation/contacts.ts`

---

## 1. Form Structure Overview

| Property | Value |
|----------|-------|
| Form Type | `CreateBase` + `Form` (React Admin + RHF) |
| Layout Style | Full-page Card (max-w-4xl centered) |
| Number of Tabs | N/A (refactored from 2-tab to single-page) |
| Tab Names | N/A |
| Collapsible Sections | YES - 2 sections: "Additional Details", "Organization & Territory" |
| Total Fields | 13 user-facing fields (11 in form + 2 auto-populated) |
| Required Fields | 4 (first_name, last_name, organization_id, sales_id) |
| Optional Fields | 9 |
| Loading State | YES - `FormLoadingSkeleton` (ContactCreate.tsx:25-32) |
| Error Summary | YES - `FormErrorSummary` with collapsible errors |
| Tutorial Integration | YES - `ContactFormTutorial` component (ContactCreate.tsx:53) |

---

## 2. Default Values Strategy

| Strategy | Implementation |
|----------|---------------|
| Schema-derived defaults | YES - `contactBaseSchema.partial().parse({})` (ContactCreate.tsx:40) |
| Identity injection | YES - `sales_id` from `useSmartDefaults()` hook (ContactCreate.tsx:41) |
| Smart defaults hook | YES - `useSmartDefaults()` for organization context |
| Router state pre-fill | NO |
| Async segment lookup | NO |

**Code Example:**
```typescript
// ContactCreate.tsx:35-42
// Per Constitution #5: FORM STATE DERIVED FROM TRUTH
// contactBaseSchema is a ZodObject (not ZodEffects), so .partial().parse({}) works
const formDefaults = {
  ...contactBaseSchema.partial().parse({}),
  sales_id: defaults.sales_id,
};
```

**Constitution Compliance:**
- Uses `schema.partial().parse({})` for defaults
- Identity injection via `useSmartDefaults()` hook (sales_id)
- No hardcoded defaults outside schema truth

---

## 3. Special Features

| Feature | Present | Implementation |
|---------|---------|----------------|
| Duplicate Detection | NO | Not implemented |
| Transform on Save | YES | Auto-populates `first_seen`, `last_seen`, `tags: []` (ContactCreate.tsx:18-23) |
| Save & Add Another | YES | Resets form via `reset()`, stays on create page (ContactCreate.tsx:116-126) |
| Dirty State Check | YES | Cancel button checks `isDirty`, shows confirmation dialog (ContactCreate.tsx:83-89) |
| Hidden Fields | YES | System fields: `first_seen`, `last_seen`, `tags` |
| Custom Save Button | YES | Two SaveButton instances: "Save & Close" and "Save & Add Another" |
| Smart Email Parsing | YES | Auto-extracts first/last name from email pattern (ContactCompactForm.tsx:20-38) |
| Inline Organization Create | YES | `AutocompleteOrganizationInput` supports inline creation |

---

## 4. ASCII Wireframe

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

## 5. Field Inventory

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 1 | `first_name` | TextInput | YES | null | `.max(100)` | Coercion: NO (string) |
| 2 | `last_name` | TextInput | YES | null | `.max(100)` | Coercion: NO (string) |
| 3 | `organization_id` | ReferenceInput + Autocomplete | YES | undefined | `z.coerce.number()` | Coercion: YES |
| 4 | `sales_id` | ReferenceInput + SelectInput | YES | `defaults.sales_id` | `z.coerce.number()` | Coercion: YES |
| 5 | `email` | ArrayInput + TextInput + SelectInput | NO (but required in validation) | `[]` | `z.array(emailAndTypeSchema)` | Email validation in sub-schema |
| 6 | `phone` | ArrayInput + TextInput + SelectInput | NO | `[]` | `z.array(phoneNumberAndTypeSchema)` | Phone validation in sub-schema |
| 7 | `title` | TextInput | NO | null | `.max(100)` | Coercion: NO (string) |
| 8 | `department` | SelectInput | NO | null | `.max(100)` | Coercion: NO (string) |
| 9 | `linkedin_url` | TextInput | NO | null | LinkedIn domain validation | URL validation |
| 10 | `notes` | TextInput (multiline) | NO | null | `.max(5000)` + sanitizeHtml | Transform applied |
| 11 | `manager_id` | ReferenceInput + Autocomplete | NO | null | `z.coerce.number()` | Coercion: YES |
| 12 | `district_code` | TextInput | NO | null | `.max(10)` | Coercion: NO (string) |
| 13 | `territory_name` | TextInput | NO | null | `.max(100)` | Coercion: NO (string) |

**System Fields (Auto-populated, not in form):**
- `first_seen`: Set to current timestamp (ContactCreate.tsx:20)
- `last_seen`: Set to current timestamp (ContactCreate.tsx:21)
- `tags`: Empty array default (ContactCreate.tsx:22)

---

## 6. Form Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| `CreateBase` | `ra-core` | Provides mutation context and redirect |
| `Form` | `ra-core` | Form wrapper with RHF integration |
| `SaveButton` | `@/components/admin/form` | Submit button with mutation handling |
| `Button` | `@/components/ui/button` | Cancel button |
| `FormLoadingSkeleton` | `@/components/admin/form` | Loading state placeholder |
| `FormErrorSummary` | `@/components/admin/FormErrorSummary` | Collapsible error display |
| `ContactInputs` | `./ContactInputs` | Main form fields container |
| `ContactCompactForm` | `./ContactCompactForm` | Core identity and contact fields |
| `ContactAdditionalDetails` | `./ContactAdditionalDetails` | Collapsible sections |
| `ContactManagerInput` | `./ContactManagerInput` | Self-referential contact selector |
| `AutocompleteOrganizationInput` | `@/atomic-crm/organizations` | Organization autocomplete with inline create |
| `Avatar` | `./Avatar` | Display-only avatar component |
| `CompactFormRow` | `@/components/admin` | 2-column grid layout |
| `CollapsibleSection` | `@/components/admin/form` | Progressive disclosure container |
| `ArrayInput` | `@/components/admin` | Dynamic array field management |
| `SimpleFormIterator` | `@/components/admin` | Array item renderer |
| `ContactFormTutorial` | `./ContactFormTutorial` | Onboarding tutorial overlay |

---

## 7. Validation Schema Analysis

**Schema File:** `src/atomic-crm/validation/contacts.ts`

| Rule | Compliant | Notes |
|------|-----------|-------|
| Uses `z.strictObject()` | YES | Base schema uses `z.strictObject()` (line 86) |
| All strings have `.max()` | YES | All string fields have max constraints (100-5000 chars) |
| Uses `z.coerce` for non-strings | YES | `organization_id`, `sales_id`, `manager_id` use `z.coerce.number()` |
| Uses `z.enum()` for constrained values | YES | `personalInfoTypeSchema` (line 10), `contactDepartmentSchema` (line 13) |
| API boundary validation only | YES | Validation in `validateCreateContact()` (line 494-574) |

**Validation Details:**
- **Primary Schema:** `contactBaseSchema` (line 86-168)
- **Create Schema:** `createContactSchema` with stricter requirements (line 436-487)
- **Validation Function:** `validateCreateContact()` called from unifiedDataProvider
- **Email Requirement:** At least one email required for creation (line 549-555)
- **Organization Requirement:** No orphan contacts allowed (line 540-545)
- **Name Requirement:** Either first_name/last_name OR name required (line 511-526)

**Sub-Schemas:**
- `emailAndTypeSchema`: `z.strictObject()` with `value: z.string().email().max(254)`, `type: z.enum()` (line 45-48)
- `phoneNumberAndTypeSchema`: `z.strictObject()` with `value: z.string().max(30)`, `type: z.enum()` (line 51-54)

---

## 8. Accessibility Audit

| Requirement | Compliant | Notes |
|-------------|-----------|-------|
| `aria-invalid` on error fields | PARTIAL | Handled by React Admin input components |
| `aria-describedby` linking | PARTIAL | Handled by React Admin input components |
| `role="alert"` on errors | YES | FormErrorSummary displays errors |
| Touch targets 44x44px min | YES | Avatar: `w-11 h-11` (44px x 44px) |
| Keyboard navigation | YES | Standard form navigation enabled |
| Focus management | YES | React Hook Form handles focus |
| Helper text for required fields | YES | All required fields have "Required field" helper text |
| Tutorial system | YES | `data-tutorial` attributes on 7 key sections |

**Tutorial Integration:**
- `data-tutorial` attributes on: `contact-first-name`, `contact-last-name`, `contact-organization`, `contact-account-manager`, `contact-email`, `contact-phone`, `contact-save-btn`

---

## 9. Design System Compliance

| Rule | Compliant | Issues |
|------|-----------|--------|
| Semantic colors only | YES | Uses `bg-muted`, `bg-card`, `border-border`, `text-muted-foreground` |
| No hardcoded hex/oklch | YES | No raw color values found |
| `bg-muted` page background | YES | Outer container uses `bg-muted` (ContactCreate.tsx:46) |
| `create-form-card` class | YES | Applied to form container (ContactCreate.tsx:47) |
| Touch targets h-11 w-11 | YES | Avatar meets 44px minimum |

**Styling Details:**
- Background: `bg-muted` (outer), `bg-card` (footer)
- Borders: `border-border`
- Spacing: `px-6 py-6`, `space-y-3`, `gap-3`
- Max width: `max-w-4xl mx-auto`
- Footer: `sticky bottom-12` with border-t

---

## 10. Identified Issues / Recommendations

### Critical Issues

1. **Department validation mismatch:**
   - Schema: `contactDepartmentSchema` has 7 enum values (contacts.ts:13-21)
   - Form: `DEPARTMENT_CHOICES` has 11 values (constants.ts)
   - Missing in schema: "operations", "marketing", "finance", "other"
   - **Impact:** Form allows selecting values that schema will reject
   - **Fix:** Add missing enum values to schema or restrict form choices

2. **Email requirement UI mismatch:**
   - Validation: Requires at least one email (contacts.ts:549-555)
   - UI: Email field not marked with asterisk (not visually required)
   - **Impact:** User can submit without email and get validation error
   - **Fix:** Add asterisk to email field label or make email optional in validation

3. **Department_type field unused:**
   - Schema defines `department_type: contactDepartmentSchema` (line 103)
   - Form uses freeform text `department` field instead
   - `department_type` enum field never populated from form
   - **Impact:** Enum field intended for structured filtering goes unused
   - **Fix:** Update form to use `department_type` or remove from schema

### Constitution Violations

**None identified.** Form adheres to Engineering Constitution:
- Uses `schema.partial().parse({})` for defaults
- Validation at API boundary only (no form-level validation)
- Fail-fast approach (no retry logic or fallbacks)
- Uses `z.coerce` for number fields
- All strings have `.max()` constraints
- Uses `z.strictObject()` and `z.enum()` appropriately

### Improvements

- **Email array UX:** Email is required but not visually marked as required
- **Save & Add Another button position:** Consider making "Save & Add Another" secondary (outline variant)
- **Manager selection:** Could add helper text explaining self-reference prevention
- **LinkedIn URL validation:** Could provide real-time feedback instead of submit-time error

### Notes for Standardization

- **Smart defaults pattern:** Using `useSmartDefaults()` hook is a good pattern for other forms
- **Progressive disclosure:** Collapsible sections effectively reduce visual complexity
- **Smart email parsing:** Auto-filling name from email is a nice UX enhancement
- **Dirty state check:** Cancel confirmation prevents accidental data loss
- **Transform pattern:** Auto-populating system fields in `transform` function keeps concerns separated
- **Tutorial integration:** `data-tutorial` attributes provide good onboarding foundation

---

## 11. Cross-References

- **Edit Form:** `src/atomic-crm/contacts/ContactEdit.tsx`
- **SlideOver:** `src/atomic-crm/contacts/ContactSlideOver.tsx`
- **Inputs Component:** `src/atomic-crm/contacts/ContactInputs.tsx`
- **Compact Form:** `src/atomic-crm/contacts/ContactCompactForm.tsx`
- **Additional Details:** `src/atomic-crm/contacts/ContactAdditionalDetails.tsx`
- **Manager Input:** `src/atomic-crm/contacts/ContactManagerInput.tsx`
- **Avatar Component:** `src/atomic-crm/contacts/Avatar.tsx`
- **Related Tests:** `src/atomic-crm/contacts/__tests__/`
- **Organization Autocomplete:** `src/atomic-crm/organizations/AutocompleteOrganizationInput.tsx`
- **Constants:** `src/atomic-crm/contacts/constants.ts`
- **Tutorial:** `src/atomic-crm/contacts/ContactFormTutorial.tsx`

---

## Executive Summary

The ContactCreate form implements a compact, single-page layout with progressive disclosure. It uses 11 user-facing fields split between core identity fields (always visible) and optional details (in collapsible sections). The form enforces required fields through Zod validation at the API boundary and provides smart UX features like email-based name parsing.

**Key Characteristics:**
- Single-page layout with collapsible sections
- Smart email parsing auto-fills first/last name
- Organization autocomplete with inline creation
- Self-referential manager selection
- Array inputs for emails and phone numbers with type classification
- Full Constitution compliance (schema-derived defaults, API boundary validation)

**Form Behavior:**
1. **Save & Close:** Validates, creates record, redirects to list
2. **Save & Add Another:** Validates, creates record, resets form, stays on page
3. **Cancel:** Checks dirty state, shows confirmation if needed, redirects to list

**Constitution Compliance:** EXCELLENT
- Uses `schema.partial().parse({})` for defaults
- Identity injection via `useSmartDefaults()`
- Validation at API boundary only
- All strings have `.max()` constraints
- Uses `z.coerce` for numbers
- Uses `z.strictObject()` and `z.enum()`

---

## Complete Field Inventory (Legacy Detail)

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

## Files Analyzed

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactCreate.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactCompactForm.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactInputs.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactAdditionalDetails.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/Avatar.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactManagerInput.tsx`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/contacts.ts`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/constants.ts`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AutocompleteOrganizationInput.tsx`
