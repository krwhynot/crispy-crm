import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ActivityGroup } from "../types";
import { parseDateSafely } from "@/lib/date-utils";
import { pluralize } from "@/lib/utils/pluralize";
import { ucFirst } from "@/atomic-crm/utils";

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
    .map((word) => ucFirst(word))
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

  // Use percentage from parent - parent always provides this value
  const percentage = group.percentage ?? 0;

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
      orgCounts.set(activity.organization_id, (orgCounts.get(activity.organization_id) || 0) + 1);
    });

    const sortedOrgCounts = Array.from(orgCounts.entries()).toSorted((a, b) => b[1] - a[1]);
    const mostActiveOrgId = sortedOrgCounts[0]?.[0];
    mostActiveOrgCount = orgCounts.get(mostActiveOrgId || 0) || 0;
    mostActiveOrgDisplay = `Organization ${mostActiveOrgId}`;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <button
          onClick={onToggle}
          className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${label} section with ${pluralize(group.totalCount, "activity", "activities")}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {icon}
              </span>
              <div>
                <h3 className="font-semibold text-base">{label}</h3>
                <p className="text-sm text-muted-foreground">
                  {pluralize(group.totalCount, "activity", "activities")} • {group.uniqueOrgs}{" "}
                  unique orgs • {percentage}%
                </p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
        </button>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th
                    scope="col"
                    className="text-left py-2 px-3 font-semibold sticky left-0 bg-card"
                  >
                    Organization
                  </th>
                  <th scope="col" className="text-left py-2 px-3 font-semibold">
                    Contact
                  </th>
                  <th scope="col" className="text-left py-2 px-3 font-semibold">
                    Date
                  </th>
                  <th scope="col" className="text-left py-2 px-3 font-semibold">
                    Rep
                  </th>
                  <th scope="col" className="text-left py-2 px-3 font-semibold">
                    Subject
                  </th>
                  <th scope="col" className="text-center py-2 px-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.activities.map((activity) => (
                  <tr key={activity.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 truncate max-w-xs sticky left-0 bg-card">
                      {activity.organization_name || `Organization ${activity.organization_id}`}
                    </td>
                    <td className="py-2 px-3 truncate max-w-xs">
                      {activity.contact_name ? activity.contact_name : "—"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {parseDateSafely(activity.created_at)?.toLocaleDateString() || "—"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {salesMap.get(activity.created_by) || "Unassigned"}
                    </td>
                    <td className="py-2 px-3 truncate max-w-xs">{activity.subject}</td>
                    <td className="py-2 px-3 text-center">
                      <button className="text-primary hover:underline min-w-[44px] min-h-[44px] inline-flex items-center justify-center">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
