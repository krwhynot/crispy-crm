import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import { contactOptionText } from "../misc/ContactOption";
import { AutocompleteOrganizationInput } from "@/atomic-crm/organizations/AutocompleteOrganizationInput";
import {
  OPPORTUNITY_STAGE_CHOICES,
} from "./stageConstants";
import { OpportunityProductsInput } from "./OpportunityProductsInput";
import { OpportunityContextInput } from "./OpportunityContextInput";
import { useAutoGenerateName } from "./useAutoGenerateName";
import { LeadSourceInput } from "./LeadSourceInput";

export const OpportunityInputs = ({ mode }: { mode: "create" | "edit" }) => {
  return (
    <div className="flex flex-col gap-2 p-3">
      <OpportunityInfoInputs mode={mode} />

      <OpportunitySalesInputs />

      <OpportunityClassificationInputs />

      <OpportunityOrganizationInputs />

      <OpportunityContactsInput />

      {/* Only show products section in create mode - edit mode has dedicated Products tab */}
      {mode === "create" && (
        <OpportunityProductsSection />
      )}
    </div>
  );
};

const OpportunityInfoInputs = ({ mode }: { mode: "create" | "edit" }) => {
  const { regenerate, isLoading } = useAutoGenerateName(mode);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium mb-2">Opportunity Details</h3>
      <div className="relative">
        <TextInput
          source="name"
          label="Opportunity name *"
          helperText={false}
          InputProps={{
            endAdornment:
              mode === "edit" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={regenerate}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              ) : null,
          }}
        />
      </div>
      <TextInput source="description" multiline rows={1} helperText={false} />
    </div>
  );
};

// Sales & Financial Information section
const OpportunitySalesInputs = () => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium mb-2">Sales & Financial Information</h3>
      <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
        <TextInput
          source="expected_closing_date"
          label="Expected Closing Date *"
          helperText={false}
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
        />

        <NumberInput
          source="amount"
          label="Budget *"
          defaultValue={0}
          helperText={false}
        />

        <NumberInput
          source="probability"
          label="Probability (%) *"
          min={0}
          max={100}
          defaultValue={50}
          helperText={false}
        />
      </div>
    </div>
  );
};

// Classification & Tracking section
const OpportunityClassificationInputs = () => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium mb-2">Classification & Tracking</h3>
      <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <SelectInput
          source="stage"
          label="Stage *"
          choices={OPPORTUNITY_STAGE_CHOICES}
          defaultValue="new_lead"
          helperText={false}
        />

        <SelectInput
          source="priority"
          label="Priority *"
          choices={[
            { id: "low", name: "Low" },
            { id: "medium", name: "Medium" },
            { id: "high", name: "High" },
            { id: "critical", name: "Critical" },
          ]}
          defaultValue="medium"
          helperText={false}
        />

        <OpportunityContextInput />

        <LeadSourceInput />
      </div>
    </div>
  );
};

// Organization relationships section
const OpportunityOrganizationInputs = () => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium mb-2">Key Relationships</h3>
      <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <ReferenceInput
          source="customer_organization_id"
          reference="organizations"
        >
          <AutocompleteOrganizationInput label="Customer Organization *" />
        </ReferenceInput>

        <ReferenceInput
          source="account_manager_id"
          reference="sales"
        >
          <SelectInput optionText="email" label="Account Manager" helperText={false} />
        </ReferenceInput>

        <ReferenceInput
          source="principal_organization_id"
          reference="organizations"
        >
          <AutocompleteOrganizationInput label="Principal Organization" />
        </ReferenceInput>

        <ReferenceInput
          source="distributor_organization_id"
          reference="organizations"
        >
          <AutocompleteOrganizationInput label="Distributor Organization" />
        </ReferenceInput>
      </div>
    </div>
  );
};

// Contacts section
const OpportunityContactsInput = () => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium mb-2">Contacts *</h3>
      <ReferenceArrayInput source="contact_ids" reference="contacts_summary">
        <AutocompleteArrayInput
          label={false}
          optionText={contactOptionText}
          helperText={false}
        />
      </ReferenceArrayInput>
    </div>
  );
};

// Products section
const OpportunityProductsSection = () => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium mb-2">Product Line Items</h3>
      <OpportunityProductsInput />
    </div>
  );
};
