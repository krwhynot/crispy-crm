import { TextInput } from "@/components/ra-wrappers/text-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { FormFieldWrapper } from "@/components/ra-wrappers/form";
import { PRODUCT_STATUSES, PRODUCT_CATEGORIES } from "../validation/products";
import { enableGetChoices, getQSearchAutocompleteProps } from "../utils/autocompleteDefaults";
import { formatFieldLabel } from "@/atomic-crm/utils";

/**
 * Product Details tab for ProductCreate/ProductEdit forms.
 *
 * Contains all essential product fields:
 * - name (required)
 * - principal_id (required)
 * - category (required)
 * - status (required)
 * - description (optional)
 */
export const ProductDetailsInputTab = () => {
  const productCategories = PRODUCT_CATEGORIES.map((category) => ({
    id: category,
    name: formatFieldLabel(category),
  }));

  const productStatuses = PRODUCT_STATUSES.map((status) => ({
    id: status,
    name: formatFieldLabel(status),
  }));

  const handleCreateCategory = (categoryName?: string) => {
    if (!categoryName) return;
    return { id: categoryName, name: categoryName };
  };

  return (
    <div className="space-y-2">
      <div data-tutorial="product-name">
        <FormFieldWrapper name="name" isRequired>
          <TextInput
            source="name"
            className="w-full"
            helperText="Required field"
            placeholder="Product name"
            label="Product Name *"
          />
        </FormFieldWrapper>
      </div>

      <div data-tutorial="product-principal">
        <FormFieldWrapper name="principal_id" isRequired>
          <ReferenceInput
            source="principal_id"
            reference="organizations"
            label="Principal/Supplier *"
            filter={{ organization_type: "principal" }}
            enableGetChoices={enableGetChoices}
          >
            <AutocompleteInput
              {...getQSearchAutocompleteProps()}
              optionText="name"
              helperText="Required - Select the manufacturing principal"
            />
          </ReferenceInput>
        </FormFieldWrapper>
      </div>

      <div data-tutorial="product-category">
        <FormFieldWrapper name="category" isRequired>
          <AutocompleteInput
            source="category"
            label="Category *"
            choices={productCategories}
            onCreate={handleCreateCategory}
            createItemLabel="Add custom category: %{item}"
            helperText="Select F&B category or type to create custom"
          />
        </FormFieldWrapper>
      </div>

      <div data-tutorial="product-status">
        <FormFieldWrapper name="status">
          <SelectInput source="status" label="Status *" choices={productStatuses} />
        </FormFieldWrapper>
      </div>

      <FormFieldWrapper name="description">
        <TextInput
          source="description"
          multiline
          rows={3}
          className="w-full"
          placeholder="Product description..."
          label="Description"
        />
      </FormFieldWrapper>
    </div>
  );
};
