import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";

export const ProductRelationshipsTab = () => {
  return (
    <div className="space-y-4">
      <ReferenceInput
        source="principal_id"
        reference="organizations"
        label="Principal/Supplier *"
        filter={{ organization_type: "principal" }}
      >
        <AutocompleteInput
          optionText="name"
          helperText="Select the supplier organization"
        />
      </ReferenceInput>
      <ReferenceInput
        source="distributor_id"
        reference="organizations"
        label="Distributor"
        filter={{ organization_type: "distributor" }}
      >
        <AutocompleteInput
          optionText="name"
          helperText="Select the distributor organization"
        />
      </ReferenceInput>
    </div>
  );
};
