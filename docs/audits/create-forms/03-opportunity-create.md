# Opportunity Create Form Audit

**Audit Date:** 2025-12-15
**Git Branch:** `feature/distributor-organization-modeling`
**Git Commit:** `1cd3fbd3`
**File Path:** `src/atomic-crm/opportunities/OpportunityCreate.tsx`
**Zod Schema:** `src/atomic-crm/validation/opportunities.ts`

**Form:** `OpportunityCreate`
**Files Analyzed:**
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx`
- `/src/atomic-crm/opportunities/forms/OpportunityInputs.tsx`
- `/src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx`
- `/src/atomic-crm/validation/opportunities.ts`

---

## Form Structure Overview

**Type:** Full-page create form with collapsible sections
**Layout:** Single-column card (max-w-4xl, centered)
**Background:** bg-muted with padding
**Sections:**
1. Main Section (always visible) - 8 fields
2. Contacts & Products (collapsible, default open) - 2 complex inputs
3. Classification (collapsible) - 3 fields
4. Additional Details (collapsible) - 6 fields

**Total Field Count:** 19 fields + 2 dynamic arrays (products, tags)
**Required Fields:** 7 (name, customer, principal, stage, priority, close date, contacts, products)

**Features:**
- Similar opportunity detection (Levenshtein threshold: 3)
- Inline create dialogs for organizations and contacts
- Auto-name generation from customer + principal
- Contact-organization mismatch warnings
- Distributor authorization warnings
- Naming convention help (collapsible)
- Standalone tutorial system

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ OpportunityCreate (Full Page)                                   │
│ bg-muted, px-6 py-6, max-w-4xl centered                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Card (CardContent) ───────────────────────────────────────┐│
│  │                                                             ││
│  │  [FormErrorSummary] (if errors)                            ││
│  │                                                             ││
│  │  ┌─ Row 1: Name (full width) ──────────────────────────┐  ││
│  │  │  [Opportunity Name *]                    data-tutorial││
│  │  │  [💡 Show naming tips] (collapsible)                 │  ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  │                                                             ││
│  │  ┌─ Row 2: Customer | Principal (2-col) ──────────────┐   ││
│  │  │  [Customer Organization *]  [+ New Customer]   dt   │   ││
│  │  │  [Principal Organization *] [+ New Principal]  dt   │   ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  │                                                             ││
│  │  ┌─ Row 3: Stage | Priority | Close Date (3-col) ────┐   ││
│  │  │  [Stage *]  [Priority *]  [Est. Close Date *]  dt  │   ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  │                                                             ││
│  │  ┌─ Row 4: Account Mgr | Distributor (2-col) ────────┐   ││
│  │  │  [Account Manager]                           dt    │   ││
│  │  │  [Distributor Organization] [+ New Distributor] dt │   ││
│  │  │  [⚠ DistributorAuthorizationWarning] (if no auth) │   ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  │                                                             ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │ 📂 Contacts & Products (CollapsibleSection, open)   │ ││
│  │  ├──────────────────────────────────────────────────────┤ ││
│  │  │  Contacts *                      [+ New Contact]    │ ││
│  │  │  [Autocomplete Multi-Select]            data-tutorial│ ││
│  │  │  [⚠ ContactOrgMismatchWarning] (if mismatch)       │ ││
│  │  │                                                      │ ││
│  │  │  Products *                                         │ ││
│  │  │  [Product 1] [Notes] [Remove]           data-tutorial│ ││
│  │  │  [+ Add Product]                                    │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │ 📂 Classification (CollapsibleSection)              │ ││
│  │  ├──────────────────────────────────────────────────────┤ ││
│  │  │  [Lead Source] [Campaign]                        dt │ ││
│  │  │  Tags: [tag1] [tag2] [+ Add]                       │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │ 📂 Additional Details (CollapsibleSection)          │ ││
│  │  ├──────────────────────────────────────────────────────┤ ││
│  │  │  [Description] (multiline)                      dt  │ ││
│  │  │  [Next Action] [Next Action Date]               dt  │ ││
│  │  │  [Decision Criteria] (multiline)                    │ ││
│  │  │  [Notes] (multiline)                                │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │  ┌─ FormToolbar ───────────────────────────────────────┐  ││
│  │  │                              [Cancel] [Save]   dt   │  ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [💬 SimilarOpportunitiesDialog] (modal, shown on name match)  │
│  [📚 OpportunityCreateFormTutorial] (floating bottom-left)     │
└─────────────────────────────────────────────────────────────────┘

Legend:
  dt = data-tutorial attribute for onboarding
  * = Required field
  [⚠ ...] = Warning component
  📂 = Collapsible section
  [+ ...] = CreateInDialogButton
```

---

## Complete Field Inventory

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|---|---|---|---|---|---|---|
| 1 | `name` | Opportunity Name | TextInput | ✅ | - | min(1), max(255) | CompactForm:70-100 |
| 2 | `customer_organization_id` | Customer Organization | ReferenceInput → AutocompleteOrganizationInput | ✅ | - | z.union([string, number]) | CompactForm:137-146 |
| 3 | `principal_organization_id` | Principal Organization | ReferenceInput → AutocompleteOrganizationInput | ✅ | - | z.union([string, number]) | CompactForm:177-186 |
| 4 | `stage` | Stage | SelectInput | ✅ | "new_lead" | opportunityStageSchema enum | CompactForm:194-199 |
| 5 | `priority` | Priority | SelectInput | ✅ | "medium" | opportunityPrioritySchema enum | CompactForm:201-207 |
| 6 | `estimated_close_date` | Est. Close Date | TextInput (type="date") | ✅ | +30 days | z.coerce.date() | CompactForm:209-216 |
| 7 | `account_manager_id` | Account Manager | ReferenceInput → SelectInput | ❌ | identity?.id | z.union([string, number]).optional() | CompactForm:224-235 |
| 8 | `distributor_organization_id` | Distributor Organization | ReferenceInput → AutocompleteOrganizationInput | ❌ | - | z.union([string, number]).optional() | CompactForm:267-276 |
| 9 | `contact_ids` | Contacts | ReferenceArrayInput → AutocompleteArrayInput | ✅* | [] | z.array(z.union([string, number])).default([]) | CompactForm:318-340 |
| 10 | `products_to_sync` | Products | ArrayInput → SimpleFormIterator | ✅* | [] | z.array(z.strictObject({...})).optional() | CompactForm:356-379 |
| 10a | `products_to_sync[].product_id_reference` | Product | ReferenceInput → SelectInput | ✅ | - | z.union([string, number]).optional() | CompactForm:358-369 |
| 10b | `products_to_sync[].notes` | Notes | TextInput | ❌ | - | z.string().optional() | CompactForm:370-376 |
| 11 | `lead_source` | Lead Source | TextInput | ❌ | - | leadSourceSchema.optional() | CompactForm:388-389 |
| 12 | `campaign` | Campaign | TextInput | ❌ | - | max(100) | CompactForm:391-397 |
| 13 | `tags` | Tags | ArrayInput → SimpleFormIterator | ❌ | [] | z.array(z.string().max(50)).max(20) | CompactForm:400-404 |
| 14 | `description` | Description | TextInput (multiline, rows=2) | ❌ | - | max(2000), sanitized | CompactForm:411-418 |
| 15 | `next_action` | Next Action | TextInput | ❌ | - | max(500) | CompactForm:421-427 |
| 16 | `next_action_date` | Next Action Date | TextInput (type="date") | ❌ | - | z.coerce.date().optional() | CompactForm:429-435 |
| 17 | `decision_criteria` | Decision Criteria | TextInput (multiline, rows=2) | ❌ | - | max(2000), sanitized | CompactForm:438-445 |
| 18 | `notes` | Notes | TextInput (multiline, rows=2) | ❌ | - | max(5000), sanitized | CompactForm:451-458 |
| 19 | `opportunity_owner_id` | - | Hidden | ❌ | identity?.id | z.union([string, number]).optional() | OpportunityCreate:36 |

**Notes:**
- ✅* = Required via business logic (Contacts & Products sections)
- `products_to_sync` is a virtual field transformed by data provider before DB save
- `contact_ids` conditionally disabled until `customer_organization_id` is selected
- `lead_source` renders as TextInput in this form but has enum validation

---

## Input Types Used

| Input Component | Count | Fields |
|---|---|---|
| TextInput | 10 | name, lead_source, campaign, description, next_action, next_action_date, decision_criteria, notes, products[].notes, tags[] |
| SelectInput | 3 | stage, priority, account_manager_id |
| ReferenceInput → AutocompleteOrganizationInput | 3 | customer_organization_id, principal_organization_id, distributor_organization_id |
| ReferenceArrayInput → AutocompleteArrayInput | 1 | contact_ids |
| ArrayInput → SimpleFormIterator | 2 | products_to_sync, tags |
| Hidden/Computed | 1 | opportunity_owner_id |

---

## Dropdowns Detail

### Stage (7 values, from stageConstants.ts:35-134)
```typescript
OPPORTUNITY_STAGE_CHOICES = [
  { id: "new_lead", name: "New Lead" },
  { id: "initial_outreach", name: "Initial Outreach" },
  { id: "sample_visit_offered", name: "Sample/Visit Offered" },
  { id: "feedback_logged", name: "Feedback Logged" },
  { id: "demo_scheduled", name: "Demo Scheduled" },
  { id: "closed_won", name: "Closed - Won" },
  { id: "closed_lost", name: "Closed - Lost" },
]
```

**Details:**
- Each stage has: value, label, color (CSS var), description, elevation (1-3), mfbPhase
- Includes MFB 7-phase process mapping (PRD Section 7.4)
- Color tokens use semantic CSS variables (--info-subtle, --tag-teal-bg, --warning-subtle, etc.)

### Priority (4 values, from priorityChoices.ts:6-11)
```typescript
priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
]
```

### Lead Source (8 values, from LeadSourceInput.constants.ts:6-15)
```typescript
LEAD_SOURCE_CHOICES = [
  { id: "referral", name: "Referral" },
  { id: "trade_show", name: "Trade Show" },
  { id: "website", name: "Website" },
  { id: "cold_call", name: "Cold Call" },
  { id: "email_campaign", name: "Email Campaign" },
  { id: "social_media", name: "Social Media" },
  { id: "partner", name: "Partner" },
  { id: "existing_customer", name: "Existing Customer" },
]
```
**Note:** Rendered as TextInput in this form, not SelectInput

### Account Manager (dynamic from `sales` resource)
- ReferenceInput with filter: `{ "disabled@neq": true }`
- Sort: `{ field: "last_name", order: "ASC" }`
- Uses `saleOptionRenderer` for display

### Organizations (dynamic from `organizations` resource)
- **Customer:** Filter by `organization_type@in: "(prospect,customer)"`
- **Principal:** Filter by `organization_type: "principal"`
- **Distributor:** Filter by `organization_type: "distributor"`
- Uses custom `AutocompleteOrganizationInput` component

### Contacts (dynamic from `contacts_summary` resource)
- Filtered by selected `customer_organization_id` (if present)
- Uses `contactOptionText` for display
- Disabled until customer organization is selected

### Products (dynamic from `products` resource)
- Filtered by selected `principal_organization_id` (if present)
- Displayed as name via `optionText="name"`

---

## Sections & Layout Breakdown

### Main Section (always visible)
**Lines:** CompactForm:66-279
**Fields:** 8
**Layout:**
- Row 1: Full width (name + naming tips)
- Row 2: 2-column grid (customer | principal) with inline create buttons
- Row 3: 3-column grid (stage | priority | close date)
- Row 4: 2-column grid (account manager | distributor) with inline create button

**Inline Create Buttons:**
- `CreateInDialogButton` for organizations (customer, principal, distributor)
- Auto-populates organization defaults (segment_id, sales_id, organization_type)
- Transform function ensures website URLs have https://

### Collapsible: Contacts & Products (defaultOpen=true)
**Lines:** CompactForm:282-382
**Title:** "Contacts & Products"
**Fields:** 2 complex inputs
**Layout:**
- Contacts section with conditional enable/disable
- Products array with inline notes
- Both have "New" buttons that open dialog forms

**Conditional Logic:**
- Contacts disabled until `customer_organization_id` selected
- Products filtered by `principal_organization_id` (optional filter)

**Warnings:**
- `ContactOrgMismatchWarning` - fires when contact organization ≠ customer organization
- Shows after contacts input

### Collapsible: Classification (default closed)
**Lines:** CompactForm:385-406
**Title:** "Classification"
**Fields:** 3
**Layout:**
- Row 1: 2-column grid (lead_source | campaign)
- Row 2: Tags array (inline SimpleFormIterator)

### Collapsible: Additional Details (default closed)
**Lines:** CompactForm:409-460
**Title:** "Additional Details"
**Fields:** 6
**Layout:**
- Description (multiline)
- Row: 2-column grid (next_action | next_action_date)
- Decision Criteria (multiline)
- Related Opportunity (only in edit mode, hidden in create)
- Notes (multiline)

---

## Styling & Design Tokens

### Color Tokens (Tailwind v4 Semantic)
✅ **Correct usage throughout:**
- `text-muted-foreground` - helper text, secondary labels
- `bg-muted` - form background
- `border-border` - CollapsibleSection borders
- `text-warning`, `bg-warning-subtle`, `border-warning` - DistributorAuthorizationWarning
- `text-foreground` - primary text

### Spacing
- Form wrapper: `px-6 py-6`
- Card max-width: `max-w-4xl mx-auto`
- Section spacing: `space-y-4` (consistent 1rem vertical)
- Row gap: `gap-3` (0.75rem)
- CollapsibleSection padding: `px-3 pb-3`

### Touch Targets
✅ **WCAG AA compliant:**
- CollapsibleSection trigger: `h-11` (44px) - form/CollapsibleSection.tsx:34
- Buttons: Standard Button component (44x44px minimum)

### Typography
- Section titles: `text-sm font-medium text-muted-foreground`
- Field labels: Via React Admin Input components
- Helper text: `text-xs text-muted-foreground`
- Placeholder text: `placeholder="..."` attributes

### Layout Grid
- 2-column: `md:grid-cols-2` (default for CompactFormRow)
- 3-column: `md:grid-cols-3` (stage/priority/close date row)
- Mobile: `grid-cols-1` (all rows stack)

---

## Accessibility Audit

### Labels ✅
- All inputs have explicit `label` prop
- `label={false}` used intentionally for repeated/nested inputs (products array items)
- Section headers use semantic hierarchy (h4 for subsection titles)

### Helper Text ✅
- Most fields have `helperText={false}` (form-level error summary used instead)
- Descriptive helper text provided where needed:
  - Contacts: "At least one contact is required" / "Please select a Customer Organization first"
  - Products: "At least one product is required (filtered by selected Principal)"
  - Campaign placeholder: "e.g., Q4 2025 Trade Show"

### ARIA Attributes ✅
- CollapsibleSection uses `aria-controls` (form/CollapsibleSection.tsx:29)
- Alert components use appropriate roles (AlertTriangle icon in warnings)
- Dialog components use AlertDialog primitives with ARIA support

### Error Handling ✅
- `FormErrorSummary` at top of form (OpportunityInputs:34-39)
- Field labels mapped in OPPORTUNITY_FIELD_LABELS (OpportunityInputs:5-22)
- Auto-expands if ≤3 errors (OpportunityInputs:38)

### Focus Management ✅
- CollapsibleSection: `focus-visible:outline-none focus-visible:ring-2` (form/CollapsibleSection.tsx:35)
- CreateInDialogButton opens modal with focus trap
- Dialog close returns focus to trigger

### Keyboard Navigation ✅
- All interactive elements use semantic buttons
- CollapsibleTrigger is keyboard accessible
- SimpleFormIterator provides keyboard-accessible add/remove

---

## Responsive Behavior

### Breakpoints
- Mobile (<768px): All rows stack to `grid-cols-1`
- Desktop (≥768px): 2-column and 3-column grids activate

### Form Width
- Max width: `max-w-4xl` (896px)
- Centered: `mx-auto`
- Horizontal padding: `px-6` (maintains breathing room on smaller screens)

### Input Adaptations
- AutocompleteOrganizationInput adapts to container width
- MultiSelect inputs (contacts, products) wrap chips on narrow screens
- Multiline TextInputs maintain 2 rows on all screen sizes

### Mobile Optimizations
- Touch targets meet 44px minimum
- Collapsible sections reduce cognitive load
- Inline create buttons available on mobile (no hover required)

---

## Zod Schema Reference

**File:** `/src/atomic-crm/validation/opportunities.ts`

### Create Schema (lines 218-270)
```typescript
export const createOpportunitySchema = opportunityBaseSchema
  .omit({ id, created_at, updated_at, deleted_at })
  .extend({
    contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
    estimated_close_date: z.coerce.date().optional().default(() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }),
    products_to_sync: z.array(
      z.strictObject({
        product_id_reference: z.union([z.string(), z.number()]).optional(),
        notes: z.string().optional().nullable(),
      })
    ).optional(),
    customer_organization_id: z.union([z.string(), z.number()]),
    principal_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  })
  .required({
    name: true,
    customer_organization_id: true,
  });
```

### Base Schema Fields (lines 84-179)
- **System fields:** id, created_at, updated_at, deleted_at
- **Core fields:** name (min 1, max 255), description (max 2000, sanitized)
- **Dates:** estimated_close_date (coerced, default +30 days)
- **Classification:** stage (enum, default "new_lead"), priority (enum, default "medium"), lead_source (enum, optional)
- **Organizations:** customer_organization_id (required), principal_organization_id (required), distributor_organization_id (optional), account_manager_id (optional)
- **Relationships:** contact_ids (array, default [])
- **Campaign/Tracking:** campaign (max 100), related_opportunity_id, notes (max 5000, sanitized), tags (array of max 50 chars, max 20 tags)
- **Workflow:** next_action (max 500), next_action_date (coerced date), decision_criteria (max 2000, sanitized)
- **Win/Loss:** win_reason (enum, optional), loss_reason (enum, optional), close_reason_notes (max 500, sanitized)

### Validation Functions
- `validateCreateOpportunity(data)` - lines 447-464
- Throws React Admin compatible errors: `{ message, body: { errors: {...} } }`

### Coercion Rules
- All dates use `z.coerce.date()` - handles string → Date conversion
- All numeric IDs accept `z.union([z.string(), z.number()])` - handles various ID formats

### Sanitization
- `description`, `notes`, `decision_criteria`, `close_reason_notes` use `sanitizeHtml()` transform
- Prevents XSS attacks on user-generated content

---

## Component Tree

```
OpportunityCreate
├── CreateBase (redirect="show")
│   ├── div.bg-muted.px-6.py-6
│   │   ├── div.max-w-4xl.mx-auto.create-form-card
│   │   │   └── Form (defaultValues=formDefaults)
│   │   │       └── Card
│   │   │           └── CardContent
│   │   │               └── OpportunityFormContent
│   │   │                   ├── FormErrorSummary
│   │   │                   ├── OpportunityInputs (mode="create")
│   │   │                   │   ├── FormErrorSummary (conditional)
│   │   │                   │   └── OpportunityCompactForm (mode="create")
│   │   │                   │       ├── div.relative [Row 1]
│   │   │                   │       │   ├── TextInput (name)
│   │   │                   │       │   └── NamingConventionHelp
│   │   │                   │       ├── CompactFormRow [Row 2]
│   │   │                   │       │   ├── CompactFormFieldWithButton
│   │   │                   │       │   │   ├── CreateInDialogButton (New Customer)
│   │   │                   │       │   │   │   └── OrganizationInputs
│   │   │                   │       │   │   └── ReferenceInput (customer_organization_id)
│   │   │                   │       │   │       └── AutocompleteOrganizationInput
│   │   │                   │       │   └── CompactFormFieldWithButton
│   │   │                   │       │       ├── CreateInDialogButton (New Principal)
│   │   │                   │       │       │   └── OrganizationInputs
│   │   │                   │       │       └── ReferenceInput (principal_organization_id)
│   │   │                   │       │           └── AutocompleteOrganizationInput
│   │   │                   │       ├── CompactFormRow [Row 3] (columns="md:grid-cols-3")
│   │   │                   │       │   ├── SelectInput (stage)
│   │   │                   │       │   ├── SelectInput (priority)
│   │   │                   │       │   └── TextInput (estimated_close_date, type="date")
│   │   │                   │       ├── CompactFormRow [Row 4]
│   │   │                   │       │   ├── CompactFormFieldWithButton
│   │   │                   │       │   │   └── ReferenceInput (account_manager_id)
│   │   │                   │       │   │       └── SelectInput
│   │   │                   │       │   └── CompactFormFieldWithButton
│   │   │                   │       │       ├── CreateInDialogButton (New Distributor)
│   │   │                   │       │       │   └── OrganizationInputs
│   │   │                   │       │       ├── ReferenceInput (distributor_organization_id)
│   │   │                   │       │       │   └── AutocompleteOrganizationInput
│   │   │                   │       │       └── DistributorAuthorizationWarning (footer)
│   │   │                   │       ├── CollapsibleSection (Contacts & Products, defaultOpen)
│   │   │                   │       │   ├── div (Contacts header + New Contact button)
│   │   │                   │       │   ├── ReferenceArrayInput (contact_ids)
│   │   │                   │       │   │   └── AutocompleteArrayInput
│   │   │                   │       │   ├── ContactOrgMismatchWarning
│   │   │                   │       │   ├── div (Products header)
│   │   │                   │       │   └── ArrayInput (products_to_sync)
│   │   │                   │       │       └── SimpleFormIterator
│   │   │                   │       │           ├── ReferenceInput (product_id_reference)
│   │   │                   │       │           │   └── SelectInput
│   │   │                   │       │           └── TextInput (notes)
│   │   │                   │       ├── CollapsibleSection (Classification)
│   │   │                   │       │   ├── CompactFormRow
│   │   │                   │       │   │   ├── TextInput (lead_source)
│   │   │                   │       │   │   └── TextInput (campaign)
│   │   │                   │       │   └── ArrayInput (tags)
│   │   │                   │       │       └── SimpleFormIterator
│   │   │                   │       │           └── TextInput
│   │   │                   │       └── CollapsibleSection (Additional Details)
│   │   │                   │           ├── TextInput (description, multiline)
│   │   │                   │           ├── CompactFormRow
│   │   │                   │           │   ├── TextInput (next_action)
│   │   │                   │           │   └── TextInput (next_action_date, type="date")
│   │   │                   │           ├── TextInput (decision_criteria, multiline)
│   │   │                   │           └── TextInput (notes, multiline)
│   │   │                   └── FormToolbar
│   │   │                       └── div.flex.flex-row.gap-2.justify-end
│   │   │                           ├── CancelButton
│   │   │                           └── OpportunityCreateSaveButton
│   │   ├── SimilarOpportunitiesDialog (modal)
│   │   └── OpportunityCreateFormTutorial (floating)
```

---

## Shared Components Used

### Layout Components
1. **CompactFormRow** (`/src/components/admin/form/CompactFormRow.tsx`)
   - Responsive grid wrapper (1-col mobile, 2/3-col desktop)
   - Props: columns (grid class), alignItems (start/center/end)

2. **CollapsibleSection** (`/src/components/admin/form/CollapsibleSection.tsx`)
   - Accordion-style section with chevron indicator
   - Props: title, defaultOpen, className
   - 44px touch target, focus-visible ring

3. **CompactFormFieldWithButton** (`/src/components/admin/form/CompactFormFieldWithButton.tsx`)
   - Grid layout: `[1fr_auto]` (field + button)
   - Auto-adds ButtonPlaceholder if no button prop
   - Props: footer (for warnings below field)

### React Admin Wrappers
1. **TextInput** (`/src/components/admin/text-input.tsx`)
2. **SelectInput** (`/src/components/admin/select-input.tsx`)
3. **ReferenceInput** (`/src/components/admin/reference-input.tsx`)
4. **ReferenceArrayInput** (`/src/components/admin/reference-array-input.tsx`)
5. **AutocompleteArrayInput** (`/src/components/admin/autocomplete-array-input.tsx`)
6. **ArrayInput** (`/src/components/admin/array-input.tsx`)
7. **SimpleFormIterator** (`/src/components/admin/simple-form-iterator.tsx`)

### Custom Domain Components
1. **AutocompleteOrganizationInput** (`/src/atomic-crm/organizations/AutocompleteOrganizationInput.tsx`)
   - Type-aware organization selector (customer/principal/distributor)

2. **CreateInDialogButton** (`/src/components/admin/create-in-dialog-button.tsx`)
   - Opens modal with form, auto-selects created record
   - Props: resource, label, title, description, defaultValues, onSave, transform

3. **ContactOrgMismatchWarning** (`/src/atomic-crm/opportunities/components/ContactOrgMismatchWarning.tsx`)
   - Validates contact organizations match customer organization
   - Provides "Keep Anyway" and "Remove Mismatched" actions

4. **DistributorAuthorizationWarning** (`/src/atomic-crm/opportunities/components/DistributorAuthorizationWarning.tsx`)
   - Checks if distributor is authorized for principal
   - Three states: no record, inactive, expired

5. **NamingConventionHelp** (`/src/atomic-crm/opportunities/forms/NamingConventionHelp.tsx`)
   - Collapsible tips with examples
   - Shows standard format and custom patterns

### Form Error Handling
1. **FormErrorSummary** (`/src/components/admin/FormErrorSummary.tsx`)
   - Used at both form root and OpportunityInputs level
   - Collapsible list of all validation errors
   - Auto-expands if ≤3 errors

### Toolbar Components
1. **FormToolbar** (`/src/atomic-crm/layout/FormToolbar.tsx`)
   - Consistent footer for Save/Cancel actions

2. **CancelButton** (`/src/components/admin/cancel-button.tsx`)
   - Navigates back with confirmation if dirty

3. **OpportunityCreateSaveButton** (`/src/atomic-crm/opportunities/components/OpportunityCreateSaveButton.tsx`)
   - Custom save button with similar opportunity check
   - Integrates with `useSimilarOpportunityCheck` hook

### Dialogs
1. **SimilarOpportunitiesDialog** (`/src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx`)
   - Warns if opportunity name is similar to existing (Levenshtein distance ≤3)
   - Shows list of matches with navigation links

2. **OpportunityCreateFormTutorial** (`/src/atomic-crm/tutorial/OpportunityCreateFormTutorial.tsx`)
   - Standalone tutorial system (bottom-left floating button)
   - data-tutorial attributes throughout form for step targeting

---

## Inconsistencies & Notes

### 1. Lead Source Field Type Mismatch
**Issue:** `lead_source` has enum validation in schema (opportunities.ts:23-32) but renders as TextInput (CompactForm:388-389)
**Expected:** SelectInput with LEAD_SOURCE_CHOICES
**Current:** Free-text input (allows invalid values)
**Impact:** User can enter arbitrary strings, bypassing enum validation

### 2. Related Opportunity Field Hidden in Create
**Location:** CompactForm:446-450
**Behavior:** `related_opportunity_id` only shown in edit mode
**Note:** Intentional design decision, but not documented why

### 3. Products Virtual Field Pattern
**Issue:** `products_to_sync` is a client-side virtual field transformed before DB save
**Location:** Schema line 253-260
**Note:** This pattern prevents direct use of `opportunity_products` junction table. Transformation logic must exist in data provider.

### 4. Duplicate FormErrorSummary
**Locations:**
- OpportunityCreate:88 (via OpportunityFormContent)
- OpportunityInputs:34-39

**Issue:** Two error summaries rendered (though OpportunityInputs conditionally hides if no errors)
**Impact:** Potential confusion with two identical error displays

### 5. Opportunity Owner vs Account Manager
**Fields:**
- `opportunity_owner_id` (hidden, auto-set to identity.id)
- `account_manager_id` (visible, user-selectable)

**Confusion:** Two separate ownership concepts without clear distinction in UI
**Location:** OpportunityCreate:36, CompactForm:224-235

### 6. Auto-Generated Name in Create Mode
**Issue:** Name field has no auto-generation in create mode (only edit mode shows refresh button)
**Location:** CompactForm:75-98
**Impact:** User must manually follow naming convention or wait until edit to use auto-generate

### 7. Tags Input Type
**Issue:** Uses SimpleFormIterator with text inputs instead of a proper tag picker
**Location:** CompactForm:400-404
**UX Impact:** No autocomplete, no existing tag suggestions, manual entry only

### 8. Contact/Product Required Validation
**Issue:** Schema marks these as optional with defaults, but UI describes them as required
**Locations:**
- CompactForm:288-291 (Contacts: "At least one contact is required")
- CompactForm:348-352 (Products: "At least one product is required")
- Schema line 122-125, 253-260 (both optional)

**Resolution:** Update schema has .refine() for contacts (line 333-347), but create schema does not enforce this

### 9. Naming Convention Help Always Collapsed
**Location:** NamingConventionHelp:14
**Issue:** `useState(false)` - help always starts collapsed
**UX Impact:** First-time users may not discover naming tips

### 10. Tutorial Attributes on Inner Elements
**Pattern:** `data-tutorial="opp-name"` on wrapper divs
**Locations:** CompactForm:69, 136, 176, 193, etc.
**Note:** Tutorial system targets these for onboarding steps. Ensure IDs remain stable.

---

## Recommendations

### High Priority
1. **Fix lead_source input type** - Change TextInput to SelectInput with LEAD_SOURCE_CHOICES
2. **Consolidate error summaries** - Remove duplicate or clarify roles
3. **Enforce contact/product requirements** - Add .refine() to createOpportunitySchema
4. **Add auto-name generation to create mode** - Remove edit-only restriction (users expect this during initial creation)

### Medium Priority
5. **Improve tags UX** - Replace SimpleFormIterator with proper tag picker (autocomplete, chips)
6. **Default naming help to open** - Change `useState(true)` for first-time user discoverability
7. **Document products_to_sync transform** - Add comment explaining virtual field pattern
8. **Clarify owner vs account manager** - Add helper text or consolidate fields

### Low Priority
9. **Add related_opportunity in create** - Or document why edit-only
10. **Tutorial attribute stability** - Document data-tutorial ID conventions in codebase

---

## Form Defaults (OpportunityCreate:34-40)

```typescript
const formDefaults = {
  ...opportunitySchema.partial().parse({}), // Extracts .default() values:
                                             // - stage: "new_lead"
                                             // - priority: "medium"
                                             // - estimated_close_date: +30 days
  opportunity_owner_id: identity?.id,
  account_manager_id: identity?.id,
  contact_ids: [],
  products_to_sync: [],
}
```

**Pattern:** "FORM STATE DERIVED FROM TRUTH" (Constitution #5)
**Behavior:** Uses Zod schema as single source of truth for defaults

---

## Special Features

### 1. Similar Opportunity Detection (OpportunityCreate:17-27)
- **Hook:** `useSimilarOpportunityCheck()`
- **Algorithm:** Levenshtein distance ≤3
- **Trigger:** On save, before submission
- **Dialog:** Shows list of similar opportunities with navigation
- **UX:** Prevents accidental duplicates while allowing confirmed creation

### 2. Inline Organization Creation
- **Components:** CreateInDialogButton for Customer, Principal, Distributor
- **Behavior:** Opens modal form, creates record, auto-selects in parent form
- **Transform:** Ensures website URLs have https:// prefix (CompactForm:126-129, 166-169, 255-258)

### 3. Inline Contact Creation
- **Location:** CompactForm:296-314
- **Conditional:** Only shown if customer_organization_id selected
- **Auto-association:** New contact pre-filled with customer org ID
- **Auto-selection:** New contact auto-added to contact_ids array

### 4. Product Filtering
- **Behavior:** Product dropdown filters by selected principal (if any)
- **UX:** Descriptive text changes based on principal selection
- **Code:** CompactForm:62-64 (productFilter useMemo)

### 5. Contact Filtering
- **Behavior:** Contact dropdown filters by selected customer
- **Disabled State:** Until customer selected
- **Code:** CompactForm:56-59 (contactFilter useMemo)

### 6. Warning Systems
- **ContactOrgMismatchWarning:** Detects contacts from wrong organization
- **DistributorAuthorizationWarning:** Validates distributor authorization status
- **Both:** Soft warnings (don't block, but require acknowledgment)

---

## End of Audit
