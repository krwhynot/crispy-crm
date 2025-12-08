import { SelectInput } from "@/components/admin/select-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { PRODUCT_STATUSES, PRODUCT_CATEGORIES } from "../validation/products";

export const ProductClassificationTab = () => {
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
    </div>
  );
};
