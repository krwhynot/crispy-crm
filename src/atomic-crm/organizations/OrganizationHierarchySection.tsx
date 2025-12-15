import { SelectInput } from "@/components/admin/select-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { CollapsibleSection, CompactFormRow } from "@/components/admin/form";
import { ParentOrganizationInput } from "./ParentOrganizationInput";
import { ORG_SCOPE_CHOICES } from "./constants";

export const OrganizationHierarchySection = () => {
  return (
    <CollapsibleSection title="Organization Hierarchy">
      <div className="space-y-4">
        <ParentOrganizationInput />
        <CompactFormRow>
          <SelectInput
            source="org_scope"
            label="Scope"
            choices={ORG_SCOPE_CHOICES}
            helperText="National = brand/HQ, Regional = operating company"
            emptyText="Select scope"
          />
          <BooleanInput
            source="is_operating_entity"
            label="Operating Entity"
            helperText="Where business transactions occur"
          />
        </CompactFormRow>
      </div>
    </CollapsibleSection>
  );
};
