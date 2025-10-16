import * as React from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { ReferenceInput } from "@/components/admin/reference-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { AutocompleteOrganizationInput } from "@/atomic-crm/organizations/AutocompleteOrganizationInput";
import { useFormContext, useWatch } from "react-hook-form";
import { useSimpleFormIterator } from "@/hooks/simple-form-iterator-context";
import type { ContactOrganization } from "../types";

const AddOrganizationButton = () => {
  const { add } = useSimpleFormIterator();
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => add()}>
      <Plus className="h-4 w-4 mr-2" />
      Add Organization
    </Button>
  );
};

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
            addButton={<AddOrganizationButton />}
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
              <BooleanInput
                source="is_primary"
                label="Primary Organization"
                helperText={false}
              />
            </div>
          </SimpleFormIterator>
        </ArrayInput>
      </Card>
    </div>
  );
};
