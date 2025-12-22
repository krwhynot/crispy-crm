# ProductCreate Form Audit

**Audit Date:** 2025-12-15
**Git Branch:** `feature/distributor-organization-modeling`
**Git Commit:** `1cd3fbd3`
**File Path:** `src/atomic-crm/products/ProductCreate.tsx`
**Zod Schema:** `src/atomic-crm/validation/products.ts`

---

## 1. Form Structure Overview

| Property | Value |
|----------|-------|
| Form Type | `CreateBase + Form` (React Admin core) |
| Layout Style | Full-page Card with right-side tutorial panel (`lg:mr-72`) |
| Number of Tabs | 2 |
| Tab Names | Product Details, Distribution |
| Collapsible Sections | YES - "Additional Settings" in Distribution tab |
| Total Fields | 7 (5 in Details tab, 2 in Distribution tab) |
| Required Fields | 4 (name, principal_id, category, status) |
| Optional Fields | 3 (description, distributor_ids, vendor_item_number per distributor) |
| Loading State | YES - handled by React Admin CreateBase |
| Error Summary | YES - FormErrorSummary component |
| Tutorial Integration | YES - ProductFormTutorial component (Driver.js) |
| Redirect After Save | `"show"` - redirects to product detail page |

---

## 2. Default Values Strategy

| Strategy | Implementation |
|----------|---------------|
| Schema-derived defaults | YES - `productSchema.partial().parse({})` |
| Identity injection | YES - `identity?.id` for `created_by` field |
| Smart defaults hook | NO |
| Router state pre-fill | NO |
| Async segment lookup | NO |

**Code Example:**
```typescript
// ProductCreate.tsx:26-29
const defaultValues = {
  ...productSchema.partial().parse({}),
  created_by: identity?.id,
};
```

**Constitution Compliance:** YES - Uses Constitution Rule #4: "Form state from schema" pattern

---

## 3. Special Features

| Feature | Present | Implementation |
|---------|---------|----------------|
| Field Labels for Errors | YES | `PRODUCT_FIELD_LABELS` object mapping field names to human-readable labels |
| Tutorial Integration | YES | ProductFormTutorial component with Driver.js, 11 steps, fixed help button (bottom-left) |
| Dirty State Check | NO | No cancel confirmation implemented |
| Tab Navigation | YES | TabbedFormInputs component with keyboard support |
| Duplicate Detection | NO | - |
| Transform on Save | NO | Data submitted as-is |
| Save & Add Another | NO | Only standard Save button |
| Hidden Fields | YES | `created_by` - set from identity, not visible |
| Custom Save Button | NO | Standard SaveButton from react-admin |
| Creatable Dropdown | YES | Category field supports custom value creation |
| Multi-Distributor Input | YES | Dynamic DOT# inputs per selected distributor |
| Collapsible Sections | YES | "Additional Settings" in Distribution tab (collapsed by default) |

---

## 4. ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ FormErrorSummary (conditional - shows when errors exist)    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────────────┬────────────────────┐                   │
│ │ Product Details  │ Distribution       │                   │
│ └──────────────────┴────────────────────┘                   │
│                                                               │
│ Tab Content Area:                                            │
│                                                               │
│ [Product Details Tab]                                        │
│   Product Name *        [_____________________________]      │
│   Principal/Supplier *  [▼ Autocomplete              ]      │
│   Category *            [▼ Autocomplete + Create     ]      │
│   Status *              [▼ Select Dropdown           ]      │
│   Description           [_____________________________]      │
│                         [_____________________________]      │
│                         [_____________________________]      │
│                                                               │
│ [Distribution Tab]                                           │
│   Distributors          [▼ Multi-Select Autocomplete ]      │
│                                                               │
│   Enter DOT numbers for each distributor:                   │
│   ├─ US Foods           [DOT# Input____________]            │
│   ├─ Sysco              [DOT# Input____________]            │
│   └─ GFS                [DOT# Input____________]            │
│                                                               │
│   ▼ Additional Settings (collapsed)                         │
│                                                               │
│                                    [Cancel] [Create Product] │
└─────────────────────────────────────────────────────────────┘
                                                        [? Help]
```

---

## 5. Field Inventory

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 1 | name | TextInput | YES | - | string, min(1), max(255) | Full width, helper text "Required field" |
| 2 | principal_id | ReferenceInput + AutocompleteInput | YES | - | number, int, positive | Filtered to organization_type="principal" |
| 3 | category | AutocompleteInput (creatable) | YES | "beverages" | string, min(1), max(100) | 16 predefined categories + custom |
| 4 | status | SelectInput | YES | "active" | enum: active, discontinued, coming_soon | 3 predefined statuses |
| 5 | description | TextInput (multiline) | NO | - | string, max(2000), optional | 3 rows, no helper text |
| 6 | distributor_ids | ReferenceArrayInput + AutocompleteArrayInput | NO | - | array of numbers | Multi-select, filtered to organization_type="distributor" |
| 7 | product_distributors.{id}.vendor_item_number | TextInput | NO | - | string, max(100) | Dynamic inputs per selected distributor |

**System Fields (Auto-managed):**
- `created_by`: number, int, nullish (set from identity.id at ProductCreate.tsx:28)
- `updated_by`: number, int, nullish (not used in create form)

**Schema Fields Not in Form:**
- `certifications`: z.array(z.string()).nullish() - Not exposed in create form
- `allergens`: z.array(z.string()).nullish() - Not exposed in create form
- `ingredients`: z.string().max(5000).nullish() - Not exposed in create form
- `nutritional_info`: z.record(z.any()).nullish() - Not exposed in create form
- `marketing_description`: z.string().max(2000).nullish() - Not exposed in create form

---

## 6. Form Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| `CreateBase` | `ra-core` | Provides mutation context and redirect handling |
| `Form` | `ra-core` | Form wrapper with React Hook Form integration |
| `Card`, `CardContent` | `@/components/ui/card` | Form container wrapper |
| `FormErrorSummary` | `@/components/admin/FormErrorSummary` | Collapsible error display at top of form |
| `TabbedFormInputs` | `@/components/admin/tabbed-form` | Tab navigation container |
| `TextInput` | `@/components/admin/text-input` | Single-line and multiline text inputs |
| `ReferenceInput` | `@/components/admin/reference-input` | Foreign key lookup wrapper |
| `ReferenceArrayInput` | `@/components/admin/reference-array-input` | Multi-select foreign key lookup wrapper |
| `AutocompleteInput` | `@/components/admin/autocomplete-input` | Searchable dropdown with create support |
| `AutocompleteArrayInput` | `@/components/admin/autocomplete-array-input` | Multi-select searchable dropdown |
| `SelectInput` | `@/components/admin/select-input` | Standard dropdown for enum values |
| `CollapsibleSection` | `@/components/admin/form/CollapsibleSection` | Expandable/collapsible content section |
| `FormToolbar` | `@/components/admin/simple-form` | Footer button container |
| `CancelButton` | `@/components/admin/cancel-button` | Navigation back to list |
| `SaveButton` | `@/components/admin/form` | Form submission button |
| `ProductFormTutorial` | `./ProductFormTutorial` | Driver.js interactive tutorial |
| `Button` | `@/components/ui/button` | Tutorial help button |
| `Tooltip` | `@/components/ui/tooltip` | Help button tooltip |
| `HelpCircle` | `lucide-react` | Tutorial icon |

---

## 7. Validation Schema Analysis

**Schema File:** `src/atomic-crm/validation/products.ts`

| Rule | Compliant | Notes |
|------|-----------|-------|
| Uses `z.strictObject()` | YES | Line 47: `export const productSchema = z.strictObject({` |
| All strings have `.max()` | YES | All string fields have max constraints (name: 255, category: 100, description: 2000, ingredients: 5000, marketing_description: 2000) |
| Uses `z.coerce` for non-strings | NO | No form inputs require coercion (numbers come from ReferenceInput which handles conversion) |
| Uses `z.enum()` for constrained values | YES | Line 41: `productStatusSchema = z.enum(["active", "discontinued", "coming_soon"])` |
| API boundary validation only | YES | No validate props on form inputs; validation via `validateProductForm` function at data provider boundary |

**Schema Defaults:**
- `category`: "beverages" (line 34)
- `status`: "active" (line 60)

**Validation Function:**
- Location: Lines 79-98
- Function: `validateProductForm`
- Format: React Admin format `{ message, body: { errors } }`
- Usage: Called by unifiedDataProvider at API boundary

---

## 8. Accessibility Audit

| Requirement | Compliant | Notes |
|-------------|-----------|-------|
| `aria-invalid` on error fields | YES | Handled by FormField component (React Admin) |
| `aria-describedby` linking | YES | Handled by FormError and InputHelperText components |
| `role="alert"` on errors | YES | FormErrorSummary uses proper alert roles |
| Touch targets 44x44px min | YES | Tutorial button: `h-11 w-11` (44x44px) |
| Keyboard navigation | YES | Tab navigation supported by TabbedFormInputs |
| Focus management | YES | React Hook Form handles focus |
| Required field indicators | YES | Asterisks (*) in labels for all required fields |

**Helper Text Coverage:**
- name: "Required field"
- principal_id: "Required - Select the manufacturing principal"
- category: "Select F&B category or type to create custom"
- status: No helper text
- description: No helper text
- distributor_ids: No helper text
- vendor_item_number: No helper text, but has placeholder "e.g., USF# 4587291"

**ARIA Labels:**
- Tutorial button: `aria-label="Start product form tutorial"` (ProductFormTutorial.tsx:156)

---

## 9. Design System Compliance

| Rule | Compliant | Issues |
|------|-----------|--------|
| Semantic colors only | YES | Uses text-muted-foreground, bg-muted, bg-primary, text-primary-foreground |
| No hardcoded hex/oklch | YES | No raw color values found |
| `bg-muted` page background | NO | Uses Card component without explicit page background |
| `create-form-card` class | NO | Uses generic Card component |
| Touch targets h-11 w-11 | YES | Tutorial button is h-11 w-11 (44x44px) |

**Color Tokens Used:**
- `text-sm` - Text sizing for helper text
- `text-muted-foreground` - Helper text, section descriptions
- `bg-muted` - Tab list background (TabbedFormInputs)
- `bg-primary` - Help button background
- `text-primary-foreground` - Help button text
- `border-muted` - Distribution DOT# section left border

**Spacing:**
- Form container: `mt-2 flex lg:mr-72` (top margin + right margin for tutorial)
- Tab content: `space-y-2` (8px vertical spacing - Details tab)
- Distribution tab: `space-y-4` (16px vertical spacing)
- DOT# section: `space-y-3 pl-4 border-l-2` (12px spacing, 16px left padding)
- Toolbar buttons: `gap-2` (8px gap between Cancel and Save)

**Sizing:**
- Tutorial button: `h-11 w-11` (44x44px - compliant)
- Tutorial positioning: `bottom-4 left-4` (fixed position)
- Form width: `flex-1` (full width with tutorial margin)
- Tutorial panel margin: `lg:mr-72` (288px right margin on large screens)

---

## 10. Identified Issues / Recommendations

### Critical Issues
- [ ] **Schema-Form Mismatch:** Schema includes 5 fields not in create form (certifications, allergens, ingredients, nutritional_info, marketing_description). Document if these are edit-only or deprecated.
- [ ] **Missing Validation for DOT# Fields:** `product_distributors.{id}.vendor_item_number` has no explicit validation schema. Consider adding to productSchema or creating separate junction schema.

### High Priority
- [ ] **Inconsistent Helper Text:** Some required fields lack helper text (status). Standardize helper text approach across all tabs.
- [ ] **No Dirty State Warning:** Cancel button doesn't warn user about unsaved changes. Consider adding dirty state check.
- [ ] **Tutorial Coverage Incomplete:** description field lacks tutorial highlighting; distributor selection and DOT# inputs not covered in tutorial steps.

### Medium Priority
- [ ] **Mobile Layout Testing:** Tutorial button positioned at `bottom-4 left-4` may overlap content on mobile. Consider responsive positioning.
- [ ] **Collapsible Section Empty:** "Additional Settings" section shows placeholder text. Either populate with content or remove.
- [ ] **Status Field Default Confusion:** Status has asterisk (*) but defaults to "active", making it technically optional for user input. Consider removing asterisk or adding helper text explaining default.

### Low Priority
- [ ] **DOT# Input Validation:** Consider adding format validation or examples for distributor-specific codes (e.g., "USF#" prefix pattern).
- [ ] **Category Dropdown Order:** PRODUCT_CATEGORIES array uses underscored values ("fresh_produce") but displays Title Case. Consider storing display values separately for clarity.

### Notes for Standardization
- **Pattern: Schema-Driven Defaults** - Uses `schema.partial().parse({})` consistently (Constitution compliant)
- **Pattern: Field Label Mapping** - PRODUCT_FIELD_LABELS object provides human-readable error messages
- **Pattern: Tutorial Integration** - Fixed help button with Driver.js provides consistent onboarding experience
- **Pattern: Auto-Expand Errors** - FormErrorSummary auto-expands when ≤3 errors for better UX
- **Pattern: Creatable Dropdown** - AutocompleteInput with onCreate handler allows custom categories
- **Pattern: Dynamic Form Inputs** - ProductDistributorInput demonstrates dynamic field generation based on array selection

---

## 11. Cross-References

- **Edit Form:** `src/atomic-crm/products/ProductEdit.tsx`
- **SlideOver:** `src/atomic-crm/products/ProductSlideOver.tsx`
- **Inputs Component:** `src/atomic-crm/products/ProductInputs.tsx`
- **Details Tab:** `src/atomic-crm/products/ProductDetailsInputTab.tsx`
- **Distribution Tab:** `src/atomic-crm/products/ProductDistributionTab.tsx`
- **Distributor Input:** `src/atomic-crm/products/ProductDistributorInput.tsx`
- **Tutorial Component:** `src/atomic-crm/products/ProductFormTutorial.tsx`
- **Validation Schema:** `src/atomic-crm/validation/products.ts`
- **Related Tests:** `src/atomic-crm/products/__tests__/` (if exists)

---

## Appendix: Detailed Tab Breakdown

### Tab 1: Product Details (default tab)
**Key:** `details`
**Fields:** name, principal_id, category, status, description
**Layout:** Vertical stack (`space-y-2`)
**Data Tutorial:** `product-tab-details`
**Source:** ProductDetailsInputTab.tsx

**Field Details:**
1. **Product Name** (required)
   - Input: TextInput
   - Width: Full (`w-full`)
   - Helper: "Required field"
   - Placeholder: "Product name"
   - Data tutorial: `product-name`

2. **Principal/Supplier** (required)
   - Input: ReferenceInput + AutocompleteInput
   - Reference: `organizations` resource
   - Filter: `{ organization_type: "principal" }`
   - Helper: "Required - Select the manufacturing principal"
   - Data tutorial: `product-principal`

3. **Category** (required)
   - Input: AutocompleteInput (creatable)
   - Choices: 16 predefined F&B categories
   - onCreate: `handleCreateCategory` - returns `{ id: categoryName, name: categoryName }`
   - Helper: "Select F&B category or type to create custom"
   - Create label: "Add custom category: %{item}"
   - Data tutorial: `product-category`

4. **Status** (required, has default)
   - Input: SelectInput
   - Choices: active, discontinued, coming_soon
   - Default: "active"
   - Helper: None
   - Data tutorial: `product-status`

5. **Description** (optional)
   - Input: TextInput (multiline)
   - Rows: 3
   - Width: Full (`w-full`)
   - Placeholder: "Product description..."
   - Helper: None
   - Data tutorial: None

**Categories (PRODUCT_CATEGORIES):**
```javascript
[
  "beverages",         // → "Beverages"
  "dairy",             // → "Dairy"
  "frozen",            // → "Frozen"
  "fresh_produce",     // → "Fresh Produce"
  "meat_poultry",      // → "Meat Poultry"
  "seafood",           // → "Seafood"
  "dry_goods",         // → "Dry Goods"
  "snacks",            // → "Snacks"
  "condiments",        // → "Condiments"
  "baking_supplies",   // → "Baking Supplies"
  "spices_seasonings", // → "Spices Seasonings"
  "canned_goods",      // → "Canned Goods"
  "pasta_grains",      // → "Pasta Grains"
  "oils_vinegars",     // → "Oils Vinegars"
  "sweeteners",        // → "Sweeteners"
  "other"              // → "Other"
]
```

**Statuses (PRODUCT_STATUSES):**
```javascript
[
  "active",         // → "Active"
  "discontinued",   // → "Discontinued"
  "coming_soon"     // → "Coming Soon"
]
```

---

### Tab 2: Distribution
**Key:** `distribution`
**Fields:** distributor_ids, product_distributors.{id}.vendor_item_number
**Layout:** Vertical stack (`space-y-6`)
**Data Tutorial:** `product-tab-distribution`
**Source:** ProductDistributionTab.tsx

**Components:**
1. **ProductDistributorInput** - Multi-distributor selection with dynamic DOT# inputs
   - Input: ReferenceArrayInput + AutocompleteArrayInput
   - Reference: `organizations` resource
   - Filter: `{ organization_type: "distributor" }`
   - Placeholder: "Select distributors..."
   - Search filter: `{ "name@ilike": "%{query}%" }`

2. **Dynamic DOT# Inputs** (conditional on distributor selection)
   - Shows only when `distributor_ids.length > 0`
   - Layout: Left-bordered section (`pl-4 border-l-2 border-muted`)
   - Spacing: `space-y-3`
   - Label text: "Enter DOT numbers for each distributor:"
   - Per-distributor row: `flex items-center gap-4`
     - Distributor name: `text-sm font-medium min-w-[150px] truncate`
     - DOT# input: TextInput with `source="product_distributors.{distributor.id}.vendor_item_number"`
     - Placeholder: "e.g., USF# 4587291"
     - Helper text: Disabled (`helperText={false}`)

3. **CollapsibleSection** - "Additional Settings"
   - Default: Collapsed (`defaultOpen={false}`)
   - Content: Placeholder text "Additional distribution settings will appear here."
   - Purpose: Future expansion

---

## Appendix: Component Tree

```
ProductCreate (ProductCreate.tsx)
├── CreateBase (ra-core) [redirect="show"]
│   ├── Form (ra-core) [defaultValues from schema + identity]
│   │   └── Card > CardContent
│   │       └── ProductFormContent
│   │           ├── FormErrorSummary [fieldLabels, auto-expand ≤3 errors]
│   │           ├── ProductInputs
│   │           │   └── TabbedFormInputs [2 tabs, defaultTab="details"]
│   │           │       ├── Tab: Product Details (ProductDetailsInputTab)
│   │           │       │   ├── TextInput [name, required, data-tutorial]
│   │           │       │   ├── ReferenceInput > AutocompleteInput [principal_id, required, data-tutorial]
│   │           │       │   ├── AutocompleteInput [category, creatable, required, data-tutorial]
│   │           │       │   ├── SelectInput [status, required, data-tutorial]
│   │           │       │   └── TextInput [description, multiline, optional]
│   │           │       └── Tab: Distribution (ProductDistributionTab)
│   │           │           ├── ProductDistributorInput
│   │           │           │   ├── ReferenceArrayInput > AutocompleteArrayInput [distributor_ids]
│   │           │           │   └── Dynamic DOT# Section (conditional)
│   │           │           │       └── TextInput [vendor_item_number per distributor]
│   │           │           └── CollapsibleSection [Additional Settings, collapsed]
│   │           └── FormToolbar
│   │               ├── CancelButton
│   │               └── SaveButton [label="Create Product", data-tutorial]
│   └── ProductFormTutorial [fixed bottom-left help button]
│       └── Button [HelpCircle icon, triggers Driver.js tutorial]
```

---

## Appendix: Styling Reference

### Layout Classes
- Form wrapper: `mt-2 flex lg:mr-72` (flex container with responsive right margin for tutorial)
- Card content: Default Card/CardContent styling
- Toolbar: `flex flex-row gap-2 justify-end` (right-aligned button group)
- Tab content (Details): `space-y-2` (8px vertical spacing)
- Tab content (Distribution): `space-y-6` (24px vertical spacing)
- DOT# section: `space-y-4` (16px spacing for distributor input)
- DOT# inputs: `space-y-3 pl-4 border-l-2 border-muted` (12px spacing, left border)

### Color Usage
- Helper text: `text-sm text-muted-foreground`
- Section text: `text-sm text-muted-foreground`
- Distributor names: `text-sm font-medium`
- Border: `border-l-2 border-muted`
- Tutorial button: `bg-primary text-primary-foreground`

### Sizing
- Tutorial button: `h-11 w-11 rounded-full` (44x44px touch target)
- Tutorial position: `bottom-4 left-4` (fixed)
- Form width: `flex-1`
- Tutorial margin: `lg:mr-72` (288px on large screens)
- Distributor name width: `min-w-[150px]`
- DOT# input: `flex-1` (fills remaining space)

---

**Audit Completed:** 2025-12-15
**Auditor:** Claude Sonnet 4.5 (Enhancement Pass)
**Status:** Enhanced to match TEMPLATE.md structure with Constitution compliance verification
