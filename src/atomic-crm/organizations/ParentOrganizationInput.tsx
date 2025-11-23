import { ReferenceInput } from "@/components/admin/reference-input";
import { useRecordContext } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";

/**
 * Simple parent organization input without branch management features
 * Allows selecting a parent organization from existing organizations
 */
export const ParentOrganizationInput = () => {
  const record = useRecordContext<{ id?: number; parent_organization_id?: number }>();

  return (
    <ReferenceInput
      source="parent_organization_id"
      reference="organizations"
      filter={record?.id ? { "id@neq": record.id } : {}} // Exclude self
    >
      <AutocompleteInput
        label="Parent Organization"
        emptyText="No parent organization"
        helperText="Select a parent organization if this is a branch location"
        optionText="name"
        filterToQuery={(searchText) => ({ "name@ilike": `%${searchText}%` })}
      />
    </ReferenceInput>
  );
};
