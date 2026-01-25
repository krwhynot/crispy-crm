import * as React from "react";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { quickAddBaseSchema, quickAddSchema } from "@/atomic-crm/validation/quickAdd";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { useQuickAdd } from "./useQuickAdd";
import { useFilteredProducts } from "./useFilteredProducts";
import { useQuickAddFormLogic } from "./useQuickAddFormLogic";
import { Form, useGetIdentity } from "ra-core";
import { getStorageItem } from "@/atomic-crm/utils/secureStorage";
import { QuickAddFormActions } from "./QuickAddFormActions";
import { OpportunityDetailsSection } from "./OpportunityDetailsSection";
import { ContactInformationSection } from "./ContactInformationSection";
import { LocationNotesSection } from "./LocationNotesSection";

interface QuickAddFormProps {
  onSuccess: () => void;
}

// Form values type - explicitly define to avoid type inference issues with Zod defaults
interface QuickAddFormValues {
  organization_id?: number;
  org_name?: string;
  principal_id: number;
  account_manager_id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  campaign?: string;
  product_ids: number[];
  quick_note?: string;
}

/**
 * QuickAddForm - Tier 2 React Admin Form Component
 *
 * Uses React Admin's Form component for proper form context integration.
 * Custom inputs (Combobox, MultiSelectCombobox) are retained where RA
 * doesn't provide equivalent functionality.
 *
 * Architecture: Wrapper (Form context) + Content (form logic)
 * per MODULE_CHECKLIST.md Rule #4 (Component Tiers)
 */
export const QuickAddForm = ({ onSuccess }: QuickAddFormProps) => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  // Compute default values from schema and localStorage
  const schemaDefaults = quickAddBaseSchema.partial().parse({});

  const defaultValues = useMemo(
    () => ({
      ...schemaDefaults,
      // Campaign: use localStorage value if non-empty, otherwise let schema handle it
      // Removed triple-fallback ?? "" that masked missing data (WF-C2-003)
      campaign: getStorageItem<string>("last_campaign", { type: "local" }) || undefined,
      principal_id:
        Number(getStorageItem<string>("last_principal", { type: "local" }) ?? "") || undefined,
      account_manager_id: identity?.id ? Number(identity.id) : undefined,
      product_ids: schemaDefaults.product_ids ?? [],
    }),
    [identity?.id, schemaDefaults]
  );

  // React Admin Form component provides FormProvider context
  // mode="onBlur" per Engineering Constitution - no onChange validation
  return (
    <Form defaultValues={defaultValues} mode="onBlur" resolver={createFormResolver(quickAddSchema)}>
      <QuickAddFormContent
        onSuccess={onSuccess}
        identity={identity}
        identityLoading={identityLoading}
      />
    </Form>
  );
};

/**
 * QuickAddFormContent - Inner form component using useFormContext
 *
 * Consumes the FormProvider context from the parent Form wrapper.
 * Delegates logic to custom hook and rendering to section components.
 */
interface QuickAddFormContentProps {
  onSuccess: () => void;
  identity?: { id: string | number; fullName?: string; [key: string]: unknown };
  identityLoading: boolean;
}

const QuickAddFormContent = ({
  onSuccess,
  identity,
  identityLoading,
}: QuickAddFormContentProps) => {
  const { mutate, isPending } = useQuickAdd();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
    setValue,
    control,
    reset,
  } = useFormContext<QuickAddFormValues>();

  const onSubmit = (data: QuickAddFormValues, closeAfter: boolean) => {
    mutate(data, {
      onSuccess: () => {
        if (closeAfter) {
          onSuccess();
        } else {
          reset({
            principal_id: data.principal_id,
            account_manager_id: data.account_manager_id,
            campaign: data.campaign || undefined,
            product_ids: [],
            organization_id: undefined,
            org_name: "",
            first_name: "",
            last_name: "",
            phone: "",
            email: "",
            city: "",
            state: "",
            quick_note: "",
          });
          setTimeout(() => setFocus("first_name"), 100);
        }
      },
    });
  };

  // Custom hook handles all data fetching, handlers, and computed values
  const {
    principalsList,
    principalsLoading,
    organizationsList,
    organizationsLoading,
    salesLoading,
    accountManagerChoices,
    organizationOptions,
    cityOptions,
    setShouldLoadSales,
    handleCitySelect,
    onValidationError,
    handleOrganizationChange,
  } = useQuickAddFormLogic({
    identity,
    identityLoading,
    onSuccess,
    onSubmit,
  });

  // Watch form values for dependent UI updates
  const [organizationId, principalId, cityValue] = useWatch({
    control,
    name: ["organization_id", "principal_id", "city"],
  });

  const {
    products: productsList,
    isLoading: productsLoading,
    isReady: productsReady,
  } = useFilteredProducts(principalId);

  const productOptions =
    productsList?.map((product) => ({
      value: product.id.toString(),
      label: product.name,
    })) || [];

  const selectedOrg = organizationsList?.find((o) => o.id === organizationId);
  const selectedPrincipal = principalsList?.find((p) => p.id === principalId);
  const opportunityNamePreview =
    selectedOrg && selectedPrincipal
      ? `${selectedOrg.name} - ${selectedPrincipal.name}`
      : "Select organization and principal";

  return (
    <div className="flex flex-col gap-6">
      <OpportunityDetailsSection
        control={control}
        register={register}
        errors={errors}
        organizationId={organizationId}
        organizationOptions={organizationOptions}
        organizationsLoading={organizationsLoading}
        principalsList={principalsList}
        principalsLoading={principalsLoading}
        accountManagerChoices={accountManagerChoices}
        salesLoading={salesLoading}
        productOptions={productOptions}
        productsLoading={productsLoading}
        productsReady={productsReady}
        opportunityNamePreview={opportunityNamePreview}
        onOrganizationChange={handleOrganizationChange}
        onSalesFieldFocus={() => setShouldLoadSales(true)}
        onProductsChange={(ids) => setValue("product_ids", ids)}
      />

      <ContactInformationSection register={register} errors={errors} />

      <LocationNotesSection
        register={register}
        errors={errors}
        cityValue={cityValue}
        cityOptions={cityOptions}
        onCitySelect={handleCitySelect}
      />

      <QuickAddFormActions
        onCancel={onSuccess}
        onSaveAndAddAnother={handleSubmit((data) => onSubmit(data, false), onValidationError)}
        onSaveAndClose={handleSubmit((data) => onSubmit(data, true), onValidationError)}
        isPending={isPending}
      />
    </div>
  );
};
