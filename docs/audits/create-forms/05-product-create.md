# ProductCreate Form Audit

**Date:** 2025-12-15
**Form:** ProductCreate
**Location:** `/src/atomic-crm/products/ProductCreate.tsx`
**Validation Schema:** `/src/atomic-crm/validation/products.ts`

---

## Form Structure Overview

- **Form Type:** Tabbed Create Form
- **Layout:** Full-width card with right-side tutorial panel (`lg:mr-72`)
- **Tabs:** 4 tabs (General, Relationships, Classification, Distributor Codes)
- **Total Fields:** 15 fields across all tabs
- **Required Fields:** 3 (name, principal_id, category)
- **Error Handling:** FormErrorSummary component with field label mapping
- **Tutorial:** Integrated ProductFormTutorial component (Driver.js)
- **Redirect:** "show" (redirects to product detail page after creation)

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ FormErrorSummary (conditional - shows when errors exist)    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────┬───────────────┬─────────────────┬─────────────┐ │
│ │ General │ Relationships │ Classification  │ Distributor │ │
│ │         │               │                 │ Codes       │ │
│ └─────────┴───────────────┴─────────────────┴─────────────┘ │
│                                                               │
│ Tab Content Area:                                            │
│                                                               │
│ [General Tab]                                                │
│   Product Name *        [_____________________________]      │
│   SKU                   [_____________________________]      │
│   Description           [_____________________________]      │
│                         [_____________________________]      │
│                         [_____________________________]      │
│                                                               │
│ [Relationships Tab]                                          │
│   Principal/Supplier *  [▼ Autocomplete              ]      │
│   Distributor           [▼ Autocomplete              ]      │
│                                                               │
│ [Classification Tab]                                         │
│   Category *            [▼ Autocomplete + Create     ]      │
│   Status *              [▼ Select Dropdown           ]      │
│                                                               │
│ [Distributor Codes Tab]                                     │
│   ┌───────────────────┬───────────────────┐                 │
│   │ US Foods Code     │ Sysco Code        │                 │
│   │ GFS Code          │ PFG Code          │                 │
│   │ Greco Code        │ GOFO Code         │                 │
│   │ RDP Code          │ Wilkens Code      │                 │
│   └───────────────────┴───────────────────┘                 │
│                                                               │
│                                    [Cancel] [Create Product] │
└─────────────────────────────────────────────────────────────┘
                                                        [? Help]
```

---

## Complete Field Inventory

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 1 | name | Product Name * | TextInput | Yes | - | string, min(1), max(255) | ProductGeneralTab.tsx:7-13 |
| 2 | sku | SKU | TextInput | No | - | string, max(50), nullish | ProductGeneralTab.tsx:16-22 |
| 3 | description | Description | TextInput (multiline) | No | - | string, max(2000), optional | ProductGeneralTab.tsx:24-31 |
| 4 | principal_id | Principal/Supplier * | ReferenceInput + AutocompleteInput | Yes | - | number, int, positive | ProductRelationshipsInputTab.tsx:18-28 |
| 5 | distributor_id | Distributor | ReferenceInput + AutocompleteInput | No | - | number, int, positive, optional | ProductRelationshipsInputTab.tsx:32-42 |
| 6 | category | Category * | AutocompleteInput (creatable) | Yes | "beverages" | string, min(1), max(100) | ProductClassificationTab.tsx:30-37 |
| 7 | status | Status * | SelectInput | Yes | "active" | enum: active, discontinued, coming_soon | ProductClassificationTab.tsx:40 |
| 8 | usf_code | US Foods Code | TextInput | No | - | string, max(50), nullish | ProductDistributorCodesTab.tsx:21-27 |
| 9 | sysco_code | Sysco Code | TextInput | No | - | string, max(50), nullish | ProductDistributorCodesTab.tsx:21-27 |
| 10 | gfs_code | GFS Code | TextInput | No | - | string, max(50), nullish | ProductDistributorCodesTab.tsx:21-27 |
| 11 | pfg_code | PFG Code | TextInput | No | - | string, max(50), nullish | ProductDistributorCodesTab.tsx:21-27 |
| 12 | greco_code | Greco Code | TextInput | No | - | string, max(50), nullish | ProductDistributorCodesTab.tsx:21-27 |
| 13 | gofo_code | GOFO Code | TextInput | No | - | string, max(50), nullish | ProductDistributorCodesTab.tsx:21-27 |
| 14 | rdp_code | RDP Code | TextInput | No | - | string, max(50), nullish | ProductDistributorCodesTab.tsx:21-27 |
| 15 | wilkens_code | Wilkens Code | TextInput | No | - | string, max(50), nullish | ProductDistributorCodesTab.tsx:21-27 |

**System Fields (Auto-managed):**
- `created_by`: number, int, nullish (set from identity.id at ProductCreate.tsx:30)
- `updated_by`: number, int, nullish (not used in create form)

---

## Input Types Used

| Input Type | Count | Fields |
|------------|-------|--------|
| TextInput (single-line) | 10 | name, sku, usf_code, sysco_code, gfs_code, pfg_code, greco_code, gofo_code, rdp_code, wilkens_code |
| TextInput (multiline) | 1 | description |
| ReferenceInput + AutocompleteInput | 2 | principal_id, distributor_id |
| AutocompleteInput (creatable) | 1 | category |
| SelectInput | 1 | status |

---

## Dropdowns Detail

### Category Dropdown (AutocompleteInput - Creatable)
**Source:** ProductClassificationTab.tsx:30-37
**Field:** `category`
**Type:** Autocomplete with custom value creation
**onCreate Handler:** `handleCreateCategory` (lines 22-25)

**Choices (from PRODUCT_CATEGORIES):**
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

**Label Transformation:** Underscore-separated values converted to Title Case (line 9-11)
**Custom Creation:** User can type custom category name; creates `{ id: categoryName, name: categoryName }`
**Helper Text:** "Select F&B category or type to create custom"

---

### Status Dropdown (SelectInput)
**Source:** ProductClassificationTab.tsx:40
**Field:** `status`
**Type:** Standard select dropdown

**Choices (from PRODUCT_STATUSES):**
```javascript
[
  "active",         // → "Active"
  "discontinued",   // → "Discontinued"
  "coming_soon"     // → "Coming Soon"
]
```

**Label Transformation:** Underscore-separated values converted to Title Case (line 16-19)

---

### Principal/Supplier Dropdown (ReferenceInput)
**Source:** ProductRelationshipsInputTab.tsx:18-28
**Field:** `principal_id`
**Reference:** `organizations` resource
**Filter:** `{ organization_type: "principal" }`
**Option Text:** `name`
**Helper Text:** "Required - Select the manufacturing principal"

---

### Distributor Dropdown (ReferenceInput)
**Source:** ProductRelationshipsInputTab.tsx:32-42
**Field:** `distributor_id`
**Reference:** `organizations` resource
**Filter:** `{ organization_type: "distributor" }`
**Option Text:** `name`
**Helper Text:** "Optional - Select a distributor if applicable"

---

## Sections & Layout Breakdown

### Tab 1: General (default tab)
**Key:** `general`
**Fields:** name, sku, description
**Layout:** Vertical stack (`space-y-2`)
**Data Tutorial:** `product-tab-general`
**Source:** ProductGeneralTab.tsx

**Field Details:**
- **Product Name:** Full width, required field helper text, placeholder "Product name"
- **SKU:** Full width, helper text "Optional product identifier", placeholder "SKU-123"
- **Description:** Multiline textarea, 3 rows, full width, placeholder "Product description..."

---

### Tab 2: Relationships
**Key:** `relationships`
**Fields:** principal_id, distributor_id
**Layout:** Vertical stack (`space-y-2`)
**Data Tutorial:** `product-tab-relationships`
**Source:** ProductRelationshipsInputTab.tsx

**Field Details:**
- **Principal/Supplier:** Autocomplete reference input filtered to principals only
- **Distributor:** Autocomplete reference input filtered to distributors only

---

### Tab 3: Classification
**Key:** `classification`
**Fields:** category, status
**Layout:** Vertical stack (`space-y-2`)
**Data Tutorial:** `product-tab-classification`
**Source:** ProductClassificationTab.tsx

**Field Details:**
- **Category:** Autocomplete with 16 predefined F&B categories + custom creation
- **Status:** Select dropdown with 3 options (active, discontinued, coming_soon)

---

### Tab 4: Distributor Codes
**Key:** `distributor-codes`
**Fields:** usf_code, sysco_code, gfs_code, pfg_code, greco_code, gofo_code, rdp_code, wilkens_code
**Layout:** 2-column grid (`grid-cols-2 gap-4`)
**Data Tutorial:** `product-tab-distributor-codes`
**Source:** ProductDistributorCodesTab.tsx

**Section Header:** "Enter distributor-specific product codes (all optional)." (text-sm text-muted-foreground)

**Field Details:** 8 text inputs in 2-column grid, all optional, no helper text, placeholder "Enter code..."

---

## Styling & Design Tokens

### Color Tokens Used
- `text-sm` - Section description text size
- `text-muted-foreground` - Section description color
- `bg-muted` - Tab list background
- `bg-primary` - Help button background
- `text-primary-foreground` - Help button text

### Spacing
- Form container: `mt-2 flex lg:mr-72` (top margin + right margin for tutorial panel)
- Tab content: `space-y-2` (8px vertical spacing between fields)
- Distributor codes grid: `gap-4` (16px gap between grid items)
- Toolbar buttons: `gap-2` (8px gap between Cancel and Save)
- Tutorial positioning: `bottom-4 left-4` (fixed position)

### Sizing
- Tutorial help button: `h-11 w-11` (44x44px touch target - compliant)
- Button rounded: `rounded-full` (help button)
- Form width: `flex-1` (full width with tutorial margin)
- Tutorial panel margin: `lg:mr-72` (288px right margin on large screens)

### Layout Classes
- Form wrapper: `flex lg:mr-72` (flex container with responsive right margin)
- Toolbar: `flex flex-row gap-2 justify-end` (right-aligned button group)
- Tab content: Vertical stacking with consistent spacing
- Distributor codes: `grid grid-cols-2` (2-column responsive grid)

---

## Accessibility Audit

### Labels
- **All fields have labels:** ✅ All 15 fields use proper label props
- **Required indicators:** ✅ Asterisks (*) in labels for required fields (name, principal_id, category, status)
- **FieldTitle component:** ✅ Used in TextInput.tsx:53 with `isRequired` prop

### ARIA Attributes
- **aria-invalid:** ✅ Handled by FormField component (implied from form state)
- **aria-describedby:** ✅ Handled by FormError and InputHelperText components
- **aria-label:** ✅ Tutorial button has `aria-label="Start product form tutorial"` (ProductFormTutorial.tsx:156)

### Helper Text
- **General Tab:**
  - name: "Required field"
  - sku: "Optional product identifier"
  - description: No helper text
- **Relationships Tab:**
  - principal_id: "Required - Select the manufacturing principal"
  - distributor_id: "Optional - Select a distributor if applicable"
- **Classification Tab:**
  - category: "Select F&B category or type to create custom"
  - status: No helper text
- **Distributor Codes Tab:**
  - All 8 fields: `helperText={false}` (explicitly disabled)

### Form Error Handling
- **FormErrorSummary:** ✅ Shows validation errors with field label mapping (ProductCreate.tsx:56-60)
- **Field label mapping:** ✅ PRODUCT_FIELD_LABELS object (ProductCreate.tsx:14-22)
- **Auto-expand:** ✅ Errors auto-expand when ≤3 errors (ProductCreate.tsx:59)
- **Error display:** ✅ FormError component in TextInput.tsx:64

### Keyboard Navigation
- **Tab navigation:** ✅ TabbedFormInputs supports keyboard tab switching
- **Form field focus:** ✅ All inputs support standard keyboard navigation
- **Tutorial control:** ✅ Help button is keyboard accessible

---

## Responsive Behavior

### Desktop (1440px+)
- Tutorial panel: Right-side fixed panel (`lg:mr-72` = 288px margin)
- Form: Full width with right margin for tutorial
- Distributor codes: 2-column grid

### Tablet/iPad
- Tutorial panel: Likely overlaps or repositions (no explicit mobile handling)
- Form: Full width
- Distributor codes: Grid may collapse on smaller screens (no explicit breakpoint)

### Mobile
- **Note:** No explicit mobile-specific styling beyond Tailwind defaults
- Tutorial button: Fixed at `bottom-4 left-4`

---

## Zod Schema Reference

**Schema Location:** `/src/atomic-crm/validation/products.ts`
**Schema Name:** `productSchema`
**Type:** `z.strictObject` (prevents mass assignment)

### Full Schema (lines 47-86):
```typescript
export const productSchema = z.strictObject({
  // Required fields
  name: z
    .string({ error: "Product name is required" })
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  sku: z.string().max(50, "SKU too long").nullish(),
  principal_id: z
    .number({ error: "Principal/Supplier is required" })
    .int()
    .positive("Principal/Supplier is required"),
  category: productCategorySchema, // string, min(1), max(100), default("beverages")

  // Optional fields with defaults
  status: productStatusSchema.default("active"), // enum: active, discontinued, coming_soon
  description: z.string().max(2000).optional(),
  distributor_id: z.number().int().positive().optional(),

  // Food/health specific fields
  certifications: z.array(z.string()).nullish(),
  allergens: z.array(z.string()).nullish(),
  ingredients: z.string().max(5000).nullish(),
  nutritional_info: z.record(z.any()).nullish(),
  marketing_description: z.string().max(2000).nullish(),

  // Distributor-specific product codes (all optional, max 50 chars)
  usf_code: z.string().max(50, "USF code too long").nullish(),
  sysco_code: z.string().max(50, "Sysco code too long").nullish(),
  gfs_code: z.string().max(50, "GFS code too long").nullish(),
  pfg_code: z.string().max(50, "PFG code too long").nullish(),
  greco_code: z.string().max(50, "Greco code too long").nullish(),
  gofo_code: z.string().max(50, "GOFO code too long").nullish(),
  rdp_code: z.string().max(50, "RDP code too long").nullish(),
  wilkens_code: z.string().max(50, "Wilkens code too long").nullish(),

  // System fields
  created_by: z.number().int().nullish(),
  updated_by: z.number().int().nullish(),
});
```

### Validation Function
**Function:** `validateProductForm` (lines 91-110)
**Error Format:** React Admin format `{ message, body: { errors } }`
**Used By:** unifiedDataProvider at API boundary (per Engineering Constitution)

---

## Component Tree

```
ProductCreate (ProductCreate.tsx)
├── CreateBase (ra-core) [redirect="show"]
│   ├── Form (ra-core) [defaultValues from schema]
│   │   └── Card > CardContent
│   │       └── ProductFormContent
│   │           ├── FormErrorSummary [fieldLabels mapping, auto-expand ≤3 errors]
│   │           ├── ProductInputs
│   │           │   └── TabbedFormInputs [4 tabs, defaultTab="general"]
│   │           │       ├── Tab: General (ProductGeneralTab)
│   │           │       │   ├── TextInput [name, required]
│   │           │       │   ├── TextInput [sku, optional]
│   │           │       │   └── TextInput [description, multiline, 3 rows]
│   │           │       ├── Tab: Relationships (ProductRelationshipsInputTab)
│   │           │       │   ├── ReferenceInput > AutocompleteInput [principal_id, required]
│   │           │       │   └── ReferenceInput > AutocompleteInput [distributor_id, optional]
│   │           │       ├── Tab: Classification (ProductClassificationTab)
│   │           │       │   ├── AutocompleteInput [category, creatable, required]
│   │           │       │   └── SelectInput [status, required]
│   │           │       └── Tab: Distributor Codes (ProductDistributorCodesTab)
│   │           │           └── Grid [2 columns]
│   │           │               ├── TextInput [usf_code]
│   │           │               ├── TextInput [sysco_code]
│   │           │               ├── TextInput [gfs_code]
│   │           │               ├── TextInput [pfg_code]
│   │           │               ├── TextInput [greco_code]
│   │           │               ├── TextInput [gofo_code]
│   │           │               ├── TextInput [rdp_code]
│   │           │               └── TextInput [wilkens_code]
│   │           └── FormToolbar
│   │               ├── CancelButton
│   │               └── SaveButton [label="Create Product"]
│   └── ProductFormTutorial [fixed bottom-left help button]
│       └── Button [HelpCircle icon, triggers Driver.js tutorial]
```

---

## Shared Components Used

| Component | Source | Usage | Props |
|-----------|--------|-------|-------|
| CreateBase | ra-core | Root form wrapper | redirect="show" |
| Form | ra-core | Form context provider | defaultValues from schema |
| Card, CardContent | @/components/ui/card | Form container | - |
| FormErrorSummary | @/components/admin/FormErrorSummary | Error banner | errors, fieldLabels, defaultExpanded |
| TabbedFormInputs | @/components/admin/tabbed-form | Tab container | tabs array, defaultTab="general" |
| TextInput | @/components/admin/text-input | Text input wrapper | source, label, className, helperText, placeholder, multiline |
| ReferenceInput | @/components/admin/reference-input | Foreign key selector | source, reference, filter |
| AutocompleteInput | @/components/admin/autocomplete-input | Searchable dropdown | optionText, helperText, onCreate |
| SelectInput | @/components/admin/select-input | Standard dropdown | source, label, choices |
| FormToolbar | @/components/admin/simple-form | Button container | - |
| CancelButton | @/components/admin/cancel-button | Cancel action | - |
| SaveButton | @/components/admin/form | Submit button | label, data-tutorial |
| Button | @/components/ui/button | Tutorial trigger | variant, size, onClick |
| Tooltip | @/components/ui/tooltip | Help tooltip | - |
| HelpCircle | lucide-react | Icon | className="h-5 w-5" |

---

## Inconsistencies & Notes

### Inconsistencies
1. **Helper Text Inconsistency:**
   - General tab: Uses helper text for name ("Required field") and sku ("Optional product identifier")
   - Relationships tab: Uses helper text for both fields
   - Classification tab: Only category has helper text; status does not
   - Distributor codes tab: `helperText={false}` explicitly disables all helper text
   - **Impact:** Inconsistent user guidance across tabs

2. **Required Field Indicators:**
   - All required fields use asterisk (*) in labels: ✅
   - However, status has asterisk but is auto-defaulted to "active", so technically not required by user
   - **Impact:** Minor - status is still part of schema requirements

3. **Tutorial Data Attributes:**
   - Some fields have `data-tutorial` wrappers (name, sku, principal, category, status)
   - Description and distributor fields lack tutorial highlighting
   - All 8 distributor code fields lack individual tutorial steps
   - **Impact:** Tutorial doesn't cover all fields

4. **Schema vs. Form Field Mismatch:**
   - Schema includes: certifications, allergens, ingredients, nutritional_info, marketing_description
   - Form does NOT include these fields
   - **Impact:** These fields cannot be set during creation (may be edit-only or deprecated)

### Notes
1. **Form State Management:**
   - Uses Constitution Rule #4: `productSchema.partial().parse({})` for default values (ProductCreate.tsx:29)
   - Correctly sets `created_by` from identity context (ProductCreate.tsx:30)

2. **Validation Approach:**
   - No validate prop on inputs (follows Constitution - validation at API boundary only)
   - Error display via FormErrorSummary + FormError components

3. **Category Flexibility:**
   - Schema allows any string up to 100 chars (validation/products.ts:30-34)
   - UI provides 16 suggested F&B categories + custom creation (ProductClassificationTab.tsx:6-12)
   - Good balance between guidance and flexibility

4. **Distributor Codes:**
   - 8 major distributors supported
   - All optional fields
   - 2-column grid layout for efficient space usage
   - No validation beyond 50-char max length

5. **Tutorial Integration:**
   - Uses Driver.js library for interactive walkthrough
   - 11 steps covering main workflow
   - Fixed help button (bottom-left) with tooltip
   - Shows progress indicator (`showProgress: true`)

6. **Redirect Behavior:**
   - `redirect="show"` means successful creation navigates to product detail page
   - Follows React Admin convention

7. **Mobile Considerations:**
   - Tutorial button fixed at bottom-left may overlap content on mobile
   - No explicit mobile breakpoint for distributor codes grid beyond Tailwind defaults
   - May need responsive testing for optimal mobile UX

---

## Recommendations

### Critical
1. **Add Missing Schema Fields:** Decide if certifications, allergens, ingredients, nutritional_info, marketing_description should be in create form or edit-only. If edit-only, document this in schema comments.

### High Priority
2. **Standardize Helper Text:** Either provide helper text for all required fields or establish clear pattern (e.g., only for complex fields).
3. **Complete Tutorial Coverage:** Add tutorial steps for description and distributor fields, or document why they're excluded.

### Medium Priority
4. **Mobile Layout Testing:** Test distributor codes 2-column grid on mobile; consider `sm:grid-cols-1 md:grid-cols-2` pattern.
5. **Status Field Clarity:** Consider removing asterisk from status since it has default value (or add helper text explaining default).

### Low Priority
6. **Tutorial Button Positioning:** Consider responsive positioning for tutorial button on mobile devices.
7. **Distributor Code Grid:** Consider adding visual separator or section headers for distributor code groups.

---

**Audit Completed:** 2025-12-15
**Auditor:** Agent 5 (Form Analysis Specialist)
