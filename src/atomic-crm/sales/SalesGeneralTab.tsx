import { TextInput } from "@/components/admin/text-input";

export const SalesGeneralTab = () => {
  return (
    <div className="space-y-4">
      <TextInput source="first_name" label="First Name *" helperText="Required field" />
      <TextInput source="last_name" label="Last Name *" helperText="Required field" />
      <TextInput
        source="email"
        label="Email *"
        helperText="Required: Must be a valid email address"
      />
    </div>
  );
};
