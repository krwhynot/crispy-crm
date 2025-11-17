import { ReferenceInput, AutocompleteInput, useRecordContext } from "react-admin";
import { PARENT_ELIGIBLE_TYPES } from "@/atomic-crm/validation/organizations";

/**
 * Input field for selecting parent organization.
 * Filters to only show parent-eligible organizations (distributor, customer, principal)
 * that don't already have a parent themselves (no grandchildren).
 * Excludes the current organization to prevent self-parenting.
 */
export function ParentOrganizationInput() {
  const record = useRecordContext();

  // Build filter using PostgREST operators
  const filter: Record<string, any> = {
    'organization_type@in': `(${PARENT_ELIGIBLE_TYPES.join(',')})`,
    'parent_organization_id@is': 'null', // Only standalone orgs
  };

  // Exclude current record when editing (prevent self-parenting)
  if (record?.id) {
    filter['id@neq'] = record.id;
  }

  return (
    <ReferenceInput
      source="parent_organization_id"
      reference="organizations"
      filter={filter}
      sort={{ field: "name", order: "ASC" }}
    >
      <AutocompleteInput
        label="Parent Organization (optional)"
        optionText={(choice: any) => (choice ? `${choice.name} (${choice.organization_type})` : "")}
        filterToQuery={(searchText: string) => ({
          'name@ilike': `%${searchText}%`,
        })}
        helperText="Select a corporate HQ or main entity. Only distributor, customer, and principal organizations can be parents."
      />
    </ReferenceInput>
  );
}
