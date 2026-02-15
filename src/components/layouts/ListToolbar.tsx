import { useEffect, type ReactNode } from "react";
import { ArrowUpDown, EllipsisVertical, SlidersHorizontal } from "lucide-react";
import { useListSortContext, useTranslate, useTranslateLabel } from "ra-core";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSearchBar } from "@/components/ra-wrappers/ListSearchBar";
import { SortButton } from "@/components/ra-wrappers/sort-button";
import { useFilterSidebarContext } from "./FilterSidebarContext";
import { useListDensityContext } from "./ListDensityContext";
import { useListHasDockedFilters } from "./useListViewport";

export interface ListToolbarProps {
  /** Sortable field names passed to SortButton */
  sortFields: string[];
  /** Search input placeholder text */
  searchPlaceholder?: string;
  /** Enable recent searches dropdown */
  enableRecentSearches?: boolean;
  /** View switcher slot (e.g., OrganizationViewSwitcher) */
  viewSwitcher?: ReactNode;
  /** DropdownMenuItem children for the kebab overflow menu (e.g., ExportMenuItem) */
  overflowActions?: ReactNode;
  /** Show filter toggle button (default: true) */
  showFilterToggle?: boolean;
  /** Show compact/comfortable density switch (default: true) */
  showDensityToggle?: boolean;
  /** Resource name for ARIA labels */
  resource?: string;
  /** Primary action slot (e.g., CreateButton) */
  primaryAction?: ReactNode;
}

/**
 * ListToolbar - Unified toolbar row for list pages.
 *
 * Responsive behavior:
 * - <768: search full row, sort inside overflow menu
 * - 768-1023: compact controls, icon-only sort button
 * - >=1024: full controls with labeled sort button
 */
export function ListToolbar({
  sortFields,
  searchPlaceholder,
  enableRecentSearches,
  viewSwitcher,
  overflowActions,
  showFilterToggle = true,
  showDensityToggle = true,
  resource,
  primaryAction,
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
      <div className="order-1 basis-full min-w-0 lg:order-1 lg:basis-auto lg:flex-1 lg:min-w-[340px] lg:max-w-xl">
        <div className="flex items-center gap-2">
          <ListSearchBar
            placeholder={searchPlaceholder}
            enableRecentSearches={enableRecentSearches}
          />
          {showFilterToggle && <FilterToggleButton />}
        </div>
      </div>

      <div className="order-2 hidden shrink-0 lg:flex lg:flex-1 lg:justify-center">
        <SortButton fields={sortFields} />
      </div>

      <div className="order-2 flex shrink-0 gap-2 lg:hidden">
        <SortButton
          fields={sortFields}
          iconOnly
          className="h-[var(--list-toolbar-control-height-mobile)] w-[var(--list-toolbar-control-height-mobile)]"
        />
      </div>

      <div className="order-3 ml-auto flex shrink-0 items-end gap-2 lg:order-3">
        {showDensityToggle && (
          <div className="hidden md:flex md:items-end">
            <DensityToggle />
          </div>
        )}
        {viewSwitcher && <div className="shrink-0">{viewSwitcher}</div>}
        {primaryAction && <div className="shrink-0">{primaryAction}</div>}
        <div className={showOverflowOnDesktop ? "shrink-0" : "shrink-0 md:hidden"}>
          <OverflowMenu sortFields={sortFields} overflowActions={overflowActions} />
        </div>
      </div>
    </div>
  );
}

function FilterToggleButton() {
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
          className="relative h-[var(--list-toolbar-control-height-mobile)] px-3 lg:h-[var(--list-toolbar-control-height-desktop)] lg:px-2"
          aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
          aria-expanded={isExpanded}
          aria-controls="filter-sidebar"
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

function DensityToggle() {
  const { density, setDensity } = useListDensityContext();

  return (
    <ToggleGroup
      type="single"
      value={density}
      onValueChange={(value) => {
        if (value === "comfortable" || value === "compact") {
          setDensity(value);
        }
      }}
      variant="outline"
      size="sm"
      aria-label="List density"
      className="inline-flex h-[var(--list-toolbar-control-height-desktop)] items-center gap-0 rounded-md border [border-color:var(--paper-divider)] bg-[color:var(--surface-paper-inner)] p-0.5"
    >
      <ToggleGroupItem
        value="comfortable"
        className="h-8 rounded-sm px-2 text-xs data-[state=on]:bg-[color:var(--surface-paper-card)] data-[state=on]:text-foreground"
        aria-label="Comfortable density"
      >
        Comfortable
      </ToggleGroupItem>
      <ToggleGroupItem
        value="compact"
        className="h-8 rounded-sm px-2 text-xs data-[state=on]:bg-[color:var(--surface-paper-card)] data-[state=on]:text-foreground"
        aria-label="Compact density"
      >
        Compact
      </ToggleGroupItem>
    </ToggleGroup>
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
          className="h-[var(--list-toolbar-control-height-mobile)] w-[var(--list-toolbar-control-height-mobile)] lg:h-[var(--list-toolbar-control-height-desktop)] lg:w-[var(--list-toolbar-control-height-desktop)]"
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

  const handleChangeSort = (field: string) => {
    setSort({
      field,
      order: field === sort.field ? inverseOrder(sort.order) : "ASC",
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
            {translate(`ra.sort.${sort.field === field ? inverseOrder(sort.order) : "ASC"}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

const inverseOrder = (sort: string) => (sort === "ASC" ? "DESC" : "ASC");
