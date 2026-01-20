import { SelectInput } from "@/components/ra-wrappers/select-input";
import { ROLE_CHOICES } from "../validation/sales";

/**
 * SalesPermissionsInputs - Permission fields for Create form
 *
 * Only shows Role selector - "disabled" toggle only makes sense for existing users.
 * Uses React Admin form inputs that work with react-hook-form context.
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
    </div>
  );
};
