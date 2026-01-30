import { useWatch } from "react-hook-form";
import type { Validator } from "react-admin";
import { required } from "react-admin";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { PLAYBOOK_CATEGORY_CHOICES, PLAYBOOK_CATEGORY_IDS } from "@/atomic-crm/validation/segments";
import { OPERATOR_SEGMENT_CHOICES } from "@/atomic-crm/validation/operatorSegments";

type SegmentChoice = {
  id: string;
  name: string;
  isParent?: boolean;
  parentId?: string;
};

interface SegmentSelectInputProps {
  source: string;
  label?: string;
  helperText?: string | false;
  className?: string;
  validate?: Validator | Validator[];
  allowUnknown?: boolean;
}

export const UNKNOWN_SEGMENT_ID = PLAYBOOK_CATEGORY_IDS.Unknown;

/**
 * Segment selection input with conditional display based on organization type
 *
 * - Distributors/Principals: Uses 9 fixed Playbook categories (Major Broadline, Specialty/Regional, etc.)
 * - Customers/Prospects/Unknown: Uses Operator segments (FSR, LSR, Hotels, etc.)
 *
 * Watches organization_type field to determine which segment choices to display.
 *
 * This field has BUILT-IN required validation - segment_id is always required for organizations.
 */
export const SegmentSelectInput = (props: SegmentSelectInputProps) => {
  // Watch organization_type to determine which segments to show
  const organizationType = useWatch({ name: "organization_type" });

  // Distributors/Principals use Playbook categories
  // Customers/Prospects/Unknown use Operator segments
  const usePlaybookCategories =
    organizationType === "distributor" || organizationType === "principal";

  const UNKNOWN_SEGMENT = { id: UNKNOWN_SEGMENT_ID, name: "Unknown" };

  const baseChoices = usePlaybookCategories ? PLAYBOOK_CATEGORY_CHOICES : OPERATOR_SEGMENT_CHOICES;

  // Ensure "Unknown" is always a selectable option, prepending it to the list.
  // This handles cases where a record might have the default "Unknown" ID from the DB
  // and makes it explicitly selectable by the user.
  // We filter out any existing "Unknown" from the base lists to prevent duplicates.
  const choices = [
    UNKNOWN_SEGMENT,
    ...baseChoices.filter((choice) => choice.id !== UNKNOWN_SEGMENT_ID),
  ];

  const defaultLabel = usePlaybookCategories ? "Playbook Category" : "Operator Segment";

  // Built-in required validation + any additional validators from props
  // Custom validator to ensure the value is in the current list of choices
  // This prevents "phantom" default values (like "Unknown") from passing validation
  // while appearing blank in the UI.
  const validateInChoices = (value: unknown) => {
    if (!value) return undefined; // Handled by required()
    const isValid = choices.some((c: SegmentChoice) => c.id === value);
    return isValid ? undefined : "Selected segment is not valid for this organization type";
  };

  // Reject "Unknown" segment for create forms (allowUnknown=false by default)
  const rejectUnknown = (value: unknown) => {
    if (!props.allowUnknown && value === UNKNOWN_SEGMENT_ID) {
      return "Please select a specific segment (not 'Unknown')";
    }
    return undefined;
  };

  // Built-in required validation + choice validation + any additional validators from props
  const validators: Validator[] = [
    required("Segment is required"),
    validateInChoices,
    rejectUnknown,
    ...(props.validate ? (Array.isArray(props.validate) ? props.validate : [props.validate]) : []),
  ];

  return (
    <SelectInput
      source={props.source}
      label={props.label ?? defaultLabel}
      choices={choices}
      helperText={props.helperText}
      className={props.className}
      emptyText={`Select ${defaultLabel.toLowerCase()}...`}
      parse={(value: string) => (value === "" ? null : value)}
      validate={validators}
    />
  );
};

// Keep backward compatible export (used by OrganizationCompactForm)
export const SegmentComboboxInput = SegmentSelectInput;
