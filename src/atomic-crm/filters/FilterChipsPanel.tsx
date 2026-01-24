import { useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FilterChip } from "./FilterChip";
import { useOrganizationNames } from "./useOrganizationNames";
import { useSalesNames } from "./useSalesNames";
import { useTagNames } from "./useTagNames";
import { formatFilterLabel, flattenFilterValues } from "./filterFormatters";
import { useFilterManagement } from "./useFilterManagement";

interface FilterChipsPanelProps {
  className?: string;
}

/**
 * Panel component that displays active filters as removable chips
 * Refactored to comply with constitution (<150 lines)
 */
export const FilterChipsPanel = ({ className }: FilterChipsPanelProps) => {
  const { filterValues, removeFilterValue } = useFilterManagement();

  /**
   * Memoized callback for removing filters.
   * Stable reference allows FilterChip React.memo to prevent unnecessary re-renders.
   */
  const handleRemoveFilter = useCallback(
    (key: string, value: unknown) => {
      removeFilterValue(key, value);
    },
    [removeFilterValue]
  );

  // Extract customer organization IDs from filter values and convert to strings
  const customerOrgIds = filterValues?.customer_organization_id
    ? Array.isArray(filterValues.customer_organization_id)
      ? filterValues.customer_organization_id.map(String)
      : [String(filterValues.customer_organization_id)]
    : undefined;

  // Extract principal organization IDs from filter values and convert to strings
  const principalOrgIds = filterValues?.principal_organization_id
    ? Array.isArray(filterValues.principal_organization_id)
      ? filterValues.principal_organization_id.map(String)
      : [String(filterValues.principal_organization_id)]
    : undefined;

  // Combine all organization IDs for a single fetch
  const allOrgIds = [...(customerOrgIds || []), ...(principalOrgIds || [])];

  // Extract sales IDs from filter values and convert to strings
  const salesIds = filterValues?.opportunity_owner_id
    ? Array.isArray(filterValues.opportunity_owner_id)
      ? filterValues.opportunity_owner_id.map(String)
      : [String(filterValues.opportunity_owner_id)]
    : undefined;

  // Extract tag IDs from filter values and convert to strings
  const tagIds = filterValues?.tags
    ? Array.isArray(filterValues.tags)
      ? filterValues.tags.map(String)
      : [String(filterValues.tags)]
    : undefined;

  // Use custom hooks for name fetching
  const { getOrganizationName } = useOrganizationNames(
    allOrgIds.length > 0 ? allOrgIds : undefined
  );
  const { getSalesName } = useSalesNames(salesIds);
  const { getTagName } = useTagNames(tagIds);

  // Flatten and prepare filter values for display
  const filterChips = flattenFilterValues(filterValues || {});

  // Don't render if no filters are active
  if (filterChips.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <Accordion type="single" collapsible defaultValue="filters">
        <AccordionItem value="filters" className="border-b">
          <AccordionTrigger className="py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Active Filters</span>
              <span className="text-xs text-muted-foreground">
                ({filterChips.length} filter{filterChips.length !== 1 ? "s" : ""})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip, index) => {
                const label = formatFilterLabel(
                  chip.key,
                  chip.value,
                  getOrganizationName,
                  getSalesName,
                  getTagName
                );

                return (
                  <FilterChip
                    key={`${chip.key}-${chip.value}-${index}`}
                    label={label}
                    onRemove={() => removeFilterValue(chip.key, chip.value)}
                  />
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
