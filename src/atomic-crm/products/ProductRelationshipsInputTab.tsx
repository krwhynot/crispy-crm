import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";

/**
 * Relationships INPUT tab for ProductCreate form.
 *
 * Contains form inputs for selecting:
 * - Principal Organization (required)
 * - Distributor Organization (optional)
 *
 * NOTE: This is distinct from ProductRelationshipsTab which is a
 * read-only display component for viewing existing records.
 */
export const ProductRelationshipsInputTab = () => {
  return (
    <div className="space-y-2">
      <div data-tutorial="product-principal">
        <ReferenceInput
          source="principal_id"
          reference="organizations"
          label="Principal/Supplier *"
          filter={{ organization_type: "principal" }}
        >
          <AutocompleteInput
            optionText="name"
            helperText="Required - Select the manufacturing principal"
          />
        </ReferenceInput>
      </div>

      <div data-tutorial="product-distributor">
        <ReferenceInput
          source="distributor_id"
          reference="organizations"
          label="Distributor"
          filter={{ organization_type: "distributor" }}
        >
          <AutocompleteInput
            optionText="name"
            helperText="Optional - Select a distributor if applicable"
          />
        </ReferenceInput>
      </div>
    </div>
  );
};
