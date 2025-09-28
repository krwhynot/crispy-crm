import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import * as React from "react";
import { useFormContext } from "react-hook-form";

import { BooleanInput } from "@/components/admin/boolean-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { RadioButtonGroupInput } from "@/components/admin/radio-button-group-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
// LinkedIn validation removed - handled at API boundary
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Sale } from "../types";
import { Avatar } from "./Avatar";
import { MultiOrganizationInput } from "./MultiOrganizationInput";

export const ContactInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-2 p-1">
      <Avatar />
      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="flex flex-col gap-10 flex-1">
          <ContactIdentityInputs />
          <ContactPositionInputs />
        </div>
        <Separator
          orientation={isMobile ? "horizontal" : "vertical"}
          className="flex-shrink-0"
        />
        <div className="flex flex-col gap-10 flex-1">
          <ContactPersonalInformationInputs />
          <ContactMiscInputs />
        </div>
      </div>
    </div>
  );
};

const ContactIdentityInputs = () => {
  const { contactGender } = useConfigurationContext();
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Identity</h6>
      <RadioButtonGroupInput
        label={false}
        row
        source="gender"
        choices={contactGender}
        helperText={false}
        optionText="label"
        optionValue="value"
        defaultValue={contactGender[0].value}
      />
      <TextInput source="first_name" label="First Name *" helperText="Required field" />
      <TextInput source="last_name" label="Last Name *" helperText="Required field" />
    </div>
  );
};

const ContactPositionInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Position</h6>
      <TextInput source="title" helperText={false} />
      <TextInput source="department" label="Department" helperText={false} />

      <MultiOrganizationInput />
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
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Personal info</h6>
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
            defaultValue="Work"
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
            defaultValue="Work"
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
  );
};

const personalInfoTypes = [{ id: "Work" }, { id: "Home" }, { id: "Other" }];

const ContactMiscInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Misc</h6>
      <TextInput
        source="background"
        label="Background info (bio, how you met, etc)"
        multiline
        helperText={false}
      />
      <BooleanInput source="has_newsletter" helperText={false} />
      <ReferenceInput
        reference="sales"
        source="sales_id"
        sort={{ field: "last_name", order: "ASC" }}
        filter={{
          "disabled@neq": true,
        }}
      >
        <SelectInput
          helperText="Required field"
          label="Account manager *"
          optionText={saleOptionRenderer}
        />
      </ReferenceInput>
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) =>
  `${choice.first_name} ${choice.last_name}`;
