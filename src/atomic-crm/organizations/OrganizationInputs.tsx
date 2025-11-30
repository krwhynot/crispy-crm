import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { OrganizationMainTab } from "./OrganizationMainTab";
import { OrganizationMoreTab } from "./OrganizationMoreTab";

type TabKey = "main" | "more";

/**
 * Field labels for user-friendly error messages in the validation summary banner
 */
const ORGANIZATION_FIELD_LABELS: Record<string, string> = {
  name: "Organization Name",
  organization_type: "Type",
  sales_id: "Account Manager",
  segment_id: "Segment",
  street: "Street Address",
  city: "City",
  state: "State",
  zip: "ZIP Code",
  website: "Website",
  linkedin_url: "LinkedIn URL",
  description: "Description",
  parent_organization_id: "Parent Organization",
};

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

  return <TabbedFormInputs tabs={tabs} defaultTab="main" fieldLabels={ORGANIZATION_FIELD_LABELS} />;
};
