import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { OrganizationGeneralTab } from "./OrganizationGeneralTab";
import { OrganizationDetailsTab } from "./OrganizationDetailsTab";
import { OrganizationOtherTab } from "./OrganizationOtherTab";
import { OrganizationHierarchyTab } from "./OrganizationHierarchyTab";

type TabKey = "general" | "details" | "other" | "hierarchy";

export const OrganizationInputs = () => {
  const tabs = [
    {
      key: "general" as TabKey,
      label: "General",
      fields: [
        "name",
        "logo",
        "organization_type",
        "parent_organization_id",
        "description",
        "sales_id",
      ],
      content: <OrganizationGeneralTab />,
    },
    {
      key: "details" as TabKey,
      label: "Details",
      fields: ["segment_id", "priority", "address", "city", "postal_code", "state", "phone"],
      content: <OrganizationDetailsTab />,
    },
    {
      key: "other" as TabKey,
      label: "Other",
      fields: ["website", "linkedin_url", "context_links"],
      content: <OrganizationOtherTab />,
    },
    {
      key: "hierarchy" as TabKey,
      label: "Hierarchy",
      fields: ["parent_organization_id"],
      content: <OrganizationHierarchyTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="general" />;
};
