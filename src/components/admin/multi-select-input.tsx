import { useCallback } from "react";
import type { InputProps } from "ra-core";
import {
  FieldTitle,
  useChoicesContext,
  useInput,
  useTranslate,
  type ChoicesProps,
} from "ra-core";
import { Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FormField, FormLabel, FormError } from "@/components/admin/form";
import { InputHelperText } from "@/components/admin/input-helper-text";

export const MultiSelectInput = (props: MultiSelectInputProps) => {
  const {
    choices: choicesProp,
    resource: resourceProp,
    source: sourceProp,

    optionText,
    optionValue,
    translateChoice,

    defaultValue = [],
    label,
    helperText,
    validate,
    disabled,

    className,
    emptyText = "Select items",

    ...rest
  } = props;
  const translate = useTranslate();

  const {
    allChoices,
    source,
  } = useChoicesContext({
    choices: choicesProp,
    resource: resourceProp,
    source: sourceProp,
  });

  const {
    field,
    fieldState: { error },
    formState: { isSubmitted },
  } = useInput({
    defaultValue,
    resource: resourceProp,
    source,
    validate,
    ...rest,
  });

  const handleChange = useCallback(
    (choiceId: any, checked: boolean) => {
      const currentValue = field.value || [];
      const newValue = checked
        ? [...currentValue, choiceId]
        : currentValue.filter((v: any) => v !== choiceId);
      field.onChange(newValue);
    },
    [field]
  );

  const selectedCount = field.value?.length || 0;
  const displayText = selectedCount > 0
    ? `${emptyText} (${selectedCount} selected)`
    : emptyText;

  return (
    <FormField>
      {label !== false && (
        <FormLabel htmlFor={field.name}>
          <FieldTitle
            label={label}
            source={source}
            resource={resourceProp}
          />
        </FormLabel>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            {displayText}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {allChoices?.map((choice) => {
            const choiceId = choice[optionValue ?? "id"];
            const choiceLabel = choice[optionText ?? "name"];
            const isChecked = field.value?.includes(choiceId) || false;

            return (
              <DropdownMenuCheckboxItem
                key={choiceId}
                checked={isChecked}
                onCheckedChange={(checked) => handleChange(choiceId, checked)}
              >
                {translateChoice ? translate(choiceLabel, { _: choiceLabel }) : choiceLabel}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <InputHelperText helperText={helperText} />
      {error && <FormError>{error.message}</FormError>}
    </FormField>
  );
};

export type MultiSelectInputProps = ChoicesProps &
  Partial<InputProps> & {
    emptyText?: string;
    className?: string;
  };