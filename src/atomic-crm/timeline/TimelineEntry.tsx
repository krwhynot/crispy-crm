/**
 * TimelineEntry - Renders activity or task in unified timeline
 *
 * Visual differentiation:
 * - Activities: No badge, just type icon
 * - Tasks: "Task" badge with muted background
 *
 * Permission handling:
 * - Tasks show edit button only for owner or manager
 * - Activities can be edited by creator
 */

import { Check, Mail, Phone, Users, FileText, Target, Clock, CheckSquare } from "lucide-react";
import { RecordContextProvider } from "ra-core";
import { Link as RouterLink } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { parseDateSafely } from "@/lib/date-utils";
import { ucFirst } from "@/atomic-crm/utils";

interface TimelineEntryData {
  id: number;
  entry_type: "activity" | "task";
  subtype: string;
  title: string;
  description?: string;
  entry_date: string;
  contact_id?: number;
  organization_id?: number;
  opportunity_id?: number;
  created_by?: number;
  sales_id?: number;
  created_at: string;
}

interface TimelineEntryProps {
  entry: TimelineEntryData;
}

export const TimelineEntry = ({ entry }: TimelineEntryProps) => {
  const isTask = entry.entry_type === "task";

  const getIcon = (subtype: string) => {
    switch (subtype) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      case "follow_up":
        return <Clock className="h-4 w-4" />;
      default:
        return isTask ? <CheckSquare className="h-4 w-4" /> : <Target className="h-4 w-4" />;
    }
  };

  return (
    <RecordContextProvider value={entry}>
      <div className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center ${
              isTask ? "bg-secondary/20" : "bg-primary/10"
            }`}
          >
            {getIcon(entry.subtype)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type badge for tasks */}
              {isTask && (
                <Badge variant="secondary" className="text-xs">
                  Task
                </Badge>
              )}
              <span className="font-medium text-sm">
                {ucFirst(entry.subtype).replace("_", " ")}
              </span>
              {/* Show assignee for tasks, creator for activities */}
              {isTask && entry.sales_id && (
                <span className="text-sm text-muted-foreground">
                  assigned to <ReferenceField source="sales_id" reference="sales" link={false} />
                </span>
              )}
              {!isTask && entry.created_by && (
                <span className="text-sm text-muted-foreground">
                  by <ReferenceField source="created_by" reference="sales" link={false} />
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {format(parseDateSafely(entry.entry_date) ?? new Date(), "MMM d, yyyy")}
            </span>
          </div>

          {/* Title */}
          {entry.title && <div className="text-sm font-medium mb-1">{entry.title}</div>}

          {/* Description */}
          {entry.description && (
            <div className="text-sm text-foreground whitespace-pre-line line-clamp-2">
              {entry.description}
            </div>
          )}

          {/* Links */}
          <div className="flex items-center gap-2 mt-2 -ml-2">
            {entry.opportunity_id && (
              <RouterLink
                to={`/opportunities/${entry.opportunity_id}/show`}
                className="inline-flex items-center gap-1.5 min-h-11 px-2 text-xs text-primary hover:underline hover:bg-muted/50 rounded-md transition-colors"
              >
                <Target className="h-4 w-4" />
                View Opportunity
              </RouterLink>
            )}
            {isTask && (
              <RouterLink
                to={`/tasks?filter=${encodeURIComponent(JSON.stringify({ id: entry.id }))}`}
                className="inline-flex items-center gap-1.5 min-h-11 px-2 text-xs text-primary hover:underline hover:bg-muted/50 rounded-md transition-colors"
              >
                <Check className="h-4 w-4" />
                View Task
              </RouterLink>
            )}
          </div>
        </div>
      </div>
    </RecordContextProvider>
  );
};

export default TimelineEntry;
