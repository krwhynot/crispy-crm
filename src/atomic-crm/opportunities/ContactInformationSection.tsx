import { Input } from "@/components/ui/input";
import { AccessibleField } from "@/components/admin/AccessibleField";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

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

interface ContactInformationSectionProps {
  register: UseFormRegister<QuickAddFormValues>;
  errors: FieldErrors<QuickAddFormValues>;
}

/**
 * ContactInformationSection - Contact detail form fields
 *
 * Contains: first name, last name, phone, email (all optional)
 */
export const ContactInformationSection = ({ register, errors }: ContactInformationSectionProps) => {
  return (
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
  );
};
