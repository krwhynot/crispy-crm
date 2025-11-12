import { useGetList } from "react-admin";
import { Link, useNavigate } from "react-router-dom";
import { subDays, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Activity as ActivityIcon } from "lucide-react";
import { DashboardWidget } from "./DashboardWidget";
import { formatRelativeTime } from "@/atomic-crm/utils/formatRelativeTime";
import { getActivityIcon } from "@/atomic-crm/utils/getActivityIcon";
import type { ActivityRecord } from "../types";
import { useMemo } from "react";

/**
 * Recent Activity Feed Widget
 *
 * Rebuilt from scratch with table-style design matching principal table.
 * Displays last 7 days of activities in chronological order (newest first).
 *
 * Design: docs/plans/2025-11-12-sidebar-widget-redesign.md (Task 3)
 *
 * Table Structure:
 * - Header: "RECENT ACTIVITY" with count badge
 * - Columns: [Type Icon] [Description] [Timestamp]
 * - Row height: h-8 (matching principal table)
 * - Hover: hover:bg-muted/30 (matching principal table)
 *
 * Interactions:
 * - Row click: Navigate to /activities/{id}
 * - Footer link: Navigate to /activities
 */

export const RecentActivityFeed = () => {
  const navigate = useNavigate();

  // Stabilize the date filter using useMemo to prevent re-fetching on every render.
  // This creates a stable query key for useGetList.
  const sevenDaysAgoFilter = useMemo(
    () => subDays(startOfDay(new Date()), 7).toISOString(),
    []
  );

  const { data: activities, isPending, error } = useGetList<ActivityRecord>(
    "activities",
    {
      filter: {
        "created_at@gte": sevenDaysAgoFilter,
      },
      sort: { field: "created_at", order: "DESC" },
      pagination: { page: 1, perPage: 7 },
    }
  );

  const totalActivities = activities?.length || 0;

  return (
    <DashboardWidget
      title={
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-4 h-4" />
          <span>RECENT ACTIVITY</span>
        </div>
      }
      className="col-span-full"
    >
      {/* Loading state */}
      {isPending && (
        <div className="w-full">
          {/* Loading skeleton rows */}
          <div className="px-3 py-2 space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="text-center py-2 text-xs text-muted-foreground">Loading activities...</div>
        </div>
      )}

      {/* Error state */}
      {!isPending && error && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm text-destructive">Failed to load activities</p>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-border px-3 py-2">
            <Link to="/activities" className="text-sm text-primary hover:underline">
              View all activities →
            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isPending && !error && totalActivities === 0 && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-border px-3 py-2">
            <Link to="/activities" className="text-sm text-primary hover:underline">
              View all activities →
            </Link>
          </div>
        </div>
      )}

      {/* Success state with activities */}
      {!isPending && !error && totalActivities > 0 && (
        <div className="w-full">
          {/* Header with count badge */}
          <div className="border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                {totalActivities}
              </Badge>
            </div>
          </div>

          {/* Table rows */}
          <div className="max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                onRowClick={(activityId) => navigate(`/activities/${activityId}`)}
              />
            ))}
          </div>

          {/* Footer with border */}
          <div className="border-t-2 border-border px-3 py-2">
            <Link to="/activities" className="text-sm text-primary hover:underline">
              View all activities →
            </Link>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
};

/**
 * Activity Row Component
 * Individual activity row with icon, description, and timestamp
 */
interface ActivityRowProps {
  activity: ActivityRecord;
  onRowClick: (activityId: number) => void;
}

function ActivityRow({ activity, onRowClick }: ActivityRowProps) {
  const Icon = getActivityIcon(activity.type);

  const handleRowClick = () => {
    onRowClick(activity.id as number);
  };

  // Format description: {activity_type} with {contact_name} · {organization_name}
  // For now, we'll use subject as description (we'd need to join contact/org data for full description)
  const description = activity.subject || activity.type;

  return (
    <div
      className="h-8 px-3 py-1 flex items-center gap-3 hover:bg-muted/30 cursor-pointer border-b border-border/50"
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      aria-label={`View activity: ${description}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
    >
      {/* Type Icon */}
      <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />

      {/* Description */}
      <span className="flex-1 text-sm truncate">{description}</span>

      {/* Timestamp */}
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formatRelativeTime(activity.created_at)}
      </span>
    </div>
  );
}
