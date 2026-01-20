import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
import { US_STATES } from "@/constants/choices";

interface StateComboboxInputProps {
  source: string;
  label?: string;
}

export function StateComboboxInput({ source, label: _label = "State" }: StateComboboxInputProps) {
  return (
    <GenericSelectInput
      source={source}
      choices={[...US_STATES]}
      placeholder="Select state..."
      searchable={true}
    />
  );
}
