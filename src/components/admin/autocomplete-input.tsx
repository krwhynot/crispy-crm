import * as React from "react";
import { useCallback, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  AUTOCOMPLETE_MIN_CHARS,
  AUTOCOMPLETE_DEBOUNCE_MS,
} from "@/atomic-crm/utils/autocompleteDefaults";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { FormControl, FormError, FormField, FormLabel } from "@/components/admin/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ChoicesProps, InputProps, RaRecord, FilterPayload } from "ra-core";
import {
  useChoices,
  useChoicesContext,
  useGetRecordRepresentation,
  useInput,
  useTranslate,
  FieldTitle,
  useEvent,
} from "ra-core";
import { InputHelperText } from "./input-helper-text";
import type { SupportCreateSuggestionOptions } from "@/hooks/useSupportCreateSuggestion";
import { useSupportCreateSuggestion } from "@/hooks/useSupportCreateSuggestion";

/**
 * AutocompleteInput - Enhanced autocomplete with toggle selection
 *
 * ## Selection Behavior
 * - **Non-required fields:** Clicking a selected item toggles it off (deselects)
 * - **Required fields:** Cannot deselect - must choose a different option
 *
 * This toggle pattern allows users to clear selections without a separate "X" button,
 * which is especially useful on touch devices where the clear button may be hard to tap.
 *
 * @example
 * ```tsx
 * // Required field - no toggle, must select something
 * <AutocompleteInput source="organization_id" isRequired />
 *
 * // Optional field - clicking selected item clears it
 * <AutocompleteInput source="category" />
 * ```
 */
export const AutocompleteInput = (
  props: Omit<InputProps, "source"> &
    Omit<SupportCreateSuggestionOptions, "handleChange" | "filter"> &
    Partial<Pick<InputProps, "source">> &
    ChoicesProps & {
      className?: string;
      disableValue?: string;
      filterToQuery?: (searchText: string) => FilterPayload;
      translateChoice?: boolean;
      placeholder?: string;
      inputText?: React.ReactNode | ((option: RaRecord | undefined) => React.ReactNode);
    }
) => {
  const {
    filterToQuery = DefaultFilterToQuery,
    inputText,
    create,
    createValue,
    createLabel,
    createHintValue,
    createItemLabel,
    onCreate,
    optionText,
  } = props;
  const {
    allChoices = [],
    source,
    resource,
    isFromReference,
    setFilters,
  } = useChoicesContext(props);
  const { id, field, isRequired } = useInput({ ...props, source });
  const translate = useTranslate();
  const { placeholder = translate("ra.action.search", { _: "Search..." }) } = props;

  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const { getChoiceText, getChoiceValue } = useChoices({
    optionText: props.optionText ?? (isFromReference ? getRecordRepresentation : "name"),
    optionValue: props.optionValue ?? "id",
    disableValue: props.disableValue,
    translateChoice: props.translateChoice ?? !isFromReference,
  });

  const [filterValue, setFilterValue] = React.useState("");
  const debounceRef = useRef<NodeJS.Timeout>();

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const [open, setOpen] = React.useState(false);
  const selectedChoice = allChoices.find((choice) => getChoiceValue(choice) === field.value);

  const getInputText = useCallback(
    (selectedChoice: RaRecord | undefined) => {
      if (typeof inputText === "function") {
        return inputText(selectedChoice);
      }
      if (inputText !== undefined) {
        return inputText;
      }
      return getChoiceText(selectedChoice);
    },
    [inputText, getChoiceText]
  );

  const handleOpenChange = useEvent((isOpen: boolean) => {
    setOpen(isOpen);
    // Reset the filter when the popover is closed
    if (!isOpen) {
      setFilters(filterToQuery(""));
    }
  });

  const handleChange = useCallback(
    (choice: RaRecord) => {
      if (field.value === getChoiceValue(choice) && !isRequired) {
        field.onChange("");
        setFilterValue("");
        if (isFromReference) {
          setFilters(filterToQuery(""));
        }
        setOpen(false);
        return;
      }
      field.onChange(getChoiceValue(choice));
      setOpen(false);
    },
    [
      field,
      getChoiceValue,
      isRequired,
      setFilterValue,
      isFromReference,
      setFilters,
      filterToQuery,
      setOpen,
    ]
  );

  const {
    getCreateItem,
    handleChange: handleChangeWithCreateSupport,
    createElement,
    getOptionDisabled,
  } = useSupportCreateSuggestion({
    create,
    createLabel,
    createValue,
    createHintValue,
    createItemLabel,
    onCreate,
    handleChange,
    optionText,
    filter: filterValue,
  });

  const createItem =
    (create || onCreate) && (filterValue !== "" || createLabel) ? getCreateItem(filterValue) : null;
  let finalChoices = allChoices;
  if (createItem) {
    finalChoices = [...finalChoices, createItem];
  }

  return (
    <>
      <FormField className={props.className} id={id} name={source}>
        {props.label !== false && (
          <FormLabel>
            <FieldTitle
              label={props.label}
              source={props.source ?? source}
              resource={resource}
              isRequired={isRequired}
            />
          </FormLabel>
        )}
        <FormControl>
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label={selectedChoice ? String(getInputText(selectedChoice)) : placeholder}
                className="w-full justify-between h-auto py-1.75 font-normal"
              >
                {selectedChoice ? (
                  getInputText(selectedChoice)
                ) : (
                  <span className="text-foreground/70">{placeholder}</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" side="bottom" align="start">
              {/* We handle the filtering ourselves */}
              <Command shouldFilter={!isFromReference}>
                <CommandInput
                  placeholder="Search..."
                  value={filterValue}
                  onValueChange={(filter) => {
                    setFilterValue(filter);

                    // We don't want the ChoicesContext to filter the choices if the input
                    // is not from a reference as it would also filter out the selected values
                    if (isFromReference) {
                      // Clear any pending debounced request
                      if (debounceRef.current) clearTimeout(debounceRef.current);

                      // Debounce API calls and enforce minimum character requirement
                      debounceRef.current = setTimeout(() => {
                        // Only call setFilters if empty (reset) or min chars met
                        if (filter === "" || filter.length >= AUTOCOMPLETE_MIN_CHARS) {
                          setFilters(filterToQuery(filter));
                        }
                      }, AUTOCOMPLETE_DEBOUNCE_MS);
                    }
                  }}
                />
                <CommandEmpty>
                  {filterValue.trim().length === 0
                    ? "Type to search..."
                    : filterValue.trim().length < AUTOCOMPLETE_MIN_CHARS
                      ? `Enter ${AUTOCOMPLETE_MIN_CHARS - filterValue.trim().length} more character${AUTOCOMPLETE_MIN_CHARS - filterValue.trim().length > 1 ? "s" : ""}`
                      : "No matching item found."}
                </CommandEmpty>
                <CommandGroup className="max-h-[280px] overflow-y-auto">
                  {finalChoices.map((choice) => {
                    const isCreateItem = !!createItem && choice?.id === createItem.id;
                    const disabled = getOptionDisabled(choice);

                    return (
                      <CommandItem
                        key={getChoiceValue(choice)}
                        value={
                          isCreateItem
                            ? // if it's the create option, include the filter value so it is shown in the command input
                              // characters before and after the filter value are required
                              // to show the option when the filter value starts or ends with a space
                              `?${filterValue}?`
                            : getChoiceValue(choice)
                        }
                        onSelect={() => handleChangeWithCreateSupport(choice)}
                        disabled={disabled}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === getChoiceValue(choice) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {getChoiceText(isCreateItem ? createItem : choice)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </FormControl>
        <InputHelperText helperText={props.helperText} />
        <FormError />
      </FormField>
      {createElement}
    </>
  );
};

const DefaultFilterToQuery = (searchText: string) => ({ q: searchText });
