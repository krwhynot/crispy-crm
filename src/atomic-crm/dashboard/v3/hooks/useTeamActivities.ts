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

import { useState, useEffect } from "react";
import { useDataProvider } from "react-admin";

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
  const dataProvider = useDataProvider();
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch activities with sales user data via React Admin data provider
      // The unifiedDataProvider handles the join via Supabase
      const { data } = await dataProvider.getList<TeamActivity>("activities", {
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
      });

      setActivities(data);
    } catch (err) {
      console.error("[useTeamActivities] Failed to fetch activities:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch activities"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
}
