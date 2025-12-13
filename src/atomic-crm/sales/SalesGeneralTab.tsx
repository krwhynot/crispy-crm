import { TextInput } from "@/components/admin/text-input";
import { useContext } from "react";
import { CreateContext } from "ra-core";

export const SalesGeneralTab = () => {
  // Only show password field in create mode, not edit mode
  // Use useContext directly to safely access context without throwing when missing
  const createContext = useContext(CreateContext);
  const isCreateMode = !!createContext;

  return (
    <div className="space-y-2">
      <TextInput source="first_name" label="First Name *" helperText="Required field" />
      <TextInput source="last_name" label="Last Name *" helperText="Required field" />
      <TextInput
        source="email"
        label="Email *"
        helperText="Required: Must be a valid email address"
      />
      {isCreateMode && (
        <TextInput
          source="password"
          label="Initial Password *"
          type="password"
          helperText="Minimum 8 characters. User will receive email to set their own password."
        />
      )}
    </div>
  );
};
