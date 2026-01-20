import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
import { LEAD_SOURCE_CHOICES } from "@/constants/choices";

export function LeadSourceInput() {
  return (
    <GenericSelectInput
      source="lead_source"
      choices={LEAD_SOURCE_CHOICES}
      placeholder="Select lead source..."
      searchable={false}
    />
  );
}
