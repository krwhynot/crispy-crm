import { useGetList } from "react-admin";
import { formatDistanceToNow } from "date-fns";
import { Activity, FileText } from "lucide-react";

interface OpportunityActivitiesTabProps {
  record: any;
  mode: "view" | "edit";
}

export function OpportunityActivitiesTab({ record }: OpportunityActivitiesTabProps) {
  // Fetch opportunity notes (activities) from opportunityNotes table
  const { data: notes, isLoading } = useGetList("opportunityNotes", {
    filter: { opportunity_id: record.id },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "created_at", order: "DESC" },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No activity recorded for this opportunity</p>
        <p className="text-sm text-muted-foreground mt-2">
          Activity notes will appear here as they are created
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note: any) => (
        <div
          key={note.id}
          className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
              <FileText className="w-4 h-4 text-primary" />
            </div>

            {/* Activity content */}
            <div className="flex-1 min-w-0">
              {/* Header with timestamp */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium">
                  {note.sales_first_name} {note.sales_last_name}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Note text */}
              {note.text && (
                <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
              )}

              {/* Activity type badge if available */}
              {note.activity_type && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                    {note.activity_type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
