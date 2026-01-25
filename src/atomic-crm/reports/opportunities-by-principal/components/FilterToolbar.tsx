import { useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { AdminButton } from "@/components/admin/AdminButton";
import { MultiSelectInput } from "@/components/ra-wrappers/multi-select-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteArrayInput } from "@/components/ra-wrappers/autocomplete-array-input";
import { OPPORTUNITY_STAGE_CHOICES } from "@/atomic-crm/opportunities/constants";
import { FILTER_DEBOUNCE_MS } from "@/atomic-crm/constants/appConstants";

export interface FilterValues {
  principal_organization_id: string | null;
  stage: string[];
  opportunity_owner_id: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface FilterToolbarProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
}

/**
 * Deep equality check for filter values to prevent unnecessary state updates
 */
function areFiltersEqual(a: FilterValues, b: FilterValues): boolean {
  return (
    a.principal_organization_id === b.principal_organization_id &&
    a.opportunity_owner_id === b.opportunity_owner_id &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate &&
    JSON.stringify(a.stage) === JSON.stringify(b.stage)
  );
}

/**
 * Filter toolbar with form context for React Admin inputs
 * Wraps ReferenceInput components in FormProvider to provide required React Hook Form context
 */
export function FilterToolbar({ filters, onFiltersChange }: FilterToolbarProps) {
  const form = useForm<FilterValues>({
    defaultValues: filters,
  });

  // Watch form values using useWatch hook (isolates re-renders, no subscription leak)
  const watchedValues = useWatch({ control: form.control });

  // Extract primitive values for stable comparison
  const principalId = watchedValues.principal_organization_id ?? null;
  const stageStr = JSON.stringify(watchedValues.stage ?? []);
  const ownerId = watchedValues.opportunity_owner_id ?? null;
  const startDate = watchedValues.startDate ?? null;
  const endDate = watchedValues.endDate ?? null;

  // Debounce and only update if values actually changed (prevents render loop)
  useEffect(() => {
    const newFilters: FilterValues = {
      principal_organization_id: principalId,
      stage: watchedValues.stage ?? [],
      opportunity_owner_id: ownerId,
      startDate,
      endDate,
    };

    // CRITICAL: Only call onFiltersChange if values actually changed
    // This prevents the render loop where new object reference → re-render → new object
    if (!areFiltersEqual(newFilters, filters)) {
      const timeoutId = setTimeout(() => {
        onFiltersChange(newFilters);
      }, FILTER_DEBOUNCE_MS);

      return () => clearTimeout(timeoutId);
    }
  }, [
    principalId,
    stageStr,
    ownerId,
    startDate,
    endDate,
    filters,
    onFiltersChange,
    watchedValues.stage,
  ]);

  const hasActiveFilters =
    filters.principal_organization_id ||
    filters.stage.length > 0 ||
    filters.opportunity_owner_id ||
    filters.startDate ||
    filters.endDate;

  const clearFilters = () => {
    form.reset({
      principal_organization_id: null,
      stage: [],
      opportunity_owner_id: null,
      startDate: null,
      endDate: null,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="flex flex-wrap items-center gap-2">
        {/* Principal Filter */}
        <ReferenceInput
          source="principal_organization_id"
          reference="organizations"
          filter={{ organization_type: "principal" }}
        >
          <AutocompleteArrayInput
            label={false}
            placeholder="Filter by Principal"
            sx={{ minWidth: 200 }}
          />
        </ReferenceInput>

        {/* Stage Filter */}
        <MultiSelectInput
          source="stage"
          emptyText="All Stages"
          choices={OPPORTUNITY_STAGE_CHOICES}
          sx={{ minWidth: 150 }}
        />

        {/* Sales Rep Filter */}
        <ReferenceInput source="opportunity_owner_id" reference="sales">
          <AutocompleteArrayInput
            label={false}
            placeholder="Filter by Sales Rep"
            sx={{ minWidth: 200 }}
          />
        </ReferenceInput>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            {...form.register("startDate")}
            className="h-11 px-3 py-2 border border-border rounded text-sm"
            placeholder="From Date"
            aria-label="Filter from date"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            {...form.register("endDate")}
            className="h-11 px-3 py-2 border border-border rounded text-sm"
            placeholder="To Date"
            aria-label="Filter to date"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <AdminButton
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            type="button"
            className="h-11"
          >
            Clear Filters
          </AdminButton>
        )}
      </form>
    </FormProvider>
  );
}
