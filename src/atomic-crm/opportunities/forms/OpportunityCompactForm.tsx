import { useMemo, useState } from "react";
import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import {
  CompactFormRow,
  CollapsibleSection,
  CompactFormFieldWithButton,
} from "@/components/admin/form";
import { CreateInDialogButton } from "@/components/admin/create-in-dialog-button";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";
import { useWatch, useFormContext } from "react-hook-form";
import { useGetIdentity, useRefresh } from "ra-core";
import { AutocompleteOrganizationInput } from "../../organizations/AutocompleteOrganizationInput";
import { OrganizationInputs } from "../../organizations/OrganizationInputs";
import { QuickCreateContactPopover } from "../../contacts/QuickCreateContactPopover";
import { contactOptionText } from "../../contacts/ContactOption";
import { ContactOrgMismatchWarning } from "../components/ContactOrgMismatchWarning";
import { DistributorAuthorizationWarning } from "../components/DistributorAuthorizationWarning";
import { NamingConventionHelp } from "./NamingConventionHelp";
import { useAutoGenerateName } from "../hooks/useAutoGenerateName";
import { OPPORTUNITY_STAGE_CHOICES } from "../constants/stageConstants";
import { DEFAULT_SEGMENT_ID } from "../../constants";
import { organizationSchema } from "../../validation/organizations";
import { saleOptionRenderer } from "../../utils/saleOptionRenderer";

const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

const organizationDefaults = organizationSchema.partial().parse({});

interface OpportunityCompactFormProps {
  mode?: "create" | "edit";
}

export const OpportunityCompactForm = ({ mode = "create" }: OpportunityCompactFormProps) => {
  const { data: identity } = useGetIdentity();
  const { setValue, getValues } = useFormContext();
  const refresh = useRefresh();
  const { regenerate, isLoading, canGenerate } = useAutoGenerateName(mode);

  const customerOrganizationId = useWatch({ name: "customer_organization_id" });
  const principalOrganizationId = useWatch({ name: "principal_organization_id" });

  const contactFilter = useMemo(
    () => (customerOrganizationId ? { organization_id: customerOrganizationId } : {}),
    [customerOrganizationId]
  );

  const productFilter = useMemo(
    () => (principalOrganizationId ? { principal_id: principalOrganizationId } : {}),
    [principalOrganizationId]
  );

  const [showContactCreate, setShowContactCreate] = useState(false);
  const [pendingContactName, setPendingContactName] = useState("");

  const handleCreateContact = (name?: string) => {
    if (!name) return;
    setPendingContactName(name);
    setShowContactCreate(true);
    return undefined;
  };

  const handleContactCreated = (record: { id: number; first_name: string; last_name: string }) => {
    setShowContactCreate(false);
    setPendingContactName("");
    const currentContacts = getValues("contact_ids") || [];
    setValue("contact_ids", [...currentContacts, record.id]);
    // Trigger ReferenceInput to refetch so new contact appears in choices
    refresh();
    return record;
  };

  const handleCancelContactCreate = () => {
    setShowContactCreate(false);
    setPendingContactName("");
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Name (full width) with regenerate button in edit mode */}
      <div className="relative">
        <div data-tutorial="opp-name">
          <TextInput
            source="name"
            label="Opportunity Name *"
            helperText={false}
            InputProps={
              mode === "edit"
                ? {
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
                  }
                : undefined
            }
          />
        </div>
        <div className="mt-2">
          <NamingConventionHelp />
        </div>
      </div>

      {/* Row 2: Customer | Principal with inline create buttons */}
      <CompactFormRow>
        <CompactFormFieldWithButton
          button={
            <CreateInDialogButton
              resource="organizations"
              label="New Customer"
              title="Create new Customer Organization"
              description="Create a new customer organization and select it automatically"
              defaultValues={{
                ...organizationDefaults,
                organization_type: "customer",
                sales_id: identity?.id,
                segment_id: DEFAULT_SEGMENT_ID,
              }}
              onSave={(record) => {
                setValue("customer_organization_id", record.id);
              }}
              transform={(values) => {
                if (values.website && !values.website.startsWith("http")) {
                  values.website = `https://${values.website}`;
                }
                return values;
              }}
            >
              <OrganizationInputs />
            </CreateInDialogButton>
          }
        >
          <div data-tutorial="opp-customer">
            <ReferenceInput
              source="customer_organization_id"
              reference="organizations"
              filter={{ "organization_type@in": "(prospect,customer)" }}
            >
              <AutocompleteOrganizationInput
                label="Customer Organization *"
                organizationType="customer"
              />
            </ReferenceInput>
          </div>
        </CompactFormFieldWithButton>
        <CompactFormFieldWithButton
          button={
            <CreateInDialogButton
              resource="organizations"
              label="New Principal"
              title="Create new Principal Organization"
              description="Create a new principal organization and select it automatically"
              defaultValues={{
                ...organizationDefaults,
                organization_type: "principal",
                sales_id: identity?.id,
                segment_id: DEFAULT_SEGMENT_ID,
              }}
              onSave={(record) => {
                setValue("principal_organization_id", record.id);
              }}
              transform={(values) => {
                if (values.website && !values.website.startsWith("http")) {
                  values.website = `https://${values.website}`;
                }
                return values;
              }}
            >
              <OrganizationInputs />
            </CreateInDialogButton>
          }
        >
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
        </CompactFormFieldWithButton>
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

      {/* Row 4: Account Manager | Distributor with inline create button */}
      <CompactFormRow>
        <CompactFormFieldWithButton>
          {/* No button prop = auto placeholder for alignment */}
          <div data-tutorial="opp-account-manager">
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
          </div>
        </CompactFormFieldWithButton>
        <CompactFormFieldWithButton
          button={
            <CreateInDialogButton
              resource="organizations"
              label="New Distributor"
              title="Create new Distributor Organization"
              description="Create a new distributor organization and select it automatically"
              defaultValues={{
                ...organizationDefaults,
                organization_type: "distributor",
                sales_id: identity?.id,
                segment_id: DEFAULT_SEGMENT_ID,
              }}
              onSave={(record) => {
                setValue("distributor_organization_id", record.id);
              }}
              transform={(values) => {
                if (values.website && !values.website.startsWith("http")) {
                  values.website = `https://${values.website}`;
                }
                return values;
              }}
            >
              <OrganizationInputs />
            </CreateInDialogButton>
          }
          footer={<DistributorAuthorizationWarning />}
        >
          <div data-tutorial="opp-distributor">
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
        </CompactFormFieldWithButton>
      </CompactFormRow>

      {/* Collapsible: Contacts & Products (always open - contains required fields) */}
      <CollapsibleSection title="Contacts & Products" defaultOpen>
        <div className="space-y-4">
          {/* Contacts */}
          <div>
            <div className="mb-2">
              <h4 className="text-sm font-medium">Contacts *</h4>
              <p className="text-xs text-muted-foreground">
                {customerOrganizationId
                  ? "At least one contact is required"
                  : "Please select a Customer Organization first"}
              </p>
            </div>
            <div data-tutorial="opp-contacts">
              {customerOrganizationId ? (
                <>
                  <ReferenceArrayInput
                    source="contact_ids"
                    reference="contacts_summary"
                    filter={contactFilter}
                  >
                    <AutocompleteArrayInput
                      label={false}
                      optionText={contactOptionText}
                      helperText={false}
                      onCreate={handleCreateContact}
                      createItemLabel="Create %{item}"
                    />
                  </ReferenceArrayInput>
                  {showContactCreate && (
                    <QuickCreateContactPopover
                      name={pendingContactName}
                      organizationId={customerOrganizationId}
                      salesId={identity?.id}
                      onCreated={handleContactCreated}
                      onCancel={handleCancelContactCreate}
                    >
                      <span />
                    </QuickCreateContactPopover>
                  )}
                </>
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
            <ContactOrgMismatchWarning />
          </div>

          {/* Products */}
          <div>
            <div className="mb-2">
              <h4 className="text-sm font-medium">Products *</h4>
              <p className="text-xs text-muted-foreground">
                {principalOrganizationId
                  ? "At least one product is required (filtered by selected Principal)"
                  : "At least one product is required (select Principal Organization to filter)"}
              </p>
            </div>
            <div data-tutorial="opp-products">
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
          </div>
        </div>
      </CollapsibleSection>

      {/* Collapsible: Classification */}
      <CollapsibleSection title="Classification" data-tutorial="opp-section-classification">
        <div className="space-y-4">
          <CompactFormRow>
            <div data-tutorial="opp-lead-source">
              <TextInput source="lead_source" label="Lead Source" helperText={false} />
            </div>
            <div data-tutorial="opp-campaign">
              <TextInput
                source="campaign"
                label="Campaign"
                helperText={false}
                placeholder="e.g., Q4 2025 Trade Show"
              />
            </div>
          </CompactFormRow>
          <ArrayInput source="tags" label="Tags">
            <SimpleFormIterator inline disableReordering>
              <TextInput source="" label={false} helperText={false} placeholder="Add tag" />
            </SimpleFormIterator>
          </ArrayInput>
        </div>
      </CollapsibleSection>

      {/* Collapsible: Additional Details */}
      <CollapsibleSection title="Additional Details" data-tutorial="opp-section-details">
        <div className="space-y-4">
          <div data-tutorial="opp-description">
            <TextInput
              source="description"
              label="Description"
              multiline
              rows={2}
              helperText={false}
            />
          </div>
          <CompactFormRow>
            <div data-tutorial="opp-next-action">
              <TextInput
                source="next_action"
                label="Next Action"
                helperText={false}
                placeholder="e.g., Follow up with decision maker"
              />
            </div>
            <div data-tutorial="opp-next-action-date">
              <TextInput
                source="next_action_date"
                label="Next Action Date"
                helperText={false}
                type="date"
              />
            </div>
          </CompactFormRow>
          <TextInput
            source="decision_criteria"
            label="Decision Criteria"
            multiline
            rows={2}
            helperText={false}
            placeholder="Key factors influencing the decision..."
          />
          {mode === "edit" && (
            <ReferenceInput source="related_opportunity_id" reference="opportunities">
              <SelectInput optionText="name" label="Related Opportunity" helperText={false} />
            </ReferenceInput>
          )}
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
