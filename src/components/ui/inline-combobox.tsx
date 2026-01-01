"use client";

import * as React from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface InlineComboboxProps {
  /** Current value */
  value: string;

  /** Available options */
  options: ComboboxOption[];

  /** Called when value is committed (blur, Enter, Tab, or option select) */
  onCommit: (value: string) => void;

  /** Placeholder when empty */
  placeholder?: string;

  /** Additional className for the input */
  className?: string;

  /** Disable the combobox */
  disabled?: boolean;

  /** Allow free-form text (not just options) */
  allowCustomValue?: boolean;

  /** Auto-select first match while typing */
  autoHighlight?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function InlineCombobox({
  value: externalValue,
  options,
  onCommit,
  placeholder = "Select...",
  className,
  disabled = false,
  allowCustomValue = true,
  autoHighlight = true,
}: InlineComboboxProps) {
  // ===========================================
  // STATE
  // ===========================================
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(externalValue);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const originalValueRef = React.useRef(externalValue);

  // ===========================================
  // FILTERED OPTIONS
  // Case-insensitive filtering using Intl.Collator (P13)
  // ===========================================
  const collator = React.useMemo(() => new Intl.Collator("en", { sensitivity: "base" }), []);

  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return options;

    const inputLower = inputValue.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(inputLower));
  }, [options, inputValue]);

  // Reset highlight when filtered options change
  React.useEffect(() => {
    if (autoHighlight && filteredOptions.length > 0 && open) {
      setHighlightedIndex(0);
    } else if (filteredOptions.length === 0) {
      setHighlightedIndex(-1);
    }
  }, [filteredOptions.length, autoHighlight, open]);

  // Sync with external value changes
  React.useEffect(() => {
    setInputValue(externalValue);
    originalValueRef.current = externalValue;
  }, [externalValue]);

  // ===========================================
  // HANDLERS
  // ===========================================

  const commitValue = React.useCallback(
    (val: string) => {
      // If not allowing custom values, validate against options
      if (!allowCustomValue) {
        const matchedOption = options.find((opt) => collator.compare(opt.label, val) === 0);
        if (matchedOption) {
          onCommit(matchedOption.value);
          originalValueRef.current = matchedOption.label;
        }
        // Invalid value - don't commit, restore original
        return;
      }

      // Check if typed value matches an option label (case-insensitive)
      const matchedOption = options.find((opt) => collator.compare(opt.label, val) === 0);

      if (matchedOption) {
        onCommit(matchedOption.value);
        originalValueRef.current = matchedOption.label;
      } else {
        onCommit(val);
        originalValueRef.current = val;
      }
    },
    [options, onCommit, allowCustomValue, collator]
  );

  const selectOption = React.useCallback(
    (option: ComboboxOption) => {
      setInputValue(option.label);
      onCommit(option.value);
      originalValueRef.current = option.label;
      setOpen(false);
      // Keep focus on input after selection
      inputRef.current?.focus();
    },
    [onCommit]
  );

  // ===========================================
  // KEYBOARD TRAP HANDLING
  // ===========================================
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        // TRAP: Prevent cursor moving to end of input
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        }
        break;

      case "ArrowUp":
        // TRAP: Prevent cursor moving to start of input
        e.preventDefault();
        if (open) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        break;

      case "Enter":
        // TRAP: Prevent form submission
        e.preventDefault();
        if (open && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          // Select highlighted option
          selectOption(filteredOptions[highlightedIndex]);
        } else {
          // Commit typed value
          commitValue(inputValue);
          setOpen(false);
        }
        break;

      case "Escape":
        e.preventDefault();
        // Restore original value (cancel edit)
        setInputValue(originalValueRef.current);
        setOpen(false);
        break;

      case "Tab":
        // Allow natural tab behavior, but commit first
        commitValue(inputValue);
        setOpen(false);
        // Don't preventDefault - let focus move naturally
        break;

      case "Home":
      case "End":
        // Allow cursor navigation within input
        // Don't interfere with these keys
        break;
    }
  };

  const handleFocus = () => {
    // Excel-like: select all text on focus
    inputRef.current?.select();
    // Store original for Escape cancellation
    originalValueRef.current = inputValue;
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't commit if clicking inside dropdown
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('[data-slot="combobox-content"]')) {
      return;
    }

    commitValue(inputValue);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Open dropdown on type
    if (!open) {
      setOpen(true);
    }
  };

  // ===========================================
  // DISABLED STATE
  // ===========================================
  if (disabled) {
    return (
      <span
        className={cn(
          "block w-full px-2 py-1.5",
          "text-[0.8125rem] leading-[1.35]",
          "text-muted-foreground",
          className
        )}
      >
        {externalValue || placeholder}
      </span>
    );
  }

  // ===========================================
  // RENDER
  // ===========================================
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          data-slot="inline-combobox"
          className={cn(
            // ===========================================
            // BASE STYLES (inline, no CSS utility deps)
            // ===========================================
            "w-full h-full",
            "px-2 py-1.5",
            "text-[0.8125rem] leading-[1.35]", // 13px table typography
            "bg-transparent",
            "outline-none",

            // ===========================================
            // HYBRID BORDER WITH TOUCH AFFORDANCE (inline)
            // Desktop: subtle border, intensifies on hover/focus
            // Touch: always visible (no hover available)
            // ===========================================
            "border rounded-sm",
            "transition-[border-color,background-color] duration-75",

            // Desktop: subtle 40% opacity border
            "border-border/40",
            "hover:border-border hover:bg-accent/10",

            // Focus: prominent border + ring
            "focus:border-primary focus:ring-1 focus:ring-primary/30",
            "focus:bg-background",

            // Touch devices: always show full border (no hover)
            "[@media(hover:none)]:border-border",
            "[@media(hover:none)]:bg-muted/20",

            // ===========================================
            // STATES
            // ===========================================
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",

            // Cursor always text (not button pointer)
            "cursor-text",
            "caret-primary",

            className
          )}
        />
      </PopoverAnchor>

      <PopoverContent
        data-slot="combobox-content"
        className={cn(
          "w-[--radix-popover-trigger-width] p-0",
          "shadow-md border border-border",
          "bg-popover"
        )}
        align="start"
        sideOffset={4}
        // CRITICAL: Keep input focused when dropdown opens
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-[200px] overflow-auto">
            {filteredOptions.length === 0 ? (
              <CommandEmpty className="py-2 px-3 text-sm text-muted-foreground">
                {allowCustomValue
                  ? "No matches. Press Enter to use typed value."
                  : "No matches found."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option, index) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    data-slot="command-item"
                    data-highlighted={index === highlightedIndex}
                    // CRITICAL: Prevent blur when clicking option
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => selectOption(option)}
                    className={cn(
                      "px-2 py-1.5 text-sm cursor-pointer",
                      "transition-colors duration-75",
                      // Highlight state (keyboard navigation)
                      index === highlightedIndex && "bg-accent",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="flex-1">{option.label}</span>
                    {option.value === externalValue && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
