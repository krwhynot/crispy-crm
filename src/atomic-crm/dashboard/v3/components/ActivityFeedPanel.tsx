/**
 * ActivityFeedPanel - Team Activity Feed for Dashboard
 *
 * Displays the last 10-20 team activities with:
 * - User avatar (with initials fallback)
 * - Activity type icon
 * - Subject line
 * - Relative timestamp (e.g., "2 hours ago")
 * - "View All" link to activities list
 *
 * Design:
 * - Card-based layout matching kanban panel pattern
 * - Desktop-first responsive design (lg: breakpoint)
 * - Semantic colors only (no hex values)
 * - 44px minimum touch targets
 *
 * Data Flow:
 * useTeamActivities() hook → ActivityFeedPanel → ActivityItem (memoized)
 */

import { memo, useMemo } from "react";
import { pluralize } from "@/lib/utils/pluralize";
// Card wrapper removed - parent DashboardTabPanel provides container
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Activity } from "lucide-react";
import { useTeamActivities, type TeamActivity } from "../hooks/useTeamActivities";
import { getActivityIcon, ucFirst } from "@/atomic-crm/utils";
import { parseDateSafely } from "@/lib/date-utils";

/**
 * Format activity type for display
 * Converts snake_case to Title Case (e.g., "follow_up" → "Follow Up")
 */
function formatActivityType(type: string): string {
  return type
    .split("_")
    .map((word) => ucFirst(word))
    .join(" ");
}

/**
 * Format relative time from activity date
 * Returns human-readable strings like "2 hours ago", "Yesterday", "3 days ago"
 */
function formatRelativeTime(dateString: string): string {
  const date = parseDateSafely(dateString);
  if (!date) return "Unknown";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    // Format as short date for older activities
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

/**
 * Get initials from first and last name, with fallback to email or "TM"
 */
function getInitials(
  firstName: string | null,
  lastName: string | null,
  email: string | null
): string {
  // Use actual names if available
  if (firstName || lastName) {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "?";
  }

  // Fallback to email username initial
  if (email) {
    const username = email.split("@")[0];
    return username.charAt(0).toUpperCase() || "?";
  }

  // Last resort: "Team Member" → "TM"
  return "TM";
}

/**
 * Get display name from sales user data
 * Falls back to email username if no name, or "Team Member" as last resort
 */
function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string | null
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName || lastName) {
    return firstName || lastName || "";
  }
  // Extract username from email (before @)
  if (email) {
    return email.split("@")[0];
  }
  return "Team Member";
}

interface ActivityFeedPanelProps {
  /** Number of activities to display (default: 15) */
  limit?: number;
}

/**
 * ActivityFeedPanel - Main component for team activity feed
 */
function ActivityFeedPanel({ limit = 15 }: ActivityFeedPanelProps) {
  const { activities, loading, error } = useTeamActivities(limit);

  // Memoize activity count to avoid recalculation
  const activityCount = useMemo(() => activities.length, [activities]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col p-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5" />
          Team Activity
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">Failed to load activities</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" data-tutorial="dashboard-activity-feed">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5 text-primary" />
              Team Activity
            </h3>
            <p className="text-sm text-muted-foreground">Recent activities across the team</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 gap-1 text-primary hover:text-primary/80"
            onClick={() => {
              window.location.href = "/#/activities";
            }}
            aria-label="View all activities"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {activityCount > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing {pluralize(activityCount, "recent activity", "recent activities")}
          </p>
        )}
      </div>

      <div>
        {activities.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No recent activities</p>
              <p className="text-xs text-muted-foreground/70">
                Activities will appear here as your team logs them
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Named export for barrel, default export for lazy loading
export { ActivityFeedPanel };
export default ActivityFeedPanel;

interface ActivityItemProps {
  activity: TeamActivity;
}

/**
 * ActivityItem - Memoized individual activity entry
 *
 * Each item displays:
 * - User avatar with initials fallback
 * - Activity type icon
 * - Subject line (truncated)
 * - Relative timestamp
 */
const ActivityItem = memo(function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = getActivityIcon(activity.type);
  const sales = activity.sales;

  const fullName = getDisplayName(
    sales?.first_name || null,
    sales?.last_name || null,
    sales?.email || null
  );
  const initials = getInitials(
    sales?.first_name || null,
    sales?.last_name || null,
    sales?.email || null
  );
  const relativeTime = formatRelativeTime(activity.activity_date);
  const formattedType = formatActivityType(activity.type);

  return (
    <div
      className="interactive-card flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
      role="article"
      aria-label={`${formattedType} by ${fullName}: ${activity.subject}`}
    >
      {/* User Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={sales?.avatar_url || undefined} alt={fullName} />
        <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Activity Content */}
      <div className="min-w-0 flex-1">
        {/* Header: Type icon + User name */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted"
            title={formattedType}
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="truncate text-sm font-medium text-foreground">{fullName}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{formattedType}</span>
        </div>

        {/* Subject line */}
        <p className="mt-0.5 truncate text-sm text-foreground/80">{activity.subject}</p>

        {/* Timestamp */}
        <p className="mt-1 text-xs text-muted-foreground">{relativeTime}</p>
      </div>
    </div>
  );
});
