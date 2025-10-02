import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { ReferenceInput } from "@/components/admin/reference-input";
import { NumberInput } from "@/components/admin/number-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { useWatch } from "react-hook-form";

/**
 * OpportunityProductsInput - Array input for opportunity product line items
 *
 * Following Engineering Constitution:
 * - Uses ArrayInput + SimpleFormIterator pattern (NOT raw useFieldArray)
 * - Filters products by principal_organization_id
 * - Extended price is a GENERATED column - display only
 */

const UNIT_OF_MEASURE_CHOICES = [
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
];

export const OpportunityProductsInput = () => {
  // Watch principal_organization_id to filter products
  const principalId = useWatch({ name: "principal_organization_id" });
  const products = useWatch({ name: "products" }) || [];

  return (
    <div className="flex flex-col gap-4">
      {/* Empty state when no products */}
      {products.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {!principalId
              ? "Select a Principal Organization above to add products"
              : "No products added yet. Click the + button below to add your first product."}
          </p>
        </div>
      )}

      {/* Column Headers - Desktop only */}
      {products.length > 0 && (
        <div className="hidden md:grid grid-cols-[minmax(200px,1fr)_80px_100px_100px_100px_100px_minmax(150px,1fr)_80px] gap-2 px-2 pb-2 border-b text-sm font-medium text-muted-foreground">
          <div>Product</div>
          <div>Qty</div>
          <div>Unit Price</div>
          <div>Unit</div>
          <div>Discount %</div>
          <div>Extended</div>
          <div>Notes</div>
          <div className="text-right">Actions</div>
        </div>
      )}

      <ArrayInput source="products" label={false} helperText={false}>
        <SimpleFormIterator>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(200px,1fr)_80px_100px_100px_100px_100px_minmax(150px,1fr)] gap-2">
            <ReferenceInput
              source="product_id_reference"
              reference="products"
              filter={{ principal_id: principalId }}
              sort={{ field: "name", order: "ASC" }}
              label="Product"
            >
              <SelectInput
                optionText="name"
                helperText={false}
                label={false}
                disabled={!principalId}
                placeholder="Select product..."
              />
            </ReferenceInput>

            <NumberInput
              source="quantity"
              defaultValue={1}
              min={1}
              step={1}
              helperText={false}
              label={false}
              placeholder="Qty"
            />

            <NumberInput
              source="unit_price"
              step={0.01}
              min={0}
              helperText={false}
              label={false}
              placeholder="Unit Price"
            />

            <SelectInput
              source="unit_of_measure"
              choices={UNIT_OF_MEASURE_CHOICES}
              defaultValue="each"
              helperText={false}
              label={false}
            />

            <NumberInput
              source="discount_percent"
              min={0}
              max={100}
              step={0.1}
              defaultValue={0}
              helperText={false}
              label={false}
              placeholder="Discount %"
            />

            <NumberInput
              source="extended_price"
              disabled
              helperText={false}
              label={false}
              placeholder="Extended Price"
              className="bg-muted"
            />

            <TextInput
              source="notes"
              multiline
              rows={1}
              helperText={false}
              label={false}
              placeholder="Notes..."
            />
          </div>
        </SimpleFormIterator>
      </ArrayInput>

      {!principalId && (
        <p className="text-sm text-muted-foreground">
          Select a principal organization to add products
        </p>
      )}
    </div>
  );
};
