import { useQuery } from "@tanstack/react-query";
import { useDataProvider } from "ra-core";

import { orgDescendantKeys } from "@/atomic-crm/queryKeys";
import { SHORT_STALE_TIME_MS } from "@/atomic-crm/constants";

/**
 * Hook to fetch all descendant organization IDs for hierarchy cycle prevention.
 *
 * Used by ParentOrganizationInput to exclude self + descendants from parent
 * selection dropdown, preventing circular references in the org hierarchy.
 *
 * @param orgId - The organization ID to get descendants for
 * @returns descendants array, loading state, and fetched state
 */
export interface UseOrganizationDescendantsReturn {
  descendants: number[];
  isLoading: boolean;
  isFetched: boolean;
}

export function useOrganizationDescendants(
  orgId: number | undefined
): UseOrganizationDescendantsReturn {
  const dataProvider = useDataProvider();

  const {
    data: descendants = [],
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: orgDescendantKeys.detail(orgId!),
    queryFn: async () => {
      if (!orgId) return [];
      const result = await dataProvider.invoke("get_organization_descendants", {
        org_id: orgId,
      });
      return (result.data as number[]) || [];
    },
    enabled: !!orgId,
    staleTime: SHORT_STALE_TIME_MS, // Cache for 30s - hierarchy doesn't change often
  });

  return { descendants, isLoading, isFetched };
}
