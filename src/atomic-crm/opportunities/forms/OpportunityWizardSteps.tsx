/**
 * Opportunity Wizard Step Components
 *
 * Provides field groupings for the multi-step wizard pattern.
 * Each step is a self-contained component that can be used within WizardStep.
 */
import { useMemo, useEffect, useRef, useState } from "react";
import { TextInput } from "@/components/admin/text-input";
import { TextInputWithCounter } from "@/components/admin/text-input/";
import { ReferenceInput } from "@/components/admin/reference-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import {
  CompactFormRow,
  CompactFormFieldWithButton,
  FormFieldWrapper,
} from "@/components/admin/form";
import { CreateInDialogButton } from "@/components/admin/create-in-dialog-button";
import { useWatch, useFormContext } from "react-hook-form";
import { useGetIdentity, useRefresh } from "ra-core";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AutocompleteOrganizationInput } from "../../organizations/AutocompleteOrganizationInput";
import { OrganizationInputs } from "../../organizations/OrganizationInputs";
import { contactOptionText } from "../../contacts/ContactOption";
import { QuickCreateContactPopover } from "../../contacts/QuickCreateContactPopover";
import { ContactOrgMismatchWarning } from "../components/ContactOrgMismatchWarning";
import { DistributorAuthorizationWarning } from "../components/DistributorAuthorizationWarning";
import { CustomerDistributorIndicator } from "../components/CustomerDistributorIndicator";
import { NamingConventionHelp } from "./NamingConventionHelp";
import { OPPORTUNITY_STAGE_CHOICES } from "../constants/stageConstants";
import { DEFAULT_SEGMENT_ID } from "../../constants";
import { organizationSchema } from "../../validation/organizations";
import { saleOptionRenderer } from "../../utils/saleOptionRenderer";
import { useAutoGenerateName, useCustomerDistributors } from "../hooks";
import type { WizardStepConfig } from "@/components/admin/form";

const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

const organizationDefaults = organizationSchema.partial().parse({});

/**
 * Wizard step configuration for Opportunities
 * 4 steps following Miller's Law (7±2 items max per cognitive chunk)
 */
export const OPPORTUNITY_WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: "basic",
    title: "Basic Information",
    fields: ["name", "customer_organization_id"],
  },
  {
    id: "pipeline",
    title: "Pipeline & Team",
    fields: ["stage", "priority", "estimated_close_date"],
  },
  {
    id: "relationships",
    title: "Contacts & Products",
    fields: [], // Optional step - no required validation
  },
  {
    id: "details",
    title: "Additional Details",
    fields: [], // Optional step - no required validation
  },
];

/**
 * Step 1: Basic Information
 * Name, Customer Organization, Principal Organization
 */
export function OpportunityWizardStep1() {
  const { data: identity } = useGetIdentity();
  const { setValue } = useFormContext();
  const { regenerate, isLoading, canGenerate } = useAutoGenerateName("create");

  return (
    <div className="space-y-4">
      {/* Opportunity Name */}
      <FormFieldWrapper name="name" isRequired>
        <div className="flex gap-2 items-start">
          <div className="flex-1" data-tutorial="opp-name">
            <TextInput source="name" label="Opportunity Name" helperText={false} />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 mt-6 flex-shrink-0"
                onClick={regenerate}
                disabled={!canGenerate || isLoading}
                aria-label="Regenerate name"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canGenerate
                ? "Regenerate name from Principal and Customer"
                : "Select Customer or Principal first"}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-2">
          <NamingConventionHelp />
        </div>
      </FormFieldWrapper>

      {/* Customer Organization */}
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
          <FormFieldWrapper name="customer_organization_id" isRequired>
            <div data-tutorial="opp-customer">
              <ReferenceInput
                source="customer_organization_id"
                reference="organizations"
                filter={{ "organization_type@in": "(prospect,customer)" }}
              >
                <AutocompleteOrganizationInput
                  label="Customer Organization"
                  organizationType="customer"
                />
              </ReferenceInput>
            </div>
          </FormFieldWrapper>
        </CompactFormFieldWithButton>
      </CompactFormRow>

      {/* Principal Organization */}
      <CompactFormRow>
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
          <FormFieldWrapper name="principal_organization_id">
            <div data-tutorial="opp-principal">
              <ReferenceInput
                source="principal_organization_id"
                reference="organizations"
                filter={{ organization_type: "principal" }}
              >
                <AutocompleteOrganizationInput
                  label="Principal Organization"
                  organizationType="principal"
                />
              </ReferenceInput>
            </div>
          </FormFieldWrapper>
        </CompactFormFieldWithButton>
      </CompactFormRow>
    </div>
  );
}

/**
 * Step 2: Pipeline & Team
 * Stage, Priority, Close Date, Account Manager, Distributor
 *
 * Distributor Auto-Selection:
 * - When customer is selected in Step 1, we query their existing distributor relationships
 * - If the customer has a primary distributor and no distributor is selected, auto-select it
 * - Visual indicators show relationship status (primary, related, or unrelated)
 */
export function OpportunityWizardStep2() {
  const { data: identity } = useGetIdentity();
  const { setValue, getValues } = useFormContext();

  // Watch customer selection from Step 1
  const customerId = useWatch({ name: "customer_organization_id" });

  // Fetch distributor relationships for the selected customer
  const { primaryDistributorId, isLoading } = useCustomerDistributors(customerId);

  // Track the last customer ID we processed to prevent re-triggering on unrelated changes
  const lastProcessedCustomerRef = useRef<typeof customerId>(null);

  // Auto-select primary distributor when customer changes
  useEffect(() => {
    // Skip if:
    // - Still loading relationships
    // - No primary distributor exists
    // - We already processed this customer (prevents infinite loops)
    // - Customer hasn't changed
    if (isLoading || !primaryDistributorId || lastProcessedCustomerRef.current === customerId) {
      return;
    }

    // Update the ref to mark this customer as processed
    lastProcessedCustomerRef.current = customerId;

    // Only auto-fill if distributor field is empty (don't override user selection)
    const currentDistributor = getValues("distributor_organization_id");
    if (!currentDistributor) {
      setValue("distributor_organization_id", primaryDistributorId, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [customerId, primaryDistributorId, isLoading, getValues, setValue]);

  return (
    <div className="space-y-4">
      {/* Stage, Priority, Close Date row */}
      <CompactFormRow columns="md:grid-cols-3">
        <FormFieldWrapper name="stage" isRequired>
          <div data-tutorial="opp-stage">
            <SelectInput
              source="stage"
              label="Stage"
              choices={OPPORTUNITY_STAGE_CHOICES}
              helperText={false}
            />
          </div>
        </FormFieldWrapper>
        <FormFieldWrapper name="priority" isRequired>
          <div data-tutorial="opp-priority">
            <SelectInput
              source="priority"
              label="Priority"
              choices={priorityChoices}
              helperText={false}
            />
          </div>
        </FormFieldWrapper>
        <FormFieldWrapper name="estimated_close_date" isRequired>
          <div data-tutorial="opp-close-date">
            <TextInput
              source="estimated_close_date"
              label="Est. Close Date"
              helperText="Defaults to 30 days from today"
              type="date"
            />
          </div>
        </FormFieldWrapper>
      </CompactFormRow>

      {/* Account Manager & Distributor row */}
      <CompactFormRow>
        <CompactFormFieldWithButton>
          <FormFieldWrapper name="account_manager_id">
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
          </FormFieldWrapper>
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
          footer={
            <div className="space-y-1">
              <CustomerDistributorIndicator />
              <DistributorAuthorizationWarning />
            </div>
          }
        >
          <FormFieldWrapper name="distributor_organization_id">
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
          </FormFieldWrapper>
        </CompactFormFieldWithButton>
      </CompactFormRow>
    </div>
  );
}

/**
 * Step 3: Contacts & Products
 * Contact selection and product configuration
 */
export function OpportunityWizardStep3() {
  const { data: identity } = useGetIdentity();
  const { setValue, getValues } = useFormContext();
  const refresh = useRefresh();

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

  // Inline contact creation state
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
    <div className="space-y-6">
      {/* Contacts Section */}
      <div>
        <div className="mb-2">
          <h4 className="text-sm font-medium">Contacts</h4>
          <p className="text-xs text-muted-foreground">
            {customerOrganizationId
              ? "Select contacts from the customer organization (type to search or create)"
              : "Please select a Customer Organization first (Step 1)"}
          </p>
        </div>
        <FormFieldWrapper name="contact_ids">
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
        </FormFieldWrapper>
        <ContactOrgMismatchWarning />
      </div>

      {/* Products Section */}
      <div>
        <div className="mb-2">
          <h4 className="text-sm font-medium">Products</h4>
          <p className="text-xs text-muted-foreground">
            {principalOrganizationId
              ? "Add products from the selected Principal (filtered)"
              : "Select a Principal Organization (Step 1) to filter products"}
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
  );
}

/**
 * Step 4: Additional Details
 * Classification, notes, and optional fields
 */
export function OpportunityWizardStep4() {
  return (
    <div className="space-y-6">
      {/* Classification */}
      <div>
        <h4 className="text-sm font-medium mb-3">Classification</h4>
        <CompactFormRow>
          <FormFieldWrapper name="lead_source">
            <div data-tutorial="opp-lead-source">
              <TextInput source="lead_source" label="Lead Source" helperText={false} />
            </div>
          </FormFieldWrapper>
          <FormFieldWrapper name="campaign">
            <div data-tutorial="opp-campaign">
              <TextInput
                source="campaign"
                label="Campaign"
                helperText={false}
                placeholder="e.g., Q4 2025 Trade Show"
              />
            </div>
          </FormFieldWrapper>
        </CompactFormRow>
        <ArrayInput source="tags" label="Tags">
          <SimpleFormIterator inline disableReordering>
            <TextInput source="" label={false} helperText={false} placeholder="Add tag" />
          </SimpleFormIterator>
        </ArrayInput>
      </div>

      {/* Notes & Actions */}
      <div>
        <h4 className="text-sm font-medium mb-3">Notes & Actions</h4>
        <FormFieldWrapper name="description">
          <div data-tutorial="opp-description">
            <TextInputWithCounter
              source="description"
              label="Description"
              multiline
              rows={2}
              maxLength={2000}
            />
          </div>
        </FormFieldWrapper>
        <CompactFormRow>
          <FormFieldWrapper name="next_action">
            <div data-tutorial="opp-next-action">
              <TextInput
                source="next_action"
                label="Next Action"
                helperText={false}
                placeholder="e.g., Follow up with decision maker"
              />
            </div>
          </FormFieldWrapper>
          <FormFieldWrapper name="next_action_date">
            <div data-tutorial="opp-next-action-date">
              <TextInput
                source="next_action_date"
                label="Next Action Date"
                helperText={false}
                type="date"
              />
            </div>
          </FormFieldWrapper>
        </CompactFormRow>
        <FormFieldWrapper name="decision_criteria">
          <TextInputWithCounter
            source="decision_criteria"
            label="Decision Criteria"
            multiline
            rows={2}
            maxLength={2000}
            placeholder="Key factors influencing the decision..."
          />
        </FormFieldWrapper>
        <FormFieldWrapper name="notes">
          <TextInputWithCounter source="notes" label="Notes" multiline rows={4} maxLength={2000} />
        </FormFieldWrapper>
      </div>
    </div>
  );
}
