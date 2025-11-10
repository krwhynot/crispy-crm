import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { useRecordContext } from "ra-core";
import ImageEditorField from "../misc/ImageEditorField";
import { ParentOrganizationInput } from "./ParentOrganizationInput";
import type { Company, Sale } from "../types";
import { formatName } from "../utils/formatName";

export const OrganizationGeneralTab = () => {
  const record = useRecordContext<Company>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <div className="lg:col-span-2">
        <div className="flex gap-4 flex-1 flex-row">
          <ImageEditorField
            source="logo"
            type="avatar"
            width={60}
            height={60}
            emptyText={record?.name.charAt(0)}
            linkPosition="bottom"
          />
          <TextInput
            source="name"
            className="w-full h-fit"
            helperText="Required field"
            placeholder="Organization name"
            label="Name *"
          />
        </div>
      </div>
      <div className="lg:col-span-2">
        <SelectInput
          source="organization_type"
          label="Organization Type *"
          choices={[
            { id: "customer", name: "Customer" },
            { id: "prospect", name: "Prospect" },
            { id: "principal", name: "Principal" },
            { id: "distributor", name: "Distributor" },
            { id: "unknown", name: "Unknown" },
          ]}
          helperText="Required field"
          emptyText="Select organization type"
        />
      </div>
      <div className="lg:col-span-2">
        <ParentOrganizationInput />
      </div>
      <div className="lg:col-span-2">
        <TextInput source="description" multiline helperText={false} label="Description" />
      </div>
      <ReferenceInput
        source="sales_id"
        reference="sales"
        filter={{
          "disabled@neq": true,
          "user_id@not.is": null,
        }}
      >
        <SelectInput
          label="Account manager"
          helperText={false}
          optionText={saleOptionRenderer}
        />
      </ReferenceInput>
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) =>
  formatName(choice.first_name, choice.last_name);
