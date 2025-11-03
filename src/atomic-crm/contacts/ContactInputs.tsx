import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import * as React from "react";
import { useFormContext } from "react-hook-form";

import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { CreateInDialogButton } from "@/components/admin/create-in-dialog-button";
// LinkedIn validation removed - handled at API boundary
import type { Sale } from "../types";
import { Avatar } from "./Avatar";
import { AutocompleteOrganizationInput } from "../organizations/AutocompleteOrganizationInput";
import { OrganizationInputs } from "../organizations/OrganizationInputs";
import { useGetIdentity } from "ra-core";

export const ContactInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-6 p-6">
      <Avatar />
      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="flex flex-col gap-6 flex-1">
          <ContactIdentityInputs />
          <ContactPositionInputs />
        </div>
        <Separator
          orientation={isMobile ? "horizontal" : "vertical"}
          className="flex-shrink-0"
        />
        <div className="flex flex-col gap-6 flex-1">
          <ContactPersonalInformationInputs />
          <ContactMiscInputs />
        </div>
      </div>
    </div>
  );
};

const ContactIdentityInputs = () => {
  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <h3 className="text-base font-semibold text-[color:var(--text-primary)]">Contact Name</h3>
      <div className="space-y-4">
        <TextInput source="first_name" label="First Name *" helperText="Required field" />
        <TextInput source="last_name" label="Last Name *" helperText="Required field" />
      </div>
    </div>
  );
};

const ContactPositionInputs = () => {
  const { identity } = useGetIdentity();
  const { setValue } = useFormContext();

  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <h3 className="text-base font-semibold text-[color:var(--text-primary)]">Position</h3>
      <div className="space-y-4">
        <TextInput source="title" helperText={false} />
        <TextInput source="department" label="Department" helperText={false} />

        <div className="space-y-2">
          <ReferenceInput
            source="organization_id"
            reference="organizations"
            label="Organization"
          >
            <AutocompleteOrganizationInput />
          </ReferenceInput>

          <CreateInDialogButton
            resource="organizations"
            label="New Organization"
            defaultValues={{
              organization_type: "customer",
              sales_id: identity?.id,
              segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52", // Default to "Unknown" segment
            }}
            onSave={(newOrg) => {
              // Auto-select the new organization in the form
              setValue("organization_id", newOrg.id);
            }}
            transform={(values) => {
              // add https:// before website if not present
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
    </div>
  );
};

const ContactPersonalInformationInputs = () => {
  const { getValues, setValue } = useFormContext();

  const handleEmailChange = (email: string) => {
    const { first_name, last_name } = getValues();
    if (first_name || last_name || !email) return;
    const [first, last] = email.split("@")[0].split(".");
    setValue("first_name", first.charAt(0).toUpperCase() + first.slice(1));
    setValue(
      "last_name",
      last ? last.charAt(0).toUpperCase() + last.slice(1) : "",
    );
  };

  const handleEmailPaste: React.ClipboardEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (e) => {
    const email = e.clipboardData?.getData("text/plain");
    handleEmailChange(email);
  };

  const handleEmailBlur = (
    e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const email = e.target.value;
    handleEmailChange(email);
  };

  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <h3 className="text-base font-semibold text-[color:var(--text-primary)]">Personal Info</h3>
      <div className="space-y-4">
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
              // defaultValue removed per Constitution #5 - defaults come from Zod schema via form-level defaultValues
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
              // defaultValue removed per Constitution #5 - defaults come from Zod schema via form-level defaultValues
              className="w-24 min-w-24"
            />
          </SimpleFormIterator>
        </ArrayInput>
        <TextInput
          source="linkedin_url"
          label="Linkedin URL"
          helperText="Format: https://linkedin.com/in/username"
        />
      </div>
    </div>
  );
};

const personalInfoTypes = [{ id: "Work" }, { id: "Home" }, { id: "Other" }];

const ContactMiscInputs = () => {
  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <h3 className="text-base font-semibold text-[color:var(--text-primary)]">Additional Info</h3>
      <div className="space-y-4">
        <ReferenceInput
          reference="sales"
          source="sales_id"
          sort={{ field: "last_name", order: "ASC" }}
          filter={{
            "disabled@neq": true,
            "user_id@not.is": null, // Only show authenticated users in dropdown
          }}
        >
          <SelectInput
            helperText="Required field"
            label="Account manager *"
            optionText={saleOptionRenderer}
          />
        </ReferenceInput>
        <TextInput
          source="notes"
          label="Notes"
          multiline
          rows={4}
          helperText="Additional information about this contact"
        />
      </div>
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) =>
  `${choice.first_name} ${choice.last_name}`;
