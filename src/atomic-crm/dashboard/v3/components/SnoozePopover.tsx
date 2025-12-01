import { useState, useCallback } from "react";
import { addDays, addWeeks, startOfDay, endOfDay, format } from "date-fns";
import { AlarmClock, Calendar as CalendarIcon, Loader2, Sun, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SnoozePopoverProps {
  /** Task subject for accessibility labels */
  taskSubject: string;
  /** Whether the snooze operation is in progress */
  isLoading?: boolean;
  /** Callback when a snooze date is selected */
  onSnooze: (newDate: Date) => Promise<void>;
  /** Optional: disable the trigger button */
  disabled?: boolean;
}

/**
 * SnoozePopover - A popover component for selecting task snooze dates
 *
 * Provides three snooze options:
 * - Tomorrow: End of the next day
 * - Next Week: End of 7 days from now
 * - Custom: Pick any future date via calendar
 *
 * Uses shadcn Popover + Calendar components per P7 constraint.
 * All touch targets are 44px minimum for WCAG AA compliance.
 */
export function SnoozePopover({
  taskSubject,
  isLoading = false,
  onSnooze,
  disabled = false,
}: SnoozePopoverProps) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addWeeks(today, 1);

  const handleQuickSnooze = useCallback(
    async (targetDate: Date) => {
      setIsSubmitting(true);
      try {
        // Use end of day for consistent behavior
        await onSnooze(endOfDay(targetDate));
        setOpen(false);
        setShowCalendar(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSnooze]
  );

  const handleCustomDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
  }, []);

  const handleCustomDateConfirm = useCallback(async () => {
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      await onSnooze(endOfDay(selectedDate));
      setOpen(false);
      setShowCalendar(false);
      setSelectedDate(undefined);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDate, onSnooze]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setShowCalendar(false);
      setSelectedDate(undefined);
    }
  }, []);

  const handleBackToOptions = useCallback(() => {
    setShowCalendar(false);
    setSelectedDate(undefined);
  }, []);

  const isDisabled = disabled || isLoading || isSubmitting;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 p-0"
          disabled={isDisabled}
          title="Snooze task"
          aria-label={`Snooze "${taskSubject}"`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          {isLoading || isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlarmClock className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        align="end"
        role="dialog"
        aria-label={`Snooze options for "${taskSubject}"`}
      >
        {!showCalendar ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Snooze until</h3>
              <p className="text-xs text-muted-foreground">Choose when to be reminded</p>
            </div>

            {/* Quick options */}
            <div className="p-2">
              {/* Tomorrow option */}
              <button
                type="button"
                onClick={() => handleQuickSnooze(tomorrow)}
                disabled={isSubmitting}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label={`Snooze until tomorrow, ${format(tomorrow, "EEEE, MMMM d")}`}
              >
                <Sun className="h-4 w-4 text-warning" />
                <div className="flex-1">
                  <span className="font-medium">Tomorrow</span>
                  <span className="ml-2 text-muted-foreground">
                    {format(tomorrow, "EEE, MMM d")}
                  </span>
                </div>
              </button>

              {/* Next Week option */}
              <button
                type="button"
                onClick={() => handleQuickSnooze(nextWeek)}
                disabled={isSubmitting}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label={`Snooze until next week, ${format(nextWeek, "EEEE, MMMM d")}`}
              >
                <CalendarDays className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <span className="font-medium">Next Week</span>
                  <span className="ml-2 text-muted-foreground">
                    {format(nextWeek, "EEE, MMM d")}
                  </span>
                </div>
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-border" />

              {/* Custom date option */}
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                disabled={isSubmitting}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label="Pick a custom date"
              >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Pick a date...</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Calendar header with back button */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={handleBackToOptions}
                aria-label="Back to snooze options"
              >
                <span aria-hidden="true">←</span>
              </Button>
              <div>
                <h3 className="text-sm font-semibold">Pick a date</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedDate
                    ? format(selectedDate, "EEEE, MMMM d, yyyy")
                    : "Select a future date"}
                </p>
              </div>
            </div>

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCustomDateSelect}
                disabled={(date) => date < today}
                initialFocus
                className="rounded-md"
              />
            </div>

            {/* Confirm button */}
            <div className="border-t border-border p-3">
              <Button
                onClick={handleCustomDateConfirm}
                disabled={!selectedDate || isSubmitting}
                className="w-full"
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Snoozing...
                  </>
                ) : (
                  <>
                    <AlarmClock className="mr-2 h-4 w-4" />
                    Snooze until {selectedDate ? format(selectedDate, "MMM d") : "selected date"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
