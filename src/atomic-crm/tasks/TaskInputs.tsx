import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { TaskGeneralTab } from "./TaskGeneralTab";
import { TaskDetailsTab } from "./TaskDetailsTab";

export const TaskInputs = () => {
  const tabs = [
    {
      key: "general",
      label: "General",
      fields: ["title", "description", "due_date", "reminder_date"],
      content: <TaskGeneralTab />,
    },
    {
      key: "details",
      label: "Details",
      fields: ["priority", "type", "organization_id", "opportunity_id", "contact_id", "sales_id"],
      content: <TaskDetailsTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="general" />;
};
