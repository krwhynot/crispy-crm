import { useGetList, useGetIdentity } from "react-admin";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * Upcoming Events by Principal Widget
 *
 * Shows this week's scheduled tasks and activities grouped by principal organization.
 * Helps answer: "What commitments do I have this week per principal?"
 *
 * Data Source:
 * - upcoming_events_by_principal view: Pre-joined tasks + activities with principal info
 *
 * Performance: Replaces 3 separate queries (tasks, activities, dashboard_principal_summary)
 * + client-side joining. View handles all aggregation and joining.
 *
 * Grouping: By principal_name, status indicator
 * Sorting: By principal status (urgent → warning → good), then by event date
 *
 * Design: docs/plans/2025-11-05-principal-centric-crm-design.md
 */

interface ViewEvent {
  event_type: "task" | "activity";
  source_id: number;
  event_title: string;
  event_date: string;
  description?: string;
  principal_organization_id: number;
  principal_name: string;
  created_by: number;
  principal_status: "good" | "warning" | "urgent";
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

  // Query pre-joined upcoming events view (handles tasks, activities, and principal enrichment)
  const {
    data: viewEvents,
    isPending: isLoading,
    error,
  } = useGetList<ViewEvent>(
    "upcoming_events_by_principal",
    {
      filter: {
        created_by: identity?.id,
      },
    },
    {
      enabled: !!identity?.id, // Don't query until identity is available
    }
  );

  if (isLoading) {
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

  if (error) {
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

  // Group events by principal from the pre-joined view data
  const eventsByPrincipal = groupEventsByPrincipal(viewEvents || []);

  if (eventsByPrincipal.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming by Principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">No scheduled events this week</p>
          <p className="text-sm text-muted-foreground">
            Schedule meetings or set task deadlines to stay connected with your principals.
          </p>
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

function groupEventsByPrincipal(viewEvents: ViewEvent[]): PrincipalEvent[] {
  // Group pre-joined events by principal using Map for efficient lookup
  const eventMap = new Map<number, PrincipalEvent>();

  for (const event of viewEvents) {
    const principalId = event.principal_organization_id;
    const eventDate = new Date(event.event_date);

    // Get or create principal group
    if (!eventMap.has(principalId)) {
      eventMap.set(principalId, {
        principalId,
        principalName: event.principal_name,
        status: event.principal_status,
        events: [],
      });
    }

    // Add event to principal's events array
    const principal = eventMap.get(principalId)!;
    principal.events.push({
      id: `${event.event_type}-${event.source_id}`,
      type: event.event_type,
      title: event.event_title,
      date: eventDate,
      description: event.description,
    });
  }

  // Convert to array and sort
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
