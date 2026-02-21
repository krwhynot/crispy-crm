import type { ReactNode } from "react";
import type { ChipFilterConfig } from "@/atomic-crm/filters/filterConfigSchema";
import { ListPageLayout } from "./ListPageLayout";

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
  /** Default filter values to restore on "Clear all" (e.g., { disabled: false } for Sales) */
  defaultFilters?: Record<string, unknown>;
  showPageTitle?: boolean;

  // -- Content --
  children: ReactNode;

  // -- Bulk actions --
  /** Button content only (e.g., <BulkDeleteButton />). Wrapped by shared BulkActionsToolbar. */
  bulkActions?: ReactNode;
}

/**
 * UnifiedListPageLayout - Standardized list page wrapper
 *
 * @deprecated Use `ListPageLayout` for new list pages.
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
  defaultFilters,
  showPageTitle,
  children,
  bulkActions,
}: UnifiedListPageLayoutProps) {
  return (
    <ListPageLayout
      resource={resource}
      filterComponent={filterComponent}
      filterConfig={filterConfig}
      searchPlaceholder={searchPlaceholder}
      enableRecentSearches={enableRecentSearches}
      sortFields={sortFields}
      viewSwitcher={viewSwitcher}
      overflowActions={overflowActions}
      showFilterToggle={showFilterToggle}
      showFilterSidebar={showFilterSidebar}
      storageKey={storageKey}
      wrapMainInCard={wrapMainInCard}
      primaryAction={primaryAction}
      emptyState={emptyState}
      filteredEmptyState={filteredEmptyState}
      loadingSkeleton={loadingSkeleton}
      defaultFilters={defaultFilters}
      showPageTitle={showPageTitle}
      bulkActions={bulkActions}
    >
      {children}
    </ListPageLayout>
  );
}
