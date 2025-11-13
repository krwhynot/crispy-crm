import { useGetList, useGetIdentity } from "react-admin";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * Upcoming Events by Principal Widget
 *
 * Shows this week's scheduled tasks and activities grouped by principal organization.
 * Helps answer: "What commitments do I have this week per principal?"
 *
 * Data Source:
 * - tasks table: incomplete tasks due within 7 days
 * - activities table: scheduled activities within 7 days
 *
 * Grouping: By principal_organization_id
 * Sorting: By principal status (urgent → warning → good), then by event date
 *
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md (Widget 1)
 */

interface Task {
  id: number;
  title: string;
  due_date: string;
  opportunity_id: number;
  completed: boolean;
}

interface Activity {
  id: number;
  type: string;
  activity_date: string;
  opportunity_id: number;
  notes?: string;
}

interface PrincipalEvent {
  principalId: number;
  principalName: string;
  status: "good" | "warning" | "urgent";
  events: Array<{
    id: string;
    type: "task" | "activity";
    title: string;
    date: Date;
    description?: string;
  }>;
}

const STATUS_EMOJIS = {
  urgent: "🔴",
  warning: "🟡",
  good: "🟢",
};

const STATUS_PRIORITY = {
  urgent: 1,
  warning: 2,
  good: 3,
};

export const UpcomingEventsByPrincipal = () => {
  const { identity } = useGetIdentity();
  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);

  // Fetch upcoming incomplete tasks
  const {
    data: tasks,
    isPending: tasksLoading,
    error: tasksError,
  } = useGetList<Task>(
    "tasks",
    {
      filter: {
        completed: false,
        "due_date@gte": format(startOfDay(today), "yyyy-MM-dd"),
        "due_date@lte": format(endOfDay(sevenDaysFromNow), "yyyy-MM-dd"),
      },
      sort: { field: "due_date", order: "ASC" },
    },
    {
      enabled: !!identity?.id, // Don't query until identity is available
    }
  );

  // Fetch upcoming scheduled activities
  const {
    data: activities,
    isPending: activitiesLoading,
    error: activitiesError,
  } = useGetList<Activity>(
    "activities",
    {
      filter: {
        created_by: identity?.id, // Note: activities use created_by, not sales_id
        "activity_date@gte": format(startOfDay(today), "yyyy-MM-dd"),
        "activity_date@lte": format(endOfDay(sevenDaysFromNow), "yyyy-MM-dd"),
      },
      sort: { field: "activity_date", order: "ASC" },
    },
    {
      enabled: !!identity?.id, // Don't query until identity is available
    }
  );

  // Fetch principal summary for status indicators
  const { data: principals } = useGetList(
    "dashboard_principal_summary",
    {
      filter: { account_manager_id: identity?.id },
    },
    {
      enabled: !!identity?.id, // Don't query until identity is available
    }
  );

  if (tasksLoading || activitiesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming by Principal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (tasksError || activitiesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming by Principal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Unable to load upcoming events. Please refresh.</p>
        </CardContent>
      </Card>
    );
  }

  // Group events by principal
  const eventsByPrincipal = groupEventsByPrincipal(tasks || [], activities || [], principals || []);

  // Check if we have any events at all
  const totalEvents = (tasks?.length || 0) + (activities?.length || 0);
  const hasEvents = totalEvents > 0;

  if (eventsByPrincipal.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming by Principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasEvents ? (
            <>
              <p className="text-muted-foreground">
                {totalEvents} event{totalEvents !== 1 ? 's' : ''} detected this week
              </p>
              <p className="text-sm text-muted-foreground">
                Principal grouping requires a database view (coming in P2).
                Events exist but cannot be grouped by principal yet.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">No scheduled events this week</p>
              <p className="text-sm text-muted-foreground">
                Schedule meetings or set task deadlines to stay connected with your principals.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming by Principal</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[300px] overflow-y-auto space-y-section">
        {eventsByPrincipal.map((principal) => (
          <PrincipalEventGroup key={principal.principalId} principal={principal} />
        ))}
      </CardContent>
    </Card>
  );
};

function groupEventsByPrincipal(
  tasks: Task[],
  activities: Activity[],
  _principals: any[]
): PrincipalEvent[] {
  const eventMap = new Map<number, PrincipalEvent>();

  // NOTE: Tasks and activities currently don't include principal_organization_id in their schema.
  // To properly group by principal, we would need to join through:
  // - Task → Opportunity → Principal
  // - Activity → Opportunity → Principal
  // This would require a database view or additional data enrichment in the data layer.

  // Convert map to array and sort
  const grouped = Array.from(eventMap.values());

  // Sort by status priority (urgent first), then by earliest event date
  grouped.sort((a, b) => {
    const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (statusDiff !== 0) return statusDiff;

    const aEarliestDate = Math.min(...a.events.map((e) => e.date.getTime()));
    const bEarliestDate = Math.min(...b.events.map((e) => e.date.getTime()));
    return aEarliestDate - bEarliestDate;
  });

  return grouped;
}

function PrincipalEventGroup({ principal }: { principal: PrincipalEvent }) {
  const statusEmoji = STATUS_EMOJIS[principal.status];

  return (
    <div className="space-y-2">
      <div className="font-semibold">
        {statusEmoji} {principal.principalName} ({principal.events.length} event
        {principal.events.length !== 1 ? "s" : ""})
      </div>
      <div className="ml-6 space-y-2">
        {principal.events.map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function EventItem({ event }: { event: PrincipalEvent["events"][0] }) {
  const formattedDate = format(event.date, "EEE M/d");
  const formattedTime = format(event.date, "h:mma");
  const isToday = format(event.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="text-sm">
      <div>
        • {isToday ? "Today" : formattedDate} {formattedTime} - {event.title}
      </div>
      {event.description && <div className="ml-4 text-muted-foreground">({event.description})</div>}
    </div>
  );
}
