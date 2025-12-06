import { useState } from "react";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { FormGrid, FormSection } from "@/components/admin/form";
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
        </FormGrid>

        <TextInput
          source="subject"
          label="Subject"
          isRequired
          helperText="Summarize the outcome or topic"
        />

        <FormGrid>
          <TextInput source="activity_date" label="Date" type="date" isRequired />
          <TextInput
            source="duration_minutes"
            label="Duration (minutes)"
            type="number"
            helperText="Optional length of the activity"
          />
        </FormGrid>

        <div data-tutorial="activity-description">
          <TextInput
            source="description"
            label="Notes"
            multiline
            rows={4}
            helperText="Optional narrative for this interaction"
          />
        </div>
      </FormSection>

      <FormSection title="Relationships">
        <FormGrid>
          <div data-tutorial="activity-opportunity">
            <ReferenceInput source="opportunity_id" reference="opportunities">
              <AutocompleteInput
                label="Opportunity"
                optionText="name"
                helperText="Required for interaction activities"
                placeholder="Search opportunities"
              />
            </ReferenceInput>
          </div>
          <ReferenceInput source="contact_id" reference="contacts_summary">
            <AutocompleteInput
              label="Contact"
              optionText={contactOptionText}
              helperText="Optional contact involved"
              placeholder="Search contacts"
            />
          </ReferenceInput>
        </FormGrid>

        <ReferenceInput source="organization_id" reference="organizations">
          <AutocompleteInput
            label="Organization"
            optionText="name"
            helperText="Optional organization context"
            placeholder="Search organizations"
          />
        </ReferenceInput>
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
              <SelectInput
                source="sentiment"
                label="Sentiment"
                choices={sentimentChoices}
                helperText="How did the contact respond?"
              />
            </FormGrid>

            <FormGrid>
              <TextInput source="follow_up_date" label="Follow-up Date" type="date" />
              <TextInput
                source="follow_up_notes"
                label="Follow-up Notes"
                multiline
                rows={3}
                helperText="Optional next steps summary"
              />
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
              <TextInput source="location" label="Location" helperText="Where did this occur?" />
              <TextInput source="outcome" label="Outcome" helperText="Optional result summary" />
            </FormGrid>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
