import { useGetList, useGetIdentity } from "react-admin";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

/**
 * Recent Activity Feed Widget
 *
 * Shows last 7 activities to provide context and jog memory.
 * Displays activity type with icon, relative timestamp, and principal link.
 *
 * Data Source: activities table
 * Filter: sales_id = current_user.sales_id
 * Sort: activity_date DESC
 * Limit: 7 most recent
 *
 * Interactions:
 * - Click activity: Open activity detail
 * - Click principal link: Filter principal table
 * - "View All Activity": Navigate to /activities
 *
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md (Widget 4)
 */

interface Activity {
  id: number;
  type: string;
  activity_date: string;
  sales_id: number;
  opportunity_id?: number;
  contact_id?: number;
  notes?: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  Call: '📞',
  Email: '📧',
  Meeting: '🤝',
  Note: '📝',
  'Follow-up': '📝',
  Presentation: '🤝',
  Demo: '🤝',
};

export const RecentActivityFeed = () => {
  const { identity } = useGetIdentity();

  const { data: activities, isPending, error } = useGetList<Activity>(
    'activities',
    {
      filter: { created_by: identity?.id }, // Note: activities use created_by, not sales_id
      sort: { field: 'activity_date', order: 'DESC' },
      pagination: { page: 1, perPage: 7 },
    },
    {
      enabled: !!identity?.id, // Don't query until identity is available
    }
  );

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Unable to load activities. Please refresh.</p>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            No recent activity logged
          </p>
          <p className="text-sm text-muted-foreground">
            Log your calls and meetings to keep your pipeline up to date and track engagement.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            to="/activities/create"
            className="text-sm text-primary hover:underline"
          >
            Log Activity →
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[280px] overflow-y-auto space-y-3">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </CardContent>
      <CardFooter>
        <Link
          to="/activities"
          className="text-sm text-primary hover:underline"
        >
          View All Activity →
        </Link>
      </CardFooter>
    </Card>
  );
};

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const icon = ACTIVITY_ICONS[activity.type] || '📋';
  const activityDate = new Date(activity.activity_date);
  const now = new Date();

  // Format based on how recent the activity is
  const timeAgo = formatDistanceToNow(activityDate, { addSuffix: true });
  const isRecent = now.getTime() - activityDate.getTime() < 24 * 60 * 60 * 1000; // Less than 24 hours

  const formattedTime = isRecent
    ? timeAgo
    : format(activityDate, 'MMM d, h:mma');

  // Truncate notes for display
  const displayNotes = activity.notes
    ? activity.notes.length > 50
      ? `${activity.notes.substring(0, 50)}...`
      : activity.notes
    : activity.type;

  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{formattedTime}</div>
      <div className="text-sm">
        <Link
          to={`/activities/${activity.id}`}
          className="hover:underline"
        >
          {icon} {activity.type} - {displayNotes}
        </Link>
      </div>
      {activity.opportunity_id && (
        <div className="text-xs text-muted-foreground ml-6">
          →{' '}
          <Link
            to={`/opportunities/${activity.opportunity_id}/show`}
            className="text-primary hover:underline"
          >
            View Opportunity
          </Link>
        </div>
      )}
    </div>
  );
}
