import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { ContactIdentityTab } from "./ContactIdentityTab";
import { ContactPositionTab } from "./ContactPositionTab";
import { ContactInfoTab } from "./ContactInfoTab";
import { ContactAccountTab } from "./ContactAccountTab";

export const ContactInputs = () => {
  const tabs = [
    {
      key: "identity",
      label: "Identity",
      fields: ["first_name", "last_name"],
      content: <ContactIdentityTab />,
    },
    {
      key: "position",
      label: "Position",
      fields: ["title", "department", "organization_id"],
      content: <ContactPositionTab />,
    },
    {
      key: "contact_info",
      label: "Contact Info",
      fields: ["email", "phone", "linkedin_url"],
      content: <ContactInfoTab />,
    },
    {
      key: "account",
      label: "Account",
      fields: ["sales_id", "notes"],
      content: <ContactAccountTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="identity" />;
};
