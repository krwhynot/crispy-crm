/**
 * FilterSidebar Component
 *
 * Standardized sidebar wrapper for all list filter UIs.
 * Ensures consistent layout, spacing, and behavior across features.
 *
 * @module filters/FilterSidebar
 */

import { FilterLiveForm } from "react-admin";
import { SearchInput } from "@/components/admin/search-input";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  children: React.ReactNode;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /**
   * Whether to show the built-in search input.
   * Set to false if your filter categories already include a search block.
   * @default true
   */
  showSearch?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Standardized sidebar wrapper for all list filter UIs.
 *
 * Provides consistent:
 * - Layout (flex column with gap)
 * - Spacing (padding)
 * - Optional search input at top
 *
 * @example
 * ```tsx
 * // With search (default)
 * <FilterSidebar>
 *   <FilterCategory label="Status">...</FilterCategory>
 * </FilterSidebar>
 *
 * // Without search (when filter already has search)
 * <FilterSidebar showSearch={false}>
 *   <FilterCategory label="Status">...</FilterCategory>
 * </FilterSidebar>
 * ```
 */
export function FilterSidebar({
  children,
  searchPlaceholder = "Search...",
  showSearch = true,
  className,
}: FilterSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>
      {showSearch && (
        <FilterLiveForm>
          <SearchInput source="q" placeholder={searchPlaceholder} />
        </FilterLiveForm>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
