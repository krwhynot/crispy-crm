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
          <SelectInput
            source="status"
            label="Status"
            choices={STATUS_CHOICES}
            helperText={false}
            emptyText="Select status"
          />
          <SelectInput
            source="status_reason"
            label="Status Reason"
            choices={STATUS_REASON_CHOICES}
            helperText={false}
            emptyText="Select reason"
          />
        </CompactFormRow>
        <CompactFormRow>
          <SelectInput
            source="payment_terms"
            label="Payment Terms"
            choices={PAYMENT_TERMS_CHOICES}
            helperText={false}
            emptyText="Select terms"
          />
          <NumberInput
            source="credit_limit"
            label="Credit Limit"
            helperText="Maximum credit allowed"
          />
        </CompactFormRow>
        <TextInput
          source="territory"
          label="Territory"
          helperText="Geographic territory assignment"
        />
      </div>
    </FormSection>
  );
};
