import { useInput } from "ra-core";
import type { InputProps } from "ra-core";
import { SelectUI, type SelectUIProps, type SelectOption } from "@/components/ui/select-ui";

// =============================================================================
// SHARED BASE PROPS
// =============================================================================
interface GenericSelectInputBaseProps
  extends Omit<SelectUIProps, "value" | "onChange" | "hasError" | "options"> {
  choices: Array<Record<string, unknown>>;
  optionValue?: string;
  optionLabel?: string;
}

// =============================================================================
// FORM MODE (React Admin context)
// =============================================================================
interface GenericSelectInputFormProps
  extends GenericSelectInputBaseProps,
    Omit<InputProps, "source"> {
  source: string;
  value?: never;
  onChange?: never;
}

// =============================================================================
// CONTROLLED MODE (Standalone)
// =============================================================================
interface GenericSelectInputControlledProps extends GenericSelectInputBaseProps {
  source?: never;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  hasError?: boolean;
}

// =============================================================================
// DISCRIMINATED UNION
// =============================================================================
export type GenericSelectInputProps =
  | GenericSelectInputFormProps
  | GenericSelectInputControlledProps;

// =============================================================================
// INTERNAL: Form Mode Component
// =============================================================================
function GenericSelectInputForm({
  source,
  choices,
  optionValue = "id",
  optionLabel = "name",
  ...rest
}: GenericSelectInputFormProps) {
  const { field, fieldState } = useInput({ source });

  const options: SelectOption[] = choices.map((choice) => ({
    id: String(choice[optionValue] ?? choice.id),
    label: String(choice[optionLabel] ?? choice.name),
    ...choice,
  }));

  return (
    <SelectUI
      options={options}
      value={field.value}
      onChange={field.onChange}
      hasError={!!fieldState.error}
      {...rest}
    />
  );
}

// =============================================================================
// INTERNAL: Controlled Mode Component
// =============================================================================
function GenericSelectInputControlled({
  choices,
  optionValue = "id",
  optionLabel = "name",
  value,
  onChange,
  hasError = false,
  ...rest
}: GenericSelectInputControlledProps) {
  const options: SelectOption[] = choices.map((choice) => ({
    id: String(choice[optionValue] ?? choice.id),
    label: String(choice[optionLabel] ?? choice.name),
    ...choice,
  }));

  return (
    <SelectUI
      options={options}
      value={value}
      onChange={onChange}
      hasError={hasError}
      {...rest}
    />
  );
}

// =============================================================================
// PUBLIC: Polymorphic Switch
// =============================================================================
export function GenericSelectInput(props: GenericSelectInputProps) {
  if ("source" in props && props.source !== undefined) {
    return <GenericSelectInputForm {...props} />;
  }
  return <GenericSelectInputControlled {...props as GenericSelectInputControlledProps} />;
}

export type { GenericSelectInputFormProps, GenericSelectInputControlledProps };
