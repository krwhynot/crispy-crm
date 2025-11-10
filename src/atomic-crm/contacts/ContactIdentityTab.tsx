import { TextInput } from "@/components/admin/text-input";
import { Avatar } from "./Avatar";

export const ContactIdentityTab = () => {
  return (
    <div className="space-y-2">
      <Avatar />
      <TextInput source="first_name" label="First Name *" helperText="Required field" />
      <TextInput source="last_name" label="Last Name *" helperText="Required field" />
    </div>
  );
};
