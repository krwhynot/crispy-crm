/**
 * useTeamActivities Hook
 *
 * Fetches the most recent team activities for the dashboard activity feed.
 * Returns activities with joined sales user data for avatar display.
 *
 * Features:
 * - Fetches last 10-20 activities across all team members
 * - Batch fetches sales user info (first_name, last_name, avatar_url) via useGetMany
 * - Ordered by activity_date DESC (most recent first)
 * - Excludes soft-deleted activities
 *
 * Data Flow:
 * 1. Fetch activities with useGetList
 * 2. Extract unique sales IDs from created_by fields
 * 3. Batch fetch sales records with useGetMany (auto-deduplication)
 * 4. Merge sales data into activities (O(1) lookup via Map)
 */

import { useCallback, useMemo } from "react";
import { useGetList, useGetMany } from "react-admin";
import type { Sale } from "@/atomic-crm/validation/sales";

// Activity record with joined sales user data
export interface TeamActivity {
  id: number;
  type: string; // interaction_type: call, email, meeting, etc.
  subject: string;
  activity_date: string;
  description: string | null;
  // Sales user who created the activity
  created_by: number | null;
  sales?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  // Related entities (for "View" link)
  contact_id: number | null;
  organization_id: number | null;
  opportunity_id: number | null;
}

interface UseTeamActivitiesResult {
  activities: TeamActivity[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DEFAULT_LIMIT = 15;

/**
 * Hook to fetch recent team activities for the dashboard feed
 *
 * @param limit - Number of activities to fetch (default: 15)
 * @returns Activities array, loading state, error state, and refetch function
 */
export function useTeamActivities(limit: number = DEFAULT_LIMIT): UseTeamActivitiesResult {
  // Step 1: Fetch activities from React Admin's useGetList
  const {
    data: activities = [],
    isPending: loading,
    error: queryError,
    refetch,
  } = useGetList<TeamActivity>(
    "activities",
    {
      pagination: { page: 1, perPage: limit },
      sort: { field: "activity_date", order: "DESC" },
      filter: {
        // Only non-deleted activities
        "deleted_at@is": null,
      },
    },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: true, // Refresh when user tabs back
    }
  );

  // DIAGNOSTIC: Log raw activities data immediately after fetch
  console.log("[useTeamActivities] 🔍 STEP 1 - Raw useGetList result:", {
    loading,
    activitiesCount: activities?.length,
    hasActivities: !!activities,
    firstActivity: activities?.[0],
    error: queryError,
  });

  // Step 2: Extract unique sales IDs (with memoization to prevent unnecessary re-fetches)
  const salesIds = useMemo(
    () => [...new Set(activities?.map((a) => a.created_by).filter(Boolean))],
    // Use JSON.stringify for deep comparison of array contents
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(activities?.map((a) => a.created_by))]
  );

  // DIAGNOSTIC: Log extracted sales IDs
  console.log("[useTeamActivities] 🔍 STEP 2 - Extracted sales IDs:", {
    salesIds,
    salesIdsCount: salesIds.length,
    uniqueCreatedByValues: [...new Set(activities?.map((a) => a.created_by))],
  });

  // Step 3: Batch fetch sales data using useGetMany (automatic deduplication & caching)
  const { data: salesRecords } = useGetMany<Sale>(
    "sales",
    { ids: salesIds as number[] },
    { enabled: !loading && salesIds.length > 0 }
  );

  // DIAGNOSTIC: Log useGetMany result
  console.log("[useTeamActivities] 🔍 STEP 3 - useGetMany result:", {
    enabled: !loading && salesIds.length > 0,
    salesRecordsCount: salesRecords?.length,
    salesRecords,
  });

  // Step 4: Merge activities with sales data
  const activitiesWithSales = useMemo(() => {
    if (!activities || !salesRecords) return activities || [];

    // Create lookup map for O(1) access
    const salesMap = new Map(salesRecords.map((s) => [s.id, s]));

    // Debug logging - ALWAYS log to help diagnose "Team Member" issues
    console.log("[useTeamActivities] Data merge debug:", {
      activitiesCount: activities.length,
      requestedUserIds: salesIds,
      fetchedUsers: salesRecords?.map((s) => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`.trim() || s.email || "No name",
      })),
      salesMapSize: salesMap.size,
    });

    // Debug logging to identify missing sales users
    const missingUserIds: number[] = [];

    // Merge sales data into activities
    const merged = activities.map((activity) => {
      // Look up the sales user - only create sales object if user exists
      const salesUser = activity.created_by ? salesMap.get(activity.created_by) : undefined;

      // Track missing users for debugging
      if (activity.created_by && !salesUser) {
        missingUserIds.push(activity.created_by);
      }

      return {
        ...activity,
        sales: salesUser
          ? {
              id: salesUser.id,
              first_name: salesUser.first_name,
              last_name: salesUser.last_name,
              email: salesUser.email,
              avatar_url: salesUser.avatar_url,
            }
          : undefined,
      };
    });

    // Log missing users to help debug "Team Member" fallbacks
    if (missingUserIds.length > 0) {
      console.warn(
        "[useTeamActivities] ⚠️ Sales users not found for activities:",
        [...new Set(missingUserIds)],
        "\nThis causes 'Team Member' fallback in UI."
      );
    } else {
      console.log("[useTeamActivities] ✅ All sales users found successfully");
    }

    return merged;
  }, [activities, salesRecords, salesIds]);

  // Convert error to Error type for consistent interface
  const error = queryError ? new Error(String(queryError)) : null;

  // Create a stable refetch function that matches the expected signature
  const refetchActivities = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    activities: activitiesWithSales,
    loading,
    error,
    refetch: refetchActivities,
  };
}
