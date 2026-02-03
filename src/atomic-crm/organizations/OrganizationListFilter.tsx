import * as React from "react";
import { Building2, MapPin, Truck, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useListContext } from "ra-core";

import { ToggleFilterButton } from "@/components/ra-wrappers/toggle-filter-button";
import { FilterCategory } from "../filters/FilterCategory";
import { StarredFilterToggle } from "../filters/StarredFilterToggle";
import { PLAYBOOK_CATEGORY_CHOICES } from "@/atomic-crm/validation/segments";
import { OPERATOR_SEGMENT_GROUPS } from "@/atomic-crm/validation/operatorSegments";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { OwnerFilterDropdown } from "@/components/ra-wrappers/OwnerFilterDropdown";
import {
  ORGANIZATION_TYPE_CHOICES,
  ORG_TYPE_COLOR_MAP,
  US_STATES,
  getSegmentColor,
} from "./constants";
import type { OrganizationType } from "./constants";

/**
 * OrganizationListFilter - Sidebar filter UI for Organizations list
 *
 * NOTE: Active filter chips are now displayed via FilterChipBar above the datagrid.
 * SidebarActiveFilters removed to avoid duplicate filter visibility.
 */
/**
 * Normalize segment_id filter value to a string array for comparison
 */
function getActiveSegmentIds(filterValues: Record<string, unknown>): string[] {
  const raw = filterValues?.segment_id;
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") return [raw];
  return [];
}

/**
 * Accordion-grouped operator segment filters
 * Groups: Restaurant, Hospitality & Entertainment, Institutional
 * Auto-expands groups that have active filters
 */
const OperatorSegmentAccordion = ({
  filterValues,
  getSegmentColor: getColor,
}: {
  filterValues: Record<string, unknown>;
  getSegmentColor: (id: string | undefined) => string;
}) => {
  const activeIds = getActiveSegmentIds(filterValues);

  // Auto-expand groups that have active filters
  const defaultExpanded = OPERATOR_SEGMENT_GROUPS.filter((group) =>
    group.segmentIds.some((id) => activeIds.includes(id))
  ).map((group) => group.label);

  return (
    <Accordion type="multiple" defaultValue={defaultExpanded} className="w-full">
      {OPERATOR_SEGMENT_GROUPS.map((group) => {
        const activeCount = group.segmentIds.filter((id) => activeIds.includes(id)).length;

        return (
          <AccordionItem key={group.label} value={group.label} className="border-b-0">
            <AccordionTrigger className="py-2 h-11 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{group.label}</span>
                {activeCount > 0 && (
                  <span className="text-xs text-muted-foreground">({activeCount})</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col items-start gap-2">
                {group.choices.map((segment) => (
                  <ToggleFilterButton
                    multiselect
                    key={segment.id}
                    className="w-full justify-between"
                    label={
                      <Badge
                        className={`text-xs px-3 py-2 min-h-[44px] flex items-center ${getColor(segment.id)}`}
                      >
                        {segment.name}
                      </Badge>
                    }
                    value={{ segment_id: segment.id }}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export const OrganizationListFilter = (): React.ReactElement => {
  const { filterValues } = useListContext();

  // Determine which segment filters to show based on organization_type filter
  const typeFilter = filterValues?.organization_type;
  const typeValues = Array.isArray(typeFilter) ? typeFilter : typeFilter ? [typeFilter] : [];

  // Show playbook filters if:
  // - No type filter active, OR
  // - Distributor or Principal is in the filter
  const showPlaybookFilters =
    !typeFilter || typeValues.includes("distributor") || typeValues.includes("principal");

  // Show operator filters if:
  // - No type filter active, OR
  // - Customer or Prospect is in the filter
  const showOperatorFilters =
    !typeFilter || typeValues.includes("customer") || typeValues.includes("prospect");

  const showPrincipalOnlyPlaybook =
    typeValues.includes("principal") && !typeValues.includes("distributor");
  const principalPlaybookChoice = PLAYBOOK_CATEGORY_CHOICES.find(
    (category) => category.name === "Principal/Manufacturer"
  );

  return (
    <div className="flex flex-col gap-4" data-tutorial="org-filters">
      {/* Starred Quick Filter - TOP of sidebar */}
      <StarredFilterToggle entityType="organizations" />

      {/* Collapsible Filter Sections */}
      <div className="flex flex-col gap-2">
        {/* Organization Type - multiselect */}
        <FilterCategory icon={<Building2 className="h-4 w-4" />} label="Organization Type">
          {ORGANIZATION_TYPE_CHOICES.map((type) => (
            <ToggleFilterButton
              multiselect
              key={type.id}
              className="w-full justify-between"
              label={
                <Badge
                  className={`text-xs px-3 py-2 min-h-[44px] flex items-center ${ORG_TYPE_COLOR_MAP[type.id as OrganizationType]}`}
                >
                  {type.name}
                </Badge>
              }
              value={{ organization_type: type.id }}
            />
          ))}
        </FilterCategory>

        {/* Category - unified section with helper text */}
        <FilterCategory icon={<Truck className="h-4 w-4" />} label="Category">
          {!typeFilter ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              <p>Select an Organization Type to filter categories</p>
            </div>
          ) : (
            <>
              {/* Playbook categories - for Distributors/Principals */}
              {showPlaybookFilters && (
                <>
                  {showPrincipalOnlyPlaybook ? (
                    <Badge
                      className={`text-xs px-3 py-2 min-h-[44px] flex items-center ${getSegmentColor(principalPlaybookChoice?.id)}`}
                    >
                      {principalPlaybookChoice?.name ?? "Principal/Manufacturer"} (fixed)
                    </Badge>
                  ) : (
                    PLAYBOOK_CATEGORY_CHOICES.map((category) => (
                      <ToggleFilterButton
                        multiselect
                        key={category.id}
                        className="w-full justify-between"
                        label={
                          <Badge
                            className={`text-xs px-3 py-2 min-h-[44px] flex items-center ${getSegmentColor(category.id)}`}
                          >
                            {category.name}
                          </Badge>
                        }
                        value={{ segment_id: category.id }}
                      />
                    ))
                  )}
                </>
              )}

              {/* Operator segments - for Customers/Prospects (grouped accordion) */}
              {showOperatorFilters && (
                <OperatorSegmentAccordion
                  filterValues={filterValues}
                  getSegmentColor={getSegmentColor}
                />
              )}
            </>
          )}
        </FilterCategory>

        {/* State - US states filter */}
        <FilterCategory icon={<MapPin className="h-4 w-4" />} label="State">
          <div className="max-h-64 overflow-y-auto">
            {US_STATES.map((state) => (
              <ToggleFilterButton
                multiselect
                key={state.id}
                className="w-full justify-between"
                label={
                  <Badge className="text-xs px-3 py-2 min-h-[44px] flex items-center tag-gray">
                    {state.name}
                  </Badge>
                }
                value={{ state: state.id }}
              />
            ))}
          </div>
        </FilterCategory>

        <FilterCategory label="Account Manager" icon={<User className="h-4 w-4" />}>
          <OwnerFilterDropdown source="sales_id" label="Account Manager" />
        </FilterCategory>
      </div>
    </div>
  );
};
