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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSearchBar } from "@/components/ra-wrappers/ListSearchBar";
import { SortButton } from "@/components/ra-wrappers/sort-button";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useFilterSidebarContext } from "./FilterSidebarContext";

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
  /** Resource name for ARIA labels */
  resource?: string;
  /** Primary action slot (e.g., CreateButton) - renders between view switcher and overflow menu */
  primaryAction?: ReactNode;
}

/**
 * ListToolbar - Unified toolbar row for list pages.
 *
 * Layout: [ Search ] [ Filters (n) ] [ Sort ] [ View Toggle ] [ ... ]
 *
 * Responsive:
 * - Desktop (≥1280px): All elements visible
 * - Tablet landscape (1024-1279px): SortButton renders in icon-only mode
 * - Mobile (<768px): SortButton hidden, sort options move to kebab menu
 */
export function ListToolbar({
  sortFields,
  searchPlaceholder,
  enableRecentSearches,
  viewSwitcher,
  overflowActions,
  showFilterToggle = true,
  resource,
  primaryAction,
}: ListToolbarProps) {
  const { setHasToolbar } = useFilterSidebarContext();

  useEffect(() => {
    setHasToolbar(true);
    return () => setHasToolbar(false);
  }, [setHasToolbar]);

  return (
    <div
      role="toolbar"
      aria-label={resource ? `${resource} list toolbar` : "List toolbar"}
      className="flex flex-wrap items-center gap-2 gap-y-2 mb-3 shrink-0"
    >
      {/* 1. Search - fills remaining space, full row on wrap */}
      <div className="flex-1 min-w-0 basis-full xl:basis-auto order-1">
        <ListSearchBar
          placeholder={searchPlaceholder}
          enableRecentSearches={enableRecentSearches}
        />
      </div>

      {/* 2. Filter toggle with badge */}
      {showFilterToggle && (
        <div className="order-2">
          <FilterToggleButton />
        </div>
      )}

      {/* 3. Sort dropdown - hidden below md, moves to kebab */}
      <div className="hidden md:block order-3">
        <SortButton fields={sortFields} />
      </div>

      {/* 4. View switcher slot */}
      {viewSwitcher && <div className="order-4">{viewSwitcher}</div>}

      {/* 5. Primary action slot (e.g., Create button) */}
      {primaryAction && <div className="order-5">{primaryAction}</div>}

      {/* 6. Kebab overflow menu */}
      <div className="order-6">
        <OverflowMenu sortFields={sortFields} overflowActions={overflowActions} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterToggleButton - Toggles sidebar (desktop) or opens sheet (mobile)
// ---------------------------------------------------------------------------

function FilterToggleButton() {
  const { isCollapsed, toggleSidebar, isSheetOpen, setSheetOpen, activeFilterCount } =
    useFilterSidebarContext();
  const breakpoint = useBreakpoint();
  const isMobileSheet = breakpoint !== "desktop" && breakpoint !== "laptop";

  const handleClick = () => {
    if (isMobileSheet) {
      setSheetOpen(true);
    } else {
      toggleSidebar();
    }
  };

  const isExpanded = isMobileSheet ? isSheetOpen : !isCollapsed;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={handleClick}
          className="h-11 w-11 relative"
          aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
          aria-expanded={isExpanded}
          aria-controls="filter-sidebar"
        >
          <SlidersHorizontal className="size-5" />
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

// ---------------------------------------------------------------------------
// OverflowMenu - Kebab menu with sort (mobile) + custom overflow actions
// ---------------------------------------------------------------------------

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
        <Button variant="outline" size="icon" className="h-11 w-11" aria-label="More actions">
          <EllipsisVertical className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Sort submenu - only visible on mobile when SortButton is hidden */}
        <div className="md:hidden">
          <SortMenuSub fields={sortFields} />
          {overflowActions && <DropdownMenuSeparator />}
        </div>
        {overflowActions}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// SortMenuSub - Sort options as a submenu inside the kebab menu
// ---------------------------------------------------------------------------

function SortMenuSub({ fields }: { fields: string[] }) {
  const { resource, sort, setSort } = useListSortContext();
  const translate = useTranslate();
  const translateLabel = useTranslateLabel();

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
