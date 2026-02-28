import { TextInput } from "@/components/ra-wrappers/text-input";

/**
 * SalesGeneralTab - Basic info fields for Create form
 *
 * Direct password flow: Admin enters name, email, and a temporary password.
 * User is created immediately — admin shares credentials manually.
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
      <TextInput source="email" label="Email *" helperText="Required field" autoComplete="email" />
      <TextInput
        source="password"
        label="Temporary Password *"
        type="password"
        helperText="Min 8 characters. Share this with the user so they can log in."
        autoComplete="new-password"
      />
    </div>
  );
};
