import { useContext, useMemo, type ReactNode } from "react";
import { ListContext, useListContext } from "ra-core";

function useSafeListContext() {
  try {
    return useListContext();
  } catch {
    return null;
  }
}
import { FilterChipBar } from "@/atomic-crm/filters/FilterChipBar";
import type { ChipFilterConfig } from "@/atomic-crm/filters/filterConfigSchema";
import { useFilterCleanup } from "@/atomic-crm/hooks/useFilterCleanup";
import { ListNoResults } from "@/components/ra-wrappers/ListNoResults";
import { BulkActionsToolbar } from "@/components/ra-wrappers/bulk-actions-toolbar";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { cn } from "@/lib/utils";
import { AdaptiveFilterContainer } from "./AdaptiveFilterContainer";
import { FilterSidebarProvider, useFilterSidebarContext } from "./FilterSidebarContext";
import { ListPageHeader } from "./ListPageHeader";
import { ListToolbar } from "./ListToolbar";
import { hasActiveUserFiltersWithOrSource } from "./listFilterSemantics";

export interface ListPageLayoutProps {
  resource: string;
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
  primaryAction?: ReactNode;
  emptyState?: ReactNode;
  filteredEmptyState?: ReactNode;
  loadingSkeleton?: ReactNode;
  /** Default filter values to restore on "Clear all" (e.g., { disabled: false } for Sales) */
  defaultFilters?: Record<string, unknown>;
  showPageTitle?: boolean;
  children: ReactNode;
  bulkActions?: ReactNode;
}

export function ListPageLayout({
  resource,
  filterComponent,
  filterConfig,
  searchPlaceholder,
  enableRecentSearches,
  sortFields,
  viewSwitcher,
  overflowActions,
  showFilterToggle,
  showFilterSidebar = true,
  storageKey,
  wrapMainInCard = true,
  primaryAction,
  emptyState,
  filteredEmptyState,
  loadingSkeleton,
  defaultFilters,
  showPageTitle,
  children,
  bulkActions,
}: ListPageLayoutProps) {
  useFilterCleanup(resource);

  return (
    <FilterSidebarProvider storageKey={storageKey}>
      <ListPageLayoutContent
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
        wrapMainInCard={wrapMainInCard}
        primaryAction={primaryAction}
        emptyState={emptyState}
        filteredEmptyState={filteredEmptyState}
        loadingSkeleton={loadingSkeleton}
        defaultFilters={defaultFilters}
        showPageTitle={showPageTitle}
        children={children}
        bulkActions={bulkActions}
      />
    </FilterSidebarProvider>
  );
}

function ListPageLayoutContent({
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
  wrapMainInCard,
  primaryAction,
  emptyState,
  filteredEmptyState,
  loadingSkeleton,
  defaultFilters,
  showPageTitle,
  children,
  bulkActions,
}: ListPageLayoutProps) {
  const contextFromProvider = useContext(ListContext);
  const listContext = useSafeListContext() ?? contextFromProvider;
  const data = listContext?.data;
  const isPending = listContext?.isPending ?? false;
  const filterValues = listContext?.filterValues;
  const { isCollapsed, orSource } = useFilterSidebarContext();
  const hasUserFilters = useMemo(
    () => hasActiveUserFiltersWithOrSource(filterValues, orSource),
    [filterValues, orSource]
  );
  const hasListContext = Boolean(listContext);

  const content = renderListContent({
    hasListContext,
    isPending,
    hasUserFilters,
    hasData: Boolean(data?.length),
    loadingSkeleton,
    emptyState,
    filteredEmptyState,
    children,
  });

  const shouldRenderSidebar = showFilterSidebar && Boolean(filterComponent);
  const shouldRenderFilterToggle = shouldRenderSidebar ? showFilterToggle : false;

  const gridClass = shouldRenderSidebar
    ? isCollapsed
      ? "xl:grid xl:grid-cols-[var(--list-sidebar-collapsed-width)_1fr] xl:grid-rows-[minmax(0,1fr)]"
      : "xl:grid xl:grid-cols-[var(--list-sidebar-width)_1fr] xl:grid-rows-[minmax(0,1fr)]"
    : undefined;

  return (
    <div
      className={cn(
        "list-page-shell",
        gridClass,
        shouldRenderSidebar && "transition-[grid-template-columns] duration-200 ease-out"
      )}
    >
      {shouldRenderSidebar && filterComponent && (
        <AdaptiveFilterContainer
          filterComponent={filterComponent}
          resource={resource}
          defaultFilters={defaultFilters}
        />
      )}

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {hasListContext && showPageTitle !== false && (
          <ListPageHeader resource={resource} total={listContext?.total} isPending={isPending} />
        )}

        {hasListContext && filterConfig && filterConfig.length > 0 && (
          <div className="shrink-0">
            <FilterChipBar filterConfig={filterConfig} />
          </div>
        )}

        {hasListContext && sortFields && sortFields.length > 0 && (
          <ListToolbar
            sortFields={sortFields}
            searchPlaceholder={searchPlaceholder}
            enableRecentSearches={enableRecentSearches}
            viewSwitcher={viewSwitcher}
            overflowActions={overflowActions}
            showFilterToggle={shouldRenderFilterToggle}
            resource={resource}
            primaryAction={primaryAction}
            defaultFilters={defaultFilters}
          />
        )}

        {bulkActions && hasListContext && (
          <div className="shrink-0">
            <BulkActionsToolbar>{bulkActions}</BulkActionsToolbar>
          </div>
        )}

        <main
          aria-label={`${resource} list`}
          className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          {wrapMainInCard ? (
            <div className="card-container list-page-main-card flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
              {content}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
              {content}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function renderListContent({
  hasListContext,
  isPending,
  hasUserFilters,
  hasData,
  loadingSkeleton,
  emptyState,
  filteredEmptyState,
  children,
}: {
  hasListContext: boolean;
  isPending: boolean;
  hasUserFilters: boolean;
  hasData: boolean;
  loadingSkeleton?: ReactNode;
  emptyState?: ReactNode;
  filteredEmptyState?: ReactNode;
  children: ReactNode;
}): ReactNode {
  if (!hasListContext) {
    return children;
  }

  if (isPending) {
    return loadingSkeleton ?? <ListSkeleton />;
  }

  if (!hasData) {
    if (hasUserFilters) {
      return filteredEmptyState ?? <ListNoResults />;
    }

    if (emptyState) {
      return emptyState;
    }
  }

  return children;
}
