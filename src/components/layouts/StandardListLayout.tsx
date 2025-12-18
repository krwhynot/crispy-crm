import { useState, useEffect, useCallback } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * StandardListLayout - Unified layout for all resource list views
 *
 * Provides a standardized two-column layout with a collapsible filter sidebar
 * and main content area. This component enforces consistent spacing, semantic
 * HTML structure, and accessibility patterns across all resource list pages.
 *
 * @example
 * ```tsx
 * <StandardListLayout
 *   filterComponent={<ContactListFilter />}
 *   resource="contacts"
 * >
 *   <Datagrid>...</Datagrid>
 * </StandardListLayout>
 * ```
 *
 * Design System Compliance:
 * - Uses `.filter-sidebar` and `.card-container` utility classes
 * - Semantic HTML: `<aside>` for filters, `<main>` for content
 * - ARIA labels for screen reader navigation
 * - Sticky positioning for filter sidebar on desktop (remains visible on scroll)
 * - Responsive gap spacing (24px) for comfortable visual separation
 * - Collapsible sidebar with localStorage persistence
 *
 * Responsive Behavior (Desktop-First):
 * - Base (mobile/tablet <1024px): Stacked vertical layout (flex-col), collapsed by default
 * - Desktop (≥1024px): Side-by-side two-column layout (lg:flex-row)
 * - Filter sidebar collapse state persisted to localStorage
 *
 * @param filterComponent - React node containing filter UI components
 * @param children - Main content area (typically a Datagrid or table)
 * @param resource - Resource name for ARIA labels (e.g., "contacts", "opportunities")
 */

const STORAGE_KEY = "crm-filter-sidebar-collapsed";

interface StandardListLayoutProps {
  /** Filter sidebar content (e.g., SearchInput, FilterCategories) */
  filterComponent: React.ReactNode;
  /** Main content area (typically React Admin Datagrid) */
  children: React.ReactNode;
  /** Resource name for accessibility labels */
  resource: string;
}

export function StandardListLayout({
  filterComponent,
  children,
  resource,
}: StandardListLayoutProps) {
  // Initialize collapsed state from localStorage, default to collapsed on tablet
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === "true";
    }
    // Default: collapsed on tablet (< 1024px), expanded on desktop
    return window.innerWidth < 1024;
  });

  // Persist collapse state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className={`flex h-full min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[auto_1fr] ${isCollapsed ? "gap-2" : "gap-6"}`}>
      {/* Collapse toggle button */}
      <div className="flex items-center gap-2 lg:hidden mb-2 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="h-11 w-11"
              aria-label={isCollapsed ? "Show filters" : "Hide filters"}
              aria-expanded={!isCollapsed}
              aria-controls="filter-sidebar"
            >
              {isCollapsed ? (
                <PanelLeft className="size-5" />
              ) : (
                <PanelLeftClose className="size-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? "Show filters" : "Hide filters"}
          </TooltipContent>
        </Tooltip>
        {isCollapsed && <span className="text-sm text-muted-foreground">Filters hidden</span>}
      </div>

      {/* Sidebar column - contains both sidebar and expand button in same grid cell */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-fit lg:self-start">
        {/* Filter sidebar with collapse animation */}
        <aside
          id="filter-sidebar"
          aria-label={`Filter ${resource}`}
          className={`
            filter-sidebar transition-all duration-200 ease-out overflow-y-auto
            ${isCollapsed ? "w-0 opacity-0 invisible overflow-hidden" : "w-64 opacity-100 max-h-[calc(100vh-6rem)]"}
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

        {/* Desktop expand button when sidebar is collapsed */}
        {isCollapsed && (
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
        )}
      </div>

      {/* Mobile/Tablet filter sidebar */}
      <aside
        className={`
          lg:hidden filter-sidebar w-full transition-all duration-200 ease-out overflow-y-auto
          ${isCollapsed ? "max-h-0 opacity-0 invisible" : "max-h-[60vh] opacity-100"}
        `}
        aria-hidden={isCollapsed}
      >
        <div className="card-container p-2">
          {filterComponent}
        </div>
      </aside>

      <main
        role="main"
        aria-label={`${resource} list`}
        className="flex h-full min-h-0 flex-col overflow-hidden transition-all duration-200"
      >
        <div className="card-container flex h-full min-h-0 flex-1 flex-col overflow-hidden pb-2">
          {children}
        </div>
      </main>
    </div>
  );
}
