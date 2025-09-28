import { EditBase, Form, useRecordContext } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/admin/delete-button";
import { SaveButton } from "@/components/admin/form";
import { CancelButton } from "@/components/admin/cancel-button";
import { ReferenceField } from "@/components/admin/reference-field";
import {  } from "@/components/admin/";
import { FormToolbar } from "../layout/FormToolbar";
import { OpportunityInputs } from "./OpportunityInputs";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import type { Opportunity } from "../types";

const OpportunityEdit = () => (
  <EditBase actions={false} redirect="show" mutationMode="pessimistic">
    <div className="mt-2">
      <EditHeader />
      <div className="flex gap-8">
        <Form className="flex flex-1 flex-col gap-4 pb-2">
          <Card>
            <CardContent>
              <OpportunityInputs />
              <FormToolbar>
                <div className="flex flex-row gap-2 justify-between w-full">
                  <DeleteButton />
                  <div className="flex gap-2">
                    <CancelButton />
                    <SaveButton />
                  </div>
                </div>
              </FormToolbar>
            </CardContent>
          </Card>
        </Form>
      </div>
    </div>
  </EditBase>
);

const EditHeader = () => {
  const opportunity = useRecordContext<Opportunity>();
  if (!opportunity) return null;

  return (
    <div className="flex items-center gap-4 mb-4">
      {opportunity.customer_organization_id && (
        <ReferenceField
          source="customer_organization_id"
          reference="organizations"
          link={false}
        >
          <OrganizationAvatar />
        </ReferenceField>
      )}
      <h2 className="text-2xl font-semibold">Edit {opportunity.name}</h2>
    </div>
  );
};

export { OpportunityEdit };
export default OpportunityEdit;
