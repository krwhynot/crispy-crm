import { useMemo } from "react";
import { EditBase, Form, useRecordContext, useNotify, useRefresh } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import { opportunityKeys } from "../queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";
import { SaveButton } from "@/components/admin/form";
import { CancelButton } from "@/components/admin/cancel-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { FormToolbar } from "../layout/FormToolbar";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import type { Opportunity } from "../types";
import { OpportunityCompactForm } from "./forms/OpportunityCompactForm";
import { OpportunityActivitySection } from "./components/OpportunityActivitySection";
import { opportunitySchema } from "@/atomic-crm/validation/opportunities";

const OpportunityEdit = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const refresh = useRefresh();

  return (
    <EditBase
      actions={false}
      redirect="show"
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        },
        onError: (error: Error) => {
          if (error.message?.includes("CONFLICT")) {
            notify(
              "This opportunity was modified by another user. Refreshing to show latest version.",
              { type: "warning" }
            );
            refresh();
          } else {
            notify(error.message || "Failed to save opportunity", { type: "error" });
          }
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

  const defaultValues = useMemo(() => opportunitySchema.partial().parse(record), [record]);

  // Wait for record to load before rendering form
  if (!record) return null;

  return (
    <Form
      className="flex flex-1 flex-col gap-4 pb-2"
      defaultValues={defaultValues}
      key={record.id} // Force remount when record changes
    >
      <Card>
        <CardContent className="pt-6">
          <EditHeader />

          <div className="mt-6">
            <OpportunityCompactForm mode="edit" />
            <Separator className="my-6" />
            <OpportunityActivitySection />
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
