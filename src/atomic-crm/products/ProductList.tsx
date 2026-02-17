import { useGetIdentity } from "ra-core";
import { FunctionField } from "react-admin";
import { List } from "@/components/ra-wrappers/list";
import { TextField } from "@/components/ra-wrappers/text-field";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { BulkActionsToolbarChildren } from "@/components/ra-wrappers/bulk-actions-toolbar";
import { UnifiedListPageLayout } from "@/components/layouts/UnifiedListPageLayout";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { RowHoverActions } from "@/components/ra-wrappers/RowHoverActions";
import { ProductListSkeleton } from "@/components/ui/list-skeleton";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { ExportMenuItem } from "@/components/ra-wrappers/export-menu-item";
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
import type { Product } from "../types";

/**
 * ProductList - Standard list page for Product records
 *
 * Uses UnifiedListPageLayout for centralized empty-state branching,
 * loading states, filter cleanup, and bulk actions.
 *
 * Features:
 * - Identity-aware rendering with skeleton loading
 * - Keyboard navigation with slide-over integration
 * - BulkActionsToolbar for selection operations
 * - Responsive columns using COLUMN_VISIBILITY semantic presets
 */
export const ProductList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  if (isIdentityPending) {
    return <ProductListSkeleton />;
  }
  if (!identity) {
    return null;
  }

  return (
    <>
      <div data-tutorial="products-list">
        <List title={false} actions={false} perPage={25} sort={{ field: "name", order: "ASC" }}>
          <UnifiedListPageLayout
            resource="products"
            filterComponent={<ProductListFilter />}
            filterConfig={PRODUCT_FILTER_CONFIG}
            sortFields={["name", "category", "status", "created_at"]}
            searchPlaceholder="Search products..."
            overflowActions={<ExportMenuItem />}
            primaryAction={<CreateButton variant="default" />}
            emptyState={<ProductEmpty />}
            loadingSkeleton={<ProductListSkeleton />}
            bulkActions={<BulkActionsToolbarChildren />}
          >
            <ProductDatagrid openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          </UnifiedListPageLayout>
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
 * ProductDatagrid - Keyboard-navigable datagrid with slide-over integration
 */
const ProductDatagrid = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  return (
    <PremiumDatagrid
      onRowClick={(id) => openSlideOver(Number(id), "view")}
      focusedIndex={focusedIndex}
    >
      {/* Column 1: Product Name - Primary identifier (sortable) - always visible */}
      <TextField
        source="name"
        label={<ProductNameHeader />}
        sortable
        className="text-[15px] font-semibold leading-tight"
        {...COLUMN_VISIBILITY.always}
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
        {...COLUMN_VISIBILITY.always}
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
        {...COLUMN_VISIBILITY.always}
      />

      {/* Column 4: Principal - From summary view (sortable) - hidden on tablet/mobile */}
      <TextField
        source="principal_name"
        label="Principal"
        sortable
        sortBy="principal_name"
        {...COLUMN_VISIBILITY.ipadPlus}
      />

      {/* Column 5: Certifications - Badges list (non-sortable) - hidden on tablet/mobile */}
      <FunctionField
        label="Certifications"
        sortable={false}
        render={(record: Product) => <CertificationBadges certifications={record.certifications} />}
        {...COLUMN_VISIBILITY.ipadPlus}
      />

      <FunctionField
        label="Actions"
        sortable={false}
        cellClassName="w-[72px] sm:w-[88px] text-right"
        render={(record: Product) => (
          <RowHoverActions
            className="inline-flex items-center justify-end gap-1"
            recordId={record.id}
            resource="products"
            onView={(id) => openSlideOver(Number(id), "view")}
            onEdit={(id) => openSlideOver(Number(id), "edit")}
          />
        )}
      />
    </PremiumDatagrid>
  );
};

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
  const variantByStatus: Record<
    string,
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "status-cold"
    | "status-active"
    | "status-discontinued"
  > = {
    cold: "status-cold",
    active: "status-active",
    discontinued: "status-discontinued",
    coming_soon: "secondary",
  };

  return <Badge variant={variantByStatus[status] ?? "outline"}>{formatSnakeCase(status)}</Badge>;
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
