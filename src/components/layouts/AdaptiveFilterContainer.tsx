import { useContext, type ReactNode } from "react";
import { ListContext } from "ra-core";
import { PanelLeftClose, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { FilterLayoutModeProvider } from "@/atomic-crm/filters/FilterLayoutModeContext";
import { useFilterSidebarContext } from "./FilterSidebarContext";
import { resetListFilters } from "./listFilterReset";
import { useListHasDockedFilters } from "./useListViewport";

interface AdaptiveFilterContainerProps {
  /** Filter sidebar content (e.g., ContactListFilter) */
  filterComponent: ReactNode;
  /** Resource name for accessibility labels */
  resource: string;
  /** Default filter values to restore on "Clear all" */
  defaultFilters?: Record<string, unknown>;
}

/**
 * AdaptiveFilterContainer - Renders filter content in the appropriate container
 * based on the iPad-first list breakpoint contract.
 *
 * Requires a FilterSidebarProvider ancestor for collapse/sheet state management.
 *
 * - Docked mode (>=1024px / lg): Expanded sidebar with collapse toggle
 * - Sheet mode (<1024px): Sheet modal (trigger hidden when ListToolbar owns it)
 */
export function AdaptiveFilterContainer({
  filterComponent,
  resource,
  defaultFilters,
}: AdaptiveFilterContainerProps) {
  const hasDockedFilters = useListHasDockedFilters();

  if (hasDockedFilters) {
    return (
      <FilterLayoutModeProvider value="full">
        <ExpandedSidebar
          filterComponent={filterComponent}
          resource={resource}
          defaultFilters={defaultFilters}
        />
      </FilterLayoutModeProvider>
    );
  }

  return (
    <FilterLayoutModeProvider value="sheet">
      <FilterSheetTrigger
        filterComponent={filterComponent}
        resource={resource}
        defaultFilters={defaultFilters}
      />
    </FilterLayoutModeProvider>
  );
}

// ---------------------------------------------------------------------------
// Docked Sidebar (>=1024px)
// ---------------------------------------------------------------------------

function ExpandedSidebar({
  filterComponent,
  resource,
  defaultFilters,
}: {
  filterComponent: ReactNode;
  resource: string;
  defaultFilters?: Record<string, unknown>;
}) {
  const { isCollapsed, toggleSidebar, activeFilterCount } = useFilterSidebarContext();
  const listContext = useContext(ListContext);

  const handleClearAll = () => {
    if (!listContext) {
      return;
    }
    resetListFilters(
      listContext.setFilters,
      listContext.displayedFilters,
      defaultFilters,
      listContext.filterValues
    );
  };

  return (
    <div className={`sticky top-0 self-start ${isCollapsed ? "w-auto" : "h-fit"}`}>
      {isCollapsed && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSidebar}
          className="h-11 gap-2 border-dashed px-3"
          aria-label="Show filters panel"
        >
          <SlidersHorizontal className="size-4" />
          Show filters
        </Button>
      )}
      <aside
        id="filter-sidebar"
        aria-label={`Filter ${resource}`}
        className={`
          filter-sidebar transition-all duration-200 ease-out overflow-y-auto
          ${isCollapsed ? "w-0 opacity-0 invisible overflow-hidden" : "w-[var(--list-sidebar-width)] opacity-100 max-h-[80dvh]"}
        `}
        aria-hidden={isCollapsed}
      >
        <div className="card-container list-filter-card">
          <div className="mb-content border-b border-border pb-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSidebar}
                    className="h-9 gap-1.5 px-2.5"
                    aria-label="Hide filters"
                  >
                    <PanelLeftClose className="size-4" />
                    Hide
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Hide filters</TooltipContent>
              </Tooltip>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full"
              onClick={handleClearAll}
              disabled={activeFilterCount === 0}
            >
              Clear all
            </Button>
          </div>
          {filterComponent}
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Sheet (<1024px)
// ---------------------------------------------------------------------------

function FilterSheetTrigger({
  filterComponent,
  resource,
  defaultFilters,
}: {
  filterComponent: ReactNode;
  resource: string;
  defaultFilters?: Record<string, unknown>;
}) {
  const { isSheetOpen, setSheetOpen, hasToolbar } = useFilterSidebarContext();

  return (
    <>
      {!hasToolbar && (
        <div className="shrink-0 mb-widget">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSheetOpen(true)}
                className="h-11 w-11"
                aria-label="Open filters"
                aria-expanded={isSheetOpen}
              >
                <SlidersHorizontal className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Filters</TooltipContent>
          </Tooltip>
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" aria-label={`Filter ${resource}`}>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-content">{filterComponent}</div>
          <FilterSheetFooter onClose={() => setSheetOpen(false)} defaultFilters={defaultFilters} />
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * Sheet footer with "Clear all" and "Done" buttons.
 * Supports both list-context pages and non-list shell usage (e.g., Reports).
 */
function FilterSheetFooter({
  onClose,
  defaultFilters,
}: {
  onClose: () => void;
  defaultFilters?: Record<string, unknown>;
}) {
  const listContext = useContext(ListContext);

  const handleClear = () => {
    if (!listContext) {
      return;
    }

    resetListFilters(
      listContext.setFilters,
      listContext.displayedFilters,
      defaultFilters,
      listContext.filterValues
    );
  };

  return (
    <SheetFooter className="border-t bg-background p-content flex flex-row gap-content shrink-0">
      {listContext && (
        <Button variant="outline" onClick={handleClear} className="flex-1 h-11">
          Clear all
        </Button>
      )}
      <Button onClick={onClose} className="flex-1 h-11">
        Done
      </Button>
    </SheetFooter>
  );
}
