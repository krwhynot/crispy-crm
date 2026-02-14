import { type ReactNode } from "react";
import { useListContext } from "ra-core";
import { PanelLeftClose, PanelLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { FilterLayoutModeProvider } from "@/atomic-crm/filters/FilterLayoutModeContext";
import { useFilterSidebarContext } from "./FilterSidebarContext";

interface AdaptiveFilterContainerProps {
  /** Filter sidebar content (e.g., ContactListFilter) */
  filterComponent: ReactNode;
  /** Resource name for accessibility labels */
  resource: string;
}

/**
 * AdaptiveFilterContainer - Renders filter content in the appropriate container
 * based on current viewport breakpoint.
 *
 * Requires a FilterSidebarProvider ancestor for collapse/sheet state management.
 *
 * - Tier 1 (≥1280px, laptop/desktop): Expanded sidebar with collapse toggle
 * - Tier 2 (1024-1279px, tablet-landscape): Icon rail with popover flyouts
 * - Tier 3 (<1024px, mobile/tablet-portrait): Sheet modal trigger
 */
export function AdaptiveFilterContainer({
  filterComponent,
  resource,
}: AdaptiveFilterContainerProps) {
  const breakpoint = useBreakpoint();

  if (breakpoint === "desktop" || breakpoint === "laptop") {
    return (
      <FilterLayoutModeProvider value="full">
        <ExpandedSidebar filterComponent={filterComponent} resource={resource} />
      </FilterLayoutModeProvider>
    );
  }

  if (breakpoint === "tablet-landscape") {
    return (
      <FilterLayoutModeProvider value="icon-rail">
        <IconRailSidebar filterComponent={filterComponent} resource={resource} />
      </FilterLayoutModeProvider>
    );
  }

  // Mobile / tablet-portrait
  return (
    <FilterLayoutModeProvider value="sheet">
      <FilterSheetTrigger filterComponent={filterComponent} resource={resource} />
    </FilterLayoutModeProvider>
  );
}

// ---------------------------------------------------------------------------
// Tier 1: Expanded Sidebar (≥1280px)
// ---------------------------------------------------------------------------

function ExpandedSidebar({
  filterComponent,
  resource,
}: {
  filterComponent: ReactNode;
  resource: string;
}) {
  const { isCollapsed, toggleSidebar } = useFilterSidebarContext();

  return (
    <div
      className={`hidden lg:block lg:sticky lg:top-0 lg:self-start relative ${isCollapsed ? "w-11 h-[50vh]" : "h-fit"}`}
    >
      {/* Filter sidebar with collapse animation */}
      <aside
        id="filter-sidebar"
        aria-label={`Filter ${resource}`}
        className={`
          filter-sidebar transition-all duration-200 ease-out overflow-y-auto
          ${isCollapsed ? "w-0 opacity-0 invisible overflow-hidden" : "w-72 opacity-100 max-h-[calc(100vh-6rem)]"}
        `}
        aria-hidden={isCollapsed}
      >
        <div className="card-container p-2">
          {/* Desktop collapse toggle inside sidebar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Filters</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-11 w-11"
                  aria-label="Hide filters"
                >
                  <PanelLeftClose className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Hide filters</TooltipContent>
            </Tooltip>
          </div>
          {filterComponent}
        </div>
      </aside>

      {/* Desktop expand button - centered vertically */}
      {isCollapsed && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSidebar}
                className="h-11 w-11"
                aria-label="Show filters"
                aria-expanded={false}
                aria-controls="filter-sidebar"
              >
                <PanelLeft className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Show filters</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier 2: Icon Rail Sidebar (1024-1279px)
// ---------------------------------------------------------------------------

function IconRailSidebar({
  filterComponent,
  resource,
}: {
  filterComponent: ReactNode;
  resource: string;
}) {
  return (
    <aside aria-label={`Filter ${resource}`} className="w-14 flex-shrink-0 sticky top-0 self-start">
      <div className="flex flex-col items-center gap-1 py-2 card-container">{filterComponent}</div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Tier 3: Filter Sheet Trigger (<1024px)
// ---------------------------------------------------------------------------

function FilterSheetTrigger({
  filterComponent,
  resource,
}: {
  filterComponent: ReactNode;
  resource: string;
}) {
  const { isSheetOpen, setSheetOpen } = useFilterSidebarContext();

  return (
    <div className="shrink-0 mb-2">
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

      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" aria-label={`Filter ${resource}`}>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-2">{filterComponent}</div>
          <FilterSheetFooter onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Sheet footer with "Clear all" and "Done" buttons.
 * Must be rendered inside a ListContext (child of <List>).
 */
function FilterSheetFooter({ onClose }: { onClose: () => void }) {
  const { setFilters, displayedFilters } = useListContext();

  const handleClear = () => {
    setFilters({}, displayedFilters);
  };

  return (
    <SheetFooter className="border-t bg-background p-4 flex flex-row gap-3 shrink-0">
      <Button variant="outline" onClick={handleClear} className="flex-1 h-11">
        Clear all
      </Button>
      <Button onClick={onClose} className="flex-1 h-11">
        Done
      </Button>
    </SheetFooter>
  );
}
