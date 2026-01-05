import * as React from "react";
import { useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
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
import { getStorageItem } from "@/atomic-crm/utils/secureStorage";

interface QuickAddFormProps {
  onSuccess: () => void;
}

// Local accessible field wrapper for WCAG 4.1.2/4.1.3 compliance
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
      })}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
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
  // Use getStorageItem (which JSON-parses) since setStorageItem JSON-stringifies
  const defaultValues = {
    ...schemaDefaults,
    campaign:
      getStorageItem<string>("last_campaign", { type: "local" }) ?? schemaDefaults.campaign ?? "",
    principal_id:
      Number(getStorageItem<string>("last_principal", { type: "local" }) ?? "") || undefined,
  };

  // Initialize form with defaults from schema and localStorage
  const {
    register,
    handleSubmit,
    setFocus,
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

  // Focus first error field on validation failure (WCAG 3.3.1)
  const onValidationError = (errors: FieldErrors<QuickAddInput>) => {
    const firstErrorField = Object.keys(errors)[0] as keyof QuickAddInput;
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
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
          <AccessibleField name="campaign" label="Campaign" error={errors.campaign?.message}>
            <Input
              {...register("campaign")}
              placeholder="e.g., Q4 2025 Trade Show"
              className="bg-background"
            />
          </AccessibleField>

          <div className="space-y-2">
            <Label htmlFor="principal_id">
              Principal
              <span className="text-destructive" aria-hidden="true">
                {" "}
                *
              </span>
            </Label>
            <Select
              value={principalId?.toString()}
              onValueChange={(value) => setValue("principal_id", Number(value))}
              disabled={principalsLoading}
            >
              <SelectTrigger
                id="principal_id"
                className="bg-background"
                aria-invalid={errors.principal_id ? "true" : undefined}
                aria-describedby={errors.principal_id ? "principal_id-error" : undefined}
                aria-required="true"
              >
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
              <p id="principal_id-error" role="alert" className="text-sm text-destructive">
                {errors.principal_id.message}
              </p>
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
          <AccessibleField
            name="first_name"
            label="First Name"
            error={errors.first_name?.message}
          >
            <Input ref={firstNameRef} {...register("first_name")} placeholder="John" />
          </AccessibleField>

          <AccessibleField
            name="last_name"
            label="Last Name"
            error={errors.last_name?.message}
          >
            <Input {...register("last_name")} placeholder="Doe" />
          </AccessibleField>

          <AccessibleField name="phone" label="Phone" error={errors.phone?.message}>
            <Input type="tel" {...register("phone")} placeholder="555-123-4567" />
          </AccessibleField>

          <AccessibleField name="email" label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} placeholder="john@example.com" />
          </AccessibleField>
        </div>
        {!phoneValue && !emailValue && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            At least one of Phone or Email is required
          </p>
        )}
      </div>

      {/* Organization Information Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Organization Information</h3>
        <div className="grid gap-4 grid-cols-1">
          <AccessibleField
            name="org_name"
            label="Organization Name"
            error={errors.org_name?.message}
            required
          >
            <Input {...register("org_name")} placeholder="Acme Corporation" />
          </AccessibleField>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">
                City
                <span className="text-destructive" aria-hidden="true">
                  {" "}
                  *
                </span>
              </Label>
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
              {errors.city && (
                <p id="city-error" role="alert" className="text-sm text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>

            <AccessibleField name="state" label="State" error={errors.state?.message} required>
              <Input
                {...register("state")}
                placeholder="CA"
                readOnly={!!US_CITIES.find((c) => c.city === cityValue)}
                className={cn(US_CITIES.find((c) => c.city === cityValue) && "bg-muted")}
              />
            </AccessibleField>
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
            onClick={handleSubmit((data) => onSubmit(data, false), onValidationError)}
            disabled={isPending}
          >
            Save & Add Another
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleSubmit((data) => onSubmit(data, true), onValidationError)}
            disabled={isPending}
          >
            Save & Close
          </Button>
        </div>
      </div>
    </form>
  );
};
