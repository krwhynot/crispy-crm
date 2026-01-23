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

// Parse "123_456" → { product_id: 123, distributor_id: 456 }
export const parseCompositeId = (id: string): { product_id: number; distributor_id: number } => {
  const [product_id, distributor_id] = id.split('_').map(Number);
  if (isNaN(product_id) || isNaN(distributor_id)) {
    throw new Error(`Invalid composite ID format: ${id}. Expected format: product_id_distributor_id`);
  }
  return { product_id, distributor_id };
};

// Create string ID from two FKs
export const createCompositeId = (product_id: number, distributor_id: number): string => {
  return `${product_id}_${distributor_id}`;
};
```

**When to use**: Any junction table CRUD operations in the data provider.

---

## Pattern B: Foreign Key Handling (Create vs Edit)

Foreign keys are **editable during Create** but **read-only during Edit**. You can't change a relationship's endpoints after creation—only its attributes.

### B1: Editable FKs (Create Form)

Use `ReferenceInput` + `AutocompleteInput` for searchable foreign key selection.

```tsx
// src/atomic-crm/productDistributors/ProductDistributorCreate.tsx

<ReferenceInput source="product_id" reference="products" isRequired>
  <AutocompleteInput
    optionText="name"
    label="Product *"
    filterToQuery={(q) => ({ "name@ilike": `%${q}%` })}
    helperText="Select the product"
  />
</ReferenceInput>

<ReferenceInput source="distributor_id" reference="organizations" isRequired>
  <AutocompleteInput
    optionText="name"
    label="Distributor *"
    filterToQuery={(q) => ({ "name@ilike": `%${q}%`, organization_type: "distributor" })}
    helperText="Select the distributor"
  />
</ReferenceInput>
```

**Key points:**
- `filterToQuery` enables server-side search with PostgREST syntax
- **Filter by type**: `organization_type: "distributor"` narrows organizations to only distributors
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

### C3: Attribute Fields

```tsx
// src/atomic-crm/productDistributors/ProductDistributorCreate.tsx

<TextInput
  source="vendor_item_number"
  label="DOT Number (Vendor Item #)"
  helperText="e.g., USF# 4587291, Sysco# 1092847"
  fullWidth
/>

<SelectInput
  source="status"
  label="Status"
  choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES}
  helperText={false}
/>

<TextInput source="valid_from" label="Valid From" type="date" helperText={false} />

<TextInput source="valid_to" label="Valid To" type="date" helperText="Leave empty if ongoing" />

<TextInput
  source="notes"
  label="Notes"
  multiline
  rows={3}
  fullWidth
  helperText={false}
/>
```

**When to use**: Any junction table with relationship attributes beyond just the two FKs.

---

## Pattern D: Junction List View

Display both linked entities with filters for each FK.

### D1: Dual Reference Filters

```tsx
// src/atomic-crm/productDistributors/ProductDistributorList.tsx

const productDistributorFilters = [
  <TextInput
    key="vendor_item_number"
    source="vendor_item_number@ilike"
    label="DOT Number"
    alwaysOn
    placeholder="Search DOT numbers..."
  />,
  <SelectInput
    key="status"
    source="status"
    label="Status"
    choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES}
    emptyText="All statuses"
  />,
  <ReferenceInput key="product_id" source="product_id" reference="products">
    <AutocompleteInput
      optionText="name"
      label="Product"
      filterToQuery={(q) => ({ "name@ilike": `%${q}%` })}
    />
  </ReferenceInput>,
  <ReferenceInput key="distributor_id" source="distributor_id" reference="organizations">
    <AutocompleteInput
      optionText="name"
      label="Distributor"
      filterToQuery={(q) => ({ "name@ilike": `%${q}%`, organization_type: "distributor" })}
    />
  </ReferenceInput>,
];
```

### D2: Datagrid with Reference Columns

```tsx
// src/atomic-crm/productDistributors/ProductDistributorList.tsx

export const ProductDistributorList = () => (
  <List
    filters={productDistributorFilters}
    sort={{ field: "created_at", order: "DESC" }}
    perPage={25}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="product_id" reference="products" label="Product">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField source="distributor_id" reference="organizations" label="Distributor">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="vendor_item_number" label="DOT Number" />
      <SelectField source="status" choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES} />
      <DateField source="valid_from" label="Valid From" />
      <DateField source="valid_to" label="Valid To" emptyText="-" />
    </Datagrid>
  </List>
);
```

**Key points:**
- `bulkActionButtons={false}` — Bulk delete on junction tables is risky
- Both FK columns use `ReferenceField` to resolve names
- `emptyText="-"` for nullable dates provides clear empty state

**When to use**: Any junction table list view.

---

## Pattern E: Resource Configuration

Lazy loading with error boundaries for junction table resources.

```tsx
// src/atomic-crm/productDistributors/resource.tsx

import * as React from "react";
import { Package } from "lucide-react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ProductDistributorListLazy = React.lazy(() => import("./ProductDistributorList"));
const ProductDistributorEditLazy = React.lazy(() => import("./ProductDistributorEdit"));
const ProductDistributorCreateLazy = React.lazy(() => import("./ProductDistributorCreate"));

export const ProductDistributorListView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="list">
    <ProductDistributorListLazy />
  </ResourceErrorBoundary>
);

export const ProductDistributorCreateView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="create">
    <ProductDistributorCreateLazy />
  </ResourceErrorBoundary>
);

export const ProductDistributorEditView = () => (
  <ResourceErrorBoundary resource="product_distributors" page="edit">
    <ProductDistributorEditLazy />
  </ResourceErrorBoundary>
);

const productDistributors = {
  list: ProductDistributorListView,
  edit: ProductDistributorEditView,
  create: ProductDistributorCreateView,
  icon: Package,
  options: { label: "DOT Numbers" },
};

export default productDistributors;
```

**Key points:**
- `React.lazy()` enables code splitting per view
- `ResourceErrorBoundary` catches render errors with recovery UI
- `options.label` overrides default pluralization for better UX

**When to use**: All resources, not just junction tables.

---

## Pattern Comparison: Junction vs Direct Relationship

| Aspect | Junction Table (Many-to-Many) | Direct FK (One-to-Many) |
|--------|-------------------------------|-------------------------|
| **ID Format** | Composite (`{fk1}_{fk2}`) | Single integer |
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
// ❌ WRONG: Manual string concatenation with hyphen (incorrect delimiter)
const id = `${product_id}-${distributor_id}`;
const [p, d] = id.split('-'); // Fragile, no validation, wrong delimiter

// ✅ CORRECT: Use typed helper functions with underscore delimiter
import { parseCompositeId, createCompositeId } from './services/productDistributors.service';
const id = createCompositeId(product_id, distributor_id);  // Returns "123_456"
const { product_id, distributor_id } = parseCompositeId(id);
```

**Why it's wrong**: Inconsistent delimiter (underscore is standard, not hyphen), no type safety, no error handling.

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
- [ ] Create `List.tsx` with two `ReferenceField` columns and filters
- [ ] Create `Create.tsx` with two editable `ReferenceInput` fields
- [ ] Create `Edit.tsx` with two read-only `ReferenceField` displays
- [ ] Add `FormErrorSummary` with field labels

### Resource Configuration
- [ ] Create `resource.tsx` with lazy loading
- [ ] Wrap each view with `ResourceErrorBoundary`
- [ ] Configure icon and label in default export

### Registration
- [ ] Register resource in App.tsx resources array
- [ ] Add menu item if needed
