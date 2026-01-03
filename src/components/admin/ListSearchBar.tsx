import { useState, useCallback } from "react";
import { FilterLiveForm, useListContext } from "ra-core";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { SearchInput } from "@/components/admin/search-input";
import { FilterChipBar } from "@/atomic-crm/filters/FilterChipBar";
import { RecentSearchesContent } from "@/components/admin/RecentSearchesDropdown";
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
  const { recentItems, clearRecent } = useRecentSearches();

  // Get current search value from filter context
  const searchValue = (filterValues?.[source] as string) || "";

  // Show dropdown when: enabled + open + empty search + has items
  const shouldShowDropdown =
    enableRecentSearches &&
    dropdownOpen &&
    !searchValue &&
    recentItems.length > 0;

  // Debug logging
  console.log('[ListSearchBar] Render check:', {
    enableRecentSearches,
    dropdownOpen,
    searchValue,
    recentItemsCount: recentItems.length,
    shouldShowDropdown
  });

  const handleFocus = useCallback(() => {
    console.log('[ListSearchBar] handleFocus called!', { enableRecentSearches, searchValue });
    if (enableRecentSearches && !searchValue) {
      console.log('[ListSearchBar] Setting dropdownOpen to TRUE');
      setDropdownOpen(true);
    } else {
      console.log('[ListSearchBar] Skipping dropdown open:', { enableRecentSearches, hasSearchValue: !!searchValue });
    }
  }, [enableRecentSearches, searchValue]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    console.log('[ListSearchBar] handleBlur called!', {
      relatedTarget: (e.relatedTarget as HTMLElement)?.tagName,
      relatedTargetClass: (e.relatedTarget as HTMLElement)?.className?.slice(0, 50)
    });
    // Don't close if focus moved to popover content
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest("[data-radix-popper-content-wrapper]")) {
      console.log('[ListSearchBar] Blur ignored - focus moved to popover');
      return;
    }
    // Delay close to allow click handlers to fire
    console.log('[ListSearchBar] Scheduling dropdown close in 150ms');
    setTimeout(() => setDropdownOpen(false), 150);
  }, []);

  // Render search input with optional Popover wrapper for recent searches
  const searchInputContent = (
    <FilterLiveForm>
      <SearchInput source={source} placeholder={placeholder} alwaysOn />
    </FilterLiveForm>
  );

  return (
    <div className="flex items-center gap-4">
      {/* Search Input - optionally wrapped in Popover for recent searches */}
      {enableRecentSearches ? (
        <Popover open={shouldShowDropdown} onOpenChange={setDropdownOpen}>
          {/* PopoverAnchor WRAPS the input container - this is the key fix! */}
          <PopoverAnchor asChild>
            <div
              className="flex-shrink-0 w-64"
              onClick={() => console.log('[ListSearchBar] DIV CLICKED!')}
              onFocus={() => console.log('[ListSearchBar] DIV onFocus (bubble)')}
              onFocusCapture={handleFocus}
              onBlurCapture={handleBlur}
            >
              {searchInputContent}
            </div>
          </PopoverAnchor>

          {/* PopoverContent renders the dropdown menu */}
          <PopoverContent
            className="w-80 p-0"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <RecentSearchesContent
              items={recentItems}
              onClear={clearRecent}
              onOpenChange={setDropdownOpen}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <div className="flex-shrink-0 w-64">{searchInputContent}</div>
      )}

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
