import { CreateBase, Form, Loading, useGetIdentity } from "ra-core";
import { useFormState } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { FormToolbar } from "../layout/FormToolbar";
import { OpportunityInputs } from "./OpportunityInputs";
import { opportunitySchema } from "../validation/opportunities";
import { OpportunityCreateSaveButton } from "./components/OpportunityCreateSaveButton";
import { SimilarOpportunitiesDialog } from "./components/SimilarOpportunitiesDialog";
import { useSimilarOpportunityCheck } from "./hooks/useSimilarOpportunityCheck";
import { OpportunityCreateFormTutorial } from "../tutorial/OpportunityCreateFormTutorial";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

const OpportunityCreate = () => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

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

  // Guard: Wait for identity to load before rendering form
  // This prevents the race condition where form defaults are computed
  // before identity is available, causing account_manager_id to be undefined
  // and failing RLS policy: account_manager_id = current_sales_id()
  if (identityLoading || !identity?.id) {
    return <Loading />;
  }

  // Generate defaults from schema, then merge with identity-specific values
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // Use .partial() to make all fields optional during default generation
  // This extracts fields with .default() (stage, priority, estimated_close_date)
  // Explicitly initialize array fields for React Hook Form to track them:
  // Note: identity.id is now guaranteed to be defined due to the guard above
  const formDefaults = {
    ...opportunitySchema.partial().parse({}),
    opportunity_owner_id: identity.id,
    account_manager_id: identity.id,
    contact_ids: [], // Explicitly initialize for ReferenceArrayInput
    products_to_sync: [], // Explicitly initialize for ArrayInput
  };

  return (
    <CreateBase redirect="show">
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <Form defaultValues={formDefaults}>
            <Card>
              <CardContent>
                <OpportunityFormContent
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

const OpportunityFormContent = ({
  checkForSimilar,
  hasConfirmed,
  resetConfirmation,
}: {
  checkForSimilar: (name: string) => Promise<void>;
  hasConfirmed: boolean;
  resetConfirmation: () => void;
}) => {
  const { errors } = useFormState();
  useUnsavedChangesWarning();

  return (
    <>
      <FormErrorSummary errors={errors} />
      <OpportunityInputs mode="create" />
      <FormToolbar>
        <div className="flex flex-row gap-2 justify-end">
          <CancelButton />
          <div data-tutorial="opp-save-btn">
            <OpportunityCreateSaveButton
              checkForSimilar={checkForSimilar}
              hasConfirmed={hasConfirmed}
              resetConfirmation={resetConfirmation}
            />
          </div>
        </div>
      </FormToolbar>
    </>
  );
};

export { OpportunityCreate };
export default OpportunityCreate;
