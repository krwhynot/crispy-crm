import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { CreateInDialogButton } from "@/components/admin/create-in-dialog-button";
import { FormSection } from "@/components/admin/form";
import { Avatar } from "./Avatar";
import { AutocompleteOrganizationInput } from "../organizations/AutocompleteOrganizationInput";
import { OrganizationInputs } from "../organizations/OrganizationInputs";
import { useFormContext } from "react-hook-form";
import { useGetIdentity } from "ra-core";
import type { Sale } from "../types";
import * as React from "react";

const personalInfoTypes = [{ id: "Work" }, { id: "Home" }, { id: "Other" }];

const saleOptionRenderer = (choice: Sale) => `${choice.first_name} ${choice.last_name}`;

export const ContactMainTab = () => {
  const { data: identity } = useGetIdentity();
  const { setValue, getValues } = useFormContext();

  const handleEmailChange = (email: string) => {
    const { first_name, last_name } = getValues();
    if (first_name || last_name || !email) return;
    const [first, last] = email.split("@")[0].split(".");
    setValue("first_name", first.charAt(0).toUpperCase() + first.slice(1));
    setValue("last_name", last ? last.charAt(0).toUpperCase() + last.slice(1) : "");
  };

  const handleEmailPaste: React.ClipboardEventHandler<HTMLTextAreaElement | HTMLInputElement> = (
    e
  ) => {
    const email = e.clipboardData?.getData("text/plain");
    handleEmailChange(email);
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const email = e.target.value;
    handleEmailChange(email);
  };

  return (
    <div className="space-y-6">
      <FormSection title="Identity">
        <div className="space-y-2">
          <Avatar />
          <TextInput source="first_name" label="First Name *" helperText="Required field" />
          <TextInput source="last_name" label="Last Name *" helperText="Required field" />
        </div>
      </FormSection>

      <FormSection title="Organization">
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
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
      </FormSection>

      <FormSection title="Account Manager">
        <ReferenceInput
          reference="sales"
          source="sales_id"
          sort={{ field: "last_name", order: "ASC" }}
          filter={{
            "disabled@neq": true,
            "user_id@not.is": null,
          }}
        >
          <SelectInput
            helperText="Required field"
            label="Account manager *"
            optionText={saleOptionRenderer}
          />
        </ReferenceInput>
      </FormSection>

      <FormSection title="Contact Information">
        <div className="space-y-2">
          <ArrayInput source="email" label="Email addresses" helperText={false}>
            <SimpleFormIterator
              inline
              disableReordering
              disableClear
              className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
            >
              <TextInput
                source="email"
                className="w-full"
                helperText={false}
                label={false}
                placeholder="Email (valid email required)"
                onPaste={handleEmailPaste}
                onBlur={handleEmailBlur}
              />
              <SelectInput
                source="type"
                helperText={false}
                label={false}
                optionText="id"
                choices={personalInfoTypes}
                className="w-24 min-w-24"
              />
            </SimpleFormIterator>
          </ArrayInput>
          <ArrayInput source="phone" label="Phone numbers" helperText={false}>
            <SimpleFormIterator
              inline
              disableReordering
              disableClear
              className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
            >
              <TextInput
                source="number"
                className="w-full"
                helperText={false}
                label={false}
                placeholder="Phone number"
              />
              <SelectInput
                source="type"
                helperText={false}
                label={false}
                optionText="id"
                choices={personalInfoTypes}
                className="w-24 min-w-24"
              />
            </SimpleFormIterator>
          </ArrayInput>
        </div>
      </FormSection>
    </div>
  );
};
