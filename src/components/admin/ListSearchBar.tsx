import { useState, useRef, useCallback } from "react";
import { FilterLiveForm, useListContext } from "ra-core";
import { SearchInput } from "@/components/admin/search-input";
import { FilterChipBar } from "@/atomic-crm/filters/FilterChipBar";
import { RecentSearchesDropdown } from "@/components/admin/RecentSearchesDropdown";
import { useRecentSearches } from "@/atomic-crm/hooks/useRecentSearches";
import type { FilterConfig } from "@/atomic-crm/filters/types";

interface ListSearchBarProps {
  /** Placeholder text for search input */
  placeholder?: string;
  /** Filter source field name (default: "q") */
  source?: string;
  /** Filter configuration for chip bar labels (optional for search-only views) */
  filterConfig?: FilterConfig;
  /** Enable recent searches dropdown (default: false for backward compatibility) */
  enableRecentSearches?: boolean;
}

/**
 * ListSearchBar - Unified search + filter chips component for list views
 *
 * Combines:
 * - Global search input (left)
 * - Active filter chips (right, via FilterChipBar)
 * - Recent searches dropdown (optional, enabled via prop)
 *
 * Place this above the PremiumDatagrid in list layouts to provide
 * consistent search UX across all list views.
 *
 * @example
 * ```tsx
 * <ListSearchBar
 *   placeholder="Search organizations..."
 *   filterConfig={ORGANIZATION_FILTER_CONFIG}
 *   enableRecentSearches
 * />
 * <PremiumDatagrid>...</PremiumDatagrid>
 * ```
 */
export function ListSearchBar({
  placeholder = "Search...",
  source = "q",
  filterConfig,
  enableRecentSearches = false,
}: ListSearchBarProps) {
  const { filterValues } = useListContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const { recentItems, clearRecent } = useRecentSearches();

  // Get current search value from filter context
  const searchValue = (filterValues?.[source] as string) || "";

  // Show dropdown when: enabled + open + empty search + has items
  const shouldShowDropdown =
    enableRecentSearches &&
    dropdownOpen &&
    !searchValue &&
    recentItems.length > 0;

  const handleFocus = useCallback(() => {
    if (enableRecentSearches && !searchValue) {
      setDropdownOpen(true);
    }
  }, [enableRecentSearches, searchValue]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Don't close if focus moved to popover content
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest("[data-radix-popper-content-wrapper]")) {
      return;
    }
    // Delay close to allow click handlers to fire
    setTimeout(() => setDropdownOpen(false), 150);
  }, []);

  return (
    <div className="flex items-center gap-4">
      {/* Search Input - wrapped in FilterLiveForm for live updates */}
      <div
        className="flex-shrink-0 w-64 relative"
        onFocusCapture={handleFocus}
        onBlurCapture={handleBlur}
      >
        <FilterLiveForm>
          <SearchInput source={source} placeholder={placeholder} alwaysOn />
        </FilterLiveForm>

        {/* Anchor for dropdown positioning */}
        {enableRecentSearches && (
          <>
            <div ref={anchorRef} className="absolute left-0 top-full" />
            <RecentSearchesDropdown
              open={shouldShowDropdown}
              onOpenChange={setDropdownOpen}
              items={recentItems}
              onClear={clearRecent}
              anchorRef={anchorRef}
            />
          </>
        )}
      </div>

      {/* Active Filter Chips - only rendered when filter config exists */}
      {filterConfig && filterConfig.length > 0 && (
        <div className="flex-1 min-w-0">
          <FilterChipBar filterConfig={filterConfig} />
        </div>
      )}
    </div>
  );
}

export default ListSearchBar;
