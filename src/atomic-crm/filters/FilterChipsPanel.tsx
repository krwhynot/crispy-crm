import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FilterChip } from "./FilterChip";
import { useOrganizationNames } from "./useOrganizationNames";
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

  // Extract organization IDs from filter values and convert to strings
  const organizationIds = filterValues?.customer_organization_id
    ? Array.isArray(filterValues.customer_organization_id)
      ? filterValues.customer_organization_id.map(String)
      : [String(filterValues.customer_organization_id)]
    : undefined;

  // Use custom hook for organization name fetching
  const { getOrganizationName } = useOrganizationNames(organizationIds);

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
                ({filterChips.length} filter{filterChips.length !== 1 ? 's' : ''})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip, index) => {
                const label = formatFilterLabel(chip.key, chip.value, getOrganizationName);

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