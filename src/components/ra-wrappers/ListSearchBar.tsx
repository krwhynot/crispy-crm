import { useState, useCallback } from "react";
import { FilterLiveForm, useListContext } from "ra-core";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { SearchInput } from "@/components/ra-wrappers/search-input";
import { RecentSearchesContent } from "@/components/ra-wrappers/RecentSearchesDropdown";
import { useRecentSearches } from "@/atomic-crm/hooks/useRecentSearches";

interface ListSearchBarProps {
  /** Placeholder text for search input */
  placeholder?: string;
  /** Filter source field name (default: "q") */
  source?: string;
  /** Enable recent searches dropdown (default: false for backward compatibility) */
  enableRecentSearches?: boolean;
  /**
   * @deprecated Filter chips are now rendered by StandardListLayout via filterConfig prop.
   * This prop is ignored and will be removed in a future version.
   */
  filterConfig?: unknown[];
}

/**
 * ListSearchBar - Search input component for list views
 *
 * Provides:
 * - Global search input
 * - Recent searches dropdown (optional, enabled via prop)
 *
 * Note: Filter chips (FilterChipBar) are now rendered by StandardListLayout
 * via the `filterConfig` prop, not by this component.
 *
 * @example
 * ```tsx
 * <ListSearchBar
 *   placeholder="Search organizations..."
 *   enableRecentSearches
 * />
 * <PremiumDatagrid>...</PremiumDatagrid>
 * ```
 */
export function ListSearchBar({
  placeholder = "Search...",
  source = "q",
  enableRecentSearches = false,
}: ListSearchBarProps) {
  const { filterValues } = useListContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { recentItems, clearRecent } = useRecentSearches();

  // Get current search value from filter context
  const searchValue = (filterValues?.[source] as string) || "";

  // Show dropdown when: enabled + open + empty search + has items
  const shouldShowDropdown =
    enableRecentSearches && dropdownOpen && !searchValue && recentItems.length > 0;

  const handleFocus = useCallback(() => {
    if (enableRecentSearches && !searchValue && recentItems.length > 0) {
      // FIX: Defer state update to bypass focus/click race condition with Radix Popover
      // The Popover may trigger onOpenChange(false) synchronously during the focus event
      setTimeout(() => setDropdownOpen(true), 0);
    }
  }, [enableRecentSearches, searchValue, recentItems.length]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Don't close if focus moved to popover content
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest("[data-radix-popper-content-wrapper]")) {
      return;
    }
    // Delay close to allow click handlers to fire
    setTimeout(() => setDropdownOpen(false), 150);
  }, []);

  // Render search input - onFocus attached directly to input element
  const searchInputContent = (
    <FilterLiveForm>
      <SearchInput source={source} placeholder={placeholder} alwaysOn onFocus={handleFocus} />
    </FilterLiveForm>
  );

  return (
    <div className="flex items-center gap-4">
      {/* Search Input - optionally wrapped in Popover for recent searches */}
      {enableRecentSearches ? (
        <Popover
          open={shouldShowDropdown}
          onOpenChange={(isOpen) => {
            // Only allow explicit close actions, ignore Radix sync events that try to close
            // when the popover first mounts. Blur handler manages closing.
            if (!isOpen) {
              setDropdownOpen(false);
            }
          }}
        >
          <PopoverAnchor asChild>
            <div className="w-full max-w-sm" onBlurCapture={handleBlur}>
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
        <div className="w-full max-w-sm">{searchInputContent}</div>
      )}
    </div>
  );
}

export default ListSearchBar;
