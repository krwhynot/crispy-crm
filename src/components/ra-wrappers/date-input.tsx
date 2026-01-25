import * as React from "react";
import { type InputProps, useInput, useResourceContext, FieldTitle } from "ra-core";
import { FormError, FormField, FormLabel, useFormField } from "@/components/ra-wrappers/form";
import { InputHelperText } from "@/components/ra-wrappers/input-helper-text";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

export type DateInputProps = InputProps & {
  /** Disable future dates (e.g., for activity logging) */
  disableFuture?: boolean;
  /** Disable past dates (e.g., for deadlines) */
  disablePast?: boolean;
  /** Custom date format for display (defaults to "PPP" - Jan 1, 2025) */
  dateFormat?: string;
  /** Placeholder text when no date selected */
  placeholder?: string;
  /** Custom className for the field wrapper */
  className?: string;
  /** Disable the entire input */
  disabled?: boolean;
  /** Make the input read-only (prevents opening calendar) */
  readOnly?: boolean;
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
    disabled = false,
    readOnly = false,
    validate: _validateProp,
    format: _formatProp,
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
      } catch (error: unknown) {
        logger.warn("Date parsing failed", {
          feature: "DateInput",
          invalidDate: val,
          error: error instanceof Error ? error.message : String(error),
        });
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

  const showClearButton = !isRequired && selectedDate != null && !disabled && !readOnly;

  return (
    <FormField id={id} className={cn(className, "w-full")} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle label={label} source={source} resource={resource} isRequired={isRequired} />
        </FormLabel>
      )}
      {/* FormControl wrapper for aria attributes - uses inner component to access form context */}
      <DateInputControl
        ref={ref}
        id={id}
        open={open}
        onOpenChange={handleOpenChange}
        selectedDate={selectedDate}
        dateFormat={dateFormat}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        showClearButton={showClearButton}
        onSelect={handleSelect}
        onClear={handleClear}
        onBlur={field.onBlur}
        isDateDisabled={isDateDisabled}
      />
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
});

DateInput.displayName = "DateInput";

/**
 * Inner component that has access to FormField context for aria attributes
 */
interface DateInputControlProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  dateFormat: string;
  placeholder: string;
  disabled: boolean;
  readOnly: boolean;
  showClearButton: boolean;
  onSelect: (date: Date | undefined) => void;
  onClear: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onBlur: () => void;
  isDateDisabled: (date: Date) => boolean;
}

const DateInputControl = React.forwardRef<HTMLButtonElement, DateInputControlProps>(
  (
    {
      id,
      open,
      onOpenChange,
      selectedDate,
      dateFormat,
      placeholder,
      disabled,
      readOnly,
      showClearButton,
      onSelect,
      onClear,
      onBlur,
      isDateDisabled,
    },
    ref
  ) => {
    // Access form field state for aria-invalid
    const { error, formDescriptionId, formMessageId } = useFormField();
    const hasError = !!error;

    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <div className="relative flex items-center">
          <PopoverTrigger asChild disabled={disabled || readOnly}>
            <Button
              ref={ref}
              data-slot="form-control"
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-readonly={readOnly || undefined}
              aria-invalid={hasError ? "true" : undefined}
              aria-describedby={
                hasError ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
              }
              className={cn(
                "h-11 w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
                showClearButton && "pr-10",
                disabled && "opacity-50 cursor-not-allowed",
                readOnly && "cursor-default"
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
              onClick={onClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClear(e);
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
            onSelect={onSelect}
            disabled={isDateDisabled}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DateInputControl.displayName = "DateInputControl";
