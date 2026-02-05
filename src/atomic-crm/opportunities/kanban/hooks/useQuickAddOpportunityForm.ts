import { useState } from "react";
import { useCreate, useRefresh, useGetIdentity, useNotify, useDataProvider } from "react-admin";
import { logger } from "@/lib/logger";
import { devLog } from "@/lib/devLogger";
import { quickCreateOpportunitySchema } from "@/atomic-crm/validation/opportunities";
import { ZodError } from "@/atomic-crm/validation";
import type { OpportunityStageValue, Organization, Opportunity } from "@/atomic-crm/types";
import { formatFieldLabel } from "@/atomic-crm/utils/formatters";

interface UseQuickAddOpportunityFormProps {
  stage: OpportunityStageValue;
  onOpportunityCreated?: (opportunity: Opportunity) => void;
  principals?: Organization[];
  customers?: Organization[];
}

interface FormErrors {
  name?: string;
  principalId?: string;
  customerId?: string;
}

/**
 * Hook to manage form state and submission logic for quick-add opportunity
 * Handles validation, creation, and activity logging
 */
export function useQuickAddOpportunityForm({
  stage,
  onOpportunityCreated,
  principals,
  customers,
}: UseQuickAddOpportunityFormProps) {
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [principalId, setPrincipalId] = useState<string>("");
  // FIX [WF-E2E-001]: Add field-level error state for inline validation display
  const [errors, setErrors] = useState<FormErrors>({});

  const [create, { isLoading }] = useCreate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const { identity } = useGetIdentity();

  // Format stage for display
  const stageLabel = formatFieldLabel(stage);

  const resetForm = () => {
    setName("");
    setPrincipalId("");
    setCustomerId("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    devLog("QuickAddOpportunity", "handleSubmit called");

    // FIX [WF-E2E-001]: Collect all validation errors for inline display
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!principalId) {
      newErrors.principalId = "Principal is required";
    }

    if (!customerId) {
      newErrors.customerId = "Customer is required";
    }

    // If any errors, set state and show inline (no toast spam)
    if (Object.keys(newErrors).length > 0) {
      devLog("QuickAddOpportunity", "Validation failed", newErrors);
      setErrors(newErrors);
      return;
    }

    // Clear errors on successful validation
    setErrors({});
    devLog("QuickAddOpportunity", "Validation passed, calling create()");

    try {
      // MFB business rule: Name + Principal + Customer + Stage required
      const validatedData = quickCreateOpportunitySchema.parse({
        name: name.trim(),
        stage,
        status: "active", // Required by schema - new opportunities are always active
        priority: "medium", // Sensible default - user can change via edit form later
        principal_organization_id: Number(principalId),
        customer_organization_id: Number(customerId),
        // Set current user as owner - ensures opportunity shows in "My Opportunities"
        opportunity_owner_id: identity?.id,
        account_manager_id: identity?.id,
      });

      // Get the selected organization names for optimistic update display
      const selectedCustomer = customers?.find((c) => c.id === Number(customerId));
      const selectedPrincipal = principals?.find((p) => p.id === Number(principalId));

      // FIX [WF-C2-002]: Fail-fast if organization names cannot be resolved
      // This guards against race conditions where IDs are valid but lists haven't loaded
      if (!selectedCustomer?.name || !selectedPrincipal?.name) {
        devLog("QuickAddOpportunity", "Organization lookup failed", {
          customerId,
          principalId,
          selectedCustomer,
          selectedPrincipal,
        });
        const orgErrors: FormErrors = {};
        if (!selectedCustomer?.name) {
          orgErrors.customerId = "Customer organization not found. Please try again.";
        }
        if (!selectedPrincipal?.name) {
          orgErrors.principalId = "Principal organization not found. Please try again.";
        }
        setErrors(orgErrors);
        return;
      }

      // Extract validated names - TypeScript narrowing ensures these are non-empty strings
      // after the guard clause above (no fallback needed)
      const customerOrgName = selectedCustomer.name;
      const principalOrgName = selectedPrincipal.name;

      // Create returns the new record - use it for optimistic updates
      // NOTE: returnPromise: true is REQUIRED to get the created record back
      devLog("QuickAddOpportunity", "Calling create() with data", validatedData);
      const result = await create(
        "opportunities",
        { data: validatedData },
        { returnPromise: true }
      );
      devLog("QuickAddOpportunity", "create() returned", result);

      // FIX [WF-E2E-001]: Only show success when create actually succeeds
      // With returnPromise: true, result IS the record (not wrapped in { data })
      if (!result) {
        // Create failed silently - show error and don't close dialog
        devLog("QuickAddOpportunity", "No result from create, showing error");
        notify("Failed to create opportunity. Please try again.", { type: "error" });
        return;
      }

      // Optimistic update: immediately add to Kanban before refresh completes
      // This ensures the new opportunity appears instantly in the UI
      if (onOpportunityCreated) {
        const newOpportunity: Opportunity = {
          ...result,
          // Add computed fields that the summary view would provide
          // Uses validated names from guard clause - no fallback needed
          customer_organization_name: customerOrgName,
          principal_organization_name: principalOrgName,
          distributor_organization_name: null,
          days_in_stage: 0,
        } as Opportunity;
        onOpportunityCreated(newOpportunity);
      }

      // FIX [WF-H2-001]: Log activity when opportunity is created via QuickAdd
      // Fire-and-forget pattern: don't block main flow if activity creation fails
      let activityLogFailed = false;
      try {
        await dataProvider.create("activities", {
          data: {
            activity_type: "activity", // Required when opportunity_id is set
            type: "note",
            subject: "Opportunity created",
            description: `Created via Quick Add in stage: ${stageLabel}. Principal: ${principalOrgName}, Customer: ${customerOrgName}.`,
            activity_date: new Date().toISOString(),
            opportunity_id: result.id,
            organization_id: Number(customerId), // Customer org satisfies "at least one entity" rule
          },
        });
      } catch (activityError) {
        // WF-H2-001: Log error but continue - activity is secondary to opportunity creation
        logger.error("Failed to create activity log", activityError, {
          feature: "QuickAddOpportunity",
        });
        activityLogFailed = true;
      }

      // Single notification for cleaner UX - different message based on activity success
      if (activityLogFailed) {
        notify("Opportunity created, but activity log failed. Please add a note manually.", {
          type: "warning",
          autoHideDuration: 8000,
        });
      } else {
        notify("Opportunity created! Add details via the card menu.", { type: "success" });
      }

      resetForm();
      refresh(); // Still refresh to sync with server (gets full computed fields)
      return true; // Signal success to dialog
    } catch (error: unknown) {
      // FIX [WF-E2E-001]: Handle both Error instances and React Admin validation errors
      // React Admin validation errors have shape: { message: string, body: { errors: {...} } }
      devLog("QuickAddOpportunity", "create() threw error", error);

      // Handle Zod validation errors with specific field messages (fail-fast principle)
      if (error instanceof ZodError) {
        const fieldErrors = error.issues
          .map((issue: { message: string }) => issue.message)
          .join(", ");
        notify(`Validation failed: ${fieldErrors}`, { type: "error" });
        return false;
      }

      let message = "Error creating opportunity";
      if (error instanceof Error) {
        message = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        // React Admin validation error format
        message = (error as { message: string }).message;
      }
      notify(message, { type: "error" });
      return false;
    }
  };

  return {
    name,
    setName,
    customerId,
    setCustomerId,
    principalId,
    setPrincipalId,
    errors,
    setErrors,
    isLoading,
    stageLabel,
    handleSubmit,
    resetForm,
  };
}
