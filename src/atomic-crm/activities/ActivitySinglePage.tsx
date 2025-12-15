import { useState } from "react";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { FormGrid, FormSection, FormFieldWrapper } from "@/components/admin/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { contactOptionText } from "../contacts/ContactOption";
import { INTERACTION_TYPE_OPTIONS } from "../validation/activities";

const sentimentChoices = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
];

export default function ActivitySinglePage() {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);

  return (
    <div className="space-y-6">
      <FormSection title="Activity Details">
        <FormGrid>
          <div data-tutorial="activity-type">
            <FormFieldWrapper name="type" isRequired>
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
            label="Subject"
            isRequired
            helperText="Summarize the outcome or topic"
          />
        </FormFieldWrapper>

        <FormGrid>
          <FormFieldWrapper name="activity_date" isRequired>
            <TextInput source="activity_date" label="Date" type="date" isRequired />
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
      </FormSection>

      <FormSection title="Relationships">
        <FormGrid>
          <div data-tutorial="activity-opportunity">
            <FormFieldWrapper name="opportunity_id">
              <ReferenceInput source="opportunity_id" reference="opportunities">
                <AutocompleteInput
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
              label="Organization"
              optionText="name"
              helperText="Optional organization context"
              placeholder="Search organizations"
            />
          </ReferenceInput>
        </FormFieldWrapper>
      </FormSection>

      <Collapsible open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 w-full border-b border-border pb-2"
            aria-label="Follow-up"
          >
            {followUpOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Follow-up
            </h3>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-6">
          <div className="space-y-6">
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
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={outcomeOpen} onOpenChange={setOutcomeOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 w-full border-b border-border pb-2"
            aria-label="Outcome"
          >
            {outcomeOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outcome
            </h3>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-6">
          <div className="space-y-6">
            <FormGrid>
              <FormFieldWrapper name="location">
                <TextInput source="location" label="Location" helperText="Where did this occur?" />
              </FormFieldWrapper>
              <FormFieldWrapper name="outcome">
                <TextInput source="outcome" label="Outcome" helperText="Optional result summary" />
              </FormFieldWrapper>
            </FormGrid>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
