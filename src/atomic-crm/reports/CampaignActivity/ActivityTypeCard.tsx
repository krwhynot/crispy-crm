import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Activity {
  id: number;
  type: string;
  subject: string;
  created_at: string;
  created_by: number;
  organization_id: number;
  contact_id: number | null;
}

interface ActivityGroup {
  type: string;
  activities: Activity[];
  totalCount: number;
  uniqueOrgs: number;
  percentage?: number;
  mostActiveOrg?: string;
  mostActiveCount?: number;
}

interface ActivityTypeCardProps {
  group: ActivityGroup;
  isExpanded: boolean;
  onToggle: () => void;
  salesMap: Map<number, string>;
}

const ACTIVITY_ICONS: Record<string, string> = {
  call: "📞",
  email: "✉️",
  meeting: "🤝",
  note: "📝",
  demo: "🎯",
  proposal: "📋",
  "follow-up": "🔄",
  "trade-show": "🎪",
  "site-visit": "🏢",
  "contract-review": "📄",
  "check-in": "✔️",
  social: "💬",
};

const getActivityTypeLabel = (type: string): string => {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const ActivityTypeCard: React.FC<ActivityTypeCardProps> = ({
  group,
  isExpanded,
  onToggle,
  salesMap,
}) => {
  const icon = ACTIVITY_ICONS[group.type.toLowerCase()] || "📌";
  const label = getActivityTypeLabel(group.type);

  // Use percentage from parent if available, otherwise calculate for backwards compatibility
  const percentage = group.percentage ?? Math.round((group.totalCount / 247) * 100);

  // Use provided most active org data if available, otherwise calculate
  let mostActiveOrgDisplay: string;
  let mostActiveOrgCount: number;

  if (group.mostActiveOrg && group.mostActiveCount !== undefined) {
    mostActiveOrgDisplay = group.mostActiveOrg;
    mostActiveOrgCount = group.mostActiveCount;
  } else {
    // Fallback calculation for backwards compatibility
    const orgCounts = new Map<number, number>();
    group.activities.forEach((activity) => {
      orgCounts.set(
        activity.organization_id,
        (orgCounts.get(activity.organization_id) || 0) + 1
      );
    });

    const sortedOrgCounts = Array.from(orgCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const mostActiveOrgId = sortedOrgCounts[0]?.[0];
    mostActiveOrgCount = orgCounts.get(mostActiveOrgId || 0) || 0;
    mostActiveOrgDisplay = `Organization ${mostActiveOrgId}`;
  }

  return (
    <Card
      className="mb-4 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onToggle}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-semibold text-base">{label}</h3>
              <p className="text-sm text-muted-foreground">
                {group.totalCount} activities • {group.uniqueOrgs} unique orgs • {percentage}%
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </CardHeader>

      {!isExpanded && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Most active:{" "}
            <span className="font-medium">
              {mostActiveOrgDisplay} ({mostActiveOrgCount} {group.type}
              {mostActiveOrgCount !== 1 ? "s" : ""})
            </span>
          </p>
        </CardContent>
      )}

      {isExpanded && (
        <CardContent className="pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold">Organization</th>
                <th className="text-left py-2 px-3 font-semibold">Contact</th>
                <th className="text-left py-2 px-3 font-semibold">Date</th>
                <th className="text-left py-2 px-3 font-semibold">Rep</th>
                <th className="text-left py-2 px-3 font-semibold">Subject</th>
                <th className="text-center py-2 px-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {group.activities.map((activity) => (
                <tr key={activity.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 truncate max-w-xs">
                    {activity.organization_name || `Organization ${activity.organization_id}`}
                  </td>
                  <td className="py-2 px-3 truncate max-w-xs">
                    {activity.contact_name ? activity.contact_name : "—"}
                  </td>
                  <td className="py-2 px-3">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3">
                    {salesMap.get(activity.created_by) || "Unassigned"}
                  </td>
                  <td className="py-2 px-3 truncate max-w-xs">{activity.subject}</td>
                  <td className="py-2 px-3 text-center">
                    <button className="text-primary hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      )}
    </Card>
  );
};