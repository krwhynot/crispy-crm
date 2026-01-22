import { useState, useEffect } from "react";
import { AdminButton } from "@/components/admin/AdminButton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityOption {
  id: number;
  name: string;
  subtitle?: string;
}

interface EntityComboboxProps {
  /** Current selected value */
  value: number | undefined;
  /** Callback when value changes */
  onChange: (value: number | undefined) => void;
  /** List of options to display */
  options: EntityOption[];
  /** Fallback options (for anchor entity fetches) */
  fallbackOptions?: EntityOption[];
  /** Whether options are loading */
  loading: boolean;
  /** Search term for the input */
  searchTerm: string;
  /** Callback to update search term */
  onSearchChange: (term: string) => void;
  /** Placeholder text */
  placeholder: string;
  /** Empty state message */
  emptyMessage: string;
  /** Empty state message when filtered by anchor */
  filteredEmptyMessage?: string;
  /** Whether an anchor filter is active */
  isFiltered?: boolean;
  /** Label for the field */
  label: string;
  /** Description for the field */
  description?: string;
  /** Callback when an item is selected (for side effects) */
  onSelect?: (option: EntityOption) => void;
  /** Callback when cleared */
  onClear?: () => void;
  /** ID for accessibility */
  listId: string;
}

/**
 * Reusable entity combobox with search, loading states, and clear button
 *
 * @pattern Pattern H - Dashboard entity picker (no React Admin form context)
 *
 * Used for Contact, Organization, and Opportunity selection in QuickLogForm.
 * Handles hybrid search (pre-loaded + server search) via parent hook.
 */
export function EntityCombobox({
  value,
  onChange,
  options,
  fallbackOptions = [],
  loading,
  searchTerm,
  onSearchChange,
  placeholder,
  emptyMessage,
  filteredEmptyMessage,
  isFiltered = false,
  label,
  description,
  onSelect,
  onClear,
  listId,
}: EntityComboboxProps) {
  const [open, setOpen] = useState(false);

  // Clear search when popover closes
  useEffect(() => {
    if (!open) {
      onSearchChange("");
    }
  }, [open, onSearchChange]);

  // Find selected option name
  const selectedName = value
    ? (options.find((o) => o.id === value)?.name ??
      fallbackOptions.find((o) => o.id === value)?.name ??
      placeholder)
    : placeholder;

  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <FormControl>
              <AdminButton
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-controls={listId}
                className={cn("h-11 flex-1 justify-between", !value && "text-muted-foreground")}
              >
                {selectedName}
                {loading ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </AdminButton>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command id={listId} shouldFilter={false}>
              <CommandInput
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onValueChange={onSearchChange}
              />
              <CommandList>
                <CommandEmpty>
                  {loading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Searching...</span>
                    </div>
                  ) : isFiltered && filteredEmptyMessage ? (
                    filteredEmptyMessage
                  ) : (
                    emptyMessage
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={String(option.id)}
                      className="h-11"
                      onSelect={() => {
                        onChange(option.id);
                        onSelect?.(option);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex flex-col">
                        <span>{option.name}</span>
                        {option.subtitle && (
                          <span className="text-xs text-muted-foreground">{option.subtitle}</span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {value && (
          <AdminButton
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => {
              onChange(undefined);
              onClear?.();
            }}
            aria-label={`Clear ${label.toLowerCase()} selection`}
          >
            <X className="h-4 w-4" />
          </AdminButton>
        )}
      </div>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}
