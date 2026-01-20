import { useWatch } from "react-hook-form";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { PLAYBOOK_CATEGORY_CHOICES } from "@/atomic-crm/validation/segments";
import { OPERATOR_SEGMENT_CHOICES } from "@/atomic-crm/validation/operatorSegments";

interface SegmentSelectInputProps {
  source: string;
  label?: string;
  helperText?: string | false;
  className?: string;
}

/**
 * Segment selection input with conditional display based on organization type
 *
 * - Distributors/Principals: Uses 9 fixed Playbook categories (Major Broadline, Specialty/Regional, etc.)
 * - Customers/Prospects/Unknown: Uses Operator segments (FSR, LSR, Hotels, etc.)
 *
 * Watches organization_type field to determine which segment choices to display.
 */
export const SegmentSelectInput = (props: SegmentSelectInputProps) => {
  // Watch organization_type to determine which segments to show
  const organizationType = useWatch({ name: "organization_type" });

  // Distributors/Principals use Playbook categories
  // Customers/Prospects/Unknown use Operator segments
  const usePlaybookCategories =
    organizationType === "distributor" || organizationType === "principal";

  const choices = usePlaybookCategories ? PLAYBOOK_CATEGORY_CHOICES : OPERATOR_SEGMENT_CHOICES;

  const defaultLabel = usePlaybookCategories ? "Playbook Category" : "Operator Segment";

  return (
    <SelectInput
      source={props.source}
      label={props.label ?? defaultLabel}
      choices={choices}
      helperText={props.helperText}
      className={props.className}
      emptyText={`Select ${defaultLabel.toLowerCase()}...`}
      parse={(value: string) => (value === "" ? null : value)}
    />
  );
};

// Keep backward compatible export (used by OrganizationCompactForm)
export const SegmentComboboxInput = SegmentSelectInput;
