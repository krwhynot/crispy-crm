import type { ReactNode } from "react";
import { FilterChipBar } from "@/atomic-crm/filters/FilterChipBar";
import type { ChipFilterConfig } from "@/atomic-crm/filters/filterConfigSchema";
import { AdaptiveFilterContainer } from "./AdaptiveFilterContainer";
import { FilterSidebarProvider } from "./FilterSidebarContext";
import { ListToolbar } from "./ListToolbar";

/**
 * StandardListLayout - Unified layout for all resource list views
 *
 * Provides a standardized two-column layout with an adaptive filter sidebar,
 * optional unified toolbar, and main content area.
 *
 * @example
 * ```tsx
 * <StandardListLayout
 *   filterComponent={<ContactListFilter />}
 *   resource="contacts"
 *   filterConfig={CONTACT_FILTER_CONFIG}
 *   sortFields={["first_name", "title", "last_seen"]}
 *   searchPlaceholder="Search contacts..."
 *   overflowActions={<ExportMenuItem />}
 * >
 *   <Datagrid>...</Datagrid>
 * </StandardListLayout>
 * ```
 */

interface StandardListLayoutProps {
  /** Filter sidebar content (e.g., SearchInput, FilterCategories) */
  filterComponent: ReactNode;
  /** Main content area (typically React Admin Datagrid) */
  children: ReactNode;
  /** Resource name for accessibility labels */
  resource: string;
  /** Filter configuration for FilterChipBar display */
  filterConfig?: ChipFilterConfig[];
  /** Whether to wrap main content in a card container (default: true) */
  wrapMainInCard?: boolean;
  /** localStorage key for sidebar collapse state (default: "crm-filter-sidebar-collapsed") */
  storageKey?: string;
  // -- Toolbar props (all optional for backward compat) --
  /** Sortable field names - when provided, renders the unified ListToolbar */
  sortFields?: string[];
  /** Search input placeholder text */
  searchPlaceholder?: string;
  /** Enable recent searches dropdown */
  enableRecentSearches?: boolean;
  /** View switcher slot (e.g., OrganizationViewSwitcher) */
  viewSwitcher?: ReactNode;
  /** DropdownMenuItem children for the kebab overflow menu */
  overflowActions?: ReactNode;
  /** Show filter toggle button in toolbar (default: true) */
  showFilterToggle?: boolean;
}

export function StandardListLayout({
  filterComponent,
  children,
  resource,
  filterConfig,
  wrapMainInCard = true,
  storageKey,
  sortFields,
  searchPlaceholder,
  enableRecentSearches,
  viewSwitcher,
  overflowActions,
  showFilterToggle,
}: StandardListLayoutProps) {
  const content = (
    <div className="flex h-full min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[auto_1fr] gap-6">
      <AdaptiveFilterContainer filterComponent={filterComponent} resource={resource} />

      <div className="flex flex-col min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* Active filter chips - always visible above content when filters applied */}
        {filterConfig && filterConfig.length > 0 && (
          <div className="shrink-0">
            <FilterChipBar filterConfig={filterConfig} />
          </div>
        )}

        {/* Unified toolbar row - rendered when sortFields are provided */}
        {sortFields && (
          <ListToolbar
            sortFields={sortFields}
            searchPlaceholder={searchPlaceholder}
            enableRecentSearches={enableRecentSearches}
            viewSwitcher={viewSwitcher}
            overflowActions={overflowActions}
            showFilterToggle={showFilterToggle}
            resource={resource}
          />
        )}

        <main
          aria-label={`${resource} list`}
          className="flex h-full min-h-0 min-w-0 lg:min-w-[600px] flex-col overflow-hidden flex-1"
        >
          {wrapMainInCard ? (
            <div className="card-container flex h-full min-h-0 flex-1 flex-col overflow-hidden pb-2">
              {children}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          )}
        </main>
      </div>
    </div>
  );

  return <FilterSidebarProvider storageKey={storageKey}>{content}</FilterSidebarProvider>;
}
