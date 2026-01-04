/**
 * Opportunity Create Form - Wizard Version
 *
 * Multi-step wizard for creating opportunities, implementing the
 * form progress system from docs/guides/form-progress-implementation-guide.md
 *
 * 4 Steps (Miller's Law):
 * 1. Basic Information - name, customer, principal
 * 2. Pipeline & Team - stage, priority, date, team
 * 3. Contacts & Products - relationships
 * 4. Additional Details - classification, notes
 */
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { CreateBase, Form, useGetIdentity, useNotify, useRedirect, useCreate } from "ra-core";
import { useFormState } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInAppUnsavedChanges } from "@/hooks";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import {
  FormProgressProvider,
  FormProgressBar,
  FormWizard,
  WizardStep,
  WizardNavigation,
  StepIndicator,
} from "@/components/admin/form";
import { opportunitySchema } from "../validation/opportunities";
import { SimilarOpportunitiesDialog } from "./components/SimilarOpportunitiesDialog";
import { useSimilarOpportunityCheck } from "./hooks/useSimilarOpportunityCheck";
import { OpportunityCreateFormTutorial } from "../tutorial/OpportunityCreateFormTutorial";
import { OPPORTUNITY_WIZARD_STEPS } from "./forms/opportunityWizardConfig";
import {
  OpportunityWizardStep1,
  OpportunityWizardStep2,
  OpportunityWizardStep3,
  OpportunityWizardStep4,
} from "./forms/OpportunityWizardSteps";

const OPPORTUNITY_FIELD_LABELS: Record<string, string> = {
  name: "Opportunity Name",
  customer_organization_id: "Customer Organization",
  principal_organization_id: "Principal Organization",
  stage: "Stage",
  priority: "Priority",
  estimated_close_date: "Est. Close Date",
  account_manager_id: "Account Manager",
  distributor_organization_id: "Distributor Organization",
  contact_ids: "Contacts",
  lead_source: "Lead Source",
  campaign: "Campaign",
  description: "Description",
  next_action: "Next Action",
  next_action_date: "Next Action Date",
  decision_criteria: "Decision Criteria",
  notes: "Notes",
};

const OpportunityCreateWizard = () => {
  const { data: identity, isPending: identityLoading } = useGetIdentity();
  const location = useLocation();

  // Parse ?source=JSON URL parameter (React Admin pattern for pre-filling forms)
  // Example: ?source={"customer_organization_id":123}
  const urlSourceParam = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const sourceJson = searchParams.get("source");
    if (!sourceJson) return null;
    try {
      return JSON.parse(sourceJson) as { customer_organization_id?: number };
    } catch {
      return null;
    }
  }, [location.search]);

  // Fuzzy match warning system (Levenshtein threshold: 3)
  const {
    checkForSimilar,
    showDialog,
    closeDialog,
    confirmCreate,
    proposedName,
    similarOpportunities,
    hasConfirmed,
    resetConfirmation,
  } = useSimilarOpportunityCheck();

  // CRITICAL: Memoize formDefaults to prevent React Admin's Form from resetting
  // on every re-render. React Admin's useAugmentedForm calls reset() whenever
  // defaultValues object reference changes. Without useMemo, every step navigation
  // creates a new object → triggers reset → ALL FORM DATA LOST!
  // See: node_modules/ra-core/src/form/useAugmentedForm.ts:88-90
  const formDefaults = useMemo(
    () => ({
      ...opportunitySchema.partial().parse({}),
      opportunity_owner_id: identity?.id,
      account_manager_id: identity?.id,
      contact_ids: [], // Explicitly initialize for ReferenceArrayInput
      products_to_sync: [], // Explicitly initialize for ArrayInput
      // URL param pre-fill: customer org from Organization slideover context
      ...(urlSourceParam?.customer_organization_id && {
        customer_organization_id: urlSourceParam.customer_organization_id,
      }),
    }),
    [identity?.id, urlSourceParam] // Recompute when identity or URL param changes
  );

  // Wait for identity to load before rendering form
  // This prevents the form from resetting when identity becomes available
  if (identityLoading) {
    return (
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-3 text-muted-foreground">Loading...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <CreateBase redirect="show">
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <Form defaultValues={formDefaults} mode="onBlur" key={urlSourceParam?.customer_organization_id ?? "no-prefill"}>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Create Opportunity</CardTitle>
              </CardHeader>
              <CardContent>
                <OpportunityWizardContent
                  checkForSimilar={checkForSimilar}
                  hasConfirmed={hasConfirmed}
                  resetConfirmation={resetConfirmation}
                />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>

      {/* Similar Opportunities Warning Dialog */}
      <SimilarOpportunitiesDialog
        open={showDialog}
        onClose={closeDialog}
        onConfirm={confirmCreate}
        proposedName={proposedName}
        similarOpportunities={similarOpportunities}
      />

      {/* Standalone Form Tutorial - bottom-left floating button */}
      <OpportunityCreateFormTutorial />
    </CreateBase>
  );
};

interface OpportunityWizardContentProps {
  checkForSimilar: (name: string) => Promise<void>;
  hasConfirmed: boolean;
  resetConfirmation: () => void;
}

const OpportunityWizardContent = ({
  checkForSimilar,
  hasConfirmed,
  resetConfirmation: _resetConfirmation,
}: OpportunityWizardContentProps) => {
  const { errors } = useFormState();
  const notify = useNotify();
  const redirect = useRedirect();
  const [create] = useCreate();

  const { showWarning, confirmDiscard, cancelDiscard, handlePotentialDiscard } =
    useInAppUnsavedChanges();

  const handleSubmit = async (data: unknown) => {
    // Check for similar opportunities before creating
    const formData = data as Record<string, unknown>;
    if (!hasConfirmed && formData.name) {
      await checkForSimilar(formData.name as string);
    }

    // Create the opportunity
    try {
      await create(
        "opportunities",
        { data },
        {
          onSuccess: (record) => {
            notify("Opportunity created successfully", { type: "success" });
            redirect("show", "opportunities", record.id);
          },
          onError: (error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to create opportunity";
            notify(errorMessage, { type: "error" });
          },
        }
      );
    } catch {
      // Error already handled by onError callback
    }
  };

  const handleCancel = () => {
    handlePotentialDiscard(() => redirect("list", "opportunities"));
  };

  return (
    <FormProgressProvider initialProgress={10}>
      {/* Error Summary */}
      {Object.keys(errors || {}).length > 0 && (
        <FormErrorSummary
          errors={errors}
          fieldLabels={OPPORTUNITY_FIELD_LABELS}
          defaultExpanded={Object.keys(errors).length <= 3}
        />
      )}

      {/* Progress Bar */}
      <FormProgressBar className="mb-6" />

      {/* Wizard Container - StepIndicator MUST be inside FormWizard for useWizard context */}
      <FormWizard steps={OPPORTUNITY_WIZARD_STEPS} onSubmit={handleSubmit}>
        {/* Step Indicator - moved inside FormWizard to access useWizard context */}
        <StepIndicator className="mb-4" />
        {/* Step 1: Basic Information */}
        <WizardStep step={1}>
          <OpportunityWizardStep1 />
        </WizardStep>

        {/* Step 2: Pipeline & Team */}
        <WizardStep step={2}>
          <OpportunityWizardStep2 />
        </WizardStep>

        {/* Step 3: Contacts & Products */}
        <WizardStep step={3}>
          <OpportunityWizardStep3 />
        </WizardStep>

        {/* Step 4: Additional Details */}
        <WizardStep step={4}>
          <OpportunityWizardStep4 />
        </WizardStep>

        {/* Navigation */}
        <WizardNavigation submitLabel="Create Opportunity" showCancel onCancel={handleCancel} />
      </FormWizard>

      {/* Unsaved Changes Warning Dialog */}
      <UnsavedChangesDialog
        open={showWarning}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </FormProgressProvider>
  );
};

export { OpportunityCreateWizard };
export default OpportunityCreateWizard;
