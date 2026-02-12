import { useGetIdentity, useListContext } from "ra-core";
import { FunctionField } from "react-admin";
import { List } from "@/components/ra-wrappers/list";
import { TextField } from "@/components/ra-wrappers/text-field";
import { FloatingCreateButton } from "@/components/ra-wrappers/FloatingCreateButton";
import { BulkActionsToolbar } from "@/components/ra-wrappers/bulk-actions-toolbar";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { ProductListSkeleton } from "@/components/ui/list-skeleton";
import { TopToolbar } from "../layout/TopToolbar";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ListSearchBar } from "@/components/ra-wrappers/ListSearchBar";
import { Badge } from "@/components/ui/badge";
import { ucFirst } from "@/atomic-crm/utils";
import { COLUMN_VISIBILITY } from "../utils/listPatterns";
import { ProductListFilter } from "./ProductListFilter";
import { ProductSlideOver } from "./ProductSlideOver";
import { ProductEmpty } from "./ProductEmpty";
import { PRODUCT_FILTER_CONFIG } from "./productFilterConfig";
import { PageTutorialTrigger } from "../tutorial";
import { FilterableBadge } from "@/components/ra-wrappers/FilterableBadge";
import {
  ProductNameHeader,
  ProductCategoryHeader,
  ProductStatusHeader,
} from "./ProductsDatagridHeader";
import { SortButton } from "@/components/ra-wrappers/sort-button";
import { ExportButton } from "@/components/ra-wrappers/export-button";
import type { Product } from "../types";

/**
 * ProductList - Standard list page for Product records
 *
 * Follows ContactList reference pattern:
 * - Identity-aware rendering with skeleton loading
 * - Keyboard navigation with slide-over integration
 * - BulkActionsToolbar for selection operations
 * - Responsive columns using COLUMN_VISIBILITY semantic presets
 */
export const ProductList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  useFilterCleanup("products");

  if (isIdentityPending) {
    return <ProductListSkeleton />;
  }
  if (!identity) {
    return null;
  }

  return (
    <>
      <div data-tutorial="products-list">
        <List
          title={false}
          actions={<ProductListActions />}
          perPage={25}
          sort={{ field: "name", order: "ASC" }}
        >
          <ProductListLayout openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          <FloatingCreateButton />
        </List>
      </div>
      <ProductSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
      <PageTutorialTrigger chapter="products" position="bottom-left" />
    </>
  );
};

/**
 * ProductListLayout - Handles loading, empty states, and datagrid rendering
 */
const ProductListLayout = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { data, isPending, filterValues } = useListContext();

  // Keyboard navigation for list rows
  // Disabled when slide-over is open to prevent conflicts
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Show skeleton during initial load
  if (isPending) {
    return (
      <StandardListLayout resource="products" filterComponent={<ProductListFilter />}>
        <ProductListSkeleton />
      </StandardListLayout>
    );
  }

  if (!data?.length && !hasFilters) {
    return <ProductEmpty />;
  }

  return (
    <>
      <StandardListLayout resource="products" filterComponent={<ProductListFilter />}>
        <ListSearchBar placeholder="Search products..." filterConfig={PRODUCT_FILTER_CONFIG} />
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

          {/* Column 4: Principal - From summary view (sortable) - hidden on tablet/mobile */}
          <TextField
            source="principal_name"
            label="Principal"
            sortable
            sortBy="principal_name"
            {...COLUMN_VISIBILITY.desktopOnly}
          />

          {/* Column 5: Certifications - Badges list (non-sortable) - hidden on tablet/mobile */}
          <FunctionField
            label="Certifications"
            sortable={false}
            render={(record: Product) => (
              <CertificationBadges certifications={record.certifications} />
            )}
            {...COLUMN_VISIBILITY.desktopOnly}
          />
        </PremiumDatagrid>
      </StandardListLayout>
      <BulkActionsToolbar />
    </>
  );
};

/**
 * ProductListActions - TopToolbar with sort and export actions
 *
 * Follows ContactList reference pattern with SortButton + ExportButton.
 */
const ProductListActions = () => (
  <TopToolbar>
    <SortButton
      fields={["name", "category", "status", "created_at"]}
      data-testid="product-sort-btn"
    />
    <ExportButton data-testid="product-export-btn" />
  </TopToolbar>
);

/**
 * CategoryBadge - Display product category with proper formatting
 */
function CategoryBadge({ category }: { category: string }) {
  return <Badge variant="outline">{formatSnakeCase(category)}</Badge>;
}

/**
 * StatusBadge - Display product status with semantic colors
 */
function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";

  switch (status) {
    case "active":
      variant = "default";
      break;
    case "discontinued":
      variant = "destructive";
      break;
    case "coming_soon":
      variant = "secondary";
      break;
    default:
      variant = "outline";
  }

  return <Badge variant={variant}>{formatSnakeCase(status)}</Badge>;
}

/**
 * CertificationBadges - Display up to 3 certifications with overflow indicator
 */
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

/**
 * Format snake_case string to Title Case
 */
function formatSnakeCase(value: string): string {
  return value
    .split("_")
    .map((word) => ucFirst(word))
    .join(" ");
}

export default ProductList;
