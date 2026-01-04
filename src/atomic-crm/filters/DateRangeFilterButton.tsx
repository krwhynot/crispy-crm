/**
 * DateRangeFilterButton - Custom date range picker for list filters
 *
 * A button that opens a popover with date inputs to select a custom date range.
 * Integrates with React Admin's filter system via useListContext.
 *
 * Uses compact date inputs instead of full calendars to fit within sidebar constraints.
 *
 * @module filters/DateRangeFilterButton
 */

import { useState } from "react";
import { useListContext } from "react-admin";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangeFilterButtonProps {
  /** Filter key prefix - e.g., "last_seen" will set "last_seen@gte" and "last_seen@lte" */
  filterKeyPrefix: string;
  /** Optional class name for the trigger button */
  className?: string;
}

/**
 * Format Date to YYYY-MM-DD for input[type="date"]
 */
function toInputDate(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

/**
 * Parse YYYY-MM-DD string to Date
 */
function fromInputDate(value: string): Date | undefined {
  if (!value) return undefined;
  return parseISO(value);
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

  // Parse dates for display
  const fromDate = gteValue ? new Date(gteValue) : undefined;
  const toDate = lteValue ? new Date(lteValue) : undefined;

  // Local state for the picker (before Apply)
  const [selectedFrom, setSelectedFrom] = useState<string>(toInputDate(fromDate));
  const [selectedTo, setSelectedTo] = useState<string>(toInputDate(toDate));

  // Sync local state when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedFrom(toInputDate(fromDate));
      setSelectedTo(toInputDate(toDate));
    }
    setOpen(isOpen);
  };

  // Apply the selected date range
  const handleApply = () => {
    const newFilters = { ...filterValues };
    const fromParsed = fromInputDate(selectedFrom);
    const toParsed = fromInputDate(selectedTo);

    if (fromParsed) {
      newFilters[gteKey] = startOfDay(fromParsed).toISOString();
    } else {
      delete newFilters[gteKey];
    }

    if (toParsed) {
      newFilters[lteKey] = endOfDay(toParsed).toISOString();
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
    setSelectedFrom("");
    setSelectedTo("");
    setOpen(false);
  };

  // Check if a custom date range is active
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

  // Check if Apply should be enabled
  const canApply = selectedFrom || selectedTo;

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
      <PopoverContent className="w-72 p-4" align="start">
        <div className="flex flex-col gap-4">
          {/* From Date Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="from-date" className="text-sm font-medium">
              From
            </Label>
            <Input
              id="from-date"
              type="date"
              value={selectedFrom}
              onChange={(e) => setSelectedFrom(e.target.value)}
              max={selectedTo || undefined}
              className="h-11"
            />
          </div>

          {/* To Date Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="to-date" className="text-sm font-medium">
              To
            </Label>
            <Input
              id="to-date"
              type="date"
              value={selectedTo}
              onChange={(e) => setSelectedTo(e.target.value)}
              min={selectedFrom || undefined}
              className="h-11"
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
              disabled={!canApply}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
