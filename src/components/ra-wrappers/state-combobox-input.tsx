import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
import { US_STATES } from "@/constants/choices";

interface StateComboboxInputProps {
  source: string;
  label?: string;
}

export function StateComboboxInput({ source, label = "State" }: StateComboboxInputProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium leading-none">{label}</span>
      <GenericSelectInput
        source={source}
        choices={[...US_STATES]}
        placeholder="Select state..."
        searchable={true}
      />
    </div>
  );
}
