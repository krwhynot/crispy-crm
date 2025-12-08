import { TextInput } from "@/components/admin/text-input";

export const ProductGeneralTab = () => {
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
      <div data-tutorial="product-sku">
        <TextInput
          source="sku"
          className="w-full"
          helperText="Optional product identifier"
          placeholder="SKU-123"
          label="SKU"
        />
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
