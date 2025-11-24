import { EditBase, Form, useRecordContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";
import { SaveButton } from "@/components/admin/form";
import { CancelButton } from "@/components/admin/cancel-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { FormToolbar } from "../layout/FormToolbar";
import { OpportunityInputs } from "./forms/OpportunityInputs";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import { NoteCreate as _NoteCreate, NotesIterator } from "../notes";
import type { Opportunity } from "../types";
import { ActivityNoteForm } from "./ActivityNoteForm";

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

  return (
    <Form
      className="flex flex-1 flex-col gap-4 pb-2"
      defaultValues={record}
      key={record.id} // Force remount when record changes
    >
      <Card>
        <CardContent className="pt-6">
          <EditHeader />

          <Tabs defaultValue="details" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <OpportunityInputs mode="edit" />
            </TabsContent>

            <TabsContent value="notes">
              <div className="m-4">
                <Separator className="mb-4" />
                <ActivityNoteForm opportunity={record} />
                <Separator className="my-6" />
                <ReferenceManyField
                  target="opportunity_id"
                  reference="opportunityNotes"
                  sort={{ field: "created_at", order: "DESC" }}
                  empty={null}
                >
                  <NotesIterator reference="opportunities" />
                </ReferenceManyField>
              </div>
            </TabsContent>
          </Tabs>

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
