import { useGetList, useGetIdentity } from "react-admin";
import { OpportunitiesByPrincipalDesktop } from "./OpportunitiesByPrincipalDesktop";
import type { RaRecord } from "react-admin";

interface DashboardPrincipalSummary extends RaRecord {
  id: number;
  principal_name: string;
  account_manager_id: number;
  opportunity_count: number;
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
  const { identity } = useGetIdentity();

  // Fetch principal summary data
  const { data, isLoading } = useGetList<DashboardPrincipalSummary>(
    "dashboard_principal_summary",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "priority_score", order: "DESC" },
      filter: identity?.accountManagerId
        ? { account_manager_id: identity.accountManagerId }
        : {},
    }
  );

  // Transform data to match OpportunitiesByPrincipalDesktop's interface
  const transformedData = data?.map((record) => ({
    principalId: String(record.id),
    principalName: record.principal_name,
    opportunityCount: record.opportunity_count,
    // Calculate weekly activities (days since last activity < 7)
    weeklyActivities: record.days_since_last_activity !== null && record.days_since_last_activity < 7 ? 1 : 0,
    // For now, use empty array for assigned reps (can be enhanced later)
    assignedReps: identity?.full_name ? [identity.full_name] : [],
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading principals...</div>
      </div>
    );
  }

  return <OpportunitiesByPrincipalDesktop data={transformedData} />;
};
