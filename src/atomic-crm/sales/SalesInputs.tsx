import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { SalesGeneralTab } from "./SalesGeneralTab";
import { SalesPermissionsTab } from "./SalesPermissionsTab";

export function SalesInputs() {
  const tabs = [
    {
      key: "general",
      label: "General",
      fields: ["first_name", "last_name", "email", "password"],
      content: <SalesGeneralTab />,
    },
    {
      key: "permissions",
      label: "Permissions",
      fields: ["role", "disabled"], // Changed from administrator to role
      content: <SalesPermissionsTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="general" />;
}
