import { useCallback } from "react";
import type { InputProps, Identifier } from "ra-core";
import { FieldTitle, useChoicesContext, useInput, useTranslate, type ChoicesProps } from "ra-core";
import { X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField, FormLabel, FormError } from "@/components/admin/form";
import { InputHelperText } from "@/components/admin/input-helper-text";
import { cn } from "@/lib/utils";

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

    emptyText = "Select items",

    ...rest
  } = props;
  const translate = useTranslate();

  const { allChoices, source } = useChoicesContext({
    choices: choicesProp,
    resource: resourceProp,
    source: sourceProp,
  });

  const { id, field, isRequired } = useInput({
    defaultValue,
    resource: resourceProp,
    source,
    validate,
    ...rest,
  });

  const handleChange = useCallback(
    (choiceId: Identifier, checked: boolean) => {
      const currentValue = field.value || [];
      const newValue = checked
        ? [...currentValue, choiceId]
        : currentValue.filter((v: Identifier) => v !== choiceId);
      field.onChange(newValue);
    },
    [field]
  );

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      field.onChange([]);
    },
    [field]
  );

  const selectedCount = field.value?.length || 0;
  const displayText = selectedCount > 0 ? `${emptyText} (${selectedCount} selected)` : emptyText;

  return (
    <FormField id={id} name={field.name} className={props.className}>
      {label !== false && (
        <FormLabel>
          <FieldTitle
            label={label}
            source={source}
            resource={resourceProp}
            isRequired={isRequired}
          />
        </FormLabel>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between",
              selectedCount > 0 && !disabled && "border-primary text-primary"
            )}
            disabled={disabled}
          >
            <span>{displayText}</span>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {selectedCount > 0 && (
            <>
              <DropdownMenuItem onClick={handleClearAll}>
                <X className="mr-2 h-4 w-4" />
                Clear all
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
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
      <FormError />
    </FormField>
  );
};

export type MultiSelectInputProps = ChoicesProps &
  Partial<InputProps> & {
    emptyText?: string;
  };
