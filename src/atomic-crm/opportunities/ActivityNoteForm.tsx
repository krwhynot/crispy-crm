import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type Control } from "react-hook-form";
import { useDataProvider, useNotify, useGetList } from "ra-core";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipelineConfig } from "../root/ConfigurationContext";
import {
  activityNoteFormSchema,
  activitiesSchema,
  INTERACTION_TYPE_OPTIONS,
  type ActivityNoteFormData,
} from "../validation/activities";
import type { Opportunity, Contact } from "../types";

interface ActivityNoteFormProps {
  opportunity: Opportunity;
  onSuccess?: () => void;
}

// Contact Select Field Component
const ContactSelectField = ({
  control,
  organizationId,
  error,
}: {
  control: Control<ActivityNoteFormData>;
  organizationId: number | string;
  error?: string;
}) => {
  const { data: contacts, isPending } = useGetList<Contact>("contacts_summary", {
    filter: { organization_id: organizationId },
    pagination: { page: 1, perPage: 100 },
  });

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="contact_id" className="text-sm font-medium">
        Contact
      </label>
      <Controller
        name="contact_id"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value?.toString() || "none"}
            onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
            disabled={isPending}
          >
            <SelectTrigger id="contact_id">
              <SelectValue placeholder={isPending ? "Loading..." : "Select contact (optional)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {contacts?.map((contact) => (
                <SelectItem key={contact.id} value={contact.id.toString()}>
                  {contact.first_name} {contact.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export const ActivityNoteForm = ({ opportunity, onSuccess }: ActivityNoteFormProps) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const { opportunityStages } = usePipelineConfig();

  // Extract form defaults from schema per Constitution #5
  // activitiesSchema provides defaults for activity_date and type
  const schemaDefaults = activitiesSchema.partial().parse({});

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityNoteFormData>({
    resolver: zodResolver(activityNoteFormSchema),
    defaultValues: {
      // Convert ISO date string from schema to Date object for activityNoteFormSchema
      activity_date: new Date(schemaDefaults.activity_date!),
      type: schemaDefaults.type!, // Schema default: "call"
      contact_id: null, // Optional field, no default in schema
      stage: opportunity.stage, // Derived from opportunity, not schema
      subject: "", // Required field, intentionally empty for user input
    },
  });

  const handleStageChange = async (newStage: string) => {
    try {
      await dataProvider.update("opportunities", {
        id: opportunity.id,
        data: { stage: newStage },
        previousData: opportunity,
      });
      setValue("stage", newStage);
      notify("Stage updated successfully", { type: "success" });
    } catch (error) {
      console.error('Stage update failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      notify(`Error updating stage: ${message}`, { type: "error" });
    }
  };

  const onSubmit = async (data: ActivityNoteFormData) => {
    try {
      await dataProvider.create("activities", {
        data: {
          activity_type: "interaction",
          type: data.type,
          subject: data.subject,
          activity_date: data.activity_date.toISOString(),
          contact_id: data.contact_id,
          opportunity_id: opportunity.id,
          organization_id: opportunity.customer_organization_id,
        },
      });

      notify("Activity created successfully", { type: "success" });
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Activity creation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      notify(`Error creating activity: ${message}`, { type: "error" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Grid layout for date, type, contact, and stage - responsive for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Date Picker */}
        <div className="flex flex-col gap-2">
          <label htmlFor="activity_date" className="text-sm font-medium">
            Date
          </label>
          <Controller
            name="activity_date"
            control={control}
            render={({ field }) => (
              <Input
                id="activity_date"
                type="date"
                value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : new Date();
                  field.onChange(date);
                }}
              />
            )}
          />
          {errors.activity_date && (
            <p className="text-sm text-destructive">{errors.activity_date.message}</p>
          )}
        </div>

        {/* Interaction Type Select */}
        <div className="flex flex-col gap-2">
          <label htmlFor="type" className="text-sm font-medium">
            Type
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
        </div>

        {/* Contact Select */}
        <ContactSelectField
          control={control}
          organizationId={opportunity.customer_organization_id}
          error={errors.contact_id?.message}
        />

        {/* Stage Select */}
        <div className="flex flex-col gap-2">
          <label htmlFor="stage" className="text-sm font-medium">
            Stage
          </label>
          <Controller
            name="stage"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleStageChange(value);
                }}
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {opportunityStages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Changing stage will update the opportunity immediately
          </p>
          {errors.stage && <p className="text-sm text-destructive">{errors.stage.message}</p>}
        </div>
      </div>

      {/* Subject Textarea */}
      <div className="flex flex-col gap-2">
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="subject"
              placeholder="Enter activity subject..."
              className="min-h-12"
            />
          )}
        />
        {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? "Creating..." : "Add Activity"}
        </Button>
      </div>
    </div>
  );
};
