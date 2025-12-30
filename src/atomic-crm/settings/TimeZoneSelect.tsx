import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { US_TIMEZONES } from "@/constants/choices";

interface TimeZoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimeZoneSelect({ value, onChange, disabled }: TimeZoneSelectProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="timezone-select" className="text-sm font-medium leading-none">Time Zone</label>
      <GenericSelectInput
        inputId="timezone-select"
        value={value}
        onChange={(v) => onChange(v as string)}
        choices={[...US_TIMEZONES]}
        isDisabled={disabled}
        searchable={false}
        placeholder="Select time zone"
      />
      <p className="text-sm text-muted-foreground">
        Times will be displayed in your selected timezone
      </p>
    </div>
  );
}
