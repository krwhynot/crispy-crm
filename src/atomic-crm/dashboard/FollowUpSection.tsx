import type { Control } from "react-hook-form";
import { startOfDay } from "date-fns";
import { format } from "date-fns";
import { AdminButton } from "@/components/admin/AdminButton";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";

interface FollowUpSectionProps {
  control: Control<ActivityLogInput>;
  showFollowUpDate: boolean;
}

/**
 * Follow-up task creation section
 *
 * Contains toggle switch and conditional date picker for scheduling follow-up tasks.
 */
export function FollowUpSection({ control, showFollowUpDate }: FollowUpSectionProps) {
  return (
    <div className="space-y-3">
      <FormField
        control={control}
        name="createFollowUp"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between space-y-0">
            <FormLabel className="text-sm font-medium">Create follow-up task?</FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {showFollowUpDate && (
        <FormField
          control={control}
          name="followUpDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Follow-up Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <AdminButton
                      variant="outline"
                      className={cn(
                        "h-11 w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </AdminButton>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
