import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "../layout/FormToolbar";
import { OpportunityInputs } from "./forms/OpportunityInputs";
import { opportunitySchema } from "../validation/opportunities";

const OpportunityCreate = () => {
  const { identity } = useGetIdentity();

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
      <div className="mt-2">
        <Form defaultValues={formDefaults}>
          <Card>
            <CardContent>
              <OpportunityInputs mode="create" />
              <FormToolbar>
                <div className="flex flex-row gap-2 justify-end">
                  <CancelButton />
                  <SaveButton label="Create Opportunity" />
                </div>
              </FormToolbar>
            </CardContent>
          </Card>
        </Form>
      </div>
    </CreateBase>
  );
};

export { OpportunityCreate };
export default OpportunityCreate;
