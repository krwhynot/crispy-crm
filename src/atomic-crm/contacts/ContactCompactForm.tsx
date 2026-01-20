import { required } from "react-admin";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import {
  CompactFormRow,
  FormFieldWrapper,
  FormSectionWithProgress,
} from "@/components/ra-wrappers/form";
import { Avatar } from "./Avatar";
import { ContactAdditionalDetails } from "./ContactAdditionalDetails";
import { EmailArrayField, PhoneArrayField } from "@/components/domain/forms";
import { OrganizationPicker } from "@/atomic-crm/contacts/components/OrganizationPicker";
import { useFormContext } from "react-hook-form";
import { saleOptionRenderer } from "../utils/saleOptionRenderer";
import * as React from "react";
import { z } from "zod";
import { ucFirst, extractEmailLocalPart } from "@/atomic-crm/utils";

const emailSchema = z.string().email("Invalid email address");

const validateEmailOnBlur = (value: string) => {
  if (!value || value.trim() === "") return undefined;
  const result = emailSchema.safeParse(value.trim());
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const ContactCompactForm = () => {
  const { setValue, getValues } = useFormContext();

  const handleEmailChange = (email: string) => {
    const { first_name, last_name } = getValues();
    if (first_name || last_name || !email) return;
    const localPart = extractEmailLocalPart(email);
    if (!localPart) return;
    const [first, last] = localPart.split(".");
    if (!first) return;
    setValue("first_name", ucFirst(first));
    setValue("last_name", last ? ucFirst(last) : "");
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
      <FormSectionWithProgress
        id="name-section"
        title="Name"
        requiredFields={["first_name", "last_name"]}
      >
        <CompactFormRow columns="md:grid-cols-[1fr_1fr_auto]" alignItems="start">
          <div data-tutorial="contact-first-name">
            <FormFieldWrapper name="first_name" isRequired>
              <TextInput
                source="first_name"
                label="First Name"
                helperText="First name is required"
                autoComplete="given-name"
                validate={required("First name is required")}
              />
            </FormFieldWrapper>
          </div>
          <div data-tutorial="contact-last-name">
            <FormFieldWrapper name="last_name" isRequired>
              <TextInput
                source="last_name"
                label="Last Name"
                helperText="Last name is required"
                autoComplete="family-name"
                validate={required("Last name is required")}
              />
            </FormFieldWrapper>
          </div>
          <div className="pt-6">
            <Avatar />
          </div>
        </CompactFormRow>
      </FormSectionWithProgress>

      <FormSectionWithProgress
        id="organization-section"
        title="Organization"
        requiredFields={["organization_id", "sales_id"]}
      >
        {/* Organization - full width row */}
        <div data-tutorial="contact-organization">
          <FormFieldWrapper name="organization_id" isRequired countDefaultAsFilled>
            <OrganizationPicker label="Organization" helperText="Organization is required" />
          </FormFieldWrapper>
        </div>

        {/* Account Manager - full width row */}
        <div data-tutorial="contact-account-manager">
          <FormFieldWrapper name="sales_id" isRequired countDefaultAsFilled>
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
                helperText="Account manager is required"
                label="Account manager"
                optionText={saleOptionRenderer}
              />
            </ReferenceInput>
          </FormFieldWrapper>
        </div>
      </FormSectionWithProgress>

      <FormSectionWithProgress
        id="contact-info-section"
        title="Contact Info"
        requiredFields={[]}
      >
        {/* Email - full width row (optional) */}
        <div data-tutorial="contact-email">
          <FormFieldWrapper name="email">
            <EmailArrayField
              onEmailPaste={handleEmailPaste}
              onEmailBlur={handleEmailBlur}
              validate={validateEmailOnBlur}
            />
          </FormFieldWrapper>
        </div>

        {/* Phone - full width row */}
        <div data-tutorial="contact-phone">
          <FormFieldWrapper name="phone">
            <PhoneArrayField />
          </FormFieldWrapper>
        </div>
      </FormSectionWithProgress>

      <ContactAdditionalDetails />
    </div>
  );
};
