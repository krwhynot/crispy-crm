import * as React from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrayInput,
  SimpleFormIterator,
  ReferenceInput,
  SelectInput,
  BooleanInput,
  RadioButtonGroupInput,
} from "@/components/admin";
import { AutocompleteCompanyInput } from "@/atomic-crm/companies/AutocompleteCompanyInput";
import { useFormContext, useWatch } from "react-hook-form";
import type { ContactOrganization } from "../types";

const roleChoices = [
  { id: "decision_maker", name: "Decision Maker" },
  { id: "influencer", name: "Influencer" },
  { id: "buyer", name: "Buyer" },
  { id: "end_user", name: "End User" },
  { id: "gatekeeper", name: "Gatekeeper" },
  { id: "champion", name: "Champion" },
  { id: "technical", name: "Technical" },
  { id: "executive", name: "Executive" },
];

const purchaseInfluenceChoices = [
  { id: "High", name: "High" },
  { id: "Medium", name: "Medium" },
  { id: "Low", name: "Low" },
  { id: "Unknown", name: "Unknown" },
];

const decisionAuthorityChoices = [
  { id: "Decision Maker", name: "Decision Maker" },
  { id: "Influencer", name: "Influencer" },
  { id: "End User", name: "End User" },
  { id: "Gatekeeper", name: "Gatekeeper" },
];

export const MultiOrganizationInput = () => {
  const { setValue, getValues } = useFormContext();
  const organizations = useWatch({ name: "organizations" }) || [];
  const primaryOrgId = useWatch({ name: "company_id" });
  const primaryRole = useWatch({ name: "role" });
  const primaryInfluence = useWatch({ name: "purchase_influence" });
  const primaryAuthority = useWatch({ name: "decision_authority" });
  const isPrimaryContact = useWatch({ name: "is_primary_contact" });

  // Sync primary organization with organizations array
  React.useEffect(() => {
    if (primaryOrgId) {
      const primaryOrgExists = organizations.some(
        (org: ContactOrganization) => org.organization_id === primaryOrgId
      );

      if (!primaryOrgExists && primaryOrgId !== undefined) {
        // Add primary organization to the array
        const updatedOrgs = [
          {
            organization_id: primaryOrgId,
            is_primary_contact: isPrimaryContact || false,
            role: primaryRole,
            purchase_influence: primaryInfluence || "Unknown",
            decision_authority: primaryAuthority || "End User",
          },
          ...organizations,
        ];
        setValue("organizations", updatedOrgs);
      } else if (primaryOrgExists) {
        // Update primary organization in the array
        const updatedOrgs = organizations.map((org: ContactOrganization) =>
          org.organization_id === primaryOrgId
            ? {
                ...org,
                is_primary_contact: isPrimaryContact || false,
                role: primaryRole,
                purchase_influence: primaryInfluence || org.purchase_influence,
                decision_authority: primaryAuthority || org.decision_authority,
              }
            : org
        );
        setValue("organizations", updatedOrgs);
      }
    }
  }, [primaryOrgId, primaryRole, primaryInfluence, primaryAuthority, isPrimaryContact]);

  return (
    <div className="space-y-4">
      <h6 className="text-md font-medium flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Associated Organizations
      </h6>

      {/* Primary Organization - backward compatibility */}
      <Card className="p-4">
        <h6 className="text-sm font-medium mb-3">Primary Organization</h6>
        <div className="space-y-3">
          <ReferenceInput source="company_id" reference="companies">
            <AutocompleteCompanyInput />
          </ReferenceInput>
          <SelectInput
            source="role"
            label="Role"
            choices={roleChoices}
            helperText={false}
            optionText="name"
            optionValue="id"
          />
          <BooleanInput
            source="is_primary_contact"
            label="Primary Contact for Organization"
            helperText={false}
          />
          <SelectInput
            source="purchase_influence"
            label="Purchase Influence"
            choices={purchaseInfluenceChoices}
            helperText={false}
            optionText="name"
            optionValue="id"
            defaultValue="Unknown"
          />
          <SelectInput
            source="decision_authority"
            label="Decision Authority"
            choices={decisionAuthorityChoices}
            helperText={false}
            optionText="name"
            optionValue="id"
            defaultValue="End User"
          />
        </div>
      </Card>

      {/* Additional Organizations */}
      <Card className="p-4">
        <h6 className="text-sm font-medium mb-3">Additional Organizations</h6>
        <ArrayInput source="organizations" label={false} helperText={false}>
          <SimpleFormIterator
            inline={false}
            addButton={
              <Button type="button" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            }
            className="space-y-4"
          >
            <div className="grid gap-3 p-3 border rounded-lg">
              <ReferenceInput source="organization_id" reference="companies" label="Organization">
                <AutocompleteCompanyInput />
              </ReferenceInput>
              <SelectInput
                source="role"
                label="Role"
                choices={roleChoices}
                helperText={false}
                optionText="name"
                optionValue="id"
              />
              <BooleanInput
                source="is_primary_contact"
                label="Primary Contact for this Organization"
                helperText={false}
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectInput
                  source="purchase_influence"
                  label="Purchase Influence"
                  choices={purchaseInfluenceChoices}
                  helperText={false}
                  optionText="name"
                  optionValue="id"
                  defaultValue="Unknown"
                />
                <SelectInput
                  source="decision_authority"
                  label="Decision Authority"
                  choices={decisionAuthorityChoices}
                  helperText={false}
                  optionText="name"
                  optionValue="id"
                  defaultValue="End User"
                />
              </div>
            </div>
          </SimpleFormIterator>
        </ArrayInput>
      </Card>
    </div>
  );
};