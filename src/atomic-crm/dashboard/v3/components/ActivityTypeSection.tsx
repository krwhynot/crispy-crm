import type { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";
import { ACTIVITY_TYPE_GROUPS, SAMPLE_STATUS_OPTIONS } from "@/atomic-crm/validation/activities";
import { SidepaneSection } from "@/components/layouts/sidepane";

// Activity types that should show duration field
const DURATION_ACTIVITY_TYPES = ["Call", "Meeting", "Demo", "Site Visit", "Trade Show"];

interface ActivityTypeSectionProps {
  control: Control<ActivityLogInput>;
  activityType: string;
}

/**
 * Activity type selection section with conditional fields
 *
 * Includes:
 * - Activity type dropdown (grouped by Communication/Meetings/Documentation)
 * - Outcome dropdown
 * - Duration input (shown for time-based activities)
 * - Sample status dropdown (shown for Sample activity type)
 */
export function ActivityTypeSection({ control, activityType }: ActivityTypeSectionProps) {
  const showDuration = DURATION_ACTIVITY_TYPES.includes(activityType);
  const showSampleStatus = activityType === "Sample";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">What happened?</h3>

      <FormField
        control={control}
        name="activityType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Activity Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {/* Group 1: Communication (4 items) */}
                <SelectGroup>
                  <SelectLabel>Communication</SelectLabel>
                  {ACTIVITY_TYPE_GROUPS.Communication.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>

                <SelectSeparator />

                {/* Group 2: Meetings (4 items) */}
                <SelectGroup>
                  <SelectLabel>Meetings</SelectLabel>
                  {ACTIVITY_TYPE_GROUPS.Meetings.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>

                <SelectSeparator />

                {/* Group 3: Documentation (5 items) */}
                <SelectGroup>
                  <SelectLabel>Documentation</SelectLabel>
                  {ACTIVITY_TYPE_GROUPS.Documentation.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="outcome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Outcome</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Connected">Connected</SelectItem>
                <SelectItem value="Left Voicemail">Left Voicemail</SelectItem>
                <SelectItem value="No Answer">No Answer</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {showDuration && (
        <FormField
          control={control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="30"
                  className="h-11"
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Sample Status dropdown - shown only when activity type is "Sample" (PRD §4.4) */}
      {showSampleStatus && (
        <FormField
          control={control}
          name="sampleStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sample Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select sample status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SAMPLE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Track sample workflow: Sent → Received → Feedback Pending → Feedback Received
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
