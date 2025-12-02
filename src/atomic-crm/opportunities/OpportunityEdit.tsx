import { EditBase, Form, useRecordContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/admin/delete-button";
import { SaveButton } from "@/components/admin/form";
import { CancelButton } from "@/components/admin/cancel-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { FormToolbar } from "../layout/FormToolbar";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import type { Opportunity } from "../types";
import { OpportunityGeneralTab } from "./forms/tabs/OpportunityGeneralTab";
import { OpportunityClassificationTab } from "./forms/tabs/OpportunityClassificationTab";
import { OpportunityRelationshipsTab } from "./forms/tabs/OpportunityRelationshipsTab";
import { OpportunityAdditionalInfoTab } from "./forms/tabs/OpportunityAdditionalInfoTab";
import { OpportunityActivityTab } from "./forms/tabs/OpportunityActivityTab";

const OpportunityEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      actions={false}
      redirect="show"
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          // Invalidate opportunities cache
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        },
      }}
    >
      <div className="mt-2">
        <OpportunityEditForm />
      </div>
    </EditBase>
  );
};

const OpportunityEditForm = () => {
  const record = useRecordContext<Opportunity>();

  // Wait for record to load before rendering form
  if (!record) return null;

  const tabs = [
    {
      key: "general",
      label: "General",
      fields: ["name", "description", "estimated_close_date"],
      content: <OpportunityGeneralTab mode="edit" />,
    },
    {
      key: "classification",
      label: "Classification",
      fields: ["stage", "priority", "lead_source", "campaign", "tags"],
      content: <OpportunityClassificationTab />,
    },
    {
      key: "relationships",
      label: "Relationships",
      fields: [
        "customer_organization_id",
        "principal_organization_id",
        "distributor_organization_id",
        "account_manager_id",
        "contact_ids",
        "products_to_sync",
      ],
      content: <OpportunityRelationshipsTab />,
    },
    {
      key: "additional-info",
      label: "Additional Info",
      fields: [
        "related_opportunity_id",
        "notes",
        "next_action",
        "next_action_date",
        "decision_criteria",
      ],
      content: <OpportunityAdditionalInfoTab />,
    },
    {
      key: "activity",
      label: "Activity",
      fields: [],
      content: <OpportunityActivityTab />,
    },
  ];

  return (
    <Form
      className="flex flex-1 flex-col gap-4 pb-2"
      defaultValues={record}
      key={record.id} // Force remount when record changes
    >
      <Card>
        <CardContent className="pt-6">
          <EditHeader />

          <div className="mt-6">
            <TabbedFormInputs tabs={tabs} defaultTab="general" />
          </div>

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
  );
};

const EditHeader = () => {
  const opportunity = useRecordContext<Opportunity>();
  if (!opportunity) return null;

  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-4">
        {opportunity.customer_organization_id && (
          <ReferenceField source="customer_organization_id" reference="organizations" link={false}>
            <OrganizationAvatar />
          </ReferenceField>
        )}
        <h2 className="text-2xl font-semibold">Edit {opportunity.name}</h2>
      </div>
    </div>
  );
};

export { OpportunityEdit };
export default OpportunityEdit;
