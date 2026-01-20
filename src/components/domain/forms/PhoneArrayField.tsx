import { ArrayInput } from "@/components/ra-wrappers/array-input";
import { SimpleFormIterator } from "@/components/ra-wrappers/simple-form-iterator";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";

/**
 * Phone type choices - defined at module level for stable reference.
 * Prevents SelectInput re-render loops that cause "Loading..." state.
 */
const PHONE_TYPE_CHOICES = [
  { id: "work", name: "Work" },
  { id: "home", name: "Home" },
  { id: "other", name: "Other" },
];

interface PhoneArrayFieldProps {
  source?: string;
  label?: string;
  helperText?: string | false;
}

/**
 * Phone array field for contact forms.
 * Wraps ArrayInput + SimpleFormIterator for phone number entries.
 *
 * @example
 * <PhoneArrayField />
 *
 * @example With custom source
 * <PhoneArrayField source="phone_numbers" label="Phone" />
 */
export const PhoneArrayField = ({
  source = "phone",
  label = "Phone numbers",
  helperText = false,
}: PhoneArrayFieldProps) => (
  <ArrayInput source={source} label={label} helperText={helperText}>
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
        placeholder="Phone number"
        autoComplete="tel"
      />
      <SelectInput
        source="type"
        helperText={false}
        label={false}
        choices={PHONE_TYPE_CHOICES}
        className="w-24 min-w-24"
        defaultValue="work"
        translateChoice={false}
      />
    </SimpleFormIterator>
  </ArrayInput>
);
