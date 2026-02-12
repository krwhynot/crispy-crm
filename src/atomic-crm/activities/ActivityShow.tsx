import { useShowContext, RecordContextProvider } from "ra-core";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { Badge } from "@/components/ui/badge";
import { NotFound } from "@/components/ui/not-found";
import { DataFetchError } from "@/components/ui/data-fetch-error";
import type { ActivityRecord } from "../types";
import { ucFirst } from "@/atomic-crm/utils";
import { SAMPLE_STATUS_OPTIONS, ACTIVITY_TYPE_FROM_API } from "../validation/activities";

/**
 * ActivityShow Component
 *
 * Displays full activity details in a standalone page.
 * Complements ActivitySlideOver for direct URL navigation to /activities/:id/show.
 *
 * Shows: subject, type, activity_type, date, duration, description,
 * sentiment, outcome, location, follow-up info, sample status, and related records.
 */
export default function ActivityShow() {
  const { record, isPending, error, refetch } = useShowContext<ActivityRecord>();

  if (isPending) {
    return (
      <SectionCard contentClassName="p-8">
        <p className="text-muted-foreground">Loading activity...</p>
      </SectionCard>
    );
  }
  if (error) return <DataFetchError message={error.message} onRetry={() => refetch()} />;
  if (!record) return <NotFound resource="activity" />;

  const getSentimentVariant = (sentiment: string | undefined | null) => {
    switch (sentiment) {
      case "positive":
        return "default";
      case "negative":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatInteractionType = (type: string | undefined | null): string => {
    if (!type) return "Unknown";
    return ACTIVITY_TYPE_FROM_API[type] || type;
  };

  const getSampleStatusLabel = (status: string | undefined | null): string => {
    if (!status) return status || "";
    return SAMPLE_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
  };

  return (
    <RecordContextProvider value={record}>
      <div className="bg-muted mt-2 flex justify-center px-6 py-6">
        <div className="w-full max-w-3xl space-y-4">
          {/* Main Activity Card */}
          <SectionCard
            title={record.subject || "Untitled Activity"}
            description={
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge variant="outline">{record.activity_type}</Badge>
                <Badge variant="secondary">{formatInteractionType(record.type)}</Badge>
                {record.sentiment && (
                  <Badge variant={getSentimentVariant(record.sentiment)}>
                    {ucFirst(record.sentiment)}
                  </Badge>
                )}
              </div>
            }
            contentClassName="space-y-4"
          >
            {/* Date and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Date</h4>
                <DateField
                  source="activity_date"
                  options={{ year: "numeric", month: "long", day: "numeric" }}
                  className="text-sm"
                />
              </div>
              {record.duration_minutes && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Duration</h4>
                  <p className="text-sm">{record.duration_minutes} minutes</p>
                </div>
              )}
            </div>

            {/* Description */}
            {record.description && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded p-3">
                  {record.description}
                </p>
              </div>
            )}

            {/* Outcome and Location */}
            {(record.outcome || record.location) && (
              <div className="grid grid-cols-2 gap-4">
                {record.outcome && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Outcome</h4>
                    <p className="text-sm">{record.outcome}</p>
                  </div>
                )}
                {record.location && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Location</h4>
                    <p className="text-sm">{record.location}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sample Status (only for sample activities) */}
            {record.type === "sample" && record.sample_status && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Sample Status</h4>
                <Badge variant="outline">{getSampleStatusLabel(record.sample_status)}</Badge>
              </div>
            )}
          </SectionCard>

          {/* Related Records Card */}
          {(record.opportunity_id || record.contact_id || record.organization_id) && (
            <SectionCard title={<span className="text-base">Related Records</span>}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {record.opportunity_id && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Opportunity</h4>
                    <ReferenceField
                      source="opportunity_id"
                      reference="opportunities"
                      link="show"
                      className="text-sm text-primary hover:underline"
                    />
                  </div>
                )}
                {record.contact_id && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Contact</h4>
                    <ReferenceField
                      source="contact_id"
                      reference="contacts_summary"
                      link="show"
                      className="text-sm text-primary hover:underline"
                    />
                  </div>
                )}
                {record.organization_id && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Organization</h4>
                    <ReferenceField
                      source="organization_id"
                      reference="organizations"
                      link="show"
                      className="text-sm text-primary hover:underline"
                    />
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Follow-up Card */}
          {(record.follow_up_required || record.follow_up_date || record.follow_up_notes) && (
            <SectionCard
              title={
                <span className="text-base flex items-center gap-2">
                  Follow-up
                  {record.follow_up_required && (
                    <Badge variant="outline" className="text-warning border-warning">
                      Required
                    </Badge>
                  )}
                </span>
              }
              contentClassName="space-y-3"
            >
              {record.follow_up_date && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Follow-up Date</h4>
                  <DateField
                    source="follow_up_date"
                    options={{ year: "numeric", month: "long", day: "numeric" }}
                    className="text-sm"
                  />
                </div>
              )}
              {record.follow_up_notes && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Follow-up Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded p-3">
                    {record.follow_up_notes}
                  </p>
                </div>
              )}
            </SectionCard>
          )}

          {/* Metadata Footer */}
          <div className="text-xs text-muted-foreground flex gap-4 justify-end">
            <span>
              Created: <DateField source="created_at" showTime />
            </span>
            {record.updated_at && (
              <span>
                Updated: <DateField source="updated_at" showTime />
              </span>
            )}
          </div>
        </div>
      </div>
    </RecordContextProvider>
  );
}

export { ActivityShow };
