import * as React from "react";
import { format, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ControlledDatePickerProps {
  /** Current value (ISO date string, Date object, or null) */
  value: string | Date | null | undefined;
  /** Called when date changes (returns ISO date string "yyyy-MM-dd" or null) */
  onChange: (date: string | null) => void;
  /** Called on blur */
  onBlur?: () => void;
  /** Disable future dates (e.g., for activity logging) */
  disableFuture?: boolean;
  /** Disable past dates (e.g., for deadlines) */
  disablePast?: boolean;
  /** Custom date format for display (defaults to "PPP" - Jan 1, 2025) */
  dateFormat?: string;
  /** Placeholder text when no date selected */
  placeholder?: string;
  /** Custom className for the button */
  className?: string;
  /** Disable the entire input */
  disabled?: boolean;
  /** Make the input read-only (prevents opening calendar) */
  readOnly?: boolean;
  /** Show clear button for optional fields */
  clearable?: boolean;
  /** ID for the button element */
  id?: string;
  /** aria-invalid for accessibility */
  "aria-invalid"?: boolean;
  /** aria-describedby for accessibility */
  "aria-describedby"?: string;
}

/**
 * ControlledDatePicker - Controlled date picker for non-React-Admin forms
 *
 * This component is for use with react-hook-form Controller or any controlled form.
 * Unlike DateInput which uses React Admin's useInput, this component accepts
 * value/onChange props directly.
 *
 * Key Features:
 * - Timezone-safe: Uses format(date, "yyyy-MM-dd") NOT toISOString()
 * - Clear button: Optional X button for clearing dates
 * - Semantic colors: Uses text-muted-foreground, NOT hardcoded colors
 *
 * @example
 * // With react-hook-form Controller
 * <Controller
 *   name="next_action_date"
 *   control={control}
 *   render={({ field }) => (
 *     <ControlledDatePicker
 *       value={field.value}
 *       onChange={field.onChange}
 *       onBlur={field.onBlur}
 *       clearable
 *     />
 *   )}
 * />
 */
export const ControlledDatePicker = React.forwardRef<HTMLButtonElement, ControlledDatePickerProps>(
  (
    {
      value,
      onChange,
      onBlur,
      disableFuture = false,
      disablePast = false,
      dateFormat = "PPP",
      placeholder = "Pick a date",
      className,
      disabled = false,
      readOnly = false,
      clearable = false,
      id,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    /**
     * Parse value to Date object
     * Handles both string values ("2025-01-14") and Date objects
     */
    const parseValue = (val: string | Date | null | undefined): Date | undefined => {
      if (val == null || val === "") return undefined;
      if (val instanceof Date) return val;
      if (typeof val === "string") {
        try {
          return parseISO(val);
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const selectedDate = parseValue(value);

    /**
     * Handle date selection from Calendar
     * CRITICAL: Use format(date, "yyyy-MM-dd") NOT toISOString()
     * This prevents timezone shift bug where Tokyo user selecting Jan 1 saves as Dec 31
     */
    const handleSelect = (date: Date | undefined) => {
      if (date) {
        const dateString = format(date, "yyyy-MM-dd");
        onChange(dateString);
      }
      setOpen(false);
    };

    /**
     * Handle clear button click
     */
    const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onChange(null);
    };

    /**
     * Calendar disabled callback
     * Filters dates based on disableFuture and disablePast props
     */
    const isDateDisabled = (date: Date): boolean => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (disableFuture && date > today) return true;
      if (disablePast && date < today) return true;
      return false;
    };

    /**
     * Handle popover open/close - respects readOnly and disabled states
     */
    const handleOpenChange = (newOpen: boolean) => {
      if (readOnly || disabled) {
        setOpen(false);
        return;
      }
      setOpen(newOpen);
    };

    const showClearButton = clearable && selectedDate != null && !disabled && !readOnly;

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <div className="relative flex items-center">
          <PopoverTrigger asChild disabled={disabled || readOnly}>
            <Button
              ref={ref}
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-readonly={readOnly || undefined}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              className={cn(
                "h-11 w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
                showClearButton && "pr-10",
                disabled && "opacity-50 cursor-not-allowed",
                readOnly && "cursor-default",
                className
              )}
              onBlur={onBlur}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, dateFormat) : placeholder}
            </Button>
          </PopoverTrigger>
          {showClearButton && (
            <button
              type="button"
              aria-label="Clear date"
              className="absolute right-3 p-1 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e);
                }
              }}
              tabIndex={0}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);

ControlledDatePicker.displayName = "ControlledDatePicker";
