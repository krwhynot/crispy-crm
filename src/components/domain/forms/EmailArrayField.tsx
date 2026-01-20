import * as React from "react";
import { ArrayInput } from "@/components/ra-wrappers/array-input";
import { SimpleFormIterator } from "@/components/ra-wrappers/simple-form-iterator";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { CONTACT_TYPE_OPTIONS } from "./constants";

export interface EmailArrayFieldProps {
  source?: string;
  label?: string;
  helperText?: string | false;
  isRequired?: boolean;
  onEmailPaste?: React.ClipboardEventHandler<HTMLTextAreaElement | HTMLInputElement>;
  onEmailBlur?: React.FocusEventHandler<HTMLTextAreaElement | HTMLInputElement>;
  validate?: (value: string) => string | undefined;
}

export const EmailArrayField = ({
  source = "email",
  label = "Email addresses",
  helperText,
  isRequired = false,
  onEmailPaste,
  onEmailBlur,
  validate,
}: EmailArrayFieldProps) => {
  const displayLabel = isRequired ? `${label} *` : label;
  const displayHelperText =
    helperText === undefined && isRequired ? "At least one email required" : helperText;

  return (
    <ArrayInput source={source} label={displayLabel} helperText={displayHelperText}>
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
          onPaste={onEmailPaste}
          onBlur={onEmailBlur}
          autoComplete="email"
          validate={validate}
        />
        <SelectInput
          source="type"
          helperText={false}
          label={false}
          optionText="id"
          choices={CONTACT_TYPE_OPTIONS}
          className="w-24 min-w-24"
          defaultValue="work"
        />
      </SimpleFormIterator>
    </ArrayInput>
  );
};
