import * as React from "react";
import { type InputProps, useInput, useResourceContext, FieldTitle } from "ra-core";
import { FormControl, FormError, FormField, FormLabel } from "@/components/admin/form";
import { InputHelperText } from "@/components/admin/input-helper-text";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export type DateInputProps = InputProps & {
  disableFuture?: boolean;
  disablePast?: boolean;
  dateFormat?: string;
  placeholder?: string;
};

/**
 * DateInput - React Admin date picker component with shadcn/ui Calendar
 *
 * Key Features:
 * - Timezone-safe: Uses format(date, "yyyy-MM-dd") NOT toISOString() to prevent timezone shift
 * - Clear button: X button for optional fields (hidden when isRequired=true)
 * - Focus-on-error: React.forwardRef for WCAG AA auto-focus on validation errors
 * - Semantic colors: Uses text-muted-foreground, NOT hardcoded colors
 *
 * @example
 * <DateInput source="due_date" label="Due Date" />
 * <DateInput source="start_date" disablePast />
 * <DateInput source="end_date" disableFuture />
 */
export const DateInput = React.forwardRef<HTMLButtonElement, DateInputProps>((props, ref) => {
  const resource = useResourceContext(props);
  const {
    label,
    source,
    className,
    helperText,
    disableFuture = false,
    disablePast = false,
    dateFormat = "PPP",
    placeholder = "Pick a date",
    validate: _validateProp,
    format: _formatProp,
    ...rest
  } = props;

  const { id, field, isRequired } = useInput(props);
  const [open, setOpen] = React.useState(false);

  /**
   * Parse field.value to Date object
   * Handles both string values (from DB "2025-01-14") and Date objects (from Zod coerce.date())
   */
  const parseValue = (val: unknown): Date | undefined => {
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

  const selectedDate = parseValue(field.value);

  /**
   * Handle date selection from Calendar
   * CRITICAL: Use format(date, "yyyy-MM-dd") NOT toISOString()
   * This prevents timezone shift bug where Tokyo user selecting Jan 1 saves as Dec 31
   */
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, "yyyy-MM-dd");
      field.onChange(dateString);
    }
    setOpen(false);
  };

  /**
   * Handle clear button click
   * Sets field value to null for optional fields
   */
  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    field.onChange(null);
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

  const showClearButton = !isRequired && selectedDate != null;

  return (
    <FormField id={id} className={cn(className, "w-full")} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle label={label} source={source} resource={resource} isRequired={isRequired} />
        </FormLabel>
      )}
      <FormControl>
        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative flex items-center">
            <PopoverTrigger asChild>
              <Button
                ref={ref}
                type="button"
                variant="outline"
                className={cn(
                  "h-11 w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                  showClearButton && "pr-10"
                )}
                onBlur={field.onBlur}
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
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
});

DateInput.displayName = "DateInput";
