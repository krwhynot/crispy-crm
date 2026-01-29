import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CreateBase, Form, Loading, useGetIdentity } from "ra-core";
import { getContextAwareRedirect } from "@/atomic-crm/utils/getContextAwareRedirect";
import { Card, CardContent } from "@/components/ui/card";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
import { OpportunityInputs } from "./OpportunityInputs";
import { opportunitySchema } from "../validation/opportunities";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { OpportunityCreateFormFooter } from "./OpportunityCreateFormFooter";
import { SimilarOpportunitiesDialog } from "./SimilarOpportunitiesDialog";
import { useSimilarOpportunityCheck } from "./useSimilarOpportunityCheck";
import { OpportunityCreateFormTutorial } from "../tutorial/OpportunityCreateFormTutorial";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useFormState } from "react-hook-form";

const OpportunityCreate = () => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity();
  const [searchParams] = useSearchParams();
  const redirect = getContextAwareRedirect(searchParams);

  // Read URL params (e.g., ?customer_organization_id=123 from Org slideover)
  const urlCustomerOrgId = searchParams.get("customer_organization_id");

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
  // IMPORTANT: useMemo MUST be called before any early returns (hooks rules)
  // identity.id may be undefined during loading - we handle that in the guard below
  const formDefaults = useMemo(
    () => ({
      ...opportunitySchema.partial().parse({}),
      opportunity_owner_id: identity?.id,
      account_manager_id: identity?.id,
      contact_ids: [], // Explicitly initialize for ReferenceArrayInput
      products_to_sync: [], // Explicitly initialize for ArrayInput
      // URL param pre-fill: customer org from Organization slideover context
      ...(urlCustomerOrgId && { customer_organization_id: Number(urlCustomerOrgId) }),
    }),
    [identity?.id, urlCustomerOrgId]
  );

  // Guard: Wait for identity to load before rendering form
  // This prevents the race condition where form defaults are computed
  // before identity is available, causing account_manager_id to be undefined
  // and failing RLS policy: account_manager_id = current_sales_id()
  if (identityLoading || !identity?.id) {
    return <Loading />;
  }

  return (
    <CreateBase redirect={redirect}>
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar schema={opportunitySchema} className="mb-6" />
            <Form
              defaultValues={formDefaults}
              mode="onBlur"
              resolver={createFormResolver(opportunitySchema)}
            >
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
          </FormProgressProvider>
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
  checkForSimilar: ReturnType<typeof useSimilarOpportunityCheck>["checkForSimilar"];
  hasConfirmed: boolean;
  resetConfirmation: () => void;
}) => {
  const { errors } = useFormState();
  useUnsavedChangesWarning();

  return (
    <>
      <FormErrorSummary errors={errors} />
      <OpportunityInputs mode="create" />
      <OpportunityCreateFormFooter
        checkForSimilar={checkForSimilar}
        hasConfirmed={hasConfirmed}
        resetConfirmation={resetConfirmation}
        redirectPath="/opportunities"
        preserveFields={["customer_organization_id", "principal_id"]}
        tutorialAttribute="opp-save-btn"
      />
    </>
  );
};

export { OpportunityCreate };
export default OpportunityCreate;
