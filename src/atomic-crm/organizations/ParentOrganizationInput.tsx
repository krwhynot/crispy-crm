import { ReferenceInput } from "@/components/admin/reference-input";
import { useRecordContext } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../providers/supabase/supabase";

/**
 * Parent organization input that prevents hierarchy cycles.
 * Excludes self AND all descendants from the dropdown to prevent
 * users from selecting a child/grandchild as a parent.
 */
export const ParentOrganizationInput = () => {
  const record = useRecordContext<{ id?: number; parent_organization_id?: number }>();

  // Fetch all descendant IDs to exclude from parent selection
  const { data: descendants = [] } = useQuery({
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

  // Build filter: exclude self + all descendants
  // Use @not_in with array - transformArrayFilters converts to PostgREST format
  const excludeIds = [record?.id, ...descendants].filter(Boolean) as number[];
  const filter =
    excludeIds.length > 0 ? { "id@not_in": excludeIds } : {};

  return (
    <ReferenceInput
      source="parent_organization_id"
      reference="organizations"
      filter={filter}
    >
      <AutocompleteInput
        label="Parent Organization"
        emptyText="No parent organization"
        helperText="Select a parent organization if this is a branch location"
        optionText="name"
        filterToQuery={(searchText) => ({ "name@ilike": `%${searchText}%` })}
      />
    </ReferenceInput>
  );
};
