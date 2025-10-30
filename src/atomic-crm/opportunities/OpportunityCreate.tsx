import {
  CreateBase,
  Form,
  useGetIdentity,
} from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "../layout/FormToolbar";
import { OpportunityInputs } from "./OpportunityInputs";
import { opportunitySchema } from "../validation/opportunities";

const OpportunityCreate = () => {
  const { identity } = useGetIdentity();

  // Generate defaults from schema, then merge with identity-specific values
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // Use .partial() to make all fields optional during default generation
  // This extracts only fields with .default() (stage, priority, estimated_close_date)
  // Required fields without defaults are left undefined:
  // - contact_ids: undefined (validation will catch if user doesn't add contacts)
  // - name: user must fill (text input works fine with undefined)
  const formDefaults = {
    ...opportunitySchema.partial().parse({}),
    opportunity_owner_id: identity?.id,
    account_manager_id: identity?.id,
  };

  return (
    <CreateBase
      redirect="show"
    >
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
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
      </div>
    </CreateBase>
  );
};

export { OpportunityCreate };
export default OpportunityCreate;
