import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import type { ReferenceInputProps } from "@/components/ra-wrappers/reference-input";
import { AutocompleteOrganizationInput } from "@/atomic-crm/organizations/AutocompleteOrganizationInput";
import { enableGetChoices } from "@/atomic-crm/utils/autocompleteDefaults";

interface OrganizationPickerProps
  extends Omit<ReferenceInputProps, "children" | "reference"> {
  organizationType?: "customer" | "prospect" | "principal" | "distributor";
  label?: string;
  helperText?: string;
}

/**
 * Convenience wrapper for selecting organizations.
 * Combines ReferenceInput with AutocompleteOrganizationInput.
 *
 * @example
 * <OrganizationPicker source="organization_id" isRequired />
 *
 * @example With organization type filter
 * <OrganizationPicker
 *   source="principal_id"
 *   organizationType="principal"
 *   label="Principal"
 * />
 */
export const OrganizationPicker = ({
  source = "organization_id",
  organizationType,
  label = "Organization",
  helperText,
  ...props
}: OrganizationPickerProps) => (
  <ReferenceInput
    source={source}
    reference="organizations"
    enableGetChoices={enableGetChoices}
    {...props}
  >
    <AutocompleteOrganizationInput
      organizationType={organizationType}
      label={label}
      helperText={helperText}
    />
  </ReferenceInput>
);
