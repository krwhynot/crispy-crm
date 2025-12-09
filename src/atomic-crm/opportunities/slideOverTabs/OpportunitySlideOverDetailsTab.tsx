import { useState, useCallback, useRef } from "react";
import { Form, useUpdate, useNotify, ReferenceInput, useGetOne } from "react-admin";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Building2, Trophy, XCircle } from "lucide-react";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Badge } from "@/components/ui/badge";
import { OPPORTUNITY_STAGE_CHOICES } from "../constants/stageConstants";
import { LeadSourceInput } from "../LeadSourceInput";
import { CloseOpportunityModal } from "../components/CloseOpportunityModal";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";
import { WIN_REASONS, LOSS_REASONS } from "@/atomic-crm/validation/opportunities";
import { parseDateSafely } from "@/lib/date-utils";

interface OpportunitySlideOverDetailsTabProps {
  record: any;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  /** Whether this tab is currently active - available for conditional data fetching */
  isActiveTab: boolean;
}

export function OpportunitySlideOverDetailsTab({
  record,
  mode,
  onModeToggle,
  isActiveTab,
}: OpportunitySlideOverDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);

  // State for CloseOpportunityModal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeTargetStage, setCloseTargetStage] = useState<"closed_won" | "closed_lost">(
    "closed_won"
  );
  const pendingFormDataRef = useRef<any>(null);

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(
    async (data: any, additionalData?: Partial<CloseOpportunityInput>) => {
      setIsSaving(true);
      try {
        await update(
          "opportunities",
          {
            id: record.id,
            data: { ...data, ...additionalData },
            previousData: record,
          },
          {
            onSuccess: () => {
              notify("Opportunity updated successfully", { type: "success" });
              if (onModeToggle) {
                onModeToggle(); // Switch back to view mode
              }
            },
            onError: (error: any) => {
              notify(error?.message || "Failed to update opportunity", { type: "error" });
            },
          }
        );
      } finally {
        setIsSaving(false);
      }
    },
    [update, record, notify, onModeToggle]
  );

  /**
   * Handle form submission - intercept closed stage transitions
   */
  const handleSave = useCallback(
    async (data: any) => {
      const isClosingOpportunity =
        (data.stage === "closed_won" || data.stage === "closed_lost") &&
        record.stage !== data.stage;

      if (isClosingOpportunity) {
        // Store form data and show modal
        pendingFormDataRef.current = data;
        setCloseTargetStage(data.stage as "closed_won" | "closed_lost");
        setShowCloseModal(true);
        return;
      }

      // Regular save - no modal needed
      await performSave(data);
    },
    [record.stage, performSave]
  );

  /**
   * Handle confirmation from CloseOpportunityModal
   */
  const handleCloseConfirm = useCallback(
    async (closeData: CloseOpportunityInput) => {
      setShowCloseModal(false);
      if (pendingFormDataRef.current) {
        await performSave(pendingFormDataRef.current, {
          win_reason: closeData.win_reason,
          loss_reason: closeData.loss_reason,
          close_reason_notes: closeData.close_reason_notes,
        });
        pendingFormDataRef.current = null;
      }
    },
    [performSave]
  );

  /**
   * Handle modal cancel
   */
  const handleCloseModalOpenChange = useCallback((open: boolean) => {
    setShowCloseModal(open);
    if (!open) {
      pendingFormDataRef.current = null;
    }
  }, []);

  if (mode === "edit") {
    return (
      <Form
        id="slide-over-edit-form"
        defaultValues={record}
        onSubmit={handleSave}
        className="space-y-2"
      >
        <TextInput source="name" label="Opportunity Name" helperText={false} fullWidth />
        <TextInput
          source="description"
          label="Description"
          helperText={false}
          multiline
          rows={3}
          fullWidth
        />
        <SelectInput
          source="stage"
          label="Stage"
          choices={OPPORTUNITY_STAGE_CHOICES}
          helperText={false}
          fullWidth
        />
        <SelectInput
          source="priority"
          label="Priority"
          choices={[
            { id: "low", name: "Low" },
            { id: "medium", name: "Medium" },
            { id: "high", name: "High" },
            { id: "critical", name: "Critical" },
          ]}
          helperText={false}
          fullWidth
        />
        <LeadSourceInput />
        <TextInput
          source="estimated_close_date"
          label="Estimated Close Date"
          type="date"
          helperText={false}
          fullWidth
        />

        {/* Campaign and workflow fields */}
        <TextInput source="campaign" label="Campaign" helperText={false} fullWidth />
        <TextInput source="notes" label="Notes" multiline rows={2} helperText={false} fullWidth />
        <TextInput source="next_action" label="Next Action" helperText={false} fullWidth />
        <TextInput
          source="next_action_date"
          label="Next Action Date"
          type="date"
          helperText={false}
          fullWidth
        />
        <TextInput
          source="decision_criteria"
          label="Decision Criteria"
          multiline
          rows={2}
          helperText={false}
          fullWidth
        />

        {/* Organizations section */}
        <div className="pt-2 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
            Organizations
          </span>
          <div className="space-y-2">
            <ReferenceInput source="customer_organization_id" reference="organizations">
              <AutocompleteInput
                label="Customer Organization *"
                optionText="name"
                filterToQuery={(searchText: string) => ({ q: searchText })}
                helperText="The customer organization for this opportunity"
                fullWidth
              />
            </ReferenceInput>

            <ReferenceInput source="principal_organization_id" reference="organizations">
              <AutocompleteInput
                label="Principal Organization *"
                optionText="name"
                filterToQuery={(searchText: string) => ({ q: searchText })}
                helperText="The principal/manufacturer organization"
                fullWidth
              />
            </ReferenceInput>

            <ReferenceInput source="distributor_organization_id" reference="organizations">
              <AutocompleteInput
                label="Distributor Organization"
                optionText="name"
                filterToQuery={(searchText: string) => ({ q: searchText })}
                helperText="Optional distributor organization"
                fullWidth
              />
            </ReferenceInput>
          </div>
        </div>

        {/* CloseOpportunityModal - shown when changing stage to closed_won/closed_lost */}
        <CloseOpportunityModal
          open={showCloseModal}
          onOpenChange={handleCloseModalOpenChange}
          opportunityId={record.id}
          opportunityName={record.name || "Opportunity"}
          targetStage={closeTargetStage}
          onConfirm={handleCloseConfirm}
          isSubmitting={isSaving}
        />
      </Form>
    );
  }

  // View mode
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not set";
    const parsed = parseDateSafely(date);
    return parsed ? format(parsed, "MMM d, yyyy") : "Invalid date";
  };

  const getStageBadgeVariant = (stage: string) => {
    if (stage === "closed_won") return "default";
    if (stage === "closed_lost") return "destructive";
    return "secondary";
  };

  const getPriorityBadgeVariant = (priority: string) => {
    if (priority === "critical") return "destructive";
    if (priority === "high") return "default";
    if (priority === "medium") return "secondary";
    return "outline";
  };

  // Organization card component for view mode
  const OrganizationCard = ({
    organizationId,
    label,
    required = false,
  }: {
    organizationId: number | null;
    label: string;
    required?: boolean;
  }) => {
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
        <div className="border border-border rounded-md p-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
          <div className="h-4 bg-muted animate-pulse rounded" />
        </div>
      );
    }

    if (!org) {
      return (
        <div className="border border-border rounded-md p-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
          <p className="text-xs text-muted-foreground">Not set</p>
        </div>
      );
    }

    return (
      <div className="border border-border rounded-md p-2 hover:bg-muted/50 transition-colors">
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
      </div>
    );
  };

  const stageName =
    OPPORTUNITY_STAGE_CHOICES.find((choice) => choice.id === record.stage)?.name || record.stage;

  /**
   * Get the display name for a win/loss reason
   */
  const getReasonDisplayName = (
    reason: string | null | undefined,
    isWin: boolean
  ): string | null => {
    if (!reason) return null;
    const reasons = isWin ? WIN_REASONS : LOSS_REASONS;
    return reasons.find((r) => r.id === reason)?.name || reason;
  };

  // Determine if this is a closed opportunity with reason data
  const isClosedOpportunity = record.stage === "closed_won" || record.stage === "closed_lost";
  const closedReason =
    record.stage === "closed_won"
      ? getReasonDisplayName(record.win_reason, true)
      : record.stage === "closed_lost"
        ? getReasonDisplayName(record.loss_reason, false)
        : null;

  return (
    <div className="space-y-2">
      {/* Name */}
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Name
        </span>
        <p className="text-sm">{record.name || "N/A"}</p>
      </div>

      {/* Description */}
      {record.description && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Description
          </span>
          <p className="text-sm whitespace-pre-wrap">{record.description}</p>
        </div>
      )}

      {/* Stage & Priority row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Stage
          </span>
          <div>
            <Badge variant={getStageBadgeVariant(record.stage || "")}>{stageName}</Badge>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Priority
          </span>
          <div>
            <Badge variant={getPriorityBadgeVariant(record.priority || "low")}>
              {record.priority
                ? record.priority.charAt(0).toUpperCase() + record.priority.slice(1)
                : "Low"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Win/Loss Reason - shown for closed opportunities */}
      {isClosedOpportunity && closedReason && (
        <div
          className={`rounded-lg p-3 ${
            record.stage === "closed_won"
              ? "bg-success/10 border border-success/20"
              : "bg-destructive/10 border border-destructive/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {record.stage === "closed_won" ? (
              <Trophy className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span
              className={`text-xs font-medium uppercase tracking-wide ${
                record.stage === "closed_won" ? "text-success" : "text-destructive"
              }`}
            >
              {record.stage === "closed_won" ? "Won Reason" : "Lost Reason"}
            </span>
          </div>
          <p className="text-sm font-medium">{closedReason}</p>
          {record.close_reason_notes && (
            <p className="text-sm text-muted-foreground mt-1">{record.close_reason_notes}</p>
          )}
        </div>
      )}

      {/* Lead Source & Close Date row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Lead Source
          </span>
          <p className="text-sm">
            {record.lead_source
              ? record.lead_source
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())
              : "—"}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Est. Close
          </span>
          <p className="text-sm">{formatDate(record.estimated_close_date)}</p>
        </div>
      </div>

      {/* Campaign */}
      {record.campaign && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Campaign
          </span>
          <p className="text-sm">{record.campaign}</p>
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Notes
          </span>
          <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
        </div>
      )}

      {/* Next Action row */}
      {(record.next_action || record.next_action_date) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Next Action
            </span>
            <p className="text-sm">{record.next_action || "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Action Date
            </span>
            <p className="text-sm">{formatDate(record.next_action_date)}</p>
          </div>
        </div>
      )}

      {/* Decision Criteria */}
      {record.decision_criteria && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Decision Criteria
          </span>
          <p className="text-sm whitespace-pre-wrap">{record.decision_criteria}</p>
        </div>
      )}

      {/* Organizations - 3 column grid */}
      <div className="pt-2 border-t border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
          Organizations
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <OrganizationCard
            organizationId={record.customer_organization_id}
            label="Customer"
            required
          />
          <OrganizationCard
            organizationId={record.principal_organization_id}
            label="Principal"
            required
          />
          <OrganizationCard
            organizationId={record.distributor_organization_id}
            label="Distributor"
          />
        </div>
      </div>

      {/* Timestamps */}
      <div className="pt-2 border-t border-border flex gap-3 text-xs text-muted-foreground">
        <span>Created {formatDate(record.created_at)}</span>
        <span>•</span>
        <span>Updated {formatDate(record.updated_at)}</span>
      </div>
    </div>
  );
}
