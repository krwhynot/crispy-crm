import { useState, useEffect } from "react";
import {
  useCreate,
  useRefresh,
  useGetIdentity,
  useGetList,
  useNotify,
  useDataProvider,
} from "react-admin";
import { logger } from "@/lib/logger";
import { devLog } from "@/lib/devLogger";
import { X } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { quickCreateOpportunitySchema } from "../../validation/opportunities";
import { ZodError } from "../../validation";
import type { OpportunityStageValue, Organization, Opportunity } from "../../types";
import { formatFieldLabel } from "@/atomic-crm/utils/formatters";

interface QuickAddOpportunityProps {
  stage: OpportunityStageValue;
  /** Callback when opportunity is created - enables optimistic UI updates */
  onOpportunityCreated?: (opportunity: Opportunity) => void;
}

export function QuickAddOpportunity({ stage, onOpportunityCreated }: QuickAddOpportunityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [principalId, setPrincipalId] = useState<string>("");
  // FIX [WF-E2E-001]: Add field-level error state for inline validation display
  const [errors, setErrors] = useState<{
    name?: string;
    principalId?: string;
    customerId?: string;
  }>({});
  const [create, { isLoading }] = useCreate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const { identity } = useGetIdentity();

  // Fetch principal organizations (MFB business rule: every opportunity has a principal)
  const { data: principals, isLoading: principalsLoading } = useGetList<Organization>(
    "organizations",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
      filter: { organization_type: "principal", deleted_at: null },
    }
  );

  // Fetch customer organizations (Salesforce standard: Account required for Opportunity)
  const { data: customers, isLoading: customersLoading } = useGetList<Organization>(
    "organizations",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
      filter: { "organization_type@in": "(prospect,customer)", deleted_at: null },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    devLog("QuickAddOpportunity", "handleSubmit called");

    // FIX [WF-E2E-001]: Collect all validation errors for inline display
    const newErrors: typeof errors = {};

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
      console.log("[QuickAdd] Validation failed:", newErrors);
      setErrors(newErrors);
      return;
    }

    // Clear errors on successful validation
    setErrors({});
    console.log("[QuickAdd] Validation passed, calling create()");

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
        console.log("[QuickAdd] Organization lookup failed:", {
          customerId,
          principalId,
          selectedCustomer,
          selectedPrincipal,
        });
        const orgErrors: typeof errors = {};
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
      console.log("[QuickAdd] Calling create() with data:", validatedData);
      const result = await create(
        "opportunities",
        { data: validatedData },
        { returnPromise: true }
      );
      console.log("[QuickAdd] create() returned:", result);

      // FIX [WF-E2E-001]: Only show success when create actually succeeds
      // With returnPromise: true, result IS the record (not wrapped in { data })
      if (!result) {
        // Create failed silently - show error and don't close dialog
        console.log("[QuickAdd] No result from create, showing error");
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
            activity_type: "interaction", // Required when opportunity_id is set
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
        console.error("[QuickAdd] Failed to create activity log:", activityError);
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
      setIsOpen(false);
      setName("");
      setPrincipalId("");
      setCustomerId("");
      refresh(); // Still refresh to sync with server (gets full computed fields)
    } catch (error: unknown) {
      // FIX [WF-E2E-001]: Handle both Error instances and React Admin validation errors
      // React Admin validation errors have shape: { message: string, body: { errors: {...} } }
      console.log("[QuickAdd] create() threw error:", error);

      // Handle Zod validation errors with specific field messages (fail-fast principle)
      if (error instanceof ZodError) {
        const fieldErrors = error.issues
          .map((issue: { message: string }) => issue.message)
          .join(", ");
        notify(`Validation failed: ${fieldErrors}`, { type: "error" });
        return;
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
    }
  };

  // Format stage for display
  const stageLabel = formatFieldLabel(stage);

  // ESC key handler for modal dismissal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-11 px-3 text-sm text-primary hover:bg-primary/10 rounded transition-colors border border-dashed border-border flex items-center justify-center"
      >
        + New Opportunity
      </button>

      {isOpen && (
        // Backdrop: Using div with explicit role="none" since it's purely decorative/functional overlay
        // The actual dialog content has proper role="dialog" semantics
        <div
          role="none"
          className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-opportunity-title"
            className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200 relative"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 h-11 w-11 rounded-md hover:bg-accent active:bg-accent/80 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
            <h2 id="quick-add-opportunity-title" className="text-lg font-semibold mb-4">
              Create Opportunity
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    // Clear error when user starts typing
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    errors.name ? "border-destructive" : "border-border"
                  }`}
                  placeholder="Enter opportunity name"
                  disabled={isLoading}
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- Modal has role="dialog" + aria-modal, autoFocus is appropriate
                  autoFocus
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="mt-1 text-sm text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="principal" className="block text-sm font-medium mb-1">
                  Principal <span className="text-destructive">*</span>
                </label>
                <select
                  id="principal"
                  value={principalId}
                  onChange={(e) => {
                    setPrincipalId(e.target.value);
                    // Clear error when user selects
                    if (errors.principalId)
                      setErrors((prev) => ({ ...prev, principalId: undefined }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors bg-background ${
                    errors.principalId ? "border-destructive" : "border-border"
                  }`}
                  disabled={isLoading || principalsLoading}
                  aria-invalid={errors.principalId ? "true" : undefined}
                  aria-describedby={errors.principalId ? "principal-error" : undefined}
                >
                  <option value="">
                    {principalsLoading ? "Loading principals..." : "Select a principal"}
                  </option>
                  {principals?.map((principal) => (
                    <option key={principal.id} value={principal.id}>
                      {principal.name}
                    </option>
                  ))}
                </select>
                {errors.principalId && (
                  <p id="principal-error" role="alert" className="mt-1 text-sm text-destructive">
                    {errors.principalId}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="customer" className="block text-sm font-medium mb-1">
                  Customer <span className="text-destructive">*</span>
                </label>
                <select
                  id="customer"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    // Clear error when user selects
                    if (errors.customerId)
                      setErrors((prev) => ({ ...prev, customerId: undefined }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors bg-background ${
                    errors.customerId ? "border-destructive" : "border-border"
                  }`}
                  disabled={isLoading || customersLoading}
                  aria-invalid={errors.customerId ? "true" : undefined}
                  aria-describedby={errors.customerId ? "customer-error" : undefined}
                >
                  <option value="">
                    {customersLoading ? "Loading customers..." : "Select a customer"}
                  </option>
                  {customers?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p id="customer-error" role="alert" className="mt-1 text-sm text-destructive">
                    {errors.customerId}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="stage" className="block text-sm font-medium mb-1">
                  Stage
                </label>
                <input
                  id="stage"
                  type="text"
                  value={stageLabel}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <AdminButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setName("");
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </AdminButton>
                <AdminButton type="submit" isLoading={isLoading} loadingText="Creating...">
                  Create
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
