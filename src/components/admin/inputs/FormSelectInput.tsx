/**
 * FormSelectInput - React Admin form-integrated Select component
 *
 * Wraps shadcn Select with React Admin's form system via useInput.
 * Provides validation error display, accessibility attributes, and
 * standardized choice handling via useChoices.
 *
 * @example
 * ```tsx
 * <FormSelectInput
 *   source="status"
 *   choices={[
 *     { id: 'active', name: 'Active' },
 *     { id: 'inactive', name: 'Inactive' },
 *   ]}
 *   label="Status"
 * />
 * ```
 */
import { useCallback, type ReactNode } from "react";
import { FieldTitle, useChoices, useInput, useResourceContext, useTranslate } from "ra-core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormLabel, FormControl, FormError } from "@/components/ra-wrappers/form";
import { InputHelperText } from "@/components/ra-wrappers/input-helper-text";
import { cn } from "@/lib/utils";

export interface FormSelectInputProps {
  /** Field name in form data (required) */
  source: string;

  /** Array of choices: { id: string|number, name: string } or custom shape */
  choices: Array<Record<string, unknown>>;

  /** Optional label (defaults to humanized source) */
  label?: string | false;

  /** Optional: Field name for choice display text (default: 'name') */
  optionText?: string | ((choice: Record<string, unknown>) => ReactNode);

  /** Optional: Field name for choice value (default: 'id') */
  optionValue?: string;

  /** Optional: Placeholder when no selection */
  placeholder?: string;

  /** Optional: Allow empty selection (default: false) */
  allowEmpty?: boolean;

  /** Optional: Empty option label (default: ' ') */
  emptyText?: string;

  /** Optional: Value for empty option (default: '') */
  emptyValue?: string;

  /** Optional: Disabled state */
  disabled?: boolean;

  /** Optional: Read-only state */
  readOnly?: boolean;

  /** Optional: Full width (default: true) */
  fullWidth?: boolean;

  /** Optional: Helper text below input */
  helperText?: ReactNode;

  /** Optional: CSS class name */
  className?: string;

  /** Optional: Default value */
  defaultValue?: string | number;

  /** Optional: Custom validation function */
  validate?: (value: unknown) => string | undefined;

  /** Optional: Translate choices (default: true) */
  translateChoice?: boolean;
}

export function FormSelectInput(props: FormSelectInputProps) {
  const {
    source,
    choices,
    label,
    optionText = "name",
    optionValue = "id",
    placeholder,
    allowEmpty = false,
    emptyText = " ", // em space for consistent height
    emptyValue = "",
    disabled = false,
    readOnly = false,
    fullWidth = true,
    helperText,
    className,
    defaultValue,
    validate,
    translateChoice = true,
  } = props;

  const translate = useTranslate();
  const resource = useResourceContext();

  // useInput provides React Admin form integration
  const { id, field, isRequired } = useInput({
    source,
    defaultValue,
    validate,
    disabled,
    readOnly,
  });

  // useChoices handles optionText/optionValue mapping with translation
  const { getChoiceText, getChoiceValue } = useChoices({
    optionText,
    optionValue,
    translateChoice,
  });

  // Handle selection change - adapt shadcn's onValueChange to React Admin's onChange
  const handleChange = useCallback(
    (value: string) => {
      if (value === emptyValue) {
        field.onChange(emptyValue);
      } else {
        // Find the choice and use the typed value (preserves number types)
        const choice = choices.find((c) => String(getChoiceValue(c)) === value);
        field.onChange(choice ? getChoiceValue(choice) : value);
      }
    },
    [field, choices, getChoiceValue, emptyValue]
  );

  // Render empty option text
  const renderEmptyText = useCallback(() => {
    if (typeof emptyText === "string" && emptyText.trim() === "") {
      return "\u2003"; // em space for consistent line height
    }
    return translate(emptyText, { _: emptyText });
  }, [emptyText, translate]);

  // Find selected choice for display (handles async loading race conditions)
  const selectedChoice = choices.find(
    (choice) => String(getChoiceValue(choice)) === String(field.value)
  );

  return (
    <FormField
      id={id}
      name={field.name}
      className={cn(fullWidth && "w-full", "min-w-20", className)}
    >
      {label !== false && (
        <FormLabel>
          <FieldTitle label={label} source={source} resource={resource} isRequired={isRequired} />
        </FormLabel>
      )}
      <FormControl>
        <Select
          // Key fixes Radix bug where onValueChange fires with empty string
          // when controlled value changes: https://github.com/radix-ui/primitives/issues/3135
          key={`select:${String(field.value ?? emptyValue)}`}
          value={String(field.value ?? emptyValue)}
          onValueChange={handleChange}
          disabled={disabled || readOnly}
        >
          <SelectTrigger id={id} className={cn("w-full transition-all hover:bg-accent")}>
            <SelectValue placeholder={placeholder ?? renderEmptyText()}>
              {selectedChoice ? getChoiceText(selectedChoice) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {allowEmpty && (
              <SelectItem value={emptyValue || "\u200B"}>
                {/* Zero-width space as value fallback since Radix requires non-empty strings */}
                {renderEmptyText()}
              </SelectItem>
            )}
            {choices.map((choice) => {
              const value = getChoiceValue(choice);
              return (
                <SelectItem key={String(value)} value={String(value)}>
                  {getChoiceText(choice)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
}

export default FormSelectInput;
