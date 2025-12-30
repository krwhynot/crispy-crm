import { SelectInput } from "@/components/admin/select-input";
import { LEAD_SOURCE_CHOICES } from "./constants/LeadSourceInput.constants";

export const LeadSourceInput = () => {
  return (
    <SelectInput
      source="lead_source"
      label="Lead Source"
      choices={LEAD_SOURCE_CHOICES}
      helperText={false}
    />
  );
};
