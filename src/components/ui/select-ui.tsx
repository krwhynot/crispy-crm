"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";

// Client-side filter threshold: above this, expect server-side filtering
const SEARCH_THRESHOLD = 100;

export interface SelectOption {
  id: string;
  label: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface SelectUIProps {
  // Core
  options: SelectOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;

  // State
  isLoading?: boolean;
  isDisabled?: boolean;
  hasError?: boolean;

  // Display
  placeholder?: string;
  searchPlaceholder?: string;

  // Variants
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;

  // UX Enhancement #1: Rich Items
  itemRenderer?: (option: SelectOption) => React.ReactNode;

  // UX Enhancement #2: Sticky Footer (always visible)
  footer?: React.ReactNode;

  // UX Enhancement #3: Smart Empty State
  emptyAction?: {
    label: string;
    onClick: (searchTerm: string) => void;
  };
  emptyMessage?: string;

  // Search exposure (for quick-create patterns)
  onSearchChange?: (value: string) => void;

  // Styling
  className?: string;
}

export function SelectUI({
  options,
  value,
  onChange,
  isLoading = false,
  isDisabled = false,
  hasError = false,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  multiple = false,
  searchable = true,
  clearable = false,
  itemRenderer,
  footer,
  emptyAction,
  emptyMessage = "No results found",
  onSearchChange,
  className,
}: SelectUIProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Determine if we should use client-side filtering
  const shouldUseClientFilter = options.length <= SEARCH_THRESHOLD;

  // Normalize value to array for unified handling
  const selectedValues = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Get display text for trigger
  const displayText = React.useMemo(() => {
    if (selectedValues.length === 0) return null;
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.id === selectedValues[0]);
      return option?.label ?? selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, options]);

  // Handle search change
  const handleSearchChange = React.useCallback(
    (newSearch: string) => {
      setSearch(newSearch);
      onSearchChange?.(newSearch);
    },
    [onSearchChange]
  );

  // Handle selection
  const handleSelect = React.useCallback(
    (optionId: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionId)
          ? selectedValues.filter((v) => v !== optionId)
          : [...selectedValues, optionId];
        onChange(newValues);
      } else {
        onChange(optionId === selectedValues[0] ? "" : optionId);
        setOpen(false);
        setSearch("");
      }
    },
    [multiple, selectedValues, onChange]
  );

  // Handle clear
  const handleClear = React.useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      onChange(multiple ? [] : "");
    },
    [multiple, onChange]
  );

  // Loading state
  if (isLoading) {
    return <Skeleton className={cn("h-11 w-full", className)} />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          // TODO: Add aria-controls={popoverId} linking to PopoverContent id for screen readers
          aria-invalid={hasError || undefined}
          disabled={isDisabled}
          className={cn("h-11 w-full justify-between", hasError && "border-destructive", className)}
        >
          <span className={cn("truncate", !displayText && "text-muted-foreground")}>
            {displayText ?? placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {clearable && selectedValues.length > 0 && (
              <div
                role="button"
                aria-label="Clear selection"
                tabIndex={0}
                className="p-0.5 rounded-sm hover:bg-accent text-muted-foreground hover:text-foreground"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e);
                  }
                }}
              >
                <X className="size-4" />
              </div>
            )}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <Command filter={shouldUseClientFilter ? undefined : () => 1}>
          {searchable && (
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={handleSearchChange}
            />
          )}
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>
              {emptyAction ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 p-2 text-sm text-primary hover:bg-accent rounded-sm min-h-11"
                  onClick={() => emptyAction.onClick(search)}
                >
                  <PlusCircle className="size-4" />
                  {emptyAction.label.replace("{searchTerm}", search)}
                </button>
              ) : (
                <span className="text-muted-foreground">{emptyMessage}</span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => handleSelect(option.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      selectedValues.includes(option.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {itemRenderer ? itemRenderer(option) : option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {footer && (
            <>
              <CommandSeparator />
              <CommandGroup forceMount>{footer}</CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
