import { ReferenceInput } from "@/components/admin/reference-input";
import { useRecordContext } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../providers/supabase/supabase";
import { AUTOCOMPLETE_DEBOUNCE_MS } from "@/atomic-crm/utils/autocompleteDefaults";

/**
 * Parent organization input that prevents hierarchy cycles.
 * Excludes self AND all descendants from the dropdown to prevent
 * users from selecting a child/grandchild as a parent.
 */
export const ParentOrganizationInput = () => {
  const record = useRecordContext<{ id?: number; parent_organization_id?: number }>();

  // Fetch all descendant IDs to exclude from parent selection
  const { data: descendants = [], isFetched: descendantsFetched } = useQuery({
    queryKey: ["org-descendants", record?.id],
    queryFn: async () => {
      if (!record?.id) return [];
      const { data, error } = await supabase.rpc("get_organization_descendants", {
        org_id: record.id,
      });
      if (error) throw error;
      return (data as number[]) || [];
    },
    enabled: !!record?.id,
    staleTime: 30000, // Cache for 30s - hierarchy doesn't change often
  });

  // For existing records, wait for descendants to load before showing dropdown
  // This prevents race condition where user could select a child before filter is ready
  const isReady = !record?.id || descendantsFetched;

  // Build filter: exclude self + all descendants
  // Use @not.in with pre-formatted PostgREST syntax for reliable filtering
  const excludeIds = [record?.id, ...descendants].filter(Boolean) as number[];
  const filter =
    excludeIds.length > 0 ? { "id@not.in": `(${excludeIds.join(",")})` } : {};

  // Force ReferenceInput to refetch when descendants change
  // This prevents stale results from before descendants query completed
  const filterKey = excludeIds.join(",");

  // Show loading state while fetching descendants for existing records
  // This prevents the race condition where dropdown opens before filter is ready
  if (!isReady) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Parent Organization</label>
        <div className="h-10 bg-muted animate-pulse rounded-md flex items-center px-3">
          <span className="text-sm text-muted-foreground">Loading hierarchy...</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a parent organization if this is a branch location
        </p>
      </div>
    );
  }

  return (
    <ReferenceInput
      key={filterKey}
      source="parent_organization_id"
      reference="organizations"
      filter={filter}
    >
      <AutocompleteInput
        debounce={AUTOCOMPLETE_DEBOUNCE_MS}
        label="Parent Organization"
        emptyText="No parent organization"
        helperText="Select a parent organization if this is a branch location"
        optionText="name"
        filterToQuery={(searchText) =>
          searchText
            ? { "name@ilike": `%${searchText}%` }
            : { "parent_organization_id@is": "null" }
        }
      />
    </ReferenceInput>
  );
};
