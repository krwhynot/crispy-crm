import { useMemo } from "react";
import { ReferenceInput } from "@/components/admin/reference-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { CreateInDialogButton } from "@/components/admin/create-in-dialog-button";
import { useWatch, useFormContext } from "react-hook-form";
import { useGetIdentity } from "ra-core";
import { TextInput } from "@/components/admin/text-input";
import { contactOptionText } from "../../../contacts/ContactOption";
import { AutocompleteOrganizationInput } from "../../../organizations/AutocompleteOrganizationInput";
import { OrganizationInputs } from "../../../organizations/OrganizationInputs";
import { ContactInputs } from "../../../contacts/ContactInputs";
import { ContactOrgMismatchWarning } from "../../components/ContactOrgMismatchWarning";
import { DistributorAuthorizationWarning } from "../../components/DistributorAuthorizationWarning";
import { DEFAULT_SEGMENT_ID } from "../../../constants";
import { organizationSchema } from "../../../validation/organizations";
import { contactBaseSchema } from "../../../validation/contacts";

// Schema-derived defaults for inline dialogs
const organizationDefaults = organizationSchema.partial().parse({});
const contactDefaults = contactBaseSchema.partial().parse({});

export const OpportunityRelationshipsTab = () => {
  const { data: identity } = useGetIdentity();
  const { setValue, getValues } = useFormContext();
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

  return (
    <div className="space-y-6">
      {/* Customer Organization */}
      <div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
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
        </div>
      </div>

      {/* Account Manager */}
      <ReferenceInput source="account_manager_id" reference="sales">
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

      {/* Principal Organization */}
      <div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
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
        </div>
      </div>

      {/* Distributor Organization */}
      <div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
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
        </div>

        {/* Soft warning when distributor is not authorized for principal */}
        <DistributorAuthorizationWarning />
      </div>

      {/* Contacts */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-sm font-medium">Contacts *</h4>
            <p className="text-xs text-muted-foreground">
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
                ...contactDefaults,
                organization_id: customerOrganizationId,
                sales_id: identity?.id,
                first_seen: new Date().toISOString(),
                last_seen: new Date().toISOString(),
              }}
              onSave={(record) => {
                const currentContacts = getValues("contact_ids") || [];
                setValue("contact_ids", [...currentContacts, record.id]);
              }}
            >
              <ContactInputs />
            </CreateInDialogButton>
          )}
        </div>
        <div data-tutorial="opp-contacts">
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

        {/* Soft warning when contacts belong to different org than customer */}
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
  );
};
