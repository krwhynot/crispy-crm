import { ReferenceInput, AutocompleteInput } from "react-admin";
import { PARENT_ELIGIBLE_TYPES } from "@/atomic-crm/validation/organizations";

/**
 * Input field for selecting parent organization.
 * Filters to only show parent-eligible organizations (distributor, customer, principal)
 * that don't already have a parent themselves (no grandchildren).
 */
export function ParentOrganizationInput() {
  return (
    <ReferenceInput
      source="parent_id"
      reference="organizations"
      filter={{
        organization_type: { $in: PARENT_ELIGIBLE_TYPES },
        parent_organization_id: { $null: true }, // Only standalone orgs
      }}
      sort={{ field: "name", order: "ASC" }}
    >
      <AutocompleteInput
        label="Parent Organization (optional)"
        optionText={(choice: any) => (choice ? `${choice.name} (${choice.organization_type})` : "")}
        filterToQuery={(searchText: string) => ({
          name: { $ilike: `%${searchText}%` },
        })}
        helperText="Select a corporate HQ or main entity. Only distributor, customer, and principal organizations can be parents."
      />
    </ReferenceInput>
  );
}
