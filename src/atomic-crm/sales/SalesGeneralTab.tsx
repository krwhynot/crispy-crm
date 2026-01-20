import { TextInput } from "@/components/ra-wrappers/text-input";

/**
 * SalesGeneralTab - Basic info fields for Create form
 *
 * Industry standard invite flow: Admin enters name + email only.
 * User receives invitation email to set their own password.
 */
export const SalesGeneralTab = () => {
  return (
    <div className="space-y-2">
      <TextInput
        source="first_name"
        label="First Name *"
        helperText="Required field"
        autoComplete="given-name"
      />
      <TextInput
        source="last_name"
        label="Last Name *"
        helperText="Required field"
        autoComplete="family-name"
      />
      <TextInput
        source="email"
        label="Email *"
        helperText="User will receive an invitation email to set their password"
        autoComplete="email"
      />
    </div>
  );
};
