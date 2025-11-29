import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { CreateInDialogButton } from "@/components/admin/create-in-dialog-button";
import { useFormContext } from "react-hook-form";
import { useGetIdentity } from "ra-core";
import { AutocompleteOrganizationInput } from "../organizations/AutocompleteOrganizationInput";
import { OrganizationInputs } from "../organizations/OrganizationInputs";

export const ContactPositionTab = () => {
  const { identity } = useGetIdentity();
  const { setValue } = useFormContext();

  return (
    <div className="space-y-2">
      <TextInput source="title" helperText={false} />
      <TextInput source="department" label="Department" helperText={false} />
      <div className="space-y-2">
        <ReferenceInput
          source="organization_id"
          reference="organizations"
          label="Organization *"
          isRequired
        >
          <AutocompleteOrganizationInput />
        </ReferenceInput>
        <CreateInDialogButton
          resource="organizations"
          label="New Organization"
          defaultValues={{
            organization_type: "customer",
            sales_id: identity?.id,
            segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52",
          }}
          onSave={(newOrg) => {
            setValue("organization_id", newOrg.id);
          }}
          transform={(values) => {
            if (values.website && !values.website.startsWith("http")) {
              values.website = `https://${values.website}`;
            }
            return values;
          }}
          title="Create New Organization"
          description="Create a new organization and associate it with this contact"
        >
          <OrganizationInputs />
        </CreateInDialogButton>
      </div>
    </div>
  );
};
