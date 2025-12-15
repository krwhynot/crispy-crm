import { useGetIdentity, useListContext } from "ra-core";
import { FunctionField } from "react-admin";
import { List } from "@/components/admin/list";
import { TextField } from "@/components/admin/text-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { CreateButton } from "@/components/admin/create-button";
import { SortButton } from "@/components/admin/sort-button";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { ProductListSkeleton } from "@/components/ui/list-skeleton";
import { TopToolbar } from "../layout/TopToolbar";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { FilterChipBar } from "../filters";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package } from "lucide-react";
import { COLUMN_VISIBILITY } from "../utils/listPatterns";
import { ProductListFilter } from "./ProductListFilter";
import { ProductSlideOver } from "./ProductSlideOver";
import { ProductEmpty } from "./ProductEmpty";
import { PRODUCT_FILTER_CONFIG } from "./productFilterConfig";
import { PageTutorialTrigger } from "../tutorial";

const DISTRIBUTOR_CODE_LABELS: Record<string, string> = {
  usf_code: "USF",
  sysco_code: "Sysco",
  gfs_code: "GFS",
  pfg_code: "PFG",
  greco_code: "Greco",
  gofo_code: "GOFO",
  rdp_code: "RDP",
  wilkens_code: "Wilkens",
};

function hasDistributorCodes(record: any): boolean {
  return Object.keys(DISTRIBUTOR_CODE_LABELS).some(
    (field) => record[field]
  );
}

function DistributorCodesPopover({ record }: { record: any }) {
  if (!hasDistributorCodes(record)) {
    return <span className="text-muted-foreground">—</span>;
  }

  const codes = Object.entries(DISTRIBUTOR_CODE_LABELS)
    .filter(([field]) => record[field])
    .map(([field, label]) => ({ label, value: record[field] }));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-primary hover:text-primary/80">
          <Package className="h-4 w-4" />
          <span className="text-xs">{codes.length} codes</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Distributor Codes</h4>
          <div className="space-y-1">
            {codes.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
        <FilterChipBar filterConfig={PRODUCT_FILTER_CONFIG} />
        <PremiumDatagrid
          onRowClick={(id) => openSlideOver(Number(id), "view")}
          focusedIndex={focusedIndex}
        >
          {/* Column 1: Product Name - Primary identifier (sortable) - always visible */}
          <TextField source="name" label="Product Name" {...COLUMN_VISIBILITY.alwaysVisible} />

          {/* Column 2: Distributor Codes - Popover display (non-sortable) - always visible */}
          <FunctionField
            label="Dist. Codes"
            sortable={false}
            render={(record: any) => <DistributorCodesPopover record={record} />}
            {...COLUMN_VISIBILITY.alwaysVisible}
          />

          {/* Column 3: Category - Classification badge (sortable) - always visible */}
          <FunctionField
            label="Category"
            sortBy="category"
            render={(record: any) => <CategoryBadge category={record.category} />}
            {...COLUMN_VISIBILITY.alwaysVisible}
          />

          {/* Column 4: Status - Lifecycle badge (sortable) - always visible */}
          <FunctionField
            label="Status"
            sortBy="status"
            render={(record: any) => <StatusBadge status={record.status} />}
            {...COLUMN_VISIBILITY.alwaysVisible}
          />

          {/* Column 5: Principal - Organization reference (sortable) - hidden on tablet/mobile */}
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

          {/* Column 6: Certifications - Badges list (non-sortable) - hidden on tablet/mobile */}
          <FunctionField
            label="Certifications"
            sortable={false}
            render={(record: any) => <CertificationBadges certifications={record.certifications} />}
            {...COLUMN_VISIBILITY.desktopOnly}
          />
        </PremiumDatagrid>
      </StandardListLayout>
      <BulkActionsToolbar />
    </>
  );
};

/**
 * ProductListActions - TopToolbar with sort and create actions
 */
const ProductListActions = () => (
  <TopToolbar>
    <SortButton fields={["name", "category", "status"]} />
    <span data-tutorial="create-product-btn">
      <CreateButton />
    </span>
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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default ProductList;
