import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateBase, Form, useInput } from "ra-core";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { FormToolbar } from "@/components/admin/simple-form";
import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { contactOptionText } from "../misc/ContactOption";
import { INTERACTION_TYPE_OPTIONS, activitiesSchema } from "../validation/activities";

const sentimentChoices = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
];

const HiddenActivityTypeField = () => {
  const { field } = useInput({
    source: "activity_type",
    defaultValue: "interaction",
  });

  return <input type="hidden" {...field} value={field.value ?? "interaction"} />;
};

export default function ActivityCreate() {
  // Get defaults from Zod schema (single source of truth per Engineering Constitution #4)
  const defaultValues = useMemo(
    () => activitiesSchema.partial().parse({}),
    []
  );

  return (
    <CreateBase redirect="list">
      <div className="mt-2 flex justify-center">
        <div className="w-full max-w-5xl">
          <Form defaultValues={defaultValues}>
            <Card>
              <CardContent className="space-y-6 p-6">
                <HiddenActivityTypeField />

                <TabbedFormInputs
                  defaultTab="details"
                  tabs={[
                    {
                      key: "details",
                      label: "Details",
                      fields: ["type", "subject", "activity_date", "duration_minutes", "description"],
                      content: (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>
                      ),
                    },
                    {
                      key: "relationships",
                      label: "Relationships",
                      fields: ["opportunity_id", "contact_id", "organization_id"],
                      content: (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>
                      ),
                    },
                    {
                      key: "followup",
                      label: "Follow-up & Context",
                      fields: [
                        "follow_up_required",
                        "sentiment",
                        "follow_up_date",
                        "follow_up_notes",
                        "location",
                        "outcome",
                      ],
                      content: (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput source="follow_up_date" label="Follow-up Date" type="date" />
                            <TextInput
                              source="follow_up_notes"
                              label="Follow-up Notes"
                              multiline
                              rows={3}
                              helperText="Optional next steps summary"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput
                              source="location"
                              label="Location"
                              helperText="Where did this occur?"
                            />
                            <TextInput
                              source="outcome"
                              label="Outcome"
                              helperText="Optional result summary"
                            />
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />

                <FormToolbar />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
}
