import { useMemo } from "react";
import { CreateBase, Form } from "ra-core";
import { useFormState } from "react-hook-form";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { CancelButton } from "@/components/ra-wrappers/cancel-button";
import { SaveButton } from "@/components/ra-wrappers/form";
import { FormToolbar } from "@/components/ra-wrappers/simple-form";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { productDistributorSchema } from "../validation/productDistributors";
import { ProductDistributorInputs } from "./ProductDistributorInputs";
import {
  getAutocompleteProps,
  getQSearchAutocompleteProps,
} from "@/atomic-crm/utils/autocompleteDefaults";

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
  const defaultValues = useMemo(() => productDistributorSchema.partial().parse({}), []);

  return (
    <CreateBase redirect="list">
      <div className="bg-muted mt-2 px-6 py-6">
        <SectionCard>
          <Form defaultValues={defaultValues} warnWhenUnsavedChanges>
            <ProductDistributorFormContent />
          </Form>
        </SectionCard>
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
          {...getAutocompleteProps("name")}
          optionText="name"
          label="Product *"
          helperText="Select the product"
        />
      </ReferenceInput>

      <ReferenceInput
        source="distributor_id"
        reference="organizations"
        filter={{ organization_type: "distributor" }}
        isRequired
      >
        <AutocompleteInput
          {...getQSearchAutocompleteProps()}
          optionText="name"
          label="Distributor *"
          helperText="Select the distributor"
        />
      </ReferenceInput>

      <ProductDistributorInputs />

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
