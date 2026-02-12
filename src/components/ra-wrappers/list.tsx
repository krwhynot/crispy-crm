import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/ra-wrappers/breadcrumb";
import type { ListBaseProps, RaRecord } from "ra-core";
import {
  ListBase,
  type ListControllerResult,
  Translate,
  useGetResourceLabel,
  useHasDashboard,
  useListContext,
  useResourceContext,
  useResourceDefinition,
} from "ra-core";
import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FilterContext } from "ra-core";
import type { FilterElementProps } from "@/components/ra-wrappers/filter-types";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { ExportButton } from "@/components/ra-wrappers/export-button";
import { ListPagination } from "@/components/ra-wrappers/list-pagination";
import { FilterForm } from "@/components/ra-wrappers/filter-form";
import { ListNoResults } from "@/components/ra-wrappers/ListNoResults";

export const List = <RecordType extends RaRecord = RaRecord>(props: ListProps<RecordType>) => {
  const {
    debounce,
    disableAuthentication,
    disableSyncWithLocation,
    exporter,
    filter,
    filterDefaultValues,
    loading,
    perPage,
    queryOptions,
    resource,
    sort,
    storeKey,
    ...rest
  } = props;

  return (
    <ListBase<RecordType>
      debounce={debounce}
      disableAuthentication={disableAuthentication}
      disableSyncWithLocation={disableSyncWithLocation}
      exporter={exporter}
      filter={filter}
      filterDefaultValues={filterDefaultValues}
      loading={loading}
      perPage={perPage}
      queryOptions={queryOptions}
      resource={resource}
      sort={sort}
      storeKey={storeKey}
    >
      <ListView<RecordType> {...rest} />
    </ListBase>
  );
};

export interface ListProps<RecordType extends RaRecord = RaRecord>
  extends ListBaseProps<RecordType>, ListViewProps<RecordType> {}

/**
 * ListView - Fixed page layout with scrollable list content
 *
 * Implements the fixed-page/scrollable-list pattern for iPad optimization:
 * - Header (breadcrumb, toolbar) stays fixed at top
 * - List content scrolls within a constrained container
 * - Pagination stays fixed at bottom
 *
 * Height calculation: 100dvh - 140px accounts for:
 * - Header: ~56px (logo h-8 + py-3 padding)
 * - Layout padding: 16px top + 64px bottom (pb-16 for footer clearance)
 * - Safety margin: ~4px
 *
 * Using `dvh` (dynamic viewport height) for Safari mobile/iPad where
 * the address bar affects viewport height dynamically.
 */
export const ListView = <RecordType extends RaRecord = RaRecord>(
  props: ListViewProps<RecordType>
) => {
  const { filters, pagination = defaultPagination, children, actions, empty } = props;
  const resource = useResourceContext();
  if (!resource) {
    throw new Error("The ListView component must be used within a ResourceContextProvider");
  }
  const getResourceLabel = useGetResourceLabel();
  const resourceLabel = getResourceLabel(resource, 2);
  const { hasCreate } = useResourceDefinition({ resource });
  const hasDashboard = useHasDashboard();
  const { data, isPending, filterValues } = useListContext();

  return (
    <div className="flex h-[calc(100dvh-140px)] flex-col overflow-hidden">
      {/* Fixed header area - breadcrumb + toolbar */}
      <div className="shrink-0">
        <Breadcrumb>
          {hasDashboard && (
            <BreadcrumbItem>
              <Link to="/">
                <Translate i18nKey="ra.page.dashboard">Home</Translate>
              </Link>
            </BreadcrumbItem>
          )}
          <BreadcrumbPage>{resourceLabel}</BreadcrumbPage>
        </Breadcrumb>

        <FilterContext.Provider value={filters}>
          <div className="flex justify-between items-center flex-wrap gap-2 my-2">
            <FilterForm />
            {actions ?? (
              <div className="flex items-center gap-2">
                {hasCreate ? <CreateButton /> : null}
                {<ExportButton />}
              </div>
            )}
          </div>
        </FilterContext.Provider>
      </div>

      {/* Content area - scrolls vertically for paginated lists, fills height for kanban */}
      <FilterContext.Provider value={filters}>
        <div
          className={cn(
            "h-full min-h-0 flex-1 overflow-hidden",
            // Only add vertical scroll when pagination exists (standard Datagrid lists)
            // When pagination={null} (e.g., Kanban), let content fill remaining height
            pagination && "overflow-y-auto",
            props.className
          )}
        >
          {!isPending && data?.length === 0 ? renderEmptyState(filterValues, empty) : children}
        </div>

        {/* Fixed pagination at bottom - only render if pagination is provided */}
        {pagination && (
          <div className="shrink-0 border-t border-border bg-background py-2">{pagination}</div>
        )}
      </FilterContext.Provider>
    </div>
  );
};

const defaultPagination = <ListPagination />;

function renderEmptyState(
  filterValues: Record<string, unknown> | undefined,
  empty: ReactElement | undefined
): ReactNode {
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;
  if (hasFilters) {
    return <ListNoResults />;
  }
  if (empty) {
    return empty;
  }
  return <ListNoResults />;
}

export interface ListViewProps<RecordType extends RaRecord = RaRecord> {
  children?: ReactNode;
  render?: (props: ListControllerResult<RecordType, Error>) => ReactNode;
  actions?: ReactElement | false;
  empty?: ReactElement;
  filters?: ReactElement<FilterElementProps>[];
  pagination?: ReactNode;
  title?: ReactNode | string | false;
  className?: string;
}

export type FiltersType = ReactElement<FilterElementProps> | ReactElement<FilterElementProps>[];
