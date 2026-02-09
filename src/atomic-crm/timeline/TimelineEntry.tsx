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

import { memo } from "react";
import {
  Check,
  Mail,
  Phone,
  Users,
  FileText,
  Target,
  Clock,
  CheckSquare,
  ArrowRightLeft,
  FileQuestion,
} from "lucide-react";
import { RecordContextProvider } from "ra-core";
import { Link as RouterLink } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { parseDateSafely } from "@/lib/date-utils";
import { ucFirst } from "@/atomic-crm/utils";
import { logger } from "@/lib/logger";

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
  /** When set, activities not tied to this contact are shown as org-level */
  currentContactId?: number;
}

export const TimelineEntry = memo(function TimelineEntry({
  entry,
  currentContactId,
}: TimelineEntryProps) {
  const isTask = entry.entry_type === "task";

  // Detect org-level activities: has org but not tied to current contact
  const isOrganizationLevel = Boolean(
    currentContactId && entry.organization_id && entry.contact_id !== currentContactId
  );

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
      case "stage_change":
        return <ArrowRightLeft className="h-4 w-4 text-primary" />;
      default:
        logger.warn("Unknown timeline subtype", {
          subtype,
          entryId: entry.id,
          metric: "timeline.unknown_subtype",
        });
        return <FileQuestion className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <RecordContextProvider value={entry}>
      <div
        className={`flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
          isOrganizationLevel
            ? "border-dashed border-muted-foreground/30 bg-muted/20"
            : "border-border"
        }`}
      >
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
              {/* Org-level indicator when viewing a contact */}
              {isOrganizationLevel && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Organization
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
                to={`/tasks?view=${entry.id}`}
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
});

export default TimelineEntry;
