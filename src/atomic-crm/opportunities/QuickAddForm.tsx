import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { quickAddBaseSchema, quickAddSchema } from "@/atomic-crm/validation/quickAdd";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuickAdd } from "./useQuickAdd";
import { useFilteredProducts } from "./useFilteredProducts";
// React Admin Tier 2 imports - per MODULE_CHECKLIST.md Rule #4
import { Form, useGetList, useGetIdentity, useDataProvider, useNotify } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/admin/AdminButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelectInput } from "@/components/admin/inputs/FormSelectInput";
import { Combobox, MultiSelectCombobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { US_CITIES } from "./data/us-cities";
import { cn } from "@/lib/utils";
import { getStorageItem } from "@/atomic-crm/utils/secureStorage";
import { PLAYBOOK_CATEGORY_IDS } from "@/atomic-crm/validation/segments";
import { organizationKeys } from "@/atomic-crm/queryKeys";

interface QuickAddFormProps {
  onSuccess: () => void;
}

interface AccessibleFieldProps {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement;
  className?: string;
}

function AccessibleField({
  name,
  label,
  error,
  required,
  children,
  className,
}: AccessibleFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </Label>

      {React.cloneElement(children, {
        id: name,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": error ? errorId : undefined,
        "aria-required": required ? "true" : undefined,
      } as React.HTMLAttributes<HTMLElement>)}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface InlineCreateOrganizationProps {
  name: string;
  onCreated: (record: { id: number; name: string }) => void;
  onCancel: () => void;
}

function InlineCreateOrganization({ name, onCreated, onCancel }: InlineCreateOrganizationProps) {
  const [isPending, setIsPending] = useState(false);
  const [inputName, setInputName] = useState(name);
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      notify("Organization name is required", { type: "error" });
      return;
    }
    setIsPending(true);
    try {
      const result = await dataProvider.create("organizations", {
        data: {
          name: inputName.trim(),
          organization_type: "customer",
          priority: "C",
          segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
        },
      });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      notify("Organization created", { type: "success" });
      onCreated(result.data as { id: number; name: string });
    } catch {
      notify("Failed to create organization", { type: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverAnchor />
      <PopoverContent className="w-72 p-3" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="font-medium text-sm">Create Organization</p>
          <div className="space-y-1">
            <Label htmlFor="inline-org-name">Name</Label>
            <Input
              id="inline-org-name"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="h-11"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- Popover context, autoFocus is appropriate
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <AdminButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-11"
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" size="sm" disabled={isPending} className="h-11">
              Create
            </AdminButton>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

interface OrganizationComboboxProps {
  value?: number;
  onChange: (value: number | undefined, name?: string) => void;
  options: Array<{ value: string; label: string }>;
  isLoading: boolean;
  error?: string;
}

function OrganizationCombobox({
  value,
  onChange,
  options,
  isLoading,
  error,
}: OrganizationComboboxProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showCreatePopover, setShowCreatePopover] = useState(false);

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue.startsWith("__create__")) {
      const newName = selectedValue.replace("__create__", "");
      setSearchValue(newName);
      setShowCreatePopover(true);
    } else {
      const selectedOption = options.find((opt) => opt.value === selectedValue);
      onChange(selectedValue ? Number(selectedValue) : undefined, selectedOption?.label);
    }
  };

  const handleOrganizationCreated = (record: { id: number; name: string }) => {
    setShowCreatePopover(false);
    setSearchValue("");
    onChange(record.id, record.name);
  };

  const handleCreateCancel = () => {
    setShowCreatePopover(false);
    setSearchValue("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="organization_id">
        Organization
        <span className="text-destructive" aria-hidden="true">
          {" "}
          *
        </span>
      </Label>
      <Combobox
        id="organization_id"
        options={options}
        value={value?.toString()}
        onValueChange={handleValueChange}
        placeholder={isLoading ? "Loading..." : "Select or create organization..."}
        searchPlaceholder="Search organizations..."
        emptyText="No organizations found"
        className="w-full bg-background"
        disabled={isLoading}
        creatable
      />
      {error && (
        <p id="organization_id-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {showCreatePopover && (
        <InlineCreateOrganization
          name={searchValue}
          onCreated={handleOrganizationCreated}
          onCancel={handleCreateCancel}
        />
      )}
    </div>
  );
}

// Form values type - explicitly define to avoid type inference issues with Zod defaults
type QuickAddFormValues = {
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
};

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
      campaign:
        getStorageItem<string>("last_campaign", { type: "local" }) ?? schemaDefaults.campaign ?? "",
      principal_id:
        Number(getStorageItem<string>("last_principal", { type: "local" }) ?? "") || undefined,
      account_manager_id: identity?.id ? Number(identity.id) : undefined,
      product_ids: schemaDefaults.product_ids ?? [],
    }),
    [identity?.id, schemaDefaults]
  );

  // React Admin Form component provides FormProvider context
  // mode="onBlur" per Engineering Constitution - no onChange validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch with RA Form
  return (
    <Form defaultValues={defaultValues} mode="onBlur" resolver={zodResolver(quickAddSchema) as any}>
      <QuickAddFormContent
        onSuccess={onSuccess}
        identityId={identity?.id}
        identityLoading={identityLoading}
      />
    </Form>
  );
};

/**
 * QuickAddFormContent - Inner form component using useFormContext
 *
 * Consumes the FormProvider context from the parent Form wrapper.
 * Handles all form logic, data fetching, and rendering.
 */
interface QuickAddFormContentProps {
  onSuccess: () => void;
  identityId?: string | number;
  identityLoading: boolean;
}

const QuickAddFormContent = ({
  onSuccess,
  identityId,
  identityLoading,
}: QuickAddFormContentProps) => {
  const { mutate, isPending } = useQuickAdd();

  // Use useFormContext to access form methods from RA's Form wrapper
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
    setValue,
    control,
    reset,
  } = useFormContext<QuickAddFormValues>();

  // Data fetching hooks
  const { data: principalsList, isLoading: principalsLoading } = useGetList("organizations", {
    filter: { organization_type: "principal" },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  const { data: organizationsList, isLoading: organizationsLoading } = useGetList("organizations", {
    filter: { "organization_type@in": "(customer,prospect)" },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "name", order: "ASC" },
  });

  const { data: salesList, isLoading: salesLoading } = useGetList("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Sync account_manager_id with identity when loaded
  useEffect(() => {
    if (identityId && !identityLoading) {
      setValue("account_manager_id", Number(identityId));
    }
  }, [identityId, identityLoading, setValue]);

  // Watch form values for dependent UI updates
  const [organizationId, principalId, cityValue, productIds] = useWatch({
    control,
    name: ["organization_id", "principal_id", "city", "product_ids"],
  });

  const {
    products: productsList,
    isLoading: productsLoading,
    isReady: productsReady,
  } = useFilteredProducts(principalId);

  const handleCitySelect = (cityName: string) => {
    const selectedCity = US_CITIES.find((c) => c.city === cityName);
    if (selectedCity) {
      setValue("city", selectedCity.city);
      setValue("state", selectedCity.state);
    } else {
      setValue("city", cityName);
      setValue("state", "");
    }
  };

  const onSubmit = (data: QuickAddFormValues, closeAfter: boolean) => {
    mutate(data, {
      onSuccess: () => {
        if (closeAfter) {
          onSuccess();
        } else {
          reset({
            principal_id: data.principal_id,
            account_manager_id: data.account_manager_id,
            campaign: data.campaign || "",
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

  const onValidationError = (errors: FieldErrors<QuickAddFormValues>) => {
    const firstErrorField = Object.keys(errors)[0] as keyof QuickAddFormValues;
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
  };

  const organizationOptions =
    organizationsList?.map((org) => ({
      value: org.id.toString(),
      label: org.name,
    })) || [];

  const productOptions =
    productsList?.map((product) => ({
      value: product.id.toString(),
      label: product.name,
    })) || [];

  const cityOptions = US_CITIES.map(({ city }) => ({
    value: city,
    label: city,
  }));

  const selectedOrg = organizationsList?.find((o) => o.id === organizationId);
  const selectedPrincipal = principalsList?.find((p) => p.id === principalId);
  const opportunityNamePreview =
    selectedOrg && selectedPrincipal
      ? `${selectedOrg.name} - ${selectedPrincipal.name}`
      : "Select organization and principal";

  const handleOrganizationChange = (value: number | undefined, name?: string) => {
    setValue("organization_id", value);
    if (name) {
      setValue("org_name", name);
    }
  };

  // Use div instead of form - React Admin's Form component already provides the <form> wrapper
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-success/10 p-4 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Opportunity Details</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <OrganizationCombobox
            value={organizationId}
            onChange={handleOrganizationChange}
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

          <FormSelectInput
            source="account_manager_id"
            label="Account Manager"
            choices={
              salesList?.map((sale) => ({
                id: sale.id,
                name: sale.name || sale.email || `Sales #${sale.id}`,
              })) ?? []
            }
            placeholder={salesLoading ? "Loading..." : "Select account manager"}
            disabled={salesLoading}
          />

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
              onValueChange={(values) =>
                setValue(
                  "product_ids",
                  values.map((v) => Number(v))
                )
              }
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

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Contact Information (Optional)</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <AccessibleField name="first_name" label="First Name" error={errors.first_name?.message}>
            <Input {...register("first_name")} placeholder="John" />
          </AccessibleField>

          <AccessibleField name="last_name" label="Last Name" error={errors.last_name?.message}>
            <Input {...register("last_name")} placeholder="Doe" />
          </AccessibleField>

          <AccessibleField name="phone" label="Phone" error={errors.phone?.message}>
            <Input type="tel" {...register("phone")} placeholder="555-123-4567" />
          </AccessibleField>

          <AccessibleField name="email" label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} placeholder="john@example.com" />
          </AccessibleField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Location & Notes (Optional)</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Combobox
              id="city"
              options={cityOptions}
              value={cityValue}
              onValueChange={(value) => handleCitySelect(value)}
              placeholder="Select or type city..."
              searchPlaceholder="Search cities..."
              emptyText="Type to search cities"
              className="w-full"
              creatable
            />
            {errors.city && (
              <p id="city-error" role="alert" className="text-sm text-destructive">
                {errors.city.message}
              </p>
            )}
          </div>

          <AccessibleField name="state" label="State" error={errors.state?.message}>
            <Input
              {...register("state")}
              placeholder="CA"
              readOnly={!!US_CITIES.find((c) => c.city === cityValue)}
              className={cn(US_CITIES.find((c) => c.city === cityValue) && "bg-muted")}
            />
          </AccessibleField>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick_note">Quick Note</Label>
          <Input
            id="quick_note"
            {...register("quick_note")}
            placeholder="Met at booth, interested in product demo..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <AdminButton
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isPending}
          className="h-11"
        >
          Cancel
        </AdminButton>

        <div className="flex gap-2">
          <AdminButton
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, false), onValidationError)}
            disabled={isPending}
            className="h-11"
          >
            Save & Add Another
          </AdminButton>

          <AdminButton
            type="button"
            variant="secondary"
            onClick={handleSubmit((data) => onSubmit(data, true), onValidationError)}
            disabled={isPending}
            className="h-11"
          >
            Save & Close
          </AdminButton>
        </div>
      </div>
    </div>
  );
};
