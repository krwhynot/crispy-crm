import * as React from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { AutocompleteOrganizationInput } from "@/atomic-crm/organizations/AutocompleteOrganizationInput";
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
  const { setValue } = useFormContext();
  const organizationsRaw = useWatch({ name: "organizations" });

  // Validate that exactly one organization has is_primary = true
  React.useEffect(() => {
    const organizations = organizationsRaw || [];
    const primaryCount = organizations.filter(
      (org: ContactOrganization) => org.is_primary,
    ).length;

    if (primaryCount === 0 && organizations.length > 0) {
      // Set first organization as primary if none is marked
      const updatedOrgs = organizations.map((org: ContactOrganization, index: number) => ({
        ...org,
        is_primary: index === 0,
      }));
      setValue("organizations", updatedOrgs);
    } else if (primaryCount > 1) {
      // Ensure only the first primary remains primary
      let foundFirst = false;
      const updatedOrgs = organizations.map((org: ContactOrganization) => {
        if (org.is_primary && !foundFirst) {
          foundFirst = true;
          return org;
        }
        return { ...org, is_primary: false };
      });
      setValue("organizations", updatedOrgs);
    }
  }, [organizationsRaw, setValue]);

  return (
    <div className="space-y-4">
      <h6 className="text-md font-medium flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Associated Organizations
      </h6>

      {/* Organizations */}
      <Card className="p-4">
        <h6 className="text-sm font-medium mb-3">Organizations</h6>
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
              <ReferenceInput
                source="organization_id"
                reference="organizations"
                label="Organization"
              >
                <AutocompleteOrganizationInput />
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
                source="is_primary"
                label="Primary Organization"
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
