import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { FormGrid, FormSectionWithProgress, FormFieldWrapper } from "@/components/admin/form";
import { contactOptionText } from "../contacts/ContactOption";
import { INTERACTION_TYPE_OPTIONS } from "../validation/activities";
import { getAutocompleteProps, getQSearchAutocompleteProps } from "../utils/autocompleteDefaults";

const sentimentChoices = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
];

export default function ActivitySinglePage() {
  return (
    <div className="space-y-6">
      <FormSectionWithProgress id="activity-details" title="Activity Details" requiredFields={["type", "subject", "activity_date"]}>
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
        </FormGrid>

        <FormFieldWrapper name="subject" isRequired>
          <TextInput
            source="subject"
            label="Subject *"
            isRequired
            helperText="Summarize the outcome or topic"
          />
        </FormFieldWrapper>

        <FormGrid>
          <FormFieldWrapper name="activity_date" isRequired countDefaultAsFilled>
            <TextInput source="activity_date" label="Date *" type="date" isRequired />
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

      <FormSectionWithProgress id="relationships" title="Relationships" requiredFields={[]}>
        <FormGrid>
          <div data-tutorial="activity-opportunity">
            <FormFieldWrapper name="opportunity_id">
              <ReferenceInput source="opportunity_id" reference="opportunities">
                <AutocompleteInput
                  {...getAutocompleteProps("name")}
                  label="Opportunity"
                  optionText="name"
                  helperText="Required for interaction activities"
                  placeholder="Search opportunities"
                />
              </ReferenceInput>
            </FormFieldWrapper>
          </div>
          <FormFieldWrapper name="contact_id">
            <ReferenceInput source="contact_id" reference="contacts_summary">
              <AutocompleteInput
                {...getQSearchAutocompleteProps()}
                label="Contact"
                optionText={contactOptionText}
                helperText="Optional contact involved"
                placeholder="Search contacts"
              />
            </ReferenceInput>
          </FormFieldWrapper>
        </FormGrid>

        <FormFieldWrapper name="organization_id">
          <ReferenceInput source="organization_id" reference="organizations">
            <AutocompleteInput
              {...getAutocompleteProps("name")}
              label="Organization"
              optionText="name"
              helperText="Optional organization context"
              placeholder="Search organizations"
            />
          </ReferenceInput>
        </FormFieldWrapper>
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
        </FormGrid>

        <FormGrid>
          <FormFieldWrapper name="follow_up_date">
            <TextInput source="follow_up_date" label="Follow-up Date" type="date" />
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
