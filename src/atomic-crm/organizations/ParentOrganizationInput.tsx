import { useRecordContext } from "ra-core";
import { HierarchicalSelectInput } from "@/components/ra-wrappers/HierarchicalSelectInput";
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
 *    ensures the exclusion filter is populated before HierarchicalSelectInput renders.
 *
 * 3. **HierarchicalSelectInput** - Uses tree visualization with search for better
 *    UX with large datasets. Shows parent-child relationships with indentation.
 *    Handles orphaned nodes (parent soft-deleted) separately.
 *
 * 4. **Circular prevention** - Uses excludeIds prop to filter out self + descendants
 *    during tree building, preventing circular references at the UI layer.
 */
export const ParentOrganizationInput = () => {
  const record = useRecordContext<{ id?: number; parent_organization_id?: number }>();

  // Fetch all descendant IDs to exclude from parent selection
  const { descendants, isFetched: descendantsFetched } = useOrganizationDescendants(record?.id);

  // For existing records, wait for descendants to load before showing dropdown
  // This prevents race condition where user could select a child before filter is ready
  const isReady = !record?.id || descendantsFetched;

  // Build excludeIds: self + all descendants
  const excludeIds = [record?.id, ...descendants].filter(Boolean) as number[];

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
          Link this organization to its parent (e.g., Sysco Chicago → Sysco Corporation for regional branches)
        </p>
      </div>
    );
  }

  return (
    <HierarchicalSelectInput
      source="parent_organization_id"
      resource="organizations"
      label="Parent Organization"
      helperText="Link this organization to its parent (e.g., Sysco Chicago → Sysco Corporation for regional branches)"
      excludeIds={excludeIds}
    />
  );
};
