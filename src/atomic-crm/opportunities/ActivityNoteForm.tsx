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
import { useConfigurationContext } from "../root/ConfigurationContext";
import {
  activityNoteFormSchema,
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
      <label htmlFor="contact_id" className="text-sm font-medium">Contact</label>
      <Controller
        name="contact_id"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value?.toString() || ""}
            onValueChange={(value) => field.onChange(value ? Number(value) : null)}
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
      {error && (
        <p className="text-sm text-[color:var(--destructive)]">{error}</p>
      )}
    </div>
  );
};

export const ActivityNoteForm = ({
  opportunity,
  onSuccess,
}: ActivityNoteFormProps) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const { opportunityStages } = useConfigurationContext();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityNoteFormData>({
    resolver: zodResolver(activityNoteFormSchema),
    defaultValues: {
      activity_date: new Date(),
      type: "email",
      contact_id: null,
      stage: opportunity.stage,
      subject: "",
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
      notify("Error updating stage", { type: "error" });
      console.error("Stage update error:", error);
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
      notify("Error creating activity", { type: "error" });
      console.error("Activity creation error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Grid layout for date, type, contact, and stage */}
      <div className="grid grid-cols-4 gap-4">
        {/* Date Picker */}
        <div className="flex flex-col gap-2">
          <label htmlFor="activity_date" className="text-sm font-medium">Date</label>
          <Controller
            name="activity_date"
            control={control}
            render={({ field }) => (
              <Input
                id="activity_date"
                type="date"
                value={
                  field.value instanceof Date
                    ? field.value.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : new Date();
                  field.onChange(date);
                }}
              />
            )}
          />
          {errors.activity_date && (
            <p className="text-sm text-[color:var(--destructive)]">
              {errors.activity_date.message}
            </p>
          )}
        </div>

        {/* Interaction Type Select */}
        <div className="flex flex-col gap-2">
          <label htmlFor="type" className="text-sm font-medium">Type</label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
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
          {errors.type && (
            <p className="text-sm text-[color:var(--destructive)]">
              {errors.type.message}
            </p>
          )}
        </div>

        {/* Contact Select */}
        <ContactSelectField
          control={control}
          organizationId={opportunity.customer_organization_id}
          error={errors.contact_id?.message}
        />

        {/* Stage Select */}
        <div className="flex flex-col gap-2">
          <label htmlFor="stage" className="text-sm font-medium">Stage</label>
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
          {errors.stage && (
            <p className="text-sm text-[color:var(--destructive)]">
              {errors.stage.message}
            </p>
          )}
        </div>
      </div>

      {/* Subject Textarea */}
      <div className="flex flex-col gap-2">
        <label htmlFor="subject" className="text-sm font-medium">Subject</label>
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="subject"
              placeholder="Enter activity subject..."
              className="min-h-24"
            />
          )}
        />
        {errors.subject && (
          <p className="text-sm text-[color:var(--destructive)]">
            {errors.subject.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90"
        >
          {isSubmitting ? "Creating..." : "Add Activity"}
        </Button>
      </div>
    </form>
  );
};
