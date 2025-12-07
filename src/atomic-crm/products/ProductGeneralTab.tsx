import { TextInput } from "@/components/admin/text-input";

export const ProductGeneralTab = () => {
  return (
    <div className="space-y-2">
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
        helperText="Optional product identifier"
        placeholder="SKU-123"
        label="SKU"
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
