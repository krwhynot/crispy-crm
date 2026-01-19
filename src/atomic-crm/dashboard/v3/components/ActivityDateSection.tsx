import type { Control } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";

interface ActivityDateSectionProps {
  control: Control<ActivityLogInput>;
}

export function ActivityDateSection({ control }: ActivityDateSectionProps) {
  return (
    <FormField
      control={control}
      name="date"
      render={({ field }) => {
        // Ensure field.value is always a Date object (handles string from draft restore)
        const dateValue =
          field.value instanceof Date
            ? field.value
            : field.value
              ? new Date(field.value)
              : undefined;

        return (
          <FormItem className="flex flex-col">
            <FormLabel>Activity Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start text-left font-normal",
                      !dateValue && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue ? format(dateValue, "PPP") : <span>Select date</span>}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    // Ensure we always store a Date object
                    if (date) {
                      field.onChange(date);
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
