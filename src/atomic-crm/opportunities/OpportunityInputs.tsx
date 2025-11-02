import { useMemo } from "react";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useWatch } from "react-hook-form";
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import { contactOptionText } from "../misc/ContactOption";
import { AutocompleteOrganizationInput } from "@/atomic-crm/organizations/AutocompleteOrganizationInput";
import {
  OPPORTUNITY_STAGE_CHOICES,
} from "./stageConstants";
import { useAutoGenerateName } from "./useAutoGenerateName";
import { LeadSourceInput } from "./LeadSourceInput";

export const OpportunityInputs = ({ mode }: { mode: "create" | "edit" }) => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <OpportunityInfoInputs mode={mode} />

      <OpportunityClassificationInputs />

      <OpportunityOrganizationInputs />

      <OpportunityContactsInput />

      <OpportunityProductsInput />
    </div>
  );
};

const OpportunityInfoInputs = ({ mode }: { mode: "create" | "edit" }) => {
  const { regenerate, isLoading } = useAutoGenerateName(mode);

  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <h3 className="text-base font-semibold text-[color:var(--text-primary)]">Opportunity Details</h3>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div className="lg:col-span-2">
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
        </div>
        <div className="lg:col-span-2">
          <TextInput source="description" label="Description" multiline rows={2} helperText={false} />
        </div>
        <TextInput
          source="estimated_close_date"
          label="Expected Closing Date *"
          helperText={false}
          type="date"
          // NOTE: defaultValue removed - now handled by form-level defaultValues from schema
          // Per Constitution #5: Never use defaultValue on inputs with React Hook Form
        />
      </div>
    </div>
  );
};

// Classification & Tracking section
const OpportunityClassificationInputs = () => {
  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <h3 className="text-base font-semibold text-[color:var(--text-primary)]">Classification & Tracking</h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <SelectInput
          source="stage"
          label="Stage *"
          choices={OPPORTUNITY_STAGE_CHOICES}
          // defaultValue removed per Constitution #5 - defaults come from Zod schema via form-level defaultValues
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
          // defaultValue removed per Constitution #5 - defaults come from Zod schema via form-level defaultValues
          helperText={false}
        />

        <LeadSourceInput />
      </div>
    </div>
  );
};

// Organization relationships section
const OpportunityOrganizationInputs = () => {
  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <h3 className="text-base font-semibold text-[color:var(--text-primary)]">Key Relationships</h3>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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

        <ReferenceInput
          source="account_manager_id"
          reference="sales"
        >
          <SelectInput
            optionText={(choice) =>
              choice?.first_name || choice?.last_name
                ? `${choice.first_name || ""} ${choice.last_name || ""} (${choice.email})`.trim()
                : choice?.email || ""
            }
            label="Account Manager"
            helperText={false}
          />
        </ReferenceInput>

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
      </div>
    </div>
  );
};

// Contacts section
const OpportunityContactsInput = () => {
  const customerOrganizationId = useWatch({ name: "customer_organization_id" });

  // Memoize the filter object to prevent unnecessary re-renders and value clearing
  // See Engineering Constitution #1: NO OVER-ENGINEERING - this simple fix prevents
  // ReferenceArrayInput from clearing contact_ids when other fields update
  // Root cause: Filter object recreation triggers React Admin to re-fetch choices,
  // which briefly clears selected values during the fetch cycle
  const contactFilter = useMemo(
    () => (customerOrganizationId ? { organization_id: customerOrganizationId } : {}),
    [customerOrganizationId]
  );

  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[color:var(--text-primary)] mb-1">Contacts *</h3>
        <p className="text-sm text-[color:var(--text-subtle)]">
          {customerOrganizationId
            ? "At least one contact is required"
            : "Please select a Customer Organization first"}
        </p>
      </div>
      {customerOrganizationId ? (
        <ReferenceArrayInput
          source="contact_ids"
          reference="contacts_summary"
          filter={contactFilter}
        >
          <AutocompleteArrayInput
            label={false}
            optionText={contactOptionText}
            helperText={false}
          />
        </ReferenceArrayInput>
      ) : (
        <AutocompleteArrayInput
          source="contact_ids"
          label={false}
          optionText={contactOptionText}
          helperText={false}
          disabled
          placeholder="Select Customer Organization first"
          choices={[]}
        />
      )}
    </div>
  );
};

// Products section
const OpportunityProductsInput = () => {
  const principalOrganizationId = useWatch({ name: "principal_organization_id" });

  // Memoize the filter object to prevent unnecessary re-renders
  // When principal is selected, only show products from that principal
  // Note: Database field is "principal_id", not "principal_organization_id"
  const productFilter = useMemo(
    () => (principalOrganizationId ? { principal_id: principalOrganizationId } : {}),
    [principalOrganizationId]
  );

  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[color:var(--text-primary)] mb-1">Products *</h3>
        <p className="text-sm text-[color:var(--text-subtle)]">
          {principalOrganizationId
            ? "At least one product is required (filtered by selected Principal)"
            : "At least one product is required (select Principal Organization to filter)"}
        </p>
      </div>
      <ArrayInput source="products_to_sync" label={false}>
        <SimpleFormIterator inline disableReordering>
          <ReferenceInput
            source="product_id_reference"
            reference="products"
            filter={productFilter}
          >
            <SelectInput
              optionText="name"
              label="Product"
              helperText={false}
              className="w-full"
            />
          </ReferenceInput>
          <TextInput
            source="notes"
            label="Notes"
            helperText={false}
            placeholder="Optional notes"
            className="w-full"
          />
        </SimpleFormIterator>
      </ArrayInput>
    </div>
  );
};
