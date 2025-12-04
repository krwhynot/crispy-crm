import { type InputProps, useInput, useResourceContext, FieldTitle } from "ra-core";
import { FormControl, FormError, FormField, FormLabel } from "@/components/admin/form";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InputHelperText } from "@/components/admin/input-helper-text";
import { sanitizeInputRestProps } from "@/lib/sanitizeInputRestProps";

export type TextInputProps = InputProps & {
  multiline?: boolean;
} & React.ComponentProps<"textarea"> &
  React.ComponentProps<"input">;

export const TextInput = (props: TextInputProps) => {
  const resource = useResourceContext(props);
  const {
    label,
    source,
    multiline,
    className,
    validate: _validateProp,
    format: _formatProp,
    helperText,
    ...rest
  } = props;
  const { id, field, isRequired } = useInput(props);

  // Format value for date/datetime inputs
  // Handles both string values (from DB) and Date objects (from Zod coerce.date())
  const formatDateValue = (val: unknown): string | undefined => {
    if (val == null) return undefined;
    if (val instanceof Date) {
      // Convert Date object to ISO string for input element
      return val.toISOString();
    }
    return typeof val === "string" ? val : undefined;
  };

  const value =
    props.type === "datetime-local"
      ? formatDateValue(field.value)?.slice(0, 16) // Adjust for datetime-local input format
      : props.type === "date"
        ? formatDateValue(field.value)?.slice(0, 10) // Adjust for date input format
        : field.value;

  // Sanitize props to remove React Admin specific props that shouldn't be passed to DOM elements
  const sanitizedProps = sanitizeInputRestProps(rest);

  return (
    <FormField id={id} className={cn(className, "w-full")} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle label={label} source={source} resource={resource} isRequired={isRequired} />
        </FormLabel>
      )}
      <FormControl>
        {multiline ? (
          <Textarea {...sanitizedProps} {...field} value={value} />
        ) : (
          <Input {...sanitizedProps} {...field} value={value} />
        )}
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
