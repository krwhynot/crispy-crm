import {
  ReferenceInput,
  TextInput,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
} from "@/components/admin";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { required, useRecordContext } from "ra-core";
import ImageEditorField from "../misc/ImageEditorField";
import { isLinkedinUrl } from "../misc/isLinkedInUrl";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Company, Sale } from "../types";
import { sizes } from "./sizes";

const isUrl = (url: string) => {
  if (!url) return;
  const UrlRegex = new RegExp(
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i,
  );
  if (!UrlRegex.test(url)) {
    return "Must be a valid URL";
  }
};

export const OrganizationInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-4 p-1">
      <OrganizationDisplayInputs />
      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="flex flex-col gap-10 flex-1">
          <OrganizationContactInputs />
          <OrganizationContextInputs />
        </div>
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <div className="flex flex-col gap-8 flex-1">
          <OrganizationAddressInputs />
          <OrganizationAdditionalInformationInputs />
          <OrganizationAccountManagerInput />
        </div>
      </div>
    </div>
  );
};

const OrganizationDisplayInputs = () => {
  const record = useRecordContext<Company>();
  return (
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
        validate={required()}
        helperText={false}
        placeholder="Organization name"
      />
    </div>
  );
};

const OrganizationContactInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Contact</h6>
      <TextInput source="website" helperText={false} validate={isUrl} />
      <TextInput
        source="linkedin_url"
        helperText={false}
        validate={isLinkedinUrl}
      />
      <TextInput source="phone_number" helperText={false} />
    </div>
  );
};

const OrganizationContextInputs = () => {
  const { organizationSectors } = useConfigurationContext();
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Context</h6>
      <SelectInput
        source="sector"
        choices={organizationSectors.map((sector) => ({
          id: sector,
          name: sector,
        }))}
        helperText={false}
      />
      <SelectInput source="size" choices={sizes} helperText={false} />
      <SelectInput
        source="organization_type"
        choices={[
          { id: "customer", name: "Customer" },
          { id: "prospect", name: "Prospect" },
          { id: "vendor", name: "Vendor" },
          { id: "partner", name: "Partner" },
          { id: "principal", name: "Principal" },
          { id: "distributor", name: "Distributor" },
          { id: "unknown", name: "Unknown" },
        ]}
        helperText={false}
        emptyText="Select organization type"
      />
      <SelectInput
        source="priority"
        choices={[
          { id: "A", name: "A - High Priority" },
          { id: "B", name: "B - Medium-High Priority" },
          { id: "C", name: "C - Medium Priority" },
          { id: "D", name: "D - Low Priority" },
        ]}
        helperText={false}
        emptyText="Select priority level"
      />
      <TextInput
        source="segment"
        helperText={false}
        placeholder="Segment (e.g., Enterprise, SMB)"
      />
      <TextInput source="revenue" helperText={false} />
      <TextInput source="tax_identifier" helperText={false} />
    </div>
  );
};

const OrganizationAddressInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Address</h6>
      <TextInput source="address" helperText={false} />
      <TextInput source="city" helperText={false} />
      <TextInput source="zipcode" helperText={false} />
      <TextInput source="stateAbbr" helperText={false} />
      <TextInput source="country" helperText={false} />
    </div>
  );
};

const OrganizationAdditionalInformationInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Additional information</h6>
      <TextInput source="description" multiline helperText={false} />
      <ReferenceInput
        source="parent_organization_id"
        reference="organizations"
        helperText={false}
      >
        <SelectInput
          label="Parent organization"
          helperText={false}
          optionText="name"
          emptyText="Select parent organization (optional)"
        />
      </ReferenceInput>
      <ArrayInput source="context_links" helperText={false}>
        <SimpleFormIterator disableReordering fullWidth getItemLabel={false}>
          <TextInput
            source=""
            label={false}
            helperText={false}
            validate={isUrl}
          />
        </SimpleFormIterator>
      </ArrayInput>
    </div>
  );
};

const OrganizationAccountManagerInput = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Account manager</h6>
      <ReferenceInput
        source="sales_id"
        reference="sales"
        filter={{
          "disabled@neq": true,
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
  `${choice.first_name} ${choice.last_name}`;
