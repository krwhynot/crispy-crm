import { useInput } from "ra-core";
import type { InputProps } from "ra-core";
import { SelectUI, type SelectUIProps, type SelectOption } from "@/components/ui/select-ui";

interface GenericSelectInputProps
  extends Omit<InputProps, "source">,
    Omit<SelectUIProps, "value" | "onChange" | "hasError" | "options"> {
  source: string;
  choices: Array<Record<string, unknown>>;
  optionValue?: string;
  optionLabel?: string;
}

export function GenericSelectInput({
  source,
  choices,
  optionValue = "id",
  optionLabel = "name",
  ...rest
}: GenericSelectInputProps) {
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
