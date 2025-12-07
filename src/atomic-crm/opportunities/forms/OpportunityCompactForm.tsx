import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { CompactFormRow, CollapsibleSection } from "@/components/admin/form";
import { AutocompleteOrganizationInput } from "../../organizations/AutocompleteOrganizationInput";
import { OPPORTUNITY_STAGE_CHOICES } from "../constants/stageConstants";
import type { Sale } from "../../types";

const saleOptionRenderer = (choice: Sale) =>
  choice?.first_name || choice?.last_name
    ? `${choice.first_name || ""} ${choice.last_name || ""} (${choice.email})`.trim()
    : choice?.email || "";

const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

export const OpportunityCompactForm = () => {
  return (
    <div className="space-y-4">
      {/* Row 1: Name (full width) */}
      <TextInput
        source="name"
        label="Opportunity Name *"
        helperText="Auto-generated from Customer + Principal"
      />

      {/* Row 2: Customer | Principal */}
      <CompactFormRow>
        <div data-tutorial="opp-customer">
          <ReferenceInput
            source="customer_organization_id"
            reference="organizations"
            filter={{ organization_type: "customer" }}
          >
            <AutocompleteOrganizationInput
              label="Customer Organization *"
              organizationType="customer"
            />
          </ReferenceInput>
        </div>
        <div data-tutorial="opp-principal">
          <ReferenceInput
            source="principal_organization_id"
            reference="organizations"
            filter={{ organization_type: "principal" }}
          >
            <AutocompleteOrganizationInput
              label="Principal Organization *"
              organizationType="principal"
            />
          </ReferenceInput>
        </div>
      </CompactFormRow>

      {/* Row 3: Stage | Priority | Close Date */}
      <CompactFormRow columns="md:grid-cols-3">
        <div data-tutorial="opp-stage">
          <SelectInput
            source="stage"
            label="Stage *"
            choices={OPPORTUNITY_STAGE_CHOICES}
            helperText={false}
          />
        </div>
        <div data-tutorial="opp-priority">
          <SelectInput
            source="priority"
            label="Priority *"
            choices={priorityChoices}
            helperText={false}
          />
        </div>
        <div data-tutorial="opp-close-date">
          <TextInput
            source="estimated_close_date"
            label="Est. Close Date *"
            helperText={false}
            type="date"
          />
        </div>
      </CompactFormRow>

      {/* Row 4: Account Manager */}
      <CompactFormRow>
        <ReferenceInput
          source="account_manager_id"
          reference="sales"
          sort={{ field: "last_name", order: "ASC" }}
          filter={{ "disabled@neq": true }}
        >
          <SelectInput
            label="Account Manager"
            optionText={saleOptionRenderer}
            helperText={false}
          />
        </ReferenceInput>
        <div />
      </CompactFormRow>

      {/* Collapsible: Relationships (EXPANDED by default) */}
      <CollapsibleSection title="Relationships & Products" defaultOpen>
        <div className="space-y-3">
          <CompactFormRow>
            <ReferenceInput
              source="distributor_organization_id"
              reference="organizations"
              filter={{ organization_type: "distributor" }}
            >
              <AutocompleteOrganizationInput
                label="Distributor Organization"
                organizationType="distributor"
              />
            </ReferenceInput>
            <div data-tutorial="opp-contacts">
              <ReferenceInput source="contact_ids" reference="contacts">
                <SelectInput optionText="full_name" helperText={false} label="Contacts" />
              </ReferenceInput>
            </div>
          </CompactFormRow>
        </div>
      </CollapsibleSection>

      {/* Collapsible: Classification */}
      <CollapsibleSection title="Classification">
        <div className="space-y-3">
          <CompactFormRow>
            <TextInput source="lead_source" label="Lead Source" helperText={false} />
            <TextInput
              source="campaign"
              label="Campaign"
              helperText={false}
              placeholder="e.g., Q4 2025 Trade Show"
            />
          </CompactFormRow>
        </div>
      </CollapsibleSection>

      {/* Collapsible: Additional Details */}
      <CollapsibleSection title="Additional Details">
        <div className="space-y-3">
          <TextInput source="description" label="Description" multiline rows={2} helperText={false} />
          <CompactFormRow>
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
          </CompactFormRow>
          <TextInput
            source="decision_criteria"
            label="Decision Criteria"
            multiline
            rows={2}
            helperText={false}
            placeholder="Key factors influencing the decision..."
          />
          <TextInput
            source="notes"
            label="Notes"
            multiline
            rows={2}
            helperText={false}
            placeholder="General notes about the opportunity (separate from activity log)..."
          />
        </div>
      </CollapsibleSection>
    </div>
  );
};
