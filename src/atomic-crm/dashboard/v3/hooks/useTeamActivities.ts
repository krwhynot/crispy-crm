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
 *
 * NOTE: Uses Supabase client directly instead of React Admin data provider
 * because ra-supabase-core doesn't support custom `meta.select` for joins.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

// Sales user data from joined query
interface SalesUser {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

// Activity record with joined sales user data
export interface TeamActivity {
  id: number;
  type: string; // interaction_type: call, email, meeting, etc.
  subject: string;
  activity_date: string;
  description: string | null;
  // Sales user who created the activity
  created_by: number | null;
  sales: SalesUser | null;
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
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use Supabase client directly for proper join support
      // ra-supabase-core's dataProvider ignores meta.select, so joins don't work
      const { data, error: queryError } = await supabase
        .from("activities")
        .select(`
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
        `)
        .is("deleted_at", null)
        .order("activity_date", { ascending: false })
        .limit(limit);

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Type assertion: Supabase returns the joined data correctly
      setActivities((data as TeamActivity[]) || []);
    } catch (err) {
      console.error("[useTeamActivities] Failed to fetch activities:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch activities"));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
}
