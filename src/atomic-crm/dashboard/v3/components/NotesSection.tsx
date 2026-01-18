import type { Control } from "react-hook-form";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface NotesSectionProps {
  control: Control<ActivityLogInput>;
}

/**
 * Notes section for activity logging
 *
 * Provides a textarea for capturing activity notes/summaries with proper
 * accessibility attributes (aria-invalid, aria-describedby, role="alert").
 */
export function NotesSection({ control }: NotesSectionProps) {
  return (
    <FormField
      control={control}
      name="notes"
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Summary of the interaction..."
              className="min-h-24"
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? "notes-error" : undefined}
              {...field}
            />
          </FormControl>
          <FormMessage id="notes-error" role="alert" />
        </FormItem>
      )}
    />
  );
}
