import { useState, useCallback, useRef, useEffect } from "react";
import { Form, useUpdate, useNotify, ReferenceInput, useGetOne } from "react-admin";
import { useFormContext, useFormState } from "react-hook-form";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Building2, Trophy, XCircle } from "lucide-react";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { AutocompleteOrganizationInput } from "../../organizations/AutocompleteOrganizationInput";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidepaneMetadata, SidepaneSection } from "@/components/layouts/sidepane";
import { Card } from "@/components/ui/card";
import { OPPORTUNITY_STAGE_CHOICES } from "../constants/stageConstants";
import { LeadSourceInput } from "../LeadSourceInput";
import { CloseOpportunityModal } from "../components/CloseOpportunityModal";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";
import { WIN_REASONS, LOSS_REASONS } from "@/atomic-crm/validation/opportunities";
import { parseDateSafely } from "@/lib/date-utils";
import type { Opportunity } from "@/atomic-crm/types";

/**
 * OrganizationCard - Displays organization info in view mode
 * Extracted to module scope to prevent remounting on parent re-render
 */
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

/**
 * Server validation error with field-level errors from the data provider
 */
interface ServerValidationError extends Error {
  body?: {
    errors?: Record<string, string>;
  };
}

/**
 * FormContent - Inner component that handles server error propagation to form fields
 * Must be inside Form to access useFormContext
 */
interface FormContentProps {
  record: Opportunity;
  onDirtyChange?: (isDirty: boolean) => void;
  serverError: ServerValidationError | null;
  showCloseModal: boolean;
  closeTargetStage: "closed_won" | "closed_lost";
  handleCloseModalOpenChange: (open: boolean) => void;
  handleCloseConfirm: (data: CloseOpportunityInput) => Promise<void>;
  isSaving: boolean;
}

function FormContent({
  record,
  onDirtyChange,
  serverError,
  showCloseModal,
  closeTargetStage,
  handleCloseModalOpenChange,
  handleCloseConfirm,
  isSaving,
}: FormContentProps) {
  const { setError, clearErrors } = useFormContext();
  const { errors, isDirty } = useFormState();

  // Sync dirty state to parent
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Apply server validation errors to form fields
  useEffect(() => {
    if (serverError?.body?.errors) {
      // Clear previous server errors first
      clearErrors();
      // Set each field error from server response
      Object.entries(serverError.body.errors).forEach(([field, message]) => {
        setError(field, { type: "server", message: String(message) });
      });
    }
  }, [serverError, setError, clearErrors]);

  return (
    <>
      <FormErrorSummary errors={errors} />
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

      {/* Organizations section - with inline creation via AutocompleteOrganizationInput */}
      <SidepaneSection label="Organizations" showSeparator>
        <div className="space-y-2">
          <ReferenceInput
            source="customer_organization_id"
            reference="organizations"
            filter={{ "organization_type@in": "(prospect,customer)" }}
          >
            <AutocompleteOrganizationInput
              label="Customer Organization *"
              organizationType="customer"
            />
          </ReferenceInput>

          <ReferenceInput
            source="principal_organization_id"
            reference="organizations"
            filter={{ organization_type: "principal" }}
          >
            <AutocompleteOrganizationInput
              label="Principal Organization *"
              organizationType="principal"
            />
          </ReferenceInput>

          <ReferenceInput
            source="distributor_organization_id"
            reference="organizations"
            filter={{ organization_type: "distributor" }}
          >
            <AutocompleteOrganizationInput
              label="Distributor Organization"
              organizationType="distributor"
            />
          </ReferenceInput>
        </div>
      </SidepaneSection>

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
    </>
  );
}

interface OpportunitySlideOverDetailsTabProps {
  record: Opportunity;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  /** Whether this tab is currently active - available for conditional data fetching */
  isActiveTab: boolean;
}

export function OpportunitySlideOverDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
  isActiveTab,
}: OpportunitySlideOverDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<ServerValidationError | null>(null);

  // State for CloseOpportunityModal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeTargetStage, setCloseTargetStage] = useState<"closed_won" | "closed_lost">(
    "closed_won"
  );
  const pendingFormDataRef = useRef<Partial<Opportunity> | null>(null);

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(
    async (data: Partial<Opportunity>, additionalData?: Partial<CloseOpportunityInput>) => {
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
              setServerError(null); // Clear server errors on success
              notify("Opportunity updated successfully", { type: "success" });
              if (onModeToggle) {
                onModeToggle(); // Switch back to view mode
              }
            },
            onError: (error: Error & { body?: { errors?: Record<string, string> } }) => {
              notify(error?.message || "Failed to update opportunity", { type: "error" });
              // Store full error for field-level display
              setServerError(error as ServerValidationError);
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
    async (data: Partial<Opportunity>) => {
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
        <FormContent
          record={record}
          onDirtyChange={onDirtyChange}
          serverError={serverError}
          showCloseModal={showCloseModal}
          closeTargetStage={closeTargetStage}
          handleCloseModalOpenChange={handleCloseModalOpenChange}
          handleCloseConfirm={handleCloseConfirm}
          isSaving={isSaving}
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
    <ScrollArea className="h-full">
      <div className="px-6 py-4">
        {/* Overview Section */}
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

        {/* Status Section */}
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
                <Badge variant={getPriorityBadgeVariant(record.priority || "low")}>
                  {record.priority
                    ? record.priority.charAt(0).toUpperCase() + record.priority.slice(1)
                    : "Low"}
                </Badge>
              </div>
            </div>
          </div>
        </SidepaneSection>

        {/* Win/Loss Reason - shown for closed opportunities */}
        {isClosedOpportunity && closedReason && (
          <div
            className={`rounded-lg p-3 mt-4 ${
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

        {/* Timeline Section */}
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
          </div>
        </SidepaneSection>

        {/* Workflow Section - only show if there's workflow data */}
        {(record.campaign ||
          record.notes ||
          record.next_action ||
          record.next_action_date ||
          record.decision_criteria) && (
          <SidepaneSection label="Workflow" showSeparator>
            <div className="space-y-3">
              {/* Campaign */}
              {record.campaign && (
                <div>
                  <span className="text-xs text-muted-foreground">Campaign</span>
                  <p className="text-sm mt-1">{record.campaign}</p>
                </div>
              )}

              {/* Notes */}
              {record.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Notes</span>
                  <p className="text-sm mt-1 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {record.notes}
                  </p>
                </div>
              )}

              {/* Next Action row */}
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

              {/* Decision Criteria */}
              {record.decision_criteria && (
                <div>
                  <span className="text-xs text-muted-foreground">Decision Criteria</span>
                  <p className="text-sm mt-1 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {record.decision_criteria}
                  </p>
                </div>
              )}
            </div>
          </SidepaneSection>
        )}

        {/* Organizations Section */}
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

        {/* Metadata - replaces manual timestamps */}
        <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
      </div>
    </ScrollArea>
  );
}
