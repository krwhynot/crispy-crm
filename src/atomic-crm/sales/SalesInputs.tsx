import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { SalesGeneralTab } from "./SalesGeneralTab";
import { SalesPermissionsInputs } from "./SalesPermissionsInputs";

export function SalesInputs() {
  const tabs = [
    {
      key: "general",
      label: "General",
      fields: ["first_name", "last_name", "email"],
      content: <SalesGeneralTab />,
    },
    {
      key: "permissions",
      label: "Permissions",
      fields: ["role"],
      content: <SalesPermissionsInputs />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="general" />;
}
