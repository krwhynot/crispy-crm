/**
 * useTeamActivities Hook
 *
 * Fetches the most recent team activities for the dashboard activity feed.
 * Returns activities with joined sales user data for avatar display.
 *
 * Features:
 * - Fetches last 10-20 activities across all team members
 * - Includes sales user info (first_name, last_name, avatar_url) via join
 * - Ordered by activity_date DESC (most recent first)
 * - Excludes soft-deleted activities
 *
 * Data Flow:
 * activities JOIN sales ON created_by = sales.id
 */

import { useCallback } from "react";
import { useGetList } from "react-admin";

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
  // Fetch activities with sales user data via React Admin's useGetList
  // The unifiedDataProvider handles the join via Supabase
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
      meta: {
        // Request sales user data via select query
        select: `
          id,
          type,
          subject,
          activity_date,
          description,
          created_by,
          contact_id,
          organization_id,
          opportunity_id,
          sales:created_by (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `,
      },
    },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: true, // Refresh when user tabs back
    }
  );

  // Convert error to Error type for consistent interface
  const error = queryError ? new Error(String(queryError)) : null;

  // Create a stable refetch function that matches the expected signature
  const refetchActivities = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    activities,
    loading,
    error,
    refetch: refetchActivities,
  };
}
