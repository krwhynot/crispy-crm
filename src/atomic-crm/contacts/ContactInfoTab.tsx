import * as React from "react";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { useFormContext } from "react-hook-form";

const personalInfoTypes = [{ id: "Work" }, { id: "Home" }, { id: "Other" }];

export const ContactInfoTab = () => {
  const { getValues, setValue } = useFormContext();

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
      <TextInput
        source="linkedin_url"
        label="LinkedIn URL"
        helperText="Format: https://linkedin.com/in/username"
      />
    </div>
  );
};
