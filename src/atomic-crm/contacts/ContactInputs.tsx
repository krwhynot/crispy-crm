import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { ContactMainTab } from "./ContactMainTab";
import { ContactMoreTab } from "./ContactMoreTab";

export const ContactInputs = () => {
  const tabs = [
    {
      key: "main",
      label: "Main",
      fields: ["first_name", "last_name", "organization_id", "sales_id", "email", "phone"],
      content: <ContactMainTab />,
    },
    {
      key: "more",
      label: "More",
      fields: ["title", "department", "linkedin_url", "notes"],
      content: <ContactMoreTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="main" />;
};
