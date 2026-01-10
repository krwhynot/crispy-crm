import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form, ReferenceField } from "react-admin";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { DateField } from "@/components/admin/date-field";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidepaneSection,
  SidepaneMetadata,
  DirtyStateTracker,
} from "@/components/layouts/sidepane";
import { contactOptionText } from "../../contacts/ContactOption";
import {
  INTERACTION_TYPE_OPTIONS,
  ACTIVITY_TYPE_FROM_API,
  SAMPLE_STATUS_OPTIONS,
} from "../../validation/activities";
import type { ActivityRecord } from "../../types";

const ACTIVITY_TYPE_CHOICES = [
  { id: "engagement", name: "Engagement" },
  { id: "interaction", name: "Interaction" },
];

const SENTIMENT_CHOICES = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
];

const INTERACTION_TYPE_CHOICES = INTERACTION_TYPE_OPTIONS.map((option) => ({
  id: option.value,
  name: option.label,
}));

const SAMPLE_STATUS_CHOICES = SAMPLE_STATUS_OPTIONS.map((option) => ({
  id: option.value,
  name: option.label,
}));

interface ActivityDetailsTabProps {
  record: ActivityRecord;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  isActiveTab?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function ActivityDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: ActivityDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();

  const handleSave = async (data: Partial<ActivityRecord>) => {
    try {
      await update("activities", {
        id: record.id,
        data,
        previousData: record,
      });
      notify("Activity updated successfully", { type: "success" });
      onModeToggle?.();
    } catch (error: unknown) {
      notify("Error updating activity", { type: "error" });
      console.error(
        "Error updating activity:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  if (mode === "edit") {
    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <DirtyStateTracker onDirtyChange={onDirtyChange} />
          <div className="space-y-6" role="form" aria-label="Edit activity form">
            <div className="space-y-4">
              <SelectInput
                source="activity_type"
                label="Activity Type"
                choices={ACTIVITY_TYPE_CHOICES}
              />

              <SelectInput
                source="type"
                label="Interaction Type"
                choices={INTERACTION_TYPE_CHOICES}
              />

              <TextInput source="subject" label="Subject" />

              <TextInput source="activity_date" label="Activity Date" type="date" />

              <TextInput source="duration_minutes" label="Duration (minutes)" type="number" />

              <TextInput source="description" label="Description" multiline rows={4} />

              <SelectInput source="sentiment" label="Sentiment" choices={SENTIMENT_CHOICES} />

              <TextInput source="outcome" label="Outcome" />

              <TextInput source="location" label="Location" />

              <BooleanInput source="follow_up_required" label="Follow-up Required" />

              <TextInput source="follow_up_date" label="Follow-up Date" type="date" />

              <TextInput source="follow_up_notes" label="Follow-up Notes" multiline rows={3} />

              {record.type === "sample" && (
                <SelectInput
                  source="sample_status"
                  label="Sample Status"
                  choices={SAMPLE_STATUS_CHOICES}
                />
              )}

              <ReferenceInput source="opportunity_id" reference="opportunities">
                <AutocompleteInput label="Opportunity" optionText="name" />
              </ReferenceInput>

              <ReferenceInput source="contact_id" reference="contacts_summary">
                <AutocompleteInput label="Contact" optionText={contactOptionText} />
              </ReferenceInput>

              <ReferenceInput source="organization_id" reference="organizations">
                <AutocompleteInput label="Organization" optionText="name" />
              </ReferenceInput>
            </div>
          </div>
        </Form>
      </RecordContextProvider>
    );
  }

  const getSentimentVariant = (sentiment: string | undefined | null) => {
    switch (sentiment) {
      case "positive":
        return "default";
      case "negative":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatInteractionType = (type: string | undefined | null): string => {
    if (!type) return "Unknown";
    return ACTIVITY_TYPE_FROM_API[type] || type;
  };

  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4">
          <SidepaneSection label="Activity">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{record.subject || "Untitled Activity"}</h3>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{record.activity_type}</Badge>
                <Badge variant="secondary">{formatInteractionType(record.type)}</Badge>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Date: </span>
                <DateField
                  source="activity_date"
                  options={{ year: "numeric", month: "long", day: "numeric" }}
                  className="font-medium"
                />
              </div>

              {record.duration_minutes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Duration: </span>
                  <span className="font-medium">{record.duration_minutes} minutes</span>
                </div>
              )}

              {record.description && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground block mb-1">Description</span>
                  <p className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto bg-muted/30 rounded p-2">
                    {record.description}
                  </p>
                </div>
              )}
            </div>
          </SidepaneSection>

          {(record.sentiment || record.outcome || record.location) && (
            <SidepaneSection label="Details" showSeparator>
              <div className="space-y-2">
                {record.sentiment && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sentiment:</span>
                    <Badge variant={getSentimentVariant(record.sentiment)}>
                      {record.sentiment.charAt(0).toUpperCase() + record.sentiment.slice(1)}
                    </Badge>
                  </div>
                )}

                {record.outcome && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Outcome: </span>
                    <span>{record.outcome}</span>
                  </div>
                )}

                {record.location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Location: </span>
                    <span>{record.location}</span>
                  </div>
                )}
              </div>
            </SidepaneSection>
          )}

          {record.type === "sample" && record.sample_status && (
            <SidepaneSection label="Sample Tracking" showSeparator>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="outline">
                  {SAMPLE_STATUS_OPTIONS.find((o) => o.value === record.sample_status)?.label ||
                    record.sample_status}
                </Badge>
              </div>
            </SidepaneSection>
          )}

          {(record.follow_up_required || record.follow_up_date || record.follow_up_notes) && (
            <SidepaneSection label="Follow-up" showSeparator>
              <div className="space-y-2">
                {record.follow_up_required && (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    <span className="text-sm font-medium">Follow-up Required</span>
                  </div>
                )}

                {record.follow_up_date && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Follow-up Date: </span>
                    <DateField
                      source="follow_up_date"
                      options={{ year: "numeric", month: "long", day: "numeric" }}
                      className="font-medium"
                    />
                  </div>
                )}

                {record.follow_up_notes && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Follow-up Notes
                    </span>
                    <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded p-2">
                      {record.follow_up_notes}
                    </p>
                  </div>
                )}
              </div>
            </SidepaneSection>
          )}

          {(record.opportunity_id || record.contact_id || record.organization_id) && (
            <SidepaneSection label="Related Records" showSeparator>
              <div className="space-y-2">
                {record.opportunity_id && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Opportunity: </span>
                    <ReferenceField source="opportunity_id" reference="opportunities" link="show">
                      <span className="text-primary hover:underline cursor-pointer" />
                    </ReferenceField>
                  </div>
                )}

                {record.contact_id && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Contact: </span>
                    <ReferenceField source="contact_id" reference="contacts_summary" link="show">
                      <span className="text-primary hover:underline cursor-pointer" />
                    </ReferenceField>
                  </div>
                )}

                {record.organization_id && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Organization: </span>
                    <ReferenceField source="organization_id" reference="organizations" link="show">
                      <span className="text-primary hover:underline cursor-pointer" />
                    </ReferenceField>
                  </div>
                )}
              </div>
            </SidepaneSection>
          )}

          <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
