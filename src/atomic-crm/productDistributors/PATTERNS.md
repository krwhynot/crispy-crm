# Junction Table UI Patterns

Standard patterns for many-to-many relationship UIs in Crispy CRM, using `product_distributors` as the reference implementation.

## Domain Context

**Product Distributors** links Products to Organizations (type: distributor) with vendor item codes (DOT numbers like USF#, Sysco#, GFS#). This junction table stores relationship attributes like authorization status and validity dates.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     products                            │
│                   (Principal's items)                   │
│                        │                                │
│                   (1) ─┼─ (*)                          │
│                        ▼                                │
│              product_distributors                       │
│         (junction table with attributes)                │
│  • vendor_item_number (DOT#)                           │
│  • status (pending/active/inactive)                    │
│  • valid_from / valid_to                               │
│                        ▲                                │
│                   (*) ─┼─ (1)                          │
│                        │                                │
│                  organizations                          │
│             (filtered: type='distributor')             │
└─────────────────────────────────────────────────────────┘
```

---

## Component Flow

```
resource.tsx (lazy loading + error boundary)
    ↓
┌───────────────────┬───────────────────┬───────────────────┐
│   List View       │   Create View     │   Edit View       │
│ (both FKs shown)  │ (FKs editable)    │ (FKs read-only)   │
└───────────────────┴───────────────────┴───────────────────┘
    ↓                     ↓                     ↓
ReferenceField       ReferenceInput        ReferenceField
(display only)       + AutocompleteInput   (display only)
```

---

## Pattern A: Composite ID Handling

Junction tables have composite primary keys (two FKs), but React Admin expects string IDs. Use helper functions to convert.

### Why This Matters

React Admin's `getOne`, `edit`, and `delete` operations pass a single `id` parameter. For junction tables, we need both foreign keys to identify a record.

```tsx
// src/atomic-crm/services/productDistributors.service.ts

// Parse "123-456" → { product_id: 123, distributor_id: 456 }
export const parseCompositeId = (id: string): { product_id: number; distributor_id: number } => {
  const [product_id, distributor_id] = id.split('-').map(Number);
  if (isNaN(product_id) || isNaN(distributor_id)) {
    throw new Error(`Invalid composite ID format: ${id}. Expected format: product_id-distributor_id`);
  }
  return { product_id, distributor_id };
};

// Create string ID from two FKs
export const createCompositeId = (product_id: number, distributor_id: number): string => {
  return `${product_id}-${distributor_id}`;
};
```

**When to use**: Any junction table CRUD operations in the data provider.

---

## Pattern B: Foreign Key Handling (Create vs Edit)

Foreign keys are **editable during Create** but **read-only during Edit**. You can't change a relationship's endpoints after creation—only its attributes.

### B1: Editable FKs (Create Form)

Use `ReferenceInput` + `AutocompleteInput` with centralized autocomplete helpers for searchable foreign key selection.

```tsx
// src/atomic-crm/productDistributors/ProductDistributorCreate.tsx
import {
  getAutocompleteProps,
  getQSearchAutocompleteProps,
} from "@/atomic-crm/utils/autocompleteDefaults";

<ReferenceInput source="product_id" reference="products" isRequired>
  <AutocompleteInput
    {...getAutocompleteProps("name")}
    optionText="name"
    label="Product *"
    helperText="Select the product"
  />
</ReferenceInput>

<ReferenceInput
  source="distributor_id"
  reference="organizations"
  filter={{ organization_type: "distributor" }}
  isRequired
>
  <AutocompleteInput
    {...getQSearchAutocompleteProps()}
    optionText="name"
    label="Distributor *"
    helperText="Select the distributor"
  />
</ReferenceInput>
```

**Key points:**
- `getAutocompleteProps("name")` provides standardized `filterToQuery` for name-based search
- `getQSearchAutocompleteProps()` provides standardized `filterToQuery` for q-search endpoints
- **Filter by type**: `filter={{ organization_type: "distributor" }}` on `ReferenceInput` narrows to distributors only
- Both FKs are `isRequired` since they form the composite key

### B2: Read-Only FKs (Edit Form)

Display FKs as non-editable reference fields with a visual distinction.

```tsx
// src/atomic-crm/productDistributors/ProductDistributorEdit.tsx

<div className="space-y-4 mb-6 p-4 bg-muted/50 rounded-lg">
  <h3 className="text-sm font-medium text-muted-foreground">Product-Distributor Relationship</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <span className="text-xs text-muted-foreground">Product</span>
      <ReferenceField source="product_id" reference="products">
        <TextField source="name" className="font-medium" />
      </ReferenceField>
    </div>
    <div>
      <span className="text-xs text-muted-foreground">Distributor</span>
      <ReferenceField source="distributor_id" reference="organizations">
        <TextField source="name" className="font-medium" />
      </ReferenceField>
    </div>
  </div>
</div>
```

**Key points:**
- `bg-muted/50` visually distinguishes immutable section
- Uses `ReferenceField` (display) not `ReferenceInput` (editable)
- Grid layout shows both FKs side-by-side

**When to use**: Pattern B1 for Create forms, B2 for Edit forms in any junction table UI.

---

## Pattern C: Through-Table Form Defaults

Junction tables store relationship attributes. Use Zod schema to generate form defaults.

### C1: Schema-Derived Defaults

```tsx
// src/atomic-crm/productDistributors/ProductDistributorCreate.tsx

import { useMemo } from "react";
import { productDistributorSchema } from "../validation/productDistributors";

export const ProductDistributorCreate = () => {
  // Constitution Rule #4: Form state from schema
  const defaultValues = useMemo(
    () => productDistributorSchema.partial().parse({}),
    []
  );

  return (
    <CreateBase redirect="list">
      <Form defaultValues={defaultValues} warnWhenUnsavedChanges>
        <ProductDistributorFormContent />
      </Form>
    </CreateBase>
  );
};
```

**Why `partial().parse({})`**: Extracts schema defaults (like `status: 'pending'`) without requiring all fields.

### C2: Error Summary Integration

```tsx
// src/atomic-crm/productDistributors/ProductDistributorCreate.tsx

const FIELD_LABELS: Record<string, string> = {
  product_id: "Product",
  distributor_id: "Distributor",
  vendor_item_number: "DOT Number",
  status: "Status",
  valid_from: "Valid From",
  valid_to: "Valid To",
  notes: "Notes",
};

const ProductDistributorFormContent = () => {
  const { errors } = useFormState();

  return (
    <>
      <FormErrorSummary
        errors={errors}
        fieldLabels={FIELD_LABELS}
        defaultExpanded={Object.keys(errors).length <= 3}
      />
      {/* Form fields... */}
    </>
  );
};
```

### C3: Attribute Fields (ProductDistributorInputs.tsx)

Shared inputs extracted to `ProductDistributorInputs.tsx` for reuse in both Create and Edit forms. Uses `DateInput` (not `TextInput type="date"`) and spreads choices array for mutability.

```tsx
// src/atomic-crm/productDistributors/ProductDistributorInputs.tsx

<TextInput
  source="vendor_item_number"
  label="DOT Number (Vendor Item #)"
  helperText="e.g., USF# 4587291, Sysco# 1092847"
/>

<SelectInput
  source="status"
  label="Status"
  choices={[...PRODUCT_DISTRIBUTOR_STATUS_CHOICES]}
  helperText={false}
/>

<DateInput source="valid_from" label="Valid From" helperText={false} />

<DateInput source="valid_to" label="Valid To" helperText="Leave empty if ongoing" />

<TextInput source="notes" label="Notes" multiline rows={3} helperText={false} />
```

**When to use**: Any junction table with relationship attributes beyond just the two FKs.

---

## Pattern D: Junction List View

Display both linked entities using `UnifiedListPageLayout` with sidebar filters and denormalized summary view columns (per DB-001).

### D1: Sidebar Filter + FilterChipBar

Filters are defined in a separate `ProductDistributorListFilter.tsx` component using `FilterSidebar` and `ToggleFilterButton`. A companion `productDistributorFilterConfig.ts` drives the `FilterChipBar` above the datagrid.

```tsx
// src/atomic-crm/productDistributors/ProductDistributorListFilter.tsx

export const ProductDistributorListFilter = () => {
  useListContext();

  return (
    <FilterSidebar searchPlaceholder="Search by DOT number...">
      <FilterCategory label="Status" icon={<CircleDot className="h-4 w-4" />}>
        {PRODUCT_DISTRIBUTOR_STATUS_CHOICES.map((choice) => (
          <ToggleFilterButton
            key={choice.id}
            className="w-full justify-between"
            label={choice.name}
            value={{ status: choice.id }}
          />
        ))}
      </FilterCategory>
    </FilterSidebar>
  );
};
```

```tsx
// src/atomic-crm/productDistributors/productDistributorFilterConfig.ts

export const PRODUCT_DISTRIBUTOR_FILTER_CONFIG = validateFilterConfig([
  { key: "status", label: "Status", type: "select", choices: PD_STATUS_CHOICES },
  { key: "product_id", label: "Product", type: "reference", reference: "products" },
  { key: "distributor_id", label: "Distributor", type: "reference", reference: "organizations" },
]);
```

### D2: PremiumDatagrid with Denormalized Columns

Uses `PremiumDatagrid` (not raw `Datagrid`) and denormalized `TextField` columns from the summary view instead of `ReferenceField` (eliminates N+1 queries per DB-001).

```tsx
// src/atomic-crm/productDistributors/ProductDistributorList.tsx

export const ProductDistributorList = () => (
  <List title={false} actions={false} perPage={25} sort={{ field: "created_at", order: "DESC" }}>
    <UnifiedListPageLayout
      resource="product_distributors"
      filterComponent={<ProductDistributorListFilter />}
      filterConfig={PRODUCT_DISTRIBUTOR_FILTER_CONFIG}
      sortFields={["created_at", "status", "valid_from"]}
      searchPlaceholder="Search product distributors..."
      primaryAction={<CreateButton variant="default" />}
    >
      <PremiumDatagrid rowClick="edit" bulkActionButtons={false}>
        {/* Denormalized fields from summary view (DB-001) - no ReferenceField needed */}
        <TextField source="product_name" label="Product" />
        <TextField source="distributor_name" label="Distributor" />
        <TextField source="vendor_item_number" label="DOT Number" />
        <SelectField source="status" choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES} />
        <DateField source="valid_from" label="Valid From" />
        <DateField source="valid_to" label="Valid To" emptyText="-" />
      </PremiumDatagrid>
    </UnifiedListPageLayout>
  </List>
);
```

**Key points:**
- `actions={false}` on `<List>` -- `UnifiedListPageLayout` handles actions/search/filters
- `PremiumDatagrid` (not raw `Datagrid`) per CORE-016
- Uses `TextField source="product_name"` / `TextField source="distributor_name"` from summary view (denormalized, eliminates N+1 queries per DB-001)
- `bulkActionButtons={false}` -- bulk delete on junction tables is risky
- `emptyText="-"` for nullable dates provides clear empty state
- `primaryAction={<CreateButton variant="default" />}` replaces `FloatingCreateButton`

**When to use**: Any junction table list view.

---

## Pattern E: Resource Configuration

Lazy loading with error boundaries, `React.Suspense` fallback, and a separate config file for react-refresh compatibility.

### resource.tsx (Component Definitions)

```tsx
// src/atomic-crm/productDistributors/resource.tsx

import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";
import { Loading } from "@/components/ra-wrappers/loading";

const ProductDistributorListLazy = React.lazy(() => import("./ProductDistributorList"));
const ProductDistributorEditLazy = React.lazy(() => import("./ProductDistributorEdit"));
const ProductDistributorCreateLazy = React.lazy(() => import("./ProductDistributorCreate"));
const ProductDistributorShowLazy = React.lazy(() => import("./ProductDistributorShow"));

export const ProductDistributorListView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="list">
    <React.Suspense fallback={<Loading />}>
      <ProductDistributorListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductDistributorCreateView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="create">
    <React.Suspense fallback={<Loading />}>
      <ProductDistributorCreateLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductDistributorEditView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="edit">
    <React.Suspense fallback={<Loading />}>
      <ProductDistributorEditLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const ProductDistributorShowView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="show">
    <React.Suspense fallback={<Loading />}>
      <ProductDistributorShowLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);
```

### productDistributorsConfig.ts (Resource Config)

Separated from component definitions to satisfy `react-refresh/only-export-components` lint rule.

```tsx
// src/atomic-crm/productDistributors/productDistributorsConfig.ts

import { Package } from "lucide-react";
import {
  ProductDistributorListView,
  ProductDistributorCreateView,
  ProductDistributorEditView,
  ProductDistributorShowView,
} from "./resource";

const productDistributorsConfig = {
  list: ProductDistributorListView,
  edit: ProductDistributorEditView,
  create: ProductDistributorCreateView,
  show: ProductDistributorShowView,
  icon: Package,
  options: { label: "DOT Numbers" },
};

export default productDistributorsConfig;
```

### index.tsx (Barrel Exports)

```tsx
// src/atomic-crm/productDistributors/index.tsx
export { default } from "./productDistributorsConfig";
export {
  ProductDistributorList,
  ProductDistributorEdit,
  ProductDistributorCreate,
  ProductDistributorShow,
} from "./resource";
export { ProductDistributorInputs } from "./ProductDistributorInputs";
```

**Key points:**
- `React.lazy()` enables code splitting per view
- `React.Suspense` wraps each lazy component with `<Loading />` fallback
- `ResourceErrorBoundary` catches render errors with recovery UI
- `options.label` overrides default pluralization for better UX
- Resource config is in a separate `productDistributorsConfig.ts` for react-refresh compatibility
- `ProductDistributorShowView` provides a read-only detail page

**When to use**: All resources, not just junction tables.

---

## Pattern Comparison: Junction vs Direct Relationship

| Aspect | Junction Table (Many-to-Many) | Direct FK (One-to-Many) |
|--------|-------------------------------|-------------------------|
| **ID Format** | Composite (`{fk1}-{fk2}`) | Single integer |
| **Create: FK Fields** | Two required, both editable | One required, editable |
| **Edit: FK Fields** | Both immutable (read-only) | Usually editable |
| **List Columns** | Two `ReferenceField` columns | One `ReferenceField` column |
| **Zod Schema** | Create/Update split (FK omit on update) | Same schema for both |
| **Example** | Product ↔ Distributor | Contact → Organization |
| **Attributes** | Often has extra fields | Usually just the FK |

---

## Status Constants Pattern

Type-safe status choices for SelectInput/SelectField.

```tsx
// src/atomic-crm/productDistributors/constants.ts

export const PRODUCT_DISTRIBUTOR_STATUS_CHOICES = [
  { id: "pending", name: "Pending" },
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
] as const;

export type ProductDistributorStatus = "pending" | "active" | "inactive";
```

**Key points:**
- `as const` enables type inference for literal values
- Export type separately for use in interfaces
- `id` + `name` format matches React Admin choice structure

---

## Anti-Patterns

### 1. Editable FKs on Edit Form

```tsx
// ❌ WRONG: Allows changing relationship endpoints
<ReferenceInput source="product_id" reference="products">
  <AutocompleteInput optionText="name" />
</ReferenceInput>

// ✅ CORRECT: Read-only display
<ReferenceField source="product_id" reference="products">
  <TextField source="name" />
</ReferenceField>
```

**Why it's wrong**: Changing FKs creates orphan records or duplicates. If user wants a different product-distributor link, they should delete and recreate.

### 2. Missing Type Filter on Organization References

```tsx
// ❌ WRONG: Shows ALL organizations
<ReferenceInput source="distributor_id" reference="organizations">
  <AutocompleteInput optionText="name" />
</ReferenceInput>

// ✅ CORRECT: Filter to distributors only
<ReferenceInput source="distributor_id" reference="organizations">
  <AutocompleteInput
    optionText="name"
    filterToQuery={(q) => ({ "name@ilike": `%${q}%`, organization_type: "distributor" })}
  />
</ReferenceInput>
```

**Why it's wrong**: Users see principals, operators, etc. when only distributors are valid.

### 3. String IDs Without Composite Helpers

```tsx
// ❌ WRONG: Manual string concatenation without validation
const id = `${product_id}_${distributor_id}`;  // No validation
const [p, d] = id.split('_');  // Fragile, no error handling

// ✅ CORRECT: Use typed helper functions with hyphen delimiter
import { parseCompositeId, createCompositeId } from './services/productDistributors.service';
const id = createCompositeId(product_id, distributor_id);  // Returns "123-456"
const { product_id, distributor_id } = parseCompositeId(id);
```

**Why it's wrong**: No type safety, no error handling, inconsistent with service layer delimiter standard (hyphen).

### 4. Form-Level Validation

```tsx
// ❌ WRONG: Validation in form component
const validate = (values) => {
  const errors = {};
  if (!values.product_id) errors.product_id = 'Required';
  return errors;
};

// ✅ CORRECT: Zod validation at API boundary (unifiedDataProvider)
export const createProductDistributorSchema = productDistributorSchema.required({
  product_id: true,
  distributor_id: true,
});
```

**Why it's wrong**: Violates single-validation-at-API-boundary principle. Duplicates logic.

---

## File Reference

| File | Purpose | Key Patterns |
|------|---------|--------------|
| `resource.tsx` | Lazy loading + error boundary + Suspense wrappers | E |
| `productDistributorsConfig.ts` | React Admin resource config (separate for react-refresh) | E |
| `index.tsx` | Barrel exports | E |
| `ProductDistributorList.tsx` | List view with UnifiedListPageLayout + PremiumDatagrid | D |
| `ProductDistributorCreate.tsx` | Create form with editable FK references | B1, C |
| `ProductDistributorEdit.tsx` | Edit form with read-only FK display | B2, C |
| `ProductDistributorShow.tsx` | Read-only detail view | E |
| `ProductDistributorInputs.tsx` | Shared attribute inputs (DOT#, status, dates, notes) | C3 |
| `ProductDistributorListFilter.tsx` | Sidebar filter UI (status toggles) | D1 |
| `productDistributorFilterConfig.ts` | Filter metadata for FilterChipBar | D1 |
| `constants.ts` | Status choices and type | - |

---

## Migration Checklist

When creating a new junction table UI:

### Database Layer
- [ ] Create migration with composite PK: `PRIMARY KEY (fk1_id, fk2_id)`
- [ ] Add `ON DELETE CASCADE` or `RESTRICT` per business rules
- [ ] Add attribute columns (status, dates, notes)
- [ ] Enable RLS with appropriate policies

### Validation Layer
- [ ] Create Zod schema in `src/atomic-crm/validation/`
- [ ] Add composite ID helpers (`parseCompositeId`, `createCompositeId`)
- [ ] Create separate create/update schemas (FKs omitted on update)
- [ ] Export form defaults: `schema.partial().parse({})`

### Constants
- [ ] Add status choices to `constants.ts` with `as const`
- [ ] Export status type

### UI Components
- [ ] Create `List.tsx` with `UnifiedListPageLayout` + `PremiumDatagrid` and denormalized columns
- [ ] Create `Create.tsx` with editable `ReferenceInput` + `getAutocompleteProps`/`getQSearchAutocompleteProps`
- [ ] Create `Edit.tsx` with read-only `ReferenceField` displays
- [ ] Create `Show.tsx` for read-only detail view
- [ ] Create shared `Inputs.tsx` with `DateInput`, `SelectInput`, `TextInput`
- [ ] Add `FormErrorSummary` with field labels
- [ ] Create `ListFilter.tsx` with `FilterSidebar` + `ToggleFilterButton`
- [ ] Create `filterConfig.ts` with `validateFilterConfig()`

### Resource Configuration
- [ ] Create `resource.tsx` with lazy loading + `React.Suspense fallback={<Loading />}`
- [ ] Wrap each view with `ResourceErrorBoundary`
- [ ] Create separate config file (`*Config.ts`) for react-refresh compatibility
- [ ] Configure icon and label in config export

### Registration
- [ ] Register resource in App.tsx resources array
- [ ] Add menu item if needed
