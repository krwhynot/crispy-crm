import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";
import { PRODUCT_STATUSES, PRODUCT_CATEGORIES } from "../validation/products";

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
    name: category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  }));

  const productStatuses = PRODUCT_STATUSES.map((status) => ({
    id: status,
    name: status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  }));

  const handleCreateCategory = (categoryName?: string) => {
    if (!categoryName) return;
    return { id: categoryName, name: categoryName };
  };

  return (
    <div className="space-y-2">
      <div data-tutorial="product-name">
        <TextInput
          source="name"
          className="w-full"
          helperText="Required field"
          placeholder="Product name"
          label="Product Name *"
        />
      </div>

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

      <div data-tutorial="product-category">
        <AutocompleteInput
          source="category"
          label="Category *"
          choices={productCategories}
          onCreate={handleCreateCategory}
          createItemLabel="Add custom category: %{item}"
          helperText="Select F&B category or type to create custom"
        />
      </div>

      <div data-tutorial="product-status">
        <SelectInput source="status" label="Status *" choices={productStatuses} />
      </div>

      <TextInput
        source="description"
        multiline
        rows={3}
        className="w-full"
        placeholder="Product description..."
        label="Description"
      />
    </div>
  );
};
