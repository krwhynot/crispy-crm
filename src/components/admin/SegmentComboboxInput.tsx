import { SelectInput } from "@/components/admin/select-input";
import { PLAYBOOK_CATEGORY_CHOICES } from "@/atomic-crm/validation/segments";

interface SegmentSelectInputProps {
  source: string;
  label?: string;
  helperText?: string | false;
  className?: string;
}

/**
 * Segment selection input using fixed Playbook categories
 *
 * Replaces the old SegmentComboboxInput which allowed dynamic segment creation.
 * Now uses 9 fixed categories aligned with MFB's sales playbook:
 * - Major Broadline, Specialty/Regional, Management Company, GPO,
 * - University, Restaurant Group, Chain Restaurant, Hotel & Aviation, Unknown
 */
export const SegmentComboboxInput = (props: SegmentSelectInputProps) => {
  return (
    <SelectInput
      source={props.source}
      label={props.label}
      choices={PLAYBOOK_CATEGORY_CHOICES}
      helperText={props.helperText}
      className={props.className}
      emptyText="Select category..."
      // Transform empty string to null for database nullable UUID fields
      parse={(value: string) => (value === "" ? null : value)}
    />
  );
};

// Re-export with more descriptive name for new code
export const PlaybookCategoryInput = SegmentComboboxInput;
