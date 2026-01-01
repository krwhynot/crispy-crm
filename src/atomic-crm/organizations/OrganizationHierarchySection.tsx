import { SelectInput } from "@/components/admin/select-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { CollapsibleSection, CompactFormRow, FormFieldWrapper } from "@/components/admin/form";
import { ParentOrganizationInput } from "./ParentOrganizationInput";
import { ORG_SCOPE_CHOICES } from "./constants";

export const OrganizationHierarchySection = () => {
  return (
    <CollapsibleSection title="Organization Hierarchy">
      <div className="space-y-4">
        <FormFieldWrapper name="parent_organization_id">
          <ParentOrganizationInput />
        </FormFieldWrapper>
        <CompactFormRow>
          <FormFieldWrapper name="org_scope">
            <SelectInput
              source="org_scope"
              label="Scope"
              choices={ORG_SCOPE_CHOICES}
              helperText="National = brand/HQ, Regional = operating company"
              emptyText="Select scope"
            />
          </FormFieldWrapper>
          <div className="space-y-1">
            <FormFieldWrapper name="is_operating_entity">
              <BooleanInput
                source="is_operating_entity"
                label="This location processes orders"
                helperText={false}
              />
            </FormFieldWrapper>
            <p className="text-sm text-muted-foreground ml-11">
              <strong>ON:</strong> Orders and invoices happen here (e.g., Sysco Chicago)
              <br />
              <strong>OFF:</strong> Corporate brand or holding company only (e.g., Sysco
              Corporation)
            </p>
          </div>
        </CompactFormRow>
      </div>
    </CollapsibleSection>
  );
};
