/**
 * useTeamActivities Hook
 *
 * Fetches the most recent team activities for the dashboard activity feed.
 * Returns activities with joined sales user data for avatar display.
 *
 * Features:
 * - Fetches last 10-20 activities across all team members
 * - Uses activities_summary view with pre-joined creator data (bypasses PostgREST FK nullification)
 * - Ordered by activity_date DESC (most recent first)
 * - Excludes soft-deleted activities
 *
 * Data Flow:
 * 1. Fetch activities from activities_summary view (includes creator_first_name, creator_last_name, etc.)
 * 2. Transform view fields into sales object shape for backward compatibility
 */

import { useCallback, useMemo } from "react";
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
  // Pre-joined creator fields from activities_summary view
  creator_first_name: string | null;
  creator_last_name: string | null;
  creator_email: string | null;
  creator_avatar_url: string | null;
  // Transformed sales object for backward compatibility with ActivityFeedPanel
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
  // Fetch activities from activities_summary view (includes pre-joined creator data)
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
        // View already filters deleted_at IS NULL, but explicit filter doesn't hurt
        "deleted_at@is": null,
      },
    },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: true, // Refresh when user tabs back
    }
  );

  // Transform view fields into sales object shape for backward compatibility
  const activitiesWithSales = useMemo(() => {
    if (!activities) return [];

    return activities.map((activity) => ({
      ...activity,
      // Create sales object from pre-joined creator fields
      sales: activity.created_by
        ? {
            id: activity.created_by,
            first_name: activity.creator_first_name || null,
            last_name: activity.creator_last_name || null,
            email: activity.creator_email || null,
            avatar_url: activity.creator_avatar_url || null,
          }
        : undefined,
    }));
  }, [activities]);

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
