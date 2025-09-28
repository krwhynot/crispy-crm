import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { NumberInput } from "@/components/admin/number-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

export const ProductInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-4 p-1">
      <ProductBasicInputs />
      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="flex flex-col gap-10 flex-1">
          <ProductDetailInputs />
          <ProductPricingInputs />
        </div>
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <div className="flex flex-col gap-8 flex-1">
          <ProductInventoryInputs />
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
      <div className="flex gap-4">
        <TextInput
          source="sku"
          className="flex-1"
          helperText="Required field"
          placeholder="SKU-123"
          label="SKU *"
        />
        <TextInput
          source="brand"
          className="flex-1"
          placeholder="Brand name"
          label="Brand"
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
      <TextInput
        source="manufacturer_part_number"
        label="Manufacturer Part Number"
        placeholder="MFG-12345"
        helperText="External product identifier"
      />
      <SelectInput
        source="unit_of_measure"
        label="Unit of Measure"
        defaultValue="each"
        choices={[
          { id: "each", name: "Each" },
          { id: "case", name: "Case" },
          { id: "box", name: "Box" },
          { id: "pound", name: "Pound" },
          { id: "kilogram", name: "Kilogram" },
          { id: "liter", name: "Liter" },
          { id: "gallon", name: "Gallon" },
          { id: "dozen", name: "Dozen" },
          { id: "pallet", name: "Pallet" },
          { id: "hour", name: "Hour" },
          { id: "license", name: "License" },
        ]}
        helperText="What the price refers to"
      />
    </div>
  );
};

const ProductPricingInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Pricing</h6>
      <div className="flex gap-4">
        <NumberInput
          source="list_price"
          label="List Price"
          placeholder="0.00"
          helperText="Selling price to customers"
          step={0.01}
          className="flex-1"
        />
        <SelectInput
          source="currency_code"
          label="Currency"
          defaultValue="USD"
          choices={[
            { id: "USD", name: "USD" },
            { id: "EUR", name: "EUR" },
            { id: "GBP", name: "GBP" },
            { id: "CAD", name: "CAD" },
            { id: "AUD", name: "AUD" },
            { id: "JPY", name: "JPY" },
            { id: "CNY", name: "CNY" },
            { id: "MXN", name: "MXN" },
          ]}
          className="w-32"
        />
      </div>
      <NumberInput
        source="cost_per_unit"
        label="Cost per Unit"
        placeholder="0.00"
        helperText="Your cost from supplier"
        step={0.01}
      />
    </div>
  );
};

const ProductInventoryInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Order Requirements</h6>
      <NumberInput
        source="minimum_order_quantity"
        label="Minimum Order Quantity"
        placeholder="1"
        defaultValue={1}
        helperText="Minimum units required per order"
        step={1}
        min={1}
      />
    </div>
  );
};

const ProductClassificationInputs = () => {
  const productCategories = [
    { id: "equipment", name: "Equipment" },
    { id: "beverages", name: "Beverages" },
    { id: "dairy", name: "Dairy" },
    { id: "frozen", name: "Frozen" },
    { id: "fresh_produce", name: "Fresh Produce" },
    { id: "meat_poultry", name: "Meat & Poultry" },
    { id: "seafood", name: "Seafood" },
    { id: "dry_goods", name: "Dry Goods" },
    { id: "snacks", name: "Snacks" },
    { id: "condiments", name: "Condiments" },
    { id: "baking_supplies", name: "Baking Supplies" },
    { id: "spices_seasonings", name: "Spices & Seasonings" },
    { id: "canned_goods", name: "Canned Goods" },
    { id: "pasta_grains", name: "Pasta & Grains" },
    { id: "oils_vinegars", name: "Oils & Vinegars" },
    { id: "sweeteners", name: "Sweeteners" },
    { id: "cleaning_supplies", name: "Cleaning Supplies" },
    { id: "paper_products", name: "Paper Products" },
    { id: "other", name: "Other" },
  ];

  const productStatuses = [
    { id: "active", name: "Active" },
    { id: "discontinued", name: "Discontinued" },
    { id: "pending", name: "Pending" },
    { id: "seasonal", name: "Seasonal" },
    { id: "out_of_stock", name: "Out of Stock" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Classification</h6>
      <SelectInput
        source="category"
        label="Category *"
        choices={productCategories}
        helperText="Required field"
      />
      <TextInput
        source="subcategory"
        label="Subcategory"
        placeholder="Optional subcategory"
      />
      <SelectInput
        source="status"
        label="Status *"
        choices={productStatuses}
        helperText="Product availability status"
      />
    </div>
  );
};