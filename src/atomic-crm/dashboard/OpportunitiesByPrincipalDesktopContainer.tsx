import { useGetList } from "react-admin";
import { OpportunitiesByPrincipalDesktop } from "./OpportunitiesByPrincipalDesktop";
import type { RaRecord } from "react-admin";

interface DashboardPrincipalSummary extends RaRecord {
  id: number;
  principal_name: string;
  opportunity_count: number;
  weekly_activity_count: number;
  assigned_reps: string[];
  last_activity_date: string | null;
  last_activity_type: string | null;
  days_since_last_activity: number | null;
  status_indicator: "good" | "warning" | "urgent";
  max_days_in_stage: number;
  is_stuck: boolean;
  next_action: string | null;
  priority_score: number;
}

/**
 * Container component that fetches dashboard data and transforms it
 * for the desktop-optimized OpportunitiesByPrincipalDesktop component
 */
export const OpportunitiesByPrincipalDesktopContainer = () => {
  // Fetch principal summary data
  const { data, isLoading, error } = useGetList<DashboardPrincipalSummary>(
    "dashboard_principal_summary",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "priority_score", order: "DESC" },
    }
  );

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive font-medium">
            Failed to load principal dashboard
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message || "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading principals...</div>
      </div>
    );
  }

  // Transform data to match OpportunitiesByPrincipalDesktop's interface
  const transformedData = data?.map((record) => ({
    principalId: String(record.id),
    principalName: record.principal_name,
    opportunityCount: record.opportunity_count,
    weeklyActivities: record.weekly_activity_count,
    assignedReps: record.assigned_reps,
  })) || [];

  return <OpportunitiesByPrincipalDesktop data={transformedData} />;
};
