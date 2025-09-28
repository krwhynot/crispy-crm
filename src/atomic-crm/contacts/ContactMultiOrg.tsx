import { ArrayInput } from "@/components/admin/array-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { useFormContext, useInput, useRecordContext } from "ra-core";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type {
  ContactOrganization,
  ContactRole,
  PurchaseInfluence,
  DecisionAuthority,
} from "../types";

// Define choices for SelectInputs based on tests
const contactRoleChoices: { id: ContactRole; name: string }[] = [
  { id: "decision_maker", name: "Decision Maker" },
  { id: "influencer", name: "Influencer" },
  { id: "buyer", name: "Buyer" },
  { id: "end_user", name: "End User" },
  { id: "gatekeeper", name: "Gatekeeper" },
  { id: "champion", name: "Champion" },
  { id: "technical", name: "Technical" },
  { id: "executive", name: "Executive" },
];

const purchaseInfluenceChoices: { id: PurchaseInfluence; name: string }[] = [
  { id: "High", name: "High" },
  { id: "Medium", name: "Medium" },
  { id: "Low", name: "Low" },
  { id: "Unknown", name: "Unknown" },
];

const decisionAuthorityChoices: { id: DecisionAuthority; name: string }[] = [
  { id: "Decision Maker", name: "Decision Maker" },
  { id: "Influencer", name: "Influencer" },
  { id: "End User", name: "End User" },
  { id: "Gatekeeper", name: "Gatekeeper" },
];

interface ContactMultiOrgProps {
  source?: string; // The source field for the ArrayInput, defaults to "contact_organizations"
}

export const ContactMultiOrg = (props: ContactMultiOrgProps) => {
  const { source = "contact_organizations" } = props;

  // Validation removed per Engineering Constitution - single-point validation at API boundary only
  // Primary organization validation will be handled by Zod schema in data provider

  return (
    <ArrayInput
      source={source}
      label="Associated Organizations"
      helperText="At least one organization required, with exactly one marked as primary"
    >
      <SimpleFormIterator
        getItemLabel={(index: number) => `Organization #${index + 1}`}
        disableReordering
        fullWidth
      >
        <div className="flex flex-col gap-4 p-4 border rounded-md mb-4">
          <ReferenceInput
            source="organization_id"
            reference="organizations"
            label="Organization *"
            helperText="Required field"
          >
            <SelectInput optionText="name" emptyText="Select an organization" />
          </ReferenceInput>

          <SelectInput
            source="role"
            choices={contactRoleChoices}
            label="Role"
            helperText={false}
            emptyText="Select role"
          />

          <SelectInput
            source="purchase_influence"
            choices={purchaseInfluenceChoices}
            label="Purchase Influence"
            helperText={false}
            emptyText="Select influence level"
          />

          <SelectInput
            source="decision_authority"
            choices={decisionAuthorityChoices}
            label="Decision Authority"
            helperText={false}
            emptyText="Select authority level"
          />

          <PrimaryOrganizationCheckbox
            source="is_primary_organization"
            label="Primary Organization"
          />
        </div>
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Custom Checkbox to handle the "only one primary" logic within the ArrayInput
const PrimaryOrganizationCheckbox = (props: {
  source: string;
  label: string;
}) => {
  const { source, label } = props;
  const { field, fieldState } = useInput({ source });
  const { getValues, setValue } = useFormContext();
  const record = useRecordContext<ContactOrganization>(); // Context for the current item in ArrayInput

  const handleToggle = (checked: boolean) => {
    field.onChange(checked); // Update the current field

    if (checked) {
      // If this one is becoming primary, unmark all others
      const currentOrganizations = getValues(
        "contact_organizations",
      ) as ContactOrganization[];
      if (currentOrganizations) {
        currentOrganizations.forEach((org, index) => {
          // Check if it's a different organization and it's currently primary
          if (org && org.id !== record?.id && org.is_primary_organization) {
            setValue(
              `contact_organizations.${index}.is_primary_organization`,
              false,
              { shouldDirty: true },
            );
          }
        });
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={field.name}
        checked={field.value || false}
        onCheckedChange={handleToggle}
        className={cn(fieldState.error && "border-destructive")}
      />
      <Label
        htmlFor={field.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </Label>
      {fieldState.error && (
        <p className="text-sm font-medium text-destructive">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
};
