import { FilterLiveForm } from "ra-core";
import { SearchInput } from "@/components/admin/search-input";
import { FilterChipBar } from "@/atomic-crm/filters/FilterChipBar";
import type { FilterConfig } from "@/atomic-crm/filters/types";

interface ListSearchBarProps {
  /** Placeholder text for search input */
  placeholder?: string;
  /** Filter source field name (default: "q") */
  source?: string;
  /** Filter configuration for chip bar labels */
  filterConfig: FilterConfig;
  /** Optional action buttons (e.g., Export) to display at the end of the search bar */
  actions?: React.ReactNode;
}

/**
 * ListSearchBar - Unified search + filter chips component for list views
 *
 * Combines:
 * - Global search input (left)
 * - Active filter chips (right, via FilterChipBar)
 *
 * Place this above the PremiumDatagrid in list layouts to provide
 * consistent search UX across all list views.
 *
 * @example
 * ```tsx
 * <ListSearchBar
 *   placeholder="Search organizations..."
 *   filterConfig={ORGANIZATION_FILTER_CONFIG}
 * />
 * <PremiumDatagrid>...</PremiumDatagrid>
 * ```
 */
export function ListSearchBar({
  placeholder = "Search...",
  source = "q",
  filterConfig,
  actions,
}: ListSearchBarProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      {/* Search Input - wrapped in FilterLiveForm for live updates */}
      <div className="flex-shrink-0 w-64">
        <FilterLiveForm>
          <SearchInput source={source} placeholder={placeholder} alwaysOn />
        </FilterLiveForm>
      </div>

      {/* Active Filter Chips - expands to fill remaining space */}
      <div className="flex-1 min-w-0">
        <FilterChipBar filterConfig={filterConfig} />
      </div>

      {/* Action buttons (Export, etc.) */}
      {actions && (
        <div className="flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default ListSearchBar;
