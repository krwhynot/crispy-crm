import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { ContactMainTab } from "./ContactMainTab";
import { ContactMoreTab } from "./ContactMoreTab";

/**
 * Field labels for user-friendly error messages in the validation summary banner
 */
const CONTACT_FIELD_LABELS: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  organization_id: "Organization",
  sales_id: "Account Manager",
  email: "Email",
  phone: "Phone",
  title: "Job Title",
  department: "Department",
  linkedin_url: "LinkedIn URL",
  notes: "Notes",
};

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

  return <TabbedFormInputs tabs={tabs} defaultTab="main" fieldLabels={CONTACT_FIELD_LABELS} />;
};
