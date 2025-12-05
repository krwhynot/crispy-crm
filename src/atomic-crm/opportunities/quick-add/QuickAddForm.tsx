import * as React from "react";
import { useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quickAddSchema, type QuickAddInput } from "@/atomic-crm/validation/quickAdd";
import { useQuickAdd } from "../hooks/useQuickAdd";
import { useFilteredProducts } from "../hooks/useFilteredProducts";
import { useGetList } from "ra-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, MultiSelectCombobox } from "@/components/ui/combobox";
import { US_CITIES } from "../data/us-cities";
import { cn } from "@/lib/utils";
import { getLocalStorageString } from "@/lib/storage-utils";

interface QuickAddFormProps {
  onSuccess: () => void;
}

export const QuickAddForm = ({ onSuccess }: QuickAddFormProps) => {
  const { mutate, isPending } = useQuickAdd();
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Fetch principals for dropdown
  const { data: principalsList, isLoading: principalsLoading } = useGetList("organizations", {
    filter: { organization_type: "principal" },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Derive defaults from schema first (single source of truth)
  const schemaDefaults = quickAddSchema.partial().parse({});

  // Then merge with validated localStorage for persistence
  const defaultValues = {
    ...schemaDefaults,
    campaign: getLocalStorageString("last_campaign", schemaDefaults.campaign || ""),
    principal_id: Number(getLocalStorageString("last_principal", schemaDefaults.principal_id?.toString() || "")) || undefined,
  };

  // Initialize form with defaults from schema and localStorage
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    reset,
    clearErrors,
  } = useForm<QuickAddInput>({
    resolver: zodResolver(quickAddSchema),
    defaultValues,
  });

  // Watch values for dependent fields using useWatch
  const [principalId, cityValue, phoneValue, emailValue, productIds] = useWatch({
    control,
    name: ["principal_id", "city", "phone", "email", "product_ids"],
  });

  // Fetch products filtered by selected principal
  const {
    products: productsList,
    isLoading: productsLoading,
    isReady: productsReady,
  } = useFilteredProducts(principalId);

  // Clear phone/email validation error when either field has content
  useEffect(() => {
    if (
      (phoneValue || emailValue) &&
      errors.phone?.message === "Phone or Email required (at least one)"
    ) {
      clearErrors("phone");
    }
  }, [phoneValue, emailValue, errors.phone, clearErrors]);

  // Handle city selection
  const handleCitySelect = (cityName: string) => {
    const selectedCity = US_CITIES.find((c) => c.city === cityName);
    if (selectedCity) {
      setValue("city", selectedCity.city);
      setValue("state", selectedCity.state);
    } else {
      // Allow freeform entry for international cities
      setValue("city", cityName);
      setValue("state", "");
    }
  };

  // Handle form submission
  const onSubmit = (data: QuickAddInput, closeAfter: boolean) => {
    mutate(data, {
      onSuccess: () => {
        if (closeAfter) {
          onSuccess(); // Close dialog
        } else {
          // Reset form but keep campaign and principal
          reset({
            campaign: data.campaign,
            principal_id: data.principal_id,
            product_ids: [],
            first_name: "",
            last_name: "",
            phone: "",
            email: "",
            org_name: "",
            city: "",
            state: "",
            quick_note: "",
          });
          // Focus first name field for next entry
          setTimeout(() => firstNameRef.current?.focus(), 100);
        }
      },
    });
  };

  // Convert products and principals to combobox options
  const principalOptions =
    principalsList?.map((org) => ({
      value: org.id.toString(),
      label: org.name,
    })) || [];

  const productOptions =
    productsList?.map((product) => ({
      value: product.id.toString(),
      label: product.name,
    })) || [];

  // Map all US cities for Combobox (Command component handles filtering)
  const cityOptions = US_CITIES.map(({ city }) => ({
    value: city,
    label: city,
  }));

  return (
    <form className="flex flex-col gap-6">
      {/* Pre-filled Section - Light success background */}
      <div className="rounded-lg bg-success/10 p-4 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Pre-filled Information</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign</Label>
            <Input
              id="campaign"
              {...register("campaign")}
              placeholder="e.g., Q4 2025 Trade Show"
              className="bg-background"
            />
            {errors.campaign && (
              <p className="text-sm text-destructive">{errors.campaign.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="principal">Principal *</Label>
            <Select
              value={principalId?.toString()}
              onValueChange={(value) => setValue("principal_id", Number(value))}
              disabled={principalsLoading}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={principalsLoading ? "Loading..." : "Select principal"} />
              </SelectTrigger>
              <SelectContent>
                {principalOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.principal_id && (
              <p className="text-sm text-destructive">{errors.principal_id.message}</p>
            )}
          </div>
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
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              ref={firstNameRef}
              id="first_name"
              {...register("first_name")}
              placeholder="John"
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input id="last_name" {...register("last_name")} placeholder="Doe" />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...register("phone")} placeholder="555-123-4567" />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
        </div>
        {!phoneValue && !emailValue && (
          <p className="text-sm text-muted-foreground">
            At least one of Phone or Email is required
          </p>
        )}
      </div>

      {/* Organization Information Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Organization Information</h3>
        <div className="grid gap-4 grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="org_name">Organization Name *</Label>
            <Input id="org_name" {...register("org_name")} placeholder="Acme Corporation" />
            {errors.org_name && (
              <p className="text-sm text-destructive">{errors.org_name.message}</p>
            )}
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Combobox
                id="city"
                options={cityOptions}
                value={cityValue}
                onValueChange={(value) => handleCitySelect(value)}
                placeholder="Select or type city..."
                searchPlaceholder="Search cities..."
                emptyText="Type to search cities"
                className="w-full"
              />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                {...register("state")}
                placeholder="CA"
                readOnly={!!US_CITIES.find((c) => c.city === cityValue)}
                className={cn(US_CITIES.find((c) => c.city === cityValue) && "bg-muted")}
              />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Optional Details Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Optional Details</h3>
        <div className="space-y-2">
          <Label htmlFor="quick_note">Quick Note</Label>
          <Input
            id="quick_note"
            {...register("quick_note")}
            placeholder="Met at booth, interested in product demo..."
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={isPending}>
          Cancel
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, false))}
            disabled={isPending}
          >
            Save & Add Another
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={isPending}
          >
            Save & Close
          </Button>
        </div>
      </div>
    </form>
  );
};
