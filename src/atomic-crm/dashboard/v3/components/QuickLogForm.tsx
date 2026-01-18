import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNotify, useDataProvider } from "react-admin";
import type { ExtendedDataProvider } from "@/atomic-crm/providers/supabase/extensions/types";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect, useCallback } from "react";
import { activityKeys, opportunityKeys, taskKeys } from "@/atomic-crm/queryKeys";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import {
  quickLogFormBaseSchema,
  activityLogSchema,
  type ActivityLogInput,
  ACTIVITY_TYPE_MAP,
} from "@/atomic-crm/validation/activities";
import type { LogActivityWithTaskParams } from "@/atomic-crm/validation/rpc";
import { useCurrentSale } from "../hooks/useCurrentSale";
import { useEntityData } from "../hooks/useEntityData";
import { useEntitySelection } from "../hooks/useEntitySelection";
import { ActivityTypeSection } from "./ActivityTypeSection";
import { ActivityDateSection } from "./ActivityDateSection";
import { EntitySelectionSection } from "./EntitySelectionSection";
import { NotesSection } from "./NotesSection";
import { FollowUpSection } from "./FollowUpSection";
import { ActionButtons } from "./ActionButtons";

interface QuickLogFormProps {
  onComplete: () => void;
  onRefresh?: () => void;
  /** Initial draft data to restore from localStorage */
  initialDraft?: Partial<ActivityLogInput> | null;
  /** Callback when form data changes (for draft persistence) */
  onDraftChange?: (formData: Partial<ActivityLogInput>) => void;
  /**
   * Pre-fill contact selection (for use from Contact slide-over/dialog)
   * Takes precedence over initialDraft.contactId
   */
  initialContactId?: number;
  /**
   * Pre-fill organization selection (for use from Organization slide-over/dialog)
   * Takes precedence over initialDraft.organizationId
   */
  initialOrganizationId?: number;
  /**
   * Pre-fill opportunity selection (for use from Opportunity slide-over/dialog)
   * Takes precedence over initialDraft.opportunityId
   */
  initialOpportunityId?: number;
}

/**
 * QuickLogForm - Activity logging form with cascading entity selection
 *
 * Refactored from 1,166 lines to ~200 lines through composition.
 * Extracted components:
 * - useEntityData - All entity fetching with cascading filters
 * - EntityCombobox - Reusable combobox for Contact/Org/Opp
 * - ActivityTypeSection - Activity type, outcome, duration, sample status
 * - FollowUpSection - Follow-up toggle and date picker
 */
export function QuickLogForm({
  onComplete,
  onRefresh,
  initialDraft,
  onDraftChange,
  initialContactId,
  initialOrganizationId,
  initialOpportunityId,
}: QuickLogFormProps) {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider() as ExtendedDataProvider;
  const { salesId, loading: salesIdLoading } = useCurrentSale();

  // Form initialization with schema-derived defaults (Constitution compliant)
  // Priority: initialEntityId props > initialDraft > schema defaults
  // Use base schema for defaults (Zod v4 - refined schemas don't support .partial())
  const defaultValues = useMemo(() => {
    const schemaDefaults = quickLogFormBaseSchema.partial().parse({});

    // Merge in order of precedence: schema < draft < explicit props
    const merged = {
      ...schemaDefaults,
      ...(initialDraft || {}),
      // Explicit props take highest precedence (only if defined)
      ...(initialContactId !== undefined && { contactId: initialContactId }),
      ...(initialOrganizationId !== undefined && { organizationId: initialOrganizationId }),
      ...(initialOpportunityId !== undefined && { opportunityId: initialOpportunityId }),
    };

    return merged;
  }, [initialDraft, initialContactId, initialOrganizationId, initialOpportunityId]);

  const form = useForm<ActivityLogInput>({
    resolver: zodResolver(activityLogSchema),
    defaultValues,
  });

  // Watch form values for conditional rendering and draft persistence
  const formValues = useWatch({ control: form.control });
  const [
    selectedOpportunityId,
    selectedContactId,
    selectedOrganizationId,
    activityType,
    createFollowUp,
  ] = useWatch({
    control: form.control,
    name: ["opportunityId", "contactId", "organizationId", "activityType", "createFollowUp"],
  }) as [
    number | undefined,
    number | undefined,
    number | undefined,
    string | undefined,
    boolean | undefined,
  ];

  // Notify parent of form changes for draft persistence
  useEffect(() => {
    if (onDraftChange) {
      onDraftChange(formValues);
    }
  }, [formValues, onDraftChange]);

  // Entity data with cascading filters
  const entityData = useEntityData({
    form,
    selectedOrganizationId,
    selectedContactId,
    selectedOpportunityId,
  });

  // Form submission handler - uses atomic RPC for transactional activity+task creation
  const submitActivity = useCallback(
    async (data: ActivityLogInput, closeAfterSave = true) => {
      if (!salesId) {
        notify("Cannot log activity: user session expired. Please refresh and try again.", {
          type: "error",
        });
        return;
      }

      try {
        // Extract values with defaults (schema provides defaults during parsing)
        const activityType = data.activityType ?? "Call";
        const activityDate = data.date ?? new Date();

        // Pre-compute follow-up date string using optional chaining for clean type inference
        const followUpDateStr = data.followUpDate?.toISOString().split("T")[0] ?? null;

        // Build activity payload for RPC (explicitly typed to avoid inference issues)
        const activityPayload: LogActivityWithTaskParams["p_activity"] = {
          activity_type: data.opportunityId ? "interaction" : "engagement",
          type: ACTIVITY_TYPE_MAP[activityType] ?? activityType,
          outcome: data.outcome || null,
          subject: data.notes.substring(0, 100) || `${activityType} update`,
          description: data.notes,
          activity_date: activityDate.toISOString(),
          duration_minutes: data.duration || null,
          contact_id: data.contactId || null,
          organization_id: data.organizationId || null,
          opportunity_id: data.opportunityId || null,
          follow_up_required: data.createFollowUp === true,
          follow_up_date: followUpDateStr,
        };

        // Build optional task payload for RPC using if statement for proper narrowing
        let taskPayload: LogActivityWithTaskParams["p_task"] = null;
        if (data.createFollowUp && followUpDateStr) {
          taskPayload = {
            title: `Follow-up: ${data.notes.substring(0, 50)}`,
            due_date: followUpDateStr,
            priority: "medium",
            contact_id: typeof data.contactId === "number" ? data.contactId : null,
            opportunity_id: typeof data.opportunityId === "number" ? data.opportunityId : null,
          };
        }

        // Single atomic RPC call for activity + optional task
        // Data provider throws HttpError on failure (fail-fast)
        const rpcResult = await dataProvider.logActivityWithTask({
          p_activity: activityPayload,
          p_task: taskPayload,
        });

        // Invalidate relevant caches
        queryClient.invalidateQueries({ queryKey: activityKeys.all });
        queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        if (taskPayload) {
          queryClient.invalidateQueries({ queryKey: taskKeys.all });
        }

        const taskCreated = rpcResult?.task_id != null;
        notify(
          taskCreated ? "Activity and follow-up task created" : "Activity logged successfully",
          { type: "success" }
        );
        form.reset();

        if (closeAfterSave) {
          onComplete();
        }

        if (onRefresh) {
          onRefresh();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to log activity";
        notify(errorMessage, { type: "error" });
        console.error("Activity log error:", error);
      }
    },
    [salesId, notify, queryClient, dataProvider, form, onComplete, onRefresh]
  );

  // Cascading entity selection handlers
  const entityHandlers = useEntitySelection({
    setValue: form.setValue,
    getValues: form.getValues,
    entityStores: {
      contacts: entityData.contacts,
      organizations: entityData.organizations,
      opportunities: entityData.opportunities,
    },
    notify,
  });

  // Loading state
  if (entityData.isInitialLoading || salesIdLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          <div className="mt-2 text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => submitActivity(data, true))}
        className="space-y-4"
      >
        {/* Group 1: What happened? */}
        <ActivityTypeSection control={form.control} activityType={activityType ?? "Call"} />

        {/* Activity Date */}
        <ActivityDateSection control={form.control} />

        {/* Group 2: Who was involved? */}
        <EntitySelectionSection
          control={form.control}
          entityData={entityData}
          handlers={entityHandlers}
        />

        {/* Group 3: Notes */}
        <NotesSection control={form.control} />

        {/* Group 4: Follow-up */}
        <FollowUpSection control={form.control} showFollowUpDate={createFollowUp ?? false} />

        {/* Action buttons */}
        <ActionButtons
          isSubmitting={form.formState.isSubmitting}
          onCancel={onComplete}
          onSaveAndNew={() => form.handleSubmit((data) => submitActivity(data, false))()}
        />
      </form>
    </Form>
  );
}
