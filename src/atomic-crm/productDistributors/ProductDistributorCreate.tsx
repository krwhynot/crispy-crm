import { useMemo } from "react";
import { CreateBase, Form } from "ra-core";
import { useFormState } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { productDistributorSchema } from "../validation/productDistributors";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";

// Human-readable field labels for error messages
const FIELD_LABELS: Record<string, string> = {
  product_id: "Product",
  distributor_id: "Distributor",
  vendor_item_number: "DOT Number",
  status: "Status",
  valid_from: "Valid From",
  valid_to: "Valid To",
  notes: "Notes",
};

export const ProductDistributorCreate = () => {
  // Constitution Rule #4: Form state from schema
  const defaultValues = useMemo(
    () => productDistributorSchema.partial().parse({}),
    []
  );

  return (
    <CreateBase redirect="list">
      <div className="bg-muted mt-2 px-6 py-6">
        <Card>
          <CardContent>
            <Form defaultValues={defaultValues}>
              <ProductDistributorFormContent />
            </Form>
          </CardContent>
        </Card>
      </div>
    </CreateBase>
  );
};

const ProductDistributorFormContent = () => {
  const { errors } = useFormState();

  return (
    <>
      {/* Constitution: FormErrorSummary for error aggregation */}
      <FormErrorSummary
        errors={errors}
        fieldLabels={FIELD_LABELS}
        defaultExpanded={Object.keys(errors).length <= 3}
      />

      <ReferenceInput source="product_id" reference="products" isRequired>
        <AutocompleteInput
          optionText="name"
          label="Product *"
          filterToQuery={(q) => ({ "name@ilike": `%${q}%` })}
          helperText="Select the product"
        />
      </ReferenceInput>

      <ReferenceInput source="distributor_id" reference="organizations" isRequired>
        <AutocompleteInput
          optionText="name"
          label="Distributor *"
          filterToQuery={(q) => ({ "name@ilike": `%${q}%`, organization_type: "distributor" })}
          helperText="Select the distributor"
        />
      </ReferenceInput>

      <TextInput
        source="vendor_item_number"
        label="DOT Number (Vendor Item #)"
        helperText="e.g., USF# 4587291, Sysco# 1092847"
        fullWidth
      />

      <SelectInput
        source="status"
        label="Status"
        choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES}
        helperText={false}
      />

      <TextInput
        source="valid_from"
        label="Valid From"
        type="date"
        helperText={false}
      />

      <TextInput source="valid_to" label="Valid To" type="date" helperText="Leave empty if ongoing" />

      <TextInput
        source="notes"
        label="Notes"
        multiline
        rows={3}
        fullWidth
        helperText={false}
      />

      <FormToolbar>
        <div className="flex flex-row gap-2 justify-end">
          <CancelButton />
          <SaveButton label="Create Authorization" />
        </div>
      </FormToolbar>
    </>
  );
};

export default ProductDistributorCreate;
