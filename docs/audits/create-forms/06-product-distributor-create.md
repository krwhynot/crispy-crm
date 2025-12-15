# ProductDistributorCreate Form Audit

**Form:** `ProductDistributorCreate`
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/productDistributors/ProductDistributorCreate.tsx`
**Date:** 2025-12-15
**Form Type:** Junction Table (Product-Distributor Authorization)

---

## Form Structure Overview

- **Form Type:** Simple Form (single-page)
- **Tabs:** None
- **Sections:** Single column layout
- **Total Fields:** 7
- **Required Fields:** 2 (product_id, distributor_id)
- **Optional Fields:** 5 (vendor_item_number, status, valid_from, valid_to, notes)
- **Redirect:** `list` (returns to list view after creation)

---

## ASCII Wireframe

```
┌────────────────────────────────────────────────────────┐
│ Create Product Distributor                            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Product *                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [Autocomplete dropdown]                    ▼     │ │
│  └──────────────────────────────────────────────────┘ │
│  Select the product                                    │
│                                                        │
│  Distributor *                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [Autocomplete dropdown]                    ▼     │ │
│  └──────────────────────────────────────────────────┘ │
│  Select the distributor                                │
│                                                        │
│  DOT Number (Vendor Item #)                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│  e.g., USF# 4587291, Sysco# 1092847                   │
│                                                        │
│  Status                                                │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Pending                                    ▼     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Valid From                                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [Date picker - defaults to today]               │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Valid To                                              │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [Date picker - optional]                         │ │
│  └──────────────────────────────────────────────────┘ │
│  Leave empty if ongoing                                │
│                                                        │
│  Notes                                                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │                                                  │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [Save]  [Cancel]                                      │
└────────────────────────────────────────────────────────┘
```

---

## Complete Field Inventory

| # | Field Name | Label | Input Type | Required | Default | Validation | Source Line |
|---|------------|-------|------------|----------|---------|------------|-------------|
| 1 | `product_id` | Product * | ReferenceInput + AutocompleteInput | Yes | - | z.coerce.number().int().positive() | L11-18 |
| 2 | `distributor_id` | Distributor * | ReferenceInput + AutocompleteInput | Yes | - | z.coerce.number().int().positive() | L20-27 |
| 3 | `vendor_item_number` | DOT Number (Vendor Item #) | TextInput | No | - | z.string().max(50).nullable().optional() | L29-34 |
| 4 | `status` | Status | SelectInput | No | `"pending"` | z.enum(['pending', 'active', 'inactive']) | L36-42 |
| 5 | `valid_from` | Valid From | TextInput (date) | No | Today's date (ISO) | z.coerce.date().default(() => new Date()) | L44-50 |
| 6 | `valid_to` | Valid To | TextInput (date) | No | - | z.coerce.date().nullable().optional() | L52 |
| 7 | `notes` | Notes | TextInput (multiline) | No | - | z.string().max(1000).nullable().optional() | L54-61 |

---

## Input Types Summary

| Input Type | Count | Fields |
|------------|-------|--------|
| ReferenceInput + AutocompleteInput | 2 | product_id, distributor_id |
| SelectInput | 1 | status |
| TextInput (text) | 1 | vendor_item_number |
| TextInput (date) | 2 | valid_from, valid_to |
| TextInput (multiline) | 1 | notes |

---

## Dropdowns Detail

### 1. Product (ReferenceInput + AutocompleteInput)
- **Source:** `product_id` (L11)
- **Reference:** `products` table
- **Display Field:** `name`
- **Filter:** Case-insensitive partial match on name (`name@ilike: %{query}%`)
- **Required:** Yes (`isRequired`)
- **Helper Text:** "Select the product" (L16)

### 2. Distributor (ReferenceInput + AutocompleteInput)
- **Source:** `distributor_id` (L20)
- **Reference:** `organizations` table
- **Display Field:** `name`
- **Filter:** Case-insensitive partial match on name + type filter (`name@ilike: %{query}%`, `organization_type: "distributor"`)
- **Required:** Yes (`isRequired`)
- **Helper Text:** "Select the distributor" (L25)

### 3. Status (SelectInput)
- **Source:** `status` (L36)
- **Choices:** `PRODUCT_DISTRIBUTOR_STATUS_CHOICES` (from constants.ts)
  - `pending` → "Pending"
  - `active` → "Active"
  - `inactive` → "Inactive"
- **Default:** `"pending"` (L40)
- **Helper Text:** None (`helperText={false}`)

---

## Sections & Layout

**Single Column Layout:**
- No explicit sections or fieldsets
- All fields displayed in sequential order
- Full-width fields where specified (`fullWidth` on vendor_item_number and notes)

**Field Order:**
1. Product selection (required)
2. Distributor selection (required)
3. Vendor item number (optional text)
4. Status (dropdown with default)
5. Valid from (date with default)
6. Valid to (optional date)
7. Notes (multiline text)

---

## Styling & Design Tokens

### Color Tokens
- No custom color tokens used
- Relies on default React Admin and shadcn/ui theme

### Sizing
- **AutocompleteInput:** Uses default button sizing (`h-auto py-1.75` from autocomplete-input.tsx L168)
- **SelectInput:** Uses default select sizing (`h-9` from select-input.tsx L184)
- **TextInput:** Uses default input sizing (44px height for touch targets)
- **Multiline Notes:** 3 rows (`rows={3}` L58)

### Spacing
- No custom spacing classes applied
- Relies on React Admin SimpleForm default spacing
- Full-width applied to: vendor_item_number (L33), notes (L59)

### Touch Targets
- All inputs meet 44x44px minimum touch target requirement
- Consistent with design system standards

---

## Accessibility Audit

### Labels
- ✅ All fields have explicit labels via `label` prop
- ✅ Required fields marked with asterisk in label text (Product *, Distributor *)
- ✅ Labels use `FieldTitle` component for semantic consistency

### ARIA Attributes
- ✅ `isRequired` prop on ReferenceInput components (L11, L20)
- ✅ FormField component provides `aria-invalid` on validation errors (from form.tsx)
- ✅ FormError component provides `aria-describedby` linking (from form.tsx)
- ✅ AutocompleteInput uses `role="combobox"` and `aria-expanded` (autocomplete-input.tsx L166-167)
- ✅ SelectInput triggers use proper ARIA roles

### Helper Text
- ✅ Product: "Select the product" (L16)
- ✅ Distributor: "Select the distributor" (L25)
- ✅ Vendor Item Number: "e.g., USF# 4587291, Sysco# 1092847" (L32)
- ✅ Valid To: "Leave empty if ongoing" (L52)
- ❌ Status: Helper text explicitly disabled (`helperText={false}` L41)
- ❌ Valid From: Helper text explicitly disabled (`helperText={false}` L49)
- ❌ Notes: Helper text explicitly disabled (`helperText={false}` L60)

### Keyboard Navigation
- ✅ All inputs keyboard accessible
- ✅ AutocompleteInput supports keyboard navigation (Enter, Space, Arrow keys)
- ✅ SelectInput supports keyboard navigation
- ✅ Date inputs use native browser date picker (keyboard accessible)

---

## Responsive Behavior

- **Desktop (1440px+):** Primary target, full-width layout
- **iPad:** Touch targets meet 44x44px minimum
- **Mobile:** Not specified as MVP target, but SimpleForm is responsive by default
- **Full-width fields:** vendor_item_number, notes

---

## Zod Schema Reference

**Schema File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/productDistributors.ts`

### Full Schema (productDistributorSchema)

```typescript
export const productDistributorSchema = z.strictObject({
  // Composite primary key - BIGINT foreign keys
  product_id: z.coerce.number().int().positive("Product is required"),
  distributor_id: z.coerce.number().int().positive("Distributor is required"),

  // DOT number (vendor's internal code: USF#, Sysco#, GFS#)
  vendor_item_number: z.string().max(50, "Vendor item number too long").nullable().optional(),

  // Status workflow
  status: productDistributorStatusSchema.default('pending'),

  // Temporal validity
  valid_from: z.coerce.date().default(() => new Date()),
  valid_to: z.coerce.date().nullable().optional(),

  // Context
  notes: z.string().max(1000, "Notes too long").nullable().optional(),

  // Audit timestamps
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
```

### Create Schema (createProductDistributorSchema)

```typescript
export const createProductDistributorSchema = productDistributorSchema
  .omit({
    created_at: true,
    updated_at: true,
  })
  .required({
    product_id: true,
    distributor_id: true,
  });
```

### Status Enum

```typescript
export const productDistributorStatusSchema = z.enum(['pending', 'active', 'inactive']);
```

### Validation Notes
- **Coercion:** `z.coerce` used for all numeric and date fields (product_id, distributor_id, valid_from, valid_to)
- **Length Limits:** String fields have `.max()` constraints (vendor_item_number: 50, notes: 1000)
- **Strict Objects:** `z.strictObject()` at API boundary (prevents mass assignment)
- **Allowlist:** `z.enum()` for status field (enforces valid values)
- **Composite ID:** Uses `parseCompositeId()` and `createCompositeId()` helpers for React Admin compatibility

---

## Component Tree

```
ProductDistributorCreate (L8-64)
└── Create (react-admin, L9)
    └── SimpleForm (react-admin, L10)
        ├── ReferenceInput (L11-18)
        │   └── AutocompleteInput (L12-17)
        │       └── Popover > Command > CommandInput/CommandGroup (internal)
        ├── ReferenceInput (L20-27)
        │   └── AutocompleteInput (L21-26)
        │       └── Popover > Command > CommandInput/CommandGroup (internal)
        ├── TextInput (L29-34)
        │   └── FormField > FormLabel + Input + InputHelperText + FormError
        ├── SelectInput (L36-42)
        │   └── FormField > FormLabel + Select > SelectTrigger/SelectContent/SelectItem + InputHelperText
        ├── TextInput (L44-50) [type="date"]
        │   └── FormField > FormLabel + Input + InputHelperText + FormError
        ├── TextInput (L52) [type="date"]
        │   └── FormField > FormLabel + Input + InputHelperText + FormError
        └── TextInput (L54-61) [multiline]
            └── FormField > FormLabel + Textarea + InputHelperText + FormError
```

---

## Shared Components Used

### From `/src/components/admin/`
1. **TextInput** (text-input.tsx)
   - Wraps shadcn/ui `Input` and `Textarea`
   - Provides FormField, FormLabel, FormControl, FormError, InputHelperText
   - Handles date formatting for date inputs
   - Used for: vendor_item_number, valid_from, valid_to, notes

2. **SelectInput** (select-input.tsx)
   - Wraps shadcn/ui `Select` components
   - Supports choices prop, loading states, create support
   - Includes reset button (X icon) when value selected
   - Used for: status

3. **ReferenceInput** (reference-input.tsx)
   - Wraps react-admin `ReferenceInputBase`
   - Fetches reference data from specified resource
   - Defaults to AutocompleteInput child
   - Used for: product_id, distributor_id

4. **AutocompleteInput** (autocomplete-input.tsx)
   - Wraps shadcn/ui `Command` and `Popover`
   - Provides searchable dropdown with filtering
   - Supports create new option
   - Uses `filterToQuery` for custom filtering
   - Used within: ReferenceInput components

### From `/src/components/ui/` (shadcn/ui)
- Input
- Textarea
- Select (SelectTrigger, SelectContent, SelectItem, SelectValue)
- Command (CommandInput, CommandGroup, CommandItem, CommandEmpty)
- Popover (PopoverTrigger, PopoverContent)
- Button
- Skeleton (for loading states)

### From React Admin
- Create
- SimpleForm
- ReferenceInputBase (via ReferenceInput wrapper)
- useInput, useChoices, useChoicesContext, FieldTitle

---

## Inconsistencies & Notes

### Inconsistencies
1. **Inconsistent Helper Text Suppression:**
   - Some fields have helper text (product_id, distributor_id, vendor_item_number, valid_to)
   - Others explicitly disable it (`helperText={false}` on status, valid_from, notes)
   - **Recommendation:** Provide helper text for all fields or be consistent with suppression strategy

2. **Label Wording - DOT Number:**
   - Field labeled "DOT Number (Vendor Item #)" (L31)
   - Helper text mentions "USF#, Sysco#" examples (L32)
   - Zod schema comment says "vendor's internal code: USF#, Sysco#, GFS#" (validation L19)
   - **Note:** "DOT Number" may be confusing (typically refers to Department of Transportation)
   - **Recommendation:** Consider clearer label like "Distributor Item Code" or "Vendor SKU"

3. **Default Value Implementation:**
   - `status` default set in JSX (`defaultValue="pending"` L40)
   - `valid_from` default set in JSX (`defaultValue={new Date().toISOString().split("T")[0]}` L48)
   - Zod schema also defines defaults for these fields
   - **Note:** Dual defaults (JSX + Zod) can lead to confusion
   - **Recommendation:** Per Engineering Constitution, defaults should come from Zod schema only

### Domain-Specific Notes
1. **Junction Table Purpose:**
   - Represents Product-Distributor authorization relationship
   - Tracks which distributors are authorized to sell which products
   - Vendor item number = distributor's internal SKU for the product

2. **Business Context:**
   - Status workflow: pending → active → inactive
   - Temporal validity tracks authorization periods
   - Notes field for authorization details (max 1000 chars)
   - Valid from defaults to today (authorization start date)
   - Valid to optional (ongoing authorizations)

3. **Composite Key Handling:**
   - Uses `parseCompositeId()` and `createCompositeId()` helpers
   - React Admin expects string IDs, but DB uses composite BIGINT keys
   - Format: `{product_id}_{distributor_id}` (e.g., "123_456")

### Positive Patterns
1. ✅ **Zod Coercion:** Proper use of `z.coerce` for numbers and dates
2. ✅ **Length Constraints:** All strings have `.max()` limits (DoS prevention)
3. ✅ **Strict Objects:** `z.strictObject()` prevents mass assignment
4. ✅ **Enum Allowlist:** `z.enum()` for status (no denylist patterns)
5. ✅ **Required FK Fields:** Both product_id and distributor_id marked required in schema and UI
6. ✅ **Reference Filtering:** Distributor autocomplete filters by organization_type="distributor"
7. ✅ **User-Friendly Defaults:** Status defaults to "pending", valid_from to today
8. ✅ **Helpful Examples:** Vendor item number shows real-world examples (USF#, Sysco#)

### Performance Notes
- **Form Mode:** Uses default `onSubmit` mode (no re-render storms)
- **AutocompleteInput Filtering:** Server-side filtering via `filterToQuery` (efficient for large datasets)
- **Lazy Loading:** Reference data loaded on-demand when dropdowns opened

---

## Summary

**Form Complexity:** Medium (junction table with 7 fields)
**Primary Purpose:** Create Product-Distributor authorization records
**Key Features:**
- Composite primary key (product_id + distributor_id)
- Reference inputs with search/filter
- Status workflow tracking
- Temporal validity (valid_from/valid_to)
- Vendor-specific item codes (DOT numbers)

**Compliance:**
- ✅ Follows Tailwind v4 semantic tokens
- ✅ Meets 44x44px touch target requirements
- ✅ Uses Zod validation at API boundary
- ✅ Implements fail-fast patterns
- ✅ Accessible labels and ARIA attributes
- ⚠️ Dual defaults (JSX + Zod) - should consolidate to schema only
- ⚠️ Inconsistent helper text usage

**Recommended Improvements:**
1. Remove JSX defaults, rely on Zod schema defaults only
2. Provide helper text for all fields or consistently suppress
3. Consider renaming "DOT Number" to clearer label
4. Ensure form validation mode explicitly set (currently default)
