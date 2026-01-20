import { useWatch } from "react-hook-form";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { DateInput } from "@/components/ra-wrappers/date-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { BooleanInput } from "@/components/ra-wrappers/boolean-input";
import { RadioButtonGroupInput } from "@/components/ra-wrappers/radio-button-group-input";
import { FormGrid, FormSectionWithProgress, FormFieldWrapper } from "@/components/ra-wrappers/form";
import { contactOptionText } from "../contacts/ContactOption";
import { INTERACTION_TYPE_OPTIONS, SAMPLE_STATUS_OPTIONS } from "../validation/activities";
import { getAutocompleteProps, getQSearchAutocompleteProps } from "../utils/autocompleteDefaults";

// Convert to React Admin choice format
const SAMPLE_STATUS_CHOICES = SAMPLE_STATUS_OPTIONS.map((option) => ({
  id: option.value,
  name: option.label,
}));

const sentimentChoices = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
];

// Activity type choices (engagement vs interaction)
const ACTIVITY_TYPE_CHOICES = [
  { id: "engagement", name: "Engagement (standalone)" },
  { id: "interaction", name: "Interaction (linked to opportunity)" },
];

export default function ActivitySinglePage() {
  // Watch the type field to conditionally show sample-specific fields
  const interactionType = useWatch({ name: "type" });
  const isSampleActivity = interactionType === "sample";

  // Watch activity_type to conditionally show/require opportunity field
  const activityType = useWatch({ name: "activity_type" });
  const isInteraction = activityType === "interaction";

  return (
    <div className="space-y-6">
      <FormSectionWithProgress
        id="activity-details"
        title="Activity Details"
        requiredFields={["activity_type", "type", "subject", "activity_date"]}
      >
        {/* Activity Type selector - engagement vs interaction */}
        <FormFieldWrapper name="activity_type" isRequired countDefaultAsFilled>
          <RadioButtonGroupInput
            source="activity_type"
            label="Activity Type"
            choices={ACTIVITY_TYPE_CHOICES}
            row
            helperText="Interactions require an opportunity; engagements are standalone activities"
          />
        </FormFieldWrapper>

        <FormGrid>
          <div data-tutorial="activity-type">
            <FormFieldWrapper name="type" isRequired countDefaultAsFilled>
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
            </FormFieldWrapper>
          </div>

          {/* WG-001: Sample Status field - only shown when type="sample" */}
          {isSampleActivity && (
            <FormFieldWrapper name="sample_status" isRequired>
              <SelectInput
                source="sample_status"
                label="Sample Status"
                choices={SAMPLE_STATUS_CHOICES}
                helperText="Current status of the sample workflow"
                isRequired
              />
            </FormFieldWrapper>
          )}
        </FormGrid>

        <FormFieldWrapper name="subject" isRequired>
          <TextInput
            source="subject"
            label="Subject"
            isRequired
            helperText="Summarize the outcome or topic"
          />
        </FormFieldWrapper>

        <FormGrid>
          <FormFieldWrapper name="activity_date" isRequired countDefaultAsFilled>
            <DateInput source="activity_date" label="Date" isRequired disableFuture />
          </FormFieldWrapper>
          <FormFieldWrapper name="duration_minutes">
            <TextInput
              source="duration_minutes"
              label="Duration (minutes)"
              type="number"
              helperText="Optional length of the activity"
            />
          </FormFieldWrapper>
        </FormGrid>

        <div data-tutorial="activity-description">
          <FormFieldWrapper name="description">
            <TextInput
              source="description"
              label="Notes"
              multiline
              rows={4}
              helperText="Optional narrative for this interaction"
            />
          </FormFieldWrapper>
        </div>
      </FormSectionWithProgress>

      <FormSectionWithProgress
        id="relationships"
        title="Relationships"
        requiredFields={isInteraction ? ["opportunity_id"] : []}
      >
        {/* Opportunity field - only shown for interaction activities */}
        {isInteraction && (
          <div data-tutorial="activity-opportunity">
            <FormFieldWrapper name="opportunity_id" isRequired>
              <ReferenceInput source="opportunity_id" reference="opportunities">
                <AutocompleteInput
                  {...getAutocompleteProps("name")}
                  label="Opportunity"
                  optionText="name"
                  helperText="Required for interaction activities"
                  placeholder="Search opportunities"
                  isRequired
                />
              </ReferenceInput>
            </FormFieldWrapper>
          </div>
        )}

        <FormGrid>
          <FormFieldWrapper name="contact_id">
            <ReferenceInput source="contact_id" reference="contacts_summary">
              <AutocompleteInput
                {...getQSearchAutocompleteProps()}
                label="Contact"
                optionText={contactOptionText}
                helperText="At least one contact or organization is required"
                placeholder="Search contacts"
              />
            </ReferenceInput>
          </FormFieldWrapper>
          <FormFieldWrapper name="organization_id">
            <ReferenceInput source="organization_id" reference="organizations">
              <AutocompleteInput
                {...getAutocompleteProps("name")}
                label="Organization"
                optionText="name"
                helperText="At least one contact or organization is required"
                placeholder="Search organizations"
              />
            </ReferenceInput>
          </FormFieldWrapper>
        </FormGrid>
      </FormSectionWithProgress>

      <FormSectionWithProgress id="follow-up" title="Follow-up" requiredFields={[]}>
        <FormGrid>
          <FormFieldWrapper name="sentiment">
            <SelectInput
              source="sentiment"
              label="Sentiment"
              choices={sentimentChoices}
              helperText="How did the contact respond?"
            />
          </FormFieldWrapper>

          {/* WG-001: Follow-up Required checkbox - required for sample activities with active status */}
          <FormFieldWrapper name="follow_up_required">
            <BooleanInput
              source="follow_up_required"
              label="Follow-up Required"
              helperText={
                isSampleActivity
                  ? "Required for samples with active status (sent, received, feedback_pending)"
                  : "Schedule a follow-up for this activity"
              }
            />
          </FormFieldWrapper>
        </FormGrid>

        <FormGrid>
          <FormFieldWrapper name="follow_up_date">
            <DateInput source="follow_up_date" label="Follow-up Date" />
          </FormFieldWrapper>
          <FormFieldWrapper name="follow_up_notes">
            <TextInput
              source="follow_up_notes"
              label="Follow-up Notes"
              multiline
              rows={3}
              helperText="Optional next steps summary"
            />
          </FormFieldWrapper>
        </FormGrid>
      </FormSectionWithProgress>

      <FormSectionWithProgress id="outcome" title="Outcome" requiredFields={[]}>
        <FormGrid>
          <FormFieldWrapper name="location">
            <TextInput source="location" label="Location" helperText="Where did this occur?" />
          </FormFieldWrapper>
          <FormFieldWrapper name="outcome">
            <TextInput source="outcome" label="Outcome" helperText="Optional result summary" />
          </FormFieldWrapper>
        </FormGrid>
      </FormSectionWithProgress>
    </div>
  );
}
