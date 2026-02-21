import type { ReactNode } from "react";
import type { ChipFilterConfig } from "@/atomic-crm/filters/filterConfigSchema";
import { ListPageLayout } from "./ListPageLayout";

/**
 * StandardListLayout - Unified layout for all resource list views
 *
 * @deprecated Use `ListPageLayout` for new list pages.
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
  /** Show the filter sidebar (default: true). Set false to hide sidebar entirely (e.g., Overview tab uses inline header instead) */
  showFilterSidebar?: boolean;
  /** Primary action slot (e.g., CreateButton) - passed through to ListToolbar */
  primaryAction?: ReactNode;
  /** Default filter values to restore on "Clear all" (e.g., { disabled: false } for Sales) */
  defaultFilters?: Record<string, unknown>;
  showPageTitle?: boolean;
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
  showFilterSidebar = true,
  primaryAction,
  defaultFilters,
  showPageTitle,
}: StandardListLayoutProps) {
  return (
    <ListPageLayout
      resource={resource}
      filterComponent={filterComponent}
      filterConfig={filterConfig}
      wrapMainInCard={wrapMainInCard}
      storageKey={storageKey}
      sortFields={sortFields}
      searchPlaceholder={searchPlaceholder}
      enableRecentSearches={enableRecentSearches}
      viewSwitcher={viewSwitcher}
      overflowActions={overflowActions}
      showFilterToggle={showFilterToggle}
      showFilterSidebar={showFilterSidebar}
      primaryAction={primaryAction}
      defaultFilters={defaultFilters}
      showPageTitle={showPageTitle}
    >
      {children}
    </ListPageLayout>
  );
}
