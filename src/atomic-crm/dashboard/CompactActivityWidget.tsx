import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { useTeamActivities, type TeamActivity } from "./useTeamActivities";
import { getActivityIcon, ucFirst, getInitials, extractEmailLocalPart } from "@/atomic-crm/utils";
import { parseDateSafely } from "@/lib/date-utils";

/**
 * Module-level formatter for short dates (e.g., "Feb 13").
 * Created once at module load instead of on every render.
 */
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/**
 * Format a date string as a compact relative time string.
 * Ranges from "Just now" through "Xm ago", "Xh ago", "Yesterday", "Xd ago",
 * to a short date format for older entries.
 */
function formatRelativeTime(dateString: string): string {
  const date = parseDateSafely(dateString);
  if (!date) return "Unknown";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return shortDateFormatter.format(date);
}

/**
 * Build a display name from available fields, falling back through
 * first+last name, first or last only, email local part, then a generic label.
 */
function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string | null
): string {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName || lastName) return firstName || lastName || "";
  if (email) return extractEmailLocalPart(email);
  return "Team Member";
}

interface CompactActivityItemProps {
  activity: TeamActivity;
}

/**
 * A single compact activity row showing avatar, name, relative time,
 * activity type icon, and truncated subject line.
 * Links to the activity detail view. Min height 44px for touch targets.
 */
function CompactActivityItem({ activity }: CompactActivityItemProps) {
  const sales = activity.sales;
  const displayName = getDisplayName(
    sales?.first_name ?? null,
    sales?.last_name ?? null,
    sales?.email ?? null
  );
  const initials = getInitials(sales?.first_name, sales?.last_name);
  const ActivityIcon = getActivityIcon(activity.type);
  const activityLabel = ucFirst(activity.type);

  return (
    <Link
      to={`/activities?view=${activity.id}`}
      className="flex items-center gap-2 px-3 py-2 min-h-[44px] hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${displayName}: ${activityLabel} - ${activity.subject}`}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        {sales?.avatar_url && <AvatarImage src={sales.avatar_url} alt={displayName} />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatRelativeTime(activity.activity_date)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ActivityIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {activityLabel}: {activity.subject}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Loading skeleton for the compact activity list
 */
function CompactActivitySkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 min-h-[44px]" aria-busy="true">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * CompactActivityWidget - Compact 200px-tall team activity feed card
 * for the V4 dashboard widget row.
 *
 * Fetches the 4 most recent team activities and displays them in a
 * condensed list with avatars, names, relative timestamps, and subjects.
 *
 * Features:
 * - Uses useTeamActivities(4) for compact feed
 * - Avatar with initials fallback
 * - Relative time formatting
 * - Activity type icons via getActivityIcon
 * - Loading, error, and empty states
 * - Touch targets >= 44px
 *
 * @example
 * ```tsx
 * <CompactActivityWidget />
 * ```
 */
export function CompactActivityWidget() {
  const { activities, loading, error } = useTeamActivities(5);

  return (
    <Card className="flex flex-col" data-tutorial="dashboard-compact-activity">
      <CardHeader className="py-2 px-3 shrink-0 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
        <Link
          to="/activities"
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {loading ? (
          <CompactActivitySkeleton />
        ) : error ? (
          <div className="flex items-center justify-center h-full px-3">
            <p className="text-sm text-muted-foreground">Unable to load activities.</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.slice(0, 4).map((activity) => (
              <CompactActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CompactActivityWidget;
