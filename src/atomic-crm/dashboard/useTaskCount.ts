import { useGetList } from "react-admin";
import { useCurrentSale } from "./useCurrentSale";
import { SHORT_STALE_TIME_MS } from "@/atomic-crm/constants";

interface UseTaskCountResult {
  pendingCount: number;
  isLoading: boolean;
}

/**
 * Returns count of pending tasks for badge display.
 * Uses server-side pagination (perPage: 1) for efficient counting.
 *
 * Note: Uses useCurrentSale() internally for salesId, matching
 * the pattern used by useMyTasks and other dashboard hooks.
 */
export function useTaskCount(): UseTaskCountResult {
  const { salesId, loading: salesLoading } = useCurrentSale();

  const { total, isLoading } = useGetList(
    "tasks",
    {
      pagination: { page: 1, perPage: 1 },
      filter: {
        sales_id: salesId,
        completed: false,
        "deleted_at@is": null,
      },
    },
    {
      enabled: !salesLoading && !!salesId,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: true, // Refresh when user tabs back
    }
  );

  return {
    pendingCount: total ?? 0,
    isLoading: isLoading || salesLoading,
  };
}
