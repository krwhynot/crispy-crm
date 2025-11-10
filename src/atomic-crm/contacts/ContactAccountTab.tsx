import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import type { Sale } from "../types";

export const ContactAccountTab = () => {
  return (
    <div className="space-y-4">
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
      <TextInput
        source="notes"
        label="Notes"
        multiline
        rows={4}
        helperText="Additional information about this contact"
      />
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) =>
  `${choice.first_name} ${choice.last_name}`;
