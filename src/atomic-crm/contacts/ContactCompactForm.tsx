import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { CompactFormRow } from "@/components/admin/form";
import { Avatar } from "./Avatar";
import { ContactAdditionalDetails } from "./ContactAdditionalDetails";
import { AutocompleteOrganizationInput } from "../organizations/AutocompleteOrganizationInput";
import { useFormContext } from "react-hook-form";
import { saleOptionRenderer } from "../utils/saleOptionRenderer";
import * as React from "react";

// Lowercase type values to match Zod schema (personalInfoTypeSchema)
const personalInfoTypes = [{ id: "work" }, { id: "home" }, { id: "other" }];

export const ContactCompactForm = () => {
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
    <div className="space-y-3">
      <CompactFormRow columns="md:grid-cols-[1fr_1fr_auto]" alignItems="start">
        <div data-tutorial="contact-first-name">
          <TextInput source="first_name" label="First Name *" helperText="Required field" />
        </div>
        <div data-tutorial="contact-last-name">
          <TextInput source="last_name" label="Last Name *" helperText="Required field" />
        </div>
        <div className="pt-6">
          <Avatar />
        </div>
      </CompactFormRow>

      {/* Organization - full width row */}
      <div data-tutorial="contact-organization">
        <ReferenceInput
          source="organization_id"
          reference="organizations"
          label="Organization *"
          isRequired
        >
          <AutocompleteOrganizationInput helperText="Required field" />
        </ReferenceInput>
      </div>

      {/* Account Manager - full width row */}
      <div data-tutorial="contact-account-manager">
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
      </div>

      {/* Email - full width row */}
      <div data-tutorial="contact-email">
        <ArrayInput source="email" label="Email addresses" helperText={false}>
          <SimpleFormIterator
            inline
            disableReordering
            disableClear
            className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
          >
            <TextInput
              source="value"
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
      </div>

      {/* Phone - full width row */}
      <div data-tutorial="contact-phone">
        <ArrayInput source="phone" label="Phone numbers" helperText={false}>
          <SimpleFormIterator
            inline
            disableReordering
            disableClear
            className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
          >
            <TextInput
              source="value"
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

      <ContactAdditionalDetails />
    </div>
  );
};
