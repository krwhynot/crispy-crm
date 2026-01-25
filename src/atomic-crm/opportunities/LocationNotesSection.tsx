import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { AccessibleField } from "@/components/admin/AccessibleField";
import { US_CITIES } from "./data/us-cities";
import { cn } from "@/lib/utils";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

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

interface LocationNotesSectionProps {
  register: UseFormRegister<QuickAddFormValues>;
  errors: FieldErrors<QuickAddFormValues>;
  cityValue?: string;
  cityOptions: Array<{ value: string; label: string }>;
  onCitySelect: (city: string) => void;
}

/**
 * LocationNotesSection - Location and notes form fields
 *
 * Contains: city (with auto-complete), state (auto-filled), quick note
 */
export const LocationNotesSection = ({
  register,
  errors,
  cityValue,
  cityOptions,
  onCitySelect,
}: LocationNotesSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Location & Notes (Optional)</h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Combobox
            id="city"
            options={cityOptions}
            value={cityValue}
            onValueChange={(value) => onCitySelect(value)}
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
  );
};
