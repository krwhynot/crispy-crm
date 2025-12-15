# OrganizationCreate Form Audit

**Date:** 2025-12-15
**Form Component:** `OrganizationCreate`
**File Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationCreate.tsx`

---

## Executive Summary

The OrganizationCreate form is a sophisticated, full-page create form for adding new organizations to the CRM. It features soft duplicate detection with user confirmation, smart defaults from identity management, URL auto-prefixing, and a comprehensive field set organized into collapsible sections. The form delegates all field rendering to `OrganizationCompactForm`, which contains 23 total fields across basic information, contact details, hierarchy, and address sections.

**Key Features:**
- Soft duplicate warning dialog (confirmation, not hard block)
- Schema-derived defaults with identity-based smart defaults
- Website URL auto-prefixing (adds `https://` if missing)
- Parent organization pre-fill from router state (for "Add Branch" flows)
- Collapsible sections for additional details, hierarchy, and address
- Custom duplicate-check save button pattern

**Total Fields:** 23 (6 in main section, 4 in "Additional Details", 3 in "Organization Hierarchy", 3 in "Address", 7 in top rows)

---

## Form Structure Overview

**Form Type:** Full-page create form
**Layout:** Single-column card with max-width constraint (max-w-4xl)
**Background:** `bg-muted` with `px-6 py-6` padding
**Card Container:** shadcn/ui `Card` component
**Sections:** 4 (Main fields, Additional Details, Organization Hierarchy, Address)
**Collapsible Sections:** 3 (Additional Details, Organization Hierarchy, Address)
**Toolbar:** Custom toolbar with Cancel + DuplicateCheckSaveButton

**Component Hierarchy:**
```
OrganizationCreate
└── CreateBase (React Admin)
    └── Form (React Admin)
        └── Card
            └── CardContent
                └── OrganizationFormContent
                    ├── OrganizationInputs
                    │   ├── FormErrorSummary
                    │   └── OrganizationCompactForm
                    │       ├── CompactFormRow × 4
                    │       ├── CollapsibleSection "Additional Details"
                    │       ├── OrganizationHierarchySection
                    │       └── OrganizationAddressSection
                    └── FormToolbar
                        ├── CancelButton
                        └── DuplicateCheckSaveButton
```

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  bg-muted padding (px-6 py-6)                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ max-w-4xl mx-auto create-form-card                        │  │
│  │ ┌───────────────────────────────────────────────────────┐ │  │
│  │ │ Card > CardContent                                    │ │  │
│  │ │                                                       │ │  │
│  │ │ [Error Summary - if errors exist]                    │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌─────────────────────┬─────────────────────┐        │ │  │
│  │ │ │ Organization Name * │ Type                │        │ │  │
│  │ │ └─────────────────────┴─────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌──────────┬──────────────────┬──────────┐           │ │  │
│  │ │ │ Priority │ Account Manager  │ Segment  │           │ │  │
│  │ │ └──────────┴──────────────────┴──────────┘           │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌─────────────────────┬─────────────────────┐        │ │  │
│  │ │ │ Street              │ City                │        │ │  │
│  │ │ └─────────────────────┴─────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌─────────────────────┬─────────────────────┐        │ │  │
│  │ │ │ State               │ Zip Code            │        │ │  │
│  │ │ └─────────────────────┴─────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌───────────────────────────────────────────┐        │ │  │
│  │ │ │ ▼ Additional Details              [Expand]│        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │ │ Website                                   │        │ │  │
│  │ │ │ Phone                                     │        │ │  │
│  │ │ │ LinkedIn URL                              │        │ │  │
│  │ │ │ Description [multiline]                   │        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌───────────────────────────────────────────┐        │ │  │
│  │ │ │ ▼ Organization Hierarchy          [Expand]│        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │ │ Parent Organization [autocomplete]        │        │ │  │
│  │ │ │ ┌──────────┬──────────────────────┐       │        │ │  │
│  │ │ │ │ Scope    │ Operating Entity ☐   │       │        │ │  │
│  │ │ │ └──────────┴──────────────────────┘       │        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌───────────────────────────────────────────┐        │ │  │
│  │ │ │ ▼ Address                         [Expand]│        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │ │ Street                                    │        │ │  │
│  │ │ │ ┌──────────────────┬──────────────────┐   │        │ │  │
│  │ │ │ │ City             │ State            │   │        │ │  │
│  │ │ │ └──────────────────┴──────────────────┘   │        │ │  │
│  │ │ │ ZIP Code                                  │        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌───────────────────────────────────────────┐        │ │  │
│  │ │ │           [Cancel] [Create Organization]  │        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ └───────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Field Inventory

### Main Section (OrganizationCompactForm lines 15-32)

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 1 | `name` | "Organization Name *" | TextInput | Yes | `""` | min(1), max(255) | OrganizationCompactForm.tsx:17-22 |
| 2 | `organization_type` | "Type" | SelectInput | No | `"prospect"` | enum: customer, prospect, principal, distributor, operator | OrganizationCompactForm.tsx:25-31 |

### Priority & Assignment Row (lines 35-52)

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 3 | `priority` | "Priority" | SelectInput | No | `"C"` | enum: A, B, C, D | OrganizationCompactForm.tsx:36-42 |
| 4 | `sales_id` | "Account Manager" | ReferenceInput → SelectInput | No | `smartDefaults.sales_id` | number, nullable | OrganizationCompactForm.tsx:43-50 |
| 5 | `segment_id` | "Segment" | SegmentComboboxInput | No | `unknownSegmentId ?? null` | uuid, nullable | OrganizationCompactForm.tsx:51 |

### Primary Address Row 1 (lines 54-57)

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 6 | `address` | "Street" | TextInput | No | `null` | max(500) | OrganizationCompactForm.tsx:55 |
| 7 | `city` | "City" | TextInput | No | `null` | max(100) | OrganizationCompactForm.tsx:56 |

### Primary Address Row 2 (lines 59-62)

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 8 | `state` | "State" | StateComboboxInput | No | `null` | max(100) | OrganizationCompactForm.tsx:60 |
| 9 | `postal_code` | "Zip Code" | TextInput | No | `null` | max(20) | OrganizationCompactForm.tsx:61 |

### CollapsibleSection: "Additional Details" (lines 64-83, defaultOpen=false)

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 10 | `website` | "Website" | TextInput | No | `null` | url or empty, transformed with https:// prefix | OrganizationCompactForm.tsx:67 |
| 11 | `phone` | "Phone" | TextInput | No | `null` | max(30) | OrganizationCompactForm.tsx:69 |
| 12 | `linkedin_url` | "LinkedIn URL" | TextInput | No | `null` | LinkedIn domain regex | OrganizationCompactForm.tsx:70-74 |
| 13 | `description` | "Description" | TextInput (multiline, 3 rows) | No | `null` | max(5000), sanitized | OrganizationCompactForm.tsx:75-81 |

### OrganizationHierarchySection (lines 85, CollapsibleSection defaultOpen=false)

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 14 | `parent_organization_id` | "Parent Organization" | ReferenceInput → AutocompleteInput | No | `parentOrgId ?? null` | number, nullable, excludes self | ParentOrganizationInput.tsx:13-25 |
| 15 | `org_scope` | "Scope" | SelectInput | No | `null` | enum: national, regional, local | OrganizationHierarchySection.tsx:13-19 |
| 16 | `is_operating_entity` | "This location processes orders" | BooleanInput | No | `true` | boolean | OrganizationHierarchySection.tsx:21-25 |

### OrganizationAddressSection (lines 86, CollapsibleSection defaultOpen=false, Title: "Address")

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 17 | `shipping_street` | "Street" | TextInput | No | `null` | max(255) | OrganizationAddressSection.tsx:9 |
| 18 | `shipping_city` | "City" | TextInput | No | `null` | max(100) | OrganizationAddressSection.tsx:11 |
| 19 | `shipping_state` | "State" | StateComboboxInput | No | `null` | max(2) | OrganizationAddressSection.tsx:12 |
| 20 | `shipping_postal_code` | "ZIP Code" | TextInput | No | `null` | max(20) | OrganizationAddressSection.tsx:14 |

### Hidden System Fields (Auto-populated, not in UI)

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 21 | `status` | N/A | Hidden | No | `"active"` | enum: active, inactive | organizations.ts:120 |
| 22 | `billing_country` | N/A | Hidden | No | `"US"` | max(2) | organizations.ts:128 |
| 23 | `shipping_country` | N/A | Hidden | No | `"US"` | max(2) | organizations.ts:135 |

**Total Field Count:** 23 fields

---

## Input Types Summary

| Input Type | Count | Fields |
|------------|-------|--------|
| TextInput | 11 | name, address, city, postal_code, website, phone, linkedin_url, description, shipping_street, shipping_city, shipping_postal_code |
| SelectInput | 3 | organization_type, priority, org_scope |
| ReferenceInput → SelectInput | 1 | sales_id |
| ReferenceInput → AutocompleteInput | 1 | parent_organization_id |
| SegmentComboboxInput | 1 | segment_id |
| StateComboboxInput | 2 | state, shipping_state |
| BooleanInput | 1 | is_operating_entity |
| Hidden/System | 3 | status, billing_country, shipping_country |

**Unique Component Types:** 8

---

## Dropdowns Detail

### 1. Organization Type (organization_type)
**Component:** SelectInput
**Source:** OrganizationCompactForm.tsx:25-31
**Choices Constant:** `ORGANIZATION_TYPE_CHOICES` (constants.ts:26-32)
**Default:** `"prospect"` (schema default, organizations.ts:107)
**Empty Text:** "Select organization type"

**Choices:**
```typescript
{ id: "customer", name: "Customer" }
{ id: "prospect", name: "Prospect" }
{ id: "principal", name: "Principal" }
{ id: "distributor", name: "Distributor" }
{ id: "operator", name: "Operator" }
```

### 2. Priority (priority)
**Component:** SelectInput
**Source:** OrganizationCompactForm.tsx:36-42
**Choices Constant:** `PRIORITY_CHOICES` (constants.ts:41-46)
**Default:** `"C"` (schema default, organizations.ts:108)
**Empty Text:** "Select priority"

**Choices:**
```typescript
{ id: "A", name: "A - High" }
{ id: "B", name: "B - Medium-High" }
{ id: "C", name: "C - Medium" }
{ id: "D", name: "D - Low" }
```

### 3. Account Manager (sales_id)
**Component:** ReferenceInput → SelectInput
**Source:** OrganizationCompactForm.tsx:43-50
**Reference:** "sales" resource
**Default:** `smartDefaults.sales_id` (from identity hook, OrganizationCreate.tsx:206)
**Sort:** `{ field: "last_name", order: "ASC" }`
**Filter:** `{ "disabled@neq": true, "user_id@not.is": null }`
**Option Renderer:** `saleOptionRenderer` (custom function)

### 4. Segment (segment_id)
**Component:** SegmentComboboxInput
**Source:** OrganizationCompactForm.tsx:51
**Default:** `unknownSegmentId ?? null` (fetched "Unknown" segment, OrganizationCreate.tsx:124-136, 208)
**Type:** Combobox with search/filter capability

### 5. State (state)
**Component:** StateComboboxInput
**Source:** OrganizationCompactForm.tsx:60
**Choices:** US States (constants.ts:142-193)
**Type:** Combobox with search capability

### 6. Scope (org_scope)
**Component:** SelectInput
**Source:** OrganizationHierarchySection.tsx:13-19
**Choices Constant:** `ORG_SCOPE_CHOICES` (constants.ts:86-90)
**Empty Text:** "Select scope"
**Helper Text:** "National = brand/HQ, Regional = operating company"

**Choices:**
```typescript
{ id: "national", name: "National" }
{ id: "regional", name: "Regional" }
{ id: "local", name: "Local" }
```

### 7. Shipping State (shipping_state)
**Component:** StateComboboxInput
**Source:** OrganizationAddressSection.tsx:12
**Choices:** US States (constants.ts:142-193)
**Type:** Combobox with search capability

### 8. Parent Organization (parent_organization_id)
**Component:** ReferenceInput → AutocompleteInput
**Source:** ParentOrganizationInput.tsx:13-25
**Reference:** "organizations" resource
**Default:** `parentOrgId ?? null` (from router state, OrganizationCreate.tsx:139, 209)
**Filter:** Excludes self (`{ "id@neq": record.id }` if editing)
**Search Filter:** `{ "name@ilike": `%${searchText}%` }`
**Empty Text:** "No parent organization"
**Helper Text:** "Select a parent organization if this is a branch location"

---

## Sections & Layout Breakdown

### Section 1: Main Fields (Always Visible)
**Source:** OrganizationCompactForm.tsx:14-62
**Layout:** 4 CompactFormRow containers (grid with md:grid-cols-2)
**Fields:** 9 fields
- Row 1: name, organization_type
- Row 2: priority, sales_id, segment_id (3 columns via grid)
- Row 3: address, city
- Row 4: state, postal_code

**Spacing:** `space-y-4` between rows

### Section 2: Additional Details (Collapsible, defaultOpen=false)
**Source:** OrganizationCompactForm.tsx:64-83
**Component:** CollapsibleSection
**Title:** "Additional Details"
**Layout:** Vertical stack (`space-y-4`)
**Fields:** 4 fields (website, phone, linkedin_url, description)
**Border:** `border border-border rounded-md`
**Trigger Height:** `h-11` (44px touch target)

**Helper Texts:**
- website: "Format: https://example.com"
- phone: "Format: (555) 123-4567"
- linkedin_url: "Format: https://linkedin.com/company/name"

### Section 3: Organization Hierarchy (Collapsible, defaultOpen=false)
**Source:** OrganizationHierarchySection.tsx:7-36
**Component:** CollapsibleSection
**Title:** "Organization Hierarchy"
**Layout:** `space-y-4` with nested CompactFormRow
**Fields:** 3 fields (parent_organization_id, org_scope, is_operating_entity)

**Boolean Input Helper:**
- Inline helper text with formatting for ON/OFF states
- **ON:** Orders and invoices happen here (e.g., Sysco Chicago)
- **OFF:** Corporate brand or holding company only (e.g., Sysco Corporation)

### Section 4: Address (Collapsible, defaultOpen=false)
**Source:** OrganizationAddressSection.tsx:5-18
**Component:** CollapsibleSection
**Title:** "Address"
**Layout:** `space-y-4` with CompactFormRow for city/state
**Fields:** 4 fields (shipping_street, shipping_city, shipping_state, shipping_postal_code)
**Note:** These are shipping address fields, distinct from primary address (address, city, state, postal_code)

### Toolbar Section
**Source:** OrganizationCreate.tsx:257-266
**Component:** FormToolbar
**Layout:** Flex row with gap-2, right-aligned (`justify-end`)
**Buttons:** CancelButton, DuplicateCheckSaveButton

---

## Styling & Design Tokens

### Layout Tokens
- **Max Width:** `max-w-4xl` (container constraint)
- **Background:** `bg-muted` (page background)
- **Padding:** `px-6 py-6` (outer container)
- **Card Spacing:** `space-y-4` (between form sections)
- **Gap:** `gap-2` (toolbar buttons), `gap-3` (CompactFormRow)

### Color Tokens (Semantic)
- **Background:** `bg-muted` (page), `hover:bg-muted/50` (collapsible trigger)
- **Text:** `text-muted-foreground` (section headers, helper text)
- **Border:** `border-border` (collapsible sections)

### Component Tokens
- **Touch Targets:** `h-11` (44px minimum - WCAG AA, Fitts's Law)
- **Grid Columns:** `grid-cols-1 md:grid-cols-2` (responsive 2-column layout)
- **Border Radius:** `rounded-md` (collapsible sections)

### Focus States
- **Collapsible Trigger:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`

---

## Accessibility Audit

### Labels
- **Explicit Labels:** All 20 visible fields have explicit label props
- **Required Indicator:** Only `name` field shows `*` in label text (OrganizationCompactForm.tsx:19)
- **Label Clarity:** Labels are concise and descriptive

### ARIA Attributes
- **Collapsible Sections:**
  - `aria-controls={contentId}` on triggers (CollapsibleSection.tsx:29)
  - Unique IDs generated via `useId()` (CollapsibleSection.tsx:20)
- **Hidden Submit Button:** `aria-hidden="true" tabIndex={-1}` (OrganizationCreate.tsx:91-92)
- **Error Summary:** FormErrorSummary component shows validation errors at top (OrganizationInputs.tsx:28-32)

### Helper Text
- **Present on:**
  - website: "Format: https://example.com"
  - phone: "Format: (555) 123-4567"
  - linkedin_url: "Format: https://linkedin.com/company/name"
  - parent_organization_id: "Select a parent organization if this is a branch location"
  - org_scope: "National = brand/HQ, Regional = operating company"
  - is_operating_entity: Detailed ON/OFF explanation (inline)

- **Explicitly disabled:** `helperText={false}` on 14 fields (mostly basic text inputs)

### Keyboard Navigation
- **Tab Order:** Natural DOM order (top to bottom)
- **Collapsible Sections:** Keyboard accessible via trigger buttons
- **Focus Management:** Standard React Admin input focus behavior

### Screen Readers
- **Collapsible State:** ChevronDown icon rotates, `data-testid="collapsible-chevron"` (CollapsibleSection.tsx:40-41)
- **Error Announcements:** FormErrorSummary at top alerts users to validation errors

### Touch Targets
- **Minimum Height:** `h-11` (44px) on all collapsible triggers (CollapsibleSection.tsx:34)
- **WCAG Compliance:** Meets WCAG AA 2.1 success criterion 2.5.5 (Target Size)

---

## Responsive Behavior

### Breakpoints
- **Mobile (< md):** All CompactFormRow fields stack vertically (`grid-cols-1`)
- **Tablet/Desktop (>= md):** CompactFormRow fields display in 2 columns (`md:grid-cols-2`)

### Grid Behavior
- **Priority Row:** Always 2 columns on desktop (priority, sales_id, segment_id uses default grid)
- **Collapsible Sections:** Expand/collapse on all screen sizes

### Touch Optimization
- **Target Size:** 44px minimum height on interactive elements
- **Spacing:** `gap-3` in CompactFormRow for adequate tap spacing

---

## Zod Schema Reference

**Schema File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/organizations.ts`
**Schema Name:** `organizationSchema` (lines 68-146)
**Create Schema:** `createOrganizationSchema` (lines 183-197)

### Field Validation Details

```typescript
// Required fields
name: z.string().min(1, "Organization name is required").max(255, "Organization name too long")

// Enums with defaults
organization_type: organizationTypeSchema.default("prospect") // enum: customer, prospect, principal, distributor, operator
priority: organizationPrioritySchema.default("C") // enum: A, B, C, D

// Optional UUIDs
segment_id: z.string().uuid().optional().nullable()

// Optional strings with max lengths
phone: z.string().max(30, "Phone number too long").nullish()
address: z.string().max(500, "Address too long").nullish()
postal_code: z.string().max(20, "Postal code too long").nullish()
city: z.string().max(100, "City name too long").nullish()
state: z.string().max(100, "State name too long").nullish()

// URL validation
website: isValidUrl.nullish() // z.string().url() or z.literal("")
linkedin_url: isLinkedinUrl.nullish() // Custom LinkedIn domain regex

// Sanitized text fields
description: z.string().max(5000, "Description too long").optional().nullable().transform((val) => sanitizeHtml(val))

// Numeric fields
sales_id: z.coerce.number().nullish()
parent_organization_id: z.coerce.number().optional().nullable()

// Hierarchy fields
org_scope: orgScopeSchema.nullable().optional() // enum: national, regional, local
is_operating_entity: z.coerce.boolean().default(true)

// Status fields (hidden, system defaults)
status: orgStatusSchema.default('active') // enum: active, inactive

// Billing/Shipping Address
billing_country: z.string().max(2).default('US')
shipping_country: z.string().max(2).default('US')
shipping_street: z.string().max(255).nullable().optional()
shipping_city: z.string().max(100).nullable().optional()
shipping_state: z.string().max(2).nullable().optional()
shipping_postal_code: z.string().max(20).nullable().optional()
```

### Validation Rules Applied
1. **Coercion:** All numeric/boolean fields use `z.coerce` (sales_id, parent_organization_id, is_operating_entity)
2. **Length Limits:** All string fields have `.max()` constraints (DoS prevention)
3. **Strict Object:** Schema uses `z.strictObject()` for mass assignment prevention (line 68)
4. **Enums:** Constrained values use `z.enum()` allowlist pattern
5. **Sanitization:** Description field uses `sanitizeHtml()` transform

---

## Component Tree

```
OrganizationCreate (src/atomic-crm/organizations/OrganizationCreate.tsx)
├── CreateBase (react-admin, line 215)
│   └── Form (react-admin, line 218)
│       └── Card (shadcn/ui, line 219)
│           └── CardContent (shadcn/ui, line 220)
│               └── OrganizationFormContent (lines 245-269)
│                   ├── OrganizationInputs (line 256)
│                   │   ├── FormErrorSummary (OrganizationInputs.tsx:28-32)
│                   │   └── OrganizationCompactForm (OrganizationInputs.tsx:34)
│                   │       ├── CompactFormRow (lines 15-23)
│                   │       │   ├── TextInput [name]
│                   │       │   └── SelectInput [organization_type]
│                   │       ├── CompactFormRow (lines 35-52)
│                   │       │   ├── SelectInput [priority]
│                   │       │   ├── ReferenceInput → SelectInput [sales_id]
│                   │       │   └── SegmentComboboxInput [segment_id]
│                   │       ├── CompactFormRow (lines 54-57)
│                   │       │   ├── TextInput [address]
│                   │       │   └── TextInput [city]
│                   │       ├── CompactFormRow (lines 59-62)
│                   │       │   ├── StateComboboxInput [state]
│                   │       │   └── TextInput [postal_code]
│                   │       ├── CollapsibleSection "Additional Details" (lines 64-83)
│                   │       │   ├── TextInput [website]
│                   │       │   ├── TextInput [phone]
│                   │       │   ├── TextInput [linkedin_url]
│                   │       │   └── TextInput [description] (multiline)
│                   │       ├── OrganizationHierarchySection (line 85)
│                   │       │   └── CollapsibleSection "Organization Hierarchy"
│                   │       │       ├── ParentOrganizationInput [parent_organization_id]
│                   │       │       └── CompactFormRow
│                   │       │           ├── SelectInput [org_scope]
│                   │       │           └── BooleanInput [is_operating_entity]
│                   │       └── OrganizationAddressSection (line 86)
│                   │           └── CollapsibleSection "Address"
│                   │               ├── TextInput [shipping_street]
│                   │               ├── CompactFormRow
│                   │               │   ├── TextInput [shipping_city]
│                   │               │   └── StateComboboxInput [shipping_state]
│                   │               └── TextInput [shipping_postal_code]
│                   └── FormToolbar (line 257)
│                       ├── CancelButton (line 259)
│                       └── DuplicateCheckSaveButton (line 260-264)
│                           ├── hidden <button type="submit"> (line 87-93)
│                           └── SaveButton type="button" (line 95-102)
└── DuplicateOrgWarningDialog (lines 234-240, outside CreateBase)
```

---

## Shared Components Used

### From `@/components/admin/`
1. **TextInput** - Standard text input wrapper (11 uses)
2. **SelectInput** - Dropdown select input (3 uses)
3. **ReferenceInput** - React Admin reference lookup (2 uses)
4. **AutocompleteInput** - Searchable autocomplete (1 use: parent_organization_id)
5. **BooleanInput** - Checkbox input (1 use: is_operating_entity)
6. **CancelButton** - Form cancellation button
7. **SaveButton** - Form submission button
8. **FormLoadingSkeleton** - Loading state during identity fetch
9. **FormToolbar** - Bottom toolbar container
10. **CompactFormRow** - Responsive 2-column grid (4 uses)
11. **CollapsibleSection** - Expandable section container (3 uses)
12. **FormErrorSummary** - Validation error display

### Custom Components
1. **SegmentComboboxInput** - Custom segment selector with search
2. **StateComboboxInput** - US state selector with search
3. **ParentOrganizationInput** - Parent org autocomplete (wraps ReferenceInput + AutocompleteInput)
4. **OrganizationHierarchySection** - Hierarchy fields section
5. **OrganizationAddressSection** - Shipping address fields section
6. **DuplicateOrgWarningDialog** - Confirmation dialog for duplicate names

### From `@/components/ui/`
1. **Card** - Container card component
2. **CardContent** - Card content wrapper

### From React Admin
1. **CreateBase** - React Admin create form controller
2. **Form** - React Hook Form provider
3. **useGetList** - Fetch segments list
4. **useCreate** - Create mutation hook
5. **useRedirect** - Navigation helper
6. **useNotify** - Toast notification helper

---

## Special Features & Logic

### 1. Soft Duplicate Detection
**Source:** OrganizationCreate.tsx:25, 117-118
**Hook:** `useDuplicateOrgCheck()`
**Behavior:**
- Before save, checks for existing organization with same name (case-insensitive)
- If duplicate found, shows confirmation dialog instead of blocking
- User can confirm to proceed anyway or cancel to change name
- Uses hidden submit button pattern to defer actual submission

**Implementation:**
```typescript
// DuplicateCheckSaveButton (lines 47-105)
const handleClick = async (event) => {
  const duplicate = await checkForDuplicate(name);
  if (duplicate) {
    onDuplicateFound(duplicate.name, values); // Show dialog
    return;
  }
  hiddenSubmitRef.current?.click(); // Proceed with save
};
```

### 2. Smart Defaults (Identity-based)
**Source:** OrganizationCreate.tsx:114, 206
**Hook:** `useSmartDefaults()`
**Applied To:**
- `sales_id`: Pre-filled with current user's sales_id (if they have one)

**Loading State:** Shows FormLoadingSkeleton while fetching identity (lines 189-197)

### 3. Schema-Derived Defaults
**Source:** OrganizationCreate.tsx:199-210
**Pattern:** `organizationSchema.partial().parse({})`
**Extracted Defaults:**
- `organization_type`: `"prospect"`
- `priority`: `"C"`
- `is_operating_entity`: `true`
- `status`: `"active"` (hidden)
- `billing_country`: `"US"` (hidden)
- `shipping_country`: `"US"` (hidden)

### 4. Unknown Segment Auto-assignment
**Source:** OrganizationCreate.tsx:124-136, 208
**Behavior:**
- Fetches "Unknown" segment on mount
- Pre-fills `segment_id` with Unknown segment's UUID
- Falls back to `null` if not found

### 5. Parent Organization Pre-fill (Router State)
**Source:** OrganizationCreate.tsx:139, 209
**Trigger:** "Add Branch" button from organization list/detail
**Behavior:**
- Reads `parent_organization_id` from `location.state.record`
- Pre-fills parent field if present
- Enables "add branch location" workflow

### 6. Website URL Auto-prefixing
**Source:** OrganizationCreate.tsx:141-148, 215
**Transform Function:** `transformValues()`
**Behavior:**
- Before save, checks if website starts with "http"
- If not, prepends `"https://"` to the value
- Applied via `<CreateBase transform={transformValues}>`

### 7. Form Key Reset
**Source:** OrganizationCreate.tsx:211
**Pattern:** `key={formKey}`
**Purpose:** Forces form remount when unknownSegmentId changes, ensuring defaults apply correctly

---

## Data Tutorial Attributes

**Purpose:** Frontend testing/tutorial hooks

| Attribute | Element | Source Line |
|-----------|---------|-------------|
| `data-tutorial="org-name"` | name field container | OrganizationCompactForm.tsx:16 |
| `data-tutorial="org-type"` | organization_type field container | OrganizationCompactForm.tsx:24 |
| `data-tutorial="org-website"` | website field container | OrganizationCompactForm.tsx:66 |
| `data-tutorial="org-save-btn"` | DuplicateCheckSaveButton | OrganizationCreate.tsx:101 |

---

## Inconsistencies & Notes

### Inconsistencies

1. **Duplicate Address Fields:**
   - Form has BOTH primary address fields (address, city, state, postal_code) AND shipping address fields (shipping_street, shipping_city, shipping_state, shipping_postal_code)
   - Primary address in main section (always visible)
   - Shipping address in collapsible "Address" section
   - This could confuse users - unclear which address is which
   - **Recommendation:** Add clarifying labels or merge into single address with type selector

2. **Section Title Ambiguity:**
   - OrganizationAddressSection title is just "Address"
   - But it contains SHIPPING address fields
   - Could be mistaken for primary address
   - **Recommendation:** Change title to "Shipping Address" for clarity

3. **Helper Text Inconsistency:**
   - Some fields have helpful format examples (website, phone, linkedin_url)
   - Most fields explicitly disable helper text with `helperText={false}`
   - No helper text on address fields, which might benefit from format guidance
   - **Pattern:** Inconsistent application of helper text

4. **State Field Type Mismatch:**
   - Primary `state` field: StateComboboxInput (max 100 chars in schema)
   - Shipping `shipping_state` field: StateComboboxInput (max 2 chars in schema)
   - Schema expects 2-char postal codes for shipping_state but allows 100 chars for state
   - **Recommendation:** Align schema to use max(2) for both state fields

5. **Priority Row Column Count:**
   - Priority row has 3 fields (priority, sales_id, segment_id)
   - CompactFormRow defaults to `md:grid-cols-2`, but 3 fields will wrap awkwardly
   - **Recommendation:** Add `columns="md:grid-cols-3"` prop to that CompactFormRow

### Notes

1. **Status & Payment Fields Hidden:**
   - Comment on line 87: "Status & Payment fields hidden per user feedback - defaults: status='active'"
   - Fields exist in schema but not exposed in form
   - Defaults applied: status='active', billing_country='US', shipping_country='US'

2. **Deprecated Company Relationship:**
   - Schema does NOT include `company_id` field
   - Per CLAUDE.md: Use `contact_organizations` junction table instead
   - Form correctly avoids deprecated pattern

3. **Segment Default Logic:**
   - Fetches "Unknown" segment by name
   - This assumes an "Unknown" segment exists in the database
   - If not found, defaults to `null` (safe fallback)
   - **Potential Issue:** If Unknown segment deleted, all new orgs created with null segment

4. **Form Performance:**
   - Uses `onSubmit` mode (default) - good for performance
   - No `onChange` validation that would cause re-render storms
   - Custom duplicate check only runs on button click, not on every keystroke

5. **Accessibility Strengths:**
   - All fields have explicit labels
   - Collapsible sections are keyboard accessible
   - Error summary at top for screen readers
   - Touch targets meet WCAG AA (44px minimum)

6. **Organization Type Operator:**
   - Schema supports "operator" type (not in CLAUDE.md domain model)
   - CLAUDE.md mentions operators as "Restaurant/foodservice (end customer)"
   - But Operator is exposed as creatable organization type
   - May indicate domain model evolution

7. **Create vs Edit Schema:**
   - `createOrganizationSchema` omits system fields (id, created_at, updated_at, etc.)
   - Form uses full `organizationSchema` for defaults, then validation happens at API boundary
   - Correct pattern per Engineering Constitution

8. **Redirect Behavior:**
   - Form redirects to "show" view after creation (line 215, 170)
   - Standard pattern for create forms

---

## File References

**Primary Files:**
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationCreate.tsx` (main form)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationCompactForm.tsx` (field layout)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationInputs.tsx` (wrapper with error summary)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationHierarchySection.tsx` (hierarchy fields)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationAddressSection.tsx` (shipping address)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/ParentOrganizationInput.tsx` (parent org autocomplete)

**Validation & Constants:**
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/organizations.ts` (Zod schema)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/constants.ts` (dropdown choices)

**Shared Components:**
- `/home/krwhynot/projects/crispy-crm/src/components/admin/form/CompactFormRow.tsx`
- `/home/krwhynot/projects/crispy-crm/src/components/admin/form/CollapsibleSection.tsx`

**Types:**
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/types.ts`

---

## Summary

The OrganizationCreate form is a well-structured, comprehensive create form with 23 total fields organized into 4 sections (main + 3 collapsible). It demonstrates advanced patterns including soft duplicate detection, smart defaults from identity management, and URL auto-prefixing. The form correctly follows Engineering Constitution principles: schema-derived defaults, Zod validation at API boundary, and fail-fast error handling.

**Strengths:**
- Comprehensive field coverage with logical grouping
- Excellent accessibility (WCAG AA compliant)
- Smart defaults reduce user input burden
- Soft duplicate warning (confirmation, not blocking)
- Clean separation of concerns (OrganizationCompactForm handles layout)

**Areas for Improvement:**
- Clarify duplicate address fields (primary vs shipping)
- Fix state field schema mismatch (max length)
- Add explicit column count for 3-field priority row
- Consider renaming "Address" section to "Shipping Address"

**Code Quality:** High - follows project conventions, proper TypeScript typing, no deprecated patterns.
