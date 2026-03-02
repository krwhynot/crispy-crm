import { TextInput } from "@/components/ra-wrappers/text-input";

/**
 * SalesGeneralTab - Basic info fields for Create form
 *
 * Recovery link flow: Admin enters name and email only.
 * A password recovery link is generated server-side after creation.
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
    </div>
  );
};
