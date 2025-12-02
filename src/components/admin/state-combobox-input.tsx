import { useState } from "react";
import { useInput } from "ra-core";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/atomic-crm/organizations/constants";

interface StateComboboxInputProps {
  source: string;
  label?: string;
}

export function StateComboboxInput({
  source,
  label = "State",
}: StateComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const { field } = useInput({ source });

  const selectedState = US_STATES.find((s) => s.id === field.value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-[44px]"
          >
            {selectedState?.name || "Select state..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search states..." />
            <CommandList>
              <CommandEmpty>No state found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {US_STATES.map((state) => (
                  <CommandItem
                    key={state.id}
                    value={state.name}
                    onSelect={() => {
                      field.onChange(state.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        field.value === state.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {state.name} ({state.id})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
