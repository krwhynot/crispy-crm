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
