import { useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { FormSelectInput } from "@/components/admin/inputs/FormSelectInput";
import { MultiSelectCombobox } from "@/components/ui/combobox";
import { AccessibleField } from "@/components/admin/AccessibleField";
import { Input } from "@/components/ui/input";
import { OrganizationCombobox } from "./OrganizationCombobox";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

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

interface OpportunityDetailsSectionProps {
  control: Control<QuickAddFormValues>;
  register: UseFormRegister<QuickAddFormValues>;
  errors: FieldErrors<QuickAddFormValues>;
  organizationId?: number;
  organizationOptions: Array<{ value: string; label: string }>;
  organizationsLoading: boolean;
  principalsList?: Array<{ id: number; name: string }>;
  principalsLoading: boolean;
  accountManagerChoices: Array<{ id: number; name: string }>;
  salesLoading: boolean;
  productOptions: Array<{ value: string; label: string }>;
  productsLoading: boolean;
  productsReady: boolean;
  opportunityNamePreview: string;
  onOrganizationChange: (value: number | undefined, name?: string) => void;
  onSalesFieldFocus: () => void;
  onProductsChange: (productIds: number[]) => void;
}

/**
 * OpportunityDetailsSection - Opportunity-specific form fields
 *
 * Contains: organization, principal, account manager, campaign, products, and preview
 */
export const OpportunityDetailsSection = ({
  control,
  register,
  errors,
  organizationId,
  organizationOptions,
  organizationsLoading,
  principalsList,
  principalsLoading,
  accountManagerChoices,
  salesLoading,
  productOptions,
  productsLoading,
  productsReady,
  opportunityNamePreview,
  onOrganizationChange,
  onSalesFieldFocus,
  onProductsChange,
}: OpportunityDetailsSectionProps) => {
  const productIds = useWatch({ control, name: "product_ids" });

  return (
    <div className="rounded-lg bg-success/10 p-4 space-y-4">
      <h3 className="text-sm font-medium text-foreground">Opportunity Details</h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <OrganizationCombobox
          value={organizationId}
          onChange={onOrganizationChange}
          options={organizationOptions}
          isLoading={organizationsLoading}
          error={errors.organization_id?.message}
        />

        <FormSelectInput
          source="principal_id"
          label="Principal"
          choices={principalsList?.map((org) => ({ id: org.id, name: org.name })) ?? []}
          placeholder={principalsLoading ? "Loading..." : "Select principal"}
          disabled={principalsLoading}
        />

        <div onFocus={onSalesFieldFocus}>
          <FormSelectInput
            source="account_manager_id"
            label="Account Manager"
            choices={accountManagerChoices}
            placeholder={salesLoading ? "Loading..." : "Select account manager"}
            disabled={salesLoading}
          />
        </div>

        <AccessibleField name="campaign" label="Campaign" error={errors.campaign?.message}>
          <Input
            {...register("campaign")}
            placeholder="e.g., Q4 2025 Trade Show"
            className="bg-background"
          />
        </AccessibleField>
      </div>

      <div className="space-y-2">
        <Label htmlFor="products">Products</Label>
        {productsReady ? (
          <MultiSelectCombobox
            options={productOptions}
            value={productIds?.map((id) => id.toString()) || []}
            onValueChange={(values) => onProductsChange(values.map((v) => Number(v)))}
            placeholder={productsLoading ? "Loading products..." : "Select products..."}
            searchPlaceholder="Search products..."
            emptyText="No products found"
            className="bg-background"
            disabled={productsLoading || !productOptions.length}
          />
        ) : (
          <div className="text-sm text-muted-foreground p-2 border rounded-md bg-background">
            Select a Principal first to filter products
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Opportunity Name Preview</Label>
        <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">
          {opportunityNamePreview}
        </div>
      </div>
    </div>
  );
};
