# Product Feature Patterns

Standard patterns for product management in Crispy CRM.

## Component Hierarchy

```
ProductList (page container)
    ↓
List + StandardListLayout + PremiumDatagrid
    ↓
[ProductSlideOver ↔ ProductDetailsTab / ProductRelationshipsTab]
    ↓
[ProductCard ↔ ProductListFilter ↔ ListSearchBar]
    ↓
ProductCreate / ProductEdit (full-page forms)
    ↓
ProductInputs → ProductDetailsInputTab + ProductDistributionTab
    ↓
ProductFormTutorial (onboarding overlay)
```

### Data Flow

```
User Interaction
    ↓
useListContext() / useSlideOverState()
    ↓
unifiedDataProvider (Supabase)
    ↓
Zod validation at API boundary
    ↓
React Admin state (filterValues, selectedIds)
```

---

## Pattern A: Datagrid with Filterable Columns

List view using `PremiumDatagrid` with click-to-filter badges and responsive column visibility.

```tsx
import { FunctionField } from "react-admin";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { TextField } from "@/components/ra-wrappers/text-field";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { FilterableBadge } from "@/components/ra-wrappers/FilterableBadge";
import { COLUMN_VISIBILITY } from "../utils/listPatterns";
import { ProductNameHeader, ProductCategoryHeader, ProductStatusHeader } from "./ProductsDatagridHeader";

<PremiumDatagrid
  onRowClick={(id) => openSlideOver(Number(id), "view")}
  focusedIndex={focusedIndex}
>
  {/* Column 1: Product Name - Primary identifier (sortable) - always visible */}
  <TextField
    source="name"
    label={<ProductNameHeader />}
    sortable
    {...COLUMN_VISIBILITY.alwaysVisible}
  />

  {/* Column 2: Category - Classification badge (sortable) - always visible */}
  <FunctionField
    label={<ProductCategoryHeader />}
    sortBy="category"
    render={(record: Product) => (
      <FilterableBadge source="category" value={record.category}>
        <CategoryBadge category={record.category} />
      </FilterableBadge>
    )}
    {...COLUMN_VISIBILITY.alwaysVisible}
  />

  {/* Column 3: Status - Lifecycle badge (sortable) - always visible */}
  <FunctionField
    label={<ProductStatusHeader />}
    sortBy="status"
    render={(record: Product) => (
      <FilterableBadge source="status" value={record.status}>
        <StatusBadge status={record.status} />
      </FilterableBadge>
    )}
    {...COLUMN_VISIBILITY.alwaysVisible}
  />

  {/* Column 4: Principal - hidden on tablet/mobile */}
  <ReferenceField
    source="principal_id"
    reference="organizations"
    label="Principal"
    link={false}
    sortable
    {...COLUMN_VISIBILITY.desktopOnly}
  >
    <TextField source="name" />
  </ReferenceField>
</PremiumDatagrid>
```

**When to use**: Any list page that needs sortable columns with inline filtering.

**Key points:**
- Use `COLUMN_VISIBILITY.alwaysVisible` for critical columns, `desktopOnly` for supplementary
- Wrap badges in `FilterableBadge` for click-to-filter functionality
- Custom headers (e.g., `ProductNameHeader`) enable column-level text/checkbox filters
- `focusedIndex` from `useListKeyboardNavigation()` enables keyboard navigation

**Example:** `src/atomic-crm/products/ProductList.tsx`

---

## Pattern B: Relationships Tab (Read-Only)

Display related records from junction tables with proper context providers.

```tsx
import { RecordContextProvider, useGetList } from "ra-core";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { TextField } from "@/components/ra-wrappers/text-field";
import { AsideSection } from "@/components/ui";
import { SectionCard } from "@/components/ra-wrappers/section-card";

export function ProductRelationshipsTab({ record }: ProductRelationshipsTabProps) {
  // Fetch opportunities that include this product
  const { data: opportunityProducts, isLoading } = useGetList(
    "opportunity_products",
    {
      filter: { product_id_reference: record.id },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "created_at", order: "DESC" },
    }
  );

  return (
    <RecordContextProvider value={record}>
      <div className="space-y-6">
        {/* Principal Organization */}
        {record.principal_id && (
          <AsideSection title="Principal/Supplier">
            <SectionCard>
              <div className="p-4">
                <ReferenceField source="principal_id" reference="organizations" link="show">
                  <TextField source="name" className="font-medium" />
                </ReferenceField>
              </div>
            </SectionCard>
          </AsideSection>
        )}

        {/* Related Opportunities */}
        <AsideSection title="Related Opportunities">
          <SectionCard>
            <div className="p-4">
              {isLoading && (
                <div className="text-sm text-muted-foreground">Loading opportunities...</div>
              )}

              {!isLoading && (!opportunityProducts || opportunityProducts.length === 0) && (
                <div className="text-sm text-muted-foreground">
                  No opportunities using this product yet.
                </div>
              )}

              {!isLoading && opportunityProducts && opportunityProducts.length > 0 && (
                <div className="space-y-2">
                  {opportunityProducts.map((oppProduct) => (
                    <div key={oppProduct.id} className="border-b border-border pb-2 last:border-0">
                      <RecordContextProvider value={oppProduct}>
                        <ReferenceField source="opportunity_id" reference="opportunities" link="show">
                          <TextField source="title" className="text-sm font-medium" />
                        </ReferenceField>
                      </RecordContextProvider>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </AsideSection>
      </div>
    </RecordContextProvider>
  );
}
```

**When to use**: Displaying related data that shouldn't be edited in this context.

**Key points:**
- Wrap entire tab in `RecordContextProvider` for field access
- Use nested `RecordContextProvider` for junction table records
- Always implement loading and empty states
- Use `link="show"` for clickable relationship navigation

**Example:** `src/atomic-crm/products/ProductRelationshipsTab.tsx`

---

## Pattern C: Dynamic Input Fields with useWatch

Generate form inputs based on selected values (e.g., distributor-specific DOT numbers).

```tsx
import { useWatch } from "react-hook-form";
import { useGetList } from "react-admin";
import { ReferenceArrayInput } from "@/components/ra-wrappers/reference-array-input";
import { AutocompleteArrayInput } from "@/components/ra-wrappers/autocomplete-array-input";
import { TextInput } from "@/components/ra-wrappers/text-input";

export function ProductDistributorInput() {
  // Watch selected distributor IDs for changes (isolated re-renders)
  const selectedIds = useWatch({ name: "distributor_ids" }) || [];

  // Fetch distributor details only when needed
  const { data: distributors } = useGetList(
    "organizations",
    {
      filter: { id: selectedIds, organization_type: "distributor" },
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: selectedIds.length > 0 }  // Conditional fetching
  );

  return (
    <div className="space-y-4">
      <ReferenceArrayInput
        source="distributor_ids"
        reference="organizations"
        filter={{ organization_type: "distributor" }}
      >
        <AutocompleteArrayInput
          optionText="name"
          label="Distributors"
          placeholder="Select distributors..."
          filterToQuery={(q) => ({
            "name@ilike": `%${q}%`,
            organization_type: "distributor",
          })}
        />
      </ReferenceArrayInput>

      {/* Dynamic inputs for each selected distributor */}
      {selectedIds.length > 0 && distributors && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          <p className="text-sm text-muted-foreground">
            Enter DOT numbers for each distributor:
          </p>
          {distributors
            .filter((d) => selectedIds.includes(d.id))
            .map((distributor) => (
              <div key={distributor.id} className="flex items-center gap-4">
                <span className="text-sm font-medium min-w-[150px] truncate">
                  {distributor.name}
                </span>
                <TextInput
                  source={`product_distributors.${distributor.id}.vendor_item_number`}
                  label=""
                  placeholder="e.g., USF# 4587291"
                  className="flex-1"
                  helperText={false}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
```

**When to use**: Forms where child inputs depend on parent selections.

**Key points:**
- Use `useWatch()` (NOT `watch()`) for isolated re-renders
- Use `enabled: condition` for conditional data fetching
- Dynamic source paths: `parent.${id}.field` for nested form state
- Visual grouping with `border-l-2 border-muted` shows sub-form relationship

**Example:** `src/atomic-crm/products/ProductDistributorInput.tsx`

---

## Pattern D: Form Tutorial with Driver.js

Progressive disclosure tutorial for multi-tab forms using data attributes.

```tsx
import { useRef, useCallback } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { AdminButton } from "@/components/ra-wrappers/admin-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FORM_TUTORIAL_STEPS: DriveStep[] = [
  {
    popover: {
      title: "Create a Product",
      description: "Let's add a new product. Required fields are marked with *.",
    },
  },
  {
    element: '[data-tutorial="product-tab-general"]',
    popover: {
      title: "General Information",
      description: "This tab contains basic product details.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-name"]',
    popover: {
      title: "Product Name *",
      description: "Enter the product name. This is how it will appear in searches.",
      side: "right",
      align: "start",
    },
  },
  // ... additional steps for each form field
  {
    element: '[data-tutorial="product-save-btn"]',
    popover: {
      title: "Create Product",
      description: "Click to save the product.",
      side: "top",
      align: "end",
    },
  },
];

export function ProductFormTutorial() {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const startTutorial = useCallback(() => {
    // Clean up any existing instance
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    driverRef.current = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      overlayOpacity: 0.75,
      popoverClass: "tutorial-popover",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      steps: FORM_TUTORIAL_STEPS,
      onDestroyStarted: () => {
        driverRef.current?.destroy();
        driverRef.current = null;
      },
    });

    driverRef.current.drive();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <AdminButton
            variant="default"
            size="icon"
            onClick={startTutorial}
            className="h-11 w-11 rounded-full shadow-lg"
            aria-label="Start product form tutorial"
          >
            <HelpCircle className="h-5 w-5" />
          </AdminButton>
        </TooltipTrigger>
        <TooltipContent side="right">Learn how to create a product</TooltipContent>
      </Tooltip>
    </div>
  );
}
```

**When to use**: Complex multi-step forms that benefit from guided onboarding.

**Key points:**
- Mark form elements with `data-tutorial="field-name"` attributes
- Fixed position button at `bottom-4 left-4 z-50` for consistent access
- Touch target: `h-11 w-11` (44x44px minimum)
- Clean up driver instance to prevent memory leaks
- Steps guide users through tabs sequentially

**Example:** `src/atomic-crm/products/ProductFormTutorial.tsx`

---

## Pattern E: Card View with Selection

Card component supporting bulk selection via checkbox overlay.

```tsx
import { Package, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreatePath, useRecordContext, useListContext } from "ra-core";
import { formatDistanceToNow } from "date-fns";
import { SectionCard } from "@/components/ra-wrappers/section-card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const ProductCard = (props: { record?: Product }) => {
  const createPath = useCreatePath();
  const record = useRecordContext<Product>(props);
  const { selectedIds, onToggleItem } = useListContext();
  if (!record) return null;

  const statusColors: Record<string, BadgeVariant> = {
    active: "default",
    discontinued: "destructive",
    coming_soon: "secondary",
  };

  return (
    <div className="relative">
      {/* Checkbox positioned absolutely in top-left corner */}
      <Checkbox
        checked={selectedIds.includes(record.id)}
        onCheckedChange={() => onToggleItem(record.id)}
        aria-label={`Select ${record.name}`}
        className="absolute top-2 left-2 z-10"
        onClick={(e) => e.stopPropagation()}  // Prevent link navigation
      />

      <Link
        to={createPath({ resource: "products", id: record.id, type: "show" })}
        className="no-underline group"
      >
        <SectionCard className="h-[200px] flex flex-col justify-between p-4 hover:shadow-md transition-shadow motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-medium line-clamp-1">{record.name}</h3>
            <div className="flex gap-1 mt-1 justify-center flex-wrap">
              {record.status && (
                <Badge variant={statusColors[record.status]}>
                  {record.status.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </div>
        </SectionCard>
      </Link>
    </div>
  );
};
```

**When to use**: Grid layouts with visual cards instead of table rows.

**Key points:**
- Relative container with absolute checkbox prevents layout shift
- `onClick={(e) => e.stopPropagation()}` prevents link navigation on checkbox
- `useListContext()` provides `selectedIds` and `onToggleItem` from React Admin
- `motion-safe:hover:scale-[1.01]` respects reduced-motion preferences
- Fixed height `h-[200px]` ensures grid alignment

**Example:** `src/atomic-crm/products/ProductCard.tsx`

---

## Pattern F: Bulk Operations Toolbar

Integration of `BulkActionsToolbar` with list selection state.

```tsx
import { List } from "@/components/ra-wrappers/list";
import { BulkActionsToolbar } from "@/components/ra-wrappers/bulk-actions-toolbar";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";

export const ProductList = () => {
  return (
    <>
      <List title={false} perPage={25} sort={{ field: "name", order: "ASC" }}>
        <StandardListLayout resource="products" filterComponent={<ProductListFilter />}>
          <ListSearchBar placeholder="Search products..." filterConfig={PRODUCT_FILTER_CONFIG} />
          <PremiumDatagrid onRowClick={(id) => openSlideOver(Number(id), "view")}>
            {/* ... columns ... */}
          </PremiumDatagrid>
        </StandardListLayout>
      </List>
      {/* BulkActionsToolbar renders when selectedIds.length > 0 */}
      <BulkActionsToolbar />
    </>
  );
};
```

**When to use**: Any list page where users need to act on multiple records.

**Key points:**
- Place `BulkActionsToolbar` AFTER the `List` component (not inside)
- Selection state managed by `useListContext()` → `selectedIds`
- Toolbar appears automatically when rows are selected
- Works with both datagrid checkboxes and card checkboxes

**Example:** `src/atomic-crm/products/ProductList.tsx`

---

## Pattern G: Filter Configuration and Sidebar

Structured filter configuration with cached dynamic options.

### Filter Config Schema

```tsx
import { validateFilterConfig } from "../filters/filterConfigSchema";

const PRODUCT_STATUS_CHOICES = [
  { id: "active", name: "Active" },
  { id: "discontinued", name: "Discontinued" },
  { id: "coming_soon", name: "Coming Soon" },
];

export const PRODUCT_FILTER_CONFIG = validateFilterConfig([
  {
    key: "status",
    label: "Status",
    type: "select",
    choices: PRODUCT_STATUS_CHOICES,
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    reference: "categories",
  },
  {
    key: "principal_id",
    label: "Principal",
    type: "reference",
    reference: "organizations",
  },
]);
```

### Sidebar Filter Component

```tsx
import { Building2 } from "lucide-react";
import { useGetList } from "ra-core";
import { ToggleFilterButton } from "@/components/ra-wrappers/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";

export const ProductListFilter = () => {
  // Fetch principal organizations with caching
  const { data: principals } = useGetList<Organization>(
    "organizations",
    {
      filter: { organization_type: "principal" },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
    },
    {
      staleTime: 5 * 60 * 1000,      // Cache for 5 minutes
      gcTime: 15 * 60 * 1000,        // Keep in memory for 15 minutes
      refetchOnWindowFocus: false,   // Don't refetch on tab focus
    }
  );

  return (
    <div className="flex flex-col gap-4">
      {principals && principals.length > 0 && (
        <FilterCategory icon={<Building2 className="h-4 w-4" />} label="Principal/Supplier">
          {principals.map((principal) => (
            <ToggleFilterButton
              key={principal.id}
              className="w-full justify-between"
              label={principal.name}
              value={{ principal_id: principal.id }}
            />
          ))}
        </FilterCategory>
      )}
    </div>
  );
};
```

**When to use**: List pages with sidebar filters and search bar chip display.

**Key points:**
- `validateFilterConfig()` provides type safety for filter definitions
- `FilterCategory` groups related filters with icon
- `ToggleFilterButton` adds/removes filter value on click
- Cache options prevent unnecessary refetches for stable data
- Filter config feeds into `ListSearchBar` for chip display

**Example:** `src/atomic-crm/products/productFilterConfig.ts`, `src/atomic-crm/products/ProductListFilter.tsx`

---

## Pattern H: Slide-Over with Tabbed Interface

Side panel with view/edit mode toggle and multiple content tabs.

### Slide-Over Container

```tsx
import { PackageIcon, Link2Icon } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { ProductDetailsTab } from "./ProductDetailsTab";
import { ProductRelationshipsTab } from "./ProductRelationshipsTab";

export function ProductSlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: ProductSlideOverProps) {
  const tabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: ProductDetailsTab,
      icon: PackageIcon,
    },
    {
      key: "relationships",
      label: "Relationships",
      component: ProductRelationshipsTab,
      icon: Link2Icon,
    },
  ];

  const recordRepresentation = (record: { id: number | string; name?: string }) => {
    return record.name || `Product #${record.id}`;
  };

  return (
    <ResourceSlideOver
      resource="products"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
    />
  );
}
```

### Details Tab with View/Edit Toggle

```tsx
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidepaneSection, SidepaneMetadata, DirtyStateTracker } from "@/components/layouts/sidepane";

export function ProductDetailsTab({ record, mode, onModeToggle, onDirtyChange }: ProductDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();

  const handleSave = async (data: Partial<Product>) => {
    try {
      await update("products", { id: record.id, data, previousData: record });
      notify("Product updated successfully", { type: "success" });
      onModeToggle?.();  // Return to view mode
    } catch (error) {
      notify("Error updating product", { type: "error" });
    }
  };

  if (mode === "edit") {
    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <DirtyStateTracker onDirtyChange={onDirtyChange} />
          <div className="space-y-6">
            <TextInput source="name" label="Product Name" />
            <SelectInput source="status" label="Status" choices={productStatuses} />
            {/* ... more fields ... */}
          </div>
        </Form>
      </RecordContextProvider>
    );
  }

  // View mode
  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4">
          <SidepaneSection label="Product">
            <h3 className="text-lg font-semibold">{record.name}</h3>
            <Badge variant="outline">{record.category}</Badge>
          </SidepaneSection>

          <SidepaneSection label="Principal/Supplier" variant="list" showSeparator>
            <ReferenceField source="principal_id" reference="organizations" link="show">
              <TextField source="name" className="font-medium" />
            </ReferenceField>
          </SidepaneSection>

          <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
```

**When to use**: Quick record viewing/editing without leaving the list page.

**Key points:**
- `TabConfig[]` structure: `key`, `label`, `component`, `icon`
- `DirtyStateTracker` reports unsaved changes to parent
- `onModeToggle?.()` after successful save returns to view mode
- `SidepaneSection` with `variant="list"` for relationship cards
- `SidepaneMetadata` displays created/updated timestamps

**Example:** `src/atomic-crm/products/ProductSlideOver.tsx`, `src/atomic-crm/products/ProductDetailsTab.tsx`

---

## View Comparison

| Aspect | Card View (Pattern E) | List View (Pattern A) | Slide-Over (Pattern H) |
|--------|----------------------|----------------------|------------------------|
| **Best for** | Visual browsing, grid layouts | Data-dense scanning | Quick view/edit |
| **Selection** | Checkbox overlay | Row checkbox | N/A (single record) |
| **Navigation** | Click card → show page | Click row → slide-over | Tabs within panel |
| **Filtering** | Via sidebar only | Column headers + sidebar | N/A |
| **Mobile** | Stacks vertically | Responsive columns | Full-screen on mobile |
| **Keyboard** | Limited | Full navigation | ESC to close |

---

## Anti-Patterns

### 1. Orphaned Relationships
```tsx
// BAD: Creating product without required principal
await create("products", { data: { name: "Test", category: "beverages" } });

// GOOD: Always include required relationships
await create("products", {
  data: { name: "Test", category: "beverages", principal_id: principalId }
});
```

### 2. Missing Zod Validation
```tsx
// BAD: Form-level validation only
<TextInput source="name" validate={required()} />

// GOOD: Zod validation at API boundary in data provider
// Form just displays fields; validation happens in unifiedDataProvider
<TextInput source="name" />
```

### 3. Direct Supabase Imports
```tsx
// BAD: Bypassing data provider
import { supabase } from "@/lib/supabase";
const { data } = await supabase.from("products").select("*");

// GOOD: Use React Admin hooks
const { data } = useGetList("products", { pagination: { page: 1, perPage: 100 } });
```

### 4. watch() vs useWatch()
```tsx
// BAD: Causes entire form to re-render on any change
const values = watch();

// GOOD: Isolated re-renders for specific fields
const selectedIds = useWatch({ name: "distributor_ids" });
```

### 5. Hardcoded Colors
```tsx
// BAD: Raw hex values
<Badge className="bg-green-600 text-white">Active</Badge>

// GOOD: Semantic color tokens
<Badge variant="default">Active</Badge>
```

### 6. Missing Touch Targets
```tsx
// BAD: Too small for touch
<AdminButton size="sm" className="h-8 w-8">...</AdminButton>

// GOOD: 44x44px minimum
<AdminButton size="icon" className="h-11 w-11">...</AdminButton>
```

---

## Pattern I: Lazy Loading with Error Boundaries

Resource pages wrapped in lazy loading and error boundaries for resilient UX.

```tsx
import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ProductListLazy = React.lazy(() => import("./ProductList"));
const ProductCreateLazy = React.lazy(() => import("./ProductCreate"));
const ProductEditLazy = React.lazy(() => import("./ProductEdit"));

// Wrap lazy components with resource-specific error boundaries
export const ProductListView = () => (
  <ResourceErrorBoundary resource="products" page="list">
    <ProductListLazy />
  </ResourceErrorBoundary>
);

export const ProductCreateView = () => (
  <ResourceErrorBoundary resource="products" page="create">
    <ProductCreateLazy />
  </ResourceErrorBoundary>
);

export default {
  list: ProductListView,
  create: ProductCreateView,
  edit: ProductEditView,
  show: ProductShowView,
  recordRepresentation: (record: { name?: string }) => record?.name || "Product",
};
```

**When to use**: All resource entry points to improve bundle splitting and error recovery.

**Key points:**
- `React.lazy()` enables code splitting per-route
- `ResourceErrorBoundary` catches errors per-page, not globally
- `recordRepresentation` provides display name fallback for breadcrumbs
- Each page fails independently without crashing the entire app

**Example:** `src/atomic-crm/products/resource.tsx`

---

## Pattern J: Query Key Factory for Cache Invalidation

Centralized cache key management ensures fetch and invalidation keys always match.

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { productKeys } from "../queryKeys";

const ProductEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      redirect="show"
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          // Invalidate products cache on save
          queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
      }}
    >
      <ProductEditForm />
    </EditBase>
  );
};
```

**Query Key Factory Pattern:**
```tsx
// src/atomic-crm/queryKeys.ts
const createKeys = <T extends string>(resource: T) => ({
  all: [resource] as const,
  lists: () => [resource, "list"] as const,
  list: (filters?: Record<string, unknown>) => [resource, "list", filters] as const,
  details: () => [resource, "detail"] as const,
  detail: (id: number | string) => [resource, "detail", id] as const,
});

export const productKeys = createKeys("products");
```

**When to use**: Any mutation that should refresh related queries.

**Key points:**
- `productKeys.all` invalidates all product queries (list and detail)
- `productKeys.detail(123)` targets specific record cache
- Prevents stale data after create/update/delete operations
- Factory ensures consistent key structure across resources

**Example:** `src/atomic-crm/products/ProductEdit.tsx`, `src/atomic-crm/queryKeys.ts`

---

## Pattern K: Filter Cleanup Hook

Clean up stale localStorage filter values that may cause errors.

```tsx
import { useFilterCleanup } from "../hooks/useFilterCleanup";

export const ProductList = () => {
  // Clean up stale cached filters from localStorage
  useFilterCleanup("products");

  return (
    <List title={false} perPage={25} sort={{ field: "name", order: "ASC" }}>
      {/* ... */}
    </List>
  );
};
```

**When to use**: List pages using React Admin's filter persistence.

**Key points:**
- Removes invalid filter values cached in localStorage
- Prevents crashes from outdated filter references (e.g., deleted organizations)
- Call early in component lifecycle before List renders
- Pass resource name to target the correct localStorage key

**Example:** `src/atomic-crm/products/ProductList.tsx`

---

## Pattern L: Certifications Badge with Overflow

Display array fields with visual truncation and count indicator.

```tsx
function CertificationBadges({ certifications }: { certifications?: string[] }) {
  if (!certifications || certifications.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {certifications.slice(0, 3).map((cert, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {cert}
        </Badge>
      ))}
      {certifications.length > 3 && (
        <Badge variant="secondary" className="text-xs">
          +{certifications.length - 3}
        </Badge>
      )}
    </div>
  );
}
```

**When to use**: Displaying variable-length arrays in constrained column space.

**Key points:**
- `slice(0, 3)` shows first 3 items only
- `+N` badge indicates overflow count
- Empty state shows em-dash for visual consistency
- `flex-wrap` handles responsive layout within cells

**Example:** `src/atomic-crm/products/ProductList.tsx`

---

## Pattern M: Distributor Code Display

View mode section for displaying multiple vendor item codes in a grid layout.

```tsx
const DISTRIBUTOR_CODE_LABELS: Record<string, string> = {
  usf_code: "US Foods",
  sysco_code: "Sysco",
  gfs_code: "GFS",
  pfg_code: "PFG",
  greco_code: "Greco",
  gofo_code: "GOFO",
  rdp_code: "RDP",
  wilkens_code: "Wilkens",
};

function hasDistributorCodes(record: Record<string, unknown>): boolean {
  return Object.keys(DISTRIBUTOR_CODE_LABELS).some((key) => record[key as keyof typeof record]);
}

// In view mode:
{hasDistributorCodes(record) && (
  <SidepaneSection label="Distributor Codes" showSeparator>
    <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-md">
      {Object.entries(DISTRIBUTOR_CODE_LABELS).map(([field, label]) => {
        const value = record[field as keyof typeof record];
        if (!value) return null;
        return (
          <div key={field} className="flex justify-between">
            <span className="text-sm text-muted-foreground">{label}:</span>
            <span className="text-sm font-mono">{value}</span>
          </div>
        );
      })}
    </div>
  </SidepaneSection>
)}
```

**When to use**: Displaying multiple optional vendor-specific codes.

**Key points:**
- Section only renders if at least one code exists (`hasDistributorCodes` guard)
- Label mapping provides human-readable names for code fields
- `font-mono` for code values improves readability
- Grid layout pairs labels with values cleanly

**Example:** `src/atomic-crm/products/ProductDetailsTab.tsx`

---

## Pattern N: Form Remount on Record Change

Force form re-initialization when switching between records in edit mode.

```tsx
const ProductEditForm = () => {
  const record = useRecordContext<Product>();
  const { data: identity } = useGetIdentity();

  const defaultValues = useMemo(
    () => ({
      ...productUpdateSchema.partial().parse(record ?? {}),
      updated_by: identity?.id,
    }),
    [record, identity?.id]
  );

  if (!record) return null;

  return (
    <Form
      defaultValues={defaultValues}
      key={record.id}  // Force remount when record changes
    >
      <ProductInputs />
    </Form>
  );
};
```

**When to use**: Edit forms where record can change without navigation.

**Key points:**
- `key={record.id}` forces React to unmount/remount the form
- Ensures `defaultValues` are re-applied from new record
- Without this, form retains previous record's values
- `useMemo` prevents unnecessary recalculation of defaults

**Example:** `src/atomic-crm/products/ProductEdit.tsx`

---

## Migration Checklist

When adding a new product feature or migrating from another pattern:

1. [ ] Check for existing patterns in `ContactList`, `OpportunityList`, `OrganizationList`
2. [ ] Use `COLUMN_VISIBILITY.alwaysVisible` / `desktopOnly` for responsive columns
3. [ ] Wrap badge columns in `FilterableBadge` for click-to-filter
4. [ ] Add `data-tutorial` attributes to form fields for onboarding
5. [ ] Use `RecordContextProvider` for nested component contexts
6. [ ] Implement loading states (`isPending` checks) and empty states
7. [ ] Add keyboard navigation via `useListKeyboardNavigation()`
8. [ ] Verify touch targets are 44x44px minimum (`h-11 w-11`)
9. [ ] Use semantic color tokens (never raw hex values)
10. [ ] Test with `useWatch()` instead of `watch()` for form subscriptions
11. [ ] Ensure Zod validation is at API boundary, not in form components
12. [ ] Cache stable reference data with `staleTime` and `gcTime` options
13. [ ] Wrap resource views in `ResourceErrorBoundary` with lazy loading (Pattern I)
14. [ ] Use query key factory for cache invalidation after mutations (Pattern J)
15. [ ] Add `useFilterCleanup()` to list pages with filter persistence (Pattern K)
16. [ ] Use `key={record.id}` on forms to force remount on record change (Pattern N)
