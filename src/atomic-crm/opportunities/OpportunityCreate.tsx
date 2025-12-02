import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { FormToolbar } from "../layout/FormToolbar";
import { OpportunityInputs } from "./forms/OpportunityInputs";
import { opportunitySchema } from "../validation/opportunities";
import { OpportunityCreateSaveButton } from "./components/OpportunityCreateSaveButton";
import { SimilarOpportunitiesDialog } from "./components/SimilarOpportunitiesDialog";
import { useSimilarOpportunityCheck } from "./hooks/useSimilarOpportunityCheck";

const OpportunityCreate = () => {
  const { data: identity } = useGetIdentity();

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

  // Generate defaults from schema, then merge with identity-specific values
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // Use .partial() to make all fields optional during default generation
  // This extracts fields with .default() (stage, priority, estimated_close_date)
  // Explicitly initialize array fields for React Hook Form to track them:
  const formDefaults = {
    ...opportunitySchema.partial().parse({}),
    opportunity_owner_id: identity?.id,
    account_manager_id: identity?.id,
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
                <OpportunityInputs mode="create" />
                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <CancelButton />
                    <OpportunityCreateSaveButton
                      checkForSimilar={checkForSimilar}
                      hasConfirmed={hasConfirmed}
                      resetConfirmation={resetConfirmation}
                    />
                  </div>
                </FormToolbar>
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
    </CreateBase>
  );
};

export { OpportunityCreate };
export default OpportunityCreate;
