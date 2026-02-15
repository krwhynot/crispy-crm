import { type ReactNode } from "react";
import { useListContext } from "ra-core";
import { PanelLeftClose, SlidersHorizontal } from "lucide-react";
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
 * - Tier 1 (>=1280px, desktop/laptop): Expanded sidebar with collapse toggle
 * - Tier 2 (<1280px): Sheet modal (trigger hidden when ListToolbar owns it)
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

  // Tablet-landscape / tablet-portrait / mobile
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
      className={`hidden xl:block xl:sticky xl:top-0 xl:self-start ${isCollapsed ? "w-0" : "h-fit"}`}
    >
      {/* Filter sidebar with collapse animation */}
      <aside
        id="filter-sidebar"
        aria-label={`Filter ${resource}`}
        className={`
          filter-sidebar transition-all duration-200 ease-out overflow-y-auto
          ${isCollapsed ? "w-0 opacity-0 invisible overflow-hidden" : "w-72 opacity-100 max-h-[80dvh]"}
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

      {/* When collapsed, toolbar FilterToggleButton handles re-expand — no floating button needed */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier 2: Filter Sheet (<1280px)
// ---------------------------------------------------------------------------

function FilterSheetTrigger({
  filterComponent,
  resource,
}: {
  filterComponent: ReactNode;
  resource: string;
}) {
  const { isSheetOpen, setSheetOpen, hasToolbar } = useFilterSidebarContext();

  return (
    <>
      {/* Standalone trigger - only when no ListToolbar provides its own */}
      {!hasToolbar && (
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
        </div>
      )}

      {/* Sheet always renders -- controlled by setSheetOpen from either toolbar or standalone button */}
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" aria-label={`Filter ${resource}`}>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-2">{filterComponent}</div>
          <FilterSheetFooter onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
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
