import * as React from "react";
import { useState } from "react";
import { useInput, useGetList, useCreate, useNotify, FieldTitle } from "ra-core";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormField, FormLabel, FormControl, FormError } from "@/components/admin/form";

interface IndustryComboboxInputProps {
  source: string;
  label?: string;
  helperText?: string;
  className?: string;
}

export const IndustryComboboxInput = (props: IndustryComboboxInputProps) => {
  const { field } = useInput(props);
  const notify = useNotify();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Fetch industries for dropdown
  const { data: industries, isLoading } = useGetList("industries", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Create new industry handler
  const [create, { isLoading: isCreating }] = useCreate("industries");

  const handleCreateIndustry = async (name: string) => {
    try {
      const newIndustry = await create(
        "industries",
        { data: { name } },
        { returnPromise: true }
      );

      // Auto-select newly created industry
      field.onChange(newIndustry.id);
      notify("Industry created successfully", { type: "success" });
      setOpen(false);
      setSearchQuery("");
    } catch {
      notify("Failed to create industry", { type: "error" });
    }
  };

  const selectedIndustry = industries?.find((industry) => industry.id === field.value);

  // Filter industries based on search query
  const filteredIndustries = industries?.filter((industry) =>
    industry.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Check if search query matches an existing industry
  const exactMatch = filteredIndustries.some(
    (industry) => industry.name.toLowerCase() === searchQuery.toLowerCase()
  );

  const showCreateOption = searchQuery.trim() !== "" && !exactMatch;

  return (
    <FormField id={field.name} className={cn("w-full", props.className)} name={field.name}>
      {props.label !== false && (
        <FormLabel>
          <FieldTitle
            label={props.label}
            source={props.source}
            resource="organizations"
          />
        </FormLabel>
      )}
      <FormControl>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-9 font-normal"
              disabled={isLoading || isCreating}
            >
              {selectedIndustry ? (
                selectedIndustry.name
              ) : (
                <span className="text-muted-foreground">Select or create industry...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search industries..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading || isCreating ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : (
              <>
                {filteredIndustries.length === 0 && !showCreateOption && (
                  <CommandEmpty>No industry found.</CommandEmpty>
                )}
                <CommandGroup>
                  {filteredIndustries.map((industry) => (
                    <CommandItem
                      key={industry.id}
                      value={industry.id}
                      onSelect={() => {
                        field.onChange(industry.id === field.value ? "" : industry.id);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          field.value === industry.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {industry.name}
                    </CommandItem>
                  ))}
                  {showCreateOption && (
                    <CommandItem
                      value={`create-${searchQuery}`}
                      onSelect={() => handleCreateIndustry(searchQuery)}
                      className="text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{searchQuery}"
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
        </Popover>
      </FormControl>
      <FormError />
    </FormField>
  );
};
