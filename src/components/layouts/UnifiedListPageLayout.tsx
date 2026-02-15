import { useMemo, type ReactNode } from "react";
import { useListContext } from "ra-core";
import { StandardListLayout } from "./StandardListLayout";
import type { ChipFilterConfig } from "@/atomic-crm/filters/filterConfigSchema";
import { useFilterCleanup } from "@/atomic-crm/hooks/useFilterCleanup";
import { ListNoResults } from "@/components/ra-wrappers/ListNoResults";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { BulkActionsToolbar } from "@/components/ra-wrappers/bulk-actions-toolbar";

/**
 * System filter keys excluded from empty-state detection.
 *
 * NOTE: 'q' (search) is NOT excluded -- a search with no results should show
 * filteredEmptyState, not emptyState. This is intentionally different from
 * FilterSidebarContext.SYSTEM_FILTER_KEYS which includes 'q'.
 */
const EMPTY_STATE_SYSTEM_KEYS = new Set(["deleted_at", "deleted_at@is", "$or"]);

interface UnifiedListPageLayoutProps {
  // -- StandardListLayout pass-through --
  resource: string;
  /** Required when showFilterSidebar=true (default). Optional when showFilterSidebar=false. */
  filterComponent?: ReactNode;
  filterConfig?: ChipFilterConfig[];
  searchPlaceholder?: string;
  enableRecentSearches?: boolean;
  sortFields?: string[];
  viewSwitcher?: ReactNode;
  overflowActions?: ReactNode;
  showFilterToggle?: boolean;
  showFilterSidebar?: boolean;
  storageKey?: string;
  wrapMainInCard?: boolean;
  /** Primary action slot (e.g., Create button) - passed through to StandardListLayout/ListToolbar */
  primaryAction?: ReactNode;

  // -- Empty-state contract --
  /** Renders when data is empty AND no user filters applied. Replaces children entirely. */
  emptyState?: ReactNode;
  /** Renders when data is empty AND user filters ARE applied. Defaults to <ListNoResults />. */
  filteredEmptyState?: ReactNode;
  /** Renders during isPending. Defaults to generic <ListSkeleton />. */
  loadingSkeleton?: ReactNode;

  // -- Content --
  children: ReactNode;

  // -- Bulk actions --
  /** Button content only (e.g., <BulkDeleteButton />). Wrapped by shared BulkActionsToolbar. */
  bulkActions?: ReactNode;
}

/**
 * UnifiedListPageLayout - Standardized list page wrapper
 *
 * Wraps StandardListLayout with centralized empty-state branching,
 * loading states, filter cleanup, and bulk actions. Eliminates
 * per-feature duplication of these patterns.
 *
 * State branching order: loading > empty-no-filters > empty-with-filters > data
 *
 * @example
 * ```tsx
 * <UnifiedListPageLayout
 *   resource="products"
 *   filterComponent={<ProductListFilter />}
 *   filterConfig={PRODUCT_FILTER_CONFIG}
 *   sortFields={["name", "category", "status"]}
 *   searchPlaceholder="Search products..."
 *   emptyState={<ProductEmpty />}
 *   loadingSkeleton={<ProductListSkeleton />}
 *   bulkActions={<BulkActionsToolbarChildren />}
 * >
 *   <ProductDatagrid />
 * </UnifiedListPageLayout>
 * ```
 */
export function UnifiedListPageLayout({
  resource,
  filterComponent,
  filterConfig,
  searchPlaceholder,
  enableRecentSearches,
  sortFields,
  viewSwitcher,
  overflowActions,
  showFilterToggle,
  showFilterSidebar,
  storageKey,
  wrapMainInCard,
  primaryAction,
  emptyState,
  filteredEmptyState,
  loadingSkeleton,
  children,
  bulkActions,
}: UnifiedListPageLayoutProps) {
  // Absorbs useFilterCleanup from individual features
  useFilterCleanup(resource);

  const { data, isPending, filterValues } = useListContext();

  // Auto-derive: when no filter sidebar, disable filter toggle button too
  const effectiveShowFilterToggle = showFilterSidebar === false ? false : showFilterToggle;

  // Determine if user has active filters (for empty-state branching)
  const hasUserFilters = useMemo(() => {
    if (!filterValues) return false;
    return Object.keys(filterValues).some((key) => !EMPTY_STATE_SYSTEM_KEYS.has(key));
  }, [filterValues]);

  // State branching: loading > empty-no-filters > empty-with-filters > data
  const renderContent = () => {
    if (isPending) {
      return loadingSkeleton ?? <ListSkeleton />;
    }

    if (!data?.length) {
      if (hasUserFilters) {
        return filteredEmptyState ?? <ListNoResults />;
      }
      if (emptyState) {
        return emptyState;
      }
    }

    return children;
  };

  return (
    <>
      <StandardListLayout
        resource={resource}
        filterComponent={filterComponent ?? <></>}
        filterConfig={filterConfig}
        searchPlaceholder={searchPlaceholder}
        enableRecentSearches={enableRecentSearches}
        sortFields={sortFields}
        viewSwitcher={viewSwitcher}
        overflowActions={overflowActions}
        showFilterToggle={effectiveShowFilterToggle}
        showFilterSidebar={showFilterSidebar}
        storageKey={storageKey}
        wrapMainInCard={wrapMainInCard}
        primaryAction={primaryAction}
      >
        {renderContent()}
      </StandardListLayout>
      {bulkActions && <BulkActionsToolbar>{bulkActions}</BulkActionsToolbar>}
    </>
  );
}
