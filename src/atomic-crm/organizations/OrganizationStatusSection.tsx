import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { NumberInput } from "@/components/admin/number-input";
import { FormSection, CompactFormRow, FormFieldWrapper } from "@/components/admin/form";
import { STATUS_CHOICES, STATUS_REASON_CHOICES, PAYMENT_TERMS_CHOICES } from "./constants";

export const OrganizationStatusSection = () => {
  return (
    <FormSection title="Status & Payment">
      <div className="space-y-4">
        <CompactFormRow>
          <FormFieldWrapper name="status">
            <SelectInput
              source="status"
              label="Status"
              choices={STATUS_CHOICES}
              helperText={false}
              emptyText="Select status"
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="status_reason">
            <SelectInput
              source="status_reason"
              label="Status Reason"
              choices={STATUS_REASON_CHOICES}
              helperText={false}
              emptyText="Select reason"
            />
          </FormFieldWrapper>
        </CompactFormRow>
        <CompactFormRow>
          <FormFieldWrapper name="payment_terms">
            <SelectInput
              source="payment_terms"
              label="Payment Terms"
              choices={PAYMENT_TERMS_CHOICES}
              helperText={false}
              emptyText="Select terms"
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="credit_limit">
            <NumberInput
              source="credit_limit"
              label="Credit Limit"
              helperText="Maximum credit allowed"
            />
          </FormFieldWrapper>
        </CompactFormRow>
        <FormFieldWrapper name="territory">
          <TextInput
            source="territory"
            label="Territory"
            helperText="Geographic territory assignment"
          />
        </FormFieldWrapper>
      </div>
    </FormSection>
  );
};
