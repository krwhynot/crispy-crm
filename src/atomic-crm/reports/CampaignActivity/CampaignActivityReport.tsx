import React, { useMemo, useState } from "react";
import { useGetList } from "ra-core";
import { ReportLayout } from "@/atomic-crm/reports/ReportLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTypeCard } from "./ActivityTypeCard";

interface Activity {
  id: number;
  type: string;
  subject: string;
  created_at: string;
  created_by: number;
  organization_id: number;
  contact_id: number | null;
  organization_name: string;
  contact_name?: string;
}

interface Sale {
  id: number;
  first_name: string;
  last_name: string;
}

interface ActivityGroup {
  type: string;
  activities: Activity[];
  totalCount: number;
  uniqueOrgs: number;
  percentage: number;
  mostActiveOrg: string;
  mostActiveCount: number;
}

export default function CampaignActivityReport() {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Fetch activities for the campaign (MVP: hardcode campaign or use default)
  const { data: activities = [] } = useGetList<Activity>(
    "activities",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "opportunities.campaign": "Grand Rapids Trade Show",
        "opportunities.deleted_at@is": null,
      },
      sort: { field: "created_at", order: "DESC" },
    }
  );

  // Get sales rep names for created_by lookup
  const ownerIds = useMemo(
    () =>
      Array.from(
        new Set(
          (activities || [])
            .map((a) => a.created_by)
            .filter(Boolean)
        )
      ),
    [activities]
  );

  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    filter: ownerIds.length > 0 ? { id: ownerIds } : undefined,
    pagination: { page: 1, perPage: 100 },
  });

  const salesMap = useMemo(
    () => new Map((salesReps || []).map((s) => [s.id, `${s.first_name} ${s.last_name}`])),
    [salesReps]
  );

  // Group activities by type
  const activityGroups = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    const grouped = new Map<string, ActivityGroup>();
    const totalActivities = activities.length;

    activities.forEach((activity) => {
      const type = activity.type || "Unknown";

      if (!grouped.has(type)) {
        grouped.set(type, {
          type,
          activities: [],
          totalCount: 0,
          uniqueOrgs: 0,
          percentage: 0,
          mostActiveOrg: "",
          mostActiveCount: 0,
        });
      }

      const group = grouped.get(type)!;
      group.activities.push(activity);
      group.totalCount += 1;
    });

    // Calculate metrics for each group
    const result = Array.from(grouped.values()).map((group) => {
      const orgCounts = new Map<number, { name: string; count: number }>();

      group.activities.forEach((activity) => {
        const orgId = activity.organization_id;
        if (!orgCounts.has(orgId)) {
          orgCounts.set(orgId, { name: activity.organization_name || `Organization ${orgId}`, count: 0 });
        }
        orgCounts.get(orgId)!.count += 1;
      });

      const uniqueOrgs = orgCounts.size;
      const sortedOrgs = Array.from(orgCounts.entries()).sort((a, b) => b[1].count - a[1].count);
      const [, mostActiveData] = sortedOrgs[0] || [null, { name: "N/A", count: 0 }];

      return {
        ...group,
        uniqueOrgs,
        percentage: Math.round((group.totalCount / totalActivities) * 100),
        mostActiveOrg: mostActiveData.name,
        mostActiveCount: mostActiveData.count,
      };
    });

    return result.sort((a, b) => b.totalCount - a.totalCount);
  }, [activities]);

  // Auto-expand top 3 activity types on load
  React.useEffect(() => {
    if (activityGroups.length > 0 && expandedTypes.size === 0) {
      const topThreeTypes = new Set(activityGroups.slice(0, 3).map((g) => g.type));
      setExpandedTypes(topThreeTypes);
    }
  }, [activityGroups, expandedTypes.size]);

  // Calculate summary metrics
  const totalActivities = activities.length;
  const uniqueOrgs = new Set(activities.map((a) => a.organization_id)).size;
  const totalOpportunities = 369; // Hardcoded for MVP, will be parameterized later
  const coverageRate = totalOpportunities > 0 ? Math.round((uniqueOrgs / totalOpportunities) * 100) : 0;
  const avgActivitiesPerLead = totalOpportunities > 0 ? (totalActivities / totalOpportunities).toFixed(1) : "0.0";

  const handleToggle = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  return (
    <ReportLayout title="Campaign Activity Report">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organizations Contacted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueOrgs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coverage Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverageRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Activities per Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgActivitiesPerLead}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Type Breakdown */}
      {activityGroups.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Activity Type Breakdown</h3>
          {activityGroups.map((group) => (
            <ActivityTypeCard
              key={group.type}
              group={group}
              isExpanded={expandedTypes.has(group.type)}
              onToggle={() => handleToggle(group.type)}
              salesMap={salesMap}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-muted-foreground p-8 text-center">
          <p className="text-muted-foreground">No activities found for this campaign</p>
          <p className="text-sm text-muted-foreground mt-2">
            Activities will appear here once your team starts engaging with leads
          </p>
        </div>
      )}
    </ReportLayout>
  );
}