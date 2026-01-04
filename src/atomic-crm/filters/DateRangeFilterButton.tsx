/**
 * DateRangeFilterButton - Custom date range picker for list filters
 *
 * A button that opens a popover with date inputs to select a custom date range.
 * Integrates with React Admin's filter system via useListContext.
 *
 * @module filters/DateRangeFilterButton
 */

import { useState } from "react";
import { useListContext } from "react-admin";
import { format, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangeFilterButtonProps {
  /** Filter key prefix - e.g., "last_seen" will set "last_seen@gte" and "last_seen@lte" */
  filterKeyPrefix: string;
  /** Optional class name for the trigger button */
  className?: string;
}

/**
 * A filter button that opens a date range picker popover.
 * Shows "Select dates" when no range is active, or the formatted date range when active.
 */
export function DateRangeFilterButton({
  filterKeyPrefix,
  className,
}: DateRangeFilterButtonProps) {
  const { filterValues, setFilters, displayedFilters } = useListContext();
  const [open, setOpen] = useState(false);

  const gteKey = `${filterKeyPrefix}@gte`;
  const lteKey = `${filterKeyPrefix}@lte`;

  // Get current filter values
  const gteValue = filterValues[gteKey] as string | undefined;
  const lteValue = filterValues[lteKey] as string | undefined;

  // Parse dates for the calendar
  const fromDate = gteValue ? new Date(gteValue) : undefined;
  const toDate = lteValue ? new Date(lteValue) : undefined;

  // Local state for the picker (before Apply)
  const [selectedFrom, setSelectedFrom] = useState<Date | undefined>(fromDate);
  const [selectedTo, setSelectedTo] = useState<Date | undefined>(toDate);

  // Sync local state when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedFrom(fromDate);
      setSelectedTo(toDate);
    }
    setOpen(isOpen);
  };

  // Apply the selected date range
  const handleApply = () => {
    const newFilters = { ...filterValues };

    if (selectedFrom) {
      newFilters[gteKey] = startOfDay(selectedFrom).toISOString();
    } else {
      delete newFilters[gteKey];
    }

    if (selectedTo) {
      newFilters[lteKey] = endOfDay(selectedTo).toISOString();
    } else {
      delete newFilters[lteKey];
    }

    setFilters(newFilters, displayedFilters);
    setOpen(false);
  };

  // Clear the date range filter
  const handleClear = () => {
    const newFilters = { ...filterValues };
    delete newFilters[gteKey];
    delete newFilters[lteKey];
    setFilters(newFilters, displayedFilters);
    setSelectedFrom(undefined);
    setSelectedTo(undefined);
    setOpen(false);
  };

  // Check if a custom date range is active (not a preset)
  const hasCustomRange = fromDate || toDate;

  // Format the button label
  const getButtonLabel = () => {
    if (fromDate && toDate) {
      return `${format(fromDate, "MMM d")} – ${format(toDate, "MMM d")}`;
    }
    if (fromDate) {
      return `From ${format(fromDate, "MMM d")}`;
    }
    if (toDate) {
      return `Until ${format(toDate, "MMM d")}`;
    }
    return "Select dates";
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between h-11 px-3 font-normal",
            hasCustomRange && "bg-accent",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {getButtonLabel()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex flex-col gap-4">
          {/* From Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">From</label>
            <Calendar
              mode="single"
              selected={selectedFrom}
              onSelect={setSelectedFrom}
              disabled={(date) => (selectedTo ? date > selectedTo : false)}
              initialFocus
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">To</label>
            <Calendar
              mode="single"
              selected={selectedTo}
              onSelect={setSelectedTo}
              disabled={(date) => (selectedFrom ? date < selectedFrom : false)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="flex-1 h-10"
              onClick={handleApply}
              disabled={!selectedFrom && !selectedTo}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
