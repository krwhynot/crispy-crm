import { useWatch } from "react-hook-form";
import { useEffect } from "react";
import type { Validator } from "react-admin";
import { required, useRecordContext } from "react-admin";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import {
  PLAYBOOK_CATEGORY_CHOICES,
  PLAYBOOK_CATEGORY_IDS,
  UNKNOWN_SEGMENT_ID,
} from "@/atomic-crm/validation/segments";
import { OPERATOR_SEGMENT_CHOICES } from "@/atomic-crm/validation/operatorSegments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useFormContext } from "react-hook-form";

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
 * - Distributors: Only Major Broadline and Specialty/Regional (2 options)
 * - Principals: Only Principal/Manufacturer (1 option, auto-selected)
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
  const record = useRecordContext();
  const { setValue } = useFormContext();

  // Auto-select Principal/Manufacturer segment when organization_type changes to "principal"
  useEffect(() => {
    if (organizationType === "principal") {
      const principalSegmentId = PLAYBOOK_CATEGORY_IDS["Principal/Manufacturer"];
      // Only auto-set if creating (no record) or if current segment is not the principal segment
      if (!record || record.segment_id !== principalSegmentId) {
        setValue("segment_id", principalSegmentId, { shouldValidate: true });
      }
    }
  }, [organizationType, record, setValue]);

  // Distributors/Principals use Playbook categories
  // Customers/Prospects/Unknown use Operator segments
  const usePlaybookCategories =
    organizationType === "distributor" || organizationType === "principal";

  // Filter to only Major Broadline and Specialty/Regional for distributors
  const DISTRIBUTOR_ONLY_SEGMENTS = [
    "22222222-2222-4222-8222-000000000001", // Major Broadline
    "22222222-2222-4222-8222-000000000002", // Specialty/Regional
  ];

  // Principal/Manufacturer segment for principals only
  const PRINCIPAL_SEGMENT = ["22222222-2222-4222-8222-000000000010"];

  let baseChoices;
  if (organizationType === "distributor") {
    // Distributors only see Major Broadline and Specialty/Regional
    baseChoices = PLAYBOOK_CATEGORY_CHOICES.filter((choice) =>
      DISTRIBUTOR_ONLY_SEGMENTS.includes(choice.id)
    );
  } else if (organizationType === "principal") {
    // Principals only see Principal/Manufacturer (auto-selected)
    baseChoices = PLAYBOOK_CATEGORY_CHOICES.filter((choice) =>
      PRINCIPAL_SEGMENT.includes(choice.id)
    );
  } else if (usePlaybookCategories) {
    // Fallback for other playbook types (shouldn't happen with current types)
    baseChoices = PLAYBOOK_CATEGORY_CHOICES;
  } else {
    // Customers/Prospects see operator segments
    baseChoices = OPERATOR_SEGMENT_CHOICES;
  }

  // Only include "Unknown" when allowUnknown is true (edit forms).
  // Create forms should not offer "Unknown" as a selectable option.
  const choices = props.allowUnknown
    ? [
        { id: UNKNOWN_SEGMENT_ID, name: "Unknown" },
        ...baseChoices.filter((choice) => choice.id !== UNKNOWN_SEGMENT_ID),
      ]
    : baseChoices.filter((choice) => choice.id !== UNKNOWN_SEGMENT_ID);

  const defaultLabel = "Category";

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
    (organizationType === "distributor" || organizationType === "principal") && parentOrgId;

  return (
    <>
      {isDistributorBranch && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Creating a distributor branch? Choose between: <strong>Major Broadline</strong>{" "}
            (national distributors) or <strong>Specialty/Regional</strong> (regional/specialty
            focus)
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
