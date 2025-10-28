import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { PRODUCT_STATUSES, PRODUCT_CATEGORIES } from "../validation/products";

export const ProductInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-4 p-1">
      <ProductBasicInputs />
      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="flex flex-col gap-10 flex-1">
          <ProductDetailInputs />
        </div>
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <div className="flex flex-col gap-8 flex-1">
          <ProductClassificationInputs />
        </div>
      </div>
    </div>
  );
};

const ProductBasicInputs = () => {
  return (
    <div className="flex gap-4 flex-1 flex-col">
      <TextInput
        source="name"
        className="w-full"
        helperText="Required field"
        placeholder="Product name"
        label="Product Name *"
      />
      <TextInput
        source="sku"
        className="w-full"
        helperText="Required field"
        placeholder="SKU-123"
        label="SKU *"
      />
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

const ProductDetailInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Product Details</h6>
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

const ProductClassificationInputs = () => {
  // Derive all choices from Zod schema (Constitution Rule #5: Single Source of Truth)
  const productCategories = PRODUCT_CATEGORIES.map((category) => ({
    id: category,
    name: category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));

  const productStatuses = PRODUCT_STATUSES.map((status) => ({
    id: status,
    name: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));

  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Classification</h6>
      <SelectInput
        source="category"
        label="Category *"
        choices={productCategories}
        helperText="Required field"
      />
      <SelectInput
        source="status"
        label="Status *"
        choices={productStatuses}
      />
    </div>
  );
};