import { useMemo } from "react";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { CreateInDialogButton } from "@/components/admin/create-in-dialog-button";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Plus } from "lucide-react";
import { useWatch, useFormContext } from "react-hook-form";
import { useGetIdentity } from "ra-core";
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import { contactOptionText } from "../misc/ContactOption";
import { AutocompleteOrganizationInput } from "@/atomic-crm/organizations/AutocompleteOrganizationInput";
import { OrganizationInputs } from "@/atomic-crm/organizations/OrganizationInputs";
import { ContactInputs } from "@/atomic-crm/contacts/ContactInputs";
import {
  OPPORTUNITY_STAGE_CHOICES,
} from "./stageConstants";
import { useAutoGenerateName } from "./useAutoGenerateName";
import { LeadSourceInput } from "./LeadSourceInput";
import { NamingConventionHelp } from "./NamingConventionHelp";

export const OpportunityInputs = ({ mode }: { mode: "create" | "edit" }) => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <OpportunityInfoInputs mode={mode} />

      <OpportunityClassificationInputs />

      <OpportunityCampaignWorkflowInputs />

      <OpportunityOrganizationInputs />

      <OpportunityContactsInput />

      <OpportunityProductsInput />
    </div>
  );
};

const OpportunityInfoInputs = ({ mode }: { mode: "create" | "edit" }) => {
  const { regenerate, isLoading, canGenerate } = useAutoGenerateName(mode);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-base font-semibold text-foreground">Opportunity Details</h3>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <div className="relative">
            <TextInput
              source="name"
              label="Opportunity name *"
              helperText={false}
              InputProps={{
                endAdornment: (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={regenerate}
                          disabled={!canGenerate || isLoading}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate name from customer and principal</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ),
              }}
            />
            <div className="mt-2">
              <NamingConventionHelp />
            </div>
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
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-base font-semibold text-foreground">Classification & Tracking</h3>
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

// Campaign & Workflow Tracking section
const OpportunityCampaignWorkflowInputs = () => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-base font-semibold text-foreground">Campaign & Workflow Tracking</h3>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <TextInput
          source="campaign"
          label="Campaign"
          helperText={false}
          placeholder="e.g., Q4 2025 Trade Show"
        />

        <ReferenceInput
          source="related_opportunity_id"
          reference="opportunities"
        >
          <SelectInput
            optionText="name"
            label="Related Opportunity"
            helperText={false}
          />
        </ReferenceInput>

        <div className="lg:col-span-2">
          <ArrayInput source="tags" label="Tags">
            <SimpleFormIterator inline disableReordering>
              <TextInput
                source=""
                label={false}
                helperText={false}
                placeholder="Add tag"
              />
            </SimpleFormIterator>
          </ArrayInput>
        </div>

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

        <div className="lg:col-span-2">
          <TextInput
            source="decision_criteria"
            label="Decision Criteria"
            multiline
            rows={3}
            helperText={false}
            placeholder="Key factors influencing the decision..."
          />
        </div>
      </div>
    </div>
  );
};

// Organization relationships section
const OpportunityOrganizationInputs = () => {
  const { identity } = useGetIdentity();
  const { setValue } = useFormContext();

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-base font-semibold text-foreground">Key Relationships</h3>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div className="flex items-start gap-2">
          <ReferenceInput
            source="customer_organization_id"
            reference="organizations"
            filter={{ organization_type: "customer" }}
            className="flex-1"
          >
            <AutocompleteOrganizationInput
              label="Customer Organization *"
              organizationType="customer"
            />
          </ReferenceInput>
          <CreateInDialogButton
            resource="organizations"
            label="New Customer"
            title="Create new Customer Organization"
            description="Create a new customer organization and select it automatically"
            defaultValues={{
              organization_type: "customer",
              sales_id: identity?.id,
              segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52", // Default to "Unknown" segment
            }}
            onSave={(record) => {
              // Auto-select the newly created organization
              setValue("customer_organization_id", record.id);
            }}
            transform={(values) => {
              // add https:// before website if not present
              if (values.website && !values.website.startsWith("http")) {
                values.website = `https://${values.website}`;
              }
              return values;
            }}
            className="mt-7"
          >
            <OrganizationInputs />
          </CreateInDialogButton>
        </div>

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

        <div className="flex items-start gap-2">
          <ReferenceInput
            source="principal_organization_id"
            reference="organizations"
            filter={{ organization_type: "principal" }}
            className="flex-1"
          >
            <AutocompleteOrganizationInput
              label="Principal Organization *"
              organizationType="principal"
            />
          </ReferenceInput>
          <CreateInDialogButton
            resource="organizations"
            label="New Principal"
            title="Create new Principal Organization"
            description="Create a new principal organization and select it automatically"
            defaultValues={{
              organization_type: "principal",
              sales_id: identity?.id,
              segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52", // Default to "Unknown" segment
            }}
            onSave={(record) => {
              // Auto-select the newly created organization
              setValue("principal_organization_id", record.id);
            }}
            transform={(values) => {
              // add https:// before website if not present
              if (values.website && !values.website.startsWith("http")) {
                values.website = `https://${values.website}`;
              }
              return values;
            }}
            className="mt-7"
          >
            <OrganizationInputs />
          </CreateInDialogButton>
        </div>

        <div className="flex items-start gap-2">
          <ReferenceInput
            source="distributor_organization_id"
            reference="organizations"
            filter={{ organization_type: "distributor" }}
            className="flex-1"
          >
            <AutocompleteOrganizationInput
              label="Distributor Organization"
              organizationType="distributor"
            />
          </ReferenceInput>
          <CreateInDialogButton
            resource="organizations"
            label="New Distributor"
            title="Create new Distributor Organization"
            description="Create a new distributor organization and select it automatically"
            defaultValues={{
              organization_type: "distributor",
              sales_id: identity?.id,
              segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52", // Default to "Unknown" segment
            }}
            onSave={(record) => {
              // Auto-select the newly created organization
              setValue("distributor_organization_id", record.id);
            }}
            transform={(values) => {
              // add https:// before website if not present
              if (values.website && !values.website.startsWith("http")) {
                values.website = `https://${values.website}`;
              }
              return values;
            }}
            className="mt-7"
          >
            <OrganizationInputs />
          </CreateInDialogButton>
        </div>
      </div>
    </div>
  );
};

// Contacts section
const OpportunityContactsInput = () => {
  const customerOrganizationId = useWatch({ name: "customer_organization_id" });
  const { identity } = useGetIdentity();
  const { setValue, getValues } = useFormContext();

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
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-semibold text-foreground mb-1">Contacts *</h3>
          <p className="text-sm text-muted-foreground">
            {customerOrganizationId
              ? "At least one contact is required"
              : "Please select a Customer Organization first"}
          </p>
        </div>
        {customerOrganizationId && (
          <CreateInDialogButton
            resource="contacts"
            label="New Contact"
            title="Create new Contact"
            description="Create a new contact for the selected customer organization"
            defaultValues={{
              organization_id: customerOrganizationId,
              sales_id: identity?.id,
              first_seen: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              tags: [],
            }}
            onSave={(record) => {
              // Auto-add the newly created contact to the contact list
              const currentContacts = getValues("contact_ids") || [];
              setValue("contact_ids", [...currentContacts, record.id]);
            }}
          >
            <ContactInputs />
          </CreateInDialogButton>
        )}
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
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">Products *</h3>
        <p className="text-sm text-muted-foreground">
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
