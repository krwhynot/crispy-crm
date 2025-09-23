import {
  AutocompleteArrayInput,
  ReferenceArrayInput,
  ReferenceInput,
  TextInput,
  NumberInput,
  SelectInput,
} from "@/components/admin";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { required } from "ra-core";
import { contactOptionText } from "../misc/ContactOption";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { AutocompleteCompanyInput } from "@/atomic-crm/companies/AutocompleteCompanyInput.tsx";

export const OpportunityInputs = () => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col gap-8">
      <OpportunityInfoInputs />

      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <OpportunityLinkedToInputs />
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <OpportunityMiscInputs />
      </div>
    </div>
  );
};

const OpportunityInfoInputs = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <TextInput
        source="name"
        label="Opportunity name"
        validate={required()}
        helperText={false}
      />
      <TextInput source="description" multiline rows={3} helperText={false} />
    </div>
  );
};

const OpportunityLinkedToInputs = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">Linked to</h3>
      <ReferenceInput source="customer_organization_id" reference="companies">
        <AutocompleteCompanyInput label="Customer Organization" />
      </ReferenceInput>

      <ReferenceInput source="principal_organization_id" reference="companies">
        <AutocompleteCompanyInput label="Principal Organization (Optional)" />
      </ReferenceInput>

      <ReferenceInput source="distributor_organization_id" reference="companies">
        <AutocompleteCompanyInput label="Distributor Organization (Optional)" />
      </ReferenceInput>

      <ReferenceArrayInput source="contact_ids" reference="contacts_summary">
        <AutocompleteArrayInput
          label="Contacts"
          optionText={contactOptionText}
          helperText={false}
          validate={required()}
        />
      </ReferenceArrayInput>
    </div>
  );
};

const OpportunityMiscInputs = () => {
  const { opportunityCategories } = useConfigurationContext();
  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">Misc</h3>

      <SelectInput
        source="category"
        label="Category"
        choices={opportunityCategories.map((type) => ({
          id: type,
          name: type,
        }))}
        helperText={false}
      />

      <SelectInput
        source="stage"
        label="Lifecycle Stage"
        choices={[
          { id: 'lead', name: 'Lead' },
          { id: 'qualified', name: 'Qualified' },
          { id: 'needs_analysis', name: 'Needs Analysis' },
          { id: 'proposal', name: 'Proposal' },
          { id: 'negotiation', name: 'Negotiation' },
          { id: 'closed_won', name: 'Closed Won' },
          { id: 'closed_lost', name: 'Closed Lost' },
          { id: 'nurturing', name: 'Nurturing' }
        ]}
        defaultValue="lead"
        helperText={false}
        validate={required()}
      />

      <SelectInput
        source="priority"
        label="Priority"
        choices={[
          { id: 'low', name: 'Low' },
          { id: 'medium', name: 'Medium' },
          { id: 'high', name: 'High' },
          { id: 'critical', name: 'Critical' }
        ]}
        defaultValue="medium"
        helperText={false}
        validate={required()}
      />

      <NumberInput
        source="amount"
        defaultValue={0}
        helperText={false}
        validate={required()}
      />

      <NumberInput
        source="probability"
        label="Probability (%)"
        min={0}
        max={100}
        defaultValue={50}
        helperText={false}
        validate={required()}
      />

      <TextInput
        validate={required()}
        source="expected_closing_date"
        helperText={false}
        type="date"
        defaultValue={new Date().toISOString().split("T")[0]}
      />
    </div>
  );
};