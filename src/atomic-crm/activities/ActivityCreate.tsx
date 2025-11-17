import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateBase, Form } from "ra-core";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { FormToolbar } from "@/components/admin/simple-form";
import { contactOptionText } from "../misc/ContactOption";
import { INTERACTION_TYPE_OPTIONS, activitiesSchema } from "../validation/activities";

const activityTypeChoices = [
  { id: "interaction", name: "Interaction" },
  { id: "engagement", name: "Engagement" },
];

const sentimentChoices = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
];

const defaultRecordFactory = () => ({
  activity_type: "interaction",
  type: INTERACTION_TYPE_OPTIONS[0]?.value ?? "call",
  activity_date: new Date().toISOString().split("T")[0],
  follow_up_required: false,
});

export default function ActivityCreate() {
  const defaultValues = useMemo(defaultRecordFactory, []);

  return (
    <CreateBase redirect="list">
      <div className="mt-2">
        <Form defaultValues={defaultValues}>
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput
                  source="activity_type"
                  label="Activity Type"
                  choices={activityTypeChoices}
                  helperText="Interactions must reference an opportunity"
                  isRequired
                />
                <SelectInput
                  source="type"
                  label="Interaction Type"
                  choices={INTERACTION_TYPE_OPTIONS.map((option) => ({
                    id: option.value,
                    name: option.label,
                  }))}
                  helperText="Choose how this interaction occurred"
                  isRequired
                />
              </div>

              <TextInput
                source="subject"
                label="Subject"
                isRequired
                helperText="Summarize the outcome or topic"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput source="activity_date" label="Date" type="date" isRequired />
                <TextInput
                  source="duration_minutes"
                  label="Duration (minutes)"
                  type="number"
                  helperText="Optional length of the activity"
                />
              </div>

              <TextInput
                source="description"
                label="Notes"
                multiline
                rows={4}
                helperText="Optional narrative for this interaction"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReferenceInput source="opportunity_id" reference="opportunities">
                  <AutocompleteInput
                    label="Opportunity"
                    optionText="name"
                    helperText="Required for interaction activities"
                    placeholder="Search opportunities"
                  />
                </ReferenceInput>
                <ReferenceInput source="contact_id" reference="contacts_summary">
                  <AutocompleteInput
                    label="Contact"
                    optionText={contactOptionText}
                    helperText="Optional contact involved"
                    placeholder="Search contacts"
                  />
                </ReferenceInput>
              </div>

              <ReferenceInput source="organization_id" reference="organizations">
                <AutocompleteInput
                  label="Organization"
                  optionText="name"
                  helperText="Optional organization context"
                  placeholder="Search organizations"
                />
              </ReferenceInput>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BooleanInput
                  source="follow_up_required"
                  label="Require follow-up"
                  helperText="Expose the follow-up fields below"
                />
                <SelectInput
                  source="sentiment"
                  label="Sentiment"
                  choices={sentimentChoices}
                  helperText="How did the contact respond?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput source="follow_up_date" label="Follow-up Date" type="date" />
                <TextInput
                  source="follow_up_notes"
                  label="Follow-up Notes"
                  multiline
                  rows={3}
                  helperText="Optional next steps summary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput source="location" label="Location" helperText="Where did this occur?" />
                <TextInput source="outcome" label="Outcome" helperText="Optional result summary" />
              </div>

              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </div>
    </CreateBase>
  );
}
