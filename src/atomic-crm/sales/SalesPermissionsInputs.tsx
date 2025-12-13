import { SelectInput } from "@/components/admin/select-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { ROLE_CHOICES } from "../validation/sales";

/**
 * SalesPermissionsInputs - Permission fields for Create form
 *
 * Uses React Admin form inputs that work with react-hook-form context.
 * Unlike SalesPermissionsTab (designed for SlideOver edit with record prop),
 * this component works in Create forms without needing an existing record.
 */
export const SalesPermissionsInputs = () => {
  return (
    <div className="space-y-4">
      <SelectInput
        source="role"
        label="Role"
        choices={ROLE_CHOICES}
        defaultValue="rep"
        helperText="Rep: Edit own records. Manager: Edit all records. Admin: Full system access."
      />
      <BooleanInput
        source="disabled"
        label="Account Disabled"
        helperText="Disabled accounts cannot log in"
      />
    </div>
  );
};
