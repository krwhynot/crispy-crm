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

interface SegmentComboboxInputProps {
  source: string;
  label?: string;
  helperText?: string;
  className?: string;
}

export const SegmentComboboxInput = (props: SegmentComboboxInputProps) => {
  const { field } = useInput(props);
  const notify = useNotify();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Fetch segments for dropdown
  const { data: segments, isLoading } = useGetList("segments", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Create new segment handler
  const [create, { isLoading: isCreating }] = useCreate("segments");

  const handleCreateSegment = async (name: string) => {
    try {
      const newSegment = await create("segments", { data: { name } }, { returnPromise: true });

      // Auto-select newly created segment
      field.onChange(newSegment.id);
      notify("Segment created successfully", { type: "success" });
      setOpen(false);
      setSearchQuery("");
    } catch {
      notify("Failed to create segment", { type: "error" });
    }
  };

  const selectedSegment = segments?.find((segment) => segment.id === field.value);

  // Filter segments based on search query
  const filteredSegments =
    segments?.filter((segment) => segment.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    [];

  // Check if search query matches an existing segment
  const exactMatch = filteredSegments.some(
    (segment) => segment.name.toLowerCase() === searchQuery.toLowerCase()
  );

  const showCreateOption = searchQuery.trim() !== "" && !exactMatch;

  return (
    <FormField id={field.name} className={cn("w-full", props.className)} name={field.name}>
      {props.label !== false && (
        <FormLabel>
          <FieldTitle label={props.label} source={props.source} resource="organizations" />
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
              {selectedSegment ? (
                selectedSegment.name
              ) : (
                <span className="text-[color:var(--text-subtle)]">Select or create segment...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search segments..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {isLoading || isCreating ? (
                  <CommandEmpty>Loading...</CommandEmpty>
                ) : (
                  <>
                    {filteredSegments.length === 0 && !showCreateOption && (
                      <CommandEmpty>No segment found.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {filteredSegments.map((segment) => (
                        <CommandItem
                          key={segment.id}
                          value={segment.id}
                          onSelect={() => {
                            field.onChange(segment.id === field.value ? "" : segment.id);
                            setOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === segment.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {segment.name}
                        </CommandItem>
                      ))}
                      {showCreateOption && (
                        <CommandItem
                          value={`create-${searchQuery}`}
                          onSelect={() => handleCreateSegment(searchQuery)}
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
