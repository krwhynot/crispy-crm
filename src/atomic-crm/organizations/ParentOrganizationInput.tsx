import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { useRecordContext } from "ra-core";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { AUTOCOMPLETE_DEBOUNCE_MS } from "@/atomic-crm/utils/autocompleteDefaults";
import { useOrganizationDescendants } from "@/hooks";

/**
 * Parent organization input that prevents hierarchy cycles.
 * Excludes self AND all descendants from the dropdown to prevent
 * users from selecting a child/grandchild as a parent.
 *
 * ## Architectural Decisions (Kintsugi Stabilization 2026-01-16)
 *
 * 1. **useOrganizationDescendants hook** - Complies with PROVIDER_RULES.md
 *    (Strangler Fig pattern: no direct Supabase imports in components).
 *    The hook encapsulates the `get_organization_descendants` RPC call.
 *
 * 2. **Loading state pattern** - Prevents race condition where user could
 *    open dropdown before descendants filter is ready. The `isReady` guard
 *    ensures the exclusion filter is populated before ReferenceInput renders.
 *
 * 3. **PostgREST string format** - Uses `@not.in` with pre-formatted string
 *    `(1,2,3)` rather than array format. This is the reliable PostgREST syntax
 *    for multi-value exclusion filters.
 *
 * 4. **filterKey for refetch** - Forces ReferenceInput to remount when
 *    descendants change, preventing stale cached results.
 *
 * 5. **Smart default (root orgs)** - When search is empty, shows only root
 *    organizations (`parent_organization_id IS NULL`) for better UX.
 */
export const ParentOrganizationInput = () => {
  const record = useRecordContext<{ id?: number; parent_organization_id?: number }>();

  // Fetch all descendant IDs to exclude from parent selection
  const { descendants, isFetched: descendantsFetched } = useOrganizationDescendants(record?.id);

  // For existing records, wait for descendants to load before showing dropdown
  // This prevents race condition where user could select a child before filter is ready
  const isReady = !record?.id || descendantsFetched;

  // Build filter: exclude self + all descendants
  // Use @not.in with pre-formatted PostgREST syntax for reliable filtering
  const excludeIds = [record?.id, ...descendants].filter(Boolean) as number[];
  const filter = excludeIds.length > 0 ? { "id@not.in": `(${excludeIds.join(",")})` } : {};

  // Force ReferenceInput to refetch when descendants change
  // This prevents stale results from before descendants query completed
  const filterKey = excludeIds.join(",");

  // Show loading state while fetching descendants for existing records
  // This prevents the race condition where dropdown opens before filter is ready
  if (!isReady) {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Parent Organization</span>
        <div
          className="h-10 bg-muted animate-pulse rounded-md flex items-center px-3"
          aria-label="Loading parent organization options"
        >
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
          searchText ? { "name@ilike": `%${searchText}%` } : { "parent_organization_id@is": "null" }
        }
      />
    </ReferenceInput>
  );
};
