import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";

export const OpportunityAdditionalInfoTab = () => {
  return (
    <div className="space-y-2">
      <TextInput
        source="campaign"
        label="Campaign"
        helperText={false}
        placeholder="e.g., Q4 2025 Trade Show"
      />
      <ReferenceInput source="related_opportunity_id" reference="opportunities">
        <SelectInput optionText="name" label="Related Opportunity" helperText={false} />
      </ReferenceInput>
      <TextInput
        source="notes"
        label="Notes"
        multiline
        rows={3}
        helperText={false}
        placeholder="General notes about the opportunity (separate from activity log)..."
      />
      <ArrayInput source="tags" label="Tags">
        <SimpleFormIterator inline disableReordering>
          <TextInput source="" label={false} helperText={false} placeholder="Add tag" />
        </SimpleFormIterator>
      </ArrayInput>
      <TextInput
        source="next_action"
        label="Next Action"
        helperText={false}
        placeholder="e.g., Follow up with decision maker"
      />
      <TextInput
        source="next_action_date"
        label="Next Action Date"
        helperText={false}
        type="date"
      />
      <TextInput
        source="decision_criteria"
        label="Decision Criteria"
        multiline
        rows={3}
        helperText={false}
        placeholder="Key factors influencing the decision..."
      />
    </div>
  );
};
