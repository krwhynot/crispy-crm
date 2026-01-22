import { Link } from "react-router-dom";
import { ReferenceField, useGetOne } from "react-admin";
import { Building2, Trophy, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPriorityVariant } from "@/components/ui/priority-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidepaneMetadata, SidepaneSection } from "@/components/layouts/sidepane";
import { Card } from "@/components/ui/card";
import { ucFirst } from "@/atomic-crm/utils";
import { STAGE, OPPORTUNITY_STAGE_CHOICES } from "../constants";
import { WIN_REASONS, LOSS_REASONS } from "@/atomic-crm/validation/opportunities";
import { formatDateDisplay } from "@/lib/formatDate";
import type { Opportunity } from "@/atomic-crm/types";

interface OrganizationCardProps {
  organizationId: number | null;
  label: string;
  required?: boolean;
  isActiveTab: boolean;
}

const OrganizationCard = ({
  organizationId,
  label,
  required = false,
  isActiveTab,
}: OrganizationCardProps) => {
  const { data: org, isLoading } = useGetOne(
    "organizations",
    { id: organizationId! },
    { enabled: isActiveTab && !!organizationId }
  );

  if (!organizationId && !required) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="p-2 bg-muted/30 border-0">
        <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
        <div className="h-4 bg-muted animate-pulse rounded" />
      </Card>
    );
  }

  if (!org) {
    return (
      <Card className="p-2 bg-muted/30 border-0">
        <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
        <p className="text-xs text-muted-foreground">Not set</p>
      </Card>
    );
  }

  return (
    <Card className="p-2 bg-muted/30 border-0 hover:bg-muted/50 transition-colors">
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/organizations?view=${org.id}`}
            className="text-sm font-medium hover:underline block truncate"
          >
            {org.name}
          </Link>
        </div>
      </div>
    </Card>
  );
};

interface OpportunityDetailsViewSectionProps {
  record: Opportunity;
  isActiveTab: boolean;
}

export function OpportunityDetailsViewSection({
  record,
  isActiveTab,
}: OpportunityDetailsViewSectionProps) {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not set";
    const formatted = formatDateDisplay(date);
    return formatted || "Invalid date";
  };

  const getStageBadgeVariant = (stage: string) => {
    if (stage === STAGE.CLOSED_WON) return "default";
    if (stage === STAGE.CLOSED_LOST) return "destructive";
    return "secondary";
  };

  const stageName =
    OPPORTUNITY_STAGE_CHOICES.find((choice) => choice.id === record.stage)?.name || record.stage;

  const getReasonDisplayName = (
    reason: string | null | undefined,
    isWin: boolean
  ): string | null => {
    if (!reason) return null;
    const reasons = isWin ? WIN_REASONS : LOSS_REASONS;
    return reasons.find((r) => r.id === reason)?.name || reason;
  };

  const isClosedOpportunity =
    record.stage === STAGE.CLOSED_WON || record.stage === STAGE.CLOSED_LOST;
  const closedReason =
    record.stage === STAGE.CLOSED_WON
      ? getReasonDisplayName(record.win_reason, true)
      : record.stage === STAGE.CLOSED_LOST
        ? getReasonDisplayName(record.loss_reason, false)
        : null;

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-4">
        <SidepaneSection label="Overview">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">{record.name || "Untitled Opportunity"}</h3>
            </div>
            {record.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                {record.description}
              </p>
            )}
          </div>
        </SidepaneSection>

        <SidepaneSection label="Status" showSeparator>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Stage</span>
              <div className="mt-1">
                <Badge variant={getStageBadgeVariant(record.stage || "")}>{stageName}</Badge>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Priority</span>
              <div className="mt-1">
                <Badge variant={getPriorityVariant(record.priority || "low")}>
                  {record.priority ? ucFirst(record.priority) : "Low"}
                </Badge>
              </div>
            </div>
          </div>
        </SidepaneSection>

        {record.account_manager_id && (
          <SidepaneSection label="Ownership" showSeparator>
            <div>
              <span className="text-xs text-muted-foreground">Account Manager</span>
              <div className="mt-1 text-sm">
                <ReferenceField source="account_manager_id" reference="sales" link={false} />
              </div>
            </div>
          </SidepaneSection>
        )}

        {isClosedOpportunity && closedReason && (
          <div
            className={`rounded-lg p-3 mt-4 ${
              record.stage === STAGE.CLOSED_WON
                ? "bg-success/10 border border-success/20"
                : "bg-destructive/10 border border-destructive/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {record.stage === STAGE.CLOSED_WON ? (
                <Trophy className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span
                className={`text-xs font-medium uppercase tracking-wide ${
                  record.stage === STAGE.CLOSED_WON ? "text-success" : "text-destructive"
                }`}
              >
                {record.stage === STAGE.CLOSED_WON ? "Won Reason" : "Lost Reason"}
              </span>
            </div>
            <p className="text-sm font-medium">{closedReason}</p>
            {record.close_reason_notes && (
              <p className="text-sm text-muted-foreground mt-1">{record.close_reason_notes}</p>
            )}
          </div>
        )}

        <SidepaneSection label="Timeline" showSeparator>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Lead Source</span>
              <p className="text-sm mt-1">
                {record.lead_source
                  ? record.lead_source
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Est. Close</span>
              <p className="text-sm mt-1">{formatDate(record.estimated_close_date)}</p>
            </div>
            {record.actual_close_date && (
              <div>
                <span className="text-xs text-muted-foreground">Actual Close</span>
                <p className="text-sm mt-1">{formatDate(record.actual_close_date)}</p>
              </div>
            )}
          </div>
        </SidepaneSection>

        {(record.campaign ||
          record.notes ||
          record.next_action ||
          record.next_action_date ||
          record.decision_criteria ||
          record.competition) && (
          <SidepaneSection label="Workflow" showSeparator>
            <div className="space-y-3">
              {record.campaign && (
                <div>
                  <span className="text-xs text-muted-foreground">Campaign</span>
                  <p className="text-sm mt-1">{record.campaign}</p>
                </div>
              )}

              {record.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Notes</span>
                  <p className="text-sm mt-1 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {record.notes}
                  </p>
                </div>
              )}

              {(record.next_action || record.next_action_date) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Next Action</span>
                    <p className="text-sm mt-1">{record.next_action || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Action Date</span>
                    <p className="text-sm mt-1">{formatDate(record.next_action_date)}</p>
                  </div>
                </div>
              )}

              {record.decision_criteria && (
                <div>
                  <span className="text-xs text-muted-foreground">Decision Criteria</span>
                  <p className="text-sm mt-1 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {record.decision_criteria}
                  </p>
                </div>
              )}

              {record.competition && (
                <div>
                  <span className="text-xs text-muted-foreground">Competition</span>
                  <p className="text-sm mt-1">{record.competition}</p>
                </div>
              )}
            </div>
          </SidepaneSection>
        )}

        {record.tags && record.tags.length > 0 && (
          <SidepaneSection label="Tags" showSeparator>
            <div className="flex flex-wrap gap-1">
              {record.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </SidepaneSection>
        )}

        <SidepaneSection label="Organizations" showSeparator>
          <div className="grid grid-cols-3 gap-1.5">
            <OrganizationCard
              organizationId={record.customer_organization_id}
              label="Customer"
              required
              isActiveTab={isActiveTab}
            />
            <OrganizationCard
              organizationId={record.principal_organization_id}
              label="Principal"
              required
              isActiveTab={isActiveTab}
            />
            <OrganizationCard
              organizationId={record.distributor_organization_id}
              label="Distributor"
              isActiveTab={isActiveTab}
            />
          </div>
        </SidepaneSection>

        {record.stage_changed_at && (
          <div className="px-0 py-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Stage Changed</span>
            <p className="text-sm mt-0.5">{formatDate(record.stage_changed_at)}</p>
          </div>
        )}

        <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
      </div>
    </ScrollArea>
  );
}
