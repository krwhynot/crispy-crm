import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { OrganizationMainTab } from "./OrganizationMainTab";
import { OrganizationMoreTab } from "./OrganizationMoreTab";

type TabKey = "main" | "more";

export const OrganizationInputs = () => {
  const tabs = [
    {
      key: "main" as TabKey,
      label: "Main",
      fields: [
        "name",
        "organization_type",
        "sales_id",
        "segment_id",
        "street",
        "city",
        "state",
        "zip",
      ],
      content: <OrganizationMainTab />,
    },
    {
      key: "more" as TabKey,
      label: "More",
      fields: ["website", "linkedin_url", "description", "parent_organization_id"],
      content: <OrganizationMoreTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="main" />;
};
