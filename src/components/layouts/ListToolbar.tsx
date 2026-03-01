import { useEffect, type ReactNode } from "react";
import { ArrowUpDown, EllipsisVertical, SlidersHorizontal, X } from "lucide-react";
import { useListContext, useListSortContext, useTranslate, useTranslateLabel } from "ra-core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSearchBar } from "@/components/ra-wrappers/ListSearchBar";
import { SortButton } from "@/components/ra-wrappers/sort-button";
import { useFilterSidebarContext, useOptionalFilterSidebarContext } from "./FilterSidebarContext";
import { resetListFilters } from "./listFilterReset";
import { useListHasDockedFilters } from "./useListViewport";

export interface ListToolbarProps {
  /** Sortable field names passed to SortButton */
  sortFields: string[];
  /** Search input placeholder text */
  searchPlaceholder?: string;
  /** Enable recent searches dropdown */
  enableRecentSearches?: boolean;
  /** Show search bar (default: true) */
  showSearch?: boolean;
  /** View switcher slot (e.g., OrganizationViewSwitcher) */
  viewSwitcher?: ReactNode;
  /** DropdownMenuItem children for the kebab overflow menu (e.g., ExportMenuItem) */
  overflowActions?: ReactNode;
  /** Show filter toggle button (default: true) */
  showFilterToggle?: boolean;
  /** Resource name for ARIA labels */
  resource?: string;
  /** Primary action slot (e.g., CreateButton) */
  primaryAction?: ReactNode;
  /** Default filter values to restore on "Clear all" */
  defaultFilters?: Record<string, unknown>;
  /** data-tutorial ID for the SortButton */
  sortButtonTutorialId?: string;
  /** data-tutorial ID for the overflow menu wrapper */
  overflowMenuTutorialId?: string;
  /** data-tutorial ID for the filter toggle button */
  filterToggleTutorialId?: string;
}

/**
 * ListToolbar - Unified toolbar row for list pages.
 *
 * Responsive behavior:
 * - <768: search full row, sort inside overflow menu only
 * - 768-1023: search full row, sort+view+create on second row
 * - >=1024: single row — search flexible, sort+view+create on right
 */
export function ListToolbar({
  sortFields,
  searchPlaceholder,
  enableRecentSearches,
  showSearch = true,
  viewSwitcher,
  overflowActions,
  showFilterToggle = true,
  resource,
  primaryAction,
  defaultFilters,
  sortButtonTutorialId,
  overflowMenuTutorialId,
  filterToggleTutorialId,
}: ListToolbarProps) {
  const { setHasToolbar } = useFilterSidebarContext();

  useEffect(() => {
    setHasToolbar(true);
    return () => setHasToolbar(false);
  }, [setHasToolbar]);

  const showOverflowOnDesktop = Boolean(overflowActions);

  return (
    <div
      role="toolbar"
      aria-label={resource ? `${resource} list toolbar` : "List toolbar"}
      className="list-toolbar"
    >
      <div className="order-1 basis-full min-w-0 lg:basis-auto lg:flex-1 lg:min-w-[200px] lg:max-w-xl">
        <div className="flex items-center gap-2">
          {showSearch && (
            <ListSearchBar
              placeholder={searchPlaceholder}
              enableRecentSearches={enableRecentSearches}
            />
          )}
          {showFilterToggle && <FilterToggleButton dataTutorial={filterToggleTutorialId} />}
          <ActiveFilterPill defaultFilters={defaultFilters} />
        </div>
      </div>

      <div className="order-2 ml-auto flex shrink-0 items-center gap-2">
        <div className="hidden shrink-0 md:block">
          <SortButton fields={sortFields} className="h-11" dataTutorial={sortButtonTutorialId} />
        </div>
        {viewSwitcher && <div className="shrink-0">{viewSwitcher}</div>}
        {primaryAction && <div className="shrink-0">{primaryAction}</div>}
        <div
          className={showOverflowOnDesktop ? "shrink-0" : "shrink-0 md:hidden"}
          data-tutorial={overflowMenuTutorialId}
        >
          <OverflowMenu sortFields={sortFields} overflowActions={overflowActions} />
        </div>
      </div>
    </div>
  );
}

function FilterToggleButton({ dataTutorial }: { dataTutorial?: string }) {
  const { isCollapsed, toggleSidebar, isSheetOpen, setSheetOpen, activeFilterCount } =
    useFilterSidebarContext();
  const hasDockedFilters = useListHasDockedFilters();

  const handleClick = () => {
    if (hasDockedFilters) {
      toggleSidebar();
      return;
    }
    setSheetOpen(true);
  };

  const isExpanded = hasDockedFilters ? !isCollapsed : isSheetOpen;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="relative h-[var(--list-toolbar-control-height-mobile)] px-3"
          aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
          aria-expanded={isExpanded}
          aria-controls="filter-sidebar"
          data-tutorial={dataTutorial}
        >
          <SlidersHorizontal className="size-5" />
          <span className="hidden whitespace-nowrap text-xs text-foreground lg:inline">
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {activeFilterCount > 0 ? `Filters (${activeFilterCount} active)` : "Filters"}
      </TooltipContent>
    </Tooltip>
  );
}

function ActiveFilterPill({ defaultFilters }: { defaultFilters?: Record<string, unknown> }) {
  const { activeFilterCount } = useFilterSidebarContext();
  const sidebarContext = useOptionalFilterSidebarContext();

  let filterValues: Record<string, unknown> | undefined;
  let displayedFilters: unknown;
  let setFilters:
    | ((filters: Record<string, unknown>, displayedFilters?: unknown) => void)
    | undefined;

  try {
    const ctx = useListContext();
    filterValues = ctx.filterValues;
    displayedFilters = ctx.displayedFilters;
    setFilters = ctx.setFilters;
  } catch {
    return null;
  }

  if (activeFilterCount === 0) return null;

  const handleClear = () => {
    if (!setFilters) return;
    resetListFilters(
      setFilters,
      displayedFilters,
      defaultFilters,
      filterValues,
      sidebarContext?.orSource,
      sidebarContext?.setOrSource
    );
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
    >
      <span>
        {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
      </span>
      <button
        type="button"
        onClick={handleClear}
        className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-primary/20 touch-target-44"
        aria-label="Clear all filters"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function OverflowMenu({
  sortFields,
  overflowActions,
}: {
  sortFields: string[];
  overflowActions?: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-[var(--list-toolbar-control-height-mobile)] w-[var(--list-toolbar-control-height-mobile)]"
          aria-label="More actions"
        >
          <EllipsisVertical className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="md:hidden">
          <SortMenuSub fields={sortFields} />
          {overflowActions && <DropdownMenuSeparator />}
        </div>
        {overflowActions}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useSafeListSortContext() {
  try {
    return useListSortContext();
  } catch {
    return null;
  }
}

function SortMenuSub({ fields }: { fields: string[] }) {
  const sortContext = useSafeListSortContext();
  const translate = useTranslate();
  const translateLabel = useTranslateLabel();

  if (!sortContext) return null;
  const { resource, sort, setSort } = sortContext;
  const sortField = typeof sort.field === "string" ? sort.field : fields[0];

  const handleChangeSort = (field: string) => {
    setSort({
      field,
      order: field === sortField ? inverseOrder(sort.order) : "ASC",
    });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ArrowUpDown className="size-4" />
        Sort by
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {fields.map((field) => (
          <DropdownMenuItem key={field} onSelect={() => handleChangeSort(field)}>
            {translateLabel({ resource, source: field })}{" "}
            {translate(`ra.sort.${sortField === field ? inverseOrder(sort.order) : "ASC"}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

const inverseOrder = (sort: string) => (sort === "ASC" ? "DESC" : "ASC");
