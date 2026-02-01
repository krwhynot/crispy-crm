import { useWatch } from "react-hook-form";
import type { Validator } from "react-admin";
import { required } from "react-admin";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { PLAYBOOK_CATEGORY_CHOICES, UNKNOWN_SEGMENT_ID } from "@/atomic-crm/validation/segments";
import { OPERATOR_SEGMENT_CHOICES } from "@/atomic-crm/validation/operatorSegments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface SegmentChoice {
  id: string;
  name: string;
  isParent?: boolean;
  parentId?: string;
}

interface SegmentSelectInputProps {
  source: string;
  label?: string;
  helperText?: string | false;
  className?: string;
  validate?: Validator | Validator[];
  allowUnknown?: boolean;
}

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
  const parentOrgId = useWatch({ name: "parent_organization_id" });

  // Distributors/Principals use Playbook categories
  // Customers/Prospects/Unknown use Operator segments
  const usePlaybookCategories =
    organizationType === "distributor" || organizationType === "principal";

  const baseChoices = usePlaybookCategories ? PLAYBOOK_CATEGORY_CHOICES : OPERATOR_SEGMENT_CHOICES;

  // Only include "Unknown" when allowUnknown is true (edit forms).
  // Create forms should not offer "Unknown" as a selectable option.
  const choices = props.allowUnknown
    ? [{ id: UNKNOWN_SEGMENT_ID, name: "Unknown" }, ...baseChoices.filter((choice) => choice.id !== UNKNOWN_SEGMENT_ID)]
    : baseChoices.filter((choice) => choice.id !== UNKNOWN_SEGMENT_ID);

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

  // Built-in required validation + choice validation + any additional validators from props
  const validators: Validator[] = [
    required("Segment is required"),
    validateInChoices,
    ...(props.validate ? (Array.isArray(props.validate) ? props.validate : [props.validate]) : []),
  ];

  // Detect distributor branch context for advisory alert
  const isDistributorBranch =
    (organizationType === "distributor" || organizationType === "principal") &&
    parentOrgId;

  return (
    <>
      {isDistributorBranch && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Creating a distributor branch? Consider these segments:{" "}
            <strong>Major Broadline, Specialty/Regional, GPO, Management Company</strong>
          </AlertDescription>
        </Alert>
      )}
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
    </>
  );
};

// Keep backward compatible export (used by OrganizationCompactForm)
export const SegmentComboboxInput = SegmentSelectInput;
