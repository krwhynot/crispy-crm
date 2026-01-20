import * as React from "react";
import { useEffect, useState } from "react";
import { FieldTitle, type InputProps, useInput, useResourceContext } from "ra-core";
import { FormControl, FormField, FormLabel } from "@/components/ra-wrappers/form";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ra-wrappers/form";
import { InputHelperText } from "@/components/ra-wrappers/input-helper-text";

export const NumberInput = (props: NumberInputProps) => {
  const {
    label,
    source,
    className,
    resource: resourceProp,
    validate: _validateProp,
    format: _formatProp,
    parse = convertStringToNumber,
    onFocus,
    helperText,
    defaultValue: _defaultValue, // Extract defaultValue to prevent it from being spread to Input
    ...rest
  } = props;
  const resource = useResourceContext({ resource: resourceProp });

  const { id, field, isRequired } = useInput(props);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numberValue = parse(value);

    setValue(value);
    field.onChange(numberValue ?? 0);
  };

  const [value, setValue] = useState<string | undefined>(field.value?.toString() ?? "");

  const hasFocus = React.useRef(false);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
    hasFocus.current = true;
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    field.onBlur?.(event);
    hasFocus.current = false;
    setValue(field.value?.toString() ?? "");
  };

  useEffect(() => {
    if (!hasFocus.current) {
      setValue(field.value?.toString() ?? "");
    }
  }, [field.value]);

  return (
    <FormField id={id} className={className} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle label={label} source={source} resource={resource} isRequired={isRequired} />
        </FormLabel>
      )}
      <FormControl>
        <Input
          {...rest}
          {...field}
          type="number"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};

export interface NumberInputProps
  extends
    InputProps,
    Omit<React.ComponentProps<"input">, "defaultValue" | "onBlur" | "onChange" | "type"> {
  parse?: (value: string) => number;
}

/**
 * Parse a string to number with locale awareness.
 * Handles both '.' and ',' as decimal separators based on the input.
 * HTML5 number inputs always use '.' internally, but this handles
 * edge cases where values might come from other sources.
 */
const convertStringToNumber = (value?: string | null) => {
  if (value == null || value === "") {
    return null;
  }
  // HTML5 number inputs always use '.' as decimal separator internally
  // But normalize common locale variations just in case
  const normalized = value.replace(",", ".");
  const float = parseFloat(normalized);

  return isNaN(float) ? 0 : float;
};
